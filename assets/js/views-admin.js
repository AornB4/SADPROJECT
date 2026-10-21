/* ===== Suppliers, Categories, Settings, Account ===== */
/* ---- Suppliers ---- */
RES.sup = () => {
  const f = F.sup,
    L = S.suppliers.filter(
      (s) =>
        has(s.name + s.contact, f.q) &&
        (f.status === "all" || (f.status === "active") === s.active),
    );
  return dataCard({
    title: "Supplier list",
    meta: `${L.length} supplier${L.length === 1 ? "" : "s"}`,
    body:
      actionLegend(isMgr() ? ["view", "edit", "status"] : ["view"]) +
      tbl(
        ["Supplier", "Contact person", "Phone", "Status", "Actions"],
        sl(L, "sup").map(
          (s) =>
            `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.contact)}</td><td>${esc(s.phone)}</td><td>${activePill(s.active)}</td><td class="text-nowrap"><button class="btn btn-sm table-action action-view" data-act="supView" data-a="${s.id}" aria-label="View ${esc(s.name)}"><i class="bi bi-eye"></i></button>${isMgr() ? ` <button class="btn btn-sm table-action action-edit" data-act="supForm" data-a="${s.id}" aria-label="Edit ${esc(s.name)}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm table-action action-status" data-act="supToggle" data-a="${s.id}" aria-label="${s.active ? "Deactivate" : "Reactivate"} ${esc(s.name)}"><i class="bi bi-arrow-repeat"></i></button>` : ""}</td></tr>`,
        ),
        "No suppliers found.",
      ),
    foot: pager("sup", L.length),
  });
};
V.suppliers = () =>
  pageHead(
    "Suppliers",
    "Manage supplier information.",
    `<button class="btn btn-primary" data-act="supForm"><i class="bi bi-plus-lg"></i> Add Supplier</button>`,
  ) +
  toolbar([
    tbSearch("sup.q", "Search supplier name or contact"),
    tbSelect(
      "sup.status",
      [
        ["active", "Active"],
        ["inactive", "Inactive"],
        ["all", "All"],
      ],
      "Status",
    ),
  ]) +
  `<div id="res">${RES.sup()}</div>`;
