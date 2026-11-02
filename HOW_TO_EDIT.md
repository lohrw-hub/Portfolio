# Engineering Portfolio — Editing and Publishing Guide (v5)

This is a STATIC website. It uses HTML for pages, CSS for appearance and JavaScript for viewers and navigation. There is no framework, build process, command-line dependency or paid hosting requirement. You can edit it with Notepad, VS Code, or any code editor.

## 1. Folder map

index.html                   Homepage and the five large feature rows
tms.html                     Development of the TMS Phantom — anatomy viewer + 3 children
simulations.html             Interactive simulation-figure showcase
materials.html               Interactive characterization-figure showcase
cad.html                     Interactive anatomical CAD showcase
other.html                   Interactive gallery for other research work
head-models.html             Interactive model viewer + species collection
human.html, macaque.html, rat.html     Species detail pages
instrumentation.html         PCB and amplifier page
data.html                    Dissertation data and validation figures
fixtures.html, electrodes.html       Fixtures and electrode detail pages
assets/style.css             COLORS, typography, cards and mobile layout
assets/site.js               ONE shared site header, navigation and footer
assets/showcase.js           Switches the selected figure on gallery pages
assets/anatomy-data.js       Reduced-resolution display geometry; not original source STL
assets/anatomy-viewer.js     Controls drag/zoom/layer selection
assets/figures/             Dissertation figure previews
assets/profile.jpg           Your portrait
assets/brain-hero.png        Homepage brain image

## 2. Change something on the homepage

Open `index.html` in a text editor. Find `Development of the TMS Phantom` or `Selected work`. The five clickable sections are HTML blocks with class `portfolio-ribbon`; the text is inside `ribbon-copy`, the images are inside `ribbon-collage`, and the destination is the `href` on the outer `<a>` tag.

To change a project title: replace text inside its `<h3>Title</h3>`.
To change the summary: replace text inside `<p>...</p>` in the same row.
To replace an image: copy a JPG/PNG/WebP into `assets/figures/` and change the relevant `src="assets/figures/filename.jpg"`.
To change the destination: change `href="tms.html"` on the outer ribbon link (the target must exist).
To reorder rows: move each entire `<a class="portfolio-ribbon...">...</a>` block. Keep the opening and closing tags paired.

## 3. Change the navigation or LinkedIn URL

All pages use the same nav, injected by `assets/site.js`. Look for the `SITE` object at the beginning. Change `owner`, `subtitle`, `linkedin`, `email`, or `nav` there. You do NOT have to change 13 different HTML headers.

The portrait/name in the upper-left always links to `index.html`. The LinkedIn link is the single social link in the top-right navigation (and a link also appears in the footer).

## 4. Change colors, fonts or spacing

Open `assets/style.css`. The first line `:root{...}` defines the site palette:
  --deep      background
  --forest    green surfaces
  --gold      gold highlights, buttons and headings
  --cream     light headline/text color
  --muted     secondary text

Under the comment `V5: homepage architecture` are the additional layout rules. E.g. `.ribbon-copy h3` changes feature heading sizes, `.portfolio-ribbon` controls feature row arrangement, `.pathway-grid` controls the three TMS subpage cards. Mobile layouts are under `@media` rules.

## 5. Add / replace a dissertation figure in a gallery

1. Save the photo/figure in `assets/figures/`.
2. Open `simulations.html`, `materials.html`, or `other.html`.
3. Find `<div class="showcase-tabs"` and a `<button class="showcase-choice" ...>`.
4. Copy an entire button and change its `data-src`, `data-heading`, `data-description`, and `data-ref`. Make sure `data-src` matches the file you uploaded.
5. The shared `assets/showcase.js` automatically updates the big image, heading and text when a visitor clicks the buttons.

The first/active button and main displayed image are written in the HTML. If you change which figure should appear first, also change `<img class="showcase-image" src="...">` and the initial `.showcase-heading` and `.showcase-description` text.

