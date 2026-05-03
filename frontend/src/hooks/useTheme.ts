import { useState, useEffect } from 'react'

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme')
            if (stored) return stored
        }
        
        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        
        return 'light'
    })

    useEffect(() => {
        const root = window.document.documentElement
        
        // Remove previous theme classes
        root.classList.remove('light', 'dark')
        
        // Add current theme class
        root.classList.add(theme)
        
        // Store in localStorage
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
    }

    return {
        theme,
        setTheme,
        toggleTheme
    }
}
