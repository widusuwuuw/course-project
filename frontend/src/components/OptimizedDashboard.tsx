import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import GradientBackground from './GradientBackground';
import HealthCard from './HealthCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const healthTips = [
  {
    id: 1,
    title: "今日健康小贴士",
    content: "记得每小时起身活动5分钟，保持身体活力",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: 2,
    title: "营养建议",
    content: "多吃蔬果，保持饮食均衡，每天至少5份",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  }
];

const OptimizedDashboard: React.FC<Props> = ({ navigation }) => {
  const logout = async () => {
    // 登出逻辑
    navigation.replace('Login');
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>你好 👋</Text>
            <Text style={styles.title}>健康仪表盘</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>退出</Text>
          </TouchableOpacity>
        </View>

        {/* Health Tips Carousel */}
        <View style={styles.tipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
            {healthTips.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <Image source={{ uri: tip.image }} style={styles.tipImage} />
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipText}>{tip.content}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>今日概览</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8,432</Text>
              <Text style={styles.statLabel}>步数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7.5h</Text>
              <Text style={styles.statLabel}>睡眠</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>65kg</Text>
              <Text style={styles.statLabel}>体重</Text>
            </View>
          </View>
        </View>

        {/* Action Cards Grid */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsRow}>
            <HealthCard
              title="健康助手"
              subtitle="AI 智能问答"
              iconType="assistant"
              variant="primary"
              onPress={() => navigation.navigate('Assistant')}
            />
            <HealthCard
              title="体重日志"
              subtitle="记录与管理"
              iconType="weight"
              variant="secondary"
              onPress={() => navigation.navigate('HealthLogs')}
            />
          </View>

          <View style={styles.actionsRow}>
            <HealthCard
              title="运动追踪"
              subtitle="日常活动记录"
              iconType="activity"
              variant="tertiary"
              onPress={() => {/* TODO: 导航到运动页面 */}}
            />
            <HealthCard
              title="睡眠分析"
              subtitle="睡眠质量监测"
              iconType="sleep"
              variant="tertiary"
              onPress={() => {/* TODO: 导航到睡眠页面 */}}
            />
          </View>
        </View>

        {/* Health Trends */}
        <View style={styles.trendsCard}>
          <Text style={styles.trendsTitle}>健康趋势</Text>
          <Text style={styles.trendsSubtitle}>体重变化曲线图将在此展示</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>📊 图表即将上线</Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(249,250,251,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipsScroll: {
    paddingHorizontal: 24,
  },
  tipCard: {
    width: 300,
    height: 120,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipImage: {
    width: '100%',
    height: 80,
  },
  tipContent: {
    padding: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  trendsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  trendsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  chartText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default OptimizedDashboard;