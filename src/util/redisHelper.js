/* 
   Redis Helper Functions
*/
import 'dotenv/config'
import fs from 'node:fs';
import path from 'node:path';
import { redis } from '../redis/redis.js'

/*
   Keys management 
*/
/**
 * Retrieves the name of the index used for querying or storing documents.
 *
 * @function getIndexName
 * @returns {string} The name of the index.
 */
export function getIndexName() {
   return 'fts:chinese:index';
}

/**
 * Constructs and returns the full Redis key name for a document based on its ID.
 *
 * @function getDocumentKeyName
 * @param {string|number} id - The unique identifier of the document.
 * @returns {string} The generated key name for accessing the document in the datastore.
 */
export function getDocumentKeyName(id) {
    return `fts:chinese:documents:${id}`
}

/*
   Index management 
*/
/**
 * Checks the existence and status of the search index used for querying documents.
 *
 * @async
 * @function checkIndex
 * @returns `true` if the index exists and is accessible, otherwise `false`.
 */
export async function checkIndex() {
   const indexList = await redis.ft._list()

   return indexList.includes(getIndexName())
}

/**
 * Creates a new search index for storing and querying documents.
 *
 * @async
 * @function createIndex
 * @returns 'Ok' if the index is successfully created.
 *
 * @throws {Error} Throws an error if index creation fails due to existing index conflicts,
 * schema misconfiguration, or underlying datastore issues.
 */
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
   Fulltext Search 
*/
/**
 * Finds documents matching the specified query, with optional pagination support.
 *
 * @async
 * @function findDocuments
 * @param {string} query - The search query string used to match relevant documents.
 * @param {number} [offset=0] - The number of documents to skip, useful for pagination. Defaults to 0.
 * @param {number} [limit=10] - The maximum number of documents to return. Defaults to 10.
 * @returns {Array<Object>} An array of matched documents.
 */
