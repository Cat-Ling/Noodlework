const fetch = require('node-fetch');

async function checkPlaylist() {
    const id = '-118495491_456239131';
    const url = `https://noodlemagazine.com/download/${id}`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'age_verification=1',
        'Referer': 'https://noodlemagazine.com/'
    };

    try {
        const res = await fetch(url, { headers });
        const html = await res.text();
        const match = html.match(/window\.playlist\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
            const data = JSON.parse(match[1]);
            console.log('Keys:', Object.keys(data));
            if (data.image) console.log('Image:', data.image);
            if (data.tracks) console.log('Tracks:', JSON.stringify(data.tracks, null, 2));
        } else {
            console.log('No playlist found');
        }
    } catch (e) { console.error(e); }
}

checkPlaylist();
