const fetch = require('node-fetch');
const cheerio = require('cheerio');

const VIDEO_ID = '-118495491_456239131';
// Or full URL: https://noodlemagazine.com/watch/-118495491_456239131
// noodlescraper uses: https://noodlemagazine.com/video/ID (which likely redirects or is canonical)
// But let's try constructing the download URL directly.
// In the python script: og_video.replace('player', 'download')
// The og:video usually looks like: https://noodlemagazine.com/player/-118495491_456239131

const downloadUrl = `https://noodlemagazine.com/download/${VIDEO_ID}`;

console.log('Fetching:', downloadUrl);

async function test() {
    try {
        const res = await fetch(downloadUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': 'age_verification=1'
            }
        });

        console.log('Status:', res.status);
        const html = await res.text();

        // Check for window.playlist
        const match = html.match(/window\.playlist\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
            console.log('Playlist JSON Found!');
            const json = JSON.parse(match[1]);
            console.log(JSON.stringify(json, null, 2));
        } else {
            console.log('No playlist found. Dumping snippet:');
            console.log(html.substring(0, 1000));
        }

    } catch (e) {
        console.error(e);
    }
}

test();
