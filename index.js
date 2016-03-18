'use strict';
const url = require('url');
const path = require('path');
const scraper = require('qscraper');

const SCRIPT_TAG_SELECTOR = 'script[src]';

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

const urls = process.argv.slice(2).map((arg) => {
  let looksLikeUrl = /^(http|ftp)s?:\/\//.exec(arg);
  if (!looksLikeUrl) {
    throw new Error('Expecting a URL, got: ' + arg);
  }
  return arg;
});

let session = scraper.session();

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
