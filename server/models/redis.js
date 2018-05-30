const redis = require('redis');
const { promisify } = require('util');
const config = require('config');

const redisConfig = config.get('redis');

exports.connect = async () => {
  const response = await redis.createClient(redisConfig.port);
  return response;
};

exports.get = async (client, key) => {
  const getAsync = promisify(client.get).bind(client);
  const response = await getAsync(key);
  return response;
};

exports.set = async (client, key, value, expire = redisConfig.store_time) => {
  const setAsync = promisify(client.set).bind(client);
  const response = await setAsync(key, value, 'EX', expire);
  return response;
};
