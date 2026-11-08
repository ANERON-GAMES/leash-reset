import { isObject, normalizeZero } from "./shape.js";

const OPTIONS_MESSAGE = "options must be an object";
const HOME_MESSAGE = "home must be an object";
const HOME_X_MESSAGE = "home x must be a finite number";
const HOME_Y_MESSAGE = "home y must be a finite number";
const HOME_Z_MESSAGE = "home z must be a finite number";
const POSITION_MESSAGE = "position must be an object";
const POSITION_X_MESSAGE = "position x must be a finite number";
const POSITION_Y_MESSAGE = "position y must be a finite number";
const POSITION_Z_MESSAGE = "position z must be a finite number";
const POSITION_TWO_MESSAGE = "position must be two-dimensional";
const POSITION_THREE_MESSAGE = "position must be three-dimensional";
const LEASH_MESSAGE = "leash must be a finite number greater than or equal to 0";
const GRACE_MESSAGE = "graceDistance must be a finite number greater than or equal to 0";
const RANGE_MESSAGE = "leash range must be finite";
const GRACE_TIME_MESSAGE = "graceTime must be an integer greater than or equal to 0";
const TIME_MESSAGE = "time must be an integer greater than or equal to 0";
const COMBAT_START_MESSAGE = "combatStart must be an integer greater than or equal to 0";
const COMBAT_ORDER_MESSAGE = "combatStart must be less than or equal to time";
const OUTSIDE_MESSAGE = "outsideSince must be an integer greater than or equal to 0";
const OUTSIDE_TIME_MESSAGE = "outsideSince must be less than or equal to time";
const OUTSIDE_COMBAT_MESSAGE = "outsideSince must be at least combatStart";

export function readOptions(options) {
  if (!isObject(options)) {
    throw new TypeError(OPTIONS_MESSAGE);
  }
  const home = readHome(options);
  const position = readPosition(options, Object.hasOwn(home, "z"));
  const leash = readLeash(options);
  const grace = readGrace(options, leash);
  const graceTime = readGraceTime(options);
  const time = readTime(options);
  const combatStart = readCombatStart(options, time);
  const outsideSince = readOutsideSince(options, time, combatStart);
  const duration = combatStart === null ? null : time - combatStart;
  return {
    home,
    position,
    leash,
    graceDistance: grace.graceDistance,
    graceTime,
    outer: grace.outer,
    time,
    combatStart,
    duration,
    outsideSince
  };
}

function readHome(options) {
  if (!Object.hasOwn(options, "home") || !isObject(options.home)) {
    throw new TypeError(HOME_MESSAGE);
  }
  const source = options.home;
  const x = readAxis(source, "x", HOME_X_MESSAGE);
  const y = readAxis(source, "y", HOME_Y_MESSAGE);
  if (!Object.hasOwn(source, "z")) {
    return { x, y };
  }
  return { x, y, z: readAxis(source, "z", HOME_Z_MESSAGE) };
}

function readPosition(options, three) {
  if (!Object.hasOwn(options, "position") || !isObject(options.position)) {
    throw new TypeError(POSITION_MESSAGE);
  }
  const source = options.position;
  const x = readAxis(source, "x", POSITION_X_MESSAGE);
  const y = readAxis(source, "y", POSITION_Y_MESSAGE);
  const hasZ = Object.hasOwn(source, "z");
  if (!three) {
    if (hasZ) {
      throw new TypeError(POSITION_TWO_MESSAGE);
    }
    return { x, y };
  }
  if (!hasZ) {
    throw new TypeError(POSITION_THREE_MESSAGE);
  }
  return { x, y, z: readAxis(source, "z", POSITION_Z_MESSAGE) };
}

function readLeash(options) {
  if (!Object.hasOwn(options, "leash")) {
    throw new RangeError(LEASH_MESSAGE);
  }
  return readLength(options.leash, LEASH_MESSAGE);
}

function readGrace(options, leash) {
  let graceDistance = 0;
  if (Object.hasOwn(options, "graceDistance") && options.graceDistance !== undefined) {
    graceDistance = readLength(options.graceDistance, GRACE_MESSAGE);
  }
  const outer = leash + graceDistance;
  if (!Number.isFinite(outer)) {
    throw new RangeError(RANGE_MESSAGE);
  }
  return { graceDistance, outer: normalizeZero(outer) };
}

function readGraceTime(options) {
  if (!Object.hasOwn(options, "graceTime") || options.graceTime === undefined) {
    return 0;
  }
  return readWhole(options.graceTime, GRACE_TIME_MESSAGE);
}

function readTime(options) {
  if (!Object.hasOwn(options, "time")) {
    throw new RangeError(TIME_MESSAGE);
  }
  return readWhole(options.time, TIME_MESSAGE);
}

function readCombatStart(options, time) {
  if (!Object.hasOwn(options, "combatStart") || options.combatStart === undefined) {
    return null;
  }
  const combatStart = readWhole(options.combatStart, COMBAT_START_MESSAGE);
  if (combatStart > time) {
    throw new RangeError(COMBAT_ORDER_MESSAGE);
  }
  return combatStart;
}

function readOutsideSince(options, time, combatStart) {
  if (
    !Object.hasOwn(options, "outsideSince") ||
    options.outsideSince === undefined ||
    options.outsideSince === null
  ) {
    return null;
  }
  const outsideSince = readWhole(options.outsideSince, OUTSIDE_MESSAGE);
  if (outsideSince > time) {
    throw new RangeError(OUTSIDE_TIME_MESSAGE);
  }
  if (combatStart !== null && outsideSince < combatStart) {
    throw new RangeError(OUTSIDE_COMBAT_MESSAGE);
  }
  return outsideSince;
}

function readLength(value, message) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(message);
  }
  return normalizeZero(value);
}

function readWhole(value, message) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(message);
  }
  return normalizeZero(value);
}

function readAxis(point, key, message) {
  const missing = !Object.hasOwn(point, key);
  const value = point[key];
  if (missing || typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(message);
  }
  return normalizeZero(value);
}
