import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '1';

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const len = searchParams.get('len');
        const sort = searchParams.get('sort');
        const hd = searchParams.get('hd');

        // Build Mat6tube URL with filters
        const params = new URLSearchParams({ p: page });
        if (len && len !== 'any') params.append('len', len);
        if (sort && sort !== '2') params.append('sort', sort);
        if (hd === '1') params.append('hd', '1');

        const res = await fetch(`https://mat6tube.com/video/${encodeURIComponent(query)}?${params}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: `Downstream error: ${res.status}` }, { status: res.status });
        }

        const html = await res.text();
        const $ = cheerio.load(html);
        const videos: any[] = [];

        $('.list_videos .item').each((_, element) => {
            const el = $(element);
            const link = el.find('.item_link').attr('href');
            const id = link ? link.split('/watch/')[1] : null;
            const title = el.find('.title').text().trim();
            let thumbnail = el.find('img').attr('data-src') || el.find('img').attr('data-original') || el.find('img').attr('src');
            const duration = el.find('.m_time').text().trim();
            const views = el.find('.m_views').text().trim();
            const isHd = el.find('.hd_mark').length > 0;

            if (thumbnail && !thumbnail.startsWith('http') && !thumbnail.startsWith('data:')) {
                thumbnail = `https://mat6tube.com${thumbnail}`;
            }

            if (id && title) {
                const thumbnailInfo = el.find('.i_img');
                const previewAttr = thumbnailInfo.attr('data-trailer_url') || thumbnailInfo.find('img').attr('data-trailer_url');
                let preview = previewAttr;
                if (preview && !preview.startsWith('http')) {
                    preview = `https://mat6tube.com${preview}`;
                }

                videos.push({
                    id,
                    title,
                    thumbnail,
                    preview,
                    duration,
                    views,
                    isHd,
                });
            }
        });

        return NextResponse.json({ videos });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
