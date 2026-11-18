// Offline regression fixture. Each query sees the same five submitted courses.
const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const { compareCourses } = require("../backend/services/courseComparison");
const { buildEvaluation } = require("../backend/services/transferMapping");
const { policy, catalog, courses } = require("../backend/config/computingPilot.json");
const source = (code, name, topics, kind = "Theory") => ({ code, name, topics, credits: 4, gradePoint: 8, kind });
const pool = [
  source("A", "Algorithm Studio", "Traverse binary trees in preorder and inorder. Search binary trees."),
  source("B", "Information Storage", "Design relational tables and write SQL joins. Normalise a database."),
  source("C", "Quantitative Methods", "Solve simultaneous linear equations with matrices."),
  source("D", "Implementation Workshop", "Implement and test push and pop on a stack in a laboratory.", "Lab"),
  source("E", "Database Management Systems", "Trace rock formations and describe mineral composition."),
];
const cases = [
  ["tree paraphrase", "Hierarchical Computation", "Visit the nodes of a binary tree in traversal order.", "Theory", "A"],
  ["database paraphrase", "Structured Records", "Build relational schemas and join tables using SQL.", "Theory", "B"],
  ["matrix paraphrase", "Linear Algebra", "Use matrix algebra to solve systems of equations.", "Theory", "C"],
  ["laboratory paraphrase", "Practical Computing", "Test a stack by pushing and popping values.", "Lab", "D"],
  ["misleading identical title", "Database Management Systems", "Normalise relational tables and query records using joins.", "Theory", "B"],
  ["correct identical title", "Algorithm Studio", "Search binary trees.", "Theory", "A"],
  ["unrelated subject", "Supply Chain", "Schedule deliveries and calculate freight charges.", "Theory", null],
  ["lab versus theory", "Implementation Workshop", "Implement and test push and pop on a stack.", "Theory", null],
  ["grade below pass", "Quantitative Methods", "Solve simultaneous linear equations with matrices.", "Theory", null],
  ["insufficient credit", "Information Storage", "Normalise a database.", "Theory", null],
  ["mixed evidence", "Algorithm Studio", "Traverse binary trees. Analyse sedimentary minerals.", "Theory", null],
  ["missing outcomes", "Algorithm Studio", "", "Theory", null],
];
const elapsed = start => Math.round(performance.now() - start);
(async () => {
  const measures = { model: { hits: 0, falseSuggestions: 0 }, title: { hits: 0, falseSuggestions: 0 } };
  let improvedParaphrases = 0;
  const coldStart = performance.now();
  await compareCourses(courses, catalog, policy);
  const coldFourMs = elapsed(coldStart);
  for (const [label, name, topics, kind, gold] of cases) {
    const inputs = pool.map(course => ({ ...course }));
    if (label === "grade below pass") inputs[2].gradePoint = 3;
    if (label === "insufficient credit") inputs[1].credits = 2;
    const dest = [{ name, topics, kind, code: "REQ", credits: 4 }];
    const result = await compareCourses(inputs, dest, policy);
    if (topics) assert.equal(result.comparisonMethod, "outcome-model", "Prepare the local model before benchmarking");
    const rows = result.matches[0].candidates;
    const model = rows.filter(row => row.eligible && row.suggested).slice(0, 3).map(row => row.previousCode);
    const old = buildEvaluation(inputs, dest, null, policy).matches[0];
    const title = old.eligible ? [old.previousCode] : [];
    for (const [method, predictions] of Object.entries({ model, title })) {
      if (gold && predictions.includes(gold)) measures[method].hits++;
      measures[method].falseSuggestions += predictions.filter(code => code !== gold).length;
    }
    if (label.includes("paraphrase") && model.includes(gold) && !title.includes(gold)) improvedParaphrases++;
    assert.equal(result.matches[0].awardedCredits, 0);
    console.log(label, "expected", gold || "none", "| model", model.join(",") || "none", "| title", title.join(",") || "none");
  }
  const start = performance.now();
  const sample = await compareCourses(courses, catalog, policy);
  const warmFourMs = elapsed(start);
  assert(sample.matches.every(row => row.awardedCredits === 0));
  assert(improvedParaphrases > 0);
  assert.equal(measures.model.hits, 6);
  assert.equal(measures.model.falseSuggestions, 0);
  console.log(JSON.stringify({ cases: cases.length, positive: cases.filter(row => row[4]).length, measures, improvedParaphrases, coldFourMs, warmFourMs }));
  assert(warmFourMs <= 2000, "Warm four-course comparison exceeded 2 seconds");
})().catch(error => { console.error(error); process.exitCode = 1; });
