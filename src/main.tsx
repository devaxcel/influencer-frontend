import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthProvider.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { queryClient } from './context/reactQueryContext'
import './index.css'
import './i18n'
import App from './App.tsx'
import LanguageRoot from './components/LanguageRoot'
import AppToaster from './components/AppToaster'
import { removeStaticPageJsonLd } from './utils/jsonLd'

removeStaticPageJsonLd()

// 1. React ko mount karein (yeh background mein hoga loader ke peeche)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <LanguageRoot>
              <App />
            </LanguageRoot>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      <AppToaster />
    </QueryClientProvider>
  </StrictMode>,
)

// 2. Loader ko hatane ka logic (1.5 seconds ke baad)
const hideInitialLoader = () => {
  const loader = document.getElementById('initial-loader')
  if (loader) {
    // Fade out class lagayein
    loader.classList.add('hidden')
    
    // CSS transition (0.4s) ke baad DOM se hata dein
    setTimeout(() => {
      loader.remove()
    }, 450) 
  }
}

// 3. Timer start karein
setTimeout(hideInitialLoader, 1500) 