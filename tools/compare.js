Bench.registerTool({
  id: "text-compare",
  section: "text",
  label: "Text Comparison",
  mount(panel){
    panel.innerHTML = `
      <h1 class="tool-title">Text Comparison</h1>
      <p class="tool-desc">Word-level diff. Both inputs stay in this tab.</p>

      <div class="field-group">
        <label class="field-label" for="cmp-a">Original</label>
        <textarea id="cmp-a" rows="8" placeholder="Paste original text..."></textarea>
      </div>

      <div class="field-group">
        <label class="field-label" for="cmp-b">Changed</label>
        <textarea id="cmp-b" rows="8" placeholder="Paste changed text..."></textarea>
      </div>

      <label class="field-label">Diff</label>
      <div class="diff-view" id="cmp-out"></div>
    `;

    const aEl = panel.querySelector("#cmp-a");
    const bEl = panel.querySelector("#cmp-b");
    const outEl = panel.querySelector("#cmp-out");

    function tokenize(str){
      return str.match(/\s+|[^\s]+/g) || [];
    }

    function diffTokens(ta, tb){
      const n = ta.length, m = tb.length;
      const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

      for(let i = n - 1; i >= 0; i--){
        for(let j = m - 1; j >= 0; j--){
          dp[i][j] = ta[i] === tb[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
        }
      }

      const ops = [];
      let i = 0, j = 0;
      while(i < n && j < m){
        if(ta[i] === tb[j]){ ops.push({ type: "same", text: tb[j] }); i++; j++; }
        else if(dp[i+1][j] >= dp[i][j+1]){ ops.push({ type: "del", text: ta[i] }); i++; }
        else { ops.push({ type: "add", text: tb[j] }); j++; }
      }
      while(i < n){ ops.push({ type: "del", text: ta[i] }); i++; }
      while(j < m){ ops.push({ type: "add", text: tb[j] }); j++; }
      return ops;
    }

    function escapeHtml(str){
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function render(){
      const a = aEl.value, b = bEl.value;
      if(a === "" && b === ""){ outEl.innerHTML = ""; return; }

      const ops = diffTokens(tokenize(a), tokenize(b));
      outEl.innerHTML = ops.map(op => {
        const text = escapeHtml(op.text);
        if(op.type === "same") return text;
        if(op.type === "add") return `<span class="diff-add">${text}</span>`;
        return `<span class="diff-del">${text}</span>`;
      }).join("");
    }

    aEl.addEventListener("input", render);
    bEl.addEventListener("input", render);
  }
});
