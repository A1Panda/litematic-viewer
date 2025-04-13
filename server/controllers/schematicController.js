const Schematic = require('../models/schematic');
const { processLitematicFile } = require('../utils/fileProcessor');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const schematicController = {
    async uploadSchematic(req, res) {
        if (!req.user) {
            return res.status(401).json({ error: '需要登录' });
        }

        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: '未提供文件' });
            }

            if (!file.originalname.endsWith('.litematic')) {
                return res.status(400).json({ error: '只支持 .litematic 文件' });
            }

            // 从文件路径中提取文件名（不使用originalName，因为它可能有编码问题）
            const savedFileName = path.basename(file.path);
            console.log('保存文件:', savedFileName);
            
            // 从文件名中提取原始名称（移除时间戳前缀）
            const nameMatch = savedFileName.match(/_(.+)$/);
            const displayName = nameMatch ? nameMatch[1] : savedFileName;
            
            // 获取相对于uploads目录的文件路径
            const uploadsDir = path.join(__dirname, '../uploads');
            const relativeFilePath = path.relative(uploadsDir, file.path).replace(/\\/g, '/');
            
            let schematicData = {
                name: displayName,
                filePath: relativeFilePath,
                user_id: req.user.id,
                is_public: true
            };

            // 处理文件，生成三视图和材料列表
            try {
                console.log('处理文件，生成三视图...');
                const processResult = await processLitematicFile(file.path);
                
                // 读取材料清单文件内容
                let materialsData = processResult.materials;
                if (processResult.materials && !processResult.materials.startsWith('{')) {
                    try {
                        const materialsFullPath = path.join(__dirname, '../uploads', processResult.materials);
                        if (fs.existsSync(materialsFullPath)) {
                            const materialsContent = fs.readFileSync(materialsFullPath, 'utf8');
                            // 测试是否是有效的JSON
                            JSON.parse(materialsContent);
                            materialsData = materialsContent;
                        }
                    } catch (error) {
                        console.error('读取材料清单失败:', error);
                    }
                }
                
                // 更新数据对象，添加三视图和材料列表
                schematicData = {
                    ...schematicData,
                    topViewPath: processResult.topViewPath,
                    sideViewPath: processResult.sideViewPath,
                    frontViewPath: processResult.frontViewPath,
                    materials: materialsData,
                    filePath: processResult.original // 使用处理后的原始文件路径
                };
                
                console.log('原理图数据准备完成');
            } catch (error) {
                console.error('生成三视图失败:', error);
                // 即使生成三视图失败，我们仍然会保存原理图信息
            }

            // 添加用户ID到原理图数据中
            const schematicId = await Schematic.create(schematicData);
            
            // 获取创建后的原理图数据
            const [schematics] = await pool.query(
                `SELECT s.*, u.username as creator_name 
                FROM schematics s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = ?`,
                [schematicId]
            );

            res.status(201).json(schematics[0] || { id: schematicId });
        } catch (error) {
            console.error('上传失败:', error);
            res.status(500).json({ error: '上传失败' });
        }
    },

    async searchSchematics(req, res) {
        try {
            const searchTerm = req.query.q || '';
            const userId = req.user?.id;
            const isAdmin = req.user?.role === 'admin';
            
            let query;
            let params;
            
            if (isAdmin) {
                // 管理员可以看到所有原理图
                query = `
                    SELECT s.*, u.username as creator_name 
                    FROM schematics s 
                    JOIN users u ON s.user_id = u.id 
                    WHERE s.name LIKE ? 
                    ORDER BY s.created_at DESC
                `;
                params = [`%${searchTerm}%`];
            } else {
                // 普通用户只能看到公开的和自己的原理图
                query = `
                    SELECT s.*, u.username as creator_name 
                    FROM schematics s 
                    JOIN users u ON s.user_id = u.id 
                    WHERE s.name LIKE ? 
                    AND (s.is_public = true OR s.user_id = ?)
                    ORDER BY s.created_at DESC
                `;
                params = [`%${searchTerm}%`, userId || 0];
            }
            
            const [schematics] = await pool.query(query, params);
            console.log(`搜索原理图 "${searchTerm}", 返回 ${schematics.length} 个结果`);
            
            res.json(schematics);
        } catch (error) {
            console.error('搜索失败:', error);
            res.status(500).json({ error: '搜索失败' });
        }
    },

    async getSchematic(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const isAdmin = req.user?.role === 'admin';
            
            let query;
            let params;
            
            if (isAdmin) {
                // 管理员可以访问任何原理图
                query = `
                    SELECT s.*, u.username as creator_name 
                    FROM schematics s 
                    JOIN users u ON s.user_id = u.id 
                    WHERE s.id = ?
                `;
                params = [id];
            } else {
                // 普通用户只能访问公开的或自己的原理图
                query = `
                    SELECT s.*, u.username as creator_name 
                    FROM schematics s 
                    JOIN users u ON s.user_id = u.id 
                    WHERE s.id = ? AND (s.is_public = true OR s.user_id = ?)
                `;
                params = [id, userId || 0];
            }

            const [schematics] = await pool.query(query, params);

            if (schematics.length === 0) {
                return res.status(404).json({ error: '原理图不存在或无权访问' });
            }

            const schematic = schematics[0];
            console.log(`获取原理图 ID: ${id}, 名称: ${schematic.name}`);
            
            // 处理文件路径，转换为可访问的URL
            const urlPrefix = `/uploads/`;
            
            // 完整路径处理函数，支持新的文件存储结构
            const getFullPath = (filePath) => {
                if (!filePath) return null;
                
                // 检查这是否是存储在新格式中的路径
                if (filePath.includes('processed')) {
                    // 获取路径的所有部分
                    const pathParts = filePath.split(/[\/\\]/); // 同时处理正斜杠和反斜杠
                    
                    // 查找processed的位置
                    const processedIndex = pathParts.findIndex(part => part === 'processed');
                    if (processedIndex >= 0 && processedIndex + 2 < pathParts.length) {
                        // 找到了processed目录，并且后面至少有timestamp和文件名
                        const timestamp = pathParts[processedIndex + 1]; // 时间戳目录名
                        const fileName = pathParts[processedIndex + 2]; // 文件名
                        return `${urlPrefix}processed/${timestamp}/${fileName}`;
                    }
                }
                
                // 如果是旧格式存储的文件(没有processed目录)
                // 直接使用文件名部分
                const fileName = path.basename(filePath);
                return `${urlPrefix}${fileName}`;
            };
            
            const result = {
                ...schematic,
                file_path: getFullPath(schematic.file_path),
                top_view_path: getFullPath(schematic.top_view_path),
                side_view_path: getFullPath(schematic.side_view_path),
                front_view_path: getFullPath(schematic.front_view_path)
            };

            res.json(result);
        } catch (error) {
            console.error('获取原理图失败:', error);
            res.status(500).json({ error: '获取原理图失败' });
        }
    },

    async deleteSchematic(req, res) {
        if (!req.user) {
            return res.status(401).json({ error: '需要登录' });
        }

        try {
            const { id } = req.params;
            const userId = req.user.id;
            const isAdmin = req.user.role === 'admin';

            // 检查权限
            const [schematics] = await pool.query(
                'SELECT * FROM schematics WHERE id = ?',
                [id]
            );

            if (schematics.length === 0) {
            return res.status(404).json({ error: '原理图不存在' });
        }

            const schematic = schematics[0];
            if (schematic.user_id !== userId && !isAdmin) {
                return res.status(403).json({ error: '没有权限删除此原理图' });
            }

            // 使用Schematic.delete方法同时删除数据库记录和文件
            console.log(`删除原理图 ID: ${id}, 名称: ${schematic.name}`);
            await Schematic.delete(id);
            
            res.json({ message: '删除成功' });
    } catch (error) {
            console.error('删除失败:', error);
            res.status(500).json({ error: '删除失败: ' + (error.message || '未知错误') });
        }
    },

    async updateSchematic(req, res) {
        if (!req.user) {
            return res.status(401).json({ error: '需要登录' });
        }

        try {
            const { id } = req.params;
            const { name, is_public } = req.body;
            const userId = req.user.id;
            const isAdmin = req.user.role === 'admin';

            // 检查权限
            const [schematics] = await pool.query(
                'SELECT * FROM schematics WHERE id = ?',
                [id]
            );

            if (schematics.length === 0) {
            return res.status(404).json({ error: '原理图不存在' });
        }

            const schematic = schematics[0];
            if (schematic.user_id !== userId && !isAdmin) {
                return res.status(403).json({ error: '没有权限修改此原理图' });
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (is_public !== undefined) updateData.is_public = is_public;

            await pool.query(
                'UPDATE schematics SET ? WHERE id = ?',
                [updateData, id]
            );

            const [updatedSchematic] = await pool.query(
                `SELECT s.*, u.username as creator_name 
                FROM schematics s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = ?`,
                [id]
            );

            res.json(updatedSchematic[0]);
        } catch (error) {
            console.error('更新失败:', error);
            res.status(500).json({ error: '更新失败' });
        }
    },

    // 其他现有的方法（如 getFrontView, getSideView 等）也需要添加类似的权限检查
    async getFrontView(req, res) {
        await checkAccessAndServeFile(req, res, 'front_view_path');
    },

    async getSideView(req, res) {
        await checkAccessAndServeFile(req, res, 'side_view_path');
    },

    async getTopView(req, res) {
        await checkAccessAndServeFile(req, res, 'top_view_path');
    },

    async getMaterials(req, res) {
        await checkAccessAndServeFile(req, res, 'materials');
    },

    async downloadSchematic(req, res) {
        await checkAccessAndServeFile(req, res, 'file_path');
    }
};

