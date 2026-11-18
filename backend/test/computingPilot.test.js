const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildEvaluation } = require("../services/transferMapping");
const { policy, courses, catalog } = require("../config/computingPilot.json");
const { forStudent } = require("../config/policies");

test("semester 3 pilot recognises programming and lab credit within the remaining allowance", () => {
  const evaluate = prior => buildEvaluation(courses, catalog, null, policy, prior);
  const evaluation = evaluate(74);
  const eligible = evaluation.matches.filter(row => row.eligible);
  assert.deepEqual(eligible.map(row => row.currentCode), ["SOC-101", "SOC-201"]);
  assert.equal(eligible.reduce((sum, row) => sum + row.currentCredits, 0), 6);
  assert.equal(evaluation.maximumTransferCredits, 6);
  assert.equal(evaluate(75).maximumTransferCredits, 5);
  assert.equal(forStudent({ previousProgram: "BCA" }).curriculumVersion, "2026-demo");
});

test("a theory title match cannot satisfy a laboratory requirement", () => {
  const wrong = { ...courses[2], kind: "Theory" };
  const row = buildEvaluation([wrong], [catalog[2]], null, policy).matches[0];
  assert.equal(row.similarity, 100);
  assert.equal(row.eligible, false);
  assert.match(row.reason, /format/);
});
