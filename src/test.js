import { redis } from './redis/redis.js'
import { loadScript, countVisited } from './util/redisHelper.js'

/*
   main
*/
await redis.connect();
await loadScript();

console.log(await countVisited("fts:chinese:documents:", "visited", "0", "id", "textChi", "visited"))

await redis.close()
process.exit()