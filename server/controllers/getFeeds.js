const elasticsearch = require('../models/elasticsearch');
const redis = require('../models/redis');

const HOT_DAYS_TIME = 60 * 60 * 24 * 3; // Search for 3 days

const handleFeedsReturn = (feedsReturn) => {
  const feeds = [];
  feedsReturn.forEach((feed) => {
    feeds.push(feed._source);
  });
  return feeds;
};

const fetchFromRedis = async (redisClient, key) => {
  const feeds = await redis.get(redisClient, key);
  return feeds;
};

const getByType = async (client, page, size, type, redisClient) => {
  const redisKey = `${type}-${page}-${size}`;
  const redisData = await fetchFromRedis(redisClient, redisKey);

  if (redisData) {
    return redisData;
  }

  const from = page * size;
  const returnData = {
    type,
    page: from,
    size,
    total: 0,
    feeds: [],
  };
  let searchBody = {};

  if (type === 'hot') {
    const searchTime = ((Date.now() / 1000) - HOT_DAYS_TIME);

    searchBody = {
      query: {
        range: {
          taken_at_timestamp: {
            gte: searchTime,
          },
        },
      },
      size,
      from,
      sort: [{ score: { order: 'desc' } }],
    };
  } else {
    searchBody = {
      size,
      from,
      sort: [{ taken_at_timestamp: { order: 'desc' } }],
    };
  }

  const feedsReturn = await elasticsearch.search(client, 'instagram', 'feed', searchBody);

  if (!feedsReturn) {
    return returnData;
  }

  returnData.total = feedsReturn.hits.length;
  returnData.feeds = handleFeedsReturn(feedsReturn.hits);

  await redis.set(redisClient, redisKey, JSON.stringify(returnData));

  return returnData;
};

exports.getHot = async (client, page, size, redisClient) => {
  const returnData = await getByType(client, page, size, 'hot', redisClient);
  return returnData;
};

exports.getFresh = async (client, page, size, redisClient) => {
  const returnData = await getByType(client, page, size, 'fresh', redisClient);
  return returnData;
};
