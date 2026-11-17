/* ============================================================
   SHOP CONFIG — edit this file to run the store.
   Everything the cart / checkout needs lives here.
   ============================================================ */
window.SHOP_CONFIG = {
  brand: 'Pure · Estate Black Pepper',

  /* ---- money ---- */
  currency: '₹',
  locale: 'en-IN',
  freeShippingOver: 499,   // order subtotal that unlocks free shipping
  shippingFlat: 49,        // shipping charge below that

  /* ---- products & prices ----
     PLACEHOLDER PRICES — replace with your real ones.
     Prices are whole numbers in the currency above, per pack size (g = grams). */
  products: {
    A: {
      name: 'Imperial Reserve',
      defaultG: 250,
      sizes: [
        { g: 100,  price: 299 },
        { g: 250,  price: 719 },
        { g: 500,  price: 1399 },
        { g: 1000, price: 2699 }
      ]
    },
    B: {
      name: 'Select Kitchen Grade',
      defaultG: 250,
      sizes: [
        { g: 100,  price: 199 },
        { g: 250,  price: 479 },
        { g: 500,  price: 929 },
        { g: 1000, price: 1799 }
      ]
    },
    C: {
      name: 'Standard Grind & Extract',
      defaultG: 500,
      sizes: [
        { g: 100,  price: 129 },
        { g: 250,  price: 309 },
        { g: 500,  price: 599 },
        { g: 1000, price: 1149 }
      ]
    }
  },

  /* ---- taking payment ----
     Paste your Razorpay *Key ID* (starts with rzp_test_ or rzp_live_) to turn on
     real card / UPI / netbanking payments at checkout.
     Leave it empty and checkout runs in DEMO mode: no money is taken. */
  razorpayKeyId: '',

  /* ---- receiving orders ----
     URL that receives each completed order as JSON (POST). Works with Formspree,
     Make/Zapier webhooks, a Netlify/Cloudflare function, Google Apps Script, etc.
     Leave empty and orders are NOT sent anywhere. */
  orderEndpoint: ''
};
