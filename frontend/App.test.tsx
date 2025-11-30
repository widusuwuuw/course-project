import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 简单的测试组件
const TestScreen = ({ title }: { title: string }) => (
  <View style={styles.testContainer}>
    <Text style={styles.titleText}>{title}</Text>
    <Text style={styles.subText}>这是测试页面</Text>
  </View>
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
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
            case 'Shop':
              iconName = focused ? 'storefront' : 'storefront-outline';
              break;
            case 'AI':
              iconName = focused ? 'chatbot' : 'chatbot-outline';
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
        },
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={() => <TestScreen title="首页" />}
        options={{ title: '首页' }}
      />
      <Tab.Screen
        name="Workout"
        component={() => <TestScreen title="运动" />}
        options={{ title: '运动' }}
      />
      <Tab.Screen
        name="Community"
        component={() => <TestScreen title="社区" />}
        options={{ title: '社区' }}
      />
      <Tab.Screen
        name="Shop"
        component={() => <TestScreen title="商城" />}
        options={{ title: '商城' }}
      />
      <Tab.Screen
        name="AI"
        component={() => <TestScreen title="AI" />}
        options={{ title: 'AI' }}
      />
      <Tab.Screen
        name="Profile"
        component={() => <TestScreen title="我的" />}
        options={{ title: '我的' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  testContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default function TestApp() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Navigator initialRouteName="MainTabs">
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}