// Test tag extraction from NoodleMagazine title format
const titleRaw = "Gina valentina (latin anal hottie)[2019, gonzo anal, hardcore, 1080p]";

// Current regex
const tagMatch = titleRaw.match(/\[([^\]]+)\]/);
console.log("Match result:", tagMatch);

if (tagMatch) {
    const tags = tagMatch[1].split(',').map(t => t.trim());
    console.log("Extracted tags:", tags);
}

const cleanTitle = titleRaw.replace(/\s*\[.*?\]\s*/g, '').replace(' watch online', '').trim();
console.log("Clean title:", cleanTitle);
