# Fonts

This folder is reserved for self-hosted font files — specifically, **PP Neue Machina** from pangrampangram.com.

## Why PP Neue Machina isn't included

PP Neue Machina is a commercial font from Pangram Pangram. We can't distribute the `.woff2` files with this repo. The font-stack in `app/globals.css` lists `'PP Neue Machina'` as the first display face, but it falls back to Archivo Black (loaded via next/font/google) until the real files are in place.

## How to activate PP Neue Machina

1. Buy the **personal-use trial** from [pangrampangram.com/products/neue-machina](https://pangrampangram.com/products/neue-machina)
2. Drop `PPNeueMachina-Ultrabold.woff2` and any other weights you want into this folder
3. Open `app/globals.css` and uncomment the `@font-face` block at the bottom
4. No other code changes needed — the font-stack already prefers PP Neue Machina

Everywhere the site uses `font-display` (Neue Black headlines, module names, huge pricing numbers, status hero), the browser will instantly switch to the real face.

## Current fallback behavior

Without PP Neue Machina, the site renders in **Archivo Black 900** for display type. It's a reasonable free substitute — slightly rounder letterforms but very close structural weight.
