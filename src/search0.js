import { redis } from './redis/redis.js'
await redis.connect();

/*
   main
*/
const result = await redis.ft.search("fts:chinese:index", "人口")

result.documents.map(document => {
    console.log(document)
})

await redis.close()
process.exit()