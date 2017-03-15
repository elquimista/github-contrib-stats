'use strict';

const getGhContribStats = require('./');

async function test() {
  try {
    const stats = await getGhContribStats('clthck');
    console.log(stats);
  } catch (err) {
    console.error(err, err.stack);
  }
}

test();
