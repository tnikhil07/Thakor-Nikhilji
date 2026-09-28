/* =========================================================
   CUSTOM PORTFOLIO SETTINGS
   Change only this file for small future behaviour changes.
   ========================================================= */

const PORTFOLIO_SETTINGS = {
  hideLeftSidebar: false,
  disableLeftClick: false,
  disableRightClick: false,
  disableF12: false,
  disableDevToolsShortcuts: false,
  disableTextSelection: false
};

(function applyCustomSettings() {
  if (PORTFOLIO_SETTINGS.hideLeftSidebar) {
    const selectors = [".sidebar", ".left-sidebar", ".side-nav", ".left-nav", "aside"];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.style.display = "none");
    });
  }

  if (PORTFOLIO_SETTINGS.disableLeftClick) {
    document.addEventListener("click", function (event) {
      if (event.button === 0) event.preventDefault();
    }, true);
  }

  if (PORTFOLIO_SETTINGS.disableRightClick) {
    document.addEventListener("contextmenu", event => event.preventDefault());
  }

  if (PORTFOLIO_SETTINGS.disableTextSelection) {
    document.documentElement.style.userSelect = "none";
    document.documentElement.style.webkitUserSelect = "none";
  }

  if (PORTFOLIO_SETTINGS.disableF12 || PORTFOLIO_SETTINGS.disableDevToolsShortcuts) {
    document.addEventListener("keydown", function (event) {
      const key = event.key.toLowerCase();

      if (PORTFOLIO_SETTINGS.disableF12 && event.key === "F12") {
        event.preventDefault();
        event.stopPropagation();
      }

      if (PORTFOLIO_SETTINGS.disableDevToolsShortcuts) {
        const blocked =
          (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
          (event.ctrlKey && key === "u");

        if (blocked) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }, true);
  }
})();
