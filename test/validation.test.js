import assert from "node:assert/strict";
import test from "node:test";
import { evaluateLeash } from "../src/index.js";
import { valid } from "./helpers.js";

const OPTIONS = "options must be an object";
const HOME = "home must be an object";
const HOME_X = "home x must be a finite number";
const HOME_Y = "home y must be a finite number";
const HOME_Z = "home z must be a finite number";
const POSITION = "position must be an object";
const POSITION_X = "position x must be a finite number";
const POSITION_Y = "position y must be a finite number";
const POSITION_Z = "position z must be a finite number";
const POSITION_TWO = "position must be two-dimensional";
const POSITION_THREE = "position must be three-dimensional";
const LEASH = "leash must be a finite number greater than or equal to 0";
const GRACE = "graceDistance must be a finite number greater than or equal to 0";
const RANGE = "leash range must be finite";
const GRACE_TIME = "graceTime must be an integer greater than or equal to 0";
const TIME = "time must be an integer greater than or equal to 0";
const COMBAT = "combatStart must be an integer greater than or equal to 0";
const COMBAT_ORDER = "combatStart must be less than or equal to time";
const OUTSIDE = "outsideSince must be an integer greater than or equal to 0";
const OUTSIDE_TIME = "outsideSince must be less than or equal to time";
const OUTSIDE_COMBAT = "outsideSince must be at least combatStart";
const LENGTH = "distance must be finite";

test("evaluateLeash rejects a bad options object before it reads fields", () => {
  assert.throws(() => evaluateLeash(), {
    name: "TypeError",
    message: OPTIONS
  });
  for (const options of [undefined, null, [], "leash", 1, true, false, () => {}]) {
    assert.throws(() => evaluateLeash(options), {
      name: "TypeError",
      message: OPTIONS
    });
  }
});

test("evaluateLeash reads home, position, leash, grace, time, then distance", () => {
  assert.throws(() => evaluateLeash({}), {
    name: "TypeError",
    message: HOME
  });
  assert.throws(
    () =>
      evaluateLeash({
        position: null,
        leash: -1,
        graceDistance: -1,
        graceTime: -1,
        time: -1,
        combatStart: -1,
        outsideSince: -1
      }),
    {
      name: "TypeError",
      message: HOME
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { y: 0 },
        position: null,
        leash: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: HOME_X
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0 },
        position: null,
        leash: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: HOME_Y
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0, z: Number.NaN },
        position: null,
        leash: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: HOME_Z
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: [],
        leash: -1,
        graceDistance: -1,
        graceTime: -1,
        time: -1
      }),
    {
      name: "TypeError",
      message: POSITION
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.NaN, y: 0 },
        leash: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: POSITION_X
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: 0, y: "0" },
        leash: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: POSITION_Y
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: -1,
        graceDistance: Number.MAX_VALUE,
        graceTime: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: LEASH
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        graceDistance: -1,
        graceTime: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: GRACE
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: Number.MAX_VALUE,
        graceDistance: Number.MAX_VALUE,
        graceTime: -1,
        time: -1
      }),
    {
      name: "RangeError",
      message: RANGE
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        graceTime: 1.5,
        time: -1,
        combatStart: -1
      }),
    {
      name: "RangeError",
      message: GRACE_TIME
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        time: -1,
        combatStart: 5,
        outsideSince: 4
      }),
    {
      name: "RangeError",
      message: TIME
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        time: 0,
        combatStart: -1,
        outsideSince: -1
      }),
    {
      name: "RangeError",
      message: COMBAT
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        time: 4,
        combatStart: 5,
        outsideSince: -1
      }),
    {
      name: "RangeError",
      message: COMBAT_ORDER
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        time: 4,
        outsideSince: 1.5
      }),
    {
      name: "RangeError",
      message: OUTSIDE
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        time: 4,
        combatStart: 1,
        outsideSince: 5
      }),
    {
      name: "RangeError",
      message: OUTSIDE_TIME
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        time: 10,
        combatStart: 5,
        outsideSince: 4
      }),
    {
      name: "RangeError",
      message: OUTSIDE_COMBAT
    }
  );
  assert.throws(
    () =>
      evaluateLeash({
        home: { x: 0, y: 0 },
        position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        leash: 10,
        time: 0
      }),
    {
      name: "RangeError",
      message: LENGTH
    }
  );
});

