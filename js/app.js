(function(){
  const accordionEl = document.getElementById("accordion");
  const contentEl = document.getElementById("content");
  const emptyStateEl = document.getElementById("empty-state");
  const sidebarEl = document.getElementById("sidebar");
  const backdropEl = document.getElementById("backdrop");
  const menuToggleEl = document.getElementById("menu-toggle");

  const mountedPanels = {}; // toolId -> panel element (kept alive so in-session input survives switching)
  let activeToolId = null;

  function buildSidebar(){
    Toolbox.sections.forEach(section => {
      const sectionTools = Toolbox.tools.filter(t => t.section === section.id);
      if(sectionTools.length === 0) return;

      const sectionEl = document.createElement("div");
      sectionEl.className = "acc-section";

      const header = document.createElement("button");
      header.className = "acc-header";
      header.type = "button";
      header.innerHTML = `<span>${section.label}</span><span class="chevron" aria-hidden="true"></span>`;
      header.addEventListener("click", () => {
        const isOpen = sectionEl.classList.contains("open");
        accordionEl.querySelectorAll(".acc-section.open").forEach(el => {
          if(el !== sectionEl) el.classList.remove("open");
        });
        sectionEl.classList.toggle("open", !isOpen);
      });

      const body = document.createElement("div");
      body.className = "acc-body";

      sectionTools.forEach(tool => {
        const link = document.createElement("button");
        link.type = "button";
        link.className = "tool-link";
        link.textContent = tool.label;
        link.dataset.toolId = tool.id;
        link.addEventListener("click", () => selectTool(tool.id));
        body.appendChild(link);
      });

      sectionEl.appendChild(header);
      sectionEl.appendChild(body);
      accordionEl.appendChild(sectionEl);
    });

    // Open the first section with tools by default.
    const firstOpen = accordionEl.querySelector(".acc-section");
    if(firstOpen) firstOpen.classList.add("open");
  }

  function selectTool(toolId){
    if(activeToolId !== toolId){
      if(emptyStateEl) emptyStateEl.style.display = "none";

      // Deactivate current panel + nav link.
      if(activeToolId && mountedPanels[activeToolId]){
        mountedPanels[activeToolId].classList.remove("active");
      }
      document.querySelectorAll(".tool-link.active").forEach(el => el.classList.remove("active"));

      // Mount lazily on first visit.
      if(!mountedPanels[toolId]){
        const tool = Toolbox.tools.find(t => t.id === toolId);
        if(!tool) return;

        const panel = document.createElement("div");
        panel.className = "tool-panel";
        panel.id = `panel-${toolId}`;
        contentEl.appendChild(panel);
        tool.mount(panel);
        mountedPanels[toolId] = panel;
      }

      mountedPanels[toolId].classList.add("active");
      const link = document.querySelector(`.tool-link[data-tool-id="${toolId}"]`);
      if(link) link.classList.add("active");

      activeToolId = toolId;
    }

    closeMobileNav();
  }

  // ---------- Mobile off-canvas nav (needed: sidebar is off-canvas below 720px) ----------
  function openMobileNav(){
    sidebarEl.classList.add("open");
    backdropEl.classList.add("show");
    menuToggleEl.setAttribute("aria-expanded", "true");
  }
  function closeMobileNav(){
    sidebarEl.classList.remove("open");
    backdropEl.classList.remove("show");
    menuToggleEl.setAttribute("aria-expanded", "false");
  }
  function toggleMobileNav(){
    sidebarEl.classList.contains("open") ? closeMobileNav() : openMobileNav();
  }

  if(menuToggleEl){
    menuToggleEl.addEventListener("click", toggleMobileNav);
    backdropEl.addEventListener("click", closeMobileNav);
    document.addEventListener("keydown", e => {
      if(e.key === "Escape") closeMobileNav();
    });
  }

  // Small shared helper other tool files can use for copy-to-clipboard buttons.
  Toolbox.wireCopyButton = function(button, getText){
    button.addEventListener("click", () => {
      const text = getText();
      navigator.clipboard.writeText(text).then(() => {
        button.textContent = "Copied";
        button.classList.add("copied");
        setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("copied");
        }, 1200);
      });
    });
  };

  Toolbox.goToTool = function(toolId, payload){
    selectTool(toolId);
    if(payload !== undefined) Toolbox.emit("tool:data:" + toolId, payload);
  };
  
  document.addEventListener("DOMContentLoaded", buildSidebar);
})();
