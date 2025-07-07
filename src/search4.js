import fs from 'node:fs';
import path from 'node:path';
import { redis } from './redis/redis.js'
await redis.connect();

// 
const filePath = path.join('.', 'src', 'lua', 'scanTextChi.lua');
const luaScript = fs.readFileSync(filePath, 'utf8');
const sha = await redis.scriptLoad(luaScript);

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
to 
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
to 
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
   main 
*/
// const result = await redis.evalSha(sha, {
//     keys: [ "fts:chinese:documents:*", 'textChi', '人口' ], // keys and pattern used in this script
//     //arguments: [ 'id', 'textChi', 'visited' ] // Fields to return in this script
//     arguments: [ '*' ] // Fields to return in this script
//   });
//const fieldNames = ["id", "textChi", "createdAt"]
const result = await scanDocuments("fts:chinese:documents:*", "textChi", "人口") 
console.log(result); // matched keys like ['document:123', 'document:456']

//console.log(twist(fieldNames, arrayOfArray))

await redis.close()
process.exit()