export async function findDocuments(query, offset=0, limit = 10) {
    const indexName = getIndexName()
    const redisCommand = [ 'FT.SEARCH', indexName, query.trim(), 'WITHSCORES', 'RETURN', '2', 'textChi', 'id', 'LIMIT', offset.toString(), limit.toString() ]

    // Find documents 
    const searchResults = await redis.sendCommand(redisCommand);
    // “Even the straightest road has its twist.”
    const docs = transformSearchResults(searchResults)
 
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
 
 /**
 * Counts the number of documents that match a specified query pattern.
 *
 * @async
 * @function countDocuments
 * @param {string} [query='*'] - A query pattern to match documents. Defaults to wildcard (*) to count all documents.
 * @returns {number} The total number of matching documents.
 */
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
 
/**
 * Retrieves the current status of the system, index, or service.
 *
 * @async
 * @function getStatus
 * @returns {Object} An object representing the system's status,
 * such as version, number of documents, space used, number of  visited documents, visited documents.
 *
 * @throws {Error} Throws an error if the status cannot be retrieved due to connectivity issues,
 * missing index, or unexpected server responses.
 */
 export async function getStatus() { 
   const query = '@visited:[(0 +inf]'

   return { 
      version: await getVersion(),      
      documents: await countDocuments(),
      size: 13.1, 
      visited: await countDocuments(query), 
      results: await getDocuments(query, 0, process.env.MAX_STATS_RETURN)
   };
 }

/**
 * Retrieves a document by its unique identifier.
 *
 * @async
 * @function getDocument
 * @param {string|number} id - The unique ID of the document to retrieve.
 * @returns {Object|null} The document object if found,
 * or `null` if no matching document exists.
 *
 * @throws {Error} Throws an error if retrieval fails due to connectivity issues or datastore errors.
 */
 export async function getDocument(id) { 
  /* HGETALL fts:chinese:documents:31 */
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

/**
 * Retrieves documents matching a given query string, with support for offset and limit.
 *
 * @async
 * @function getDocuments
 * @param {string} query - The query used to fetch relevant documents.
 * @param {number} [offset=0] - The number of results to skip. Useful for paginated access. Defaults to 0.
 * @param {number} [limit=10] - The maximum number of documents to return. Defaults to 10.
 * @returns {Array<Object>} An array of matched documents.
 */
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
to:    
    [
       { textChi: '夏天的海灘充滿歡笑與快樂', id: '31', score: '14' },
       { textChi: '夏天的冰淇淋讓人感到無比清涼', id: '88', score: '14' },
       { textChi: '夏天的微風讓人感覺舒適', id: '67', score: '14' },
       { textChi: '夏天的海灘充滿活力', id: '246', score: '14' },
       { textChi: '夏天的微風帶來涼爽的感受', id: '392', score: '7' }
    ]
 */   
/**
 * Transforms a flat RediSearch-style response array into an array of structured document objects.
 *
 * The input is expected to contain alternating groups of document keys, scores, and field arrays,
 * as returned by RediSearch aggregate or search commands (e.g., FT.SEARCH with RETURN and WITHSCORES).
 *
 * Example input:
 * [
 *   5,
 *   'fts:chinese:document:31', '14', [ 'textChi', '夏天的海灘充滿歡笑與快樂', 'id', '31' ],
 *   'fts:chinese:document:88', '14', [ 'textChi', '夏天的冰淇淋讓人感到無比清涼', 'id', '88' ],
 *   ...
 * ]
 *
 * Example output:
 * [
 *   { textChi: '夏天的海灘充滿歡笑與快樂', id: '31', score: '14' },
 *   { textChi: '夏天的冰淇淋讓人感到無比清涼', id: '88', score: '14' },
 *   ...
 * ]
 *
 * @function transformSearchResults
 * @param {Array<any>} rawResults - The raw array returned from RediSearch, including the result count and triplets of document data.
 * @returns {Array<{ textChi: string, id: string, score: string }>} Array of structured document objects.
 */
export function transformSearchResults(inputArray) {
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
   Search by scanning 
*/
const filePath = path.join('.', 'src', 'lua', 'scanTextChi.lua');
const luaScript = fs.readFileSync(filePath, 'utf8');

let sha = ''
export async function loadScript() {
   sha = await redis.scriptLoad(luaScript);
   return sha
}

/**
 * Scans documents with a specific prefix and filters them based on a field's value.
 *
 * @async
 * @function scanDocuments
 * @param {string} [documentPrefix='*'] - A prefix pattern to match document keys. Defaults to wildcard (*).
 * @param {string} testField - The field name to inspect within each document.
 * @param {string} containedValue - The expected value that must be contained in the test field.
 * @param {...any} argv - Additional optional arguments for extended filtering or processing logic.
 * @returns {Array<Object>} An array of matching documents.
 */
export async function scanDocuments(documentPrefix='*', testField, containedValue, ...argv) {
    const result = await redis.evalSha(sha, {
        keys: [ documentPrefix, testField, containedValue ], 
        arguments: ( argv.length !== 0 ? argv : ["*"] )
        });
    if ( argv.length !==0 )
        return twistWithNames(argv, result)
    else 
        return twistWithoutNames(result)
}
/*
    “Even the straightest road has its twist.”
    [
      [
        '100',
        '人口老齡化問題成為各國政府的重要議題。隨著老年人比例的增加，社會保障、醫療體系及經濟增長都面臨壓力。政府必須制定相應政策，以確保社會的可持續發展與每個人的福祉。',
        '2025-07-04T09:14:43.904Z'
      ],
      [
        '126',
        '隨著人口老齡化的加劇，社會保障制度面臨挑戰。政府需要改革退休金體系，確保未來的可持續性。同時，加強對年輕一代的職業培訓，促進勞動市場的靈活性。',
        '2025-07-04T09:14:43.904Z'
      ]
    ] 
to: 
    [
        {
            id: '100',
            textChi: '人口老齡化問題成為各國政府的重要議題。隨著老年人比例的增加，社會保障、醫療體系及經濟增長都面臨壓力。政府必須制定相應政策，以確保社會的可持續發展與每個人的福祉。',
            updatedAt: '2025-07-04T09:14:43.904Z'
        }, 
        {
            id:'126', 
            textChi: '隨著人口老齡化的加劇，社會保障制度面臨挑戰。政府需要改革退休金體系，確保未來的可持續性。同時，加強對年輕一代的職業培訓，促進勞動市場的靈活性。',
            updatedAt: '2025-07-04T09:14:43.904Z'
        }
    ]
*/
function twistWithNames(fieldNames, arrayOfArray) {
    return arrayOfArray.map(row => {
      return row.reduce((obj, value, index) => {
        const key = fieldNames[index]
        obj[key] = value;
        return obj;
      }, {});
    });
  }
/*
    “Even the straightest road has its twist.”
    [
      [
        'updateIdent',
        '0',
        'createdAt',
        '2025-07-07T03:53:41.228Z',
        'textChi',
        '人口老齡化問題成為各國政府的重要議題。隨著老年人比例的增加，社會保障、醫療體系及經濟增長都面臨壓力。政府必須制定相應政策，以確保社會的可持續發展與每個人的福祉。',
        'updatedAt',
        '',
        'visited',
        '0',
        'id',
        '100'
      ],
      [
        'updateIdent',
        '0',
        'createdAt',
        '2025-07-07T03:53:41.228Z',
        'textChi',
        '隨著人口老齡化的加劇，社會保障制度面臨挑戰。政府需要改革退休金體系，確保未來的可持續性。同時，加強對年輕一代的職業培訓，促進勞動市場的靈活性。',
        'updatedAt',
        '',
        'visited',
        '0',
        'id',
        '126'
      ]
    ]
to: 
    [
      {
        updateIdent: '0',
        createdAt: '2025-07-07T03:53:41.228Z',
        textChi: '人口老齡化問題成為各國政府的重要議題。隨著老年人比例的增加，社會保障、醫療體系及經濟增長都面臨壓力。政府必須制定相應政策，以確保社會的可持續發展與每個人的福祉。',
        updatedAt: '',
        visited: '0',
        id: '100'
      },
      {
        updateIdent: '0',
        createdAt: '2025-07-07T03:53:41.228Z',
        textChi: '隨著人口老齡化的加劇，社會保障制度面臨挑戰。政府需要改革退休金體系，確保未來的可持續性。同時，加強對年輕一代的職業培訓，促進勞動市場的靈活性。',
        updatedAt: '',
        visited: '0',
        id: '126'
      }
    ]
*/  
function twistWithoutNames(arrayOfKV) {
    return arrayOfKV.map(entry => {
      const obj = {};
      for (let i = 0; i < entry.length; i += 2) {
        const key = entry[i];
        const value = entry[i + 1];
        obj[key] = value;
      }
      return obj;
    });
  }
// 

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