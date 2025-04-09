const Schematic = require('../models/schematic');
const { processLitematicFile } = require('../utils/fileProcessor');
const fs = require('fs');
const path = require('path');

exports.uploadSchematic = async (req, res) => {
    try {
        console.log('收到上传请求');
        console.log('请求头:', req.headers);
        
        if (!req.file) {
            console.error('没有文件被上传');
            return res.status(400).json({ error: '请上传文件' });
        }
        
        // 确保文件名编码正确
        const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        const fileNameWithoutExt = path.basename(originalName, '.litematic');
        
        console.log('上传的文件信息:', {
            originalname: originalName,
            filenameWithoutExt: fileNameWithoutExt,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        console.log('开始处理文件...');
        const result = await processLitematicFile(req.file.path);
        console.log('文件处理完成');
        
        // 检查处理结果
        if (!result.original || !result.topViewPath || !result.sideViewPath || !result.frontViewPath || !result.materials) {
            throw new Error('文件处理结果不完整');
        }
        
        console.log('保存到数据库...');
        const schematicId = await Schematic.create({
            name: fileNameWithoutExt, // 使用处理后的文件名
            filePath: result.original,
            topViewPath: result.topViewPath,
            sideViewPath: result.sideViewPath,
            frontViewPath: result.frontViewPath,
            materials: result.materials
        });
        console.log('保存到数据库完成，ID:', schematicId);

        // 删除临时文件
        try {
            fs.unlinkSync(req.file.path);
            console.log('临时文件已删除:', req.file.path);
        } catch (error) {
            console.error('删除临时文件失败:', error);
        }

        res.json({ 
            success: true,
            id: schematicId,
            message: '文件上传成功'
        });
    } catch (error) {
        console.error('上传过程中发生错误:', error);
        // 发生错误时也尝试删除临时文件
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('错误后删除临时文件:', req.file.path);
            } catch (err) {
                console.error('删除临时文件失败:', err);
            }
        }
        res.status(500).json({ error: error.message });
    }
};

exports.searchSchematics = async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        console.log('搜索关键词:', keyword);
        
        // 如果关键词为空，获取所有原理图
        const schematics = await Schematic.search(keyword);
        console.log(`找到 ${schematics.length} 个结果`);
        
        if (schematics.length === 0) {
            return res.json([]); // 返回空数组而不是错误
        }
        
        // 处理结果，添加API路径
        const results = schematics.map(schematic => ({
            id: schematic.id,
            name: schematic.name,
            created_at: schematic.created_at,
            apiUrls: {
                frontView: `/api/schematics/${schematic.id}/front-view`,
                sideView: `/api/schematics/${schematic.id}/side-view`,
                topView: `/api/schematics/${schematic.id}/top-view`,
                materials: `/api/schematics/${schematic.id}/materials`,
                download: `/api/schematics/${schematic.id}/download`
            }
        }));
        
        res.json(results);
    } catch (error) {
        console.error('搜索出错:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getSchematic = async (req, res) => {
    try {
        const schematic = await Schematic.getById(req.params.id);
        if (!schematic) {
            return res.status(404).json({ error: '原理图不存在' });
        }

        // 读取材料数据
        let materials = {};
        if (schematic.materials) {
            try {
                // 尝试解析已存储的JSON
                if (typeof schematic.materials === 'string') {
                    materials = JSON.parse(schematic.materials);
                } else if (typeof schematic.materials === 'object') {
                    materials = schematic.materials;
                }
            } catch (error) {
                console.error('解析材料数据失败:', error);
            }
        }

        // 返回原理图详情，包含API URLs
        res.json({
            id: schematic.id,
            name: schematic.name,
            frontViewPath: `/api/schematics/${schematic.id}/front-view`,
            sideViewPath: `/api/schematics/${schematic.id}/side-view`,
            topViewPath: `/api/schematics/${schematic.id}/top-view`,
            materialsPath: `/api/schematics/${schematic.id}/materials`,
            downloadPath: `/api/schematics/${schematic.id}/download`,
            materials: materials,
            created_at: schematic.created_at
        });
    } catch (error) {
        console.error('获取原理图详情失败:', error);
        res.status(500).json({ error: '获取原理图详情失败' });
    }
};

exports.getFrontView = async (req, res) => {
    try {
        const schematic = await Schematic.getById(req.params.id);
        if (!schematic) {
            return res.status(404).json({ error: '原理图不存在' });
        }

        const filePath = path.join(__dirname, '../uploads', schematic.front_view_path);
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: '正视图文件不存在' });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('获取正视图失败:', error);
        res.status(500).json({ error: '获取正视图失败' });
    }
};

