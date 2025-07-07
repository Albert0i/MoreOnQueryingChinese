import { redis } from './redis/redis.js'
await redis.connect();

export async function scanTextChi(pattern) {
  let counter = 0; 
  let cursor = '0';
  let keys = []
  const matched = [];

  do {
    const result = await redis.scan(cursor, {
      MATCH: 'fts:chinese:documents:*',
      COUNT: 100, // adjust batch size as needed
    });

    cursor = result.cursor;
    keys = result.keys;

    for (const key of keys) {
      const text = await redis.hGet(key, 'textChi');
      if (text && text.includes(pattern)) {
        matched.push({ key, textChi: text });
      }
      counter = counter + 1
    }
  } while (cursor !== '0');
  console.log(`Scan completed ${counter} documents.`)

  return matched;
}

/*
   main
*/
console.log(await scanTextChi('人口'))

await redis.close()
process.exit()