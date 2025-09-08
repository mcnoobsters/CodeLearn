(function () {
  const SESSION_KEY = "learnx_admin_session_v1";

  function getQueryFlag(name) {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get(name)) return true;
      const hash = location.hash || "";
      const qIndex = hash.indexOf("?");
      if (qIndex >= 0) {
        const hp = new URLSearchParams(hash.slice(qIndex + 1));
        if (hp.get(name)) return true;
      }
    } catch {}
    return false;
  }

  async function detectPublicIp() {
    try {
      const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
      const data = await res.json();
      return data.ip || null;
    } catch {
      return null;
    }
  }

  async function init() {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      window.Auth = { isAdmin: Boolean(parsed.isAdmin), publicIp: parsed.publicIp || null };
      return;
    }

    const publicIp = await detectPublicIp();
    let isAdmin = false;
    const ips = Array.isArray(window.Config?.ADMIN_IPS) ? window.Config.ADMIN_IPS : [];
    if (publicIp && ips.includes(publicIp)) isAdmin = true;
    else if (window.Config?.ENABLE_QUERY_OVERRIDE && getQueryFlag("admin")) isAdmin = true;

    const session = { isAdmin, publicIp };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.Auth = { isAdmin, publicIp };
  }

  window.Auth = { isAdmin: false, publicIp: null, init };
})();

