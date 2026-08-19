const {
    calculateSimilarity,
    getMappingStatus
} = require("./subjectMapping");

const previousSubject =
    "Data Structures and Algorithms";

const currentSubject =
    "Algorithms and Data Structures";

const similarity =
    calculateSimilarity(
        previousSubject,
        currentSubject
    );

const result =
    getMappingStatus(similarity);

console.log(
    "Previous Subject:",
    previousSubject
);

console.log(
    "Current Subject:",
    currentSubject
);

console.log(
    "Similarity:",
    similarity + "%"
);

console.log(
    "Mapping Status:",
    result.status
);

console.log(
    "Recommendation:",
    result.recommendation
);