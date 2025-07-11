import 'dotenv/config'
import express from 'express';
const router = express.Router();

// Welcome page
router.get('/', (req, res) => {
  res.render('welcome');
});

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

// Add page - GET (initial form)
router.get('/add', (req, res) => {
  res.render('add', { result: null });
});

// Add page - POST (handle add & render results)
router.post('/add', async (req, res) => {
  const { textChi } = req.body;

  try {
    const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textChi })
    });

    const data = await response.json();
    res.status(201).render('add', { result: data });
  } catch (err) {
    res.render.status(500).render('add', {
      result: { message: '⚠️ 無法連線至伺服器，請稍後再試。' }
    });
  }
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

// /*
//    MariaDB 
// */
// // Fulltext Search page - GET (initial form) 
// router.get('/ftsearch', (req, res) => {
//   res.render('ftsearch', { query: '', mode: 'natural', expand: '', results: [] } );
// });

// // Fulltext Search page - POST (handle query & render results)
// router.post('/ftsearch', async (req, res) => {
//   const { query, mode, expand } = req.body;
  
//   const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/ftsearch`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ query, mode, expand })
//   });
//   const results = await response.json();
  
//   res.render('ftsearch', { query, mode, expand, results } );
// });

// /*
//    Redis
// */
// // Fulltext Search page - GET (initial form) 
// router.get('/ftsredis', (req, res) => {
//   res.render('ftsredis', { query: '', results: [] } );
// });

// // Fulltext Search page - POST (handle query & render results)
// router.post('/ftsredis', async (req, res) => {
//   const { query } = req.body;
  
//   const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/ftsredis`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ query })
//   });  
//   const results = await response.json();

//   res.render('ftsredis', { query, results } );
// });

// // Stats page
// router.get('/statsredis', async (req, res) => {
//   const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/statsredis`);
//   const stats = await response.json();
  
//   res.render('stats', { stats });
// });

// // Details page
// router.get('/detailsredis/:id', async (req, res) => {
//   const id = req.params.id;

//   const response = await fetch(`http://${process.env.HOST}:${process.env.PORT}/api/v1/detailsredis?id=${id}`);
//   const record = await response.json();

//   res.render('details', { record });
// });

export default router;

/*
   Full-text search
   https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search
*/