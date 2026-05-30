'use strict';

// Zero-dependency test harness for align-template.html.
//
// The form is shipped as a single self-contained HTML file — users download it
// and open it locally — so its logic cannot be extracted into an importable
// module without breaking that property. Instead, this harness loads the real
// shipped file, evaluates its <script> body in a scope where the browser
// globals are minimal shims, and calls exportMd()/compute() directly. No logic
// is duplicated here, and the shipped plugin stays dependency-free: the only
// thing this file needs is Node itself.
//
// The load-bearing trick: exportMd() does not return its markdown — it hands it
// to `new Blob([md])` and triggers a download. The Blob shim captures that
// markdown, which is what we assert against.

const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, '..', 'skills', 'align', 'align-template.html');

function buildModule() {
  const html = fs.readFileSync(TEMPLATE, 'utf8');

  const scriptBody = html.slice(
    html.indexOf('<script>') + '<script>'.length,
    html.indexOf('</script>')
  );

  // Keep only the definitions: drop the on-load wiring (the dl-top/dl-rail
  // click hookups and the render() call) so evaluating the body only DEFINES
  // functions and constants. We invoke exportMd/compute ourselves.
  const defsOnly = scriptBody.slice(0, scriptBody.indexOf("document.getElementById('dl-top')"));

  // Substitute the generation-time placeholders with test values. {{TIMEZONE}}
  // is left intact on purpose: exportMd treats a '{{'-prefixed timezone as
  // "none", which keeps output deterministic with no TZ dependency.
  const prepared = defsOnly
    .replace(/\{\{DATE\}\}/g, '2026-05-30')
    .replace(/\{\{CONTEXT\}\}/g, 'Test Context')
    .replace(/\{\{SOURCE\}\}/g, 'test-source');

  let capturedMarkdown = null;
  function BlobShim(parts) { capturedMarkdown = parts.join(''); }
  const URLShim = { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} };

  const stubEl = () => ({
    value: 'session',
    addEventListener() {},
    setAttribute() {},
    appendChild() {},
    removeChild() {},
    click() {},
    style: {},
    dataset: {},
    set href(_v) {},
    set download(_v) {},
  });

  const documentShim = {
    documentElement: { dataset: {}, style: { setProperty() {} } },
    body: { appendChild() {}, removeChild() {} },
    addEventListener() {},
    getElementById: () => stubEl(),
    createElement: () => stubEl(),
  };

  const localStorageShim = { getItem: () => null, setItem() {}, removeItem() {} };

  // Evaluate the form's own code with our shims in scope, and hand back live
  // references to the functions and the mutable state they close over.
  const factory = new Function(
    'document', 'window', 'Blob', 'URL', 'localStorage',
    prepared + '\n;return { exportMd: exportMd, compute: compute, claims: claims,' +
    ' setMissing: function (v) { missing = v; } };'
  );

  const mod = factory(documentShim, {}, BlobShim, URLShim, localStorageShim);

  return {
    exportMd: mod.exportMd,
    compute: mod.compute,
    setMissing: mod.setMissing,
    setClaims(arr) { mod.claims.length = 0; arr.forEach((c) => mod.claims.push(c)); },
    exportMarkdown() { capturedMarkdown = null; mod.exportMd(); return capturedMarkdown; },
  };
}

// ---- tiny test runner -------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok   ' + name);
  } catch (err) {
    failed += 1;
    console.log('  FAIL ' + name);
    console.log('       ' + err.message);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'values differ') + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function assertIncludes(haystack, needle, msg) {
  if (!haystack.includes(needle)) {
    throw new Error((msg || 'missing substring') + ' — expected output to include: ' + JSON.stringify(needle));
  }
}

function assertExcludes(haystack, needle, msg) {
  if (haystack.includes(needle)) {
    throw new Error((msg || 'unexpected substring') + ' — output should NOT include: ' + JSON.stringify(needle));
  }
}

// All six rating shapes plus one unrated claim.
const ALL_SHAPES = [
  { id: 1, text: 'Sky is blue', rating: 'correct' },
  { id: 2, text: 'Earth is flat', rating: 'wrong', notes: 'Earth is an oblate spheroid' },
  { id: 3, text: 'Meeting at 3pm', rating: 'almost', notes: 'It was 3:30pm' },
  { id: 4, text: 'Best framework is X', rating: 'nuance', notes: 'Depends on the use case' },
  { id: 5, text: 'Stock will rise', rating: 'unknown' },
  { id: 6, text: 'A tangent', rating: 'skip' },
  { id: 7, text: 'Never rated', /* unrated */ },
];

