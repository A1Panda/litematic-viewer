const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

class Schematic {
    static async create(data) {
        const { name, filePath, topViewPath, sideViewPath, frontViewPath, materials } = data;
        
        const relativePaths = {
            filePath: this.getRelativePath(filePath),
            topViewPath: this.getRelativePath(topViewPath),
            sideViewPath: this.getRelativePath(sideViewPath),
            frontViewPath: this.getRelativePath(frontViewPath),
            materials: this.getRelativePath(materials)
        };
        
        console.log('存储的相对路径:', relativePaths);
        
        let materialsJson = '{}';
        try {
            if (fs.existsSync(materials)) {
                materialsJson = fs.readFileSync(materials, 'utf8');
            }
        } catch (error) {
            console.error('读取材料文件失败:', error);
        }
        
        const [result] = await pool.execute(
            'INSERT INTO schematics (name, file_path, top_view_path, side_view_path, front_view_path, materials) VALUES (?, ?, ?, ?, ?, ?)',
            [
                name, 
                relativePaths.filePath, 
                relativePaths.topViewPath, 
                relativePaths.sideViewPath, 
                relativePaths.frontViewPath, 
                materialsJson
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
        await pool.execute(
            'DELETE FROM schematics WHERE id = ?',
            [id]
        );
    }
    
    static getRelativePath(absolutePath) {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (absolutePath && absolutePath.startsWith(uploadsDir)) {
            return path.relative(uploadsDir, absolutePath).replace(/\\/g, '/');
        }
        return absolutePath;
    }
    
    static getAbsolutePath(relativePath) {
        if (!relativePath || typeof relativePath !== 'string') return null;
        return path.join(__dirname, '../../uploads', relativePath);
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