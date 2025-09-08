(function () {
  const routes = [];

  function addRoute(pattern, handler) {
    routes.push({ pattern, handler });
  }

  function parseHash() {
    const hash = location.hash.replace(/^#/, "");
    const parts = hash.split("/").filter(Boolean);
    return parts;
  }

  function matchRoute() {
    const parts = parseHash();
    for (const r of routes) {
      const res = r.pattern(parts);
      if (res.matched) {
        return { handler: r.handler, params: res.params };
      }
    }
    return null;
  }

  function navigateTo(hash) {
    if (location.hash === hash) {
      onChange();
    } else {
      location.hash = hash;
    }
  }

  function onChange() {
    const match = matchRoute();
    if (match) {
      match.handler(match.params);
    } else {
      navigateTo("#/");
    }
  }

  window.addEventListener("hashchange", onChange);

  window.Router = { addRoute, navigateTo, onChange };
})();

