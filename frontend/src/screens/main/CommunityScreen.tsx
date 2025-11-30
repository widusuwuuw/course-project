import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function CommunityScreen() {
  const { colors } = useTheme();

  const [selectedTab, setSelectedTab] = useState('hot');

  // 话题标签
  const topicTabs = [
    { id: 'hot', label: '热门', icon: 'flame-outline' },
    { id: 'follow', label: '关注', icon: 'heart-outline' },
    { id: 'fitness', label: '健身', icon: 'fitness-outline' },
    { id: 'diet', label: '饮食', icon: 'restaurant-outline' },
    { id: 'mental', label: '心理', icon: 'happy-outline' },
  ];

  // 社区帖子数据
  const communityPosts = [
    {
      id: 1,
      author: {
        name: '健身达人小王',
        avatar: '🏋️',
        level: 'LV.5',
        isFollowed: false,
      },
      content: '今天完成了第100天健身打卡！分享一下我的减脂心得：坚持HIIT训练，配合合理饮食，成功减重15斤。没有什么比看到自己进步更开心的了！💪',
      images: [],
      stats: {
        likes: 234,
        comments: 45,
        shares: 12,
        isLiked: false,
      },
      time: '2小时前',
      tags: ['减脂', 'HIIT', '打卡'],
    },
    {
      id: 2,
      author: {
        name: '营养师Lisa',
        avatar: '🥗',
        level: 'LV.8',
        isFollowed: true,
      },
      content: '【健康食谱分享】今天为大家推荐一款低卡高蛋白的鸡胸肉沙拉：\n🥗 食材：鸡胸肉200g、混合生菜、小番茄、黄瓜\n🥚 蛋白质来源：鸡胸肉+水煮蛋\n🥑 健康脂肪：牛油果\n热量控制：350大卡\n\n欢迎大家一起分享健康饮食！',
      images: ['food1', 'food2'],
      stats: {
        likes: 567,
        comments: 89,
        shares: 34,
        isLiked: true,
      },
      time: '3小时前',
      tags: ['食谱', '营养', '减脂餐'],
    },
    {
      id: 3,
      author: {
        name: '瑜伽爱好者Amy',
        avatar: '🧘',
        level: 'LV.6',
        isFollowed: false,
      },
      content: '睡前15分钟瑜伽，帮助你放松身心，改善睡眠质量。这套动作特别适合久坐上班族，缓解肩颈酸痛。\n\n动作流程：\n1. 猫牛式 2分钟\n2. 下犬式 3分钟\n3. 婴儿式 2分钟\n4. 蝴蝶式 3分钟\n5. 尸式放松 5分钟\n\n大家一起坚持吧！🌙',
      images: ['yoga1'],
      stats: {
        likes: 189,
        comments: 67,
        shares: 23,
        isLiked: false,
      },
      time: '5小时前',
      tags: ['瑜伽', '睡前运动', '放松'],
    },
  ];

  // 热门话题
  const hotTopics = [
    { tag: '30天减脂挑战', posts: '2.3k', heat: '🔥' },
    { tag: '健康早餐推荐', posts: '1.8k', heat: '🔥' },
    { tag: '跑步打卡群', posts: '956', heat: '🔥' },
    { tag: '减肥心得', posts: '3.2k', heat: '🔥🔥' },
    { tag: '增肌食谱', posts: '1.5k', heat: '🔥' },
  ];

  // 推荐用户
  const recommendedUsers = [
    { name: '健身教练Jack', avatar: '💪', intro: '10年健身经验', followers: '5.2k' },
    { name: '营养师Dr.陈', avatar: '👨‍⚕️', intro: '临床营养学专家', followers: '8.7k' },
    { name: '跑步达人小李', avatar: '🏃', intro: '马拉松完赛者', followers: '3.1k' },
  ];

  const renderPost = ({ item }: { item: typeof communityPosts[0] }) => (
    <View style={styles.postCard}>
      {/* 用户信息 */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.author.avatar}</Text>
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{item.author.name}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.author.level}</Text>
              </View>
            </View>
            <Text style={styles.postTime}>{item.time}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.followButton,
            item.author.isFollowed && styles.followingButton
          ]}
        >
          <Text style={[
            styles.followButtonText,
            item.author.isFollowed && styles.followingButtonText
          ]}>
            {item.author.isFollowed ? '已关注' : '关注'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 帖子内容 */}
      <View style={styles.postContent}>
        <Text style={styles.postText}>{item.content}</Text>

        {/* 标签 */}
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* 图片占位（暂时用彩色块代替） */}
        {item.images.length > 0 && (
          <View style={styles.postImages}>
            {item.images.map((image, index) => (
              <View key={index} style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#D1D5DB" />
                <Text style={styles.imagePlaceholderText}>图片 {index + 1}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 互动按钮 */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name={item.stats.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={item.stats.isLiked ? '#EF4444' : '#6B7280'}
          />
          <Text style={[
            styles.actionText,
            item.stats.isLiked && styles.actionTextActive
          ]}>
            {item.stats.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>{item.stats.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>{item.stats.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* 话题标签 */}
        <View style={styles.tabsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            <View style={styles.tabsContainer}>
              {topicTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    selectedTab === tab.id && styles.activeTab
                  ]}
                  onPress={() => setSelectedTab(tab.id)}
                >
                  <Ionicons
                    name={tab.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={selectedTab === tab.id ? '#4ABAB8' : '#6B7280'}
                  />
                  <Text style={[
                    styles.tabText,
                    selectedTab === tab.id && styles.activeTabText
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 热门话题 */}
        <View style={styles.topicsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 热门话题</Text>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>更多</Text>
              <Ionicons name="chevron-forward" size={14} color="#4ABAB8" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
            <View style={styles.topicsContainer}>
              {hotTopics.map((topic, index) => (
                <TouchableOpacity key={index} style={styles.topicCard}>
                  <Text style={styles.topicHeat}>{topic.heat}</Text>
                  <Text style={styles.topicTag}>#{topic.tag}</Text>
                  <Text style={styles.topicPosts}>{topic.posts} 帖子</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 推荐用户 */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>推荐关注</Text>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>查看全部</Text>
              <Ionicons name="chevron-forward" size={14} color="#4ABAB8" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersScroll}>
            <View style={styles.usersContainer}>
              {recommendedUsers.map((user, index) => (
                <TouchableOpacity key={index} style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{user.avatar}</Text>
                  </View>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userIntro}>{user.intro}</Text>
                  <Text style={styles.userFollowers}>{user.followers} 粉丝</Text>

                  <TouchableOpacity style={styles.followUserButton}>
                    <Text style={styles.followUserButtonText}>+ 关注</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 社区帖子列表 */}
        <View style={styles.postsSection}>
          <FlatList
            data={communityPosts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
  tabsSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsScroll: {
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#4ABAB820',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4ABAB8',
    fontWeight: '600',
  },
  topicsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  topicsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  topicsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  topicHeat: {
    fontSize: 16,
    marginBottom: 4,
  },
  topicTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  topicPosts: {
    fontSize: 10,
    color: '#6B7280',
  },
  usersSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  usersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  usersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  userCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ABAB820',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatarText: {
    fontSize: 20,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  userIntro: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  userFollowers: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  followUserButton: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  followUserButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  postsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  authorInfo: {
    gap: 2,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  levelBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  followButton: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  followingButton: {
    backgroundColor: '#F3F4F6',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#6B7280',
  },
  postContent: {
    marginBottom: 16,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  postImages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePlaceholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionTextActive: {
    color: '#EF4444',
  },
});