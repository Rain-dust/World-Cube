const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");

require("../assets/starter/ground-water.js");
require("../assets/starter/ground-valley.js");
require("../assets/starter/ground-night.js");
const habitats = require("../assets/starter/cube-habitats.js");
const cube = require("../assets/starter/cube-state.js");

const tolerance = 1e-7;
const near = (a, b) => Math.abs(a - b) < tolerance;
const closePoint = (a, b) => a.every((v, i) => near(v, b[i]));
const signature = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const center = slot => [slot % 3 - 1, 1 - Math.floor(slot / 3)];
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function worldPoint(frame, [x, y, z]) {
  return frame.origin.map((value, i) => value + frame.right[i]*x + frame.forward[i]*y + frame.normal[i]*(.491+z));
}

function assembled(id, time) {
  const fixed = habitats.model(id, time, true);
  const moving = habitats.model(id, time, false);
  return fixed.map((forms, slot) => forms.concat(moving[slot]));
}

function boundary(tile, axis, edge) {
  const samples = new Map();
  for (const form of tile) for (const p of form.points) {
    if (!near(p[axis], edge)) continue;
    const key = [form.color, Math.round(p[1 - axis] * 1e6), Math.round(p[2] * 1e6)].join("/");
    samples.set(key, p);
  }
  return samples;
}

function shared(a, b) {
  return [...a].filter(([key]) => b.has(key)).map(([, p]) => p);
}

test("cutting a sloped plane preserves its area and interpolated height in all nine atlas cells", () => {
  const height = (x, y) => .46 + x * .15 - y * .09;
  const corners = [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]];
  const tiles = habitats.partition([{
    points: corners.map(([x, y]) => [x, y, height(x, y)]),
    color: "#ac9754", alpha: 1
  }]);
  let area = 0;
  for (const [slot, forms] of tiles.entries()) {
    const [x, y] = center(slot);
    assert.equal(forms.length, 1);
    const { points } = forms[0];
    for (let i = 0; i < points.length; i++) {
      const p = points[i], q = points[(i + 1) % points.length];
      assert.ok(Math.abs(p[0] - x) <= .5 + tolerance && Math.abs(p[1] - y) <= .5 + tolerance);
      assert.ok(near(p[2], height(p[0], p[1])));
      area += (p[0] * q[1] - q[0] * p[1]) * .5;
    }
    if (slot % 3 < 2) {
      const edge = x + .5;
      assert.equal(shared(boundary(forms, 0, edge), boundary(tiles[slot + 1], 0, edge)).length, 2);
    }
    if (slot < 6) {
      const edge = y - .5;
      assert.equal(shared(boundary(forms, 1, edge), boundary(tiles[slot + 3], 1, edge)).length, 2);
    }
  }
  assert.ok(near(area, 2.8 ** 2));
});

test("six ground habitats have nine distinct regions, joined terrain and height from floor to canopy", () => {
  assert.equal(habitats.scenes.length, 6);
  const worlds = new Set();
  for (const { id } of habitats.scenes) {
    const tiles = assembled(id, 1.2);
    assert.equal(tiles.length, 9, id);
    let min = Infinity, max = -Infinity;
    const depthBands = new Set(), fragments = new Set();
    const seamCount = [0, 0];
    for (const [slot, forms] of tiles.entries()) {
      assert.ok(forms.length, `${id} has empty cell ${slot}`);
      const [x, y] = center(slot);
      const local = forms.map(f => f.points.map(([u, v, h]) => [u - x, v - y, h]));
      fragments.add(signature(local));
      for (const { points } of forms) for (const [u, v, h] of points) {
        assert.ok([u, v, h].every(Number.isFinite), id);
        assert.ok(Math.abs(u - x) <= .5 + tolerance && Math.abs(v - y) <= .5 + tolerance, id);
        assert.ok(h >= -tolerance && h < 1.45, id);
        min = Math.min(min, h);
        max = Math.max(max, h);
        depthBands.add(Math.floor(h * 5));
      }
      if (slot % 3 < 2 && shared(boundary(forms, 0, x + .5), boundary(tiles[slot + 1], 0, x + .5)).length >= 2) seamCount[0]++;
      if (slot < 6 && shared(boundary(forms, 1, y - .5), boundary(tiles[slot + 3], 1, y - .5)).length >= 2) seamCount[1]++;
    }
    assert.equal(fragments.size, 9, id);
    assert.ok(seamCount.every(count => count >= 2), `${id} touches too few horizontal or vertical seams`);
    assert.ok(min < .065 && max > .85 && depthBands.size >= 5, `${id} lost its ground contact or height`);
    worlds.add(signature([...fragments]));
  }
  assert.equal(worlds.size, 6);
});

test("living geometry in every habitat changes position and can seek backward to the exact same pose", () => {
  for (const { id } of habitats.scenes) {
    const pose = t => signature(habitats.model(id, t, false).map(tile => tile.map(form => {
      assert.ok(form.points.every(p => p.every(Number.isFinite)), id);
      return form.points;
    })));
    const first = pose(.36);
    assert.notEqual(first, pose(2.81), id);
    assert.equal(first, pose(.36), id);
    assert.deepEqual(habitats.model(id, 0, true), habitats.model(id, 3, true), id);
  }
});

