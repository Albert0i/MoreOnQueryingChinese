import 'dotenv/config'
import express from 'express';
const router = express.Router();

// Welcome page
router.get('/', (req, res) => {
  res.render('welcome');
});

// Search page - GET (initial form)
router.get('/search', (req, res) => {
  res.render('search', { query: '', fulltextMode: '', results: [] });
});

// Search page - POST (handle query & render results)
router.post('/search', async (req, res) => {
  const { query, fulltextMode } = req.body;
  
  const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, fulltextMode })
  });
  const results = await response.json();

  res.render('search', { query, fulltextMode, results });
});

// Stats page
router.get('/stats', async (req, res) => {
  const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/stats`);
  const stats = await response.json();
  
  res.render('stats', { stats });
});

// Details page
router.get('/details/:id', async (req, res) => {
  const id = req.params.id;

  const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/details?id=${id}`);
  const record = await response.json();

  res.render('details', { record });
});

router.get('/feature', (req, res) => {
  res.redirect('/MoreOnQueryingChinese.pdf');
});

export default router;
