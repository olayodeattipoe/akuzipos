import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
    
export default function AuthPage() {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (password === 'pos123') {
            const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            
            // Only store auth data, not user_id
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('authExpiration', expirationTime.toString());
            
            // Generate new user_id for this session
            const userId = uuidv4();
            
            dispatch({
                type: 'gl_variables/setUserInfo',
                payload: {
                    isLoggedIn: true,
                    name: 'POS User',
                    role: 'POS',
                    userId: userId,
                    email: `${userId}@gmail.com`
                }
            });
            dispatch({ type: 'websocket/connect' });
            navigate('/', { replace: true });
        } else {
            alert('Invalid password');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
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
                <h1 className="text-2xl font-bold text-yellow-400 mb-6">POS Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
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