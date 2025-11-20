import { OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
export declare const QUEUES: {
    readonly EMAIL: "email";
    readonly REPORTS: "reports";
};
export declare const REPORTS_QUEUE: unique symbol;
export declare class BullMqModule implements OnModuleDestroy {
    private readonly queue;
    private readonly worker;
    constructor(queue: Queue | null, worker: Worker | null);
    onModuleDestroy(): Promise<void>;
}
