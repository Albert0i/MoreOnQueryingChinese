import 'dotenv/config'
import express from 'express';

import { fsDocumentsV2 as fsDocuments, getTokenKeyName, countDocuments, getDocument } from '../util/redisHelper.js'

const router = express.Router();

// POST /api/v1/search
router.post('/search', async (req, res) => {  
  const { query } = req.body;
  const results = await fsDocuments(getTokenKeyName(''), "textChi", query, 0, process.env.MAX_FIND_RETURN, "id", "textChi", "score") 
  
  res.status(200).json(results)
})

// GET /api/v1/check
router.get('/check', async (req, res) => {  
  const { query } = req.query
  const results = await fsDocuments(getTokenKeyName(''), "textChi", query, 0, process.env.MAX_FIND_RETURN, "id", "textChi", "score") 
  
  res.status(200).json({ success: true, count: results.length })
})

// GET /api/v1/details?id=xxx
router.get('/details', async (req, res) => {
  const id = parseInt(req.query.id, 10);

  res.status(200).json(await getDocument(id))
});

export default router;
