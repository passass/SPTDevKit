export type ClassType<T> = new (...args: any[]) => T;

export function getValueByPath(obj: any, path: string, defaultValue?: any) {
	if (typeof obj !== "object") return defaultValue === undefined ? obj : defaultValue;
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
        if (result === null || result === undefined || !(key in result)) {
            return defaultValue;
        }
        result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
}

export function getStaticField<T>(instance: object, fieldName: string): T | undefined {
    if (fieldName in instance)
		return (instance as any)[fieldName] as T;
	
	const constructor = instance.constructor;
    
    if (constructor && fieldName in constructor) {
        return (constructor as any)[fieldName] as T;
    }
    
    return undefined;
}

export function copyClassWithStatics<T extends ClassType<any>>(
  SourceClass: T,
  customStatics?: Record<string, any>
): T {
  // Создаем новую функцию-конструктор
  const NewClass: any = function(this: any, ...args: any[]) {
    // Вызываем исходный конструктор
    return new SourceClass(...args);
  };
  
  // Копируем статические поля
  Object.getOwnPropertyNames(SourceClass).forEach(key => {
    if (key !== 'prototype' && key !== 'name' && key !== 'length') {
      const descriptor = Object.getOwnPropertyDescriptor(SourceClass, key);
      if (descriptor) {
        Object.defineProperty(NewClass, key, descriptor);
      }
    }
  });
  
  // Копируем прототип (методы экземпляра)
  NewClass.prototype = Object.create(SourceClass.prototype);
  NewClass.prototype.constructor = NewClass;
  
  // Добавляем свои статические поля (если переданы)
  if (customStatics) {
    Object.entries(customStatics).forEach(([key, value]) => {
      // Проверяем, не занято ли имя
      if (key in NewClass) {
        console.warn(`Static field "${key}" already exists in class, overriding`);
      }
      // Добавляем как обычное свойство (можно переопределить через defineProperty для большей гибкости)
      NewClass[key] = value;
      // Или через defineProperty:
      // Object.defineProperty(NewClass, key, {
      //   value: value,
      //   enumerable: true,
      //   configurable: true,
      //   writable: true
      // });
    });
  }
  
  return NewClass;
}
