const pool = require('./config/database');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 获取环境变量中的管理员密码，如果未设置则使用备用默认密码
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function createAdminUser() {
    try {
        console.log('开始创建管理员账户...');
        
        // 检查是否已存在管理员账户
        const [existingAdmins] = await pool.query(
            'SELECT * FROM users WHERE role = "admin"'
        );
        
        if (existingAdmins.length > 0) {
            console.log('已存在管理员账户:', existingAdmins.map(admin => admin.username).join(', '));
            console.log('如需使用现有管理员账户，请使用以下账户名登录:');
            existingAdmins.forEach(admin => {
                console.log(`- 用户名: ${admin.username}`);
            });
            console.log('密码: 请使用创建时设置的密码');
        } else {
            // 管理员信息
            const adminUser = {
                username: 'admin',
                password: DEFAULT_ADMIN_PASSWORD, // 使用环境变量中的密码
                email: 'admin@example.com',
                role: 'admin'
            };
            
            // 加密密码
            const hashedPassword = await bcrypt.hash(adminUser.password, 10);
            
            // 创建管理员用户
            const [result] = await pool.query(
                'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                [adminUser.username, hashedPassword, adminUser.email, adminUser.role]
            );
            
            console.log('管理员账户创建成功!');
            console.log('管理员账户信息:');
            console.log(`- 用户名: ${adminUser.username}`);
            console.log(`- 密码: ${adminUser.password}`);
            console.log(`- 邮箱: ${adminUser.email}`);
            console.log(`- 角色: ${adminUser.role}`);
        }
    } catch (error) {
        console.error('创建管理员账户失败:', error);
    } finally {
        // 关闭连接池
        pool.end();
    }
}

// 执行创建管理员账户
createAdminUser(); 