const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schematicController = require('../controllers/schematicController');

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
        // 使用原始文件名，确保正确处理中文
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, originalName);
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

// 上传原理图
router.post('/upload', upload.single('file'), schematicController.uploadSchematic);

// 搜索原理图
router.get('/search', schematicController.searchSchematics);

// 获取所有原理图
router.get('/', schematicController.searchSchematics);

// 获取单个原理图
router.get('/:id', schematicController.getSchematic);

// 删除原理图
router.delete('/:id', schematicController.deleteSchematic);

// 更新原理图
router.put('/:id', schematicController.updateSchematic);

// 新增的API端点 - 获取正视图
router.get('/:id/front-view', schematicController.getFrontView);

// 获取侧视图
router.get('/:id/side-view', schematicController.getSideView);

// 获取俯视图
router.get('/:id/top-view', schematicController.getTopView);

// 获取材料列表
router.get('/:id/materials', schematicController.getMaterials);

// 下载原理图文件
router.get('/:id/download', schematicController.downloadSchematic);

module.exports = router; 