const elasticsearch = require('elasticsearch');
const config = require('config');

const host = config.get('elasticsearch.host');

exports.client = () => new elasticsearch.Client({
  host,
  // log: 'trace',
});

exports.create = async (client, index, type, id, body) => {
  let response = {};
  try {
    response = await client.index({
      index, type, id, body,
    });
  } catch (ex) {
    console.log('elasticsearch create fail:', ex.message);
  }

  return response;
};

exports.bulk = async (client, operations) => {
  let response = {};
  try {
    response = await client.bulk({
      body: operations,
    });
  } catch (ex) {
    console.log('elasticsearch bulk function fail:', ex.message);
  }

  return response;
};

exports.search = async (client, index, type, body) => {
  let response = {};
  try {
    response = await client.search({ index, type, body });
  } catch (ex) {
    console.log('elasticsearch search fail:', ex.message);
  }

  return response.hits;
};
