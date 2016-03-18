'use strict';
const scraper = require('qscraper');
const validUrl = require('valid-url');
const url = require('url');
const path = require('path');
const SCRIPT_TAG_SELECTOR = 'script[src]';
const urls = process.argv.slice(2).map((arg) => {
  if (!validUrl.isWebUri(arg)) {
    throw new Error('Unexpected URL format: ' + arg);
  }
  return arg;
});

let session = scraper.session();

// Returns a promise that resolves with an array of
// the scripts found at `url` (skipping inline scripts).
function extractScriptSrcs(scriptUrl) {
  return session.get$(scriptUrl).then(($) => {
    return $(SCRIPT_TAG_SELECTOR).toArray().map((el) => el.attribs.src);
  });
}

// Returns a function that converts relative URLs to
// absolute URLs as they would be on the page at `pageUrl`.
// Relative URLs are left intact.
function getRelativeConverter(pageUrl) {
  return (src) => {
    const isAbsoluteUrl = /^(\/\/|\w+:\/\/)/.exec(src);
    if (isAbsoluteUrl) {
      return src;
    } else {
      const parsed = url.parse(pageUrl);
      const base = path.basename(parsed.pathname);
      return parsed.protocol + '//' + parsed.host +
        (base ? base + '/' : '') + src;
    }
  };
}

Promise.all(urls.map(extractScriptSrcs)).then((arr) => {
  arr.forEach((scriptSrcs, index) => {
    const pageUrl = urls[index];
    console.log('[Scripts at %s]', pageUrl);
    console.log(scriptSrcs.map(getRelativeConverter(pageUrl)).join('\n'));
  });
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
