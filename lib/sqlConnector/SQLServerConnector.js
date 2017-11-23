const sql = require('mssql');
var sqlHelper = require('./sqlHelper.js');

class SQLServerConnector {

    constructor() {
    }

    initialize() {
        return sqlHelper.connect();
    }

    bulkInsertValues(sensorValues) {

        const table = new sql.Table('sensorValues');
        table.create = false;
        table.columns.add('uid', sql.VarChar(6), { nullable: false });
        table.columns.add('time', sql.VarChar(30), { nullable: false });
        table.columns.add('value', sql.Float, { nullable: false });
        
        // add here rows to insert into the table
        sensorValues.forEach((value) => {
            table.rows.add(value.uid, value.time, value.value);
        })

        const request = new sql.Request();
        return request.bulk(table);
    }

}

exports.SQLServerConnector = SQLServerConnector;