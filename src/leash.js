import { measure } from "./distance.js";
import { readOptions } from "./read.js";
import { copyPoint } from "./shape.js";

export function evaluateLeash(options) {
  const input = readOptions(options);
  const distance = measure(input.home, input.position);
  return freezeVerdict(verdict(input, distance));
}

function verdict(input, distance) {
  const band = classify(distance, input);
  const held = {
    reset: false,
    reason: null,
    band,
    distance,
    leash: input.leash,
    graceDistance: input.graceDistance,
    graceTime: input.graceTime,
    outer: input.outer,
    time: input.time,
    combatStart: input.combatStart,
    duration: input.duration,
    outsideSince: null,
    home: copyPoint(input.home),
    restore: null
  };
  if (band === "inside") {
    return held;
  }
  if (breaksOnDistance(band, input)) {
    return broken(held, input, "distance", input.outsideSince);
  }
  if (input.graceTime === 0) {
    return held;
  }
  const departed = input.outsideSince === null ? input.time : input.outsideSince;
  if (input.time - departed >= input.graceTime) {
    return broken(held, input, "time", departed);
  }
  return { ...held, outsideSince: departed };
}

function classify(distance, input) {
  if (distance <= input.leash) {
    return "inside";
  }
  if (input.graceDistance > 0 && distance <= input.outer) {
    return "grace";
  }
  return "outside";
}

function breaksOnDistance(band, input) {
  if (band !== "outside") {
    return false;
  }
  if (input.graceDistance > 0) {
    return true;
  }
  return input.graceTime === 0;
}

function broken(held, input, reason, departed) {
  return {
    reset: true,
    reason,
    band: held.band,
    distance: held.distance,
    leash: held.leash,
    graceDistance: held.graceDistance,
    graceTime: held.graceTime,
    outer: held.outer,
    time: held.time,
    combatStart: held.combatStart,
    duration: held.duration,
    outsideSince: null,
    home: copyPoint(input.home),
    restore: {
      reason,
      home: copyPoint(input.home),
      distance: held.distance,
      time: held.time,
      combatStart: held.combatStart,
      duration: held.duration,
      outsideSince: departed
    }
  };
}

function freezeVerdict(result) {
  Object.freeze(result.home);
  if (result.restore !== null) {
    Object.freeze(result.restore.home);
    Object.freeze(result.restore);
  }
  return Object.freeze(result);
}
