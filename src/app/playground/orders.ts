import csv = require('csv-parser');
import fs = require('fs');
import path = require('path');
import Sequelize = require('sequelize');

// tslint:disable-next-line: max-line-length
// sequelize.query(`SELECT * FROM orders WHERE request_time BETWEEN '2019-04-02 21:00:00' AND '2019-04-02 21:00:01'`).then(console.log)
export class Orders extends Sequelize.Model { }
export const init = (sequelize: Sequelize.Sequelize) => Orders.init({
    source: { type: Sequelize.INTEGER },
    order_id: { type: Sequelize.DOUBLE },
    request_time: { type: Sequelize.DATE },
    platform: { type: Sequelize.INTEGER },
    underlying_client: { type: Sequelize.STRING },
    account: { type: Sequelize.STRING },
    side: { type: Sequelize.INTEGER },
    symbol: { type: Sequelize.STRING },
    instrument_type: { type: Sequelize.DOUBLE },
    type: { type: Sequelize.DOUBLE },
    size: { type: Sequelize.DOUBLE },
    size_usd: { type: Sequelize.DOUBLE },
    price: { type: Sequelize.DOUBLE },
    markup: { type: Sequelize.DOUBLE },
    status: { type: Sequelize.DOUBLE },
    fill_size: { type: Sequelize.DOUBLE },
    fill_size_usd: { type: Sequelize.DOUBLE },
    fill_price: { type: Sequelize.DOUBLE },
    message: { type: Sequelize.STRING },
    exec_time: { type: Sequelize.DATE },
    is_mt4_trade: { type: Sequelize.DOUBLE },
    mt4_ticket: { type: Sequelize.DOUBLE },
    mt4_side: { type: Sequelize.DOUBLE },
    mt4_comment: { type: Sequelize.STRING }
}, { sequelize, modelName: 'orders' });