const harness = buildModule();

console.log('align-template.html — exportMd() / compute() harness\n');

test('exportMd: corrections section holds exactly the redline set (wrong/almost/nuance)', () => {
  harness.setClaims(ALL_SHAPES);
  const md = harness.exportMarkdown();
  assertIncludes(md, '## Corrections Required');

  const start = md.indexOf('## Corrections Required');
  const end = md.indexOf('## Confirmed / Other');
  assert(end > start, 'expected a Confirmed/Other section after Corrections');
  const corrections = md.slice(start, end);

  // The redline set is present...
  assertIncludes(corrections, '### Claim 2: ❌ Wrong');
  assertIncludes(corrections, '> Earth is flat');
  assertIncludes(corrections, '**Reality:** Earth is an oblate spheroid');
  assertIncludes(corrections, '### Claim 3: 🔶 Almost');
  assertIncludes(corrections, '### Claim 4: 🔷 Needs nuance');

  // ...and the non-redline ratings are NOT in corrections (guards the
  // UI-vs-export taxonomy split — tick-110 Finding A).
  assertExcludes(corrections, 'Claim 1', 'correct claim leaked into corrections');
  assertExcludes(corrections, 'Claim 5', 'can\'t-verify claim leaked into corrections');
  assertExcludes(corrections, 'Claim 6', 'skipped claim leaked into corrections');
});

test('exportMd: confirmed section holds the non-actionable ratings', () => {
  harness.setClaims(ALL_SHAPES);
  const md = harness.exportMarkdown();
  const confirmed = md.slice(md.indexOf('## Confirmed / Other'));
  assertIncludes(confirmed, '**Claim 1**');
  assertIncludes(confirmed, '**Claim 5**');
  assertIncludes(confirmed, '**Claim 6**');
  assertExcludes(confirmed, '**Claim 2**', 'wrong claim leaked into confirmed');
});

test('exportMd: summary table counts every shape and the totals are conserved', () => {
  harness.setClaims(ALL_SHAPES);
  const md = harness.exportMarkdown();

  assertIncludes(md, '| ✅ Correct | 1 |');
  assertIncludes(md, '| ❌ Wrong | 1 |');
  assertIncludes(md, '| 🔶 Almost | 1 |');
  assertIncludes(md, '| 🔷 Needs nuance | 1 |');
  assertIncludes(md, "| 🤷 Can't verify | 1 |");
  assertIncludes(md, '| ⬜ Skipped | 1 |');
  assertIncludes(md, '| ⬜ unrated | 1 |');

  // Sum invariant: the counts in the Summary table must total the claim count.
  const summary = md.slice(md.indexOf('## Summary'), md.indexOf('## Corrections Required'));
  const nums = [...summary.matchAll(/\|\s*(\d+)\s*\|/g)].map((m) => Number(m[1]));
  const total = nums.reduce((a, n) => a + n, 0);
  assertEqual(total, ALL_SHAPES.length, 'summary counts should sum to the number of claims');
});

test('compute: aggregates counts, rated total, and accuracy', () => {
  harness.setClaims(ALL_SHAPES);
  const { counts, rated, accuracy } = harness.compute();
  assertEqual(counts.correct, 1, 'correct count');
  assertEqual(counts.wrong, 1, 'wrong count');
  assertEqual(counts.skip, 1, 'skip count');
  // rated counts the six rating shapes; the unrated claim is excluded.
  assertEqual(rated, 6, 'rated total');
  // scoreable = rated - skip - unknown = 6 - 1 - 1 = 4; correct/scoreable = 1/4.
  assertEqual(accuracy, 25, 'accuracy %');
});

test('exportMd: empty claim set yields a summary but no corrections/confirmed sections', () => {
  harness.setClaims([]);
  const md = harness.exportMarkdown();
  assertIncludes(md, '## Summary');
  assertIncludes(md, 'Feedback generated via /align');
  assertExcludes(md, '## Corrections Required');
  assertExcludes(md, '## Confirmed / Other');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
