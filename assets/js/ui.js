/* ===== Shared UI helpers & reusable components ===== */
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const brandLogo = (className) =>
  `<img class="${className}" src="assets/images/cooperative-logo.png" alt="Sta. Monica of Bustos cooperative logo">`;
const actionLegendItems = {
  edit: ["pencil-square", "Edit", "action-edit"],
  view: ["eye", "View", "action-view"],
  status: ["arrow-repeat", "Deactivate / Reactivate", "action-status"],
  spoilage: ["exclamation-triangle", "Record spoilage", "action-record"],
};
const actionLegendOrder = ["edit", "status", "view", "spoilage"];
const actionLegend = (actions) =>
  `<div class="action-legend" aria-label="Legend: table actions"><span class="action-legend-title">Actions</span>${actions
    .slice()
    .sort((a, b) => actionLegendOrder.indexOf(a) - actionLegendOrder.indexOf(b))
    .map((action) => {
      const [i, text, cls] = actionLegendItems[action];
      return `<span class="action-legend-item"><i class="bi bi-${i} ${cls}" aria-hidden="true"></i>${text}</span>`;
    })
    .join("")}</div>`;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const peso = (n) =>
  "₱" +
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const dfmt = (s) =>
  s
    ? new Date(s.slice(0, 10) + "T00:00:00").toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
const dtfmt = (s) => dfmt(s) + " " + s.slice(11);
const A = {},
  V = {},
  RES = {},
  F = {},
  P = {},
  DEF = {};
const PER = 8;
/* --- status indicators (icon + text, never color alone) --- */
const pill = (cls, icon, txt) =>
  `<span class="pill pill-${cls}"><i class="bi bi-${icon}" aria-hidden="true"></i>${txt}</span>`;
function stockPill(p) {
  const q = stockOf(p.id),
    l = level(p);
  if (l === "out") return pill("out", "x-octagon", "Out of stock");
  if (l === "low")
    return pill(
      "low",
      "exclamation-triangle",
      `${q} ${p.unit.toLowerCase()}${q > 1 ? "s" : ""} · Low`,
    );
  return `<span class="qty">${q} ${p.unit.toLowerCase()}${q > 1 ? "s" : ""}</span>`;
}
function expBadge(date) {
  const s = expState(date),
    n = daysLeft(date);
  if (s === "expired")
    return pill(
      "expired",
      "x-circle",
      n === -1 ? "Expired yesterday" : `Expired ${-n} days ago`,
    );
  if (s === "soon")
    return pill(
      "soon",
      "hourglass-split",
      n === 0 ? "Expires today" : `${n} day${n > 1 ? "s" : ""} left`,
    );
  return `<span class="small-muted">${n} days left</span>`;
}
const expCell = (p) => {
  const e = expInfo(p);
  return p.type !== "Perishable"
    ? '<span class="muted">—</span>'
    : e
      ? `<div>${dfmt(e.date)}</div>${e.state && e.state !== "ok" ? expBadge(e.date) : ""}`
      : '<span class="muted">—</span>';
};
const activePill = (a) =>
  a
    ? pill("active", "check-circle", "Active")
    : pill("off", "dash-circle", "Inactive");
/* --- table / pager / empty --- */
const tbl = (heads, rows, empty = "No records found.") =>
  rows.length
    ? `<div class="table-responsive"><table class="table table-hover"><thead><tr>${heads.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`
    : emptyState(empty);
const emptyState = (m, icon = "inbox", hint = "") =>
  `<div class="empty"><span class="empty-icon"><i class="bi bi-${icon}"></i></span><b>${m}</b>${hint ? `<div class="small-muted mt-1">${hint}</div>` : ""}</div>`;
