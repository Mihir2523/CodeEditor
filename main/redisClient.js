import { createClient } from 'redis';
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
    username: 'default',
    password: '2KVpzJCk4H4Jm41fxIuRhDrcbxCdWE83',
    socket: {
        host: 'redis-15965.c301.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 15965
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

await redisClient.connect();

export default redisClient;
