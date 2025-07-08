import { redis } from './redis/redis.js'
import { scanDocuments, loadScript } from "./util/redisHelper.js";

await redis.connect();
await loadScript();

/*
   main 
*/
//const result = await scanDocuments("fts:chinese:documents:*", "textChi", "人口", '1', '0', "id", "textChi", "visited") 
const result = await scanDocuments("fts:chinese:documents:*", "textChi", "人口") 
console.log(result); 

await redis.close()
process.exit()
