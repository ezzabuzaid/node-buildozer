import { RequestHandler } from 'express';
import { define, METHODS } from '.';

export function HttpGet(uri = '/', ...middlewares: RequestHandler[]) {
    return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function(...args: any[]) {
            return originalMethod.apply(this, args);
        };
        define({ method: METHODS.GET, uri, middlewares, target, propertyKey });
    };
}
