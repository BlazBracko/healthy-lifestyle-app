/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#667eea';
const tintColorDark = '#667eea';

export const Colors = {
  light: {
    text: '#1a202c',
    background: '#f7fafc',
    cardBackground: '#ffffff',
    inputBackground: '#ffffff',
    inputBorder: '#e2e8f0',
    inputText: '#1a202c',
    placeholder: '#a0aec0',
    tint: tintColorLight,
    icon: '#718096',
    tabIconDefault: '#718096',
    tabIconSelected: tintColorLight,
    error: '#c53030',
    errorBackground: '#fed7d7',
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    secondaryText: '#718096',
  },
  dark: {
    text: '#ECEDEE',
    background: '#1a202c',
    cardBackground: '#2d3748',
    inputBackground: '#2d3748',
    inputBorder: '#4a5568',
    inputText: '#ECEDEE',
    placeholder: '#718096',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    error: '#fc8181',
    errorBackground: '#742a2a',
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    secondaryText: '#9BA1A6',
  },
};
