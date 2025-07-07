
function func(a, b, c, ... argv) {
  console.log('a =', a, ', b = ', b, ', c = ', c)
  console.log('argv =', argv)
}

//func(1,2,3,4,5,6)
//func('apple', 'banana', 'orange', 'egg', "cup", 'bang')
func()

// import 'dotenv/config'
// import { createClient } from 'redis';

// import redis from 'redis';

// const { SchemaFieldTypes } = redis;

// console.log('SchemaFieldTypes =', SchemaFieldTypes)

// const redisC = createClient({ 
//     socket: {
//         port: process.env.REDIS_PORT,       // Redis port
//         host: process.env.REDIS_HOST,       // Redis host            
//     }, 
//     password: process.env.REDIS_PASSWORD,   // Redis password 
// });
// await redisC.connect();

// // Define the index schema
// await redisC.ft.create('docIdx', {
//   textChi: {
//     type: 'TEXT', 
//     sortable: true
//   },
//   author: {
//     type: 'TEXT'
//   },
//   year: {
//     type: 'NUMERIC'
//   }
// }, {
//   ON: 'HASH',
//   PREFIX: 'document:',
//   LANGUAGE: 'chinese'
// });

// await redisC.close()