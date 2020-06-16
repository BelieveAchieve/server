const express = require('express')
const UserService = require('../../services/UserService')

module.exports = function(app) {
  const router = new express.Router()

  router.post('/:referenceId/submit', async (req, res, next) => {
    const { referenceId } = req.params
    const { body: referenceFormData } = req

    await UserService.saveReferenceForm({ referenceId, referenceFormData })
    res.sendStatus(200)
  })

  app.use('/reference', router)
}
