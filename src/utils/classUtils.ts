export type ClassType<T> = new (...args: any[]) => T;

export function getStaticField<T>(instance: object, fieldName: string): T | undefined {
    if (fieldName in instance)
		return (instance as any)[fieldName] as T;
	
	const constructor = instance.constructor;
    
    if (constructor && fieldName in constructor) {
        return (constructor as any)[fieldName] as T;
    }
    
    return undefined;
}
