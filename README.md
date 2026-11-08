# @aneron/leash-reset

Encounter leash rules that reset combat when a target exceeds the leash range.

## Purpose

`@aneron/leash-reset` decides whether one target has left the leash around an encounter's home position. The caller passes the home position, the target's current position, the leash distance, and the time. An optional grace distance and an optional grace time let a brief step-out continue. An optional combat-start time dates the fight. When the leash breaks, the result carries a reset flag and the values a caller uses to restore the encounter: the home position to move back to, the combat start, the duration, the time, the distance, and the reason.

The module reads the arguments and returns a new result. It leaves its arguments unchanged. It reads no clock, starts no timer, draws no random number, and opens no socket. It has no runtime dependencies. The same input produces the same result.

## Install

The package is an ES module. It needs Node.js 20 or newer. It has no runtime dependencies. The package name is `@aneron/leash-reset`. It is not published to the npm registry.

Clone this repository and run the tests:

```bash
git clone https://github.com/ANERON-GAMES/leash-reset.git
cd leash-reset
npm install
npm test
```

`npm test` runs `node --test`. `npm run lint` runs ESLint. `npm run format:check` runs Prettier.

Install it as a dependency from the git repository:

```bash
npm install github:ANERON-GAMES/leash-reset
```

```js
import { evaluateLeash } from "@aneron/leash-reset";
```

Code in this repository imports the same entry point with `./src/index.js`.

## Usage

Distances below are in one unit chosen by the caller. Times are in one unit chosen by the caller. The module does not treat a distance as metres, and it does not treat a time as milliseconds.

A leash of `10` holds a target standing on the circle. `(6, 8)` is distance `10`. One step to `(0, 11)` is distance `11` and resets the encounter. The restore record carries the home position.

```js
import { evaluateLeash } from "@aneron/leash-reset";

const inside = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 6, y: 8 },
  leash: 10,
  time: 0
});

const reset = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 11 },
  leash: 10,
  time: 0
});
```

`inside.reset` is `false`. `inside.band` is `"inside"`. `inside.distance` is `10`. `inside.outsideSince` is `null`. `inside.restore` is `null`. `inside.leash` is `10`. `inside.outer` is `10`.

`reset.reset` is `true`. `reset.reason` is `"distance"`. `reset.band` is `"outside"`. `reset.distance` is `11`. `reset.outsideSince` is `null`. `reset.restore.home.x` is `0`. `reset.restore.home.y` is `0`. `reset.restore.reason` is `"distance"`. `reset.restore.distance` is `11`. `reset.restore.time` is `0`.

A grace distance of `5` extends the hard edge to `15`. `(9, 12)` is distance `15` and stays in the grace band. `(0, 16)` is distance `16` and resets at once. With a grace time of `0`, a target may remain in that band.

```js
const rim = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 9, y: 12 },
  leash: 10,
  graceDistance: 5,
  time: 20
});

const past = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 16 },
  leash: 10,
  graceDistance: 5,
  time: 20
});
```

`rim.reset` is `false`. `rim.band` is `"grace"`. `rim.distance` is `15`. `rim.outer` is `15`. `rim.outsideSince` is `null`. `past.reset` is `true`. `past.reason` is `"distance"`. `past.distance` is `16`. `past.band` is `"outside"`. `past.restore.distance` is `16`.

A grace time of `3` allows a step past a hard leash of `10` until the excursion has lasted `3`. The call that first sees the target outside starts the clock at `time`. The caller passes `outsideSince` back on the next call. At time `102` the excursion is still brief. At time `103` it expires.

```js
const discovered = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 11 },
  leash: 10,
  graceTime: 3,
  time: 100
});

const still = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 11 },
  leash: 10,
  graceTime: 3,
  time: 102,
  outsideSince: discovered.outsideSince
});

const expired = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 11 },
  leash: 10,
  graceTime: 3,
  time: 103,
  outsideSince: 100
});
```

`discovered.reset` is `false`. `discovered.band` is `"outside"`. `discovered.outsideSince` is `100`. `still.reset` is `false`. `still.outsideSince` is `100`. `still.time` is `102`. `expired.reset` is `true`. `expired.reason` is `"time"`. `expired.band` is `"outside"`. `expired.outsideSince` is `null`. `expired.restore.outsideSince` is `100`. `expired.restore.time` is `103`. `discovered.reset` is still `false`.

Stepping back to `(6, 8)` clears the clock. The next step-out starts a new excursion.

