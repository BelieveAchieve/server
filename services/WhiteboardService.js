const Session = require('../models/Session')
const { redisGet, redisSet, redisDel, redisAppend } = require('./RedisService')

const sessionIdToKey = id => `zwibbler-${id}`

module.exports = {
  createDoc: async sessionId => {
    const newDoc = ''
    await redisSet(sessionIdToKey(sessionId), newDoc)
    return newDoc
  },

  getDoc: async sessionId => {
    return redisGet(sessionIdToKey(sessionId))
  },

  getDocLength: async sessionId => {
    const document = await redisGet(sessionIdToKey(sessionId))
    if (document === undefined) return 0
    return Buffer.byteLength(document, 'utf8')
  },

  appendToDoc: async (sessionId, docAddition) => {
    return redisAppend(sessionIdToKey(sessionId), docAddition)
  },

  deleteDoc: async sessionId => {
    return redisDel(sessionIdToKey(sessionId))
  },

  getFinalDocState: async sessionId => {
    const { whiteboardDoc } = await Session.findOne({ _id: sessionId })
      .select('whiteboardDoc')
      .lean()
      .exec()

    return whiteboardDoc
  }
}
