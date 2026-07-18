// tools/compare.js — component + its own scoped CSS
Bench.registerTool({
  id: "text-compare",
  section: "text",
  label: "Text Comparison",
  mount(panel){
    Bench.injectStyle("compare", `
      .cmp-toolbar{
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:8px;
        margin-bottom:18px;
      }
      .cmp-btn, .cmp-toggle{
        border:1px solid var(--border);
        background:var(--panel);
        border-radius:var(--radius-sm);
        font-size:0.79em;
        font-weight:500;
        padding:6px 10px;
        cursor:pointer;
        color:var(--ink-muted);
      }
      .cmp-btn:hover{ color:var(--accent); border-color:var(--accent); }
      .cmp-btn.primary{ background:var(--ink); color:#fff; border-color:var(--ink); }
      .cmp-btn.primary:hover{ opacity:0.9; color:#fff; }
      .cmp-toggle.active{ color:var(--accent); border-color:var(--accent); background:var(--accent-soft); }

      .cmp-seg{ display:flex; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; }
      .cmp-seg-btn{
        border:none;
        background:var(--panel);
        font-size:0.79em;
        font-weight:500;
        padding:6px 12px;
        cursor:pointer;
        color:var(--ink-muted);
      }
      .cmp-seg-btn + .cmp-seg-btn{ border-left:1px solid var(--border); }
      .cmp-seg-btn.active{ background:var(--accent-soft); color:var(--accent); }

      .diff-summary{
        display:flex;
        align-items:center;
        gap:14px;
        flex-wrap:wrap;
        border:1px solid var(--border);
        border-bottom:none;
        border-radius:var(--radius) var(--radius) 0 0;
        background:var(--panel-alt);
        padding:10px 14px;
      }
      .diff-summary-side{ flex:1; display:flex; align-items:center; gap:8px; min-width:180px; }
      .diff-summary-icon{
        flex:none;
        width:18px; height:18px;
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:0.79em; font-weight:700;
      }
      .diff-summary-icon.del{ color:var(--err); background:var(--err-soft); }
      .diff-summary-icon.add{ color:var(--ok); background:var(--ok-soft); }
      .diff-summary-label{ font-size:0.83em; font-weight:600; }
      .diff-summary-spacer{ flex:1; }
      .diff-summary-lines{ font-family:var(--font-mono); font-size:0.77em; color:var(--ink-muted); }
      .diff-swap{
        flex:none;
        border:1px solid var(--border);
        background:var(--panel);
        border-radius:var(--radius-sm);
        width:26px; height:26px;
        cursor:pointer;
        color:var(--ink-muted);
      }
      .diff-swap:hover{ color:var(--accent); border-color:var(--accent); }

      .diff-view{ padding:0; overflow:hidden; overflow-x:auto; border-radius:0 0 var(--radius) var(--radius); width:100%; }

      .diff-row{
        display:flex;
        align-items:flex-start;
        font-family:var(--font-mono);
        font-size:0.9em;
        line-height:1.6;
        white-space:pre-wrap;
        border-bottom:1px solid var(--border);
      }
      .diff-row:last-child{ border-bottom:none; }
      .diff-row.same{ background:var(--panel); }
      .diff-row.del{ background:var(--err-soft); }
      .diff-row.add{ background:var(--ok-soft); }
      .diff-row .diff-gutter{
        flex:none; width:36px; text-align:right; padding:2px 8px;
        color:var(--ink-faint); user-select:none; border-right:1px solid var(--border);
      }
      .diff-row .diff-text{ flex:1; padding:2px 10px; word-break:break-word; }

      .diff-split{ display:flex; flex-direction:column; width:100%; }
      .diff-split-row{ display:flex; width:100%; }
      .diff-split-cell{
        flex:1 1 0; min-width:0; display:flex;
        font-family:var(--font-mono); font-size:0.9em; line-height:1.6;
        white-space:pre-wrap; border-bottom:1px solid var(--border);
      }
      .diff-split-cell:first-child{ border-right:1px solid var(--border); }
      .diff-split-cell.same{ background:var(--panel); }
      .diff-split-cell.del{ background:var(--err-soft); }
      .diff-split-cell.add{ background:var(--ok-soft); }
      .diff-split-cell.empty{ background:var(--panel-alt); }
      .diff-split-cell .diff-gutter{
        flex:none; width:36px; text-align:right; padding:2px 8px;
        color:var(--ink-faint); user-select:none; border-right:1px solid var(--border);
      }
      .diff-split-cell .diff-text{ flex:1; padding:2px 10px; word-break:break-word; }

      /* Darker highlight for the exact changed span within a modified line
         (lighter = whole changed line, darker = exact diff). */
      .diff-split-cell.del .diff-chunk{ background:#ffb3b3; border-radius:2px; }
      .diff-split-cell.add .diff-chunk{ background:#7ee2a8; border-radius:2px; }
      .diff-row.del .diff-chunk{ background:#ffb3b3; border-radius:2px; }
      .diff-row.add .diff-chunk{ background:#7ee2a8; border-radius:2px; }

      @media (max-width: 720px){
        .diff-split-row{ flex-direction:column; }
        .diff-split-cell:first-child{ border-right:none; border-bottom:1px solid var(--border); }
        .diff-summary{ flex-wrap:wrap; }
        .diff-summary-side{ min-width:100%; }
      }
    `);

    panel.innerHTML = `
      <h1 class="tool-title">Text Comparison</h1>
      <p class="tool-desc">Line-level diff with character-level highlighting. Both inputs stay in this tab.</p>

      <div class="field-group">
        <label class="field-label" for="cmp-a">Original</label>
        <textarea id="cmp-a" rows="8" placeholder="Paste original text..."></textarea>
      </div>

      <div class="field-group">
        <label class="field-label" for="cmp-b">Changed</label>
        <textarea id="cmp-b" rows="8" placeholder="Paste changed text..."></textarea>
      </div>

      <div class="cmp-toolbar">
        <button type="button" class="cmp-btn primary" id="cmp-find">Find difference</button>
        <div class="cmp-seg" id="cmp-view-seg">
          <button type="button" class="cmp-seg-btn active" data-view="split">Split</button>
          <button type="button" class="cmp-seg-btn" data-view="inline">Inline</button>
        </div>
        <button type="button" class="cmp-toggle" id="cmp-ignore-ws" data-on="false">Ignore whitespace</button>
        <button type="button" class="cmp-toggle" id="cmp-ignore-case" data-on="false">Ignore case</button>
      </div>

      <div id="cmp-result" style="display:none">
        <div class="diff-summary">
          <div class="diff-summary-side">
            <span class="diff-summary-icon del">−</span>
            <span id="cmp-removals" class="diff-summary-label"></span>
            <span class="diff-summary-spacer"></span>
            <span id="cmp-a-lines" class="diff-summary-lines"></span>
            <button type="button" class="copy-btn" id="cmp-copy-a">Copy</button>
          </div>
          <button type="button" class="diff-swap" id="cmp-swap" title="Swap original/changed">⇄</button>
          <div class="diff-summary-side">
            <span class="diff-summary-icon add">+</span>
            <span id="cmp-additions" class="diff-summary-label"></span>
            <span class="diff-summary-spacer"></span>
            <span id="cmp-b-lines" class="diff-summary-lines"></span>
            <button type="button" class="copy-btn" id="cmp-copy-b">Copy</button>
          </div>
        </div>
        <div class="diff-view" id="cmp-out"></div>
      </div>
    `;

    const aEl = panel.querySelector("#cmp-a");
    const bEl = panel.querySelector("#cmp-b");
    const findBtn = panel.querySelector("#cmp-find");
    const resultEl = panel.querySelector("#cmp-result");
    const outEl = panel.querySelector("#cmp-out");
    const removalsEl = panel.querySelector("#cmp-removals");
    const additionsEl = panel.querySelector("#cmp-additions");
    const aLinesEl = panel.querySelector("#cmp-a-lines");
    const bLinesEl = panel.querySelector("#cmp-b-lines");
    const swapBtn = panel.querySelector("#cmp-swap");
    const viewSeg = panel.querySelector("#cmp-view-seg");
    const wsToggle = panel.querySelector("#cmp-ignore-ws");
    const caseToggle = panel.querySelector("#cmp-ignore-case");
    const copyABtn = panel.querySelector("#cmp-copy-a");
    const copyBBtn = panel.querySelector("#cmp-copy-b");

    let viewMode = "split"; // "split" | "inline"

    function lcsOps(a, b, keyOf){
      const n = a.length, m = b.length;
      const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
      for(let i = n - 1; i >= 0; i--){
        for(let j = m - 1; j >= 0; j--){
          dp[i][j] = keyOf(a[i]) === keyOf(b[j]) ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
        }
      }
      const ops = [];
      let i = 0, j = 0;
      while(i < n && j < m){
        if(keyOf(a[i]) === keyOf(b[j])){ ops.push({ type: "same", a: a[i], b: b[j] }); i++; j++; }
        else if(dp[i+1][j] >= dp[i][j+1]){ ops.push({ type: "del", a: a[i] }); i++; }
        else { ops.push({ type: "add", b: b[j] }); j++; }
      }
      while(i < n){ ops.push({ type: "del", a: a[i] }); i++; }
      while(j < m){ ops.push({ type: "add", b: b[j] }); j++; }
      return ops;
    }

    function diffChars(oldLine, newLine){
      const ta = Array.from(oldLine), tb = Array.from(newLine);
      return lcsOps(ta, tb, s => s).map(op =>
        op.type === "same" ? { type: "same", text: op.a }
        : op.type === "del" ? { type: "del", text: op.a }
        : { type: "add", text: op.b }
      );
    }

    function lineKey(line, ignoreWs, ignoreCase){
      let k = line;
      if(ignoreWs) k = k.trim().replace(/\s+/g, " ");
      if(ignoreCase) k = k.toLowerCase();
      return k;
    }

    function diffLines(oldText, newText, ignoreWs, ignoreCase){
      const oldLines = oldText.split("\n");
      const newLines = newText.split("\n");
      const keyOf = obj => obj.__key;

      const oldWrapped = oldLines.map(l => ({ line: l, __key: lineKey(l, ignoreWs, ignoreCase) }));
      const newWrapped = newLines.map(l => ({ line: l, __key: lineKey(l, ignoreWs, ignoreCase) }));

      const rawOps = lcsOps(oldWrapped, newWrapped, keyOf).map(op =>
        op.type === "same" ? { type: "same", oldLine: op.a.line, newLine: op.b.line }
        : op.type === "del" ? { type: "del", oldLine: op.a.line }
        : { type: "add", newLine: op.b.line }
      );

      const ops = [];
      let i = 0;
      while(i < rawOps.length){
        const op = rawOps[i];
        if(op.type === "del"){
          let dEnd = i;
          while(dEnd < rawOps.length && rawOps[dEnd].type === "del") dEnd++;
          let aEnd = dEnd;
          while(aEnd < rawOps.length && rawOps[aEnd].type === "add") aEnd++;
          const dels = rawOps.slice(i, dEnd);
          const adds = rawOps.slice(dEnd, aEnd);
          const pairCount = Math.min(dels.length, adds.length);
          for(let p = 0; p < pairCount; p++){
            ops.push({ type: "mod", oldLine: dels[p].oldLine, newLine: adds[p].newLine });
          }
          for(let p = pairCount; p < dels.length; p++) ops.push({ type: "del", oldLine: dels[p].oldLine });
          for(let p = pairCount; p < adds.length; p++) ops.push({ type: "add", newLine: adds[p].newLine });
          i = aEnd;
        } else {
          ops.push(op);
          i++;
        }
      }

      let oldNum = 0, newNum = 0, added = 0, removed = 0;
      ops.forEach(op => {
        if(op.type === "same"){ oldNum++; newNum++; op.oldNum = oldNum; op.newNum = newNum; }
        else if(op.type === "del"){ oldNum++; op.oldNum = oldNum; removed++; }
        else if(op.type === "add"){ newNum++; op.newNum = newNum; added++; }
        else if(op.type === "mod"){ oldNum++; newNum++; op.oldNum = oldNum; op.newNum = newNum; added++; removed++; }
      });

      return { ops, added, removed, oldTotal: oldNum, newTotal: newNum };
    }

    function escapeHtml(str){
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function renderCharDiff(oldLine, newLine){
      const cops = diffChars(oldLine, newLine);
      const oldHtml = cops.filter(o => o.type !== "add").map(o =>
        o.type === "del" ? `<span class="diff-chunk">${escapeHtml(o.text)}</span>` : escapeHtml(o.text)
      ).join("");
      const newHtml = cops.filter(o => o.type !== "del").map(o =>
        o.type === "add" ? `<span class="diff-chunk">${escapeHtml(o.text)}</span>` : escapeHtml(o.text)
      ).join("");
      return { oldHtml, newHtml };
    }

    function renderSplit(ops){
      return `<div class="diff-split">` + ops.map(op => {
        if(op.type === "same"){
          return `<div class="diff-split-row">
            <div class="diff-split-cell same"><span class="diff-gutter">${op.oldNum}</span><span class="diff-text">${escapeHtml(op.oldLine)}</span></div>
            <div class="diff-split-cell same"><span class="diff-gutter">${op.newNum}</span><span class="diff-text">${escapeHtml(op.newLine)}</span></div>
          </div>`;
        }
        if(op.type === "del"){
          return `<div class="diff-split-row">
            <div class="diff-split-cell del"><span class="diff-gutter">${op.oldNum}</span><span class="diff-text">${escapeHtml(op.oldLine)}</span></div>
            <div class="diff-split-cell empty"></div>
          </div>`;
        }
        if(op.type === "add"){
          return `<div class="diff-split-row">
            <div class="diff-split-cell empty"></div>
            <div class="diff-split-cell add"><span class="diff-gutter">${op.newNum}</span><span class="diff-text">${escapeHtml(op.newLine)}</span></div>
          </div>`;
        }
        const { oldHtml, newHtml } = renderCharDiff(op.oldLine, op.newLine);
        return `<div class="diff-split-row">
          <div class="diff-split-cell del"><span class="diff-gutter">${op.oldNum}</span><span class="diff-text">${oldHtml}</span></div>
          <div class="diff-split-cell add"><span class="diff-gutter">${op.newNum}</span><span class="diff-text">${newHtml}</span></div>
        </div>`;
      }).join("") + `</div>`;
    }

    function renderInline(ops){
      return ops.map(op => {
        if(op.type === "same"){
          return `<div class="diff-row same">
            <span class="diff-gutter">${op.oldNum}</span><span class="diff-gutter">${op.newNum}</span>
            <span class="diff-text">${escapeHtml(op.oldLine)}</span>
          </div>`;
        }
        if(op.type === "del"){
          return `<div class="diff-row del">
            <span class="diff-gutter">${op.oldNum}</span><span class="diff-gutter"></span>
            <span class="diff-text">${escapeHtml(op.oldLine)}</span>
          </div>`;
        }
        if(op.type === "add"){
          return `<div class="diff-row add">
            <span class="diff-gutter"></span><span class="diff-gutter">${op.newNum}</span>
            <span class="diff-text">${escapeHtml(op.newLine)}</span>
          </div>`;
        }
        const { oldHtml, newHtml } = renderCharDiff(op.oldLine, op.newLine);
        return `<div class="diff-row del">
            <span class="diff-gutter">${op.oldNum}</span><span class="diff-gutter"></span>
            <span class="diff-text">${oldHtml}</span>
          </div>
          <div class="diff-row add">
            <span class="diff-gutter"></span><span class="diff-gutter">${op.newNum}</span>
            <span class="diff-text">${newHtml}</span>
          </div>`;
      }).join("");
    }

    function run(){
      const a = aEl.value, b = bEl.value;
      if(a === "" && b === ""){ resultEl.style.display = "none"; return; }

      const ignoreWs = wsToggle.dataset.on === "true";
      const ignoreCase = caseToggle.dataset.on === "true";

      const { ops, added, removed, oldTotal, newTotal } = diffLines(a, b, ignoreWs, ignoreCase);

      removalsEl.textContent = `${removed} removal${removed === 1 ? "" : "s"}`;
      additionsEl.textContent = `${added} addition${added === 1 ? "" : "s"}`;
      aLinesEl.textContent = `${oldTotal} lines`;
      bLinesEl.textContent = `${newTotal} lines`;

      outEl.innerHTML = viewMode === "split" ? renderSplit(ops) : renderInline(ops);
      resultEl.style.display = "block";
    }

    findBtn.addEventListener("click", run);

    swapBtn.addEventListener("click", () => {
      const tmp = aEl.value;
      aEl.value = bEl.value;
      bEl.value = tmp;
      run();
    });

    viewSeg.querySelectorAll(".cmp-seg-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        viewSeg.querySelectorAll(".cmp-seg-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        viewMode = btn.dataset.view;
        if(resultEl.style.display !== "none") run();
      });
    });

    [wsToggle, caseToggle].forEach(btn => {
      btn.addEventListener("click", () => {
        const on = btn.dataset.on === "true";
        btn.dataset.on = on ? "false" : "true";
        btn.classList.toggle("active", !on);
        if(resultEl.style.display !== "none") run();
      });
    });

    Bench.wireCopyButton(copyABtn, () => aEl.value);
    Bench.wireCopyButton(copyBBtn, () => bEl.value);
  }
});
