/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, action } = body; // action: 'like' or 'dislike'

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
        }

        // NoodleMagazine voting endpoint: POST /api/like/{id}
        // Payload: {"like": 1} or {"dislike": 1}
        const targetUrl = `https://noodlemagazine.com/api/like/${id}`;
        const payload = action === 'like' ? { like: 1 } : { dislike: 1 };

        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': `https://noodlemagazine.com/watch/${id}`,
                'X-Requested-With': 'XMLHttpRequest'
                // Note: CSRF token might be required, but anonymous voting might work without it
            },
            body: JSON.stringify(payload)
        });

        const data = await res.text();

        return NextResponse.json({ success: res.ok, data });

    } catch (e: any) {
        console.error('Vote error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
