class Set<T> {
    private values: Array<T> = [];

    constructor() {
    }

    contains(value: T): boolean {
        return this.values.indexOf(value) > -1;
    }

    add(value: T) {
        if (this.contains(value) === true) {
            return;
        }
        this.values.push(value);
    }

    remove(value: T) {
        let index = this.values.indexOf(value);
        if (index > -1) {
            this.values.splice(index, 1);
        }
    }

    getValues() {
        return this.values;
    }

    removeAll() {
        this.values = [];
    }
}

export class TaskScheduler {

    private static timeoutIdSet: Set<any> = new Set();

    private timerId = null;

    constructor() {
    }

    isScheduled(): boolean {
        return this.timerId !== null;
    }

    schedule(fn: Function, timeout: number = 0): void {
        this.clear();
        this.timerId = setTimeout(() => {
            TaskScheduler.timeoutIdSet.remove(this.timerId);
            this.timerId = null;
            fn();
        }, timeout);
        TaskScheduler.timeoutIdSet.add(this.timerId);
    }


    clear(): void {
        if (this.timerId !== null) {
            TaskScheduler.timeoutIdSet.remove(this.timerId);
            clearTimeout(this.timerId);
            this.timerId = null;
        }


    }

    public static cleanUpAll() {
        let ids: Array<any> = TaskScheduler.timeoutIdSet.getValues();
        for (let i = 0; i < ids.length; i++) {
            clearTimeout(ids[i]);
        }
        TaskScheduler.timeoutIdSet.removeAll();
    }
}

