const $ = id => document.getElementById(id);
const source = $('source'), result = $('result');
let custom = [], history = [], promptEvent = null;
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { status('Storage unavailable. Keep a copy of your message.'); }
}
function status(text) { $('status').textContent = text; }
function all() { return [...new Set([...defaults, ...custom])]; }
function rewrite() {
  const r = rewriteMessage(source.value, all(), $('random').checked, $('preserve').checked);
  result.value = r.text;
  $('replacements').textContent = r.count + (r.count === 1 ? ' replacement' : ' replacements');
  return r;
}
function remember() {
  if (!source.value.trim()) return;
  history = [{id: Date.now(), original: source.value, result: result.value, date: new Date().toISOString()}, ...history.filter(h => h.original !== source.value || h.result !== result.value)].slice(0, 15);
  save('folio-rewrites', history);
  renderHistory();
}
function edited() {
  try { localStorage.setItem('folio-draft', source.value); } catch {}
  const words = source.value.trim() ? source.value.trim().split(/\s+/).length : 0;
  $('count').textContent = words + (words === 1 ? ' word | ' : ' words | ') + source.value.length + ' characters';
  if ($('live').checked || !source.value) rewrite();
}
function renderTerms() {
  const chips = all().map(term => {
    const chip = document.createElement('span');
    chip.className = 'keyword-chip';
    chip.textContent = term;
    return chip;
  });
  $('terms').replaceChildren(...chips);
}
function renderHistory() {
  const box = $('history');
  box.replaceChildren();
  if (!history.length) { box.textContent = 'No saved messages yet.'; return; }
  history.forEach(h => {
    const row = document.createElement('div');
    row.className = 'history-item';
    const restore = document.createElement('button');
    restore.textContent = h.original.slice(0, 180);
    restore.onclick = () => { source.value = h.original; edited(); result.value = h.result; source.focus(); };
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.onclick = () => { history = history.filter(x => x.id !== h.id); save('folio-rewrites', history); renderHistory(); };
    row.append(restore, remove);
    box.append(row);
  });
}
$('formatting').open = matchMedia('(min-width:641px)').matches;
const storedCustom = read('folio-keywords', []), storedHistory = read('folio-rewrites', []);
custom = Array.isArray(storedCustom) ? storedCustom.filter(x => typeof x === 'string') : [];
history = Array.isArray(storedHistory) ? storedHistory.filter(x => x && typeof x.original === 'string' && typeof x.result === 'string').slice(0, 15) : [];
try {
  source.value = localStorage.getItem('folio-draft') || '';
  document.body.classList.toggle('light', (localStorage.getItem('folio-theme') || 'dark') === 'light');
} catch {}
edited(); renderTerms(); renderHistory();
source.oninput = edited;
source.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); rewrite(); remember(); } };
['live', 'preserve', 'random'].forEach(id => $(id).onchange = () => { if ($('live').checked) rewrite(); });
$('rewrite').onclick = () => { rewrite(); remember(); status('Message rewritten.'); };
$('copy').onclick = async () => {
  rewrite();
  try { await navigator.clipboard.writeText(result.value); remember(); status('Copied.'); }
  catch { result.focus(); result.select(); status('Use your device copy action to copy the selected text.'); }
};
$('paste').onclick = async () => {
  try { source.value = await navigator.clipboard.readText(); edited(); }
  catch { source.focus(); status('Paste directly into Your message.'); }
};
$('clear').onclick = () => { source.value = ''; edited(); source.focus(); };
$('download').onclick = () => {
  rewrite();
  const a = document.createElement('a'), url = URL.createObjectURL(new Blob([result.value], {type: 'text/plain;charset=utf-8'}));
  a.href = url; a.download = 'fiverrtask-message.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('add').onclick = () => {
  const k = $('keyword').value.trim().toLowerCase();
  if (!k) return;
  if (all().includes(k)) { status('Keyword already exists.'); return; }
  custom.push(k); save('folio-keywords', custom); $('keyword').value = ''; renderTerms(); edited();
};
$('reset').onclick = () => { custom = []; save('folio-keywords', custom); renderTerms(); edited(); };
$('theme').onclick = () => {
  document.body.classList.toggle('light');
  try { localStorage.setItem('folio-theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch {}
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptEvent = e; });
$('install').onclick = async () => { if (promptEvent) { await promptEvent.prompt(); promptEvent = null; } else $('install-help').showModal(); };
$('close-help').onclick = () => $('install-help').close();
$('online').onclick = e => { if (!navigator.onLine) { e.preventDefault(); status('Connect to the internet to open Projects and your online workspace.'); } };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
