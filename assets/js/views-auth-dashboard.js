/* ===== Login / account screens (simulated) + Dashboard ===== */
const Auth = {};
const authCard = (
  title,
  sub,
  body,
) => `<div class="auth"><div class="card"><div class="text-center mb-3">${brandLogo("brand-logo auth-brand-logo")}<div class="fw-bold" style="color:var(--blue-dark)">Sta. Monica of Bustos</div><small class="muted">Multipurpose Cooperative · Sales and Inventory</small></div>
 <h1 class="h4 text-center">${title}</h1><p class="muted text-center">${sub}</p>${body}<div class="sim-note mt-3"><i class="bi bi-info-circle"></i> Simulated prototype. No real login or email is used.</div></div></div>`;
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
 <div id="lerr" class="col-12 text-danger small" role="alert"></div><div class="col-12"><button class="btn btn-primary w-100">Log in</button></div><div class="col-12 d-flex justify-content-between small"><button class="btn btn-link p-0" type="button" data-act="forgotPassword">Forgot password?</button><button class="btn btn-link p-0" type="button" data-act="createAccount">Create an account</button></div>
</form>`,
  );
A.createAccount = () => {
  const register = () =>
    modal({
      title: "Create Account",
      ok: "Send OTP",
      body: `<form class="row g-3" novalidate onsubmit="return false">${fld("ca_n", "Full name")}${fld("ca_e", "Email address", { type: "email", attrs: 'autocomplete="email"', hint: "A mock verification code will be shown after submission." })}<div class="col-12 small-muted">After email verification, an administrator will review your request and set up your account access.</div></form>`,
      onOk: () => {
        clearErr();
        const name = val("ca_n"),
          email = val("ca_e").trim().toLowerCase();
        const ok = [
          check("ca_n", name, "Enter your full name."),
          check("ca_e", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email address."),
          check("ca_e", !S.pendingAccounts.some((a) => a.email === email && a.status === "Pending") && !S.users.some((u) => u.email === email), "This email already has an account request."),
        ];
        if (ok.includes(false)) return false;
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        modal({
          title: "Verify Email",
          ok: "Verify and Create",
          body: `<form class="row g-3" novalidate onsubmit="return false"><div class="col-12"><p class="mb-0">A mock OTP was sent to <b>${esc(email)}</b>.</p></div><div class="col-12 alert alert-info mb-0"><b>Prototype OTP: ${otp}</b></div>${fld("ca_otp", "Enter OTP", { attrs: 'inputmode="numeric" maxlength="6"', hint: "In a real system, this code would be sent by email." })}</form>`,
          onOk: () => {
            clearErr();
            if (!check("ca_otp", val("ca_otp") === otp, "Enter the correct OTP.")) return false;
            S.pendingAccounts.unshift({
              id: S.n.approval++,
              name,
              email,
              submittedAt: nowStamp(),
              status: "Pending",
            });
            logAudit("Account", `Submitted account approval request for ${email}`, "—");
            toast("Email verified. Your account request is awaiting admin approval.");
          },
        });
      },
    });
  register();
};
A.forgotPassword = () => {
  modal({
    title: "Forgot Password",
    ok: "Reset Password",
    body: `<form class="row g-3" novalidate onsubmit="return false">${fld("fp_u", "Username", { attrs: 'autocomplete="off"' })}${pw("fp_p", "New password")}${pw("fp_c", "Confirm new password")}<div class="col-12 small-muted">This prototype does not send email. Your username is used to locate the account.</div></form>`,
    onOk: () => {
      clearErr();
      const username = val("fp_u").toLowerCase(),
        password = $("#fp_p").value,
        user = S.users.find((u) => u.username === username);
      const ok = [
        check("fp_u", username, "Enter your username."),
        check("fp_u", !!user, "No account was found with that username."),
        check(
          "fp_p",
          password.length >= 8 && /\d/.test(password),
          "Use 8+ characters with a number.",
        ),
        check("fp_c", $("#fp_c").value === password, "Passwords do not match."),
      ];
      if (ok.includes(false)) return false;
      user.pw = password;
      logAudit("Account", `Password reset for ${username}`, "—");
      toast("Password reset. You can now log in.");
    },
  });
};
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
/* ---- Dashboard ---- */
V.dashboard = () => {
  const ps = S.products.filter((p) => p.active),
    al = alerts(),
    today = mySales().filter((s) => s.dt.startsWith(off(0))),
    amt = today.reduce((s, x) => s + x.total, 0);
  const card = (href, icon, n, l, cls = "") =>
    `<div class="col-6 col-md-4 col-xl-2"><a class="stat ${cls}" href="#/${href}"><i class="bi bi-${icon}"></i><div><b>${n}</b><small>${l}</small></div></a></div>`;
  const K = !hasOp("deliveries");
  return (
    pageHead("Dashboard", `Welcome back, ${esc(S.user.name.split(" ")[0])}!`) +
    `<div class="row g-4 mb-5">
 ${card("products", "box-seam", ps.length, "Active products", "stat-blue")}${card("inventory?show=low", "exclamation-triangle", al.low, "Low stock", "stat-red")}${card("inventory?show=out", "x-octagon", al.out, "Out of stock", "stat-red")}
 ${card("inventory?show=soon", "hourglass-split", al.soon, "Expiring soon", "stat-yellow") + card("inventory?show=expired", "x-circle", al.exp, "Expired batches", "stat-red")}${card("pos?tab=history", "cash-coin", peso(amt), `${isMgr() ? "Today's sales" : "My sales today"} (${today.length})`, "stat-blue-deep stat-money")}</div>
 <div class="row g-4"><div class="col-lg-${K ? 12 : 6}">${dataCard({
      title: "Recent Sales",
      meta: `${mySales().length} sale${mySales().length === 1 ? "" : "s"}`,
      cls: "h-100",
      actions: `<a href="#/pos?tab=history" class="btn btn-sm btn-outline-primary">View all</a>`,
      body: tbl(
        ["Ref", "Date", "Total"],
        mySales()
          .slice(0, 4)
          .map(
            (s) =>
              `<tr><td><b>${s.ref}</b></td><td>${dtfmt(s.dt)}</td><td>${peso(s.total)}</td></tr>`,
          ),
        "No sales recorded yet.",
      ),
    })}</div>
 ${
   K
     ? ""
     : `<div class="col-lg-6">${dataCard({
         title: "Recent Deliveries",
         meta: `${S.deliveries.length} deliver${S.deliveries.length === 1 ? "y" : "ies"}`,
         cls: "h-100",
         actions: `<a href="#/deliveries" class="btn btn-sm btn-outline-primary">View all</a>`,
         body: tbl(
           ["Ref", "Date", "Supplier", "Items"],
           S.deliveries
             .slice(0, 4)
             .map(
               (d) =>
                 `<tr><td><b>${d.ref}</b></td><td>${dfmt(d.date)}</td><td>${esc(supOf(d.sup).name)}</td><td>${d.lines.length}</td></tr>`,
             ),
           "No deliveries recorded yet.",
         ),
       })}</div>
 <div class="col-12">${dataCard({
   title: "Recent Activity",
   meta: `${S.movements.length} movement${S.movements.length === 1 ? "" : "s"}`,
   actions: `<a href="#/movements" class="btn btn-sm btn-outline-primary">All stock movements</a>`,
   body: tbl(
     ["When", "Product", "Type", "Qty"],
     S.movements
       .slice(0, 6)
       .map(
         (m) =>
           `<tr><td>${dtfmt(m.dt)}</td><td>${esc(prod(m.pid).name)}</td><td>${m.type}</td><td>${m.qty > 0 ? "+" : ""}${m.qty}</td></tr>`,
       ),
     "No stock activity yet.",
   ),
 })}</div>`
 }
</div>`
  );
};
