const whiteboardDocCache = {}

module.exports = {
  getDoc: function(docId) {
    if (!whiteboardDocCache[docId]) {
      whiteboardDocCache[docId] = ''
    }

    return whiteboardDocCache[docId]
  },

  addToDoc: function(docId, docAddition) {
    const newDoc = this.getDoc(docId) + docAddition
    whiteboardDocCache[docId] = newDoc
  }
}
