Bench.registerTool({
  id: "jwt-decoder",
  section: "jwt",
  label: "JWT Decoder",
  mount(panel){
    panel.innerHTML = `
      <h1 class="tool-title">JWT Decoder</h1>
      <p class="tool-desc">Decodes header and payload only. This does not verify signatures, so it never needs your signing key.</p>

      <div class="field-group">
        <label class="field-label" for="jwt-input">Token</label>
        <textarea id="jwt-input" rows="4" placeholder="eyJhbGciOi..."></textarea>
      </div>

      <div id="jwt-error"></div>

      <div id="jwt-result" style="display:none">
        <div class="jwt-part">
          <label class="field-label">Header</label>
          <pre id="jwt-header"></pre>
        </div>
        <div class="jwt-part">
          <label class="field-label">Payload</label>
          <pre id="jwt-payload"></pre>
        </div>
        <div class="jwt-part" id="jwt-claims"></div>
      </div>
    `;

    const input = panel.querySelector("#jwt-input");
    const errorEl = panel.querySelector("#jwt-error");
    const resultEl = panel.querySelector("#jwt-result");
    const headerEl = panel.querySelector("#jwt-header");
    const payloadEl = panel.querySelector("#jwt-payload");
    const claimsEl = panel.querySelector("#jwt-claims");

    function base64UrlDecode(segment){
      let b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
      while(b64.length % 4) b64 += "=";
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    }

    function formatTimestamp(claimName, value){
      if(typeof value !== "number") return null;
      const date = new Date(value * 1000);
      const now = new Date();
      const relative = value * 1000 < now.getTime() ? "expired / past" : "in the future";
      return `${claimName}: ${date.toISOString()} (${relative})`;
    }

    function render(){
      const token = input.value.trim();
      errorEl.innerHTML = "";
      resultEl.style.display = "none";
      claimsEl.innerHTML = "";

      if(token === "") return;

      const parts = token.split(".");
      if(parts.length < 2){
        errorEl.innerHTML = `<span class="badge err">Not a JWT</span> expected header.payload[.signature]`;
        return;
      }

      let header, payload;
      try{
        header = JSON.parse(base64UrlDecode(parts[0]));
        payload = JSON.parse(base64UrlDecode(parts[1]));
      } catch(e){
        errorEl.innerHTML = `<span class="badge err">Decode failed</span> ${e.message}`;
        return;
      }

      headerEl.textContent = JSON.stringify(header, null, 2);
      payloadEl.textContent = JSON.stringify(payload, null, 2);

      const claimLines = [];
      ["exp", "iat", "nbf"].forEach(claim => {
        const line = formatTimestamp(claim, payload[claim]);
        if(line) claimLines.push(line);
      });
      if(claimLines.length){
        claimsEl.innerHTML = `<label class="field-label">Timestamps</label><pre>${claimLines.join("\n")}</pre>`;
      }

      if(parts.length < 3 || parts[2] === ""){
        claimsEl.innerHTML += `<span class="badge">No signature present</span>`;
      } else {
        claimsEl.innerHTML += `<span class="badge">Signature not verified — this tool decodes only</span>`;
      }

      resultEl.style.display = "block";
    }

    input.addEventListener("input", render);
  }
});
