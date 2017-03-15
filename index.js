'use strict';

// const pry = require('pryjs');
const requestify = require('requestify');
const cheerio = require('cheerio');
const moment = require('moment');

// isoDate()
const isoDate = date => moment(date).format('YYYY-MM-DD');
// getBasicUserData()
const getBasicUserData = async username => (await requestify.get(`https://api.github.com/users/${username}`)).getBody();

// getContributionss()
async function getContributions(username, toDate) {
  const res = await requestify.get(`https://github.com/users/${username}/contributions?to=${isoDate(toDate)}`);
  const $ = cheerio.load(res.getBody());
  const fromDate = moment(toDate).subtract(1, 'y');
  const data = [];
  let contributions = 0;
  let date;
  let count;

  $('.day').each((_, e) => {
    date = $(e).data('date');
    count = parseInt($(e).data('count'), 10);
    if (moment(date).unix() > fromDate.unix()) {
      data.push({ date, count });
      contributions += count;
    }
  });

  return { data, count: contributions };
}

// getStreaks()
function getStreaks(data) {
  const endDate = data[data.length - 1].date;
  let currentStreak = 0;
  let longestStreak = 0;

  for (const datum of data) {
    if (datum.count > 0) {
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }
    else if (datum.date !== endDate) {
      currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
}

// getContributionStats()
async function getContributionStats(username, userJoinedDate) {
  const joinedDate = moment(userJoinedDate).startOf('d');
  let toDate = moment(new Date()).startOf('d');
  let totalContributions = 0;
  let contributions;
  let data = [];

  while (toDate.unix() > joinedDate.unix()) {
    contributions = await getContributions(username, toDate);
    data = contributions.data.concat(data);
    totalContributions += contributions.count;
    toDate = toDate.subtract(1, 'y').startOf('d');
  }

  const { currentStreak, longestStreak } = getStreaks(data);
  const todaysContributions = data[data.length - 1].count;

  return { totalContributions, todaysContributions, currentStreak, longestStreak };
}

// exports
module.exports = async username => {
  try {
    const basicUserData = await getBasicUserData(username);
    return await getContributionStats(username, basicUserData.created_at);
  }
  catch (err) {
    console.error(err, err.stack);
  }
};
