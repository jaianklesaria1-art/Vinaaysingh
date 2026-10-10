# unorgnl. image and motion prompts (stand-ins until the real photoshoot)

Date: 10 October 2026
Use these to generate temporary product images. Replace them with Vinaay's real photos before launch, because customers expect what they see to be what arrives.

Best tools:
- **Stills:** Midjourney v7, Flux 1.1 Pro, or ChatGPT image. **Use ChatGPT image or Ideogram for anything with text on it** (the Supercharge print), because other tools garble lettering.
- **Motion loops:** Kling 2.x, Runway Gen-4, Google Veo 3 or Higgsfield, using image-to-video from your finished still.

---

## 1. Style block (paste at the END of every still prompt so all images match)

> e-commerce ghost mannequin product photo, garment shown on an invisible mannequin with natural 3D volume, straight front view, centered, whole garment visible with generous empty space around it, plain seamless light grey studio background #EFEDE8, soft diffused softbox lighting from front-left, gentle natural shadow under the hem, true-to-life cotton fabric texture, visible stitching and seams, realistic folds, photorealistic, sharp focus, no model, no hanger, no props, no watermark, no extra text

Settings: aspect ratio **10:11 (or 4:5)**, highest quality. Send me the results and I'll remove the backgrounds so the garments float on the cards.

---

## 2. Product stills (front, for the cards)

| # | Product | Prompt (+ style block) |
|---|---|---|
| 1 | **Supercharge Power Boy Tee** (Bone) | oversized boxy heavyweight 240 gsm cotton t-shirt in warm off-white bone colour, dropped shoulders, ribbed crew neck, large puff-print graphic on the chest: the word "SUPERCHARGE" in bold condensed black capitals above a red-orange lightning bolt with a thick black outline, and the words "POWER BOY" in bold condensed black capitals below it, two small red dots beside the bolt |
| 2 | **Remix Tee** (White) | oversized boxy heavyweight 240 gsm plain white cotton t-shirt, dropped shoulders, thick ribbed crew neck, slightly cropped boxy length, no print |
| 3 | **Ditto Overshirt** (Sand) | boxy heavy cotton twill overshirt in sand beige, point collar, full button placket with dark horn buttons, two flap chest pockets, long sleeves with buttoned cuffs, garment-dyed look |
| 4 | **Carbon Copy Shirt** (White) | relaxed short-sleeve cotton poplin shirt in white with a camp (Cuban) collar, straight hem, single chest pocket, soft drape |
| 5 | **Second Draft Cargo** (Stone) | wide straight-leg cargo pants in stone beige garment-dyed cotton twill, six pockets including two bellowed side cargo pockets, drawcord at the hem, belt loops |
| 6 | **Rerun Trouser** (Concrete) | relaxed tapered pleated trousers in concrete grey cotton twill, single front pleat, clean waistband, slant pockets |
| 7 | **Copy Bomber** (Red) | cropped boxy bomber jacket in deep signal red nylon with a subtle sheen, black ribbed collar, cuffs and hem, front zip, small zip sleeve pocket, lightly padded |
| 8 | **Echo Work Jacket** (Concrete) | boxy workwear chore jacket in concrete grey cotton canvas, corduroy collar, four patch pockets, metal snap buttons, slightly faded worn-in look |

**Other colours:** reuse the same prompt and change only the colour words (e.g. "in black", "in ice blue"), so the shape stays identical across swatches.

---

## 3. Back views (product page "03 Back")

Same prompt as the front, but replace "straight front view" in the style block with **"straight back view, garment seen from behind"** and remove any front-only details (pockets, print, buttons).

---

## 4. Lifestyle images (hero, lookbook, wind section)

**Hero / lookbook model (one per product):**
> full-body fashion editorial photo of a 22-year-old Indian man [or woman] with a confident relaxed pose, wearing [PRODUCT DESCRIPTION FROM THE TABLE], styled with [straight black trousers / white sneakers], standing on a plain warm off-white studio cyclorama, soft daylight-style key light, clean minimalist streetwear campaign, natural skin texture, sharp focus, 4:5, no text

**Supercharge wind shot (for the wind section):**
> the Supercharge Power Boy oversized bone t-shirt hanging on a simple black wire hanger outdoors, fabric rippling and lifting in a strong breeze, rolling green hills and soft hazy sky behind, golden-hour light, dreamy fashion campaign, shallow depth of field, photorealistic, 16:9

**Alternative wind shot on a model:**
> Indian Gen Z model standing on a green hilltop wearing the Supercharge Power Boy oversized tee, wind blowing the t-shirt fabric and hair to one side, soft overcast light, rolling hills behind, cinematic streetwear campaign, 16:9

---

## 5. Motion loops (clothes moving like on a real body)

Generate from the finished stills with image-to-video, 5 seconds:

| Use | Prompt |
|---|---|
| **Card loop (ghost mannequin)** | the garment gently sways and rotates a few degrees left and right as if worn by an invisible person shifting their weight, fabric folds and hem move naturally with realistic cloth physics, camera completely still, background unchanged, seamless loop |
| **Card loop (on model)** | the model takes one slow step toward the camera and turns slightly to the side, the fabric moves naturally with the body, sleeves and hem swing realistically, static camera, plain studio background, smooth seamless loop |
| **Wind section** | a steady breeze makes the t-shirt ripple and lift from the hem, sleeves flutter, hanger swings slightly, grass moves in the background, static camera, seamless loop |

**Watch for** warped text or logos, extra fingers, and fabric that melts or morphs. Prints with text (Supercharge) often break, so keep the text-print shots short, or use real footage for that one.

Send me the clips and I'll trim them into seamless 4 to 5 second loops, compress them (MP4 under 2 MB) and connect them to the cards.

---

## 6. File names

`<slug>-front.webp`, `<slug>-back.webp`, `<slug>-loop.mp4`. The slugs are listed in `site/images/README.md`.
