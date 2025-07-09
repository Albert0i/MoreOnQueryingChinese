import { redis } from './redis/redis.js'
import { getDocumentKeyName, getTokenKeyName, zAddIncr, loadScript } from './util/redisHelper.js'
import { removeStopWord } from './util/stopWords.js'
import { documents } from '../data/documents.js'

await redis.connect()
await loadScript()
/*
    Flush all data 
    await redis.flushDb()
*/

/*
   main 
*/
let promises = [];
for (let i = 0; i < documents.length; i++) {
    const now = new Date(); 
    const isoDate = now.toISOString(); 
    
    promises.push(redis.hSet(getDocumentKeyName(i + 1), {
        id: i + 1, 
        textChi: documents[i],
        visited:   0, 
        createdAt: isoDate, 
        updatedAt: "", 
        updateIdent: 0
    } ) )

    const textChiSpc = spaceChineseChars(removeStopWord(documents[i]))
    textChiSpc.split(' ').map(token => {
        if (token) {
        /*
            promises.push(redis.zAdd(
                getTokenKeyName(token), { 
                    score: 1, 
                    value: getDocumentKeyName(i + 1)
                }
            ))
        */
            promises.push(zAddIncr(
                getTokenKeyName(token),
                getDocumentKeyName(i + 1)
            ))
        }            
    })
}
await Promise.all(promises)
console.log('Seeding finished!')

await redis.close()

/*
function spaceChineseChars(text) {
    return text.replace(/([\u4e00-\u9fff])/g, '$1 ');
}
*/
function spaceChineseChars(text) {
    // Match Chinese characters individually, and English words as a whole
    const pattern = /[\u4e00-\u9fff]|[a-zA-Z0-9]+/g;
    const tokens = text.match(pattern);
    return tokens ? tokens.join(' ') : '';
}

/*
const now = new Date(); // Creates a Date object for the current date and time
const isoDate = now.toISOString(); // Converts the Date object to an ISO string

console.log(isoDate); // Example output: 2025-06-30T14:21:00.000Z (time will vary based on execution)
*/
/*
FT.CREATE fts:chinese:index 
    ON HASH PREFIX 1 fts:chinese:document: LANGUAGE chinese 
    SCHEMA 
    id NUMERIC SORTABLE 
    textChi TEXT WEIGHT 1.0 SORTABLE     
    visited NUMERIC SORTABLE 
    createdAt TAG SORTABLE 
    updatedAt TAG SORTABLE 
    updateIdent NUMERIC SORTABLE 
*/
/*
FT.SEARCH fts:chinese:index "@textChi:夏天" NOCONTENT

findDocuments: 
FT.SEARCH fts:chinese:index "@textChi:夏天" WITHSCORES RETURN 2 textChi id

countDocuments: 
FT.SEARCH fts:chinese:index "@textChi:夏天" NOCONTENT


FT.SEARCH fts:chinese:index "@visited:[0 +inf]" NOCONTENT
*/