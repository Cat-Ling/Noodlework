// Native fetch in Node 18+

async function test() {
    const id = '-190573291_456239091';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    console.log('Fetching watch page...');
    const watchRes = await fetch(`https://mat6tube.com/watch/${id}`, { headers });
    console.log('Watch Status:', watchRes.status);
    console.log('Watch Set-Cookie:', watchRes.headers.get('set-cookie'));

    console.log('Fetching download page...');
    const downloadRes = await fetch(`https://mat6tube.com/download/${id}`, { headers });
    console.log('Download Status:', downloadRes.status);
    console.log('Download Set-Cookie:', downloadRes.headers.get('set-cookie'));
}

test();
