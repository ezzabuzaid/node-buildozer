import { Database } from '@core/database';
import { AppUtils, Logger, LoggerLevel } from '@core/utils';
import { envirnoment, EStage } from '@environment/env';
import url, { URL } from 'url';
import { Application } from './app';
import http = require('http');
const log = new Logger('Server');

export class NodeServer extends Application {
        private port = +envirnoment.get('PORT');
        private host = envirnoment.get('HOST');
        private server: http.Server = null;
        public path: URL = null;

        private constructor() {
                super();
                this.path = new URL(`http://${ this.host }:${ this.port }`);
                this.populateServer();
        }

        public static serverUrl(pathname: string) {
                return url.format({
                        protocol: envirnoment.get('PROTOCOL'),
                        host: envirnoment.get('HOST'),
                        port: envirnoment.get('PORT'),
                        pathname: 'api/' + pathname
                });
        }

        public static async bootstrap() {
                const { server } = new NodeServer();
                const database = await NodeServer.loadDatabase();
                return server;
        }

        public static test() {
                Logger.level = LoggerLevel.Off;
                envirnoment.load(EStage.TEST);
        }

        /**
         *
         * Start the server and return an instance of it.
         * @returns {Promise<httpServer>}
         */
        private populateServer(): void {
                if (AppUtils.isNullOrUndefined(this.server)) {
                        this.server = http.createServer(this.application);
                }
                this.startServer();
        }

        private startServer(): void {
                this.server.listen(this.path.port, +this.path.hostname, () => {
                        log.info(`${ new Date() } Server running at ${ this.path.href }`);
                });
        }

        public static loadDatabase() {
                const {
                        MONGO_USER: user,
                        MONGO_PASSWORD: password,
                        MONGO_PATH: path,
                        MONGO_HOST: host
                } = envirnoment.env;
                try {
                        return Database.load({ user, password, path, host, atlas: envirnoment.production });
                } catch (error) {
                        throw new Error(`Faild to init the server ${ error }`);
                }
        }

}
