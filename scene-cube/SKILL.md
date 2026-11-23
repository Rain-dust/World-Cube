---
name: scene-cube
description: Build 3×3×3 scene cubes with six living miniature worlds, one ground plane and gravity direction per face. Use for 六面引力、生态魔方、立体像素场景 or animations where a turn carries part of a whole landscape to the next face.
---

# Scene Cube

Treat every face as the ground of a complete miniature world. Its nine squares are regions of a single plan. Use the reference artwork to choose the palette, terrain and subjects, then model their footprints and elevations. A tree takes root in its own square, a house has a foundation under its roof, and loose objects fall toward their own terrain.

## Design the scene and the turn

- Sketch the whole terrain from above. Use local X and Y along the surface, +Z for standing height, and −Z for gravity. Draw the river, shore, path or reef continuously across the nine slots. Reserve space around a recognizable vertical landmark.
- Give the landscape at least one contact that reads from the side, such as bridge piers meeting the water or an egret's feet planted in a shallow pool. Give the scene a second independent movement, such as smoke rising as a leaf falls.
- Animate living geometry in whole-face coordinates and clip it at the tile boundaries. Attach each fragment to the physical cubie's orientation. During a twist use `CubeState.groundFrame()` for the moving tangent axes, outward normal and gravity vector. A column of bubbles should follow its own face normal halfway through the turn.
- Choose a landing and a view low enough to show both the footprints and the elevations. Roll the camera toward the featured world's up direction when moving between faces. For storyboard and camera decisions, read [composition and choreography](references/design.md).

## Produce the requested format

For an interactive piece, copy the complete [offline starter folder](assets/starter/index.html). Edit the matching terrain material and habitat module together. Set the moves and shots in `cube.js`. For scene authoring, GPU attachment and MP4 export, read [the production notes](references/production.md).

For a video, render from `window.renderAt(seconds)`. Inspect a low view, an overhead view and the middle of a turn. Check that grounded objects keep their footpoints, falling particles approach the same floor after reorientation, and a reverse turn closes a recognizable seam.
