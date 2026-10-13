const OWNER = 'hhhodo';
const SB = {
  url: 'https://anbmmuautjgwculrcxpq.supabase.co',
  key: 'sb_publishable_Lf8KMwlJEGeEvh6cIGD_CQ_xAzbgNyZ',
};

const $ = s => document.querySelector(s);
const sites = window.SITES;
const state = { cat: '전체', q: '' };

const pagesUrl = s => `https://${OWNER}.github.io/${s.repo}/`;
const zipName = s => `${s.repo}_${s.category}.zip`.replace(/[\\/:*?"<>|\s]/g, '');

async function downloadZip(s, btn) {
  const label = btn.textContent;
  const setP = t => { btn.textContent = t; };
  btn.disabled = true;
  try {
    setP('준비 중…');
    const tree = await (await fetch(`https://api.github.com/repos/${OWNER}/${s.repo}/git/trees/main?recursive=1`)).json();
    if (!tree.tree) throw new Error('파일 목록 조회 실패 (잠시 후 다시 시도)');
    const files = tree.tree.filter(f => f.type === 'blob');
    const zip = new JSZip();
    let done = 0, i = 0;
    const worker = async () => {
      while (i < files.length) {
        const f = files[i++];
        const url = `https://raw.githubusercontent.com/${OWNER}/${s.repo}/main/` + f.path.split('/').map(encodeURIComponent).join('/');
        const r = await fetch(url);
        if (!r.ok) throw new Error(f.path + ' ' + r.status);
        zip.file(f.path, await r.blob(), { binary: true });
        setP(`내려받는 중 ${Math.round(++done / files.length * 100)}%`);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 }, streamFiles: true },
      m => setP(`압축 중 ${Math.round(m.percent)}%`));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = zipName(s);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  } catch (e) {
    alert('다운로드 실패: ' + e.message);
  }
  btn.textContent = label; btn.disabled = false;
}
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
          <button class="btn" data-zip="${s.id}" title="소스 파일 ZIP 다운로드" aria-label="${esc(s.name)} 파일 다운로드">⬇ ZIP</button>
          <button class="btn" data-comment="${s.id}" aria-label="${esc(s.name)} 코멘트">💬<span class="n"></span></button>
        </div>
      </div>
    </article>`).join('');
  applyCounts();
}


/* ---------- Supabase (REST) ---------- */
const store = {
  get() { try { return JSON.parse(localStorage.getItem('lg-session')); } catch { return null; } },
  set(v) { try { v ? localStorage.setItem('lg-session', JSON.stringify(v)) : localStorage.removeItem('lg-session'); } catch {} },
  name() { try { return localStorage.getItem('lg-name') || ''; } catch { return ''; } },
  setName(n) { try { localStorage.setItem('lg-name', n); } catch {} },
};
let session = store.get();
const isAdmin = () => !!session && session.expires_at * 1000 > Date.now() - 60000;

async function sb(path, { method = 'GET', body, auth = false, prefer } = {}) {
  const headers = { apikey: SB.key, 'Content-Type': 'application/json' };
  headers.Authorization = 'Bearer ' + (auth && session ? session.access_token : SB.key);
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(SB.url + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.status);
  return r.status === 204 ? null : r.json().catch(() => null);
}
async function login(email, password) {
  const r = await fetch(SB.url + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error('이메일 또는 비밀번호가 맞지 않아요');
  session = { access_token: d.access_token, expires_at: d.expires_at, email };
  store.set(session);
}
const logout = () => { session = null; store.set(null); };

const fmt = iso => new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
let current = null;

async function loadComments() {
  const box = $('#comments');
  try {
    const rows = await sb(`/rest/v1/comments?site=eq.${encodeURIComponent(current)}&select=*&order=created_at.asc`);
    const tops = rows.filter(r => !r.parent_id);
    const replies = id => rows.filter(r => r.parent_id === id);
    box.querySelector('.list').innerHTML = tops.length ? tops.map(c => `
      <div class="c" data-id="${c.id}">
        <div class="c-h"><b>${esc(c.author)}</b><time>${fmt(c.created_at)}</time>
          ${isAdmin() ? `<button class="lnk" data-reply="${c.id}">답장</button><button class="lnk danger" data-del="${c.id}">삭제</button>` : ''}</div>
        <p>${esc(c.body)}</p>
        ${replies(c.id).map(r => `
          <div class="c reply"><div class="c-h"><b>${esc(r.author)}</b><span class="badge">관리자</span><time>${fmt(r.created_at)}</time>
            ${isAdmin() ? `<button class="lnk danger" data-del="${r.id}">삭제</button>` : ''}</div><p>${esc(r.body)}</p></div>`).join('')}
        <div class="reply-slot"></div>
      </div>`).join('') : '<p class="none">아직 코멘트가 없어요. 첫 코멘트를 남겨주세요.</p>';
    updateCount(current, tops.length);
  } catch (e) {
    box.querySelector('.list').innerHTML = `<p class="err">코멘트를 불러오지 못했어요 (${esc(e.message)})</p>`;
  }
}

function renderPanel() {
  $('#comments').innerHTML = `
    <form class="cform" id="cform" autocomplete="off">
      <input name="author" placeholder="닉네임 (선택)" maxlength="30" value="${esc(store.name())}">
      <textarea name="body" placeholder="코멘트를 남겨주세요" maxlength="1000" rows="3" required></textarea>
      <input name="website" class="hp" tabindex="-1" aria-hidden="true" autocomplete="off">
      <div class="cform-row"><span class="msg" id="cmsg"></span><button class="btn primary" type="submit">등록</button></div>
    </form>
    <div class="list"><p class="none">불러오는 중…</p></div>
    <div class="admin-bar" id="adminbar"></div>`;
  renderAdminBar();
  loadComments();
}

function renderAdminBar() {
  $('#adminbar').innerHTML = isAdmin()
    ? `<span>관리자 로그인 중</span><button class="lnk" id="logout">로그아웃</button>`
    : `<button class="lnk" id="showlogin">관리자</button>`;
}

function openDrawer(id, push = true) {
  const s = sites.find(x => x.id === id);
  if (!s) return;
  current = s.id;
  $('#d-title').textContent = s.name;
  $('#d-sub').textContent = s.tagline;
  $('#d-actions').innerHTML = `
    <a class="btn primary" href="${pagesUrl(s)}" target="_blank" rel="noopener">사이트 바로가기 ↗</a>
    <button class="btn" data-zip="${s.id}">⬇ 파일 다운로드</button>`;
  renderPanel();
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (push) history.replaceState(null, '', '#' + id);
}

function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname);
}

const counts = {};
function updateCount(id, n) {
  counts[id] = n;
  const b = document.querySelector(`[data-comment="${id}"] .n`);
  if (b) b.textContent = n || '';
}
const applyCounts = () => Object.entries(counts).forEach(([k, v]) => { const b = document.querySelector(`[data-comment="${k}"] .n`); if (b) b.textContent = v || ''; });
async function loadCounts() {
  try {
    const rows = await sb('/rest/v1/comments?select=site&parent_id=is.null');
    rows.forEach(r => counts[r.site] = (counts[r.site] || 0) + 1);
    applyCounts();
  } catch {}
}

document.addEventListener('submit', async e => {
  if (e.target.id === 'cform') {
    e.preventDefault();
    const f = e.target, msg = $('#cmsg');
    if (f.website.value) return; // honeypot
    const author = f.author.value.trim() || '익명', body = f.body.value.trim();
    if (!body) return;
    f.querySelector('button').disabled = true; msg.textContent = '';
    try {
      await sb('/rest/v1/comments', { method: 'POST', body: { site: current, author, body }, auth: isAdmin(), prefer: 'return=minimal' });
      store.setName(author === '익명' ? '' : author); f.body.value = ''; await loadComments();
    } catch (err) { msg.textContent = '등록 실패: ' + err.message; }
    f.querySelector('button').disabled = false;
  } else if (e.target.classList.contains('rform')) {
    e.preventDefault();
    const f = e.target, body = f.body.value.trim();
    if (!body) return;
    try {
      await sb('/rest/v1/comments', { method: 'POST', auth: true, prefer: 'return=minimal',
        body: { site: current, parent_id: f.dataset.parent, author: '관리자', body, is_admin: true } });
      await loadComments();
    } catch (err) { f.querySelector('.msg').textContent = '실패: ' + err.message; }
  } else if (e.target.id === 'lform') {
    e.preventDefault();
    const f = e.target;
    try { await login(f.email.value.trim(), f.password.value); renderPanel(); }
    catch (err) { f.querySelector('.msg').textContent = err.message; }
  }
});

document.addEventListener('click', async e => {
  const t = e.target;
  if (t.id === 'showlogin') {
    $('#adminbar').innerHTML = `<form id="lform"><input name="email" type="email" placeholder="이메일" required><input name="password" type="password" placeholder="비밀번호" required><button class="btn" type="submit">로그인</button><span class="msg"></span></form>`;
  } else if (t.id === 'logout') { logout(); renderPanel(); }
  else if (t.dataset.reply) {
    const slot = t.closest('.c').querySelector('.reply-slot');
    slot.innerHTML = `<form class="rform" data-parent="${t.dataset.reply}"><textarea name="body" rows="2" maxlength="1000" placeholder="답장 작성" required></textarea><div class="cform-row"><span class="msg"></span><button class="btn primary" type="submit">답장 등록</button></div></form>`;
    slot.querySelector('textarea').focus();
  } else if (t.dataset.del) {
    if (!confirm('삭제할까요? (답글도 함께 삭제돼요)')) return;
    try { await sb(`/rest/v1/comments?id=eq.${t.dataset.del}`, { method: 'DELETE', auth: true }); loadComments(); }
    catch (err) { alert('삭제 실패: ' + err.message); }
  }
});

document.addEventListener('click', e => {
  const chip = e.target.closest('[data-cat]');
  if (chip) { state.cat = chip.dataset.cat; renderChips(); renderGrid(); return; }
  const z = e.target.closest('[data-zip]');
  if (z) return downloadZip(sites.find(x => x.id === z.dataset.zip), z);
  const c = e.target.closest('[data-comment]');
  if (c) return openDrawer(c.dataset.comment);
  if (e.target.closest('[data-close]')) closeDrawer();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
$('#q').addEventListener('input', e => { state.q = e.target.value; renderGrid(); });

renderChips();
renderGrid();
loadCounts();
if (location.hash.length > 1) openDrawer(decodeURIComponent(location.hash.slice(1)), false);