```js
const back = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 6, y: 8 },
  leash: 10,
  graceTime: 3,
  time: 103,
  outsideSince: 100
});
```

`back.reset` is `false`. `back.band` is `"inside"`. `back.distance` is `10`. `back.outsideSince` is `null`.

With both allowances, a target at distance `12` is inside the grace band and the clock runs. An excursion that began at `46` has lasted `4` by time `50`, so it resets for time. A target at distance `16` is past the grace distance, so it resets for distance on that call. The open excursion is kept on the restore record.

```js
const opened = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 12 },
  leash: 10,
  graceDistance: 5,
  graceTime: 4,
  time: 50
});

const timed = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 12 },
  leash: 10,
  graceDistance: 5,
  graceTime: 4,
  time: 50,
  outsideSince: 46
});

const deep = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 16 },
  leash: 10,
  graceDistance: 5,
  graceTime: 4,
  time: 50,
  outsideSince: 49
});
```

`opened.reset` is `false`. `opened.band` is `"grace"`. `opened.distance` is `12`. `opened.outsideSince` is `50`. `timed.reset` is `true`. `timed.reason` is `"time"`. `timed.band` is `"grace"`. `timed.restore.outsideSince` is `46`. `deep.reset` is `true`. `deep.reason` is `"distance"`. `deep.band` is `"outside"`. `deep.distance` is `16`. `deep.restore.outsideSince` is `49`. `deep.outsideSince` is `null`.

`combatStart` dates the fight. From `90` to `100` the duration is `10`. It does not choose when the step-out began. Passing `outsideSince` equal to `combatStart` measures the grace time from the start of combat. The restore record carries both clocks.

```js
const quiet = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 6, y: 8 },
  leash: 10,
  time: 100,
  combatStart: 90
});

const anchored = evaluateLeash({
  home: { x: 0, y: 0 },
  position: { x: 0, y: 11 },
  leash: 10,
  graceTime: 5,
  time: 100,
  combatStart: 90,
  outsideSince: 90
});
```

`quiet.reset` is `false`. `quiet.combatStart` is `90`. `quiet.duration` is `10`. `quiet.restore` is `null`. `anchored.reset` is `true`. `anchored.reason` is `"time"`. `anchored.duration` is `10`. `anchored.restore.combatStart` is `90`. `anchored.restore.duration` is `10`. `anchored.restore.outsideSince` is `90`. `anchored.restore.home.x` is `0`.

A three-dimensional home uses `z`. `(2, 3, 6)` is distance `7`. A leash of `7` holds. A leash of `6` resets.

```js
const solid = evaluateLeash({
  home: { x: 0, y: 0, z: 0 },
  position: { x: 2, y: 3, z: 6 },
  leash: 7,
  time: 0
});

const broken = evaluateLeash({
  home: { x: 0, y: 0, z: 0 },
  position: { x: 2, y: 3, z: 6 },
  leash: 6,
  time: 0
});
```

`solid.distance` is `7`. `solid.band` is `"inside"`. `solid.reset` is `false`. `solid.home.z` is `0`. `broken.distance` is `7`. `broken.reset` is `true`. `broken.reason` is `"distance"`. `broken.restore.home.z` is `0`.

The calls above do not write into the objects they were given.

```js
const list = {
  home: { x: 0, y: 0 },
  position: { x: 0, y: 11 },
  leash: 10,
  time: 0
};
evaluateLeash(list);
```

`list.home.x` is still `0`. `list.position.y` is still `11`. `list.leash` is still `10`.

## API

`evaluateLeash` is a function. It has no constructor and no shared state. Each call reads its argument and returns a new result. The same input produces a deep-equal result and a new object tree.

`evaluateLeash` does not mutate `options`, `home`, `position`, or any nested point. A call freezes only the result it creates. The result, `home`, `restore`, and `restore.home` are frozen. `result.home` and `result.restore.home` are equal points and different objects.

Own fields are read. Unknown fields are ignored. An omitted optional field, or a field whose value is `undefined`, uses the default. A frozen object and an object with a null prototype are accepted. Inherited fields are ignored.

Coordinates and the leash share one unit. Times share one unit. The module does not convert either unit. Comparison is ordinary IEEE-754 with no epsilon. `-0` is stored as `0` on every number this module writes. `-0` compares equal to `0` before that normalisation.

### `evaluateLeash(options)`

```js
evaluateLeash(options);
```

`options` must be an object and must not be an array. Otherwise the function throws `TypeError` with the message `options must be an object`.

