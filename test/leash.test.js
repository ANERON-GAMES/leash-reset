import assert from "node:assert/strict";
import test from "node:test";
import { evaluateLeash } from "../src/index.js";
import { assertVerdict, point, restoration, sample, valid } from "./helpers.js";

test("a target on the leash stays in combat and one step past resets", () => {
  const inside = evaluateLeash({
    home: point(0, 0),
    position: point(6, 8),
    leash: 10,
    time: 0
  });
  assert.deepEqual(
    inside,
    sample({
      distance: 10,
      band: "inside"
    })
  );
  assertVerdict(inside);

  const reset = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    time: 0
  });
  assert.deepEqual(
    reset,
    sample({
      reset: true,
      reason: "distance",
      band: "outside",
      distance: 11,
      restore: restoration()
    })
  );
  assertVerdict(reset);
  assert.equal(reset.restore.reason, "distance");
});

test("the leash boundary is inclusive and a zero leash contains only the home point", () => {
  const edge = evaluateLeash(valid({ position: point(0, 10), leash: 10 }));
  assert.equal(edge.band, "inside");
  assert.equal(edge.reset, false);
  assert.equal(edge.distance, 10);

  const home = evaluateLeash(valid({ position: point(0, 0), leash: 0 }));
  assert.equal(home.band, "inside");
  assert.equal(home.distance, 0);
  assert.equal(home.reset, false);

  const step = evaluateLeash(valid({ position: point(0, 1), leash: 0 }));
  assert.equal(step.reset, true);
  assert.equal(step.reason, "distance");
  assert.equal(step.distance, 1);
});

test("negative coordinates and a home away from the origin use the same radius", () => {
  const across = evaluateLeash(
    valid({
      position: point(-6, -8)
    })
  );
  assert.equal(across.distance, 10);
  assert.equal(across.band, "inside");

  const shifted = evaluateLeash(
    valid({
      home: point(10, 10),
      position: point(10, 21),
      leash: 10
    })
  );
  assert.equal(shifted.distance, 11);
  assert.equal(shifted.reset, true);
  assert.deepEqual(shifted.home, point(10, 10));
  assert.deepEqual(shifted.restore.home, point(10, 10));
});

test("grace distance holds the outer edge and resets beyond it", () => {
  const rim = evaluateLeash({
    home: point(0, 0),
    position: point(9, 12),
    leash: 10,
    graceDistance: 5,
    time: 20
  });
  assert.deepEqual(
    rim,
    sample({
      band: "grace",
      distance: 15,
      graceDistance: 5,
      outer: 15,
      time: 20
    })
  );
  assertVerdict(rim);

  const past = evaluateLeash({
    home: point(0, 0),
    position: point(0, 16),
    leash: 10,
    graceDistance: 5,
    time: 20,
    outsideSince: 19
  });
  assert.deepEqual(
    past,
    sample({
      reset: true,
      reason: "distance",
      band: "outside",
      distance: 16,
      graceDistance: 5,
      outer: 15,
      time: 20,
      restore: restoration({
        distance: 16,
        time: 20,
        outsideSince: 19
      })
    })
  );
  assertVerdict(past);
});

test("a grace time lets a short step-out continue and expires on the boundary", () => {
  const discovered = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 3,
    time: 100
  });
  assert.deepEqual(
    discovered,
    sample({
      band: "outside",
      distance: 11,
      graceTime: 3,
      time: 100,
      outsideSince: 100
    })
  );
  assertVerdict(discovered);

  const still = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 3,
    time: 102,
    outsideSince: discovered.outsideSince
  });
  assert.deepEqual(
    still,
    sample({
      band: "outside",
      distance: 11,
      graceTime: 3,
      time: 102,
      outsideSince: 100
    })
  );

  const expired = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 3,
    time: 103,
    outsideSince: 100
  });
  assert.deepEqual(
    expired,
    sample({
      reset: true,
      reason: "time",
      band: "outside",
      distance: 11,
      graceTime: 3,
      time: 103,
      restore: restoration({
        reason: "time",
        time: 103,
        outsideSince: 100
      })
    })
  );
  assertVerdict(expired);
});

test("returning inside clears the excursion clock", () => {
  const back = evaluateLeash({
    home: point(0, 0),
    position: point(6, 8),
    leash: 10,
    graceTime: 3,
    time: 103,
    outsideSince: 100
  });
  assert.deepEqual(
    back,
    sample({
      distance: 10,
      graceTime: 3,
      time: 103,
      outsideSince: null
    })
  );
  assert.equal(back.reset, false);
});

