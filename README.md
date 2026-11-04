# Forma Supply storefront demo

A responsive static storefront demo prepared for GitHub Pages. Product search, category filters, a client-side shopping bag, and the signup interaction work in the browser.

## Backend model starter

`api/src/models/Order.ts` defines a Mongoose order model for a separately hosted Node.js API. It snapshots customer, shipping, and product details; stores currency amounts as integer minor units; validates the subtotal and total; and adds timestamps and indexes for Stripe identifiers and order lookup. GitHub Pages only serves the static storefront and does not run this model or connect it to a database.

The API must create orders using server-calculated prices and update payment state from verified Stripe webhooks. Do not trust totals or payment status sent by the browser.

## GitHub Pages

This repository is configured to publish with GitHub Actions. The included workflow deploys on pushes to `main`; it can also be started manually from the **Actions** tab.

The site uses relative asset paths, so it works for both a project site (`owner.github.io/repository`) and a user/organization site.

## Demo limitations

This is a frontend-only prototype. The cart does not persist after reloading, checkout does not take payments, and the newsletter form does not submit data. A real store needs a separately hosted API, database, and payment integration. Product photography loads from Unsplash and the typefaces load from Google Fonts.
