import { redis } from './redis/redis.js'

const luaScript = `
  local libs = {}
for k, v in pairs(_G) do
  table.insert(libs, k)
end
return libs


`;

await redis.connect()
//const result = await redis.eval("return redis.REDIS_VERSION");
const result = await redis.eval(luaScript);
console.log(result)
await redis.close()
