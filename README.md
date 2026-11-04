# The UniVast
Static 3D space and universe site. Plain HTML/CSS/JS, no build step, GitHub Pages ready.

## Ownership
- **Mochi**: universe3d.js (optional module loaded by index.html if present), the 3D viewers, and black-holes.html / pulsars.html / merger.html
- **Oraly**: data/*.json facts and sources.html (nobody else edits data/)
- **Mr. Fart**: Strange Worlds copy (strange-worlds.html / exoplanets.html) and sounds.html
- **Poby**: nav.js, style.css, structure, pushing

## Rules
- data/sounds.json entries: title, type ("recording" or "sonification"), source, licence, url, file. Every file in audio/ needs an entry.
- Footer on every page: illustrations are not photographs; space carries no sound.

## Legacy
The old black hole site's pages (simulator, pulsar, pulsar3d, merger, etc.) have their own nav and style, so they were not merged. They are in legacy/ and still work as they are (own style.css and vendor/). The black-holes, pulsars and merger placeholders link to them. No .bak files or PNGs were copied. Three.js is also in vendor/.
