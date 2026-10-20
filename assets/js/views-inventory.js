/* ===== Products, Inventory, Deliveries, Expiration, Spoilage/Returns, Movements ===== */
const sl = (L, k) => L.slice((P[k] - 1) * PER, P[k] * PER);
const has = (s, q) => !q || s.toLowerCase().includes(q.toLowerCase());
const canEdit = () => isMgr();
/* ---- Product details panel (closed by default) ---- */
A.view = (pid) => {
  const p = prod(pid),
    bs = batchesOf(p.id),
    mv = S.movements.filter((m) => m.pid === p.id).slice(0, 8);
  openPanel(
    p.name,
    `<div class="mb-3">${stockPill(p)} <span class="small-muted ms-2">Minimum: ${p.min}</span></div>` +
      kv([
        ["Product code", p.code],
        ["Category", esc(catName(p.cat))],
        ["Type", p.type],
        ["Unit", p.unit],
        ...(isMgr() ? [["Purchase cost", peso(p.cost)]] : []),
        ["Selling price", peso(p.price)],
        ["Status", activePill(p.active)],
      ]) +
      `<h3 class="h6 mt-4">Batches in stock</h3>` +
      tbl(
        ["Batch", "Arrived", "Expires", "Qty"],
        bs.map(
          (b) =>
            `<tr><td>${b.ref}</td><td>${dfmt(b.arr)}</td><td>${b.exp ? dfmt(b.exp) + "<br>" + expBadge(b.exp) : "—"}</td><td>${b.qty}</td></tr>`,
        ),
        "No stock on hand.",
      ) +
      `<h3 class="h6 mt-4">Stock movement history</h3>` +
      tbl(
        ["Date", "Type", "Qty", "Ref"],
        mv.map(
          (m) =>
            `<tr><td>${dtfmt(m.dt)}</td><td>${m.type}</td><td>${m.qty > 0 ? "+" : ""}${m.qty}</td><td>${m.ref || "—"}</td></tr>`,
        ),
        "No movements yet.",
      ) +
      `<button class="btn btn-outline-secondary mt-3" data-bs-dismiss="offcanvas">Close</button>`,
  );
};
/* ---- Inventory / Stock Monitoring ---- */
const showOpts = [
  ["", "All products"],
  ["low", "Low stock"],
  ["out", "Out of stock"],
  ["soon", "Near expiration"],
  ["expired", "Expired stock"],
];
function showMatch(p, s) {
  if (!s) return true;
  if (s === "low" || s === "out") return level(p) === s;
  const e = S.batches.some(
    (b) => b.pid === p.id && b.qty > 0 && b.exp && expState(b.exp) === s,
  );
  return e;
}
RES.inv = () => {
  const f = F.inv,
    L = S.products.filter(
      (p) =>
        p.active &&
        has(p.name + p.code, f.q) &&
        (!f.cat || p.cat == f.cat) &&
        showMatch(p, f.show),
    );
  return dataCard({
    title: "Stock on hand",
    meta: `${L.length} product${L.length === 1 ? "" : "s"}`,
    body:
      actionLegend(["view"]) +
      tbl(
        [
          "Product",
          "Category",
          "Available Stock",
          "Minimum Stock",
          "Expiration Date",
          "Action",
        ],
        sl(L, "inv").map(
          (p) =>
            `<tr><td><b>${esc(p.name)}</b><div class="small-muted">${p.code}</div></td><td>${esc(catName(p.cat))}</td><td>${stockPill(p)}</td><td>${p.min}</td><td>${expCell(p)}</td><td><button class="btn btn-sm table-action action-view" data-act="view" data-a="${p.id}" aria-label="View ${esc(p.name)}"><i class="bi bi-eye"></i></button></td></tr>`,
        ),
        "No products match your search.",
      ),
    foot: pager("inv", L.length),
  });
};
V.inventory = () =>
  pageHead("Stock Monitoring", "Check available stock and expiration dates.") +
  toolbar([
    tbSearch("inv.q", "Search product name or code"),
    tbSelect("inv.cat", catOpts(true), "Category"),
    tbSelect("inv.show", showOpts, "Stock Status"),
  ]) +
  `<div id="res">${RES.inv()}</div>`;