test("grace distance and grace time forgive different step-outs", () => {
  const opened = evaluateLeash({
    home: point(0, 0),
    position: point(0, 12),
    leash: 10,
    graceDistance: 5,
    graceTime: 4,
    time: 50
  });
  assert.deepEqual(
    opened,
    sample({
      band: "grace",
      distance: 12,
      graceDistance: 5,
      graceTime: 4,
      outer: 15,
      time: 50,
      outsideSince: 50
    })
  );

  const timed = evaluateLeash({
    home: point(0, 0),
    position: point(0, 12),
    leash: 10,
    graceDistance: 5,
    graceTime: 4,
    time: 50,
    outsideSince: 46
  });
  assert.deepEqual(
    timed,
    sample({
      reset: true,
      reason: "time",
      band: "grace",
      distance: 12,
      graceDistance: 5,
      graceTime: 4,
      outer: 15,
      time: 50,
      restore: restoration({
        reason: "time",
        distance: 12,
        time: 50,
        outsideSince: 46
      })
    })
  );
  assertVerdict(timed);

  const deep = evaluateLeash({
    home: point(0, 0),
    position: point(0, 16),
    leash: 10,
    graceDistance: 5,
    graceTime: 4,
    time: 50,
    outsideSince: 49
  });
  assert.equal(deep.reset, true);
  assert.equal(deep.reason, "distance");
  assert.equal(deep.band, "outside");
  assert.equal(deep.restore.outsideSince, 49);
  assert.equal(deep.outsideSince, null);
});

test("without a grace distance the grace time covers every step past the leash", () => {
  const far = evaluateLeash({
    home: point(0, 0),
    position: point(0, 40),
    leash: 10,
    graceTime: 4,
    time: 50
  });
  assert.equal(far.reset, false);
  assert.equal(far.band, "outside");
  assert.equal(far.distance, 40);
  assert.equal(far.outsideSince, 50);

  const kept = evaluateLeash({
    home: point(0, 0),
    position: point(0, 40),
    leash: 10,
    graceTime: 4,
    time: 53,
    outsideSince: 50
  });
  assert.equal(kept.reset, false);
  assert.equal(kept.outsideSince, 50);

  const done = evaluateLeash({
    home: point(0, 0),
    position: point(0, 40),
    leash: 10,
    graceTime: 4,
    time: 54,
    outsideSince: 50
  });
  assert.equal(done.reset, true);
  assert.equal(done.reason, "time");
});

test("a zero grace time makes the grace band a permanent spatial cushion", () => {
  const held = evaluateLeash({
    home: point(0, 0),
    position: point(0, 15),
    leash: 10,
    graceDistance: 5,
    graceTime: 0,
    time: 80,
    outsideSince: 10
  });
  assert.equal(held.reset, false);
  assert.equal(held.band, "grace");
  assert.equal(held.outsideSince, null);

  const hard = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceDistance: 0,
    graceTime: 0,
    time: 80,
    outsideSince: 10
  });
  assert.equal(hard.reset, true);
  assert.equal(hard.reason, "distance");
  assert.equal(hard.restore.outsideSince, 10);
});

test("the leash clock follows the caller's outsideSince across a full excursion", () => {
  let outsideSince = null;
  const marks = [
    { time: 0, y: 0, reset: false, band: "inside", outsideSince: null },
    { time: 1, y: 11, reset: false, band: "outside", outsideSince: 1 },
    { time: 3, y: 12, reset: false, band: "outside", outsideSince: 1 },
    { time: 4, y: 6, reset: false, band: "inside", outsideSince: null },
    { time: 6, y: 11, reset: false, band: "outside", outsideSince: 6 },
    { time: 11, y: 11, reset: true, band: "outside", outsideSince: null }
  ];
  for (const mark of marks) {
    const result = evaluateLeash({
      home: point(0, 0),
      position: point(0, mark.y),
      leash: 10,
      graceTime: 5,
      time: mark.time,
      outsideSince
    });
    assert.equal(result.reset, mark.reset, String(mark.time));
    assert.equal(result.band, mark.band, String(mark.time));
    assert.equal(result.outsideSince, mark.outsideSince, String(mark.time));
    if (mark.time === 11) {
      assert.equal(result.reason, "time");
      assert.equal(result.restore.outsideSince, 6);
    }
    outsideSince = result.outsideSince;
  }
});

