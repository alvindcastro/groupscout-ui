import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const CONTRACT_DOC = new URL("../docs/ui-dockerization-contract.md", import.meta.url);
const PHASE_DOC = new URL("../docs/phase-12-ui-dockerization.md", import.meta.url);
const DEVELOPER_GUIDE = new URL("../docs/developer-guide.md", import.meta.url);
const TESTING_DOC = new URL("../docs/testing.md", import.meta.url);

test("D0 dockerization contract documents the chosen path before Docker files exist", async () => {
  const contract = await readFile(CONTRACT_DOC, "utf8");

  assert.match(contract, /^# UI Dockerization Contract/m);
  assert.match(contract, /D0 status: documentation-only/i);
  assert.match(contract, /test image first, browser runtime later/i);
  assert.match(contract, /No Dockerfile, Compose file, reverse proxy, dev server, renderer, or application runtime is added in D0\./);
});

test("D0 dockerization contract records backend service names and internal URLs", async () => {
  const contract = await readFile(CONTRACT_DOC, "utf8");

  assert.match(contract, /Backend service: `groupscout`/);
  assert.match(contract, /Backend internal URL: `http:\/\/groupscout:8080`/);
  assert.match(contract, /Alert service: `alertd`/);
  assert.match(contract, /Alert internal URL: `http:\/\/alertd:8081`/);
  assert.match(contract, /Shared backend network: `groupscout_net`/);
});

test("D0 dockerization contract preserves same-origin and browser credential boundaries", async () => {
  const contract = await readFile(CONTRACT_DOC, "utf8");

  assert.match(contract, /Browser API calls stay same-origin through `\/api\/\*`/);
  assert.match(contract, /`API_TOKEN` remains reserved for automation clients/);
  assert.match(contract, /must not enter browser JavaScript, static assets, generated public config, or image-baked browser environment/);
  assert.match(contract, /session-cookie/i);
});

test("D0 dockerization docs expose the contract and red-green evidence", async () => {
  const [phaseDoc, developerGuide, testingDoc] = await Promise.all([
    readFile(PHASE_DOC, "utf8"),
    readFile(DEVELOPER_GUIDE, "utf8"),
    readFile(TESTING_DOC, "utf8")
  ]);

  assert.match(phaseDoc, /\[UI Dockerization Contract\]\(\.\/ui-dockerization-contract\.md\)/);
  assert.match(phaseDoc, /Red run: `node --test test\/dockerization-contract\.test\.js`/);
  assert.match(phaseDoc, /Green run: `node --test test\/dockerization-contract\.test\.js`/);
  assert.match(developerGuide, /\[UI Dockerization Contract\]\(\.\/ui-dockerization-contract\.md\)/);
  assert.match(testingDoc, /node --test test\/dockerization-contract\.test\.js/);
});
