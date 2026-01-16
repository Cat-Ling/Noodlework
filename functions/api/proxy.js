/**
 * Cloudflare Pages Function for Video/Image Proxy
 * This runs as a serverless function on Cloudflare Pages
 */

// Helper function for retry logic
async function fetchWithRetry(url, options, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return response;
            }

            if (response.status >= 500 && attempt < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            return response;
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Range, Content-Type',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    // Fix relative URLs
    let proxyUrl = targetUrl;
    if (targetUrl.startsWith('/')) {
        proxyUrl = `https://mat6tube.com${targetUrl}`;
    }

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.3029.110 Safari/537.36',
            'Accept': 'video/webm,video/ogg,video/xml,application/ogg,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Connection': 'keep-alive',
        };

        const customReferer = url.searchParams.get('referer');
        headers['Referer'] = customReferer || 'https://mat6tube.com/';
        headers['Origin'] = 'https://mat6tube.com';

        const sessionCookies = url.searchParams.get('cookie');
        headers['Cookie'] = `age_verification=1${sessionCookies ? '; ' + sessionCookies : ''}`;

        const range = request.headers.get('range');
        if (range) {
            headers['Range'] = range;
        }

        const response = await fetchWithRetry(proxyUrl, {
            method: 'GET',
            headers: headers,
            cf: {
                cacheTtl: 86400,
                cacheEverything: true,
            }
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

        const contentType = responseHeaders.get('content-type') || '';
        if (contentType.includes('video')) {
            responseHeaders.set('Cache-Control', 'public, max-age=86400, immutable');
        } else if (contentType.includes('image')) {
            responseHeaders.set('Cache-Control', 'public, max-age=3600');
        } else {
            responseHeaders.set('Cache-Control', 'public, max-age=3600');
        }

        if (!responseHeaders.get('content-type')) {
            if (proxyUrl.endsWith('.mp4')) responseHeaders.set('content-type', 'video/mp4');
            else if (proxyUrl.endsWith('.jpg') || proxyUrl.endsWith('.jpeg')) responseHeaders.set('content-type', 'image/jpeg');
            else if (proxyUrl.endsWith('.png')) responseHeaders.set('content-type', 'image/png');
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new Response(`Proxy Error: ${error.message}`, { status: 500 });
    }
}
