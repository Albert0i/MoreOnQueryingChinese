import { redis } from './redis/redis.js'
import { readFile } from 'fs/promises';

async function parseHSetFile(filePath) {
  const text = await readFile(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);

  const result = [];

  for (const line of lines) {
    // Match HSET "KEY" FIELD "VALUE"
    const match = line.match(/HSET\s+"([^"]+)"\s+(\w+)\s+"([\s\S]+?)"/);
    if (match) {
      const [, key, field, value] = match;
      result.push({
        key,
        [field]: value,
      });
    }
  }

  return result;
}

/*
   main
*/
await redis.connect();

const results = await parseHSetFile('./data/output.redis');
results.forEach( result => {
    //console.log(result)
    console.log(`"${result.key.replace('DONGDICT:', '')} <br /> ${result.description}", `)
})
console.log(results.length)

await redis.close()
process.exit()
