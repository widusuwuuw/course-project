import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'auto';

// 颜色接口 - 基于Health Tracker设计的清新配色
interface Colors {
  // 主色调 - 基于设计图片的蓝紫色系
  primary: string;          // 主蓝紫色 #8B5CF6
  primaryLight: string;     // 浅蓝紫色 #A78BFA
  primaryDark: string;      // 深蓝紫色 #7C3AED

  // 次要色调 - 清新的绿色和蓝色
  secondary: string;        // 清绿色 #10B981
  secondaryLight: string;   // 浅绿色 #34D399
  accent: string;           // 活力橙色 #F59E0B

  // 背景色
  background: string;       // 主背景
  backgroundSecondary: string; // 次要背景
  backgroundCard: string;   // 卡片背景

  // 渐变色 - 基于设计中的卡片渐变
  gradientHealth: string[]; // 健康数据渐变
  gradientActivity: string[]; // 活动数据渐变
  gradientSleep: string[];   // 睡眠数据渐变
  gradientWater: string[];   // 饮水数据渐变

  // 文字颜色
  text: string;             // 主要文字
  textSecondary: string;    // 次要文字
  textLight: string;        // 浅色文字
  textWhite: string;        // 白色文字（用于彩色背景）

  // 状态颜色
  success: string;
  warning: string;
  error: string;
  info: string;

  // 边框和分割线
  border: string;
  divider: string;

  // 阴影
  shadow: string;

  // 健康指标专用颜色
  heartRate: string;        // 心率 - 粉红色
  steps: string;            // 步数 - 橙色
  sleep: string;            // 睡眠 - 蓝色
  water: string;            // 饮水 - 青色
  weight: string;           // 体重 - 绿色
}

// 基于Health Tracker设计的清新日间主题
export const lightTheme: Colors = {
  primary: '#8B5CF6',          // 蓝紫色
  primaryLight: '#A78BFA',     // 浅蓝紫色
  primaryDark: '#7C3AED',      // 深蓝紫色
  secondary: '#10B981',        // 清绿色
  secondaryLight: '#34D399',   // 浅绿色
  accent: '#F59E0B',           // 活力橙色

  background: '#F8FAFC',       // 清新的浅蓝灰背景
  backgroundSecondary: '#F1F5F9', // 次要背景
  backgroundCard: '#FFFFFF',   // 纯白卡片背景

  // 渐变色 - 完全基于设计图片
  gradientHealth: ['#8B5CF6', '#A78BFA'],     // 健康评分 - 蓝紫渐变
  gradientActivity: ['#F59E0B', '#FBBF24'],   // 活动数据 - 橙色渐变
  gradientSleep: ['#06B6D4', '#22D3EE'],      // 睡眠数据 - 蓝色渐变
  gradientWater: ['#0EA5E9', '#38BDF8'],      // 饮水数据 - 青蓝渐变

  text: '#1E293B',             // 深色主文字
  textSecondary: '#64748B',    // 次要文字
  textLight: '#94A3B8',        // 浅色文字
  textWhite: '#FFFFFF',        // 白色文字

  success: '#10B981',          // 成功绿
  warning: '#F59E0B',          // 警告橙
  error: '#EF4444',            // 错误红
  info: '#06B6D4',             // 信息蓝

  border: '#E2E8F0',           // 边框色
  divider: '#F1F5F9',          // 分割线
  shadow: 'rgba(0, 0, 0, 0.06)', // 轻柔阴影

  // 健康指标颜色 - 基于设计图片
  heartRate: '#EC4899',        // 心率 - 粉红色
  steps: '#F59E0B',            // 步数 - 橙色
  sleep: '#06B6D4',            // 睡眠 - 蓝色
  water: '#0EA5E9',            // 饮水 - 青色
  weight: '#10B981',           // 体重 - 绿色
};

