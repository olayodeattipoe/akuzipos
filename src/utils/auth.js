// Utility functions for auth management
export const logout = async () => {
    try {
        const token = localStorage.getItem('auth_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        const response = await fetch('https://orders-management-control-centre-l52z5.ondigitalocean.app/servers/pos/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.ok) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_name');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
};

export const verifySession = async () => {
    try {
        const token = localStorage.getItem('auth_token');
        const userName = localStorage.getItem('user_name');
        
        if (!token || !userName) return false;

        const response = await fetch('https://orders-management-control-centre-l52z5.ondigitalocean.app/servers/pos/verify/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            return {
                username: userName,
                role: 'POS',
                ...data.user
            };
        }
        
        // Clear stored data if verification fails
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_name');
        return false;
    } catch (error) {
        console.error('Session verification error:', error);
        return false;
    }
}; 