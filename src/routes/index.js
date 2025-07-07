import 'dotenv/config'
import express from 'express';
const router = express.Router();

// Search page - GET (initial form)
router.get('/search', (req, res) => {
  res.render('search', { query: '', results: [] });
});

// Search page - POST (handle query & render results)
router.post('/search', async (req, res) => {
  const { query } = req.body;

  const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const results = await response.json();

  res.render('search', { query, results });
});

// Details page
router.get('/details/:id', async (req, res) => {
  const id = req.params.id;

  const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/details?id=${id}`);
  const record = await response.json();

  res.render('details', { record });
});

// Stats page
router.get('/stats', async (req, res) => {
  const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/stats`);
  const stats = await response.json();
  
  res.render('stats', { stats });
});

export default router;

/*
   Full-text search
   https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search
*/