## 6. Add a new page

The simplest route is to duplicate a relevant existing HTML page, such as `materials.html`, rename it (for example, `ultrasound.html`) and edit the visible body content. Keep the `<head>` stylesheet link and the `<header id="siteHeader">`, `<footer id="siteFooter">`, and script tags. Add a link to it from another page by changing or adding an `<a href="ultrasound.html">...</a>`.

The interactive viewers do not require uploading full native CAD. The anatomy meshes in `assets/anatomy-data.js` were created for display and are already reduced in resolution. For a NEW SolidWorks assembly, export a suitable surface mesh, then produce a reduced web display asset before publishing. Do not put proprietary `.SLDPRT`, `.SLDASM`, `.kicad_pcb`, original `.stl`, or confidential project files in the site folder.

## 7. Preview locally

Unzip the download and open `index.html` in Chrome or Edge. Navigate around and test each button. Some browsers may restrict local-file JavaScript or WebGL. For a closer match to GitHub Pages, open the folder in VS Code with the `Live Server` extension or, if Python is installed, run:

    python -m http.server 8000 --bind 127.0.0.1

Then open http://localhost:8000/ in your browser. The --bind flag keeps the local preview on your computer. This is not the public hosting method.

## 8. Publish updates on GitHub Pages

Option A — GitHub web interface (good for a few changes):
- Open your repository on GitHub and click an existing file such as `index.html`.
- Click the pencil icon (Edit this file), make the change, then `Commit changes`.
- For new images or additional pages, choose `Add file` → `Upload files`, upload them into the correct directory and commit.

Option B — GitHub Desktop (better for full website revisions):
- Install GitHub Desktop and clone your existing portfolio repository.
- Copy the CONTENTS of this website folder into the local repository directory, replacing old files.
- Review the changed files in GitHub Desktop, write a summary, `Commit to main`, then `Push origin`.
- Open `Settings` → `Pages` to confirm deployment. Pages should publish from the `main` branch, `/(root)`, unless you have changed the configuration.

Important: put `index.html` directly in the repository root, NOT inside another extracted folder. Upload the unzipped website files, not the ZIP as a file.

GitHub Pages deployment may take a little time. Test the Pages URL shown in the repository's Pages settings, and use your browser's hard refresh (Ctrl+Shift+R) if an old version is cached.

## 9. Privacy and source files

This is an intentionally view-only site: no original CAD, KiCad, dissertation PDF or source documents are bundled, and no download buttons are present. HOWEVER any image or interactive geometry that a visitor's browser receives can theoretically be copied. Do not publish geometry or figures that require confidentiality, even in a reduced interactive viewer.

## 10. Quick editing exercise

1. Open `index.html` and replace "Expertise in developing" in the `<h1>` with another phrase.
2. Save and refresh your browser. You should see the new title.
3. Undo that test, then open `assets/style.css` and change `--gold` to another hex color.
4. Refresh the browser. You will see accent colors change throughout the website.
5. Undo that test and practice changing a description in `tms.html`.

This project is deliberately plain HTML/CSS/JS so you can learn it piece by piece.


## Updating the homepage collage images

The four main homepage project rows now use image files stored in `assets/homecards/`:

- `tms-main.png`
- `simulations-main.png`
- `materials-main.png`
- `cad-main.png`

If you want to replace one, keep the filename the same and overwrite the image file. The homepage will automatically use the new image.

The row content itself lives in `index.html`. Search for `portfolio-ribbon hero-ribbon` to find each row.


## Anatomical viewer: correcting orientation and transparent layers

The same interactive anatomical viewer appears on `tms.html`, `cad.html`, `head-models.html`, and `human.html`.

