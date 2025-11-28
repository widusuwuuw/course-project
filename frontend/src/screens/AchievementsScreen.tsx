import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AchievementBadge from '@/components/AchievementBadge';
import { achievementManager, Achievement } from '@/utils/achievements';
import GradientBackground from '@/components/GradientBackground';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

export default function AchievementsScreen({ navigation }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'weight' | 'consistency' | 'milestone'>('all');
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    inProgress: 0,
    completionRate: 0
  });

  useEffect(() => {
    loadAchievements();
    setupAchievementListener();
  }, []);

  const loadAchievements = async () => {
    const allAchievements = achievementManager.getAchievements();
    const achievementStats = achievementManager.getAchievementStats();

    setAchievements(allAchievements);
    setStats(achievementStats);
  };

  const setupAchievementListener = () => {
    achievementManager.onAchievementUnlocked = (achievement) => {
      Alert.alert(
        '🎉 新成就解锁！',
        `恭喜获得「${achievement.name}」徽章！\n${achievement.description}`,
        [{ text: '太棒了！', style: 'default' }]
      );
      loadAchievements(); // 刷新列表
    };
  };

  const categories = [
    { key: 'all', label: '全部', icon: '🌟' },
    { key: 'weight', label: '体重管理', icon: '⚖️' },
    { key: 'consistency', label: '坚持记录', icon: '📅' },
    { key: 'milestone', label: '里程碑', icon: '🏆' },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(achievement => achievement.category === selectedCategory);

  const renderAchievementGrid = () => {
    return (
      <View style={styles.achievementGrid}>
        {filteredAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            badge={achievement}
            size="medium"
            onPress={(badge) => {
              Alert.alert(
                badge.name,
                badge.description + (badge.isUnlocked ? `\n\n📅 解锁时间: ${badge.unlockedDate}` : ''),
                [{ text: '知道了', style: 'default' }]
              );
            }}
          />
        ))}
      </View>
    );
  };

  const renderCategoryChip = (category: typeof categories[0]) => (
    <TouchableOpacity
      key={category.key}
      style={[
        styles.categoryChip,
        selectedCategory === category.key && styles.categoryChipActive
      ]}
      onPress={() => setSelectedCategory(category.key as any)}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryEmoji}>{category.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === category.key && styles.categoryTextActive
      ]}>
        {category.label}
      </Text>
      <Text style={styles.categoryCount}>
        {
          category.key === 'all'
            ? stats.total
            : achievements.filter(a => a.category === category.key).length
        }
      </Text>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* 页面标题 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>健康成就</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 统计卡片 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.unlocked}</Text>
            <Text style={styles.statLabel}>已解锁</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>进行中</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>完成率</Text>
          </View>
        </View>

        {/* 分类选择器 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map(renderCategoryChip)}
        </ScrollView>

        {/* 成就列表 */}
        <ScrollView
          style={styles.achievementsContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredAchievements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>暂无成就</Text>
              <Text style={styles.emptyText}>开始记录健康数据，解锁你的第一个成就吧！</Text>
            </View>
          ) : (
            renderAchievementGrid()
          )}
        </ScrollView>

        {/* 底部激励文字 */}
        <View style={styles.motivationSection}>
          <Text style={styles.motivationText}>
            {stats.completionRate === 100
              ? '🏆 太棒了！你已经解锁了所有成就！'
              : `继续加油！还差 ${stats.total - stats.unlocked} 个成就就能达成全集了！`
            }
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(249, 250, 251, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 6,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  achievementsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  motivationSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});