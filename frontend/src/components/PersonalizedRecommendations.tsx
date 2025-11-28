import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

interface HealthData {
  currentWeight?: number;
  targetWeight?: number;
  weightRecords?: Array<{ date: string; weight: number }>;
  steps?: number;
  sleep?: number;
  mood?: number;
  lastCheckIn?: string;
}

interface Recommendation {
  id: string;
  type: 'exercise' | 'nutrition' | 'sleep' | 'motivation' | 'goal';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionText?: string;
  onPress?: () => void;
}

interface PersonalizedRecommendationsProps {
  healthData: HealthData;
  onActionPress?: (recommendation: Recommendation) => void;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  healthData,
  onActionPress
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, [healthData]);

  const generateRecommendations = () => {
    setLoading(true);
    const newRecommendations: Recommendation[] = [];

    // 基于体重数据的推荐
    if (healthData.currentWeight && healthData.targetWeight) {
      const weightDiff = healthData.currentWeight - healthData.targetWeight;

      if (weightDiff > 0) {
        // 需要减重
        newRecommendations.push({
          id: 'weight_loss_plan',
          type: 'exercise',
          title: '🏃 减重运动计划',
          description: `距离目标体重还差${weightDiff.toFixed(1)}kg，建议每周进行3-4次有氧运动`,
          priority: 'high',
          actionText: '查看运动计划',
          onPress: () => showExercisePlan(weightDiff)
        });

        newRecommendations.push({
          id: 'calorie_control',
          type: 'nutrition',
          title: '🥗 热量控制建议',
          description: '建议每日摄入热量比消耗少300-500卡路里，多食用高蛋白低脂食物',
          priority: 'high',
          actionText: '查看饮食建议',
          onPress: () => showNutritionAdvice()
        });
      }
    }

    // 基于体重记录趋势的推荐
    if (healthData.weightRecords && healthData.weightRecords.length >= 2) {
      const recentTrend = calculateWeightTrend(healthData.weightRecords);

      if (recentTrend > 0) {
        newRecommendations.push({
          id: 'weight_increasing',
          type: 'motivation',
          title: '⚠️ 体重上升趋势',
          description: '最近一周体重有所上升，建议加强运动并注意饮食控制',
          priority: 'medium',
          actionText: '查看详细分析',
          onPress: () => showWeightAnalysis()
        });
      } else if (recentTrend < 0) {
        newRecommendations.push({
          id: 'progress_encouragement',
          type: 'motivation',
          title: '🎉 进步显著',
          description: '最近的努力有了效果！继续保持这个良好趋势',
          priority: 'low',
          actionText: '分享成就',
          onPress: () => shareProgress()
        });
      }
    }

    // 基于步数的推荐
    if (healthData.steps) {
      if (healthData.steps < 5000) {
        newRecommendations.push({
          id: 'increase_steps',
          type: 'exercise',
          title: '👟 增加日常活动',
          description: '今日步数较少，建议增加步行或爬楼梯等日常活动',
          priority: 'medium',
          actionText: '设置步数目标',
          onPress: () => setStepsGoal()
        });
      } else if (healthData.steps >= 10000) {
        newRecommendations.push({
          id: 'great_steps',
          type: 'motivation',
          title: '🌟 步数达标',
          description: '太棒了！今天的运动量很充足',
          priority: 'low',
        });
      }
    }

    // 基于睡眠的推荐
    if (healthData.sleep) {
      if (healthData.sleep < 6) {
        newRecommendations.push({
          id: 'sleep_warning',
          type: 'sleep',
          title: '😴 睡眠不足',
          description: '昨晚睡眠时间较短，充足睡眠对健康很重要',
          priority: 'high',
          actionText: '睡眠改善建议',
          onPress: () => showSleepAdvice()
        });
      } else if (healthData.sleep >= 8) {
        newRecommendations.push({
          id: 'sleep_good',
          type: 'sleep',
          title: '💤 睡眠充足',
          description: '睡眠时间充足，有助于身体恢复和健康',
          priority: 'low',
        });
      }
    }

    // 基于心情的推荐
    if (healthData.mood) {
      if (healthData.mood <= 2) {
        newRecommendations.push({
          id: 'mood_support',
          type: 'motivation',
          title: '💝 心情关怀',
          description: '心情不太好？试着做一些轻松的运动或听些舒缓的音乐',
          priority: 'medium',
          actionText: '查看放松方法',
          onPress: () => showRelaxationMethods()
        });
      }
    }

    // 连续打卡激励
    const daysSinceLastCheckIn = healthData.lastCheckIn
      ? Math.floor((new Date().getTime() - new Date(healthData.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (daysSinceLastCheckIn > 3) {
      newRecommendations.push({
        id: 'come_back',
        type: 'goal',
        title: '📅 继续记录',
        description: `已经${daysSinceLastCheckIn}天没有记录了，继续保持健康习惯吧`,
        priority: 'high',
        actionText: '立即打卡',
        onPress: () => onActionPress?.({ id: 'check_in', type: 'goal', title: '', description: '', priority: 'high' as any })
      });
    }

    // 按优先级排序
    newRecommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setRecommendations(newRecommendations.slice(0, 5)); // 最多显示5个推荐
    setLoading(false);
  };

  const calculateWeightTrend = (records: Array<{ date: string; weight: number }>): number => {
    if (records.length < 2) return 0;

    const sortedRecords = [...records].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const recentRecords = sortedRecords.slice(-3); // 最近3次记录
    const firstWeight = recentRecords[0].weight;
    const lastWeight = recentRecords[recentRecords.length - 1].weight;

    return lastWeight - firstWeight;
  };

  const showExercisePlan = (weightDiff: number) => {
    Alert.alert(
      '运动计划建议',
      `为了健康减重${weightDiff.toFixed(1)}kg，建议：\n\n🏃 每周3-4次有氧运动\n💪 每次30-45分钟\n🎯 结合力量训练\n⚖️ 预计每周减重0.5-1kg`,
      [{ text: '知道了', style: 'default' }]
    );
  };

  const showNutritionAdvice = () => {
    Alert.alert(
      '饮食建议',
      '🥗 多吃蔬菜水果\n🍖 适量优质蛋白质\n🥛 控制碳水化合物\n💧 充足饮水\n⏰ 规律三餐时间',
      [{ text: '知道了', style: 'default' }]
    );
  };

  const showWeightAnalysis = () => {
    Alert.alert(
      '体重分析',
      '最近体重有上升趋势，建议：\n\n📝 记录每日饮食\n🏃 增加运动量\n⚖️ 定期称重\n🎯 重新评估目标',
      [{ text: '知道了', style: 'default' }]
    );
  };

  const shareProgress = () => {
    Alert.alert(
      '分享成就',
      '🎉 你的健康努力值得分享！\n\n功能开发中，敬请期待...',
      [{ text: '知道了', style: 'default' }]
    );
  };

  const setStepsGoal = () => {
    Alert.alert(
      '步数目标',
      '建议每日步数目标：\n\n🎯 初级：6000步\n🎯 中级：8000步\n🎯 高级：10000步\n\n循序渐进，持之以恒！',
      [{ text: '知道了', style: 'default' }]
    );
  };

  const showSleepAdvice = () => {
    Alert.alert(
      '睡眠改善建议',
      '😴 改善睡眠的方法：\n\n🌙 固定作息时间\n📱 睡前远离手机\n☕ 避免晚间咖啡\n🧘 睡前放松练习\n🛏️ 舒适睡眠环境',
      [{ text: '知道了', style: 'default' }]
    );
  };

  const showRelaxationMethods = () => {
    Alert.alert(
      '放松方法',
      '💝 心情不好时试试：\n\n🎵 听舒缓音乐\n🚶 散步呼吸新鲜空气\n👥 与朋友聊天\n🎨 做喜欢的事情\n🧘 尝试冥想或瑜伽',
      [{ text: '知道了', style: 'default' }]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '重要';
      case 'medium': return '建议';
      case 'low': return '鼓励';
      default: return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>生成个性化建议中...</Text>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌟</Text>
          <Text style={styles.emptyTitle}>一切正常</Text>
          <Text style={styles.emptyText}>
            继续保持良好的健康习惯！
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 个性化建议</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.recommendationsScroll}
        contentContainerStyle={styles.recommendationsList}
      >
        {recommendations.map((recommendation) => (
          <TouchableOpacity
            key={recommendation.id}
            style={[
              styles.recommendationCard,
              { borderLeftColor: getPriorityColor(recommendation.priority) }
            ]}
            onPress={() => recommendation.onPress?.()}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{recommendation.title}</Text>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(recommendation.priority) }
              ]}>
                <Text style={styles.priorityText}>
                  {getPriorityLabel(recommendation.priority)}
                </Text>
              </View>
            </View>

            <Text style={styles.cardDescription}>
              {recommendation.description}
            </Text>

            {recommendation.actionText && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => recommendation.onPress?.()}
                activeOpacity={0.7}
              >
                <Text style={styles.actionText}>{recommendation.actionText}</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  recommendationsScroll: {
    flexDirection: 'row',
  },
  recommendationsList: {
    paddingRight: 8,
  },
  recommendationCard: {
    width: 280,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PersonalizedRecommendations;