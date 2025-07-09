import { redis } from './redis/redis.js'
import { loadScript, zSumScore } from './util/redisHelper.js'

export async function wc() {
  let counter = 0; 
  let cursor = '0';
  let keys = []
  let promises = [];

  do {
    const result = await redis.scan(cursor, {
      MATCH: 'fts:chinese:tokens:*',
      COUNT: 100, // adjust batch size as needed
    });

    cursor = result.cursor;
    keys = result.keys;

    for (const key of keys) {
        promises.push(redis.zAdd(
            'fts:chinese:wc', { 
                score: await zSumScore(key), 
                value: key.split(':')[3]
            }
        ))
        counter = counter + 1
    }
  } while (cursor !== '0');
  await Promise.all(promises)
  console.log(`Completed ${counter} sorted set.`)

  return counter
}

/*
   main
*/
await redis.connect();
await loadScript();

await wc()

await redis.close()
process.exit()
