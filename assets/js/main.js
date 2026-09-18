/* Sổ tay SGK — logic dùng chung cho mọi trang. Không cần máy chủ, mở file trực tiếp được. */
(function () {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* bỏ qua */ } }
  };

  /* ---------- Sáng / tối ---------- */
  const savedTheme = store.get("theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  function initThemeButton() {
    const btn = $("#theme-toggle");
    if (!btn) return;
    const isDark = () => {
      const t = document.documentElement.dataset.theme;
      return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    };
    const paint = () => { btn.textContent = isDark() ? "☀️" : "🌙"; };
    paint();
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      store.set("theme", next);
      paint();
    });
  }

  /* ---------- Trang chủ: danh sách lớp ---------- */
  function renderGrades(el) {
    const levels = [...new Set(window.CATALOG.map(g => g.level))];
    el.innerHTML = levels.map(level => `
      <h2 class="group-title">${level === "THCS" ? "Trung học cơ sở" : "Trung học phổ thông"}</h2>
      <div class="card-grid">
        ${window.CATALOG.filter(g => g.level === level).map(g => {
          const ready = g.status === "ready";
          const count = g.subjects.filter(s => s.status === "ready").length;
          const inner = `
            <div class="card-icon">${g.name.replace("Lớp ", "")}</div>
            <div class="card-title">${g.name}</div>
            <span class="badge ${ready ? "ready" : ""}">${ready ? count + " môn đã có" : "Sắp có"}</span>`;
          return ready
            ? `<a class="card" href="${g.id}/index.html">${inner}</a>`
            : `<div class="card disabled" aria-disabled="true">${inner}</div>`;
        }).join("")}
      </div>`).join("");
  }

  /* ---------- Trang lớp: danh sách môn ---------- */
  function renderSubjects(el, gradeId) {
    const grade = window.CATALOG.find(g => g.id === gradeId);
    if (!grade) return;
    const ordered = [...grade.subjects].sort((a, b) => (a.status === "ready" ? 0 : 1) - (b.status === "ready" ? 0 : 1));
    el.innerHTML = `<div class="card-grid">${ordered.map(s => {
      const ready = s.status === "ready";
      const style = `--card-color:${s.color}`;
      const inner = `
        <div class="card-icon">${s.icon}</div>
        <div class="card-title">${s.name}</div>
        ${s.desc ? `<div class="card-desc">${s.desc}</div>` : ""}
        <span class="badge ${ready ? "ready" : ""}">${ready ? "Đã tổng hợp" : "Sắp có"}</span>`;
      return ready
        ? `<a class="card" style="${style}" href="${s.page}">${inner}</a>`
        : `<div class="card disabled" style="${style}" aria-disabled="true">${inner}</div>`;
    }).join("")}</div>`;
  }

  const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ---------- Mục lục tự sinh cho mỗi panel ---------- */
  function buildToc(panel) {
    const toc = $(".toc", panel);
    if (!toc) return;
    const content = $(".content", panel);
    const items = $$(".chapter", content).map(ch => {
      const title = $(".chapter-title", ch);
      const label = title
        ? Array.from(title.childNodes)
            .map(n => (n.nodeType === 1 ? n.innerHTML : escapeHtml(n.textContent)).trim())
            .filter(Boolean).join(" · ")
        : "";
      const lessons = $$(".lesson", ch).map(ls => {
        const t = $(".lesson-title", ls);
        return `<li><a href="#${ls.id}">${t ? t.innerHTML : ls.id}</a></li>`;
      }).join("");
      return `<li><div class="toc-chapter">${label}</div><ol>${lessons}</ol></li>`;
    }).join("");
    toc.innerHTML = `
      <button type="button" class="icon-btn toc-toggle">☰ Mục lục</button>
      <div class="toc-title">Mục lục</div>
      <div class="toc-body">
        <input type="search" placeholder="Tìm bài, từ khoá…" aria-label="Tìm trong môn">
        <ol>${items}</ol>
      </div>`;
    $$(".lesson-no", toc).forEach(n => { n.outerHTML = `<b>${n.textContent}.</b> `; });
    $(".toc-toggle", toc).addEventListener("click", () => toc.classList.toggle("open"));
    $$("a", toc).forEach(a => a.addEventListener("click", () => toc.classList.remove("open")));

    // Tìm: lọc theo cả tiêu đề lẫn nội dung bài
    const norm = s => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
    const lessonText = new Map($$(".lesson", content).map(ls => [ls.id, norm(ls.textContent)]));
    $("input", toc).addEventListener("input", e => {
      const q = norm(e.target.value.trim());
      $$(".lesson", content).forEach(ls => { ls.hidden = q && !lessonText.get(ls.id).includes(q); });
      $$(".chapter", content).forEach(ch => { ch.hidden = !$$(".lesson", ch).some(ls => !ls.hidden); });
      $$("a", toc).forEach(a => {
        const id = a.getAttribute("href").slice(1);
        a.parentElement.hidden = q && !lessonText.get(id)?.includes(q);
      });
    });

    // Tô sáng bài đang đọc
    const links = new Map($$("a", toc).map(a => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.remove("active"));
        const a = links.get(en.target.id);
        if (a) { a.classList.add("active"); a.scrollIntoView({ block: "nearest" }); }
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    $$(".lesson", content).forEach(ls => io.observe(ls));
  }

  /* ---------- Tab ---------- */
  function initTabs() {
    const tabs = $$(".tab[data-tab]");
    if (!tabs.length) return;
    const panels = $$(".panel");
    const show = (id, fromHash) => {
      if (!tabs.some(t => t.dataset.tab === id)) id = tabs[0].dataset.tab;
      tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab === id)));
      panels.forEach(p => { p.hidden = p.id !== id; });
      const active = panels.find(p => p.id === id);
      document.documentElement.style.setProperty("--accent", getComputedStyle(active).getPropertyValue("--accent"));
      if (!fromHash) history.replaceState(null, "", "#" + id);
      fitFormulas(active);
    };
    tabs.forEach(t => t.addEventListener("click", () => { show(t.dataset.tab); window.scrollTo({ top: 0 }); }));

    const openFromHash = () => {
      const hash = decodeURIComponent(location.hash.slice(1));
      if (!hash) return show(tabs[0].dataset.tab, true);
      const target = document.getElementById(hash);
      const panel = target && (target.classList.contains("panel") ? target : target.closest(".panel"));
      show(panel ? panel.id : tabs[0].dataset.tab, true);
      if (target && panel !== target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "instant" }));
    };
    window.addEventListener("hashchange", openFromHash);
    openFromHash();
  }

  /* ---------- Công thức (KaTeX, chạy offline) ---------- */
  function renderMath() {
    if (!window.renderMathInElement) return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }

  /* ---------- Công thức dài: xếp dọc khung đặt cạnh nhau, rồi thu nhỏ chữ cho vừa ---------- */
  function fitFormulas(root = document) {
    const bodies = $$(".formula-body, .equation", root).filter(b => b.offsetParent);
    // tràn: chính khung hoặc khối công thức bên trong (.katex-display tự cuộn nên phải đo riêng)
    const over = b => b.scrollWidth > b.clientWidth + 1 ||
      $$(".katex-display", b).some(k => k.scrollWidth > k.clientWidth + 1);
    const rows = new Set(bodies.map(b => b.closest(".formula-row")).filter(Boolean));
    rows.forEach(r => r.classList.remove("stack"));
    bodies.forEach(b => b.style.removeProperty("--fit"));
    bodies.forEach(b => {
      const row = b.closest(".formula-row");
      if (row && over(b)) row.classList.add("stack");
    });
    const minFit = innerWidth < 640 ? 0.6 : 0.72;
    bodies.forEach(b => {
      for (let fit = 0.93; over(b) && fit >= minFit; fit -= 0.07) {
        b.style.setProperty("--fit", fit.toFixed(2));
      }
      b.classList.toggle("is-scroll", over(b));   // vẫn tràn → hiện gợi ý vuốt ngang
    });
    // Công thức riêng dòng nằm ngoài khung (vd. trong lời giải bài tập) → thu nhỏ bằng biến riêng --kfit
    $$(".katex-display", root).filter(k => k.offsetParent && !k.closest(".formula-body, .equation")).forEach(k => {
      k.style.removeProperty("--kfit");
      k.classList.add("kfit");
      for (let fit = 0.93; k.scrollWidth > k.clientWidth + 1 && fit >= minFit; fit -= 0.07) {
        k.style.setProperty("--kfit", fit.toFixed(2));
      }
    });
    // Công thức trong câu quá dài (không tự xuống dòng được) → cho cuộn ngang riêng
    $$(".k-scroll", root).forEach(k => k.classList.remove("k-scroll"));
    $$(".katex", root).forEach(k => {
      if (!k.offsetParent || k.closest(".katex-display, .formula-body, .equation")) return;
      const box = k.parentElement.closest("p, li, td, th, dd, div, figcaption");
      if (box && k.getBoundingClientRect().right > box.getBoundingClientRect().right + 1) k.classList.add("k-scroll");
    });
  }
  let fitTimer;
  addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => fitFormulas(), 200); });

  /* ---------- Công thức nhanh: tự gom mọi .formula / .equation trên trang ---------- */
  function initFormulaSheet() {
    const SEL = document.body.dataset.quickSelector || ".formula, .equation";
    const panels = $$(".panel").filter(p => $(SEL, p));
    if (!panels.length) return;
    const hasEq = panels.some(p => $(".equation", p));
    // Trang có thể đổi chữ qua <body data-quick-title=".." data-quick-unit=".." data-quick-hint="..">
    const label = {
      title: document.body.dataset.quickTitle || "Công thức nhanh",
      unit: document.body.dataset.quickUnit || "công thức",
      hint: document.body.dataset.quickHint || "Tìm: điện trở, R, độ cồn, allele…"
    };
    const total = panels.reduce((n, p) => n + $$(SEL, p).filter(el => !el.classList.contains("equation")).length, 0);
    const tabName = p => {
      const tab = $(`.tab[data-tab="${p.id}"]`);
      return tab ? tab.textContent.trim() : ($(".subject-head h1")?.textContent.trim() || "");
    };
    const clean = el => {
      const c = el.cloneNode(true);
      c.removeAttribute("id");
      $$("[id]", c).forEach(x => x.removeAttribute("id"));
      return c.outerHTML;
    };

    const groups = panels.map(p => {
      const css = getComputedStyle(p);
      const lessons = $$(".lesson", p).map(ls => {
        const items = $$(SEL, ls);
        if (!items.length) return "";
        return `<section class="fs-lesson">
            <a class="fs-lesson-title" href="#${ls.id}">${$(".lesson-title", ls).innerHTML}<span class="fs-go">Xem bài →</span></a>
            <div class="fs-items">${items.map(clean).join("")}</div>
          </section>`;
      }).join("");
      const style = `--accent:${css.getPropertyValue("--accent")};--accent-soft:${css.getPropertyValue("--accent-soft")}`;
      return `<section class="fs-group" data-panel="${p.id}" style="${style}">
          <h3 class="fs-group-title">${tabName(p)}</h3>${lessons}
        </section>`;
    }).join("");

    const chips = panels.length > 1
      ? `<div class="fs-chips" role="group" aria-label="Chọn phần">
          <button type="button" class="chip" data-scope="all">Tất cả</button>
          ${panels.map(p => `<button type="button" class="chip" data-scope="${p.id}"
            style="--c:${getComputedStyle(p).getPropertyValue("--accent")}">${tabName(p)}</button>`).join("")}
        </div>`
      : "";

    const sheet = document.createElement("dialog");
    sheet.className = "fsheet";
    sheet.setAttribute("aria-label", label.title);
    sheet.innerHTML = `
      <div class="fs-inner">
        <header class="fs-head">
          <div class="fs-head-row">
            <div>
              <div class="fs-title">∑ ${label.title}</div>
              <div class="fs-sub">${total} ${label.unit}${hasEq ? " · kèm phương trình hoá học" : ""} · bấm tên bài để xem chi tiết</div>
            </div>
            <span class="spacer"></span>
            <button type="button" class="icon-btn fs-print" title="In bảng công thức">🖨️ In</button>
            <button type="button" class="icon-btn fs-close" title="Đóng (Esc)">✕</button>
          </div>
          <div class="fs-controls">
            <input type="search" placeholder="${label.hint}" aria-label="Tìm ${label.unit}">
            ${chips}
            ${hasEq ? `<label class="fs-check"><input type="checkbox" checked> Phương trình hoá học</label>` : ""}
          </div>
        </header>
        <div class="fs-body">${groups}<p class="fs-empty" hidden>Không tìm thấy ${label.unit} phù hợp.</p></div>
      </div>`;
    document.body.appendChild(sheet);

    const norm = s => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();
    const search = $("input[type=search]", sheet);
    const eqBox = $(".fs-check input", sheet);
    const itemText = new Map($$(SEL, sheet).map(el => [el, norm(el.textContent)]));
    let scope = "all";

    function apply() {
      const q = norm(search.value.trim());
      const showEq = !eqBox || eqBox.checked;
      $$(".chip", sheet).forEach(c => c.setAttribute("aria-pressed", String(c.dataset.scope === scope)));
      if (eqBox) eqBox.parentElement.hidden = scope !== "all" && !$(`.fs-group[data-panel="${scope}"] .equation`, sheet);
      $$(".fs-group", sheet).forEach(g => {
        let groupCount = 0;
        $$(".fs-lesson", g).forEach(ls => {
          const lessonHit = q && norm($(".fs-lesson-title", ls).textContent).includes(q);
          let count = 0;
          $$(SEL, ls).forEach(it => {
            const ok = (showEq || !it.classList.contains("equation")) && (!q || lessonHit || itemText.get(it).includes(q));
            it.hidden = !ok;
            if (ok) count++;
          });
          ls.hidden = !count;
          groupCount += count;
        });
        g.hidden = !groupCount || (scope !== "all" && g.dataset.panel !== scope);
      });
      $(".fs-empty", sheet).hidden = $$(".fs-group", sheet).some(g => !g.hidden);
      if (sheet.open) fitFormulas(sheet);
    }

    const open = () => {
      const current = panels.find(p => !p.hidden);
      scope = panels.length > 1 && current ? current.id : "all";
      apply();
      sheet.showModal();
      fitFormulas(sheet);
      $(".fs-body", sheet).scrollTop = 0;
    };

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-btn formula-btn";
    btn.title = `Tra nhanh ${label.unit} (phím F)`;
    const words = label.title.split(" ");
    const last = words.length > 1 ? words.pop() : "";
    btn.innerHTML = `<b>∑</b> ${words.join(" ")}${last ? `<span class="hide-sm"> ${last}</span>` : ""}`;
    btn.addEventListener("click", open);
    const themeBtn = $("#theme-toggle");
    if (themeBtn) themeBtn.before(btn); else $(".topbar-inner")?.appendChild(btn);

    search.addEventListener("input", apply);
    eqBox?.addEventListener("change", apply);
    $$(".chip", sheet).forEach(c => c.addEventListener("click", () => { scope = c.dataset.scope; apply(); }));
    $(".fs-close", sheet).addEventListener("click", () => sheet.close());
    sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });
    $$(".fs-lesson-title", sheet).forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      sheet.close();
      const hash = a.getAttribute("href");
      if (location.hash === hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
      else location.hash = hash;
    }));
    $(".fs-print", sheet).addEventListener("click", () => {
      document.documentElement.classList.add("print-formulas");
      window.print();
    });
    addEventListener("afterprint", () => document.documentElement.classList.remove("print-formulas"));
    if (location.hash === "#cong-thuc") open();
    document.addEventListener("keydown", e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if (e.key.toLowerCase() === "f" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !sheet.open) {
        e.preventDefault();
        open();
      }
    });
  }

  /* ---------- Kí hiệu viết tắt: lấy từ details.abbr-legend, gắn chú thích vào bài ---------- */
  function initAbbr() {
    const legend = $(".abbr-legend");
    if (!legend) return;
    const terms = new Map();   // kí hiệu -> nghĩa
    const inline = [];         // kí hiệu được tìm cả trong câu chữ (sb, sth…)
    $$("[data-term]", legend).forEach(item => {
      const tip = `${$("dt", item).textContent}: ${$("dd", item).textContent}`;
      item.dataset.term.split("|").forEach(t => {
        terms.set(t, tip);
        if (item.hasAttribute("data-inline")) inline.push(t);
      });
    });
    const mark = (el, tip) => {
      el.classList.add("ab");
      el.dataset.tip = tip;
      el.tabIndex = 0;
    };

    // 1) Chỗ điền trong khung cấu trúc: <i>S</i>, <i>V (nguyên thể)</i>…
    $$(".content .pattern i").forEach(i => {
      const key = i.textContent.trim().replace(/\s*\(.*\)$/, "");
      if (terms.has(key)) mark(i, terms.get(key));
    });

    // 2) sb / sth / one's trong câu chữ
    if (inline.length) {
      const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?<![\\w'-])(${inline.map(esc).join("|")})(?![\\w'-])`, "g");
      $$(".content").forEach(content => {
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
          acceptNode: n => n.parentElement.closest(".abbr-legend, .ab, script, style")
            ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        const nodes = [];
        const has = new RegExp(re.source);
        while (walker.nextNode()) if (has.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
        nodes.forEach(node => {
          const frag = document.createDocumentFragment();
          let last = 0;
          node.nodeValue.replace(re, (m, term, at) => {
            frag.append(node.nodeValue.slice(last, at));
            const span = document.createElement("span");
            span.textContent = m;
            mark(span, terms.get(term));
            frag.append(span);
            last = at + m.length;
          });
          frag.append(node.nodeValue.slice(last));
          node.replaceWith(frag);
        });
      });
    }

    // Bong bóng chú thích (đặt fixed để không bị khung cuộn cắt mất)
    const tip = document.createElement("div");
    tip.className = "ab-tip";
    tip.hidden = true;
    const show = el => {
      (el.closest("dialog") || document.body).appendChild(tip);
      tip.textContent = el.dataset.tip;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      const w = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
      const above = r.top - tip.offsetHeight - 6;
      tip.style.top = (above > 8 ? above : r.bottom + 6) + "px";
    };
    const hide = () => { tip.hidden = true; };
    document.addEventListener("mouseover", e => { const el = e.target.closest?.(".ab"); if (el) show(el); });
    document.addEventListener("mouseout", e => { if (e.target.closest?.(".ab")) hide(); });
    document.addEventListener("focusin", e => { const el = e.target.closest?.(".ab"); if (el) show(el); });
    document.addEventListener("focusout", hide);
    document.addEventListener("click", e => { const el = e.target.closest?.(".ab"); if (el) show(el); else hide(); });
    addEventListener("scroll", e => {
      if (e.target === document || e.target.closest?.(".fs-body")) hide();
    }, { passive: true, capture: true });
  }

  /* ---------- Lý thuyết ⇄ Bài tập ----------
     Trang lý thuyết: <body data-exercise-page="khtn-bai-tap.html" data-exercise-tabs="vat-li,chuyen-de-vat-li">
     Trang bài tập:   <body data-theory-page="khtn.html">; id bài tập = "bt-" + id bài lý thuyết. */
  function initModeLinks() {
    const exPage = document.body.dataset.exercisePage;
    const thPage = document.body.dataset.theoryPage;
    const activePanel = () => $$(".panel").find(p => !p.hidden);

    if (exPage) {
      const tabs = (document.body.dataset.exerciseTabs || "").split(",").map(s => s.trim()).filter(Boolean);
      tabs.forEach(tab => $$(`#${tab} .lesson`).forEach(ls => {
        const title = $(".lesson-title", ls);
        if (title) title.insertAdjacentHTML("beforeend",
          `<a class="lesson-ex-link" href="${exPage}#bt-${ls.id}">✍️ Bài tập</a>`);
      }));
    }
    if (thPage) {
      $$(".lesson[id^='bt-']").forEach(ls => {
        const title = $(".lesson-title", ls);
        if (title) title.insertAdjacentHTML("beforeend",
          `<a class="lesson-ex-link" href="${thPage}#${ls.id.slice(3)}">📘 Lý thuyết</a>`);
      });
    }
    // Nút chuyển chế độ: giữ nguyên tab đang xem
    $$(".mode-switch a[data-mode]").forEach(a => a.addEventListener("click", e => {
      const p = activePanel();
      if (!p) return;
      const target = a.dataset.mode === "bai-tap" ? "bt-" + p.id : p.id.replace(/^bt-/, "");
      e.preventDefault();
      location.href = a.getAttribute("href").split("#")[0] + "#" + target;
    }));
  }

  /* ---------- Trang bài tập: lọc theo mức, bật/tắt lời giải ---------- */
  function initExercises() {
    const LEVELS = { 1: "Cơ bản", 2: "Vận dụng", 3: "Nâng cao" };
    $$(".exercise").forEach(ex => {
      const lv = $(".ex-level", ex);
      if (lv && !lv.textContent.trim()) lv.textContent = LEVELS[ex.dataset.level] || "";
    });
    $$(".panel").forEach(panel => {
      const items = $$(".exercise", panel);
      const content = $(".content", panel);
      if (!items.length || !content) return;
      const count = lv => items.filter(x => !lv || x.dataset.level === String(lv)).length;
      const bar = document.createElement("div");
      bar.className = "ex-toolbar";
      bar.innerHTML = `
        <span class="label">Mức:</span>
        <button type="button" class="chip" data-lv="" aria-pressed="true">Tất cả (${count()})</button>
        ${[1, 2, 3].map(l => `<button type="button" class="chip" data-lv="${l}" aria-pressed="false">
          ${LEVELS[l]}${l === 3 ? " *" : ""} (${count(l)})</button>`).join("")}
        <span class="spacer"></span>
        <button type="button" class="icon-btn ex-toggle">👁 Hiện tất cả lời giải</button>`;
      content.prepend(bar);
      $$(".chip", bar).forEach(c => c.addEventListener("click", () => {
        $$(".chip", bar).forEach(x => x.setAttribute("aria-pressed", String(x === c)));
        items.forEach(x => { x.hidden = !!c.dataset.lv && x.dataset.level !== c.dataset.lv; });
      }));
      const toggle = $(".ex-toggle", bar);
      toggle.addEventListener("click", () => {
        const open = toggle.dataset.open !== "1";
        $$("details.solution", panel).forEach(d => { d.open = open; });
        toggle.dataset.open = open ? "1" : "";
        toggle.textContent = open ? "🙈 Ẩn tất cả lời giải" : "👁 Hiện tất cả lời giải";
        if (open) fitFormulas(panel);
      });
      // Lời giải mở ra mới có kích thước → co công thức lúc đó
      $$("details.solution", panel).forEach(d => d.addEventListener("toggle", () => { if (d.open) fitFormulas(d); }));
    });
  }

  function initToTop() {
    const btn = document.createElement("button");
    btn.className = "to-top"; btn.type = "button"; btn.title = "Lên đầu trang"; btn.textContent = "↑";
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(btn);
    addEventListener("scroll", () => btn.classList.toggle("show", scrollY > 600), { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initThemeButton();
    const grades = $("#grade-list");
    if (grades) renderGrades(grades);
    const subjects = $("#subject-list");
    if (subjects) renderSubjects(subjects, subjects.dataset.grade);
    renderMath();
    $$(".panel").forEach(buildToc);
    initModeLinks();
    initExercises();
    initTabs();
    initAbbr();
    initFormulaSheet();
    fitFormulas();
    document.fonts?.ready.then(() => fitFormulas());
    initToTop();
  });
})();
