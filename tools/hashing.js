// tools/hashing.js — component + its own scoped CSS
Toolbox.registerTool({
  id: "hashing",
  section: "hashing",
  label: "Hash Generator",
  mount(panel){
    Toolbox.injectStyle("hashing", `
      .output-row{
        display:flex;
        align-items:center;
        gap:8px;
        background:var(--panel-alt);
        border:1px solid var(--border);
        border-radius:var(--radius);
        padding:9px 12px;
        margin-bottom:8px;
        flex-wrap:wrap;
      }
      .output-label{ flex:none; width:82px; font-family:var(--font-mono); font-size:0.82em; color:var(--ink-muted); }
      .output-value{ flex:1; min-width:0; font-family:var(--font-mono); font-size:0.9em; word-break:break-all; }

      @media (max-width: 380px){
        .output-row .copy-btn{ margin-left:auto; }
      }
    `);

    panel.innerHTML = `
      <h1 class="tool-title">Hash Generator</h1>
      <p class="tool-desc">Use with care, dont break this html.</p>

      <div class="field-group">
        <label class="field-label" for="hash-input">Input</label>
        <textarea id="hash-input" rows="6" placeholder="Paste text here..."></textarea>
      </div>

      <div id="hash-outputs"></div>
    `;

    const input = panel.querySelector("#hash-input");
    const outputsEl = panel.querySelector("#hash-outputs");

    const algorithms = [
      { label: "MD5",     kind: "md5" },
      { label: "SHA-1",   kind: "SHA-1" },
      { label: "SHA-256", kind: "SHA-256" },
      { label: "SHA-384", kind: "SHA-384" },
      { label: "SHA-512", kind: "SHA-512" }
    ];

    algorithms.forEach(algo => {
      const row = document.createElement("div");
      row.className = "output-row";
      row.innerHTML = `
        <span class="output-label">${algo.label}</span>
        <span class="output-value" data-algo="${algo.kind}"></span>
        <button type="button" class="copy-btn" data-algo-copy="${algo.kind}">Copy</button>
      `;
      outputsEl.appendChild(row);
    });

    async function sha(kind, text){
      const bytes = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest(kind, bytes);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    }

    async function recompute(){
      const text = input.value;
      for(const algo of algorithms){
        const valueEl = outputsEl.querySelector(`[data-algo="${algo.kind}"]`);
        if(text === ""){ valueEl.textContent = ""; continue; }
        valueEl.textContent = algo.kind === "md5" ? window.md5(text) : await sha(algo.kind, text);
      }
    }

    input.addEventListener("input", recompute);

    outputsEl.querySelectorAll("[data-algo-copy]").forEach(btn => {
      Toolbox.wireCopyButton(btn, () => {
        const kind = btn.getAttribute("data-algo-copy");
        return outputsEl.querySelector(`[data-algo="${kind}"]`).textContent;
      });
    });
  }
});
