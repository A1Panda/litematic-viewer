const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authController = {
    async register(req, res) {
        const { username, password, email } = req.body;

        try {
            // 检查用户名和邮箱是否已存在
            const [existing] = await pool.query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: '用户名或邮箱已存在' });
            }

            // 加密密码
            const hashedPassword = await bcrypt.hash(password, 10);

            // 创建用户
            const [result] = await pool.query(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                [username, hashedPassword, email]
            );

            res.status(201).json({
                message: '注册成功',
                userId: result.insertId
            });
        } catch (error) {
            console.error('注册失败:', error);
            res.status(500).json({ error: '注册失败' });
        }
    },

    async login(req, res) {
        const { username, password } = req.body;

        try {
            const [users] = await pool.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: '用户名或密码错误' });
            }

            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({ error: '用户名或密码错误' });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('登录失败:', error);
            res.status(500).json({ error: '登录失败' });
        }
    },

    async getCurrentUser(req, res) {
        try {
            const [users] = await pool.query(
                'SELECT id, username, email, role FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: '用户不存在' });
            }

            res.json(users[0]);
        } catch (error) {
            console.error('获取用户信息失败:', error);
            res.status(500).json({ error: '获取用户信息失败' });
        }
    },

    async changePassword(req, res) {
        const { currentPassword, newPassword } = req.body;

        try {
            const [users] = await pool.query(
                'SELECT * FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: '用户不存在' });
            }

            const user = users[0];
            const validPassword = await bcrypt.compare(currentPassword, user.password);

            if (!validPassword) {
                return res.status(401).json({ error: '当前密码错误' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, req.user.id]
            );

            res.json({ message: '密码修改成功' });
        } catch (error) {
            console.error('修改密码失败:', error);
            res.status(500).json({ error: '修改密码失败' });
        }
    }
};

module.exports = authController; 