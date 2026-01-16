/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { request } from 'undici';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID parameter "id" is required' }, { status: 400 });
    }

    try {
        // Fetch the video page with undici (better cookie handling than native fetch)
        const url = `https://mat6tube.com/watch/${id}`;
        const response = await request(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://mat6tube.com/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cookie': 'age_verification=1'
            },
            headersTimeout: 30000, // 30s timeout for initial page load
            bodyTimeout: 30000
        });

        if (response.statusCode !== 200) {
            return NextResponse.json({ error: `Failed to fetch video: ${response.statusCode}` }, { status: response.statusCode });
        }

        const html = await response.body.text();

        // Extract cookies from response headers (undici provides better cookie handling)
        const setCookieHeaders = response.headers['set-cookie'];
        let cookies = 'age_verification=1';

        if (setCookieHeaders) {
            const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
            const sessionCookies = cookieArray
                .map(cookie => cookie.split(';')[0])
                .filter(c => !c.includes('age_verification'))
                .join('; ');

            if (sessionCookies) {
                cookies += '; ' + sessionCookies;
            }
        }

        console.log('Extracted cookies for video streams:', cookies);

        // Extract playlist using regex (similar to Python script)
        let sources: any[] = [];
        let tracks: any[] = [];

        const playlistMatch = html.match(/window\.playlist\s*=\s*(\{[\s\S]*?\});/);
        if (playlistMatch) {
            try {
                // Convert JS object to valid JSON
                let playlistStr = playlistMatch[1];

                // Quote unquoted keys - use regex that doesn't match colons in URLs
                // Match word characters followed by colon, but only after { or ,
                playlistStr = playlistStr.replace(/([{,]\s*)(\w+):/g, '$1"$2":');

                // Remove trailing commas
                playlistStr = playlistStr.replace(/,(\s*[}\]])/g, '$1');

                console.log('Playlist string (first 200 chars):', playlistStr.substring(0, 200));

                const playlist = JSON.parse(playlistStr);
                sources = playlist.sources || [];
                tracks = playlist.tracks || [];
                console.log('Successfully parsed playlist:', { sources: sources.length, tracks: tracks.length });
            } catch (e) {
                console.error('Failed to parse playlist:', e);
                console.error('Raw playlist (first 300 chars):', playlistMatch[1].substring(0, 300));
            }
        }

        const $ = cheerio.load(html);

        // --- Metadata from Watch Page ---
        const titleRaw = $('h1').first().text().trim();
        const views = $('.meta span').first().text().trim();

        // Extract tags from title brackets [tag1, tag2, tag3]
        const tagMatch = titleRaw.match(/\[([^\]]+)\]/);
        const tagsFromTitle: string[] = [];
        if (tagMatch) {
            tagsFromTitle.push(...tagMatch[1].split(',').map(t => t.trim()));
        }
        const cleanTitle = titleRaw
            .replace(/\s*\[.*?\]\s*/g, '')
            .replace(' watch online', '')
            .replace(/\s+HD\s*$/i, '') // Remove HD at the end
            .trim();

        // --- Metadata: Description ---
        const description = $('.description').text().trim() || '';

        // --- Metadata: Voting (NoodleMagazine structure) ---
        const likesText = $('.like span').text().trim();
        const dislikesText = $('.dislike span').text().trim();
        const likes = likesText ? parseInt(likesText.replace(/[^\d]/g, '')) || 0 : 0;
        const dislikes = dislikesText ? parseInt(dislikesText.replace(/[^\d]/g, '')) || 0 : 0;

        // --- Metadata: Thumbnail ---
        let thumbnail = $('meta[property="og:image"]').attr('content') || '';
        if (thumbnail && !thumbnail.startsWith('http')) {
            thumbnail = `https://mat6tube.com${thumbnail}`;
        }

        // --- Tags from Links ---
        const tagsFromLinks: string[] = [];
        $('.tags a').each((_, element) => {
            const tag = $(element).text().trim();
            if (tag) tagsFromLinks.push(tag);
        });
        // Combine tags from title and links, prioritize title tags
        const allTags = [...tagsFromTitle, ...tagsFromLinks];
        const uniqueTags = [...new Set(allTags)];

        // --- Related Videos ---
        const relatedVideos: any[] = [];
        $('.item').each((_, element) => {
            const el = $(element);
            const link = el.find('.item_link').attr('href');
            if (link && link.includes('/watch/')) {
                const vidId = link.split('/watch/')[1];
                const vidTitle = el.find('.title').text().trim();
                let vidThumb = el.find('img').attr('data-src') || el.find('img').attr('data-original') || el.find('img').attr('src');
                const duration = el.find('.m_time').text().trim();
                const vidViews = el.find('.m_views').text().trim();
                let preview = el.find('.i_img').attr('data-trailer_url');

                if (vidThumb && !vidThumb.startsWith('http') && !vidThumb.startsWith('data:')) vidThumb = `https://mat6tube.com${vidThumb}`;
                if (preview && !preview.startsWith('http')) preview = `https://mat6tube.com${preview}`;

                if (vidId && vidTitle && vidId !== id) {
                    relatedVideos.push({
                        id: vidId,
                        title: vidTitle,
                        thumbnail: vidThumb,
                        duration,
                        views: vidViews,
                        preview
                    });
                }
            }
        });
        // Deduplicate
        const uniqueRelated = Array.from(new Map(relatedVideos.map(item => [item.id, item])).values()).slice(0, 16);

        return NextResponse.json({
            id,
            title: cleanTitle || 'Unknown Title',
            thumbnail: thumbnail || '',
            sources,
            tracks,
            views,
            description,
            likes,
            dislikes,
            tags: uniqueTags,
            relatedVideos: uniqueRelated,
            cookies
        });

    } catch (error: any) {
        console.error('Video error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
