import fs from 'fs';
const root = '..';
const cat = {amble:'라이프스타일',arcnode:'IT',beacon:'IT',biosense:'바이오·헬스케어',carebridge:'헬스케어',castell:'제조',cove:'라이프스타일',eduspark:'교육',florae:'라이프스타일',forgex:'IT',formax:'제조',freshline:'수산·유통',goodstock:'물류',gyeol:'라이프스타일',hypecast:'미디어',kinetiq:'모빌리티',lunara:'라이프스타일',nexora:'IT',noksu:'F&B','knot-studio':'공방·클래스','sniff-society':'뷰티·향수',novaiq:'IT',maru:'축산',onair:'미디어',prism:'미디어',prestra:'제조',yeoul:'바이오·헬스케어'};
const out = [];
for (const d of fs.readdirSync(root).filter(x=>x.endsWith('-landing')).sort()) {
  const id = d.replace('-landing','');
  const html = fs.readFileSync(`${root}/${d}/index.html`,'utf8');
  const title = (html.match(/<title>([^<]*)/)||[])[1]||id;
  const desc = (html.match(/name="description" content="([^"]*)/)||[])[1]||'';
  const [name, ...rest] = title.split(' — ');
  const mtime = fs.statSync(`${root}/${d}/index.html`).mtime.toISOString().slice(0,10);
  out.push({id, repo:d, name:name.trim(), tagline:rest.join(' — ').trim(), desc:desc.trim(), category:cat[id]||'기타', updated:mtime});
}
fs.writeFileSync('sites.js','window.SITES = '+JSON.stringify(out,null,2)+';\n');
console.log(out.length);

// per-site detail pages -> /<id>/ (static address, no JS)
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const s of out) {
  fs.mkdirSync(s.id, { recursive: true });
  const live = `https://hhhodo.github.io/${s.repo}/`;
  fs.writeFileSync(`${s.id}/index.html`, `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.name)} — Landing Gallery</title>
<meta name="description" content="${esc(s.desc)}">
<meta property="og:title" content="${esc(s.name)} — Landing Gallery">
<meta property="og:description" content="${esc(s.tagline || s.desc)}">
<meta property="og:image" content="https://hhhodo.github.io/landing-gallery/thumbs/${s.repo}.jpg">
<link rel="stylesheet" href="../styles.css">
</head>
<body class="detail-page">
<main class="wrap detail">
  <a class="back" href="../">← 갤러리</a>
  <a class="detail-thumb" href="${live}" target="_blank" rel="noopener"><img src="../thumbs/${s.repo}.jpg" alt="${esc(s.name)} 미리보기" width="800" height="500"></a>
  <div class="detail-meta"><span class="tag">${esc(s.category)}</span><span>업데이트 ${esc(s.updated)}</span></div>
  <h1>${esc(s.name)}</h1>
  <p class="detail-tagline">${esc(s.tagline)}</p>
  <p class="detail-desc">${esc(s.desc)}</p>
  <div class="detail-actions">
    <a class="btn primary" href="${live}" target="_blank" rel="noopener">사이트 바로가기 ↗</a>
    <a class="btn" href="../#${s.id}">💬 코멘트</a>
  </div>
</main>
</body>
</html>
`);
}
