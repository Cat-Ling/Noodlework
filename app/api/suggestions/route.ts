import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ suggestions: [] });
    }

    try {
        const res = await fetch(`https://noodlemagazine.com/api/autocomplete?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://noodlemagazine.com/'
            },
        });

        if (!res.ok) {
            return NextResponse.json({ suggestions: [] });
        }

        const data = await res.json();
        return NextResponse.json(data); // Forward the JSON response directly

    } catch (error) {
        console.error('Suggestion error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}
