/* 
   Redis Helper Functions
*/
import 'dotenv/config'
import fs from 'node:fs';
import path from 'node:path';
import { redis } from '../redis/redis.js'
import { removeStopWord, spaceChineseChars } from './stopWords.js'

/*
   Keys management 
*/
export function getIndexName() {
   return 'fts:chinese:index';
}

export function getDocumentKeyName(id) {
    return `fts:chinese:documents:${id}`
}

export function getTokenKeyName(id) {
   return `fts:chinese:tokens:${id}`
}

export function getWceyName() {
   return 'fts:chinese:wc'
}

export function getVisitedKeyName() {
   return 'fts:chinese:visited'
}

/*
   Scripts Management
*/
const filePathS1 = path.join('.', 'src', 'lua', 'scanTextChi.lua');
const filePathS2 = path.join('.', 'src', 'lua', 'zAddIncr.lua');
const filePathS3 = path.join('.', 'src', 'lua', 'zSumScore.lua');
const filePathS4v1 = path.join('.', 'src', 'lua', 'fsTextChi.v1.lua');
const filePathS4v2 = path.join('.', 'src', 'lua', 'fsTextChi.v2.lua');
const filePathS5 = path.join('.', 'src', 'lua', 'countKeys.lua');
const filePathS6 = path.join('.', 'src', 'lua', 'getVisitedDocs.lua');

const luaScriptS1 = fs.readFileSync(filePathS1, 'utf8');
const luaScriptS2 = fs.readFileSync(filePathS2, 'utf8');
const luaScriptS3 = fs.readFileSync(filePathS3, 'utf8');
const luaScriptS4v1 = fs.readFileSync(filePathS4v1, 'utf8');
const luaScriptS4v2 = fs.readFileSync(filePathS4v2, 'utf8');
const luaScriptS5 = fs.readFileSync(filePathS5, 'utf8');
const luaScriptS6 = fs.readFileSync(filePathS6, 'utf8');

let shaS1 = ''    // scanDocuments 
let shaS2 = ''    // zAddIncr
let shaS3 = ''    // zSumScore
let shaS4v1 = ''  // fsDocuments
let shaS4v2 = ''  // fsDocuments
let shaS5 = ''    // countKeys
let shaS6 = ''    // countVisited

export async function loadScript() {
   shaS1 = await redis.scriptLoad(luaScriptS1);
   shaS2 = await redis.scriptLoad(luaScriptS2);
   shaS3 = await redis.scriptLoad(luaScriptS3);
   shaS4v1 = await redis.scriptLoad(luaScriptS4v1);
   shaS4v2 = await redis.scriptLoad(luaScriptS4v2);
   shaS5 = await redis.scriptLoad(luaScriptS5);
   shaS6 = await redis.scriptLoad(luaScriptS6);

   return [ shaS1, shaS2, shaS3, shaS4v1, shaS4v2, shaS5, shaS6 ]
}

