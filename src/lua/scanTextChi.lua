--[[
  Lua script to scan Redis for hashes matching "document:*"
  and return HASH objects whose "textChi" field contains a given pattern.

  Parameters:
    KEYS[1] - Key pattern to scan for, "documents:" for example;
    KEYS[2] - Field name to scan for, "textChi" for example;
    KEYS[3] - Value to scan for, "韓非子" for example; 
    ARGV[] - Fields to be returned, ["id", "textChi", "visited"] for example.

  Returns:
    Array of array contains the search pattern.
--]]
local cursor = "0"  -- the cursor.
local matched = {}  -- result to be returned 
local index = 1     -- index to place retrieved value

repeat
  local scan = redis.call("SCAN", cursor, "MATCH", KEYS[1], "COUNT", 100)
  -- "scan" returns [cursor, keys] 
  cursor = scan[1]
  local keys = scan[2]

  for _, key in ipairs(keys) do
    -- Get the field value to inspect 
    local text = redis.call("HGET", key, KEYS[2])
    
    -- If found and contains the value
    if text and string.find(text, KEYS[3]) then 
      -- If no field names specified to return 
      if ARGV[1] == "*" then
        matched[index] = redis.call("HGETALL", key)
      else        
        matched[index] = redis.call("HMGET", key, unpack(ARGV))
      end
      -- Increase the index 
      index = index + 1
    end 
  end
until cursor == "0" -- Loop until no more keys found

return matched
