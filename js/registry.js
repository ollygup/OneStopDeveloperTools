// js/registry.js — shared registry + a tiny helper so each tool can ship
// its own CSS from its own file (only injected once, on first mount).
window.Bench = (function(){
  const sections = [
    { id: "hashing", label: "Hashing" },
    { id: "jwt",     label: "JWT" },
    { id: "text",    label: "Text Comparison" }
  ];

  const tools = []; // { id, section, label, mount(container) }
  const injectedStyles = new Set();

  function registerTool(def){
    if(!def.id || !def.section || !def.label || typeof def.mount !== "function"){
      console.error("Invalid tool definition", def);
      return;
    }
    tools.push(def);
  }

  // Injects a tool's own <style> block into <head> exactly once, so each
  // tool's CSS travels with its own file instead of living in style.css.
  function injectStyle(id, cssText){
    if(injectedStyles.has(id)) return;
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-tool-style", id);
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
    injectedStyles.add(id);
  }

  return { sections, tools, registerTool, injectStyle };
})();
