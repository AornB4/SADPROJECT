/* ===== Router, shell (sidebar/header), global event handling ===== */
/* Page access: "all" = any signed-in user, "mgr" = Manager only,
   otherwise an inventory operation a Manager can assign to an Employee. */
const ROUTE_RULE = {
  dashboard: "all",
  products: "all",
  inventory: "all",
  movements: "all",
  pos: "all",
  receipt: "all",
  account: "all",
  deliveries: "deliveries",
  "delivery-new": "deliveries",
  spoilage: "spoilage",
  suppliers: "mgr",
  reports: "mgr",
  categories: "mgr",
  archives: "mgr",
  settings: "mgr",
  users: "mgr",
  audit: "mgr",
};
const NAV = [
  {
    label: "Overview",
    items: [["dashboard", "Dashboard", "grid-1x2"]],
  },
  {
    label: "Operations",
    items: [
      ["products", "Products", "box-seam"],
      {
        key: "inv",
        label: "Inventory",
        icon: "clipboard-data",
        kids: [
          ["inventory", "Stock Monitoring"],
          ["deliveries", "Deliveries"],
          ["spoilage", "Adjustments & Returns"],
          ["movements", "Stock Movements"],
        ],
      },
      ["pos", "Sales / POS", "cart3"],
    ],
  },
  {
    label: "Management",
    items: [
      ["suppliers", "Suppliers", "truck"],
      ["reports", "Reports", "file-earmark-bar-graph"],
    ],
  },
  {
    label: "Administration",
    items: [
      {
        key: "adm",
        label: "Administration",
        icon: "shield-check",
        kids: [
          ["users", "User Accounts"],
          ["audit", "Audit Logs"],
        ],
      },
      {
        key: "set",
        label: "Settings",
        icon: "gear",
        kids: [
          ["categories", "Categories"],
          ["settings", "Alert Settings"],
          ["archives", "Archives"],
          ["account", "My Account"],
        ],
      },
    ],
  },
];
const RK = {
  inventory: "inv",
  products: "prod",
  categories: "cat",
  archives: "arc",
  suppliers: "sup",
  pos: "pos",
  movements: "mov",
  spoilage: "spo",
  reports: "rep",
  users: "usr",
  audit: "aud",
  deliveries: "del",
};
Object.assign(DEF, {
  inv: { q: "", cat: "", show: "" },
  prod: { q: "", cat: "", type: "", status: "active" },
  cat: { q: "", status: "all" },
  arc: {},
  sup: { q: "", status: "all" },
  pos: { q: "", cat: "", tab: "sale" },
  mov: { from: "", to: "", pid: "", type: "" },
  spo: { kind: "" },
  rep: { type: "inventory", from: off(-30), to: off(0), cat: "", q: "" },
  usr: { q: "", role: "", status: "all" },
  aud: { from: "", to: "", user: "", type: "", q: "" },
  del: { q: "" },
});
Object.keys(DEF).forEach((k) => {
  F[k] = { ...DEF[k] };
  P[k] = 1;
});
const AUTH = ["login"];
let ROUTE = "";
const allowed = (r) => {
  const rule = ROUTE_RULE[r];
  if (!S.user || !rule) return false;
  if (rule === "all") return true;
  if (rule === "mgr") return isMgr();
  return hasOp(rule);
};
const navSections = () =>
  NAV.map((sec) => ({
    label: sec.label,
    items: sec.items
      .map((n) =>
        n.kids
          ? { ...n, kids: n.kids.filter((k) => allowed(k[0])) }
          : allowed(n[0])
            ? n
            : null,
      )
      .filter((n) => n && (!n.kids || n.kids.length)),
  })).filter((sec) => sec.items.length);
const activeId = (r) =>
  r === "delivery-new" ? "deliveries" : r === "receipt" ? "pos" : r;
