const express = require('express')
const { ObjectId } = require('mongodb')
const UserService = require('../../services/UserService')

module.exports = function(app) {
  const router = new express.Router()

  router.post('/:referenceId/submit', async (req, res, next) => {
    const { referenceId } = req.params
    const { body: referenceFormData, ip } = req
    const user = await UserService.getUser({
      'references._id': ObjectId(referenceId)
    })
    if (!user) return res.sendStatus(404)
    const { references, _id: userId } = user
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