/* ---- Products ---- */
RES.prod = () => {
  const f = F.prod,
    m = isMgr(),
    st = m ? f.status : "active",
    L = S.products.filter(
      (p) =>
        has(p.name + p.code, f.q) &&
        (!f.cat || p.cat == f.cat) &&
        (!f.type || p.type === f.type) &&
        (st === "all" || (st === "active") === p.active),
    );
  const heads = ["Code", "Product", "Category", "Type"].concat(
    m ? ["Cost"] : [],
    ["Price", "In stock", "Min. stock", "Actions"],
  );
  return dataCard({
    title: "Product list",
    meta: `${L.length} product${L.length === 1 ? "" : "s"}`,
    body:
      actionLegend(["view", ...(m ? ["edit", "status"] : [])]) +
      tbl(
        heads,
        sl(L, "prod").map(
          (p) =>
            `<tr><td>${p.code}</td><td><b>${esc(p.name)}</b><div class="small-muted">${p.unit}</div>${p.active ? "" : activePill(0)}</td><td>${esc(catName(p.cat))}</td><td>${p.type}</td>${m ? `<td>${peso(p.cost)}</td>` : ""}<td>${peso(p.price)}</td><td>${stockPill(p)}</td><td>${p.min}</td><td class="text-nowrap"><button class="btn btn-sm table-action action-view" data-act="view" data-a="${p.id}" aria-label="View ${esc(p.name)}"><i class="bi bi-eye"></i></button>${m ? ` <button class="btn btn-sm table-action action-edit" data-act="prodForm" data-a="${p.id}" aria-label="Edit ${esc(p.name)}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm table-action action-status" data-act="prodToggle" data-a="${p.id}" aria-label="${p.active ? "Deactivate" : "Reactivate"} ${esc(p.name)}"><i class="bi bi-arrow-repeat"></i></button>` : ""}</td></tr>`,
        ),
        "No products found.",
      ),
    foot: pager("prod", L.length),
  });
};
V.products = () =>
  pageHead(
    "Products",
    isMgr()
      ? "Manage product information."
      : "View product prices and stock availability.",
    hasOp("products")
      ? `<button class="btn btn-primary" data-act="prodForm"><i class="bi bi-plus-lg"></i> Add Product</button>`
      : "",
  ) +
  toolbar([
    tbSearch("prod.q", "Search name or code"),
    tbSelect("prod.cat", catOpts(true), "Category"),
    tbSelect(
      "prod.type",
      [
        ["", "All types"],
        ["Perishable", "Perishable"],
        ["Non-Perishable", "Non-Perishable"],
      ],
      "Product Type",
    ),
    isMgr()
      ? tbSelect(
          "prod.status",
          [
            ["active", "Active"],
            ["inactive", "Inactive"],
            ["all", "All"],
          ],
          "Status",
        )
      : "",
  ]) + `<div id="res">${RES.prod()}</div>`;
