/* 
   Redis Helper Functions 
*/
import 'dotenv/config'
import { redis } from '../redis/redis.js'

/*
   Keys management 
*/
export function getIndexName() {
   return 'fts:chinese:index';
}

export function getDocumentKeyName(id) {
    return `fts:chinese:documents:${id}`
}

/*
   Index management 
*/
export async function checkIndex() {
   const indexList = await redis.ft._list()

   return indexList.includes(getIndexName())
}

export async function createIndex() {
   return await redis.ft.create(getIndexName(),
      {
        id: {
          type: 'NUMERIC', 
          sortable: true
        },
        textChi: {
          type: 'TEXT',
          sortable: true,
          weight: 1.0
        },
        visited: {
          type: 'NUMERIC',
          sortable: true,
        },
        createdAt: {
         type: 'TAG',
         sortable: true,
        },  
        updatedAt: { 
         type: 'TAG',
         sortable: true,

        },
        updateIdent: {
         type: 'NUMERIC',
         sortable: true,
        }
      },
      {
        ON: "HASH",
        PREFIX: getDocumentKeyName(''),
        LANGUAGE: "chinese"
      }
    );
}
// export async function createIndex() {
//    const redisCommand = `FT.CREATE ${getIndexName()} ON HASH PREFIX 1 ${getDocumentKeyName('')} LANGUAGE chinese SCHEMA id NUMERIC SORTABLE textChi TEXT WEIGHT 1.0 SORTABLE visited NUMERIC SORTABLE createdAt TAG SORTABLE updatedAt TAG SORTABLE updateIdent NUMERIC SORTABLE`

//    return await redis.sendCommand(redisCommand.split(' '))
// }

/*
   Documents management 
*/
export async function findDocuments(query, offset=0, limit = 10) {
    const indexName = getIndexName()
    const redisCommand = [ 'FT.SEARCH', indexName, query.trim(), 'WITHSCORES', 'RETURN', '2', 'textChi', 'id', 'LIMIT', offset.toString(), limit.toString() ]

    // Find documents 
    const searchResults = await redis.sendCommand(redisCommand);
    // “Even the straightest road has its twist.”
    const docs = twist(searchResults)
 
    // Update `visited` field
    const promises = [];    // Collect promises 
    docs.forEach(doc => { 
         const docKey = getDocumentKeyName(doc.id)
         const now = new Date(); 
         const isoDate = now.toISOString(); 

         // Use transaction
         promises.push( 
                        redis.multi()
                        .hIncrBy(docKey, 'visited', 1)
                        .hSet(docKey, 'updatedAt', isoDate)
                        .hIncrBy(docKey, 'updateIdent', 1)
                        .exec()
            )
        })
    await Promise.all(promises); // Resolve all at once
    
    return docs
 }
 
 export async function countDocuments(query='*') { 
   const indexName = getIndexName()
    // Count documents 
    // { total: integer, documents: [ { id:string, value:object }, ...]}
    const { total } = await redis.ft.search(indexName, query.trim(), {
       NOCONTENT: true,
       LIMIT: {
          from: 0, // Offset
          size: 0  // Number of results to return
       }
   }); 
 
   return total
 }
 
 export async function getStatus() { 
   const query = '@visited:[(0 +inf]'

   return { 
      version: await getVersion(),
      model: 'N/A',
      documents: await countDocuments(),
      size: 13.1, 
      visited: await countDocuments(query), 
      results: await getDocuments(query, 0, process.env.MAX_STATS_RETURN)
   };
 }

 export async function getDocument(id) { 
   /*
      HGETALL fts:chinese:documents:31
   */
   return await redis.hGetAll(getDocumentKeyName(id))
 }

 /*
    INFO SERVER
 */
 export async function getVersion() {
   const serverInfo = await redis.sendCommand(['INFO', 'SERVER']);

   const parsed = Object.fromEntries(
      serverInfo
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split(':'))
    );
    
    return `Redis ${parsed.redis_version}`; // e.g., "7.2.0" 
 }

 export async function getDocuments(query, offset=0, limit = 10) {
   const searchResult =  await redis.ft.search(getIndexName(), query, {
      RETURN: ['id', 'textChi', 'visited'],
      LIMIT: {
          from: offset,
          size: limit
      }
  });
  
   // { total: integer, documents: [ { id:string, value:object }, ...]}
  return searchResult.documents.map(doc => {
   return doc.value
  })
 }
 
 /* 
    “Even the straightest road has its twist.”
    [
       5,
       'fts:chinese:document:31',
       '14',
       [ 'textChi', '夏天的海灘充滿歡笑與快樂', 'id', '31' ],
       'fts:chinese:document:88',
       '14',
       [ 'textChi', '夏天的冰淇淋讓人感到無比清涼', 'id', '88' ],
       'fts:chinese:document:67',
       '14',
       [ 'textChi', '夏天的微風讓人感覺舒適', 'id', '67' ],
       'fts:chinese:document:246',
       '14',
       [ 'textChi', '夏天的海灘充滿活力', 'id', '246' ],
       'fts:chinese:document:392',
       '7',
       [ 'textChi', '夏天的微風帶來涼爽的感受', 'id', '392' ]
    ]
   
    [
       { textChi: '夏天的海灘充滿歡笑與快樂', id: '31', score: '14' },
       { textChi: '夏天的冰淇淋讓人感到無比清涼', id: '88', score: '14' },
       { textChi: '夏天的微風讓人感覺舒適', id: '67', score: '14' },
       { textChi: '夏天的海灘充滿活力', id: '246', score: '14' },
       { textChi: '夏天的微風帶來涼爽的感受', id: '392', score: '7' }
    ]
 */   
export function twist(inputArray) {
    let outputArray = []
    let obj = {}
    
    for (let i = 1; i < inputArray.length; i += 3) {
       const values = inputArray[i + 2]
       for (let j=0; j < values.length; j +=2) {
          obj[values[j]] = values[j+1]
       }
       obj.score = inputArray[i+1]
 
       outputArray.push(obj)
       obj = {}
    }
    
    return outputArray
 }
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

countDocuments: 
FT.SEARCH fts:chinese:index "@textChi:夏天" NOCONTENT
*/
/*
   In the output of the FT.SEARCH command with the WITHSCORES option, the scores are the floating-point numbers that appear immediately after the document fields. Each document's score is displayed right after its fields.
*/
 /*
    FT.SEARCH fts:chinese:index * NOCONTENT LIMIT 0 0
    FT.SEARCH fts:chinese:index "@visited:[(0 +inf]" NOCONTENT LIMIT 0 0
    FT.SEARCH fts:chinese:index "@visited:[(0 +inf]" RETURN 3 id textChi visited LIMIT 0 100
    process.env.MAX_RETURN
 */ 