test("home axes are own finite numbers and z selects the dimension", () => {
  for (const home of [null, [], "origin", 0, true]) {
    assert.throws(() => evaluateLeash(valid({ home })), {
      name: "TypeError",
      message: HOME
    });
  }
  for (const x of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, "0", true, false]) {
    assert.throws(() => evaluateLeash(valid({ home: { x, y: 0 } })), {
      name: "RangeError",
      message: HOME_X
    });
  }
  for (const y of [undefined, null, Number.NaN, Number.NEGATIVE_INFINITY, "0", true]) {
    assert.throws(() => evaluateLeash(valid({ home: { x: 0, y } })), {
      name: "RangeError",
      message: HOME_Y
    });
  }
  for (const z of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, "0", true]) {
    assert.throws(() => evaluateLeash(valid({ home: { x: 0, y: 0, z } })), {
      name: "RangeError",
      message: HOME_Z
    });
  }
  const inherited = Object.create({ x: 0, y: 0 });
  assert.throws(() => evaluateLeash(valid({ home: inherited })), {
    name: "RangeError",
    message: HOME_X
  });
  const flat = Object.create({ z: 100 });
  flat.x = 0;
  flat.y = 0;
  const ignored = evaluateLeash(
    valid({
      home: flat,
      position: { x: 3, y: 4 }
    })
  );
  assert.equal(ignored.distance, 5);
  assert.equal(Object.hasOwn(ignored.home, "z"), false);
  const bare = Object.create(null);
  bare.x = -0;
  bare.y = 0;
  const fromNull = evaluateLeash(
    valid({
      home: bare,
      position: { x: 0, y: 0 }
    })
  );
  assert.equal(fromNull.distance, 0);
  assert.equal(Object.is(fromNull.home.x, 0), true);
});

test("position matches the home dimension and uses own finite axes", () => {
  for (const position of [null, [], "point", 0, true, undefined]) {
    assert.throws(() => evaluateLeash(valid({ position })), {
      name: "TypeError",
      message: POSITION
    });
  }
  for (const x of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, "0", true]) {
    assert.throws(() => evaluateLeash(valid({ position: { x, y: 0, z: 1 } })), {
      name: "RangeError",
      message: POSITION_X
    });
  }
  for (const y of [undefined, null, Number.NaN, Number.NEGATIVE_INFINITY, "1", false]) {
    assert.throws(() => evaluateLeash(valid({ position: { x: 0, y, z: 1 } })), {
      name: "RangeError",
      message: POSITION_Y
    });
  }
  assert.throws(() => evaluateLeash(valid({ position: { x: 0, y: 0, z: 1 } })), {
    name: "TypeError",
    message: POSITION_TWO
  });
  assert.throws(() => evaluateLeash(valid({ position: { x: 0, y: 0, z: undefined } })), {
    name: "TypeError",
    message: POSITION_TWO
  });
  assert.throws(
    () =>
      evaluateLeash(
        valid({
          home: { x: 0, y: 0, z: 0 },
          position: { x: 0, y: 0 }
        })
      ),
    {
      name: "TypeError",
      message: POSITION_THREE
    }
  );
  for (const z of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, "0", true]) {
    assert.throws(
      () =>
        evaluateLeash(
          valid({
            home: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z }
          })
        ),
      {
        name: "RangeError",
        message: POSITION_Z
      }
    );
  }
  const inherited = Object.create({ x: 1, y: 2 });
  assert.throws(() => evaluateLeash(valid({ position: inherited })), {
    name: "RangeError",
    message: POSITION_X
  });
  const inheritedZ = Object.create({ z: 9 });
  inheritedZ.x = 3;
  inheritedZ.y = 4;
  const flat = evaluateLeash(valid({ position: inheritedZ }));
  assert.equal(flat.distance, 5);
  assert.equal(Object.hasOwn(flat.home, "z"), false);
});

