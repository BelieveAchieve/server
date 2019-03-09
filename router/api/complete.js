const completeCtrl = require('../../controllers/CompleteCtrl')

module.exports = router => {
  router.post('/complete', (req, res) => {
    completeCtrl.getSuggestions(req.body.query, (err, suggestions) => {
      if (err) {
        console.log(err)
        res.json({ err })
      } else {
        res.json({ suggestions })
      }
    })
  })
}
