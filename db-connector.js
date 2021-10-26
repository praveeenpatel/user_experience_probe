// Load module
var mysql = require('mysql');
// Initialize pool
var pool      =    mysql.createPool({
    connectionLimit : 10,
    host     : '139.59.70.21',
    user     : 'root',
    password : '8ZEdgfVh2Xtbrx8Cp',
    database : 'test_scripts',
    debug    :  false
});    
module.exports = pool;