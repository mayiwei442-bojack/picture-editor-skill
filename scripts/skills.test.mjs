import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const cache = new Map();

// Transpile the pure server modules in memory without booting Next or an AI
// service. server-only is a Next build boundary, not a runtime dependency here.
function loadModule(relativePath) {
  const filename = path.resolve(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const moduleRecord = { exports: {} };
  cache.set(filename, moduleRecord);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const nativeRequire = createRequire(filename);
  const localRequire = (specifier) => {
    if (specifier === "server-only") return {};
    if (specifier.startsWith("@/")) return loadModule(`src/${specifier.slice(2)}.ts`);
    return nativeRequire(specifier);
  };
  new Function("require", "module", "exports", source)(localRequire, moduleRecord, moduleRecord.exports);
  return moduleRecord.exports;
}

const { skills, skillIds, skillCountLabel, isSkillId } = loadModule("src/lib/skills.ts");
const { getBlueprint, buildAnalysisPrompt, buildPanelPrompt } = loadModule("src/lib/server/skill-prompts.ts");
const { readSource, composeArtwork } = loadModule("src/lib/server/compositor.ts");
const plan = {
  summary: "A dark horizon under a narrow orange sunset.",
  anchors: ["low horizon", "orange light", "tower silhouette"],
  palette: ["#221E20", "#ED5C22", "#FFC64C"],
  light: "warm horizon light",
  emotionalTemperature: "quiet and dramatic",
  title: "EMBER LINE",
  phrase: "DISTANT LIGHT",
  episodeTitle: "The Long Return",
};

test("all seven catalog entries have a unique ID, cover and blueprint", () => {
  assert.equal(skills.length, 7);
  assert.equal(skillCountLabel, "七");
  assert.equal(new Set(skillIds).size, skills.length);
  for (const skill of skills) {
    assert.ok(isSkillId(skill.id));
    assert.ok(existsSync(path.join(root, "public", skill.cover)));
    assert.ok(getBlueprint(skill.id).panels.length > 0);
  }
  assert.equal(isSkillId("not-a-skill"), false);
});

test("scene poster preserves the output and typography contract under long input", () => {
  const prompt = buildPanelPrompt("scene-to-art", plan, "medium: expressive painting; layout: diagonal momentum. ".repeat(100));
  assert.ok(prompt.length <= 1480);
  assert.match(prompt, /Vertical 3:4 aspect ratio/);
  assert.match(prompt, /Only permitted lettering: "EMBER LINE"/);
  assert.match(prompt, /no other lettering/i);
  assert.match(prompt, /watermark/);
  assert.match(prompt, /expressive painting/);
  assert.doesNotMatch(prompt, /no readable text/);
  assert.match(buildAnalysisPrompt("scene-to-art", 2), /variation index 2/);
  assert.deepEqual(getBlueprint("scene-to-art").panels, [{ key: "poster", aspectRatio: "3:4" }]);
});

test("other skills retain their existing no-readable-text prompt behavior", () => {
  for (const id of skillIds.filter((id) => id !== "scene-to-art")) {
    assert.match(buildPanelPrompt(id, plan, "A source-derived visual composition."), /no readable text/);
  }
});

test("every Skill still composes a PNG; scene poster uses source width and 3:4", async () => {
  const input = await sharp({ create: { width: 480, height: 320, channels: 3, background: "#221E20" } }).png().toBuffer();
  const source = await readSource(input);
  const panel = await sharp({ create: { width: 300, height: 400, channels: 3, background: "#ED5C22" } }).png().toBuffer();
  for (const id of skillIds) {
    const panels = getBlueprint(id).panels.map(() => panel);
    const output = await composeArtwork(id, source, panels, plan);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, "png", id);
    if (id === "scene-to-art") {
      assert.equal(metadata.width, 480);
      assert.equal(metadata.height, 640);
      assert.equal(metadata.hasAlpha, true);
    }
  }
});