test("combat start dates the fight and does not start the leash clock", () => {
  const quiet = evaluateLeash({
    home: point(0, 0),
    position: point(6, 8),
    leash: 10,
    time: 100,
    combatStart: 90
  });
  assert.equal(quiet.reset, false);
  assert.equal(quiet.combatStart, 90);
  assert.equal(quiet.duration, 10);
  assert.equal(quiet.restore, null);

  const early = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 5,
    time: 100,
    combatStart: 90
  });
  assert.equal(early.reset, false);
  assert.equal(early.outsideSince, 100);
  assert.equal(early.duration, 10);

  const anchored = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 5,
    time: 100,
    combatStart: 90,
    outsideSince: 90
  });
  assert.equal(anchored.reset, true);
  assert.equal(anchored.reason, "time");
  assert.equal(anchored.duration, 10);
  assert.equal(anchored.restore.combatStart, 90);
  assert.equal(anchored.restore.duration, 10);
  assert.equal(anchored.restore.outsideSince, 90);
  assert.equal(anchored.restore.time, 100);

  const sameInstant = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 1,
    time: 40,
    combatStart: 40,
    outsideSince: 40
  });
  assert.equal(sameInstant.reset, false);
  assert.equal(sameInstant.duration, 0);
  assert.equal(sameInstant.outsideSince, 40);
});

test("two combat starts with the same excursion share the reset and differ in duration", () => {
  const first = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 3,
    time: 30,
    combatStart: 10,
    outsideSince: 28
  });
  const second = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 3,
    time: 30,
    combatStart: 20,
    outsideSince: 28
  });
  assert.equal(first.reset, false);
  assert.equal(second.reset, false);
  assert.equal(first.outsideSince, 28);
  assert.equal(second.outsideSince, 28);
  assert.equal(first.duration, 20);
  assert.equal(second.duration, 10);
});

test("three dimensions use z and a missing z stays on the plane", () => {
  const solid = evaluateLeash({
    home: point(0, 0, 0),
    position: point(2, 3, 6),
    leash: 7,
    time: 0
  });
  assert.equal(solid.distance, 7);
  assert.equal(solid.band, "inside");
  assert.deepEqual(solid.home, point(0, 0, 0));

  const past = evaluateLeash({
    home: point(0, 0, 0),
    position: point(2, 3, 6),
    leash: 6,
    time: 4,
    combatStart: 1
  });
  assert.equal(past.distance, 7);
  assert.equal(past.reset, true);
  assert.equal(past.reason, "distance");
  assert.equal(past.duration, 3);
  assert.deepEqual(past.restore.home, point(0, 0, 0));

  const flat = evaluateLeash({
    home: point(0, 0),
    position: point(2, 3),
    leash: 7,
    time: 0
  });
  assert.equal(flat.distance, Math.hypot(2, 3));
  assert.equal(flat.reset, false);
});

