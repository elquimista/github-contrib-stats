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