import { createContext, useContext, useEffect, useState } from 'react';
import settingsService from '../../services/settingsService';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [appearanceSettings, setAppearanceSettings] = useState(() => {
    const saved = localStorage.getItem('appearanceSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'system'
    };
  });

  // Computed theme based on system preference and user setting
  const [actualTheme, setActualTheme] = useState('light');

  useEffect(() => {
    const updateActualTheme = () => {
      let newTheme = 'light';
      
      if (appearanceSettings.theme === 'system') {
        newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        newTheme = appearanceSettings.theme;
      }
      
      setActualTheme(newTheme);
    };

    updateActualTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateActualTheme);

    return () => mediaQuery.removeEventListener('change', updateActualTheme);
  }, [appearanceSettings.theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    console.log('🎨 Applying theme:', { actualTheme, theme: appearanceSettings.theme });
    
    // Apply theme with force
    root.removeAttribute('data-theme');
    root.classList.remove('dark', 'light');
    
    if (actualTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
      document.body.style.backgroundColor = 'rgb(0, 0, 0)';
      document.body.style.color = 'rgb(255, 255, 255)';
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.add('light');
      document.body.style.backgroundColor = 'rgb(255, 255, 255)';
      document.body.style.color = 'rgb(0, 0, 0)';
    }

    // Save to localStorage
    localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
    
    console.log('✅ Theme applied successfully');
  }, [actualTheme, appearanceSettings]);


  const updateAppearanceSettings = (newSettings) => {
    setAppearanceSettings(prev => {
      const updated = { ...prev, ...newSettings };
      console.log('Updating appearance settings:', updated);
      return updated;
    });
  };

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(appearanceSettings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateAppearanceSettings({ theme: nextTheme });
  };

  // Load settings from backend when component mounts
  useEffect(() => {
    const loadAppearanceSettings = async () => {
      try {
        const settings = await settingsService.getAllSettings();
        console.log('Loaded appearance settings:', settings?.appearance);
        if (settings?.appearance?.theme) {
          setAppearanceSettings(prev => ({
            ...prev,
            theme: settings.appearance.theme
          }));
        }
      } catch (error) {
        console.error('Failed to load appearance settings:', error);
      }
    };

    // Add a small delay to ensure DOM is ready
    setTimeout(loadAppearanceSettings, 100);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme: appearanceSettings.theme,
      actualTheme,
      appearanceSettings,
      updateAppearanceSettings,
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
