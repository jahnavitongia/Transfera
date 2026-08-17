const {
    calculateSimilarity,
    getMappingStatus
} = require("./subjectMapping");

const previousSubject =
    "Database Management Systems";

const currentSubject =
    "Database Management";

const similarity = calculateSimilarity(
    previousSubject,
    currentSubject
);

const result = getMappingStatus(similarity);

console.log("Previous Subject:", previousSubject);
console.log("Current Subject:", currentSubject);
console.log("Similarity:", similarity + "%");
console.log("Mapping Status:", result.status);
console.log(
    "Recommendation:",
    result.recommendation
);