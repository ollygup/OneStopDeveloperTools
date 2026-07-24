// tools/json.js — component + its own scoped CSS
Bench.registerTool({
  id: "json-formatter",
  section: "json",
  label: "JSON Formatter",
  mount(panel){
    Bench.injectStyle("json", `
      .json-output-wrap{ position:relative; }
      .json-output{
        font-family:var(--font-mono); font-size:0.9em; background:var(--panel-alt);
        border:1px solid var(--border); border-radius:var(--radius); margin:0;
        padding:40px 12px 12px; overflow-x:auto; max-width:100%;
        white-space:pre-wrap; word-break:break-word;
      }
      .json-output-tools{
        position:absolute; top:8px; right:8px; z-index:1;
        display:flex; align-items:center; gap:2px;
        background:var(--panel); border:1px solid var(--border); border-radius:var(--radius-sm);
        padding:3px; opacity:0.5; transition:opacity .12s ease;
      }
      .json-output-wrap:hover .json-output-tools,
      .json-output-tools:focus-within{ opacity:1; }
      @media (hover:none){ .json-output-tools{ opacity:0.85; } }
      .json-output-tools .json-sep{ width:1px; height:16px; background:var(--border); margin:0 2px; }
      .json-indent-sel{
        border:none; background:transparent; font-size:0.72em; color:var(--ink-muted);
        padding:2px; font-family:var(--font-ui); cursor:pointer;
      }
      .json-icon-btn{
        display:flex; align-items:center; justify-content:center;
        width:26px; height:26px; border:none; background:none; border-radius:5px;
        cursor:pointer; color:var(--ink-muted); padding:0;
      }
      .json-icon-btn:hover{ background:var(--panel-alt); color:var(--accent); }
      .json-icon-btn.active{ color:var(--accent); }
      .json-icon-btn.copied{ color:var(--ok); }
      .json-icon-btn svg{ width:15px; height:15px; }
      .json-badge{
        display:inline-block; font-size:0.79em; font-family:var(--font-mono);
        padding:2px 7px; border-radius:4px; background:var(--ok-soft); color:var(--ok); margin-bottom:12px;
      }
      .json-badge.err{ background:var(--err-soft); color:var(--err); }
    `);

    const ICONS = {
      copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h10"/></svg>`,
      check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      compress: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
      expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
      compare: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/><polyline points="12 9 15 12 12 15"/></svg>`
    };

    panel.innerHTML = `
      <h1 class="tool-title">JSON Formatter</h1>
      <p class="tool-desc">Validates and pretty-prints JSON as you type. Computed in this tab — nothing is sent anywhere.</p>

      <div class="field-group">
        <label class="field-label" for="json-input">Input</label>
        <textarea id="json-input" rows="10" placeholder="Paste JSON here..."></textarea>
      </div>

      <div id="json-status"></div>

      <div class="json-output-wrap" id="json-output-wrap" style="display:none">
        <div class="json-output-tools">
          <select class="json-indent-sel" id="json-indent" title="Indent">
            <option value="2">2sp</option>
            <option value="4">4sp</option>
            <option value="tab">Tab</option>
          </select>
          <div class="json-sep"></div>
          <button type="button" class="json-icon-btn" id="json-minify" title="Minify" aria-pressed="false">${ICONS.compress}</button>
          <button type="button" class="json-icon-btn" id="json-compare" title="Copy to Compare">${ICONS.compare}</button>
          <button type="button" class="json-icon-btn" id="json-copy" title="Copy">${ICONS.copy}</button>
        </div>
        <pre class="json-output" id="json-output"></pre>
      </div>
    `;

    const input = panel.querySelector("#json-input");
    const indentSel = panel.querySelector("#json-indent");
    const minifyBtn = panel.querySelector("#json-minify");
    const copyBtn = panel.querySelector("#json-copy");
    const compareBtn = panel.querySelector("#json-compare");
    const statusEl = panel.querySelector("#json-status");
    const outputWrap = panel.querySelector("#json-output-wrap");
    const outputEl = panel.querySelector("#json-output");

    let minified = false;
    let lastFormatted = "";

    function indentArg(){
      const v = indentSel.value;
      return v === "tab" ? "\t" : Number(v);
    }

    function locateError(text, message){
      const m = /position (\d+)/.exec(message);
      if(!m) return "";
      const pos = Number(m[1]);
      let line = 1, col = 1;
      for(let i = 0; i < pos && i < text.length; i++){
        if(text[i] === "\n"){ line++; col = 1; } else { col++; }
      }
      return ` (line ${line}, col ${col})`;
    }

    function render(){
      const text = input.value;
      statusEl.innerHTML = "";
      outputWrap.style.display = "none";
      lastFormatted = "";

      if(text.trim() === "") return;

      let value;
      try{
        value = JSON.parse(text);
      } catch(e){
        statusEl.innerHTML = `<span class="json-badge err">Invalid JSON</span> ${e.message}${locateError(text, e.message)}`;
        return;
      }

      statusEl.innerHTML = `<span class="json-badge">Valid JSON</span>`;
      lastFormatted = minified ? JSON.stringify(value) : JSON.stringify(value, null, indentArg());
      outputEl.textContent = lastFormatted;
      outputWrap.style.display = "block";
    }

    input.addEventListener("input", render);
    indentSel.addEventListener("change", () => { minified = false; syncMinifyIcon(); render(); });

    function syncMinifyIcon(){
      minifyBtn.innerHTML = minified ? ICONS.expand : ICONS.compress;
      minifyBtn.title = minified ? "Pretty-print" : "Minify";
      minifyBtn.setAttribute("aria-pressed", String(minified));
      minifyBtn.classList.toggle("active", minified);
    }

    minifyBtn.addEventListener("click", () => {
      minified = !minified;
      syncMinifyIcon();
      render();
    });

    copyBtn.addEventListener("click", () => {
      if(!lastFormatted) return;
      navigator.clipboard.writeText(lastFormatted).then(() => {
        copyBtn.innerHTML = ICONS.check;
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.innerHTML = ICONS.copy;
          copyBtn.classList.remove("copied");
        }, 1200);
      });
    });

    compareBtn.addEventListener("click", () => {
      if(!lastFormatted) return;
      Bench.goToTool("text-compare", { slot: "a", text: lastFormatted, json: true });
    });
  }
});