test("a raised reef vertex splits when the left layer twists, travels with its ground, and rejoins on undo", () => {
  const tiles = assembled("reef", 1.2);
  const seam = shared(boundary(tiles[3], 0, -.5), boundary(tiles[4], 0, -.5));
  const vertex = seam.find(p => p[2] > .3);
  assert.ok(vertex, "expected raised reef geometry crossing the left column");
  const original = cube.create();
  const move = { axis: "x", layer: -1, dir: 1 };
  const turned = cube.turn(original, move);
  const restored = cube.turn(turned, cube.inverse(move));
  function locate(state, slot, moving=null, angle=0) {
    const [x, y] = center(slot);
    const cubie = state.find(c => c.stickers.some(s => s.face === "PZ" && s.col === x + 1 && s.row === 1 - y));
    const frame = cube.groundFrame(cubie, "PZ", moving, angle);
    return worldPoint(frame, [vertex[0] - x, vertex[1] - y, vertex[2]]);
  }
  const [x, y, z] = locate(original, 3);
  assert.ok(closePoint([x, y, z], locate(original, 4)));
  const halfway=Math.PI/4;
  assert.ok(closePoint(locate(original,3,move,halfway),cube.rotate([x,y,z],"x",halfway)));
  assert.ok(closePoint(locate(original,4,move,halfway),[x,y,z]));
  assert.ok(closePoint([x, -z, y], locate(turned, 3)));
  assert.ok(closePoint([x, y, z], locate(turned, 4)));
  assert.ok(Math.hypot(...locate(turned, 3).map((v, i) => v - locate(turned, 4)[i])) > 1);
  assert.ok(cube.faceLayout(turned, "NY").some(s => s.face === "PZ" && s.col === 0 && s.row === 1));
  assert.ok(closePoint(locate(restored, 3), locate(restored, 4)));
  assert.ok(closePoint(locate(restored, 3), [x, y, z]));
});

test("all six local gravities stay perpendicular to their own floor through a turn and its commit", () => {
  const solved=cube.create();
  const directions=new Set();
  for(const [face,axes] of Object.entries(cube.faces)){
    const tile=solved.find(c=>c.stickers.some(s=>s.face===face && s.col===1 && s.row===1));
    const rest=cube.groundFrame(tile,face);
    directions.add(rest.gravity.join(","));
    assert.ok(closePoint(rest.normal,axes.normal));
    for(const [index,axis] of ["x","y","z"].entries()){
      if(axes.normal[index]!==0)continue;
      const move={axis,layer:tile.pos[index],dir:-1};
      const turned=cube.turn(solved,move).find(c=>c.id===tile.id);
      for(const progress of [0,.56,1]){
        const angle=-Math.PI*.5*progress;
        const frame=cube.groundFrame(tile,face,move,angle);
        assert.ok(closePoint(frame.origin,cube.rotate(tile.pos,axis,angle)));
        assert.ok(closePoint(frame.normal,cube.rotate(axes.normal,axis,angle)));
        assert.ok(closePoint(cross(frame.right,frame.forward),frame.normal));
        assert.ok(closePoint(frame.gravity,frame.normal.map(n=>-n)));
        assert.ok(near(dot(frame.gravity,frame.right),0) && near(dot(frame.gravity,frame.forward),0));
        if(progress===1){
          const committed=cube.groundFrame(turned,face);
          for(const key of ["origin","right","forward","normal","gravity"])assert.ok(closePoint(frame[key],committed[key]));
        }
      }
    }
  }
  assert.equal(directions.size,6);
});

test("the marsh frog accelerates towards its own ground, landing on the next pad", () => {
  const jumpStart=14.7, halfFlight=.275;
  const local=[0,1,2].map(i=>globalThis.GroundNight.frogPose(jumpStart+i*halfFlight).position);
  assert.ok(near(local[0][2],local[2][2]) && local[1][2]>local[0][2]+.15);
  assert.ok(Math.hypot(local[2][0]-local[0][0],local[2][1]-local[0][1])>.35);
  const solved=cube.create();
  // The trajectory crosses a column seam. Both pads occupy the same moving row.
  const samples=local.map(([x,y,z])=>{
    const col=Math.floor(x+1.5),row=Math.floor(1.5-y);
    const tile=solved.find(c=>c.stickers.some(s=>s.face==="PX" && s.col===col && s.row===row));
    return {tile,point:[x-(col-1),y-(1-row),z]};
  });
  const move={axis:"y",layer:-1,dir:1};
  for(const angle of [0,.64,Math.PI/2]){
    const frame=cube.groundFrame(samples[0].tile,"PX",move,angle);
    const [start,peak,landing]=samples.map(({tile,point})=>worldPoint(cube.groundFrame(tile,"PX",move,angle),point));
    const acceleration=start.map((n,i)=>(n-2*peak[i]+landing[i])/halfFlight**2);
    assert.ok(dot(acceleration,frame.gravity)>1);
    assert.ok(near(dot(acceleration,frame.right),0) && near(dot(acceleration,frame.forward),0));
  }
});