Checks run in this order. The first failure wins. A throw returns no result.

1. `options` is an object.
2. `home` is an object with finite `x` and `y`. An own `z` must be finite. That fixes the dimension for the call.
3. `position` is an object with finite `x` and `y`, and its dimension matches `home`.
4. `leash` is an own finite number greater than or equal to `0`.
5. `graceDistance`, when present and not `undefined`, is a finite number greater than or equal to `0`. The sum `leash + graceDistance` must be finite.
6. `graceTime`, when present and not `undefined`, is an integer greater than or equal to `0`.
7. `time` is an own integer greater than or equal to `0`.
8. `combatStart`, when present and not `undefined`, is an integer greater than or equal to `0` and less than or equal to `time`.
9. `outsideSince`, when present and not `undefined` or `null`, is an integer greater than or equal to `0`, less than or equal to `time`, and greater than or equal to `combatStart` when combat has a start.
10. The distance is measured. A non-finite distance throws.

| Field           | Default  | Accepted values                                                                           |
| --------------- | -------- | ----------------------------------------------------------------------------------------- |
| `home`          | required | `{ x, y }` or `{ x, y, z }` with finite numbers. An own `z` selects 3D.                   |
| `position`      | required | A point with the same dimension as `home`.                                                |
| `leash`         | required | A finite number greater than or equal to `0`. `-0` is stored as `0`.                      |
| `graceDistance` | `0`      | A finite number greater than or equal to `0`, or omitted. `-0` is stored as `0`.          |
| `graceTime`     | `0`      | A safe integer greater than or equal to `0`, or omitted. `-0` is stored as `0`.           |
| `time`          | required | A safe integer greater than or equal to `0`. `-0` is stored as `0`.                       |
| `combatStart`   | `null`   | A safe integer greater than or equal to `0` and less than or equal to `time`, or omitted. |
| `outsideSince`  | `null`   | A safe integer from `combatStart` (or `0`) through `time`, or `null`, or omitted.         |

Integer means `Number.isSafeInteger`. `1.0` is accepted. `1.5`, `Infinity`, and `Number.MAX_SAFE_INTEGER + 1` are rejected. `leash` and `graceDistance` are not required to be integers. `10.5` is a valid leash.

### `options.home`

`home` must be an own property whose value is an object and not an array. Otherwise `TypeError`: `home must be an object`.

`x` must be an own finite number. Otherwise `RangeError`: `home x must be a finite number`.

`y` must be an own finite number. Otherwise `RangeError`: `home y must be a finite number`.

If `z` is an own property, it must be a finite number. Otherwise `RangeError`: `home z must be a finite number`. The call is then three-dimensional. If `z` is not an own property, the call is two-dimensional. An inherited `z` does not make the call three-dimensional.

Unknown home fields are ignored. `-0` is stored as `0`. The result copies the normalised coordinates onto `home`. The input object is left unchanged.

### `options.position`

`position` must be an own property whose value is an object and not an array. Otherwise `TypeError`: `position must be an object`.

`x` must be an own finite number. Otherwise `RangeError`: `position x must be a finite number`.

`y` must be an own finite number. Otherwise `RangeError`: `position y must be a finite number`.

For a two-dimensional home, an own `z` of any value, including `undefined`, throws `TypeError`: `position must be two-dimensional`. `x` and `y` are checked before that.

For a three-dimensional home, a missing `z` throws `TypeError`: `position must be three-dimensional`. A present `z` that is not a finite number throws `RangeError`: `position z must be a finite number`.

A two-dimensional position and a three-dimensional position are separate calls. `z: 0` is a point with a third coordinate. A missing `z` keeps the call on the plane. The distance formulas are:

- Two dimensions: `Math.hypot(x1 - x0, y1 - y0)`.
- Three dimensions: `Math.hypot(x1 - x0, y1 - y0, z1 - z0)`.

`(6, 8)` is distance `10`. `(3, 4)` is distance `5`. `(9, 12)` is distance `15`. `(2, 3, 6)` is distance `7`.

If the computed distance is not finite, `evaluateLeash` throws `RangeError` with the message `distance must be finite`. `Math.hypot(Number.MAX_VALUE, Number.MAX_VALUE)` is not finite. A finite distance such as `1e200` is compared with the leash normally. Distance is measured only after the input checks above have passed.

### `options.leash`

