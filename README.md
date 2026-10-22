# Sta. Monica of Bustos MPC — Sales and Inventory Management System (UI Prototype)

Frontend-only, interactive prototype (HTML5, CSS3, JavaScript, Bootstrap 5, Bootstrap Icons). **No backend, no database, no PHP, no real login or email.** All data is fictional and lives in browser memory; reloading the page resets it.

## Run
1. Unzip, then open `index.html` in a browser (internet needed once for the Bootstrap CDN files), or run `python3 -m http.server` in this folder and open http://localhost:8000.
2. Log in with a demo account (password `demo1234`): `msantos` (Manager), `jdelacruz` (Inventory Clerk), `areyes` (Cashier). Menus change per role.
3. There is no "forgot password" flow: the prototype has no mail service, so no reset link or code could ever be sent. Passwords are still changed by a Manager under Administration › User Accounts, and by the signed-in user under Settings › My Account.

## Structure (single-page app, hash routing — avoids duplicated layouts)
- `index.html` – page shell, modal, side panel, toasts, notification center
- `assets/css/styles.css` – shared design system (tokens + components), responsive + print CSS, animated sidebar rail
- `assets/js/data.js` – sample data, `S` state, stock logic (batches, FIFO deduct, level/expiry rules)
- `assets/js/ui.js` – reusable components (pills, tables, pager, form fields/validation, modal, toast, side panel, page scaffolding, notification builder)
- `assets/js/main.js` – router, role access, sidebar/header, notification center, global events
- `assets/js/views-*.js` – screens (auth+dashboard, inventory area, sales+reports, admin)
- `assets/images/` – approved design reference and instructor notes

## Design system (shared by every screen)
All values live as CSS custom properties in `:root` (`assets/css/styles.css`), so the whole app restyles from one place:

- **Navy / brand ramp** – `--navy-900 … --navy-500`, `--blue`, `--blue-dark`, `--blue-soft`
- **Gradients** – `--grad-blue`, `--grad-blue-deep`, `--grad-red`, `--grad-yellow` (dashboard cards), `--grad-navy` (sidebar rail), `--grad-btn`, `--grad-btn-danger` (buttons)
- **Surfaces** – `--bg` (neutral light grey page), `--panel` (white cards), `--panel-soft`, `--line`, `--line-soft`
- **Text** – `--text`, `--muted`, `--muted-2`
- **Status** – `--coral` / `--amber` / `--green` (+ matching `*-bg` backgrounds) for pills, alerts and validation
- **Shape** – `--radius` (18 px panels), `--radius-sm` (10 px controls), `--radius-lg` (22 px sidebar), `--shadow-1/2/3`
- **Type** – `--fs-page`, `--fs-section`, `--fs-body`, `--fs-meta`, `--fs-micro`, `--fs-nav` (sidebar items), `--fs-nav-sub` (sub-menu)
- **Controls** – `--control-h` (40 px), `--control-h-sm` (34 px), spacing tokens `--sp-1 … --sp-5`
- **Sidebar width** – `--sbw: clamp(252px, 23vw, 372px)` (≈23 % of the viewport, as in the reference; the 252 px floor keeps the longest nav label from clipping). The collapsed rail overrides it with 76 px.

Reusable classes: `.btn` (+ `btn-primary`, `btn-outline-primary`, `btn-outline-secondary`, `btn-danger`, `btn-outline-danger`), `.form-control/.form-select/.form-label/.form-check-input`, `.table` + `.table-action` (`.action-edit`, `.action-view`, `.action-status`, `.action-record`), `.pill` (status badges), `.data-card`, `.toolbar`, `.page-head`, `.stat` (`.stat-blue`, `.stat-red`, `.stat-yellow`, `.stat-blue-deep`, `.stat-money`), `.modal-content`, `.offcanvas`, `.empty`, `.dropdown-menu`.

