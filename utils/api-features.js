class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  /**@pagination */
  paginate(countDocument) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;
    const pagination = {};

    pagination.currentIndex = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocument / limit);

    if (endIndex < countDocument) {
      pagination.next = page + 1;
    }
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery.skip(skip).limit(limit);
    this.paginationResults = pagination;
    return this;
  }

  /** @sorting */
  sort() {
    if (this.queryString.sort) {
      const sortQuery = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortQuery);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }

  /** @selecting */
  customSelect() {
    if (this.queryString.fields) {
      const fieldsQuery = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fieldsQuery);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  /**@filtration */
  filter() {
    const queryString = { ...this.queryString };
    const excludedParams = ["page", "sort", "limit", "fields"];
    excludedParams.forEach((field) => delete queryString[field]);

    let filterString = JSON.stringify(queryString);
    filterString = filterString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.mongooseQuery.find(JSON.parse(filterString));
    return this;
  }

  /** @searching */
  search() {
    if (this.queryString.keyword) {
      let searchQuery = {};
      console.log(this.queryString.keyword);
      searchQuery.$or = [
        { title: { $regex: `${this.queryString.keyword}`, $options: "i" } },
        { description: { $regex: this.queryString.keyword, $options: "i" } },
      ];

      this.mongooseQuery = this.mongooseQuery.find(searchQuery);
    }
    return this;
  }
}

module.exports = ApiFeatures;
