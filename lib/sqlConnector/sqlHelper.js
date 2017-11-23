const sql = require('mssql');
var connected = false;
var request;
var pool;

/*
var dbConfig = {
    user: 'sales_admin',
    password: 'sales_admin',
    server: 'localhost\\SQLEXPRESS',
    database: 'sales',
    requestTimeout: 0,
    connectionTimeout: 3600000
}
*/
const dbConfig = {
    user: '',
    password: '',
    server: '.database.windows.net',
    database: 'sales',
    requestTimeout: 0,
    connectionTimeout: 3600000,
    options: {
        encrypt: true
    }
}

var connect = function () {

    return new Promise((resolve, reject) => {
        if (connected === false) {

            sql.connect(dbConfig).then(newPool => {
                connected = true;
                request = newPool.request();
                pool = newPool;
                resolve();
            });
        }
    });
}

exports.connect = connect;
exports.request = request;