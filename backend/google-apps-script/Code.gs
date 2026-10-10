/* unorgnl. order backend (Google Apps Script, attached to the orders Google Sheet).
   - doPost: the website sends an order here. Prices are recalculated from PRICES below (never trusted from the browser),
     the order is written to the "Orders" sheet, a Razorpay payment link is created for UPI/card orders,
     and emails go to the shop and the customer.
   - doGet: the "Track order" page asks for an order's status (order number + mobile must match).
   - syncPayments: runs every 10 minutes (see installTrigger) and marks orders paid once Razorpay says so.
   Secrets (Razorpay keys) live in Project Settings > Script properties, never in this file.
   Setup steps: backend/SETUP.md */

const CONFIG = {
  SHEET_NAME: "Orders",
  DISCOUNT_SHEET: "Discounts",
  STORE_NAME: "unorgnl.",
  NOTIFY_EMAIL: "",                 // shop inbox for new-order emails, e.g. "orders@yourdomain.in"
  SITE_URL: "",                     // live site address without a trailing slash, e.g. "https://unorgnl.in"
  WHATSAPP_NUMBER: "",              // shop WhatsApp with country code, digits only, e.g. "919800000000"
};

/* Keep in sync with site/js/data.js whenever a price changes. */
const PRICES = {
  "supercharge-power-boy-tee": { name: "Supercharge Power Boy Tee", price: 2299, sizes: ["S", "M", "L", "XL", "XXL"] },
  "remix-tee": { name: "Remix Tee", price: 1999, sizes: ["S", "M", "L", "XL", "XXL"] },
  "ditto-overshirt": { name: "Ditto Overshirt", price: 3299, sizes: ["S", "M", "L", "XL"] },
  "carbon-copy-shirt": { name: "Carbon Copy Shirt", price: 2799, sizes: ["S", "M", "L", "XL"] },
  "second-draft-cargo": { name: "Second Draft Cargo", price: 2999, sizes: ["28", "30", "32", "34", "36"] },
  "rerun-trouser": { name: "Rerun Trouser", price: 2699, sizes: ["28", "30", "32", "34", "36"] },
  "copy-bomber": { name: "Copy Bomber", price: 4499, sizes: ["S", "M", "L", "XL"] },
  "echo-work-jacket": { name: "Echo Work Jacket", price: 3999, sizes: ["S", "M", "L", "XL"] },
};
const SHIPPING = { freeOver: 2999, standard: 99, express: 199, codFee: 49 };

const HEADERS = ["Order no", "Placed at", "Status", "Payment", "Pay method", "Total (₹)", "Discount code", "Discount (₹)", "Items", "Name", "Phone", "Email",
  "Address", "City", "PIN", "State", "Delivery", "Payment link", "Razorpay link id", "Courier", "Tracking no", "Tracking link", "Notes", "WhatsApp"];
