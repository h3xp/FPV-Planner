// ========= Systemdaten =========
// Alle Frequenzen in MHz (Mittenfrequenz), bw = belegte Bandbreite in MHz.
// Jeder Modus hat eine FCC-Kanalliste und optional eine CE-Kanalliste.
// Fehlt `ce`, ist der Modus im CE-Betrieb nicht verfügbar.
const CE_LO = 5725, CE_HI = 5875;          // in der EU nutzbarer Bereich (25 mW)
const FCC_ISM_LO = 5725, FCC_ISM_HI = 5850; // außerhalb → Amateurfunklizenz (USA)
const $ce = document.getElementById('ceBtn');
const $langBtn = document.getElementById('langBtn');

const FLAGS = { de: '🇩🇪', en: '🇬🇧' };

const analogBands = {
  R: [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
  A: [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  B: [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  E: [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
  F: [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
};
function bandChannels(bands, bw) {
  const out = [];
  for (const [b, freqs] of Object.entries(bands))
    freqs.forEach((f, i) => out.push({ id: `${b}${i + 1}`, f, bw }));
  return out;
}
function seq(prefix, freqs, bw) {
  return freqs.map((f, i) => ({ id: `${prefix}${i + 1}`, f, bw }));
}
function ceFilter(channels) {
  return channels.filter(c => c.f - c.bw / 2 >= CE_LO && c.f + c.bw / 2 <= CE_HI);
}

const analogAll = bandChannels(analogBands, 20);
const hdzeroAll = bandChannels({ R: analogBands.R, F: analogBands.F, E: analogBands.E }, 20);

const SYSTEMS = [
  { id: 'analog', name: 'Analog 5.8 GHz', canUnlock: false, hamHint: true,
    modes: [{ id: 'std', name: 'Standard', fcc: analogAll, ce: ceFilter(analogAll) }] },
  { id: 'dji', name: 'DJI O3 / O4 Lite (Goggles 2/3/N3)', canUnlock: true,
    modes: [
      { id: '20', name: '20 MHz', fcc: seq('CH', [5669, 5705, 5768, 5804, 5839, 5876, 5914, 5960], 20), ce: seq('CH', [5768, 5804, 5839, 5876], 20) },
      { id: '40', name: '40 MHz', fcc: seq('CH', [5675, 5755, 5835], 40), ce: seq('CH', [5755, 5835], 40) },
    ]},
  { id: 'dji_o4p', name: 'DJI O4 Pro', canUnlock: true,
    modes: [
      { id: '20', name: '20 MHz', fcc: seq('CH', [5669, 5705, 5768, 5804, 5839, 5876, 5914, 5960], 20), ce: seq('CH', [5768, 5804, 5839, 5876], 20) },
      { id: '40', name: '40 MHz', fcc: seq('CH', [5675, 5755, 5835], 40), ce: seq('CH', [5755, 5835], 40) },
      { id: '60', name: '60 MHz', fcc: seq('CH', [5700, 5830], 60) },
    ]},
  { id: 'walksnail', name: 'Walksnail Avatar', canUnlock: true,
    modes: [
      { id: '20', name: '20 MHz', fcc: seq('CH', [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917], 20), ce: seq('CH', [5732, 5769, 5806, 5843], 20) },
      { id: '40', name: '40 MHz', fcc: seq('CH', [5690, 5770, 5850], 40), ce: seq('CH', [5770, 5850], 40) },
    ]},
  { id: 'hdzero', name: 'HDZero', canUnlock: true, hamHint: true,
    modes: [{ id: 'std', name: 'Standard', fcc: hdzeroAll, ce: ceFilter(hdzeroAll) }] },
];

const COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#fb923c', '#c084fc', '#facc15', '#2dd4bf', '#f87171'];
const MAX_PILOTS = 8;
const GUARD_OK = 15;

const I18N = {
  de: {
    title: 'FPV Frequenzplaner', ceShort: 'CE', infoTitle: 'Hinweise',
    info1: 'Die Reihenfolge der Piloten spielt keine Rolle – es wird die Kombination mit dem größten Mindestabstand gesucht.',
    info2: 'Digitale Systeme (DJI, Walksnail) haben breite Signale und stören Analog stärker als umgekehrt. Bei gemischten Gruppen möglichst wenige Piloten im 40-MHz-Modus.',
    info3: 'Kanalfrequenzen digitaler Systeme sind Näherungswerte und können je nach Firmware/Region abweichen – bei Unsicherheit die Tabelle in app.js anpassen.',
    ceMode: 'CE-Modus (EU: 25 mW, eingeschränkte Kanäle)', subtitle: '5,8 GHz Kanäle für mehrere Piloten ohne Interferenzen',
    pilot: 'Pilot', remove: 'Entfernen', name: 'Name', system: 'System', bandwidth: 'Bandbreite', lock: 'Kanal fixieren (optional)', auto: 'automatisch',
    fccUnlock: 'FCC-Unlock (Gerät kann FCC-Kanäle)', addPilot: '+ Pilot hinzufügen', result: 'Empfohlene Einstellungen',
    thPilot: 'Pilot', thSystem: 'System', thChannel: 'Kanal', thFreq: 'Frequenz',
    ok: '✅ Alle Signale haben ausreichend Abstand.', single: '✅ Nur ein Pilot – freie Kanalwahl.',
    warn: mg => `⚠️ Knapp – kleinster Abstand nur ${mg} MHz. Funktioniert meist, aber möglichst Abstand halten.`,
    bad: '❌ Überlappung – so werden sich Piloten stören. Weniger Piloten, kleinere Bandbreite oder Fixierungen lösen.',
    overlap: mg => `Überlappung um ${mg} MHz`, gap: mg => `nur ${mg} MHz Abstand`,
    imdConflict: (a, b, c) => `⚡ IMD-Konflikt: ${a} ↔ ${b} könnten ${c} stören (Intermodulation 3. Ordnung)`,
    noteR6Avoided: 'ℹ️ R6 wurde bei gemischtem Analog/Digital-Betrieb vermieden, da es mit dem digitalen Public-Channel überlappt.',
    hintCeLocked: 'ℹ️ CE-gelocktes Gerät: sendet mit 25 mW und nur auf CE-Kanälen – geringere Reichweite als FCC-Piloten.',
    noteCe: '🇪🇺 CE-Modus: max. 25 mW, Kanäle auf 5725–5875 MHz beschränkt.',
    noteHam: names => `📻 ${names}: Kanal außerhalb 5725–5850 MHz – in den USA nur mit Amateurfunklizenz erlaubt.`,
    noteWifi: '📡 Bei 2,4‑GHz‑RC (ELRS, Tracer): WLAN/Bluetooth an Goggles, Handy und Laptop ausschalten.',
  },
  en: {
    title: 'FPV Frequency Planner', ceShort: 'CE', infoTitle: 'Notes',
    info1: 'Pilot order does not matter – the app searches for the combination with the largest minimum spacing.',
    info2: 'Digital systems (DJI, Walksnail) use wide signals and disturb analog more than the other way round. In mixed groups, keep as few pilots as possible in 40 MHz mode.',
    info3: 'Channel frequencies of digital systems are approximations and may differ by firmware/region – adjust the table in app.js if in doubt.',
    ceMode: 'CE mode (EU: 25 mW, restricted channels)', subtitle: '5.8 GHz channels for multiple pilots without interference',
    pilot: 'Pilot', remove: 'Remove', name: 'Name', system: 'System', bandwidth: 'Bandwidth', lock: 'Lock channel (optional)', auto: 'automatic',
    fccUnlock: 'FCC unlock (device can use FCC channels)', addPilot: '+ Add pilot', result: 'Recommended settings',
    thPilot: 'Pilot', thSystem: 'System', thChannel: 'Channel', thFreq: 'Frequency',
    ok: '✅ All signals have sufficient spacing.', single: '✅ Only one pilot – any channel works.',
    warn: mg => `⚠️ Tight – smallest gap is only ${mg} MHz. Usually works, but keep physical distance.`,
    bad: '❌ Overlap – pilots will interfere. Use fewer pilots, a smaller bandwidth or release locks.',
    overlap: mg => `overlap of ${mg} MHz`, gap: mg => `only ${mg} MHz apart`,
    imdConflict: (a, b, c) => `⚡ IMD conflict: ${a} ↔ ${b} could interfere with ${c} (3rd-order intermodulation)`,
    noteR6Avoided: 'ℹ️ R6 was avoided in mixed analog/digital operation because it overlaps with the digital public channel.',
    hintCeLocked: 'ℹ️ CE-locked device: transmits at 25 mW on CE channels only – less range than FCC pilots.',
    noteCe: '🇪🇺 CE mode: max. 25 mW, channels limited to 5725–5875 MHz.',
    noteHam: names => `📻 ${names}: channel outside 5725–5850 MHz – requires a ham licence in the US.`,
    noteWifi: '📡 With 2.4 GHz RC (ELRS, Tracer): turn off Wi‑Fi/Bluetooth on goggles, phone and laptop.',
  },
};

let lang = localStorage.getItem('fpv-lang') || (navigator.language.startsWith('de') ? 'de' : 'en');
function t(key, ...args) { const v = I18N[lang][key] ?? I18N.de[key] ?? key; return typeof v === 'function' ? v(...args) : v; }

let ceMode = localStorage.getItem('fpv-ce') === '1';
let pilots = JSON.parse(localStorage.getItem('fpv-pilots') || 'null') ||
  [{ name: 'Pilot 1', system: 'dji', mode: '20', lock: '', fcc: true }];
pilots.forEach(p => { if (p.fcc === undefined) p.fcc = true; delete p.rc; });

function save() {
  localStorage.setItem('fpv-pilots', JSON.stringify(pilots));
  localStorage.setItem('fpv-ce', ceMode ? '1' : '0');
  localStorage.setItem('fpv-lang', lang);
}

const sysById = id => SYSTEMS.find(s => s.id === id);

function regionOf(p) {
  const s = sysById(p.system);
  if (ceMode) return 'ce';
  if (!s.canUnlock) return 'fcc';
  return p.fcc ? 'fcc' : 'ce';
}
function modesFor(p) { const r = regionOf(p); return sysById(p.system).modes.filter(m => m[r] && m[r].length); }
function modeOf(p) { const ms = modesFor(p); return ms.find(m => m.id === p.mode) || ms[0]; }
function channelsOf(p) { return modeOf(p)[regionOf(p)]; }
function normalize(p) {
  const m = modeOf(p);
  if (!m) return;
  p.mode = m.id;
  if (p.lock && !channelsOf(p).some(c => c.id === p.lock)) p.lock = '';
}

function margin(a, b) { return Math.abs(a.f - b.f) - (a.bw + b.bw) / 2; }

function imdConflictsFor(assign) {
  const conflicts = [];
  for (let i = 0; i < assign.length; i++) {
    if (pilots[i].system !== 'analog') continue;
    for (let j = i + 1; j < assign.length; j++) {
      if (pilots[j].system !== 'analog') continue;
      const products = [2 * assign[i].f - assign[j].f, 2 * assign[j].f - assign[i].f];
      for (let k = 0; k < assign.length; k++) {
        if (k === i || k === j || pilots[k].system !== 'analog') continue;
        const tolerance = assign[k].bw / 2 + 5;
        products.forEach(product => {
          if (Math.abs(product - assign[k].f) <= tolerance)
            conflicts.push({ i, j, k, product });
        });
      }
    }
  }
  return conflicts;
}

function solve() {
  const mixed = pilots.some(p => p.system === 'analog') && pilots.some(p => p.system !== 'analog');
  const options = pilots.map(p => {
    const chans = channelsOf(p);
    const locked = chans.find(c => c.id === p.lock);
    return locked ? [locked] : chans;
  });
  let best = null, bestImd = Infinity, bestR6 = Infinity, bestMin = -Infinity, bestSum = -Infinity;
  const cur = [];
  function rec(i, curImd, curR6, curMin, curSum) {
    if (best && curImd > bestImd) return;
    if (best && curImd === bestImd && curR6 > bestR6) return;
    if (best && curImd === bestImd && curR6 === bestR6 && curMin < bestMin) return;
    if (i === pilots.length) {
      if (!best || curImd < bestImd ||
          (curImd === bestImd && (curR6 < bestR6 ||
          (curR6 === bestR6 && (curMin > bestMin ||
          (curMin === bestMin && curSum > bestSum)))))) {
        best = [...cur]; bestImd = curImd; bestR6 = curR6; bestMin = curMin; bestSum = curSum;
      }
      return;
    }
    for (const ch of options[i]) {
      let mn = curMin, sm = curSum;
      for (let j = 0; j < i; j++) {
        const mg = margin(ch, cur[j]);
        mn = Math.min(mn, mg); sm += mg;
      }
      const next = [...cur, ch];
      const imd = imdConflictsFor(next).length;
      const r6 = curR6 + (mixed && pilots[i].system === 'analog' && ch.id === 'R6' ? 1 : 0);
      if (best && imd > bestImd) continue;
      if (best && imd === bestImd && r6 > bestR6) continue;
      if (best && imd === bestImd && r6 === bestR6 && mn < bestMin) continue;
      cur.push(ch); rec(i + 1, imd, r6, mn, sm); cur.pop();
    }
  }
  rec(0, 0, 0, Infinity, 0);
  const assign = best || [];
  return {
    assign,
    imdConflicts: assign.length ? imdConflictsFor(assign) : [],
    r6Avoided: mixed && assign.every((ch, i) => pilots[i].system !== 'analog' || ch.id !== 'R6'),
  };
}

const $pilots = document.getElementById('pilots');
const $result = document.getElementById('result');
const $add = document.getElementById('addPilot');

function applyStaticI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  $add.textContent = t('addPilot');
  if ($langBtn) $langBtn.textContent = FLAGS[lang];
  if ($ce) { $ce.classList.toggle('active', ceMode); $ce.setAttribute('aria-pressed', String(ceMode)); }
}

function renderPilots() {
  $pilots.innerHTML = pilots.map((p, i) => {
    const sys = sysById(p.system);
    const modes = modesFor(p);
    const mode = modeOf(p);
    const chans = channelsOf(p);
    const region = regionOf(p);
    const hints = [];
    if (!ceMode && sys.canUnlock && !p.fcc) hints.push(t('hintCeLocked'));
    return `
    <div class="card pilot" data-i="${i}">
      <div class="full">
        <span class="color" style="background:${COLORS[i]}"></span>
        <strong>${t('pilot')} ${i + 1}</strong>
        <span class="region-tag">${region.toUpperCase()}</span>
        ${pilots.length > 1 ? `<button class="del" data-act="del">${t('remove')}</button>` : ''}
      </div>
      <label>${t('name')}<input data-field="name" value="${escapeHtml(p.name)}" placeholder="${t('name')}"></label>
      <label>${t('system')}<select data-field="system">${SYSTEMS.map(s => `<option value="${s.id}" ${s.id === p.system ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
      ${modes.length > 1 ? `<label>${t('bandwidth')}<select data-field="mode">${modes.map(m => `<option value="${m.id}" ${m.id === mode.id ? 'selected' : ''}>${m.name}</option>`).join('')}</select></label>` : ''}
      <label>${t('lock')}<select data-field="lock"><option value="">${t('auto')}</option>${chans.map(c => `<option value="${c.id}" ${c.id === p.lock ? 'selected' : ''}>${c.id} – ${c.f} MHz</option>`).join('')}</select></label>
      ${sys.canUnlock && !ceMode ? `<label class="check full"><input type="checkbox" data-field="fcc" ${p.fcc ? 'checked' : ''}><span>${t('fccUnlock')}</span></label>` : ''}
      ${hints.length ? `<div class="full hints">${hints.map(h => `<p class="hint">${h}</p>`).join('')}</div>` : ''}
    </div>`;
  }).join('');
  $add.disabled = pilots.length >= MAX_PILOTS;
}

function renderResult() {
  const solution = solve();
  const assign = solution.assign;
  if (!assign.length) { $result.innerHTML = ''; return; }
  let worst = Infinity; const conflicts = [];
  for (let i = 0; i < assign.length; i++)
    for (let j = i + 1; j < assign.length; j++) {
      const mg = margin(assign[i], assign[j]);
      worst = Math.min(worst, mg);
      if (mg < GUARD_OK) conflicts.push({ i, j, mg });
    }
  let statusCls = 'ok', statusTxt = t('ok');
  if (pilots.length > 1 && worst < 0) { statusCls = 'bad'; statusTxt = t('bad'); }
  else if (pilots.length > 1 && worst < GUARD_OK) { statusCls = 'warn'; statusTxt = t('warn', worst); }
  if (pilots.length === 1) statusTxt = t('single');
  const notes = [];
  if (ceMode) notes.push(t('noteCe'));
  if (solution.r6Avoided) notes.push(t('noteR6Avoided'));
  const hamPilots = pilots.filter((p, i) => {
    const c = assign[i];
    return !ceMode && sysById(p.system).hamHint && (c.f - c.bw / 2 < FCC_ISM_LO || c.f + c.bw / 2 > FCC_ISM_HI);
  });
  if (hamPilots.length) notes.push(t('noteHam', hamPilots.map(p => escapeHtml(p.name)).join(', ')));
  notes.push(t('noteWifi'));
  const lo = 5630, hi = 5980, span = hi - lo;
  const ticks = [5650, 5700, 5750, 5800, 5850, 5900, 5950];
  const ceShade = ceMode ? `<div class="ce-zone" style="left:${((CE_LO - lo) / span) * 100}%;width:${((CE_HI - CE_LO) / span) * 100}%"></div>` : '';
  const bands = assign.map((c, i) => {
    const left = ((c.f - c.bw / 2 - lo) / span) * 100;
    const width = (c.bw / span) * 100;
    return `<div class="band" style="left:${left}%;width:${width}%;background:${COLORS[i]}" title="${escapeHtml(pilots[i].name)}: ${c.f} MHz">${c.id}</div>`;
  }).join('');
  const tickHtml = ticks.map(tk => `<div class="tick" style="left:${((tk - lo) / span) * 100}%">${tk}</div>`).join('');
  const rows = assign.map((c, i) => {
    const p = pilots[i], s = sysById(p.system);
    const sysName = s.name.split(' (')[0] + (modesFor(p).length > 1 ? ' ' + modeOf(p).name : '');
    return `<tr><td><span class="dot" style="background:${COLORS[i]}"></span>${escapeHtml(p.name || `${t('pilot')} ${i + 1}`)}</td><td>${sysName} <small>(${regionOf(p).toUpperCase()})</small></td><td class="ch">${c.id}${p.lock ? ' 🔒' : ''}</td><td>${c.f} MHz</td></tr>`;
  }).join('');
  const conflictHtml = conflicts.length ? `<ul class="conflicts">${conflicts.map(k => `<li style="color:${k.mg < 0 ? 'var(--bad)' : 'var(--warn)'}">${escapeHtml(pilots[k.i].name)} ↔ ${escapeHtml(pilots[k.j].name)}: ${k.mg < 0 ? t('overlap', -k.mg) : t('gap', k.mg)}</li>`).join('')}</ul>` : '';
  const imdHtml = solution.imdConflicts.length ? `<ul class="conflicts imd-conflicts">${solution.imdConflicts.map(k => `<li style="color:var(--bad)">${t('imdConflict', escapeHtml(pilots[k.i].name), escapeHtml(pilots[k.j].name), escapeHtml(pilots[k.k].name))}</li>`).join('')}</ul>` : '';
  $result.innerHTML = `<div class="card"><h2>${t('result')}</h2><div class="status ${statusCls}">${statusTxt}</div><table><thead><tr><th>${t('thPilot')}</th><th>${t('thSystem')}</th><th>${t('thChannel')}</th><th>${t('thFreq')}</th></tr></thead><tbody>${rows}</tbody></table><div class="spectrum">${ceShade}${bands}${tickHtml}</div>${conflictHtml}${imdHtml}${notes.length ? `<div class="notes">${notes.map(n => `<p class="hint">${n}</p>`).join('')}</div>` : ''}</div>`;
}

function render() { pilots.forEach(normalize); applyStaticI18n(); renderPilots(); renderResult(); save(); }

if ($ce) $ce.addEventListener('click', () => { ceMode = !ceMode; render(); });
if ($langBtn) $langBtn.addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('fpv-lang', lang); render(); });
$add.addEventListener('click', () => { if (pilots.length >= MAX_PILOTS) return; pilots.push({ name: `Pilot ${pilots.length + 1}`, system: 'analog', mode: 'std', lock: '', fcc: true }); render(); });
$pilots.addEventListener('input', e => { if (e.target.dataset.field !== 'name') return; pilots[e.target.closest('.pilot').dataset.i].name = e.target.value; renderResult(); save(); });
$pilots.addEventListener('change', e => {
  const i = e.target.closest('.pilot').dataset.i;
  const field = e.target.dataset.field;
  if (!field || field === 'name') return;
  const p = pilots[i];
  if (field === 'fcc') p.fcc = e.target.checked; else p[field] = e.target.value;
  if (field === 'system') { p.mode = sysById(p.system).modes[0].id; p.lock = ''; }
  if (field === 'mode') p.lock = '';
  render();
});
$pilots.addEventListener('click', e => { if (e.target.dataset.act !== 'del') return; pilots.splice(e.target.closest('.pilot').dataset.i, 1); render(); });
function escapeHtml(s) { const div = document.createElement('div'); div.textContent = String(s); return div.innerHTML; }
render();
