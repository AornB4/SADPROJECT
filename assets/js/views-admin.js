/* ===== Suppliers, Categories, Users, Settings, Account ===== */
/* ---- Suppliers ---- */
RES.sup = () => {
  const f = F.sup,
    L = S.suppliers.filter(
      (s) =>
        has(s.name + s.contact, f.q) &&
        (f.status === "all" || (f.status === "active") === s.active),
    );
  return `<div class="card">${tbl(
    ["Supplier", "Contact person", "Phone", "Status", "Actions"],
    L.map(
      (s) =>
        `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.contact)}</td><td>${esc(s.phone)}</td><td>${activePill(s.active)}</td><td class="text-nowrap"><button class="btn btn-outline-primary btn-sm" data-act="supView" data-a="${s.id}">View</button> <button class="btn btn-outline-primary btn-sm" data-act="supForm" data-a="${s.id}" aria-label="Edit ${esc(s.name)}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-outline-secondary btn-sm" data-act="supToggle" data-a="${s.id}">${s.active ? "Deactivate" : "Reactivate"}</button></td></tr>`,
    ),
    "No suppliers found.",
  )}</div>`;
};
V.suppliers = () =>
  pageHead(
    "Suppliers",
    "Manage supplier information.",
    `<button class="btn btn-primary" data-act="supForm"><i class="bi bi-plus-lg"></i> Add Supplier</button>`,
  ) +
  `<div class="row g-2 mb-3"><div class="col-md-6">${searchBox("sup.q", "Search supplier name or contact")}</div><div class="col-md-3">${selF(
    "sup.status",
    [
      ["active", "Active"],
      ["inactive", "Inactive"],
      ["all", "All"],
    ],
    "Status",
  )}</div></div><div id="res">${RES.sup()}</div>`;
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
      toast("Supplier saved.");
      refresh();
    },
  });
};
A.supToggle = (id) => {
  const s = supOf(id);
  confirmBox(
    s.active ? "Deactivate supplier?" : "Reactivate supplier?",
    `${esc(s.name)} will be ${s.active ? "hidden from new deliveries. Past records are kept" : "available again"}.`,
    () => {
      s.active = !s.active;
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
  return `<div class="card">${tbl(
    ["Category", "Products", "Status", "Actions"],
    L.map(
      (c) =>
        `<tr><td><b>${esc(c.name)}</b></td><td>${S.products.filter((p) => p.cat === c.id && p.active).length}</td><td>${activePill(c.active)}</td><td class="text-nowrap"><button class="btn btn-outline-primary btn-sm" data-act="catForm" data-a="${c.id}" aria-label="Edit ${esc(c.name)}"><i class="bi bi-pencil-square"></i> Edit</button> <button class="btn btn-outline-secondary btn-sm" data-act="catToggle" data-a="${c.id}">${c.active ? "Deactivate" : "Reactivate"}</button></td></tr>`,
    ),
    "No categories found.",
  )}</div>`;
};
V.categories = () =>
  pageHead(
    "Categories",
    "Categories shown in the Product form are managed here — not hardcoded.",
    `<button class="btn btn-primary" data-act="catForm"><i class="bi bi-plus-lg"></i> Add Category</button>`,
  ) +
  `<div class="row g-2 mb-3"><div class="col-md-6">${searchBox("cat.q", "Search category")}</div><div class="col-md-3">${selF(
    "cat.status",
    [
      ["active", "Active"],
      ["inactive", "Inactive"],
      ["all", "All"],
    ],
    "Status",
  )}</div></div><div id="res">${RES.cat()}</div>`;
A.catForm = (id) => {
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
  const c = catOf(id),
    n = S.products.filter((p) => p.cat === id && p.active).length;
  confirmBox(
    c.active ? "Deactivate category?" : "Reactivate category?",
    c.active
      ? `“${esc(c.name)}” will no longer be offered for new products.${n ? ` ${n} existing product(s) keep it.` : ""}`
      : `“${esc(c.name)}” will be offered again.`,
    () => {
      c.active = !c.active;
      toast("Category updated.");
      refresh();
    },
    c.active ? "Deactivate" : "Reactivate",
    c.active,
  );
};
/* ---- User Management ---- */
V.users = () =>
  pageHead(
    "User Management",
    "Accounts for managers, inventory clerks, and cashiers.",
    `<button class="btn btn-primary" data-act="userForm"><i class="bi bi-plus-lg"></i> Add User</button>`,
  ) +
  simNote(
    "Roles control which menu items appear. No real authentication or password storage.",
  ) +
  `<div class="card">${tbl(
    ["Name", "Username", "Role", "Status", "Actions"],
    S.users.map(
      (u) =>
        `<tr><td><b>${esc(u.name)}</b></td><td>${u.username}</td><td>${u.role}</td><td>${u.pending ? pill("soon", "hourglass-split", "Pending approval") : activePill(u.active)}</td><td class="text-nowrap"><button class="btn btn-outline-primary btn-sm" data-act="userForm" data-a="${u.id}" aria-label="Edit ${esc(u.name)}"><i class="bi bi-pencil-square"></i> Edit</button> <button class="btn btn-outline-secondary btn-sm" data-act="userToggle" data-a="${u.id}">${u.pending ? "Approve" : u.active ? "Deactivate" : "Reactivate"}</button></td></tr>`,
    ),
  )}</div>`;
A.userForm = (id) => {
  const u = id
    ? S.users.find((x) => x.id == id)
    : { name: "", username: "", role: "" };
  modal({
    title: id ? "Edit User" : "Add User",
    ok: "Save User",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("un", "Full name", { val: u.name })}${fld("uu", "Username", { val: u.username })}${fld("ur", "Role", { val: u.role, opts: [["", "Select role"], "Manager", "Inventory Clerk", "Cashier"].map((x) => (Array.isArray(x) ? x : [x, x])) })}${id ? "" : fld("upw", "Temporary password", { type: "password" })}</form>`,
    onOk: () => {
      clearErr();
      const un = val("uu").toLowerCase();
      const ok = [
        check("un", val("un"), "Enter the full name."),
        check(
          "uu",
          /^[a-z0-9_.]{4,}$/.test(un) &&
            !S.users.some((x) => x.username === un && x.id != id),
          /^[a-z0-9_.]{4,}$/.test(un)
            ? "Username already used."
            : "Use 4+ letters or numbers.",
        ),
        check("ur", val("ur"), "Select a role."),
      ];
      if (!id)
        ok.push(check("upw", val("upw").length >= 8, "At least 8 characters."));
      if (ok.includes(false)) return false;
      id
        ? Object.assign(u, { name: val("un"), username: un, role: val("ur") })
        : S.users.push({
            id: S.n.user++,
            name: val("un"),
            username: un,
            role: val("ur"),
            active: true,
          });
      toast("User saved.");
      refresh();
    },
  });
};
A.userToggle = (id) => {
  const u = S.users.find((x) => x.id == id);
  if (u.id === S.user.id)
    return toast("You cannot deactivate your own account.", "err");
  confirmBox(
    u.pending
      ? "Approve account?"
      : u.active
        ? "Deactivate account?"
        : "Reactivate account?",
    `${esc(u.name)} (${u.role}). Records are kept either way.`,
    () => {
      if (u.pending) {
        u.pending = false;
        u.active = true;
      } else u.active = !u.active;
      toast("User updated.");
      refresh();
    },
    "Confirm",
  );
};
/* ---- Settings & Account ---- */
V.settings = () =>
  pageHead("Alert Settings", "Set when the system should warn you.") +
  simNote() +
  `<div class="card p-3 settings-card" style="max-width:640px"><form data-form="saveSettings" novalidate class="row g-3">${fld("se1", "Warn me about expiration this many days ahead", { type: "number", val: S.settings.expWarnDays, col: "col-12", attrs: 'min="1" max="365"', hint: "Used in the Dashboard, Stock Monitoring, and Expiration Monitoring." })}${fld("se2", "Default minimum stock for new products", { type: "number", val: S.settings.defaultMin, col: "col-12", attrs: 'min="0"' })}<div class="col-12"><button class="btn btn-primary">Save Settings</button></div></form></div>`;
A.saveSettings = () => {
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
  toast("Settings saved. Warnings updated everywhere.");
};
V.account = () =>
  pageHead("My Account", "Your profile and preferences.") +
  simNote() +
  `<div class="row g-3"><div class="col-lg-6"><div class="card p-3"><h2 class="h5">Profile</h2><form data-form="saveProfile" novalidate class="row g-3">${fld("an", "Display name", { val: S.user.name, col: "col-12" })}<div class="col-12 muted">Role: ${S.user.role} · Username: ${S.user.username}</div><div class="col-12 form-check ms-2"><input class="form-check-input" type="checkbox" id="lt" ${S.settings.largeText ? "checked" : ""}><label class="form-check-label" for="lt">Use larger text</label></div><div class="col-12"><button class="btn btn-primary">Save</button></div></form></div></div>
 <div class="col-lg-6"><div class="card p-3"><h2 class="h5">Change password</h2><form data-form="savePw" novalidate class="row g-3">${pw("cp0", "Current password")}${pw("cp1", "New password")}${pw("cp2", "Confirm new password")}<div class="col-12"><button class="btn btn-primary">Change password</button></div></form></div></div></div>`;
A.saveProfile = () => {
  clearErr();
  if (!check("an", val("an"), "Enter your name.")) return;
  S.user.name = val("an");
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
      $("#cp0").value === "demo1234",
      "Current password is incorrect (demo: demo1234).",
    ) |
    !check(
      "cp1",
      n.length >= 8 && /\d/.test(n),
      "Use 8+ characters with a number.",
    ) |
    !check("cp2", $("#cp2").value === n, "Passwords do not match.")
  )
    return;
  toast("Password changed (simulated).");
  refresh();
};
