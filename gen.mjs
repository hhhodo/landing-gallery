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
