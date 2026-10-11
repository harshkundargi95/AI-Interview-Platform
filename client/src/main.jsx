import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import App from './App.jsx'
import AuthProvider from './auth/AuthProvider.jsx'

const router = createBrowserRouter([{ path: '*', element: <App /> }])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider><RouterProvider router={router} /></AuthProvider>
  </StrictMode>,
)
