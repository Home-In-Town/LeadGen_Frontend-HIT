import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { APP_NAME, IS_PHASE_1 } from './config/phase'

// Set page title based on phase
document.title = IS_PHASE_1
  ? 'Web Magnet Media | AI-Powered Lead Automation'
  : 'OneEmployee | Precision Lead Filtration';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <App />
  </StrictMode>,
)
