const rOrder = ['Doctor', 'Mafia', 'Maniac', 'Detective'];
const rD = {
    Citizen: { n: 'Мирный', e: '😊', c: 'tag-Citizen' },
    Mafia: { n: 'Мафия', e: '👺', c: 'tag-Mafia' },
    Detective: { n: 'Комиссар', e: '🕵️‍♂️', c: 'tag-Detective' },
    Doctor: { n: 'Доктор', e: '💊', c: 'tag-Doctor' },
    Maniac: { n: 'Маньяк', e: '🔪', c: 'tag-Maniac' }
};

let ps = [], rs = { Mafia: 1, Maniac: 0, Detective: 1, Doctor: 1 }, 
    activeRs = [], activeNRs = [], curRi = 0, curNi = 0, night = 1, 
    acts = {}, selId = null, isDay = false, tiePs = [], 
    msgCallback = null, lastDocId = null, checkedIds = [], gameLog = [];

function confirmReset() { if (confirm("Сбросить игру?")) location.reload(); }
function showMsg(t, txt, cb) { document.getElementById('next-role-hint').innerText = t; document.getElementById('msg-text').innerHTML = txt; document.getElementById('msg-scr').style.display = 'flex'; msgCallback = cb; }
function closeMsg() { document.getElementById('msg-scr').style.display = 'none'; if (msgCallback) { const t = msgCallback; msgCallback = null; t(); } }

function toggleLog() {
    const el = document.getElementById('log-overlay');
    if (el.style.display === 'block') el.style.display = 'none';
    else {
        document.getElementById('log-list').innerHTML = gameLog.map(i => `<div style="padding:8px 0; border-bottom:1px solid #333; font-size:13px">${i.text}</div>`).join('');
        el.style.display = 'block';
    }
}

function addL(type, text) { gameLog.push({ type, text }); }

function go(n) { 
    document.querySelectorAll('.s').forEach(x => x.classList.remove('a')); 
    document.getElementById('s' + n).classList.add('a'); 
    window.scrollTo(0, 0); 
    if (n === 3) renderS3(); else if (n === 4) renderGame(); else render(); 
    updateHeader(n);
}

function updateHeader(n) {
    const t = { 1:`Игроки (${ps.length})`, 2:"Настройка", 3:"Роли", 4:isDay?(tiePs.length?"Автокатастрофа":`День ${night}`):`Ночь ${night}`, 5:"Итоги" };
    document.getElementById('main-title').innerText = t[n] || "Мафия";
}

function addP() { ps.push({ n: '', r: 'Citizen', out: false, v: 0 }); render(); }
function delP(i) { ps.splice(i, 1); render(); }

function render() {
    const l1 = document.getElementById('l1'), lp = document.getElementById('lp');
    if (l1 && document.getElementById('s1').classList.contains('a')) {
        l1.innerHTML = ps.map((p, i) => `<div class="r"><b style="width:20px">${i+1}</b><input value="${p.n}" oninput="ps[${i}].n=this.value" placeholder="Имя"><button class="del-btn" onclick="delP(${i})">✕</button></div>`).join('');
    }
    if (lp && document.getElementById('s2').classList.contains('a')) {
        lp.innerHTML = Object.keys(rs).map(r => `<div class="r"><span>${rD[r].e} ${rD[r].n}</span><div class="v-wrap"><button class="v-btn" onclick="rs['${r}']=Math.max(0,rs['${r}']-1);render()">-</button><div class="v-cnt">${rs[r]}</div><button class="v-btn" onclick="rs['${r}']++;render()">+</button></div></div>`).join('');
        document.getElementById('totalC').innerText = ps.length; 
        document.getElementById('citC').innerText = Math.max(0, ps.length - Object.values(rs).reduce((a,b)=>a+b,0));
    }
}

function checkR() { if (ps.length > 2) { curRi = 0; ps.forEach(p => { p.r = 'Citizen'; p.out = false; p.v = 0; }); activeRs = rOrder.filter(r => rs[r] > 0); go(3); } }

