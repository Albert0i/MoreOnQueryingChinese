import { redis } from './redis/redis.js'
await redis.connect();

const luaScript = `
  local cursor = "0"
  local result = {}
  local match = ARGV[1]
  local index = 1

  repeat
    local scan = redis.call("SCAN", cursor, "MATCH", "fts:chinese:documents:*", "COUNT", 100)
    cursor = scan[1]
    local keys = scan[2]

    for _, key in ipairs(keys) do
      local text = redis.call("HGET", key, "textChi")
      if text and string.find(text, match) then
        result[index] = redis.call("HGETALL", key)
        index = index + 1
      end
    end
  until cursor == "0"

  return result
`;

/*
   main 
*/
const matchedKeys = await redis.eval(luaScript, {
    arguments: ['人口'] // your pattern here
  });
  
console.log(matchedKeys);  

await redis.close()
process.exit()
