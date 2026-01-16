/**
 * Cloudflare Worker for Noodle Privacy Proxy
 * Handles video streaming and image proxying to mat6tube.com
 * Offloads bandwidth costs from your main server
 */

// Helper function for retry logic with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // If successful or client error (4xx), return immediately
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return response;
            }

            // For server errors (5xx), retry
            if (response.status >= 500 && attempt < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                console.log(`Retry attempt ${attempt + 1} after ${delay}ms for ${url}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            return response;
        } catch (error) {
            lastError = error;

            // If it's a timeout or network error and we have retries left, try again
            if (attempt < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                console.log(`Retry attempt ${attempt + 1} after ${delay}ms due to error: ${error}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

export default {
    async fetch(request, env, ctx) {
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

        // Route handling
        if (url.pathname.startsWith('/api/proxy')) {
            return handleProxy(request, url);
        } else if (url.pathname.startsWith('/api/video')) {
            return handleVideo(request, url);
        }

        return new Response('Not Found', { status: 404 });
    }
};

async function handleProxy(request, url) {
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

        // Custom referer if provided
        const customReferer = url.searchParams.get('referer');
        headers['Referer'] = customReferer || 'https://mat6tube.com/';
        headers['Origin'] = 'https://mat6tube.com';

        // Session cookies
        const sessionCookies = url.searchParams.get('cookie');
        headers['Cookie'] = `age_verification=1${sessionCookies ? '; ' + sessionCookies : ''}`;

        // Range header support for seeking
        const range = request.headers.get('range');
        if (range) {
            headers['Range'] = range;
        }

        console.log(`[Worker] Proxying: ${proxyUrl}`);

        // Fetch with retry logic
        const response = await fetchWithRetry(proxyUrl, {
            method: 'GET',
            headers: headers,
            cf: {
                // Cloudflare-specific options
                cacheTtl: 86400, // Cache for 24 hours
                cacheEverything: true,
            }
        });

        console.log(`[Worker] Upstream Response: ${response.status}`);

        // Build response headers
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

        // Optimize caching
        const contentType = responseHeaders.get('content-type') || '';
        if (contentType.includes('video')) {
            responseHeaders.set('Cache-Control', 'public, max-age=86400, immutable');
        } else if (contentType.includes('image')) {
            responseHeaders.set('Cache-Control', 'public, max-age=3600');
        } else {
            responseHeaders.set('Cache-Control', 'public, max-age=3600');
        }

        // Ensure proper content type
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
        console.error('[Worker] Proxy error:', error);
        return new Response(`Proxy Error: ${error.message}`, { status: 500 });
    }
}

async function handleVideo(request, url) {
    const videoId = url.searchParams.get('id');

    if (!videoId) {
        return new Response(JSON.stringify({ error: 'ID parameter required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const videoUrl = `https://mat6tube.com/watch/${videoId}`;

        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://mat6tube.com/',
                'Cookie': 'age_verification=1'
            }
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: `Failed to fetch video: ${response.status}` }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const html = await response.text();

        // Extract cookies
        const setCookieHeaders = response.headers.get('set-cookie');
        let cookies = 'age_verification=1';
        if (setCookieHeaders) {
            const sessionCookies = setCookieHeaders
                .split(',')
                .map(cookie => cookie.split(';')[0])
                .filter(c => !c.includes('age_verification'))
                .join('; ');
            if (sessionCookies) {
                cookies += '; ' + sessionCookies;
            }
        }

        // Extract playlist
        let sources = [];
        let tracks = [];

        const playlistMatch = html.match(/window\.playlist\s*=\s*(\{[\s\S]*?\});/);
        if (playlistMatch) {
            try {
                let playlistStr = playlistMatch[1];
                playlistStr = playlistStr.replace(/([{,]\s*)(\w+):/g, '$1"$2":');
                playlistStr = playlistStr.replace(/,([\s\])}])/g, '$1');

                const playlist = JSON.parse(playlistStr);
                sources = playlist.sources || [];
                tracks = playlist.tracks || [];
            } catch (e) {
                console.error('[Worker] Failed to parse playlist:', e);
            }
        }

        // Parse metadata (simplified - you can expand this)
        const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';

        const thumbnailMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        let thumbnail = thumbnailMatch ? thumbnailMatch[1] : '';
        if (thumbnail && !thumbnail.startsWith('http')) {
            thumbnail = `https://mat6tube.com${thumbnail}`;
        }

        return new Response(JSON.stringify({
            id: videoId,
            title,
            thumbnail,
            sources,
            tracks,
            cookies,
            relatedVideos: [] // You can expand this
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
        });

    } catch (error) {
        console.error('[Worker] Video error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