const COL = HEADERS.reduce((m, h, i) => { m[h] = i + 1; return m; }, {});
const STATUSES = ["New", "Paid", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

/* ---------- menu + one-time setup ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu(CONFIG.STORE_NAME)
    .addItem("Set up the Orders sheet", "setup")
    .addItem("Check Razorpay payments now", "syncPayments")
    .addItem("Turn on automatic payment checks (every 10 min)", "installTrigger")
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold").setBackground("#111111").setFontColor("#ffffff");
  sh.setFrozenRows(1);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build();
  sh.getRange(2, COL["Status"], 1000, 1).setDataValidation(rule);
  sh.setColumnWidth(COL["Items"], 320);
  sh.setColumnWidth(COL["Address"], 260);
  // discount codes: Vinaay adds, edits or switches off codes here; the site and every order read this tab
  const ds = ss.getSheetByName(CONFIG.DISCOUNT_SHEET) || ss.insertSheet(CONFIG.DISCOUNT_SHEET);
  if (ds.getLastRow() === 0) {
    ds.getRange(1, 1, 1, DISC_HEADERS.length).setValues([DISC_HEADERS]).setFontWeight("bold").setBackground("#111111").setFontColor("#ffffff");
    ds.appendRow(["FIRSTRUN10", "Percent", 10, 0, true, "", "", 0, "10% off your first order"]);
    ds.setFrozenRows(1);
    ds.getRange(2, 2, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["Percent", "Flat"], true).build());
    ds.getRange(2, 5, 500, 1).insertCheckboxes();
  }
}
const DISC_HEADERS = ["Code", "Type", "Value", "Min order (₹)", "Active", "Expires", "Max uses", "Used", "Label (shown to customer)"];

/* returns { code, type, value, min, label, amount } or { error } */
function findDiscount_(code, subtotal) {
  code = String(code || "").trim().toUpperCase();
  if (!code) return null;
  const ds = SpreadsheetApp.getActive().getSheetByName(CONFIG.DISCOUNT_SHEET);
  if (!ds) return { error: "invalid" };
  const rows = ds.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const [c, type, value, min, active, expires, maxUses, used, label] = rows[i];
    if (String(c).trim().toUpperCase() !== code) continue;
    if (active !== true) return { error: "invalid" };
    if (expires && new Date(expires) < new Date()) return { error: "expired" };
    if (maxUses && Number(used || 0) >= Number(maxUses)) return { error: "used_up" };
    const t = String(type).toLowerCase() === "flat" ? "flat" : "percent", v = Number(value) || 0, m = Number(min) || 0;
    const amount = subtotal === undefined || subtotal < m ? 0 : t === "percent" ? Math.round(subtotal * v / 100) : Math.min(v, subtotal);
    return { code: code, type: t, value: v, min: m, label: String(label || ""), amount: amount, row: i + 1 };
  }
  return { error: "invalid" };
}

function installTrigger() {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "syncPayments").forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("syncPayments").timeBased().everyMinutes(10).create();
}

/* ---------- website: place an order ---------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.hp) return json_({ ok: false, error: "rejected" });             // honeypot: bots fill hidden fields
    const order = validate_(body);
    if (order.error) return json_({ ok: false, error: order.error });

    const sh = sheet_();
    order.no = uniqueNo_(sh, body.ref);
    order.placedAt = new Date();

    let payUrl = "", linkId = "";
    if (order.pay !== "cod") {
      const link = createPaymentLink_(order);
      payUrl = link.short_url; linkId = link.id;
    }

    const c = order.customer;
    const row = [order.no, order.placedAt, "New", order.pay === "cod" ? "Cash on delivery" : "Awaiting payment",
      { upi: "UPI", card: "Card", cod: "COD" }[order.pay], order.total, order.disc ? order.disc.code : "", order.disc ? order.disc.amount : 0, order.itemsText, c.name, c.phone, c.email,
      [c.addr, c.area].filter(String).join(", "), c.city, c.pin, c.state, order.ship === "express" ? "Express" : "Standard",
      payUrl, linkId, "", "", "", "", ""].map(safe_);
    sh.appendRow(row);
    const r = sh.getLastRow();
    sh.getRange(r, COL["WhatsApp"]).setFormula(`=HYPERLINK("https://wa.me/91${c.phone}?text=" & ENCODEURL("Hi ${c.name.replace(/"/g, "")}, this is ${CONFIG.STORE_NAME} about your order ${order.no}."), "Message")`);

    if (order.disc) { const ds = SpreadsheetApp.getActive().getSheetByName(CONFIG.DISCOUNT_SHEET); const cell = ds.getRange(order.disc.row, 8); cell.setValue(Number(cell.getValue() || 0) + 1); }
    notify_(order, payUrl);
    return json_({ ok: true, orderNo: order.no, total: order.total, payUrl: payUrl });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server" });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- website: track an order ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "discount") {
    const d = findDiscount_(p.code);
    if (!d || d.error) return json_({ ok: false, error: (d && d.error) || "invalid" });
    return json_({ ok: true, code: d.code, type: d.type, value: d.value, min: d.min, label: d.label });
  }
  if (p.action !== "track") return json_({ ok: true, service: CONFIG.STORE_NAME + " orders" });
  const no = String(p.no || "").trim().toUpperCase(), phone = String(p.phone || "").replace(/\D/g, "").slice(-10);
  if (!/^UNO-\d{5}(-\d)?$/.test(no) || phone.length !== 10) return json_({ ok: false, error: "invalid" });
  const sh = sheet_(), data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL["Order no"] - 1]) === no && String(row[COL["Phone"] - 1]).slice(-10) === phone) {
      return json_({ ok: true, orderNo: no, status: row[COL["Status"] - 1], payment: row[COL["Payment"] - 1],
        total: row[COL["Total (₹)"] - 1], items: row[COL["Items"] - 1], placedAt: row[COL["Placed at"] - 1],
        courier: row[COL["Courier"] - 1], trackingNo: row[COL["Tracking no"] - 1], trackingLink: row[COL["Tracking link"] - 1],
        payUrl: row[COL["Payment"] - 1] === "Awaiting payment" ? row[COL["Payment link"] - 1] : "" });
    }
  }
  return json_({ ok: false, error: "not_found" });
}

/* ---------- Razorpay ---------- */
function rzpAuth_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("RZP_KEY_ID"), secret = props.getProperty("RZP_KEY_SECRET");
  if (!id || !secret) throw new Error("Razorpay keys are missing in Script properties");
  return "Basic " + Utilities.base64Encode(id + ":" + secret);
}