function renderS3() {
    let r = activeRs[curRi]; if(!r) return;
    document.getElementById('roleLimitInfo').innerText = `${rD[r].n}: выберите ${rs[r]} чел.`;
    document.getElementById('l3').innerHTML = ps.map((p, i) => `<div class="r ${p.r===r?'sel':''} ${p.r!=='Citizen'&&p.r!==r?'isOut':''}" onclick="setRole(${i},'${r}')"><b>${i+1}</b> ${p.n||'№'+(i+1)} ${p.r!=='Citizen' ? `<span class="tag ${rD[p.r].c}">${rD[p.r].n}</span>` : ''}</div>`).join('');
}

function setRole(i, r) { 
    if (ps[i].r === r) ps[i].r = 'Citizen'; 
    else if (rs[r] === 1) { ps.forEach(p => { if(p.r === r) p.r = 'Citizen'; }); ps[i].r = r; } 
    else if (ps.filter(p => p.r === r).length < rs[r]) { if (ps[i].r === 'Citizen') ps[i].r = r; } 
    renderS3(); 
}

function nextRS() { 
    if (ps.filter(p => p.r === activeRs[curRi]).length === rs[activeRs[curRi]]) { 
        curRi++; if (curRi >= activeRs.length) showMsg("Готово", "Начинаем игру", () => startNight()); else renderS3(); 
    } 
}

function startNight() { isDay = false; curNi = 0; acts = {}; selId = null; tiePs = []; activeNRs = rOrder.filter(r => rs[r] > 0 && ps.some(p => p.r === r && !p.out)); addL('n', `🌙 Ночь ${night}`); go(4); }

function renderGame() {
    const vS = document.getElementById('voteStat'), nP = document.getElementById('nightStatusPanel'), sB = document.getElementById('skB'), cB = document.getElementById('cfB'), l4 = document.getElementById('l4');
    let aIds = [], cR = null;
    if (!isDay) {
        cR = activeNRs[curNi]; aIds = ps.map((p, i) => (p.r === cR && !p.out) ? i : null).filter(x => x !== null);
        nP.innerHTML = `<div class="actor-card">Ходит: ${rD[cR].n}</div>`;
        cB.style.display = selId !== null ? "flex" : "none"; sB.style.display = selId === null ? "flex" : "none";
    } else {
        nP.innerHTML = ""; let tV = ps.reduce((s, p) => s + p.v, 0), aC = ps.filter(p => !p.out).length;
        vS.innerText = `Голосов: ${tV} / ${aC}`; cB.style.display = tV > 0 ? "flex" : "none";
    }
    l4.innerHTML = ps.map((p, i) => {
        let ex = '', st = '';
        if (!isDay) {
            if (cR === 'Doctor' && i === lastDocId) st = 'locked';
            if (cR === 'Detective' && (checkedIds.includes(i) || aIds.includes(i))) st = 'locked';
        }
        if (p.out || (isDay && tiePs.length > 0 && !tiePs.includes(i))) st = 'isOut';
        return `<div class="r ${st} ${selId === i ? 'sel' : ''}" onclick="${st==='' ? `clickP(${i})` : ''}">
            <b>${i+1}</b> <span>${p.n||'№'+(i+1)}</span> ${checkedIds.includes(i)?'🔍':''}
            <span class="tag ${rD[p.r].c}">${rD[p.r].n}</span>
            ${isDay && !p.out ? `<div class="v-wrap" onclick="event.stopPropagation()"><button class="v-btn" onclick="vote(${i},-1)">-</button><div class="v-cnt">${p.v}</div><button class="v-btn" onclick="vote(${i},1)">+</button></div>` : ''}
        </div>`;
    }).join('');
}

function clickP(i) { if (isDay) return; selId = (selId === i) ? null : i; renderGame(); }
function vote(i, v) { let tV = ps.reduce((s, p) => s + p.v, 0), aC = ps.filter(p => !p.out).length; if (v > 0 && tV < aC) ps[i].v++; if (v < 0 && ps[i].v > 0) ps[i].v--; renderGame(); }

