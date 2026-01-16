const https = require('https');

const id = '-118495491_456239131';
const url = `https://noodlemagazine.com/download/${id}`;
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'age_verification=1',
        'Referer': 'https://noodlemagazine.com/'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const match = data.match(/window\.playlist\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
            try {
                const json = JSON.parse(match[1]);
                console.log('JSON Keys:', Object.keys(json));
                console.log('Image:', json.image);
                console.log('Tracks:', JSON.stringify(json.tracks, null, 2));
            } catch (e) { console.error('Parse Error', e); }
        } else {
            console.log('No playlist found in HTML.');
        }
    });
}).on('error', (e) => {
    console.error(e);
});