`leash` must be an own property. A missing leash, an inherited leash, and a present value that is not a finite number greater than or equal to `0` all throw `RangeError`: `leash must be a finite number greater than or equal to 0`.

`-0` is stored as `0`. A leash of `0` contains the home point and resets every other finite distance when no grace applies.

The leash is inclusive. `distance <= leash` is inside.

### `options.graceDistance`

`graceDistance` is the extra distance beyond the leash. The default is `0`. The field may be omitted or be `undefined`. The result then stores `graceDistance` as `0`.

A present value other than `undefined` must be a finite number greater than or equal to `0`. Otherwise `RangeError`: `graceDistance must be a finite number greater than or equal to 0`. `null` is rejected. `-0` is stored as `0`.

`outer` is `leash + graceDistance`. The sum must be finite. Otherwise `RangeError`: `leash range must be finite`. That check runs before `graceTime` is read. `-0` outer is stored as `0`.

`outer` is inclusive. `distance <= outer` is still inside the grace band when `graceDistance` is greater than `0` and `distance` is greater than `leash`.

A `graceDistance` of `0` adds no band. Every distance greater than `leash` is outside.

### `options.graceTime`

`graceTime` is how long a qualifying step-out may last. The default is `0`. The field may be omitted or be `undefined`. The result then stores `graceTime` as `0`.

A present value other than `undefined` must be a safe integer greater than or equal to `0`. Otherwise `RangeError`: `graceTime must be an integer greater than or equal to 0`. `null` is rejected. `-0` is stored as `0`.

`graceTime` of `0` leaves the timer off. A grace band is then held for as long as the target stays there. An outside target resets for distance.

`graceTime` greater than `0` runs the timer described under Bands. The comparison is `time - departed >= graceTime`. The boundary is inclusive: an excursion that has lasted exactly `graceTime` resets.

### `options.time`

`time` must be an own property. A missing time, an inherited time, and a present value that is not a safe integer greater than or equal to `0` all throw `RangeError`: `time must be an integer greater than or equal to 0`.

`-0` is stored as `0`. `Number.MAX_SAFE_INTEGER` is accepted. The module does not know which instant is current. The caller passes it.

### `options.combatStart`

`combatStart` dates the fight. The default is no recorded start. The field may be omitted or be `undefined`. The result then stores `combatStart` as `null` and `duration` as `null`.

A present value other than `undefined` must be a safe integer greater than or equal to `0`. Otherwise `RangeError`: `combatStart must be an integer greater than or equal to 0`. `null` is rejected. `-0` is stored as `0`.

A start later than `time` throws `RangeError`: `combatStart must be less than or equal to time`. This check runs before `outsideSince` is read.

`duration` is `time - combatStart` when a start is present. A start equal to `time` stores a duration of `0`.

`combatStart` does not choose the departure time of a step-out. A long fight can still have a short excursion. A caller who wants the grace clock to begin at the pull passes `outsideSince` equal to `combatStart`.

### `options.outsideSince`

`outsideSince` is the time the current step-out was first observed. The caller stores the previous result's `outsideSince` and passes it on the next call. The module keeps nothing between calls.

The field may be omitted, be `undefined`, or be `null`. Each of those means there is no open excursion. The result of a new excursion then uses `time` as the departure.

A present value other than `undefined` or `null` must be a safe integer greater than or equal to `0`. Otherwise `RangeError`: `outsideSince must be an integer greater than or equal to 0`.

A value greater than `time` throws `RangeError`: `outsideSince must be less than or equal to time`.

When `combatStart` is present, a value below it throws `RangeError`: `outsideSince must be at least combatStart`. A value equal to `combatStart` is accepted. The order is the integer check, then the check against `time`, then the check against `combatStart`.

An `outsideSince` on an inside target is still validated. The inside result then stores `outsideSince` as `null`.

Omitting `outsideSince` on a later call starts a new excursion at that call's `time`. The previous departure is forgotten because the caller did not pass it.

### Bands

The band is geometry. It is chosen before the timer.

| Condition                                           | `band`    |
| --------------------------------------------------- | --------- |
| `distance <= leash`                                 | `inside`  |
| `graceDistance > 0` and `leash < distance <= outer` | `grace`   |
| `distance > outer`                                  | `outside` |

`outer` equals `leash` when `graceDistance` is `0`, so a zero grace distance has no `grace` row. The next distance past `leash` is `outside`.

