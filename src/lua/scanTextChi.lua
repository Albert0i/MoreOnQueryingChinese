--[[
  Lua script to scan Redis for hashes matching "document:*"
  and return HASH objects.

  Parameters:
    KEYS[1] - Key pattern to scan for, "documents:" for example;
    KEYS[2] - Field name to scan for, "textChi" for example;
    KEYS[3] - Value to scan for, "韓非子" for example; 
    KEYS[4] - The number of documents to skip, '0' for example; 
    KEYS[5] - The maximum number of documents to return, '10' for example; 
    ARGV[] - Fields to be returned, ["id", "textChi", "visited"] for example.

  Returns:
    Array of array contains the documents.
--]]
local offset = tonumber(KEYS[4])
local limit = tonumber(KEYS[5])

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
    if (text) and (string.find(text, KEYS[3])) then 
      -- Skip offset 
      if offset > 0 then 
        offset = offset - 1
      else 
        -- Take limit 
        if limit > 0 then 
          -- If no field names specified to return 
          if ARGV[1] == "*" then
            matched[index] = redis.call("HGETALL", key)
          else        
            matched[index] = redis.call("HMGET", key, unpack(ARGV))
          end

          -- Increase the index 
          index = index + 1
          -- Decrease the limit
          limit = limit - 1
        else 
          -- Readhed limit before scan completed
          return matched
        end 
      end 
    end 
  end
until (cursor == "0") -- Loop until no more keys found

-- Scan completed
return matched
