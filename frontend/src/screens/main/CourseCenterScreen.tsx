import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// 课程类型定义
interface Course {
  id: string;
  title: string;
  instructor: string;
  duration: number;
  difficulty: '初级' | '中级' | '高级';
  category: string;
  rating: number;
  students: number;
  price: number;
  image: string;
  description: string;
  tags: string[];
}

export default function CourseCenterScreen() {
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 课程分类
  const categories = [
    { id: '全部', name: '全部', icon: 'grid-outline', color: '#4ABAB8' },
    { id: '瑜伽', name: '瑜伽', icon: 'flower-outline', color: '#A78BFA' },
    { id: '力量', name: '力量训练', icon: 'fitness-outline', color: '#F59E0B' },
    { id: '有氧', name: '有氧运动', icon: 'walk-outline', color: '#10B981' },
    { id: 'HIIT', name: 'HIIT', icon: 'flash-outline', color: '#EF4444' },
    { id: '舞蹈', name: '舞蹈', icon: 'musical-notes-outline', color: '#EC4899' },
  ];

  // 课程数据
  const courses: Course[] = [
    {
      id: '1',
      title: '初学者瑜伽入门',
      instructor: '李教练',
      duration: 30,
      difficulty: '初级',
      category: '瑜伽',
      rating: 4.8,
      students: 2340,
      price: 0,
      image: '🧘',
      description: '适合零基础学员的瑜伽入门课程',
      tags: ['零基础', '拉伸', '放松']
    },
    {
      id: '2',
      title: '腹肌撕裂者训练',
      instructor: '王教练',
      duration: 20,
      difficulty: '高级',
      category: '力量',
      rating: 4.9,
      students: 1820,
      price: 19.9,
      image: '💪',
      description: '高强度腹肌训练计划',
      tags: ['腹肌', '核心力量', '塑形']
    },
    {
      id: '3',
      title: '燃脂HIIT训练',
      instructor: '张教练',
      duration: 45,
      difficulty: '中级',
      category: 'HIIT',
      rating: 4.7,
      students: 3100,
      price: 29.9,
      image: '🔥',
      description: '高效燃脂的间歇训练',
      tags: ['燃脂', '减重', '心肺功能']
    },
    {
      id: '4',
      title: '有氧舞蹈派对',
      instructor: '陈教练',
      duration: 40,
      difficulty: '初级',
      category: '舞蹈',
      rating: 4.6,
      students: 1560,
      price: 0,
      image: '💃',
      description: '在音乐中享受运动的乐趣',
      tags: ['舞蹈', '有氧', '有趣']
    },
    {
      id: '5',
      title: '全身力量训练',
      instructor: '刘教练',
      duration: 50,
      difficulty: '中级',
      category: '力量',
      rating: 4.8,
      students: 2100,
      price: 39.9,
      image: '🏋️',
      description: '系统性全身肌肉训练',
      tags: ['力量', '增肌', '塑形']
    },
    {
      id: '6',
      title: '晨间瑜伽唤醒',
      instructor: '赵教练',
      duration: 15,
      difficulty: '初级',
      category: '瑜伽',
      rating: 4.9,
      students: 980,
      price: 0,
      image: '🌅',
      description: '清晨的温柔唤醒练习',
      tags: ['早晨', '唤醒', '温和']
    },
  ];

  // 筛选课程
  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === '全部' || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.courseCard}>
      <View style={styles.courseImageContainer}>
        <Text style={styles.courseImage}>{item.image}</Text>
        {item.price === 0 && (
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
            <Ionicons name="signal-cellular-1" size={12} color="#6B7280" />
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

        {item.price > 0 && (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>¥{item.price}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 头部搜索栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>运动课程</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索课程或教练"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* 分类选择 */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && {
                    backgroundColor: category.color,
                    borderColor: category.color,
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={selectedCategory === category.id ? '#FFFFFF' : category.color}
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
            <Text style={styles.courseCount}>{filteredCourses.length}个课程</Text>
          </View>

          <FlatList
            data={filteredCourses}
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
    top: 12,
    right: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
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
});