(function (root, createApi) {
  const api = createApi();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.CubeState = api;
  }
})(globalThis, function () {
  "use strict";

  const axisIndex = Object.freeze({ x: 0, y: 1, z: 2 });
  const indices = [-1, 0, 1];
  const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  // These axes describe an image when its face is viewed from outside.
  // In world space, right × up = normal. Image rows grow downward.
  function face(normal, right, up) {
    return Object.freeze({
      normal: Object.freeze(normal),
      right: Object.freeze(right),
      up: Object.freeze(up)
    });
  }

  const faces = Object.freeze({
    PX: face([1, 0, 0], [0, 0, -1], [0, 1, 0]),
    NX: face([-1, 0, 0], [0, 0, 1], [0, 1, 0]),
    PY: face([0, 1, 0], [1, 0, 0], [0, 0, -1]),
    NY: face([0, -1, 0], [1, 0, 0], [0, 0, 1]),
    PZ: face([0, 0, 1], [1, 0, 0], [0, 1, 0]),
    NZ: face([0, 0, -1], [-1, 0, 0], [0, 1, 0])
  });
  const faceEntries = Object.entries(faces);

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function create() {
    const cubies = [];
    for (const x of indices) {
      for (const y of indices) {
        for (const z of indices) {
          const pos = [x, y, z];
          const stickers = [];
          for (const [name, { normal, right, up }] of faceEntries) {
            if (dot(pos, normal) !== 1) continue;
            stickers.push(Object.freeze({
              face: name,
              col: 1 + dot(pos, right),
              row: 1 - dot(pos, up)
            }));
          }
          cubies.push({
            id: [x, y, z].join(","),
            pos,
            basis: identity.map(column => column.slice()),
            stickers: Object.freeze(stickers)
          });
        }
      }
    }
    return cubies;
  }

  function validateMove(move) {
    if (!move || !Object.hasOwn(axisIndex, move.axis) ||
        !indices.includes(move.layer) || (move.dir !== 1 && move.dir !== -1)) {
      throw new RangeError("A move needs axis x/y/z, layer -1/0/1 and dir -1/1.");
    }
  }

  function affects(cubie, move) {
    return cubie.pos[axisIndex[move.axis]] === move.layer;
  }

  function rotateComponents(v, axis, cosine, sine) {
    const [x, y, z] = v;
    switch (axis) {
      case "x": return [x, cosine * y - sine * z, sine * y + cosine * z];
      case "y": return [cosine * x + sine * z, y, cosine * z - sine * x];
      case "z": return [cosine * x - sine * y, sine * x + cosine * y, z];
      default: throw new RangeError("A rotation axis must be x, y or z.");
    }
  }

  function rotate(v, axis, angleRadians) {
    return rotateComponents(v, axis, Math.cos(angleRadians), Math.sin(angleRadians));
  }

  function exactQuarter(v, axis, direction) {
    // Supplying sin and cos exactly avoids rounding drift in committed turns.
    return rotateComponents(v, axis, 0, direction).map(item => item === 0 ? 0 : item);
  }

  function turn(cubies, move) {
    validateMove(move);
    const { axis, dir } = move;
    return cubies.map(cubie => {
      if (!affects(cubie, move)) return cubie;
      return {
        ...cubie,
        pos: exactQuarter(cubie.pos, axis, dir),
        basis: cubie.basis.map(column => exactQuarter(column, axis, dir))
      };
    });
  }

  function inverse(move) {
    validateMove(move);
    return { ...move, dir: -move.dir };
  }

  function localToWorld(cubie, v) {
    const [x, y, z] = cubie.basis;
    return x.map((component, i) => component * v[0] + y[i] * v[1] + z[i] * v[2]);
  }

  // Read the addressed face in row-major order. turns is the clockwise
  // rotation of the attached sticker when looking at this face from outside.
  function faceLayout(cubies, faceName) {
    if (!Object.hasOwn(faces, faceName)) throw new RangeError("Unknown face: " + faceName);
    const view = faces[faceName];
    const slots = [];
    for (const cubie of cubies) {
      if (dot(cubie.pos, view.normal) !== 1) continue;
      const sticker = cubie.stickers.find(item =>
        dot(localToWorld(cubie, faces[item.face].normal), view.normal) === 1);
      if (!sticker) continue;
      const right = localToWorld(cubie, faces[sticker.face].right);
      const sideways = dot(right, view.right);
      const vertical = dot(right, view.up);
      const turns = sideways === 1 ? 0 : vertical === -1 ? 1 : sideways === -1 ? 2 : 3;
      const targetCol = 1 + dot(cubie.pos, view.right);
      const targetRow = 1 - dot(cubie.pos, view.up);
      slots[targetRow * 3 + targetCol] = { ...sticker, cubieId:cubie.id, targetCol, targetRow, turns };
    }
    return slots;
  }

  // The two tangents span this particular ground. Its inward normal is the
  // direction of local gravity, including halfway through an animated turn.
  function groundFrame(cubie, faceName, move=null, angle=0){
    const f=faces[faceName];
    const moving=move && affects(cubie,move);
    const rotateLayer=v=>moving?rotate(v,move.axis,angle):v;
    const vector=v=>rotateLayer(localToWorld(cubie,v));
    const normal=vector(f.normal);
    return {origin:rotateLayer(cubie.pos),right:vector(f.right),forward:vector(f.up),
      normal,gravity:normal.map(v=>-v)};
  }
  return Object.freeze({ create, turn, inverse, affects, rotate, localToWorld, faceLayout, faces, groundFrame });
});
