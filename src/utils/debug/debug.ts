// src/utils/decorators.ts

/**
 * Логирует вызовы методов класса
 * @param logLevel - уровень логирования ('debug' | 'info' | 'warn' | 'error')
 */
export function LogCalls(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug') {
    return function <T extends { new (...args: any[]): any }>(target: T): T {
        const className = target.name;

        return new Proxy(target, {
            construct(ctor, args) {
                const instance = new ctor(...args);
                const prototype = Object.getPrototypeOf(instance);

                // Получаем все методы класса
                const methodNames = Object.getOwnPropertyNames(prototype)
                    .filter(name => 
                        name !== 'constructor' && 
                        typeof prototype[name] === 'function'
                    );

                for (const methodName of methodNames) {
                    const originalMethod = prototype[methodName];
                    
                    prototype[methodName] = function (...methodArgs: any[]) {
                        const startTime = performance.now();
                        const argsString = methodArgs.map(arg => {
                            if (arg === null) return 'null';
                            if (arg === undefined) return 'undefined';
                            if (typeof arg === 'object') {
                                try {
                                    return JSON.stringify(arg);
                                } catch {
                                    return String(arg);
                                }
                            }
                            return String(arg);
                        }).join(', ');

                        const logMessage = `[${className}.${methodName}](${argsString})`;

                        if (logLevel === 'debug') console.debug('🔍', logMessage, 'start');
                        else if (logLevel === 'info') console.info('ℹ️', logMessage);
                        else if (logLevel === 'warn') console.warn('⚠️', logMessage);
                        else if (logLevel === 'error') console.error('❌', logMessage);

                        try {
                            const result = originalMethod.apply(this, methodArgs);
                            const endTime = performance.now();
                            const duration = (endTime - startTime).toFixed(2);

                            if (logLevel === 'debug') {
                                console.debug('✅', `[${className}.${methodName}]`, `done in ${duration}ms`, 'result:', result);
                            } else if (logLevel === 'info') {
                                console.info('✅', `[${className}.${methodName}]`, `done in ${duration}ms`);
                            }

                            return result;
                        } catch (error) {
                            console.error('❌', `[${className}.${methodName}]`, 'error:', error);
                            throw error;
                        }
                    };
                }

                return instance;
            }
        });
    };
}

/**
 * Логирует только методы, помеченные декоратором @LogMethod
 */
export function LogMethod(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const className = target.constructor?.name || 'UnknownClass';
            const startTime = performance.now();
            
            const argsString = args.map(arg => {
                if (arg === null) return 'null';
                if (arg === undefined) return 'undefined';
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(', ');

            const logMessage = `[${className}.${propertyKey}](${argsString})`;

            if (logLevel === 'debug') console.debug('🔍', logMessage, 'start');
            else if (logLevel === 'info') console.info('ℹ️', logMessage);
            else if (logLevel === 'warn') console.warn('⚠️', logMessage);
            else if (logLevel === 'error') console.error('❌', logMessage);

            try {
                const result = originalMethod.apply(this, args);
                const endTime = performance.now();
                const duration = (endTime - startTime).toFixed(2);

                if (logLevel === 'debug') {
                    console.debug('✅', `[${className}.${propertyKey}]`, `done in ${duration}ms`, 'result:', result);
                } else if (logLevel === 'info') {
                    console.info('✅', `[${className}.${propertyKey}]`, `done in ${duration}ms`);
                }

                return result;
            } catch (error) {
                console.error('❌', `[${className}.${propertyKey}]`, 'error:', error);
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * Логирует вызовы всех методов класса (декорирует класс целиком)
 * Альтернативный вариант через прокси
 */
export function LogAllMethods(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug') {
    return function (target: any) {
        const className = target.name;
        const descriptors = Object.getOwnPropertyDescriptors(target.prototype);

        for (const [methodName, descriptor] of Object.entries(descriptors)) {
            if (methodName === 'constructor') continue;
            if (typeof descriptor.value !== 'function') continue;

            const originalMethod = descriptor.value;

            Object.defineProperty(target.prototype, methodName, {
                ...descriptor,
                value: function (...args: any[]) {
                    const startTime = performance.now();
                    
                    const argsString = args.map(arg => {
                        if (arg === null) return 'null';
                        if (arg === undefined) return 'undefined';
                        if (typeof arg === 'object') {
                            try {
                                return JSON.stringify(arg);
                            } catch {
                                return String(arg);
                            }
                        }
                        return String(arg);
                    }).join(', ');

                    const logMessage = `${className}.${methodName}(${argsString})`;

                    if (logLevel === 'debug') console.debug('🔍', logMessage, 'start');
                    else if (logLevel === 'info') console.info('ℹ️', logMessage);
                    else if (logLevel === 'warn') console.warn('⚠️', logMessage);
                    else if (logLevel === 'error') console.error('❌', logMessage);

                    try {
                        const result = originalMethod.apply(this, args);
                        const endTime = performance.now();
                        const duration = (endTime - startTime).toFixed(2);

                        if (logLevel === 'debug') {
                            console.debug('✅', `[${className}.${methodName}]`, `done in ${duration}ms`, 'result:', result);
                        } 
						// else if (logLevel === 'info') {
                        //     console.info('✅', `[${className}.${methodName}]`, `done in ${duration}ms`);
                        // }

                        return result;
                    } catch (error) {
                        console.error('❌', `[${className}.${methodName}]`, 'error:', error);
                        throw error;
                    }
                }
            });
        }

        return target;
    };
}

/**
 * Логирует вызовы с заданным именем метода
 */
export function LogIf(condition: (methodName: string, ...args: any[]) => boolean, logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (condition(propertyKey, ...args)) {
                const className = target.constructor?.name || 'UnknownClass';
                const argsString = args.map(arg => {
                    if (arg === null) return 'null';
                    if (arg === undefined) return 'undefined';
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg);
                        } catch {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(', ');

                const logMessage = `[${className}.${propertyKey}](${argsString})`;

                if (logLevel === 'debug') console.debug('🔍', logMessage);
                else if (logLevel === 'info') console.info('ℹ️', logMessage);
                else if (logLevel === 'warn') console.warn('⚠️', logMessage);
                else if (logLevel === 'error') console.error('❌', logMessage);
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}