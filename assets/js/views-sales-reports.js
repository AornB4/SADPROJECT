/* ===== POS, Sales History, Receipt, Reports ===== */
const cartTotal = () =>
  S.cart.reduce((s, c) => s + c.qty * prod(c.pid).price, 0);
const receiptHtml = (
  s,
) => `<div class="receipt"><div class="text-center"><b>STA. MONICA OF BUSTOS<br>MULTIPURPOSE COOPERATIVE</b><br>Sales Receipt (Sample)<br><small>NOT AN OFFICIAL RECEIPT</small></div><hr>Ref: ${s.ref}<br>Date: ${dtfmt(s.dt)}<br>Cashier: ${esc(s.user)}<hr>
 <table>${s.lines.map((l) => `<tr><td colspan="2">${esc(prod(l.pid).name)}</td></tr><tr><td>&nbsp;&nbsp;${l.qty} x ${peso(l.price)}</td><td class="text-end">${peso(l.qty * l.price)}</td></tr>`).join("")}</table><hr>
 <table><tr><td><b>TOTAL</b></td><td class="text-end"><b>${peso(s.total)}</b></td></tr><tr><td>Amount received</td><td class="text-end">${peso(s.tendered)}</td></tr><tr><td>Change</td><td class="text-end">${peso(s.tendered - s.total)}</td></tr></table><hr><div class="text-center">Thank you!</div></div>`;
