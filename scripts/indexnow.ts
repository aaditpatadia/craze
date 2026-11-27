/**
 * Tells Bing (and the other IndexNow search engines) about every page on timule.com at once.
 * Reads the live sitemap, then posts all its URLs to IndexNow. Run after a deploy that adds
 * or changes pages:  npm run indexnow
 * The key is public by design: search engines check it at https://timule.com/<key>.txt.
 */
const HOST = "timule.com";
const KEY = "356f091be1436149eaadda030566d17f";

async function main() {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!).filter((u) => u.startsWith(`https://${HOST}`));
  const extra = [`https://${HOST}/llms.txt`];
  const urlList = [...new Set([...urls, ...extra])];
  const keyCheck = await fetch(`https://${HOST}/${KEY}.txt`);
  if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) throw new Error("Key file is not live yet. Deploy first.");
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URLs`);
  if (res.status >= 400) console.log(await res.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
