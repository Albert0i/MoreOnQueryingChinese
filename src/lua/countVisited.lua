-- KEYS[1] = key prefix pattern (e.g., "doc:*")
-- KEYS[2] = field name to test (e.g., "visited")
-- KEYS[3] = value to compare against (e.g., "0")
-- ARGV = list of fields to return (e.g., { "id", "textChi", "visited" })

local cursor = "0"
local matched = {}  -- result to be returned 
local index = 1     -- index to place retrieved value

repeat
  local scan = redis.call("SCAN", cursor, "MATCH", KEYS[1], "COUNT", 1000)
  -- "scan" returns [cursor, keys] 
  cursor = scan[1]
  local keys = scan[2]

  for _, key in ipairs(keys) do
    -- Get the field value to inspect 
    local text = redis.call("HGET", key, KEYS[2])

    if text and text ~= KEYS[3] then      
      matched[index] = redis.call("HMGET", key, unpack(ARGV))

      -- Increase the index
      index = index + 1
    end
  end
until cursor == "0" -- Loop until no more keys found

-- Scan completed
return matched