A.supView = (id) => {
  const s = supOf(id);
  openPanel(
    s.name,
    kv([
      ["Contact person", esc(s.contact)],
      ["Phone", esc(s.phone)],
      ["Address", esc(s.address)],
      ["Status", activePill(s.active)],
    ]) +
      `<h3 class="h6 mt-4">Deliveries</h3>` +
      tbl(
        ["Ref", "Date", "Items"],
        S.deliveries
          .filter((d) => d.sup == id)
          .map(
            (d) =>
              `<tr><td>${d.ref}</td><td>${dfmt(d.date)}</td><td>${d.lines.length}</td></tr>`,
          ),
        "No deliveries yet.",
      ),
  );
};
A.supForm = (id) => {
  if (!guard(isMgr())) return;
  const s = id ? supOf(id) : { name: "", contact: "", phone: "", address: "" };
  modal({
    title: id ? "Edit Supplier" : "Add Supplier",
    ok: "Save Supplier",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("sn1", "Supplier name", { val: s.name, col: "col-12" })}${fld("sc", "Contact person", { val: s.contact })}${fld("sph", "Phone number", { val: s.phone, attrs: 'inputmode="tel"' })}${fld("sa", "Address", { val: s.address, col: "col-12" })}</form>`,
    onOk: () => {
      clearErr();
      const ok = [
        check("sn1", val("sn1"), "Enter the supplier name."),
        check(
          "sn1",
          !S.suppliers.some(
            (x) =>
              x.name.toLowerCase() === val("sn1").toLowerCase() && x.id != id,
          ),
          "This supplier already exists.",
        ),
        check("sc", val("sc"), "Enter a contact person."),
        check(
          "sph",
          /^[0-9 +()-]{7,}$/.test(val("sph")),
          "Enter a valid phone number.",
        ),
        check("sa", val("sa"), "Enter the address."),
      ];
      if (ok.includes(false)) return false;
      const d = {
        name: val("sn1"),
        contact: val("sc"),
        phone: val("sph"),
        address: val("sa"),
      };
      id
        ? Object.assign(s, d)
        : S.suppliers.push({ id: S.n.sup++, active: true, ...d });
      logAudit("Supplier", `${id ? "Edited" : "Added"} supplier ${d.name}`);
      toast("Supplier saved.");
      refresh();
    },
  });
};
A.supToggle = (id) => {
  if (!guard(isMgr())) return;
  const s = supOf(id);
  confirmBox(
    s.active ? "Deactivate supplier?" : "Reactivate supplier?",
    `${esc(s.name)} will be ${s.active ? "hidden from new deliveries. Past records are kept" : "available again"}.`,
    () => {
      s.active = !s.active;
      logAudit(
        "Supplier",
        `${s.active ? "Reactivated" : "Deactivated"} supplier ${s.name}`,
      );
      toast("Supplier updated.");
      refresh();
    },
    s.active ? "Deactivate" : "Reactivate",
    s.active,
  );
};
/* ---- Categories (dynamic: the Product form reads S.cats) ---- */
RES.cat = () => {
  const f = F.cat,
    L = S.cats.filter(
      (c) =>
        has(c.name, f.q) &&
        (f.status === "all" || (f.status === "active") === c.active),
    );
  return dataCard({
    title: "Category list",
    meta: `${L.length} categor${L.length === 1 ? "y" : "ies"}`,
    body:
      actionLegend(["edit", "status"]) +
      tbl(
        ["Category", "Products", "Status", "Actions"],
        sl(L, "cat").map(
          (c) =>
            `<tr><td><b>${esc(c.name)}</b></td><td>${S.products.filter((p) => p.cat === c.id && p.active).length}</td><td>${activePill(c.active)}</td><td class="text-nowrap"><button class="btn btn-sm table-action action-edit" data-act="catForm" data-a="${c.id}" aria-label="Edit ${esc(c.name)}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm table-action action-status" data-act="catToggle" data-a="${c.id}" aria-label="${c.active ? "Deactivate" : "Reactivate"} ${esc(c.name)}"><i class="bi bi-arrow-repeat"></i></button></td></tr>`,
        ),
        "No categories found.",
      ),
    foot: pager("cat", L.length),
  });
};
V.categories = () =>
  pageHead(
    "Categories",
    "Categories shown in the Product form are managed here — not hardcoded.",
    `<button class="btn btn-primary" data-act="catForm"><i class="bi bi-plus-lg"></i> Add Category</button>`,
  ) +
  toolbar([
    tbSearch("cat.q", "Search category"),
    tbSelect(
      "cat.status",
      [
        ["active", "Active"],
        ["inactive", "Inactive"],
        ["all", "All"],
      ],
      "Status",
    ),
  ]) +
  `<div id="res">${RES.cat()}</div>`;
A.catForm = (id) => {
  if (!guard(isMgr())) return;
  const c = id ? catOf(id) : { name: "" };
  modal({
    title: id ? "Edit Category" : "Add Category",
    size: "modal-sm",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("cn", "Category name", { val: c.name, col: "col-12" })}</form>`,
    onOk: () => {
      clearErr();
      const n = val("cn");
      if (
        !check("cn", n, "Enter a category name.") ||
        !check(
          "cn",
          !S.cats.some(
            (x) => x.name.toLowerCase() === n.toLowerCase() && x.id != id,
          ),
          "This category already exists.",
        )
      )
        return false;
      logAudit(
        "Category",
        id ? `Renamed category “${c.name}” to “${n}”` : `Added category “${n}”`,
      );
      id ? (c.name = n) : S.cats.push({ id: S.n.cat++, name: n, active: true });
      toast(
        id
          ? "Category updated."
          : `Category “${n}” added. It now appears in the Product form.`,
      );
      refresh();
    },
  });
};
A.catToggle = (id) => {
  if (!guard(isMgr())) return;
  const c = catOf(id),
    n = S.products.filter((p) => p.cat === id && p.active).length;
  confirmBox(
    c.active ? "Deactivate category?" : "Reactivate category?",
    c.active
      ? `“${esc(c.name)}” will no longer be offered for new products.${n ? ` ${n} existing product(s) keep it.` : ""}`
      : `“${esc(c.name)}” will be offered again.`,
    () => {
      c.active = !c.active;
      logAudit(
        "Category",
        `${c.active ? "Reactivated" : "Deactivated"} category “${c.name}”`,
      );
      toast("Category updated.");
      refresh();
    },
    c.active ? "Deactivate" : "Reactivate",
    c.active,
  );
};
/* ---- Settings & Account ---- */
V.settings = () =>
  pageHead("Alert Settings", "Set when the system should warn you.") +
  simNote() +
  `<div class="settings-card">` +
  dataCard({
    title: "Warning thresholds",
    meta: "Applies to the whole system",
    pad: true,
    body: `<form data-form="saveSettings" novalidate class="row g-3">${fld("se1", "Warn me about expiration this many days ahead", { type: "number", val: S.settings.expWarnDays, col: "col-12", attrs: 'min="1" max="365"', hint: "Used in the Dashboard and Stock Monitoring." })}${fld("se2", "Default minimum stock for new products", { type: "number", val: S.settings.defaultMin, col: "col-12", attrs: 'min="0"' })}<div class="col-12"><button class="btn btn-primary">Save Settings</button></div></form>`,
  }) +
  `</div>`;
