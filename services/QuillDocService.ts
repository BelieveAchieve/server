import Delta from 'quill-delta';
import { redisGet, redisSet, redisDel } from './RedisService';

module.exports = {
  createDoc: async (sessionId: string): Promise<Delta> => {
    const newDoc = new Delta();
    await redisSet(sessionId, JSON.stringify(newDoc));
    return newDoc;
  },

  getDoc: async (sessionId: string): Promise<Delta | undefined> => {
    const docString = await redisGet(sessionId);
    if (!docString) return;
    return new Delta(JSON.parse(docString));
  },

  appendToDoc: async (sessionId: string, delta: Delta): Promise<void> => {
    const docString = await redisGet(sessionId);
    if (!docString) return;
    const updatedDoc = new Delta(JSON.parse(docString)).compose(delta);
    await redisSet(sessionId, JSON.stringify(updatedDoc));
  },

  deleteDoc: async (sessionId: string): Promise<void> => {
    await redisDel(sessionId);
  }
};
