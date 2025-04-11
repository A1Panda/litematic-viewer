const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: '未提供认证令牌' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: '无效的认证令牌' });
    }
};

// 可选的认证中间件，不要求一定有令牌，但如果有令牌，就会验证并将用户信息添加到请求中
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        // 无令牌时直接放行，但req.user将保持undefined
        console.log('未提供认证令牌，以未登录身份访问');
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(`用户已登录: ID=${decoded.id}, 角色=${decoded.role || '普通用户'}`);
    } catch (error) {
        console.warn('无效的认证令牌，以未登录身份继续访问', error.message);
        // 令牌无效时也放行，但req.user将保持undefined
    }
    
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
};

module.exports = { validateToken, optionalAuth, isAdmin }; 