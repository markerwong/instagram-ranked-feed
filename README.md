# Instagram ranked feed mini page

A website that show ranked feeds from Instagram. Feeds will fetch by server and store in elasticsearch.

---

## Access port and URL

URL: `http://localhost:9000/`

Port: `9000`

---

## Requirement

1. Elasticsearch endpoint
2. node version 8.9 or above

---

## Installation

1. Install node modules with `npm i`

2. Build website files with `npm run build`

3. Update `config/default.json` for elasticsearch and Redis config

4. Start server with `npm run start:server`

---

## Architecture

Frontend is using React. It's smooth and easy to handle events like get more feeds and get feed detail .

Backend server is using Node.js with Express to set routes.

One of the reason that using Node.js is that there are any node modules that easy to use. Also it's using Javascript that same us frontend framework. No pain on setup different environment.

Server will fetch Instagram feeds when it start and after every 10 minutes. It gets from Instagram HTML page and will parse data. It will save parsed data to Elasticsearch.

There's Redis to store Elasticsearch search result as cache data for 10 minutes. It call increase the time for getting feeds list and feed detail.

A config file to store Elasticsearch and Redis endpoint.