| Band      | `graceDistance`  | `graceTime`      | Result                                                                                         |
| --------- | ---------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `inside`  | any              | any              | `reset` is `false`. `reason` is `null`. `outsideSince` is `null`.                              |
| `grace`   | greater than `0` | `0`              | `reset` is `false`. `reason` is `null`. `outsideSince` is `null`. The band is the forgiveness. |
| `grace`   | greater than `0` | greater than `0` | The timer below.                                                                               |
| `outside` | greater than `0` | any              | `reset` is `true`. `reason` is `"distance"`. The timer does not extend past `outer`.           |
| `outside` | `0`              | `0`              | `reset` is `true`. `reason` is `"distance"`.                                                   |
| `outside` | `0`              | greater than `0` | The timer below. A far target is still on that timer.                                          |

The timer runs only in the two rows above that name it.

1. `departed` is `outsideSince` when that input is a number. Otherwise `departed` is `time`.
2. `elapsed` is `time - departed`. Both inputs are safe integers, and `departed` is less than or equal to `time`, so `elapsed` is exact.
3. When `elapsed >= graceTime`, `reset` is `true`, `reason` is `"time"`, the result `outsideSince` is `null`, and `restore.outsideSince` is `departed`.
4. When `elapsed < graceTime`, `reset` is `false`, `reason` is `null`, and the result `outsideSince` is `departed`.

The call that discovers a step-out has no `outsideSince`, so `elapsed` is `0`. A `graceTime` greater than `0` does not reset on that call. The caller passes the returned `outsideSince` forward. The next call with a later `time` measures the same excursion.

A distance reset still copies a passed `outsideSince` onto `restore.outsideSince`. The result field `outsideSince` is `null` after every reset, so the closed fight does not keep a clock. `restore.outsideSince` is `null` when the caller passed no departure.

### Result

The return value is a frozen object. Every call has the same fields.

| Field           | Meaning                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| `reset`         | `true` when this call breaks the leash. `false` when combat continues.              |
| `reason`        | `"distance"`, `"time"`, or `null`. `null` when `reset` is `false`.                  |
| `band`          | `"inside"`, `"grace"`, or `"outside"`.                                              |
| `distance`      | The measured distance for this call.                                                |
| `leash`         | The leash used for this call.                                                       |
| `graceDistance` | The grace distance used for this call.                                              |
| `graceTime`     | The grace time used for this call.                                                  |
| `outer`         | `leash + graceDistance` for this call.                                              |
| `time`          | The time used for this call.                                                        |
| `combatStart`   | The combat start used for this call, or `null`.                                     |
| `duration`      | `time - combatStart`, or `null` when combat has no start.                           |
| `outsideSince`  | The departure to pass on the next call, or `null` when no clock is open.            |
| `home`          | A frozen copy of the home position used for this call.                              |
| `restore`       | A frozen restore record when `reset` is `true`, and `null` when `reset` is `false`. |

`reset` is `true` exactly when `restore` is an object, and exactly when `reason` is `"distance"` or `"time"`.

While `reset` is `false` and `outsideSince` is a number, the remaining grace is `graceTime - (time - outsideSince)`. That remainder is greater than `0`.

### `restore`

`restore` is present only when the encounter resets. Apply it then. Leave the encounter where it is when `restore` is `null`.

| Field          | Meaning                                                                             |
| -------------- | ----------------------------------------------------------------------------------- |
| `reason`       | The same `"distance"` or `"time"` as the result.                                    |
| `home`         | A frozen copy of the home position. Move the encounter here.                        |
| `distance`     | The distance that was measured on the resetting call.                               |
| `time`         | The time of the resetting call.                                                     |
| `combatStart`  | The fight to close, or `null` when the caller passed no start.                      |
| `duration`     | How long that fight had run, or `null`.                                             |
| `outsideSince` | The departure of a time reset, a passed departure cut short by distance, or `null`. |

`restore.home` matches `home` and is a different object. The record does not include the target position. Restoring the encounter returns it to `home`.

### Errors

