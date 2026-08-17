const calculateSimilarity = (previousSubject, currentSubject) => {

    const previousWords = previousSubject
        .toLowerCase()
        .split(/\s+/);

    const currentWords = currentSubject
        .toLowerCase()
        .split(/\s+/);

    const commonWords = previousWords.filter(word =>
        currentWords.includes(word)
    );

    const uniqueWords = new Set([
        ...previousWords,
        ...currentWords
    ]);

    if (uniqueWords.size === 0) {
        return 0;
    }

    const similarity =
        (commonWords.length / uniqueWords.size) * 100;

    return Math.round(similarity);
};


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