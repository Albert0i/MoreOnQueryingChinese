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

/**
 * Constructs and returns the full Redis key name for a token based on its ID.
 *
 * @function getTokenKeyName
 * @param {string|number} id - The unique identifier of the document.
 * @returns {string} The generated key name for accessing the token in the datastore.
 */
export function getTokenKeyName(id) {
   return `fts:chinese:tokens:${id}`
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

/**
 * Retrieves the current version string of the system, API, or module.
 *
 * This is useful for diagnostics, compatibility checks, or client-side validation.
 *
 * @async
 * @function getVersion
 * @returns {string} A string representing the current version (e.g. "Redis 7.4.3").
 *
 * @throws {Error} Throws if version retrieval fails due to configuration issues, missing metadata, or connectivity errors.
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
const filePathS1 = path.join('.', 'src', 'lua', 'scanTextChi.lua');
const filePathS2 = path.join('.', 'src', 'lua', 'zAddIncr.lua');
const filePathS3 = path.join('.', 'src', 'lua', 'zSumScore.lua');

const luaScriptS1 = fs.readFileSync(filePathS1, 'utf8');
const luaScriptS2 = fs.readFileSync(filePathS2, 'utf8');
const luaScriptS3 = fs.readFileSync(filePathS3, 'utf8');

/**
 * Loads and registers scripts into the system or datastore.
 *
 * This function may be used to preload Lua scripts into Redis using `SCRIPT LOAD`,
 * register search syntax, or inject custom logic for later execution.
 *
 * @async
 * @function loadScript
 * @returns {string} An array of sha's to the script's SHA1 hash or identifier upon successful registration.
 *
 * @throws {Error} Throws an error if the script loading fails due to syntax issues,
 * datastore connectivity problems, or file access errors.
 */
let shaS1 = ''    // scanDocuments 
let shaS2 = ''    // zAddIncr
let shaS3 = ''    // zSumScore
export async function loadScript() {
   shaS1 = await redis.scriptLoad(luaScriptS1);
   shaS2 = await redis.scriptLoad(luaScriptS2);
   shaS3 = await redis.scriptLoad(luaScriptS3);

   return [ shaS1, shaS2, shaS3 ]
}

/**
 * Scans documents with a specific prefix and filters them based on a field's value.
 *
 * @async
 * @function scanDocuments
 * @param {string} [documentPrefix='*'] - A prefix pattern to match document keys. Defaults to wildcard (*).
 * @param {string} testField - The field name to inspect within each document.
 * @param {string} containedValue - The expected value that must be contained in the test field.
 * @param {number} [offset=0] - The number of documents to skip, useful for pagination. Defaults to 0.
 * @param {number} [limit=10] - The maximum number of documents to return. Defaults to 10.
 * @param {...any} argv - Additional optional arguments for extended filtering or processing logic.
 * @returns {Array<Object>} An array of matching documents.
 */
export async function scanDocuments(documentPrefix, testField, containedValue, offset=0, limit = 10, ...argv) {
    const result = await redis.evalSha(shaS1, {
            keys: [ documentPrefix, testField, containedValue, offset.toString(), limit.toString() ], 
            arguments: ( argv.length !== 0 ? argv : ["*"] )
        });

    if ( argv.length !==0 )
        return mapRowsToObjects(argv, result)
    else 
        return parseKeyValueArrays(result)
}

export async function zAddIncr(key, member) {
   return redis.evalSha(shaS2, {
      keys: [ key ],
      arguments: [ member ]
    });
}

export async function zSumScore(key) {
   return redis.evalSha(shaS3, {
      keys: [ key ],
      arguments: [ ]
    });
}

// export async function fsDocuments(testField, containedValue, offset=0, limit = 10, ...argv) {

// }

/*
    “Even the straightest road has its twist.”
*/
/**
 * Maps an array of data rows into structured objects using provided field names.
 *
 * Each element in `arrayOfArray` is expected to match the order of keys in `fieldNames`.
 * This is useful for transforming tabular or positional data (e.g., from Redis or SQL-like sources)
 * into meaningful key-value objects.
 *
 * Example input:
 *   fieldNames = ['id', 'textChi', 'updatedAt'];
 *   arrayOfArray = [
 *     ['100', '人口老齡化問題成為各國政府的重要議題...', '2025-07-04T09:14:43.904Z'],
 *     ['126', '隨著人口老齡化的加劇...', '2025-07-04T09:14:43.904Z']
 *   ];
 *
 * Example output:
 * [
 *   {
 *     id: '100',
 *     textChi: '人口老齡化問題成為各國政府的重要議題...',
 *     updatedAt: '2025-07-04T09:14:43.904Z'
 *   },
 *   {
 *     id: '126',
 *     textChi: '隨著人口老齡化的加劇...',
 *     updatedAt: '2025-07-04T09:14:43.904Z'
 *   }
 * ]
 *
 * @function mapRowsToObjects
 * @param {Array<string>} fieldNames - An array of field names to be used as keys.
 * @param {Array<Array<any>>} arrayOfArray - A 2D array where each inner array corresponds to a row of values.
 * @returns {Array<Object>} An array of objects with keys from `fieldNames` mapped to corresponding values.
 */
function mapRowsToObjects(fieldNames, arrayOfArray) {
    return arrayOfArray.map(row => {
      return row.reduce((obj, value, index) => {
        const key = fieldNames[index]
        obj[key] = value;
        return obj;
      }, {});
    });
  }

/**
 * Converts an array of key-value pair arrays into structured objects.
 *
 * Each element in `arrayOfKV` should be an array containing alternating keys and values,
 * such as: ['updateIdent', '0', 'createdAt', '...', ..., 'id', '100'].
 *
 * This function transforms:
 * [
 *   ['key1', 'val1', 'key2', 'val2', ...],
 *   ['key1', 'val1', 'key2', 'val2', ...]
 * ]
 * into:
 * [
 *   { key1: 'val1', key2: 'val2', ... },
 *   { key1: 'val1', key2: 'val2', ... }
 * ]
 *
 * @function parseKeyValueArrays
 * @param {Array<Array<string>>} arrayOfKV - An array of arrays, where each sub-array contains alternating keys and values.
 * @returns {Array<Object>} An array of objects constructed from the key-value pairs.
 */
function parseKeyValueArrays(arrayOfKV) {
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