test("the decision table matches every band at the grace boundaries", () => {
  const rows = [
    {
      distance: 0,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: null,
      reset: false,
      reason: null,
      band: "inside",
      carried: null
    },
    {
      distance: 10,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: 16,
      reset: false,
      reason: null,
      band: "inside",
      carried: null
    },
    {
      distance: 11,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: null,
      reset: false,
      reason: null,
      band: "grace",
      carried: 20
    },
    {
      distance: 11,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: 20,
      reset: false,
      reason: null,
      band: "grace",
      carried: 20
    },
    {
      distance: 15,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: 17,
      reset: false,
      reason: null,
      band: "grace",
      carried: 17
    },
    {
      distance: 15,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: 16,
      reset: true,
      reason: "time",
      band: "grace",
      carried: null,
      departed: 16
    },
    {
      distance: 16,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: null,
      reset: true,
      reason: "distance",
      band: "outside",
      carried: null,
      departed: null
    },
    {
      distance: 16,
      graceDistance: 5,
      graceTime: 4,
      outsideSince: 20,
      reset: true,
      reason: "distance",
      band: "outside",
      carried: null,
      departed: 20
    },
    {
      distance: 11,
      graceDistance: 5,
      graceTime: 0,
      outsideSince: 10,
      reset: false,
      reason: null,
      band: "grace",
      carried: null
    },
    {
      distance: 16,
      graceDistance: 5,
      graceTime: 0,
      outsideSince: null,
      reset: true,
      reason: "distance",
      band: "outside",
      carried: null,
      departed: null
    },
    {
      distance: 10,
      graceDistance: 0,
      graceTime: 4,
      outsideSince: null,
      reset: false,
      reason: null,
      band: "inside",
      carried: null
    },
    {
      distance: 11,
      graceDistance: 0,
      graceTime: 4,
      outsideSince: null,
      reset: false,
      reason: null,
      band: "outside",
      carried: 20
    },
    {
      distance: 16,
      graceDistance: 0,
      graceTime: 4,
      outsideSince: 17,
      reset: false,
      reason: null,
      band: "outside",
      carried: 17
    },
    {
      distance: 16,
      graceDistance: 0,
      graceTime: 4,
      outsideSince: 16,
      reset: true,
      reason: "time",
      band: "outside",
      carried: null,
      departed: 16
    },
    {
      distance: 10,
      graceDistance: 0,
      graceTime: 0,
      outsideSince: null,
      reset: false,
      reason: null,
      band: "inside",
      carried: null
    },
    {
      distance: 11,
      graceDistance: 0,
      graceTime: 0,
      outsideSince: 16,
      reset: true,
      reason: "distance",
      band: "outside",
      carried: null,
      departed: 16
    }
  ];
  for (const row of rows) {
    const result = evaluateLeash({
      home: point(0, 0),
      position: point(row.distance, 0),
      leash: 10,
      graceDistance: row.graceDistance,
      graceTime: row.graceTime,
      time: 20,
      outsideSince: row.outsideSince
    });
    assert.equal(result.distance, row.distance);
    assert.equal(result.reset, row.reset);
    assert.equal(result.reason, row.reason);
    assert.equal(result.band, row.band);
    assert.equal(result.outsideSince, row.carried);
    assert.equal(result.outer, 10 + row.graceDistance);
    if (row.reset) {
      assert.equal(result.restore.outsideSince, row.departed);
      assert.equal(result.restore.reason, row.reason);
    }
  }
});

test("omitted grace fields match explicit zeros and null outsideSince matches omission", () => {
  const implied = evaluateLeash(valid({ position: point(0, 11) }));
  const explicit = evaluateLeash(
    valid({
      position: point(0, 11),
      graceDistance: 0,
      graceTime: 0,
      outsideSince: null
    })
  );
  assert.deepEqual(implied, explicit);
  assert.notEqual(implied, explicit);
  assert.notEqual(implied.home, explicit.home);
  assert.notEqual(implied.restore, explicit.restore);
  assert.notEqual(implied.restore.home, explicit.restore.home);

  const open = evaluateLeash(
    valid({
      position: point(0, 11),
      graceTime: 2,
      time: 5
    })
  );
  const cleared = evaluateLeash(
    valid({
      position: point(0, 11),
      graceTime: 2,
      time: 5,
      outsideSince: null
    })
  );
  assert.deepEqual(open, cleared);
  assert.equal(open.outsideSince, 5);
});

test("fractional distances compare exactly and one unit past a fractional leash resets", () => {
  const held = evaluateLeash(
    valid({
      position: point(0, 10.5),
      leash: 10.5,
      graceDistance: 0.5
    })
  );
  assert.equal(held.distance, 10.5);
  assert.equal(held.band, "inside");
  assert.equal(held.outer, 11);

  const cushion = evaluateLeash(
    valid({
      position: point(0, 11),
      leash: 10.5,
      graceDistance: 0.5
    })
  );
  assert.equal(cushion.band, "grace");
  assert.equal(cushion.reset, false);

  const reset = evaluateLeash(
    valid({
      position: point(0, 11.6),
      leash: 10.5,
      graceDistance: 0.5
    })
  );
  assert.equal(reset.distance, 11.6);
  assert.equal(reset.reset, true);
  assert.equal(reset.reason, "distance");
});

