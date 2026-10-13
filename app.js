const OWNER = 'hhhodo';
const GISCUS = {
  repo: 'hhhodo/landing-gallery',
  repoId: 'R_kgDOVG-o-A',
  category: 'General',
  categoryId: 'DIC_kwDOVG-o-M4DITUG',
};

const $ = s => document.querySelector(s);
const sites = window.SITES;
const state = { cat: '전체', q: '' };

const pagesUrl = s => `https://${OWNER}.github.io/${s.repo}/`;
const zipUrl = s => `https://github.com/${OWNER}/${s.repo}/archive/refs/heads/main.zip`;
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderChips() {
  const cats = ['전체', ...new Set(sites.map(s => s.category))];
  $('#chips').innerHTML = cats.map(c =>
    `<button class="chip" role="tab" aria-selected="${c === state.cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}

function renderGrid() {
  const q = state.q.trim().toLowerCase();
  const list = sites.filter(s =>
    (state.cat === '전체' || s.category === state.cat) &&
    (!q || [s.name, s.tagline, s.category, s.desc].join(' ').toLowerCase().includes(q)));
  $('#count').textContent = list.length;
  $('#empty').hidden = list.length > 0;
  $('#grid').innerHTML = list.map(s => `
    <article class="card">
      <a class="thumb" href="${pagesUrl(s)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
        <img src="thumbs/${s.repo}.jpg" alt="" loading="lazy" width="800" height="500">
      </a>
      <div class="body">
        <div class="meta"><span class="tag">${esc(s.category)}</span><span>업데이트 ${esc(s.updated)}</span></div>
        <h3 class="name">${esc(s.name)}</h3>
        <p class="tagline">${esc(s.tagline || s.desc)}</p>
        <div class="actions">
          <a class="btn primary" href="${pagesUrl(s)}" target="_blank" rel="noopener">사이트 바로가기 ↗</a>
          <a class="btn" href="${zipUrl(s)}" download title="소스 파일 ZIP 다운로드" aria-label="${esc(s.name)} 파일 다운로드">⬇ ZIP</a>
          <button class="btn" data-comment="${s.id}" aria-label="${esc(s.name)} 코멘트">💬</button>
        </div>
      </div>
    </article>`).join('');
}

function giscusTheme() {
  const t = document.documentElement.dataset.theme;
  const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  return dark ? 'dark' : 'light';
}

function openDrawer(id, push = true) {
  const s = sites.find(x => x.id === id);
  if (!s) return;
  $('#d-title').textContent = s.name;
  $('#d-sub').textContent = s.tagline;
  $('#d-actions').innerHTML = `
    <a class="btn primary" href="${pagesUrl(s)}" target="_blank" rel="noopener">사이트 바로가기 ↗</a>
    <a class="btn" href="${zipUrl(s)}" download>⬇ 파일 다운로드</a>`;
  const box = $('#comments');
  box.innerHTML = '';
  const sc = document.createElement('script');
  sc.src = 'https://giscus.app/client.js';
  Object.entries({
    'data-repo': GISCUS.repo, 'data-repo-id': GISCUS.repoId,
    'data-category': GISCUS.category, 'data-category-id': GISCUS.categoryId,
    'data-mapping': 'specific', 'data-term': s.repo,
    'data-strict': '0', 'data-reactions-enabled': '1', 'data-emit-metadata': '0',
    'data-input-position': 'top', 'data-theme': giscusTheme(), 'data-lang': 'ko',
    'data-loading': 'lazy', crossorigin: 'anonymous',
  }).forEach(([k, v]) => sc.setAttribute(k, v));
  sc.async = true;
  box.appendChild(sc);
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (push) history.replaceState(null, '', '#' + id);
}

function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  $('#comments').innerHTML = '';
  history.replaceState(null, '', location.pathname);
}

document.addEventListener('click', e => {
  const chip = e.target.closest('[data-cat]');
  if (chip) { state.cat = chip.dataset.cat; renderChips(); renderGrid(); return; }
  const c = e.target.closest('[data-comment]');
  if (c) return openDrawer(c.dataset.comment);
  if (e.target.closest('[data-close]')) closeDrawer();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
$('#q').addEventListener('input', e => { state.q = e.target.value; renderGrid(); });

renderChips();
renderGrid();
if (location.hash.length > 1) openDrawer(decodeURIComponent(location.hash.slice(1)), false);
