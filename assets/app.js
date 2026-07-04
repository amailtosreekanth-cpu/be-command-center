/* ═══════════════════════════════════════════
   BROKEN ENGLISH — COMMAND CENTER APP
   ═══════════════════════════════════════════ */

/* ── CONFIG ── */
const USERS = {
  sreekanth: { pass: 'iamironman', name: 'Sreekanth', role: 'CEO · Omega Access',    photo: 'photos/sreekanth.jpg' },
  jazeel:    { pass: 'leezaj',    name: 'Jazeel',    role: 'Finance · Strategic',     photo: 'photos/jazeel.jpg'    },
  hasnu:     { pass: 'unsah',     name: 'Hasnu',     role: 'Sales · Alpha Access',    photo: 'photos/hasnu.jpg'     },
};

let currentUser = null;
let jarvisOn    = false;
let recognition = null;

/* ══ LOGIN ══ */
function doLogin() {
  const u   = document.getElementById('lu').value.trim().toLowerCase();
  const p   = document.getElementById('lp').value.trim();
  const usr = USERS[u];
  if (!usr || usr.pass !== p) {
    const el = document.getElementById('lerr');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
    return;
  }
  currentUser = usr;
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display   = 'flex';
  bootApp(usr);
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

function bootApp(u) {
  const h = new Date().getHours();
  document.getElementById('tb-timepart').textContent = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  document.getElementById('tb-name').textContent     = u.name;
  document.getElementById('sb-username').textContent  = u.name;
  document.getElementById('sb-userrole').textContent  = u.role;
  document.getElementById('jov-username').textContent = u.name;

  const av = document.getElementById('sb-avatar');
  av.src = u.photo;
  av.onerror = () => av.style.display = 'none';

  startClock();
  buildSparklines();
  init3DTilt();

  /* boot canvas effects */
  BEParticles.init('particle-canvas');
  BEGlobe.init('globe-canvas', 295, 295);
}

function doLogout() {
  currentUser = null;
  document.getElementById('app').style.display   = 'none';
  document.getElementById('login').style.display = 'flex';
  document.getElementById('lu').value = '';
  document.getElementById('lp').value = '';
}

/* ══ CLOCK ══ */
function startClock() {
  const tick = () => {
    const n = new Date();
    document.getElementById('tb-clock').textContent =
      n.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) +
      ' · ' +
      n.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  tick();
  setInterval(tick, 1000);
}

/* ══ NAVIGATION ══ */
function showPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');
  /* sidebar highlight */
  const MAP = { home: 0, founder: 1, mission: 2, academics: 4, sales: 5, media: 6, projects: 7, team: 8 };
  const btns = document.querySelectorAll('.nav-item');
  if (name in MAP && btns[MAP[name]]) btns[MAP[name]].classList.add('active');
}

/* ══ SPARKLINES ══ */
function buildSparklines() {
  const COLORS = ['#FF005D', '#00FF88', '#00B8FF', '#FFC400', '#B95CFF'];
  const DATA = [
    [35, 50, 42, 68, 58, 82, 100],
    [30, 45, 55, 50, 72, 78, 100],
    [55, 65, 62, 78, 72, 88, 100],
    [78, 88, 82, 94, 72, 100, 84],
    [68, 72, 70, 78, 80, 84, 100],
  ];
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById('spk' + i);
    if (!el) continue;
    DATA[i].forEach(v => {
      const b = document.createElement('div');
      b.className     = 'spk-bar';
      b.style.height  = v + '%';
      b.style.background   = COLORS[i];
      b.style.boxShadow    = `0 0 4px ${COLORS[i]}99`;
      el.appendChild(b);
    });
  }

  /* revenue sparkline in war room */
  const rev = document.getElementById('rev-sparkline');
  if (rev) {
    [22, 35, 42, 38, 55, 64, 78, 100].forEach(v => {
      const b = document.createElement('div');
      Object.assign(b.style, {
        flex: '1', height: v + '%', borderRadius: '2px 2px 0 0',
        background: '#FFC400', opacity: '.85', boxShadow: '0 0 5px rgba(255,196,0,.5)',
      });
      rev.appendChild(b);
    });
  }
}

