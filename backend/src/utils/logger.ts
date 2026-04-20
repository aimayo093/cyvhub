
export class Logger {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }

    error(message: string, stack?: string) {
        console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`);
        if (stack) {
            console.error(stack);
        }
    }

    log(message: string) {
        console.log(`[${new Date().toISOString()}] [LOG] [${this.context}] ${message}`);
    }

    warn(message: string) {
        console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`);
    }

    debug(message: string) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`);
        }
    }
}
