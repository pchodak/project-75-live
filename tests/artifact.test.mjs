import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const artifact = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");

function decodeArtifact(html) {
  const seedMatch = html.match(/let _=0x([0-9a-f]+)/i);
  const payloadMatch = html.match(/atob\(\[([^\]]+)]\.join\(""\)\)/);
  assert.ok(seedMatch && payloadMatch, "Nie znaleziono zakodowanego ładunku");
  const chunks = [...payloadMatch[1].matchAll(/"([A-Za-z0-9+/=]+)"/g)].map((match) => match[1]);
  const encrypted = Buffer.from(chunks.join(""), "base64");
  const decoded = Buffer.allocUnsafe(encrypted.length);
  let state = Number.parseInt(seedMatch[1], 16) >>> 0;
  for (let index = 0; index < encrypted.length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    decoded[index] = encrypted[index] ^ (state & 255);
  }
  return decoded.toString("utf8");
}

test("publiczny plik zawiera wyłącznie samodzielny zakodowany artefakt", () => {
  assert.match(artifact, /^<!doctype html>/i);
  assert.match(artifact, /TextDecoder/);
  assert.match(artifact, /<title>CIASTO PIZZA<\/title>/i);
  assert.ok(artifact.length > 50_000);
  assert.doesNotMatch(artifact, /<link[^>]+stylesheet|<script[^>]+src=|fetch\(/i);
});

test("ładunek odtwarza kompletny statyczny frontend", () => {
  const decoded = decodeArtifact(artifact);
  assert.match(decoded, /^<!DOCTYPE html>/i);
  assert.match(decoded, /<style>/i);
  assert.match(decoded, /<select/i);
  assert.match(decoded, /<script>/i);
  assert.match(decoded, /data-out="activeBigaProcess"/i);
  assert.match(decoded, /id="trackerCurrent"/i);
  assert.match(decoded, /id="flourDialog"/i);
  assert.match(decoded, /id="flourSearch"/i);
  assert.match(decoded, /data-open-flour="all"/i);
  assert.match(decoded, /Mąka do całego ciasta/i);
  assert.doesNotMatch(decoded, /id="finalFlourSelect"|data-field="hydration"/i);
  assert.match(decoded, /polselli-vivace/i);
  assert.match(decoded, /naldoni-manitoba/i);
  assert.match(decoded, /roboczy punkt startowy aplikacji/i);
  assert.match(decoded, /Zaczynam robić bigę/i);
  assert.match(decoded, /Zrobione — pokaż następny krok/i);
  assert.match(decoded, /PROFESSIONAL WORKFLOW UI/i);
  assert.match(decoded, /class="master-timeline process-preview"/i);
  assert.match(decoded, /id="processTimeline"/i);
  assert.match(decoded, /id="recipeBrief"/i);
  assert.match(decoded, /data-out="briefHydration"/i);
  assert.match(decoded, /data-out="briefFlours"/i);
  assert.match(decoded, /data-out="briefYeast"/i);
  assert.match(decoded, /class="task-facts"/i);
  assert.match(decoded, /class="task-instruction"/i);
  assert.match(decoded, /scroll-snap-type:x mandatory/i);
  assert.match(decoded, /aria-current="step"/i);
  assert.match(decoded, /data-field="mixTime"/i);
  assert.match(decoded, /id="viewNav"/i);
  assert.match(decoded, /data-app-view="config"/i);
  assert.match(decoded, /data-app-view="plan"/i);
  assert.match(decoded, /Ustaw przepis/i);
  assert.match(decoded, /Mój plan/i);
  assert.match(decoded, /id="startBigaNow"/i);
  assert.match(decoded, /data-out="nowBakePreview"/i);
  assert.match(decoded, /function startBigaNow\(\)/i);
  assert.match(decoded, /activeStarted:"make-biga"/i);
  assert.doesNotMatch(decoded, /BLACK ORANGE STREAMING UI|Samotne Włoszki|baitAdCity|navigator\.geolocation|getCurrentPosition|brokenUtf8/i);
  assert.match(decoded, /id="quickCalendar"/i);
  assert.match(decoded, /data-out="todayLabel"/i);
  assert.match(decoded, /id="bakeTime"/i);
  assert.match(decoded, /class="active-context"/i);
  assert.match(decoded, /data-out="contextRecipe"/i);
  assert.match(decoded, /id="helpDialog"/i);
  assert.match(decoded, /function openHelp\(button\)/i);
  assert.match(decoded, /\+ Google Calendar/i);
  assert.match(decoded, /id="downloadCalendar"/i);
  assert.match(decoded, /text\/calendar;charset=utf-8/i);
  assert.match(decoded, /id="recipeConfig"/i);
  assert.match(decoded, /data-out="recipeSummary"/i);
  assert.match(decoded, /id="wizardProgress"/i);
  assert.match(decoded, /data-wizard-indicator="4"/i);
  assert.match(decoded, /data-config-step="1"/i);
  assert.match(decoded, /data-config-step="4"/i);
  assert.match(decoded, /data-wizard-next="2"/i);
  assert.match(decoded, /data-wizard-back="3"/i);
  assert.match(decoded, /data-wizard-jump="1"/i);
  assert.match(decoded, /function applyWizardStep\(/i);
  assert.match(decoded, /function wizardValidation\(/i);
  assert.match(decoded, /data-out="doughSummary"/i);
  assert.match(decoded, /function initCompactConfig\(\)/i);
  assert.doesNotMatch(decoded, /id="toggleFlour"|setFlourExpanded\(/i);
  assert.match(decoded, /schedule-agenda\.expanded/i);
  assert.match(decoded, /function setPresetFlours\(/i);
  assert.match(decoded, /version:9/i);
  assert.match(decoded, /function processTimeline\(/i);
  assert.match(decoded, /Pokaż 7 kroków/i);
  assert.match(decoded, /PRESET_RECIPES\[activePreset\]/i);
  assert.match(decoded, /appView=hasProgress\?"plan"/i);
  assert.match(decoded, /body\{background-attachment:scroll!important\}/i);
  assert.match(decoded, /animation:none!important;filter:none!important/i);
  assert.match(decoded, /\.view-plan \.ice-hero\{display:none\}/i);
  assert.match(decoded, /class="results config-only"/i);
  assert.match(decoded, /\.view-plan \.results\{display:none!important\}/i);
  assert.doesNotMatch(decoded, /id="mainSteps"|id="dayOneCard"|id="dayThreeAt"/i);
  const chooseFlour = decoded.match(/function chooseFlour\([^\n]+/i)?.[0] ?? "";
  assert.doesNotMatch(chooseFlour, /markCustom/i);
  assert.match(decoded, /CIASTO PIZZA — kalkulator i przewodnik/i);
  assert.match(decoded, /Wszystkie ilości i instrukcje są w aktywnym zadaniu/i);
  assert.match(decoded, /Bardzo zimna woda \(2–5°C\)/i);
  assert.match(decoded, /function enhanceTooltips\(\)/i);
  assert.match(decoded, /body:before,body:after\{display:none\}/i);
  assert.match(decoded, /prefers-reduced-motion:reduce/i);
  assert.doesNotMatch(decoded, /id="applyFlourAdvice"|id="applyReferenceProcess"|CaliwMace/i);
  assert.doesNotMatch(decoded, /<script[^>]+src=|<link[^>]+stylesheet|XMLHttpRequest|WebSocket/i);
});

test("publiczna strona zawiera 32 lokalne zdjęcia opakowań", async () => {
  const files = await readdir(new URL("../docs/assets/flours/", import.meta.url));
  assert.equal(files.length, 32);
  assert.ok(files.every((file) => /^f\d{2}\.(avif|webp)$/.test(file)));
  for (const file of files) {
    const info = await stat(new URL(`../docs/assets/flours/${file}`, import.meta.url));
    assert.ok(info.size > 2_000);
  }
  const decoded = decodeArtifact(artifact);
  assert.match(decoded, /<img src="\$\{f\.image\}" alt="Opakowanie/i);
});

test("publiczna strona zawiera lokalny lodowy baner", async () => {
  const hero = await stat(new URL("../docs/assets/ui/u01.webp", import.meta.url));
  assert.ok(hero.size > 60_000);
  assert.ok(hero.size < 150_000);
  assert.match(decodeArtifact(artifact), /assets\/ui\/u01\.webp/i);
});
