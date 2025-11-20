export declare class HealthController {
    getHealth(): {
        ok: boolean;
        uptime: number;
        version: string;
        timestamp: string;
    };
}