test("leash, grace distance, and grace time reject non-ranges before time", () => {
  for (const leash of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, -1, "10", true]) {
    assert.throws(() => evaluateLeash(valid({ leash })), {
      name: "RangeError",
      message: LEASH
    });
  }
  const missing = valid();
  delete missing.leash;
  assert.throws(() => evaluateLeash(missing), {
    name: "RangeError",
    message: LEASH
  });
  const inherited = Object.create({ leash: 10 });
  inherited.home = { x: 0, y: 0 };
  inherited.position = { x: 0, y: 0 };
  inherited.time = 0;
  assert.throws(() => evaluateLeash(inherited), {
    name: "RangeError",
    message: LEASH
  });
  for (const graceDistance of [null, Number.NaN, Number.NEGATIVE_INFINITY, -0.1, "1", false]) {
    assert.throws(() => evaluateLeash(valid({ graceDistance })), {
      name: "RangeError",
      message: GRACE
    });
  }
  assert.throws(
    () =>
      evaluateLeash(
        valid({
          leash: Number.MAX_VALUE,
          graceDistance: Number.MAX_VALUE,
          position: { x: 0, y: 0 }
        })
      ),
    {
      name: "RangeError",
      message: RANGE
    }
  );
  for (const graceTime of [null, 1.5, -1, Number.NaN, Number.POSITIVE_INFINITY, "3", true]) {
    assert.throws(() => evaluateLeash(valid({ graceTime })), {
      name: "RangeError",
      message: GRACE_TIME
    });
  }
  assert.throws(() => evaluateLeash(valid({ graceTime: Number.MAX_SAFE_INTEGER + 1 })), {
    name: "RangeError",
    message: GRACE_TIME
  });
});

test("time, combat start, and outsideSince are ordered integers", () => {
  for (const time of [undefined, null, 1.5, -1, Number.NaN, Number.POSITIVE_INFINITY, "0", false]) {
    assert.throws(() => evaluateLeash(valid({ time })), {
      name: "RangeError",
      message: TIME
    });
  }
  const missing = valid();
  delete missing.time;
  assert.throws(() => evaluateLeash(missing), {
    name: "RangeError",
    message: TIME
  });
  const inherited = Object.create({ time: 0 });
  inherited.home = { x: 0, y: 0 };
  inherited.position = { x: 0, y: 0 };
  inherited.leash = 10;
  assert.throws(() => evaluateLeash(inherited), {
    name: "RangeError",
    message: TIME
  });
  assert.throws(() => evaluateLeash(valid({ time: Number.MAX_SAFE_INTEGER + 1 })), {
    name: "RangeError",
    message: TIME
  });
  for (const combatStart of [null, -1, 1.5, Number.NaN, "0", true, Number.POSITIVE_INFINITY]) {
    assert.throws(() => evaluateLeash(valid({ time: 10, combatStart })), {
      name: "RangeError",
      message: COMBAT
    });
  }
  assert.throws(() => evaluateLeash(valid({ time: 4, combatStart: 5 })), {
    name: "RangeError",
    message: COMBAT_ORDER
  });
  for (const outsideSince of [-1, 1.5, Number.NaN, "0", false, Number.POSITIVE_INFINITY]) {
    assert.throws(() => evaluateLeash(valid({ time: 10, outsideSince })), {
      name: "RangeError",
      message: OUTSIDE
    });
  }
  assert.throws(() => evaluateLeash(valid({ time: 4, outsideSince: 5 })), {
    name: "RangeError",
    message: OUTSIDE_TIME
  });
  assert.throws(
    () =>
      evaluateLeash(
        valid({
          time: 10,
          combatStart: 6,
          outsideSince: 5
        })
      ),
    {
      name: "RangeError",
      message: OUTSIDE_COMBAT
    }
  );
  assert.throws(
    () =>
      evaluateLeash(
        valid({
          time: 10,
          combatStart: 6,
          outsideSince: 11
        })
      ),
    {
      name: "RangeError",
      message: OUTSIDE_TIME
    }
  );
});

test("a later invalid field does not hide an earlier distance overflow", () => {
  const caught = evaluateLeash(
    valid({
      position: { x: 1e200, y: 0 },
      leash: 10,
      time: 0
    })
  );
  assert.equal(Number.isFinite(caught.distance), true);
  assert.throws(
    () =>
      evaluateLeash(
        valid({
          position: { x: Number.MAX_VALUE, y: Number.MAX_VALUE }
        })
      ),
    {
      name: "RangeError",
      message: LENGTH
    }
  );
});
