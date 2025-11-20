import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export declare const REDIS_CLIENT: unique symbol;
export declare class RedisModule implements OnModuleDestroy {
    private readonly client;
    constructor(client: Redis);
    onModuleDestroy(): Promise<void>;
}
