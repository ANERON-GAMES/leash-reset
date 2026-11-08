import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { evaluateLeash } from "../src/index.js";
import * as api from "../src/index.js";

const root = new URL("..", import.meta.url);

test("public exports stay limited to the documented surface", () => {
  assert.deepEqual(Object.keys(api).sort(), ["evaluateLeash"]);
  assert.equal(typeof api.evaluateLeash, "function");
  assert.equal(evaluateLeash, api.evaluateLeash);
  assert.equal(evaluateLeash.name, "evaluateLeash");
});

test("package metadata names the module and the author", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.equal(pkg.name, "@aneron/leash-reset");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.author, "Vadim Gubin");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.sideEffects, false);
  assert.equal(pkg.engines.node, ">=20");
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.main, "./src/index.js");
  assert.equal(pkg.exports, "./src/index.js");
  assert.equal(pkg.repository.type, "git");
  assert.equal(pkg.repository.url, "git+https://github.com/ANERON-GAMES/leash-reset.git");
  assert.deepEqual(pkg.files, ["src", "LICENSE", "README.md"]);
  assert.equal(pkg.scripts.test, "node --test test/*.test.js");
  assert.equal(pkg.scripts.lint, "eslint .");
  assert.equal(pkg.scripts.format, "prettier --write .");
  assert.equal(pkg.scripts["format:check"], "prettier --check .");
  assert.equal(
    pkg.description,
    "Encounter leash rules that reset combat when a target exceeds the leash range."
  );
  const license = readFileSync(new URL("LICENSE", root), "utf8");
  assert.equal(license.includes("Copyright (c) 2026 Vadim Gubin"), true);
  assert.equal(license.includes("anerongames"), false);
  const readme = readFileSync(new URL("README.md", root), "utf8");
  for (const heading of [
    "## Purpose",
    "## Install",
    "## Usage",
    "## API",
    "## Design notes",
    "## License"
  ]) {
    assert.equal(readme.includes(heading), true, heading);
  }
  assert.equal(readme.includes("`inside.reset` is `false`"), true);
  assert.equal(readme.includes('`inside.band` is `"inside"`'), true);
  assert.equal(readme.includes("`inside.distance` is `10`"), true);
  assert.equal(readme.includes("`inside.outsideSince` is `null`"), true);
  assert.equal(readme.includes("`inside.restore` is `null`"), true);
  assert.equal(readme.includes("`reset.reset` is `true`"), true);
  assert.equal(readme.includes('`reset.reason` is `"distance"`'), true);
  assert.equal(readme.includes('`reset.band` is `"outside"`'), true);
  assert.equal(readme.includes("`reset.distance` is `11`"), true);
  assert.equal(readme.includes("`reset.restore.home.x` is `0`"), true);
  assert.equal(readme.includes('`reset.restore.reason` is `"distance"`'), true);
  assert.equal(readme.includes("`rim.reset` is `false`"), true);
  assert.equal(readme.includes('`rim.band` is `"grace"`'), true);
  assert.equal(readme.includes("`rim.distance` is `15`"), true);
  assert.equal(readme.includes("`rim.outer` is `15`"), true);
  assert.equal(readme.includes("`past.reset` is `true`"), true);
  assert.equal(readme.includes('`past.reason` is `"distance"`'), true);
  assert.equal(readme.includes("`past.distance` is `16`"), true);
  assert.equal(readme.includes("`discovered.reset` is `false`"), true);
  assert.equal(readme.includes("`discovered.outsideSince` is `100`"), true);
  assert.equal(readme.includes("`still.reset` is `false`"), true);
  assert.equal(readme.includes("`still.outsideSince` is `100`"), true);
  assert.equal(readme.includes("`expired.reset` is `true`"), true);
  assert.equal(readme.includes('`expired.reason` is `"time"`'), true);
  assert.equal(readme.includes("`expired.restore.outsideSince` is `100`"), true);
  assert.equal(readme.includes("`back.outsideSince` is `null`"), true);
  assert.equal(readme.includes('`back.band` is `"inside"`'), true);
  assert.equal(readme.includes("`opened.outsideSince` is `50`"), true);
  assert.equal(readme.includes('`opened.band` is `"grace"`'), true);
  assert.equal(readme.includes("`timed.reset` is `true`"), true);
  assert.equal(readme.includes('`timed.reason` is `"time"`'), true);
  assert.equal(readme.includes('`timed.band` is `"grace"`'), true);
  assert.equal(readme.includes("`deep.reset` is `true`"), true);
  assert.equal(readme.includes('`deep.reason` is `"distance"`'), true);
  assert.equal(readme.includes("`deep.restore.outsideSince` is `49`"), true);
  assert.equal(readme.includes("`quiet.duration` is `10`"), true);
  assert.equal(readme.includes("`quiet.combatStart` is `90`"), true);
  assert.equal(readme.includes("`anchored.restore.combatStart` is `90`"), true);
  assert.equal(readme.includes("`anchored.restore.duration` is `10`"), true);
  assert.equal(readme.includes("`solid.distance` is `7`"), true);
  assert.equal(readme.includes('`solid.band` is `"inside"`'), true);
  assert.equal(readme.includes("`broken.distance` is `7`"), true);
  assert.equal(readme.includes("`broken.reset` is `true`"), true);
  assert.equal(readme.includes("`list.home.x` is still `0`"), true);
  assert.equal(readme.includes("`list.position.y` is still `11`"), true);
});