A.prodForm = (id) => {
  /* Employees with the "Add new products" operation may add; only Managers may edit existing ones. */
  if (!guard(isMgr() || (!id && hasOp("products")))) return;
  const p = id
    ? prod(id)
    : {
        name: "",
        code: "",
        cat: "",
        type: "",
        unit: "",
        cost: "",
        price: "",
        min: S.settings.defaultMin,
      };
  modal({
    title: id ? "Edit Product" : "Add Product",
    size: "modal-lg",
    ok: "Save Product",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("pn", "Product name", { val: p.name })}${fld("pc", "Product code (SKU)", { val: p.code, hint: "Example: MLK-001" })}
 ${fld("pcat", "Category", { val: p.cat, opts: catOpts(false, p.cat), hint: "Categories come from Settings › Categories." })}${fld(
   "pt",
   "Product type",
   {
     val: p.type,
     opts: [
       ["", "Select type"],
       ["Perishable", "Perishable"],
       ["Non-Perishable", "Non-Perishable"],
     ],
   },
 )}
 ${fld("pu", "Unit of measurement", { val: p.unit, hint: "Piece, Liter, Kilogram, Pack…" })}${fld("pm", "Minimum stock", { type: "number", val: p.min, attrs: 'min="0"' })}${fld("pco", "Purchase cost (₱)", { type: "number", val: p.cost, attrs: 'min="0" step="0.01"' })}${fld("ps", "Selling price (₱)", { type: "number", val: p.price, attrs: 'min="0" step="0.01"' })}</form>`,
    onOk: () => {
      clearErr();
      const code = val("pc").toUpperCase(),
        co = +val("pco"),
        pr = +val("ps");
      const ok = [
        check("pn", val("pn"), "Enter the product name."),
        check(
          "pc",
          code && !S.products.some((x) => x.code === code && x.id != id),
          code ? "This code is already used." : "Enter a product code.",
        ),
        check("pcat", val("pcat"), "Select a category."),
        check("pt", val("pt"), "Select a type."),
        check("pu", val("pu"), "Enter the unit."),
        check("pm", val("pm") !== "" && +val("pm") >= 0, "Enter 0 or more."),
        check("pco", val("pco") !== "" && co > 0, "Enter a cost above 0."),
        check(
          "ps",
          pr > 0 && pr >= co,
          pr > 0
            ? "Price should not be lower than cost."
            : "Enter a price above 0.",
        ),
      ];
      if (ok.includes(false)) return false;
      const d = {
        name: val("pn"),
        code,
        cat: +val("pcat"),
        type: val("pt"),
        unit: val("pu"),
        min: +val("pm"),
        cost: co,
        price: pr,
      };
      if (id) Object.assign(prod(id), d);
      else S.products.push({ id: S.n.prod++, active: true, ...d });
      logAudit(
        "Product",
        `${id ? "Edited" : "Added"} product ${d.code} – ${d.name} (price ${peso(d.price)}, cost ${peso(d.cost)})`,
      );
      toast(id ? "Product updated." : "Product added.");
      refresh();
    },
  });
};
A.prodToggle = (id) => {
  if (!guard(isMgr())) return;
  const p = prod(id);
  confirmBox(
    p.active ? "Deactivate product?" : "Reactivate product?",
    p.active
      ? `“${esc(p.name)}” will be hidden from stock and sales. The record and its history are kept.`
      : `“${esc(p.name)}” will be available again.`,
    () => {
      p.active = !p.active;
      logAudit(
        "Product",
        `${p.active ? "Reactivated" : "Deactivated"} product ${p.code} – ${p.name}`,
      );
      toast(
        p.active
          ? "Product reactivated."
          : "Product deactivated. History is kept.",
      );
      refresh();
    },
    p.active ? "Deactivate" : "Reactivate",
    p.active,
  );
};
/* ---- Expiration Monitoring ---- */
RES.exp = () => {
  const s = F.exp.show;
  const L = S.batches
    .filter(
      (b) =>
        b.qty > 0 &&
        b.exp &&
        ["soon", "expired"].includes(expState(b.exp)) &&
        (!s || expState(b.exp) === s),
    )
    .sort((a, b) => a.exp.localeCompare(b.exp));
  return dataCard({
    title: "Batches to watch",
    meta: `${L.length} batch${L.length === 1 ? "" : "es"}`,
    body:
      actionLegend(["view", ...(hasOp("spoilage") ? ["spoilage"] : [])]) +
      tbl(
        [
          "Product",
          "Batch",
          "Qty",
          "Arrival date",
          "Expiration date",
          "Remaining",
          "Supplier",
          "Actions",
        ],
        sl(L, "exp").map((b) => {
          const p = prod(b.pid);
          return `<tr><td><b>${esc(p.name)}</b><div class="small-muted">${p.code}</div></td><td>${b.ref}</td><td>${b.qty}</td><td>${dfmt(b.arr)}</td><td>${dfmt(b.exp)}</td><td>${expBadge(b.exp)}</td><td>${b.sup ? esc(supOf(b.sup).name) : "—"}</td><td class="text-nowrap"><button class="btn btn-sm table-action action-view" data-act="view" data-a="${p.id}" aria-label="View ${esc(p.name)}"><i class="bi bi-eye"></i></button> ${hasOp("spoilage") ? `<button class="btn btn-sm table-action action-record" data-act="spoilForm" data-a="Spoilage" data-b="${b.id}" aria-label="Record spoilage for ${esc(p.name)}"><i class="bi bi-exclamation-triangle"></i></button>` : ""}</td></tr>`;
        }),
        "No products near expiration.",
      ),
    foot: pager("exp", L.length),
  });
};
V.expiration = () =>
  pageHead(
    "Expiration Monitoring",
    `Showing batches that expire within ${S.settings.expWarnDays} days, and expired batches.`,
  ) +
  toolbar([
    tbSelect(
      "exp.show",
      [
        ["", "Near expiration and expired"],
        ["soon", "Near expiration only"],
        ["expired", "Expired only"],
      ],
      "Expiration Status",
    ),
  ]) +
  `<div id="res">${RES.exp()}</div>`;
/* ---- Deliveries ---- */
RES.del = () => {
  const f = F.del,
    L = S.deliveries.filter((d) =>
      has(d.ref + " " + supOf(d.sup).name, f.q),
    );
  return dataCard({
    title: "Delivery records",
    meta: `${L.length} ${L.length === 1 ? "delivery" : "deliveries"}`,
    body:
      actionLegend(["view"]) +
      tbl(
        ["Reference", "Date", "Supplier", "Items", "Total cost", "Action"],
        sl(L, "del").map(
          (d) =>
            `<tr><td><b>${d.ref}</b></td><td>${dfmt(d.date)}</td><td>${esc(supOf(d.sup).name)}</td><td>${d.lines.length}</td><td>${peso(d.lines.reduce((s, l) => s + l.qty * l.cost, 0))}</td><td><button class="btn btn-sm table-action action-view" data-act="delView" data-a="${d.ref}" aria-label="View delivery ${d.ref}"><i class="bi bi-eye"></i></button></td></tr>`,
        ),
        "No deliveries recorded yet.",
      ),
    foot: pager("del", L.length),
  });
};
V.deliveries = () =>
  pageHead(
    "Deliveries",
    "Record stock received from suppliers.",
    `<button class="btn btn-primary" data-act="newDel"><i class="bi bi-plus-lg"></i> New Delivery</button>`,
  ) +
  toolbar([tbSearch("del.q", "Search reference or supplier")]) +
  `<div id="res">${RES.del()}</div>`;
A.delView = (ref) => {
  const d = S.deliveries.find((x) => x.ref === ref);
  openPanel(
    "Delivery " + ref,
    kv([
      ["Supplier", esc(supOf(d.sup).name)],
      ["Date", dfmt(d.date)],
      ["Notes", esc(d.notes) || "—"],
    ]) +
      `<div class="mt-3">${tbl(
        ["Product", "Qty", "Cost", "Expires"],
        d.lines.map(
          (l) =>
            `<tr><td>${esc(prod(l.pid).name)}</td><td>${l.qty}</td><td>${peso(l.cost)}</td><td>${dfmt(l.exp)}</td></tr>`,
        ),
      )}</div>`,
  );
};
A.newDel = () => {
  if (!guard(hasOp("deliveries"))) return;
  S.dl = null;
  location.hash = "#/delivery-new";
};
const dlLines = () =>
  S.dl.lines
    .map((l, i) => {
      const p = prod(l.pid),
        per = p && p.type === "Perishable";
      return `<tr><td style="min-width:200px"><select class="form-select" aria-label="Product" data-dll="${i}.pid"><option value="">Select product</option>${S.products
        .filter((p) => p.active)
        .map(
          (p) =>
            `<option value="${p.id}" ${p.id == l.pid ? "selected" : ""}>${esc(p.name)}</option>`,
        )
        .join("")}</select></td>
 <td><input class="form-control" type="number" min="1" aria-label="Quantity received" data-dll="${i}.qty" value="${l.qty}" style="width:90px"></td><td><input class="form-control" type="number" min="0" step="0.01" aria-label="Unit cost" data-dll="${i}.cost" value="${l.cost}" style="width:110px"></td>
 <td><input class="form-control" type="date" aria-label="Expiration date" data-dll="${i}.exp" value="${l.exp}" ${per ? "" : "disabled"} style="width:160px">${per ? "" : '<div class="small-muted">Not needed</div>'}</td><td class="text-end">${peso((+l.qty || 0) * (+l.cost || 0))}</td><td><button class="btn btn-outline-secondary btn-sm" data-act="delLineRm" data-a="${i}" aria-label="Remove line"><i class="bi bi-trash"></i></button></td></tr>`;
    })
    .join("");
const dlSum = () =>
  S.dl.lines.reduce((s, l) => s + (+l.qty || 0) * (+l.cost || 0), 0);
const dlTotal = () => ($("#dlTotal").textContent = peso(dlSum()));
const dlNextRef = () => "DR-" + String(S.n.del).padStart(4, "0");
V["delivery-new"] = () => {
  if (!S.dl)
    S.dl = {
      sup: "",
      ref: dlNextRef(),
      date: off(0),
      notes: "",
      lines: [{ pid: "", qty: "", cost: "", exp: "" }],
    };
  const d = S.dl;
  return (
    pageHead(
      "New Delivery",
      "Record products received from a supplier.",
      `<a class="btn btn-outline-secondary" href="#/deliveries">Cancel</a>`,
    ) +
    simNote("Saving updates the sample stock on screen only.") +
    dataCard({
      title: "Delivery details",
      meta: "Fields marked * are required",
      pad: true,
      body: `<div id="dlErr" role="alert"></div><div class="row g-3 mb-3">
 ${fld("dsup", "Supplier", { val: d.sup, opts: [["", "Select supplier"]].concat(S.suppliers.filter((s) => s.active).map((s) => [s.id, s.name])), attrs: 'data-dl="sup"', col: "col-md-4" })}${fld("dref", "Delivery reference", { val: d.ref, attrs: 'data-dl="ref"', col: "col-md-4" })}${fld("ddate", "Delivery date", { type: "date", val: d.date, attrs: 'data-dl="date"', col: "col-md-4" })}${fld("dnotes", "Notes", { type: "textarea", val: d.notes, req: false, attrs: 'data-dl="notes"', col: "col-12" })}</div>
 <div class="table-responsive"><table class="table"><thead><tr><th>Product</th><th>Quantity</th><th>Unit cost (₱)</th><th>Expiration date</th><th class="text-end">Line total</th><th></th></tr></thead><tbody id="lines">${dlLines()}</tbody></table></div>
 <div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><button class="btn btn-outline-primary" data-act="delLineAdd"><i class="bi bi-plus-lg"></i> Add item</button><div class="fs-5">Total: <b id="dlTotal">${peso(dlSum())}</b></div></div>
 <div class="text-end mt-3"><button class="btn btn-primary" data-act="delSave">Save Delivery</button></div>`,
    })
  );
};
A.delLineAdd = () => {
  S.dl.lines.push({ pid: "", qty: "", cost: "", exp: "" });
  $("#lines").innerHTML = dlLines();
};
A.delLineRm = (i) => {
  if (S.dl.lines.length === 1)
    return toast("A delivery needs at least one item.", "err");
  S.dl.lines.splice(i, 1);
  $("#lines").innerHTML = dlLines();
  dlTotal();
};
A.delSave = () => {
  if (!guard(hasOp("deliveries"))) return;
  const d = S.dl,
    er = [];
  if (!d.sup) er.push("Select a supplier.");
  if (!d.ref.trim()) er.push("Enter a delivery reference.");
  else if (S.deliveries.some((x) => x.ref === d.ref.trim()))
    er.push("This delivery reference already exists.");
  if (!d.date) er.push("Select the delivery date.");
  d.lines.forEach((l, i) => {
    const p = prod(l.pid),
      n = `Item ${i + 1}: `;
    if (!p) return er.push(n + "select a product.");
    if (!(+l.qty > 0 && Number.isInteger(+l.qty)))
      er.push(n + "enter a whole-number quantity above 0.");
    if (l.cost === "" || +l.cost < 0) er.push(n + "enter the unit cost.");
    if (p.type === "Perishable" && (!l.exp || l.exp <= d.date))
      er.push(n + "enter an expiration date after the delivery date.");
  });
  $("#dlErr").innerHTML = er.length
    ? `<div class="alert alert-danger"><b>Please fix:</b><ul class="mb-0">${er.map((e) => `<li>${e}</li>`).join("")}</ul></div>`
    : "";
  if (er.length) return window.scrollTo(0, 0);
  confirmBox(
    "Save this delivery?",
    `${d.lines.length} item(s), total ${peso(dlSum())}. Stock will increase (simulated).`,
    () => {
      const ref = d.ref.trim();
      S.deliveries.unshift({
        ref,
        date: d.date,
        sup: +d.sup,
        notes: d.notes,
        lines: d.lines.map((l) => ({
          pid: +l.pid,
          qty: +l.qty,
          cost: +l.cost,
          exp: l.exp || null,
        })),
      });
      S.n.del++;
      d.lines.forEach((l) => {
        addBatch(+l.pid, +l.qty, l.exp, +d.sup);
        S.batches[S.batches.length - 1].arr = d.date;
        prod(l.pid).cost = +l.cost;
        logMove(+l.pid, "Delivery", +l.qty, ref, "Stock received");
      });
      logAudit(
        "Delivery",
        `Saved delivery ${ref} from ${supOf(d.sup).name}: ${d.lines.length} item(s), ${peso(dlSum())}`,
      );
      S.dl = null;
      location.hash = "#/deliveries";
      toast(`Delivery ${ref} saved. Stock updated (simulated).`);
    },
    "Save delivery",
  );
};
/* ---- Spoilage and Returns ---- */
RES.spo = () => {
  const k = F.spo.kind,
    L = S.spoilage.filter((s) => !k || s.kind === k);
  return dataCard({
    title: "Spoilage and return records",
    meta: `${L.length} record${L.length === 1 ? "" : "s"}`,
    body: tbl(
      [
        "ID",
        "Date",
        "Type",
        "Product",
        "Qty",
        "Reason",
        "Condition",
        "Sale ref",
        "Disposition",
      ],
      sl(L, "spo").map(
        (s) =>
          `<tr><td><b>${s.id}</b></td><td>${dfmt(s.date)}</td><td>${s.kind}</td><td>${esc(prod(s.pid).name)}</td><td>${s.qty}</td><td>${esc(s.reason)}</td><td>${esc(s.cond)}</td><td>${s.saleRef || "—"}</td><td>${s.disp}</td></tr>`,
      ),
      "No records yet.",
    ),
    foot: pager("spo", L.length),
  });
};
V.spoilage = () =>
  pageHead(
    "Spoilage and Returns",
    "Record spoiled or returned products.",
    `<button class="btn btn-primary" data-act="spoilForm" data-a="Spoilage"><i class="bi bi-plus-lg"></i> Record Spoilage</button><button class="btn btn-outline-primary" data-act="spoilForm" data-a="Return"><i class="bi bi-arrow-return-left"></i> Record Return</button>`,
  ) +
  toolbar([
    tbSelect(
      "spo.kind",
      [
        ["", "Spoilage and returns"],
        ["Spoilage", "Spoilage only"],
        ["Return", "Returns only"],
      ],
      "Record Type",
    ),
  ]) +
  `<div id="res">${RES.spo()}</div>`;
A.spoilForm = (kind, batchId) => {
  if (!guard(hasOp("spoilage"))) return;
  const b = batchId ? S.batches.find((x) => x.id == batchId) : null,
    R = kind === "Return",
    reasons = R
      ? [
          "Wrong item",
          "Damaged",
          "Customer changed mind",
          "Expired product sold",
          "Other",
        ]
      : ["Expired", "Spoiled", "Damaged", "Other"];
  const bo = (pid) =>
    [["", "No specific batch"]].concat(
      S.batches
        .filter((x) => x.pid == pid && (R || x.qty > 0))
        .map((x) => [
          x.id,
          `${x.ref} (${x.qty} left${x.exp ? ", exp " + dfmt(x.exp) : ""})`,
        ]),
    );
  modal({
    title: "Record " + kind,
    size: "modal-lg",
    ok: "Save Record",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("sp_p", "Product", { val: b ? b.pid : "", opts: [["", "Select product"]].concat(S.products.filter((p) => p.active).map((p) => [p.id, p.name])) })}${fld("sp_b", "Batch", { req: !R && false, val: b ? b.id : "", opts: bo(b ? b.pid : "") })}
 ${fld("sp_q", "Quantity", { type: "number", attrs: 'min="1"' })}${fld("sp_d", "Date", { type: "date", val: off(0) })}${fld("sp_r", "Reason", { opts: [["", "Select reason"]].concat(reasons.map((r) => [r, r])) })}${fld(
   "sp_c",
   "Product condition",
   {
     opts: [
       ["", "Select condition"],
       ["Good — sealed", "Good — sealed"],
       ["Damaged", "Damaged"],
       ["Expired", "Expired"],
       ["Spoiled", "Spoiled"],
     ],
   },
 )}
 ${R ? fld("sp_s", "Related sale", { opts: [["", "Select sale"]].concat(S.sales.map((s) => [s.ref, `${s.ref} — ${dfmt(s.dt)}`])) }) : ""}${fld("sp_x", "Disposition", { opts: [["", "Select"], ...(R ? ["Return to stock", "Discard", "Return to supplier"] : ["Discard", "Return to supplier"]).map((x) => [x, x])], hint: R ? "Only choose “Return to stock” if the item can be sold again." : "" })}</form>`,
    onShow: () =>
      $("#sp_p").addEventListener("change", (e) => {
        $("#sp_b").innerHTML = bo(e.target.value)
          .map(([v, l]) => `<option value="${v}">${esc(l)}</option>`)
          .join("");
      }),
    onOk: () => {
      clearErr();
      const q = +val("sp_q"),
        bt = val("sp_b") ? S.batches.find((x) => x.id == val("sp_b")) : null,
        pid = +val("sp_p");
      const ok = [
        check("sp_p", pid, "Select a product."),
        check(
          "sp_q",
          Number.isInteger(q) && q > 0,
          "Enter a whole number above 0.",
        ),
        check(
          "sp_q",
          R || !pid || q <= (bt ? bt.qty : stockOf(pid)),
          `Only ${bt ? bt.qty : stockOf(pid)} available.`,
        ),
        check("sp_d", val("sp_d"), "Select a date."),
        check("sp_r", val("sp_r"), "Select a reason."),
        check("sp_c", val("sp_c"), "Select the condition."),
        check("sp_x", val("sp_x"), "Select what happens to the item."),
      ];
      if (R) ok.push(check("sp_s", val("sp_s"), "Select the related sale."));
      if (ok.includes(false)) return false;
      const id = "SP-" + String(S.n.spo++).padStart(4, "0"),
        disp = val("sp_x");
      S.spoilage.unshift({
        id,
        date: val("sp_d"),
        kind,
        pid,
        batch: bt ? bt.ref : "",
        qty: q,
        reason: val("sp_r"),
        cond: val("sp_c"),
        saleRef: R ? val("sp_s") : "",
        disp,
        user: S.user.name,
      });
      if (!R) {
        bt ? (bt.qty -= q) : deduct(pid, q);
        logMove(pid, "Spoilage", -q, id, val("sp_r"));
      } else if (disp === "Return to stock") {
        bt ? (bt.qty += q) : addBatch(pid, q, null, null);
        logMove(pid, "Return", q, val("sp_s"), "Returned to stock");
      } else logMove(pid, "Return", 0, val("sp_s"), `Returned item — ${disp}`);
      logAudit(
        "Stock",
        `${kind} ${id}: ${prod(pid).name} ×${q} (${val("sp_r")}, ${disp})`,
      );
      toast("Record saved. Stock updated (simulated).");
      refresh();
    },
  });
};
/* ---- Stock Movements ---- */
const movTypes = ["Delivery", "Sale", "Spoilage", "Return", "Adjustment"];
RES.mov = () => {
  const f = F.mov,
    L = S.movements
      .filter(
        (m) =>
          (!f.from || m.dt.slice(0, 10) >= f.from) &&
          (!f.to || m.dt.slice(0, 10) <= f.to) &&
          (!f.pid || m.pid == f.pid) &&
          (!f.type || m.type === f.type),
      )
      .sort((a, b) => b.dt.localeCompare(a.dt));
  return dataCard({
    title: "Movement log",
    meta: `${L.length} movement${L.length === 1 ? "" : "s"}`,
    body: tbl(
      [
        "Date & time",
        "Product",
        "Movement",
        "Qty",
        "Reference",
        "User",
        "Reason",
      ],
      sl(L, "mov").map(
        (m) =>
          `<tr><td>${dtfmt(m.dt)}</td><td>${esc(prod(m.pid).name)}</td><td>${m.type} <span class="small-muted">(${m.qty > 0 ? "stock in" : m.qty < 0 ? "stock out" : "no change"})</span></td><td><b>${m.qty > 0 ? "+" : ""}${m.qty}</b></td><td>${m.ref || "—"}</td><td>${esc(m.user)}</td><td>${esc(m.reason) || "—"}</td></tr>`,
      ),
      "No movements match the filters.",
    ),
    foot: pager("mov", L.length),
  });
};
V.movements = () =>
  pageHead(
    "Stock Movements",
    "History of stock coming in and going out.",
    hasOp("adjust")
      ? `<button class="btn btn-primary" data-act="adjForm"><i class="bi bi-plus-slash-minus"></i> Record Adjustment</button>`
      : "",
  ) +
  toolbar([
    tbDate("mov.from", "From date"),
    tbDate("mov.to", "To date"),
    tbSelect(
      "mov.pid",
      [["", "All products"]].concat(S.products.map((p) => [p.id, p.name])),
      "Product",
    ),
    tbSelect(
      "mov.type",
      [["", "All types"]].concat(movTypes.map((t) => [t, t])),
      "Movement Type",
    ),
  ]) +
  `<div id="res">${RES.mov()}</div>`;
