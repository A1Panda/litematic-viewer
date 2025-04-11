import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const AUTH_URL = `${API_URL}/auth`;

const authService = {
    async register(username, password, email) {
        const response = await axios.post(`${AUTH_URL}/register`, {
            username,
            password,
            email
        });
        return response.data;
    },

    async login(username, password) {
        const response = await axios.post(`${AUTH_URL}/login`, {
            username,
            password
        });
        if (response.data) {
            const userData = response.data.user || response.data;
            userData.token = response.data.token;
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            
            const user = JSON.parse(userStr);
            
            if (!user || !user.id || !user.username) {
                console.warn('无效的用户数据，清除localStorage');
                localStorage.removeItem('user');
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('解析用户数据失败:', error);
            localStorage.removeItem('user');
            return null;
        }
    },

    async changePassword(currentPassword, newPassword) {
        const user = this.getCurrentUser();
        const response = await axios.put(
            `${AUTH_URL}/password`,
            { currentPassword, newPassword },
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        return response.data;
    }
};

export default authService; 