function parse() {
  const h = location.hash.replace(/^#\/?/, "");
  const [p, q] = h.split("?");
  const s = p.split("/");
  return {
    name: s[0],
    arg: s[1],
    q: Object.fromEntries(new URLSearchParams(q || "")),
  };
}
const alerts = () => {
  const ps = S.products.filter((p) => p.active);
  return {
    low: ps.filter((p) => level(p) === "low").length,
    out: ps.filter((p) => level(p) === "out").length,
    soon: S.batches.filter(
      (b) => b.qty > 0 && b.exp && expState(b.exp) === "soon",
    ).length,
    exp: S.batches.filter(
      (b) => b.qty > 0 && b.exp && expState(b.exp) === "expired",
    ).length,
  };
};
const navBadge = (route) => {
  const al = alerts();
  if (route === "inventory") return { n: al.low + al.out, cls: "danger" };
  return { n: 0, cls: "" };
};
const badgeHtml = (route) => {
  const b = navBadge(route);
  return b.n ? `<span class="nv-badge ${b.cls}">${b.n}</span>` : "";
};
const subLink = (k, act) => {
  const cur = act === k[0];
  return `<a class="nv ${cur ? "active" : ""}" href="#/${k[0]}" ${
    cur ? 'aria-current="page"' : ""
  } data-tip="${esc(k[1])}"><span class="lbl">${esc(k[1])}</span>${badgeHtml(
    k[0],
  )}</a>`;
};
function navHtml(r) {
  const act = activeId(r);
  return navSections()
    .map((sec) => {
      const items = sec.items
        .map((n) => {
          if (n.kids) {
            const kidActive = n.kids.some((k) => k[0] === act);
            const open = (S.open && S.open[n.key]) || kidActive;
            return `<div class="grp ${open ? "open" : ""}${
              kidActive ? " grp-active" : ""
            }"><button class="nv" data-act="grp" data-a="${
              n.key
            }" aria-expanded="${open}" data-tip="${esc(n.label)}"><i class="bi bi-${
              n.icon
            } nv-ic"></i><span class="lbl">${esc(
              n.label,
            )}</span><i class="bi bi-chevron-down chev"></i></button><div class="sub">${n.kids
              .map((k) => subLink(k, act))
              .join("")}</div></div>`;
          }
          const cur = act === n[0];
          return `<a class="nv ${cur ? "active" : ""}" href="#/${n[0]}" ${
            cur ? 'aria-current="page"' : ""
          } data-tip="${esc(n[1])}"><i class="bi bi-${n[2]} nv-ic"></i><span class="lbl">${esc(
            n[1],
          )}</span>${badgeHtml(n[0])}</a>`;
        })
        .join("");
      return `<div class="sb-sec"><div class="sb-section">${esc(
        sec.label,
      )}</div>${items}</div>`;
    })
    .join("");
}
function shell() {
  const r = ROUTE,
    u = S.user;
  const nav = navHtml(r);
  const expanded =
    innerWidth >= 992
      ? !document.body.classList.contains("sb-collapsed")
      : document.body.classList.contains("sb-open");
  const toggleLabel =
    innerWidth >= 992
      ? expanded
        ? "Collapse navigation"
        : "Expand navigation"
      : expanded
        ? "Close navigation"
        : "Open navigation";
  const all = buildNotifications();
  const unread = all.filter((n) => !notifIsRead(n.id)).length;
  const bell = `<button class="btn topbar-icon position-relative ${
    unread ? "has-alerts" : ""
  }" id="notifBell" data-act="notifOpen" aria-haspopup="dialog" aria-expanded="false" aria-label="Notifications, ${
    unread
  } item${unread === 1 ? "" : "s"} need attention"><i class="bi bi-bell"></i></button>`;
  return `<aside class="sidebar${u.role === "Manager" ? " manager" : ""}" aria-label="Main navigation"><div class="sb-brand">${brandLogo(
    "brand-logo",
  )}<div class="sb-brand-text"><b>Sta. Monica of Bustos</b><small>Multipurpose Cooperative</small></div></div>
  <div class="sb-controls"><span class="sb-controls-label lbl">Menu</span><button class="btn sb-control-btn sb-menu-toggle" data-act="drawer" aria-label="${toggleLabel}" aria-expanded="${expanded}"><i class="bi bi-list sb-toggle-ic sb-ic-menu"></i><i class="bi bi-chevron-double-right sb-toggle-ic sb-ic-expand"></i><i class="bi bi-x-lg sb-toggle-ic sb-ic-close"></i></button></div>
  <nav class="sb-nav">${nav}</nav>
  <div class="sb-user dropup" data-bs-display="static"><button class="nv" data-bs-toggle="dropdown" data-bs-display="static" aria-label="Account menu"><span class="avatar">${u.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join(
      "",
    )}</span><span class="uinfo lbl"><b class="d-block">${esc(u.name)}</b><small>${
      ROLE_LABEL[u.role]
    }</small></span></button>
  <ul class="dropdown-menu"><li><a class="dropdown-item" href="#/account">My Account</a></li><li><button class="dropdown-item" data-act="logout">Log out</button></li></ul></div></aside>
  <div class="sb-backdrop" data-act="drawer"></div>
  <button class="btn sb-control-btn mobile-nav-toggle" data-act="drawer" aria-label="${toggleLabel}" aria-expanded="${expanded}"><i class="bi bi-list sb-toggle-ic sb-ic-menu"></i><i class="bi bi-x-lg sb-toggle-ic sb-ic-close"></i></button>
  <div class="main">
  <header class="topbar no-print">${crumbsHtml(r)}<div class="topbar-right"><span class="topbar-date d-none d-md-inline">${dfmt(
    off(0),
  )}</span>${bell}</div></header>
  <main class="content" id="view" tabindex="-1"></main></div>`;
}
function render() {
  const r = parse();
  if (!r.name) {
    location.hash = S.user ? "#/dashboard" : "#/login";
    return;
  }
  if (!AUTH.includes(r.name) && !S.user) {
    location.hash = "#/login";
    return;
  }
  ROUTE = r.name;
  document.body.classList.remove("sb-open");
  if (AUTH.includes(r.name)) {
    $("#app").innerHTML = Auth[r.name]();
    return;
  }
  const k = RK[r.name];
  if (k) {
    F[k] = { ...DEF[k], ...r.q };
    P[k] = 1;
  }
  $("#app").innerHTML = shell();
  $("#view").innerHTML = !V[r.name]
    ? '<div class="alert alert-warning">Page not found.</div>'
    : allowed(r.name)
      ? V[r.name](r)
      : `<div class="card p-4 text-center"><i class="bi bi-shield-lock fs-1"></i><h1>No access</h1><p>Your account (${ROLE_LABEL[S.user.role]}) is not allowed to open this page.</p><a class="btn btn-primary mx-auto" href="#/dashboard">Back to Dashboard</a></div>`;
  payUpd();
  window.scrollTo(0, 0);
}
const refresh = () => {
  $("#view").innerHTML = V[ROUTE](parse());
  payUpd();
};
window.addEventListener("hashchange", render);
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  if (t.tagName === "A" && t.getAttribute("href") === "#") e.preventDefault();
  const f = A[t.dataset.act];
  f && f(t.dataset.a, t.dataset.b, t, e);
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "pcat" && $("#pt")) {
    const c = catOf(t.value);
    $("#pt").value = c ? c.type : "";
  }
  if (t.dataset.nf) {
    notifQuery = t.value;
    renderNotif();
  }
  if (t.dataset.f) {
    const [k, f] = t.dataset.f.split(".");
    F[k][f] = t.value;
    P[k] = 1;
    if ($("#res")) $("#res").innerHTML = RES[k]();
  }
  if (t.dataset.dl) {
    S.dl[t.dataset.dl] = t.value;
    if (t.dataset.dl === "sup" && ROUTE === "delivery-new")
      $("#view").innerHTML = V["delivery-new"]();
  }
  if (t.dataset.dll) {
    const [i, k] = t.dataset.dll.split("."),
      l = S.dl.lines[i];
    l[k] = t.value;
    if (k === "pid") {
      const p = prod(t.value);
      l.cost = p ? p.cost : "";
      l.exp = "";
      $("#lines").innerHTML = dlLines();
    } else dlTotal();
  }
  if (t.id === "tender") {
    S.tender = t.value;
    payUpd();
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.archiveFilter) {
    S.archiveType = t.value;
    S.archiveSel = [];
    if ($("#archiveRes")) $("#archiveRes").innerHTML = archiveTable(t.value);
  }
});
document.addEventListener("submit", (e) => {
  const f = e.target.dataset.form;
  if (f) {
    e.preventDefault();
    A[f](e);
  }
});
A.page = (k, n) => {
  P[k] = +n;
  $("#res").innerHTML = RES[k]();
};
A.grp = (k, _, t) => {
  const g = t.closest(".grp");
  const wasCollapsed = document.body.classList.contains("sb-collapsed");
  if (wasCollapsed) {
    /* expanding from the rail: restore the full sidebar and reveal the group */
    document.body.classList.remove("sb-collapsed");
    g.classList.add("open");
    syncDrawerState();
  } else {
    g.classList.toggle("open");
  }
  S.open = S.open || {};
  S.open[k] = g.classList.contains("open");
  g.querySelector(".nv").setAttribute("aria-expanded", String(S.open[k]));
};
function syncDrawerState() {
  const mobile = innerWidth < 992;
  const expanded = mobile
    ? document.body.classList.contains("sb-open")
    : !document.body.classList.contains("sb-collapsed");
  const label = mobile
    ? expanded
      ? "Close navigation"
      : "Open navigation"
    : expanded
      ? "Collapse navigation"
      : "Expand navigation";
  $$(".sb-menu-toggle, .mobile-nav-toggle").forEach((button) => {
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute("aria-label", label);
  });
}
A.drawer = () => {
  if (innerWidth < 992) document.body.classList.toggle("sb-open");
  else document.body.classList.toggle("sb-collapsed");
  syncDrawerState();
  const tip = $("#sbTip");
  if (tip) tip.classList.remove("show");
};
window.addEventListener("resize", () => {
  syncDrawerState();
  const tip = $("#sbTip");
  if (tip) tip.classList.remove("show");
});
A.logout = () =>
  confirmBox(
    "Log out?",
    "Are you sure you want to log out?",
    () => {
      logAudit("Logout", "Logged out");
      S.user = null;
      S.cart = [];
      S.tender = "";
      location.hash = "#/login";
      toast("You have been logged out.", "info");
    },
    "Log out",
  );
