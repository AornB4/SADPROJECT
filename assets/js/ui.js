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
  `<div class="action-legend" aria-label="Legend: table actions"><strong class="action-legend-title">LEGEND</strong>${actions
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
const emptyState = (m, icon = "inbox") =>
  `<div class="text-center py-5 muted"><i class="bi bi-${icon} fs-1 d-block mb-2"></i>${m}</div>`;
function pager(key, total) {
  const pages = Math.ceil(total / PER),
    cur = P[key] || 1;
  if (pages <= 1)
    return `<div class="small-muted p-3">Showing ${total} record${total === 1 ? "" : "s"}</div>`;
  const b = (n, l, dis, on) =>
    `<li class="page-item ${dis ? "disabled" : ""} ${on ? "active" : ""}"><a class="page-link" href="#" data-act="page" data-a="${key}" data-b="${n}">${l}</a></li>`;
  return `<div class="d-flex justify-content-between align-items-center p-3 flex-wrap gap-2"><span class="small-muted">Showing ${(cur - 1) * PER + 1}–${Math.min(cur * PER, total)} of ${total}</span><ul class="pagination mb-0">${b(cur - 1, "‹", cur === 1)}${Array.from({ length: pages }, (_, i) => b(i + 1, i + 1, 0, cur === i + 1)).join("")}${b(cur + 1, "›", cur === pages)}</ul></div>`;
}
const searchBox = (k, ph) =>
  `<div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input class="form-control" type="search" placeholder="${ph}" aria-label="${ph}" data-f="${k}" value="${esc(F[k.split(".")[0]][k.split(".")[1]])}"></div>`;
const selF = (k, opts, label) =>
  `<select class="form-select" aria-label="${label}" data-f="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(F[k.split(".")[0]][k.split(".")[1]]) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
const catOpts = (all, selected) =>
  (all ? [["", "All categories"]] : [["", "Select category"]]).concat(
    S.cats
      .filter((c) => c.active || c.id == selected)
      .map((c) => [c.id, c.name]),
  );
const pageHead = (title, sub, actions = "") =>
  `<div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3"><div><h1 class="mb-0">${title}</h1><div class="muted">${sub || ""}</div></div><div class="d-flex gap-2 flex-wrap no-print">${actions}</div></div>`;
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
