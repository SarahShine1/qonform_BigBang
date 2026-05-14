import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

const storedDensity = window.localStorage.getItem("qonforme-density");
if (storedDensity === "compact" || storedDensity === "normal") {
  document.documentElement.setAttribute("data-density", storedDensity);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
