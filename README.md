# github-contrib-stats
Retrieve GitHub total contribution count and streaks.

## Prerequisites
This requires Node.js v7.7.0 or greater.

## Installation
```
npm install --save github-contrib-stats
```

## Usage
```js
const getGhContribStats = require(‘github-contrib-stats’);

async function test() {
  try {
    const stats = await getGhContribStats('clthck');
    console.log(stats);
  } catch (err) {
    console.error(err, err.stack);
  }
}

test();
```

Output will be in the following format:
```js
{
  basicUserData: { ... }, // Find more details at https://api.github.com/users/clthck
  contributionStats: {
    totalContributions: 857,
    todaysContributions: 9,
    currentStreak: 4,
    longestStreak: 24
  }
}
```