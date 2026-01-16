const fs = require('fs');
const html = fs.readFileSync('debug_video.html', 'utf8');

console.log('Total length:', html.length);

// Search for 'sources:'
const sourcesIdx = html.indexOf('sources:');
console.log('sources: index', sourcesIdx);

if (sourcesIdx !== -1) {
    console.log('Context around sources:', html.substring(sourcesIdx - 100, sourcesIdx + 300));
}

// Search for setup(
const setupIdx = html.indexOf('setup(');
console.log('setup( index', setupIdx);
if (setupIdx !== -1) {
    console.log('Context around setup:', html.substring(setupIdx - 50, setupIdx + 300));
}