function printReceipt(s) {
  const area = $("#print-area");
  area.innerHTML = receiptHtml(s);
  document.body.classList.add("printing-receipt");
  window.addEventListener(
    "afterprint",
    () => {
      document.body.classList.remove("printing-receipt");
      area.innerHTML = "";
    },
    { once: true },
  );
  setTimeout(() => window.print(), 300);
}
RES.pos = () => {
  const f = F.pos,
    L = S.products.filter(
      (p) =>
        p.active && has(p.name + p.code, f.q) && (!f.cat || p.cat == f.cat),
    );
  return L.length
    ? `<div class="pgrid">${L.map((p) => {
        const q = sellable(p.id);
        return `<button class="pcard" data-act="addCart" data-a="${p.id}" ${q ? "" : "disabled"} aria-label="Add ${esc(p.name)} to cart"><b class="d-block">${esc(p.name)}</b><span class="d-block">${peso(p.price)}</span><span class="small-muted d-block">${q ? `Stock: ${q}` : ""}</span>${q === 0 ? pill("out", "x-octagon", "Out of stock") : q <= p.min ? pill("low", "exclamation-triangle", "Low") : ""}</button>`;
      }).join("")}</div>`
    : emptyState("No products found.", "search");
};
const cartHtml = () => {
  const t = cartTotal();
  return `<div class="card cartbox"><div class="card-h">Current Transaction<button class="btn btn-link btn-sm" data-act="clearCart">Clear cart</button></div><div class="p-3">
 ${
   S.cart.length
     ? S.cart
         .map((c) => {
           const p = prod(c.pid);
           return `<div class="d-flex align-items-center gap-2 mb-2"><div class="flex-grow-1"><b>${esc(p.name)}</b><div class="small-muted">${peso(p.price)} each</div></div><div class="btn-group cart-qty"><button class="btn btn-outline-secondary btn-sm" data-act="qty" data-a="${p.id}" data-b="-1" aria-label="Decrease">−</button><span class="btn btn-sm disabled text-dark cart-qty-value">${c.qty}</span><button class="btn btn-outline-secondary btn-sm" data-act="qty" data-a="${p.id}" data-b="1" aria-label="Increase">+</button></div><div style="width:80px" class="text-end">${peso(c.qty * p.price)}</div></div>`;
         })
         .join("")
     : emptyState("Cart is empty. Tap a product to add it.", "cart")
 }
 <hr><div class="d-flex justify-content-between fs-5"><span>Total</span><b>${peso(t)}</b></div>
 <label class="form-label mt-3" for="tender">Amount received</label><input class="form-control" id="tender" type="number" min="0" inputmode="decimal" value="${S.tender}"><div class="d-flex gap-1 mt-2 flex-wrap"><button class="btn btn-outline-secondary btn-sm" data-act="tend" data-a="${t}">Exact</button>${[100, 500, 1000].map((v) => `<button class="btn btn-outline-secondary btn-sm" data-act="tend" data-a="${v}">₱${v}</button>`).join("")}</div>
 <div class="d-flex justify-content-between fs-5 mt-3"><span>Change</span><b id="chg"></b></div><div id="payMsg" class="small text-danger" role="alert"></div>
 <button class="btn btn-primary w-100 mt-3" id="payBtn" data-act="checkout">Complete Sale</button></div></div>`;
};
function payUpd() {
  if (!$("#chg")) return;
  const t = cartTotal(),
    r = +S.tender || 0,
    ok = S.cart.length && r >= t;
  $("#chg").textContent = ok ? peso(r - t) : "—";
  $("#payBtn").disabled = !ok;
  $("#payMsg").textContent =
    S.cart.length && S.tender !== "" && r < t
      ? "Amount received is less than the total."
      : "";
}
const cartRefresh = () => {
  $("#cart").innerHTML = cartHtml();
  payUpd();
};
V.pos = () => {
  const t = F.pos.tab;
  const tabs = `<div class="mb-3 border-bottom no-print"><button class="tab-btn ${t === "sale" ? "on" : ""}" data-act="tab" data-a="sale">New Sale</button><button class="tab-btn ${t === "history" ? "on" : ""}" data-act="tab" data-a="history">Sales History</button></div>`;
  if (t === "history")
    return (
      pageHead(
        "Sales / POS",
        isMgr() ? "Completed sales (sample data)." : "Your completed sales.",
      ) +
      tabs +
      `${actionLegend(["view"])}<div class="card">${tbl(
        ["Reference", "Date & time", "Items", "Total", "Cashier", "Receipt"],
        mySales().map(
          (s) =>
            `<tr><td><b>${s.ref}</b></td><td>${dtfmt(s.dt)}</td><td>${s.lines.reduce((n, l) => n + l.qty, 0)}</td><td>${peso(s.total)}</td><td>${esc(s.user)}</td><td><button class="btn btn-sm table-action action-view" data-act="rcpt" data-a="${s.ref}"><i class="bi bi-eye"></i> View</button></td></tr>`,
        ),
      )}</div>`
    );
  return (
    pageHead("Sales / POS", "Tap a product to add it to the sale.") +
    tabs +
    `<div class="row g-3"><div class="col-lg-7"><div class="row g-2 mb-3"><div class="col-md-7">${searchBox("pos.q", "Search product name or code")}</div><div class="col-md-5">${selF("pos.cat", catOpts(true), "Category")}</div></div><div id="res">${RES.pos()}</div></div><div class="col-lg-5" id="cart">${cartHtml()}</div></div>`
  );
};
A.tab = (t) => {
  F.pos.tab = t;
  refresh();
  payUpd();
};
A.addCart = (pid) => {
  const p = prod(pid),
    c = S.cart.find((x) => x.pid == pid),
    n = (c ? c.qty : 0) + 1;
  if (n > sellable(pid))
    return toast(`Only ${sellable(pid)} of ${p.name} available.`, "err");
  c ? (c.qty = n) : S.cart.push({ pid: +pid, qty: 1 });
  cartRefresh();
};
A.qty = (pid, d) => {
  const c = S.cart.find((x) => x.pid == pid),
    n = c.qty + +d;
  if (n > sellable(pid))
    return toast(`Only ${sellable(pid)} available. Cannot add more.`, "err");
  if (n < 1) S.cart = S.cart.filter((x) => x !== c);
  else c.qty = n;
  cartRefresh();
};
A.clearCart = () => {
  S.cart = [];
  S.tender = "";
  cartRefresh();
};
A.tend = (v) => {
  S.tender = String(v);
  cartRefresh();
};
A.checkout = () => {
  const t = cartTotal(),
    bad = S.cart.find((c) => c.qty > sellable(c.pid));
  if (bad) return toast("Stock changed. Please fix the cart.", "err");
  confirmBox(
    "Complete this sale?",
    `Total ${peso(t)}. Change ${peso(+S.tender - t)}. Stock will be reduced (simulated).`,
    () => {
      const ref = "S-" + S.n.sale++;
      const lines = S.cart.map((c) => ({
        pid: c.pid,
        qty: c.qty,
        price: prod(c.pid).price,
      }));
      lines.forEach((l) => {
        deduct(l.pid, l.qty, true);
        logMove(l.pid, "Sale", -l.qty, ref, "");
      });
      S.sales.unshift({
        ref,
        dt: nowStamp(),
        lines,
        total: t,
        tendered: +S.tender,
        user: S.user.name,
      });
      logAudit("Sale", `${ref}: ${lines.length} item(s), total ${peso(t)}`);
      S.cart = [];
      S.tender = "";
      location.hash = "#/receipt/" + ref;
    },
    "Complete Sale",
  );
};
A.rcpt = (ref) =>
  modal({
    title: "Receipt " + ref,
    body: receiptHtml(S.sales.find((s) => s.ref === ref)),
    ok: "Print",
    onOk: () => {
      printReceipt(S.sales.find((s) => s.ref === ref));
    },
  });
