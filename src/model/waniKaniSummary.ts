export default class WaniKaniSummary{
  data:WaniKaniSummaryData;

  constructor(data: WaniKaniSummaryData){
    this.data = data;
  }
}

class WaniKaniSummaryData{
  reviews:WaniKaniReviews[];

  constructor(reviews: WaniKaniReviews[]){
    this.reviews = reviews;
  }
}

class WaniKaniReviews{
  //This is what WaniKaniCalls there Ids
  subject_ids:number[];

  constructor(subject_ids: number[]){
    this.subject_ids = subject_ids;
  }
}