# Product images and motion loops

Put files here and register them in `js/data.js` → each product's `media` block:

    media: {
      front: "images/<slug>-front.webp",   // card + product page front view (transparent or plain background)
      back:  "images/<slug>-back.webp",    // product page "03 Back" view
      loop:  "images/<slug>-loop.mp4"      // 3-5 s motion loop, plays on hover (desktop) / when visible (phones)
    }

Specs
- Stills: 1600 x 1760 px (same 10:11 shape as the cards), WebP, under 300 KB, garment centred with ~8% space around it.
- Loops: 4-6 s, seamless, 1080 px wide, H.264 MP4, no audio, under 2 MB.

Slugs: supercharge-power-boy-tee, remix-tee, ditto-overshirt, carbon-copy-shirt,
second-draft-cargo, rerun-trouser, copy-bomber, echo-work-jacket