exports.getSideView = async (req, res) => {
    try {
        const schematic = await Schematic.getById(req.params.id);
        if (!schematic) {
            return res.status(404).json({ error: '原理图不存在' });
        }

        const filePath = path.join(__dirname, '../uploads', schematic.side_view_path);
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: '侧视图文件不存在' });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('获取侧视图失败:', error);
        res.status(500).json({ error: '获取侧视图失败' });
    }
};

exports.getTopView = async (req, res) => {
    try {
        const schematic = await Schematic.getById(req.params.id);
        if (!schematic) {
            return res.status(404).json({ error: '原理图不存在' });
        }

        const filePath = path.join(__dirname, '../uploads', schematic.top_view_path);
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: '俯视图文件不存在' });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('获取俯视图失败:', error);
        res.status(500).json({ error: '获取俯视图失败' });
    }
};

exports.getMaterials = async (req, res) => {
    try {
        const schematic = await Schematic.getById(req.params.id);
        if (!schematic) {
            return res.status(404).json({ error: '原理图不存在' });
        }

        // 处理材料数据
        let materials = {};
        if (schematic.materials) {
            try {
                // 尝试解析已存储的JSON
                if (typeof schematic.materials === 'string') {
                    materials = JSON.parse(schematic.materials);
                } else if (typeof schematic.materials === 'object') {
                    materials = schematic.materials;
                }
            } catch (error) {
                console.error('解析材料数据失败:', error);
                // 如果解析失败，尝试从文件读取
                materials = await Schematic.getMaterialsData(schematic.materials);
            }
        }
        
        res.json(materials);
    } catch (error) {
        console.error('获取材料列表失败:', error);
        res.status(500).json({ error: '获取材料列表失败' });
    }
};

exports.downloadSchematic = async (req, res) => {
    try {
        const schematic = await Schematic.getById(req.params.id);
        if (!schematic) {
            return res.status(404).json({ error: '原理图不存在' });
        }

        const filePath = path.join(__dirname, '../uploads', schematic.file_path);
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: '原理图文件不存在' });
        }

        res.download(filePath, `${schematic.name}.litematic`);
    } catch (error) {
        console.error('下载原理图失败:', error);
        res.status(500).json({ error: '下载原理图失败' });
    }
};

exports.updateSchematic = async (req, res) => {
    try {
        console.log('更新原理图, ID:', req.params.id);
        console.log('更新数据:', req.body);
        await Schematic.update(req.params.id, req.body);
        console.log('更新成功');
        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新原理图出错:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSchematic = async (req, res) => {
    try {
        const schematic = await Schematic.getById(req.params.id);
        if (!schematic) {
            return res.status(404).json({ error: '原理图不存在' });
        }

        // 删除整个目录
        const baseDir = path.join(__dirname, '../uploads');
        const dirToDelete = path.join(baseDir, path.dirname(schematic.file_path));
        console.log('尝试删除目录:', dirToDelete);
        if (fs.existsSync(dirToDelete)) {
            fs.rmdirSync(dirToDelete, { recursive: true });
            console.log('成功删除目录:', dirToDelete);
        } else {
            console.log('目录不存在或路径无效:', dirToDelete);
        }

        await Schematic.delete(req.params.id);
        console.log('删除成功');
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除原理图出错:', error);
        res.status(500).json({ error: error.message });
    }
}; 