function pager(key, total) {
  const pages = Math.ceil(total / PER),
    cur = P[key] || 1;
  const from = total ? (cur - 1) * PER + 1 : 0,
    to = Math.min(cur * PER, total);
  const b = (n, l, dis, on) =>
    `<li class="page-item ${dis ? "disabled" : ""} ${on ? "active" : ""}"><a class="page-link" href="#" data-act="page" data-a="${key}" data-b="${n}">${l}</a></li>`;
  const pagesHtml =
    pages > 1
      ? `<ul class="pagination pagination-sm mb-0">${b(cur - 1, "‹", cur === 1)}${Array.from(
          { length: pages },
          (_, i) => b(i + 1, i + 1, 0, cur === i + 1),
        ).join("")}${b(cur + 1, "›", cur === pages)}</ul>`
      : "";
  return `<div class="data-card-foot"><span class="small-muted">${
    total
      ? `Showing ${from}–${to} of ${total} record${total === 1 ? "" : "s"}`
      : "No records to show"
  }</span>${pagesHtml}</div>`;
}
const searchBox = (k, ph) =>
  `<div class="input-group"><span class="input-group-text"><i class="bi bi-search"></i></span><input class="form-control" type="search" placeholder="${ph}" aria-label="${ph}" data-f="${k}" value="${esc(F[k.split(".")[0]][k.split(".")[1]])}"></div>`;
const selF = (k, opts, label) =>
  `<select class="form-select" aria-label="${label}" data-f="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(F[k.split(".")[0]][k.split(".")[1]]) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
const catOpts = (all, selected) =>
  (all ? [["", "All categories"]] : [["", "Select category"]]).concat(
    S.cats
      .filter((c) => c.active || c.id == selected)
      .map((c) => [c.id, c.name]),
  );
/* ===== Page scaffolding: breadcrumb › header › toolbar › data card ===== */
/* Breadcrumb trail follows the sidebar structure so the user always knows
   which section and page they are on. */
const trailFor = (route) => {
  const id = activeId(route),
    out = [];
  for (const sec of NAV) {
    for (const n of sec.items) {
      if (n.kids) {
        const kid = n.kids.find((k) => k[0] === id);
        if (kid) {
          out.push({ label: sec.label, group: true });
          /* skip the group label when it repeats the section label */
          if (n.label !== sec.label) out.push({ label: n.label, group: true });
          out.push({ label: kid[1] });
          return out;
        }
      } else if (n[0] === id) {
        out.push({ label: sec.label, group: true });
        out.push({ label: n[1] });
        return out;
      }
    }
  }
  return out;
};
const crumbsHtml = (route) => {
  const t = trailFor(route);
  if (!t.length) return "";
  const sep = `<span class="sep" aria-hidden="true"><i class="bi bi-chevron-right"></i></span>`;
  return `<nav class="crumbs" aria-label="Breadcrumb">${
    route === "dashboard"
      ? ""
      : `<a class="crumbs-home" href="#/dashboard" aria-label="Go to Dashboard"><i class="bi bi-house-door-fill"></i></a>`
  }${t
    .map((c, i) =>
      i === 0
        ? `<span class="crumb-group">${esc(c.label)}</span>`
        : `${sep}${c.group ? `<span class="crumb-group">${esc(c.label)}</span>` : `<span class="cur" aria-current="page">${esc(c.label)}</span>`}`,
    )
    .join("")}</nav>`;
};
const pageHead = (title, sub, actions = "") =>
  `<div class="page-head"><div class="page-head-text"><h1 class="page-title">${title}</h1>${
    sub ? `<p class="page-sub">${sub}</p>` : ""
  }</div>${
    actions ? `<div class="page-actions no-print">${actions}</div>` : ""
  }</div>`;
/* Filter toolbar: one consistent, labelled control row on every list page */
const tbField = (label, control, cls = "") =>
  `<div class="tb-field ${cls}">${label ? `<span class="tb-label">${label}</span>` : ""}${control}</div>`;
const toolbar = (fields, extra = "") => {
  const list = fields.filter(Boolean);
  return `<section class="toolbar no-print${
    list.length === 1 ? " toolbar-single" : ""
  }" aria-label="Filters"><div class="toolbar-grid">${list.join("")}</div>${extra}</section>`;
};
const tbSearch = (k, ph) => tbField("Search", searchBox(k, ph), "tb-wide");
const tbSelect = (k, opts, label) => tbField(label, selF(k, opts, label));
const tbDate = (k, label) =>
  tbField(
    label,
    `<input class="form-control" type="date" data-f="${k}" value="${esc(
      F[k.split(".")[0]][k.split(".")[1]],
    )}">`,
  );
