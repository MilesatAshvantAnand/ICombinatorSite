// Smoke test, no dependencies: asserts the homepage links to I Combinator's
// LinkedIn company page, just below the header, with safe target/rel attributes.
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

const headerEnd = html.indexOf('</header>');
const mainStart = html.indexOf('<main id="main">');
assert(headerEnd !== -1, 'index.html has a </header> closing tag');
assert(mainStart !== -1, 'index.html has a <main id="main"> tag');
assert(headerEnd !== -1 && mainStart !== -1 && headerEnd < mainStart,
  'header closes before <main> opens');

const betweenHeaderAndMain = (headerEnd !== -1 && mainStart !== -1)
  ? html.slice(headerEnd, mainStart) : '';

const linkMatch = betweenHeaderAndMain.match(
  /<a\s+href="([^"]+)"([^>]*)>[\s\S]*?LinkedIn[\s\S]*?<\/a>/i
);
assert(!!linkMatch, 'a LinkedIn link exists between the header and <main>');

if (linkMatch) {
  const [, href, attrs] = linkMatch;
  assert(href === EXPECTED_URL, `link href is exactly "${EXPECTED_URL}" (got "${href}")`);
  assert(/target="_blank"/.test(attrs), 'link opens in a new tab (target="_blank")');
  assert(/rel="[^"]*noopener[^"]*"/.test(attrs), 'link has rel="noopener" to prevent tab-nabbing');
}

if (process.exitCode === 1) {
  console.error('\nLinkedIn link test FAILED');
} else {
  console.log('\nLinkedIn link test PASSED');
}
