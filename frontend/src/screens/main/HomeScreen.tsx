import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();

  // 健康数据
  const [healthStats, setHealthStats] = useState([
    {
      icon: 'walk-outline',
      label: '步数',
      value: '8,234',
      target: '10,000',
      color: '#B8E5E5',
      progress: 82
    },
    {
      icon: 'flame-outline',
      label: '卡路里',
      value: '1,456',
      target: '2,000',
      color: '#FFD88C',
      progress: 73
    },
    {
      icon: 'moon-outline',
      label: '睡眠',
      value: '7.5h',
      target: '8h',
      color: '#D4EDD4',
      progress: 94
    },
    {
      icon: 'heart-outline',
      label: '心率',
      value: '72',
      target: 'bpm',
      color: '#FFB5C5',
      progress: 90
    },
  ]);

  // 体重数据
  const [weightData, setWeightData] = useState({
    labels: ['11/22', '11/23', '11/24', '11/25', '11/26', '11/27', '11/28'],
    datasets: [{
      data: [68.5, 68.2, 68.0, 67.8, 67.5, 67.3, 67.0],
      color: (opacity = 1) => `rgba(74, 186, 184, ${opacity})`,
      strokeWidth: 3,
    }],
  });

  // 快捷操作 - 使用专业化的Ionicons图标
  const quickActions = [
    {
      icon: 'nutrition-outline',
      iconFilled: 'nutrition',
      label: '营养记录',
      color: '#10B981',
      description: '记录每日饮食摄入',
      route: 'Nutrition'
    },
    {
      icon: 'barbell-outline',
      iconFilled: 'barbell',
      label: '运动健身',
      color: '#F59E0B',
      description: '追踪运动数据',
      route: 'Workout'
    },
    {
      icon: 'medkit-outline',
      iconFilled: 'medkit',
      label: '用药管理',
      color: '#8B5CF6',
      description: '智能用药提醒',
      route: 'Medication'
    },
    {
      icon: 'clipboard-outline',
      iconFilled: 'clipboard',
      label: '健康报告',
      color: '#06B6D4',
      description: '查看健康趋势',
      route: 'Reports'
    },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 186, 184, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '3',
      stroke: '#4ABAB8',
      fill: '#ffffff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5',
      stroke: 'rgba(0,0,0,0.03)',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontFamily: 'System',
      fontSize: 12,
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 渐变头部区域 */}
        <LinearGradient
          colors={['#B8E5E5', '#D4EDD4']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>你好，小明 👋</Text>
              <Text style={styles.subgreeting}>今天也要保持健康哦</Text>
            </View>

            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 今日统计卡片 */}
          <View style={styles.statsGrid}>
            {healthStats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert(
                    `${stat.label}详情`,
                    `今日${stat.label}: ${stat.value}${stat.target.startsWith('bpm') ? '' : '/' + stat.target}\n完成度: ${stat.progress}%`,
                    [{ text: '查看详情', style: 'default' }, { text: '取消', style: 'cancel' }]
                  );
                }}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                    <Ionicons
                      name={stat.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={stat.color}
                    />
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>

                <View style={styles.statValueSection}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTarget}>/ {stat.target}</Text>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${stat.progress}%`,
                        backgroundColor: stat.color
                      }
                    ]}
                  />
                </View>

                <View style={styles.statFooter}>
                  <Text style={[styles.progressText, { color: stat.color }]}>
                    {stat.progress}%
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={stat.color}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* 体重趋势图表 */}
        <View style={styles.chartSection}>
          <TouchableOpacity
            style={styles.chartHeader}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                '体重趋势详情',
                '过去7天体重变化趋势：\n起始体重：68.5 kg\n当前体重：67.0 kg\n总变化：-1.5 kg\n平均日变化：-0.21 kg\n\n点击查看详细分析报告。',
                [
                  { text: '查看详情', style: 'default' },
                  { text: '知道了', style: 'cancel' }
                ]
              );
            }}
          >
            <View style={styles.chartTitleContainer}>
              <Ionicons name="trending-up-outline" size={20} color="#4ABAB8" />
              <Text style={styles.chartTitle}>体重趋势</Text>
            </View>
            <View style={styles.chartChangeContainer}>
              <Text style={styles.chartChange}>-1.5 kg</Text>
              <Ionicons name="chevron-down" size={16} color="#10B981" />
            </View>
          </TouchableOpacity>

          <View style={styles.chartContainer}>
            <LineChart
              data={weightData}
              width={width - 48}
              height={240}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withHorizontalLines={true}
              withVerticalLines={false}
              withDots={true}
              withShadow={true}
              segmentWidth={20}
              yAxisInterval={1}
              xAxisLabel={''}
              formatYLabel={(yValue) => yValue + 'kg'}
              getDotColor={(value, index) => {
                return index === weightData.datasets[0].data.length - 1 ? '#10B981' : '#4ABAB8';
              }}
            />
          </View>
        </View>

        {/* 快捷操作 */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>快捷操作</Text>

          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                activeOpacity={0.8}
                onPress={() => {
                  // 实现页面跳转
                  if (action.route === 'Nutrition') {
                    navigation.navigate('Nutrition');
                  } else if (action.route === 'Workout') {
                    // 跳转到运动健身页面
                    navigation.navigate('SportsTraining');
                  } else {
                    Alert.alert(
                      '功能开发中',
                      `${action.label}功能即将上线，敬请期待！`,
                      [{ text: '确定', style: 'default' }]
                    );
                  }
                }}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: action.color + '15' }
                  ]}
                >
                  <Ionicons
                    name={action.icon as keyof typeof Ionicons.glyphMap}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 今日健康小贴士 */}
        <View style={styles.tipSection}>
          <LinearGradient
            colors={['#4ABAB820', '#4ABAB805']}
            style={styles.tipGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity
              style={styles.tipContent}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  '健康小贴士',
                  '保持规律的作息时间有助于维持身体的生物钟，建议每天在相同时间入睡和起床。\n\n了解更多健康知识，请关注我们的健康专栏。',
                  [
                    { text: '了解更多', style: 'default' },
                    { text: '知道了', style: 'cancel' }
                  ]
                );
              }}
            >
              <View style={styles.tipIcon}>
                <Ionicons name="bulb-outline" size={24} color="#4ABAB8" />
              </View>

              <View style={styles.tipTextContainer}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipTitle}>今日健康小贴士</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4ABAB8" />
                </View>
                <Text style={styles.tipDescription}>
                  保持规律的作息时间有助于维持身体的生物钟，建议每天在相同时间入睡和起床。
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
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
  scrollContent: {
    paddingBottom: 100, // 为底部导航留出空间
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subgreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  notificationButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backdropFilter: 'blur(10px)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValueSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statTarget: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartSection: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chartChange: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  chartChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    width: width - 48,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  chartDataText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  quickActionsSection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  tipSection: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  tipGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFD88C20',
  },
  tipContent: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#4ABAB820',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tipDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});