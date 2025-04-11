const pool = require('./config/database');

async function checkAndFixAdminAccount() {
    try {
        console.log('开始检查管理员账户状态...');
        
        // 获取所有用户
        const [users] = await pool.query('SELECT * FROM users');
        console.log(`系统中共有 ${users.length} 个用户账户`);
        
        // 查找管理员
        const admins = users.filter(user => user.role === 'admin');
        console.log(`管理员账户数量: ${admins.length}`);
        
        // 检查admin用户
        const adminUser = users.find(user => user.username === 'admin');
        
        if (adminUser) {
            console.log(`找到admin用户 (ID: ${adminUser.id}):`);
            console.log(`- 用户名: ${adminUser.username}`);
            console.log(`- 角色: ${adminUser.role}`);
            console.log(`- 电子邮件: ${adminUser.email}`);
            
            // 如果admin用户不是管理员，将其设置为管理员
            if (adminUser.role !== 'admin') {
                console.log('admin用户不是管理员，正在修复...');
                
                await pool.query(
                    'UPDATE users SET role = ? WHERE id = ?',
                    ['admin', adminUser.id]
                );
                
                console.log('已将admin用户角色更新为管理员');
            } else {
                console.log('admin用户已经具有管理员权限，无需修复');
            }
        } else {
            console.log('系统中不存在用户名为admin的用户，请运行createAdmin.js创建管理员账户');
        }
        
        // 获取所有原理图数量
        const [allSchematics] = await pool.query('SELECT * FROM schematics');
        console.log(`系统中共有 ${allSchematics.length} 个原理图`);
        
        // 获取私有原理图数量
        const [privateSchematics] = await pool.query('SELECT * FROM schematics WHERE is_public = false');
        console.log(`其中私有原理图: ${privateSchematics.length} 个`);
        
        if (privateSchematics.length > 0) {
            console.log('\n私有原理图信息:');
            privateSchematics.forEach((schematic, index) => {
                console.log(`${index + 1}. ID: ${schematic.id}, 名称: ${schematic.name}, 所有者ID: ${schematic.user_id}`);
            });
        }
        
    } catch (error) {
        console.error('检查账户失败:', error);
    } finally {
        // 关闭连接池
        pool.end();
    }
}

// 执行检查
checkAndFixAdminAccount(); 