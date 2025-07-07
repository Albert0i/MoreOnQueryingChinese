import 'dotenv/config'
import express from 'express';

import { countDocuments, findDocuments, getStatus, getDocument } from '../util/redisHelper.js'

const router = express.Router();

// POST /api/v1/search
router.post('/search', async (req, res) => {  
  const { query } = req.body;
  const results = await findDocuments(query, 0, process.env.MAX_FIND_RETURN)
  
  res.status(200).json(results)
})

// GET /api/v1/ftcheck
router.get('/ftcheck', async (req, res) => {  
  const { query } = req.query
  const count = await countDocuments(query)
  
  res.status(200).json({ success: true, count })
})

// GET /api/v1/details?id=xxx
router.get('/details', async (req, res) => {
  const id = parseInt(req.query.id, 10);

  res.status(200).json(await getDocument(id))
});

// GET /api/v1/stats
router.get('/stats', async (req, res) => {
  res.status(200).json(await getStatus())
});

export default router;
