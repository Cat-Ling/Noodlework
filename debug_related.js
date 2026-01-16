const cheerio = require('cheerio');

async function checkRelated() {
    try {
        console.log("Checking Related Videos Pagination...");
        // Fetch a video page
        const url = 'https://mat6tube.com/watch/-99334202_456239309';
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await res.text();
        const $ = cheerio.load(html);

        // Count initial related
        const related = $('.item').length;
        console.log(`Initial Related Count: ${related}`);

        // Check for "Show More" button or link in the related section
        // Look for common keywords or classes
        const bodyText = $('body').text();
        if (bodyText.includes('Show more')) console.log("Found 'Show more' text");

        const showMoreBtn = $('a:contains("Show more"), button:contains("Show more"), .show_more, .load_more');
        if (showMoreBtn.length > 0) {
            console.log("Found Show More element:", showMoreBtn.attr('class') || showMoreBtn.attr('id'));
            console.log("Href/Action:", showMoreBtn.attr('href') || showMoreBtn.attr('onclick'));
        } else {
            console.log("No explicit Show More button found in HTML.");
        }

        // Try to fetch same URL with page param
        const url2 = `${url}?p=2`;
        const res2 = await fetch(url2, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html2 = await res2.text();
        const $2 = cheerio.load(html2);
        const related2 = $2('.item').length;
        console.log(`Page 2 Related Count: ${related2}`);

        // Compare first item title to see if it changed
        const t1 = $('.item .title').first().text();
        const t2 = $2('.item .title').first().text();
        console.log(`First Related Title (P1): ${t1}`);
        console.log(`First Related Title (P2): ${t2}`);

        if (t1 !== t2 && t2) {
            console.log("Pagination seems to affect related videos (or something changed).");
        } else {
            console.log("Pagination likely ignored for video page.");
        }

    } catch (e) {
        console.error(e);
    }
}

checkRelated();
