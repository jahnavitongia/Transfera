const natural = require("natural");
const { calculateSimilarity } = require("./subjectMapping");
const legacyPolicy = require("../config/demoPolicy");
const aliases = {
  "dbms": "database management systems", "database systems": "database management systems",
  "intro to programming": "programming fundamentals", "introduction to programming": "programming fundamentals",
  "data structures and algorithms": "data structures", "discrete maths": "discrete mathematics",
};
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const canonical = (value) => aliases[normalize(value)] || normalize(value);
const titleSimilarity = (previous, current) => canonical(previous) === canonical(current) ? 100 : calculateSimilarity(canonical(previous), canonical(current));
const summarize = (evaluation) => {
  const matches = evaluation?.matches || [];
  const accepted = matches.filter(item => item.decision === "accepted");
  return {
    awardedCredits: accepted.reduce((sum, item) => sum + item.awardedCredits, 0),
    suggestedCredits: matches.filter(item => item.decision === "suggested").reduce((sum, item) => sum + item.currentCredits, 0),
    subjectsRemaining: matches.filter(item => item.decision !== "accepted").map(item => ({ code: item.currentCode, name: item.currentName, credits: item.currentCredits })),
    reviewRequired: matches.filter(item => ["suggested", "review_required"].includes(item.decision)).length,
  };
};
const buildEvaluation = (previousSubjects, currentSubjects, evaluator, policy = legacyPolicy, priorCredits = 0, comparison) => {
  const used = new Set();
  const matches = comparison?.matches ?? currentSubjects.map(current => {
    const candidates = previousSubjects.map((previous, index) => ({ previous, index,
      similarity: titleSimilarity(previous.name, current.name),
    })).filter(item => !used.has(item.index)).sort((a, b) => b.similarity - a.similarity);
    const best = candidates[0];
    const hasMatch = best && best.similarity >= policy.reviewThreshold;
    if (hasMatch) used.add(best.index);
    const previous = hasMatch ? best.previous : null;
    const formatMatches = !policy.id || (previous?.kind === current.kind && Boolean(current.kind));
    const eligible = Boolean(formatMatches && previous && previous.gradePoint >= policy.minimumGradePoint && previous.credits >= current.credits);
    const strong = eligible && best.similarity >= policy.suggestedMatchThreshold;
    const reason = !previous ? "No matching completed subject" : !formatMatches ? "Teaching format differs (theory / lab)" : previous.gradePoint < policy.minimumGradePoint ? "Grade is below the sample pass requirement" : previous.credits < current.credits ? "Completed credits are below destination credits" : strong ? "Name match; staff must verify subject content" : "Partial name match; staff must compare subject content";
    return { currentSubject: current._id, currentCode: current.code, currentName: current.name,
      currentCredits: current.credits, currentTopics: current.topics,
      previousCode: previous?.code || "", previousName: previous?.name || "",
      previousCredits: previous?.credits || 0, gradePoint: previous?.gradePoint ?? 0,
      previousTopics: previous?.topics || "", similarity: previous ? best.similarity : 0,
      eligible, reason, decision: !previous || !eligible ? "not_matched" : strong ? "suggested" : "review_required", awardedCredits: 0 };
  });
  return { comparisonMethod: comparison?.comparisonMethod, policyLabel: policy.label, maximumTransferCredits: Math.max(0, Math.floor(policy.degreeCredits * policy.maximumTransferFraction) - priorCredits),
    evaluatedAt: new Date(), evaluatedBy: evaluator, matches,
    totalDestinationCredits: currentSubjects.reduce((sum, subject) => sum + subject.credits, 0) };
};
const findDuplicateFlags = (student, others) => others.flatMap(other => {
  const similarity = Math.round(natural.JaroWinklerDistance(normalize(student.name), normalize(other.name)) * 100);
  const sameDate = student.dateOfBirth && other.dateOfBirth && new Date(student.dateOfBirth).toISOString().slice(0, 10) === new Date(other.dateOfBirth).toISOString().slice(0, 10);
  const samePhone = student.phone && student.phone === other.phone;
  const sameId = student.previousStudentId && student.previousStudentId.toLowerCase() === other.previousStudentId?.toLowerCase() && normalize(student.previousInstitution) === normalize(other.previousInstitution || "");
  if (!sameId && !(similarity >= 90 && (sameDate || samePhone))) return [];
  return [{ student: other._id, name: other.name, similarity,
    reason: sameId ? "Same previous institution and student ID" : `Similar name (${similarity}%) and matching ${sameDate ? "date of birth" : "phone"}` }];
});
module.exports = { buildEvaluation, summarize, findDuplicateFlags, titleSimilarity };
