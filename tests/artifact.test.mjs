import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.doesNotMatch(decoded, /id="applyFlourAdvice"|id="applyReferenceProcess"|CaliwMace/i);
  assert.doesNotMatch(decoded, /<script[^>]+src=|<link[^>]+stylesheet|XMLHttpRequest|WebSocket/i);
});