function createPaymentLink_(order) {
  const c = order.customer;
  const res = UrlFetchApp.fetch("https://api.razorpay.com/v1/payment_links", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { Authorization: rzpAuth_() },
    payload: JSON.stringify({
      amount: Math.round(order.total * 100), currency: "INR", accept_partial: false,
      reference_id: order.no, description: CONFIG.STORE_NAME + " order " + order.no,
      customer: { name: c.name, contact: "+91" + c.phone, email: c.email },
      notify: { sms: true, email: true }, reminder_enable: true,
      callback_url: CONFIG.SITE_URL ? CONFIG.SITE_URL + "/track.html?no=" + encodeURIComponent(order.no) : undefined,
      callback_method: CONFIG.SITE_URL ? "get" : undefined,
    }),
  });
  const out = JSON.parse(res.getContentText());
  if (res.getResponseCode() >= 300 || !out.short_url) throw new Error("Razorpay: " + res.getContentText());
  return out;
}

function syncPayments() {
  const sh = sheet_(), data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i], id = row[COL["Razorpay link id"] - 1];
    if (!id || row[COL["Payment"] - 1] !== "Awaiting payment") continue;
    const res = UrlFetchApp.fetch("https://api.razorpay.com/v1/payment_links/" + id, { headers: { Authorization: rzpAuth_() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) continue;
    const status = JSON.parse(res.getContentText()).status;
    if (status === "paid") {
      sh.getRange(i + 1, COL["Payment"]).setValue("Paid");
      if (row[COL["Status"] - 1] === "New") sh.getRange(i + 1, COL["Status"]).setValue("Paid");
    } else if (status === "expired" || status === "cancelled") {
      sh.getRange(i + 1, COL["Payment"]).setValue(status === "expired" ? "Link expired" : "Link cancelled");
    }
  }
}

