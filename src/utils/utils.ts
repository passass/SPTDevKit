export function capitalize(str: string) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

export const sum = (arr: number[]) => arr.reduce((acc, n) => acc + n, 0);

export function isElectron() {
    return window && window.electronAPI !== undefined;
}

type PathFilter =
    | { kind: "eq"; key: string; value: string }
    | { kind: "notExists"; key: string };

export function toJsonObject(obj: any): any {
    if (obj instanceof Map) {
        const result: Record<string, any> = {};
        for (const [key, value] of obj.entries()) {
            result[key] = toJsonObject(value);
        }
        return result;
    } else if (typeof obj === "object" && "toJSON" in obj) {
        return obj.toJSON();
    } else if (Array.isArray(obj)) {
        return obj.map((v) => toJsonObject(v));
    } else if (obj && typeof obj === "object") {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value instanceof Map) {
                result[key] = toJsonObject(value);
            } else if (Array.isArray(value) && value.some((v) => (typeof v === "object" && "toJSON" in v))) {
                result[key] = value.map((v) => ((typeof v === "object" && "toJSON" in v) ? v.toJSON() : v));
            } else if (value && typeof value === "object" && "toJSON" in value && typeof value.toJSON === "function") {
                result[key] = value.toJSON();
            } else {
                result[key] = value;
            }
        }
        return result;
    }
    return obj;
}

export function groupBy<T>(
    source: Map<string | number, T>,
    getKey: (item: T, id: string | number) => string | number | undefined | null
): Map<string | number, Map<string | number, T>> {
    const res = new Map<any, any>();
    for (const [id, value] of source.entries()) {
        const key = getKey(value, id);
        if (key === undefined || key === null) continue;
        if (!res.has(key)) res.set(key, new Map());
        res.get(key)!.set(id, value);
    }
    return res;
}

export function allElementsInArray(arr: any[], targetArr: any[]): boolean {
    const targetSet = new Set(targetArr);
    return arr.every((element) => targetSet.has(element));
}

export function deepClone<T>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as any;
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as any;
  }
  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as any;
  }
  if (value instanceof Object) {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = deepClone((value as any)[key]);
    }
    return result as T;
  }
  return value;
}

type DataStructure = Record<string, any> | any[] | any;

/**
 * Разбирает часть пути на имя и фильтр вида [key=value]
 */
 function parseFilter(part: string): { name: string; filter: PathFilter | null } {
     const notExistsMatch = part.match(/\[!([^\]]+)\]$/);
     if (notExistsMatch) {
         const name = part.slice(0, notExistsMatch.index);
         const [, key] = notExistsMatch;
         return { name, filter: { kind: "notExists", key } };
     }

     const filterMatch = part.match(/\[([^=]+)=([^\]]+)\]$/);
     if (filterMatch) {
         const name = part.slice(0, filterMatch.index);
         const [, key, value] = filterMatch;
         return { name, filter: { kind: "eq", key, value } };
     }

     return { name: part, filter: null };
 }

/**
 * Проверяет, соответствует ли элемент фильтру
 */
 function matchesFilter(item: any, filter: PathFilter): boolean {
     if (item === null || item === undefined || typeof item !== "object") return false;

     if (filter.kind === "eq") {
         if (!(filter.key in item)) return false;
         return String(item[filter.key]) === filter.value;
     }

     // notExists
     if (!(filter.key in item)) return true;
     const v = item[filter.key];
     return v === "" || v === null || v === undefined;
 }

/**
 * Рекурсивный обход с применением фильтра
 */
function traverseWithFilter(
    current: any,
    parts: string[],
    index: number,
    results: any[]
): void {
    if (current === null || current === undefined) return;

    if (index >= parts.length) {
        results.push(current);
        return;
    }

    const part = parts[index];
    const { name, filter } = parseFilter(part);

    // Обработка текущего узла
    if (name === '*') {
        // Wildcard - перебираем все элементы коллекции
        if (Array.isArray(current)) {
            for (const item of current) {
                processItemWithFilter(item, filter, parts, index + 1, results);
            }
        } else if (current && typeof current === 'object' && !Array.isArray(current)) {
            // Для объекта перебираем значения
            for (const value of Object.values(current)) {
                processItemWithFilter(value, filter, parts, index + 1, results);
            }
        }
        // Иначе ничего не делаем
    } else {
        // Обычный путь
        if (Array.isArray(current)) {
            // Если часть - число, используем как индекс
            const idx = parseInt(name, 10);
            if (!isNaN(idx) && idx >= 0 && idx < current.length) {
                processItemWithFilter(current[idx], filter, parts, index + 1, results);
            } else {
                // Иначе ищем элементы с таким ключом
                for (const item of current) {
                    if (item && typeof item === 'object' && name in item) {
                        processItemWithFilter(item[name], filter, parts, index + 1, results);
                    }
                }
            }
        } else if (current && typeof current === 'object' && !Array.isArray(current)) {
            if (name in current) {
                processItemWithFilter(current[name], filter, parts, index + 1, results);
            }
        }
    }
}

/**
 * Обрабатывает элемент с учётом фильтра
 */
 function processItemWithFilter(
     item: any,
     filter: PathFilter | null,
     parts: string[],
     nextIndex: number,
     results: any[]
 ): void {
     if (filter === null) {
         traverseWithFilter(item, parts, nextIndex, results);
         return;
     }

     if (matchesFilter(item, filter)) {
         traverseWithFilter(item, parts, nextIndex, results);
     } else if (Array.isArray(item)) {
         for (const subItem of item) {
             if (matchesFilter(subItem, filter)) {
                 traverseWithFilter(subItem, parts, nextIndex, results);
                 break;
             }
         }
     }
 }

