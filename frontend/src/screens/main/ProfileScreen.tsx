import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { colors, themeMode, toggleTheme } = useTheme();

  // 用户数据
  const [userData, setUserData] = useState({
    name: '健康达人',
    email: 'user@example.com',
    avatar: '🏃',
    level: 'LV.5',
    joinDate: '2024年1月',
    healthScore: 85,
    streak: 7,
  });

  // 设置选项
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: themeMode === 'dark',
    autoBackup: false,
    locationServices: true,
  });

  // 功能菜单数据
  const menuSections = [
    {
      title: '健康数据',
      items: [
        {
          id: 'health-records',
          title: '健康档案',
          icon: 'folder-open-outline',
          color: '#4ABAB8',
          description: '查看个人健康记录',
        },
        {
          id: 'health-report',
          title: '健康报告',
          icon: 'document-text-outline',
          color: '#FFD88C',
          description: '生成健康分析报告',
        },
        {
          id: 'health-preferences',
          title: '健康偏好',
          icon: 'options-outline',
          color: '#D4EDD4',
          description: '设置饮食运动偏好',
        },
        {
          id: 'generate-weekly-plan',
          title: '生成周计划',
          icon: 'calendar-outline',
          color: '#A78BFA',
          description: '基于月计划生成周计划',
        },
        {
          id: 'data-export',
          title: '数据导出',
          icon: 'download-outline',
          color: '#B8E5E5',
          description: '导出个人健康数据',
        },
      ],
    },
    {
      title: '系统设置',
      items: [
        {
          id: 'notifications',
          title: '消息通知',
          icon: 'notifications-outline',
          color: '#4ABAB8',
          description: '管理应用通知',
          toggle: true,
          value: 'notifications',
        },
        {
          id: 'dark-mode',
          title: '深色模式',
          icon: 'moon-outline',
          color: '#FFD88C',
          description: '切换界面主题',
          toggle: true,
          value: 'darkMode',
        },
        {
          id: 'language',
          title: '语言设置',
          icon: 'language-outline',
          color: '#B8E5E5',
          description: '选择应用语言',
        },
        {
          id: 'privacy',
          title: '隐私设置',
          icon: 'lock-closed-outline',
          color: '#FFB5C5',
          description: '管理隐私权限',
        },
      ],
    },
    {
      title: '帮助与支持',
      items: [
        {
          id: 'tutorial',
          title: '使用教程',
          icon: 'play-circle-outline',
          color: '#4ABAB8',
          description: '学习如何使用应用',
        },
        {
          id: 'feedback',
          title: '意见反馈',
          icon: 'chatbubble-ellipses-outline',
          color: '#FFD88C',
          description: '提出改进建议',
        },
        {
          id: 'about',
          title: '关于我们',
          icon: 'information-circle-outline',
          color: '#D4EDD4',
          description: '了解OmniHealth',
        },
        {
          id: 'contact',
          title: '联系客服',
          icon: 'call-outline',
          color: '#B8E5E5',
          description: '获取技术支持',
        },
      ],
    },
  ];

  // 成就徽章
  const achievements = [
    { id: 1, name: '健康新手', icon: '🌱', unlocked: true, description: '完成首次健康打卡' },
    { id: 2, name: '运动达人', icon: '💪', unlocked: true, description: '连续运动7天' },
    { id: 3, name: '数据专家', icon: '📊', unlocked: true, description: '记录30天健康数据' },
    { id: 4, name: '营养大师', icon: '🥗', unlocked: false, description: '记录100次饮食' },
    { id: 5, name: '睡眠冠军', icon: '🌙', unlocked: false, description: '连续30天优质睡眠' },
    { id: 6, name: '全能选手', icon: '🏆', unlocked: false, description: '解锁所有基础徽章' },
  ];

  // 处理设置开关
  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    if (key === 'darkMode') {
      toggleTheme();
    }
  };

  // 处理菜单项点击
  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'health-preferences':
        navigation.navigate('Preferences' as never);
        break;
      case 'generate-weekly-plan':
        navigation.navigate('GenerateWeeklyPlan' as never);
        break;
      case 'logout':
        Alert.alert(
          '退出登录',
          '确定要退出当前账号吗？',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '确定',
              style: 'destructive',
              onPress: handleLogout,
            },
          ]
        );
        break;
      default:
        console.log('Menu item pressed:', itemId);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      // 这里应该导航到登录页面
      Alert.alert('成功', '已退出登录');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('错误', '退出登录失败，请重试');
    }
  };

  // 渲染功能菜单项
  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons
          name={item.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={item.color}
        />
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>

      {item.toggle ? (
        <Switch
          value={settings[item.value as keyof typeof settings] as boolean}
          onValueChange={(value) => handleToggle(item.value, value)}
          trackColor={{ false: '#E5E7EB', true: item.color + '40' }}
          thumbColor={settings[item.value as keyof typeof settings] ? item.color : '#FFFFFF'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* 用户信息卡片 */}
        <LinearGradient
          colors={['#4ABAB8', '#B8E5E5']}
          style={styles.profileHeader}
        >
          <View style={styles.profileContent}>
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userData.avatar}</Text>
              </View>

              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{userData.name}</Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{userData.level}</Text>
                  </View>
                </View>
                <Text style={styles.userEmail}>{userData.email}</Text>
                <Text style={styles.joinDate}>加入时间：{userData.joinDate}</Text>
              </View>
            </View>

            {/* 健康数据统计 */}
            <View style={styles.healthStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData.healthScore}</Text>
                <Text style={styles.statLabel}>健康评分</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData.streak}</Text>
                <Text style={styles.statLabel}>连续打卡</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>156</Text>
                <Text style={styles.statLabel}>总打卡天数</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 成就徽章 */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>我的成就</Text>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>查看全部</Text>
              <Ionicons name="chevron-forward" size={14} color="#4ABAB8" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <TouchableOpacity
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !achievement.unlocked && styles.achievementLocked
                  ]}
                  disabled={!achievement.unlocked}
                >
                  <View style={[
                    styles.achievementIcon,
                    !achievement.unlocked && styles.achievementIconLocked
                  ]}>
                    <Text style={[
                      styles.achievementEmoji,
                      !achievement.unlocked && styles.achievementEmojiLocked
                    ]}>
                      {achievement.icon}
                    </Text>
                  </View>
                  <Text style={[
                    styles.achievementName,
                    !achievement.unlocked && styles.achievementNameLocked
                  ]}>
                    {achievement.name}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    !achievement.unlocked && styles.achievementDescriptionLocked
                  ]}>
                    {achievement.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 功能菜单 */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map(renderMenuItem)}
            </View>
          </View>
        ))}

        {/* 退出登录 */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => handleMenuPress('logout')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </TouchableOpacity>
        </View>

        {/* 版本信息 */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>OmniHealth v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 OmniHealth. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileContent: {
    gap: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  joinDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  healthStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  achievementsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreButtonText: {
    fontSize: 12,
    color: '#4ABAB8',
    fontWeight: '500',
  },
  achievementsList: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementCard: {
    alignItems: 'center',
    width: 80,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ABAB820',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIconLocked: {
    backgroundColor: '#F3F4F6',
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementEmojiLocked: {
    opacity: 0.4,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 12,
  },
  achievementDescriptionLocked: {
    color: '#D1D5DB',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuContainer: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoutSection: {
    margin: 16,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionInfo: {
    alignItems: 'center',
    padding: 20,
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  copyrightText: {
    fontSize: 10,
    color: '#D1D5DB',
  },
});