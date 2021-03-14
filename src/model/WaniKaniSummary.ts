export default class WaniKaniSummary{
  data:WaniKaniSummaryData;
}

class WaniKaniSummaryData{
  reviews:WaniKaniReviews[];
}

class WaniKaniReviews{
  subject_ids:number[];
}