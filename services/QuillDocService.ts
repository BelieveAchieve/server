import Delta from 'quill-delta';

// @todo: store in redis, not in-memory
const quillDocCache: { [sessionId: string]: Delta } = {};

module.exports = {
  createDoc: (sessionId: string): Delta => {
    quillDocCache[sessionId] = new Delta();
    return quillDocCache[sessionId];
  },

  getDoc: (sessionId: string): Delta | undefined => {
    return quillDocCache[sessionId];
  },

  appendToDoc: (sessionId: string, delta: Delta): void => {
    if (!quillDocCache[sessionId]) return;
    quillDocCache[sessionId] = quillDocCache[sessionId].compose(delta);
  },

  deleteDoc: (sessionId: string): void => {
    delete quillDocCache[sessionId]
  }
};
