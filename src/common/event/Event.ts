function isFunction(functionToCheck: any) {
    const getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

export class Event<T> {
    private handlers: { (data?: T): void; }[] = [];
    private singleHandlers: { (data?: T): void; }[] = [];

    public on(handler: { (data?: T): void }) {
        if (!isFunction(handler)) {
            throw new Error("Handler is not a function");
        }
        this.handlers.push(handler);
    }


    public once(handler: { (data?: T): void }) {
        if (!isFunction(handler)) {
            throw new Error("Handler is not a function");
        }
        this.singleHandlers.push(handler);
    }

    public wait(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.once(() => {
                resolve();
            })
        });
    }

    public off(handler: { (data?: T): void }) {
        this.handlers = this.handlers.filter(h => h !== handler);
        this.singleHandlers = this.singleHandlers.filter(h => h !== handler);
    }

    public allOff() {
        this.handlers = [];
        this.singleHandlers = [];
    }

    public trigger(data?: T) {
        if (this.handlers) {
            this.handlers.slice(0).forEach(h => h(data));
        }
        if (this.singleHandlers) {
            this.singleHandlers.slice(0).forEach(h => h(data));
            this.singleHandlers = [];
        }
    }

    public hasListener(): boolean {
        return this.handlers.length !== 0 || this.singleHandlers.length !== 0;
    }
}

