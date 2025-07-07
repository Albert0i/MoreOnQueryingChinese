import readline from 'readline';
import { findSimilarDocuments } from './embedder.js';

/*
   main 
*/
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const promptUser = async() => {
    rl.question("query: ", async (query) => {
        const docs = await findSimilarDocuments(query, 5);

        console.log("Documents: ")
        docs.forEach(doc => console.log(doc))

        if (query.toLowerCase() === "exit") {            
            console.log("Bye bye!");
            rl.close();
        } else {
            promptUser(); // Recursively calls itself for continuous input
        }
    });
};

promptUser()

/*
   地球上最高的山是什麼？
   少年十五二十時
   駑馬十駕功在不舍
   吃飽飯飲什麼
   聽雨聲由遠漸近，是愛人溫柔的呼喚...
   雷電是愛人分手的咆哮。
   讀寫中文其實很困難，不是嗎？
   告訴我，你是外國人，為什麼你會明白中文？
   中文查找的結果強差人意！

   我唔知你係真明定假明...
   天氣這麼壞，不要外出。
   問君能有幾多愁？
   人老了，思想就開始保守。
   人窮志短，貧窮限制了想像。
   我很累，很想休息。其他工作就交畀你做。
   炊煙四起人未歸。
   一曲新詞酒一杯。
   十年人事幾翻新。
   學而時習之，不亦說乎？
   工作的目的是充實自己，金錢是其次。
*/