- The view configuration and buttons live in `assets/anatomy-viewer.js`.
- `DEFAULT_VIEW` near the top of the file sets the default orbit angle and zoom. You can change its `yaw`, `pitch`, and `zoom` values and reload the website.
- The viewer uses reduced-resolution meshes embedded in `assets/anatomy-data.js`. They retain one **shared coordinate system** for the brain, CSF, skull, and outer head. Do not normalize or recenter each mesh separately.
- The `render()` function first draws the solid brain, then the translucent surfaces (back faces and front faces separately). That is important for producing a readable anatomical overlay.
- Browsers without WebGL use `assets/anatomy-all.png` and `assets/anatomy-brain.png`, etc. to preview each individual layer instead. The fallback image switches when you select a layer, but it is **not** a rotatable 3D viewer.

To add an anatomical model later, first ensure that its geometry uses the same origin, axis directions, and units as the other layer files. Matching mesh extents alone does not prove alignment.


## Version 5.3: dissertation link, anatomical copy, hydrogel studies

The top navigation is built in `assets/site.js`. Search for `dissertation-link` to change the dissertation URL or text. The link currently goes to VCU Scholars Compass, the public landing page for the dissertation.

The human-model sidebar is in `human.html`: search for `From MRI to physical models.`. This text is public-facing portfolio copy and can be edited directly.

`materials.html` includes an interactive selector of material studies and a dedicated hydrogel gallery. The image files are `assets/figures/fig-47.jpg` through `fig-51.jpg`. You may replace these with higher-resolution exports if you preserve the filenames.

New gallery layout CSS lives near the bottom of `assets/style.css`, starting at the comment `v5.3`. The website includes no original CAD project downloads. Note that browser-displayed figure images can still be saved by a visitor; removing download buttons does not create copy protection.


## Version 5.4 — Standalone interactive surface pages

The `human.html` and `head-models.html` pages now focus on the single layered anatomical viewer. The extra component-card gallery and duplicate standalone brain viewer have been removed.

Each dedicated page loads `assets/anatomy-data.js` (the reduced geometry shared with the layered viewer), `assets/single-model-viewer.js` (the interactive controls), and its layout from `assets/style.css`. The lower-head component is not included in this revision.

To edit a model's explanatory text, open that model's `.html` file in VS Code. Search for the sidebar paragraph. To change image thumbnails, update the `assets/anatomy-*.png` images and the corresponding `<img src>` on each page.

**Adding a new model:** export a simplified, public-safe mesh from your CAD application, encode it in the compact display format, append its data to `assets/anatomy-data.js`, then copy an existing `model-*.html` page and update its `data-model` key. This is a larger change than editing text or images; verify the model's coordinate orientation and normals before publishing.

**Species limitation:** the rhesus macaque and rat pages currently show the dissertation's figures. Separate interactive STL models for those species require the matching meshes. Do not substitute human geometry.

**Source protection:** No original `.stl`, `.SLDPRT`, `.SLDASM`, or KiCad source files are included. Visitors can still extract the reduced geometry used by their browsers; display-only means no source download controls, not absolute copy protection.

## Fixing the combined anatomical viewer (v5.5)

On `human.html`, `head-models.html`, `tms.html`, and `cad.html`, the rotation and layer buttons are controlled by `assets/anatomy-viewer.js`. Click and drag anywhere on the large model to rotate. Select Layered, Brain, CSF, Skull, or Outer Head to switch what is shown while preserving its current orientation. Zoom and Reset work in both WebGL and Canvas 2D fallback modes.

The static image (`assets/anatomy-all.png`) is now emergency-only, not the main viewer. Do not remove the CSS rule `.assembly-fallback[hidden]` or the image can cover the canvas and block dragging. If GitHub Pages still shows the old static display after uploading, refresh with Ctrl+Shift+R to clear your browser cache.

The bottom-head component is intentionally not shown in this version.


## Version 5.6: cleaned human head pages

The redundant **Explore individual surfaces** gallery has been removed from `human.html` and `head-models.html`. The separate **Inspect the brain surface** viewer has been removed from `human.html`. The main assembly viewer remains and supports rotating the combined assembly and selecting Brain, CSF, Skull or Outer Head directly.