/* ---------- helpers ---------- */
function validate_(b) {
  const c = b.customer || {};
  const clean = (v, n) => String(v || "").trim().slice(0, n);
  const customer = { name: clean(c.name, 80), phone: String(c.phone || "").replace(/\D/g, "").slice(-10), email: clean(c.email, 120),
    addr: clean(c.addr, 160), area: clean(c.area, 120), city: clean(c.city, 60), pin: String(c.pin || "").replace(/\D/g, ""), state: clean(c.state, 40) };
  if (customer.name.length < 2) return { error: "name" };
  if (!/^[6-9]\d{9}$/.test(customer.phone)) return { error: "phone" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return { error: "email" };
  if (customer.addr.length < 5 || customer.city.length < 2) return { error: "address" };
  if (!/^\d{6}$/.test(customer.pin)) return { error: "pin" };
  const pay = ["upi", "card", "cod"].indexOf(b.pay) !== -1 ? b.pay : null;
  const ship = b.ship === "express" ? "express" : "standard";
  if (!pay) return { error: "pay" };
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30).map((it) => {
    const p = PRICES[it.slug]; const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
    if (!p || p.sizes.indexOf(String(it.size)) === -1) return null;
    return { slug: it.slug, name: p.name, size: String(it.size), color: clean(it.color, 30), qty: qty, line: p.price * qty };
  });
  if (!items.length || items.some((x) => !x)) return { error: "items" };
  const subtotal = items.reduce((a, x) => a + x.line, 0);
  let disc = null;
  if (b.discount) { const d = findDiscount_(b.discount, subtotal); if (d && !d.error && d.amount > 0) disc = d; }   // an invalid code is ignored, never trusted
  const after = subtotal - (disc ? disc.amount : 0);
  const delivery = ship === "express" ? SHIPPING.express : after >= SHIPPING.freeOver ? 0 : SHIPPING.standard;
  const total = after + delivery + (pay === "cod" ? SHIPPING.codFee : 0);
  const itemsText = items.map((x) => `${x.name} (${x.color}, ${x.size}) x${x.qty} = ₹${x.line}`).join("\n");
  return { customer: customer, pay: pay, ship: ship, items: items, subtotal: subtotal, disc: disc, delivery: delivery, total: total, itemsText: itemsText };
}

function uniqueNo_(sh, ref) {
  let no = /^UNO-\d{5}$/.test(String(ref || "")) ? String(ref) : "UNO-" + Math.floor(10000 + Math.random() * 89999);
  const used = sh.getLastRow() > 1 ? sh.getRange(2, COL["Order no"], sh.getLastRow() - 1, 1).getValues().map((r) => String(r[0])) : [];
  let n = 1, base = no;
  while (used.indexOf(no) !== -1) no = base + "-" + n++;
  return no;
}

function notify_(order, payUrl) {
  const c = order.customer, esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const lines = order.items.map((x) => `<li>${esc(x.name)} (${esc(x.color)}, ${esc(x.size)}) x${x.qty}: ₹${x.line}</li>`).join("");
  const discNote = order.disc ? `<p>Discount ${esc(order.disc.code)}: −₹${order.disc.amount}</p>` : "";
  const payNote = order.pay === "cod" ? `Cash on delivery (₹${order.total} incl. ₹${SHIPPING.codFee} fee)` : `Awaiting payment: <a href="${payUrl}">${payUrl}</a>`;
  try {
    if (CONFIG.NOTIFY_EMAIL) MailApp.sendEmail({ to: CONFIG.NOTIFY_EMAIL, subject: `New order ${order.no} · ₹${order.total}`,
      htmlBody: `<p><b>${esc(c.name)}</b>, +91 ${c.phone}, ${esc(c.email)}<br>${esc(c.addr)} ${esc(c.area)}, ${esc(c.city)} ${c.pin}, ${esc(c.state)}</p><ul>${lines}</ul>${discNote}<p>${order.ship} delivery · ${payNote}</p>` });
    MailApp.sendEmail({ to: c.email, subject: `Your ${CONFIG.STORE_NAME} order ${order.no}`,
      htmlBody: `<p>Hi ${esc(c.name)},</p><p>We've got your order <b>${order.no}</b>.</p><ul>${lines}</ul><p>Total ₹${order.total}. ${order.pay === "cod" ? "Pay when it arrives." : `If you haven't paid yet, use this link: <a href="${payUrl}">${payUrl}</a>`}</p>` +
        (CONFIG.SITE_URL ? `<p>Track it any time: <a href="${CONFIG.SITE_URL}/track.html?no=${order.no}">${CONFIG.SITE_URL}/track.html</a></p>` : "") });
  } catch (err) { console.error("email failed", err); }   // an email failure must never lose the order
}

function sheet_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) throw new Error('Run "Set up the Orders sheet" first');
  return sh;
}
// stops a customer typing =FORMULA into a field and having the sheet run it
function safe_(v) { return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
