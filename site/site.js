/* =====================================================================
   First Love Church at GMU · SITE RUNTIME (all six pages)
   Phase 2: appended after explore/core.js inside Mason 360's Website Custom
   JavaScript (one <script> wrapper). Pages carry markup only; every moving
   section is found by its data-sec attribute and wired here.
   Motion language (Revision 11): type itself moves, always; no decoration.
   ===================================================================== */
(function () {
  "use strict";
  var FL = window.FL, NS = "http://www.w3.org/2000/svg";
  FL.base = FL.base || "../logos/web/";
  FL.config.service.place = "The Hub";                      // Revision 8: every road converges on The Hub, where the service meets
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var svgEl = function (tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var seeded = function (seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; };

  /* ---------- FAQ: written once, reused on New Here, About, Gatherings (Revision 11) ---------- */
  FL.faq = [
    { k: "believe", q: "Do I have to be a Christian to come?", a: "No. Come as you are, and come and see. Church is where people come to know God, not where they have to have it figured out first." },
    { k: "grads", q: "I've graduated. Is First Love still for me?", a: "Yes. First Love is for students and for graduates who are still around Fairfax. Many of the church's people are in their first years after Mason." },
    { k: "happens", q: "What happens at a service?", a: "We sing, we pray, and the Word of God is preached. Afterwards people stay and talk. Nobody will single you out." },
    { k: "wear", q: "What should I wear?", a: "Whatever you wear to class." },
    { k: "park", q: "Where do I park?", a: "Visitors can park in the Rappahannock River Parking Deck; from there it is about an eight-minute walk to The Hub. Rather not drive? Tick \"I need a lift\" when you let us know you're coming." },
    { k: "people", q: "How do I get to know people?", a: "Start in the group chat, come to a gathering, then join a small group: a few people who meet every week and know each other by name." },
    { k: "lift", q: "Can someone give me a ride?", a: "Yes. Tick \"I need a lift\" when you plan your visit and someone will arrange one." },
    { k: "friends", q: "Can I bring friends?", a: "Please do. Add their first names when you plan your visit and there will be a seat for each of them." },
    { k: "family", q: "Is First Love part of a larger church?", a: "Yes. First Love Church belongs to a worldwide family of churches founded by Bishop Dag Heward-Mills." }
  ];
  var faqs = function () {
    $$("[data-faq]").forEach(function (box) {
      var keys = (box.getAttribute("data-faq") || "").split(",").filter(Boolean);
      var list = keys.length ? FL.faq.filter(function (f) { return keys.indexOf(f.k) > -1; }) : FL.faq;
      box.classList.add("faq");
      box.innerHTML = list.map(function (f) { return '<details><summary>' + f.q + '</summary><div class="ans"><p class="t-prose">' + f.a + "</p></div></details>"; }).join("");
      if (FL.reduced) return;
      FL.gsap().then(function (gsap) {
        $$("details", box).forEach(function (d) {
          var ans = $(".ans", d), p = $("p", ans), busy = false;
          $("summary", d).addEventListener("click", function (e) {
            e.preventDefault(); if (busy) return; busy = true;
            if (!d.open) {                                   // open: enter at .4s, ease-out
              d.open = true;
              gsap.fromTo(ans, { height: 0, overflow: "hidden" }, { height: "auto", duration: 0.4, ease: "power3.out", clearProps: "height,overflow", onComplete: function () { busy = false; if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } });
              gsap.fromTo(p, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.1, ease: "power2.out" });
            } else {                                         // close: exit faster, ease-in
              gsap.to(p, { opacity: 0, duration: 0.15, ease: "power1.in" });
              gsap.to(ans, { height: 0, overflow: "hidden", duration: 0.25, ease: "power2.in", onComplete: function () { d.open = false; gsap.set([ans, p], { clearProps: "all" }); busy = false; if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } });
            }
          });
        });
      });
    });
  };

  /* ---------- navigation ---------- */
  var nav = function () {
    var n = $(".nav"); if (!n) return;
    var here = location.pathname.split("/").pop() || "index.html";
    $$(".nav__links a", n).forEach(function (a) { if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page"); });
    // Revision 58: the phone menu is its own full-screen layer (the 2819 menu). It lives outside the nav, whose paint
    // containment clipped the old drop-down to the bar so it opened invisibly.
    var t = $(".nav__toggle", n), m = $(".menu"); if (!t || !m) return;
    $$(".menu__links a", m).forEach(function (a) { if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page"); });
    var shut = function () { if (m.hidden) return; m.classList.remove("is-open"); t.setAttribute("aria-expanded", "false"); document.documentElement.classList.remove("menu-open");
      if (FL.lenis) FL.lenis.start(); setTimeout(function () { if (!m.classList.contains("is-open")) m.hidden = true; }, 420); t.focus(); };
    var open = function () { m.hidden = false; m.getBoundingClientRect(); m.classList.add("is-open"); t.setAttribute("aria-expanded", "true"); document.documentElement.classList.add("menu-open");
      if (FL.lenis) FL.lenis.stop(); $(".menu__close", m).focus(); };
    t.addEventListener("click", function (e) { e.preventDefault(); m.hidden ? open() : shut(); });
    $(".menu__close", m).addEventListener("click", shut);
    $$(".menu__links a, .menu__mark", m).forEach(function (a) { a.addEventListener("click", function () { shut(); }); });
    addEventListener("keydown", function (e) { if (e.key === "Escape") shut(); });
    addEventListener("resize", function () { if (innerWidth > 960) shut(); });
  };


  /* ---------- one schedule for the whole site (Revision 37.5): when the calendar changes, the form changes ---------- */
  var DOWS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  var hm = function (t) { var m = /(\d{1,2}):(\d{2})\s*([AP]M)?/i.exec(t || ""); if (!m) return null; var h = +m[1] % 12; if (/p/i.test(m[3] || (t.match(/[AP]M/i) || [""])[0])) h += 12; return [h, +m[2]]; };
  FL.schedule = function () {
    var list = FL.config.gatherings.map(function (g) {
      var times = (g.time || "").split(/[–-]/), s0 = hm(times[0] + (/(AM|PM)/i.test(times[0]) ? "" : " " + ((g.time.match(/[AP]M/i) || ["PM"])[0]))), e0 = hm(times[1] || "");
      return { title: g.title, intake: g.intake || "special", dow: DOWS.indexOf(String(g.day).toLowerCase().replace(/s$/, "")), s: s0, e: e0 || [s0[0] + 1, s0[1]], where: g.place };
    });
    var sv = FL.config.service, sd = DOWS.indexOf(String(sv.day).toLowerCase().replace(/s$/, "")), st = hm(sv.time);
    if (sd > -1 && st) list.unshift({ title: "Service", intake: "special", dow: sd, s: st, e: [st[0] + 2, st[1]], where: "The Hub" });   // appears once Kofi supplies the day
    return list.filter(function (g) { return g.dow > -1 && g.s; });
  };
  FL.upcoming = function (count, days, live) {           // the next gatherings from now; live: include one in progress
    var now = new Date(), out = [];
    for (var k = 0; k < (days || 28); k++) { var d = new Date(now); d.setDate(d.getDate() + k);
      FL.schedule().forEach(function (g) { if (d.getDay() !== g.dow) return;
        var st = new Date(d); st.setHours(g.s[0], g.s[1], 0, 0); var en = new Date(d); en.setHours(g.e[0], g.e[1], 0, 0);
        if (st > now || (live && en > now)) out.push({ title: g.title, intake: g.intake, start: st, end: en, where: g.where }); }); }
    return out.sort(function (a, b) { return a.start - b.start; }).slice(0, count || 6);
  };
  FL.when = function (d) { return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); };

  /* ---------- the entrance (Revision 34): a load-time intro that plays like a video, once, then hands over to the site.
     heart > flame is Wan's morph, frame for frame (no blending: blending was the smear); flame > globe > all three
     are the REAL logo files moving, landing pixel-true on hearts-on-fire.png; then the line, then it lifts away.
     Any scroll, tap or key skips it. ?intro=off skips it; ?t=<seconds> freezes it (storyboards). ---------- */
  var entrance = function (root) {
    var q = new URLSearchParams(location.search), html = document.documentElement;
    var gone = function () { root.classList.add("is-gone"); html.classList.remove("fl-intro"); if (FL.lenis) FL.lenis.start(); FL.introDone = true; dispatchEvent(new Event("fl:intro-done")); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };
    if (FL.reduced || q.get("intro") === "off" || location.hash.length > 1 || (q.get("t") !== null && +q.get("t") > 11)) { gone(); return; }   // "Plan your visit" lands inside the page, not behind the intro
    html.classList.add("fl-intro");
    var cv = $("canvas", root), ctx = cv.getContext("2d"), dir = (root.getAttribute("data-frames") || "../explore/frames/");
    var img = function (src) { var i = new Image(); i.src = src; return i; };
    var lerp = function (a, b, t) { return a + (b - a) * t; }, ease = function (t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    Promise.all([fetch(dir + "intro-k.json").then(function (r) { return r.json(); }), fetch("../explore/data/marks.json").then(function (r) { return r.json(); })]).then(function (both) {
      var M = both[0], MK = both[1];
      // Revision 48: the previous build's transitions exactly as they were (the generated morph frames, the camera following
      // each form, neighbouring frames blended for 60fps), retimed: each appearance .6s, each transition .3s, lockup 2s; 4.7s.
      var frames = [], loaded = 0;   // Revision 51: flame -> globe moves like the Kling reference; the other two as Revision 50
      var KS = M.segs[1];                                  // only flame -> globe plays frames (Kling's motion); the other two are drawn live
      for (var i = 0; i < M.n; i++) { if (i < KS.start || i > KS.end) { frames.push({ naturalWidth: 0 }); continue; } var f = img(dir + "intro-k/" + String(i).padStart(3, "0") + ".webp"); f.onload = function () { loaded++; }; frames.push(f); }
      var trioImg = img(FL.asset("hearts-on-fire.png"));
      // fluid playback: a window of frames decoded ahead, off the main thread, so nothing ever decodes while drawing;
      // frames already shown are released, so memory stays small (147 decoded frames would be over 500 MB)
      var bm = new Array(M.n), pend = new Array(M.n), AHEAD = 24;
      var want = function (i) { if (i < 0 || i >= M.n || bm[i] || pend[i] || !window.createImageBitmap) return pend[i];
        pend[i] = (frames[i].decode ? frames[i].decode() : Promise.resolve()).then(function () { return createImageBitmap(frames[i]); }).then(function (b) { bm[i] = b; }, function () {}); return pend[i]; };
      var keep = function (fi) { for (var j = Math.max(fi, KS.start); j < Math.min(KS.end + 1, Math.max(fi, KS.start) + AHEAD); j++) want(j); for (var k2 = 0; k2 < fi - 3; k2++) if (bm[k2]) { bm[k2].close(); bm[k2] = null; } };
      var pic = function (i) { i = clamp(i, 0, M.n - 1); return bm[i] || (frames[i].naturalWidth ? frames[i] : null); };
      var R = function (k) { var r = M.keys[k]; return { x: r.x * M.w, y: r.y * M.h, w: r.w * M.w, h: r.h * M.h }; };
      var trioR = R("trio"), ts = M.src.trio, kT = trioR.w / (ts[2] - ts[0]);
      var parts = ["heart", "flame", "globe"].map(function (n) { var p = M.trioParts[n]; return { x: trioR.x + (p[0] - ts[0]) * kT, y: trioR.y + (p[1] - ts[1]) * kT, w: (p[2] - p[0]) * kT, h: (p[3] - p[1]) * kT, s: p }; });
      var SHOW = 600, TRANS = 600, LOCKUP = 2000, plan = [];   // Revision 49: everything .6s, the lockup 2s; 5.6s in all
      M.segs.forEach(function (sg, i) { var h = i * (SHOW + TRANS); plan.push({ sg: sg, hold: h, a: h + SHOW, b: h + SHOW + TRANS }); });
      var T = { land: plan[plan.length - 1].b, out: 0 }; T.out = T.land + LOCKUP;
      var vw = 0, vh = 0, dpr = 1;
      var size = function () { var d = FL.fit(cv, 1); dpr = d.d; vw = cv.width / dpr; vh = cv.height / dpr; };
      addEventListener("resize", size); size();
      var cam = function (k) {                             // frame the subject: a single mark medium, the trio wide
        var r = R(k), single = k !== "trio", small = vw < 768, fx = single ? (small ? .5 : .34) : (small ? .9 : .78), fy = single ? (small ? .28 : .4) : .36;
        return { s: Math.min(vw * fx / r.w, vh * fy / r.h), cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
      };

      // the live transitions, learned from the Kling clip: one crisp line; the contour moves first, the inner lines sweep in
      var K = 160, NS = "http://www.w3.org/2000/svg", tmp = document.createElementNS(NS, "svg"), WEIGHT = MK.weight;
      tmp.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden"); document.body.appendChild(tmp);
      var sample = function (d) { var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); tmp.appendChild(p);
        var L = p.getTotalLength(), pts = []; for (var i = 0; i < K; i++) { var q = p.getPointAtLength(L * i / (K - 1)); pts.push([q.x, q.y]); } tmp.removeChild(p); return { pts: pts, len: L }; };
      var marks = {}; ["heart", "flame", "globe"].forEach(function (n) { marks[n] = { bbox: MK.marks[n].bbox, strokes: MK.marks[n].paths.map(sample) }; });
      tmp.remove();
      var tb = [Math.min(marks.heart.bbox[0], marks.flame.bbox[0], marks.globe.bbox[0]), Math.min(marks.heart.bbox[1], marks.flame.bbox[1], marks.globe.bbox[1]),
                Math.max(marks.heart.bbox[2], marks.flame.bbox[2], marks.globe.bbox[2]), Math.max(marks.heart.bbox[3], marks.flame.bbox[3], marks.globe.bbox[3])];
      var C = [(tb[0] + tb[2]) / 2, (tb[1] + tb[3]) / 2];
      var shiftOf = function (n) { var b = marks[n].bbox; return [C[0] - (b[0] + b[2]) / 2, C[1] - (b[1] + b[3]) / 2]; };
      var moved = function (pts, d) { return pts.map(function (p) { return [p[0] + d[0], p[1] + d[1]]; }); };
      var lbox = function (n, d) { var b = marks[n].bbox; d = d || [0, 0]; return [b[0] + d[0], b[1] + d[1], b[2] + d[0], b[3] + d[1]]; };
      var lcam = function (bb, single) {                   // the same framing rule as the frames, in the artwork's own coordinates
        var w = bb[2] - bb[0] + WEIGHT, h = bb[3] - bb[1] + WEIGHT, small = vw < 768, fx = single ? (small ? .5 : .34) : (small ? .9 : .78), fy = single ? (small ? .28 : .4) : .36;
        return { s: Math.min(vw * fx / w, vh * fy / h), cx: (bb[0] + bb[2]) / 2, cy: (bb[1] + bb[3]) / 2 };
      };
      var dd = function (p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); };
      // heart -> flame: the heart's outline becomes the flame's outer contour; the flame's inner tongues draw in from the base
      var hS = shiftOf("heart"), fS = shiftOf("flame"), gS = shiftOf("globe");
      var heartPts = moved(marks.heart.strokes[0].pts, hS);
      var fl = marks.flame.strokes.slice().sort(function (a, b) { return b.len - a.len; });
      var outer = moved(fl[0].pts, fS), inners = fl.slice(1).map(function (st) { var p = moved(st.pts, fS); return p[0][1] < p[p.length - 1][1] ? p.reverse() : p; });   // each tongue grows from its base
      var best = 0, bestD = 1e18, rev = false;            // line the heart's loop up with the flame's contour: the start and direction that travel least
      [false, true].forEach(function (r) { var o = r ? outer.slice().reverse() : outer; for (var k = 0; k < K; k += 2) { var s2 = 0; for (var i = 0; i < K; i += 8) s2 += dd(heartPts[(i + k) % K], o[i]); if (s2 < bestD) { bestD = s2; best = k; rev = r; } } });
      var heartA = heartPts.map(function (p, i) { return heartPts[(i + best) % K]; }), outerB = rev ? outer.slice().reverse() : outer;
      var line = function (pts, upto) { var n = Math.max(2, Math.round(upto * (pts.length - 1)) + 1); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < n - 1; i++) { var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
        ctx.lineTo(pts[n - 1][0], pts[n - 1][1]); ctx.stroke(); };
      var pen = function (c) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#0D0B09"; ctx.fillRect(0, 0, cv.width, cv.height);
        var s = c.s * dpr; ctx.setTransform(s, 0, 0, s, dpr * vw / 2 - s * c.cx, dpr * vh * 0.44 - s * c.cy);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = WEIGHT; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = 1; };
      var outE = function (t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); };        // the settle: an ease-out, like Kling's
      var heartToFlame = function (lp) {
        var k = ease(lp), ca = lcam(lbox("heart", hS), true), cb = lcam(lbox("flame", fS), true);
        pen({ s: lerp(ca.s, cb.s, k), cx: lerp(ca.cx, cb.cx, k), cy: lerp(ca.cy, cb.cy, k) });
        var m = ease(clamp(lp / 0.75, 0, 1)), mid = new Array(K);                        // the contour moves first
        for (var i = 0; i < K; i++) mid[i] = [heartA[i][0] + (outerB[i][0] - heartA[i][0]) * m, heartA[i][1] + (outerB[i][1] - heartA[i][1]) * m];
        line(mid, 1);
        inners.forEach(function (p, j) { var r = outE((lp - 0.38 - j * 0.07) / 0.5); if (r > 0) line(p, r); });   // then the inner lines sweep in
      };
      // globe -> all three: the globe glides into its place in the lockup; the heart and the flame draw in beside it
      var globeToTrio = function (lp) {
        var k = ease(lp), ca = lcam(lbox("globe", gS), true), cb = lcam(tb, false), kc = Math.min(1, k * 1.6);
        pen({ s: lerp(ca.s, cb.s, kc), cx: lerp(ca.cx, cb.cx, kc), cy: lerp(ca.cy, cb.cy, kc) });
        var g = [gS[0] * (1 - k), gS[1] * (1 - k)];
        marks.globe.strokes.forEach(function (st) { line(moved(st.pts, g), 1); });
        marks.heart.strokes.forEach(function (st, j) { var r = outE((lp - 0.18 - j * 0.05) / 0.62); if (r > 0) line(st.pts, r); });
        marks.flame.strokes.slice().sort(function (a, b) { return b.len - a.len; }).forEach(function (st, j) { var r = outE((lp - 0.3 - j * 0.07) / 0.6); if (r > 0) line(st.pts, r); });
      };
      var render = function (t) {
        var pl = plan[0]; plan.forEach(function (x) { if (t >= x.hold) pl = x; });
        var seg = pl.sg, lp = clamp((t - pl.a) / TRANS, 0, 1), e = ease(lp);              // holds sit on the form; each transition the same curve
        // Revision 50, a flip book: frames advance at an even rate and each display refresh shows ONE true frame (no blending: no ghost)
        var fi = Math.round(seg.start + lp * (seg.end - seg.start)), ff = 0;
        var k = ease(seg.to === "trio" ? Math.min(1, lp * 2.6) : lp), a = cam(seg.from), b = cam(seg.to);   // pull back early for the trio, before the marks spread
        var c = { s: lerp(a.s, b.s, k), cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k) };
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#0D0B09"; ctx.fillRect(0, 0, cv.width, cv.height);
        var s = c.s * dpr; ctx.setTransform(s, 0, 0, s, dpr * vw / 2 - s * c.cx, dpr * vh * 0.44 - s * c.cy);   // no breathing zoom (Revision 47: no shake)
        ctx.imageSmoothingQuality = "high";
        keep(fi);
        var fr = pic(fi), nx = pic(fi + 1), fade = clamp(t / 60, 0, 1);
        if (t >= pl.a && t < pl.b && seg.from === "heart") { heartToFlame(lp); return; }
        if (t >= pl.a && t < pl.b && seg.from === "globe") { globeToTrio(lp); return; }
        if (t < pl.a && trioImg.naturalWidth) {          // Revision 51: every pause shows the REAL logo file; frames only move between them
          var key = R(seg.from), src = M.trioParts[seg.from];
          ctx.globalAlpha = fade; ctx.drawImage(trioImg, src[0], src[1], src[2] - src[0], src[3] - src[1], key.x, key.y, key.w, key.h); ctx.globalAlpha = 1; fr = null;
        }
        if (fr) {
          ctx.globalAlpha = fade; ctx.drawImage(fr, 0, 0, M.w, M.h);
          if (ff > 0.01 && nx && nx !== fr) { ctx.globalAlpha = fade * ff; ctx.drawImage(nx, 0, 0, M.w, M.h); }
          ctx.globalAlpha = 1;
        }
        if (t >= T.land && trioImg.naturalWidth) {        // the last generated frame IS the trio; the real file settles over it, crisp
          ctx.globalAlpha = clamp((t - T.land) / 300, 0, 1);
          parts.forEach(function (p) { ctx.drawImage(trioImg, p.s[0], p.s[1], p.s[2] - p.s[0], p.s[3] - p.s[1], p.x, p.y, p.w, p.h); });
          ctx.globalAlpha = 1;
        }
        if (t >= T.land && !root.classList.contains("is-landed")) root.classList.add("is-landed");
      };
      var start = 0, raf = 0, leaving = false;
      var leave = function () {
        if (leaving) return; leaving = true; root.classList.add("is-leaving"); dispatchEvent(new Event("fl:intro-leaving"));
        setTimeout(function () { cancelAnimationFrame(raf); gone(); }, 700);
      };
      var frame = function (now) { var t = now - start; render(t); if (t >= T.out) leave(); if (!root.classList.contains("is-gone")) raf = requestAnimationFrame(frame); };   // driven by the animation clock
      var at = q.get("t");
      var begin = function () {
        if (start) return;
        if (at !== null) { render(+at * 1000); return; }
        if (FL.lenis) FL.lenis.stop();
        start = performance.now(); raf = requestAnimationFrame(frame);
        var skip = function (e) { if (FL.introDone) return;   // after the intro, a tap is a tap (it used to swallow the first one)
          if (e.type === "keydown" && /^(Shift|Control|Alt|Meta|Tab)$/.test(e.key)) return; if (e.cancelable && e.type !== "keydown") e.preventDefault(); leave(); };
        ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (e) { addEventListener(e, skip, { passive: false, once: true }); });
        addEventListener("touchmove", function (e) { if (!FL.introDone) e.preventDefault(); }, { passive: false });
      };
      // Revision 42 change 2: every frame is loaded AND decoded before playback starts
      var all = frames.filter(function (f) { return f.src; }).concat([trioImg]).map(function (f) { return new Promise(function (res) { var go = function () { (f.decode ? f.decode() : Promise.resolve()).then(res, res); }; if (f.complete && f.naturalWidth) go(); else { f.addEventListener("load", go); f.addEventListener("error", res); } }); });
      Promise.all(all).then(function () { var first = []; for (var j = KS.start; j < Math.min(KS.end + 1, KS.start + AHEAD); j++) first.push(want(j)); return Promise.all(first); }).then(begin);
      setTimeout(function () { if (!start && at === null) begin(); }, 4000);   // a slow network never holds the site hostage
    }).catch(function (e) { console.error("[First Love] intro failed, showing the site:", e); gone(); });
  };


  /* ---------- kinetic declaration: words assemble out of scattered positions (2819), and never stop drifting ---------- */
  var kinetic = function (root, gsap) {
    var sets = $$(".kin__set", root), field = $(".kin__field", root), rnd = seeded(5);
    sets.forEach(function (s) { $$(".line", s).forEach(function (l) { l.innerHTML = l.textContent.split(" ").map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" "); }); });
    // layered ghost words behind: each layer drifts at its own speed forever and moves with its own scroll parallax
    var ghosts = (root.getAttribute("data-ghosts") || "").split("|").filter(Boolean);
    var layers = [0.35, 0.6, 1].map(function (depth, li) {
      var g = []; for (var i = 0; i < 4; i++) { var e = document.createElement("span"); e.className = "kin__ghost"; e.textContent = ghosts[(i + li * 2) % ghosts.length] || "";
        e.style.fontSize = (4 + depth * 9) + "vw"; e.style.top = (8 + i * 23 + rnd() * 6) + "%"; e.style.left = (rnd() * 60 - 10) + "%"; field.appendChild(e); g.push({ el: e, x: rnd() * 100, v: (0.6 + rnd()) * (li % 2 ? -1 : 1) * depth }); }
      return { depth: depth, items: g };
    });
    var scrollY0 = 0;
    FL.loop(root, function (t) {
      layers.forEach(function (L) { L.items.forEach(function (it) { it.x += it.v * 0.016 * 4; if (it.x > 110) it.x = -60; if (it.x < -60) it.x = 110;
        it.el.style.transform = "translate3d(" + it.x.toFixed(2) + "vw," + (-scrollY0 * L.depth * 0.25).toFixed(1) + "px,0)"; }); });
      // the assembled words keep breathing a few pixels: motion never fully stops
      sets.forEach(function (s, si) { $$(".w", s).forEach(function (w, wi) { w.style.translate = "0 " + (Math.sin(t * 0.9 + wi * 0.7 + si) * 3).toFixed(2) + "px"; }); });
    });
    if (FL.reduced) return;
    var scatter = function (w) { return { x: (rnd() - 0.5) * innerWidth * 0.9, y: (rnd() - 0.5) * innerHeight * 0.7, rotation: (rnd() - 0.5) * 24, opacity: 0, scale: 0.7 + rnd() * 0.6 }; };
    sets.forEach(function (s, i) { $$(".w", s).forEach(function (w) { gsap.set(w, i === 0 ? { opacity: 0.0 } : scatter(w)); if (i === 0) gsap.set(w, scatter(w)); }); });
    var tl = gsap.timeline({ scrollTrigger: { trigger: $(".kin__pin", root), start: "top top", end: "+=" + (sets.length * 110) + "%", pin: true, scrub: 0.8,
      onUpdate: function (st) { scrollY0 = st.progress * innerHeight * 2; } } });
    sets.forEach(function (s, i) {
      var ws = $$(".w", s);
      tl.to(ws, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 1, stagger: { each: 0.06, from: "random" }, ease: "power3.out" });
      tl.to({}, { duration: 0.6 });
      if (i < sets.length - 1) tl.to(ws, { x: function () { return (rnd() - 0.5) * innerWidth; }, y: function () { return (rnd() - 0.5) * innerHeight * 0.6; }, rotation: function () { return (rnd() - 0.5) * 30; }, opacity: 0, duration: 0.8, stagger: { each: 0.03, from: "random" }, ease: "power2.in" });
    });
  };

  /* ---------- dorms at night: many students, many rooms; windows keep flickering (alive) ---------- */
  var dorms = function (root, gsap) {
    var host = $(".dorms__sky", root), rnd = seeded(11), W = 1600, H = 700;
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMax meet" }, host);
    var far = svgEl("g", {}, svg), near = svgEl("g", {}, svg), lits = [];
    var block = function (g, x, w, h, cls, depth) {
      svgEl("rect", { x: x, y: H - h, width: w, height: h, class: "bldg " + cls }, g);
      var cols = Math.floor((w - 24) / 26), rows = Math.floor((h - 40) / 34);
      for (var c = 0; c < cols; c++) for (var r = 0; r < rows; r++) {
        var wx = x + 14 + c * 26 + (w - 24 - cols * 26) / 2, wy = H - h + 22 + r * 34;
        svgEl("rect", { x: wx, y: wy, width: 13, height: 19, rx: 1.5, class: "win" }, g);
        var l = svgEl("rect", { x: wx, y: wy, width: 13, height: 19, rx: 1.5, class: "lit" }, g); lits.push({ el: l, k: rnd(), depth: depth });
      }
    };
    var x = -40; while (x < W) { var w = 160 + rnd() * 160; block(far, x, w, 260 + rnd() * 160, "far", 0.5); x += w + 30 + rnd() * 60; }
    x = -20; while (x < W) { var w2 = 210 + rnd() * 190; block(near, x, w2, 300 + rnd() * 230, "", 1); x += w2 + 60 + rnd() * 90; }
    lits.sort(function (a, b) { return a.k - b.k; });
    var beats = $$(".dorms__beat", root), lit = 0.02;
    var paint = function () { var n = Math.floor(lits.length * lit); lits.forEach(function (o, i) { o.on = i < n; }); };
    // windows flicker on and off a little all the time: rooms are lived in
    FL.loop(root, function (t) {
      lits.forEach(function (o, i) { var f = o.on ? (Math.sin(t * (0.3 + o.k) + i) > -0.92 ? 1 : 0.15) : 0; o.el.style.opacity = f; });
    });
    if (FL.reduced) { lit = 1; paint(); return; }
    paint();
    var tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: $(".dorms__pin", root), start: "top top", end: "+=" + (beats.length * 90) + "%", pin: true, scrub: 0.6,
      onUpdate: function (st) { lit = 0.02 + st.progress * 0.9; paint(); } } });
    tl.to(far, { y: -20, duration: beats.length }, 0).to(near, { y: -45, duration: beats.length }, 0);
    tl.to({}, { duration: 0.5 }, 0);
    for (var b = 1; b < beats.length; b++) {
      tl.to(beats[b - 1], { opacity: 0, y: -30, duration: 0.35 }, b - 0.4).fromTo(beats[b], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45 }, b - 0.2);
    }
  };

  /* ---------- campus journey on the real map (OpenStreetMap): the camera walks the route to The Hub ---------- */
  var campus = function (root, gsap) {             // Every road leads here: six real walking routes converge on The Hub
    var host = $(".map__svg", root), labels = $(".map__labels", root);
    var ROADS = [["Johnson Center", "the middle of campus"], ["Fenwick Library", "where you study"], ["Lecture Hall", "where you learn", null, "left"],
                 ["Commonwealth Hall", "where you live"], ["Liberty Square", "where you live"], ["Rappahannock Parking Deck", "where you park", "Rappahannock Deck"]];
    fetch(root.getAttribute("data-map") || "data/campus.json").then(function (r) { return r.json(); }).then(function (D) {
      var hub = D.hub, roads = ROADS.map(function (rd) {
        var w = D.walks.filter(function (x) { return x.from === rd[0]; })[0]; if (!w) return null;
        var R = w.route.slice(); if (Math.hypot(R[R.length - 1][0] - hub[0], R[R.length - 1][1] - hub[1]) > 4) R.push(hub);
        var seg = [0]; for (var i = 1; i < R.length; i++) seg.push(seg[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]));
        return { name: rd[2] || rd[0], sub: rd[1], left: rd[3] === "left", min: w.minutes, R: R, seg: seg, len: seg[seg.length - 1] };
      }).filter(Boolean);
      // a still camera that holds the whole story: every road and The Hub, with room for the headline
      var xs = [], ys = []; roads.forEach(function (r) { r.R.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
      var box0 = [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
      var svg = svgEl("svg", { class: "map__svg-el", preserveAspectRatio: "xMidYMid meet" }, host); svg.style.width = "100%"; svg.style.height = "100%";
      var gp = svgEl("g", {}, svg), gb = svgEl("g", {}, svg), gr = svgEl("g", {}, svg), gd = svgEl("g", {}, svg);
      var near = function (b, x0, y0, x1, y1) { var p = b.p[0]; return p[0] > x0 && p[0] < x1 && p[1] > y0 && p[1] < y1; };
      var pad = 260, X0 = box0[0] - pad, Y0 = box0[1] - pad, X1 = box0[2] + pad, Y1 = box0[3] + pad;
      D.paths.forEach(function (p) { if (p.some(function (q) { return q[0] > X0 && q[0] < X1 && q[1] > Y0 && q[1] < Y1; })) svgEl("polyline", { points: p.join(" "), class: "pth" }, gp); });
      var hubEl = null;
      D.buildings.forEach(function (b) {
        if (!near(b, X0, Y0, X1, Y1)) return;
        var isHub = b.n === "The HUB", isFrom = roads.some(function (r) { return b.n && r.name.indexOf(b.n.split(" ")[0]) === 0 && Math.hypot(b.p[0][0] - r.R[0][0], b.p[0][1] - r.R[0][1]) < 160; });
        var el = svgEl("polygon", { points: b.p.join(" "), class: "b" + (b.n ? " named" : "") + (isFrom ? " from" : "") + (isHub ? " hub" : "") }, gb);
        if (isHub) hubEl = el;
      });
      roads.forEach(function (r) {
        r.line = svgEl("polyline", { class: "road", points: "" }, gr);
        r.origin = svgEl("circle", { class: "origin", cx: r.R[0][0], cy: r.R[0][1], r: 5 }, gd);
        r.dot = svgEl("circle", { class: "dot", cx: r.R[0][0], cy: r.R[0][1], r: 6 }, gd);
        var lab = document.createElement("p"); lab.className = "map__label"; lab.innerHTML = "<b>" + r.name + "<i> · " + r.min + " min</i></b><span>" + r.sub + " · " + r.min + " min</span>"; labels.appendChild(lab); r.lab = lab;
      });
      var end = roads[0].R[roads[0].R.length - 1], ring = svgEl("circle", { class: "ring", cx: end[0], cy: end[1], r: 0 }, gd);
      var pin = svgEl("circle", { class: "hubpin", cx: end[0], cy: end[1], r: 0 }, gd);   // the destination: a point, where every road ends
      var hubLab = document.createElement("p"); hubLab.className = "map__label is-hub"; hubLab.innerHTML = "<b>The Hub</b><span>where the church meets</span>"; labels.appendChild(hubLab);
      // timing on the scroll: the roads set out one after another and all arrive before the section lets go
      var maxLen = Math.max.apply(null, roads.map(function (r) { return r.len; }));
      roads.forEach(function (r, i) { r.t0 = 0.03 + Math.floor(i / 2) * 0.1 + (i % 2) * 0.03; r.t1 = Math.min(0.82, r.t0 + 0.34 + 0.2 * (r.len / maxLen)); });   // Revision 40: the roads set out in overlapping pairs; all arrive by .82
      var arriveFirst = Math.min.apply(null, roads.map(function (r) { return r.t1; })), arriveLast = Math.max.apply(null, roads.map(function (r) { return r.t1; }));
      var vb = [0, 0, 1, 1], scale = 1;
      var frame = function () {                        // fit the story to the screen, leaving the headline its corner
        var rect = host.getBoundingClientRect(), small = rect.width < 768, w = box0[2] - box0[0] + 160, h = box0[3] - box0[1] + 160;
        var cx = (box0[0] + box0[2]) / 2, cy = (box0[1] + box0[3]) / 2, aspect = rect.width / Math.max(1, rect.height);
        if (small) { h = h / 0.62; cy -= h * 0.12; } else { w = w / 0.64; cx -= w * 0.16; h = h / 0.84; cy -= h * 0.04; }       // headline: top on a phone, left on a laptop; headroom under the nav
        if (w / h < aspect) w = h * aspect; else h = w / aspect;
        vb = [cx - w / 2, cy - h / 2, w, h]; scale = rect.width / w;
      };
      var at = function (r, d) { for (var i = 1; i < r.seg.length; i++) if (r.seg[i] >= d) { var t = (d - r.seg[i - 1]) / ((r.seg[i] - r.seg[i - 1]) || 1); return [r.R[i - 1][0] + (r.R[i][0] - r.R[i - 1][0]) * t, r.R[i - 1][1] + (r.R[i][1] - r.R[i - 1][1]) * t, i]; } var e = r.R[r.R.length - 1]; return [e[0], e[1], r.R.length]; };
      var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
      var place = function (el, x, y) { var sx = (x - vb[0]) * scale, sy = (y - vb[1]) * scale; el.style.transform = "translate3d(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px,0)"; };
      var set = function (p) {
        var push = 1 - 0.05 * p, w = vb[2] * push, h = vb[3] * push, x = vb[0] + (vb[2] - w) / 2, y = vb[1] + (vb[3] - h) / 2;   // a slow push-in: never still
        svg.setAttribute("viewBox", [x, y, w, h].map(function (v) { return v.toFixed(1); }).join(" "));
        var s = scale / push, px = 1 / s, live = { vb: [x, y], s: s };
        roads.forEach(function (r) {
          var k = ease(clamp((p - r.t0) / (r.t1 - r.t0), 0, 1)), d = k * r.len, hp = at(r, d);
          var pts = r.R.slice(0, hp[2]).map(function (q) { return q.join(","); }); pts.push(hp[0].toFixed(1) + "," + hp[1].toFixed(1));
          r.line.setAttribute("points", k > 0 ? pts.join(" ") : "");          // the line is built up to the traveller: it can never detach
          r.dot.setAttribute("cx", hp[0].toFixed(1)); r.dot.setAttribute("cy", hp[1].toFixed(1));
          r.dot.setAttribute("r", (k > 0 && k < 1 ? 6.5 : 0) * px); r.origin.setAttribute("r", 4.5 * px);
          r.origin.classList.toggle("is-on", p >= r.t0 - 0.03);
          var sx = (r.R[0][0] - x) * s, sy = (r.R[0][1] - y) * s; r.lab.classList.toggle("flip", (r.left && sx > 190) || sx > host.clientWidth * 0.66); r.lab.style.transform = "translate3d(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px,0)";   // near the right edge a label sits to the left of its point
          r.lab.style.opacity = clamp((p - r.t0 + 0.05) / 0.06, 0, 1).toFixed(2);
        });
        var lit = clamp((p - arriveFirst + 0.02) / 0.06, 0, 1);
        if (hubEl) { hubEl.style.fillOpacity = (0.06 + 0.16 * lit).toFixed(2); }
        pin.setAttribute("r", ((7 + 3 * lit) * px).toFixed(2)); pin.style.fill = lit > 0.5 ? "var(--red)" : "#fff";
        var rk = clamp((p - arriveLast) / 0.09, 0, 1);                       // when the last road arrives, the Hub answers once
        ring.setAttribute("r", (rk * 46 * px * 1.2).toFixed(2)); ring.style.opacity = rk > 0 && rk < 1 ? (1 - rk).toFixed(2) : 0;
        var hx = (end[0] - x) * s; hubLab.classList.toggle("flip", hx > host.clientWidth * 0.62); hubLab.style.transform = "translate3d(" + hx.toFixed(1) + "px," + ((end[1] - y) * s - 30).toFixed(1) + "px,0)";   // the label sits clear above-right of the point
        hubLab.style.opacity = p >= arriveFirst ? 1 : 0;   // red stays solid: the label appears, it never fades through pink
      };
      var cur = 0; frame(); set(0);
      addEventListener("resize", function () { frame(); set(cur); });
      if (FL.reduced) { set(1); return; }
      window.ScrollTrigger.create({ trigger: $(".map__pin", root), start: "top top", end: "+=150%", pin: true, scrub: true, onUpdate: function (st) { cur = st.progress; set(cur); } });   // Revision 38/40: locked 1:1 to the scroll; half the length
      // this pin is created late (after the map data loads) but sits above other pins: re-order every pin by page position
      window.ScrollTrigger.sort(); window.ScrollTrigger.refresh();
    });
  };


  /* ---------- Known by Name: faces arrive one by one, names write themselves on. No thread (Revision 17). ---------- */
  var known = function (root, gsap) {
    var tiles = $$(".known__p", root); if (FL.reduced || !tiles.length) return;
    gsap.set(tiles, { opacity: 0, y: 26 }); gsap.set($$(".known__name", root), { clipPath: "inset(0 100% 0 0)" });
    window.ScrollTrigger.batch(tiles, { start: "top 88%", once: true, onEnter: function (els) {
      gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 });
      gsap.to(els.map(function (e) { return $(".known__name", e); }), { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power2.out", stagger: 0.08, delay: 0.35 });
    } });
  };

  /* ---------- light beam (words are dark until light falls on them) ---------- */
  var beam = function (root) {                     // the first flashlight (Revision 31, restored by Revision 37)
    if (FL.reduced) return;
    var ptr = FL.pointer(root), a = 40, last = 0;
    FL.loop(root, function (t) {
      var dt = Math.min(0.05, t - last || 0.016); last = t;
      var r = root.getBoundingClientRect(), small = FL.small(), ox = (small ? 0.5 : 0.06) * r.width, oy = r.height, target;
      var lo = small ? -58 : 10, hi = small ? 58 : 86;
      if (ptr.active) target = Math.atan2(ptr.px - ox, -(ptr.py - oy)) * 180 / Math.PI;      // a pointer or a finger aims it
      else {                                             // otherwise the scroll sweeps it across the dark, with a slow breath
        var prog = clamp(-r.top / Math.max(1, r.height * 0.9), 0, 1);
        target = lo + (hi - lo) * (0.5 + 0.5 * Math.sin(t * 0.42 + prog * 5.2));
      }
      a += (target - a) * Math.min(1, dt * 7); root.style.setProperty("--a", a.toFixed(2) + "deg");
    });
  };


  /* ---------- origin: one line from Legon (2012) to Fairfax, drawn by scroll ---------- */
  var origin = function (root, gsap) {
    var host = $(".origin__map", root);
    fetch(root.getAttribute("data-dots") || "../explore/data/world-dots.json").then(function (r) { return r.json(); }).then(function (D) {
      var small = FL.small(), L0 = small ? -95 : -110, L1 = small ? 15 : 30, A0 = 62, A1 = -8, W = 1000, H = W * (A0 - A1) / (L1 - L0);
      var X = function (lon) { return (lon - L0) / (L1 - L0) * W; }, Y = function (lat) { return (A0 - lat) / (A0 - A1) * H; };
      var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H.toFixed(0), role: "img", "aria-label": "A line from Legon, Accra, Ghana to Fairfax, Virginia" }, host);
      var r = (W / ((L1 - L0) / D.step)) * 0.28;
      D.dots.forEach(function (d) { if (d[0] >= L0 && d[0] <= L1 && d[1] <= A0 && d[1] >= A1) svgEl("circle", { cx: X(d[0]).toFixed(1), cy: Y(d[1]).toFixed(1), r: r.toFixed(2), class: "dot" }, svg); });
      var a = [X(-0.19), Y(5.65)], b = [X(-77.31), Y(38.83)], mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - H * 0.32;
      var path = svgEl("path", { d: "M" + a + " Q" + mx + "," + my + " " + b, class: "arc" }, svg);
      var mk = function (p, lines, anchor, dy) { var g = svgEl("g", {}, svg); svgEl("circle", { cx: p[0], cy: p[1], r: 11, class: "ring" }, g); svgEl("circle", { cx: p[0], cy: p[1], r: 4.5, class: "pin" }, g);
        lines.forEach(function (t, i) { var tx = svgEl("text", { x: p[0] + (anchor === "end" ? -20 : 20), y: p[1] + dy + i * (small ? 24 : 17), "text-anchor": anchor, class: "lbl" + (i ? " sub" : "") }, g); tx.textContent = t; }); return g; };
      mk(a, ["2012 // Legon, Accra", "University of Ghana"], "start", 30);
      var end = mk(b, ["Now // Fairfax, Virginia", "George Mason University"], "end", 34);
      var len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = FL.reduced ? 0 : len;
      if (FL.reduced) return;
      end.style.opacity = 0;
      gsap.timeline({ scrollTrigger: { trigger: host, start: "top 75%", end: "bottom 45%", scrub: 0.6 } }).to(path, { strokeDashoffset: 0, ease: "none", duration: 1 }).to(end, { opacity: 1, duration: 0.2 }, 0.85);
    });
  };


  /* ---------- CHURCH ON CAMPUS: the big line assembles from scattered words and scrolls through the pictures ---------- */
  var coc = function (root, gsap) {
    var l1 = $(".coc__l1", root), l2 = $(".coc__l2", root), cols = $$(".coc__col", root), p = 0, d = 0;
    FL.loop(root, function () {                     // the type never stops: a slow drift on top of the scroll
      d += 0.02;
      l1.style.transform = "translate3d(" + (4 - p * 7).toFixed(2) + "vw,0,0)";
      l1.style.translate = (Math.sin(d * 0.6) * 1.2).toFixed(2) + "vw 0";
      l1.style.backgroundPosition = (50 + Math.sin(d * 0.21) * 14 + (p - 0.5) * 30).toFixed(2) + "% " + (38 + Math.cos(d * 0.17) * 6).toFixed(2) + "%";   // the picture inside the letters pans at its own rate (Revision 32)
      l2.style.transform = "translate3d(" + (3 + p * 8).toFixed(2) + "vw,0,0)";
      l2.style.translate = (Math.cos(d * 0.5) * 1.2).toFixed(2) + "vw 0";
      cols.forEach(function (c, i) { c.style.transform = "translate3d(0," + (-(p * (18 + i * 9)) - Math.sin(d * 0.3 + i) * 1.5).toFixed(2) + "vh,0)"; });
    });
    if (FL.reduced) return;
    window.ScrollTrigger.create({ trigger: $(".coc__pin", root), start: "top top", end: "+=180%", pin: true, scrub: 0.6, onUpdate: function (st) { p = st.progress; } });
  };

  /* ---------- sliding outlined type through full-bleed photography, one word solid red ---------- */
  var slide = function (root, gsap) {
    var rows = $$(".slide__row", root), ghosts = $$(".slide__ghost", root), img = $(".slide__photo img", root), off = rows.map(function () { return 0; }), g = 0;
    FL.loop(root, function () { rows.forEach(function (r, i) { off[i] += (i % 2 ? 0.012 : -0.012); }); g += 0.02;
      ghosts.forEach(function (gh, i) { gh.style.transform = "translate3d(" + ((i % 2 ? -30 : -10) + (i % 2 ? -1 : 1) * (g + p * 25)).toFixed(2) + "vw,0,0)"; }); apply(); });
    var p = 0, apply = function () { var sc = 0.72 + 0.28 * Math.min(1, p * 2.2); rows.forEach(function (r, i) { r.style.transform = "translate3d(" + ((i % 2 ? -45 + p * 40 : -5 - p * 40) + off[i]).toFixed(2) + "vw,0,0) scale(" + sc.toFixed(3) + ")"; }); };
    if (FL.reduced) { apply(); return; }
    window.ScrollTrigger.create({ trigger: $(".slide__pin", root), start: "top top", end: "+=220%", pin: true, scrub: 0.6, onUpdate: function (st) { p = st.progress; if (img) img.style.transform = "scale(" + (1.12 - 0.12 * p).toFixed(3) + ")"; } });
  };

  /* ---------- the forms send to the church (2026-11-05): NOVA's website-intake function, nothing else. It answers 201 (saved),
     or 400 with a reason in plain words, shown to the visitor as it is. Only the three hosts the function accepts send for
     real (Mason 360 and the GitHub host); anywhere else, ?send=off, and the storyboard hook do a dry run. ---------- */
  var LIVE = /(^|\.)mason360\.gmu\.edu$|^amokofdar-cmd\.github\.io$/.test(location.hostname);
  FL.dry = !LIVE || new URLSearchParams(location.search).get("send") === "off";
  FL.send = function (body) {
    var c = FL.config.intake; body.source = "website";
    if (FL.dry) { console.info("[First Love] dry run, not sent:", body.kind); return Promise.resolve({ status: 201, dry: true }); }
    return fetch(c.url, { method: "POST", headers: { "Content-Type": "application/json", apikey: c.key, Authorization: "Bearer " + c.key }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, why: j && j.error }; }); },
            function () { return { status: 0 }; });
  };
  FL.sendErr = function (res) { return res.status === 400 && res.why ? res.why.charAt(0).toUpperCase() + res.why.slice(1) : "That did not send. Please try again in a moment."; };
  var ymd = function (d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  var hp = function (form) { var h = $("[name=company]", form); return h ? h.value : ""; };   // the honeypot: hidden, always empty from a person

  /* ---------- the seats: your name writes itself on the chair as you type (Revisions 14, 15, 20, 22) ---------- */
  var CHAIR = '<svg viewBox="0 0 160 230" aria-hidden="true"><rect class="back" x="14" y="6" width="132" height="112" rx="16"/><path class="seam" d="M24 18h112"/>' +
    '<path class="frame" d="M18 116v18 M142 116v18"/><rect class="seat" x="8" y="128" width="144" height="18" rx="6"/>' +
    '<path class="frame" d="M22 146l-6 80 M138 146l6 80 M34 146l4 60 M126 146l-4 60"/></svg>';
  var chair = function (name, label, cls) { var d = document.createElement("div"); d.className = "chair " + (cls || ""); d.innerHTML = CHAIR + (name ? '<p class="chair__card"><small>' + label + "</small>" + name + "</p>" : ""); return d; };
  /* one among many (Revision 26): rows of church chairs seen from behind; your chair lights up, your friends' beside it */
  var ROWS = [9, 8, 7];                           // a small room: back row to front row; your chair is front and centre
  var congregation = function (into, n) {
    into.innerHTML = "";
    ROWS.forEach(function (count, r) {
      var row = document.createElement("div"); row.className = "crow"; row.style.setProperty("--s", (0.62 + r * 0.19).toFixed(3));
      var front = r === ROWS.length - 1, mid = Math.floor(count / 2);
      for (var c = 0; c < count; c++) {
        var you = front && c === mid, friend = front && n.friend && c === mid + 1;
        row.appendChild(chair(you ? (n.you || "Your name") : friend ? "Your friend" : "", "Saved for", you ? "lit is-you" : friend ? "lit is-friend" : ""));
      }
      into.appendChild(row);
    });
  };

  var seats = function (root) {
    var form = $("form", root), nameI = $("[name=name]", form), friendI = $("[name=friend]", form), pick = $("[data-gatherings]", form), html = document.documentElement;
    var up = FL.upcoming(4, 21);
    pick.innerHTML = up.map(function (u, i) {
      var day = u.start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), time = u.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return '<label class="gpick__opt"><span class="gpick__txt"><strong>' + u.title + '</strong><span class="gpick__when">' + day + " · " + time + '</span><span class="gpick__where">' + u.where + "</span></span>" +
        '<input type="radio" name="gathering" value="' + i + '"' + (i ? "" : " checked") + '><span class="gpick__mark" aria-hidden="true"></span></label>';   // one gathering per row: name, then when, then where
    }).join("");
    var chosen = function () { var r = $("input[name=gathering]:checked", form); return up[r ? +r.value : 0]; };
    var names = function () { return { you: (nameI.value || "").trim().replace(/\s+/g, " "), friend: friendI.checked }; };
    var over = $(".seated", root.closest("section") || document), say = $(".seated__say", over), spec = $(".seated__spec", over), cong = $(".congregation", over);
    var where = function () { var u = chosen(); return u ? u.title + " // " + FL.when(u.start) + " // " + u.where : ""; };
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var n = names();
      if (!n.you) {                                      // a name is the one thing we need: say so plainly (Revision 47: no shake anywhere)
        nameI.focus(); nameI.setAttribute("aria-invalid", "true"); nameI.placeholder = "Your first and last name, so we can save your seat";
        return;
      }
      nameI.removeAttribute("aria-invalid");
      var u = chosen(), btn = $("button[type=submit]", form), err = $(".form__err", form);
      if (!u) return;
      btn.disabled = true; if (err) err.hidden = true;
      FL.send({ kind: "registration", gathering_key: u.intake || "special", gathering_date: ymd(u.start), name: n.you, email: null,
        phone: ($("[name=phone]", form).value || "").trim() || null, seats: n.friend ? 2 : 1, needs_lift: $("[name=lift]", form).checked, company: hp(form) })
        .then(function (res) {
          btn.disabled = false;
          if (res.status !== 201) { if (err) { err.textContent = FL.sendErr(res); err.hidden = false; } return; }
          show(n);
        });
    });
    var show = function (n) {
      congregation(cong, n);
      say.textContent = n.you ? "Your seat is saved, " + n.you.split(" ")[0] + "." : "Your seat is saved.";
      spec.innerHTML = where().replace(/\/\//g, '<span class="sep">//</span>');
      over.classList.add("is-on"); html.style.overflow = "hidden"; if (FL.lenis) FL.lenis.stop(); $(".seated__close", over).focus();
      if (!FL.reduced && window.gsap) {                   // the room fills in, row by row; your chair settles last, with a small spring
        gsap.fromTo($$(".crow .chair:not(.lit)", cong), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.012 });
        gsap.fromTo($$(".chair.lit", cong), { scale: 0.9, y: 24, opacity: 0, transformOrigin: "50% 100%" }, { scale: 1, y: 0, opacity: 1, duration: 0.52, delay: 0.35, ease: "back.out(2.4)", stagger: 0.1 });
        gsap.fromTo([say, spec, $(".seated__acts", over)], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.55, ease: "power3.out", stagger: 0.06 });
      }
    };
    var m360 = $(".seated__m360", over);                 // the hand-off: register on Mason 360 too (the events list; the line above names the gathering and its date)
    if (m360) m360.addEventListener("click", function () { location.href = FL.config.links.mason360Events; });
    $(".seated__close", over).addEventListener("click", function () { over.classList.remove("is-on"); html.style.overflow = ""; if (FL.lenis) FL.lenis.start(); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && over.classList.contains("is-on")) $(".seated__close", over).click(); });
    $(".seated__save", over).addEventListener("click", function () { saveSeat(names(), where()); });
    var q = new URLSearchParams(location.search);       // storyboard hook: ?seats=Ama%20Mensah&friend=1&submit=1
    if (q.get("seats")) { FL.dry = true; nameI.value = q.get("seats"); friendI.checked = q.get("friend") === "1"; if (q.get("submit") === "1") setTimeout(function () { form.requestSubmit(); }, 600); }
  };
  /* the seat becomes the invitation: a shareable image of your saved seat(s) (Revision 16) */
  var saveSeat = function (n, where) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
    ROWS.forEach(function (count, r) {
      var s = 0.62 + r * 0.19, cw = 92 * s, gap = 14 * s, total = count * cw + (count - 1) * gap, x0 = (W - total) / 2, y = 470 + r * 150 * s + r * 30, mid = Math.floor(count / 2), front = r === ROWS.length - 1;
      for (var col = 0; col < count; col++) {
        var you = front && col === mid, fr = front && n.friend && col === mid + 1, on = you || fr, cx = x0 + col * (cw + gap);
        x.fillStyle = "#2A2A2A"; x.beginPath(); x.roundRect(cx, y, cw, cw * 0.82, 8 * s); x.fill(); if (on) { x.strokeStyle = "#EE0408"; x.lineWidth = 6 * s; x.stroke(); }   // red outlines the seat; the name stays black
        x.strokeStyle = "#8A8A8A"; x.lineWidth = 3 * s; x.beginPath(); x.moveTo(cx + 6 * s, y + cw * 0.9); x.lineTo(cx + 2 * s, y + cw * 1.45); x.moveTo(cx + cw - 6 * s, y + cw * 0.9); x.lineTo(cx + cw - 2 * s, y + cw * 1.45); x.stroke();
        if (on) { x.fillStyle = "#fff"; x.fillRect(cx + cw * 0.08, y + cw * 0.22, cw * 0.84, cw * 0.3); x.fillStyle = "#0B0B0B"; x.font = "800 " + Math.round(12 * s) + "px Archivo, sans-serif"; x.textAlign = "center"; x.fillText((you ? n.you || "You" : "Your friend").toUpperCase(), cx + cw / 2, y + cw * 0.42, cw * 0.78); }
      }
    });
    x.textAlign = "left"; x.fillStyle = "#0B0B0B"; x.font = "900 92px Archivo, sans-serif"; x.fillText("A SEAT IS SAVED.", 80, 200);
    x.font = "500 28px 'IBM Plex Mono', monospace"; x.fillStyle = "#555"; x.fillText(("First Love Church // " + where).toUpperCase().slice(0, 64), 80, 270);
    x.fillStyle = "#EE0408"; x.fillRect(80, H - 110, 120, 8);
    var a = document.createElement("a"); a.download = "my-seat-first-love.png"; a.href = c.toDataURL("image/png"); a.click();
  };

  /* ---------- WILD CARD W1 (Claude original): the next gathering, counting down live ---------- */
  var nextGathering = function (root) {
    var what = $(".next__what", root), when = $(".next__when", root), clock = $(".next__clock", root), prev = "";
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var draw = function () {
      var now = new Date(), b = FL.upcoming(1, 8, true)[0]; if (!b) return;
      what.textContent = b.title; when.innerHTML = b.start.toLocaleDateString("en-US", { weekday: "long" }) + '<span class="sep">//</span>' + b.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + '<span class="sep">//</span>' + b.where;
      if (now >= b.start) { if (prev !== "live") clock.innerHTML = '<span class="live">Happening now</span>'; prev = "live"; return; }
      var s = Math.floor((b.start - now) / 1000), parts = [[Math.floor(s / 86400), "days"], [Math.floor(s % 86400 / 3600), "hrs"], [Math.floor(s % 3600 / 60), "min"], [s % 60, "sec"]];
      clock.innerHTML = parts.map(function (p, i) { return '<span><b class="digit' + (prev && prev.split("|")[i] !== String(p[0]) ? " tick" : "") + '">' + pad(p[0]) + "</b><small>" + p[1] + "</small></span>"; }).join("");
      prev = parts.map(function (p) { return p[0]; }).join("|");
    };
    draw(); setInterval(draw, 1000);
  };

  /* ---------- WILD CARD W2 (Claude original): how far is The Hub from where you are? Real paths, real minutes. ---------- */
  var walk = function (root, gsap) {
    fetch(root.getAttribute("data-map") || "data/campus.json").then(function (r) { return r.json(); }).then(function (D) {
      var sel = $("select", root), num = $(".walk__num", root), host = $(".walk__map", root);
      // every on-campus residence hall first (Mason Housing's names), then the other places on campus
      [["hall", "Residence halls"], ["place", "Around campus"]].forEach(function (g) {
        var og = document.createElement("optgroup"); og.label = g[1];
        D.walks.filter(function (w) { return (w.kind || "place") === g[0]; }).sort(function (a, b) { return (a.label || a.from).localeCompare(b.label || b.from); })
          .forEach(function (w) { var o = document.createElement("option"); o.value = w.from; o.textContent = (w.label || w.from).replace("Rappahannock Parking Deck", "Rappahannock parking deck"); og.appendChild(o); });
        if (og.children.length) sel.appendChild(og);
      });
      sel.value = "Commonwealth Hall";
      var svg = svgEl("svg", { preserveAspectRatio: "xMidYMid meet" }, host), gb = svgEl("g", {}, svg), polys = [];
      D.buildings.forEach(function (b) { if (!b.n) return; var p = svgEl("polygon", { points: b.p.join(" "), class: "b" + (b.n === "The HUB" ? " hub" : "") }, gb); polys.push({ el: p, n: b.n }); });
      var route = svgEl("polyline", { class: "route" }, svg);
      var show = function () {
        var w = D.walks.filter(function (x) { return x.from === sel.value; })[0]; if (!w) return;
        polys.forEach(function (p) { p.el.classList.toggle("from", p.n === w.from); });
        route.setAttribute("points", w.route.join(" "));
        var xs = w.route.map(function (p) { return p[0]; }).concat(D.hub[0]), ys = w.route.map(function (p) { return p[1]; }).concat(D.hub[1]);
        var x0 = Math.min.apply(null, xs) - 90, y0 = Math.min.apply(null, ys) - 90, ww = Math.max.apply(null, xs) + 90 - x0, hh = Math.max.apply(null, ys) + 90 - y0, m = Math.max(ww, hh);
        svg.setAttribute("viewBox", [x0 - (m - ww) / 2, y0 - (m - hh) / 2, m, m].map(function (v) { return v.toFixed(1); }).join(" "));
        var L = route.getTotalLength ? route.getTotalLength() : 1000; route.style.strokeDasharray = L;
        if (FL.reduced) { route.style.strokeDashoffset = 0; num.textContent = w.minutes; return; }
        gsap.fromTo(route, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" });
        var o = { v: 0 }; gsap.to(o, { v: w.minutes, duration: 1.1, ease: "power2.out", onUpdate: function () { num.textContent = Math.round(o.v); } });
      };
      sel.addEventListener("change", show); show();
    });
  };


  /* ---------- scroll variety (Revision 23): pictures grow, shrink, expand, drift; words brighten ---------- */
  var growShrink = function (el, gsap) {          // grow: a card swells to full width as it passes; shrink: full-bleed settles into a framed card
    if (FL.reduced) return; var grow = el.getAttribute("data-fx") === "grow";
    gsap.fromTo(el, grow ? { scale: 0.62, borderRadius: 18 } : { scale: 1, borderRadius: 0 }, { scale: grow ? 1 : 0.7, borderRadius: grow ? 0 : 18, ease: "none",
      scrollTrigger: { trigger: el, start: grow ? "top 95%" : "top 30%", end: grow ? "center 50%" : "bottom 20%", scrub: 0.6 } });
  };
  var expand = function (root, gsap) {            // a small picture opens to full-bleed while the line arrives over it
    var img = $(".expand__img", root), say = $(".expand__say", root);
    if (FL.reduced) { img.style.clipPath = "inset(0)"; say.style.opacity = 1; return; }
    gsap.timeline({ scrollTrigger: { trigger: $(".expand__pin", root), start: "top top", end: "+=170%", pin: true, scrub: 0.7, invalidateOnRefresh: true } })
      .fromTo(img, { clipPath: function () {             // start from a full portrait card, never a sliver (Revision 34)
          var vw = innerWidth, vh = innerHeight, h = vh * 0.56, w = Math.min(vw * 0.8, h * 0.8), y = (vh - h) / 2, x = (vw - w) / 2;
          return "inset(" + y + "px " + x + "px " + y + "px " + x + "px)"; } },
        { clipPath: "inset(0px 0px 0px 0px)", ease: "power2.inOut", duration: 1 })
      .to(say, { opacity: 1, y: 0, duration: 0.4 }, 0.7).from(say, { y: 40, duration: 0.4 }, 0.7).to({}, { duration: 0.4 });
  };
  var drift = function (root) {                   // a row of pictures drifts on its own and runs against the scroll
    var row = $(".drift__row", root), x = 0, s0 = 0, vis = false;
    if (window.ScrollTrigger) window.ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onUpdate: function (st) { s0 = st.progress; } });
    FL.loop(root, function () { if (!FL.reduced) x -= 0.04; var w = row.scrollWidth / 2; var tx = ((x - s0 * 30) % (w / innerWidth * 100)); row.style.transform = "translate3d(" + tx.toFixed(2) + "vw,0,0)"; });
  };
  var manifesto = function () {};                  // Revision 41.4c: solid white on solid red from the first frame; nothing to animate


  /* ---------- Known by Name (frame 13): the scroll travels INTO the wall and back out; the wall is the settled state ---------- */
  /* ---------- Known by Name (Revisions 27-28): portraits come in from scattered places and GATHER into the cross;
     once it stands, the line lands beneath it; then the page continues. Gather -> cross -> the words -> continue. ---------- */
  var kbn = function (root, gsap) {
    // Kofi, 2026-11-04: faces must never arrive empty. Fetch and decode all of them as soon as the intro is done (or at once)
    var ready = function () { $$(".kbn__t img", root).forEach(function (im) { im.loading = "eager"; im.decoding = "sync"; if (im.decode) im.decode().catch(function () {}); }); };
    if ($(".ent") && !FL.introDone) addEventListener("fl:intro-done", ready, { once: true }); else ready();
    var view = $(".kbn__view", root), tiles = $$(".kbn__t", root), names = $$(".kbn__n", root), care = $(".kbn__care", root);
    if (FL.reduced) return;
    var rnd = seeded(28);
    var scatter = tiles.map(function () {                       // every face starts somewhere different around the stage
      var a = rnd() * Math.PI * 2, d = 0.45 + rnd() * 0.55;      // scattered across the stage, still on screen, so you see them come in
      return { x: Math.cos(a) * d * innerWidth * 0.48, y: Math.sin(a) * d * innerHeight * 0.4, r: (rnd() - 0.5) * 50, s: 0.55 + rnd() * 0.45 };
    });
    tiles.forEach(function (t, i) { gsap.set(t, { x: scatter[i].x, y: scatter[i].y, rotation: scatter[i].r, scale: scatter[i].s, opacity: 0.9 }); });
    gsap.set(names, { opacity: 0 }); gsap.set(care, { opacity: 0, y: 40 });
    var order = tiles.map(function (t, i) { return i; }).sort(function () { return rnd() - 0.5; });
    // the gather runs continuously while the section rises into view, every face moving at once on its own curve,
    // and lands exactly as the section pins (Revision 35: no stagnant scattered plateau, no sudden final arrange)
    var g = gsap.timeline({ scrollTrigger: { trigger: $(".kbn__pin", root), start: "top 95%", end: "top top", scrub: true } });   // 1:1 with the scroll
    order.forEach(function (i, k) { g.to(tiles[i], { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 1, ease: "power2.inOut" }, k * (0.6 / order.length)); });
    // Revision 40: no camera tour. The cross stands, the names resolve, the line lands, the section hands off (pin: one viewport)
    var tl = gsap.timeline({ scrollTrigger: { trigger: $(".kbn__pin", root), start: "top top", end: "+=100%", pin: true, scrub: true, invalidateOnRefresh: true } });
    tl.to(names, { opacity: 1, duration: 0.35, stagger: 0.08 }, 0)
      .to(care, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.25)
      .to({}, { duration: 0.35 });
  };

  /* ---------- the picture becomes the writing (Revision 26 invention): a photograph shrinks into the letters ---------- */
  var maskZoom = function (root, gsap) {          // opens on the whole photograph, which then gathers into the letters: never an empty screen (Revision 34)
    var word = $(".mz__word", root), full = $(".mz__full", root); if (FL.reduced) { if (full) full.style.display = "none"; return; }
    var tl = gsap.timeline({ scrollTrigger: { trigger: $(".mz__pin", root), start: "top top", end: root.classList.contains("mz--band") ? "+=110%" : "+=200%", pin: true, scrub: 0.7 } });   // as a band it is a chapter break, short
    tl.fromTo(word, { scale: 2.6 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0);
    if (full) tl.fromTo(full, { opacity: 1, scale: 1.08 }, { opacity: 0, scale: 1, ease: "power1.inOut", duration: 0.5 }, 0.12);
  };



  /* ---------- Revision 31: one primary behaviour per section, no effect repeated down a page ---------- */
  var assemble = function (h, gsap) {             // the hero title: each word rises out of its own mask, so no two words ever cross;
    if (FL.reduced) return;                         // the sentence and the scripture wait until the title stands (Revision 34)
    h.innerHTML = h.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wm"><span class="w">' + w + "</span></span>"; }).join(" ");
    var after = $$(".mission__say, .mission__scripture, .mission__spec", h.parentElement);
    after.forEach(function (el) { el.classList.remove("reveal"); });
    gsap.set($$(".w", h), { yPercent: 115 }); gsap.set(after, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" });
    var play = function () {
      gsap.timeline()
        .to($$(".w", h), { yPercent: 0, duration: 1.05, stagger: 0.13, ease: "expo.out" })
        .to(after, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, stagger: 0.15, ease: "power2.out" }, "-=0.35");
    };
    var go = function () { window.ScrollTrigger.create({ trigger: h, start: "top 88%", once: true, onEnter: play }); };
    if ($(".ent") && !FL.introDone) addEventListener("fl:intro-done", function () { setTimeout(go, 150); }, { once: true }); else go();
  };

  var msgReveal = function (root, gsap) {          // the latest message wipes up into view like a release card
    var art = $(".msg__art", root); if (!art || FL.reduced) return;
    gsap.fromTo(art, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: art, start: "top 92%", end: "top 45%", scrub: 0.6 } });
    gsap.fromTo($(".t-poster", art), { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: art, start: "top 92%", end: "top 40%", scrub: 0.6 } });
  };
  var valuesIn = function (list, gsap) {           // Revision 41.4b: each value fades up inside its own row as it arrives
    if (FL.reduced) return;
    $$("li", list).forEach(function (li) {
      gsap.fromTo(li, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: li, start: "top 88%", once: true } });
    });
  };
  var beliefsIn = function () {};                   // Revision 41.4a: the beliefs are a stacked list and simply read; nothing runs across them
  var calendar = function (root, gsap) {          // Gatherings: the next weeks, from the one schedule
    var list = $(".cal__list", root), MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var items = FL.upcoming(6, 28).map(function (u) { return { d: u.start, g: { t: u.title, where: u.where } }; });
    list.innerHTML = items.slice(0, 6).map(function (it) {
      return '<li class="cal__row"><span class="cal__date"><b>' + DOW[it.d.getDay()] + "</b><strong>" + it.d.getDate() + "</strong><em>" + MON[it.d.getMonth()] + '</em></span><span class="cal__what"><strong>' + it.g.t +
        '</strong><span class="t-spec">' + it.d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + '<span class="sep">//</span>' + it.g.where + '</span></span><a class="mono-link" data-fl-href="links.mason360Events" href="#">RSVP</a></li>';
    }).join("");
    FL.fill(list);
    if (FL.reduced) return;
    $$(".cal__row", list).forEach(function (row, i) {     // each date slides in with the scroll and keeps travelling while on screen (Revision 36.5)
      gsap.fromTo(row, { x: innerWidth < 768 ? 16 : 40 }, { x: 0, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "top 88%", scrub: true } });   // slides in, never fades (its red stays solid)
    });
  };



  // Revision 37: the opening is ONE unit. The declaration rises out of its masks as the intro lifts; its explanation is
  // simply there beneath it. The two lines drift on their own and part as you scroll on; the picture pans inside CHURCH.
  var opening = function (root, gsap) {
    var l1 = $(".coc__l1", root), l2 = $(".coc__l2", root), p = 0, d = 0;
    if (FL.reduced) return;
    window.ScrollTrigger.create({ trigger: root, start: "top top", end: "bottom top", onUpdate: function (st) { p = st.progress; } });
    FL.loop(root, function () {
      d += 0.02;
      l1.style.translate = (Math.sin(d * 0.6) * 1.1 - p * 9).toFixed(2) + "vw 0";
      l2.style.translate = (Math.cos(d * 0.5) * 1.1 + p * 9).toFixed(2) + "vw 0";
      l1.style.backgroundPosition = (50 + Math.sin(d * 0.21) * 14 + p * 20).toFixed(2) + "% " + (38 + Math.cos(d * 0.17) * 6).toFixed(2) + "%";
    });
    gsap.set(l1, { opacity: 0 }); gsap.set(l2, { visibility: "hidden" });   // the red line never fades (it would read pink): it appears, solid
    var rise = function () { softWipe([l1], gsap, { duration: 1.0 }); gsap.set(l2, { visibility: "visible", delay: 0.45 }); };
    if ($(".ent") && !FL.introDone) addEventListener("fl:intro-leaving", function () { setTimeout(rise, 120); }, { once: true }); else rise();   // writes itself as the curtain rises
  };
  // Revision 37.9: a feathered wipe. A soft edge sweeps across whole letters (no hard mask, so no glyph is ever cut
  // into a false shape mid-flight); the mask is removed when it finishes, so it costs nothing afterwards.
  var softWipe = function (els, gsap, o) {        // Revision 41: a word fades in where it stands. No mask, no clip, no movement:
    o = o || {}; els = [].concat(els).filter(Boolean); if (!els.length || FL.reduced) return;   // a letter is never cut or deformed
    els.forEach(function (el) { el.classList.remove("wipe", "wipe-down"); el.style.removeProperty("--wp"); });
    gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: o.duration || 0.7, stagger: o.stagger || 0.12, delay: o.delay || 0, ease: "power1.out" });
  };

  /* ---------- page to page (2026-11-02): out faster than in. Off under reduced motion. ---------- */
  var pageSwap = function () {
    if (FL.reduced) return;
    var panel = document.createElement("div"); panel.className = "swap"; panel.setAttribute("aria-hidden", "true"); document.body.appendChild(panel);
    var arriving = sessionStorage.getItem("fl-swap") === "1"; sessionStorage.removeItem("fl-swap");
    if (arriving && !$(".ent:not(.is-gone)")) { panel.classList.add("is-cover"); requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.remove("is-cover"); panel.classList.add("is-open"); }); }); }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      var url = new URL(a.href, location.href); if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) return;
      if (url.pathname === location.pathname) return;            // same page: the anchor scroll handles it
      e.preventDefault(); sessionStorage.setItem("fl-swap", "1");
      panel.classList.remove("is-open"); panel.classList.add("is-closing");
      setTimeout(function () { location.href = url.href; }, 360);
    });
    addEventListener("pageshow", function (ev) { if (ev.persisted) { panel.classList.remove("is-closing", "is-cover"); } });   // back/forward cache
  };
  /* ---------- Revision 35/36 ---------- */
  // About opens on a light that seeks: it sweeps the dark and finds four lines, one at a time (Revision 36.1)
  var seek = function (root, gsap) {
    var pin = $(".seek__pin", root), lines = $$(".seek__line", root), cv = $(".seek__light", root), ctx = cv.getContext("2d"), hint = $(".seek__hint", root);
    if (FL.reduced) { root.classList.add("is-static"); return; }
    var ptr = FL.pointer(root), prog = 0, sx = null, sy = null, last = 0, found = lines.map(function () { return 0; });
    window.ScrollTrigger.create({ trigger: pin, start: "top top", end: "+=440%", pin: true, scrub: true, onUpdate: function (st) { prog = st.progress; } });
    var centre = function (el) { var r = el.getBoundingClientRect(), p = pin.getBoundingClientRect(); return [r.left - p.left + r.width / 2, r.top - p.top + r.height / 2]; };
    FL.loop(root, function (t) {
      var dt = Math.min(0.05, t - last || 0.016); last = t;
      var d = FL.fit(cv), W = d.cw, H = d.ch, n = lines.length;
      // the scroll walks the light from line to line and lets it dwell on each; before the first, it wanders the dark
      var k = prog * (n + 0.6) - 0.35, i = clamp(Math.floor(k), 0, n - 1), f = clamp(k - i, 0, 1), e = f < 0.55 ? 0 : (f - 0.55) / 0.45;
      e = e * e * (3 - 2 * e);
      var a = centre(lines[i]), b = centre(lines[Math.min(n - 1, i + 1)]), tx, ty;
      if (k < 0) { tx = W * (0.5 + 0.32 * Math.sin(t * 0.5)); ty = H * (0.35 + 0.12 * Math.cos(t * 0.37)); }
      else { tx = a[0] + (b[0] - a[0]) * e; ty = a[1] + (b[1] - a[1]) * e; }
      if (ptr.active) { tx += (ptr.px - tx) * 0.22; ty += (ptr.py - ty) * 0.22; }   // a pointer or a finger pulls the light a little
      if (sx === null) { sx = tx; sy = ty; }
      sx += (tx - sx) * Math.min(1, dt * 5); sy += (ty - sy) * Math.min(1, dt * 5);
      var R = Math.max(150, Math.min(W, H) * (FL.small() ? 0.34 : 0.3)), ox = FL.small() ? W * 0.5 : W * 0.06, oy = H + 20;
      ctx.setTransform(d.d, 0, 0, d.d, 0, 0); ctx.fillStyle = "#0B0B0B"; ctx.fillRect(0, 0, W, H);
      var dist = Math.hypot(sx - ox, sy - oy), ang = Math.atan2(sy - oy, sx - ox), spread = Math.atan2(R * 0.92, dist);   // the beam from the lamp
      var g = ctx.createLinearGradient(ox, oy, sx, sy); g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(1, "rgba(255,255,255,.05)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, dist + R, ang - spread, ang + spread); ctx.closePath(); ctx.fill();
      var pool = ctx.createRadialGradient(sx, sy, 0, sx, sy, R); pool.addColorStop(0, "rgba(255,255,255,.2)"); pool.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(sx, sy, R, 0, 6.2832); ctx.fill();
      lines.forEach(function (el, j) {                 // where the light lands, something true appears, and stays
        var c = centre(el), lit = clamp(1 - Math.hypot(c[0] - sx, c[1] - sy) / (R * 1.05), 0, 1);
        if (lit > 0.35) found[j] = 1;
        el.style.opacity = Math.max(found[j] ? 0.42 : 0.07, lit).toFixed(3);
      });
      if (hint) hint.style.opacity = prog > 0.04 ? 0 : 0.7;
    });
  };
  // Home: the explanation reads in, line by line, as it arrives (the handoff from the declaration)
  var explain = function (root, gsap) {
    if (FL.reduced) return;
    $$("[data-lines]", root).forEach(function (p) { gsap.fromTo(p, { opacity: 0.12 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: p, start: "top 88%", end: "top 52%", scrub: 0.5 } }); });
  };
  // Home: the gatherings as ONE quiet line (the full detail lives on Gatherings)
  var nextLine = function (root) {
    var b = FL.upcoming(1, 8)[0]; if (!b) return;
    $(".nl__what", root).textContent = b.title;
    $(".nl__when", root).textContent = (b.start.toDateString() === new Date().toDateString() ? "today" : b.start.toLocaleDateString("en-US", { weekday: "long" })) + ", " + b.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    $(".nl__where", root).textContent = b.where;
  };
  // a photo band: the chapter break between type chambers, always moving while it is on screen
  var band = function (root, gsap) {
    var img = $("img", root); if (FL.reduced || !img) return;
    gsap.fromTo(img, { yPercent: -11, scale: 1.3 }, { yPercent: 11, scale: 1.26, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
  };
  // Revision 57: the photos float. Every photograph on every page travels with the scroll while it is on screen: the
  // picture slides inside its frame (the frame crops it, nothing alters it), the frames that stand beside text travel
  // at their own pace, and a slow drift keeps each one alive between scrolls. Nothing sits static.
  var floats = function (gsap) {
    if (FL.reduced) return;
    var small = innerWidth < 768, ST = window.ScrollTrigger;
    var idle = function (el, trig, ax) {                   // the slow drift, paused while the photo is off screen
      var tw = gsap.fromTo(el, { xPercent: -ax }, { xPercent: ax, duration: 4.5 + Math.random() * 2.5, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true });
      tw.progress(Math.random());
      ST.create({ trigger: trig, start: "top bottom", end: "bottom top", onToggle: function (st) { st.isActive ? tw.play() : tw.pause(); } });
    };
    var inner = function (img, trig, range, ax) {         // the picture travels inside its frame against the scroll
      gsap.set(img, { scale: 1 + (range + ax) / 50 + 0.02, force3D: true });
      gsap.fromTo(img, { yPercent: -range }, { yPercent: range, ease: "none", scrollTrigger: { trigger: trig, start: "top bottom", end: "bottom top", scrub: true } });
      idle(img, trig, ax);
    };
    $$(".duo__ph").forEach(function (f) {
      var img = $("img", f), sticky = getComputedStyle(f).position === "sticky";
      inner(img, sticky ? f.closest(".duo") : f, sticky ? 9 : 9, 2.2);
      if (!sticky) gsap.fromTo(f, { y: small ? 26 : 90 }, { y: small ? -26 : -90, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".pband, .poster__ph").forEach(function (f) { inner($("img", f), f, 8, 1.6); });
    $$(".op__ph").forEach(function (f) {
      inner($("img", f), f, 9, 2.2);
      if (!small) gsap.fromTo(f, { y: -30 }, { y: 150, ease: "none", scrollTrigger: { trigger: f.closest("section"), start: "top top", end: "bottom top", scrub: true } });
    });
    $$("[data-sec='band'] .band__in img").forEach(function (img) { idle(img, img.closest("section"), 1.6); });
    $$(".band--full img").forEach(function (img) {         // the About hero stays whole: it floats down through its own space
      var sec = img.closest("section"); sec.style.paddingBottom = small ? "8svh" : "16svh";
      gsap.fromTo(img, { y: 0 }, { y: function () { return parseFloat(getComputedStyle(sec).paddingBottom); }, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
    });
    $$(".poster__title.photo-type").forEach(function (t) {  // the photograph inside the type pans with the scroll
      gsap.fromTo(t, { backgroundPosition: "50% 20%" }, { backgroundPosition: "50% 80%", ease: "none", scrollTrigger: { trigger: t, start: "top bottom", end: "bottom top", scrub: true } });
    });
  };
  // Gatherings: nothing just sits there (Revision 36.5). Each piece is tied to the scroll while it is on screen.
  var gatheringsFlow = function (gsap) {          // Revision 41.5: upright, inside their own space; nothing travels over text
    if (FL.reduced) return;
    $$("[data-sec='posters'] .poster").forEach(function (p) {
      gsap.fromTo(p, { y: 16 }, { y: 0, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: p, start: "top 92%", once: true } });   // no fade: a red card fading passes through pink (Revision 41.4d)
    });
  };
  // a link to a place on a page lands there once the pins have settled (Plan your visit lands inside the visit movement)
  var landOnHash = function () {
    var id = location.hash; if (id.length < 2 || !$(id)) return;
    var go = function () { window.ScrollTrigger.refresh(); var y = $(id).getBoundingClientRect().top + scrollY - 70; if (FL.lenis) FL.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); };
    setTimeout(go, 600); addEventListener("load", function () { setTimeout(go, 300); });
  };

  /* ---------- small pieces ---------- */
  var message = function (root) {
    var art = $(".msg__art", root); if (!art) return;
    art.addEventListener("click", function () {
      var url = FL.config.links.youtube, m = url && url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      if (!m) { return; }
      var f = document.createElement("iframe"); f.src = "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.title = "Latest message"; art.appendChild(f);
    });
  };
  var forms = function () {
    $$("form.form:not([data-seats])").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = $("button[type=submit]", f), err = $(".form__err", f), v = function (k) { var i = $("[name=" + k + "]", f); return i ? (i.value || "").trim() || null : null; };
        btn.disabled = true; if (err) err.hidden = true;
        FL.send({ kind: "prayer", request: v("request"), name: v("name"), email: null, phone: v("phone"), company: hp(f) }).then(function (res) {
          btn.disabled = false;
          if (res.status === 201) { f.classList.add("is-sent"); return; }
          if (err) { err.textContent = FL.sendErr(res); err.hidden = false; }
        });
      });
    });
  };
  var fork = function (root) {
    var out = $(".fork-ans", root), btns = $$(".fork button", root);
    btns.forEach(function (b) { b.addEventListener("click", function () {
      btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      out.innerHTML = "<p>" + b.getAttribute("data-say") + "</p>";
      var next = $(b.getAttribute("data-next")); if (next) setTimeout(function () { next.scrollIntoView({ behavior: FL.reduced ? "auto" : "smooth", block: "start" }); }, 900);
    }); });
  };
  var footFit = function () {
    $$(".foot__word").forEach(function (word) {
      var lines = $$("span", word);
      var fit = function () { word.style.fontSize = "100px"; var widest = Math.max.apply(null, lines.map(function (l) { return l.scrollWidth; })); word.style.fontSize = (100 * word.clientWidth / widest).toFixed(2) + "px"; };
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit); addEventListener("resize", fit);
    });
  };
  var invitation = function (root) { FL.embers($("canvas", root), { pointerEl: root, max: 420, sparse: 2.4, speed: 0.6 }); };   // Revision 36.8: the line and the embers only, quieter
  var pagehead = function (root, gsap) {     // inner-page titles: a feathered wipe across whole words (Revision 37.9)
    var h = $("h1", root); if (!h || FL.reduced) return;
    var words = []; h.childNodes.forEach(function (n) { var red = n.nodeType === 1 && n.classList.contains("red"); (n.textContent || "").trim().split(/\s+/).filter(Boolean).forEach(function (w) { words.push([w, red]); }); });
    h.innerHTML = words.map(function (w) { return '<span class="w' + (w[1] ? " red" : "") + '">' + w[0] + "</span>"; }).join(" ");
    softWipe($$(".w", h), gsap, { delay: 0.15, stagger: 0.12, duration: 0.9 });
  };

  /* ---------- smooth scroll (Revision 33): self-hosted Lenis 1.3.15, configured like 2819 (duration 1.2, native touch),
     driven by GSAP's ticker so every ScrollTrigger reads the same scroll. If it does not engage, say so LOUDLY. ---------- */
  var smooth = function (gsap) {
    var q = location.search;
    FL.smooth = { engaged: false, reason: "" };
    if (FL.reduced) { FL.smooth.reason = "reduced motion: native scroll by design"; return; }
    if (/[?&](p|t|shot)=/.test(q)) { FL.smooth.reason = "storyboard capture: native scroll by design"; return; }
    if (!window.Lenis) { FL.smooth.reason = "Lenis script missing"; console.error("[First Love] SMOOTH SCROLL DID NOT ENGAGE: vendor/lenis.min.js did not load."); return; }
    try {
      var lenis = new window.Lenis({ duration: 1.2, smoothWheel: true, syncTouch: false, autoRaf: false, anchors: { offset: -60 } });
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      FL.lenis = lenis;
      if (document.documentElement.classList.contains("fl-intro")) lenis.stop();   // the intro owns the screen until it lifts
      FL.smooth = { engaged: document.documentElement.classList.contains("lenis"), version: lenis.version || "", reason: "" };
      if (!FL.smooth.engaged) throw new Error("Lenis constructed but html.lenis is missing");
    } catch (e) { FL.smooth.reason = String(e); console.error("[First Love] SMOOTH SCROLL DID NOT ENGAGE:", e); }
  };

  /* ---------- decode photographs before they arrive (Revision 33: no first-sight decode hitch mid-scroll) ---------- */
  var predecode = function () {
    var urls = {}, imgs = $$("img");
    imgs.forEach(function (im) { im.decoding = im.closest(".kbn__t") ? "sync" : "async"; });   // a face of the cross is never painted before it is ready (it would flash empty)
    $$(".photo-type, [style*='background-image']").forEach(function (el) { var m = /url\(["']?([^"')]+)/.exec(el.style.backgroundImage || ""); if (m) urls[m[1]] = el; });
    var warm = function (src) { var i = new Image(); i.src = src; if (i.decode) i.decode().catch(function () {}); };
    if (!("IntersectionObserver" in window)) { Object.keys(urls).forEach(warm); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target);
      if (e.target.tagName === "IMG") { if (e.target.decode) e.target.decode().catch(function () {}); } else { var m = /url\(["']?([^"')]+)/.exec(e.target.style.backgroundImage || ""); if (m) warm(m[1]); } }); }, { rootMargin: "250% 0px" });
    imgs.concat(Object.keys(urls).map(function (u) { return urls[u]; })).forEach(function (el) { io.observe(el); });
  };

  /* ---------- Revision 59: the keep-scrolling cue. One solid red downward chevron (the word SCROLL dropped by Kofi), on its own small paper
     plate at the foot of the screen. Kofi, 2026-11-04: it is there ALL the time, from the moment any intro is done to the
     last screen of the page (where nothing is left below). It also steps away while a form field is being typed in and
     while the menu is open. ---------- */
  var cue = function () {
    var host = $(".fl.site") || document.body, el = document.createElement("div");
    el.className = "cue"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<svg class="cue__c" viewBox="0 0 26 15"><path d="M3 3l10 9 10-9"/></svg>';   // Kofi, 2026-11-05: the arrow alone, no word
    host.appendChild(el);
    var shown = false, introOk = !$(".ent") || FL.introDone;
    addEventListener("fl:intro-done", function () { introOk = true; tick(); });
    var more = function () { return document.documentElement.scrollHeight - (scrollY + innerHeight) > innerHeight * 0.5; };   // not in the last screen
    var busy = function () { var a = document.activeElement; return document.documentElement.classList.contains("menu-open") || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };
    var tick = function () {
      var want = !!(introOk && more() && !busy());
      if (want !== shown) { el.classList.toggle("is-on", want); shown = want; }
    };
    addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick);
    addEventListener("focusin", tick); addEventListener("focusout", function () { setTimeout(tick, 0); });
    setInterval(tick, 500);                                 // the menu, late layout
    tick();
    FL.cue = { el: el, state: function () { return { shown: shown, more: more() }; } };
  };

  FL.ready(function () {
    predecode(); pageSwap();
    nav(); faqs(); forms(); footFit(); cue();
    $$("[data-sec='entrance']").forEach(entrance);
    $$("[data-sec='beam']").forEach(beam);
    $$("[data-sec='message']").forEach(message);
    $$("[data-sec='fork']").forEach(fork);
    $$("[data-sec='invite']").forEach(invitation);
    $$("[data-sec='seats']").forEach(seats);
    $$("[data-sec='next']").forEach(nextGathering);
    $$("[data-sec='nextline']").forEach(nextLine);
    $$("[data-justcome]").forEach(function (el) { var u = FL.upcoming(1, 8)[0]; if (!u) { el.remove(); return; }   // the real next gathering, or nothing
      el.innerHTML = "or just come<b> // " + u.title + " // " + FL.when(u.start) + " // " + u.where + "</b>"; });
    FL.gsap().then(function (gsap) {
      smooth(gsap);
      $$("[data-sec='coc']").forEach(function (r) { coc(r, gsap); });
      $$("[data-sec='slide']").forEach(function (r) { slide(r, gsap); });
      $$("[data-sec='walk']").forEach(function (r) { walk(r, gsap); });
      $$("[data-sec='phead']").forEach(function (r) { pagehead(r, gsap); });
      $$("[data-sec='kinetic']").forEach(function (r) { kinetic(r, gsap); });
      $$("[data-sec='dorms']").forEach(function (r) { dorms(r, gsap); });
      $$("[data-sec='map']").forEach(function (r) { campus(r, gsap); });
      $$("[data-sec='known']").forEach(function (r) { known(r, gsap); });
      $$("[data-sec='origin']").forEach(function (r) { origin(r, gsap); });
      $$("[data-fx='grow'],[data-fx='shrink']").forEach(function (el) { growShrink(el, gsap); });
      $$("[data-sec='expand']").forEach(function (r) { expand(r, gsap); });
      $$("[data-sec='drift']").forEach(function (r) { drift(r); });
      $$("[data-sec='manifesto']").forEach(function (r) { manifesto(r, gsap); });
      $$("[data-sec='kbn']").forEach(function (r) { kbn(r, gsap); });
      $$("[data-assemble]").forEach(function (h) { assemble(h, gsap); });
      $$("[data-sec='message']").forEach(function (r) { msgReveal(r, gsap); });
      $$("[data-fx='values']").forEach(function (l) { valuesIn(l, gsap); });
      $$("[data-fx='beliefs']").forEach(function (b) { beliefsIn(b, gsap); });
      $$("[data-sec='calendar']").forEach(function (r) { calendar(r, gsap); });
      $$("[data-sec='seek']").forEach(function (r) { seek(r, gsap); });
      $$("[data-sec='opening']").forEach(function (r) { opening(r, gsap); });
      $$("[data-sec='explain']").forEach(function (r) { explain(r, gsap); });
      $$("[data-sec='band']").forEach(function (r) { band(r, gsap); });
      floats(gsap);
      if ($("[data-sec='posters']")) gatheringsFlow(gsap);
      landOnHash();
      $$("[data-sec='maskzoom']").forEach(function (r) { maskZoom(r, gsap); });
      var resort = function () { window.ScrollTrigger.sort(); window.ScrollTrigger.refresh(); };
      if (document.fonts) document.fonts.ready.then(resort);
      addEventListener("load", resort);
    });
  });
})();
