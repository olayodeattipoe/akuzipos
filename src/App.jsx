import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './home';
import AuthPage from './components/AuthPage';
import { useDispatch, useSelector } from 'react-redux';
import PaymentSuccess from './components/CartComponents/PaymentSuccess';
import { v4 as uuidv4 } from 'uuid';
import MaintenancePage from './components/MaintenancePage';

const ProtectedRoute = ({ children }) => {
  const userInfo = useSelector((state) => state.gl_variables.userInfo);
  
  // Check both authentication and expiration
  const checkAuth = async () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const authExpiration = localStorage.getItem('authExpiration');
    const accessToken = localStorage.getItem('accessToken');
    
    if (!isAuthenticated || !authExpiration || !accessToken) {
        return <Navigate to="/auth" replace />;
    }
    
    if (new Date().getTime() > parseInt(authExpiration)) {
        // Clear expired auth data
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authExpiration');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return <Navigate to="/auth" replace />;
    }
    
    try {
        const response = await fetch('https://management.calabash.online/mcc_primaryLogic/verify-token/', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        return data.status === 'success' ? children : <Navigate to="/auth" replace />;
    } catch (error) {
        return <Navigate to="/auth" replace />;
    }
  };

  // If not logged in, redirect to auth page immediately
  if (!userInfo.isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const authExpiration = localStorage.getItem('authExpiration');
    
    if (isAuthenticated && authExpiration) {
        if (new Date().getTime() <= parseInt(authExpiration)) {
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
        } else {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('authExpiration');
        }
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/payment/success/*" element={<PaymentSuccess />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
              {/**<MaintenancePage />**/}
            </ProtectedRoute>
          }
        />
        {/* Catch all other routes and redirect to auth if not authenticated */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
 