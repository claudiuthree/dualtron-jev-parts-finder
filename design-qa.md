# Design QA

source visual truth: supplied grid reference screenshots `C:\Users\claud\AppData\Local\Temp\codex-clipboard-769b1e7c-0e6e-4dc9-a09e-022b8bf8652f.png` and `C:\Users\claud\AppData\Local\Temp\codex-clipboard-4e1d2a34-4ebf-4c21-89e3-12366ced4628.png`
implementation: `http://127.0.0.1:4173/`
source pixels: supplied browser-frame screenshots, approximately 2048 x 1152 each
implementation capture: in-app browser viewport, approximately 1276 x 1132 CSS pixels at the rendered browser density
density normalization: source treated as browser-frame references; comparison focused on the app content region and the implementation was judged at the same desktop interaction state
state: Dualtron Mini selected, natural-language request for a controller, four live Shopify-tagged controller tiles visible

## Comparison evidence

The supplied reference is a sparse, white discovery canvas with one oversized rounded search field, a compact filter row, a count, and an image-led product grid. The implementation preserves that rhythm and adapts it to scooter parts: the search remains the primary action, category and assembly chips sit directly above the results, and the live catalogue renders as a four-column grid with title, price, and subassembly metadata.

Focused comparison regions were the search field, category/assembly filter band, first grid row, and the dynamic subassembly row. They were needed because the reference's main visual language is carried by spacing, soft shadows, compact chips, large product imagery, and restrained product labels rather than by a dense navigation system.

## Fidelity surfaces

- Fonts and typography: Inter/system sans treatment, strong compressed headline scale, small uppercase utility labels, and compact result metadata maintain the reference's clean software-product tone.
- Spacing and layout rhythm: centered search stage, generous whitespace, floating objects behind the primary action, a filter band, then a four-column product grid. The grid maintains the reference's loose spacing while adding enough metadata for the parts workflow.
- Colors and visual tokens: cool near-white canvas, navy ink, pale blue/lilac ambient shapes, soft gray borders, and a single saturated blue action match the reference's low-contrast palette.
- Image quality and asset fidelity: the generated controller/throttle/brake product visual is used as a soft ambient asset, while live Shopify product images are used on result cards; UI icons use the installed Lucide icon set rather than emoji or placeholder glyphs.
- Copy and content: the search prompt is tailored to “controller for my Dualtron Mini,” filter labels use Category, Assembly and dynamic Subassembly, and the implementation explicitly states that compatibility is filtered from exact Shopify product tags.
- Data model: the demo snapshot contains 312 Shopify search candidates, of which 221 carry the literal `Dualtron Mini` tag. `model` and `assembly` are read from existing product metafields; `subassembly` reads the live metafield when available and currently falls back to the existing `parts_type` value with that fallback labelled in the UI.

## Interaction evidence

- Changing the scooter context to Dualtron Victor changed the query and left only Victor-tagged controller matches visible; Mini-compatible results were hidden.
- Returning to Dualtron Mini restored four controller matches and showed the literal-tag count of 221.
- The category filter row exposes controller, charger, brake, throttle/display, battery, wheel/motor, electrical, body/hardware and other parts from the live snapshot.
- Selecting the Electrical assembly revealed a smaller Subassembly row; selecting Light Controllers reduced the live controller results from three to one.
- The model menu exposes Mini, Victor and Thunder with voltage and tag-derived product counts.
- Picking a live product changes the tile button to “Picked” and shows a selection bar; changing the requested category clears that selection.

## Live catalogue pass

1. Fetched the Shopify product snapshot for the requested Dualtron Mini candidate set.
2. Switched the compatibility gate from normalized model metadata to the raw Shopify `tags` array, so the exact tag remains authoritative.
3. Replaced the dense list with an image-led responsive grid, preserving title and price prominence.
4. Added category and assembly filters plus a dynamic subassembly row with live counts.
5. Added compact Model, Assembly and Subassembly metadata to each tile and surfaced the subassembly fallback explicitly.

## Findings

- No actionable P0, P1 or P2 differences remain for the requested desktop grid state.
- P3: the supplied reference uses apparel photography with a more uniform studio treatment; live Shopify scooter-part imagery is intentionally retained because catalogue truth is more important for this prototype.

## Open Questions

- The live Shopify products do not currently expose a populated `subassembly` metafield. The UI uses `parts_type` as a visibly labelled fallback until the store taxonomy is defined.

## Implementation Checklist

- Search intent remains natural-language driven.
- Raw Shopify compatibility tags remain the hard inclusion gate.
- Category, assembly and dynamic subassembly filters are interactive.
- Product tile title, price, image, stock, SKU context and subassembly are visible.
- Model switching and part picking remain functional.

## Automated checks

- `npm run build` passed.
- `npm run test:sites` passed: 4 tests, 0 failures.
- Browser console was visually clean during the in-app browser interaction pass; no runtime error surface appeared.

## Intentional deviations

- The supplied reference shows apparel imagery and minimal product labels. This prototype uses the same search-led composition and grid density but substitutes live scooter-part images and adds model context, compatibility evidence, metafield rows, and selection controls because those are required for the scooter-parts use case.
- The reference includes browser chrome; the implementation is app content only.
- Shopify was not mutated during this demo build. No `subassembly` metafield is currently populated in the fetched products, so the UI labels its local `parts_type` fallback instead of writing a new taxonomy without a mapping decision.

final result: passed
