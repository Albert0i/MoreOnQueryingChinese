import { redis } from './redis/redis.js'
import { getIndexName, getDocumentKeyName, checkIndex, createIndex } from './util/redisHelper.js'
import { documents } from '../data/documents.js'

await redis.connect()
/*
    Flush all data 
    await redis.flushDb()
*/

/*
   main 
*/
if ( await checkIndex() ) {
    console.log(`Found index ${getIndexName()}, skip creation...`)
} else {
    console.log(`Creating index ${getIndexName()}...`)
    console.log(await createIndex()) 
}

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
}
await Promise.all(promises)
console.log(`Finished seeding ${documents.length} documents.`)

await redis.close()
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