# Orders setup: Google Sheet + Razorpay + WhatsApp

This connects the website to a Google Sheet. Every order lands in the sheet, UPI and card orders get a Razorpay payment link, and Vinaay updates order status in the sheet. Customers track their order on the site (Track your order page).

Do this on **Vinaay's own Google and Razorpay accounts**, so the orders and money are his. It takes about 30 to 45 minutes. Razorpay's account approval (KYC) can take a few days, so start that first.

## What you need
- A Google account (Vinaay's)
- A Razorpay account with KYC done. Razorpay asks for PAN and a bank account, so check their current requirements on razorpay.com before signing up.
- The shop's WhatsApp number

## 1. Razorpay (start first, approval takes time)
1. Sign up at razorpay.com and finish KYC.
2. Until approved, use **Test mode** (switch at the top of the dashboard). Test payments use fake money.
3. Go to **Account & Settings → API Keys → Generate key**. Copy the **Key ID** and **Key Secret**. Keep the secret private; never put it in the website files.

## 2. The Google Sheet
1. Create a new Google Sheet called "unorgnl. orders".
2. In the sheet: **Extensions → Apps Script**.
3. Delete what's in `Code.gs` and paste everything from `backend/google-apps-script/Code.gs`.
4. At the top of the file, fill in `CONFIG`:
   - `NOTIFY_EMAIL`: where new-order emails go
   - `SITE_URL`: the live website address, e.g. `https://unorgnl.in` (no slash at the end)
   - `WHATSAPP_NUMBER`: e.g. `919800000000`
5. Check `PRICES` matches the site's prices (`site/js/data.js`). Update both whenever a price changes.
6. **Project Settings (gear icon) → Script properties → Add**:
   - `RZP_KEY_ID` = your Razorpay Key ID
   - `RZP_KEY_SECRET` = your Razorpay Key Secret
7. Save, then go back to the sheet and reload it. A new **unorgnl.** menu appears.
8. **unorgnl. → Set up the Orders sheet**. Approve the permissions Google asks for (it's your own script). This creates the **Orders** and **Discounts** tabs.
9. **unorgnl. → Turn on automatic payment checks**. This checks Razorpay every 10 minutes and marks paid orders.

## 3. Publish the script
1. In Apps Script: **Deploy → New deployment → Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Deploy and copy the **Web app URL** (ends in `/exec`).
4. After any change to the code, use **Deploy → Manage deployments → Edit → New version**, so the same URL keeps working.

## 4. Connect the website
In `site/js/data.js`:
```js
backend: { ordersUrl: "PASTE THE /exec URL HERE", whatsapp: "919800000000" },
```
Upload the site. While `ordersUrl` is empty the site runs in demo mode and sends nothing.

## 5. Test before going live
With Razorpay in **Test mode**:
1. Place an order with UPI on the site. A row appears in **Orders** with Payment = "Awaiting payment".
2. Click "Pay with Razorpay" and pay with a test method from Razorpay's test docs.
3. Within 10 minutes (or **unorgnl. → Check Razorpay payments now**) the row changes to Paid.
4. Place a Cash on delivery order. It arrives as "Cash on delivery", with no payment link.
5. Try a discount code (FIRSTRUN10 is created as an example) and check the row shows it.
6. Open **Track your order** on the site with the order number and mobile.

Then switch Razorpay to **Live mode**, generate live keys, and replace the two Script properties.

## Daily use (for Vinaay)
- **New orders** arrive in the Orders tab and by email.
- **Status** column: change it as the order moves: New → Paid → Packed → Shipped → Delivered (or Cancelled / Returned). Customers see this on the Track page.
- **Shipping**: fill in Courier, Tracking no and Tracking link when you ship.
- **WhatsApp** column: click "Message" to open a chat with that customer.
- **Paid?** Only ship UPI/card orders once Payment says "Paid".

## Discounts (Discounts tab)
One row per code:

| Column | What to put |
|---|---|
| Code | The code customers type, e.g. DIWALI15 |
| Type | Percent or Flat |
| Value | 15 for 15%, or 300 for ₹300 off |
| Min order (₹) | Minimum order for the code to work (0 for none) |
| Active | Tick to switch on, untick to switch off |
| Expires | Optional date; the code stops working after it |
| Max uses | Optional limit; leave empty for unlimited |
| Used | Counted automatically |
| Label | Short line the customer sees, e.g. "15% off for Diwali" |

The site checks codes against this tab, and every order is re-checked here, so a code can't be faked from the browser.

## Limits to know
- Google's free email quota is about 100 emails a day on a normal Gmail account. Fine for a new shop.
- Payment status updates every 10 minutes, not instantly.
- This is a starter setup. When orders grow, move to Shopify (or a custom backend) and import this sheet.
