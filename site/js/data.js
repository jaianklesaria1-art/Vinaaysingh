/* UNORGNL prototype data. Everything here is SAMPLE content until Vinaay sends the real collection.
   Real photos/videos: drop files into /images and fill the `media` block of a product, e.g.
   media: { front: "images/<slug>-front.webp", back: "images/<slug>-back.webp", loop: "images/<slug>-loop.mp4" }
   Photos belong to the FIRST colour in the list. Other colours, or other colours via media.byColor["Black"] = { front, back }.
   Until a photo exists the illustrated garment is used. */
window.UNORGNL = {
  brand: "unorgnl.",
  currency: "₹",
  freeShippingOver: 2999,
  shippingFee: 99,
  categories: ["T-shirts", "Shirts", "Pants", "Jackets"],
  /* tone = background of the card stage for each category */
  tones: { "T-shirts": "#EADFCF", "Shirts": "#C9DCE6", "Pants": "#DCDAD5", "Jackets": "#F1C9C5" },
  materials: [
    ["Heavyweight cotton", "240 gsm, combed"],
    ["Cotton twill", "Garment dyed"],
    ["Cotton poplin", "Soft hand feel"],
    ["Nylon shell", "Water resistant"],
  ],
  products: [
    {
      slug: "supercharge-power-boy-tee", name: "Supercharge Power Boy Tee", type: "tee", print: "power", category: "T-shirts", price: 2299,
      tagline: "Fully charged. Built to move.",
      colors: [{ name: "Bone", hex: "#EFEAE0" }, { name: "Black", hex: "#1C1C1C" }, { name: "Ice", hex: "#C9DCE6" }],
      specs: [["240", "gsm cotton"], ["Puff", "print"], ["Boxy", "oversized fit"]],
      fit: "Oversized. Take your usual size for a loose fit, one down for a regular fit.",
      media: { front: "images/supercharge-power-boy-tee-front.webp" },
    },
    {
      slug: "remix-tee", name: "Remix Tee", type: "tee", category: "T-shirts", price: 1999,
      tagline: "The boxy tee, cut again.",
      colors: [{ name: "White", hex: "#F4F1EA" }, { name: "Black", hex: "#1C1C1C" }, { name: "Red", hex: "#D8262C" }],
      specs: [["240", "gsm cotton"], ["Boxy", "dropped shoulder"], ["100%", "combed cotton"]],
      fit: "Oversized. Take your usual size for a loose fit, one down for a regular fit.",
      media: { front: "images/remix-tee-front.webp" },
    },
    {
      slug: "ditto-overshirt", name: "Ditto Overshirt", type: "overshirt", category: "Shirts", price: 3299,
      tagline: "Shirt or jacket. Your call.",
      colors: [{ name: "Sand", hex: "#D9CBB0" }, { name: "Slate", hex: "#5E6670" }, { name: "Black", hex: "#1C1C1C" }],
      specs: [["2", "chest pockets"], ["Twill", "heavy cotton"], ["Boxy", "fit"]],
      fit: "Boxy. Take your usual size to layer over a tee.",
      media: { front: "images/ditto-overshirt-front.webp" },
    },
    {
      slug: "carbon-copy-shirt", name: "Carbon Copy Shirt", type: "overshirt", category: "Shirts", price: 2799,
      tagline: "The everyday shirt, printed twice.",
      colors: [{ name: "White", hex: "#F4F1EA" }, { name: "Ice", hex: "#C9DCE6" }],
      specs: [["Poplin", "cotton"], ["Relaxed", "fit"], ["Camp", "collar"]],
      fit: "Relaxed. Take your usual size.",
      media: { front: "images/carbon-copy-shirt-front.webp" },
    },
    {
      slug: "second-draft-cargo", name: "Second Draft Cargo", type: "cargo", category: "Pants", price: 2999,
      tagline: "Utility pants, edited down.",
      colors: [{ name: "Stone", hex: "#CFC6B4" }, { name: "Black", hex: "#1C1C1C" }],
      specs: [["6", "pockets"], ["Twill", "garment dyed"], ["Wide", "straight leg"]],
      fit: "Wide straight leg with a drawcord hem. Take your usual waist size.",
      media: { front: "images/second-draft-cargo-front.webp" },
    },
    {
      slug: "rerun-trouser", name: "Rerun Trouser", type: "cargo", category: "Pants", price: 2699,
      tagline: "The pleated trouser, run back.",
      colors: [{ name: "Concrete", hex: "#8C8B87" }, { name: "Black", hex: "#1C1C1C" }],
      specs: [["Single", "pleat"], ["Twill", "cotton"], ["Relaxed", "taper"]],
      fit: "Relaxed with a slight taper. Take your usual waist size.",
      media: {},
    },
    {
      slug: "copy-bomber", name: "Copy Bomber", type: "jacket", category: "Jackets", price: 4499,
      tagline: "The classic bomber, copied right.",
      colors: [{ name: "Red", hex: "#C8232A" }, { name: "Black", hex: "#1C1C1C" }, { name: "Oxblood", hex: "#6E1414" }],
      specs: [["Nylon", "shell"], ["Rib", "collar and cuffs"], ["Padded", "lining"]],
      fit: "Cropped and boxy. Take your usual size.",
      media: { front: "images/copy-bomber-front.webp" },
    },
    {
      slug: "echo-work-jacket", name: "Echo Work Jacket", type: "jacket", category: "Jackets", price: 3999,
      tagline: "Workwear, said again.",
      colors: [{ name: "Concrete", hex: "#8C8B87" }, { name: "Sand", hex: "#D9CBB0" }],
      specs: [["Canvas", "cotton"], ["4", "pockets"], ["Boxy", "fit"]],
      fit: "Boxy. Size up for layering over a hoodie.",
      media: {},
    },
  ],
  /* REVIEWS: real customer reviews only, with their permission. Until this list has entries the site shows
     clearly marked placeholder slots. Format: { quote: "...", name: "First name", detail: "City", slug: "remix-tee" } */
  /* ORDERS (option C: Google Sheet + Razorpay payment links + WhatsApp). Setup: backend/SETUP.md
     ordersUrl: the Apps Script web app URL (ends in /exec). Empty = demo mode, nothing is sent anywhere.
     whatsapp: shop number with country code, digits only, e.g. "919800000000". Empty hides WhatsApp buttons. */
  backend: { ordersUrl: "", whatsapp: "" },
  /* DISCOUNT CODES used only in demo mode (no ordersUrl). Live codes come from the "Discounts" tab of the order sheet,
     which also re-checks every code when an order arrives. type: "percent" or "flat"; min = minimum order in ₹. */
  demoDiscounts: [{ code: "FIRSTRUN10", type: "percent", value: 10, min: 0, label: "10% off your first order" }],
  /* SAMPLE reviews written for the client demo (sample: true shows a small "Sample" tag).
     DELETE these and add real ones before launch. Order fills the grid: big, small, then the middle column, then small, big. */
  reviews: [
    { sample: true, slug: "supercharge-power-boy-tee", name: "Aarav", detail: "Pune", quote: "Wore the Supercharge tee to a gig and three people asked where it's from. The puff print feels raised and properly made, not like a sticker." },
    { sample: true, slug: "copy-bomber", name: "Meher", detail: "Mumbai", quote: "The red on the bomber is unreal in person. Cropped fit sits exactly right." },
    { sample: true, slug: "remix-tee", name: "Kabir", detail: "Bengaluru", quote: "Finally a boxy tee that keeps its shape all day." },
    { sample: true, slug: "second-draft-cargo", name: "Ishaan", detail: "Delhi", quote: "Six pockets and it still looks clean. The drawcord hem is the move." },
    { sample: true, slug: "ditto-overshirt", name: "Tara", detail: "Hyderabad", quote: "Throw it over a tee and you're done. My most worn piece this month." },
    { sample: true, slug: "carbon-copy-shirt", name: "Rohan", detail: "Ahmedabad", quote: "Camp collar, soft poplin. It's in my bag for every trip now." },
    { sample: true, slug: "rerun-trouser", name: "Ziya", detail: "Kolkata", quote: "Didn't think trousers could be the statement piece. The pleat and the taper make the whole fit look planned." },
  ],
  sizes: { tee: ["S", "M", "L", "XL", "XXL"], overshirt: ["S", "M", "L", "XL"], cargo: ["28", "30", "32", "34", "36"], jacket: ["S", "M", "L", "XL"] },
};
