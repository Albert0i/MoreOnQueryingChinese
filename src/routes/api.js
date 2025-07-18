import 'dotenv/config'
import express from 'express';

import { scanDocuments, fsDocumentsV2 as fsDocuments, getDocumentKeyName, getTokenKeyName, getDocument, getStatus } from '../util/redisHelper.js'

const router = express.Router();

// POST /api/v1/search
router.post('/search', async (req, res) => {  
  const { query, fulltext } = req.body;
  console.log('query =', query, ', fulltext =', fulltext)

  let results = []
  if (toBoolean(fulltext)) {
    console.log('Search using Faceted Search, query =', query, ', fulltext = ',fulltext)
    results = await fsDocuments(getTokenKeyName(''), "textChi", query, 0, 9999, "id", "textChi", "score") 
  } else {
    console.log('Search using Document Scan, query =', query, ', fulltext = ',fulltext)
    results = await scanDocuments(getDocumentKeyName(''), "key", query, 0, 9999, "id", "textChi", "score") 
  }
  
  res.status(200).json(results)
})

// GET /api/v1/check
router.get('/check', async (req, res) => {  
  const { query, fulltext } = req.query

  let results = []
  if (toBoolean(fulltext)) {
    console.log('Check using Faceted Search, query =', query, ', fulltext = ',fulltext)
    results = await fsDocuments(getTokenKeyName(''), "textChi", query, 0, 9999, "id") 
  } else {
    console.log('Check using Document Scan, query =', query, ', fulltext = ',fulltext)
    results = await scanDocuments(getDocumentKeyName(''), "key", query, 0, 9999, "id") 
  }

  res.status(200).json({ success: true, count: results.length })
})

// GET /api/v1/stats
router.get('/stats', async (req, res) => {
  res.status(200).json(await getStatus())
});

// GET /api/v1/details?id=xxx
router.get('/details', async (req, res) => {
  const id = parseInt(req.query.id, 10);

  res.status(200).json(await getDocument(id))
});

function toBoolean(value) {
  return String(value).toLowerCase().trim() === 'true' || 
         String(value).toLowerCase().trim() === 'on';
}

export default router;
