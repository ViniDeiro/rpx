declare module 'next-themes' {
  import { FC, ReactNode } from 'react';

  export interface ThemeProviderProps {
    children: ReactNode;
    forcedTheme?: string;
    defaultTheme?: string;
    attribute?: string;
    value?: { [themeName: string]: string };
    enableSystem?: boolean;
    enableColorScheme?: boolean;
    storageKey?: string;
    tailwindSelector?: string;
  }

  export interface UseThemeProps {
    theme: string;
    setTheme: (theme: string) => void;
    forcedTheme?: string;
    resolvedTheme?: string;
    themes: string[];
    systemTheme?: string;
  }

  export const ThemeProvider: FC<ThemeProviderProps>;
  export function useTheme(): UseThemeProps;
} 