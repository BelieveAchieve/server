const Session = require('../models/Session')

const whiteboardDocCache = {}

setInterval(() => {
  console.log(whiteboardDocCache);
}, 5000)

module.exports = {
  createDoc: function(sessionId) {
    whiteboardDocCache[sessionId] = ''
    return whiteboardDocCache[sessionId]
  },

  getDoc: function(sessionId) {
    return whiteboardDocCache[sessionId]
  },

  getDocLength: function(sessionId) {
    const document = this.getDoc(sessionId)
    if (document === undefined) return 0
    return Buffer.byteLength(document, 'utf8')
  },

  appendToDoc: function(sessionId, docAddition) {
    const currentDoc = this.getDoc(sessionId)
    if (currentDoc === undefined) {
      throw new Error(`document does not exist for session ${sessionId}`)
    }
    whiteboardDocCache[sessionId] = currentDoc + docAddition
  },

  clearDocFromCache(sessionId) {
    delete whiteboardDocCache[sessionId]
  },

  saveDocToSession(sessionId) {
    const doc = this.getDoc(sessionId)
    return Session.updateOne({ _id: sessionId }, { whiteboardDoc: doc })
  }
}
