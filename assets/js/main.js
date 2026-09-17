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

  /* ---------- Mục lục tự sinh cho mỗi panel ---------- */
  function buildToc(panel) {
    const toc = $(".toc", panel);
    if (!toc) return;
    const content = $(".content", panel);
    const items = $$(".chapter", content).map(ch => {
      const title = $(".chapter-title", ch);
      const label = title
        ? Array.from(title.childNodes).map(n => n.textContent.trim()).filter(Boolean).join(" · ")
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

  /* ---------- Công thức nhanh: tự gom mọi .formula / .equation trên trang ---------- */
  function initFormulaSheet() {
    const panels = $$(".panel").filter(p => $(".formula, .equation", p));
    if (!panels.length) return;
    const hasEq = panels.some(p => $(".equation", p));
    const total = panels.reduce((n, p) => n + $$(".formula", p).length, 0);
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
        const items = $$(".formula, .equation", ls);
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
    sheet.setAttribute("aria-label", "Công thức nhanh");
    sheet.innerHTML = `
      <div class="fs-inner">
        <header class="fs-head">
          <div class="fs-head-row">
            <div>
              <div class="fs-title">∑ Công thức nhanh</div>
              <div class="fs-sub">${total} công thức${hasEq ? " · kèm phương trình hoá học" : ""} · bấm tên bài để xem chi tiết</div>
            </div>
            <span class="spacer"></span>
            <button type="button" class="icon-btn fs-print" title="In bảng công thức">🖨️ In</button>
            <button type="button" class="icon-btn fs-close" title="Đóng (Esc)">✕</button>
          </div>
          <div class="fs-controls">
            <input type="search" placeholder="Tìm: điện trở, R, độ cồn, allele…" aria-label="Tìm công thức">
            ${chips}
            ${hasEq ? `<label class="fs-check"><input type="checkbox" checked> Phương trình hoá học</label>` : ""}
          </div>
        </header>
        <div class="fs-body">${groups}<p class="fs-empty" hidden>Không tìm thấy công thức phù hợp.</p></div>
      </div>`;
    document.body.appendChild(sheet);

    const norm = s => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();
    const search = $("input[type=search]", sheet);
    const eqBox = $(".fs-check input", sheet);
    const itemText = new Map($$(".formula, .equation", sheet).map(el => [el, norm(el.textContent)]));
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
          $$(".formula, .equation", ls).forEach(it => {
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
    }

    const open = () => {
      const current = panels.find(p => !p.hidden);
      scope = panels.length > 1 && current ? current.id : "all";
      apply();
      sheet.showModal();
      $(".fs-body", sheet).scrollTop = 0;
    };

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-btn formula-btn";
    btn.title = "Tra nhanh công thức (phím F)";
    btn.innerHTML = `<b>∑</b> Công thức<span class="hide-sm"> nhanh</span>`;
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
    initTabs();
    initFormulaSheet();
    initToTop();
  });
})();
