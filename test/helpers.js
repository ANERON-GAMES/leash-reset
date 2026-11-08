import assert from "node:assert/strict";

export function point(x, y, z) {
  if (z === undefined) {
    return { x, y };
  }
  return { x, y, z };
}

export function valid(extra = {}) {
  return {
    home: { x: 0, y: 0 },
    position: { x: 3, y: 4 },
    leash: 10,
    time: 0,
    ...extra
  };
}

export function sample(fields = {}) {
  return {
    reset: false,
    reason: null,
    band: "inside",
    distance: 5,
    leash: 10,
    graceDistance: 0,
    graceTime: 0,
    outer: 10,
    time: 0,
    combatStart: null,
    duration: null,
    outsideSince: null,
    home: { x: 0, y: 0 },
    restore: null,
    ...fields
  };
}

export function restoration(fields = {}) {
  return {
    reason: "distance",
    home: { x: 0, y: 0 },
    distance: 11,
    time: 0,
    combatStart: null,
    duration: null,
    outsideSince: null,
    ...fields
  };
}

export function assertVerdict(result) {
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.home), true);
  assert.deepEqual(Object.keys(result), [
    "reset",
    "reason",
    "band",
    "distance",
    "leash",
    "graceDistance",
    "graceTime",
    "outer",
    "time",
    "combatStart",
    "duration",
    "outsideSince",
    "home",
    "restore"
  ]);
  if (result.restore === null) {
    assert.equal(result.reset, false);
    assert.equal(result.reason, null);
    return;
  }
  assert.equal(result.reset, true);
  assert.equal(result.outsideSince, null);
  assert.equal(Object.isFrozen(result.restore), true);
  assert.equal(Object.isFrozen(result.restore.home), true);
  assert.notEqual(result.home, result.restore.home);
  assert.deepEqual(result.home, result.restore.home);
  assert.equal(result.reason, result.restore.reason);
  assert.equal(result.distance, result.restore.distance);
  assert.equal(result.time, result.restore.time);
  assert.equal(result.combatStart, result.restore.combatStart);
  assert.equal(result.duration, result.restore.duration);
  assert.deepEqual(Object.keys(result.restore), [
    "reason",
    "home",
    "distance",
    "time",
    "combatStart",
    "duration",
    "outsideSince"
  ]);
}