// 基于Health Tracker设计的夜间主题
export const darkTheme: Colors = {
  primary: '#A78BFA',          // 亮蓝紫色
  primaryLight: '#C4B5FD',     // 更亮的蓝紫色
  primaryDark: '#8B5CF6',      // 标准蓝紫色
  secondary: '#34D399',        // 亮绿色
  secondaryLight: '#6EE7B7',   // 更亮的绿色
  accent: '#FBBF24',           // 亮橙色

  background: '#0F172A',       // 深色背景
  backgroundSecondary: '#1E293B', // 次要深色背景
  backgroundCard: '#1E293B',   // 深色卡片

  // 夜间渐变 - 调整饱和度
  gradientHealth: ['#A78BFA', '#C4B5FD'],     // 健康评分
  gradientActivity: ['#FBBF24', '#FCD34D'],   // 活动数据
  gradientSleep: ['#22D3EE', '#67E8F9'],      // 睡眠数据
  gradientWater: ['#38BDF8', '#7DD3FC'],      // 饮水数据

  text: '#F8FAFC',             // 主文字
  textSecondary: '#CBD5E1',    // 次要文字
  textLight: '#94A3B8',        // 浅色文字
  textWhite: '#FFFFFF',        // 白色文字

  success: '#34D399',          // 成功绿
  warning: '#FBBF24',          // 警告橙
  error: '#F87171',            // 错误红
  info: '#22D3EE',             // 信息蓝

  border: '#334155',           // 边框色
  divider: '#475569',          // 分割线
  shadow: 'rgba(0, 0, 0, 0.25)', // 深色阴影

  // 夜间健康指标颜色
  heartRate: '#F472B6',        // 心率 - 亮粉色
  steps: '#FBBF24',            // 步数 - 亮橙色
  sleep: '#22D3EE',            // 睡眠 - 亮蓝色
  water: '#38BDF8',            // 饮水 - 亮青色
  weight: '#34D399',           // 体重 - 亮绿色
};

// 主题接口
interface ThemeContextType {
  themeMode: ThemeMode;
  colors: Colors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isLight: boolean;
  isDark: boolean;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题Provider Props
interface ThemeProviderProps {
  children: ReactNode;
}

// 主题Provider组件
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light'); // 默认使用日间模式
  const [isLoaded, setIsLoaded] = useState(false);

  // 获取当前主题
  const getCurrentTheme = (): Colors => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const colors = getCurrentTheme();
  const isLight = getCurrentTheme() === lightTheme;
  const isDark = !isLight;

  // 切换主题
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    AsyncStorage.setItem('themeMode', newMode);
  };

  // 设置主题模式
  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    AsyncStorage.setItem('themeMode', mode);
  };

  // 初始化主题设置
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode && ['light', 'dark', 'auto'].includes(savedThemeMode)) {
          setThemeMode(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemeMode();
  }, []);

  // 如果还没有加载完成，返回null
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colors,
        toggleTheme,
        setThemeMode: handleSetThemeMode,
        isLight,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// 使用主题的Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 主题相关的工具函数
export const themeUtils = {
  // 获取健康指标对应的颜色
  getHealthColor: (metric: string, colors: Colors): string => {
    const colorMap: { [key: string]: string } = {
      weight: colors.weight,
      sleep: colors.sleep,
      steps: colors.steps,
      heartRate: colors.heartRate,
      bloodPressure: colors.error,
      water: colors.water,
      mood: colors.accent,
      health: colors.primary,
      activity: colors.steps,
    };
    return colorMap[metric] || colors.primary;
  },

  // 获取健康指标对应的渐变
  getHealthGradient: (metric: string, colors: Colors): string[] => {
    const gradientMap: { [key: string]: string[] } = {
      health: colors.gradientHealth,
      activity: colors.gradientActivity,
      sleep: colors.gradientSleep,
      water: colors.gradientWater,
      weight: [colors.weight, colors.secondaryLight],
      heartRate: [colors.heartRate, colors.primaryLight],
      steps: [colors.steps, colors.accent],
    };
    return gradientMap[metric] || colors.gradientHealth;
  },

  // 获取状态颜色
  getStatusColor: (status: 'normal' | 'high' | 'low', colors: Colors): string => {
    switch (status) {
      case 'high':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.success;
    }
  },

  // 获取卡片阴影样式
  getCardShadow: (colors: Colors) => ({
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  }),

  // 获取文字颜色（根据背景自动选择）
  getTextColor: (isOnDarkBackground: boolean, colors: Colors): string => {
    return isOnDarkBackground ? colors.textWhite : colors.text;
  },

  // 获取次要文字颜色
  getSecondaryTextColor: (isOnDarkBackground: boolean, colors: Colors): string => {
    return isOnDarkBackground ? colors.textLight : colors.textSecondary;
  },
};