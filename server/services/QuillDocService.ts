import Delta from 'quill-delta'
import { redisGet, redisSet, redisDel } from './RedisService'

const sessionIdToKey = (id: string): string => `quill-${id}`

module.exports = {
  createDoc: async (sessionId: string): Promise<Delta> => {
    const newDoc = new Delta()
    await redisSet(sessionIdToKey(sessionId), JSON.stringify(newDoc))
    return newDoc
  },

  getDoc: async (sessionId: string): Promise<Delta | undefined> => {
    const docString = await redisGet(sessionIdToKey(sessionId))
    if (!docString) return
    return new Delta(JSON.parse(docString))
  },

  appendToDoc: async (sessionId: string, delta: Delta): Promise<void> => {
    const redisKey = sessionIdToKey(sessionId)
    const docString = await redisGet(redisKey)
    if (!docString) return
    const updatedDoc = new Delta(JSON.parse(docString)).compose(delta)
    await redisSet(redisKey, JSON.stringify(updatedDoc))
  },

  deleteDoc: async (sessionId: string): Promise<void> => {
    await redisDel(sessionIdToKey(sessionId))
  }
}