// 辅助方法：检查访问权限并提供文件
async function checkAccessAndServeFile(req, res, fieldName) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';

        // 使用管理员查询逻辑，确保能够访问所有原理图，无论公开与否
        let query;
        let params;
        
        if (isAdmin) {
            // 管理员可以访问任何原理图
            query = `
                SELECT s.*, u.username as creator_name 
                FROM schematics s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = ?
            `;
            params = [id];
        } else {
            // 普通用户只能访问公开的或自己的原理图
            query = `
                SELECT s.*, u.username as creator_name 
                FROM schematics s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = ? AND (s.is_public = true OR s.user_id = ?)
            `;
            params = [id, userId || 0];
        }

        const [schematics] = await pool.query(query, params);

        if (schematics.length === 0) {
            return res.status(404).json({ error: '原理图不存在或无权访问' });
        }

        const schematic = schematics[0];
        
        if (fieldName === 'materials') {
            // 如果是JSON格式的材料列表，直接返回
            if (typeof schematic.materials === 'object' || 
                (typeof schematic.materials === 'string' && schematic.materials.startsWith('{'))) {
                try {
                    const materialsData = typeof schematic.materials === 'string' 
                        ? JSON.parse(schematic.materials) 
                        : schematic.materials;
                    return res.json(materialsData);
                } catch (error) {
                    console.error('解析材料数据失败:', error);
                    return res.status(500).json({ error: '解析材料数据失败' });
                }
            }
            
            // 如果是文件路径，则读取文件 (兼容旧数据)
            const filePath = schematic.materials;
            if (!filePath) {
                return res.status(404).json({ error: '材料数据不存在' });
            }
            
            // 获取完整文件路径 - 支持新的存储结构
            let fullPath = '';
            
            // 使用绝对路径
            if (path.isAbsolute(filePath)) {
                // 如果是绝对路径，直接使用
                fullPath = filePath;
            } 
            // 处理相对于processed目录的路径
            else if (filePath.includes('processed')) {
                // 如果路径包含processed关键字，则是使用新的目录结构
                // 确保路径包含uploads目录
                if (filePath.startsWith('uploads/')) {
                    fullPath = path.join(__dirname, '../', filePath);
                } else if (filePath.startsWith('processed/')) {
                    // 修复路径，确保包含uploads目录
                    fullPath = path.join(__dirname, '../uploads', filePath);
                } else {
                    // 完全自定义路径
                    fullPath = path.join(__dirname, '../uploads', filePath);
                }
            } 
            // 处理旧版本的简单文件名
            else {
                // 否则假设是直接保存在uploads目录下的文件
                fullPath = path.join(__dirname, '../uploads', path.basename(filePath));
            }
            
            if (!fs.existsSync(fullPath)) {
                console.error('材料文件不存在:', fullPath);
                return res.status(404).json({ error: '材料文件不存在' });
            }
            
            try {
                const materialsData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                res.json(materialsData);
            } catch (error) {
                console.error('读取材料文件失败:', error);
                res.status(500).json({ error: '读取材料文件失败' });
            }
            return;
        }
        
        // 处理其他文件类型
        const filePath = schematic[fieldName];
        if (!filePath) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 获取完整文件路径 - 支持新的存储结构
        let fullPath = '';
        
        // 使用绝对路径
        if (path.isAbsolute(filePath)) {
            // 如果是绝对路径，直接使用
            fullPath = filePath;
        } 
        // 处理相对于processed目录的路径
        else if (filePath.includes('processed')) {
            // 如果路径包含processed关键字，则是使用新的目录结构
            // 确保路径包含uploads目录
            if (filePath.startsWith('uploads/')) {
                fullPath = path.join(__dirname, '../', filePath);
            } else if (filePath.startsWith('processed/')) {
                // 修复路径，确保包含uploads目录
                fullPath = path.join(__dirname, '../uploads', filePath);
            } else {
                // 完全自定义路径
                fullPath = path.join(__dirname, '../uploads', filePath);
            }
        } 
        // 处理旧版本的简单文件名
        else {
            // 否则假设是直接保存在uploads目录下的文件
            fullPath = path.join(__dirname, '../uploads', path.basename(filePath));
        }
        
        // 处理下载原理图请求
        if (fieldName === 'file_path' && req.path.includes('/download')) {
            // 从数据库中获取的filePath是相对路径，需要转换为绝对路径
            let absolutePath = '';
            
            // 检查是否是绝对路径
            if (path.isAbsolute(filePath)) {
                absolutePath = filePath;
            } 
            // 处理相对于processed目录的路径
            else if (filePath.includes('processed/')) {
                // 修复路径，确保包含uploads目录
                absolutePath = path.join(__dirname, '../uploads', filePath);
            } else {
                // 简单文件名情况
                absolutePath = path.join(__dirname, '../uploads', filePath);
            }
            
            // 检查文件是否存在
            if (!fs.existsSync(absolutePath)) {
                console.error('原理图文件不存在:', absolutePath);
                return res.status(404).json({ error: '原理图文件不存在' });
            }
            
            console.log(`下载原理图文件: ${schematic.name}`);
            
            // 获取文件名
            const filename = schematic.name;
            
            // 检查文件名中是否包含中文，如果包含则使用RFC 5987格式
            const containsNonAscii = /[^\x00-\x7F]/.test(filename);
            const encodedFilename = containsNonAscii
                ? `filename*=UTF-8''${encodeURIComponent(filename)}`
                : `filename="${filename}"`;
            
            // 设置 Content-Disposition 头
            res.setHeader('Content-Disposition', `attachment; ${encodedFilename}`);
            res.setHeader('Content-Type', 'application/octet-stream');
            
            // 发送文件
            const fileStream = fs.createReadStream(absolutePath);
            fileStream.pipe(res);
        } else {
            // 对于三视图和其他文件路径
            // 检查文件是否存在
            if (!fs.existsSync(fullPath)) {
                console.error('文件不存在:', fullPath);
                return res.status(404).json({ error: '文件不存在' });
            }
            
            // 根据文件扩展名设置正确的 Content-Type
            const ext = path.extname(fullPath).toLowerCase();
            let contentType = 'application/octet-stream'; // 默认
            
            if (ext === '.png') {
                contentType = 'image/png';
            } else if (ext === '.jpg' || ext === '.jpeg') {
                contentType = 'image/jpeg';
            } else if (ext === '.json') {
                contentType = 'application/json';
            }
            
            res.setHeader('Content-Type', contentType);
            
            // 发送文件
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(res);
        }
    } catch (error) {
        console.error(`获取${fieldName}失败:`, error);
        res.status(500).json({ error: `获取${fieldName}失败` });
    }
}


module.exports = schematicController; 