A.adjForm = () => {
  if (!guard(hasOp("adjust"))) return;
  modal({
    title: "Record Adjustment",
    ok: "Save Adjustment",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("aj_p", "Product", { col: "col-12", opts: [["", "Select product"]].concat(S.products.filter((p) => p.active).map((p) => [p.id, p.name])) })}${fld("aj_q", "Quantity change", { type: "number", hint: "Use a minus sign to reduce stock, e.g. -2" })}${fld("aj_r", "Reason", { type: "textarea", col: "col-12" })}</form>`,
    onOk: () => {
      clearErr();
      const pid = +val("aj_p"),
        q = +val("aj_q");
      const ok = [
        check("aj_p", pid, "Select a product."),
        check(
          "aj_q",
          Number.isInteger(q) && q !== 0,
          "Enter a whole number that is not 0.",
        ),
        check(
          "aj_q",
          !pid || q > 0 || -q <= stockOf(pid),
          `Only ${stockOf(pid)} in stock.`,
        ),
        check("aj_r", val("aj_r"), "Give a reason."),
      ];
      if (ok.includes(false)) return false;
      q > 0 ? addBatch(pid, q, null, null) : deduct(pid, -q);
      logMove(pid, "Adjustment", q, "", val("aj_r"));
      logAudit(
        "Stock",
        `Adjustment ${q > 0 ? "+" : ""}${q} ${prod(pid).name}: ${val("aj_r")}`,
      );
      toast("Adjustment saved (simulated).");
      refresh();
    },
  });
};
