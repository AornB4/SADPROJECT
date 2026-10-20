/* ===== Login / account screens (simulated) + Dashboard ===== */
const Auth = {};
const authCard = (
  title,
  sub,
  body,
) => `<div class="auth"><div class="card"><div class="text-center mb-3">${brandLogo("brand-logo auth-brand-logo")}<div class="fw-bold" style="color:var(--blue-dark)">Sta. Monica of Bustos</div><small class="muted">Multipurpose Cooperative · Sales and Inventory</small></div>
 <h1 class="h4 text-center">${title}</h1><p class="muted text-center">${sub}</p>${body}<div class="sim-note mt-3"><i class="bi bi-info-circle"></i> Simulated prototype. No real login, email, or OTP is used.</div></div></div>`;
const pw = (id, label) =>
  `<div class="col-12"><label class="form-label" for="${id}">${label} <span class="req">*</span></label><div class="input-group"><input class="form-control" id="${id}" type="password" autocomplete="off"><button class="btn btn-outline-secondary" type="button" data-act="showpw" data-a="${id}" aria-label="Show or hide password"><i class="bi bi-eye"></i></button><div class="invalid-feedback" id="e-${id}"></div></div></div>`;
A.showpw = (id) => {
  const i = $("#" + id);
  i.type = i.type === "password" ? "text" : "password";
};
Auth.login = () =>
  authCard(
    "Log in",
    "Enter your username and password.",
    `<form data-form="doLogin" novalidate class="row g-3"><div class="col-12"><label class="form-label" for="lu">Username <span class="req">*</span></label><input class="form-control" id="lu" autocomplete="off"><div class="invalid-feedback" id="e-lu"></div></div>${pw("lp", "Password")}
 <div id="lerr" class="col-12 text-danger small" role="alert"></div><div class="col-12"><button class="btn btn-primary w-100">Log in</button></div>
 <div class="col-12"><a href="#/forgot">Forgot password?</a></div></form>`,
  );
A.doLogin = () => {
  clearErr();
  $("#lerr").textContent = "";
  const u = val("lu"),
    p = $("#lp").value;
  if (
    !check("lu", u, "Please enter your username.") |
    !check("lp", p, "Please enter your password.")
  )
    return;
  const x = S.users.find((x) => x.username === u.toLowerCase());
  if (!x || p !== x.pw) {
    logAudit("Login", `Failed login attempt (username: ${u})`, "—");
    $("#lerr").textContent = "Incorrect username or password. Try again.";
    return;
  }
  if (!x.active) {
    $("#lerr").textContent = "This account is inactive. Please contact the manager.";
    return;
  }
  S.user = x;
  logAudit("Login", "Logged in");
  location.hash = "#/dashboard";
  toast(`Welcome back, ${x.name.split(" ")[0]}!`);
};
Auth.forgot = () =>
  authCard(
    "Forgot password",
    "Enter your username or email to get a verification code.",
    `<form data-form="doForgot" novalidate class="row g-3">${fld("fu", "Username or email", { col: "col-12" })}<div class="col-12"><button class="btn btn-primary w-100">Send code</button></div><div class="col-12 text-center"><a href="#/login">Back to log in</a></div></form>`,
  );
A.doForgot = () => {
  clearErr();
  if (!check("fu", val("fu"), "Enter your username or email.")) return;
  S.reset = { u: val("fu").toLowerCase() };
  location.hash = "#/otp";
  toast("Code sent (simulated).", "info");
};
Auth.otp = () =>
  authCard(
    "Enter verification code",
    "A 6-digit code was “sent” to you.",
    `<div class="alert alert-info py-2">Demo code: <b>123456</b></div><form data-form="doOtp" novalidate class="row g-3">${fld("oc", "6-digit code", { col: "col-12", attrs: 'inputmode="numeric" maxlength="6"' })}<div class="col-12"><button class="btn btn-primary w-100">Verify</button></div><div class="col-12 d-flex justify-content-between"><button type="button" class="btn btn-link p-0" data-act="resend">Resend code</button><a href="#/login">Cancel</a></div></form>`,
  );
