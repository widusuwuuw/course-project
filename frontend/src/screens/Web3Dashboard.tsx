import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TrendingUp,
  Heart,
  Brain,
  Activity,
  Zap,
  Shield,
  Settings,
  Bell,
  Plus,
  ArrowUpRight,
} from 'lucide-react-native';

// 导入我们的新组件
import { Web3BackgroundSimple } from '@/components/Web3UI/Web3BackgroundSimple';
import { GlassCard } from '@/components/Web3UI/GlassCard';
import { NeonCard } from '@/components/Web3UI/NeonCard';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2 - 12; // 两列布局

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function Web3Dashboard({ navigation }: Props) {
  const [healthMetrics, setHealthMetrics] = useState([
    {
      id: 1,
      title: '心率监测',
      value: '72',
      subtitle: 'bpm',
      icon: 'heart' as const,
      gradient: ['#EF4444', '#DC2626'],
      trend: { value: '2.3%', isPositive: false },
    },
    {
      id: 2,
      title: '血氧饱和度',
      value: '98',
      subtitle: '%',
      icon: 'activity' as const,
      gradient: ['#3B82F6', '#1D4ED8'],
      trend: { value: '0.5%', isPositive: true },
    },
    {
      id: 3,
      title: '睡眠质量',
      value: '8.2',
      subtitle: '小时',
      icon: 'brain' as const,
      gradient: ['#8B5CF6', '#6D28D9'],
      trend: { value: '12%', isPositive: true },
    },
    {
      id: 4,
      title: '压力指数',
      value: '32',
      subtitle: '/100',
      icon: 'zap' as const,
      gradient: ['#10B981', '#059669'],
      trend: { value: '8%', isPositive: false },
    },
  ]);

  const [quickActions] = useState([
    {
      id: 1,
      title: 'AI健康助手',
      subtitle: '智能诊断咨询',
      icon: 'brain' as const,
      gradient: ['#8B5CF6', '#6D28D9'],
      onPress: () => navigation.navigate('Assistant'),
    },
    {
      id: 2,
      title: '体重管理',
      subtitle: '记录与趋势分析',
      icon: 'trending' as const,
      gradient: ['#3B82F6', '#1D4ED8'],
      onPress: () => navigation.navigate('HealthLogs'),
    },
  ]);

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <Web3BackgroundSimple>
      <StatusBar barStyle="light-content" backgroundColor="#0A0B0D" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>晚上好</Text>
            <Text style={styles.title}>健康监测中心</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={logout}>
              <Settings size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 总览卡片 */}
        <GlassCard style={styles.overviewCard} gradient={[
          'rgba(139, 92, 246, 0.1)',
          'rgba(59, 130, 246, 0.1)',
        ]}>
          <View style={styles.overviewContent}>
            <View style={styles.overviewLeft}>
              <Text style={styles.overviewTitle}>整体健康评分</Text>
              <Text style={styles.overviewScore}>92</Text>
              <Text style={styles.overviewSubtitle}>优秀水平</Text>

              <View style={styles.overviewStats}>
                <View style={styles.statItem}>
                  <TrendingUp size={16} color="#22C55E" />
                  <Text style={styles.statText}>+5.2%</Text>
                </View>
                <View style={styles.statItem}>
                  <Shield size={16} color="#8B5CF6" />
                  <Text style={styles.statText}>健康状态</Text>
                </View>
              </View>
            </View>

            <View style={styles.overviewRight}>
              <TouchableOpacity style={styles.quickAddButton}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.quickAddText}>快速记录</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        {/* 健康指标网格 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>实时健康指标</Text>
          <TouchableOpacity>
            <ArrowUpRight size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          {healthMetrics.map((metric) => (
            <NeonCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              icon={metric.icon}
              gradient={metric.gradient}
              trend={metric.trend}
              style={styles.metricCard}
            />
          ))}
        </View>

        {/* 快速操作 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>快速操作</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <NeonCard
              key={action.id}
              title={action.title}
              value=""
              subtitle={action.subtitle}
              icon={action.icon}
              gradient={action.gradient}
              onPress={action.onPress}
              style={styles.actionCard}
            />
          ))}
        </View>

        {/* 今日活动 */}
        <GlassCard style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>今日活动概览</Text>
            <Text style={styles.activityTime}>更新于 2分钟前</Text>
          </View>

          <View style={styles.activityStats}>
            <View style={styles.activityStat}>
              <Text style={styles.activityValue}>8,432</Text>
              <Text style={styles.activityLabel}>步数</Text>
            </View>
            <View style={styles.activityStat}>
              <Text style={styles.activityValue}>324</Text>
              <Text style={styles.activityLabel}>卡路里</Text>
            </View>
            <View style={styles.activityStat}>
              <Text style={styles.activityValue}>45</Text>
              <Text style={styles.activityLabel}>运动分钟</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </Web3BackgroundSimple>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // 头部
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // 总览卡片
  overviewCard: {
    marginBottom: 32,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLeft: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  overviewScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  overviewRight: {
    marginLeft: 16,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  quickAddText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 章节标题
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 指标网格
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    width: cardWidth,
  },

  // 快速操作
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
  },

  // 活动卡片
  activityCard: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityStat: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});