/* Data card: consistent header (title + count + actions), body and footer */
const dataCard = ({ title, meta, actions, body, foot, pad, cls } = {}) =>
  `<section class="card data-card ${cls || ""}">${
    title
      ? `<header class="data-card-head"><h2 class="data-card-title">${title}</h2>${
          meta ? `<span class="data-card-meta">${meta}</span>` : ""
        }${actions ? `<div class="data-card-actions">${actions}</div>` : ""}</header>`
      : ""
  }<div class="data-card-body${pad ? " has-pad" : ""}">${body}</div>${
    foot || ""
  }</section>`;
/* --- form fields + validation --- */
function fld(id, label, o = {}) {
  const {
    type = "text",
    val = "",
    opts = null,
    req = true,
    hint = "",
    attrs = "",
    col = "col-md-6",
  } = o;
  const inp = opts
    ? `<select class="form-select" id="${id}" ${attrs}>${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    : type === "textarea"
      ? `<textarea class="form-control" id="${id}" rows="2" ${attrs}>${esc(val)}</textarea>`
      : `<input class="form-control" id="${id}" type="${type}" value="${esc(val)}" ${attrs}>`;
  return `<div class="${col}"><label class="form-label" for="${id}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : ""}</label>${inp}${hint ? `<div class="form-text">${hint}</div>` : ""}<div class="invalid-feedback" id="e-${id}"></div></div>`;
}
const val = (id) => ($("#" + id) || { value: "" }).value.trim();
const clearErr = (r) =>
  $$(".is-invalid", r || document).forEach((e) =>
    e.classList.remove("is-invalid"),
  );
function check(id, ok, msg) {
  const el = $("#" + id);
  if (!ok && el) {
    el.classList.add("is-invalid");
    $("#e-" + id).textContent = msg;
  }
  return ok;
}
/* --- dialogs, notifications, side panel --- */
function modal({
  title,
  body,
  ok = "Save",
  cancel = "Cancel",
  size = "",
  danger = false,
  onOk,
  onShow,
  noFooter,
}) {
  const el = $("#modal");
  el.querySelector(".modal-dialog").className =
    "modal-dialog modal-dialog-centered modal-dialog-scrollable " + size;
  $(".modal-title", el).textContent = title;
  $(".modal-body", el).innerHTML = body;
  $(".modal-footer", el).innerHTML = noFooter
    ? ""
    : `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">${cancel}</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" id="modalOk">${ok}</button>`;
  const m = bootstrap.Modal.getOrCreateInstance(el);
  if (!noFooter)
    $("#modalOk").onclick = () => {
      if (onOk() !== false) m.hide();
    };
  m.show();
  onShow && onShow();
}
const confirmBox = (title, msg, onYes, ok = "Yes, continue", danger = false) =>
  modal({ title, body: `<p class="mb-0">${msg}</p>`, ok, danger, onOk: onYes });
function toast(msg, type = "ok") {
  const d = document.createElement("div");
  d.className = `toast toast-${type} border-0`;
  d.setAttribute("role", "alert");
  d.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi bi-${type === "ok" ? "check-circle" : type === "err" ? "exclamation-circle" : "info-circle"} me-2"></i>${esc(msg)}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  $("#toasts").append(d);
  new bootstrap.Toast(d, { delay: 4000 }).show();
  d.addEventListener("hidden.bs.toast", () => d.remove());
}
function openPanel(title, html) {
  $("#panelTitle").textContent = title;
  $("#panel .offcanvas-body").innerHTML = html;
  bootstrap.Offcanvas.getOrCreateInstance($("#panel")).show();
}
const kv = (rows) =>
  `<dl class="row mb-0">${rows.map(([k, v]) => `<dt class="col-5 small-muted fw-normal">${k}</dt><dd class="col-7">${v}</dd>`).join("")}</dl>`;
