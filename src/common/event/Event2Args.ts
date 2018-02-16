export class Event2Args<T, M> {
    private handlers: { (data?: T, data2?: M): void; }[] = [];
    private singleHandlers: { (data?: T, data2?: M): void; }[] = [];

    public on(handler: { (data?: T, data2?: M): void }) {
        this.handlers.push(handler);
    }

    public once(handler: { (data?: T, data2?: M): void }) {
        this.singleHandlers.push(handler);
    }

    public off(handler: { (data?: T, data2?: M): void }) {
        this.handlers = this.handlers.filter(h => h !== handler);
        this.singleHandlers = this.singleHandlers.filter(h => h !== handler);
    }

    public allOff() {
        this.handlers = [];
        this.singleHandlers = [];
    }

    public trigger(data?: T, data2?: M) {
        if (this.handlers) {
            this.handlers.slice(0).forEach(h => h(data, data2));
        }
        if (this.singleHandlers) {
            this.singleHandlers.slice(0).forEach(h => h(data, data2));
            this.singleHandlers = [];
        }
    }
}
export class Event3Args<T, M, N> {
    private handlers: { (data?: T, data2?: M, data3?: N): void; }[] = [];

    public on(handler: { (data?: T, data2?: M, data3?: N): void }) {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: T, data2?: M, data3?: N): void }) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public allOff() {
        this.handlers = [];
    }

    public trigger(data?: T, data2?: M, data3?: N) {
        if (this.handlers) {
            this.handlers.slice(0).forEach(h => h(data, data2, data3));
        }
    }

    hasListener() {
        return this.handlers.length > 0;
    }
}
