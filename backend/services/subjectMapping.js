const natural = require("natural");

const TfIdf = natural.TfIdf;

// ==========================================
// CALCULATE TF-IDF COSINE SIMILARITY
// ==========================================

const calculateSimilarity = (
    previousSubject,
    currentSubject
) => {

    const tfidf = new TfIdf();

    tfidf.addDocument(
        previousSubject.toLowerCase()
    );

    tfidf.addDocument(
        currentSubject.toLowerCase()
    );

    const previousVector = {};
    const currentVector = {};

    // --------------------------------------
    // Build TF-IDF vector for previous subject
    // --------------------------------------

    tfidf.listTerms(0).forEach(item => {
        previousVector[item.term] = item.tfidf;
    });

    // --------------------------------------
    // Build TF-IDF vector for current subject
    // --------------------------------------

    tfidf.listTerms(1).forEach(item => {
        currentVector[item.term] = item.tfidf;
    });

    // --------------------------------------
    // Get all unique terms
    // --------------------------------------

    const terms = new Set([
        ...Object.keys(previousVector),
        ...Object.keys(currentVector)
    ]);

    let dotProduct = 0;
    let previousMagnitude = 0;
    let currentMagnitude = 0;

    terms.forEach(term => {

        const previousValue =
            previousVector[term] || 0;

        const currentValue =
            currentVector[term] || 0;

        dotProduct +=
            previousValue * currentValue;

        previousMagnitude +=
            previousValue * previousValue;

        currentMagnitude +=
            currentValue * currentValue;
    });

    if (
        previousMagnitude === 0 ||
        currentMagnitude === 0
    ) {
        return 0;
    }

    const similarity =
        dotProduct /
        (
            Math.sqrt(previousMagnitude) *
            Math.sqrt(currentMagnitude)
        );

    return Math.round(similarity * 100);
};


// ==========================================
// DETERMINE MAPPING STATUS
// ==========================================

const getMappingStatus = (similarity) => {

    if (similarity >= 80) {
        return {
            status: "equivalent",
            recommendation: "accepted"
        };
    }

    if (similarity >= 50) {
        return {
            status: "partial",
            recommendation: "review_required"
        };
    }

    return {
        status: "not_equivalent",
        recommendation: "repeat_subject"
    };
};


module.exports = {
    calculateSimilarity,
    getMappingStatus
};