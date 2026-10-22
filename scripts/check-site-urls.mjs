import { buildOutputFiles } from './build-output-files.mjs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { inspectCopy, inspectParticleTemplates } from './ui-copy-checks.mjs';
const ts = createRequire(import.meta.url)('typescript');
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { domainToUnicode } from 'node:url';
import { inspectHtml, inspectRobots, isIndexableHtml, siteUrl, xmlText } from './site-url-checks.mjs';
const config = JSON.parse(readFileSync('src/lib/site.config.json', 'utf8'));
assert.equal(config.url, new URL(config.url).origin); assert(/^[\x00-\x7f]+$/.test(config.url), 'ASCII origin required');
assert.equal(new URL(config.displayUrl).origin, config.url); assert.equal(new URL(config.url).hostname, new URL(config.displayUrl).hostname);
assert.equal(config.displayUrl, `${new URL(config.url).protocol}//${domainToUnicode(new URL(config.url).hostname)}`);
const output = buildOutputFiles();
const urls = [...readFileSync(output.file('sitemap.xml.body'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => xmlText(m[1]));
assert(urls.length, 'empty sitemap'); const seen = new Set(); const images = new Set();
for (const value of urls) {
  const url = siteUrl(value, config, 'sitemap'); assert(!seen.has(url.href), `duplicate sitemap ${value}`); seen.add(url.href);
  const name = decodeURIComponent(url.pathname.slice(1)).replace(/\/$/, '') || 'index';
  const file = output.file(`${name}.html`); assert(existsSync(file), `published HTML missing: ${value}`);
  const html = readFileSync(file, 'utf8'); inspectCopy(html, value, config.copyIdentifierAllowlist ?? []);
  inspectInitialHtml(html, value);
  const result = inspectHtml(html, config, value); [...result.images, ...result.twitter].forEach(v => images.add(v));
}
/**
 * 초기 서버 HTML 에 본문이 실려야 한다. 계산기 컴포넌트의 useSearchParams 가 페이지 전체를 감싼 Suspense 까지
 * 클라이언트 렌더링으로 넘기면(BAILOUT_TO_CLIENT_SIDE_RENDERING) H1·해설·FAQ 가 초기 HTML 에서 사라진다.
 * 2026-10-19 점검에서 계산기 30개 페이지가 이 상태였다. 경계는 CalcShell 안의 계산기 영역에만 둔다.
 */
function inspectInitialHtml(html, expected) {
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  assert.equal(h1.length, 1, `${expected}: initial HTML must contain exactly one non-empty <h1> (found ${h1.length})`);
  // 계산기 영역만 지연되는 것은 정상이다(마커는 계산기 박스 안에만 나온다). 지연 구간이 H1 앞에서 시작하거나
  // 지연 구간 뒤에 해설·FAQ(h2)가 하나도 없으면 페이지 전체가 클라이언트로 넘어간 것이다.
  const bailout = html.indexOf('BAILOUT_TO_CLIENT_SIDE_RENDERING');
  if (bailout !== -1) {
    assert(html.search(/<h1\b/i) < bailout, `${expected}: <h1> is inside the client-side rendering boundary (Suspense wraps the whole page)`);
    assert(/<h2\b/i.test(html.slice(bailout)), `${expected}: guide/FAQ content after the calculator is missing from the initial HTML`);
  }
}
// Also check indexable generated routes omitted from sitemap (e.g. salary detail pages).
let indexablePages = 0;
for (const [relative, file] of output.html) {
  if (['_global-error.html', '_not-found.html'].includes(relative)) continue;
  const html = readFileSync(file, 'utf8');
  if (!isIndexableHtml(html)) continue;
  const path = relative === 'index.html' ? '/' : `/${relative.slice(0,-5)}`;
  const expected = new URL(path,config.url).href;
  const checked = inspectHtml(html,config,expected);
  inspectInitialHtml(html,expected);
  inspectCopy(html,expected,config.copyIdentifierAllowlist ?? []);
  [...checked.images,...checked.twitter].forEach(value=>images.add(value));
  indexablePages++;
}
inspectRobots(readFileSync(output.file('robots.txt.body'), 'utf8'), config);
for (const value of images) {
  const url = new URL(value); if (url.origin !== config.url) continue;
  const file = join('public', decodeURIComponent(url.pathname));
  const generated = output.find(`${decodeURIComponent(url.pathname.slice(1))}.body`);
  assert(existsSync(file) || Boolean(generated), `image asset missing: ${value}`);
}
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name); if (entry.isDirectory()) scan(path);
    else if (/\.(?:ts|tsx|js|jsx|mjs|json)$/.test(path) && !/\.test\./.test(path)) {
      if (/\.tsx?$/.test(path)) inspectParticleTemplates(ts, readFileSync(path, 'utf8'), path);
      for (const [raw] of readFileSync(path, 'utf8').matchAll(/https?:\/\/[^\s"'`<>\\)]+/g)) {
        let host; try { host = new URL(raw).hostname; } catch { continue; }
        for (const forbidden of config.forbiddenHosts ?? []) { const blocked = new URL(`https://${forbidden}`).hostname; assert(host !== blocked && !host.endsWith(`.${blocked}`), `${path}: forbidden URL ${raw}`); }
      }
    }
  }
}
scan('src');
console.log(`[site URLs] ${urls.length} sitemap pages / ${indexablePages} indexable pages: canonical/origin, OG/Twitter images, large cards, robots, JSON-LD, image assets and server-rendered H1 verified`);
