import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

export function initializeExperience(){
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = true;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- gamme pentatonique : toutes les notes sonnent bien ensemble ---------- */
  var NOTES = [
    { n:'la',  o:3, f:220.00 }, { n:'do',  o:4, f:261.63 }, { n:'ré',  o:4, f:293.66 },
    { n:'mi',  o:4, f:329.63 }, { n:'sol', o:4, f:392.00 }, { n:'la',  o:4, f:440.00 },
    { n:'do',  o:5, f:523.25 }, { n:'ré',  o:5, f:587.33 }
  ];
  var A = 432;                                   // diapason : 432 par défaut, 440 en option
  function freq(i){ return NOTES[i].f * A / 440; }
  function label(i){ var x = NOTES[i]; return x.n + x.o + '  ' + freq(i).toFixed(1).replace('.0','').replace('.', ',') + ' Hz'; }
  var labelEls = [];                             // [élément, indexNote] à mettre à jour

  /* ---------- son (Web Audio, coupé par défaut) ---------- */
  var ctx = null, bus = null, soundOn = false, audioResume = null;
  var btn = document.getElementById('sound'), btnLabel = document.getElementById('soundLabel');
  function initAudio(){
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    bus = ctx.createGain(); bus.gain.value = .55;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    var dl = ctx.createDelay(); dl.delayTime.value = .31;
    var fb = ctx.createGain(); fb.gain.value = .3;
    var wet = ctx.createGain(); wet.gain.value = .22;
    bus.connect(lp); lp.connect(ctx.destination);
    lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(ctx.destination);
    return true;
  }
  function resumeAudio(){
    if (!ctx || ctx.state === 'running') return Promise.resolve(!!ctx);
    if (audioResume) return audioResume;
    try {
      audioResume = ctx.resume().then(function(){ return ctx.state === 'running'; }).catch(function(error){
        console.error('Impossible de réactiver le son.', error);
        return false;
      }).then(function(running){ audioResume = null; return running; });
    } catch (error) {
      console.error('Impossible de réactiver le son.', error);
      return Promise.resolve(false);
    }
    return audioResume;
  }
  btn.addEventListener('click', function(){
    if (!ctx && !initAudio()) return;
    soundOn = !soundOn;
    btn.setAttribute('aria-pressed', soundOn);
    btn.setAttribute('aria-label', soundOn ? 'Couper le son' : 'Activer le son');
    btnLabel.textContent = soundOn ? 'on' : 'off';
    if (soundOn) pluckHero(R - 1, .5, .5);
  });
  var soundVisibilityFrame = 0;
  function updateSoundVisibility(){
    soundVisibilityFrame = 0;
    if (!matchMedia('(max-width: 720px)').matches){ btn.classList.remove('is-obscured'); return; }
    if (btn.matches(':focus-visible')){ btn.classList.remove('is-obscured'); return; }
    var r = btn.getBoundingClientRect(), coveredByText = false;
    [0.2, 0.5, 0.8].some(function(x){
      return [0.25, 0.5, 0.75].some(function(y){
        var stack = document.elementsFromPoint(r.left + r.width * x, r.top + r.height * y);
        coveredByText = stack.some(function(node){
          if (node === btn || btn.contains(node)) return false;
          var text = node.closest('p,h1,h2,h3,h4,h5,h6,a,button,li,summary,blockquote,label');
          return !!text && text !== btn && !btn.contains(text);
        });
        return coveredByText;
      });
    });
    btn.classList.toggle('is-obscured', coveredByText);
  }
  function scheduleSoundVisibility(){
    if (!soundVisibilityFrame) soundVisibilityFrame = requestAnimationFrame(updateSoundVisibility);
  }
  addEventListener('scroll', scheduleSoundVisibility, { passive: true });
  addEventListener('resize', scheduleSoundVisibility);
  btn.addEventListener('focus', scheduleSoundVisibility);
  btn.addEventListener('blur', scheduleSoundVisibility);
  scheduleSoundVisibility();
  var lastPlay = {};
  function play(i, vel){
    if (!soundOn || !ctx) return;
    if (ctx.state !== 'running'){
      resumeAudio().then(function(running){ if (running && soundOn) play(i, vel); });
      return;
    }
    var now = performance.now(); if (lastPlay[i] && now - lastPlay[i] < 90) return; lastPlay[i] = now;
    var f = freq(i), t = ctx.currentTime, g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.16 * Math.min(1, .35 + vel), t + .006);
    g.gain.exponentialRampToValueAtTime(.0001, t + 2.4);
    [[1,'sine',1],[2,'sine',.28],[3,'triangle',.08],[1.003,'sine',.4]].forEach(function(h){
      var o = ctx.createOscillator(), og = ctx.createGain();
      o.type = h[1]; o.frequency.value = f * h[0]; og.gain.value = h[2];
      o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.5);
    });
    g.connect(bus);
  }

  /* ---------- une corde : pincement réaliste (modes de Fourier) + houle ambiante ---------- */
  function Str(path, base, noteIdx, opts){
    this.path = path; this.base = base; this.note = noteIdx;
    this.max = opts.max; this.N = opts.N || 120; this.ambient = !!opts.ambient;
    this.k = opts.k || 1.5; this.off = opts.off || 0;
    this.plucks = []; this.onHot = opts.onHot;

  }
  Str.prototype.pluck = function(p, a){
    p = Math.min(.95, Math.max(.05, p));
    this.plucks.push({ p:p, a:Math.min(1, a), t0:performance.now() });
    if (this.plucks.length > 3) this.plucks.shift();
    play(this.note, a);
    setOut(this.note);
  };
  Str.prototype.energy = function(now){
    var e = 0;
    for (var j = 0; j < this.plucks.length; j++){ var q = this.plucks[j]; e += q.a * Math.exp(-(now - q.t0) / 1000 * 1.6); }
    return e;
  };
  Str.prototype.draw = function(now, amb, noise, phase){
    this.plucks = this.plucks.filter(function(q){ return (now - q.t0) < 4500; });
    var e = this.energy(now);
    if (this.onHot) this.onHot(e > .06);
    if (!this.ambient && e < .002 && this.idle) return;
    this.idle = !this.ambient && e < .002;
    var d = '', N = this.N;
    for (var i = 0; i <= N; i++){
      var x = i / N, y = 0;
      if (this.ambient){
        var env = Math.sin(Math.PI * x);
        y += amb * env * (Math.sin(x * this.k * 6.283 - phase + this.off) * (1 - noise * .5)
             + Math.sin(x * this.k * 4.3 * 6.283 + phase * 1.2 + this.off) * noise * .3);
      }
      for (var j = 0; j < this.plucks.length; j++){
        var om = freq(this.note) / 220 * 13;   // vitesse visuelle liée à la vraie fréquence
        var q = this.plucks[j], tau = (now - q.t0) / 1000, s = 0;
        for (var n = 1; n <= 7; n++){
          var c = 2 * Math.sin(n * Math.PI * q.p) / (n * n * Math.PI * Math.PI * q.p * (1 - q.p));
          s += c * Math.sin(n * Math.PI * x) * Math.cos(n * om * tau) * Math.exp(-tau * (1.4 + n * .5));
        }
        y += s * q.a * this.max;
      }
      d += (i ? 'L' : 'M') + (x * 1000).toFixed(1) + ' ' + (this.base + y).toFixed(2);
    }
    this.path.setAttribute('d', d);
  };

  /* ---------- les montagnes qui sonnent ---------- */
  var harp = document.getElementById('harp'), hsvg = harp.querySelector('svg');
  var pingLabel = document.getElementById('pingLabel'), pingTimer = null;
  function showPing(xFrac, yVB, ms){
    var rc = hsvg.getBoundingClientRect();
    pingLabel.style.left = (xFrac * rc.width) + 'px';
    pingLabel.style.top = (yVB / VBH * rc.height) + 'px';
    pingLabel.textContent = ms.toFixed(1).replace('.', ',') + ' ms';
    pingLabel.style.opacity = 1;
    clearTimeout(pingTimer);
    pingTimer = setTimeout(function(){ pingLabel.style.opacity = 0; }, 850);
  }
  var R = 7, NP = 160, VBH = 400;

  function hex(c){ return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)]; }
  function mix(a, b, t){ a = hex(a); b = hex(b); return 'rgb(' + a.map(function(v, i){ return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function noteAt(x){ return Math.max(0, Math.min(7, Math.floor(x * 8))); }   // de gauche (grave) à droite (aigu)

  function Ridge(r){
    this.r = r; this.depth = r / (R - 1);                 // 0 = lointain, 1 = premier plan
    this.floor = 135 + r * 38;                            // ligne de base de la crête
    this.H = 55 + r * 16;                                 // les plans proches sont plus hauts
    this.grow = (reduce || !hasGsap) ? 1 : 0;                         // pour l'apparition
    this.seed = [Math.random(), Math.random(), Math.random()];
    this.k1 = 2.6 - this.depth * 1.3 + Math.random() * .3;   // nombre d'ondulations sur la largeur
    this.k2 = .45 + Math.random() * .4;
    this.speed = .55 + (1 - this.depth) * .35 + Math.random() * .15;
    this.plucks = []; this.near = 0; this.nearS = 0; this.lastHit = 0;
    this.ys = new Float32Array(NP + 1);
    this.g = document.createElementNS(SVGNS, 'g'); hsvg.appendChild(this.g);
    this.fill = document.createElementNS(SVGNS, 'path');
    var gid = 'rg' + r, lg = document.createElementNS(SVGNS, 'linearGradient');
    lg.setAttribute('id', gid); lg.setAttribute('gradientUnits', 'userSpaceOnUse');
    lg.setAttribute('x1', 0); lg.setAttribute('x2', 0);
    lg.setAttribute('y1', this.floor - this.H * 1.1); lg.setAttribute('y2', this.floor + 60);
    var base = mix('#3F2466', '#12001F', Math.pow(this.depth, .8));
    var top = mix('#6E4E98', '#241040', Math.pow(this.depth, .7));
    lg.innerHTML = '<stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + base + '"/>';
    hsvg.querySelector('defs').appendChild(lg);
    this.fill.setAttribute('fill', 'url(#' + gid + ')');
    this.crest = document.createElementNS(SVGNS, 'path'); this.crest.setAttribute('class', 'crest');
    this.ringP = document.createElementNS(SVGNS, 'path'); this.ringP.setAttribute('class', 'ring');
    this.g.appendChild(this.fill);
    this.etches = [];
    for (var ei = 0; ei < 4; ei++){
      var ep = document.createElementNS(SVGNS, 'path'); ep.setAttribute('class', 'etch');
      ep.style.opacity = (.22 - ei * .05) * (.5 + this.depth * .6);
      this.g.appendChild(ep); this.etches.push(ep);
    }
    this.g.appendChild(this.crest); this.g.appendChild(this.ringP);
    this.nodes = [];
    this.nodeXs = [];
    var nCount = 6;
    for (var ni2 = 0; ni2 < nCount; ni2++){
      var nd = document.createElementNS(SVGNS, 'circle'); nd.setAttribute('class', 'node');
      nd.setAttribute('r', (2.2 + this.depth * 1.3).toFixed(1));
      this.g.appendChild(nd); this.nodes.push(nd);
      this.nodeXs.push(.04 + Math.random() * .92);
    }
  }
  Ridge.prototype.pluck = function(x, a){
    var now = performance.now(); if (now - this.lastHit < 70) return; this.lastHit = now;
    this.plucks.push({ x:x, a:Math.min(1, a), t0:now, w:55 + (1 - a) * 45 });
    if (this.plucks.length > 4) this.plucks.shift();
    var ni = noteAt(x); play(ni, a); setOut(ni);
    if (!(now - lastEmit < 140)){ lastEmit = now; emit(Math.min(1, .4 + a), x * 1000, this.crestAt(x)); }
    showPing(x, this.crestAt(x), 8 + (1 - a) * 18 + Math.random() * 4);
  };
  Ridge.prototype.energy = function(now){
    var e = 0;
    for (var j = 0; j < this.plucks.length; j++){ var q = this.plucks[j]; e += q.a * Math.exp(-(now - q.t0) / 1000 * 1.1); }
    return e;
  };
  Ridge.prototype.crestAt = function(x){ return this.ys[Math.max(0, Math.min(NP, Math.round(x * NP)))]; };
  Ridge.prototype.draw = function(now, amb, noise, phase){
    this.plucks = this.plucks.filter(function(q){ return now - q.t0 < 5000; });
    var S = this.seed, H = this.H * this.grow * (1 + amb * .25), d = '';
    for (var i = 0; i <= NP; i++){
      var x = i / NP, X = x * 1000;
      // houle : une onde porteuse qui se propage, modulée par une onde plus lente,
      // chaque plan ayant sa longueur d'onde (plus courte au loin, plus ample devant)
      var tt = phase * this.speed;
      var carrier = Math.sin(6.283 * (x * this.k1 + S[0]) - tt);
      var swell = .6 + .4 * Math.sin(6.283 * (x * this.k2 + S[1]) - tt * .45);
      var sh = .5 + .5 * carrier * swell;
      sh = .15 + .85 * sh;
      // harmonique « bruit » qui s'efface au fil du scroll : le signal devient pur
      sh += .06 * Math.sin(6.283 * (x * this.k1 * 3.1 + S[2]) + tt * 1.7) * noise;
      sh *= (1 + amb * .35);
      var y = this.floor - H * sh;
      // le son soulève la montagne : une bosse qui monte, sonne en ondes, puis retombe
      for (var j = 0; j < this.plucks.length; j++){
        var q = this.plucks[j], tau = (now - q.t0) / 1000, dx = X - q.x * 1000;
        var env = Math.exp(-(dx * dx) / (q.w * q.w * (1 + tau * 2.5)));
        var om = freq(noteAt(q.x)) / 220 * 9;
        var swell = (1 - Math.exp(-tau * 14)) * Math.exp(-tau * .9);
        var ring = Math.cos(Math.abs(dx) * .03 - tau * om) * Math.exp(-tau * 2.2);
        y -= q.a * this.H * .55 * this.grow * env * (swell * .75 + ring * .35);
      }
      this.ys[i] = y;
      d += (i ? 'L' : 'M') + X.toFixed(1) + ' ' + y.toFixed(2);
    }
    this.fill.setAttribute('d', d + 'L1000 ' + VBH + 'L0 ' + VBH + 'Z');
    this.crest.setAttribute('d', d);
    var gap = 7 + this.depth * 9;
    for (var ei = 0; ei < this.etches.length; ei++){
      var off = gap * (ei + 1), ed = '';
      for (var k = 0; k <= NP; k += 2) ed += (k ? 'L' : 'M') + (k / NP * 1000).toFixed(1) + ' ' + (this.ys[k] + off + (this.floor - this.ys[k]) * ei * .06).toFixed(1);
      this.etches[ei].setAttribute('d', ed);
    }
    var last = this.plucks[this.plucks.length - 1], rd = '';
    if (last){
      var span = last.w * 2.6 / 1000, i0 = Math.max(0, Math.floor((last.x - span) * NP)), i1 = Math.min(NP, Math.ceil((last.x + span) * NP));
      for (var k = i0; k <= i1; k++) rd += (k === i0 ? 'M' : 'L') + (k / NP * 1000).toFixed(1) + ' ' + this.ys[k].toFixed(2);
    }
    this.ringP.setAttribute('d', rd || 'M0 0');
    this.nearS += (this.near - this.nearS) * .15;
    var e = Math.min(1, this.energy(now) * 1.5);
    this.g.style.opacity = Math.min(1, this.grow * 1.4);
    this.crest.style.opacity = (.35 + this.depth * .4 + this.nearS * .25) * this.grow;
    this.ringP.style.opacity = Math.min(1, this.energy(now) * 1.3) * this.grow;
    var nOp = this.crest.style.opacity;
    for (var ni3 = 0; ni3 < this.nodes.length; ni3++){
      var xf = this.nodeXs[ni3], xi = Math.round(xf * NP);
      this.nodes[ni3].setAttribute('cx', (xf * 1000).toFixed(1));
      this.nodes[ni3].setAttribute('cy', this.ys[xi].toFixed(2));
      this.nodes[ni3].style.opacity = nOp;
    }
  };

  var sky = hsvg.querySelector('#sky');
  var SUN = { cx: 760, cy: 185, r: 68 }, aspect = 1;
  function measure(){ var rc = hsvg.getBoundingClientRect(); aspect = rc.height ? (rc.width / 1000) / (rc.height / VBH) : 1; }
  measure(); addEventListener('resize', measure);
  var waves = [];
  // l'onde part du sommet qui sonne et ne se voit que dans la trame du ciel
  function emit(a, vx, vy){
    waves.push({ t0: performance.now(), a: a, vx: vx, vy: vy });
    if (waves.length > 8) waves.shift();
  }
  function drawSky(now){
    waves = waves.filter(function(w){ return (now - w.t0) / 1000 < 2.6; });
  }
  var lastEmit = 0;

  /* ---------- le ciel : dégradé de crépuscule + trame de points (demi-teinte) ---------- */
  var cv = document.getElementById('skybg'), cx2 = cv.getContext('2d');
  var dpr = Math.min(2, window.devicePixelRatio || 1), CW = 0, CH = 0, hr = null, dots = [];
  var STEP = 13;
  function layoutSky(){
    hr = harp.getBoundingClientRect();
    CW = document.documentElement.clientWidth;
    CH = Math.round(hr.top + scrollY + hr.height);                // le ciel descend jusqu'au pied des montagnes
    cv.width = CW * dpr; cv.height = CH * dpr; cv.style.height = CH + 'px';
    cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (var y = STEP / 2; y < CH; y += STEP){
      var odd = Math.round(y / STEP) % 2;
      for (var x = (odd ? STEP / 2 : 0); x < CW + STEP; x += STEP) dots.push(x, y);
    }
  }
  function sunPx(){
    var top = hr.top + scrollY;   // position absolue de la harpe dans la page
    return { x: SUN.cx / 1000 * hr.width, y: top + SUN.cy / VBH * hr.height, sx: hr.width / 1000, sy: hr.height / VBH };
  }
  function drawBg(now, energy){
    if (!hr) return;
    var sp = sunPx(), g = cx2;
    // dégradé vertical : nuit en haut, lueur prune à l'horizon
    var lg = g.createLinearGradient(0, 0, 0, CH);
    lg.addColorStop(0, '#12001F'); lg.addColorStop(.55, '#1A0530'); lg.addColorStop(.85, '#2E0C45'); lg.addColorStop(1, '#3A1150');
    g.fillStyle = lg; g.fillRect(0, 0, CW, CH);
    // trame : points plus gros vers l'horizon et près de l'astre, gonflés au passage des ondes
    var top0 = hr.top + scrollY;
    var rings = waves.map(function(w){ var t = (now - w.t0) / 1000; return { x: w.vx * sp.sx, y: top0 + w.vy * sp.sy, R: 20 + t * 320, a: Math.pow(1 - t / 2.6, 1.5) * w.a }; });
    var maxR = STEP * .26;
    for (var i = 0; i < dots.length; i += 2){
      var x = dots[i], y = dots[i + 1];
      var v = Math.pow(y / CH, 2.2);                               // gradient de taille vers le bas
      var near = 0, boost = 0;
      for (var k = 0; k < rings.length; k++){
        var rx = x - rings[k].x, ry = y - rings[k].y, dd = (Math.sqrt(rx * rx + ry * ry) - rings[k].R) / 18;
        boost += Math.exp(-dd * dd) * rings[k].a;
      }
      var rad = maxR * Math.min(1, v * .75 + near * .5 + boost * .6);
      if (rad < .35) continue;
      var warm = Math.min(1, near * 1.3 + boost);
      g.fillStyle = 'rgba(' + Math.round(201 + (232 - 201) * warm) + ',' + Math.round(166 + (195 - 166) * warm) + ',' + Math.round(255 + (90 - 255) * warm) + ',' + (.09 + warm * .14) + ')';
      g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill();
    }
    // le bas du ciel s'efface en transparence, comme les montagnes
    var fadeTop = CH - hr.height * .6, fg = g.createLinearGradient(0, fadeTop, 0, CH);
    fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fg; g.fillRect(0, fadeTop, CW, CH - fadeTop);
    g.globalCompositeOperation = 'source-over';
  }
  var bgDirty = true;
  addEventListener('resize', function(){ layoutSky(); bgDirty = true; });

  var ridges = []; for (var ri = 0; ri < R; ri++) ridges.push(new Ridge(ri));
  var heroStrings = ridges;                                   // même interface que les anciennes cordes
  function pluckHero(idx, x, a){ ridges[Math.min(R - 1, idx)].pluck(x, a); }

  var prev = null;
  function localPt(e){
    var rc = hsvg.getBoundingClientRect();
    return { x:(e.clientX - rc.left) / rc.width, y:(e.clientY - rc.top) / rc.height * VBH, t:performance.now() };
  }
  function ridgeUnder(pt){               // le plan le plus proche dont on est "dans" la montagne
    var hit = null;
    for (var k2 = 0; k2 < R; k2++){ if (pt.y >= ridges[k2].crestAt(pt.x)) hit = ridges[k2]; }
    return hit;
  }
  harp.addEventListener('pointermove', function(e){
    var cur = localPt(e);
    if (prev){
      var dt = Math.max(cur.t - prev.t, 8), speed = Math.hypot((cur.x - prev.x) * 1000, cur.y - prev.y) / dt;
      ridges.forEach(function(rd){
        var a = prev.y - rd.crestAt(prev.x), b = cur.y - rd.crestAt(cur.x);
        if (a * b < 0) rd.pluck(cur.x, .3 + Math.min(speed / 3, .7));
      });
    }
    var u = ridgeUnder(cur);
    ridges.forEach(function(rd){ rd.near = rd === u ? 1 : 0; });
    prev = cur;
  });
  harp.addEventListener('pointerleave', function(){ prev = null; ridges.forEach(function(rd){ rd.near = 0; }); });
  harp.addEventListener('pointerdown', function(e){
    var c = localPt(e), u = ridgeUnder(c);
    if (u) u.pluck(c.x, .75);
  });

  /* ---------- cordes des séparateurs ---------- */
  var rowStrings = [];
  document.querySelectorAll('.row').forEach(function(row){
    var ni = +row.dataset.note;
    var wrap = document.createElement('span'); wrap.className = 'string'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<svg viewBox="0 0 1000 24" preserveAspectRatio="none"><path d="M0 12L1000 12"/></svg>';
    row.appendChild(wrap);
    var tone = row.querySelector('.tone'); if (tone){ tone.textContent = label(ni); labelEls.push([tone, ni]); }
    var s = new Str(wrap.querySelector('path'), 12, ni, { max: 9, N: 90,
      onHot: function(h){ row.classList.toggle('hot', h); } });
    rowStrings.push(s);
    function hit(e){ var r = row.getBoundingClientRect(); s.pluck(e && e.clientX ? (e.clientX - r.left) / r.width : .3, .8); }
    row.addEventListener('pointerenter', hit);
    row.addEventListener('focus', function(){ hit(null); });
  });

  /* ---------- diapason 432 / 440 ---------- */
  var tuneBtn = document.getElementById('tune'), tuneLabel = document.getElementById('tuneLabel'), footA = document.getElementById('footA');
  tuneBtn.addEventListener('click', function(){
    A = A === 432 ? 440 : 432;
    tuneLabel.textContent = footA.textContent = 'la = ' + A + ' Hz';
    labelEls.forEach(function(x){ x[0].textContent = label(x[1]); });
    if (lastNote !== null) setOut(lastNote);
    // glissando : les cordes se réaccordent une à une
    ridges.forEach(function(rd, i){ setTimeout(function(){ rd.pluck(.08 + i * .14, .45); }, i * 110); });
  });

  /* ---------- menu burger ---------- */
  (function(){
    var burger = document.getElementById('burger'), menu = document.getElementById('menu');
    var b1 = document.getElementById('b1'), b2 = document.getElementById('b2'), b3 = document.getElementById('b3');
    var links = menu.querySelectorAll('.menu-nav a');
    var open = false, t = 0, hover = 0, hoverS = 0, ph = 0, animating = false;

    links.forEach(function(a){
      var ni = +a.dataset.note, n = a.querySelector('.m-n');
      n.textContent = label(ni); labelEls.push([n, ni]);
      a.addEventListener('pointerenter', function(){ play(ni, .6); setOut(ni); });
      a.addEventListener('click', function(){ if (open) toggle(false, true); });
    });

    // l'icône : deux traits ondulés au survol, qui se croisent en X à l'ouverture
    function line(y0, xa, xb, x1, y1, x2, y2, sign){
      var d = '', a = (1.4 * hoverS) * (1 - t);
      for (var i = 0; i <= 18; i++){
        var u = i / 18;
        var x = xa + (xb - xa) * u, y = y0;
        var xo = x1 + (x2 - x1) * u, yo = y1 + (y2 - y1) * u;
        x = x + (xo - x) * t; y = y + (yo - y) * t;
        y += Math.sin(u * 6.283 * 1.5 + ph * sign) * a * Math.sin(Math.PI * u);
        d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      return d;
    }
    function drawIcon(){
      hoverS += (hover - hoverS) * .12; ph += reduce ? 0 : .09 + hoverS * .12;
      b1.setAttribute('d', line(4.5, 7, 23, 8, 4, 22, 18, 1));
      b2.setAttribute('d', line(11, 4, 26, 15, 11, 15, 11, -1));
      b3.setAttribute('d', line(17.5, 9.5, 20.5, 8, 18, 22, 4, 1));
      b2.style.opacity = 1 - t;
      requestAnimationFrame(drawIcon);
    }
    drawIcon();
    burger.addEventListener('pointerenter', function(){ hover = 1; });
    burger.addEventListener('pointerleave', function(){ hover = 0; });

    // petit paysage figé en bas du menu, en écho au hero
    var mr = menu.querySelector('.menu-ridges');
    [[.45, '#2A0F44', 1.3, .2], [.62, '#1E0833', 2.1, 1.7], [.8, '#150024', 1.6, 3.1]].forEach(function(c){
      var d = '';
      for (var i = 0; i <= 80; i++){
        var x = i / 80, y = 200 * c[0] - 50 * Math.pow(Math.max(0, .5 + .3 * Math.sin(6.283 * (x * c[2] + c[3])) + .2 * Math.sin(6.283 * (x * 3.1 + c[3] * 2))), 2);
        d += (i ? 'L' : 'M') + (x * 1000).toFixed(1) + ' ' + y.toFixed(1);
      }
      var f = document.createElementNS(SVGNS, 'path'); f.setAttribute('d', d + 'L1000 200L0 200Z'); f.setAttribute('fill', c[1]); mr.appendChild(f);
      var l = document.createElementNS(SVGNS, 'path'); l.setAttribute('d', d); l.setAttribute('fill', 'none'); l.setAttribute('stroke', '#9C8DB5'); l.setAttribute('stroke-opacity', '.35'); l.setAttribute('stroke-width', '1'); mr.appendChild(l);
    });

    // trame de points du menu, dessinée une fois à l'ouverture
    var mc = menu.querySelector('.menu-sky');
    function drawMenuSky(){
      var w = menu.clientWidth, h = menu.clientHeight, dp = Math.min(2, devicePixelRatio || 1), g = mc.getContext('2d');
      mc.width = w * dp; mc.height = h * dp; g.setTransform(dp, 0, 0, dp, 0, 0);
      var lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, '#12001F'); lg.addColorStop(1, '#2A0A40');
      g.fillStyle = lg; g.fillRect(0, 0, w, h);
    }

    var hasG = hasGsap && !reduce;
    function toggle(state, fromLink){
      if (animating) return;
      open = state;
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      var items = menu.querySelectorAll('.m-t, .menu-foot > *');
      if (open){
        menu.hidden = false; document.documentElement.classList.add('menu-open'); drawMenuSky();
        if (soundOn) { play(0, .5); setTimeout(function(){ play(2, .45); }, 110); setTimeout(function(){ play(4, .4); }, 220); }
        if (hasG){
          animating = true;
          gsap.timeline({ onComplete: function(){ animating = false; links[0].focus({ preventScroll: true }); } })
            .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .9, ease: 'expo.inOut' })
            .to({ v: 0 }, { v: 1, duration: .7, ease: 'power3.inOut', onUpdate: function(){ t = this.targets()[0].v; } }, 0)
            .fromTo('.menu-ridges', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }, .35)
            .fromTo(items, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: .06 }, .4);
        } else { t = 1; links[0].focus({ preventScroll: true }); }
      } else {
        var done = function(){ menu.hidden = true; document.documentElement.classList.remove('menu-open'); animating = false; if (!fromLink) burger.focus(); };
        if (hasG){
          animating = true;
          gsap.timeline({ onComplete: done })
            .to(items, { yPercent: -60, opacity: 0, duration: .45, ease: 'power2.in', stagger: .03 })
            .to({ v: 1 }, { v: 0, duration: .6, ease: 'power3.inOut', onUpdate: function(){ t = this.targets()[0].v; } }, 0)
            .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: .75, ease: 'expo.inOut' }, .15);
        } else { t = 0; done(); }
      }
    }
    burger.addEventListener('click', function(){ toggle(!open); });
    addEventListener('keydown', function(e){ if (e.key === 'Escape' && open) toggle(false); });
    // la tabulation reste dans le menu ouvert
    menu.addEventListener('keydown', function(e){
      if (e.key !== 'Tab') return;
      var f = [burger].concat([].slice.call(menu.querySelectorAll('a, button')));
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0){ e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1){ e.preventDefault(); f[0].focus(); }
    });
  })();

  /* ---------- manifeste : trois ondes, une par propriété ---------- */
  var props = [].slice.call(document.querySelectorAll('.prop'));
  var propTrack = document.querySelector('.prop-track');
  function waveFor(kind, p, t){
    var d = '', g = '', N = 220, lx = 0, ly = 100;
    for (var i = 0; i <= N; i++){
      var x = i / N, y = 0, yg = 0;
      if (kind === 0){
        // le bruit s'efface : la corde trouve sa fréquence propre
        var clean = Math.sin(6.283 * 5 * x - t * 1.2);
        var chaos = Math.sin(6.283 * 13.7 * x + t * 2.1) * .5 + Math.sin(6.283 * 23.3 * x - t * 3) * .3 + Math.sin(6.283 * 2.3 * x + t) * .6;
        y = 70 * Math.sin(Math.PI * x) * (clean * p + chaos * (1 - p) * .8);
        yg = 70 * Math.sin(Math.PI * x) * clean;
      } else if (kind === 1){
        // un choc, puis le calme : oscillation amortie
        var u = x * 1.05;
        y = 85 * Math.exp(-u * 4.2) * Math.sin(6.283 * 7 * u);
        yg = 0;
      } else {
        // de petites impulsions régulières font grandir l'onde
        y = 85 * Math.pow(x, 1.4) * Math.sin(6.283 * 10 * x);
        yg = 0;
      }
      if (kind === 0 || x <= p){ d += (d ? 'L' : 'M') + (x * 1000).toFixed(1) + ' ' + (100 - y).toFixed(2); lx = x; ly = 100 - y; }
      g += (i ? 'L' : 'M') + (x * 1000).toFixed(1) + ' ' + (100 - yg).toFixed(2);
    }
    return { d: d || 'M0 100', g: g, lx: lx, ly: ly };
  }
  var KEYS = ['bruit', 'énergie', 'gain'];
  props.forEach(function(el){
    el._kind = +el.dataset.kind; el._p = 0; el._pw = el.querySelector('.pw'); el._pg = el.querySelector('.pw-ghost');
    el._pf = el.querySelector('.pw-fill'); el._head = el.querySelector('.head'); el._v = el.querySelector('.scope-read .v');
    el.querySelector('.scope-read .k').textContent = KEYS[el._kind];
    // grille d'oscilloscope
    var gr = el.querySelector('.grid');
    [10, 55, 100, 145, 190].forEach(function(gy){ var hl = document.createElementNS(SVGNS, 'line'); hl.setAttribute('x1', 0); hl.setAttribute('x2', 1000); hl.setAttribute('y1', gy); hl.setAttribute('y2', gy); if (gy === 100) hl.setAttribute('class', 'axis'); gr.appendChild(hl); });
    if (el._kind === 2){
      var tg = el.querySelector('.ticks');
      for (var k = 0; k < 10; k++){ var ln = document.createElementNS(SVGNS, 'line'); var xx = (k / 10 + .025) * 1000;
        ln.setAttribute('x1', xx); ln.setAttribute('x2', xx); ln.setAttribute('y1', 192); ln.setAttribute('y2', 200); tg.appendChild(ln); }
      el._ticks = tg.querySelectorAll('line');
    }
  });
  function drawProp(el, t){
    var w = waveFor(el._kind, el._p, t || 0);
    el._pw.setAttribute('d', w.d); el._pg.setAttribute('d', w.g);
    var fx = el._kind === 0 ? 1 : w.lx;
    el._pf.setAttribute('d', w.d + 'L' + (fx * 1000).toFixed(1) + ' 100L0 100Z');
    if (el._kind !== 0){
      el._head.style.left = (w.lx * 100) + '%'; el._head.style.top = (w.ly / 2) + '%';
      el._head.style.opacity = (el._p > .01 && el._p < .995) ? 1 : 0;
    }
    var pv = el._p;
    el._v.textContent = el._kind === 0 ? Math.round((1 - pv) * 100) + ' %'
      : el._kind === 1 ? Math.round(Math.exp(-pv * 1.05 * 4.2) * 100) + ' %'
      : '×' + (1 + 9 * Math.pow(pv, 1.4)).toFixed(1).replace('.', ',');
    if (el._ticks) el._ticks.forEach(function(l, k){ l.style.opacity = (k / 10 <= el._p) ? .8 : .15; });
  }
  props.forEach(function(el){ el._p = 1; drawProp(el, 0); });
  var colsEl = document.querySelector('.cols');
  function syncPropGrid(){
    if (!colsEl) return;
    var colsRect = colsEl.getBoundingClientRect();
    var colsStyle = getComputedStyle(colsEl, '::before');
    var borderStyle = getComputedStyle(colsEl);
    var borderLeft = parseFloat(borderStyle.borderLeftWidth) || 0;
    var borderRight = parseFloat(borderStyle.borderRightWidth) || 0;
    var gridWidth = colsRect.width - borderLeft - borderRight;
    var step = gridWidth * (parseFloat(colsStyle.backgroundSize) || 0) / 100;
    if (!step) return;
    props.forEach(function(el){
      var svg = el.querySelector('.prop-wave');
      var grid = el.querySelector('.grid');
      var waveRect = svg.getBoundingClientRect();
      grid.querySelectorAll('.column, .subdivision').forEach(function(line){ line.remove(); });
      var origin = colsRect.left + borderLeft;
      var first = Math.ceil((waveRect.left - origin) / step);
      var last = Math.floor((waveRect.right - origin) / step);
      function addGridLine(screenX, className){
        var x = ((screenX - waveRect.left) / waveRect.width) * 1000;
        if (x < 0 || x > 1000) return;
        var line = document.createElementNS(SVGNS, 'line');
        line.setAttribute('class', className);
        line.setAttribute('x1', x); line.setAttribute('x2', x);
        line.setAttribute('y1', 10); line.setAttribute('y2', 190);
        grid.insertBefore(line, grid.firstChild);
      }
      for (var i = first; i <= last; i++){
        var axisX = origin + i * step;
        addGridLine(axisX, 'column');
        for (var subdivision = 1; subdivision < 4; subdivision++){
          addGridLine(axisX + step * subdivision / 4, 'subdivision');
        }
      }
    });
  }
  var propGridFrame = 0;
  function schedulePropGridSync(){
    if (propGridFrame) return;
    propGridFrame = requestAnimationFrame(function(){
      propGridFrame = 0;
      syncPropGrid();
    });
  }
  syncPropGrid();
  addEventListener('resize', schedulePropGridSync);
  if (propTrack) propTrack.addEventListener('scroll', schedulePropGridSync, { passive: true });

  /* ---------- trame de colonnes : du haut de page jusqu'aux offres ---------- */
  function sizeCols(){
    var footer = document.getElementById('contact'), offers = document.getElementById('offres');
    if (!footer || !offers || !colsEl) return;
    var top = colsEl.offsetTop;
    colsEl.style.bottom = 'auto';
    var height = Math.max(0, footer.getBoundingClientRect().bottom + scrollY - top);
    var fadeEnd = Math.max(0, Math.min(100, (offers.getBoundingClientRect().top + scrollY - top) / height * 100));
    var fadeStart = Math.max(0, fadeEnd - 0.22 * innerHeight / height * 100);
    colsEl.style.height = height + 'px';
    colsEl.style.setProperty('--grid-fade-start', fadeStart + '%');
    colsEl.style.setProperty('--grid-fade-end', fadeEnd + '%');
  }
  sizeCols(); addEventListener('resize', sizeCols); addEventListener('load', sizeCols);
  if (document.fonts) document.fonts.ready.then(sizeCols);
  ScrollTrigger.addEventListener('refresh', sizeCols);

  /* ---------- relevé ---------- */
  var noteOut = document.getElementById('noteOut'), hzOut = document.getElementById('hzOut'), mini = document.getElementById('mini');
  var lastNote = null;
  function setOut(i){ lastNote = i; noteOut.textContent = NOTES[i].n + NOTES[i].o; hzOut.textContent = freq(i).toFixed(2).replace('.', ',') + ' Hz'; }

  /* ---------- boucle ---------- */
  var amp = 0, ampVel = 0, drive = 0, phase = 0, noise = 1;
  var lastY = scrollY, lastT = performance.now();
  var chars = null;

  var frameN = 0, maxScroll = 1, readoutEl = document.querySelector('.readout'), lastHeroVis = true;
  function frame(){
    var now = performance.now(), dt = Math.min((now - lastT) / 1000, .05); lastT = now;
    var y = scrollY, v = Math.abs(y - lastY) / Math.max(dt, .001); lastY = y;
    drive += (Math.min(v / 3000, 1) - drive) * Math.min(dt * 4, 1);
    ampVel += (22 * (drive - amp) - 3.2 * ampVel) * dt;
    amp = Math.max(0, Math.min(amp + ampVel * dt, 1.2));
    if (!(frameN++ % 30)) maxScroll = document.documentElement.scrollHeight - innerHeight;
    noise = maxScroll > 0 ? 1 - Math.min(y / maxScroll, 1) : 1;
    var heroVis = !CH || y < CH;
    var readVis = !CH || y + innerHeight < CH + 40;
    if (readoutEl && readVis !== lastHeroVis){ readoutEl.classList.toggle('off', !readVis); lastHeroVis = readVis; }
    phase += dt * (1 + amp * 5);

    var amb = 5 + amp * 30;
    var heroE = 0;
    if (heroVis) ridges.forEach(function(rd){ rd.draw(now, amp, noise, phase); heroE += rd.energy(now) * .5; });
    drawSky(now, Math.min(1, heroE));
    if (!hr) layoutSky();
    if (scrollY < CH && (waves.length || bgDirty || heroE > .01)){ drawBg(now, Math.min(1, heroE)); bgDirty = waves.length > 0; }
    rowStrings.forEach(function(s){ s.draw(now, 0, 0, 0); });

    // le titre ondule avec l'énergie des cordes et du scroll
    if (chars && heroVis){
      var te = Math.min(1, amp * .8 + heroE * .2);
      for (var i = 0; i < chars.length; i++){
        chars[i].style.transform = te > .005 ? 'translateY(' + (Math.sin(i * .45 - phase * 2.2) * te * 4).toFixed(2) + 'px)' : '';
      }
    }

    // mini oscilloscope : la dernière note jouée
    var f = lastNote === null ? 1 : freq(lastNote) / 220, e = Math.min(1, heroE + amp), d = '';
    for (var k = 0; k <= 40; k++){
      var x = k / 40;
      d += (k ? 'L' : 'M') + (x * 100).toFixed(1) + ' ' + (15 + (2 + e * 11) * Math.sin(Math.PI * x) * Math.sin(x * 10 * f - phase * 3)).toFixed(2);
    }
    mini.setAttribute('d', d);
  }

  if (reduce){
    // pas d'animation : cordes droites, le son reste possible
    ridges.forEach(function(rd){ rd.draw(performance.now(), 0, .3, 0); }); drawSky(0);
    layoutSky(); drawBg(0, 0); addEventListener('resize', function(){ layoutSky(); drawBg(0, 0); });
    Str.prototype.draw = function(){};
    document.getElementById('term').innerHTML = '<span class="line"><span class="pr">$</span> kubectl apply -f <span class="hl">passion.yaml</span></span><span class="line">deployment.apps/rznce créé</span><span class="line"><span class="pr">$</span> curl rznce.fr/ouais-mais</span><span class="line"><span class="hl">200 OK</span> — encore un souci résolu à 2h du matin</span>';
    return;
  }
  if (hasGsap) gsap.ticker.add(frame); else (function loop(){ frame(); requestAnimationFrame(loop); })();

  /* ---------- terminal : chaque ping pince une corde ---------- */
  var term = document.getElementById('term');
  var pings = [
    { t:'12,4', s:4, p:.22 }, { t:'11,9', s:3, p:.4 }, { t:'12,1', s:1, p:.62 }, { t:'12,0', s:0, p:.8 }
  ];
  var lines = [];
  var steps = [
    { h: '<span class="pr">$</span> kubectl apply -f <span class="hl">passion.yaml</span>', d: 0 },
    { h: '<span class="dim">deployment.apps/rznce créé</span>', d: .5 },
    { h: '<span class="pr">$</span> ping -c 3 rznce.fr', d: .8 },
    { h: '<span class="dim">64 octets : seq=1 temps=12,4 ms</span>', d: .6, ping: pings[0] },
    { h: '<span class="dim">64 octets : seq=2 temps=11,9 ms</span>', d: .6, ping: pings[1] },
    { h: '<span class="dim">64 octets : seq=3 temps=12,1 ms</span>', d: .6, ping: pings[2] },
    { h: '<span class="ok">3 envoyés, 3 reçus. Même fréquence.</span>', d: .5 },
    { h: '<span class="pr">$</span> curl rznce.fr/ouais-mais', d: .9 },
    { h: '<span class="hl">200 OK</span> — encore un souci résolu à 2h du matin', d: .6 }
  ];
  function render(cur){ term.innerHTML = lines.map(function(l){ return '<span class="line">' + l + '</span>'; }).join('') + (cur ? '<span class="cursor"></span>' : ''); }

  if (!hasGsap){
    steps.forEach(function(st){ lines.push(st.h); }); render(false); return;
  }

  gsap.registerPlugin(SplitText, ScrollTrigger);
  render(true);

  // filet de sécurité : si l'animation ne s'est jamais lancée (fonts.ready qui ne
  // résout jamais, erreur silencieuse ailleurs…), on affiche le terminal quand même.
  // Chaque chemin désactive proprement l'autre pour éviter un double remplissage.
  var propsTl = null;
  var netTimer = setTimeout(function(){
    netTimer = null;
    if (propsTl) propsTl.progress(1).kill();
    if (!lines.length){ steps.forEach(function(st){ lines.push(st.h); }); render(false); }
  }, 2500);

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function(){
    if (!netTimer) return; // le filet de sécurité a déjà pris le relais
    clearTimeout(netTimer); netTimer = null;
    layoutSky(); bgDirty = true;
    var split = SplitText.create('#title .l', { type: 'chars' });
    var tl = propsTl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(split.chars, {
        yPercent: function(i){ return 130 * Math.exp(-i * .09) + 18; },
        scale: function(i){ return 1 - .8 * Math.exp(-i * .09); },
        rotation: function(i){ return (i % 2 ? 1 : -1) * 14 * Math.exp(-i * .09); },
        opacity: 0, duration: 1.4,
        ease: 'elastic.out(1, .4)', stagger: .045,
        onComplete: function(){ chars = split.chars.filter(function(c){ return !c.closest('.sup'); }); } })
      .to(ridges, { grow: 1, duration: 2.2, ease: 'power3.out', stagger: .12 }, '-=1.2')
      .from('.hero-foot > div:first-child', { opacity: 0, y: 12, duration: 1.2 }, '<');

    // à l'ouverture, les cordes sont pincées une à une, comme un arpège
    [.14, .32, .5, .68, .86].forEach(function(x, i){
      tl.call(function(){ ridges[R - 1 - (i % 3)].pluck(x, .55); }, null, i === 0 ? '-=1' : '+=.14');
    });

    steps.forEach(function(st, i){
      tl.call(function(){
        var h = st.h;
        if (st.ping){ var ni = noteAt(st.ping.p); h += '  <span class="n">' + NOTES[ni].n + '</span>'; pluckHero(st.ping.s, st.ping.p, .6); }
        lines.push(h); render(true);
      }, null, i === 0 ? '+=.3' : '+=' + st.d);
    });
  });

  var lead = SplitText.create('.mf-lead', { type: 'words', wordsClass: 'w', tag: 'span' });
  gsap.to(lead.words, { opacity: 1, ease: 'none', stagger: .1,
    scrollTrigger: { trigger: '.mf-lead', start: 'top 80%', end: 'bottom 45%', scrub: .5 } });

  // chaque propriété : titre qui monte, onde qui se dessine au rythme du scroll
  var mm = gsap.matchMedia();
  props.forEach(function(el){ el._p = 0; drawProp(el, 0); });
  gsap.ticker.add(function(){
    var t = performance.now() / 1000;
    props.forEach(function(el){ if (el._kind === 0 && el._vis) drawProp(el, t); });
  });
  props.forEach(function(el){
    var h = el.querySelector('h3'), sp = SplitText.create(h, { type: 'lines', mask: 'lines' });
    var titleReveal = gsap.from(sp.lines, { yPercent: 105, duration: 1.4, ease: 'expo.out', paused: true });
    var copyReveal = gsap.from(el.querySelectorAll('.prop-cols p'), { opacity: 0, y: 16, duration: 1.2, ease: 'expo.out', stagger: .1, paused: true });
    var revealed = false, copyRevealed = false;
    function reveal(){
      if (revealed) return;
      revealed = true;
      titleReveal.play(0);
      var ni = +el.dataset.note; play(ni, .55); setOut(ni);
    }
    function revealCopy(){
      if (copyRevealed) return;
      copyRevealed = true; copyReveal.play(0);
    }
    var upd = function(self){ el._p = self.progress; if (el._kind !== 0) drawProp(el, 0); };
    mm.add('(min-width: 721px)', function(){
      ScrollTrigger.create({ trigger: el, start: 'top 70%', once: true, onEnter: reveal });
      ScrollTrigger.create({ trigger: el, start: 'top 55%', once: true, onEnter: revealCopy });
      ScrollTrigger.create({ trigger: el, start: 'top top', end: '+=35%', pin: true, scrub: .4, onUpdate: upd,
        onToggle: function(self){ el._vis = self.isActive || el._vis; } });
      ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: function(self){ el._vis = self.isActive; } });
    });
    el._reveal = reveal;
    el._revealCopy = revealCopy;
    el._setProgress = function(progress){ el._p = progress; if (el._kind !== 0) drawProp(el, 0); };
  });
  if (propTrack){
    var trackFrame = 0, activePropIndex = 0;
    var propCount = document.querySelector('.prop-count');
    var propProgress = document.querySelector('.prop-progress');
    var propStepButtons = document.querySelectorAll('[data-prop-step]');
    function scrollToProp(index){
      var target = props[index];
      if (!target) return;
      var current = props[activePropIndex];
      propTrack.scrollTo({
        left: propTrack.scrollLeft + target.getBoundingClientRect().left - current.getBoundingClientRect().left,
        behavior: reduce ? 'auto' : 'smooth'
      });
    }
    propStepButtons.forEach(function(button){
      button.addEventListener('click', function(){
        scrollToProp(activePropIndex + +button.dataset.propStep);
      });
    });
    function updatePropTrack(){
      trackFrame = 0;
      if (!matchMedia('(max-width: 720px)').matches) return;
      var step = props[1].getBoundingClientRect().left - props[0].getBoundingClientRect().left;
      if (step <= 0) return;
      var left = propTrack.scrollLeft, active = props[0], center = propTrack.getBoundingClientRect().left + propTrack.clientWidth / 2;
      props.forEach(function(el, i){
        var atEnd = left >= propTrack.scrollWidth - propTrack.clientWidth - 1;
        var progress = i === 0 ? left / step : (left - (i - 1) * step) / step;
        var p = i === props.length - 1 && atEnd ? 1 : Math.max(0, Math.min(progress, 1));
        el._setProgress(p);
        el._vis = false;
        if (Math.abs(el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2 - center) <
            Math.abs(active.getBoundingClientRect().left + active.getBoundingClientRect().width / 2 - center)) active = el;
      });
      activePropIndex = props.indexOf(active);
      if (propCount) propCount.textContent = String(activePropIndex + 1).padStart(2, '0') + ' / ' + String(props.length).padStart(2, '0');
      if (propProgress){
        propProgress.setAttribute('aria-valuenow', activePropIndex + 1);
        propProgress.firstElementChild.style.transform = 'scaleX(' + ((activePropIndex + 1) / props.length) + ')';
      }
      propStepButtons.forEach(function(button){
        var nextIndex = activePropIndex + +button.dataset.propStep;
        button.disabled = nextIndex < 0 || nextIndex >= props.length;
      });
      active._vis = true; active._reveal(); active._revealCopy();
    }
    propTrack.addEventListener('scroll', function(){
      if (!trackFrame) trackFrame = requestAnimationFrame(updatePropTrack);
    }, { passive: true });
    addEventListener('resize', function(){
      if (!trackFrame) trackFrame = requestAnimationFrame(updatePropTrack);
    });
    updatePropTrack();
  }

  gsap.to('.ambient .g1', { yPercent: -60, xPercent: 25, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1.5 } });
  gsap.to('.ambient .g2', { yPercent: 90, xPercent: -30, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1.5 } });

  gsap.utils.toArray('.sec-head h2, footer .cta').forEach(function(h){
    var s = SplitText.create(h, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: .08,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });
}
