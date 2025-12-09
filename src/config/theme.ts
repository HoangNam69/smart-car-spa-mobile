import { MD3LightTheme as DefaultTheme } from "react-native-paper";

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6C7BEA",
    secondary: "#1890ff",
    error: "#ff4d4f",
    success: "#52c41a",
    warning: "#fa8c16",
    background: "#f5f5f5",
    surface: "#ffffff",
  },
  roundness: 8,
};

export type AppTheme = typeof theme;
