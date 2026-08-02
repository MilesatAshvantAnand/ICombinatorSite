// Smoke test, no dependencies: asserts the homepage hero has a square LinkedIn
// button beside "See public events", pointing at the company page safely.
// Run: node tests/linkedin-link.test.js
const fs = require('fs');
const path = require('path');

const EXPECTED_URL = 'https://www.linkedin.com/company/icombinatorireland/';
const file = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

function assert(cond, message) {
  if (!cond) { console.error(`FAIL: ${message}`); process.exitCode = 1; }
  else { console.log(`PASS: ${message}`); }
}

const rowMatch = html.match(/<div class="btn-row">[\s\S]*?<\/div>/);
assert(!!rowMatch, 'hero .btn-row exists');
const row = rowMatch ? rowMatch[0] : '';

assert(/See public events/.test(row), '"See public events" button is in the hero btn-row');

const linkMatch = row.match(/<a\s+class="([^"]*)"\s+href="([^"]+)"([^>]*)>[\s\S]*?<\/a>/g) || [];
const linkedinTag = linkMatch.find(tag => tag.includes(EXPECTED_URL));
assert(!!linkedinTag, 'a link to the LinkedIn company page exists in the hero btn-row');

if (linkedinTag) {
  assert(/class="[^"]*btn--square[^"]*"/.test(linkedinTag), 'LinkedIn link uses the btn--square class');
  assert(/target="_blank"/.test(linkedinTag), 'link opens in a new tab (target="_blank")');
  assert(/rel="[^"]*noopener[^"]*"/.test(linkedinTag), 'link has rel="noopener" to prevent tab-nabbing');
  assert(/aria-label="[^"]+"/.test(linkedinTag), 'icon-only button has an aria-label for screen readers');
}

assert(/\.btn--square\s*\{/.test(fs.readFileSync(path.join(__dirname, '..', 'assets/css/site.css'), 'utf8')),
  'assets/css/site.css defines a .btn--square rule');

if (process.exitCode === 1) {
  console.error('\nLinkedIn link test FAILED');
} else {
  console.log('\nLinkedIn link test PASSED');
}
