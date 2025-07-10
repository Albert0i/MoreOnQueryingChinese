import 'dotenv/config'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/index.js';
import apiRouter from './routes/api.js';
import { handle404 } from './middleware/handle404.js'
import { redis } from './redis/redis.js'
import { loadScript } from './util/redisHelper.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Enable JSON & form data parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use router
app.use('/', router);
app.use('/api/v1', apiRouter);

// 404 handler (keep this LAST)
app.use(handle404);

// Start server
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

await redis.connect()
await loadScript()
app.listen(PORT, () => {
        console.log(`🔷 [🚀] Server running at 🌍 http://${HOST}:${PORT} 🔷`);
    } ).on('error', (error) => {
        throw new Error(error.message)
    } );

process.on('SIGINT', async () => {
    await redis.close()
    console.log('🛑 Caught Ctrl+C (SIGINT). Cleaning up...');
    // Perform cleanup here (e.g., close DB, stop server)
    process.exit(0); // Exit gracefully
});