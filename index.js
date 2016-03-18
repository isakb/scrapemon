'use strict';
const scrape = require('scrape-url');
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

// Returns a promise that resolves with an array of
// the scripts found at `url` (skipping inline scripts).
function extractScriptSrcs(scriptUrl) {
  return new Promise((resolve, reject) => {
    scrape(scriptUrl, SCRIPT_TAG_SELECTOR, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        resolve(matches.map((el) => el[0].attribs.src));
      }
    });
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
      return parsed.protocol + '//' + parsed.host + (base ? base + '/' : '') + src;
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
}).catch(console.error.bind(console));
