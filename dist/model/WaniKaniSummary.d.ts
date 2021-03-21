export default class WaniKaniSummary {
    data: WaniKaniSummaryData;
}
declare class WaniKaniSummaryData {
    reviews: WaniKaniReviews[];
}
declare class WaniKaniReviews {
    subject_ids: number[];
}
export {};
