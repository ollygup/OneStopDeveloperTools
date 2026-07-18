// Shared registry. Each tool file (tools/*.js) calls Bench.registerTool(...)
// to add itself under a section. No tool file talks to the network.
window.Bench = (function(){
  const sections = [
    { id: "hashing", label: "Hashing" },
    { id: "jwt",     label: "JWT" },
    { id: "text",    label: "Text Comparison" }
  ];

  const tools = []; // { id, section, label, mount(container) }

  function registerTool(def){
    if(!def.id || !def.section || !def.label || typeof def.mount !== "function"){
      console.error("Invalid tool definition", def);
      return;
    }
    tools.push(def);
  }

  return { sections, tools, registerTool };
})();
