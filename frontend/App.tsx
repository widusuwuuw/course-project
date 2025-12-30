import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 认证相关屏幕
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// 主要功能屏幕
import HomeScreen from './src/screens/main/HomeScreen';
import NutritionScreen from './src/screens/main/NutritionScreen';
import SportsTrainingScreen from './src/screens/main/SportsTrainingScreen';
import CourseCenterScreen from './src/screens/main/CourseCenterScreen';
import CommunityScreen from './src/screens/main/CommunityScreen';
import AIAssistantScreen from './src/screens/main/AIAssistantScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import LabAnalysisScreen from './src/screens/main/LabAnalysisScreen';
import MonthlyPlanScreen from './src/screens/main/MonthlyPlanScreen';
import PreferencesScreen from './src/screens/main/PreferencesScreen';
import GenerateWeeklyPlanScreen from './src/screens/main/GenerateWeeklyPlanScreen';
import StatsComparisonScreen from './src/screens/main/StatsComparisonScreen';
import DietRecordScreen from './src/screens/main/DietRecordScreen';

// 旧版屏幕（保留作为备用）
import HealthTrackerDashboard from './src/screens/HealthTrackerDashboard';
import HealthLogsScreen from './src/screens/HealthLogsScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

// 类型定义
export type RootStackParamList = {
  // 认证流程
  Login: {
    prefilledEmail?: string;
    prefilledPassword?: string;
    showRegistrationSuccess?: boolean;
  };
  Register: undefined;

  // 主应用流程
  MainTabs: undefined;

  // 快捷功能页面
  Nutrition: undefined;
  Workout: undefined;
  SportsTraining: undefined;
  CourseCenter: undefined;
  LabAnalysis: undefined;
  MonthlyPlan: undefined;
  Preferences: undefined;
  GenerateWeeklyPlan: undefined;
  StatsComparison: undefined;
  DietRecord: undefined;

  // 旧版屏幕（向后兼容）
  HealthTrackerDashboard: undefined;
  HealthLogs: { metric?: any } | undefined;
  Assistant: undefined;
  Achievements: undefined;
  Trends: undefined;
  Profile: undefined;
  Statistics: undefined;
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export type MainTabParamList = {
  Home: undefined;
  Workout: undefined;
  Community: undefined;
    AI: undefined;
  Profile: undefined;
};

// 主底部Tab导航组件
function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Workout':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'Community':
              iconName = focused ? 'people' : 'people-outline';
              break;
                        case 'AI':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4ABAB8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
          borderTopWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomColor: '#E5E7EB',
          borderBottomWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        },
        headerTintColor: '#1F2937',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Workout"
        component={CourseCenterScreen}
        options={{
          title: '运动',
          headerShown: true,
          headerTitle: '运动健康',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: '社区',
          headerShown: true,
          headerTitle: '健康社区',
        }}
      />
            <Tab.Screen
        name="AI"
        component={AIAssistantScreen}
        options={{
          title: 'AI',
          headerShown: true,
          headerTitle: 'AI健康助手',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          headerShown: true,
          headerTitle: '个人中心',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#111827',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          {/* 认证流程 */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: '登录',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: '注册',
              headerShown: false
            }}
          />

          {/* 主应用流程 */}
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{
              title: 'OmniHealth',
              headerShown: false
            }}
          />

          {/* 快捷功能页面 */}
          <Stack.Screen
            name="Nutrition"
            component={NutritionScreen}
            options={{
              title: '营养记录',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="SportsTraining"
            component={SportsTrainingScreen}
            options={{
              title: '运动健身',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="LabAnalysis"
            component={LabAnalysisScreen}
            options={{
              title: '体检解读',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="MonthlyPlan"
            component={MonthlyPlanScreen}
            options={{
              title: '月度计划',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="Preferences"
            component={PreferencesScreen}
            options={{
              title: '偏好设置',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="GenerateWeeklyPlan"
            component={GenerateWeeklyPlanScreen}
            options={{
              title: '生成周计划',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="StatsComparison"
            component={StatsComparisonScreen}
            options={{
              title: '执行统计',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="DietRecord"
            component={DietRecordScreen}
            options={{
              title: '营养记录',
              headerShown: false
            }}
          />

          {/* 旧版屏幕（向后兼容） */}
          <Stack.Screen
            name="HealthTrackerDashboard"
            component={HealthTrackerDashboard}
            options={{
              title: '健康仪表盘',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="HealthLogs"
            component={HealthLogsScreen}
            options={{
              title: '健康日志',
              headerStyle: {
                backgroundColor: '#f8fafc',
              },
            }}
          />
          <Stack.Screen
            name="Assistant"
            component={AssistantScreen}
            options={{
              title: '健康助手',
              headerStyle: {
                backgroundColor: '#f8fafc',
              },
            }}
          />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{
              title: '健康成就',
              headerStyle: {
                backgroundColor: '#f8fafc',
              },
            }}
          />
          <Stack.Screen
            name="Trends"
            component={TrendsScreen}
            options={{
              title: '体重趋势',
              headerStyle: {
                backgroundColor: '#f8fafc',
              },
            }}
          />
          <Stack.Screen
            name="Statistics"
            component={StatisticsScreen}
            options={{
              title: '健康统计',
              headerStyle: {
                backgroundColor: '#f8fafc',
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
