import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function WorkoutScreen() {
  const { colors } = useTheme();

  const [selectedWorkout, setSelectedWorkout] = useState('fullbody');

  // 运动计划数据
  const workoutPlans = [
    {
      id: 'fullbody',
      title: '全身训练',
      duration: '30分钟',
      difficulty: '中等',
      calories: '200-300',
      equipment: '无器械',
      color: '#4ABAB8',
      exercises: [
        { name: '开合跳', sets: '3组', duration: '30秒', rest: '30秒' },
        { name: '深蹲', sets: '3组', duration: '15次', rest: '45秒' },
        { name: '俯卧撑', sets: '3组', duration: '10次', rest: '60秒' },
        { name: '平板支撑', sets: '3组', duration: '30秒', rest: '30秒' },
        { name: '登山跑', sets: '3组', duration: '20秒', rest: '40秒' },
      ]
    },
    {
      id: 'cardio',
      title: '有氧运动',
      duration: '25分钟',
      difficulty: '简单',
      calories: '150-250',
      equipment: '瑜伽垫',
      color: '#FFD88C',
      exercises: [
        { name: '原地跑步', sets: '5分钟', duration: '', rest: '' },
        { name: '高抬腿', sets: '3组', duration: '30秒', rest: '30秒' },
        { name: '跳绳（模拟）', sets: '3组', duration: '1分钟', rest: '30秒' },
        { name: '波比跳', sets: '3组', duration: '8次', rest: '45秒' },
      ]
    },
    {
      id: 'strength',
      title: '力量训练',
      duration: '35分钟',
      difficulty: '困难',
      calories: '250-350',
      equipment: '哑铃',
      color: '#D4EDD4',
      exercises: [
        { name: '哑铃深蹲', sets: '4组', duration: '12次', rest: '60秒' },
        { name: '哑铃推举', sets: '4组', duration: '10次', rest: '60秒' },
        { name: '哑铃弯举', sets: '4组', duration: '12次', rest: '45秒' },
        { name: '哑铃飞鸟', sets: '4组', duration: '10次', rest: '60秒' },
      ]
    },
  ];

  // 今日运动数据
  const todayStats = [
    { label: '今日运动时长', value: '45分钟', icon: 'time-outline', color: '#4ABAB8' },
    { label: '消耗卡路里', value: '320 kcal', icon: 'flame-outline', color: '#FFD88C' },
    { label: '完成动作', value: '12个', icon: 'checkmark-circle-outline', color: '#D4EDD4' },
    { label: '连续打卡', value: '5天', icon: 'calendar-outline', color: '#FFB5C5' },
  ];

  // 热门课程
  const popularCourses = [
    { title: '7天减脂计划', students: '2.3k', rating: '4.8', duration: '15-30分钟/天', difficulty: '初级' },
    { title: '腹肌撕裂者', students: '1.8k', rating: '4.9', duration: '20分钟', difficulty: '中级' },
    { title: 'HIIT燃脂训练', students: '3.1k', rating: '4.7', duration: '25分钟', difficulty: '高级' },
  ];

  const currentWorkout = workoutPlans.find(plan => plan.id === selectedWorkout);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* 运动数据统计 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>今日运动数据</Text>
          <View style={styles.statsGrid}>
            {todayStats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
                <View style={styles.statHeader}>
                  <Ionicons
                    name={stat.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={stat.color}
                  />
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 运动计划选择 */}
        <View style={styles.workoutSection}>
          <Text style={styles.sectionTitle}>运动计划</Text>
          <View style={styles.workoutTabs}>
            {workoutPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.workoutTab,
                  selectedWorkout === plan.id && {
                    backgroundColor: plan.color,
                    borderColor: plan.color,
                  }
                ]}
                onPress={() => setSelectedWorkout(plan.id)}
              >
                <Text style={[
                  styles.workoutTabText,
                  selectedWorkout === plan.id && styles.workoutTabTextActive
                ]}>
                  {plan.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {currentWorkout && (
            <View style={styles.workoutDetails}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>{currentWorkout.title}</Text>
                  <View style={styles.workoutMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{currentWorkout.duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="fitness-outline" size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{currentWorkout.difficulty}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="flame-outline" size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{currentWorkout.calories}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={[styles.startButton, { backgroundColor: currentWorkout.color }]}>
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.startButtonText}>开始训练</Text>
                </TouchableOpacity>
              </View>

              {/* 动作列表 */}
              <View style={styles.exercisesList}>
                <Text style={styles.exercisesTitle}>动作详情</Text>
                {currentWorkout.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.exerciseContent}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseDetail}>{exercise.sets}</Text>
                        {exercise.duration && (
                          <Text style={styles.exerciseDetail}>{exercise.duration}</Text>
                        )}
                        {exercise.rest && (
                          <Text style={styles.exerciseDetail}>休息{exercise.rest}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.exercisePlayButton}>
                      <Ionicons name="play-circle" size={24} color={currentWorkout.color} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 热门课程 */}
        <View style={styles.coursesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>热门课程</Text>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>查看全部</Text>
              <Ionicons name="chevron-forward" size={16} color="#4ABAB8" />
            </TouchableOpacity>
          </View>

          <View style={styles.coursesList}>
            {popularCourses.map((course, index) => (
              <TouchableOpacity key={index} style={styles.courseCard}>
                <LinearGradient
                  colors={['#4ABAB830', '#4ABAB810']}
                  style={styles.courseImage}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="fitness-outline" size={32} color="#4ABAB8" />
                </LinearGradient>

                <View style={styles.courseContent}>
                  <Text style={styles.courseTitle}>{course.title}</Text>

                  <View style={styles.courseMeta}>
                    <View style={styles.courseMetaItem}>
                      <Ionicons name="people-outline" size={14} color="#6B7280" />
                      <Text style={styles.courseMetaText}>{course.students}</Text>
                    </View>
                    <View style={styles.courseMetaItem}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={styles.courseMetaText}>{course.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.courseTags}>
                    <View style={styles.courseTag}>
                      <Text style={styles.courseTagText}>{course.duration}</Text>
                    </View>
                    <View style={styles.courseTag}>
                      <Text style={styles.courseTagText}>{course.difficulty}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  workoutSection: {
    marginBottom: 24,
  },
  workoutTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  workoutTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  workoutTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  workoutTabTextActive: {
    color: '#FFFFFF',
  },
  workoutDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exercisesList: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 20,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ABAB8',
  },
  exerciseContent: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  exercisePlayButton: {
    padding: 4,
  },
  coursesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreButtonText: {
    fontSize: 14,
    color: '#4ABAB8',
    fontWeight: '500',
  },
  coursesList: {
    gap: 12,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  courseImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  courseTags: {
    flexDirection: 'row',
    gap: 8,
  },
  courseTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseTagText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
});