test("source files do not contain comments, clocks, timers, or network calls", () => {
  const files = readdirSync(new URL("src/", root)).sort();
  assert.deepEqual(files, ["distance.js", "index.js", "leash.js", "read.js", "shape.js"]);
  for (const name of files) {
    const source = readFileSync(new URL("src/" + name, root), "utf8");
    const specifiers = source.match(/from "[^"]+"/g) ?? [];
    assert.equal(specifiers.length > 0 || !source.includes("import "), true, name);
    for (const specifier of specifiers) {
      assert.match(specifier, /^from "\.\/[a-z]+\.js"$/);
    }
    assert.equal(source.includes("node:"), false, name);
    assert.equal(source.includes("require("), false, name);
    assert.equal(source.includes("/*"), false, name);
    assert.equal(source.includes("//"), false, name);
    for (const token of [
      "Date",
      "setTimeout",
      "setInterval",
      "Math.random",
      "process",
      "fetch(",
      "globalThis",
      "queueMicrotask",
      "setImmediate",
      "performance"
    ]) {
      assert.equal(source.includes(token), false, name + " " + token);
    }
  }
});

test("the tree does not name private systems or carry addresses", () => {
  const files = ["README.md", "LICENSE", "package.json", "eslint.config.js"];
  const directories = ["src", "test", ".github"];
  const chunks = [];
  for (const name of files) {
    chunks.push(readFileSync(new URL(name, root), "utf8"));
  }
  for (const directory of directories) {
    const entries = readdirSync(new URL(directory + "/", root), { recursive: true });
    for (const entry of entries) {
      if (typeof entry !== "string" || (!entry.endsWith(".js") && !entry.endsWith(".yml"))) {
        continue;
      }
      chunks.push(readFileSync(new URL(directory + "/" + entry, root), "utf8"));
    }
  }
  const text = chunks.join("\n").toLowerCase();
  const banned = [
    "pocket" + "base",
    "blood" + "rain",
    "pc-" + "server",
    "messen" + "ger",
    "bot" + "s"
  ];
  for (const token of banned) {
    assert.equal(text.includes(token), false, token);
  }
});

test("the lockfile resolves only from the npm registry", () => {
  const lockPath = new URL("package-lock.json", root);
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  assert.equal(lock.lockfileVersion >= 2, true);
  const text = readFileSync(lockPath, "utf8");
  assert.equal(text.includes("git+"), false);
  assert.equal(text.includes("github:"), false);
  assert.equal(text.includes("registry.yarnpkg.com"), false);
  let resolved = 0;
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }
    if (value !== null && typeof value === "object") {
      if (typeof value.resolved === "string") {
        resolved += 1;
        assert.equal(
          value.resolved.startsWith("https://registry.npmjs.org/"),
          true,
          value.resolved
        );
      }
      for (const key of Object.keys(value)) {
        walk(value[key]);
      }
    }
  };
  walk(lock);
  assert.equal(resolved > 0, true);
});
