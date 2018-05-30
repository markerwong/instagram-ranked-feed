const fetch = require('node-fetch');

const elasticsearch = require('../models/elasticsearch');
const redis = require('../models/redis');

const LIKE_SCORE_MAX = 5000;
const COMMENT_SCORE_MAX = 1000;

const parseFeed = (node) => {
  const feed = {};
  const caption = node.edge_media_to_caption.edges[0];
  feed.id = node.id;
  feed.shortcode = node.shortcode;
  feed.caption = (caption) ? caption.node.text : '';
  feed.display_url = node.thumbnail_src;
  feed.like_count = node.edge_liked_by.count;
  feed.comment_count = node.edge_media_to_comment.count;
  feed.taken_at_timestamp = node.taken_at_timestamp;
  feed.is_video = node.is_video;

  return feed;
};

const generateFeedScore = (likeCount, commentCount) => {
  const likeScore = (likeCount > LIKE_SCORE_MAX) ? 1 : likeCount / LIKE_SCORE_MAX;
  const commentScore = (commentCount > COMMENT_SCORE_MAX) ? 1 : commentCount / COMMENT_SCORE_MAX;

  return ((likeScore * 40) + (commentScore * 60));
};

const saveFeedsToElasticsearch = async (client, feeds) => {
  const operations = [];
  feeds.forEach((val) => {
    operations.push({ index: { _index: 'instagram', _type: 'feed', _id: val.id } });
    operations.push(val);
  });

  await elasticsearch.bulk(client, operations);
};

exports.fetchFeedDetailByShortcode = async (code, redisClient) => {
  const redisData = await redis.get(redisClient, code);

  if (redisData) {
    return redisData;
  }

  const returnDetail = await fetch(`https://www.instagram.com/p/${code}/?__a=1`, {})
    .then(t => t.text().then((r) => {
      const { graphql: { shortcode_media: returnData } } = JSON.parse(r);
      const detail = {
        shortcode: returnData.shortcode,
        displayUrl: returnData.display_url,
        isVideo: returnData.is_video,
        videoUrl: (returnData.is_video) ? returnData.video_url : '',
        likeCount: returnData.edge_media_preview_like.count,
        commentCount: returnData.edge_media_to_comment.count,
        caption: returnData.edge_media_to_caption.edges[0].node.text,
        owner: returnData.owner.username,
        takenAtTimestamp: returnData.taken_at_timestamp,
      };

      if (returnData.edge_sidecar_to_children) {
        const childrens = [];
        returnData.edge_sidecar_to_children.edges.forEach((edge) => {
          const { node } = edge;
          const children = {
            displayUrl: node.display_url,
            isVideo: node.is_video,
            videoUrl: (node.is_video) ? node.video_url : '',
          };
          childrens.push(children);
        });
        detail.childrens = childrens;
      }
      return detail;
    }));

  await redis.set(redisClient, code, JSON.stringify(returnDetail));
  return returnDetail;
};


exports.fetchFeedsByTags = async (elasticsearchClient, tags) => {
  const feeds = [];

  await Promise.all(tags.map(async (tag) => {
    await fetch(`https://www.instagram.com/explore/tags/${tag}/`, {
    }).then(t => t.text().then(async (r) => {
      const data = JSON.parse(r.match(/<script type="text\/javascript">window\._sharedData =(.*);<\//)[1]);
      const nodes = [
        data.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.edges,
        data.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_top_posts.edges,
      ];
      nodes.forEach((node) => {
        node.forEach((item) => {
          const feed = parseFeed(item.node);
          feed.score = generateFeedScore(feed.like_count, feed.comment_count);
          feeds.push(feed);
        });
      });

      saveFeedsToElasticsearch(elasticsearchClient, feeds);
    }));
  }));

  return feeds;
};
