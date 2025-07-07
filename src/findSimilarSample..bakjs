
import 'dotenv/config'
import {fileURLToPath} from "url";
import path from "path";
import { getLlama } from 'node-llama-cpp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

//const llama = await getLlama();
// - Optional: Enable debug logging to confirm the backend version
const llama = await getLlama({ debug: true });
const model = await llama.loadModel({
    modelPath: path.join(__dirname, "models", process.env.MODEL_NAME),
    eosTokenId: 128001 // Adjust based on tokenizer config
  });
const context = await model.createEmbeddingContext();

const wordsToRemove = ["的", "了"]

function removeWords(text, wordsToRemove) {
    const pattern = new RegExp(wordsToRemove.join('|'), 'g'); // Create regex pattern
    return text.replace(pattern, '');
}

async function embedDocuments(documents) {
    const embeddings = new Map();

    await Promise.all(
        documents.map(async (document) => {
            //const embedding = await context.getEmbeddingFor(document);
            const embedding = await context.getEmbeddingFor(removeWords(document, wordsToRemove));

            embeddings.set(document, embedding);

            console.debug(
                `${embeddings.size}/${documents.length} documents embedded`
            );
        })
    );

    return embeddings;
}

function findSimilarDocuments(embedding, documentEmbeddings) {
    const similarities = new Map();
    for (const [otherDocument, otherDocumentEmbedding] of documentEmbeddings)
        similarities.set(
            otherDocument,
            embedding.calculateCosineSimilarity(otherDocumentEmbedding)
        );

    return Array.from(similarities.keys())
        .sort((a, b) => similarities.get(b) - similarities.get(a));
}

// const documentEmbeddings = await embedDocuments([
//     "The sky is clear and blue today",
//     "I love eating pizza with extra cheese",
//     "Dogs love to play fetch with their owners",
//     "The capital of France is Paris",
//     "Drinking water is important for staying hydrated",
//     "Mount Everest is the tallest mountain in the world",
//     "A warm cup of tea is perfect for a cold winter day",
//     "Painting is a form of creative expression",
//     "Not all the things that shine are made of gold",
//     "Cleaning the house is a good way to keep it tidy"
// ]);

const documentEmbeddings = await embedDocuments([
    "今天的天空晴朗且蔚藍",
    "我喜歡吃加了額外起司的披薩",
    "狗狗喜歡和主人玩接球遊戲",
    "法國的首都是巴黎",
    "喝水對保持身體水分很重要",
    "聖母峰是世界上最高的山",
    "寒冷的冬天來一杯溫暖的茶最合適",
    "繪畫是一種創意表達的方式",
    "並非所有閃亮的東西都是黃金製成",
    "打掃房子是保持整潔的好方法"
]);

//const query = "What is the tallest mountain on Earth?";
const query = removeWords("地球上最高的山是什麼？", wordsToRemove);

const queryEmbedding = await context.getEmbeddingFor(query);

const similarDocuments = findSimilarDocuments(
    queryEmbedding,
    documentEmbeddings
);
const topSimilarDocument = similarDocuments[0];

console.log("query:", query);
console.log("Document:", topSimilarDocument);

/*
   Using Embedding
   https://github.com/withcatai/node-llama-cpp/blob/master/docs/guide/embedding.md

   This example will produce this output:

   query: What is the tallest mountain on Earth?
   Document: Mount Everest is the tallest mountain in the world
   This example uses `bge-small-en-v1.5-q8_0.gguf`

   query: 地球上最高的山是什麼？
   Document: 法國的首都是巴黎
   This example uses `ggml-model-q8_0.gguf`

   query: 地球上最高的山是什麼？
   Document: 法國的首都是巴黎
   This example uses `ggml-model-q4_k.gguf`

   query: 地球上最高山是什麼？
   Document: 打掃房子是保持整潔的好方法
   This example uses `ggml-model-q2_k.gguf`
*/
/*
   Using Embedding
   https://github.com/withcatai/node-llama-cpp/blob/master/docs/guide/embedding.md

   chinese-llama-2-7b-gguf 
   https://huggingface.co/hfl/chinese-llama-2-7b-gguf/tree/main
*/