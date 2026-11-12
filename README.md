# Loop Doodle

Draw a squiggle, get a banger. Loop Doodle is a small browser toy that turns anything you draw into a looping tune over a beat.

- Left to right is time, up is a higher note. Every line snaps to a scale, so nothing sounds wrong.
- Five sounds (Keys, Bass, Lead, Pad, Bells) and seven beat styles (Lo-fi, Boom bap, House, Techno, Trap, DnB, Dembow).
- All sound is synthesised live with the Web Audio API. No samples, no libraries, no build step.

## Run it

It is a static site. Serve the `public` folder with anything:

```
npx serve public
```

## Deploy to Cloudflare Pages

Connect this repo in Cloudflare Pages with **no build command** and **`public`** as the build output directory. `public/_headers` sets the security headers.

## Files

| File | What it is |
| --- | --- |
| `public/index.html` | Landing page, the app and the privacy/terms view (switched by `#play` and `#legal`) |
| `public/app.js` | Everything: drawing, note snapping, synths, drums, transport |
| `public/styles.css` | Styles and the self-hosted font faces |
| `public/fonts/` | Unbounded, Space Grotesk, JetBrains Mono and their licences |

## Privacy

No accounts, cookies, analytics or third-party requests. The doodle and settings are kept in the browser's local storage only.

The landing page has plain contact links (email and WhatsApp). There are no widgets, SDKs or embeds, so nothing is loaded from Meta unless a visitor clicks the WhatsApp link. Messages are used only to reply and, on request, to prepare an offer, and are deleted on request.

See the Privacy and terms view in the app.

## Licence

Code: [MIT](LICENSE), © 2026 Víg Réka. The Loop Doodle name and logo are not covered by the licence.

Fonts: SIL Open Font License 1.1, licence texts in `public/fonts/`.
