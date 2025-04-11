const pool = require('./config/database');
const bcrypt = require('bcrypt');

// 新密码设置
const NEW_PASSWORD = 'admin123'; // 你可以修改为任何你想要的新密码

async function resetAdminPassword() {
    try {
        console.log('开始重置管理员密码...');
        
        // 查找管理员账户
        const [admins] = await pool.query(
            'SELECT * FROM users WHERE role = "admin" AND username = "admin"'
        );
        
        if (admins.length === 0) {
            console.log('未找到管理员账户，请先创建管理员账户。');
            return;
        }
        
        const admin = admins[0];
        console.log(`找到管理员账户: ${admin.username} (ID: ${admin.id})`);
        
        // 加密新密码
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
        
        // 更新密码
        await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, admin.id]
        );
        
        console.log('管理员密码重置成功!');
        console.log('新登录信息:');
        console.log(`- 用户名: ${admin.username}`);
        console.log(`- 密码: ${NEW_PASSWORD}`);
    } catch (error) {
        console.error('重置管理员密码失败:', error);
    } finally {
        // 关闭连接池
        pool.end();
    }
}

// 执行密码重置
resetAdminPassword(); 