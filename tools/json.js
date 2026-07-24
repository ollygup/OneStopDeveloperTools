// tools/json.js — component + its own scoped CSS
Bench.registerTool({
  id: "json-formatter",
  section: "json",
  label: "JSON Formatter",
  mount(panel){
    Bench.injectStyle("json", `
      .json-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:14px; }
      .json-toolbar select{
        border:1px solid var(--border); background:var(--panel); border-radius:var(--radius-sm);
        font-size:0.79em; padding:5px 8px; color:var(--ink-muted); font-family:var(--font-ui);
      }
      .json-btn{
        border:1px solid var(--border); background:var(--panel); border-radius:var(--radius-sm);
        font-size:0.79em; font-weight:500; padding:6px 10px; cursor:pointer; color:var(--ink-muted);
      }
      .json-btn:hover{ color:var(--accent); border-color:var(--accent); }
      .json-badge{
        display:inline-block; font-size:0.79em; font-family:var(--font-mono);
        padding:2px 7px; border-radius:4px; background:var(--ok-soft); color:var(--ok); margin-bottom:12px;
      }
      .json-badge.err{ background:var(--err-soft); color:var(--err); }
      .json-output{
        font-family:var(--font-mono); font-size:0.9em; background:var(--panel-alt);
        border:1px solid var(--border); border-radius:var(--radius); padding:12px;
        margin:0; overflow-x:auto; max-width:100%; white-space:pre-wrap; word-break:break-word;
      }
      .json-send{
        display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-top:14px;
        padding-top:14px; border-top:1px solid var(--border);
      }
      .json-send-label{ font-size:0.79em; color:var(--ink-muted); margin-right:2px; }
    `);

    panel.innerHTML = `
      <h1 class="tool-title">JSON Formatter</h1>
      <p class="tool-desc">Validates and pretty-prints JSON as you type. Computed in this tab — nothing is sent anywhere.</p>

      <div class="field-group">
        <label class="field-label" for="json-input">Input</label>
        <textarea id="json-input" rows="10" placeholder="Paste JSON here..."></textarea>
      </div>

      <div class="json-toolbar">
        <select id="json-indent">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>
        <button type="button" class="json-btn" id="json-minify">Minify</button>
        <button type="button" class="copy-btn" id="json-copy">Copy</button>
      </div>

      <div id="json-status"></div>
      <pre class="json-output" id="json-output" style="display:none"></pre>

      <div class="json-send" id="json-send" style="display:none">
        <span class="json-send-label">Compare against another JSON:</span>
        <button type="button" class="json-btn" id="json-send-a">Send as Original →</button>
        <button type="button" class="json-btn" id="json-send-b">Send as Changed →</button>
      </div>
    `;

    const input = panel.querySelector("#json-input");
    const indentSel = panel.querySelector("#json-indent");
    const minifyBtn = panel.querySelector("#json-minify");
    const copyBtn = panel.querySelector("#json-copy");
    const statusEl = panel.querySelector("#json-status");
    const outputEl = panel.querySelector("#json-output");
    const sendRow = panel.querySelector("#json-send");
    const sendABtn = panel.querySelector("#json-send-a");
    const sendBBtn = panel.querySelector("#json-send-b");

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
      outputEl.style.display = "none";
      sendRow.style.display = "none";
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
      outputEl.style.display = "block";
      sendRow.style.display = "flex";
    }

    input.addEventListener("input", render);
    indentSel.addEventListener("change", () => { minified = false; render(); });

    minifyBtn.addEventListener("click", () => {
      minified = !minified;
      minifyBtn.textContent = minified ? "Pretty-print" : "Minify";
      render();
    });

    Bench.wireCopyButton(copyBtn, () => lastFormatted);

    sendABtn.addEventListener("click", () => {
      if(!lastFormatted) return;
      Bench.goToTool("text-compare", { slot: "a", text: lastFormatted, json: true });
    });
    sendBBtn.addEventListener("click", () => {
      if(!lastFormatted) return;
      Bench.goToTool("text-compare", { slot: "b", text: lastFormatted, json: true });
    });
  }
});
