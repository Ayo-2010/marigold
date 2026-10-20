# Marigold Diner — Order Pad

A 1950s roadside diner rendered as a physical order pad, a printed bill of fare, a grill ticket and a customer receipt. Warm cream paper, mustard tabs, cherry-red ink and a chrome-edged checkered floor hold a genuinely working order system.

## What it does

- Menu of griddle orders, blue plates, sandwiches and fountain drinks, filtered by category.
- Daily blue plate special that changes with the weekday, with its own add-to-seat button.
- Seat tabs for Seat 1, Seat 2, Seat 3 and the counter. Each tab shows its own running subtotal and item count.
- Add dishes to the active seat, increase or decrease quantities, remove lines, and cycle each line through ordered, cooking and served.
- Kitchen ticket lists every open item with seat and status, plus fire-ticket and all-served actions.
- Itemized customer receipt with subtotal, 8.25% tax, tip and check total.
- Tip presets from 0 to 20 percent, table number and server selection.
- Close-out slip with a settle action that records the check in today's take, starts a new check number, and a two-step void that records no sale.
- Order state, tip, table, server, ticket number and daily take persist in `localStorage`.
- Toast and screen-reader announcements, keyboard-operable controls, visible focus states and a responsive layout down to 390 px.

## Files

- `index.html` — storefront, menu sheet, order pad, tickets and close-out dialog
- `styles.css` — diner palette, paper texture, checkered floor, tab and receipt styling
- `app.js` — menu data, seat logic, totals, persistence, kitchen and receipt rendering
- `README.md` — this document

## Run it

There is no build step and nothing to install. Open `index.html` in a browser or serve the folder with any static file server. Bebas Neue, Yellowtail and Courier Prime load from Google Fonts; every other visual is CSS.

Live demo: https://ayo-2010.github.io/marigold/
