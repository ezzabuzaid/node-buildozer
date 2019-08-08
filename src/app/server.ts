import { Database } from '@core/database/database';
import { stage, StageLevel } from '@core/helpers';
import { Logger } from '@core/utils';
import { envirnoment } from '@environment/env';
import http = require('http');
import { URL } from 'url';
import { Application } from './app';
import { OLHC, loadOHLCcsv } from './playground/olhc';
const log = new Logger('Server init');
export class NodeServer extends Application {
        private port = +envirnoment.get('PORT') || 8080;
        private host = envirnoment.get('HOST') || '127.0.0.1';
        public path: URL = null;

        /**
         * Invoke this method to start the server
         * @param port server port
         */
        public static async bootstrap() {
                // SECTION server init event
                log.debug('Start boostrapping server');
                envirnoment.load(StageLevel.PROD);
                const server = new NodeServer();
                const httpServer = await server.populateServer();
                const socketList = ['cad', 'gbp', 'eurusd', 'jpy'];
                const sockets: { [index: string]: OLHC } = socketList.reduce((acc, current) => {
                        acc[current] = new OLHC({ noServer: true });
                        return acc;
                }, {});

                server.application.get('/socket/:name', (req, res) => {
                        const { name } = req.params;
                        const stream = loadOHLCcsv(name);
                        const socket = sockets[name];
                        socket.onConnection()
                                .then((ws) => {
                                        function handler(data) {
                                                if (ws.readyState === ws.OPEN) {
                                                        socket.socket.clients.forEach(client => {
                                                                client.send(JSON.stringify({ data, name }));
                                                        });
                                                }
                                        }
                                        const streamListner = stream.on('data', handler);
                                        ws.on('close', () => {
                                                log.warn('CLOSE');
                                                streamListner.removeListener('data', handler);
                                        });
                                });
                        socket.socket.on('error', () => {
                                log.warn('ERROR');
                                stream.destroy();
                        });
                        httpServer.once('upgrade', (request, _socket, head) => {
                                socket.socket.handleUpgrade(request, _socket, head, (ws) => {
                                        socket.socket.emit('connection', ws, request)
                                })
                        });
                        res.status(200).send({ success: true });

                        return;
                });
                await server.init();
        }

        public static async test() {
                log.info('Start Testing');
                envirnoment.load(StageLevel.TEST);
                return (new NodeServer()).init();
        }

        private constructor() {
                super();
                this.path = new URL(`http://${this.host}:${this.port}`);
                log.info(`The env => ${stage.LEVEL}`);
        }

        /**
         *
         * Start the server and return an instance of it.
         * @returns {Promise<httpServer>}
         */
        private populateServer(): Promise<http.Server> {
                return Promise.resolve<http.Server>(this.startServer(this.createServer()));
        }

        private createServer() {
                //     key: fs.readFileSync('./key.pem'),
                //     cert: fs.readFileSync('./cert.pem'),
                //     passphrase: 'YOUR PASSPHRASE HERE'
                return http.createServer(this.application);
        }

        private startServer(server: http.Server) {
                return server.listen(this.path.port, +this.path.hostname, () => {
                        log.info(`${new Date()} Server running at ${this.path.href}`);
                        // SECTION server start event
                });
        }

        private init() {
                const { MONGO_USER: user,
                        MONGO_PASSWORD: password,
                        MONGO_PATH: path,
                        MONGO_HOST: host } = envirnoment.env;
                log.debug(stage.LEVEL);
                try {
                        return Promise.all([
                                this.populateRoutes(),
                                Database.load({ user, password, path, host, atlas: stage.production }),
                        ]);
                } catch (error) {
                        throw new Error(`Faild to init the server ${error}`);
                }

        }
}

// const createDatabaseStatement = 'CREATE DATABASE testDB';
// const createTableStatement = `
// CREATE TABLE testTable (
//         id int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
//         title VARCHAR(255) NOT NULL,
//         body VARCHAR(255) NOT NULL
// )`;

// router.use('/user', function (req, res, next) {
//     console.log('Request URL:', req.originalUrl)
//     next()
//   }, function (req, res, next) {
//     console.log('Request Type:', req.method)
//     next()
//   })
// Show the request info for any type of http method that call user
// ex:: cound how many user middleware called

// app.use(function (req, res, next) {
//     console.log('Time:', Date.now())
//     next()
// })
// Called every time (app here is application instance)

// app.use('/user/:id', function (req, res, next) {
//     console.log('Request Type:', req.method)
//     next()
// })
// Show the request info for any type of http method that call user
// (app here is application instance)

// to escape the next middleware call next('route')
// will escape the all middleware but next() will continue to next middleware at specific point

// This matching all route middleware under route instance and prefixed with api
// router.all('/api/*', requireAuthentication);

// this will only be invoked if the path starts with /bar from the mount point
// router.use('/bar', function (req, res, next) {
// ... maybe some additional /bar logging ...
//     next();
// });

// Intercept id param under route instance and called once at a time (intercept id param)

// router.param('id', function (req, res, next, id) {
//     console.log('CALLED ONLY ONCE');
//     next();
// });

// router.get('/user/:id', function (req, res, next) {
//     console.log('although this matches');
//     next();
// });

// router.get('/user/:id', function (req, res) {
//     console.log('and this matches too');
//     res.end();
// });
// const schema = {
//         id: {
//                 type: 'int UNSIGNED',
//                 value: 'AUTO_INCREMENT',
//                 key: 'PRIMARY KEY'
//         },
//         title: {
//                 type: 'VARCHAR(255)',
//                 value: 'NOT NULL'
//         },
//         body: {
//                 type: 'VARCHAR(255)',
//                 value: 'NOT NULL'
//         }
// };
// function creataTable(tableName, columns) {
//         const columnsNames = Object.keys(columns);
//         const statement = columnsNames.reduce((statment, column, index) => {
//                 const { type, value, key = '' } = columns[column];
//                 let _statment = `${column} ${type} ${value} ${key}`;
//                 _statment = _statment.trim();
//                 if ((index + 1) !== columnsNames.length) {
//                         _statment += ', ';
//                 }
//                 return `${statment}${_statment}`;
//         }, '');
//         return `CREATE TABLE ${tableName} (${statement})`;
// }
// const table = creataTable('FuckTableFromString', schema);
