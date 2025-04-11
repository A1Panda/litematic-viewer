const pool = require('./config/database');
const path = require('path');
const fs = require('fs');

// 辅助函数：递归搜索目录查找文件
function findFileInDirectory(directoryPath, matchFunction) {
    if (!fs.existsSync(directoryPath)) {
        return null;
    }
    
    const files = fs.readdirSync(directoryPath);
    
    for (const file of files) {
        const fullPath = path.join(directoryPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // 递归搜索子目录
            const result = findFileInDirectory(fullPath, matchFunction);
            if (result) {
                return result;
            }
        } else if (matchFunction(file)) {
            // 找到匹配的文件
            return fullPath;
        }
    }
    
    return null;
}

// 查找原理图相关的所有processed目录
function findProcessedDirs() {
    const uploadsDir = path.join(__dirname, 'uploads');
    const processedDir = path.join(uploadsDir, 'processed');
    
    if (!fs.existsSync(processedDir)) {
        console.log('processed目录不存在:', processedDir);
        return [];
    }
    
    try {
        const dirs = fs.readdirSync(processedDir);
        return dirs.map(dir => {
            const fullPath = path.join(processedDir, dir);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                return {
                    path: fullPath,
                    timestamp: dir,
                    files: fs.readdirSync(fullPath)
                };
            }
            return null;
        }).filter(Boolean);
    } catch (error) {
        console.error('读取processed目录失败:', error);
        return [];
    }
}

// 获取相对路径
function getRelativePath(absolutePath) {
    if (!absolutePath) return null;
    
    try {
        const uploadsDir = path.join(__dirname, 'uploads');
        const relativePath = path.relative(uploadsDir, absolutePath).replace(/\\/g, '/');
        return relativePath;
    } catch (error) {
        console.error('获取相对路径失败:', error);
        return null;
    }
}

async function fixSchematicPaths() {
    try {
        console.log('开始修复原理图文件路径...');
        
        // 获取所有原理图记录
        const [schematics] = await pool.query('SELECT * FROM schematics');
        console.log(`数据库中共有 ${schematics.length} 个原理图记录`);
        
        // 查找所有processed目录
        const processedDirs = findProcessedDirs();
        console.log(`找到 ${processedDirs.length} 个processed目录`);
        
        // 检查并修复每个原理图的路径
        for (const schematic of schematics) {
            console.log(`\n处理原理图 ID: ${schematic.id}, 名称: ${schematic.name}`);
            
            // 查找匹配的processed目录
            let matchedDir = null;
            
            // 1. 使用文件路径中的时间戳匹配
            if (schematic.file_path && schematic.file_path.match(/^\d+_/)) {
                const timestampMatch = schematic.file_path.match(/^(\d+)_/);
                if (timestampMatch && timestampMatch[1]) {
                    const timestamp = timestampMatch[1];
                    
                    // 查找时间戳相近的目录
                    for (let i = 0; i < 10; i++) {
                        const adjustedTimestamp = parseInt(timestamp) + i;
                        const possibleMatch = processedDirs.find(dir => 
                            dir.timestamp === adjustedTimestamp.toString());
                        
                        if (possibleMatch) {
                            matchedDir = possibleMatch;
                            console.log(`找到匹配的目录 (时间戳+${i}): ${matchedDir.path}`);
                            break;
                        }
                    }
                }
            }
            
            // 2. 如果仍未找到，则尝试名称匹配
            if (!matchedDir) {
                // 提取纯文件名（不含时间戳前缀）
                const pureNameMatch = schematic.name.match(/^(?:\d+_)?(.+)$/);
                const pureName = pureNameMatch ? pureNameMatch[1] : schematic.name;
                
                // 查找任何包含该名称的目录
                for (const dir of processedDirs) {
                    if (dir.files.some(file => file.includes(pureName) || file === 'original.litematic')) {
                        matchedDir = dir;
                        console.log(`找到名称匹配的目录: ${matchedDir.path}`);
                        break;
                    }
                }
            }
            
            if (matchedDir) {
                // 构建新的路径
                const originalFile = path.join(matchedDir.path, 'original.litematic');
                const topViewFile = path.join(matchedDir.path, 'top.png');
                const sideViewFile = path.join(matchedDir.path, 'side.png');
                const frontViewFile = path.join(matchedDir.path, 'front.png');
                const materialsFile = path.join(matchedDir.path, 'materials.json');
                
                // 验证文件是否存在
                const originalExists = fs.existsSync(originalFile);
                const topViewExists = fs.existsSync(topViewFile);
                const sideViewExists = fs.existsSync(sideViewFile);
                const frontViewExists = fs.existsSync(frontViewFile);
                const materialsExists = fs.existsSync(materialsFile);
                
                // 获取相对路径
                const relOriginalFile = originalExists ? getRelativePath(originalFile) : null;
                const relTopViewFile = topViewExists ? getRelativePath(topViewFile) : null;
                const relSideViewFile = sideViewExists ? getRelativePath(sideViewFile) : null;
                const relFrontViewFile = frontViewExists ? getRelativePath(frontViewFile) : null;
                const relMaterialsFile = materialsExists ? getRelativePath(materialsFile) : null;
                
                console.log('新的文件路径:');
                console.log('- 原始文件:', relOriginalFile || '不存在');
                console.log('- 顶视图:', relTopViewFile || '不存在');
                console.log('- 侧视图:', relSideViewFile || '不存在');
                console.log('- 正视图:', relFrontViewFile || '不存在');
                console.log('- 材料列表:', relMaterialsFile || '不存在');
                
                // 更新数据库记录
                const updateData = {};
                if (relOriginalFile) updateData.file_path = relOriginalFile;
                if (relTopViewFile) updateData.top_view_path = relTopViewFile;
                if (relSideViewFile) updateData.side_view_path = relSideViewFile;
                if (relFrontViewFile) updateData.front_view_path = relFrontViewFile;
                
                if (Object.keys(updateData).length > 0) {
                    await pool.query(
                        'UPDATE schematics SET ? WHERE id = ?',
                        [updateData, schematic.id]
                    );
                    console.log(`成功更新原理图 ID: ${schematic.id} 的路径`);
                } else {
                    console.log(`没有找到有效的文件路径，跳过更新 ID: ${schematic.id}`);
                }
            } else {
                console.log(`未找到匹配的processed目录，无法修复 ID: ${schematic.id}`);
            }
        }
        
        console.log('\n路径修复完成!');
        
    } catch (error) {
        console.error('修复原理图路径时出错:', error);
    } finally {
        // 关闭数据库连接
        pool.end();
    }
}

// 执行修复
fixSchematicPaths(); 