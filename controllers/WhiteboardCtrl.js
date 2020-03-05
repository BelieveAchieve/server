const Session = require('../models/Session')

const whiteboardDocCache = {}

module.exports = {
  getDoc: function(sessionId) {
    if (!whiteboardDocCache[sessionId]) {
      whiteboardDocCache[sessionId] = ''
    }

    return whiteboardDocCache[sessionId]
  },

  appendToDoc: function(sessionId, docAddition) {
    const newDoc = this.getDoc(sessionId) + docAddition
    whiteboardDocCache[sessionId] = newDoc
  },

  clearDocFromCache(sessionId) {
    delete whiteboardDocCache[sessionId]
  },

  saveDocToSession(sessionId) {
    const doc = this.getDoc(sessionId)
    return Session.updateOne({ _id: sessionId }, { whiteboardDoc: doc })
  }
}
