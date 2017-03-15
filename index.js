'use strict';

// const pry = require('pryjs');
const requestify = require('requestify');
const cheerio = require('cheerio');
const moment = require('moment');

// isoDate()
const isoDate = date => moment(date).format('YYYY-MM-DD');

async function getUserJoinedDate(username) {
  const res = await requestify.get(`https://api.github.com/users/${username}`);
  return res.getBody().created_at;
}

// getContributionsCount()
async function getContributionsCount(username, toDate) {
  const res = await requestify.get(`https://github.com/users/${username}/contributions?to=${isoDate(toDate)}`);
  const $ = cheerio.load(res.getBody());
  const fromDate = moment(toDate).subtract(1, 'y');
  let contributions = 0;

  $('.day').each((_, e) => {
    if (moment($(e).data('date')).unix() > fromDate.unix()) {
      contributions += parseInt($(e).data('count'), 10);
    }
  });

  return contributions;
}

// getTotalContributionsCount()
async function getTotalContributionsCount(username) {
  const joinedDate = moment(await getUserJoinedDate(username)).startOf('d');
  let toDate = moment(new Date()).startOf('d');
  let totalContributions = 0;

  while (toDate.unix() > joinedDate.unix()) {
    totalContributions += await getContributionsCount(username, toDate);
    toDate = toDate.subtract(1, 'y').startOf('d');
  }

  return totalContributions;
}

// exports
module.exports = async username => {
  try {
    return {
      totalContributions: await getTotalContributionsCount(username)
    };
  }
  catch (err) {
    console.error(err, err.stack);
  }
};
