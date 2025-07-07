import { redis } from './redis/redis.js'
import { getIndexName, findDocuments, countDocuments, getDocument, getStatus, getVersion, checkIndex  } from './redisHelper.js'

/*
   main
*/
await redis.connect()

const indexName = getIndexName()
const query = '@textChi:夏天'; // Custom query
/*
   Interface one 
*/
const searchResults = await redis.ft.search(indexName, query, {
    WITHSCORES: true,
    EXPLAINSCORE: true, 
    RETURN: ['id', 'textChi'],
    LIMIT: {
        from: 0,    // Offset
        size: 100   // Number of results to return
    }
});

// Process and log the search results
console.log('searchResults =', searchResults)
console.log('Number of Results:', searchResults.total);

searchResults.documents.forEach(document => {
    console.log(`document id: ${document.id}`);
    Object.entries(document.value).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    console.log('------');
} )

/*
   Interface two
*/
const redisCommand = `FT.SEARCH ${indexName} ${query} WITHSCORES RETURN 2 textChi id LIMIT 0 100`
const secondSearchResults = await redis.sendCommand(redisCommand.split(' '));

// Process and log the search results
console.log('secondSearchResults =', secondSearchResults)
console.log('Number of Results:', secondSearchResults[0]);

for (let i = 1; i < secondSearchResults.length; i += 3) {
   console.log(`document id: ${secondSearchResults[i]}`);
   console.log(`score: ${secondSearchResults[i+1]}`);
   //console.log(`values: ${secondSearchResults[i+2]}`);
   const values = secondSearchResults[i + 2]
   for (let j=0; j < values.length; j +=2) {
      console.log(`${values[j]}: ${values[j+1]}`);
   }
   console.log('------');
}

/*
   Testing 
*/
// const count = await countDocuments(query)
// console.log('count = ', count)

// const docs = await findDocuments(query)
// console.log('docs =', docs)

// console.log(await getDocument(31))

// console.log(await getStatus())

// console.log('version =', await getVersion());

await redis.close()

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
FT.SEARCH fts:chinese:index "@textChi:夏天" WITHSCORES RETURN 2 textChi id LIMIT 0 100

FT.SEARCH fts:chinese:index "@textChi:知識" WITHSCORES RETURN 2 textChi id LIMIT 0 100

FT.SEARCH fts:chinese:index "@textChi:夏天" WITHSCORES NOCONTENT
FT.SEARCH fts:chinese:index "@textChi:知識" WITHSCORES NOCONTENT

SELECT textChi, MATCH(textChiSeg) AGAINST('夏天') AS score, id
FROM documents
HAVING score > 0
ORDER BY score DESC
LIMIT 100 OFFSET 0;

SELECT textChi, MATCH(textChiSeg) AGAINST('知識') AS score, id
FROM documents
HAVING score > 0
ORDER BY score DESC
LIMIT 100 OFFSET 0;



countDocuments: 
FT.SEARCH fts:chinese:index "@textChi:夏天" NOCONTENT
*/
/*
   In the output of the FT.SEARCH command with the WITHSCORES option, the scores are the floating-point numbers that appear immediately after the document fields. Each document's score is displayed right after its fields.
*/