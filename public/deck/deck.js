/*!
 * Deck — motor padrão das apresentações do Igor Cacerez.
 * Uso:  <link rel="stylesheet" href="/deck/deck.css">
 *       <div id="stage"> <section class="slide" id="capa" data-nome="Capa"> … </section> … </div>
 *       <script src="/deck/deck.js"></script>
 * Atributos no <body>: data-titulo (HUD esquerda), data-tema="papel|noite", data-palco="1600x900".
 * Recursos: passos (data-s), corte animado entre slides, visão geral (O), tela cheia (F), laser (L),
 * swipe, hash por slide, ícones (data-ic), embaralhar (data-scr), contador (data-conta), digitar (data-digita).
 * Ganchos: Deck.on("idDoSlide", { entra(slide) {}, sai(slide) {} })
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  if (window !== window.top) body.classList.add("embutido");
  const [W, H] = (body.dataset.palco || "1600x900").split("x").map(Number);
  const ganchos = {};
  const Deck = (window.Deck = { on: (id, g) => (ganchos[id] = Object.assign(ganchos[id] || {}, g)), W, H });

  /* ---------- montagem ---------- */
  let stage = $("#stage") || $(".stage");
  if (!stage) { stage = document.createElement("div"); stage.id = "stage"; $$(".slide").forEach(s => stage.append(s)); body.prepend(stage); }
  stage.classList.add("stage"); stage.style.width = W + "px"; stage.style.height = H + "px";
  const deck = document.createElement("main"); deck.id = "deck"; stage.before(deck); deck.append(stage);
  const slides = $$(".slide", stage);
  slides.forEach((s, n) => { if (!s.id) s.id = "s" + (n + 1); s.hidden = n !== 0; });

  const titulo = body.dataset.titulo || document.title;
  stage.insertAdjacentHTML("beforeend", `
    <div class="hud" id="hud"><span class="mk a"></span><span class="mk b"></span><span class="mk c"></span><span class="mk f"></span>
      <div class="e"><i></i><span></span></div><div class="d"><b id="hudN">01</b> / <span id="hudT">01</span></div>
      <div class="barra"><span id="hudB"></span></div></div>
    <div class="corte" id="corte"><div class="r"></div><div class="p"><b id="corteN">01</b><span><small id="corteC">// 01</small><em id="corteT"></em></span></div></div>`);
  $("#hud .e span").textContent = titulo;
  deck.insertAdjacentHTML("beforeend", `
    <div class="laser" id="laser" hidden></div>
    <nav class="ctrl" id="ctrl" aria-label="Controles">
      <button id="bAnt" title="Anterior (←)">‹</button><span id="cont">1 / 1</span><button id="bProx" title="Próximo (→)">›</button>
      <i></i><button id="bGeral" title="Visão geral (O)">▦</button><button id="bLaser" title="Laser (L)">●</button><button id="bTela" title="Tela cheia (F)">⛶</button>
    </nav>
    <div class="aviso" id="aviso">→ avançar · O visão geral · F tela cheia · L laser</div>`);

  function ajusta() { const r = deck.getBoundingClientRect(); stage.style.setProperty("--k", Math.min(r.width / W, r.height / H)); }
  addEventListener("resize", ajusta); ajusta();

  /* ---------- ícones de traço ---------- */
  const IC = Deck.icones = {
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    pessoas: '<circle cx="8.5" cy="8" r="3.2"/><circle cx="16.5" cy="8.5" r="2.8"/><path d="M2.5 20c0-3.4 2.7-6 6-6s6 2.6 6 6M15 14.2c3.2-.4 6.5 1.8 6.5 5.8"/>',
    prazo: '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4M8.5 15.5l2.5 2.5 4.5-5"/>',
    celular: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
    quadro: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4"/>',
    conversa: '<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
    pasta: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    codigo: '<rect x="4" y="4" width="16" height="11" rx="1"/><path d="M2 19h20M10 8l-2 2 2 2M14 8l2 2-2 2"/>',
    terminal: '<rect x="2.5" y="4" width="19" height="16" rx="1.5"/><path d="M6.5 9l3 3-3 3M12 15h5"/>',
    banco: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    nuvem: '<path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.2 9.2 4.5 4.5 0 0 0 7 18z"/>',
    ia: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    raio: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    foguete: '<path d="M12 2c3.5 2.5 5 6.5 4.5 11l-2 3h-5l-2-3C7 8.5 8.5 4.5 12 2z"/><circle cx="12" cy="9" r="1.8"/><path d="M9.5 16l-2.5 4 3-1M14.5 16l2.5 4-3-1"/>',
    livro: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    lampada: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    selo: '<circle cx="12" cy="9" r="6"/><path d="M9 14.5L7.5 22 12 19.5 16.5 22 15 14.5M9.5 9l1.8 1.8L14.5 7.5"/>',
    dinheiro: '<rect x="2" y="6" width="20" height="12" rx="1.5"/><circle cx="12" cy="12" r="3"/><path d="M6 10v4M18 10v4"/>',
    olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    caneta: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    repete: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
    seta: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    ok: '<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/>',
    x: '<circle cx="12" cy="12" r="9.5"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>'
  };
  $$("[data-ic]").forEach(el => {
    const corta = el.hasAttribute("data-corta") ? '<path class="corta" d="M3 3l18 18"/>' : "";
    const svg = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[el.dataset.ic] || ""}${corta}</svg>`;
    if (el.tagName === "I") el.outerHTML = svg; else el.innerHTML = svg;
  });

  /* ---------- efeitos ---------- */
  const GLIFOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&<>/";
  Deck.embaralha = el => {
    const alvo = el.dataset.txt ?? (el.dataset.txt = el.textContent), t0 = performance.now(), dur = 650;
    const f = t => { const p = Math.min(1, (t - t0) / dur);
      el.textContent = [...alvo].map((c, n) => c === " " || n / alvo.length < p * 1.15 - .1 ? c : GLIFOS[Math.random() * GLIFOS.length | 0]).join("");
      if (p < 1) requestAnimationFrame(f); else el.textContent = alvo; };
    requestAnimationFrame(f);
  };
  Deck.conta = el => {
    const alvo = +el.dataset.conta, mil = el.hasAttribute("data-mil"), suf = el.querySelector("small")?.outerHTML || "";
    const t0 = performance.now(), dur = +(el.dataset.dur || 1700);
    const f = t => { const p = Math.min(1, (t - t0) / dur), v = Math.round(alvo * (1 - Math.pow(1 - p, 4)));
      el.innerHTML = (mil ? v.toLocaleString("pt-BR") : v) + suf; if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  Deck.digita = (el, txt = el.dataset.digita, atraso = +(el.dataset.atraso || 500)) => {
    el.textContent = ""; let n = 0; clearTimeout(el._t);
    el._t = setTimeout(function pr() { el.textContent = txt.slice(0, ++n); if (n < txt.length) el._t = setTimeout(pr, 45); }, atraso);
  };

  /* ---------- navegação ---------- */
  let i = 0, passo = 0, geral = false, ocupado = false;
  const total = slides.length, pad = n => String(n).padStart(2, "0");
  const maxPasso = s => Math.max(0, ...$$("[data-s]", s).map(e => +e.dataset.s));
  $("#hudT").textContent = pad(total);

  function aplica() {
    const s = slides[i];
    $$("[data-s]", s).forEach(e => e.classList.toggle("on", +e.dataset.s <= passo));
    $("#cont").textContent = `${i + 1} / ${total}`;
    $("#hudN").textContent = pad(i + 1);
    $("#hudB").style.width = ((i + 1) / total * 100) + "%";
    $("#hud").classList.toggle("fora", s.hasAttribute("data-sem-hud"));
    body.dataset.slide = s.id;
    dispatchEvent(new CustomEvent("deck:passo", { detail: { slide: s, indice: i, passo } }));
  }
  function entra(s) {
    $$("[data-scr]", s).forEach(Deck.embaralha);
    $$("[data-conta]", s).forEach(e => setTimeout(() => Deck.conta(e), 300));
    $$("[data-digita]", s).forEach(e => Deck.digita(e));
    ganchos[s.id]?.entra?.(s);
    dispatchEvent(new CustomEvent("deck:entra", { detail: { slide: s, indice: slides.indexOf(s) } }));
  }
  function troca(n, p) {
    ganchos[slides[i].id]?.sai?.(slides[i]);
    slides[i].hidden = true; i = n; passo = p; slides[i].hidden = false;
    entra(slides[i]); aplica();
    try { history.replaceState(null, "", "#" + slides[i].id); } catch (e) {}
  }
  const corte = $("#corte");
  function ir(n, p = 0) {
    if (ocupado || n < 0 || n >= total) return; if (geral) return saiGeral(n); if (n === i) return;
    ocupado = true;
    corte.classList.toggle("vol", n < i);
    $("#corteN").textContent = pad(n + 1);
    $("#corteC").textContent = `// ${pad(n + 1)} / ${pad(total)}`;
    $("#corteT").textContent = slides[n].dataset.nome || "";
    corte.classList.remove("out"); void corte.offsetWidth; corte.classList.add("in");
    setTimeout(() => {
      troca(n, p);
      corte.classList.remove("in"); void corte.offsetWidth; corte.classList.add("out");
      setTimeout(() => { corte.classList.remove("out"); ocupado = false; }, 580);
    }, 560);
  }
  const proximo = () => { if (geral || ocupado) return; if (passo < maxPasso(slides[i])) { passo++; aplica(); } else ir(i + 1); };
  const anterior = () => { if (geral || ocupado) return; if (passo > 0) { passo--; aplica(); } else if (i > 0) ir(i - 1, maxPasso(slides[i - 1])); };
  Object.assign(Deck, { ir, proximo, anterior, slides, get atual() { return i; } });

  const cols = Math.ceil(Math.sqrt(total * 16 / 9)) || 1, esc = Math.min(.96 / cols, .96 / Math.ceil(total / cols));
  const pos = n => { const gx = W / cols, gy = gx * H / W;
    return `translate(${(n % cols) * gx + (gx - W * esc) / 2}px, ${Math.floor(n / cols) * gy + 20}px) scale(${esc})`; };
  function entraGeral() {
    if (geral || ocupado) return; geral = true;
    slides.forEach((s, n) => { s.hidden = false; s.style.transform = n === i ? "none" : pos(n);
      if (!s.querySelector(".rotuloG")) s.insertAdjacentHTML("beforeend", `<div class="rotuloG">${pad(n + 1)} · ${s.dataset.nome || ""}</div>`); });
    stage.classList.add("geral");
    requestAnimationFrame(() => requestAnimationFrame(() => slides.forEach((s, n) => (s.style.transform = pos(n)))));
  }
  function saiGeral(n) {
    geral = false; const alvo = slides[n];
    stage.classList.remove("geral"); stage.classList.add("saindo");
    slides.forEach((s, k) => { if (k !== n) { s.hidden = true; s.style.transform = ""; } });
    requestAnimationFrame(() => (alvo.style.transform = "none"));
    setTimeout(() => { stage.classList.remove("saindo"); alvo.style.transform = ""; }, 720);
    i = n; passo = 0; entra(alvo); aplica();
    try { history.replaceState(null, "", "#" + alvo.id); } catch (e) {}
  }
  stage.addEventListener("click", e => {
    if (geral) { const s = e.target.closest(".slide"); if (s) saiGeral(slides.indexOf(s)); return; }
    if (e.target.closest("button, a, input, label, textarea, select, [data-sem-clique]")) return;
    proximo();
  });
  addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea")) return;
    const k = e.key;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) { e.preventDefault(); proximo(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); anterior(); }
    else if (k === "Home") ir(0); else if (k === "End") ir(total - 1);
    else if (k === "o" || k === "O") geral ? saiGeral(i) : entraGeral();
    else if (k === "Escape") { if (geral) saiGeral(i); }
    else if (k === "f" || k === "F" || k === "F5") { e.preventDefault(); telaCheia(); }
    else if (k === "l" || k === "L") laser();
    document.activeElement?.closest?.("#ctrl") && document.activeElement.blur();
    acorda();
  });
  let x0 = null;
  deck.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") x0 = e.clientX; });
  deck.addEventListener("pointerup", e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) dx < 0 ? proximo() : anterior(); });
  function telaCheia() { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else deck.requestFullscreen?.().catch(() => {}); }
  const lz = $("#laser");
  function laser() { lz.hidden = !lz.hidden; $("#bLaser").classList.toggle("lig", !lz.hidden); }
  deck.addEventListener("pointermove", e => { acorda(); if (!lz.hidden) { const r = deck.getBoundingClientRect(); lz.style.left = e.clientX - r.left + "px"; lz.style.top = e.clientY - r.top + "px"; } });
  $("#bAnt").onclick = anterior; $("#bProx").onclick = proximo; $("#bGeral").onclick = () => (geral ? saiGeral(i) : entraGeral());
  $("#bTela").onclick = telaCheia; $("#bLaser").onclick = laser;
  $("#ctrl").addEventListener("click", e => e.stopPropagation());
  let tq; function acorda() { deck.classList.remove("quieto"); clearTimeout(tq); tq = setTimeout(() => deck.classList.add("quieto"), 2600); }
  setTimeout(() => { const a = $("#aviso"); a.style.opacity = 0; setTimeout(() => (a.hidden = true), 700); }, 6000);
  try { navigator.wakeLock?.request("screen").catch(() => {}); } catch (e) {}

  /* inicia depois que os scripts do próprio slide registrarem os ganchos */
  const inicia = () => {
    const n0 = slides.findIndex(s => s.id === decodeURIComponent(location.hash.slice(1)));
    if (n0 > 0) { slides[0].hidden = true; i = n0; slides[i].hidden = false; }
    entra(slides[i]); aplica(); acorda(); body.classList.add("pronto");
  };
  document.readyState === "complete" ? setTimeout(inicia) : addEventListener("load", inicia);
})();
