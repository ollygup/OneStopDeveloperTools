// js/registry.js — shared registry + a tiny helper so each tool can ship
// its own CSS from its own file (only injected once, on first mount).
window.Toolbox = (function(){
  const sections = [
    { id: "hashing", label: "Hashing" },
    { id: "json",    label: "JSON" },
    { id: "jwt",     label: "JWT" },
    { id: "text",    label: "Text Comparison" }
  ];

  const tools = []; // { id, section, label, mount(container) }
  const injectedStyles = new Set();
  const bus = new EventTarget();

  function registerTool(def){
    if(!def.id || !def.section || !def.label || typeof def.mount !== "function"){
      console.error("Invalid tool definition", def);
      return;
    }
    tools.push(def);
  }

  function injectStyle(id, cssText){
    if(injectedStyles.has(id)) return;
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-tool-style", id);
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
    injectedStyles.add(id);
  }

  // Minimal pub/sub so tools can hand data to one another
  // (e.g. JSON Formatter → Text Comparison) without coupling.
  function emit(name, detail){ bus.dispatchEvent(new CustomEvent(name, { detail })); }
  function on(name, handler){ bus.addEventListener(name, e => handler(e.detail)); }

  return { sections, tools, registerTool, injectStyle, emit, on };
})();
