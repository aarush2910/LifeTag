import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from "react-router-dom";

import App from './App.tsx'
import { SidebarProvider } from './components/ui/sidebar.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <BrowserRouter>
  <SidebarProvider>
      <App />
  </SidebarProvider>
    </BrowserRouter>
  </StrictMode>,
)
