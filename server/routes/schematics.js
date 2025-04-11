const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schematicController = require('../controllers/schematicController');
const { validateToken, isAdmin, optionalAuth } = require('../middleware/auth');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('创建上传目录:', uploadDir);
}

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        try {
            // 增强中文文件名处理
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            console.log('原始文件名:', file.originalname);
            console.log('转换后文件名:', originalName);
            
            // 添加时间戳防止文件名冲突，并确保只保留文件名（去掉路径）
            const cleanName = originalName.split(/[\/\\]/).pop();
            const timestamp = Date.now();
            const fileName = `${timestamp}_${cleanName}`;
            
            console.log('最终保存文件名:', fileName);
            cb(null, fileName);
        } catch (error) {
            console.error('文件名处理错误:', error);
            // 出错时使用时间戳作为文件名
            cb(null, `${Date.now()}.litematic`);
        }
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.endsWith('.litematic')) {
            return cb(new Error('只支持 .litematic 文件'));
        }
        cb(null, true);
    }
});

// 需要登录的路由
// 需要登录的路由
// 上传原理图文件
router.post('/upload', validateToken, upload.single('file'), schematicController.uploadSchematic);
// 删除原理图
router.delete('/:id', validateToken, schematicController.deleteSchematic);
// 更新原理图信息
router.put('/:id', validateToken, schematicController.updateSchematic);

// 可选登录的路由（登录后可以看到私有内容）
// 搜索原理图
router.get('/search', optionalAuth, schematicController.searchSchematics);
// 获取原理图列表
router.get('/', optionalAuth, schematicController.searchSchematics);
// 获取单个原理图详情
router.get('/:id', optionalAuth, schematicController.getSchematic);
// 获取原理图正视图
router.get('/:id/front-view', optionalAuth, schematicController.getFrontView);
// 获取原理图侧视图
router.get('/:id/side-view', optionalAuth, schematicController.getSideView);
// 获取原理图俯视图
router.get('/:id/top-view', optionalAuth, schematicController.getTopView);
// 获取原理图所需材料清单
router.get('/:id/materials', optionalAuth, schematicController.getMaterials);
// 下载原理图文件
router.get('/:id/download', optionalAuth, schematicController.downloadSchematic);

module.exports = router; 