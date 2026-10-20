# Sta. Monica of Bustos MPC — Sales and Inventory Management System (UI Prototype)

Frontend-only, interactive prototype (HTML5, CSS3, JavaScript, Bootstrap 5, Bootstrap Icons). **No backend, no database, no PHP, no real login/OTP/email.** All data is fictional and lives in browser memory; reloading the page resets it.

## Run
1. Unzip, then open `index.html` in a browser (internet needed once for the Bootstrap CDN files), or run `python3 -m http.server` in this folder and open http://localhost:8000.
2. Log in with a demo account (password `demo1234`): `msantos` (Manager), `jdelacruz` (Inventory Clerk), `areyes` (Cashier). The login page has one-click buttons. Menus change per role.
3. Demo OTP code for Forgot Password: `123456`.

## Structure (single-page app, hash routing — avoids duplicated layouts)
- `index.html` – page shell, modal, side panel, toasts
- `assets/css/styles.css` – blue/white design system, responsive + print CSS
- `assets/js/data.js` – sample data, `S` state, stock logic (batches, FIFO deduct, level/expiry rules)
- `assets/js/ui.js` – reusable components (pills, tables, pager, form fields/validation, modal, toast, side panel)
- `assets/js/main.js` – router, role access, sidebar/header, global events
- `assets/js/views-*.js` – screens (auth+dashboard, inventory area, sales+reports, admin)
- `assets/images/` – approved design reference and instructor notes

## Key behaviors to demo
Add Category (Settings › Categories) → Products › Add Product shows it immediately · Add Delivery → stock rises · POS sale → stock falls, receipt, Sales History · Spoilage/Return → stock + movements · Reports with filters + Print Report · Expiry warning days (Settings › Alert Settings) change warnings everywhere · deactivate instead of delete (records kept).
