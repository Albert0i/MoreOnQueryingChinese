--[[
  Lua script to scan Redis for hashes matching "document:*"
  and return HASH objects whose "textChi" field contains a given pattern.

  Parameters:
    KEYS[1] - Key pattern to scan for, "documents:" for example;
    KEYS[2] - Field name to scan for, "textChi" for example;
    KEYS[3] - Value to scan for, "韓非子" for example; 
    ARGV[1] - Fields to be returned, ["id", "textChi", "visited"] for example.

  Returns:
    Array of array contains the search pattern.
--]]
local cursor = "0"
local result = {}
local index = 1

repeat
  local scan = redis.call("SCAN", cursor, "MATCH", KEYS[1], "COUNT", 100)
  -- "scan" returns [cursor, keys] 
  cursor = scan[1]
  local keys = scan[2]

  for _, key in ipairs(keys) do
    local text = redis.call("HGET", key, KEYS[2])
    
    if text and string.find(text, KEYS[3]) then 
      result[index] = redis.call("HMGET", key, unpack(ARGV))
      index = index + 1
    end
  end
until cursor == "0"

return result
-- return { index - 1, result }
