/* ===== Fictional sample data + frontend-only state. No backend, no persistence (reload resets). ===== */
const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();
const z = (n) => String(n).padStart(2, "0");
const ymd = (d) =>
  `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
const off = (n) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const daysLeft = (s) => Math.round((new Date(s + "T00:00:00") - TODAY) / 864e5);
const nowStamp = () => {
  const d = new Date();
  return `${ymd(d)} ${z(d.getHours())}:${z(d.getMinutes())}`;
};

const S = {
  user: null,
  settings: { expWarnDays: 30, defaultMin: 10, largeText: false },
  cats: [
    [1, "Dairy & Eggs"],
    [2, "Bakery"],
    [3, "Canned Goods"],
    [4, "Beverages"],
    [5, "Grains & Rice"],
    [6, "Cooking Essentials"],
    [7, "Snacks & Noodles"],
    [8, "Household"],
  ].map(([id, name]) => ({ id, name, active: true })),
  products: [
    [1, "MLK-001", "Fresh Milk 1L", 1, "Perishable", "Liter", 45, 55, 10],
    [2, "BRD-002", "Sliced Bread", 2, "Perishable", "Loaf", 28, 35, 20],
    [
      3,
      "OIL-003",
      "Cooking Oil 1L",
      6,
      "Non-Perishable",
      "Bottle",
      105,
      120,
      15,
    ],
    [4, "TUN-004", "Canned Tuna 155g", 3, "Non-Perishable", "Can", 28, 32, 20],
    [5, "RIC-005", "Rice 1kg", 5, "Non-Perishable", "Kilogram", 42, 50, 50],
    [6, "SUG-006", "Sugar 1kg", 6, "Non-Perishable", "Kilogram", 44, 48, 25],
    [7, "YOG-007", "Yogurt Cup", 1, "Perishable", "Cup", 16, 22, 10],
    [8, "EGG-008", "Eggs (tray of 30)", 1, "Perishable", "Tray", 210, 240, 20],
    [
      9,
      "SDA-009",
      "Soft Drink 1.5L",
      4,
      "Non-Perishable",
      "Bottle",
      48,
      60,
      20,
    ],
    [10, "NDL-010", "Instant Noodles", 7, "Non-Perishable", "Pack", 9, 12, 40],
    [11, "SOY-011", "Soy Sauce 1L", 6, "Non-Perishable", "Bottle", 34, 42, 15],
    [
      12,
      "DET-012",
      "Laundry Soap Bar",
      8,
      "Non-Perishable",
      "Piece",
      14,
      18,
      20,
    ],
    [13, "PAN-013", "Pandesal Pack", 2, "Perishable", "Pack", 22, 30, 10],
    [14, "JUC-014", "Orange Juice 1L", 4, "Perishable", "Bottle", 62, 78, 12],
  ].map(([id, code, name, cat, type, unit, cost, price, min]) => ({
    id,
    code,
    name,
    cat,
    type,
    unit,
    cost,
    price,
    min,
    active: true,
  })),
  suppliers: [
    [
      1,
      "ABC Food Distributors",
      "Maria Santos",
      "0917 123 4567",
      "Poblacion, Bustos, Bulacan",
    ],
    [
      2,
      "Fresh Mart Supply",
      "Juan Reyes",
      "0918 234 5678",
      "San Rafael, Bulacan",
    ],
    [3, "Prime Goods Co.", "Ana Cruz", "0920 345 6789", "Baliuag, Bulacan"],
    [
      4,
      "Daily Needs Trading",
      "Carlo Dela Cruz",
      "0919 876 5432",
      "Malolos, Bulacan",
    ],
    [
      5,
      "Bustos Agricultural Trading",
      "Liza Mendoza",
      "0916 789 4321",
      "Bustos, Bulacan",
    ],
  ].map(([id, name, contact, phone, address]) => ({
    id,
    name,
    contact,
    phone,
    address,
    active: true,
  })),
  batches: [],
  deliveries: [],
  sales: [],
  movements: [],
  spoilage: [],
  users: [
    {
      id: 1,
      name: "Maria Santos",
      username: "msantos",
      role: "Manager",
      active: true,
    },
    {
      id: 2,
      name: "Juan Dela Cruz",
      username: "jdelacruz",
      role: "Inventory Clerk",
      active: true,
    },
    {
      id: 3,
      name: "Ana Reyes",
      username: "areyes",
      role: "Cashier",
      active: true,
    },
    {
      id: 4,
      name: "Pedro Lim",
      username: "plim",
      role: "Cashier",
      active: false,
    },
  ],
  cart: [],
  tender: "",
  dl: null,
  n: {
    prod: 15,
    cat: 9,
    sup: 6,
    batch: 30,
    user: 5,
    sale: 1008,
    del: 4,
    spo: 3,
  },
};
/* batches: id, product, qty now, arrival offset, expiry offset (null = none), supplier */
[
  [1, 1, 7, -6, 8, 2],
  [2, 2, 12, -1, 3, 2],
  [5, 4, 45, -30, null, 1],
  [6, 5, 120, -14, null, 5],
  [7, 6, 18, -20, null, 3],
  [8, 7, 4, -12, -2, 2],
  [9, 7, 2, -3, 12, 2],
  [10, 8, 30, -4, 20, 5],
  [11, 9, 40, -10, null, 1],
  [12, 10, 80, -9, null, 3],
  [13, 11, 22, -15, null, 4],
  [14, 12, 35, -18, null, 4],
  [15, 13, 15, -1, 1, 2],
  [16, 14, 24, -5, 40, 1],
].forEach(([id, pid, qty, a, e, sup]) =>
  S.batches.push({
    id,
    ref: "BT-" + (2400 + id),
    pid,
    qty,
    arr: off(a),
    exp: e === null ? null : off(e),
    sup,
  }),
);
S.deliveries = [
  {
    ref: "DR-0003",
    date: off(-1),
    sup: 2,
    notes: "",
    lines: [
      { pid: 2, qty: 12, cost: 28, exp: off(3) },
      { pid: 13, qty: 15, cost: 22, exp: off(1) },
    ],
  },
  {
    ref: "DR-0002",
    date: off(-3),
    sup: 2,
    notes: "Chilled items",
    lines: [{ pid: 7, qty: 6, cost: 16, exp: off(12) }],
  },
  {
    ref: "DR-0001",
    date: off(-6),
    sup: 2,
    notes: "",
    lines: [{ pid: 1, qty: 12, cost: 45, exp: off(8) }],
  },
];
S.movements = [
  [
    -6,
    "08:10",
    1,
    "Delivery",
    12,
    "DR-0001",
    "Juan Dela Cruz",
    "Stock received",
  ],
  [
    -3,
    "09:05",
    7,
    "Delivery",
    6,
    "DR-0002",
    "Juan Dela Cruz",
    "Stock received",
  ],
  [
    -1,
    "08:30",
    2,
    "Delivery",
    12,
    "DR-0003",
    "Juan Dela Cruz",
    "Stock received",
  ],
  [
    -1,
    "08:32",
    13,
    "Delivery",
    15,
    "DR-0003",
    "Juan Dela Cruz",
    "Stock received",
  ],
  [-3, "14:20", 1, "Sale", -3, "S-1001", "Ana Reyes", ""],
  [-2, "10:45", 5, "Sale", -6, "S-1003", "Ana Reyes", ""],
  [-2, "16:02", 1, "Sale", -2, "S-1004", "Ana Reyes", ""],
  [-1, "11:15", 9, "Sale", -4, "S-1005", "Ana Reyes", ""],
  [0, "09:12", 3, "Sale", -4, "S-1006", "Ana Reyes", ""],
  [0, "10:30", 2, "Sale", -5, "S-1007", "Ana Reyes", ""],
  [
    -4,
    "15:00",
    7,
    "Spoilage",
    -3,
    "SP-0001",
    "Juan Dela Cruz",
    "Spoiled — cooler issue",
  ],
  [
    -2,
    "13:40",
    12,
    "Adjustment",
    -2,
    "",
    "Maria Santos",
    "Count correction after stock check",
  ],
  [
    -1,
    "17:00",
    4,
    "Return",
    1,
    "S-1002",
    "Juan Dela Cruz",
    "Customer return — sealed, good condition",
  ],
  [
    -5,
    "09:00",
    3,
    "Adjustment",
    4,
    "",
    "Maria Santos",
    "Found unrecorded stock",
  ],
].map(([d, t, pid, type, qty, ref, user, reason]) => ({
  dt: `${off(d)} ${t}`,
  pid,
  type,
  qty,
  ref,
  user,
  reason,
}));
(function seedSales() {
  const mk = (ref, d, t, lines, user = "Ana Reyes") => {
    const L = lines.map(([pid, qty]) => ({
      pid,
      qty,
      price: S.products.find((p) => p.id === pid).price,
    }));
    const total = L.reduce((s, l) => s + l.qty * l.price, 0);
    S.sales.push({
      ref,
      dt: `${off(d)} ${t}`,
      lines: L,
      total,
      tendered: Math.ceil(total / 100) * 100,
      user,
    });
  };
  mk("S-1007", 0, "10:30", [
    [2, 5],
    [13, 2],
  ]);
  mk("S-1006", 0, "09:12", [
    [3, 4],
    [10, 6],
  ]);
  mk("S-1005", -1, "11:15", [
    [9, 4],
    [10, 10],
  ]);
  mk("S-1004", -2, "16:02", [
    [1, 2],
    [2, 1],
  ]);
  mk("S-1003", -2, "10:45", [
    [5, 6],
    [6, 2],
  ]);
  mk("S-1002", -3, "13:20", [
    [4, 1],
    [11, 2],
  ]);
  mk("S-1001", -3, "14:20", [
    [1, 3],
    [12, 2],
  ]);
})();
S.spoilage = [
  {
    id: "SP-0001",
    date: off(-4),
    kind: "Spoilage",
    pid: 7,
    batch: "",
    qty: 3,
    reason: "Spoiled",
    cond: "Spoiled",
    saleRef: "",
    disp: "Discard",
    user: "Juan Dela Cruz",
  },
  {
    id: "SP-0002",
    date: off(-1),
    kind: "Return",
    pid: 4,
    batch: "",
    qty: 1,
    reason: "Customer changed mind",
    cond: "Good — sealed",
    saleRef: "S-1002",
    disp: "Return to stock",
    user: "Juan Dela Cruz",
  },
];
/* ----- lookups & stock logic (single source of truth for all screens) ----- */
const prod = (id) => S.products.find((p) => p.id == id),
  catOf = (id) => S.cats.find((c) => c.id == id),
  supOf = (id) => S.suppliers.find((s) => s.id == id);
const catName = (id) => (catOf(id) || { name: "—" }).name;
const batchesOf = (pid) => S.batches.filter((b) => b.pid == pid && b.qty > 0);
const stockOf = (pid) => batchesOf(pid).reduce((s, b) => s + b.qty, 0);
const isExpired = (b) => b.exp && daysLeft(b.exp) < 0;
const sellable = (pid) =>
  batchesOf(pid)
    .filter((b) => !isExpired(b))
    .reduce((s, b) => s + b.qty, 0);
const level = (p) => {
  const q = stockOf(p.id);
  return q === 0 ? "out" : q <= p.min ? "low" : "ok";
};
const expState = (d) => {
  if (!d) return "";
  const n = daysLeft(d);
  return n < 0 ? "expired" : n <= S.settings.expWarnDays ? "soon" : "ok";
};
function expInfo(p) {
  const b = batchesOf(p.id)
    .filter((b) => b.exp)
    .sort((a, c) => a.exp.localeCompare(c.exp))[0];
  return b ? { date: b.exp, state: expState(b.exp) } : null;
}
function deduct(pid, qty, skipExpired) {
  let need = qty;
  batchesOf(pid)
    .filter((b) => !(skipExpired && isExpired(b)))
    .sort(
      (a, b) =>
        (a.exp || "9999").localeCompare(b.exp || "9999") ||
        a.arr.localeCompare(b.arr),
    )
    .forEach((b) => {
      const t = Math.min(b.qty, need);
      b.qty -= t;
      need -= t;
    });
}
function addBatch(pid, qty, exp, sup, ref) {
  S.batches.push({
    id: S.n.batch++,
    ref: ref || "BT-" + (2400 + S.n.batch),
    pid,
    qty,
    arr: off(0),
    exp: exp || null,
    sup: sup || null,
  });
}
function logMove(pid, type, qty, ref, reason) {
  S.movements.unshift({
    dt: nowStamp(),
    pid,
    type,
    qty,
    ref: ref || "",
    user: S.user ? S.user.name : "—",
    reason: reason || "",
  });
}
