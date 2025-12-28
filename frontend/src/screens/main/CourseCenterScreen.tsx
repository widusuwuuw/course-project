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
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { apiGet, apiPost } from '../../api/client';

const { width } = Dimensions.get('window');

// 课程类型定义
interface Course {
  id: string;
  title: string;
  exercise_id: string;
  instructor: string;
  duration: number;
  difficulty: '初级' | '中级' | '高级';
  category: string;
  rating: number;
  students: number;
  price: number;
  is_free: boolean;
  cover_image: string;
  description: string;
  tags: string[];
  calories: number;
  equipment: string[];
  suitable_for: string[];
  preview_steps: string[];
}

// 分类图标映射（与后端exercise_database保持一致）
const categoryIcons: { [key: string]: string } = {
  '全部': 'grid-outline',
  '有氧运动': 'walk-outline',
  '力量训练': 'fitness-outline',
  '柔韧性训练': 'body-outline',
  '传统中式': 'leaf-outline',
  '高强度间歇': 'flash-outline',
  '水中运动': 'water-outline',
  '功能性训练': 'barbell-outline',
};

// 分类颜色映射（与后端exercise_database保持一致）
const categoryColors: { [key: string]: string } = {
  '全部': '#4ABAB8',
  '有氧运动': '#10B981',
  '力量训练': '#F59E0B',
  '柔韧性训练': '#A78BFA',
  '传统中式': '#84CC16',
  '高强度间歇': '#EF4444',
  '水中运动': '#06B6D4',
  '功能性训练': '#8B5CF6',
};

// 课程封面emoji映射（与后端exercise_database保持一致）
const courseEmojis: { [key: string]: string } = {
  '有氧运动': '🏃',
  '力量训练': '💪',
  '柔韧性训练': '🧘',
  '传统中式': '🥋',
  '高强度间歇': '🔥',
  '水中运动': '🏊',
  '功能性训练': '🏋️',
};

