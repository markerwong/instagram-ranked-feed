const express = require('express');
const path = require('path');
const config = require('config');
const bodyParser = require('body-parser');
const cors = require('cors');

const fetchFeeds = require('./controllers/fetchFeedsFromIG');
const getFeeds = require('./controllers/getFeeds');

const elasticsearch = require('./models/elasticsearch');
const redis = require('./models/redis');

const TIME_TO_FETCH_FEED = 1000 * 60 * 10;

const app = express();

const startServer = async () => {
  const client = await elasticsearch.client();
  const redisClient = await redis.connect();
  const tags = config.get('tags');

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.static(path.resolve(__dirname, '..', 'build')));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  await fetchFeeds.fetchFeedsByTags(client, tags);
  setInterval(async () => {
    await fetchFeeds.fetchFeedsByTags(client, tags);
    console.log('Fetched IG feeds');
  }, TIME_TO_FETCH_FEED);

  console.log('Ready to browse on web');

  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
  });

  app.post('/get-hot', async (req, res) => {
    const { page, size } = req.body;
    const feeds = await getFeeds.getHot(client, page, size, redisClient);
    res.send(feeds);
  });

  app.post('/get-fresh', async (req, res) => {
    const { page, size } = req.body;
    const feeds = await getFeeds.getFresh(client, page, size, redisClient);
    res.send(feeds);
  });

  app.post('/get-detail', async (req, res) => {
    const { code } = req.body;
    const feed = await fetchFeeds.fetchFeedDetailByShortcode(code, redisClient);
    res.send(feed);
  });
};

startServer();

module.exports = app;