function checkWin() {
    let a = ps.filter(p => !p.out), ma = a.filter(p => p.r === 'Mafia').length, mn = a.filter(p => p.r === 'Maniac').length, o = a.length - ma; 
    if (ma > 0 && ma >= o) { showWin("Мафия победила!"); return true; }
    if (mn > 0 && ma === 0 && a.length <= 2) { showWin("Маньяк победил!"); return true; }
    if (ma === 0 && mn === 0) { showWin("Город победил!"); return true; }
    return false;
}

function showWin(t) {
    go(5); document.getElementById('finalLogList').innerHTML = gameLog.map(i => `<div>${i.text}</div>`).join('');
    document.getElementById('finalResultsPanel').innerHTML = `<div class="welcome-card" style="text-align:center"><h2>${t}</h2></div>` + ps.map((p, i) => `<div class="r" style="opacity:${p.out?0.4:1}"><b>${i+1}. ${p.n||'№'+(i+1)}</b> <span class="tag ${rD[p.r].c}">${rD[p.r].n}</span></div>`).join('');
}

function doAction(id) {
    if (isDay) {
        let tV = ps.reduce((s, p) => s + p.v, 0);
        if (id === null && tV === 0) { addL('d', `День ${night}: Никто не ушел.`); showMsg("Вечер", "Никто не выбыл", () => { night++; startNight(); }); return; }
        let cand = ps.filter((p, idx) => !p.out && (tiePs.length === 0 || tiePs.includes(idx))), 
            maxV = Math.max(...cand.map(p => p.v)), leaders = cand.filter(p => p.v === maxV);
        if (leaders.length === 1) { 
            let vic = leaders[0]; vic.out = true; addL('d', `День ${night}: Выбыл ${vic.n}`);
            if (!checkWin()) showMsg("Итоги", `${vic.n} покидает город`, () => { night++; startNight(); });
        } else { 
            if (tiePs.length > 0) showMsg("Ничья", "Никто не ушел", () => { night++; startNight(); });
            else { tiePs = leaders.map(p => ps.indexOf(p)); ps.forEach(p => p.v = 0); showMsg("Ничья", "Переголосование", () => renderGame()); } 
        }
    } else {
        const r = activeNRs[curNi]; acts[r] = id; curNi++; selId = null;
        if (curNi >= activeNRs.length) { showMsg("Рассвет", "Все сделали ход", () => endNight()); return; }
        renderGame();
    }
}

function endNight() {
    let killed = [], savedId = acts['Doctor'], nSum = []; lastDocId = savedId;
    if (savedId !== null) nSum.push(`🛡️ Доктор лечил: ${ps[savedId].n}`);
    ['Mafia', 'Maniac'].forEach(role => {
        let target = acts[role];
        if (target !== null && ps[target]) {
            let res = (target === savedId) ? "🛡️ Спасен" : "💀 Убит";
            nSum.push(`${rD[role].e} ${rD[role].n} -> ${ps[target].n} ${res}`);
            if (target !== savedId && !killed.includes(target)) killed.push(target);
        }
    });
    let det = acts['Detective'];
    if (det !== null && ps[det]) {
        let evil = (ps[det].r === 'Mafia' || ps[det].r === 'Maniac');
        nSum.push(`🔍 Проверка: ${ps[det].n} — ${evil ? 'Черный' : 'Красный'}`);
        if (!checkedIds.includes(det)) checkedIds.push(det);
    }
    killed.forEach(idx => { if (ps[idx]) ps[idx].out = true; });
    let mText = killed.length ? `Убиты: ${killed.map(idx => ps[idx].n).join(", ")}` : "Никто не погиб.";
    addL('n', nSum.join('<br>'));
    isDay = true; ps.forEach(p => p.v = 0); tiePs = []; curNi = 0;
    if (!checkWin()) showMsg("Рассвет", mText, () => go(4));
}