A.saveSettings = () => {
  if (!guard(isMgr())) return;
  clearErr();
  const a = +val("se1"),
    b = +val("se2");
  if (
    !check(
      "se1",
      Number.isInteger(a) && a >= 1 && a <= 365,
      "Enter 1 to 365.",
    ) | !check("se2", Number.isInteger(b) && b >= 0, "Enter 0 or more.")
  )
    return;
  S.settings.expWarnDays = a;
  S.settings.defaultMin = b;
  logAudit(
    "Settings",
    `Expiration warning ${a} day(s); default minimum stock ${b}`,
  );
  toast("Settings saved. Warnings updated everywhere.");
};
V.account = () =>
  pageHead("My Account", "Your profile and preferences.") +
  simNote() +
  `<div class="row g-3"><div class="col-lg-6">${dataCard({
    title: "Profile",
    meta: ROLE_LABEL[S.user.role],
    pad: true,
    body: `<form data-form="saveProfile" novalidate class="row g-3">${fld("an", "Display name", { val: S.user.name, col: "col-12" })}<div class="col-12 muted">Username: <b>${esc(S.user.username)}</b></div><div class="col-12 form-check ms-2"><input class="form-check-input" type="checkbox" id="lt" ${S.settings.largeText ? "checked" : ""}><label class="form-check-label" for="lt">Use larger text</label></div><div class="col-12"><button class="btn btn-primary">Save</button></div></form>`,
  })}</div>
 <div class="col-lg-6">${dataCard({
    title: "Change password",
    meta: "Simulated",
    pad: true,
    body: `<form data-form="savePw" novalidate class="row g-3">${pw("cp0", "Current password")}${pw("cp1", "New password")}${pw("cp2", "Confirm new password")}<div class="col-12"><button class="btn btn-primary">Change password</button></div></form>`,
  })}</div></div>`;
