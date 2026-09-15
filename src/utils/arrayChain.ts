// src/utils/arrayChain.ts

export type ChainArray<T> = T | ChainArray<T>[];

/**
 * ArrayChain — цепь вложенных массивов произвольной глубины.
 *
 * Оборачивает многоуровневую структуру вида
 *   [ [ [T, T], [T] ], [ [T] ] ]
 * и предоставляет:
 *   - навигацию по уровням (push / pop / goTo / reset);
 *   - чтение текущего массива и элемента (getArray / getItem);
 *   - мутации (add / remove / removeCurrent / setRoot);
 *   - путь индексов и глубину (getPath / depth).
 *
 * Пример:
 *   const chain = new ArrayChain([[1, 2], [3, 4]]);
 *   chain.push(0).push(1);
 *   chain.getItem();          // 2
 *   chain.getArray();         // [1, 2]
 *   chain.getPath();          // [0, 1]
 *   chain.removeCurrent();
 *   chain.getItem();          // 1
 */
export class ArrayChain<T = any> {
    private root: ChainArray<T>[];
    private indices: number[] = [];

    constructor(root: ChainArray<T>[] = []) {
        this.root = root;
    }

    // ===== Геттеры =====

    /** Глубина текущей навигации (0 = на корне). */
    get depth(): number {
        return this.indices.length;
    }

    /** Длина массива на текущем уровне навигации. */
    get length(): number {
        return this.getArray().length;
    }

    /** Копия текущего пути индексов. */
    getPath(): number[] {
        return [...this.indices];
    }

    /** Корневой массив (по ссылке). */
    getRoot(): ChainArray<T>[] {
        return this.root;
    }

    /**
     * Массив на текущем уровне навигации.
     * На глубине 0 возвращает корень.
     */
    getArray(): ChainArray<T>[] {
        return this.resolveArray(this.indices);
    }

    /**
     * Элемент, на который указывает текущая навигация.
     * На глубине 0 возвращает undefined.
     */
    getItem(): ChainArray<T> | undefined {
        if (this.indices.length === 0) return undefined;
        const parent = this.resolveArray(this.indices.slice(0, -1));
        return parent[this.indices[this.indices.length - 1]];
    }

    /** Является ли текущий элемент массивом. */
    isCurrentArray(): boolean {
        return Array.isArray(this.getItem());
    }

    // ===== Навигация =====

    /** Углубиться по индексу. Возвращает this для чейнинга. */
    push(index: number): this {
        if (!this.canPush(index)) return this;
        this.indices.push(index);
        return this;
    }

    /** Вернуться на уровень выше. */
    pop(): this {
        this.indices.pop();
        return this;
    }

    /**
     * Установить путь целиком.
     * Если путь некорректен — состояние не меняется, возвращает false.
     */
    goTo(indices: number[]): boolean {
        const backup = [...this.indices];
        this.indices = [];
        for (const i of indices) {
            if (!this.canPush(i)) {
                this.indices = backup;
                return false;
            }
            this.indices.push(i);
        }
        return true;
    }

    /** Сбросить навигацию к корню. */
    reset(): this {
        this.indices = [];
        return this;
    }

    // ===== Мутации =====

    /** Добавить значение в конец текущего массива. Возвращает новый индекс. */
    add(value: ChainArray<T>): number {
        const arr = this.getArray();
        arr.push(value);
        return arr.length - 1;
    }

    /** Удалить элемент по индексу в текущем массиве. */
    remove(index: number): boolean {
        const arr = this.getArray();
        if (index < 0 || index >= arr.length) return false;
        arr.splice(index, 1);
        this.clampIndices();
        return true;
    }

    /** Удалить текущий элемент и вернуться на уровень выше. */
    removeCurrent(): boolean {
        if (this.indices.length === 0) return false;
        const parent = this.resolveArray(this.indices.slice(0, -1));
        const idx = this.indices[this.indices.length - 1];
        if (idx < 0 || idx >= parent.length) return false;
        parent.splice(idx, 1);
        this.indices.pop();
        this.clampIndices();
        return true;
    }

    /** Заменить корневой массив. */
    setRoot(newRoot: ChainArray<T>[]): void {
        this.root = newRoot;
        this.clampIndices();
    }

    // ===== Вспомогательное =====

    private canPush(index: number): boolean {
        const current = this.getArray();
        return index >= 0 && index < current.length;
    }

    private resolveArray(indices: number[]): ChainArray<T>[] {
        let current: any = this.root;
        for (const idx of indices) {
            current = current[idx];
        }
        return current;
    }

    /** Корректирует индексы, вышедшие за границы после мутаций. */
    private clampIndices(): void {
        for (let i = 0; i < this.indices.length; i++) {
            const parent = this.resolveArray(this.indices.slice(0, i));
            if (!Array.isArray(parent) || parent.length === 0) {
                this.indices = this.indices.slice(0, i);
                return;
            }
            if (this.indices[i] >= parent.length) {
                this.indices[i] = parent.length - 1;
            }
        }
    }

    *[Symbol.iterator](): IterableIterator<ChainArray<T>[]> {
        yield* this.iterateArrays(this.root);
    }

    /**
     * Итерирует по «листовым» (не-массивным) значениям в порядке обхода в глубину.
     *
     *   for (const value of chain.values()) {
     *       console.log(value); // 1, 2, 3, 4, 5
     *   }
     */
    *values(): IterableIterator<T> {
        yield* this.iterateValues(this.root);
    }

    private *iterateArrays(arr: ChainArray<T>[]): IterableIterator<ChainArray<T>[]> {
        yield arr;
        for (const item of arr) {
            if (Array.isArray(item)) {
                yield* this.iterateArrays(item as ChainArray<T>[]);
            }
        }
    }

    private *iterateValues(arr: ChainArray<T>[]): IterableIterator<T> {
        for (const item of arr) {
            if (Array.isArray(item)) {
                yield* this.iterateValues(item as ChainArray<T>[]);
            } else {
                yield item as T;
            }
        }
    }
}