A.resend = () => toast("A new code was sent (simulated).", "info");
A.doOtp = () => {
  clearErr();
  if (
    !check(
      "oc",
      val("oc") === "123456",
      "Incorrect code. Use the demo code 123456.",
    )
  )
    return;
  location.hash = "#/reset";
};
Auth.reset = () =>
  authCard(
    "Set new password",
    "Choose a new password.",
    `<form data-form="doReset" novalidate class="row g-3">${pw("np", "New password")}${pw("np2", "Confirm new password")}<div class="col-12"><button class="btn btn-primary w-100">Save password</button></div></form>`,
  );
A.doReset = () => {
  clearErr();
  const p = $("#np").value;
  if (
    !check(
      "np",
      p.length >= 8 && /\d/.test(p),
      "Use at least 8 characters with a number.",
    ) | !check("np2", $("#np2").value === p, "Passwords do not match.")
  )
    return;
  const ru = S.users.find((x) => x.username === (S.reset || {}).u);
  if (ru) {
    ru.pw = p;
    logAudit("Account", "Password reset using verification code", ru.name);
  }
  location.hash = "#/login";
  toast("Password changed (simulated). You can log in now.");
};

/* ---- Dashboard ---- */
V.dashboard = () => {
  const ps = S.products.filter((p) => p.active),
    al = alerts(),
    today = mySales().filter((s) => s.dt.startsWith(off(0))),
    amt = today.reduce((s, x) => s + x.total, 0);
  const card = (href, icon, n, l, cls = "") =>
    `<div class="col-6 col-md-4 col-xxl-2"><a class="stat ${cls}" href="#/${href}"><i class="bi bi-${icon}"></i><div><b>${n}</b><small>${l}</small></div></a></div>`;
  const K = !hasOp("deliveries");
  return (
    pageHead("Dashboard", `Welcome back, ${esc(S.user.name.split(" ")[0])}!`) +
    `<div class="row g-3 mb-4">
 ${card("products", "box-seam", ps.length, "Active products")}${card("inventory?show=low", "exclamation-triangle", al.low, "Low stock", "low")}${card("inventory?show=out", "x-octagon", al.out, "Out of stock", "low")}
 ${card("expiration?show=soon", "hourglass-split", al.soon, "Expiring soon", "soon") + card("expiration?show=expired", "x-circle", al.exp, "Expired batches", "low")}${card("pos?tab=history", "cash-coin", peso(amt), `${isMgr() ? "Today's sales" : "My sales today"} (${today.length})`)}</div>
 <div class="row g-3"><div class="col-lg-${K ? 12 : 6}"><div class="card"><div class="card-h">Recent Sales<a href="#/pos?tab=history" class="small">View all</a></div>${tbl(
   ["Ref", "Date", "Total"],
   mySales().slice(0, 4)
     .map(
       (s) =>
         `<tr><td>${s.ref}</td><td>${dtfmt(s.dt)}</td><td>${peso(s.total)}</td></tr>`,
     ),
 )}</div></div>
 ${
   K
     ? ""
     : `<div class="col-lg-6"><div class="card"><div class="card-h">Recent Deliveries<a href="#/deliveries" class="small">View all</a></div>${tbl(
         ["Ref", "Date", "Supplier", "Items"],
         S.deliveries
           .slice(0, 4)
           .map(
             (d) =>
               `<tr><td>${d.ref}</td><td>${dfmt(d.date)}</td><td>${esc(supOf(d.sup).name)}</td><td>${d.lines.length}</td></tr>`,
           ),
       )}</div></div>
 <div class="col-12"><div class="card"><div class="card-h">Recent Activity<a href="#/movements" class="small">All stock movements</a></div>${tbl(
   ["When", "Product", "Type", "Qty"],
   S.movements
     .slice(0, 6)
     .map(
       (m) =>
         `<tr><td>${dtfmt(m.dt)}</td><td>${esc(prod(m.pid).name)}</td><td>${m.type}</td><td>${m.qty > 0 ? "+" : ""}${m.qty}</td></tr>`,
     ),
 )}</div></div>`
 }</div>`
  );
};
