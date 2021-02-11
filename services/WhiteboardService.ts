import Session from '../models/Session';
import config from '../config';
import logger from '../logger';
import { redisGet, redisSet, redisDel, redisAppend } from './RedisService';
import { getBlob, uploadBlob } from './AzureService';

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

// @todo: remove once whiteboard docs are in azure storage
export const getFinalDocState = async (sessionId): Promise<string> => {
  const { whiteboardDoc } = await Session.findOne({ _id: sessionId })
    .select('whiteboardDoc')
    .lean()
    .exec();

  return whiteboardDoc;
};

export const uploadedToStorage = async (
  sessionId: string,
  whiteboardDoc: string,
  attempts = 0
): Promise<boolean> => {
  try {
    await uploadBlob({
      containerName: config.whiteboardStorageContainer,
      blobName: sessionId,
      content: whiteboardDoc
    });
    return true;
  } catch (error) {
    if (attempts === 1) {
      logger.error(
        `Retry uploading of whiteboard failed ${sessionId}: ${error.message}`
      );

      return false;
    }

    logger.error(
      `Uploading of whiteboard failed ${sessionId}, retrying: ${error.message}`
    );
    attempts++;
    return uploadedToStorage(sessionId, whiteboardDoc, attempts);
  }
};

export const getDocFromStorage = async (sessionId: string): Promise<string> => {
  try {
    const whiteboardDoc = await getBlob({
      containerName: config.whiteboardStorageContainer,
      blobName: sessionId
    });
    return whiteboardDoc;
  } catch (error) {
    logger.error(
      `Getting the whiteboard failed ${sessionId}: ${error.message}`
    );
    return '';
  }
};
