# Wesley H. Lohr — Neurotechnology Portfolio v5

Open `index.html` to view the website. Upload these files to the ROOT of a public GitHub repository configured for GitHub Pages. Do not upload the ZIP itself.

**Detailed tutorial:** `HOW_TO_EDIT.md` describes the architecture, changing content, changing colors, adding project pages, and publishing to GitHub Pages.

This site includes pre-rendered dissertation figures, a profile image, reduced-resolution display meshes and a static PCB visualization. No native KiCad, original STL/SolidWorks, or dissertation PDF is included, and there are no download links. Visible web assets can still be extracted by technically knowledgeable visitors.


### Anatomical-viewer correction (v5.2)
The initial camera has been changed to an anterior-oblique view using the original aligned STL coordinates. Rendering now uses two-pass face-culling for translucent head/skull/CSF surfaces. Consistent fallback images have been regenerated for every layer.


## Version 5.4 — individual 3D surface viewers

Open `head-models.html` to explore the four available human-model surfaces. Dedicated interactive pages are `model-brain.html`, `model-csf.html`, `model-skull.html`, and `model-head.html`. The interface supports shaded/wireframe, presets, dragging, zooming, and reset, with a Canvas fallback if WebGL is unavailable.

Separate rhesus macaque and rat mesh files have not been provided, so those species are represented by dissertation figure imagery rather than human geometry.

## Version 5.5 — assembly rotation repair

The main layered assembly on `human.html`, `head-models.html`, `tms.html`, and `cad.html` now provides mouse/touch rotation in both WebGL and Canvas 2D browsers. The static preview no longer intercepts pointer events. The bottom-head component is not included in this version.


## Version 5.6

Removed the duplicate component gallery on the human and head-models pages and the standalone brain viewer under the human assembly. The primary layered viewer remains unchanged.
