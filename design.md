---
version: anydesign-1
name: UNORGNL reference synthesis (adidas CHILE20 + Decathlon Yestalgia + Vogue Business Gen Z)
source: https://adidaschile20.com/ ; https://decathlonyestalgia.com/en/ ; https://www.vogue.com/article/gen-z-broke-the-marketing-funnel-part-ii-what-now
captured_at: 2026-10-09
description: |
  Three campaign-style references that treat a clothing drop as a story you scroll through,
  not a catalogue you filter. CHILE20 makes the garment a 3D object in themed worlds,
  Yestalgia makes the collection a loud, sticker-covered scrapbook with a product list that
  reveals images as you move, and the Vogue Gen Z report makes reading tactile with
  editorial type and playful cursor and dress-up interactions.

colors:
  yestalgia-pink: "#EAA0CD"
  yestalgia-lilac: "#E9DAE6"
  yestalgia-lime: "#D7DD44"
  yestalgia-orange: "#F09341"
  yestalgia-paper: "#F4F4F4"
  yestalgia-paper-green: "#F1F3ED"
  ink: "#000000"
  vogue-paper: "#FBFAF4"
  vogue-ink: "#161414"
  vogue-blue: "#4D9EFF"
  vogue-blue-tint: "#A4CCFA"
  vogue-lime: "#76FF02"

typography:
  yestalgia-condensed-display:
    fontFamily: "Roboto Flex (condensed width axis), sans-serif"
    fontWeight: 700
    textTransform: uppercase
  yestalgia-body-caps:
    fontFamily: "Roboto Flex, sans-serif"
    fontSize: 12px
    textTransform: uppercase
  vogue-display-sans:
    fontFamily: "Vogue Avant Garde (proprietary), geometric sans"
    fontSize: 120px
  vogue-display-script:
    fontFamily: "Didot-style italic display serif"
  vogue-body:
    fontFamily: "Adobe Garamond Pro, serif"

spacing:
  base: 4px

rounded:
  none: 0px
  button: 10px
  pill: 9999px

components:
  sticker-button:
    backgroundColor: "{colors.yestalgia-lime}"
    textColor: "{colors.ink}"
    border: "1.5px solid {colors.ink}"
    rounded: "{rounded.button}"
    shadow: "hard offset, no blur, black"
  product-name-list:
    typography: "{typography.yestalgia-condensed-display}"
    backgroundColor: "{colors.yestalgia-paper-green}"
  product-grid-tile:
    backgroundColor: "{colors.yestalgia-lilac}"
    typography: "{typography.yestalgia-body-caps}"
  swatch-dot:
    rounded: "{rounded.pill}"
  selection-highlight-label:
    backgroundColor: "{colors.vogue-blue-tint}"
    border: "1px solid {colors.vogue-blue}"
  outfit-builder:
    backgroundColor: "{colors.vogue-paper}"
  world-switcher-3d:
    backgroundColor: "{colors.ink}"
---

# Design Analysis: UNORGNL reference synthesis

> Analysis generated with the `anydesign` skill.
> Date: 2026-10-09
> Analysis emphasis: **mood and reference** (what to borrow), with enough tokens to start a direction
> For: Vinaay Singh's semi-luxury Gen Z clothing brand, working name "The Unoriginal" / UNORGNL

---

## Source

