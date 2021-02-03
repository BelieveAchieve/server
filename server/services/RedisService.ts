import redis from 'redis';
import { promisify } from 'util';
import config from '../config';

const redisClient = redis.createClient(config.redisConnectionString);
const redisGet = promisify(redisClient.get).bind(redisClient);
const redisSet = promisify(redisClient.set).bind(redisClient);
const redisDel = promisify(redisClient.del).bind(redisClient);
const redisAppend = promisify(redisClient.append).bind(redisClient);

export { redisGet, redisSet, redisDel, redisAppend };
