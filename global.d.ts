import request = require('supertest');
declare var global: NodeJS.Global;

declare global {
    namespace NodeJS {
        export interface Global {
            superAgent: request.SuperTest<request.Test>;
        }
        export interface ProcessEnv {
            MONGO_USER: string
            MONGO_PASSWORD: string;
            MONGO_PATH: string
            JWT_SECRET_KEY: string
            NODE_ENV: string;
            CLIENT_RESETPASSWORD_URL: string;
            privateVapidKey: string;
            publicVapidKey: string;
        }
    }
}

