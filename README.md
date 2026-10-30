# Wesley H. Lohr engineering portfolio — GitHub Pages release

This repository is designed to deploy as a static GitHub Pages project site. Its root contains `index.html`, `brain.html`, `amplifier.html`, and `assets/`.

## Publish from the GitHub website
1. Create a **public** repository named `engineering-portfolio`.
2. Extract this ZIP to your computer (do **not** upload the ZIP itself). Upload the **contents** to the repository root, including `index.html` and the `assets` folder.
3. In the repository go to **Settings > Pages**. Select **Deploy from a branch** and **main / (root)**, then Save.
4. In **Actions**, check for a successful Pages build and deployment; in **Settings > Pages**, use the displayed **Visit site** URL.
5. A normal project-page address is `https://YOUR-GITHUB-USERNAME.github.io/engineering-portfolio/`. It will not work if the actual repository name or account differs.

## If you get a 404
- Check the GitHub repository Code tab: `index.html` must be listed at top level, alongside `brain.html`, not nested in another folder.
- Check **Settings > Pages** for branch `main` and folder `/(root)`.
- Check **Actions** for a successful deployment and follow the actual **Visit site** link in Pages settings. Initial publication can take a few minutes.
- The ZIP itself is not a webpage and must be extracted before upload.
- If you are getting a 404 when attempting to download a file **from ChatGPT**, that is separate from GitHub Pages. Let the assistant know which URL shows the error.

## IP note
This is the **public-preview edition**. It intentionally excludes the original `AMP.kicad_pcb` and `Brain.stl` design files. Interactive derived representations are still public and may themselves reveal engineering geometry; review before publishing.

## Contents
- `index.html`: landing page
- `amplifier.html`: interactive copper layers, footprints and other PCB data
- `brain.html`: rotatable, zoomable anatomical brain model
- `assets/`: local CSS, SVG, JS, and preview assets. No external dependencies.
- `.nojekyll`: prevents Jekyll processing of this static build.
