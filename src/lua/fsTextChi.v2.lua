--[[
  Lua script uses ZINTERSTORE to calculate hashes matching "document:*"
  and return HASH objects.

  Parameters:
    KEYS[1] - Field name contains the text, "textChi" for example;
    KEYS[2] - Value contained, "韓非子" for example; 
    KEYS[3] - The number of documents to skip, '0' for example; 
    KEYS[4] - The maximum number of documents to return, '10' for example; 
    ARGV[]  - list of source keys, ["fts:chinese:tokens:世", "fts:chinese:tokens:界"] for example.

  Returns:
    Array of array contains the documents.
--]]
local offset = tonumber(KEYS[3])
local limit = tonumber(KEYS[4])

local matched = {}  -- result to be returned 
local index = 1     -- index to place retrieved value

local tempkey = 'temp:'..KEYS[2]  -- destination key
local tempkeyTTL = 30             -- delete after n seconds 
local args = {}
table.insert(args, tempkey)       -- destination key
table.insert(args, #ARGV)         -- number of source keys

for i = 1, #ARGV do
  table.insert(args, ARGV[i])     -- source keys
end

-- Optional: aggregation and scores
table.insert(args, 'AGGREGATE')
table.insert(args, 'MIN')

local n = redis.call('ZINTERSTORE', unpack(args))
redis.call('EXPIRE', tempkey, tempkeyTTL)   -- delete after n seconds 

-- If result is not empty 
if ( n > 0 ) then 
  -- ZREVRANGEBYSCORE "fts:chinese:tokens:世界" +inf -inf WITHSCOREs LIMIT 0 10
  local z = redis.call('ZREVRANGEBYSCORE', tempkey, '+inf', '-inf', 'WITHSCORES', 'LIMIT', offset, limit)
  -- Example result: { "userA", "42", "userB", "37", "userC", "29" }
  for i = 1, #z, 2 do
    local key = z[i]
    local score = tonumber(z[i + 1])

    -- Get the field value to inspect 
    local text = redis.call("HGET", key, KEYS[1])

    -- If found and contains the value
    if (text) and (string.find(text, KEYS[2])) then     
      matched[index] = { redis.call("HGETALL", key), score }
      
      -- Increase the index
      index = index + 1
    end
  end
end

return matched
