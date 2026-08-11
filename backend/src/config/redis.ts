import { error } from 'console';
import IORedis from 'ioredis'

const redisConnection  =  new IORedis(
    process.env.REDIS_URL  || 'redis://localhost:6379',
    {
        maxRetriesPerRequest: null
    }
);

redisConnection.on('connect',()=>{
    console.log('Redis connected successfully');
})

redisConnection.on('error',()=>{
    console.error('Redis connection error:',error)
})
export default redisConnection