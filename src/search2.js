import { redis } from './redis/redis.js'
import { scanDocuments, loadScript } from "./util/redisHelper.js";

await redis.connect();
await loadScript();

/*
   main 
*/
const result = await scanDocuments("fts:chinese:documents:*", "textChi", "人口", "id", "textChi", "visited") 
console.log(result); 

await redis.close()
process.exit()
