import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '@/config';
    
export default function AuthPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        // Redirect if already authenticated and not expired
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const authExpiration = localStorage.getItem('authExpiration');
        
        if (isAuthenticated && authExpiration) {
            // Check if the authentication is still valid
            if (new Date().getTime() <= parseInt(authExpiration)) {
                navigate('/', { replace: true });
            } else {
                // Clear expired auth data
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('authExpiration');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(`${API_BASE_URL}/mcc_primaryLogic/admin-login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
                const userId = uuidv4();
                
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('authExpiration', expirationTime.toString());
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                localStorage.setItem('adminUsername', username);
                localStorage.setItem('adminId', data.user_id.toString());
                
                dispatch({
                    type: 'gl_variables/setUserInfo',
                    payload: {
                        isLoggedIn: true,
                        name: 'POS User',
                        role: 'POS',
                        userId: userId,
                        email: `${userId}@gmail.com`,
                        adminUser: username,
                        adminId: data.user_id
                    }
                });
                
                console.log('Admin ID from backend:', data.user_id);
                
                dispatch({ type: 'websocket/connect' });
                navigate('/', { replace: true });
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        try {
            await fetch(`${API_BASE_URL}/mcc_primaryLogic/admin-logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authExpiration');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        dispatch({
            type: 'gl_variables/setUserInfo',
            payload: {
                isLoggedIn: false,
                name: null,
                role: null,
                userId: null,
                email: null
            }
        });
        navigate('/auth');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <h1 className="text-2xl font-bold text-yellow-400 mb-6">Admin Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none mb-4"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-yellow-400 text-gray-900 py-2 rounded font-semibold hover:bg-yellow-500 transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
} 