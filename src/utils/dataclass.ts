/**
 * Символ-маркер для внутренней идентификации dataclass
 */
export const IS_DATACLASS = Symbol('is_dataclass');

/**
 * Опции декоратора @dataclass
 */
export interface DataclassOptions<T = Record<string, any>> {
  /** Значения по умолчанию (переопределяют property initializers класса) */
  defaults?: Partial<T>;
  /** Сделать объект неизменяемым после создания */
  frozen?: boolean;
  /** Валидация данных перед присвоением. Выбрасывает ошибку при невалидных данных */
  validate?: (data: Partial<T>) => void;
}

/**
 * Декоратор @dataclass
 * 
 * Автоматически создаёт конструктор, который:
 * 1. Принимает объект с частичными данными (Partial<T>)
 * 2. Применяет значения по умолчанию из property initializers класса
 * 3. Применяет defaults из опций декоратора
 * 4. Применяет переданные данные поверх всего
 * 5. Поддерживает проверку типа через static isInstance()
 * 
 * Использование:
 * @dataclass()
 * class User {
 *   name: string = 'Anonymous';
 *   age: number = 0;
 * }
 * const u = new User({ name: 'John' }); // age === 0 автоматически
 */
export function dataclass<T extends { new (...args: any[]): any }>(
  options: DataclassOptions<InstanceType<T>> = {}
) {
  return function (target: T): T {
    const { defaults = {}, frozen = false, validate } = options;

    const DataclassImpl = class extends target {
      /** Маркер dataclass (для проверок в runtime) */
      static [IS_DATACLASS] = true;
      /** Имя оригинального класса */
      static readonly __dataclass_name__ = target.name;

      constructor(...args: any[]) {
        // Определяем, передан ли объект с данными как единственный аргумент
        const isDataObject =
          args.length === 1 &&
          args[0] !== null &&
          typeof args[0] === 'object' &&
          !(args[0] instanceof Date) &&
          !Array.isArray(args[0]);

        if (isDataObject) {
          // Вызываем super() — property initializers базового класса выполнятся
          super();
          
          const data = args[0] as Partial<InstanceType<T>>;
          
          // Валидация входных данных
          if (validate) {
            validate(data);
          }

          // 1. Применяем defaults из опций декоратора
          Object.assign(this, defaults);
          
          // 2. Property initializers текущего класса уже выполнились 
          //    (TypeScript инициализирует их сразу после super())
          
          // 3. Применяем переданные данные (имеют наивысший приоритет)
          Object.assign(this, data);
        } else {
          // Обычный вызов конструктора с произвольными аргументами
          super(...args);
        }

        // Замораживаем объект если нужно
        if (frozen) {
          Object.freeze(this);
        }
      }

      /**
       * Проверяет, является ли объект экземпляром этого dataclass
       * @example User.isInstance(someObj)
       */
      static isInstance(obj: any): obj is InstanceType<T> {
        return obj instanceof DataclassImpl;
      }

      /**
       * Строковое представление объекта
       */
      toString(): string {
        const entries = Object.entries(this)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(', ');
        return `${target.name}(${entries})`;
      }

      /**
       * Глубокое сравнение двух dataclass объектов по значению
       */
      equals(other: any): boolean {
        if (!DataclassImpl.isInstance(other)) return false;
        return JSON.stringify(this) === JSON.stringify(other);
      }

      /**
       * Создаёт копию объекта с изменёнными полями (удобно для immutable)
       */
      copy(updates: Partial<InstanceType<T>>): InstanceType<T> {
        return new (this.constructor as any)({ ...this, ...updates });
      }

      /**
       * Сериализация в JSON (без служебных полей)
       */
      toJSON(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(this)) {
          result[key] = value;
        }
        return result;
      }
    };

    // Сохраняем оригинальное имя класса
    Object.defineProperty(DataclassImpl, 'name', { value: target.name });
    
    // Копируем статические свойства из оригинального класса
    const staticKeys = Object.getOwnPropertyNames(target).filter(
      key => !['__attrs__', 'length', 'prototype', 'name'].includes(key)
    );

	Object.defineProperty(DataclassImpl, "__attrs__", staticKeys)

    for (const key of staticKeys) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(target, key);
        if (descriptor) {
          Object.defineProperty(DataclassImpl, key, descriptor);
        }
      } catch {
        // Игнорируем read-only свойства
      }
    }

    return DataclassImpl as any;
  };
}