test("signed zero is stored as zero on every number the result writes", () => {
  const result = evaluateLeash({
    home: point(-0, -0, -0),
    position: point(-0, -0, -0),
    leash: -0,
    graceDistance: -0,
    graceTime: -0,
    time: -0,
    combatStart: -0,
    outsideSince: -0
  });
  assert.equal(Object.is(result.distance, 0), true);
  assert.equal(Object.is(result.leash, 0), true);
  assert.equal(Object.is(result.graceDistance, 0), true);
  assert.equal(Object.is(result.graceTime, 0), true);
  assert.equal(Object.is(result.outer, 0), true);
  assert.equal(Object.is(result.time, 0), true);
  assert.equal(Object.is(result.combatStart, 0), true);
  assert.equal(Object.is(result.duration, 0), true);
  assert.equal(Object.is(result.home.x, 0), true);
  assert.equal(Object.is(result.home.y, 0), true);
  assert.equal(Object.is(result.home.z, 0), true);
  assert.equal(result.band, "inside");
  assert.equal(result.outsideSince, null);
});

test("the largest safe time stays exact", () => {
  const time = Number.MAX_SAFE_INTEGER;
  const held = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 1,
    time,
    combatStart: time,
    outsideSince: time
  });
  assert.equal(held.reset, false);
  assert.equal(held.duration, 0);
  assert.equal(held.outsideSince, time);

  const expired = evaluateLeash({
    home: point(0, 0),
    position: point(0, 11),
    leash: 10,
    graceTime: 1,
    time,
    combatStart: time - 2,
    outsideSince: time - 1
  });
  assert.equal(expired.reset, true);
  assert.equal(expired.reason, "time");
  assert.equal(expired.duration, 2);
  assert.equal(expired.restore.outsideSince, time - 1);
});

test("a huge finite distance is a normal comparison", () => {
  const culled = evaluateLeash(
    valid({
      position: point(1e200, 0),
      leash: 10
    })
  );
  assert.equal(culled.distance, 1e200);
  assert.equal(culled.reset, true);
  assert.equal(culled.reason, "distance");
});

test("unknown fields are ignored and a frozen null-prototype input is accepted", () => {
  const home = Object.create(null);
  home.x = 0;
  home.y = 0;
  home.label = "camp";
  const position = Object.create(null);
  position.x = 6;
  position.y = 8;
  const options = Object.freeze({
    home: Object.freeze(home),
    position: Object.freeze(position),
    leash: 10,
    time: 4,
    note: "pull",
    graceDistance: undefined,
    graceTime: undefined,
    combatStart: undefined
  });
  const result = evaluateLeash(options);
  assert.equal(result.distance, 10);
  assert.equal(result.reset, false);
  assert.equal(result.time, 4);
  assert.equal(Object.hasOwn(result, "note"), false);
  assert.equal(Object.hasOwn(result.home, "label"), false);
});

test("calls leave their arguments unchanged and later edits do not rewrite a verdict", () => {
  const home = point(0, 0);
  const position = point(0, 11);
  const options = {
    home,
    position,
    leash: 10,
    graceTime: 3,
    time: 10,
    outsideSince: 8,
    combatStart: 2
  };
  const first = evaluateLeash(options);
  position.y = 0;
  options.time = 0;
  options.leash = 0;
  assert.equal(home.x, 0);
  assert.equal(home.y, 0);
  assert.equal(first.distance, 11);
  assert.equal(first.reset, false);
  assert.equal(first.time, 10);
  assert.equal(first.leash, 10);
  assert.equal(first.outsideSince, 8);
  assert.equal(first.combatStart, 2);
  assert.throws(() => {
    first.reset = true;
  }, TypeError);
  assert.throws(() => {
    first.home.x = 4;
  }, TypeError);
  const second = evaluateLeash({
    home,
    position: point(0, 11),
    leash: 10,
    graceTime: 3,
    time: 10,
    outsideSince: 8,
    combatStart: 2
  });
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.home, second.home);
});

test("the same input is deterministic and each call returns a new object tree", () => {
  const options = valid({
    position: point(0, 16),
    graceDistance: 5,
    graceTime: 4,
    time: 12,
    combatStart: 3,
    outsideSince: 9
  });
  const left = evaluateLeash(options);
  const right = evaluateLeash(options);
  assert.deepEqual(left, right);
  assert.notEqual(left, right);
  assert.notEqual(left.home, right.home);
  assert.notEqual(left.restore, right.restore);
  assert.notEqual(left.restore.home, right.restore.home);
  assert.notEqual(left.home, options.home);
  assert.equal(left.reset, true);
  assert.equal(left.reason, "distance");
  assert.equal(left.duration, 9);
});
