require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const schematicsRouter = require('./routes/schematics');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.litematic')) {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment');
        }
    }
}));

// 请求日志
app.use((req, res, next) => {
    console.log(`请求方法: ${req.method}, 请求路径: ${req.url}`);
    next();
});

// 路由配置
app.use('/api/schematics', schematicsRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 