/*
   Search by scanning documents 
*/
export async function scanDocuments(documentPrefix, testField, containedValue, offset=0, limit = 10, ...argv) {
    const result = await redis.evalSha(shaS1, {
            keys: [ `${documentPrefix}*`, testField, containedValue, offset.toString(), limit.toString() ], 
            arguments: ( argv.length !== 0 ? argv : ["*"] )
        });

    // HMGET returns array of [value1, vaue2,...] , without field name.
    // HGETALL returns array of [key1, value1, key2, value2... ].
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

export async function countKeys(keyPrefix) {
   return redis.evalSha(shaS5, {
      keys: [ `${keyPrefix}*` ],
      arguments: [ ]
    });    
}

export async function getVisitedDocuments(zKey, offset, limit, ...argv) {
   const result = await redis.evalSha(shaS6, {
      keys: [ zKey, offset.toString(), limit.toString()],
      arguments: ( argv.length !== 0 ? argv : ["*"] )
    });

    // HMGET returns array of [value1, vaue2,...] , without field name.
    // HGETALL returns array of [key1, value1, key2, value2... ].
    if ( argv.length !==0 )
      return mapRowsToObjects(argv, result)
  else 
      return parseKeyValueArrays(result)
}

/*
   Faceted Search on documents 
*/
export async function fsDocumentsV1(documentPrefix, testField, containedValue, offset=0, limit = 10, ...argv) {
   const tokens = spaceChineseChars(removeStopWord(containedValue)).
                     split(' ').
                     map(token => `${documentPrefix}${token}`)
   const result = await redis.evalSha(shaS4v1, {
      keys: [ testField, containedValue, offset.toString(), limit.toString() ], 
      arguments: tokens
   });

   // HMGET returns array of [value1, vaue2,...] , without field name.
   // HGETALL returns array of [key1, value1, key2, value2... ].
   if ( argv.length !==0 )
      // Filter out unwanted properties. 
      return filterProperties(parseKeyValueArrays(result), argv)
   else 
      return parseKeyValueArrays(result)
}

export async function fsDocumentsV2(documentPrefix, testField, containedValue, offset=0, limit = 10, ...argv) {
   const tokens = spaceChineseChars(removeStopWord(containedValue)).
                     split(' ').
                     map(token => `${documentPrefix}${token}`)
   const result = await redis.evalSha(shaS4v2, {
      keys: [ testField, containedValue, offset.toString(), limit.toString() ], 
      arguments: tokens
   });
   
   let docs = []
   // HMGET returns array of [value1, vaue2,...] , without field name.
   // HGETALL returns array of [key1, value1, key2, value2... ].
   if ( argv.length !==0 ) {
      // Filter out unwanted properties. 
      docs = filterProperties(convertNestedToObjectsWithScore(result), argv)
   }
   else {
      docs = convertNestedToObjectsWithScore(result)
   }
   // Update `visited` field
   const promises = [];    // Collect promises 
   docs.forEach(doc => { 
         const docKey = getDocumentKeyName(doc.id)
         const now = new Date(); 
         const isoDate = now.toISOString(); 

         // Use transaction to update document
         promises.push( 
                        redis.multi()
                        .hIncrBy(docKey, 'visited', 1)
                        .hSet(docKey, 'updatedAt', isoDate)
                        .hIncrBy(docKey, 'updateIdent', 1)
                        .exec()
            )
         // Do misc housekeeping 
         promises.push(
            zAddIncr( getVisitedKeyName(), docKey )
         )
        })
   await Promise.all(promises); // Resolve all at once
   
   return docs
}

/*

*/
export async function getDocument(id) { 
  /* HGETALL fts:chinese:documents:31 */
   return await redis.hGetAll(getDocumentKeyName(id))
 }

 export async function getStatus() { 
    const { redisVersion, luaVersion } = await getRedisVersions()
    const [docCount, docSize ] = await countKeys(getDocumentKeyName(''))
    const [tokenCount, tokenSize ] = await countKeys(getTokenKeyName(''))
    const results = await getVisitedDocuments(getVisitedKeyName(), 0, process.env.MAX_STATS_RETURN)
    
    return { 
       version: redisVersion,
       lua: luaVersion, 
       documents: docCount,
       docSize: Number(docSize / 1024 / 1024).toFixed(2), 
       tokens: tokenCount, 
       tokenSize: Number(tokenSize / 1024 / 1024).toFixed(2), 
       visited: results.length, 
       results
    };
  }

  /**
   * Retrieves the Redis server version and infers the embedded Lua interpreter version.
   *
   * @returns {Promise<{ redisVersion: string, luaVersion: string }>} An object containing Redis and Lua version.
   */
  export async function getRedisVersions() {
    const redisVersion = await redis.eval("return redis.REDIS_VERSION");
    const libs = await redis.eval(`
                                    local libs = {}
                                    for k, v in pairs(_G) do
                                    table.insert(libs, k)
                                    end
                                    return libs`
                                 )
    
    let luaVersion = 'Unknown';
    if (redisVersion !== 'Unknown') {
      const [major, minor] = redisVersion.split('.').map(Number);
      
      // Redis 2.6.13+ uses Lua 5.1.5; older versions use Lua 5.1.4
      luaVersion = (major > 2 || (major === 2 && minor >= 13)) ? '5.1.5' : '5.1.4';
    }
  
    return { redisVersion, luaVersion, libs };
  }

/*
   Twisting utilities 

   “Even the straightest road has its twist.”
*/   

/**
 * Converts a nested array of entries into an array of structured objects.
 * 
 * Each entry is expected to contain:
 * - A flat array of key-value pairs (e.g., ['id', '123', 'textChi', '...'])
 * - A numeric value (e.g., a score) associated with the entry
 * 
 * The function transforms each entry into an object with fields derived from the key-value pairs,
 * and adds a `score` field based on the accompanying numeric value.
 * 
 * @param {Array} nestedArray - An array of entries, where each entry is a 2-element array:
 *   [flatKeyValueArray, score]
 * @returns {Array<Object>} A new array of objects, each with structured fields and a `score` property
 * 
 * @example
 * const input = [
 *   [['id', '59', 'textChi', '...', 'visited', '0'], 3],
 *   [['id', '61', 'textChi', '...', 'visited', '1'], 2]
 * ];
 * 
 * const result = convertNestedToObjectsWithScore(input);
 * console.log(result);
 * // [
 * //   { id: '59', textChi: '...', visited: '0', score: 3 },
 * //   { id: '61', textChi: '...', visited: '1', score: 2 }
 * // ]
 */
function convertNestedToObjectsWithScore(nestedArray) {
   return nestedArray.map(entry => {
     const flat = entry[0];  // key-value pairs
     const score = entry[1]; // numeric value
     const obj = {};
 
     for (let i = 0; i < flat.length; i += 2) {
       obj[flat[i]] = flat[i + 1];
     }
 
     obj.score = score; // Add the score field
     return obj;
   });
 }

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

/**
 * Filters specific properties from each object in the input array.
 *
 * Iterates through the `data` array and returns a new array of objects,
 * each containing only the key-value pairs whose keys are listed in `allowedKeys`.
 *
 * @param {Array<Object>} data - An array of objects to be filtered.
 * @param {Array<string>} allowedKeys - A list of keys to retain in each object.
 * @returns {Array<Object>} A new array with filtered objects containing only the allowed keys.
 */
function filterProperties(data, allowedKeys) {
   return data.map(item => {
     const filtered = {};
     for (const key of allowedKeys) {
       if (key in item) {
         filtered[key] = item[key];
       }
     }
     return filtered;
   });
 }