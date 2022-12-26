const mongoose = require("mongoose");
const redis = require("redis");
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.connect();

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );
  const cacheValue = await client.hGet(this.hashKey, key, console.log);
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    return doc;
    // return Array.isArray(doc)
    //   ? doc.map((d) => new this.model(d))
    //   : new this.model(doc);
  }
  const result = await exec.apply(this, arguments);

  if (result) {
    await client.hSet(this.hashKey, key, JSON.stringify(result));
  }

  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
