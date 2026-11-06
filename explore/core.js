/* =====================================================================
   First Love Church at GMU · v2 exploration · SHARED RUNTIME
   Phase 2 channel: Website Custom JavaScript (wrapped in <script> there).
   Holds: the ONE config block, library loaders, the WebGL flame shader,
   the ember field, and small motion utilities every component shares.
   ===================================================================== */
(function () {
  "use strict";
  var FL = (window.FL = window.FL || {});

  /* ---------- the ONE config block: every placeholder lives here ---------- */
  FL.config = {
    service: { day: "[SERVICE DAY]", time: "[TIME]", place: "[PLACE]" },
    gatherings: [
      { key: "bible", title: "Bible Study", day: "Sundays", time: "1:00–2:00 PM", place: "Lecture Hall Building, Room 2",
        plain: "We open the Bible together, read it slowly, and talk about what it says." },
      { key: "ready", title: "READY@20", day: "Wednesdays", time: "7:00–8:30 PM", place: "The Hub, Rooms 3–5",
        plain: "Midweek: prayer, the Word, and learning to tell people about Jesus." }
    ],
    links: {
      groupChat: null,                                   // NEEDED FROM KOFI
      instagram: "https://www.instagram.com/firstlovegmu/",
      email: "mailto:firstlovegmu@gmail.com",           // assumed, Kofi to confirm
      youtube: null,                                     // channel or latest message URL, NEEDED
      mason360Events: "https://mason360.gmu.edu/FirstLove/events/",
      directions: "https://www.google.com/maps/search/?api=1&query=George+Mason+University+Fairfax+VA",
      dagbooks: "https://www.dagbooks.org/"
    },
    email: "firstlovegmu@gmail.com",
    handle: "@firstlovegmu",
    greeter: "[GREETER NAME]",
    visitLength: "[LENGTH]",
    entrance: "[WHICH DOOR, WHICH ROOM]",
    latest: { title: "[LATEST MESSAGE TITLE]", speaker: "[SPEAKER]", series: "[SERIES]", date: "[DATE]" }
  };

  /* asset base: components live in explore/c/, logos in /logos/web */
  FL.asset = function (name) { return (FL.base || "../../logos/web/") + name; };

  FL.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  FL.coarse = matchMedia("(pointer: coarse)").matches;
  FL.small = function () { return innerWidth < 768; };

  FL.ready = function (fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); };

  var loaded = {};
  FL.loadScript = function (src) {
    if (!loaded[src]) loaded[src] = new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = src; s.async = false; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return loaded[src];
  };
  FL.gsap = function () {
    // the built site ships GSAP self-hosted (Revision 33); only the exploration pages still fetch it
    if (window.gsap && window.ScrollTrigger) { window.gsap.registerPlugin(window.ScrollTrigger); return Promise.resolve(window.gsap); }
    return FL.loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js")
      .then(function () { return FL.loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"); })
      .then(function () { window.gsap.registerPlugin(window.ScrollTrigger); return window.gsap; });
  };
  /* GSAP's former bonus plugins (MorphSVG, DrawSVG...) are free and on cdnjs since 3.13 */
  FL.gsapPlugins = function (names) {
    return FL.gsap().then(function (gsap) {
      return Promise.all(names.map(function (n) { return FL.loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/" + n + ".min.js"); }))
        .then(function () { gsap.registerPlugin.apply(gsap, names.map(function (n) { return window[n]; })); return gsap; });
    });
  };
  FL.dotmatter = function () {
    return Promise.all([
      import("https://cdn.jsdelivr.net/npm/@dotmatter/core@0.3.1/+esm"),
      import("https://cdn.jsdelivr.net/npm/@dotmatter/shaders@0.3.1/+esm")
    ]).then(function (m) { return { core: m[0], shaders: m[1] }; });
  };
  FL.img = function (src) {
    return new Promise(function (res, rej) { var i = new Image(); i.decoding = "async"; i.onload = function () { res(i); }; i.onerror = rej; i.src = src; });
  };

  /* fill [data-fl="path"] text and [data-fl-href="links.x"] from config; null links explain themselves */
  FL.fill = function (root) {
    root = root || document;
    var get = function (p) { return p.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, FL.config); };
    root.querySelectorAll("[data-fl]").forEach(function (n) { var v = get(n.getAttribute("data-fl")); if (v != null) n.textContent = v; });
    root.querySelectorAll("[data-fl-href]").forEach(function (a) {
      var v = get(a.getAttribute("data-fl-href"));
      if (v) a.href = v; else { a.href = "#"; a.setAttribute("data-pending", a.getAttribute("data-fl-href")); }
    });
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-pending]"); if (!a) return;
    e.preventDefault(); FL.note("This link is coming soon.");
  });
  FL.note = function (msg) {
    var t = document.getElementById("fl-note");
    if (!t) { t = document.createElement("div"); t.id = "fl-note"; t.setAttribute("role", "status");
      t.style.cssText = "position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2000;background:#15110E;color:#F2ECE2;font:500 13px/1.4 'IBM Plex Mono',monospace;padding:10px 14px;border-radius:8px;opacity:0;transition:opacity .2s";
      document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = 1; clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = 0; }, 2400);
  };

  /* in-view observer (kept referenced so it is never garbage-collected) */
  FL._ios = [];
  FL.inView = function (el, cb, opts) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e); }); }, opts || { threshold: 0 });
    io.observe(el); FL._ios.push(io); return io;
  };
  FL.reveals = function (root) {
    (root || document).querySelectorAll(".reveal").forEach(function (el) {
      if (FL.reduced) { el.classList.add("is-in"); return; }
      FL.inView(el, function (on) { if (on) el.classList.add("is-in"); }, { threshold: 0, rootMargin: "0px 0px 8% 0px" });   // opens as it arrives: never a blank screen (Revision 34)
    });
  };

  /* rAF loop that pauses offscreen and in hidden tabs */
  FL.loop = function (el, fn) {
    var on = true, vis = true, id = 0, t0 = performance.now();
    var tick = function (now) { fn((now - t0) / 1000); if (on && vis && !document.hidden) id = requestAnimationFrame(tick); };
    var resume = function () { cancelAnimationFrame(id); if (on && vis && !document.hidden) id = requestAnimationFrame(tick); };
    FL.inView(el, function (v) { vis = v; resume(); });
    document.addEventListener("visibilitychange", resume);
    resume();
    return { stop: function () { on = false; cancelAnimationFrame(id); }, once: function () { fn((performance.now() - t0) / 1000); } };
  };

  /* pointer tracker in element-normalized coordinates (0..1), touch-aware */
  FL.pointer = function (el) {
    var p = { x: 0.5, y: 0.5, px: 0, py: 0, active: false };
    var set = function (e) { var r = el.getBoundingClientRect(); p.x = (e.clientX - r.left) / r.width; p.y = (e.clientY - r.top) / r.height; p.px = e.clientX - r.left; p.py = e.clientY - r.top; p.active = true; };
    el.addEventListener("pointermove", set);
    el.addEventListener("pointerdown", set);
    el.addEventListener("pointerleave", function () { p.active = false; });
    el.addEventListener("pointerup", function (e) { if (e.pointerType === "touch") p.active = false; });
    return p;
  };

  /* fit a canvas to its box at a capped pixel ratio */
  FL.fit = function (canvas, scale) {
    var r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2) * (scale || 1);
    var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w: w, h: h, d: d, cw: r.width, ch: r.height };
  };

  /* =====================================================================
     FLAME SHADER (WebGL1). One shader powers every fire moment:
     - heat rising from a mark's own silhouette (mask texture) and/or a base
     - a burn-dissolve that reveals the untouched logo file (logo texture)
     The real logo is drawn from the original PNG pixels, so letterforms
     never warp: the fire is around it, the resolve is pixel-true.
     ===================================================================== */
  var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var FS = [
    "precision highp float;",
    "uniform vec2 r;uniform float t,inten,burn,hasLogo,hasMask,base,glow;",
    "uniform sampler2D mask,logo;uniform vec4 mRect,lRect;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
    "vec3 ramp(float x){x=clamp(x,0.,1.);vec3 c=mix(vec3(0.),vec3(.42,.0,.01),smoothstep(0.,.22,x));",
    "c=mix(c,vec3(.93,.016,.03),smoothstep(.18,.42,x));c=mix(c,vec3(1.,.42,.06),smoothstep(.42,.68,x));",
    "c=mix(c,vec3(1.,.83,.52),smoothstep(.68,.94,x));return c;}",
    "float sm(vec2 uv){vec2 q=(uv-mRect.xy)/mRect.zw;if(q.x<0.||q.y<0.||q.x>1.||q.y>1.)return 0.;return texture2D(mask,vec2(q.x,1.-q.y)).a;}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/r;float asp=r.x/r.y;vec2 p=vec2(uv.x*asp,uv.y);",
    " float n1=fbm(vec2(p.x*3.,p.y*2.2-t*1.25));",
    " float n2=fbm(vec2(p.x*6.5,p.y*5.5-t*2.3)+n1*1.3);",
    " float src=0.;",
    " if(hasMask>.5){vec2 du=vec2((n2-.5)*.05,0.);",
    "  float j=h(gl_FragCoord.xy+fract(t)*91.);for(int k=0;k<12;k++){float fk=float(k)+j;src+=sm(uv+du*fk-vec2(0.,.018*fk*(.45+n1)))*(1.-fk/13.);}src=min(src/3.,1.)*.68;}",
    " float b=base*smoothstep(.5,0.,uv.y)*(.35+.95*n1);",
    " float heat=(src+b)*inten;heat*=smoothstep(.02,.58,n2+.04)*1.6*(.5+.75*n2);heat*=1.1-uv.y*.45;",
    " vec3 col=ramp(heat)*(1.+glow);float al=clamp(heat*2.,0.,1.);",
    " if(hasLogo>.5){vec2 q=(uv-lRect.xy)/lRect.zw;",
    "  if(q.x>=0.&&q.y>=0.&&q.x<=1.&&q.y<=1.){vec4 L=texture2D(logo,vec2(q.x,1.-q.y));",
    "   float d=fbm(q*vec2(4.5,3.5)+2.)*.85+(1.-q.y)*.25;float th=burn*1.3-.15;",
    "   float vis=1.-smoothstep(th-.035,th,d);float edge=smoothstep(.07,0.,abs(d-th))*step(burn,.995);",
    "   col=mix(col,L.rgb,L.a*vis);col+=vec3(1.,.5,.12)*edge*L.a*1.6;al=max(al,L.a*max(vis,edge));}}",
    " gl_FragColor=vec4(col*al,al);}"
  ].join("\n");

  FL.flame = function (canvas, o) {
    o = o || {};
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: !!o.preserve });
    if (!gl) return null;
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ["r", "t", "inten", "burn", "hasLogo", "hasMask", "base", "glow", "mask", "logo", "mRect", "lRect"].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var tex = function (img, unit) {
      var tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); return tx;
    };
    gl.uniform1i(U.mask, 0); gl.uniform1i(U.logo, 1);
    var state = { mask: null, logo: null, mRect: [0, 0, 1, 1], lRect: [0, 0, 1, 1], inten: 1, burn: 1, base: 0, glow: 0 };
    if (o.mask) { tex(o.mask, 0); state.mask = true; }
    if (o.logo) { tex(o.logo, 1); state.logo = true; }
    var api = {
      gl: gl, state: state,
      /* place an image (natural aspect) centered at cx,cy (0..1, y down) with width w (0..1 of canvas width) */
      place: function (which, img, cx, cy, w) {
        var W = canvas.width, H = canvas.height, pw = w * W, ph = pw * img.naturalHeight / img.naturalWidth;
        var rect = [(cx * W - pw / 2) / W, 1 - (cy * H + ph / 2) / H, pw / W, ph / H];
        state[which === "mask" ? "mRect" : "lRect"] = rect; return rect;
      },
      draw: function (t) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(U.r, canvas.width, canvas.height); gl.uniform1f(U.t, t);
        gl.uniform1f(U.inten, state.inten); gl.uniform1f(U.burn, state.burn); gl.uniform1f(U.base, state.base); gl.uniform1f(U.glow, state.glow);
        gl.uniform1f(U.hasMask, state.mask ? 1 : 0); gl.uniform1f(U.hasLogo, state.logo ? 1 : 0);
        gl.uniform4fv(U.mRect, state.mRect); gl.uniform4fv(U.lRect, state.lRect);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };
    return api;
  };

  /* =====================================================================
     EMBER FIELD (2D canvas). Embers rise and drift; the pointer parts
     them with a soft repel + swirl. Count scales with area and device.
     ===================================================================== */
  FL.embers = function (canvas, o) {
    o = o || {};
    var ctx = canvas.getContext("2d"), parts = [], dims, ptr = FL.pointer(o.pointerEl || canvas);
    var seed = 11, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var spawn = function (p, anywhere) {
      p.x = rnd() * dims.cw; p.y = anywhere ? rnd() * dims.ch : dims.ch + rnd() * 40;
      p.vx = 0; p.vy = -(18 + rnd() * 46); p.r = 1.1 + rnd() * 3.4; p.life = 0; p.max = 4 + rnd() * 7; p.hue = rnd(); return p;
    };
    var resize = function () {
      dims = FL.fit(canvas);
      var target = Math.round(Math.min(o.max || 520, dims.cw * dims.ch / ((FL.coarse ? 1500 : 1000) * (o.sparse || 1))));   // sparse > 1: fewer embers
      while (parts.length < target) parts.push(spawn({}, true)); parts.length = target;
    };
    resize(); addEventListener("resize", resize);
    var last = 0;
    var frame = function (t) {
      var dt = Math.min(0.05, t - last || 0.016) * (o.speed || 1); last = t;   // speed < 1: a slower field
      ctx.setTransform(dims.d, 0, 0, dims.d, 0, 0); ctx.clearRect(0, 0, dims.cw, dims.ch);
      ctx.globalCompositeOperation = "lighter";
      var R = Math.max(90, Math.min(dims.cw, dims.ch) * 0.22);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (ptr.active && !FL.reduced) {
          var dx = p.x - ptr.px, dy = p.y - ptr.py, d2 = dx * dx + dy * dy;
          if (d2 < R * R) { var d = Math.sqrt(d2) + 0.01, f = (1 - d / R); p.vx += (dx / d * 900 - dy / d * 420) * f * dt; p.vy += (dy / d * 900 + dx / d * 420) * f * dt; }
        }
        p.vx += Math.sin(t * 0.8 + p.y * 0.012 + p.hue * 6) * 14 * dt;   // gentle sway
        p.vx *= 0.96; p.vy = p.vy * 0.985 + (-(22 + p.r * 14)) * 0.015;
        if (!FL.reduced) { p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt; }
        if (p.y < -20 || p.life > p.max) spawn(p, false);
        var k = Math.sin(Math.PI * Math.min(1, p.life / p.max)), a = Math.min(1, (FL.reduced ? 0.85 : 0.25 + 0.75 * k) * (0.55 + p.r / 4));
        var col = p.hue < 0.5 ? "255,122,26" : p.hue < 0.85 ? "238,4,8" : "255,214,150";
        ctx.fillStyle = "rgba(" + col + "," + (a * 0.22).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.2832); ctx.fill();   // soft halo
        ctx.fillStyle = "rgba(" + col + "," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      if (o.after) o.after(ctx, dims, t, ptr);
    };
    if (FL.reduced) { for (var j = 0; j < parts.length; j++) parts[j].life = parts[j].max * 0.5; }
    var loop = FL.loop(canvas, frame);
    if (FL.reduced) { loop.stop(); setTimeout(function () { frame(1); }, 50); }
    return { ptr: ptr, resize: resize };
  };

  /* =====================================================================
     IMAGE-FRAME SEQUENCE PLAYER (Apple's method): preload WebP frames,
     draw the one for the current progress onto a canvas, cover-fit.
     Frames are plain images and the player is plain script: both are
     proven channels inside Mason 360 (no video element needed).
     ===================================================================== */
  FL.sequence = function (canvas, o) {
    var frames = [], ctx = canvas.getContext("2d"), cur = -1, dims;
    var src = function (i) { return o.dir + String(i).padStart(3, "0") + ".webp"; };
    var load = function (i) { if (!frames[i]) { frames[i] = new Image(); frames[i].decoding = "async"; frames[i].src = src(i); frames[i].onload = function () { if (i === cur) draw(i, true); }; } return frames[i]; };
    // load key frames first so scrubbing is never blank, then fill in
    for (var k = 0; k < o.n; k += 8) load(k); load(o.n - 1);
    setTimeout(function () { for (var j = 0; j < o.n; j++) load(j); }, 300);
    var size = function () { dims = FL.fit(canvas, 1); cur = -1; };
    size(); addEventListener("resize", function () { size(); api.set(api.p || 0); });
    var draw = function (i, force) {
      var img = frames[i];
      if (!img || !img.complete || !img.naturalWidth) { // fall back to the nearest loaded frame
        for (var d = 1; d < o.n; d++) { var a = frames[i - d], b = frames[i + d]; if (a && a.complete && a.naturalWidth) { img = a; break; } if (b && b.complete && b.naturalWidth) { img = b; break; } }
        if (!img || !img.naturalWidth) return;
      }
      var W = canvas.width, H = canvas.height, s = (o.fit === "contain" ? Math.min : Math.max)(W / img.naturalWidth, H / img.naturalHeight);
      var w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.fillStyle = o.bg || "#0D0B09"; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, (W - w) / 2, (H - h) * (o.alignY == null ? 0.5 : o.alignY), w, h);
    };
    var api = {
      p: 0,
      set: function (p) { api.p = p; var i = Math.round(Math.min(1, Math.max(0, p)) * (o.n - 1)); load(i); if (i !== cur) { cur = i; draw(i); } return i; }
    };
    return api;
  };

  /* ---------- storyboard hook: ?p=<0..1> scrolls to that fraction of the page ---------- */
  FL.ready(function () {
    FL.fill(document); FL.reveals(document);
    var q = new URLSearchParams(location.search), p = q.get("p");
    if (q.get("shot")) document.body.classList.add("x-shot");
    if (p == null) return;
    var go = function () {
      var y = Math.round(parseFloat(p) * Math.max(0, document.documentElement.scrollHeight - innerHeight));
      window.scrollTo(0, y); if (window.ScrollTrigger) window.ScrollTrigger.update();
      setTimeout(function () { document.documentElement.setAttribute("data-shot-ready", "1"); }, +(q.get("wait") || 1800));
    };
    addEventListener("load", function () { setTimeout(go, +(q.get("delay") || 900)); });
  });
})();