A.saveProfile = () => {
  clearErr();
  if (!check("an", val("an"), "Enter your name.")) return;
  const oldName = S.user.name,
    newName = val("an");
  if (newName !== oldName) renameUser(oldName, newName);
  S.user.name = newName;
  if (newName !== oldName)
    logAudit("Account", `Display name changed from ${oldName} to ${newName}`);
  S.settings.largeText = $("#lt").checked;
  document.documentElement.classList.toggle("large", S.settings.largeText);
  toast("Profile saved.");
  render();
};
A.savePw = () => {
  clearErr();
  const n = $("#cp1").value;
  if (
    !check(
      "cp0",
      $("#cp0").value === S.user.pw,
      "Current password is incorrect.",
    ) |
    !check(
      "cp1",
      n.length >= 8 && /\d/.test(n),
      "Use 8+ characters with a number.",
    ) |
    !check("cp2", $("#cp2").value === n, "Passwords do not match.")
  )
    return;
  S.user.pw = n;
  logAudit("Account", "Changed own password");
  toast("Password changed (simulated).");
  refresh();
};

/* ---- User accounts (Manager only) ---- */
const opsText = (u) =>
  u.role === "Manager"
    ? "All operations"
    : u.ops && u.ops.length
      ? u.ops.map((o) => (OPS.find((x) => x[0] === o) || [0, o])[1]).join(", ")
      : "Sales only";
const mgrCount = () =>
  S.users.filter((u) => u.active && u.role === "Manager").length;
RES.usr = () => {
  const f = F.usr,
    L = S.users.filter(
      (u) =>
        has(u.name + u.username, f.q) &&
        (!f.role || u.role === f.role) &&
        (f.status === "all" || (f.status === "active") === u.active),
    );
  return dataCard({
    title: "User accounts",
    meta: `${L.length} account${L.length === 1 ? "" : "s"}`,
    body:
      actionLegend(["edit", "status"]) +
      tbl(
        ["Name", "Username", "Role", "Assigned operations", "Status", "Actions"],
      sl(L, "usr").map(
        (u) =>
          `<tr><td><b>${esc(u.name)}</b>${u.id === S.user.id ? ' <span class="small-muted">(you)</span>' : ""}</td><td>${esc(u.username)}</td><td>${ROLE_LABEL[u.role]}</td><td>${esc(opsText(u))}</td><td>${activePill(u.active)}</td><td class="text-nowrap"><button class="btn btn-sm table-action action-edit" data-act="usrForm" data-a="${u.id}" aria-label="Edit ${esc(u.name)}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm table-action action-status" data-act="usrToggle" data-a="${u.id}" aria-label="${u.active ? "Deactivate" : "Reactivate"} ${esc(u.name)}"><i class="bi bi-arrow-repeat"></i></button></td></tr>`,
      ),
      "No users found.",
    ),
    foot: pager("usr", L.length),
  });
};
V.users = () =>
  pageHead(
    "User Accounts",
    "Accounts are deactivated, never deleted, so records and history are kept.",
    `<button class="btn btn-primary" data-act="usrForm"><i class="bi bi-plus-lg"></i> Add User</button>`,
  ) +
  `<div class="row g-3 mb-3"><div class="col-lg-6">${dataCard({
    title: "Administrator / Manager",
    meta: "Full access",
    pad: true,
    body: `<div class="small-muted">Full system management: user accounts, products, suppliers, deliveries, reports, authorized stock adjustments, and audit logs.</div>`,
  })}</div><div class="col-lg-6">${dataCard({
    title: "Employee",
    meta: "Limited access",
    pad: true,
    body: `<div class="small-muted">Records sales, views product prices and stock, and performs only the inventory operations assigned by a Manager. Roles and permissions can only be changed here.</div>`,
  })}</div></div>` +
  toolbar([
    tbSearch("usr.q", "Search name or username"),
    tbSelect(
      "usr.role",
      [
        ["", "All roles"],
        ["Manager", "Administrator / Manager"],
        ["Employee", "Employee"],
      ],
      "Role",
    ),
    tbSelect(
      "usr.status",
      [
        ["active", "Active"],
        ["inactive", "Inactive"],
        ["all", "All"],
      ],
      "Status",
    ),
  ]) +
  `<div id="res">${RES.usr()}</div>`;
