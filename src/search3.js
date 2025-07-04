import fs from 'node:fs';
import path from 'node:path';
import { redis } from './redis/redis.js'
await redis.connect();

const filePath = path.join('.', 'src', 'lua', 'scanTextChi.lua');
const luaScript = fs.readFileSync(filePath, 'utf8');
const sha = await redis.scriptLoad(luaScript);

/*
   main 
*/
const result = await redis.evalSha(sha, {
    keys: [ "fts:chinese:documents:*", 'textChi', '人口' ], // keys and pattern used in this script
    arguments: [ 'id', 'textChi', 'visited' ] // Fields to return in this script
  });
  
console.log(result); // matched keys like ['document:123', 'document:456']

await redis.close()
process.exit()
