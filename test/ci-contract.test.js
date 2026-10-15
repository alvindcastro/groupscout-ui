import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";

// These tests guard CI and image publishing from IaC Phase 4
// (groupscout-site-6ah.5) without needing GitHub Actions.

const WORKFLOWS = new URL("../.github/workflows/", import.meta.url);
const CI = new URL("ci.yml", WORKFLOWS);
const SECRET_SCAN = new URL("secret-scan.yml", WORKFLOWS);
const DOCKERFILE = new URL("../Dockerfile", import.meta.url);
const RENOVATE = new URL("../renovate.json", import.meta.url);

// jobBlock returns the text of one top-level job in a workflow.
function jobBlock(workflow, name) {
  const match = workflow.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z-]+:\\n|(?![\\s\\S]))`, "m"));
  assert.ok(match, `workflow has no ${name} job`);
  return match[1];
}

test("every workflow pins third-party actions to commit SHAs", async () => {
  const files = (await readdir(WORKFLOWS)).filter((f) => f.endsWith(".yml"));
  assert.ok(files.length >= 2, "expected ci.yml and secret-scan.yml");
  for (const file of files) {
    const workflow = await readFile(new URL(file, WORKFLOWS), "utf8");
    for (const [, action] of workflow.matchAll(/uses:\s*(\S+)/g)) {
      assert.match(action, /@[0-9a-f]{40}$/, `${file}: ${action} must be pinned to a commit SHA`);
    }
  }
});

test("CI runs on pull requests and main", async () => {
  const ci = await readFile(CI, "utf8");
  assert.match(ci, /^  pull_request:/m);
  assert.match(ci, /^  push:\n    branches: \[main\]/m);
});

test("CI tests in the same Node image the Dockerfile uses", async () => {
  const ci = await readFile(CI, "utf8");
  const dockerfile = await readFile(DOCKERFILE, "utf8");
  const testJob = jobBlock(ci, "test");
  const container = testJob.match(/^    container: (\S+)$/m);
  assert.ok(container, "test job must run in a container");
  assert.match(testJob, /run: npm test/);

  const bases = [...dockerfile.matchAll(/^FROM (\S+) AS \S+$/gm)].map((m) => m[1]);
  assert.ok(bases.length >= 2, "Dockerfile must have test and production stages");
  for (const base of bases) {
    assert.equal(base, container[1], "CI test container and Dockerfile stages must use one image");
  }
});

test("image job builds, smoke-tests and scans before publishing main commits", async () => {
  const image = jobBlock(await readFile(CI, "utf8"), "image");
  assert.match(image, /needs: \[test\]/);
  assert.match(image, /packages: write/);
  assert.match(image, /UI_IMAGE: ghcr\.io\/alvindcastro\/groupscout-ui/);
  assert.match(image, /UI_IMAGE_TAG: \$\{\{ github\.sha \}\}/);
  assert.match(image, /--target production/);
  assert.match(image, /\/healthz/);
  assert.match(image, /sha256sum -c/);

  const scan = image.indexOf("--only-fixed --fail-on critical");
  const push = image.indexOf("docker push");
  assert.ok(scan > 0, "image job must fail on fixable critical vulnerabilities");
  assert.ok(push > scan, "the vulnerability scan must run before the push");

  const pushStep = image.slice(image.lastIndexOf("- name:", push));
  assert.match(pushStep, /if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'/);
  assert.match(pushStep, /--password-stdin/);
});

test("secret scan covers the full history with redacted output", async () => {
  const scan = await readFile(SECRET_SCAN, "utf8");
  assert.match(scan, /fetch-depth: 0/);
  assert.match(scan, /sha256sum -c/);
  assert.match(scan, /gitleaks git --redact/);
});

test("Renovate proposes pinned, scheduled updates and never automerges", async () => {
  const raw = await readFile(RENOVATE, "utf8");
  const config = JSON.parse(raw);
  for (const preset of ["config:recommended", "docker:pinDigests", "helpers:pinGitHubActionDigests"]) {
    assert.ok(config.extends.includes(preset), `renovate.json must extend ${preset}`);
  }
  assert.ok(config.schedule?.length > 0, "renovate.json must set a schedule");
  assert.doesNotMatch(raw, /"automerge":\s*true/);
});
