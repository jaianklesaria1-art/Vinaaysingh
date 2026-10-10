# unorgnl. website prototype (Vinaay Singh)

Clickable prototype of the full buying journey: home → shop / Drop 01 → product → slide-in bag → checkout → order placed.

Direction: Orla-style calm base (home, shop, product) + Shadow Falcon-style colour takeover for the drop page and the bag/checkout drawer. See ../design.md.

## Run it
    python -m http.server 8790
    open http://localhost:8790/

## Files
| What | File |
|---|---|
| Products, prices, colours, sizes, materials (ALL SAMPLE) | js/data.js |
| Illustrated garment cut-outs (stand-ins for photos) | js/garments.js |
| Header, bag drawer, checkout, page logic, animations (GSAP) | js/app.js |
| Styles and tokens | css/site.css |
| Pages | index.html, product.html (Drop 01 page removed 2026-10-09) |

## Placeholders to replace
- Product names, prices, specs, sizes, size charts, policies: samples.
- Garment illustrations → real product photography (cut-outs on plain background work best).
- Checkout is a front-end mock: no payment, no order created. Real build connects to Shopify (cart, UPI/cards/COD, inventory).
