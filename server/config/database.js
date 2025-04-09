const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // 加载 .env 文件

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', // 从环境变量读取，提供默认值
    port: process.env.DB_PORT || 3306,        // 从环境变量读取，提供默认值
    user: process.env.DB_USER || 'root',       // 从环境变量读取，提供默认值
    password: process.env.DB_PASSWORD,         // 从环境变量读取
    database: process.env.DB_NAME || 'litematic', // 从环境变量读取，提供默认值
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 添加日志
pool.on('connection', (connection) => {
    console.log('数据库连接已建立');
    connection.on('error', (err) => {
        console.error('数据库连接错误:', err);
    });
    connection.on('close', () => {
        console.log('数据库连接已关闭');
    });
});

pool.getConnection()
    .then(connection => {
        console.log('成功连接到数据库');
        connection.release();
    })
    .catch(err => {
        console.error('数据库连接失败:', err);
    });

module.exports = pool; 