/* ══ 3D CARD TILT ══ */
function init3DTilt() {
  document.querySelectorAll('.cmd-panel').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transition = 'transform .08s ease';
      card.style.transform  = `perspective(650px) rotateY(${x * 15}deg) rotateX(${-y * 11}deg) translateY(-7px) scale(1.025)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .45s cubic-bezier(.34,1.56,.64,1)';
      card.style.transform  = 'perspective(650px) rotateY(0deg) rotateX(0deg) translateY(0) scale(1)';
    });
  });
}

/* ══ JARVIS ══ */
const JARVIS_CMDS = {
  'home':             () => { showPage('home');     speak('Opening Mission Control.');           closeJarvis(); },
  'mission control':  () => { showPage('home');     speak('Opening Mission Control.');           closeJarvis(); },
  'academics':        () => { showPage('academics');speak('Opening Academics Command Center.');  closeJarvis(); },
  'sales':            () => { showPage('sales');    speak('Opening Sales Command Center.');      closeJarvis(); },
  'media':            () => { showPage('media');    speak('Opening Media Command Center.');      closeJarvis(); },
  'projects':         () => { showPage('projects'); speak('Opening Projects Command Center.');   closeJarvis(); },
  'mission':          () => { showPage('mission');  speak('Opening Mission Progress Center.');   closeJarvis(); },
  'mission progress': () => { showPage('mission');  speak('Opening Mission Progress Center.');   closeJarvis(); },
  'founder':          () => { showPage('founder');  speak('Opening Founder Command Deck.');      closeJarvis(); },
  'team':             () => { showPage('team');     speak('Opening the Team directory.');        closeJarvis(); },
  'close':            closeJarvis,
  'dismiss':          closeJarvis,
  'sign out':         () => { closeJarvis(); setTimeout(doLogout, 700); speak('Signing you out, see you soon.'); },
};

function openJarvis() {
  jarvisOn = true;
  document.getElementById('jarvis-overlay').classList.add('open');
  document.getElementById('jov-transcript').textContent  = '';
  document.getElementById('jov-response').textContent    = 'Waiting for your command...';
  document.getElementById('jov-listen-text').textContent = 'Listening...';
  startVoice();
  speak('Yes? How can I help you' + (currentUser ? ', ' + currentUser.name : '') + '?');
}

function closeJarvis() {
  jarvisOn = false;
  document.getElementById('jarvis-overlay').classList.remove('open');
  if (recognition) { try { recognition.stop(); } catch (e) {} }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function speak(text) {
  document.getElementById('jov-response').textContent = text;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt   = new SpeechSynthesisUtterance(text);
    utt.rate    = 0.93;
    utt.pitch   = 0.88;
    utt.volume  = 1;
    window.speechSynthesis.speak(utt);
  }
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { speak('Voice recognition requires Chrome browser.'); return; }

  recognition = new SR();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.lang           = 'en-IN';

  recognition.onresult = e => {
    let finalText = '', interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText   += e.results[i][0].transcript;
      else                      interimText += e.results[i][0].transcript;
    }
    document.getElementById('jov-transcript').textContent = finalText || interimText;

    if (finalText) {
      const cmd = finalText.toLowerCase().trim();
      let matched = false;
      for (const key of Object.keys(JARVIS_CMDS)) {
        if (cmd.includes(key)) { JARVIS_CMDS[key](); matched = true; break; }
      }
      if (!matched) speak('I heard: ' + finalText + '. Try saying a section name like "sales" or "media".');
    }
  };

  recognition.onend  = () => { if (jarvisOn && recognition) { try { recognition.start(); } catch (e) {} } };
  recognition.onerror = e => { document.getElementById('jov-listen-text').textContent = 'Error: ' + e.error; };
  try { recognition.start(); } catch (e) {}
}

/* double-click anywhere to open JARVIS */
document.addEventListener('dblclick', () => {
  if (document.getElementById('app').style.display === 'none') return;
  if (!document.getElementById('jarvis-overlay').classList.contains('open')) openJarvis();
});
