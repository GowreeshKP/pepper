# Noir: Black Pepper Experience

A scroll-driven 3D landing page for a single-origin black pepper brand (Western Ghats, India), modelled on the Lay's Crunch Experience structure. Runs in the browser on Three.js, GSAP and Lenis.

```
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Page structure

1. **Hero:** "The purest spice on earth." A 3D carousel of the three grade pouches (Imperial, Select, Standard). Arrows, dots, drag/swipe, arrow keys and autoplay. The grade colour re-themes the page.
2. **The silent crisis in your spice rack:** adulteration trap, aroma deficit, broken chain, plus a mass-market vs Noir comparison and the brand pledge.
3. **The genesis (pinned 3D story):** four chapters (mist, hand-harvest, sun-drying, pure) scrubbing the pouch rotation and camera.
4. **The art of grading:** Grade A Imperial Reserve, Grade B Select Kitchen, Grade C Standard Grind & Extract. Each card has gram chips (100 g / 250 g / 500 g / 1 kg) or a custom gram amount.
5. **What sets us apart:** estate traceability, piperine retention, lab verification, gram-scale packaging.
6. **Taste history. Taste purity.:** closing CTA, peppercorn storm, and an inquiry modal ("Secure your batch").

There is no checkout and no invented pricing. Every CTA opens the inquiry form, prefilled with the chosen grade and grams. The form is a front-end demo; connect `src/grades.js` to your backend or email service to receive real inquiries.

## Where to edit

- Copy and grade data: `src/data.js` (`GRADES`, `CRISIS`, `CHAPTERS`, `PROCESS`) and `index.html`.
- Styles: `src/style.css`.
- 3D scene and scroll choreography: `src/scene.js`, `src/main.js`.

## Everything is generated in code

No external assets. Pouch artwork is painted on canvas (`src/textures.js`), the pillow bag with crimped seals is built in `src/bag.js`, and the wrinkled peppercorn geometry is in `src/corn.js`. One fixed WebGL canvas (`src/scene.js`) sits behind the HTML and reads shared scroll and carousel state each frame.

Brand, names and details are fictional. Fan / portfolio concept.