const simNote = (t) =>
  `<div class="sim-note mb-3"><i class="bi bi-info-circle"></i> ${t || "Prototype only: this uses sample data stored in the browser and resets when the page is reloaded."}</div>`;
/* ===== Notification center: builds live alerts from stock + expiry state ===== */
const NOTIF_SEV = {
  critical: { icon: "exclamation-octagon", label: "Critical" },
  warning: { icon: "exclamation-triangle", label: "Warning" },
  info: { icon: "info-circle", label: "Info" },
};
const unitQty = (n, u) =>
  `${n} ${String(u || "unit").toLowerCase()}${n === 1 ? "" : "s"}`;
function buildNotifications() {
  const out = [];
  const ps = S.products.filter((p) => p.active);
  ps.filter((p) => level(p) === "out").forEach((p) =>
    out.push({
      id: "out-" + p.id,
      sev: "critical",
      cat: "stock",
      title: `${p.name} is out of stock`,
      desc: `Nothing left on hand. The minimum level for this item is ${unitQty(
        p.min,
        p.unit,
      )} — record a delivery to bring stock back up.`,
      chips: [p.code, catName(p.cat)],
      time: "0 on hand",
      route: "#/inventory?show=out",
      action: "Review stock",
    }),
  );
  ps.filter((p) => level(p) === "low").forEach((p) =>
    out.push({
      id: "low-" + p.id,
      sev: "warning",
      cat: "stock",
      title: `${p.name} is running low`,
      desc: `Only ${unitQty(stockOf(p.id), p.unit)} left against a minimum of ${unitQty(
        p.min,
        p.unit,
      )}. Replenish before it reaches zero.`,
      chips: [p.code, catName(p.cat)],
      time: "Below minimum",
      route: "#/inventory?show=low",
      action: "Plan restock",
    }),
  );
  S.batches
    .filter((b) => b.qty > 0 && b.exp && expState(b.exp) === "soon")
    .forEach((b) => {
      const p = prod(b.pid);
      if (!p) return;
      const n = daysLeft(b.exp);
      out.push({
        id: "soon-" + b.id,
        sev: "warning",
        cat: "expiry",
        title: `${p.name} expires in ${n} day${n === 1 ? "" : "s"}`,
        desc: `Batch ${b.ref} still holds ${unitQty(
          b.qty,
          p.unit,
        )} and expires on ${dfmt(b.exp)}. Sell it, return it to the supplier or record spoilage.`,
        chips: [b.ref, catName(p.cat)],
        time: dfmt(b.exp),
        route: "#/expiration?show=soon",
        action: "Review batch",
      });
    });
  S.batches
    .filter((b) => b.qty > 0 && b.exp && expState(b.exp) === "expired")
    .forEach((b) => {
      const p = prod(b.pid);
      if (!p) return;
      const n = daysLeft(b.exp);
      out.push({
        id: "exp-" + b.id,
        sev: "critical",
        cat: "expiry",
        title: `${p.name} batch has expired`,
        desc: `Batch ${b.ref} expired ${-n} day${n === -1 ? "" : "s"} ago with ${unitQty(
          b.qty,
          p.unit,
        )} still on hand. It can no longer be sold — record spoilage to clear it.`,
        chips: [b.ref, catName(p.cat)],
        time: dfmt(b.exp),
        route: "#/expiration?show=expired",
        action: "Record spoilage",
      });
    });
  const rank = { critical: 0, warning: 1, info: 2 };
  return out.sort(
    (a, b) => rank[a.sev] - rank[b.sev] || a.title.localeCompare(b.title),
  );
}
const notifIsRead = (id) => !!(S.notifRead && S.notifRead[id]);
const notifMarkRead = (id) => {
  S.notifRead = S.notifRead || {};
  S.notifRead[id] = 1;
};
