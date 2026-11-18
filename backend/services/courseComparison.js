const { localScores } = require("./localCourseModel");
const { titleSimilarity } = require("./transferMapping");

// A retrieval cutoff for this English-language pilot. Faculty decide academic coverage.
const outcomeThreshold = 0.42;
const outcomes = text => (text || "").match(/[^.!?;\n]+[.!?;]?/g)?.map(s => s.trim()).filter(Boolean) || [];
const unique = texts => [...new Set(texts)];

function eligibility(previous, current, policy) {
  if (!outcomes(previous.topics).length || !outcomes(current.topics).length) return "Syllabus evidence is missing";
  if (!current.kind || previous.kind !== current.kind) return "Teaching format differs (theory / lab)";
  if (previous.gradePoint < policy.minimumGradePoint) return "Grade is below the sample pass requirement";
  if (previous.credits < current.credits) return "Completed credits are below destination credits";
  return "";
}

async function compareCourses(previousSubjects, currentSubjects, policy, scorer = localScores) {
  const sources = previousSubjects.map(course => outcomes(course.topics));
  const targets = currentSubjects.map(course => outcomes(course.topics));
  const sourceText = unique(sources.flat());
  const targetText = unique(targets.flat());
  const scores = sourceText.length && targetText.length ? await scorer(sourceText, targetText) : null;
  const sourceIndex = new Map(sourceText.map((text, i) => [text, i]));
  const targetIndex = new Map(targetText.map((text, i) => [text, i]));
  const matches = currentSubjects.map((current, i) => {
    const candidates = previousSubjects.map((previous, j) => {
      const titleScore = titleSimilarity(previous.name, current.name);
      const evidence = targets[i].map(destination => {
        let bestScore = -1, excerpt = "";
        if (scores) for (const source of sources[j]) {
          const value = scores[targetIndex.get(destination)][sourceIndex.get(source)];
          if (value > bestScore) { bestScore = value; excerpt = source; }
        }
        return { destination, source: excerpt, supported: Boolean(scores && bestScore >= outcomeThreshold), score: Math.round(100 * Math.max(0, bestScore)) };
      });
      const similarity = scores ? Math.round(evidence.reduce((sum, row) => sum + row.score, 0) / (evidence.length || 1)) : titleScore;
      const blocked = eligibility(previous, current, policy);
      const suggested = scores ? evidence.length > 0 && evidence.every(row => row.supported) : titleScore >= policy.reviewThreshold;
      return { previousCode: previous.code, previousName: previous.name, previousCredits: previous.credits,
        previousTopics: previous.topics, gradePoint: previous.gradePoint, similarity, eligible: !blocked,
        suggested, evidence, reason: blocked || (suggested ? "Faculty must verify outcome coverage" : "Manual syllabus comparison required") };
    }).sort((a, b) => b.similarity - a.similarity || a.previousCode.localeCompare(b.previousCode));
    const first = candidates[0];
    return { currentSubject: current._id, currentCode: current.code, currentName: current.name,
      currentCredits: current.credits, currentTopics: current.topics,
      ...(first || { eligible: false, reason: "No completed course available" }), candidates,
      decision: first?.eligible ? "review_required" : "not_matched", awardedCredits: 0 };
  });
  return { comparisonMethod: scores ? "outcome-model" : "title-alias", matches };
}

function applySelections(matches, selections = {}) {
  if (!selections || Array.isArray(selections) || typeof selections !== "object") return "Invalid course selection";
  for (const [code, previousCode] of Object.entries(selections)) {
    const match = matches.find(row => row.currentCode === code);
    const candidate = match?.candidates?.find(row => row.previousCode === previousCode);
    if (!candidate) return "Choose a submitted course from the comparison";
    Object.assign(match, candidate);
  }
  return "";
}
module.exports = { compareCourses, applySelections, outcomes };
