import { randomBytes } from 'crypto';
import { Directories } from '@shared/common';
import { Type } from '@lib/utils';

export class AppUtils {

    static enumValues(enums) {
        return Object.keys(enums).filter(_ => !isNaN(+_)).map(_ => +_);
    }

    static duration(minutes: number) {
        const date = new Date();
        date.setMinutes(date.getMinutes() + minutes);
        return date.getTime();
    }

    /**
     * Convert numeric days to seconds
     *
     * @param days number of days to convert
     */
    static daysToSeconds(days: number) {
        const d = new Date();
        const a = new Date();
        a.setDate(a.getDate() + days);
        return a.getTime() - d.getTime();
    }

    /**
     * Check if the specicifed date elapsed the {maxAge}
     *
     * If max age not provided the current date will be used instead
     *
     * @param date the date to check
     * @param maxAge default to current date
     */
    static isDateElapsed(date: number, maxAge = Date.now()) {
        return date < Date.now() - maxAge;
    }

    /**
     * check if the givin value is object literal
     *
     * @param value the predecited value
     */
    static isObject(value: any): boolean {
        return new Object(value) === value;
    }

    /**
     *
     * @param functions Accept array of function to invoke in inverse order,
     *  so that each function will accept tha value from last invoked function as argument
     */
    static compose<T, Y>(...functions) {
        return (args: T | Y) => functions.reduceRight((acc, fn) => fn(acc), args);
    }

    /**
     *
     * @param functions Accept array of function to invoke in order,
     * so that each function will accept tha value of last invoked function as argument
     */
    static pipe<T, Y>(...functions) {
        return (args: T | Y) => functions.reduce((acc, fn) => fn(acc), args);
    }

    static isTruthy(value: any) {
        return !!value;
    }

    static equals<T>(...values: T[]) {
        return values.every((value, i, arr) => JSON.stringify(value) === JSON.stringify(arr[0]));
    }

    static notEquals<T>(...values: T[]) {
        return !this.equals(...values);
    }

    public static notNullOrUndefined(value: any) {
        return AppUtils.isFalsy(AppUtils.isNullOrUndefined(value));
    }

    public static inverse(value: boolean) {
        return !value;
    }

    /**
     * remove null and undefined properties from an object expect empty string
     * @param withEmptyString to indicate of the empty values should be removed
     */
    static excludeEmptyKeys(object: object, withEmptyString = false) {
        const replaceUndefinedOrNull = (key: string, value: any) => {
            if (withEmptyString) {
                return this.isEmptyString(value) || this.isNullOrUndefined(value)
                    ? undefined
                    : value;
            } else {
                return this.isNullOrUndefined(value) ? undefined : value;
            }
        };
        return JSON.parse(JSON.stringify(object, replaceUndefinedOrNull));
    }

    public static isEmptyString(value: string): boolean {
        return typeof value !== 'string' || value === '';
    }

    public static isFunction(value: any) {
        return value instanceof Function;
    }

    public static isFalsy(value: any) {
        return !!!value;
    }

    public static not(value: any) {
        return !value;
    }

    public static setPrototypeOf(constructor: object, superConstructor: object) {
        Object.setPrototypeOf(constructor, superConstructor);
    }

    public static getPrototypeOf<T>(constructor): Type<T> {
        return Object.getPrototypeOf(constructor);
    }

    public static getTypeOf<T>(constructor): Type<T> {
        return this.getPrototypeOf<T>(constructor).constructor as any;
    }

    public static cloneObject(obj) {
        const clone = {};
        for (const i in obj) {
            if (obj[i] !== null && typeof (obj[i]) === 'object') {
                clone[i] = this.cloneObject(obj[i]);
            } else { clone[i] = obj[i]; }
        }
        return clone;
    }

    public static defineProperty(prototype: object, propertyKey: string, options: PropertyDescriptor) {
        return Object.defineProperty(prototype, propertyKey, {
            enumerable: false, // cannot show in keys and for in
            configurable: false // the settings cannot be changed anymore
            , ...options
        });
    }

