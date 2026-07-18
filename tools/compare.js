// tools/compare.js
Bench.registerTool({
  id: "text-compare",
  section: "text",
  label: "Text Comparison",
  mount(panel){
    panel.innerHTML = `
      <h1 class="tool-title">Text Comparison</h1>
      <p class="tool-desc">Line-level diff with word-level highlighting. Both inputs stay in this tab.</p>

      <div class="field-group">
        <label class="field-label" for="cmp-a">Original</label>
        <textarea id="cmp-a" rows="8" placeholder="Paste original text..."></textarea>
      </div>

      <div class="field-group">
        <label class="field-label" for="cmp-b">Changed</label>
        <textarea id="cmp-b" rows="8" placeholder="Paste changed text..."></textarea>
      </div>

      <div class="cmp-toolbar">
        <button type="button" class="cmp-btn" id="cmp-swap" title="Swap original/changed">⇄ Swap</button>

        <div class="cmp-seg" id="cmp-view-seg">
          <button type="button" class="cmp-seg-btn active" data-view="inline">Inline</button>
          <button type="button" class="cmp-seg-btn" data-view="split">Split</button>
        </div>

        <button type="button" class="cmp-toggle" id="cmp-ignore-ws" data-on="false">Ignore whitespace</button>
        <button type="button" class="cmp-toggle" id="cmp-ignore-case" data-on="false">Ignore case</button>

        <div class="cmp-stats" id="cmp-stats"></div>
      </div>

      <label class="field-label">Diff</label>
      <div class="diff-view" id="cmp-out"></div>
    `;

    const aEl = panel.querySelector("#cmp-a");
    const bEl = panel.querySelector("#cmp-b");
    const outEl = panel.querySelector("#cmp-out");
    const statsEl = panel.querySelector("#cmp-stats");
    const swapBtn = panel.querySelector("#cmp-swap");
    const viewSeg = panel.querySelector("#cmp-view-seg");
    const wsToggle = panel.querySelector("#cmp-ignore-ws");
    const caseToggle = panel.querySelector("#cmp-ignore-case");

    let viewMode = "inline"; // "inline" | "split"

    function tokenize(str){
      return str.match(/\s+|[^\s]+/g) || [];
    }

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

    function diffWords(oldLine, newLine){
      const ta = tokenize(oldLine), tb = tokenize(newLine);
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

      // Pair consecutive del-block + add-block into "mod" rows for word-level highlighting.
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

      return { ops, added, removed };
    }

    function escapeHtml(str){
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function renderWordDiff(oldLine, newLine){
      const wops = diffWords(oldLine, newLine);
      const oldHtml = wops.filter(o => o.type !== "add").map(o =>
        o.type === "del" ? `<span class="diff-del">${escapeHtml(o.text)}</span>` : escapeHtml(o.text)
      ).join("");
      const newHtml = wops.filter(o => o.type !== "del").map(o =>
        o.type === "add" ? `<span class="diff-add">${escapeHtml(o.text)}</span>` : escapeHtml(o.text)
      ).join("");
      return { oldHtml, newHtml };
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
        const { oldHtml, newHtml } = renderWordDiff(op.oldLine, op.newLine);
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
        const { oldHtml, newHtml } = renderWordDiff(op.oldLine, op.newLine);
        return `<div class="diff-split-row">
          <div class="diff-split-cell del"><span class="diff-gutter">${op.oldNum}</span><span class="diff-text">${oldHtml}</span></div>
          <div class="diff-split-cell add"><span class="diff-gutter">${op.newNum}</span><span class="diff-text">${newHtml}</span></div>
        </div>`;
      }).join("") + `</div>`;
    }

    function render(){
      const a = aEl.value, b = bEl.value;
      if(a === "" && b === ""){ outEl.innerHTML = ""; statsEl.textContent = ""; return; }

      const ignoreWs = wsToggle.dataset.on === "true";
      const ignoreCase = caseToggle.dataset.on === "true";

      const { ops, added, removed } = diffLines(a, b, ignoreWs, ignoreCase);

      outEl.innerHTML = viewMode === "split" ? renderSplit(ops) : renderInline(ops);
      statsEl.innerHTML = `<span class="stat-add">+${added}</span><span class="stat-del">-${removed}</span>`;
    }

    aEl.addEventListener("input", render);
    bEl.addEventListener("input", render);

    swapBtn.addEventListener("click", () => {
      const tmp = aEl.value;
      aEl.value = bEl.value;
      bEl.value = tmp;
      render();
    });

    viewSeg.querySelectorAll(".cmp-seg-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        viewSeg.querySelectorAll(".cmp-seg-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        viewMode = btn.dataset.view;
        render();
      });
    });

    [wsToggle, caseToggle].forEach(btn => {
      btn.addEventListener("click", () => {
        const on = btn.dataset.on === "true";
        btn.dataset.on = on ? "false" : "true";
        btn.classList.toggle("active", !on);
        render();
      });
    });
  }
});
