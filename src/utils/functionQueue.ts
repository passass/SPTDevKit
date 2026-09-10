// src/utils/functionQueue.ts

export interface QueuedCall<TArgs extends any[] = any[]> {
    fn: (...args: TArgs) => any;
    args: TArgs;
}

/**
 * Хранит функции вместе с их аргументами, сгруппированные по ключу.
 * При вызове `execute(key)` все функции этой группы выполняются,
 * после чего группа очищается.
 */
export class FunctionQueue {
    private queues: Map<string, QueuedCall[]> = new Map();

    /** Зарегистрировать функцию с аргументами под ключом `key`. */
    add<TArgs extends any[]>(key: string, fn: (...args: TArgs) => any, ...args: TArgs): this {
        let queue = this.queues.get(key);
        if (!queue) {
            queue = [];
            this.queues.set(key, queue);
        }
        queue.push({ fn, args });
        return this;
    }

    /**
     * Выполнить все функции очереди `key` и очистить её.
     * Возвращает массив результатов в порядке регистрации.
     */
    execute<TResult = any>(key: string): TResult[] {
        const queue = this.queues.get(key);
        if (!queue || queue.length === 0) return [];

        // Удаляем до выполнения: если внутри fn снова вызовут add(key, ...),
        // новая запись не попадёт в текущий проход.
        this.queues.delete(key);

        const results: TResult[] = [];
        for (const { fn, args } of queue) {
            results.push(fn(...args) as TResult);
        }
        return results;
    }

    /** Выполнить все очереди и очистить их. Возвращает результаты по ключам. */
    executeAll(): Record<string, any[]> {
        const result: Record<string, any[]> = {};
        for (const key of Array.from(this.queues.keys())) {
            result[key] = this.execute(key);
        }
        return result;
    }

    /** Очистить очередь по ключу, либо все очереди, если ключ не передан. */
    clear(key?: string): void {
        if (key === undefined) this.queues.clear();
        else this.queues.delete(key);
    }

    /** Есть ли невыполненные функции по ключу. */
    has(key: string): boolean {
        return (this.queues.get(key)?.length ?? 0) > 0;
    }

    /** Количество записей в очереди (или во всех очередях). */
    size(key?: string): number {
        if (key === undefined) {
            let total = 0;
            for (const q of this.queues.values()) total += q.length;
            return total;
        }
        return this.queues.get(key)?.length ?? 0;
    }

    /** Список ключей, у которых есть невыполненные функции. */
    keys(): string[] {
        return Array.from(this.queues.keys());
    }
}
