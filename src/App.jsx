import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './home';
import { useDispatch } from 'react-redux';
import store from '@/gl_Var_Store';
import axios from 'axios';
import PaymentSuccess from './components/CartComponents/PaymentSuccess';

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Initialize POS user info
    dispatch({
      type: 'gl_variables/regeneratePosUserId'
    });
    dispatch({type: 'websocket/connect'});
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/payment/success/*" element={<PaymentSuccess/>} />
      </Routes>
    </Router>
  );
}

export default App;
 