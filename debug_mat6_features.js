const cheerio = require('cheerio');

async function checkFeatures() {
    try {
        console.log("Checking Pagination for /now...");
        // Try ?p=2 pattern
        const nowRes = await fetch('https://mat6tube.com/now?p=2', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const nowHtml = await nowRes.text();
        const $now = cheerio.load(nowHtml);
        const videos = $now('.list_videos .item').length;
        console.log(`Page 2 Video Count: ${videos} (Expected > 0)`);

        // Check finding a video link to test tags
        const firstVideoLink = $now('.list_videos .item .item_link').attr('href');
        if (firstVideoLink) {
            console.log(`Checking Tags on video: ${firstVideoLink}`);
            const vidUrl = firstVideoLink.startsWith('http') ? firstVideoLink : `https://mat6tube.com${firstVideoLink}`;
            const vidRes = await fetch(vidUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const vidHtml = await vidRes.text();
            const $vid = cheerio.load(vidHtml);

            // Try common selectors
            const tags = [];
            $vid('a[href*="/tags/"]').each((i, el) => {
                tags.push($vid(el).text().trim());
            });

            console.log("Found Tags:", tags);

            // Check for 'Recent Trends' or similar sidebars
            console.log("Checking for 'trends' keyword in text...");
            const fullText = $vid('body').text();
            if (fullText.toLowerCase().includes('trend')) {
                console.log("Found 'trend' keyword in body text.");
            }
        }

    } catch (e) {
        console.error(e);
    }
}

checkFeatures();
