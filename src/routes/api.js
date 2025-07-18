import 'dotenv/config'
import express from 'express';
import { performance } from 'perf_hooks';

import { scanDocuments, fsDocumentsV2 as fsDocuments, getDocumentKeyName, getTokenKeyName, getDocument, getStatus, updateDocuments } from '../util/redisHelper.js'

const router = express.Router();

// POST /api/v1/search
router.post('/search', async (req, res) => {  
  const { query, fulltext } = req.body;

  let results = []
  // Measure fsDocuments and scanDocuments
  const startFetch = performance.now();

  if (toBoolean(fulltext)) {
    console.log('fsDocuments, query =', query, ', fulltext = ',fulltext)
    results = await fsDocuments(getTokenKeyName(''), "textChi", query, 0, 9999, "id", "textChi", "score") 
  } else {
    console.log('scanDocuments, query =', query, ', fulltext = ',fulltext)
    results = await scanDocuments(getDocumentKeyName(''), "key", query, 0, 9999, "id", "textChi", "score") 
  }
  const durationFetch  = performance.now() - startFetch;
  console.log(`Took ${durationFetch.toFixed(2)} ms`);
  
  // Measure updateDocuments
  const startUpdate = performance.now();
  await updateDocuments(results);
  const durationUpdate = performance.now() - startUpdate;
  console.log(`updateDocuments() took ${durationUpdate.toFixed(2)} ms`);

  res.status(200).json(results)
})

// GET /api/v1/check
router.get('/check', async (req, res) => {  
  const { query, fulltext } = req.query

  let results = []
  // Measure fsDocuments and scanDocuments
  const startFetch = performance.now();

  if (toBoolean(fulltext)) {
    console.log('fsDocuments, query =', query, ', fulltext = ',fulltext)
    results = await fsDocuments(getTokenKeyName(''), "textChi", query, 0, 9999, "id") 
  } else {
    console.log('scanDocuments, query =', query, ', fulltext = ',fulltext)
    results = await scanDocuments(getDocumentKeyName(''), "key", query, 0, 9999, "id") 
  }
  const durationFetch  = performance.now() - startFetch;
  console.log(`Took ${durationFetch.toFixed(2)} ms`);

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
