### RedisScanSearch

scrape crumb from previous project.

What is different in RDBMS is easy in Redis; what is easy in RDBMS is difficult in Redis. 

#### Prologue
peculiarity and semantic ambiguity. 

#### I. A taxonomy (TL;DR)
According to my unofficial and incomplete understanding, Chinese is *roughly* divided into three classes: 

1. Ancient Chinese - 古文 or 文言文. Language used in major works written thousands of years ago. For example in [左傳‧宣公二年](https://ctext.org/chun-qiu-zuo-zhuan/xuan-gong/zh): 
> 晉靈公不君，厚斂以彫牆，從臺上彈人，而觀其辟丸也，宰夫胹熊蹯不熟，殺之，寘諸畚，使婦人載以過朝，趙盾，士季，見其手，問其故，而患之，將諫，士季曰，諫而不入，則莫之繼也，會請先，不入，則子繼之，三進及溜，而後視之，曰，吾知所過矣，將改之。稽首而對曰，人誰無過，過而能改，善莫大焉。《詩》曰：『靡不有初，鮮克有終』，夫如是，則能補過者鮮矣。君能有終，則社稷之固也，豈惟群臣賴之，又曰，袞職有闕，惟仲山甫補之，能補過也。君能補過，袞不廢矣。猶不改，宣子驟諫，公患之，使鉏麑賊之，晨往，寢門闢矣，盛服將朝，尚早，坐而假寐，麑退，歎而言曰，不忘恭敬，民之主也，賊民之主，不忠，棄君之命，不信，有一於此，不如死也，觸槐而死。

2. Classic Chinese - 白話文. Language used until mid-20th century. For example in [聽聽那冷雨‧余光中](https://www.fengtipoeticclub.com/02Fengti/Yuguangzhong/Yuguangzhong-e005.html): 
> 驚蟄一過，春寒加劇。先是料料峭峭，繼而雨季開始，時而淋淋漓漓，時而淅淅瀝瀝，天潮潮地濕濕，即連在夢裡，也似乎有把傘撐著。而就憑一把傘，躲過一陣瀟瀟的冷雨，也躲不過整個雨季。連思想也都是潮潤潤的。每天回家，曲折穿過金門街到廈門街迷宮式的長巷短巷，雨裡風裡，走入霏霏令人更想入非非。想這樣子的台北凄凄切切完全是黑白片的味道，想整個中國整部中國的歷史無非是一張黑白片子，片頭到片尾，一直是這樣下著雨的。這種感覺，不知道是不是從安東尼奧尼那裡來的。不過那—塊土地是久違了，二十五年，四分之一的世紀，即使有雨，也隔著千山萬山，千傘萬傘。二十五年，一切都斷了，只有氣候，只有氣象報告還牽連在一起，大寒流從那塊土地上彌天卷來，這種酷冷吾與古大陸分擔。不能撲進她懷裡，被她的裾邊掃一掃吧也算是安慰孺慕之情。……

3. Contemporary Chinese - 現代漢語. Language used in day-to-day life. For example in [在長官威權管治下澳門融入大灣區的新前景](https://aamacau.com/2025/07/06/zai-zhang-guan-wei-quan-guan-z/): 
> 上屆政府要建立讓青年一代有望置業上流的房屋階梯在維護權貴手上過萬待售豪宅的壓力下面臨變策崩折，而澳門居民充份就業的機會又在社區經濟受北上消費打擊，賭業貴賓廳及衛星場先後終結，加上外僱持續過量致漸入困境。現屆政府半年來屢發新聞稿顯示已聽取各方意見後，制定2025施政方針，但在政策取向上卻是房屋階梯可以消失，而青年被鼓勵上大灣區就業。沒有魄力削六大博企外僱比例速助本地居民就業，反而以18個月每月五千澳門元（下同）資助青年北上就業，但卻沒有機制應付18個月後停資助的壓力陷阱。

[中國哲學書電子化計劃](https://ctext.org/zh)
[粵語審音配詞字庫](https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/)
[王左中右｜中文大约的确已经死了](https://chinadigitaltimes.net/chinese/681744.html)


#### II. The problem of Chinese (TL;DR)
Due to high structural complexity and intrinsic ambiguity of Chinese, sentences tend to be elusive. For example: 
-「兒子生性病母倍感安慰。」
-「下雨天，留客天，天留我不留。」

As a more involved example in [粵劇名作欣賞-《洛神》研討會節錄](https://www.edb.gov.hk/attachment/tc/curriculum-development/kla/arts-edu/resources/mus-curri/com_masterwork3.pdf), ambiguity appears only when it is enunciated and properly delimited. 
-「新君雖痛改前非，懷念手足憐弟寂寞，要歸藩承命排紛解難，保平安。」
-「新君雖痛改，全非懷念手足。憐弟植，莫要歸藩承命。排紛解，難保平安。」

「前」and「全」;「寂」and 「植」;「寞」and「莫」are the same or extremely similar in pronunciation but have different meaning. 

Chinese sentence has no space or whatsoever in between, **tokenization** is NOT crucial but fatal in working out the semantic. All chinese tokenizer works with a dictionary of some kind. This will greatly influence the accuracy of Fulltext Search as well as Vector Semantic Search. As you may know tokenization is the first step in  vectorization. 

Redis supports Fulltext Search in Chinese out of the box but may not yield a satisfied outcome. For example in: 
```
"韓非子曰：『治國之法，必先明法；明法而後，方可用人。』故用人之際，必須依據法度，若無法度，則人心難以安定，國家亦難以長治。",
. . . 
```
Nine sentences either begin with "韓非子曰" or "韓非子認為" or "韓非子強調". To create index with: 
```
FT.CREATE fts:chinese:index 
    ON HASH PREFIX 1 fts:chinese:document: LANGUAGE chinese 
    SCHEMA 
    id NUMERIC SORTABLE 
    textChi TEXT WEIGHT 1.0 SORTABLE     
    visited NUMERIC SORTABLE 
    createdAt TAG SORTABLE 
    updatedAt TAG SORTABLE 
    updateIdent NUMERIC SORTABLE 
```

To search with: 
```
> FT.SEARCH fts:chinese:index 韓非子 NOCONTENT
1) "4"
2) "fts:chinese:documents:465"
3) "fts:chinese:documents:470"
4) "fts:chinese:documents:482"
5) "fts:chinese:documents:476"

> FT.SEARCH fts:chinese:index 韓非 NOCONTENT
1) "5"
2) "fts:chinese:documents:473"
3) "fts:chinese:documents:479"
4) "fts:chinese:documents:463"
5) "fts:chinese:documents:468"
6) "fts:chinese:documents:484"


> FT.SEARCH fts:chinese:index 子曰 NOCONTENT
1) "5"
2) "fts:chinese:documents:473"
3) "fts:chinese:documents:479"
4) "fts:chinese:documents:463"
5) "fts:chinese:documents:468"
6) "fts:chinese:documents:484"

> FT.SEARCH fts:chinese:index 韓 NOCONTENT
1) "2"
2) "fts:chinese:documents:449"
3) "fts:chinese:documents:454"

> FT.SEARCH fts:chinese:index 非 NOCONTENT
1) "2"
2) "fts:chinese:documents:510"
3) "fts:chinese:documents:300"

> FT.SEARCH fts:chinese:index 子 NOCONTENT
1) "0"
```

In some sentences, "韓非子" is a token; While in other sentences, "韓非" and "子曰" tokens. "韓" and "非" are also tokens but not "子", most likely "子" is considered as stop word by tokenizer. 


#### III. Object Inspection 

#### IV. Faceted Search 

#### V. 

#### Epilogue 

### EOF (2025/07/31)

「」
「」
「」
「」
「」