## Dashboard (matches the supplied UI reference)
- **Sidebar** – navy gradient rail (~23 % of the viewport width) with rounded right corners, brand block (name on one line), `MENU` row with the collapse toggle, section headings (Overview / Operations / Management / Administration), 1.02 rem labels with 1.25 rem icons, expandable groups with chevrons, live alert badges, floating tooltips in the collapsed rail and the user profile card at the bottom (avatar 44 px, role text never clipped).
- **Active item** – a **solid white, full-bleed rectangle with square corners**: `.sb-nav` carries no horizontal padding, the row has `border-radius: 0` and no blue indicator, so the white background reaches both edges of the rail. It works for top-level items, for sub-menu items and inside the 76 px collapsed rail (where the parent group carries the block).
- **Top navigation** – sticky white rounded container (79 px tall) with the breadcrumb trail, the current date and the notification bell in a circular container (no count badge – the unread count lives in the panel).
- **Summary cards** – six rounded gradient tiles (blue → red → red → yellow → red → blue) 90 px tall with a 42 px white rounded icon container, a 1.25 rem value and a 0.82 rem label (currency uses a compact 0.9 rem value so it never wraps); they reflow 2 → 3 → 6 per row and never overflow.
- **Content panels** – large rounded white panels on the neutral light-grey page background; Recent Sales and Recent Deliveries share a row (equal height, 24 px gutter) and Recent Activity sits below with the same design language.

## Layout system (every screen follows the same skeleton)
1. **Breadcrumb** in the top bar — `Section › Group › Page`, generated from the sidebar tree, so the user always knows where they are.
2. **Page header** (`pageHead`) — title, one-line description, primary actions on the right.
3. **Filter toolbar** (`toolbar`) — one white panel with clearly labelled fields; identical placement and sizing on every list page.
4. **Data card** (`dataCard`) — card header with title, record-count chip and actions, then the table, then a footer with "Showing X–Y of Z" and pagination.
5. **Empty states** — icon, message and hint in the same style everywhere.

Shared helpers live in `assets/js/ui.js` (`pageHead`, `toolbar`, `tbSearch`/`tbSelect`/`tbDate`, `dataCard`, `pager`, `emptyState`, `actionLegend`, `crumbsHtml`), so a new screen can be built with the same components instead of ad-hoc markup.

## Key behaviors to demo
Add Category (Settings › Categories) → Products › Add Product shows it immediately · Add Delivery → stock rises · POS sale → stock falls, receipt, Sales History · Spoilage/Return → stock + movements · Reports with filters + Print Report · Expiry warning days (Settings › Alert Settings) change warnings everywhere · deactivate instead of delete (records kept).

## Sidebar (collapsible rail)
- Hamburger (sidebar header) collapses the rail on desktop and opens the drawer on mobile; the icon morphs (menu → chevron / X) and the toggle keeps `aria-expanded` / `aria-label` in sync.
- Collapsing animates: sidebar width, content offset, label fade/slide, section headers, active-item accent, chevron rotation and staggered sub-menu reveal.
- Collapsed rail shows icons only; hovering an item shows a floating tooltip with its name, and the live alert badges move onto the icons.
- Clicking a group icon in the collapsed rail restores the full sidebar and opens that group.
- The rail is grouped into Overview / Operations / Management / Administration; Stock Monitoring carries the live low/out-of-stock badge.
- The account menu at the bottom of the rail opens above the avatar and is never cut off — in the collapsed rail it opens out to the right of the icons instead of being squeezed into the 76 px rail.

## Notification panel (bell icon, top right)
- Facebook-style **dropdown panel** anchored under the bell icon — no full-screen modal, the page stays visible behind it. It opens and closes with a smooth ease-in / ease-out (fade + lift + scale) and animates the bell to an active state.
- Header with the unread count, "mark all as read" and close; filter tabs with live counts (All / Unread / Stock / Expiry); a rounded search field; severity-coded rows with a round alert avatar, bold headline, timestamp, description, tags and a quick action link; a "See all alerts" footer.
- Unread rows are tinted and flagged with a blue rail. Rows can be dismissed by clicking them, with `Esc` or by clicking outside the panel.
- Rows are generated from live stock and expiry state (`buildNotifications()` in `assets/js/ui.js`), so they update after sales, deliveries, adjustments or spoilage.
- Opening an alert or its action link (e.g. "Plan restock", "Record spoilage") marks it read and clears the bell badge; "Mark all read" clears every alert.