| When the check fails                                                            | Error        | Message                                                            |
| ------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `options` is missing, an array, or not an object                                | `TypeError`  | `options must be an object`                                        |
| `home` is missing, an array, or not an object                                   | `TypeError`  | `home must be an object`                                           |
| `home.x` is missing or not a finite number                                      | `RangeError` | `home x must be a finite number`                                   |
| `home.y` is missing or not a finite number                                      | `RangeError` | `home y must be a finite number`                                   |
| `home.z` is present and not a finite number                                     | `RangeError` | `home z must be a finite number`                                   |
| `position` is missing, an array, or not an object                               | `TypeError`  | `position must be an object`                                       |
| `position.x` is missing or not a finite number                                  | `RangeError` | `position x must be a finite number`                               |
| `position.y` is missing or not a finite number                                  | `RangeError` | `position y must be a finite number`                               |
| A two-dimensional call has an own `position.z`                                  | `TypeError`  | `position must be two-dimensional`                                 |
| A three-dimensional call has no own `position.z`                                | `TypeError`  | `position must be three-dimensional`                               |
| `position.z` is present and not a finite number                                 | `RangeError` | `position z must be a finite number`                               |
| `leash` is missing or not a finite number greater than or equal to `0`          | `RangeError` | `leash must be a finite number greater than or equal to 0`         |
| `graceDistance` is present and not a finite number greater than or equal to `0` | `RangeError` | `graceDistance must be a finite number greater than or equal to 0` |
| `leash + graceDistance` is not finite                                           | `RangeError` | `leash range must be finite`                                       |
| `graceTime` is present and not an integer greater than or equal to `0`          | `RangeError` | `graceTime must be an integer greater than or equal to 0`          |
| `time` is missing or not an integer greater than or equal to `0`                | `RangeError` | `time must be an integer greater than or equal to 0`               |
| `combatStart` is present and not an integer greater than or equal to `0`        | `RangeError` | `combatStart must be an integer greater than or equal to 0`        |
| `combatStart` is greater than `time`                                            | `RangeError` | `combatStart must be less than or equal to time`                   |
| `outsideSince` is present and not an integer greater than or equal to `0`       | `RangeError` | `outsideSince must be an integer greater than or equal to 0`       |
| `outsideSince` is greater than `time`                                           | `RangeError` | `outsideSince must be less than or equal to time`                  |
| `outsideSince` is below `combatStart`                                           | `RangeError` | `outsideSince must be at least combatStart`                        |
| The measured distance is not finite                                             | `RangeError` | `distance must be finite`                                          |

## Design notes

The leash is a radius around the encounter's home. A target on that radius is still in the fight. The comparison is `distance <= leash`, with no epsilon, so the caller chooses a unit and a boundary that already mean what they should mean. A leash of `0` is a real radius. It contains the home point.

Grace distance and grace time forgive different kinds of brief step-out. The grace distance is a band past the leash, from just above `leash` through `outer`. With the timer off, that band holds. The caller asked for room, and the target is still inside that room. The grace time is a clock for a step that the spatial rule has not already rejected. The clock starts when the caller first reports the target outside the held region, at the `time` of that call, and it continues only when the caller passes `outsideSince` back. An excursion that has lasted `graceTime` is over. A shorter one continues.

A target past `outer` is past the grace distance, so the reset reason is distance on that call. The remaining grace time does not cover a step the grace distance already rejected. When `graceDistance` is `0` there is no outer band, and a grace time greater than `0` is the only forgiveness: a far target stays until the clock expires. When both are `0`, every distance greater than `leash` resets for distance.

The fight clock and the leash clock are separate. `combatStart` answers when this fight began. `outsideSince` answers when this step-out began. A fight that has already lasted a long time can still survive a short step-out, and a fight that just began can reset once the passed excursion is old enough. The duration on the result is `time - combatStart`. The restore record copies that duration, the combat start, the home position, the distance, the time, and the reason, which is the set a caller needs to end the fight and put the encounter back. `restore` is `null` while the fight continues, so a continue path has no home move to apply.

`outsideSince` lives with the caller because a pure call has nowhere to keep it. Passing `null` and omitting the field mean the same thing: this sample is the start of an excursion when the geometry says a clock should run. Losing the timestamp and omitting it on the next call starts a fresh clock at the new `time`. Passing an earlier `outsideSince` keeps the original excursion. An inside sample clears the clock after the value has been validated, so a stale departure cannot survive a return to the leash.

Two dimensions and three dimensions are separate calls. The home point's own `z` is the switch. A target position must match. An inherited `z` is ignored, because the module reads own fields only.

A non-finite distance is an error. `Number.MAX_VALUE` on two axes overflows `Math.hypot`. A huge finite distance, such as `1e200`, is still a normal comparison.

The result is a pure reduction of the positions and the times the caller already has. Inputs stay mutable for the caller. Two calls do not share result objects. A later edit to a position is visible only to a later call. The earlier frozen result keeps the decision it made.

## License

MIT. Copyright (c) 2026 Vadim Gubin.
