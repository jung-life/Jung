import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

// Define theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Define the context shape
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDarkMode: boolean;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = '@user_theme_preference';

// Provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for the theme preference
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Derived state for whether dark mode is active
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    theme === 'system' 
      ? Appearance.getColorScheme() === 'dark'
      : theme === 'dark'
  );

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setThemeState(savedTheme as ThemeType);
          console.log('[ThemeProvider] Loaded theme preference:', savedTheme);
        } else {
          console.log('[ThemeProvider] No saved theme preference, using default: system');
        }
      } catch (error) {
        console.error('[ThemeProvider] Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        setIsDarkMode(colorScheme === 'dark');
        console.log('[ThemeProvider] System theme changed to:', colorScheme);
      }
    });

    return () => subscription.remove();
  }, [theme]);

  // Update isDarkMode when theme changes
  useEffect(() => {
    if (theme === 'system') {
      setIsDarkMode(Appearance.getColorScheme() === 'dark');
    } else {
      setIsDarkMode(theme === 'dark');
    }
    
    // Save the preference
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
        console.log('[ThemeProvider] Saved theme preference:', theme);
      } catch (error) {
        console.error('[ThemeProvider] Failed to save theme preference:', error);
      }
    };
    saveTheme();
  }, [theme]);

  // Function to update the theme
  const setTheme = (newTheme: ThemeType) => {
    console.log('[ThemeProvider] Setting theme to:', newTheme);
    setThemeState(newTheme);
  };

  // Context value
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
