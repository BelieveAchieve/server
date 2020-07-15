const express = require('express')
const UserService = require('../../services/UserService')

module.exports = function(app) {
  const router = new express.Router()

  router.post('/:referenceId/submit', async (req, res, next) => {
    const { referenceId } = req.params
    const { body: referenceFormData, ip } = req

    const { references, _id: userId } = await UserService.getUser({
      'references._id': referenceId
    })

    let referenceEmail
    for (const reference of references) {
      if (reference._id.toString() === referenceId)
        referenceEmail = reference.email
    }
    await UserService.saveReferenceForm({
      userId,
      referenceId,
      referenceEmail,
      referenceFormData,
      ip
    })
    res.sendStatus(200)
  })

  app.use('/api-public/reference', router)
}
