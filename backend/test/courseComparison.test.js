const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { compareCourses } = require("../services/courseComparison");
const { catalog, policy, courses } = require("../config/computingPilot.json");

test("missing local model keeps ranked title and manual alternatives without awarding credit", async () => {
  const previous = process.env.TRANSFERA_MODEL_DIR;
  process.env.TRANSFERA_MODEL_DIR = path.join(__dirname, "nonexistent-model");
  try {
    const result = await compareCourses(courses, catalog, policy);
    assert.equal(result.comparisonMethod, "title-alias");
    for (const row of result.matches) {
      assert.equal(row.candidates.length, courses.length);
      assert.equal(row.awardedCredits, 0);
      assert(row.candidates[0].evidence.every(item => item.source === "" && !item.supported));
    }
    assert.deepEqual(result.matches.filter(row => row.eligible).map(row => row.currentCode), ["SOC-101", "SOC-201"]);
  } finally {
    if (previous === undefined) delete process.env.TRANSFERA_MODEL_DIR;
    else process.env.TRANSFERA_MODEL_DIR = previous;
  }
});
