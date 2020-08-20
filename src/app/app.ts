import ar from '@assets/languages/ar.json';
import en from '@assets/languages/en.json';
import { ErrorHandling, wrapRoutes } from '@core/helpers';
import { Logger } from '@core/utils';
import { translation } from '@lib/translation';
import { Directories } from '@shared/common';
import cors from 'cors';
import sanitize from 'express-mongo-sanitize';
import path from 'path';
import { ApiFactory } from './factory';
import compression = require('compression');
import express = require('express');
import helmet = require('helmet');
import hpp = require('hpp');
import morgan = require('morgan');
import { envirnoment } from '@environment/env';
const log = new Logger('Application');
import webpush from 'web-push';

export class Application {
    public application = express();

    constructor() {
        this.configure();
        this.setupLocalization();
        this.populateRoutes();
        webpush.setVapidDetails('mailto:ezzabuzaid@gmail.com', envirnoment.get('publicVapidKey'), envirnoment.get('privateVapidKey'));
    }

    /**
     * configure the app instance
     * set app variables
     */
    private configure() {
        // TODO: Connect sentry
        this.application
            .use(cors({
                origin: envirnoment.production ? 'https://angular-buildozer.herokuapp.com' : '*',
                optionsSuccessStatus: 200,
            }))
            .use(express.json())
            .use(express.urlencoded({ extended: false }))
            .use(hpp())
            .use(morgan('dev'))
            .use(helmet({
                frameguard: false
            }))
            .use(compression())
            .use(sanitize())
            .use(express.static(Directories.staticDirectory))
            .use(express.static(Directories.uploadDirectory, {
                index: 'index.html',
                maxAge: '10weeks',
            }));

    }

    private populateRoutes() {
        this.application.use((req, res, next) => {
            const acceptLanguage = req.acceptsLanguages();
            const localToUse = acceptLanguage.includes('ar') ? 'ar' : 'en';
            if (translation.local.name !== localToUse) {
                translation.use(localToUse);
            }
            next();
        });

        ApiFactory.routers.forEach(({ router, endpoint: uri }) => {
            this.application.use(path.join('/api', uri), router);
        });

        this.application.use(wrapRoutes(ErrorHandling.favIcon));
        this.application.get('/api', wrapRoutes(() => ({ work: '/API hitted' })));
        this.application.use(wrapRoutes(ErrorHandling.notFound));
    }

    private setupLocalization() {
        translation.add('en', en);
        translation.add('ar', ar);
        translation.use('en');
    }

    public get<T>(key: string): T {
        return this.application.get(key);
    }

    public set(key: string, value: any) {
        this.application.set(key, value);
    }
}
