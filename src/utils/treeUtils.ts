// src/utils/treeUtils.ts

export interface TreeNodeLike {
    parentId?: string | number | null;
    _id?: string | number;
    id?: string | number;
    [key: string]: any;
}

export interface CollectDescendantsOptions<T> {
    /** Откуда брать id объекта (по умолчанию: _id → id) */
    getId?: (item: T) => string | number | undefined;
    /** Откуда брать parentId (по умолчанию: item.parentId) */
    getParentId?: (item: T) => string | number | undefined | null;
    /** Включать ли в результат сами корневые элементы (по умолчанию false) */
    includeRoots?: boolean;
    /** Защита от циклов (по умолчанию 10_000) */
    maxDepth?: number;
}

const defaultGetId = <T extends TreeNodeLike>(item: T): string | number | undefined =>
    item._id ?? item.id;

const defaultGetParentId = <T extends TreeNodeLike>(item: T): string | number | undefined | null =>
    item.parentId;

/**
 * Возвращает все объекты, у которых parentId === rootId,
 * а также рекурсивно всех их потомков (по цепочке parentId).
 *
 * Работает и с Map, и с массивом.
 *
 * @example
 * const descendants = collectDescendants(itemsMap, "rootId");
 * const descendants = collectDescendants(itemsArray, "rootId", {
 *     getId: (i) => i._id,
 *     getParentId: (i) => i.parentId,
 *     includeRoots: true,
 * });
 */
export function collectDescendants<T>(
    source: Map<string | number, T> | T[],
    rootId: string | number,
    options: CollectDescendantsOptions<T> = {}
): T[] {
    const {
        getId = defaultGetId as (item: T) => string | number | undefined,
        getParentId = defaultGetParentId as (item: T) => string | number | undefined | null,
        includeRoots = false,
        maxDepth = 10_000,
    } = options;

    const items: T[] = source instanceof Map ? [...source.values()] : source;

    // 1. Индекс: parentId → список детей
    const childrenByParent = new Map<string | number, T[]>();
    for (const item of items) {
        const parentId = getParentId(item);
        if (parentId === undefined || parentId === null) continue;
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId)!.push(item);
    }

    // 2. BFS от rootId вниз по дереву
    const result: T[] = [];
    const visited = new Set<string | number>();

    const queue: Array<{ id: string | number; depth: number }> = [{ id: rootId, depth: 0 }];

    while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (depth > maxDepth) continue;

        const children = childrenByParent.get(id);
        if (!children) continue;

        for (const child of children) {
            const childId = getId(child);
            if (childId !== undefined) {
                if (visited.has(childId)) continue; // защита от циклов
                visited.add(childId);
                queue.push({ id: childId, depth: depth + 1 });
            }
            result.push(child);
        }
    }

    // 3. Если нужно — добавляем сам корневой объект
    if (includeRoots) {
        const root = items.find((it) => getId(it) === rootId);
        if (root) result.unshift(root);
    }

    return result;
}