/* ===== Notification panel (Facebook-style dropdown under the bell) ===== */
let notifFilter = "all";
let notifQuery = "";
const NOTIF_TABS = [
  { k: "all", label: "All" },
  { k: "unread", label: "Unread" },
  { k: "stock", label: "Stock" },
  { k: "expiry", label: "Expiry" },
];
function notifFiltered(all) {
  const q = notifQuery.trim().toLowerCase();
  return all.filter((n) => {
    if (notifFilter === "stock" && n.cat !== "stock") return false;
    if (notifFilter === "expiry" && n.cat !== "expiry") return false;
    if (notifFilter === "unread" && notifIsRead(n.id)) return false;
    if (q) {
      const hay = (n.title + " " + n.desc + " " + n.chips.join(" ")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
const notifItem = (n) => {
  const sev = NOTIF_SEV[n.sev];
  const unread = !notifIsRead(n.id);
  return `<li class="nf-item sev-${n.sev}${unread ? " unread" : ""}" data-act="notifItem" data-a="${n.id}">
  <span class="nf-avatar"><i class="bi bi-${sev.icon}" aria-hidden="true"></i></span>
  <div class="nf-body">
    <div class="nf-line"><span class="nf-text">${esc(n.title)}</span><span class="nf-time">${esc(n.time)}</span></div>
    <div class="nf-sub">${esc(n.desc)}</div>
    <div class="nf-foot-row">${n.chips
      .map((c) => `<span class="nf-chip">${esc(c)}</span>`)
      .join("")}<a class="nf-link" href="${n.route}" data-act="notifItem" data-a="${
      n.id
    }" data-b="1">${esc(n.action)} <i class="bi bi-chevron-right" aria-hidden="true"></i></a></div>
  </div>
</li>`;
};
function renderNotif() {
  const all = buildNotifications();
  const list = notifFiltered(all);
  const unread = all.filter((n) => !notifIsRead(n.id)).length;
  const counts = {
    all: all.length,
    unread,
    stock: all.filter((n) => n.cat === "stock").length,
    expiry: all.filter((n) => n.cat === "expiry").length,
  };
  $("#notifTabs").innerHTML = NOTIF_TABS.map(
    (t) =>
      `<button class="notif-tab ${
        notifFilter === t.k ? "on" : ""
      }" type="button" role="tab" aria-selected="${
        notifFilter === t.k
      }" data-act="notifFilter" data-a="${t.k}">${t.label}<span class="notif-tab-count">${counts[
        t.k
      ]}</span></button>`,
  ).join("");
  $("#notifList").innerHTML = list.length
    ? `<ul class="list-unstyled mb-0">${list.map(notifItem).join("")}</ul>`
    : `<div class="nf-empty"><i class="bi bi-bell-slash" aria-hidden="true"></i><b>${
        all.length ? "No notifications found" : "You're all caught up"
      }</b><div class="small-muted mt-1">${
        all.length
          ? "Try another tab or clear the search box."
          : "Every item is within its thresholds. Nothing needs attention."
      }</div></div>`;
  $("#notifTitle").textContent = unread
    ? `Notifications (${unread})`
    : "Notifications";
  const markAll = $('[data-act="notifReadAll"]');
  if (markAll) markAll.disabled = unread === 0;
}
function updateBell() {
  const btn = $("#notifBell");
  if (!btn) return;
  const all = buildNotifications();
  const unread = all.filter((n) => !notifIsRead(n.id)).length;
  /* no count badge on the bell (the reference has none) — the unread
     count is shown in the panel title and in the "Unread" tab */
  btn.classList.toggle("has-alerts", unread > 0);
  btn.setAttribute(
    "aria-label",
    `Notifications, ${unread} item${unread === 1 ? "" : "s"} need attention`,
  );
}
/* ---- open / close with a smooth ease-in / ease-out ---- */
const notifPanel = () => $("#notifPanel");
function placeNotif() {
  const panel = notifPanel(),
    bell = $("#notifBell");
  if (!panel || !bell) return;
  const r = bell.getBoundingClientRect();
  const w = panel.offsetWidth || 384;
  let left = r.right - w;
  left = Math.max(10, Math.min(left, innerWidth - w - 10));
  panel.style.left = left + "px";
  panel.style.top = Math.round(r.bottom + 8) + "px";
}
function openNotif() {
  const panel = notifPanel();
  if (!panel) return;
  renderNotif();
  placeNotif();
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  $("#notifScrim").classList.add("show");
  const bell = $("#notifBell");
  if (bell) {
    bell.classList.add("is-open");
    bell.setAttribute("aria-expanded", "true");
  }
}
function closeNotif() {
  const panel = notifPanel();
  if (!panel || !panel.classList.contains("open")) return;
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  $("#notifScrim").classList.remove("show");
  const bell = $("#notifBell");
  if (bell) {
    bell.classList.remove("is-open");
    bell.setAttribute("aria-expanded", "false");
  }
}
A.notifOpen = () => {
  const panel = notifPanel();
  if (panel && panel.classList.contains("open")) closeNotif();
  else openNotif();
};
A.notifClose = () => closeNotif();
A.notifFilter = (k) => {
  notifFilter = k;
  renderNotif();
};
A.notifItem = (id, close) => {
  notifMarkRead(id);
  updateBell();
  /* when the row links somewhere, close first and leave the list untouched so
     the browser still follows the link */
  if (close) return closeNotif();
  renderNotif();
};
A.notifReadAll = () => {
  buildNotifications().forEach((n) => notifMarkRead(n.id));
  renderNotif();
  updateBell();
  toast("All notifications marked as read.", "info");
};
A.notifSeeAll = () => {
  closeNotif();
  location.hash = "#/inventory";
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeNotif();
});
window.addEventListener("resize", () => {
  if (notifPanel() && notifPanel().classList.contains("open")) placeNotif();
});
window.addEventListener("scroll", () => {
  if (notifPanel() && notifPanel().classList.contains("open")) placeNotif();
}, true);
/* ===== Collapsed-rail tooltip (floating, never clipped by the sidebar) ===== */
const sbTip = () => $("#sbTip");
document.addEventListener("mouseover", (e) => {
  const t = e.target.closest(".sidebar .nv[data-tip]");
  const tip = sbTip();
  if (!t || !tip) return;
  if (innerWidth < 992 || !document.body.classList.contains("sb-collapsed"))
    return;
  const r = t.getBoundingClientRect();
  tip.textContent = t.dataset.tip;
  tip.style.left = `${r.right + 12}px`;
  tip.style.top = `${Math.max(8, r.top + r.height / 2 - 16)}px`;
  tip.classList.add("show");
});
document.addEventListener("mouseout", (e) => {
  const t = e.target.closest(".sidebar .nv[data-tip]");
  const tip = sbTip();
  if (!t || !tip) return;
  if (e.relatedTarget && t.contains(e.relatedTarget)) return;
  tip.classList.remove("show");
});
document.documentElement.classList.toggle("large", S.settings.largeText);
render();
