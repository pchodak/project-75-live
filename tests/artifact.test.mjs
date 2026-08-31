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
  assert.match(decoded, /polselli-vivace/i);
  assert.match(decoded, /naldoni-manitoba/i);
  assert.match(decoded, /Zalecany czas to punkt startowy/i);
  assert.match(decoded, /Zaczynam robić bigę/i);
  assert.match(decoded, /Gotowe — następny krok/i);
  assert.match(decoded, /CLEAN WARCRAFT THEME/i);
  assert.match(decoded, /FROZEN THRONE UI/i);
  assert.match(decoded, /@keyframes frozenClouds/i);
  assert.match(decoded, /@keyframes heroMist/i);
  assert.match(decoded, /class="ice-hero"/i);
  assert.match(decoded, /class="process-day-banner"/i);
  assert.match(decoded, /id="viewNav"/i);
  assert.match(decoded, /data-app-view="config"/i);
  assert.match(decoded, /data-app-view="plan"/i);
  assert.match(decoded, /Ustaw przepis/i);
  assert.match(decoded, /Mój plan/i);
  assert.match(decoded, /appView=hasProgress\?"plan"/i);
  assert.match(decoded, /body\{background-attachment:scroll!important\}/i);
  assert.match(decoded, /animation:none!important;filter:none!important/i);
  assert.match(decoded, /\.view-plan \.ice-hero\{display:none\}/i);
  assert.match(decoded, /Czytelniejsza wcześniejsza paleta/i);
  assert.match(decoded, /class="results config-only"/i);
  assert.match(decoded, /\.view-plan \.results\{display:none!important\}/i);
  assert.match(decoded, /biga-ingredient\{min-width:0;min-height:88px/i);
  assert.match(decoded, /fmtBannerTime/i);
  assert.doesNotMatch(decoded, /Lodowa krawędź/i);
  const chooseFlour = decoded.match(/function chooseFlour\([^\n]+/i)?.[0] ?? "";
  assert.doesNotMatch(chooseFlour, /markCustom/i);
  assert.match(decoded, /CIASTO PIZZA — kalkulator i przewodnik/i);
  assert.match(decoded, /Dzień 3 — domknięcie ciasta/i);
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
