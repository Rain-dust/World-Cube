const assert = require("node:assert/strict");
const { test } = require("node:test");
const CubeState = require("../assets/starter/cube-state.js");

const dot = (left, right) => left.reduce((total, value, i) => total + value * right[i], 0);
const cross = ([ax, ay, az], [bx, by, bz]) => [
  ay * bz - az * by,
  az * bx - ax * bz,
  ax * by - ay * bx
].map(value => value === 0 ? 0 : value);
const moves = ["x", "y", "z"].flatMap(axis =>
  [-1, 0, 1].flatMap(layer => [-1, 1].map(dir => ({ axis, layer, dir }))));

function assertCubeInvariants(cubies) {
  assert.equal(cubies.length, 27);
  assert.equal(new Set(cubies.map(cubie => cubie.id)).size, 27);
  assert.equal(new Set(cubies.map(cubie => cubie.pos.join(","))).size, 27);
  const occupied = new Set();
  for (const cubie of cubies) {
    assert.ok(cubie.pos.every(value => [-1, 0, 1].includes(value)));
    const [x, y, z] = cubie.basis;
    assert.deepEqual(cross(x, y), z);
    for (const col of cubie.basis) assert.equal(dot(col, col), 1);
    for (const sticker of cubie.stickers) {
      const normal = CubeState.localToWorld(cubie, CubeState.faces[sticker.face].normal);
      assert.equal(dot(cubie.pos, normal), 1);
      occupied.add([normal.join(","), cubie.pos.join(",")].join(":"));
    }
  }
  assert.equal(occupied.size, 54);
}

test("six outward-facing image grids have all nine tiles each", () => {
  const cube = CubeState.create();
  assertCubeInvariants(cube);
  assert.equal(cube.find(cubie => cubie.id === "0,0,0").stickers.length, 0);
  for (const [face, { normal, right, up }] of Object.entries(CubeState.faces)) {
    assert.deepEqual(cross(right, up), normal);
    const cells = new Set();
    for (const cubie of cube) {
      const sticker = cubie.stickers.find(sticker => sticker.face === face);
      if (!sticker) continue;
      assert.equal(sticker.row, 1 - dot(cubie.pos, up));
      assert.equal(sticker.col, 1 + dot(cubie.pos, right));
      cells.add(sticker.row + 3 * sticker.col);
    }
    assert.deepEqual([...cells].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  }
});

test("committed moves match their animation endpoint and only affect nine cubies", () => {
  const cube = CubeState.create();
  const initial = JSON.stringify(cube);
  for (const move of moves) {
    const moved = CubeState.turn(cube, move);
    assertCubeInvariants(moved);
    assert.equal(cube.filter(piece => CubeState.affects(piece, move)).length, 9);
    for (const [i, old] of cube.entries()) {
      if (CubeState.affects(old, move)) {
        const continuous = CubeState.rotate(old.pos, move.axis, move.dir * Math.PI / 2);
        for (const [j, component] of moved[i].pos.entries()) {
          assert.ok(Math.abs(component - continuous[j]) < 1e-9);
        }
        assert.equal(moved[i].stickers, old.stickers);
      } else {
        assert.equal(moved[i], old);
      }
    }
    assert.deepEqual(CubeState.turn(moved, CubeState.inverse(move)), cube);
    assert.deepEqual(Array.from({ length: 4 }).reduce(state => CubeState.turn(state, move), cube), cube);
  }
  assert.equal(JSON.stringify(cube), initial);
});

test("a long mixed-axis path and its inverse retain physical geometry and orientation", () => {
  const cube = CubeState.create();
  const path = Array.from({ length: 200 }, (_, i) => moves[(i + Math.floor(i / 3) * 7) % moves.length]);
  const scrambled = path.reduce(CubeState.turn, cube);
  assertCubeInvariants(scrambled);
  assert.notDeepEqual(scrambled, cube);
  const restored = path.slice().reverse().map(CubeState.inverse).reduce(CubeState.turn, scrambled);
  assert.deepEqual(restored, cube);
  assert.throws(() => CubeState.turn(cube, { axis: "z", layer: 2, dir: 1 }), RangeError);
});

test("a planned landing reads stable source tiles and clockwise directions", () => {
  const cube = CubeState.create();
  const move = { axis:"y", layer:0, dir:1 };
  const middleStrip = CubeState.faceLayout(CubeState.turn(cube,move), "PZ");
  assert.deepEqual(middleStrip.map(tile=>tile.face),
    ["PZ","PZ","PZ", "NX","NX","NX", "PZ","PZ","PZ"]);
  assert.deepEqual(middleStrip.slice(3,6).map(({col,row,turns})=>[col,row,turns]),
    [[0,1,0],[1,1,0],[2,1,0]]);
  const rightFace = CubeState.faceLayout(CubeState.turn(cube,{axis:"x",layer:1,dir:1}),"PX");
  assert.ok(rightFace.every(tile=>tile.face==="PX"&&tile.turns===3));
  assert.deepEqual(rightFace.map(({col,row})=>[col,row]),
    [[2,0],[2,1],[2,2],[1,0],[1,1],[1,2],[0,0],[0,1],[0,2]]);
});
