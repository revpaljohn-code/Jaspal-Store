# Forma Supply storefront demo

A responsive static storefront demo prepared for GitHub Pages. Product search, category filters, a client-side shopping bag, and the signup interaction work in the browser.

## Publish with GitHub Pages

1. Create a GitHub repository for this site.
2. Add the contents of this folder to the repository root and push them to the `main` branch.
3. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions**.
4. The included workflow publishes the site on pushes to `main`. GitHub displays the published URL in **Settings → Pages** and in the workflow run.

The site uses relative asset paths, so it works for both a project site (`owner.github.io/repository`) and a user/organization site.

## Demo limitations

This is a frontend-only prototype. The cart does not persist after reloading, checkout does not take payments, and the newsletter form does not submit data. A real store needs a separately hosted API, database, and payment integration. Product photography loads from Unsplash and the typefaces load from Google Fonts.