| Reference | How it was captured | Limitations |
|---|---|---|
| **adidas CHILE20**, adidaschile20.com (Active Theory, 2020) | **Site could not be loaded** (all scraping engines failed; it's an old campaign). Analysed from Active Theory's own case study (medium.com/active-theory/adidas-chile20) and the WebGPU showcase listing. | No screenshots and no tokens. Everything about it is ⚠️ medium confidence, based on the agency's write-up. |
| **Decathlon Yestalgia**, decathlonyestalgia.com/en (credits: index.studio) | Full-page rendered screenshot (1440 wide, 17,557px tall) + rendered markdown + brand extraction (Firecrawl). Colours sampled from the screenshot. | A static screenshot can't show motion. Animations are inferred from markup patterns (doubled letters, tilted images) ⚠️. |
| **Vogue Business Gen Z report**, built by Noomo for Vogue Business and Archrival | Hero screenshot (1440×900) + full rendered markdown (65k characters) + brand extraction + Noomo's case study. | Only the hero was screenshotted. Interactions come from asset names and the case study ⚠️. |
| **Ref 4: "Shadow Falcon 750" (The North Face-branded concept)**, Jai's screen recording (9s) | 12 frames extracted with ffmpeg, saved to `references/ref4-north-face-concept-frames.png`. | Source URL unknown. It looks like a designer's concept, not a live store. Hex values are estimated from video ❓. |
| **Ref 5: "Orla." (sustainable fashion concept)**, Jai's screen recording (11s) | 12 frames extracted with ffmpeg, saved to `references/ref5-orla-concept-frames.png`. | Source URL unknown. It looks like a concept. Hex values are estimated ❓. |

### Refs 4 and 5 at a glance (from the frames)

**Ref 4: Shadow Falcon 750, bold performance drop**
- Saturated red-orange background (about `#E8401C` ❓), black-and-white cut-out model photography, and a huge lowercase heavy sans headline where **a few letters turn cyan** ("shadow falcon 750", "never stop explor**ing**").
- A **spec column** of big numbers + labels (100% recycled nylon, 180 gsm fabric weight, −10° temperature rating), a big price ("$759") and an "Order jacket" button. A vertical strip of product photos sits on the right.
- **"Test your gear" interactive sliders** (rain intensity, drop speed, drop size) drive a live "01% jacket surface wetness" readout. **The product demo is an interaction.**
- A **bag and checkout that slide in as a panel in the same colour world**: line items with thumbnails, quantity steppers, total, then a white checkout panel (store pickup or delivery), all without leaving the page.
- Transitions: the photo blurs and fades into the next scene; tabs Explore / Gear / Stories / Contact.

**Ref 5: Orla., calm semi-luxury storytelling**
- Off-white background (about `#FAF8F6` ❓), pastel tie-dye clothing, a thin light grotesk for body text, the wordmark "Orla." with an italic serif "O".
- **Floating 3D-looking objects** (stones, driftwood, a fern) drift around the model with parallax as you scroll, and the camera **pushes in** from full-body to a close-up of the face.
- The copy line *"Every piece starts with what already exists: deadstock, recycled denim… finished in one atelier"*, with a neat **materials table** (Organic hemp, Recycled denim, Tencel lyocell, Deadstock cotton, each with its source).
- Giant "Shop" heading → an asymmetric, airy product grid (Wash jeans €220, Clear shield €90, Clear tote €180, Bucket hat €110), with **blur-in transitions** between sections.
- The "Six pieces from the first run, numbered by hand" idea: honest scarcity.

---

## TL;DR

All three sell a **story first and products second**:
- **CHILE20** turns each garment into a rotating 3D object inside themed worlds.
- **Yestalgia** is a loud, Memphis-style scrapbook: stickers, tilted photos, and a giant product-name list that reveals images.
- **Vogue** makes editorial reading tactile: a highlighted "selection box" headline, swappable cursors, a dress-up outfit builder.

**For UNORGNL:** borrow the *ideas*, not the costume. Use Vogue's typographic wit and dress-up interaction for the brand, Yestalgia's product-name list and hard-shadow sticker buttons for shopping, and **one** CHILE20-style 3D garment moment for the hero drop. Then keep checkout calm and fast.

---

## 1. Visual identity

### 1.1 Surface description

| | adidas CHILE20 | Decathlon Yestalgia | Vogue Gen Z |
|---|---|---|---|
| **Personality** | Cinematic, technical, street | Loud, nostalgic, playful, sticker-bomb | Witty, editorial, self-aware, tactile |
| **Mood** | "Product as hero object" | "90s scrapbook party" | "Smart magazine that plays with you" |
| **References** | Game-engine product films | Memphis design, 90s rollerblade and walkman culture | Design-tool UI (selection handles), fashion magazines |
| **Density** | Low: one object per scene | High: shapes, colour and imagery everywhere | Balanced: big type, lots of paper |
| **Confidence** | ⚠️ (write-up only) | ✅ | ✅ hero / ⚠️ rest |

### 1.2 Brand voice / Atmosphere

**CHILE20** believes the garment *is* the content. The collection was "a modern manufacture of the range", so the site builds three worlds (past: black-and-white grungy street with film grain; present: skate culture; future: a clean music studio) and lets the product travel through them. Time is the story, and the clothes are the constant.

**Yestalgia** believes nostalgia is joyful and slightly ridiculous. Everything is a sticker with a hard black shadow, headlines are split letter by letter so they can animate, and even the product names become a giant typographic poster. It never apologises for being loud.

**Vogue's Gen Z report** believes Gen Z is bored of frictionless shopping and wants "discovery, serendipity, connection and emotional payoff". So the page adds *friendly friction*: things to drag, cursors to collect, an outfit to build. The headline literally looks like a text box being edited in a design tool. It's a wink to an audience that makes content itself.

**For UNORGNL** ("The Unoriginal"): the brand's joke is that *everything is a remix*. Vogue's "edited in a design tool" gesture and Yestalgia's sticker-collage both fit that idea naturally. The site can feel like a mood board being assembled, with semi-luxury restraint in colour and photography.

### 1.3 The "ONE brand thing" of each

- **CHILE20:** the photoreal 3D garment rotating inside a themed world.
- **Yestalgia:** hard-shadow Memphis stickers everywhere, including on the buttons.
- **Vogue:** the headline wrapped in a blue selection box with handles, as if mid-edit.

**Proposed for UNORGNL:** a **"remix" gesture**. Product images and the logo arrive as if cut out and pasted onto a board (selection handles, slight tilt, snap into place). It ties straight to the name.

---

## 2. System (observed tokens)

### 2.1 Colour

**Yestalgia** (sampled from the full-page screenshot, % of page area):

| Token | Hex | Role | Area |
|---|---|---|---|
| yestalgia-pink | `#EAA0CD` | Section background (hero, OG2K) | 23.7% ✅ |
| yestalgia-lilac | `#E9DAE6` | Product grid background | 22.6% ✅ |
| yestalgia-paper-green | `#F1F3ED` | Product-name list background | 12.0% ✅ |
| yestalgia-paper | `#F4F4F4` | Page background | 10.5% ✅ |
| yestalgia-lime | `#D7DD44` | Buttons (Menu, Shop, language), lightning stickers | ✅ (from brand extraction) |
| yestalgia-orange | `#F09341` | Sticker dots, sun | 0.7% ✅ |
| ink | `#000000` | All text, sticker shadows, outlines | ✅ |

**Vogue** (sampled from the hero):

| Token | Hex | Role |
|---|---|---|
| vogue-paper | `#FBFAF4` | Warm paper background ✅ |
| vogue-ink | `#161414` | Text ✅ |
| vogue-blue | `#4D9EFF` | Selection handles and frame ✅ |
| vogue-blue-tint | `#A4CCFA` | Selection fill behind "GEN Z BROKE" ✅ |
| vogue-lime | `#76FF02` | The "(part II)" tag ✅ |

**CHILE20:** a red palette taken from the product, plus a black-and-white grungy world with grain ⚠️ (case study).

### 2.2 Typography

- **Yestalgia:** Roboto Flex (variable). It uses the **condensed width axis**, uppercase, for huge headlines ("THE MOST VIBRANT DECADE EVER", the product-name list), and tiny 12px uppercase for product labels and prices. A separate wide, extended italic wordmark is used for the shoe name ("OG2K, ORIGINS 2000"). ✅
- **Vogue:** three voices. A geometric sans display at about 120px ("the marketing funnel"), a monospace-feeling all-caps label inside the selection box, and a Didot-style italic script ("What now?"), with Garamond for reading. ✅ (fonts from brand extraction; the sans and Didot faces are proprietary)
- **CHILE20:** not documented ❓.

### 2.3 Shape, depth, spacing

- **Yestalgia:** 0px radius on photos, **10px radius buttons with a black border and a hard offset shadow**, the same hard shadow on every sticker. Thin horizontal pink stripes as section dividers. ✅
- **Vogue:** flat, no shadows. Circular icon buttons (menu and share) at 40px, filled black or outlined. ✅
- 4px base spacing on both (brand extraction) ⚠️.

Accessibility: see `design-a11y.md`. Every pair passes **except Vogue's white text on the light-blue highlight (1.67:1)**. Don't copy that pairing.

---

## 3. Components

#### sticker-button
Yestalgia's Menu, Language and Shop buttons: lime `{colors.yestalgia-lime}` fill, black text, 1.5px black border, `{rounded.button}` corners and a **hard black offset shadow with no blur**, like a sticker. Playful, but still clearly a button. ✅
**For UNORGNL:** keep the hard shadow, but use the brand's own accent instead of lime.

#### product-name-list
Yestalgia's "full collection" section: every product name set huge in condensed caps, stacked one per line in `{typography.yestalgia-condensed-display}`. A product photo strip appears between or behind the names (in the static capture, image strips peek between the lines and some names overlap, which suggests a hover or scroll reveal ⚠️). Each item has an index number [01], [02] and a price in the markup. ✅ structure / ⚠️ motion
**For UNORGNL:** a great "shop the drop" index. It's fast to scan and feels editorial.

#### product-grid-tile
Yestalgia's grid: an irregular masonry of photos (some cropped to the face, some full-body), with a 12px uppercase name and price under each, on lilac. ✅
**For UNORGNL:** borrow the irregular rhythm for lookbook-style shopping, but keep tiles predictable on mobile.

#### swatch-dot
Small circular colour dots beside each product name (pink, white, purple, green) to switch colourways. ✅

#### selection-highlight-label
Vogue's headline label sits in a light-blue box with blue round handles at the corners, exactly like selected text in Figma. ✅
**For UNORGNL:** a perfect "remix / being edited" signature. **Use dark text** on the tint (white fails contrast).

#### outfit-builder
Vogue's page ships separate assets for a body (`body_woman.png`), tops and bottoms (`clothes-top.png`, `clothes-bottom.png`) and 7 bag items (`bag-item1`–`7`), which points to a **drag-and-dress or swap-the-outfit interaction**. Noomo's case study describes elements that "stretch, shake, reveal and snap into place". There are also 6 custom cursor images that change as you move through the page. ⚠️ (inferred from assets and case study)
**For UNORGNL:** a "build your fit" interaction. Mix a top, a bottom and an accessory from the drop, then add the full look to the bag. This sells more than one item and is very shareable.

#### world-switcher-3d
CHILE20's three themed worlds, which you scroll or drag between. Garments are realtime 3D with a camera that rotates and zooms to key details, with depth-of-field blur. ⚠️ (case study)
**Their performance tricks** (worth copying if we do 3D):
- models reduced from 3.5 million to about 20k polygons
- low-resolution textures load first, then sharper ones (2k on mobile, 4k on desktop)
- symmetrical garments exported as half a mesh and mirrored
- only one inner scene rendered per frame during transitions

---

## 4. Layout

- **Yestalgia:** centred single-column story sections (hero video → illustrated "decade" section → product grid → "about the artist" → character carousel "The Yestalgia family" → the OG2K shoe feature → the giant name list → footer). Each section changes background colour, so scroll position feels like changing rooms. A fixed header has the sticker buttons on the left and right and the logo in the centre. Anchor navigation: Collection / Artist / Behind the scenes / Lookbook. ✅
- **Vogue:** long-form editorial with a numbered chapter menu (1 to 4, with sub-chapters), a giant centred hero typeset across mixed fonts, and floating circular menu and share buttons. ✅
- **CHILE20:** fullscreen WebGL "worlds" as chapters, moving from the home page to each section and back. ⚠️
- **Responsive:** not captured for any of the three. Mobile screenshots are still needed ❓.

---

## 5. What to borrow for UNORGNL, and how to build it

### Borrow map

| From | Borrow | Where on the UNORGNL site |
|---|---|---|
| CHILE20 | One realtime 3D garment that turns as you scroll, in 2 or 3 themed "worlds" (e.g. Original / Remix / Future) | Home hero and each drop launch page |
| CHILE20 | The performance pipeline (low-poly, progressive textures, mobile LOD) | Required if we do any 3D |
| Yestalgia | Split-letter headline animation, colour-changing sections, sticker shapes with hard shadows | Home story sections |
| Yestalgia | The giant **product-name list** with image reveal, and colour swatch dots | "Shop the drop" index |
| Yestalgia | Anchor navigation: Collection / Story / Behind the scenes / Lookbook | Drop pages |
| Vogue | **Selection-box headline** with handles (the "being edited / remix" gesture) | Brand signature on every page |
| Vogue | **Outfit builder** (mix top, bottom and accessory, then add the look to the bag) | Lookbook / "Build your fit" |
| Vogue | Mixed type voices (bold sans + italic serif accent) and a warm paper background | Brand system, toned to semi-luxury |
| Ref 4 (Shadow Falcon) | Huge lowercase headline with a few accent-coloured letters; a spec column of big numbers | Product hero (GSM, fabric, fit, made in) |
| Ref 4 (Shadow Falcon) | **Slide-in bag and checkout panel** in the same colour world, so people never "leave the story" | Cart experience |
| Ref 4 (Shadow Falcon) | An interactive product demo (sliders) | Optional: e.g. a "fit" or "fabric stretch" demo |
| Ref 5 (Orla.) | Calm off-white base, floating objects with parallax around the model, camera push-in on scroll | Home hero and lookbook: **the semi-luxury tone** |
| Ref 5 (Orla.) | A materials table and a "first run, numbered" story | Product pages and "About the drop" |
| Ref 5 (Orla.) | The "what already exists" copy angle | Perfect fit for "The Unoriginal": everything is a remix of what exists |

### Suggested stack (⚠️ to confirm with Vinaay's budget and how he'll run the store)
- **Shopify** backend (cart, payments: UPI, cards, COD; inventory).
- A custom front end with **GSAP ScrollTrigger** for scroll motion, **Three.js / React Three Fiber** for the one 3D garment, and **Lenis** for smooth scroll. Or a Shopify theme with custom sections if the budget is tighter.
- 3D garment source: CLO3D or Marvelous Designer, reduced and exported as compressed glTF.

### Quick wins
- The selection-box headline, sticker buttons, colour-changing sections and the product-name list are all CSS + GSAP. No 3D needed.

### Tricky bits
- Realistic 3D garments need real 3D models of Vinaay's actual products, which is extra cost and time.
- The outfit builder needs consistently photographed cut-outs of every product.
- Heavy animation on mid-range Android phones (most Indian buyers). Needs a lighter mobile version.

### Confidence map
Yestalgia ✅ visuals / ⚠️ motion · Vogue ✅ hero / ⚠️ interactions · CHILE20 ⚠️ throughout (offline, case study only).

---

## 6. Do's and Don'ts (for UNORGNL)

### Do
- Do treat each drop as a **story chapter** with its own colour, like Yestalgia's sections and CHILE20's worlds.
- Do make the "remix" gesture the brand signature: selection boxes, cut-out images that snap into place.
- Do use a giant, scannable **product-name list** for drop pages, with prices visible.
- Do limit 3D to **one** hero garment per drop, with progressive loading and a static image fallback on low-end phones.
- Do keep checkout plain and fast: no stickers or motion between "Add to bag" and payment.
- Do respect "reduce motion" settings.

### Don't
- Don't copy Yestalgia's full Memphis palette. Pink, lilac and lime at full volume reads "fast fashion party", not semi-luxury. Take its *structure*, and tone the colour down.
- Don't put white text on light tints (Vogue's highlight fails at 1.67:1).
- Don't hide prices or sizes inside animations. Gen Z shoppers check price and fit first.
- Don't make people sit through an intro before they see clothes.
- Don't run realtime 3D for every product. CHILE20 needed a specialist studio and heavy optimisation for 8 items.

---

## 7. Open questions

- 1. **What does Vinaay's first collection actually look like?** Colours, number of pieces and photography style decide the palette more than any reference.
- 2. **Brand name:** "The Unoriginal" / UNORGNL is still a working name (trademark and domain not checked).
- 3. **Budget and timeline for 3D:** do we model garments in 3D, or fake it with a 360° photo spin (much cheaper)?
- 4. **Platform:** Shopify (recommended) or another? Who manages products day to day?
- 5. **Mobile captures** of Yestalgia and Vogue are still needed to judge how their motion scales down.
- 6. **Refs 4 and 5 are recordings with no source URL.** If you have the links (Dribbble, Behance, live site), share them so we can credit them and check the motion properly.
- 7. **CHILE20 is offline**, so its visuals are second-hand. Its case-study video or GIFs should be watched before committing to that direction.
