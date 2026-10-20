/* ===== Router, shell (sidebar/header), global event handling ===== */
const RC = { Manager: "M", "Inventory Clerk": "C", Cashier: "K" };
const ACCESS = {
  dashboard: "MCK",
  products: "MC",
  inventory: "MCK",
  deliveries: "MC",
  "delivery-new": "MC",
  expiration: "MC",
  spoilage: "MC",
  movements: "MC",
  pos: "MK",
  receipt: "MK",
  suppliers: "MC",
  reports: "MC",
  categories: "MC",
  settings: "M",
  account: "MCK",
};
const NAV = [
  ["dashboard", "Dashboard", "speedometer2"],
  ["products", "Products", "box-seam"],
  {
    key: "inv",
    label: "Inventory",
    icon: "clipboard-data",
    kids: [
      ["inventory", "Stock Monitoring"],
      ["deliveries", "Deliveries"],
      ["expiration", "Expiration Monitoring"],
      ["spoilage", "Spoilage and Returns"],
      ["movements", "Stock Movements"],
    ],
  },
  ["pos", "Sales / POS", "cart3"],
  ["suppliers", "Suppliers", "truck"],
  ["reports", "Reports", "file-earmark-bar-graph"],
  {
    key: "set",
    label: "Settings",
    icon: "gear",
    kids: [
      ["categories", "Categories"],
      ["settings", "Alert Settings"],
      ["account", "My Account"],
    ],
  },
];
const RK = {
  inventory: "inv",
  products: "prod",
  categories: "cat",
  suppliers: "sup",
  pos: "pos",
  movements: "mov",
  expiration: "exp",
  spoilage: "spo",
  reports: "rep",
};
Object.assign(DEF, {
  inv: { q: "", cat: "", show: "" },
  prod: { q: "", cat: "", type: "", status: "active" },
  cat: { q: "", status: "active" },
  sup: { q: "", status: "active" },
  pos: { q: "", cat: "", tab: "sale" },
  mov: { from: "", to: "", pid: "", type: "" },
  exp: { show: "" },
  spo: { kind: "" },
  rep: { type: "inventory", from: off(-30), to: off(0), cat: "", q: "" },
});
Object.keys(DEF).forEach((k) => {
  F[k] = { ...DEF[k] };
  P[k] = 1;
});
const AUTH = ["login", "forgot", "otp", "reset"];
let ROUTE = "";
const allowed = (r) => S.user && (ACCESS[r] || "").includes(RC[S.user.role]);
const navItems = () =>
  NAV.map((n) =>
    n.kids
      ? { ...n, kids: n.kids.filter((k) => allowed(k[0])) }
      : allowed(n[0])
        ? n
        : null,
  ).filter((n) => n && (!n.kids || n.kids.length));
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
const TITLES = {
  dashboard: "Dashboard",
  products: "Products",
  inventory: "Stock Monitoring",
  deliveries: "Deliveries",
  "delivery-new": "New Delivery",
  expiration: "Expiration Monitoring",
  spoilage: "Spoilage and Returns",
  movements: "Stock Movements",
  pos: "Sales / POS",
  receipt: "Sale Receipt",
  suppliers: "Suppliers",
  reports: "Reports",
  categories: "Categories",
  settings: "Alert Settings",
  account: "My Account",
};
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
function shell() {
  const r = ROUTE,
    u = S.user,
    al = alerts(),
    tot = al.low + al.out + al.soon + al.exp;
  const nav = navItems()
    .map((n) =>
      n.kids
        ? `<div class="grp ${(S.open && S.open[n.key]) || n.kids.some((k) => k[0] === activeId(r)) ? "open" : ""}"><button class="nv" data-act="grp" data-a="${n.key}" aria-expanded="false"><i class="bi bi-${n.icon}"></i><span>${n.label}</span><i class="bi bi-chevron-down chev"></i></button><div class="sub">${n.kids.map((k) => `<a class="nv ${activeId(r) === k[0] ? "active" : ""}" href="#/${k[0]}" ${activeId(r) === k[0] ? 'aria-current="page"' : ""}><span>${k[1]}</span></a>`).join("")}</div></div>`
        : `<a class="nv ${activeId(r) === n[0] ? "active" : ""}" href="#/${n[0]}" ${activeId(r) === n[0] ? 'aria-current="page"' : ""}><i class="bi bi-${n[2]}"></i><span>${n[1]}</span></a>`,
    )
    .join("");
  return `<aside class="sidebar${u.role === "Manager" ? " manager" : ""}" aria-label="Main navigation"><div class="sb-brand"><i class="bi bi-cart3"></i><div><b>Sta. Monica of Bustos</b><small>Multipurpose Cooperative</small></div></div>
 <nav class="sb-nav">${nav}</nav>
 <div class="sb-user dropup"><button class="nv" data-bs-toggle="dropdown" aria-label="Account menu"><span class="avatar">${u.name
   .split(" ")
   .map((w) => w[0])
   .slice(0, 2)
   .join(
     "",
   )}</span><span class="uinfo"><b class="d-block">${esc(u.name)}</b><small>${u.role}</small></span></button>
 <ul class="dropdown-menu"><li><a class="dropdown-item" href="#/account">My Account</a></li><li><button class="dropdown-item" data-act="logout">Log out</button></li></ul></div></aside>
 <div class="sb-backdrop" data-act="drawer"></div>
 <div class="main"><header class="topbar no-print"><button class="btn btn-outline-secondary" data-act="drawer" aria-label="Toggle navigation"><i class="bi bi-list"></i></button>
 <strong class="me-auto fs-5">${TITLES[r] || ""}</strong><span class="muted d-none d-md-inline">${dfmt(off(0))}</span>
 <div class="dropdown"><button class="btn btn-outline-secondary position-relative" data-bs-toggle="dropdown" aria-label="Alerts, ${tot} items need attention"><i class="bi bi-bell"></i>${tot ? `<span class="badge rounded-pill text-bg-danger position-absolute top-0 start-100 translate-middle">${tot}</span>` : ""}</button>
 <ul class="dropdown-menu dropdown-menu-end"><li class="dropdown-header">Needs attention</li>
 <li><a class="dropdown-item" href="#/inventory?show=low">${al.low} low-stock products</a></li><li><a class="dropdown-item" href="#/inventory?show=out">${al.out} out-of-stock products</a></li>
 <li><a class="dropdown-item" href="#/expiration?show=soon">${al.soon} batches expiring soon</a></li><li><a class="dropdown-item" href="#/expiration?show=expired">${al.exp} expired batches</a></li></ul></div></header>
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
      : `<div class="card p-4 text-center"><i class="bi bi-shield-lock fs-1"></i><h1>No access</h1><p>Your role (${S.user.role}) cannot open this page in the prototype.</p><a class="btn btn-primary mx-auto" href="#/dashboard">Back to Dashboard</a></div>`;
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
  if (t.dataset.f) {
    const [k, f] = t.dataset.f.split(".");
    F[k][f] = t.value;
    P[k] = 1;
    if ($("#res")) $("#res").innerHTML = RES[k]();
  }
  if (t.dataset.dl) S.dl[t.dataset.dl] = t.value;
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
  document.body.classList.remove("sb-collapsed");
  S.open = S.open || {};
  const g = t.closest(".grp");
  g.classList.toggle("open");
  S.open[k] = g.classList.contains("open");
};
A.drawer = () => {
  if (innerWidth < 992) document.body.classList.toggle("sb-open");
  else document.body.classList.toggle("sb-collapsed");
};
A.logout = () =>
  confirmBox(
    "Log out?",
    "Are you sure you want to log out?",
    () => {
      S.user = null;
      S.cart = [];
      S.tender = "";
      location.hash = "#/login";
      toast("You have been logged out.", "info");
    },
    "Log out",
  );
document.documentElement.classList.toggle("large", S.settings.largeText);
render();
