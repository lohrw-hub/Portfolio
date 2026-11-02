# Neurotechnology Engineering Portfolio — v5.7

This is a fully static website. Upload the **contents** of this folder, not the ZIP and not an extra parent folder, to the root of your GitHub Pages repository.

## Changes in v5.7

- Fixed site deployments where shared navigation disappears and homepage section cards lose their styling.
- The navigation and base styles are present directly in each HTML page as a fallback.
- The current shared stylesheet is `assets/style-v57.css`. The current shared navigation script is `assets/site-v57.js`. These new filenames prevent old GitHub/browser caches from mixing versions.
- The functional layer-switching, rotation, zoom, and reset viewer remains unchanged.
- All original KiCad / SolidWorks / STL source files remain excluded from the published site.

## Updating the live site safely

1. Extract the ZIP to a folder on your computer.
2. Open your **local cloned GitHub repository** (e.g. in GitHub Desktop: Repository → Show in Explorer).
3. Copy **all** extracted files *and* `assets` subfolders into the repository. Overwrite the existing files.
4. Commit and push to `main`.
5. Open repository Settings → Pages, verify deployment completed, then visit the live page. Refresh with Ctrl+Shift+R.
6. Confirm the `assets/style-v57.css` and `assets/site-v57.js` files are present in the GitHub repository.

If the live page still differs, directly open `https://YOUR-GITHUB-PAGES-URL/assets/style-v57.css` and `https://YOUR-GITHUB-PAGES-URL/assets/site-v57.js`. If either returns 404, the folder was not uploaded at the right path.

## Editing

- Homepage copy and gallery layout: `index.html`.
- Shared CSS: `assets/style-v57.css`.
- Navigation: `assets/site-v57.js`.
- NOTE: Each HTML page has fallback header markup and a fallback copy of v5.7 CSS. The external CSS is loaded after it and will override it; for a large future redesign, rebuild/update the fallbacks as well to keep old browsers and failed-load cases aligned.
- Interactive head-assembly viewer: `assets/anatomy-viewer.js`.

Don't put original confidential designs into the public repository; images and low-resolution meshes shown in the browser can still be captured or extracted.
