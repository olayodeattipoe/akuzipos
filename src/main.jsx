import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { Toaster } from '@/components/ui/toaster'
import store from './gl_Var_Store.jsx'
import './index.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Provider store={store}>
          <App/>
          <Toaster/>
      </Provider>
  </StrictMode>
)