/**
 * Возвращает все значения по заданному пути с поддержкой wildcard и фильтров
 * @param data - исходные данные (объект или массив)
 * @param path - путь вида "a.b.*.c" или "items[type=weapon].id"
 * @returns массив найденных значений
 */
export function getValuesByPath(data: DataStructure, path: string): any[] {
    if (!path) {
        return data !== null && data !== undefined ? [data] : [];
    }

    const parts = path.split('.');
    const results: any[] = [];
    traverseWithFilter(data, parts, 0, results);
    return results;
}

/**
 * Возвращает первое значение по простому пути (без wildcard и фильтров)
 * @param data - исходные данные
 * @param path - путь вида "a.b.c"
 * @returns найденное значение или undefined
 */
export function getValueByPath(data: DataStructure, path: string, defaultValue?: any): any | undefined {
    const parts = path.split('.');
    let current: any = data;

    for (const key of parts) {
        let found = false;

        if (current && typeof current === 'object' && !Array.isArray(current) && key in current) {
            current = current[key];
            found = true;
        } else if (Array.isArray(current) && /^\d+$/.test(key)) {
            const index = parseInt(key, 10);
            if (index >= 0 && index < current.length) {
                current = current[index];
                found = true;
            }
        }

        if (!found) {
            return defaultValue;
        }
    }

    return current;
}

/**
 * Устанавливает значение по пути с поддержкой wildcard (`*`) и фильтров вида `[key=value]`.
 * Поддерживается как на промежуточных, так и на последнем сегменте пути.
 *
 * Примеры:
 *   setValueByPath(data, "a.b.c", 1)
 *   setValueByPath(data, "template.Items.*[_tpl=oldId]._tpl", newId)
 *   setValueByPath(data, "items[*].active", true)
 *
 * @param data - исходные данные (изменяются напрямую)
 * @param path - путь вида "a.b.c" или "template.Items.*[_tpl=abc]._tpl"
 * @param value - новое значение
 * @returns true если хотя бы одно значение было установлено, иначе false
 */
export function setValueByPath(data: DataStructure, path: string, value: any): boolean {
    if (!path) return false;

    const parts = path.split('.');
    let anySet = false;

    // Устанавливает значение в target по последнему сегменту пути.
    function setLast(target: any): void {
        const { name, filter } = parseFilter(parts[parts.length - 1]);

        const tryAssign = (container: any, key: string | number, existing: any): void => {
            if (filter !== null && !matchesFilter(existing, filter)) return;
            container[key] = value;
            anySet = true;
        };

        if (name === '*') {
            if (Array.isArray(target)) {
                for (let i = 0; i < target.length; i++) tryAssign(target, i, target[i]);
            } else if (target && typeof target === 'object') {
                for (const k of Object.keys(target)) tryAssign(target, k, target[k]);
            }
            return;
        }

        if (Array.isArray(target)) {
            const idx = parseInt(name, 10);
            if (!isNaN(idx) && idx >= 0 && idx < target.length) {
                tryAssign(target, idx, target[idx]);
            } else {
                for (const item of target) {
                    if (item && typeof item === 'object' && name in item) {
                        tryAssign(item, name, item[name]);
                    }
                }
            }
        } else if (target && typeof target === 'object' && name in target) {
            tryAssign(target, name, target[name]);
        }
    }

    function traverse(current: any, index: number): void {
        if (current === null || current === undefined) return;

        // Дошли до родителя последнего сегмента — устанавливаем значение
        if (index >= parts.length - 1) {
            setLast(current);
            return;
        }

        const { name, filter } = parseFilter(parts[index]);

        if (name === '*') {
            if (Array.isArray(current)) {
                for (const item of current) processItem(item, filter, index + 1);
            } else if (current && typeof current === 'object') {
                for (const val of Object.values(current)) processItem(val, filter, index + 1);
            }
            return;
        }

        if (Array.isArray(current)) {
            const idx = parseInt(name, 10);
            if (!isNaN(idx) && idx >= 0 && idx < current.length) {
                processItem(current[idx], filter, index + 1);
            } else {
                for (const item of current) {
                    if (item && typeof item === 'object' && name in item) {
                        processItem(item[name], filter, index + 1);
                    }
                }
            }
        } else if (current && typeof current === 'object' && name in current) {
            processItem(current[name], filter, index + 1);
        }
    }

    function processItem(item: any, filter: PathFilter | null, nextIndex: number): void {
        if (filter === null) {
            traverse(item, nextIndex);
            return;
        }
        if (matchesFilter(item, filter)) {
            traverse(item, nextIndex);
        } else if (Array.isArray(item)) {
            for (const subItem of item) {
                if (matchesFilter(subItem, filter)) {
                    traverse(subItem, nextIndex);
                    break;
                }
            }
        }
    }

    traverse(data, 0);
    return anySet;
}

/**
 * Вычисляет среднее арифметическое чисел
 * @param list - массив чисел
 * @returns среднее значение или NaN, если массив пуст
 */
export function avg(list: number[]): number {
    if (!list || list.length === 0) return NaN;
    const sum = list.reduce((acc, val) => acc + val, 0);
    return sum / list.length;
}
