import fs from 'fs';
import readline from 'readline';
import { redis } from './redis/redis.js';
import { getDocumentKeyName, getTokenKeyName, zAddIncr, loadScript } from './util/redisHelper.js'
import { removeStopWord, spaceChineseChars, isNumeric, isEnglishOrSymbol } from './util/stopWords.js'

/*
   main
 */
let promises = [];
let i = 0

// Initialize Redis client
await redis.connect();
await loadScript()

// Create stream and line reader
const stream = fs.createReadStream('./data/output.redis');
const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity
});

// Process each line
for await (const line of rl) {    
  const parts = line.trim().split(' ');  

  promises = []
  const now = new Date(); 
  const isoDate = now.toISOString(); 

  /*
    HSET user:001 description "Alice likes hiking"
    HSET user:002 description "Bob enjoys painting"
    HSET user:003 description "Charlie codes in Lua"
  */
  // HASH
  if (parts.length >= 4 && parts[0] === 'HSET') {
    const [, key, field, ...valueParts] = parts;
    const value = valueParts.join(' ').replace(/^"|"$/g, '');
    const textChi = `${key.replace('DONGDICT:', '')}<br />${value}`
    try {
        //console.log(`✅ HSET ${key} ${field} "${value}"`);        
        promises.push(redis.hSet(getDocumentKeyName(i + 1), {
                id: i + 1, 
                key: key.replace('DONGDICT:', ''),
                textChi,
                visited:   0, 
                createdAt: isoDate, 
                updatedAt: "", 
                updateIdent: 0
            } ) )    
        // Sorted Set 
        const textChiSpc = spaceChineseChars(removeStopWord(textChi))
        textChiSpc.split(' ').map(token => {
            if (token && 
                !(isNumeric(token)) && 
                !isEnglishOrSymbol(token)) {
                promises.push(zAddIncr(
                    getTokenKeyName(token),
                    getDocumentKeyName(i + 1)
                ))
            }            
        })  
    } catch (err) {
      console.error(`❌ Error processing ${key}:`, err.message);
    }
  } else {
    console.warn(`⚠ Skipped malformed line: ${line}`);
  }

  await Promise.all(promises)
  i = i + 1

  if ((i/1000) === (Math.floor(i/1000))) 
    console.log(i)
}
console.log('✅ Done processing file line by line');

// Clean up
await redis.close();
process.exit()
