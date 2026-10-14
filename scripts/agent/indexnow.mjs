// Tells Bing, Yandex, Seznam, Naver and other IndexNow search engines that
// kitefolio.com pages are new or changed, so they crawl them within hours.
// (Google doesn't use IndexNow; it reads the sitemap.)
//
//   node scripts/agent/indexnow.mjs              every page in the live sitemap
//   node scripts/agent/indexnow.mjs /a /b        only these pages
//
// The key isn't a secret: IndexNow checks it by fetching
// https://kitefolio.com/<key>.txt (public/<key>.txt). To change it, rename that
// file, put the new key inside, and update KEY here.

const SITE = "https://kitefolio.com";
const KEY = "2b8532761a4c368f18e283215b93c50f";
const ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow accepts up to 10,000 addresses per request. */
const BATCH = 10_000;

async function sitemapUrls() {
  const response = await fetch(`${SITE}/sitemap.xml`);
  if (!response.ok) throw new Error(`Sitemap: ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, "&"));
}

async function submit(urlList) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList,
    }),
  });
  // 200 = received, 202 = received and the key is still being checked.
  if (response.status !== 200 && response.status !== 202)
    throw new Error(`IndexNow answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return response.status;
}

try {
  const paths = process.argv.slice(2);
  const urls = paths.length ? paths.map((path) => new URL(path, SITE).toString()) : await sitemapUrls();
  for (let start = 0; start < urls.length; start += BATCH) {
    const batch = urls.slice(start, start + BATCH);
    const status = await submit(batch);
    console.log(`Sent ${batch.length} page(s) to IndexNow (answer ${status}).`);
  }
} catch (error) {
  console.error(`IndexNow failed: ${error.message}`);
  process.exit(1);
}
