'use strict';

const requestify = require('requestify');
const cheerio = require('cheerio');
const moment = require('moment');

let authCredentials = {};

// isoDate()
const isoDate = date => moment(date).format('YYYY-MM-DD');
// getBasicUserData()
const getBasicUserData = async username => {
  let options;

  if (authCredentials.username && authCredentials.password) {
    options = {
      auth: authCredentials
    };
  }

  return (await requestify.get(`https://api.github.com/users/${username}`, options)).getBody();
}

// getContributionss()
async function getContributions(username, toDate) {
  let options;

  if (authCredentials.username && authCredentials.password) {
    options = {
      auth: authCredentials
    }
  }

  const res = await requestify.get(`https://github.com/users/${username}/contributions?to=${isoDate(toDate)}`, options);
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
module.exports = {
  auth: (username, password) => {
    authCredentials.username = username;
    authCredentials.password = password;
  },
  get: async username => {
    let rateLimited;

    do {
      try {
        const basicUserData = await getBasicUserData(username);
        const contributionStats = await getContributionStats(username, basicUserData.created_at);

        return { basicUserData, contributionStats };
      }
      catch (err) {
        if (err.code === 403) {
          rateLimited = true;
          let waitTime = (moment(err.headers['x-ratelimit-reset']).add(1, 'second').unix() - moment.utc().unix()) * 1000;

          await (new Promise(resolve => setTimeout(resolve, waitTime % 3600000)));
        } else if (err.code === 404) {
          return null;
        } else {
          throw err;
        }
      }
    } while(rateLimited)
  }
};
