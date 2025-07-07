
export function handle404(req, res, next) {
    res.status(404).render('404', {
      url: req.originalUrl,
      title: '找不到頁面',
      subTitle: '哎呀……這個頁面不存在',
      // description: '看起來你可能走錯路了。這個頁面可能已被移動、刪除，或者從未存在過。'
      description: '踏進迷霧，難覓伊人芳蹤。也許是緣慳一面，也許不過是一場春夢。'
    });
  }  