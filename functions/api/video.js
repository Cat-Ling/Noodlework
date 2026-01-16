/**
 * Cloudflare Pages Function for Video Metadata
 * This runs as a serverless function on Cloudflare Pages
 */

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const videoId = url.searchParams.get('id');

    if (!videoId) {
        return new Response(JSON.stringify({ error: 'ID parameter required' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
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
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
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
                console.error('Failed to parse playlist:', e);
            }
        }

        // Extract metadata
        const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown Title';

        const thumbnailMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        let thumbnail = thumbnailMatch ? thumbnailMatch[1] : '';
        if (thumbnail && !thumbnail.startsWith('http')) {
            thumbnail = `https://mat6tube.com${thumbnail}`;
        }

        // Extract views
        const viewsMatch = html.match(/<span[^>]*class="[^"]*meta[^"]*"[^>]*>([^<]+)<\/span>/);
        const views = viewsMatch ? viewsMatch[1].trim() : '';

        // Extract related videos
        const relatedVideos = [];
        const itemRegex = /<div[^>]*class="[^"]*item[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/watch\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*(?:data-src|src)="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>[\s\S]*?<\/div>/g;
        let match;
        while ((match = itemRegex.exec(html)) !== null && relatedVideos.length < 16) {
            const [, id, thumb, title] = match;
            if (id && id !== videoId) {
                relatedVideos.push({
                    id,
                    title: title.trim(),
                    thumbnail: thumb.startsWith('http') ? thumb : `https://mat6tube.com${thumb}`,
                });
            }
        }

        return new Response(JSON.stringify({
            id: videoId,
            title,
            thumbnail,
            sources,
            tracks,
            cookies,
            views,
            relatedVideos
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300'
            }
        });

    } catch (error) {
        console.error('Video error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
