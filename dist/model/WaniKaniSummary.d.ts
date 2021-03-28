export default class WaniKaniSummary {
    data: WaniKaniSummaryData;
    constructor(data: WaniKaniSummaryData);
}
declare class WaniKaniSummaryData {
    reviews: WaniKaniReviews[];
    constructor(reviews: WaniKaniReviews[]);
}
declare class WaniKaniReviews {
    subject_ids: number[];
    constructor(subject_ids: number[]);
}
export {};