A.usrForm = (id) => {
  if (!guard(isMgr())) return;
  const u = id
    ? S.users.find((x) => x.id == id)
    : { name: "", username: "", role: "Employee", ops: [] };
  const ops = OPS.map(
    ([k, l]) =>
      `<div class="form-check"><input class="form-check-input us-op" type="checkbox" id="op_${k}" value="${k}" ${(u.ops || []).includes(k) ? "checked" : ""}><label class="form-check-label" for="op_${k}">${l}</label></div>`,
  ).join("");
  modal({
    title: id ? "Edit User" : "Add User",
    ok: "Save User",
    size: "modal-lg",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("us_n", "Full name", { val: u.name })}${fld("us_u", "Username", { val: u.username, attrs: 'autocomplete="off"' })}${fld("us_r", "Role", { val: u.role, opts: [["Employee", "Employee"], ["Manager", "Administrator / Manager"]] })}${fld("us_p", id ? "New password" : "Password", { type: "password", req: !id, attrs: 'autocomplete="new-password"', hint: id ? "Leave blank to keep the current password." : "At least 8 characters with a number." })}<div class="col-12" id="us_ops"><div class="form-label">Inventory operations assigned</div>${ops}<div class="form-text">Employees can always record sales and view prices and stock. Administrators / Managers can do everything.</div></div></form>`,
    onShow: () => {
      const t = () =>
        ($("#us_ops").style.display = val("us_r") === "Employee" ? "" : "none");
      $("#us_r").addEventListener("change", t);
      t();
    },
    onOk: () => {
      clearErr();
      const n = val("us_n"),
        un = val("us_u").toLowerCase(),
        role = val("us_r"),
        pw = $("#us_p").value,
        pwOk = pw.length >= 8 && /\d/.test(pw);
      const ok = [
        check("us_n", n, "Enter the full name."),
        check(
          "us_u",
          /^[a-z0-9._]{3,}$/.test(un),
          "Use 3+ letters, numbers, dots or underscores.",
        ),
        check(
          "us_u",
          !S.users.some((x) => x.username === un && x.id != id),
          "This username is already used.",
        ),
        check("us_r", ["Employee", "Manager"].includes(role), "Select a role."),
        check(
          "us_p",
          id ? !pw || pwOk : pwOk,
          "Use 8+ characters with a number.",
        ),
      ];
      if (id) {
        ok.push(
          check(
            "us_r",
            !(u.id === S.user.id && role !== u.role),
            "You cannot change your own role.",
          ),
          check(
            "us_r",
            !(
              u.role === "Manager" &&
              role !== "Manager" &&
              u.active &&
              mgrCount() <= 1
            ),
            "At least one active Manager is required.",
          ),
        );
      }
      if (ok.includes(false)) return false;
      const newOps =
        role === "Employee"
          ? $$(".us-op")
              .filter((c) => c.checked)
              .map((c) => c.value)
          : [];
      if (id) {
        const before = `${ROLE_LABEL[u.role]} / ${opsText(u)}`,
          oldName = u.name;
        Object.assign(u, { name: n, username: un, role, ops: newOps });
        if (pw) u.pw = pw;
        if (n !== oldName) renameUser(oldName, n);
        const after = `${ROLE_LABEL[u.role]} / ${opsText(u)}`;
        logAudit(
          "User",
          `Edited account ${un}.` +
            (before !== after
              ? ` Permissions changed: ${before} → ${after}.`
              : "") +
            (pw ? " Password reset." : ""),
        );
      } else {
        const nu = {
          id: S.n.user++,
          name: n,
          username: un,
          role,
          ops: newOps,
          active: true,
          pw,
        };
        S.users.push(nu);
        logAudit(
          "User",
          `Created account ${un} (${ROLE_LABEL[role]}${role === "Employee" ? ": " + opsText(nu).toLowerCase() : ""})`,
        );
      }
      toast("User saved.");
      id && u.id === S.user.id ? render() : refresh();
    },
  });
};
A.usrToggle = (id) => {
  if (!guard(isMgr())) return;
  const u = S.users.find((x) => x.id == id);
  if (u.active && u.id === S.user.id)
    return toast("You cannot deactivate your own account.", "err");
  if (u.active && u.role === "Manager" && mgrCount() <= 1)
    return toast("At least one active Manager is required.", "err");
  confirmBox(
    u.active ? "Deactivate user?" : "Reactivate user?",
    `${esc(u.name)} will ${u.active ? "no longer be able to log in. Their records and history are kept" : "be able to log in again"}.`,
    () => {
      u.active = !u.active;
      logAudit(
        "User",
        `${u.active ? "Reactivated" : "Deactivated"} account ${u.username}`,
      );
      toast("User updated.");
      refresh();
    },
    u.active ? "Deactivate" : "Reactivate",
    u.active,
  );
};
/* ---- Audit logs (Manager only, read-only) ---- */
const AUD_TYPES = [
  "Login",
  "Logout",
  "Account",
  "User",
  "Product",
  "Category",
  "Supplier",
  "Delivery",
  "Sale",
  "Stock",
  "Settings",
  "Report",
];
RES.aud = (all) => {
  const f = F.aud,
    L = S.audit
      .filter(
        (a) =>
          (!f.from || a.dt.slice(0, 10) >= f.from) &&
          (!f.to || a.dt.slice(0, 10) <= f.to) &&
          (!f.user || a.user === f.user) &&
          (!f.type || a.action === f.type) &&
          has(a.user + " " + a.action + " " + a.detail + " " + a.id, f.q),
      )
      .sort((a, b) => b.dt.localeCompare(a.dt));
  return dataCard({
    title: "Activity log",
    meta: `${L.length} entr${L.length === 1 ? "y" : "ies"}`,
    body: tbl(
      ["Date & time", "User", "Action", "Details", "Log ID"],
      (all ? L : sl(L, "aud")).map(
        (a) =>
          `<tr><td>${dtfmt(a.dt)}</td><td>${esc(a.user)}</td><td><span class="badge text-bg-light border">${esc(a.action)}</span></td><td>${esc(a.detail)}</td><td class="small-muted">${a.id}</td></tr>`,
      ),
      "No log entries match the filters.",
    ),
    foot: all
      ? `<div class="data-card-foot"><span class="small-muted">${L.length} entries</span></div>`
      : pager("aud", L.length),
  });
};
V.audit = () => {
  const names = [
    ...new Set(S.users.map((u) => u.name).concat(S.audit.map((a) => a.user))),
  ].filter((n) => n !== "—");
  return (
    pageHead(
      "Audit Logs",
      "Read-only history of important actions. Entries cannot be edited or deleted.",
      `<button class="btn btn-primary" data-act="printAud"><i class="bi bi-printer"></i> Print Logs</button>`,
    ) +
    `<div class="toolbar no-print" aria-label="Filters"><div class="toolbar-grid">${tbDate("aud.from", "From date")}${tbDate("aud.to", "To date")}${tbSelect("aud.user", [["", "All users"]].concat(names.map((n) => [n, n])), "User")}${tbSelect("aud.type", [["", "All actions"]].concat(AUD_TYPES.map((t) => [t, t])), "Action")}${tbSearch("aud.q", "Search details or log ID")}</div></div><div id="res">${RES.aud()}</div>`
  );
};
A.printAud = () => {
  if (!guard(isMgr())) return;
  $("#res").innerHTML = RES.aud(true);
  window.print();
  $("#res").innerHTML = RES.aud();
};
