import Session from '../models/Session';
import { redisGet, redisSet, redisDel, redisAppend } from './RedisService';

const sessionIdToKey = (id): string => `zwibbler-${id}`;

export const createDoc = async (sessionId): Promise<string> => {
  const newDoc = '';
  await redisSet(sessionIdToKey(sessionId), newDoc);
  return newDoc;
};

export const getDoc = (sessionId): Promise<string> => {
  return redisGet(sessionIdToKey(sessionId));
};

export const getDocLength = async (sessionId): Promise<number> => {
  const document = await redisGet(sessionIdToKey(sessionId));
  if (document === undefined) return 0;
  return Buffer.byteLength(document, 'utf8');
};

export const appendToDoc = (sessionId, docAddition): Promise<void> => {
  return redisAppend(sessionIdToKey(sessionId), docAddition);
};

export const deleteDoc = (sessionId): Promise<void> => {
  return redisDel(sessionIdToKey(sessionId));
};

export const getFinalDocState = async (sessionId): Promise<string> => {
  const { whiteboardDoc } = await Session.findOne({ _id: sessionId })
    .select('whiteboardDoc')
    .lean()
    .exec();

  return whiteboardDoc;
};