    public static isPromise(value: any) {
        return Boolean(value && typeof value.then === 'function');
    }

    public static joinPath(...path) {
        const connectedPath = path.join('/');
        const cleanedPath = connectedPath.split('/').filter((_path) => !!_path);
        cleanedPath.unshift(null);
        return cleanedPath.join('/');
    }

    public static generateHash() {
        return randomBytes(20).toString('hex');
    }

    public static getter(object) {
        return Object.keys(object).filter((el) => typeof object[el].get === 'function');
    }

    public static setter(object) {
        return Object.keys(object).filter((el) => typeof object[el].set === 'function');
    }

    public static methods(object) {
        return Object.keys(object).filter((el) => typeof object[el].value === 'function');
    }

    public static removeKey<T>(key: keyof T, obj: T) {
        const { [key]: foo, ...rest } = obj;
        return rest;
    }

    public static pickProperties(obj, keys) {
        return { ...{ ...keys.map((k) => k in obj ? { [k]: obj[k] } : {}) } };
    }

    public static omitProperties(obj, keys) {
        return Object.assign({}, ...Object.keys(obj).filter((k) => !keys.includes(k)).map((k) => ({ [k]: obj[k] })));
    }

    public static isNullOrUndefined(value: any) {
        return value === undefined || value === null;
    }

    /**
     *
     * @param object check if the list has at least an item
     */
    public static hasItemWithin(object: any) {
        if (Array.isArray(object)) {
            return AppUtils.isTruthy(object.length);
        }

        if (new Object(object) === object) {
            return AppUtils.isTruthy(Object.keys(object).length);
        }

        return AppUtils.isFalsy(AppUtils.isEmptyString(object));
    }

    /**
     * check if the givin value is empty
     *
     * supported values are string, array, pojo {}
     */
    static isEmpty(value: any) {
        return AppUtils.isFalsy(AppUtils.hasItemWithin(value));
    }

    public static extendObject<T>(target: T, source1: Partial<T>): T {
        return Object.assign(target, source1);
    }

    public static getProps<T>(target: T, ...keys: Array<keyof T>): Partial<T> {
        return keys.reduce((acc, key) => {
            acc[key] = target[key];
            return acc;
        }, {} as any);
    }

    public static generateAlphabeticString(stringLength = 5) {
        let randomString = '';
        let randomAscii: number;
        const asciiLow = 65;
        const asciiHigh = 90;
        for (let i = 0; i < stringLength; i++) {
            randomAscii = Math.floor((Math.random() * (asciiHigh - asciiLow)) + asciiLow);
            randomString += String.fromCharCode(randomAscii);
        }
        return randomString;
    }

    public static generateRandomString(): any {
        return Math.random().toString(36).substr(5, 5);
    }

    public static flatArray(data: any[]) {
        return data.reduce((a, b) => a.concat(b), []);
    }

    public static lastElement(array: any[]) {
        return array[array.length - 1];
    }

    public static renderHTML(templatePath: string, object) {
        const template = Directories.getTemplate(templatePath);
        return template.match(/\{{(.*?)\}}/ig).reduce((acc, binding) => {
            const property = binding.substring(2, binding.length - 2);
            return `${ acc }${ template.replace(/\{{(.*?)\}}/, object[property]) }`;
        }, '');
    }

}

export type OmitProperties<T, P> = Pick<T, { [key in keyof T]: T[key] extends P ? never : key }[keyof T]>;
export type PickAttr<T, K extends keyof T> = T[K];
export type ThenArg<T> = T extends Promise<infer U> ? U : T;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export function cast<T>(arg: any) {
    return arg as T;
}
export type DeepPartial<T> =
    T extends (Type<any> | Date)
    ? T
    : (T extends object
        ? { [P in keyof T]?: DeepPartial<T[P]>; }
        : T);
