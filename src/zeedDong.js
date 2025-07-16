import { redis } from './redis/redis.js'
import { readFile } from 'fs/promises';
import { getDocumentKeyName, getTokenKeyName, zAddIncr, loadScript } from './util/redisHelper.js'
import { removeStopWord, spaceChineseChars } from './util/stopWords.js'


async function parseHSetFile(filePath) {
  const text = await readFile(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const result = [];
  let promises = []
  let i = 0 

  for (const line of lines) {
    // Match HSET "KEY" FIELD "VALUE"
    const match = line.match(/HSET\s+"([^"]+)"\s+(\w+)\s+"([\s\S]+?)"/);
    if (match) {
      const [, key, field, value] = match;
      result.push({
        key,
        [field]: value,
      });
    }
  }

  return result;
}

/*
   main
*/
let promises = [];
let i = 0
await redis.connect();
await loadScript()

const results = await parseHSetFile('./data/output10.redis');
// results.forEach( async (result) => {
//     const textChi = `${result.key.replace('DONGDICT:', '')} <br /> ${result.description} `
//     const now = new Date(); 
//     const isoDate = now.toISOString(); 
    
//     promises = [];
//     promises.push(redis.hSet(getDocumentKeyName(i + 1), {
//         id: i + 1, 
//         textChi: textChi,
//         visited:   0, 
//         createdAt: isoDate, 
//         updatedAt: "", 
//         updateIdent: 0
//     } ) )

//     const textChiSpc = spaceChineseChars(removeStopWord(textChi))
//     textChiSpc.split(' ').map(token => {
//         if (token) {
//         /*
//             promises.push(redis.zAdd(
//                 getTokenKeyName(token), { 
//                     score: 1, 
//                     value: getDocumentKeyName(i + 1)
//                 }
//             ))
//         */
//             promises.push(zAddIncr(
//                 getTokenKeyName(token),
//                 getDocumentKeyName(i + 1)
//             ))
//         }            
//     })

//     await Promise.all(promises)
//     i = i + 1
// })

//await Promise.all(promises)
console.log('Seeding finished!', results)

await redis.close()
process.exit()

/*

*/
/*
   node --max-old-space-size=8192 src/zeedDong.js
*/