import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './home';
import AuthPage from './components/AuthPage';
import { useDispatch, useSelector } from 'react-redux';
import PaymentSuccess from './components/CartComponents/PaymentSuccess';

const ProtectedRoute = ({ children }) => {
  const userInfo = useSelector((state) => state.gl_variables.userInfo);
  
  // Check both authentication and expiration
  const checkAuth = () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const authExpiration = localStorage.getItem('authExpiration');
    
    if (!isAuthenticated || !authExpiration) return false;
    
    // Check if the authentication has expired
    if (new Date().getTime() > parseInt(authExpiration)) {
      // Clear expired auth data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authExpiration');
      return false;
    }
    
    return true;
  };

  return (userInfo.isLoggedIn || checkAuth()) ? children : <Navigate to="/auth" />;
};

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Check if user was previously authenticated and not expired
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const authExpiration = localStorage.getItem('authExpiration');
    
    if (isAuthenticated && authExpiration) {
      // Check if the authentication is still valid
      if (new Date().getTime() <= parseInt(authExpiration)) {
        dispatch({ type: 'websocket/connect' });
      } else {
        // Clear expired auth data
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
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
 