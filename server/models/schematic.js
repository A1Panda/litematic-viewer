const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

class Schematic {
    static async create(data) {
        const { name, filePath, topViewPath, sideViewPath, frontViewPath, materials, user_id, is_public } = data;
        
        const relativePaths = {
            filePath: filePath ? this.getRelativePath(filePath) : null,
            topViewPath: topViewPath ? this.getRelativePath(topViewPath) : null,
            sideViewPath: sideViewPath ? this.getRelativePath(sideViewPath) : null,
            frontViewPath: frontViewPath ? this.getRelativePath(frontViewPath) : null,
            materials: materials ? this.getRelativePath(materials) : null
        };
        
        let materialsJson = '{}';
        try {
            if (materials) {
                // 检查材料是否已经是JSON字符串格式
                if (typeof materials === 'string' && materials.startsWith('{')) {
                    materialsJson = materials;
                } else {
                    // 构建完整的文件路径
                    const materialsPath = this.getAbsolutePath(relativePaths.materials);
                    
                    if (materialsPath && fs.existsSync(materialsPath)) {
                        materialsJson = fs.readFileSync(materialsPath, 'utf8');
                        console.log('读取材料文件成功');
                    } else {
                        console.warn('材料文件不存在');
                    }
                }
            }
        } catch (error) {
            console.error('读取材料文件失败:', error);
        }
        
        const [result] = await pool.execute(
            'INSERT INTO schematics (name, file_path, top_view_path, side_view_path, front_view_path, materials, user_id, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name, 
                relativePaths.filePath, 
                relativePaths.topViewPath, 
                relativePaths.sideViewPath, 
                relativePaths.frontViewPath, 
                materialsJson,
                user_id || 1, // 默认为1（管理员）
                is_public === undefined ? true : is_public // 默认为公开
            ]
        );
        return result.insertId;
    }

    static async search(keyword) {
        let query = 'SELECT * FROM schematics';
        let params = [];
        
        if (keyword) {
            query += ' WHERE name LIKE ?';
            params.push(`%${keyword}%`);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM schematics WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, data) {
        const { name } = data;
        await pool.execute(
            'UPDATE schematics SET name = ? WHERE id = ?',
            [name, id]
        );
    }

    static async delete(id) {
        try {
            // 首先获取要删除的原理图信息
            const schematic = await this.getById(id);
            if (!schematic) {
                console.warn(`找不到ID为${id}的原理图`);
                return;
            }
            
            console.log('准备删除原理图:', schematic);
            
            // 删除数据库记录
            await pool.execute(
                'DELETE FROM schematics WHERE id = ?',
                [id]
            );
            
            // 删除相关文件
            await this.deleteSchematicFiles(schematic);
            
            return { success: true };
        } catch (error) {
            console.error('删除原理图失败:', error);
            throw error;
        }
    }

    static async deleteSchematicFiles(schematic) {
        if (!schematic) return;
        
        // 查找并删除processed/timestamp这样的目录结构
        let processedDir = null;
        const viewPaths = [
            schematic.top_view_path,
            schematic.side_view_path,
            schematic.front_view_path
        ];
        
        // 从视图路径中查找processed目录
        for (const filePath of viewPaths) {
            if (!filePath) continue;
            
            if (filePath.includes('processed/')) {
                const match = filePath.match(/^(processed\/\d+)/);
                if (match && match[1]) {
                    processedDir = match[1];
                    break;
                }
            }
        }
        
        // 如果找到了processed目录，直接删除整个目录
        if (processedDir) {
            try {
                const absoluteDir = this.getAbsolutePath(processedDir);
                if (absoluteDir && fs.existsSync(absoluteDir)) {
                    // 递归删除整个目录及其内容
                    fs.rmSync(absoluteDir, { recursive: true, force: true });
                    console.log(`删除原理图文件目录: ${processedDir}`);
                }
            } catch (error) {
                console.error(`删除目录失败:`, error);
            }
        } else {
            console.log('未找到原理图的processed目录');
        }
    }
    
    static getRelativePath(absolutePath) {
        if (!absolutePath) return null;
        
        try {
            // 如果已经是相对路径（不包含系统根目录标识），则直接返回
            if (!path.isAbsolute(absolutePath)) {
                return absolutePath;
            }
            
            // 规范化路径处理
            const normalizedPath = path.normalize(absolutePath);
            const uploadsDir = path.join(__dirname, '../uploads');
            const normalizedUploadsDir = path.normalize(uploadsDir);
            
            // 检查路径是否以上传目录开头
            if (normalizedPath.startsWith(normalizedUploadsDir)) {
                // 获取相对路径并确保使用正斜杠
                const relativePath = path.relative(normalizedUploadsDir, normalizedPath).replace(/\\/g, '/');
                return relativePath;
            }
            
            // 如果是其他绝对路径，尝试提取文件名
            return path.basename(normalizedPath);
        } catch (error) {
            console.error('处理相对路径错误:', error);
            return path.basename(absolutePath);
        }
    }
    
    static getAbsolutePath(relativePath) {
        if (!relativePath || typeof relativePath !== 'string') return null;
        
        try {
            // 规范化上传目录
            const uploadsDir = path.join(__dirname, '../uploads');
            
            // 如果已经是绝对路径且存在，则直接返回
            if (path.isAbsolute(relativePath) && fs.existsSync(relativePath)) {
                return relativePath;
            }
            
            // 否则，将相对路径转换为绝对路径
            const absolutePath = path.join(uploadsDir, relativePath);
            
            // 验证路径是否存在
            if (!fs.existsSync(absolutePath)) {
                console.error('文件不存在:', absolutePath);
            }
            
            return absolutePath;
        } catch (error) {
            console.error('处理绝对路径错误:', error);
            return null;
        }
    }
    
    static async getMaterialsData(materialsPath) {
        try {
            if (typeof materialsPath === 'object') {
                return materialsPath;
            }
            
            if (typeof materialsPath === 'string' && materialsPath.startsWith('{')) {
                return JSON.parse(materialsPath);
            }
            
            const fullPath = this.getAbsolutePath(materialsPath);
            if (fullPath && fs.existsSync(fullPath)) {
                const data = fs.readFileSync(fullPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('读取材料文件失败:', error);
        }
        return {};
    }
}

module.exports = Schematic; 