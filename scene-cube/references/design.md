# Composing a living face

## Establish the silhouette

Begin with a plan view. Mark the stream crossing, the house footprint, the bridge abutments and the roots of the trees before drawing any vertical profiles. Choose a landmark that will also read from ground level. The autumn house has four walls, a gable, a chimney and a front porch. From a low angle its roof can hide the creek behind it.

Lay the 3×3 grid over the composition. Let a roof slope, root arch or coral branch cross a cut at a readable angle. At an aligned pose, the two clipped pieces should describe a single contour. During the turn the eye can follow the outgoing end to its new square. Give the landmark a quiet background at the chosen camera angle.

## Show the local vertical

Paint the walking surface or seabed from above. Build a visible connection between each standing object and that surface. A tree can flare at its roots, a timber pier can enter the lake below the jetty, and an egret's weight can pass through its planted leg. Choose a few taller elements with clear silhouettes and leave low terrain around them so their heights remain legible.

Frame two neighboring faces together during part of the shot. Their trees or corals rise in visibly different directions. When inspecting the side or underside, bank the camera into the featured world's horizon, then lower the camera until the floor, foreground and standing landmark overlap. The **贴地看** control gives this view. Keep some of the cube edge in the wider shot to reveal how that local horizon relates to the rest of the cube.

## Give the scene a pulse

Pair a principal action with a response in the same local world. A trout clears the water, re-enters it and leaves a widening ripple in XY. A leaf flutters sideways as its Z falls and remains briefly on the ground. Smoke and bubbles rise and expand with altitude. Fins and tentacles can lag a body in motion. A locked-camera beat lets the viewer see the difference between movement of the cubie and movement of its inhabitants.

## Plan the turn and landing

1. Choose the absolute cube state and the destination face for the reveal. A solved face has the nine original regions arranged with their original orientation.
2. For a custom arrangement, run the intended moves, then use `CubeState.faceLayout(landing, face)` to identify each destination's source face, row, column and quarter-turn count. Work backwards through the inverse moves to establish the opening.
3. Show the chosen landmark before the turn. Keep it in view through the intermediate angle, then let the destination settle long enough to understand its relationship to the rest of the scene.
4. At the middle of a turn, inspect a rooted landmark and an airborne particle on the same cubie. The landmark's foot remains attached and the particle's vertical moves with that ground. Reverse the turn and check that a cut roof, fin or root meets its continuation at the seam, including the original elevation.

The supplied alignment indicator recognizes nine matching regions from a single source and checks their orientations and positions. For an intentionally mixed-source artwork, define the landing against its authored layout.
