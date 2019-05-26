import { Router as expressRouter } from 'express';
import { AppUtils, Logger } from '@core/utils';
import { ErrorHandling } from '@core/helpers';
import { RouterDecorationOption, RouterProperties, IExpressInternal } from './method-types';
const log = new Logger('Router Decorator');
import path = require('path');

export function Router(uri: string, options: RouterDecorationOption = {}) {
    return function <T extends new (...args: any[]) => any>(constructor: T) {
        // NOTE  a way to fix path to router slashes
        const { prototype } = constructor;
        const router = expressRouter(options);
        const _uri = path.normalize(path.join('/', uri, '/'));

        // NOTE  extend router        
        const routerPrototype = AppUtils.getPrototypeOf(router);
        for (const i in routerPrototype) {
            prototype[i] = routerPrototype[i].bind(router);
        }

        if (options.middleware && options.middleware.length) {
            router.use(`${_uri}`, ErrorHandling.wrapRoute(...options.middleware));
        }

        //* define getter for router instance
        //* this will be used in other decorators 
        // AppUtils.defineProperty(prototype, 'router', { get() { return router }, })

        //* the controller router | base path for router class
        //* all routes will be under this path
        AppUtils.defineProperty(prototype, RouterProperties.RoutesPath, { get() { return _uri } });

        //* mark a class with id
        const id = AppUtils.generateHash();
        AppUtils.defineProperty(prototype, RouterProperties.ID, { get() { return id } })

        //* construct the Router class
        //! #issue {one}, the developer must have the ability to construct their own objects
        // const routerClassinstance = new constructor;
        // AppUtils.defineProperty(prototype, 'instance', { get() { return routerClassinstance }, })
        //* Check if intercept listener defined
        //! If you try to inject the method it runtime
        //! this check will be passed, so it will be like any regular method 
        // const { instance } = routerClassinstance;
        // const { intercept } = instance;
        // if (!!intercept) {
        //     //? fine a way tconstructoro bind intercept method without init an instance of Router class 
        //     router.all(`${routerPath}*`, ...(options.middleware || []), intercept.bind(instance));
        // }
        // //* retrun the created instance mean it will not be able to create another one
        // ! #issue {two} because of the #issue {one} we return the instance and the result will be as discused there
        // return instance;
        return class extends constructor implements IExpressInternal {
            constructor(...args) {
                super(...args);
            }
            __router() {
                return { router, id, uri: _uri };
            }
        }
    }
}

