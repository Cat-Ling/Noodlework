import { NextRequest, NextResponse } from 'next/server';
import { Pool, Agent } from 'undici';

export const dynamic = 'force-dynamic';

// Create a global connection pool for mat6tube.com with HTTP/2 support
// This allows concurrent requests to reuse connections
const mat6tubePool = new Pool('https://mat6tube.com', {
    connections: 50, // Allow up to 50 concurrent connections
    pipelining: 10, // Allow up to 10 pipelined requests per connection
    keepAliveTimeout: 60000, // Keep connections alive for 60s
    keepAliveMaxTimeout: 300000, // Max keep-alive time 5 minutes
});

// Global agent for other domains with connection pooling
const globalAgent = new Agent({
    connections: 100, // Allow up to 100 concurrent connections globally
    pipelining: 10,
    keepAliveTimeout: 60000,
    keepAliveMaxTimeout: 300000,
});

// Helper function to implement retry logic with exponential backoff
async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Use the appropriate pool/agent based on the URL
            const dispatcher = url.includes('mat6tube.com') ? mat6tubePool : globalAgent;

            const response = await dispatcher.request({
                ...options,
                origin: new URL(url).origin,
                path: new URL(url).pathname + new URL(url).search,
            });

            // If successful or client error (4xx), return immediately
            if (response.statusCode < 400 || (response.statusCode >= 400 && response.statusCode < 500)) {
                return response;
            }

            // For server errors (5xx), retry
            if (response.statusCode >= 500 && attempt < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
                console.log(`Retry attempt ${attempt + 1} after ${delay}ms for ${url}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            return response;
        } catch (error) {
            lastError = error as Error;

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

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    let url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Fix relative URLs
    if (url.startsWith('/')) {
        url = `https://mat6tube.com${url}`;
    }

    try {
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.3029.110 Safari/537.36',
            'Accept': 'video/webm,video/ogg,video/xml,application/ogg,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Connection': 'keep-alive',
        };

        // Use custom Referer if provided, otherwise default to mat6tube root
        const customReferer = searchParams.get('referer');
        headers['Referer'] = customReferer || 'https://mat6tube.com/';
        headers['Origin'] = 'https://mat6tube.com';

        // Cookie to bypass age check + User session cookies
        const sessionCookies = searchParams.get('cookie');
        headers['Cookie'] = `age_verification=1${sessionCookies ? '; ' + sessionCookies : ''}`;

        // Range header support for seeking
        const range = request.headers.get('range');
        if (range) {
            headers['Range'] = range;
            console.log('Proxying Range:', range);
        }

        console.log(`Proxying (concurrent pool): ${url}`);

        // Use retry logic with undici pool for concurrent connections
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers,
            headersTimeout: 60000, // 60s timeout for headers
            bodyTimeout: 60000, // 60s timeout for body
        });

        console.log(`Upstream Response: ${response.statusCode} ${response.statusText || 'OK'}`);

        const responseHeaders = new Headers();

        // Copy relevant headers from upstream
        for (const [key, value] of Object.entries(response.headers)) {
            if (typeof value === 'string') {
                responseHeaders.set(key, value);
            } else if (Array.isArray(value)) {
                value.forEach(v => responseHeaders.append(key, v));
            }
        }

        responseHeaders.set('Access-Control-Allow-Origin', '*');

        // Optimize caching based on content type
        const contentType = responseHeaders.get('content-type') || '';
        if (contentType.includes('video')) {
            // Cache video content more aggressively
            responseHeaders.set('Cache-Control', 'public, max-age=86400, immutable'); // 24 hours
        } else if (contentType.includes('image')) {
            // Cache images
            responseHeaders.set('Cache-Control', 'public, max-age=3600');
        } else {
            responseHeaders.set('Cache-Control', 'public, max-age=3600');
        }

        // Add connection hints for better performance
        responseHeaders.set('Connection', 'keep-alive');
        responseHeaders.set('Keep-Alive', 'timeout=60');

        // Ensure proper content type for video if missing
        if (!responseHeaders.get('content-type')) {
            if (url.endsWith('.mp4')) responseHeaders.set('content-type', 'video/mp4');
            else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) responseHeaders.set('content-type', 'image/jpeg');
            else if (url.endsWith('.png')) responseHeaders.set('content-type', 'image/png');
        }

        // Stream the response body
        return new NextResponse(response.body as any, {
            status: response.statusCode,
            statusText: response.statusText || 'OK',
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Proxy error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return new NextResponse(`Proxy Error: ${errorMessage}`, { status: 500 });
    }
}
