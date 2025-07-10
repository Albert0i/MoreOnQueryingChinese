### More On Querying Chinese (cont.)

#### Prologue 

#### I. The missing score
```
ZINTER 2 "fts:chinese:tokens:世" "fts:chinese:tokens:界"  AGGREGATE MIN WITHSCORES

ZINTERSTORE "fts:chinese:tokens:世界" 2 "fts:chinese:tokens:世" "fts:chinese:tokens:界"  AGGREGATE MIN

ZREVRANGEBYSCORE "fts:chinese:tokens:世界" +inf -inf WITHSCOREs LIMIT 0 10

HGETALL ""fts:chinese:documents:59""

```
#### II. 

#### III. 

#### Epilogue 

### EOF (2025/07/18)
```
ZINTER 3 "fts:chinese:tokens:韓" "fts:chinese:tokens:非" "fts:chinese:tokens:子" AGGREGATE MIN WITHSCORES
```

peculiarity and semantic ambiguity. 
scrape crumb from previous project.