A.printRcpt = (ref) => {
  const sale = S.sales.find((s) => s.ref === ref);
  if (sale) printReceipt(sale);
};
V.receipt = (r) => {
  const s = S.sales.find((x) => x.ref === r.arg);
  if (!s || (!isMgr() && s.user !== S.user.name))
    return '<div class="alert alert-warning">Sale not found.</div>';
  return `<div class="text-center mb-3 no-print"><i class="bi bi-check-circle-fill fs-1" style="color:var(--green)"></i><h1>Sale completed</h1><div class="muted">Simulated sale ${s.ref}. Stock on screen has been updated.</div></div>${receiptHtml(s)}
 <div class="d-flex justify-content-center gap-2 mt-3 no-print flex-wrap"><button class="btn btn-primary" data-act="printRcpt" data-a="${s.ref}"><i class="bi bi-printer"></i> Print Receipt</button><a class="btn btn-outline-primary" href="#/pos">New Sale</a><a class="btn btn-outline-secondary" href="#/pos?tab=history">Sales History</a></div>`;
};
/* ---- Reports ---- */
const REPORTS = {
  inventory: "Inventory Status",
  low: "Low Stock",
  movements: "Stock Movements",
  sales: "Sales Summary",
  salesd: "Detailed Sales Transactions",
  deliveries: "Deliveries",
  expiration: "Expiration Monitoring",
  spoilage: "Spoilage and Returns",
};
function buildReport() {
  const f = F.rep,
    inR = (d) =>
      (!f.from || d.slice(0, 10) >= f.from) &&
      (!f.to || d.slice(0, 10) <= f.to),
    pc = (p) => !f.cat || p.cat == f.cat,
    R = { cols: [], rows: [], sum: [] };
  const ps = S.products.filter((p) => p.active && pc(p));
  switch (f.type) {
    case "inventory":
      R.cols = [
        "Code",
        "Product",
        "Category",
        "Available",
        "Minimum",
        "Next expiry",
      ];
      R.rows = ps.map((p) => [
        p.code,
        p.name,
        catName(p.cat),
        stockOf(p.id),
        p.min,
        expInfo(p) ? dfmt(expInfo(p).date) : "—",
      ]);
      R.sum = [
        ["Products", ps.length],
        ["Total units", ps.reduce((s, p) => s + stockOf(p.id), 0)],
        ["Low stock", ps.filter((p) => level(p) === "low").length],
        ["Out of stock", ps.filter((p) => level(p) === "out").length],
      ];
      break;
    case "low": {
      const L = ps.filter((p) => level(p) !== "ok");
      R.cols = [
        "Code",
        "Product",
        "Category",
        "Available",
        "Minimum",
        "Shortfall",
      ];
      R.rows = L.map((p) => [
        p.code,
        p.name,
        catName(p.cat),
        stockOf(p.id),
        p.min,
        p.min - stockOf(p.id),
      ]);
      R.sum = [["Products needing restock", L.length]];
      break;
    }
    case "movements": {
      const L = S.movements.filter((m) => inR(m.dt) && pc(prod(m.pid)));
      R.cols = ["Date", "Product", "Type", "Qty", "Reference", "User"];
      R.rows = L.map((m) => [
        dtfmt(m.dt),
        prod(m.pid).name,
        m.type,
        (m.qty > 0 ? "+" : "") + m.qty,
        m.ref || "—",
        m.user,
      ]);
      R.sum = [
        ["Records", L.length],
        ["Units in", L.filter((m) => m.qty > 0).reduce((s, m) => s + m.qty, 0)],
        [
          "Units out",
          -L.filter((m) => m.qty < 0).reduce((s, m) => s + m.qty, 0),
        ],
      ];
      break;
    }
    case "sales": {
      const L = S.sales.filter((s) => inR(s.dt)),
        by = {};
      L.forEach((s) => {
        const d = s.dt.slice(0, 10);
        by[d] = by[d] || { n: 0, u: 0, t: 0 };
        by[d].n++;
        by[d].u += s.lines.reduce((a, l) => a + l.qty, 0);
        by[d].t += s.total;
      });
      R.cols = ["Date", "Transactions", "Items sold", "Total sales"];
      R.rows = Object.keys(by)
        .sort()
        .reverse()
        .map((d) => [dfmt(d), by[d].n, by[d].u, peso(by[d].t)]);
      const T = L.reduce((s, x) => s + x.total, 0);
      R.sum = [
        ["Transactions", L.length],
        ["Total sales", peso(T)],
        ["Average sale", peso(L.length ? T / L.length : 0)],
      ];
      break;
    }
    case "salesd": {
      const rows = [];
      S.sales
        .filter((s) => inR(s.dt))
        .forEach((s) =>
          s.lines
            .filter((l) => pc(prod(l.pid)))
            .forEach((l) =>
              rows.push([
                s.ref,
                dtfmt(s.dt),
                prod(l.pid).name,
                l.qty,
                peso(l.price),
                peso(l.qty * l.price),
                s.user,
              ]),
            ),
        );
      R.cols = [
        "Ref",
        "Date",
        "Product",
        "Qty",
        "Price",
        "Subtotal",
        "Cashier",
      ];
      R.rows = rows;
      R.sum = [
        ["Lines", rows.length],
        [
          "Total",
          peso(
            S.sales
              .filter((s) => inR(s.dt))
              .reduce(
                (s, x) =>
                  s +
                  x.lines
                    .filter((l) => pc(prod(l.pid)))
                    .reduce((a, l) => a + l.qty * l.price, 0),
                0,
              ),
          ),
        ],
      ];
      break;
    }
    case "deliveries": {
      const rows = [];
      S.deliveries
        .filter((d) => inR(d.date))
        .forEach((d) =>
          d.lines
            .filter((l) => pc(prod(l.pid)))
            .forEach((l) =>
              rows.push([
                d.ref,
                dfmt(d.date),
                supOf(d.sup).name,
                prod(l.pid).name,
                l.qty,
                peso(l.cost),
                peso(l.qty * l.cost),
              ]),
            ),
        );
      R.cols = [
        "Ref",
        "Date",
        "Supplier",
        "Product",
        "Qty",
        "Unit cost",
        "Total",
      ];
      R.rows = rows;
      R.sum = [
        ["Lines", rows.length],
        [
          "Total cost",
          peso(
            S.deliveries
              .filter((d) => inR(d.date))
              .reduce(
                (s, d) =>
                  s +
                  d.lines
                    .filter((l) => pc(prod(l.pid)))
                    .reduce((a, l) => a + l.qty * l.cost, 0),
                0,
              ),
          ),
        ],
      ];
      break;
    }
    case "expiration": {
      const L = S.batches
        .filter(
          (b) =>
            b.qty > 0 && b.exp && expState(b.exp) !== "ok" && pc(prod(b.pid)),
        )
        .sort((a, b) => a.exp.localeCompare(b.exp));
      R.cols = ["Product", "Batch", "Qty", "Arrived", "Expires", "Remaining"];
      R.rows = L.map((b) => [
        prod(b.pid).name,
        b.ref,
        b.qty,
        dfmt(b.arr),
        dfmt(b.exp),
        daysLeft(b.exp) < 0
          ? `Expired ${-daysLeft(b.exp)} day(s) ago`
          : `${daysLeft(b.exp)} day(s) left`,
      ]);
      R.sum = [
        ["Near expiration", L.filter((b) => expState(b.exp) === "soon").length],
        ["Expired", L.filter((b) => expState(b.exp) === "expired").length],
      ];
      break;
    }
    case "spoilage": {
      const L = S.spoilage.filter((s) => inR(s.date) && pc(prod(s.pid)));
      R.cols = [
        "ID",
        "Date",
        "Type",
        "Product",
        "Qty",
        "Reason",
        "Disposition",
      ];
      R.rows = L.map((s) => [
        s.id,
        dfmt(s.date),
        s.kind,
        prod(s.pid).name,
        s.qty,
        s.reason,
        s.disp,
      ]);
      R.sum = [
        ["Records", L.length],
        ["Units", L.reduce((s, x) => s + x.qty, 0)],
      ];
      break;
    }
  }
  if (f.q)
    R.rows = R.rows.filter((r) =>
      r.join(" ").toLowerCase().includes(f.q.toLowerCase()),
    );
  return R;
}
RES.rep = (sel) => {
  const R = pickCols(buildReport(), sel),
    f = F.rep;
  return `<div class="card p-3"><div class="text-center mb-3"><b>Sta. Monica of Bustos Multipurpose Cooperative</b><h2 class="h4 mb-0">${REPORTS[f.type]} Report</h2><div class="muted">${["inventory", "low", "expiration"].includes(f.type) ? "As of " + dfmt(off(0)) : `${f.from ? dfmt(f.from) : "Start"} to ${f.to ? dfmt(f.to) : "today"}`} · Generated by ${esc(S.user.name)} · Sample data</div></div>
 <div class="row g-2 mb-3">${R.sum.map(([k, v]) => `<div class="col-6 col-md-3"><div class="border rounded p-2"><div class="small-muted">${k}</div><b class="fs-5">${v}</b></div></div>`).join("")}</div>${tbl(
   R.cols,
   R.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`),
   "No data for these filters.",
 )}</div>`;
};
V.reports = () =>
  pageHead(
    "Reports",
    "Choose a report, set filters, then print.",
    `<button class="btn btn-primary" data-act="printRep"><i class="bi bi-printer"></i> Print Report</button><button class="btn btn-outline-primary" data-act="exportRep"><i class="bi bi-file-earmark-arrow-down"></i> Export to CSV</button>`,
  ) +
  `<div class="d-flex flex-wrap gap-2 mb-3 no-print">${Object.entries(REPORTS)
    .map(
      ([k, v]) =>
        `<button class="repcard ${F.rep.type === k ? "on" : ""}" data-act="repType" data-a="${k}">${v}</button>`,
    )
    .join("")}</div>
 <div class="row g-2 mb-3 no-print"><div class="col-6 col-md-2"><label class="small-muted" for="rf">From</label><input id="rf" type="date" class="form-control" data-f="rep.from" value="${F.rep.from}"></div><div class="col-6 col-md-2"><label class="small-muted" for="rt">To</label><input id="rt" type="date" class="form-control" data-f="rep.to" value="${F.rep.to}"></div><div class="col-md-4"><label class="small-muted">Category</label>${selF("rep.cat", catOpts(true), "Category")}</div><div class="col-md-4"><label class="small-muted">Search</label>${searchBox("rep.q", "Search in report")}</div></div><div id="res">${RES.rep()}</div>`;
A.repType = (t) => {
  F.rep.type = t;
  refresh();
};
/* ---- Report column picker (shared by Print and Export) ---- */
const REPSEL = {}; /* remembers the last choice per report type */
function pickCols(R, sel) {
  if (!sel) return R;
  const idx = R.cols
    .map((c, i) => (sel.cols.includes(c) ? i : -1))
    .filter((i) => i >= 0);
  return {
    cols: idx.map((i) => R.cols[i]),
    rows: R.rows.map((r) => idx.map((i) => r[i])),
    sum: sel.sum ? R.sum : [],
  };
}
const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const repPeriod = () => {
  const f = F.rep;
  return ["inventory", "low", "expiration"].includes(f.type)
    ? "As of " + dfmt(off(0))
    : `${f.from ? dfmt(f.from) : "Start"} to ${f.to ? dfmt(f.to) : "today"}`;
};
function repCsv(sel) {
  const R = pickCols(buildReport(), sel),
    f = F.rep,
    L = [
      ["Sta. Monica of Bustos Multipurpose Cooperative"],
      [REPORTS[f.type] + " Report"],
      [repPeriod()],
      ["Generated by", S.user.name],
      ["Generated on", nowStamp()],
      [],
    ];
  if (R.sum.length) {
    R.sum.forEach(([k, v]) => L.push([k, v]));
    L.push([]);
  }
  L.push(R.cols);
  R.rows.forEach((r) => L.push(r));
  const csv = "﻿" + L.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `${f.type}-report-${off(0)}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function repOpts(mode) {
  if (!guard(isMgr())) return;
  const type = F.rep.type,
    R = buildReport(),
    prev = REPSEL[type],
    print = mode === "print";
  const boxes = R.cols
    .map(
      (c, i) =>
        `<div class="col-sm-6"><div class="form-check"><input class="form-check-input rc" type="checkbox" id="rc${i}" value="${esc(c)}" ${!prev || prev.cols.includes(c) ? "checked" : ""}><label class="form-check-label" for="rc${i}">${esc(c)}</label></div></div>`,
    )
    .join("");
  modal({
    title: print ? "Print report" : "Export report",
    ok: print ? "Print" : "Download CSV",
    body: `<p class="mb-2"><b>${REPORTS[type]} Report</b><br><span class="small-muted">Choose what to include. Your current filters (dates, category, search) still apply.</span></p>
 <div class="d-flex gap-2 mb-2"><button type="button" class="btn btn-outline-secondary btn-sm" id="rcAll">Select all</button><button type="button" class="btn btn-outline-secondary btn-sm" id="rcNone">Clear all</button></div>
 <div class="fw-semibold mb-1">Columns</div><div class="row g-1 mb-3">${boxes}</div>
 <div class="form-check"><input class="form-check-input" type="checkbox" id="rs" ${!prev || prev.sum ? "checked" : ""}><label class="form-check-label" for="rs">Include summary totals</label></div>
 <div class="text-danger small mt-2" id="rcErr" role="alert"></div>`,
    onShow: () => {
      $("#rcAll").onclick = () => $$(".rc").forEach((c) => (c.checked = true));
      $("#rcNone").onclick = () => $$(".rc").forEach((c) => (c.checked = false));
    },
    onOk: () => {
      const cols = $$(".rc")
        .filter((c) => c.checked)
        .map((c) => c.value);
      if (!cols.length) {
        $("#rcErr").textContent = "Select at least one column.";
        return false;
      }
      const sel = { cols, sum: $("#rs").checked };
      REPSEL[type] = sel;
      logAudit(
        "Report",
        `${print ? "Printed" : "Exported to CSV"} ${REPORTS[type]} report (${cols.length} of ${R.cols.length} columns${sel.sum ? ", with summary" : ""})`,
      );
      if (print) {
        setTimeout(() => {
          $("#res").innerHTML = RES.rep(sel);
          window.print();
          $("#res").innerHTML = RES.rep();
        }, 350);
      } else {
        repCsv(sel);
        toast("Report downloaded.");
      }
    },
  });
}
A.printRep = () => repOpts("print");
A.exportRep = () => repOpts("export");
