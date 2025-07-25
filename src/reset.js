import { redis } from './redis/redis.js'

export async function resetDocuments() {
  let counter = 0; 
  let cursor = '0';
  let keys = []

  do {
    const result = await redis.scan(cursor, {
      MATCH: 'fts:chinese:documents:*',
      COUNT: 100, // adjust batch size as needed
    });

    cursor = result.cursor;
    keys = result.keys;

    for (const key of keys) {
        redis.hSet(key, {
                visited:   0, 
                updatedAt: "", 
                updateIdent: 0
            } )
      counter = counter + 1
    }
  } while (cursor !== '0');
  console.log(`Scan completed ${counter} documents.`)

  return counter;
}

/*
   main
*/
await redis.connect();

await resetDocuments()
await redis.del("fts:chinese:visited")

await redis.close()
process.exit()

/*
> FT.SEARCH fts:chinese:index 韓非子 NOCONTENT
1) "4"
2) "fts:chinese:documents:465"
3) "fts:chinese:documents:470"
4) "fts:chinese:documents:482"
5) "fts:chinese:documents:476"

> FT.SEARCH fts:chinese:index 韓非 NOCONTENT
1) "5"
2) "fts:chinese:documents:473"
3) "fts:chinese:documents:479"
4) "fts:chinese:documents:463"
5) "fts:chinese:documents:468"
6) "fts:chinese:documents:484"


> FT.SEARCH fts:chinese:index 子曰 NOCONTENT
1) "5"
2) "fts:chinese:documents:473"
3) "fts:chinese:documents:479"
4) "fts:chinese:documents:463"
5) "fts:chinese:documents:468"
6) "fts:chinese:documents:484"

> FT.SEARCH fts:chinese:index 韓 NOCONTENT
1) "2"
2) "fts:chinese:documents:449"
3) "fts:chinese:documents:454"

> FT.SEARCH fts:chinese:index 非 NOCONTENT
1) "2"
2) "fts:chinese:documents:510"
3) "fts:chinese:documents:300"

> FT.SEARCH fts:chinese:index 子 NOCONTENT
1) "0"
*/
