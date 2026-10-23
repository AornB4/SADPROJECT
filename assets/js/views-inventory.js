/* ===== Products, Inventory, Deliveries, Expiration, Spoilage/Returns, Movements ===== */
const sl = (L, k) => L.slice((P[k] - 1) * PER, P[k] * PER);
const has = (s, q) => !q || s.toLowerCase().includes(q.toLowerCase());
const canEdit = () => isMgr();
/* ---- Product details panel (closed by default) ---- */
A.view = (pid) => {
  const p = prod(pid);
  openPanel(
    p.name,
    kv([
        ["Product code", p.code],
        ["Category", esc(catName(p.cat))],
        ["Type", p.type],
        ["Unit", p.unit],
        ...(isMgr() ? [["Purchase cost", peso(p.cost)]] : []),
        ["Selling price", peso(p.price)],
        ["Status", activePill(p.active)],
      ]) +
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
      tbl(
        [
          "Product",
          "Category",
          "Available Stock",
          "Minimum Stock",
          "Expiration Date",
        ],
        sl(L, "inv").map(
          (p) =>
            `<tr><td><b>${esc(p.name)}</b><div class="small-muted">${p.code}</div></td><td>${esc(catName(p.cat))}</td><td>${stockPill(p)}</td><td>${p.min}</td><td>${expCell(p)}</td></tr>`,
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
  S.prodSel = (S.prodSel || []).filter((id) => L.some((p) => p.id === id));
  const selected = new Set(S.prodSel),
    allSelected = m && L.length > 0 && L.every((p) => selected.has(p.id));
  const actionHead = m
    ? `<span class="d-inline-flex align-items-center gap-2"><input class="form-check-input mt-0" type="checkbox" aria-label="Select all visible products" data-act="prodSelectAll" ${allSelected ? "checked" : ""}><span>Action</span><button class="btn btn-sm table-action action-edit" data-act="prodUpdateSelected" aria-label="Update selected product${S.prodSel.length === 1 ? "" : "s"}" ${S.prodSel.length === 1 ? "" : "disabled"}><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm table-action action-status" data-act="prodArchiveSelected" aria-label="Archive selected products" ${S.prodSel.length ? "" : "disabled"}><i class="bi bi-archive"></i></button></span>`
    : "Action";
  const productActions = `<div class="action-legend admin-action-legend" aria-label="Product actions"><span class="action-legend-title">Actions</span>${hasOp("products") ? '<span class="action-legend-item delivery-action-item"><i class="bi bi-plus-lg" aria-hidden="true"></i><b>Add Product</b><span class="delivery-action-purpose">Create a new product record.</span></span>' : ""}${m ? '<span class="action-legend-item delivery-action-item"><i class="bi bi-pencil-square action-edit" aria-hidden="true"></i><b>Update</b><span class="delivery-action-purpose">Modify selected product information.</span></span><span class="action-legend-item delivery-action-item"><i class="bi bi-archive action-status" aria-hidden="true"></i><b>Archive</b><span class="delivery-action-purpose">Hide selected products from active lists.</span></span>' : ""}</div>`;
  const heads = ["Code", "Product", "Category", "Type"].concat(
    m ? ["Cost"] : [],
    ["Price", "Min. stock", actionHead],
  );
  return dataCard({
    title: "Product list",
    meta: `${L.length} product${L.length === 1 ? "" : "s"}`,
    body:
      productActions +
      tbl(
        heads,
        sl(L, "prod").map(
          (p) =>
            `<tr><td>${p.code}</td><td><b>${esc(p.name)}</b><div class="small-muted">${esc(p.unit)}</div>${p.active ? "" : activePill(0)}</td><td>${esc(catName(p.cat))}</td><td>${p.type}</td>${m ? `<td>${peso(p.cost)}</td>` : ""}<td>${peso(p.price)}</td><td>${p.min}</td><td>${m ? `<input class="form-check-input" type="checkbox" aria-label="Select ${esc(p.name)}" data-act="prodSelect" data-a="${p.id}" ${selected.has(p.id) ? "checked" : ""}>` : '<span class="muted">—</span>'}</td></tr>`,
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
 ${fld("pcat", "Category", { val: p.cat, opts: catOpts(false, p.cat), hint: "Product type is determined by the selected category." })}${fld("pt", "Product type", { val: p.type, attrs: 'readonly', hint: "Derived from category configuration." })}
 ${fld("pu", "Unit of measurement", { val: p.unit, hint: "Piece, Liter, Kilogram, Pack…" })}${fld("pm", "Minimum stock", { type: "number", val: p.min, attrs: 'min="0"' })}${fld("pco", "Purchase cost (₱)", { type: "number", val: p.cost, attrs: 'min="0" step="0.01"' })}${fld("ps", "Selling price (₱)", { type: "number", val: p.price, attrs: 'min="0" step="0.01"' })}</form>`,
    onOk: () => {
      clearErr();
      const code = val("pc").toUpperCase(),
        category = catOf(val("pcat")),
        type = category && category.type,
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
        check("pt", type && val("pt") === type, "Select a category with a valid classification."),
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
        type,
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
    p.active ? "Archive product?" : "Restore product?",
    p.active
      ? `“${esc(p.name)}” will be hidden from product lists, stock, and sales. The record and its history are kept.`
      : `“${esc(p.name)}” will be available again.`,
    () => {
      p.active = !p.active;
      logAudit(
        "Product",
        `${p.active ? "Restored" : "Archived"} product ${p.code} – ${p.name}`,
      );
      toast(
        p.active
          ? "Product restored."
          : "Product archived. History is kept.",
      );
      S.prodSel = (S.prodSel || []).filter((selectedId) => selectedId !== p.id);
      refresh();
    },
    p.active ? "Archive" : "Restore",
    p.active,
  );
};
A.prodSelect = (id, _, t) => {
  if (!isMgr()) return;
  const selected = new Set(S.prodSel || []);
  if (t.checked) selected.add(+id);
  else selected.delete(+id);
  S.prodSel = [...selected];
  refresh();
};
A.prodSelectAll = (_, __, t) => {
  if (!isMgr()) return;
  const f = F.prod,
    st = f.status,
    visible = S.products.filter(
      (p) =>
        has(p.name + p.code, f.q) &&
        (!f.cat || p.cat == f.cat) &&
        (!f.type || p.type === f.type) &&
        (st === "all" || (st === "active") === p.active),
    );
  S.prodSel = t.checked ? visible.map((p) => p.id) : [];
  refresh();
};
A.prodUpdateSelected = () => {
  if (!guard(isMgr())) return;
  if ((S.prodSel || []).length !== 1) {
    toast("Select exactly one product to update.", "err");
    return;
  }
  A.prodForm(S.prodSel[0]);
};
A.prodArchiveSelected = () => {
  if (!guard(isMgr())) return;
  const selected = (S.prodSel || [])
    .map((id) => prod(id))
    .filter((p) => p);
  if (!selected.length) {
    toast("Select at least one product to archive.", "err");
    return;
  }
  const active = selected.filter((p) => p.active);
  if (!active.length) {
    toast("The selected products are already archived.", "err");
    return;
  }
  confirmBox(
    "Archive selected products?",
    `${active.length} product${active.length === 1 ? "" : "s"} will be hidden from product lists, stock, and sales. Their records and history will be kept.`,
    () => {
      active.forEach((p) => {
        p.active = false;
        p.archived = true;
        logAudit("Product", `Archived product ${p.code} – ${p.name}`);
      });
      S.prodSel = [];
      toast(`${active.length} product${active.length === 1 ? "" : "s"} archived.`);
      refresh();
    },
    "Archive",
    true,
  );
};
/* ---- Deliveries ---- */
const deliverySupplier = (d) => {
  const current = supOf(d.sup) || {};
  return {
    id: d.sup,
    name: d.supName || current.name || "—",
    contact: d.supContact || current.contact || "—",
    phone: d.supPhone || current.phone || "—",
    address: d.supAddress || current.address || "—",
  };
};
const deliveryLineProduct = (l) => {
  const p = prod(l.pid);
  return {
    code: l.code || (p && p.code) || "—",
    name: l.name || (p && p.name) || "—",
    category: l.category || (p && catName(p.cat)) || "—",
    type: l.type || (p && p.type) || "—",
    unit: l.unit || (p && p.unit) || "—",
  };
};
RES.del = () => {
  const f = F.del,
    L = S.deliveries.filter((d) =>
      has(d.ref + " " + supOf(d.sup).name, f.q),
    );
  S.delSel = (S.delSel || []).filter((ref) => L.some((d) => d.ref === ref));
  const selected = new Set(S.delSel),
    allSelected = L.length > 0 && L.every((d) => selected.has(d.ref));
  const actionHead = `<span class="d-inline-flex align-items-center gap-2"><input class="form-check-input mt-0" type="checkbox" aria-label="Select all visible deliveries" data-act="delSelectAll" ${allSelected ? "checked" : ""}><span>Action</span><button class="btn btn-sm table-action action-view" data-act="delViewSelected" aria-label="View selected deliver${S.delSel.length === 1 ? "y" : "ies"}" ${S.delSel.length ? "" : "disabled"}><i class="bi bi-eye"></i></button></span>`;
  const deliveryActions = `<div class="action-legend delivery-action-legend" aria-label="Delivery actions"><span class="action-legend-title">Actions</span><span class="action-legend-item delivery-action-item"><i class="bi bi-plus-lg" aria-hidden="true"></i><b>New Delivery</b><span class="delivery-action-purpose">Record stock received from a supplier.</span></span><span class="action-legend-item delivery-action-item"><i class="bi bi-eye action-view" aria-hidden="true"></i><b>View</b><span class="delivery-action-purpose">Open the details of selected delivery records.</span></span><span class="action-legend-item delivery-action-item"><i class="bi bi-printer" aria-hidden="true"></i><b>Print receiving document</b><span class="delivery-action-purpose">Print the receiving document for a delivery.</span></span></div>`;
  return dataCard({
    title: "Delivery records",
    meta: `${L.length} ${L.length === 1 ? "delivery" : "deliveries"}`,
    body:
      deliveryActions +
      tbl(
        ["Reference", "Supplier receipt", "Date", "Supplier", "Items", "Total cost", actionHead],
        sl(L, "del").map(
          (d) =>
            `<tr><td><b>${esc(d.ref)}</b></td><td>${esc(d.receiptRef || "—")}</td><td>${dfmt(d.date)}</td><td>${esc(deliverySupplier(d).name)}</td><td>${d.lines.length}</td><td>${peso(d.lines.reduce((s, l) => s + l.qty * l.cost, 0))}</td><td><input class="form-check-input" type="checkbox" aria-label="Select delivery ${esc(d.ref)}" data-act="delSelect" data-a="${esc(d.ref)}" ${selected.has(d.ref) ? "checked" : ""}></td></tr>`,
        ),
        "No deliveries recorded yet.",
      ),
    foot: pager("del", L.length),
  });
};
A.delSelect = (ref, _, t) => {
  const selected = new Set(S.delSel || []);
  if (t.checked) selected.add(ref);
  else selected.delete(ref);
  S.delSel = [...selected];
  refresh();
};
A.delSelectAll = (_, __, t) => {
  const f = F.del,
    visible = S.deliveries.filter((d) =>
      has(d.ref + " " + supOf(d.sup).name, f.q),
    );
  S.delSel = t.checked ? visible.map((d) => d.ref) : [];
  refresh();
};
A.delViewSelected = () => {
  const deliveries = (S.delSel || [])
    .map((ref) => S.deliveries.find((d) => d.ref === ref))
    .filter(Boolean);
  if (!deliveries.length) {
    toast("Select at least one delivery to view.", "err");
    return;
  }
  if (deliveries.length === 1) return A.delView(deliveries[0].ref);
  openPanel(
    `${deliveries.length} Selected Deliveries`,
    `<div class="delivery-detail-list">${deliveries.map(deliveryDetails).join('<hr class="my-4">')}</div>`,
  );
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
  if (d) openPanel("Delivery " + ref, deliveryDetails(d));
};
const deliveryDetails = (d) =>
  `<div class="d-flex justify-content-between align-items-center mb-3"><b>Delivery summary</b><button class="btn btn-sm btn-outline-primary" data-act="delPrint" data-a="${esc(d.ref)}"><i class="bi bi-printer"></i> Print receiving document</button></div>` +
  kv([
    ["System reference", esc(d.ref)],
    ["Supplier receipt / invoice", esc(d.receiptRef || "—")],
    ["Date", dfmt(d.date)],
    ["Status", esc(d.status || "Posted")],
    ["Supplier", esc(deliverySupplier(d).name)],
    ["Supplier ID", esc(deliverySupplier(d).id)],
    ["Contact person", esc(deliverySupplier(d).contact || "—")],
    ["Phone", esc(deliverySupplier(d).phone || "—")],
    ["Address", esc(deliverySupplier(d).address || "—")],
    ["Delivery personnel", esc(d.deliveryPersonnel || "—")],
    ["Receiving personnel", esc(d.receivingPersonnel || "—")],
    ["Notes", esc(d.notes) || "—"],
  ]) +
  `<div class="mt-3">${tbl(
    ["Code", "Product", "Category", "Type", "Unit", "Qty", "Cost", "Line total", "Expires", "Batch"],
    d.lines.map(
      (l) => {
        const p = deliveryLineProduct(l);
        return `<tr><td>${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${esc(p.type)}</td><td>${esc(p.unit)}</td><td>${l.qty}</td><td>${peso(l.cost)}</td><td>${peso(l.qty * l.cost)}</td><td>${dfmt(l.exp)}</td><td>${esc(l.batchRef || "—")}</td></tr>`;
      },
    ),
  )}</div><div class="text-end mt-3"><b>Total: ${peso(d.lines.reduce((s, l) => s + l.qty * l.cost, 0))}</b></div>`;
A.delPrint = (ref) => printDelivery(ref);
function printDelivery(ref) {
  const d = S.deliveries.find((x) => x.ref === ref);
  if (!d) return toast("Receiving document could not be generated.", "err");
  const supplier = deliverySupplier(d);
  const area = $("#print-area");
  area.innerHTML = `<div class="receipt"><div class="text-center"><b>STA. MONICA OF BUSTOS<br>MULTIPURPOSE COOPERATIVE</b><br><b>Goods Received Note</b><br><small>System-generated document — NOT AN OFFICIAL SUPPLIER OR TAX RECEIPT</small></div><hr>System reference: ${esc(d.ref)}<br>Supplier receipt/invoice: ${esc(d.receiptRef || "—")}<br>Date: ${dfmt(d.date)}<br>Posted: ${esc(d.postedAt || "—")}<hr>Supplier ID: ${esc(supplier.id)}<br>Supplier: ${esc(supplier.name)}<br>Contact: ${esc(supplier.contact || "—")}<br>Phone: ${esc(supplier.phone || "—")}<br>Address: ${esc(supplier.address || "—")}<br>Delivery personnel: ${esc(d.deliveryPersonnel || "—")}<br>Receiving personnel: ${esc(d.receivingPersonnel || "—")}<hr><table>${d.lines.map((l) => { const p = deliveryLineProduct(l); return `<tr><td>${esc(p.code)}</td><td>${esc(p.name)}<br><small>${esc(p.category)} · ${esc(p.type)} · ${esc(p.unit)}</small></td><td>${l.qty}</td><td>${peso(l.cost)}</td><td>${peso(l.qty * l.cost)}</td><td>${dfmt(l.exp)}</td></tr>`; }).join("")}</table><hr><b>Total: ${peso(d.lines.reduce((s, l) => s + l.qty * l.cost, 0))}</b><br>Notes: ${esc(d.notes || "—")}</div>`;
  document.body.classList.add("printing-receipt");
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing-receipt");
    area.innerHTML = "";
  }, { once: true });
  setTimeout(() => window.print(), 300);
}
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
      return `<tr><td><select class="form-select" aria-label="Product" data-dll="${i}.pid" style="width:100%;min-width:170px"><option value="">Select product</option>${S.products
        .filter((p) => p.active)
        .map(
          (p) =>
            `<option value="${p.id}" ${p.id == l.pid ? "selected" : ""}>${esc(p.name)}</option>`,
        )
        .join("")}</select></td>
 <td><input class="form-control" type="number" min="1" aria-label="Quantity received" data-dll="${i}.qty" value="${l.qty}" style="width:100%;min-width:80px"></td><td><input class="form-control" type="number" min="0" step="0.01" aria-label="Unit cost" data-dll="${i}.cost" value="${l.cost}" style="width:100%;min-width:90px"></td>
 <td><input class="form-control" type="date" aria-label="Expiration date" data-dll="${i}.exp" value="${l.exp}" ${per ? "" : "disabled"} style="width:100%;min-width:150px">${per ? "" : '<div class="small-muted">Not needed</div>'}</td><td class="text-end">${peso((+l.qty || 0) * (+l.cost || 0))}</td><td><button class="btn btn-outline-secondary btn-sm" data-act="delLineRm" data-a="${i}" aria-label="Remove line"><i class="bi bi-trash"></i></button></td></tr>`;
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
      receiptRef: "",
      deliveryPersonnel: "",
      receivingPersonnel: "",
      notes: "",
      lines: [{ pid: "", qty: "", cost: "", exp: "" }],
    };
  const d = S.dl,
    supplier = d.sup ? supOf(d.sup) : null;
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
 ${fld("dsup", "Supplier", { val: d.sup, opts: [["", "Select supplier"]].concat(S.suppliers.filter((s) => s.active).map((s) => [s.id, s.name])), attrs: 'data-dl="sup"', col: "col-md-4" })}${fld("dref", "System delivery reference", { val: d.ref, attrs: 'data-dl="ref" readonly', col: "col-md-4" })}${fld("ddate", "Delivery date", { type: "date", val: d.date, attrs: 'data-dl="date"', col: "col-md-4" })}${fld("dsupid", "Supplier ID", { val: supplier ? supplier.id : "", attrs: "readonly", col: "col-md-4" })}${fld("dsupname", "Supplier name", { val: supplier ? supplier.name : "", attrs: "readonly", col: "col-md-4" })}${fld("dsupcontact", "Contact person", { val: supplier ? supplier.contact : "", attrs: "readonly", col: "col-md-4" })}${fld("dsupphone", "Supplier phone", { val: supplier ? supplier.phone : "", attrs: "readonly", col: "col-md-4" })}${fld("dsupaddress", "Supplier address", { val: supplier ? supplier.address : "", attrs: "readonly", col: "col-12" })}${fld("dreceipt", "Supplier delivery receipt / invoice no.", { val: d.receiptRef, attrs: 'data-dl="receiptRef"', col: "col-md-4" })}${fld("ddp", "Delivery personnel", { val: d.deliveryPersonnel, attrs: 'data-dl="deliveryPersonnel"', col: "col-md-4" })}${fld("drp", "Receiving personnel", { val: d.receivingPersonnel, attrs: 'data-dl="receivingPersonnel"', col: "col-md-4" })}${fld("dnotes", "Notes", { type: "textarea", val: d.notes, req: false, attrs: 'data-dl="notes"', col: "col-12" })}</div>
 <div class="table-responsive"><table class="table"><colgroup><col style="width:30%"><col style="width:13%"><col style="width:16%"><col style="width:21%"><col style="width:13%"><col style="width:7%"></colgroup><thead><tr><th>Product</th><th>Quantity</th><th>Unit cost (₱)</th><th>Expiration date</th><th class="text-end">Line total</th><th></th></tr></thead><tbody id="lines">${dlLines()}</tbody></table></div>
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
  if (!String(d.receiptRef || "").trim()) er.push("Enter the supplier receipt or invoice number.");
  else if (S.deliveries.some((x) => x.sup == d.sup && String(x.receiptRef || "").trim().toLowerCase() === d.receiptRef.trim().toLowerCase()))
    er.push("This supplier receipt or invoice number is already recorded for this supplier.");
  if (!String(d.deliveryPersonnel || "").trim()) er.push("Enter the delivery personnel.");
  if (!String(d.receivingPersonnel || "").trim()) er.push("Enter the receiving personnel.");
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
      const supplier = supOf(d.sup),
        saved = {
        ref,
        date: d.date,
        sup: +d.sup,
        supName: supplier.name,
        supContact: supplier.contact,
        supPhone: supplier.phone,
        supAddress: supplier.address,
        receiptRef: d.receiptRef.trim(),
        status: "Posted",
        postedAt: nowStamp(),
        deliveryPersonnel: d.deliveryPersonnel,
        receivingPersonnel: d.receivingPersonnel,
        notes: d.notes,
        lines: d.lines.map((l) => ({
          pid: +l.pid,
          qty: +l.qty,
          cost: +l.cost,
          exp: l.exp || null,
          ...deliveryLineProduct(l),
        })),
      };
      if (S.deliveries.some((x) => x.ref === ref)) return toast("This delivery was already posted.", "err");
      S.deliveries.unshift(saved);
      S.n.del++;
      d.lines.forEach((l, i) => {
        addBatch(+l.pid, +l.qty, l.exp, +d.sup, ref + "-L" + (i + 1));
        S.batches[S.batches.length - 1].arr = d.date;
        const batch = S.batches[S.batches.length - 1];
        batch.deliveryRef = ref;
        batch.deliveryLine = i + 1;
        batch.receiptRef = d.receiptRef.trim();
        saved.lines[i].batchRef = batch.ref;
        logMove(+l.pid, "Delivery", +l.qty, ref, "Stock received");
      });
      logAudit(
        "Delivery",
        `Saved delivery ${ref} from ${supOf(d.sup).name}: ${d.lines.length} item(s), ${peso(dlSum())}`,
      );
      S.dl = null;
      location.hash = "#/deliveries";
      toast(`Delivery ${ref} saved. Stock updated (simulated).`);
      setTimeout(() => printDelivery(ref), 0);
    },
    "Save delivery",
  );
};
/* ---- Spoilage and Returns ---- */
RES.spo = () => {
  const k = F.spo.kind,
    m = isMgr(),
    L = S.spoilage.filter(
      (s) => !s.archived && (!k || (k === "Return" ? s.kind === "Supplier Return" : s.kind === k)),
    );
  S.spoSel = (S.spoSel || []).filter((id) => L.some((s) => s.id === id));
  const selected = new Set(S.spoSel),
    allSelected = L.length > 0 && L.every((s) => selected.has(s.id)),
    actionHead = m
      ? `<span class="d-inline-flex align-items-center gap-2"><input class="form-check-input mt-0" type="checkbox" aria-label="Select all visible adjustment and return records" data-act="spoSelectAll" ${allSelected ? "checked" : ""}><span>Action</span><button class="btn btn-sm table-action action-edit" data-act="spoUpdateSelected" aria-label="Update selected record${S.spoSel.length === 1 ? "" : "s"}" ${S.spoSel.length === 1 ? "" : "disabled"}><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm table-action action-status" data-act="spoArchiveSelected" aria-label="Archive selected records" ${S.spoSel.length ? "" : "disabled"}><i class="bi bi-archive"></i></button></span>`
      : "Action";
  const adjustmentActions = `<div class="action-legend adjustment-action-legend" aria-label="Adjustment and return actions"><span class="action-legend-title">Actions</span><span class="action-legend-item delivery-action-item"><i class="bi bi-plus-slash-minus" aria-hidden="true"></i><b>Record Adjustment</b><span class="delivery-action-purpose">Correct or update a product's stock quantity.</span></span><span class="action-legend-item delivery-action-item"><i class="bi bi-arrow-return-left" aria-hidden="true"></i><b>Record Return</b><span class="delivery-action-purpose">Record goods returned to a supplier.</span></span>${m ? '<span class="action-legend-item delivery-action-item"><i class="bi bi-pencil-square action-edit" aria-hidden="true"></i><b>Update</b><span class="delivery-action-purpose">Modify a selected adjustment or return record.</span><span class="action-legend-item delivery-action-item"><i class="bi bi-archive action-status" aria-hidden="true"></i><b>Archive</b><span class="delivery-action-purpose">Hide selected records from the active list.</span></span>' : ""}</div>`;
  return dataCard({
    title: "Spoilage and return records",
    meta: `${L.length} record${L.length === 1 ? "" : "s"}`,
    body: adjustmentActions + tbl(
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
        actionHead,
      ],
      sl(L, "spo").map(
        (s) =>
          `<tr><td><b>${esc(s.id)}</b></td><td>${dfmt(s.date)}</td><td>${esc(s.kind)}</td><td>${esc((prod(s.pid) || {}).name || "—")}</td><td>${s.qty}</td><td>${esc(s.reason)}</td><td>${esc(s.cond)}</td><td>${esc(s.saleRef || "—")}</td><td>${esc(s.disp || "—")}</td><td>${m ? `<input class="form-check-input" type="checkbox" aria-label="Select record ${esc(s.id)}" data-act="spoSelect" data-a="${esc(s.id)}" ${selected.has(s.id) ? "checked" : ""}>` : '<span class="muted">—</span>'}</td></tr>`,
      ),
      "No records yet.",
    ),
    foot: pager("spo", L.length),
  });
};
A.spoSelect = (id, _, t) => {
  const selected = new Set(S.spoSel || []);
  if (t.checked) selected.add(id);
  else selected.delete(id);
  S.spoSel = [...selected];
  refresh();
};
A.spoSelectAll = (_, __, t) => {
  const k = F.spo.kind,
    visible = S.spoilage.filter((s) => !s.archived && (!k || (k === "Return" ? s.kind === "Supplier Return" : s.kind === k)));
  S.spoSel = t.checked ? visible.map((s) => s.id) : [];
  refresh();
};
A.spoUpdateSelected = () => {
  if (!guard(isMgr())) return;
  if ((S.spoSel || []).length !== 1) {
    toast("Select exactly one record to update.", "err");
    return;
  }
  const record = S.spoilage.find((s) => s.id === S.spoSel[0]);
  if (!record) return;
  const batch = record.batch
    ? S.batches.find((b) => b.ref === record.batch)
    : null;
  const isAdjustment = record.kind === "Adjustment";
  const availableBefore = isAdjustment
    ? stockOf(record.pid) - record.qty
    : batch
      ? batch.qty + record.qty
      : stockOf(record.pid) + record.qty;
  const updateFields = isAdjustment
    ? `${fld("su_r", "Reason", { val: record.reason })}${fld("su_n", "Notes", { type: "textarea", val: record.notes || "", req: false, col: "col-12" })}`
    : `${fld("su_r", "Reason", { val: record.reason })}${fld("su_c", "Product condition", { val: record.cond, opts: [["", "Select condition"], ["Good — sealed", "Good — sealed"], ["Damaged", "Damaged"], ["Expired", "Expired"], ["Spoiled", "Spoiled"]] })}${fld("su_x", "Disposition", { val: record.disp, opts: [["", "Select"], ["Return to supplier", "Return to supplier"], ["Discard", "Discard"]] })}${fld("su_n", "Notes", { type: "textarea", val: record.notes || "", req: false, col: "col-12" })}`;
  modal({
    title: "Update Record",
    ok: "Save Changes",
    body: `<form class="row g-3" novalidate onsubmit="return false"><div class="col-12"><div class="alert alert-info mb-0">Total quantity before this record: <b id="suTotal">${availableBefore}</b> · Total quantity after: <b id="suAfter">${availableBefore + (isAdjustment ? record.qty : -record.qty)}</b></div></div>${fld("su_q", "Quantity", { type: "number", val: record.qty, hint: isAdjustment ? "Use a minus sign to reduce stock." : record.deliveryRef ? `Delivery ${record.deliveryRef}` : "Current record has no linked delivery reference." })}${updateFields}</form>`,
    onShow: () => {
      const update = () => {
        const q = +val("su_q") || 0;
        $("#suAfter").textContent = availableBefore + (isAdjustment ? q : -q);
      };
      $("#su_q").addEventListener("input", update);
      update();
    },
    onOk: () => {
      clearErr();
      const q = +val("su_q");
      const ok = [
        check("su_q", Number.isInteger(q) && (isAdjustment ? q !== 0 : q > 0), isAdjustment ? "Enter a whole number that is not 0." : "Enter a whole number above 0."),
        check("su_q", isAdjustment ? availableBefore + q >= 0 : q <= availableBefore, isAdjustment ? "The resulting quantity cannot be negative." : `Only ${availableBefore} available before this record.`),
        check("su_r", val("su_r"), "Select or enter a reason."),
        ...(isAdjustment ? [] : [
          check("su_c", val("su_c"), "Select a condition."),
          check("su_x", val("su_x"), "Select a disposition."),
        ]),
      ];
      if (ok.includes(false)) return false;
      if (isAdjustment) {
        if (record.qty > 0) deduct(record.pid, record.qty);
        else addBatch(record.pid, -record.qty, null, null);
        if (q > 0) addBatch(record.pid, q, null, null);
        else deduct(record.pid, -q);
      } else if (batch) {
        batch.qty += record.qty;
        if (q > batch.qty) {
          batch.qty -= record.qty;
          return check("su_q", false, `Only ${batch.qty} available in batch.`);
        }
        batch.qty -= q;
      }
      if (q !== record.qty) logMove(record.pid, isAdjustment ? "Adjustment" : "Supplier Return", isAdjustment ? q - record.qty : record.qty - q, record.id, "Quantity correction");
      Object.assign(record, {
        qty: q,
        reason: val("su_r"),
        cond: isAdjustment ? "—" : val("su_c"),
        disp: isAdjustment ? "—" : val("su_x"),
        notes: val("su_n"),
      });
      logAudit("Stock", `Updated record ${record.id}`);
      S.spoSel = [];
      toast("Record updated.");
      refresh();
    },
  });
};
A.spoArchiveSelected = () => {
  if (!guard(isMgr())) return;
  const records = (S.spoSel || [])
    .map((id) => S.spoilage.find((s) => s.id === id))
    .filter((s) => s && !s.archived);
  if (!records.length) {
    toast("Select at least one record to archive.", "err");
    return;
  }
  confirmBox(
    "Archive selected records?",
    `${records.length} record${records.length === 1 ? "" : "s"} will be removed from the active list. Stock quantities will not change.`,
    () => {
      records.forEach((record) => {
        record.archived = true;
        logAudit("Stock", `Archived record ${record.id}`);
      });
      S.spoSel = [];
      toast(`${records.length} record${records.length === 1 ? "" : "s"} archived.`);
      refresh();
    },
    "Archive",
    true,
  );
};
V.spoilage = () =>
  pageHead(
    "Adjustments & Returns",
    "Record stock adjustments and return received goods to suppliers.",
    `<button class="btn btn-primary" data-act="adjForm"><i class="bi bi-plus-slash-minus"></i> Record Adjustment</button><button class="btn btn-outline-primary" data-act="spoilForm" data-a="Return"><i class="bi bi-arrow-return-left"></i> Record Return</button>`,
  ) +
  toolbar([
    tbSelect(
      "spo.kind",
      [
        ["", "Adjustments and returns"],
        ["Adjustment", "Adjustments only"],
        ["Return", "Supplier returns only"],
      ],
      "Record Type",
    ),
  ]) +
  `<div id="res">${RES.spo()}</div>`;
A.spoilForm = (kind, batchId) => {
  if (!guard(hasOp("spoilage"))) return;
  const b = batchId ? S.batches.find((x) => x.id == batchId) : null,
    R = kind === "Return",
    reasons = [
      "Defective",
      "Damaged",
      "Spoiled",
      "Expired",
      "Incorrect item delivered",
      "Incorrect quantity delivered",
      "Other",
    ];
  const deliveryOptions = (pid) =>
    [["", "Select delivery reference"]].concat(
      S.deliveries
        .filter((d) => d.lines.some((l) => l.pid == pid))
        .map((d) => {
          const line = d.lines.find((l) => l.pid == pid),
            linked = S.batches.find(
              (x) =>
                x.deliveryRef === d.ref &&
                x.pid == pid &&
                x.qty > 0,
            ),
            fallback = S.batches.find(
              (x) => x.pid == pid && x.arr === d.date && x.qty > 0,
            ),
            available = linked || fallback;
          return [
            d.ref,
            `${d.ref} (${available ? available.qty : line.qty} available)`,
          ];
        }),
    );
  modal({
    title: "Record " + kind,
    size: "modal-lg",
    ok: "Save Record",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("sp_p", "Product", { val: b ? b.pid : "", opts: [["", "Select product"]].concat(S.products.filter((p) => p.active).map((p) => [p.id, p.name])) })}        ${fld("sp_dref", "Delivery reference", { req: R, val: b ? (b.deliveryRef || "") : "", opts: deliveryOptions(b ? b.pid : "") })}
    <div class="col-12"><div class="alert alert-info mb-0">Total available quantity: <b id="spTotal">0</b> · Quantity after deduction: <b id="spAfter">0</b></div></div>${fld("sp_q", "Quantity", { type: "number", attrs: 'min="1"' })}${fld("sp_d", "Date", { type: "date", val: off(0) })}${fld("sp_r", "Reason", { opts: [["", "Select reason"]].concat(reasons.map((r) => [r, r])) })}${fld(
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
 ${R ? `<div class="col-12"><div class="alert alert-info mb-0">The selected delivery's original supplier and received product information are used for this return.</div></div>` : ""}${fld("sp_x", "Disposition", { opts: [["", "Select"], ["Return to supplier", "Return to supplier"]] })}${fld("sp_n", "Notes", { type: "textarea", req: false, col: "col-12" })}</form>`,
    onShow: () => {
      const update = () => {
        const pid = +val("sp_p"),
          delivery = val("sp_dref")
            ? S.deliveries.find((d) => d.ref === val("sp_dref"))
            : null,
          bt = delivery
            ? S.batches.find(
                (x) =>
                  x.deliveryRef === delivery.ref &&
                  x.pid == pid &&
                  x.qty > 0,
              ) ||
              S.batches.find(
                (x) => x.pid == pid && x.arr === delivery.date && x.qty > 0,
              )
            : null,
          total = bt ? bt.qty : stockOf(pid),
          after = total - (+val("sp_q") || 0);
        $("#spTotal").textContent = total;
        $("#spAfter").textContent = after;
      };
      $("#sp_p").addEventListener("change", (e) => {
        $("#sp_dref").innerHTML = deliveryOptions(e.target.value)
          .map(([v, l]) => `<option value="${v}">${esc(l)}</option>`)
          .join("");
        update();
      });
      $("#sp_dref").addEventListener("change", update);
      $("#sp_q").addEventListener("input", update);
      update();
    },
    onOk: () => {
      clearErr();
      const q = +val("sp_q"),
        pid = +val("sp_p"),
        delivery = val("sp_dref")
          ? S.deliveries.find((d) => d.ref === val("sp_dref"))
          : null,
        bt = delivery
          ? S.batches.find(
              (x) =>
                x.deliveryRef === delivery.ref &&
                x.pid == pid &&
                x.qty > 0,
            ) ||
            S.batches.find(
              (x) => x.pid == pid && x.arr === delivery.date && x.qty > 0,
            )
          : null;
      const ok = [
        check("sp_p", pid, "Select a product."),
        check("sp_dref", !R || (delivery && bt), "Select a delivery reference with available stock."),
        check(
          "sp_q",
          Number.isInteger(q) && q > 0,
          "Enter a whole number above 0.",
        ),
        check(
          "sp_q",
          !pid || q <= (bt ? bt.qty : 0),
          `Only ${bt ? bt.qty : stockOf(pid)} available.`,
        ),
        check("sp_d", val("sp_d"), "Select a date."),
        check("sp_r", val("sp_r"), "Select a reason."),
        check("sp_n", val("sp_r") !== "Other" || val("sp_n"), "Describe the return reason."),
        check("sp_c", val("sp_c"), "Select the condition."),
        check("sp_x", val("sp_x"), "Select the return disposition."),
      ];
      if (ok.includes(false)) return false;
      const id = "SP-" + String(S.n.spo++).padStart(4, "0"),
        disp = val("sp_x");
      S.spoilage.unshift({
        id,
        date: val("sp_d"),
        kind: R ? "Supplier Return" : kind,
        pid,
        batch: bt ? bt.ref : "",
        deliveryRef: delivery ? delivery.ref : "",
        qty: q,
        reason: val("sp_r"),
        cond: val("sp_c"),
        saleRef: "",
        disp,
        notes: val("sp_n"),
        supplier: bt ? bt.sup : "",
        user: S.user.name,
      });
      bt.qty -= q;
      logMove(pid, "Supplier Return", -q, id, val("sp_r"));
      logAudit(
        "Stock",
        `Supplier Return ${id}: ${prod(pid).name} ×${q} (${val("sp_r")})`,
      );
      toast("Supplier return posted. Stock updated.");
      setTimeout(() => printSupplierReturn(id), 0);
      refresh();
    },
  });
};
function printSupplierReturn(id) {
  const r = S.spoilage.find((x) => x.id === id);
  if (!r) return;
  const p = prod(r.pid), b = S.batches.find((x) => x.ref === r.batch), supplier = supOf(r.supplier);
  const area = $("#print-area");
  area.innerHTML = `<div class="receipt"><div class="text-center"><b>STA. MONICA OF BUSTOS<br>MULTIPURPOSE COOPERATIVE</b><br>System-Generated Supplier Return Document<br><small>NOT AN OFFICIAL SUPPLIER RECEIPT OR TAX DOCUMENT</small></div><hr>Return reference: ${esc(r.id)}<br>Supplier: ${esc(supplier ? supplier.name : "—")}<br>Delivery reference: ${esc(r.deliveryRef || "—")}<br>Product: ${esc(p.code)} — ${esc(p.name)}<br>Quantity returned: ${r.qty}<br>Date: ${dfmt(r.date)}<br>Reason: ${esc(r.reason)}<br>Disposition: ${esc(r.disp)}<hr>Responsible user: ${esc(r.user)}</div>`;
  document.body.classList.add("printing-receipt");
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing-receipt");
    area.innerHTML = "";
  }, { once: true });
  setTimeout(() => window.print(), 300);
}
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
    hasOp("spoilage")
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
  if (!guard(hasOp("spoilage"))) return;
  modal({
    title: "Record Adjustment",
    ok: "Save Adjustment",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("aj_p", "Product", { col: "col-12", opts: [["", "Select product"]].concat(S.products.filter((p) => p.active).map((p) => [p.id, p.name])) })}<div class="col-12"><div class="alert alert-info mb-0">Current total quantity: <b id="ajTotal">0</b> · Total after adjustment: <b id="ajAfter">0</b></div></div>${fld("aj_q", "Quantity change", { type: "number", hint: "Use a minus sign to reduce stock, e.g. -2" })}${fld("aj_r", "Reason", { type: "textarea", col: "col-12" })}</form>`,
    onShow: () => {
      const update = () => {
        const total = stockOf(+val("aj_p")),
          change = +val("aj_q") || 0;
        $("#ajTotal").textContent = total;
        $("#ajAfter").textContent = total + change;
      };
      $("#aj_p").addEventListener("change", update);
      $("#aj_q").addEventListener("input", update);
      update();
    },
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
      const id = "AJ-" + String(S.n.spo++).padStart(4, "0");
      S.spoilage.unshift({
        id,
        date: off(0),
        kind: "Adjustment",
        pid,
        qty: q,
        reason: val("aj_r"),
        cond: "—",
        saleRef: "",
        disp: "—",
        notes: "",
        user: S.user.name,
      });
      logMove(pid, "Adjustment", q, id, val("aj_r"));
      logAudit(
        "Stock",
        `Adjustment ${id}: ${q > 0 ? "+" : ""}${q} ${prod(pid).name}: ${val("aj_r")}`,
      );
      toast("Adjustment saved (simulated).");
      refresh();
    },
  });
};