export default function CourseCenterScreen() {
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 课程详情弹窗
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [recording, setRecording] = useState(false);

  // 课程分类（与后端exercise_database保持一致）
  const categories = [
    { id: '全部', name: '全部' },
    { id: '有氧运动', name: '有氧运动' },
    { id: '力量训练', name: '力量训练' },
    { id: '柔韧性训练', name: '柔韧性训练' },
    { id: '传统中式', name: '传统中式' },
    { id: '高强度间歇', name: '高强度间歇' },
    { id: '水中运动', name: '水中运动' },
    { id: '功能性训练', name: '功能性训练' },
  ];

  // 从API加载课程
  const loadCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== '全部') {
        params.append('category', selectedCategory);
      }
      
      const response = await apiGet(`/logs/courses?${params.toString()}`);
      setCourses(response.courses || []);
    } catch (error) {
      console.error('加载课程失败:', error);
      Alert.alert('错误', '加载课程失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  // 打开课程详情
  const openCourseDetail = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailModal(true);
  };

  // 记录完成课程
  const recordCourseCompletion = async () => {
    if (!selectedCourse) return;
    
    setRecording(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const courseRecord = {
        course_id: selectedCourse.id,
        course_title: selectedCourse.title,
        exercise_id: selectedCourse.exercise_id,
        instructor: selectedCourse.instructor,
        duration: selectedCourse.duration,
        difficulty: selectedCourse.difficulty,
        calories: selectedCourse.calories,
        completed_at: new Date().toISOString(),
        from_plan: false,
      };

      const response = await apiPost('/logs/exercise', {
        log_date: today,
        courses: [courseRecord],
        mood: 'good',
      });

      Alert.alert(
        '✅ 记录成功！',
        `恭喜完成"${selectedCourse.title}"！\n消耗了 ${selectedCourse.calories} 卡路里\n今日总消耗: ${response.total_calories} 卡路里`,
        [{ text: '好的', onPress: () => setShowDetailModal(false) }]
      );
    } catch (error) {
      console.error('记录失败:', error);
      Alert.alert('错误', '记录失败，请稍后重试');
    } finally {
      setRecording(false);
    }
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => openCourseDetail(item)}
    >
      <View style={[styles.courseImageContainer, { backgroundColor: `${categoryColors[item.category] || '#4ABAB8'}15` }]}>
        <Text style={styles.courseImage}>{courseEmojis[item.category] || '🏃'}</Text>
        {item.is_free && (
          <View style={styles.freeTag}>
            <Text style={styles.freeTagText}>免费</Text>
          </View>
        )}
      </View>

      <View style={styles.courseContent}>
        <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.courseInstructor}>{item.instructor}</Text>

        <View style={styles.courseMeta}>
          <View style={styles.courseMetaItem}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.courseMetaText}>{item.duration}分钟</Text>
          </View>
          <View style={styles.courseMetaItem}>
            <Ionicons name="flame-outline" size={12} color="#EF4444" />
            <Text style={[styles.courseMetaText, { color: '#EF4444' }]}>{item.calories}卡</Text>
          </View>
          <View style={styles.courseMetaItem}>
            <Ionicons name="speedometer-outline" size={12} color="#6B7280" />
            <Text style={styles.courseMetaText}>{item.difficulty}</Text>
          </View>
        </View>

        <View style={styles.courseStats}>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <View style={styles.students}>
            <Ionicons name="people-outline" size={12} color="#6B7280" />
            <Text style={styles.studentsText}>{item.students}人</Text>
          </View>
        </View>

        <View style={styles.courseTags}>
          {item.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.courseTag}>
              <Text style={styles.courseTagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {!item.is_free && item.price > 0 && (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>¥{item.price}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // 课程详情弹窗
  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedCourse && (
            <>
              {/* 课程封面 */}
              <View style={[styles.detailHeader, { backgroundColor: `${categoryColors[selectedCourse.category] || '#4ABAB8'}20` }]}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.detailEmoji}>{courseEmojis[selectedCourse.category] || '🏃'}</Text>
                <Text style={styles.detailTitle}>{selectedCourse.title}</Text>
                <Text style={styles.detailInstructor}>{selectedCourse.instructor}</Text>
              </View>

              <ScrollView style={styles.detailBody}>
                {/* 核心数据 */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedCourse.duration}</Text>
                    <Text style={styles.statLabel}>分钟</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#EF4444' }]}>{selectedCourse.calories}</Text>
                    <Text style={styles.statLabel}>卡路里</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedCourse.difficulty}</Text>
                    <Text style={styles.statLabel}>难度</Text>
                  </View>
                </View>

                {/* 课程描述 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitleDetail}>课程介绍</Text>
                  <Text style={styles.description}>{selectedCourse.description}</Text>
                </View>

                {/* 课程标签 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitleDetail}>课程标签</Text>
                  <View style={styles.tagList}>
                    {selectedCourse.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.suitableTag}>
                        <Ionicons name="pricetag-outline" size={14} color="#10B981" />
                        <Text style={styles.suitableText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 课程信息 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitleDetail}>课程信息</Text>
                  <View style={styles.infoList}>
                    <View style={styles.infoItem}>
                      <Ionicons name="star" size={16} color="#FBBF24" />
                      <Text style={styles.infoText}>评分：{selectedCourse.rating}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="people-outline" size={16} color="#6B7280" />
                      <Text style={styles.infoText}>{selectedCourse.students}人已学习</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                      <Text style={styles.infoText}>
                        {selectedCourse.is_free ? '免费课程' : `¥${selectedCourse.price}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* 底部按钮 */}
              <View style={styles.detailFooter}>
                <TouchableOpacity
                  style={[styles.recordButton, recording && styles.recordButtonDisabled]}
                  onPress={recordCourseCompletion}
                  disabled={recording}
                >
                  {recording ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.recordButtonText}>完成课程并记录</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 头部标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>运动课程</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 分类选择 */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && {
                    backgroundColor: categoryColors[category.id] || '#4ABAB8',
                    borderColor: categoryColors[category.id] || '#4ABAB8',
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={categoryIcons[category.id] as keyof typeof Ionicons.glyphMap || 'grid-outline'}
                  size={16}
                  color={selectedCategory === category.id ? '#FFFFFF' : categoryColors[category.id] || '#4ABAB8'}
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 推荐课程横幅 */}
        <View style={styles.bannerSection}>
          <LinearGradient
            colors={['#4ABAB8', '#389BA2']}
            style={styles.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>今日推荐</Text>
              <Text style={styles.bannerSubtitle}>精选优质课程，助您达成健身目标</Text>
            </View>
            <Ionicons name="trophy-outline" size={40} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* 课程列表 */}
        <View style={styles.coursesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === '全部' ? '全部课程' : `${selectedCategory}课程`}
            </Text>
            <Text style={styles.courseCount}>{courses.length}个课程</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ABAB8" />
              <Text style={styles.loadingText}>加载课程中...</Text>
            </View>
          ) : (
            <FlatList
              data={courses}
              renderItem={renderCourseItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.coursesList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>没有找到相关课程</Text>
                  <Text style={styles.emptySubtext}>试试调整搜索条件或分类</Text>
                </View>
              }
            />
          )}
        </View>

      </ScrollView>

      {/* 课程详情弹窗 */}
      {renderDetailModal()}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  categoriesSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  bannerSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  coursesSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  courseCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  coursesList: {
    gap: 12,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  courseImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  courseImage: {
    fontSize: 32,
  },
  freeTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 12,
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
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  students: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  studentsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  courseTags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
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
  priceContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  detailHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailInstructor: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailBody: {
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleDetail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suitableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  suitableText: {
    fontSize: 13,
    color: '#059669',
  },
  equipmentTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  equipmentText: {
    fontSize: 13,
    color: '#4B5563',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ABAB8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 14,
    color: '#4B5563',
  },
  detailFooter: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ABAB8',
    paddingVertical: 16,
    borderRadius: 12,
  },
  recordButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});