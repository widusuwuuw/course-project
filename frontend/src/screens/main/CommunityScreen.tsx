import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../../App';
import { getPosts, likePost, getCurrentUser } from '../../api/client';
import type { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window'); // Dimensions is used here

// Corrected Types based on new backend schemas
interface User {
  id: number;
  email: string;
}
interface Tag {
  id: number;
  name: string;
}
interface Comment {
  id: number;
  content: string;
  owner: User;
}
interface Post {
  id: number;
  content: string;
  created_at: string;
  owner: User;
  image_urls: string[];
  tags: Tag[];
  comments_count: number;
  likes_count: number;
  is_liked: boolean;
}

type CommunityScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

type CommunityScreenRouteProp = RouteProp<MainTabParamList, 'Community'>;

export default function CommunityScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<CommunityScreenNavigationProp>();
  const route = useRoute<CommunityScreenRouteProp>();

  const [selectedTab, setSelectedTab] = useState<'latest' | 'hot'>('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const topicTabs = [
    { id: 'latest', label: '最新', icon: 'time-outline' as const },
    { id: 'hot', label: '热门', icon: 'flame-outline' as const },
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
          <Ionicons name="add-circle-outline" size={28} color={'#4ABAB8'} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchCommunityData = useCallback(async (sortBy: 'latest' | 'hot') => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const fetchedPosts = await getPosts(sortBy);
      setPosts(fetchedPosts);
    } catch (error) {
      Alert.alert('错误', '加载帖子失败，请检查网络或后端服务。');
      console.error(error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCommunityData(selectedTab);
      if (route.params?.postCreated) {
        navigation.setParams({ postCreated: undefined });
      }
    }, [fetchCommunityData, route.params?.postCreated, navigation, selectedTab])
  );
  
  const handleTabPress = (tabId: 'latest' | 'hot') => {
    setSelectedTab(tabId);
  }

  const handleLike = async (postId: number) => {
    try {
      await likePost(postId);
      fetchCommunityData(selectedTab); 
    } catch (error) {
      Alert.alert('错误', '点赞操作失败。');
      console.error(error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    // Improved time-ago logic with 8-hour offset compensation
    const getTimeAgo = (dateString: string) => {
      const postDate = new Date(dateString);
      // Explicitly add 8 hours to compensate for the UTC+8 offset,
      // assuming the string is parsed as local time by JS when it should be UTC.
      postDate.setHours(postDate.getHours() + 8); 

      const now = new Date();
      const diffSeconds = Math.round((now.getTime() - postDate.getTime()) / 1000);
      const diffMinutes = Math.round(diffSeconds / 60);
      const diffHours = Math.round(diffMinutes / 60);

      if (diffSeconds < 60) {
        return '刚刚';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else {
        return postDate.toLocaleDateString();
      }
    };
    const timeDisplay = getTimeAgo(item.created_at);

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.owner.email.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.owner.email}</Text>
              <Text style={styles.postTime}>{timeDisplay}</Text>
            </View>
          </View>
        </View>

        <View style={styles.postContent}>
          <Text style={styles.postText}>{item.content}</Text>
          {item.image_urls && item.image_urls.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postImagesContainer}>
              {item.image_urls.map((uri, index) => {
                console.log('Rendering Image URI:', uri); // Add this line for debugging
                return (
                  <Image key={index} source={{ uri }} style={styles.postImage} />
                );
              })}
            </ScrollView>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag) => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
            <Ionicons name={item.is_liked ? 'heart' : 'heart-outline'} size={20} color={item.is_liked ? '#EF4444' : '#6B7280'} />
            <Text style={[styles.actionText, item.is_liked && styles.actionTextActive]}>{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Comments', { postId: item.id })}>
            <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
            <Text style={styles.actionText}>{item.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
        <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListHeaderComponent={
                <View style={styles.tabsSection}>
                    <View style={styles.tabsContainer}>
                        {topicTabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
                            onPress={() => handleTabPress(tab.id)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={16}
                                color={selectedTab === tab.id ? '#4ABAB8' : '#6B7280'}
                            />
                            <Text style={[styles.tabText, selectedTab === tab.id && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                        ))}
                    </View>
                </View>
            }
            ListEmptyComponent={() => (
              <Text style={styles.emptyListText}>暂无帖子，快发布你的第一条吧！</Text>
            )}
            style={styles.listContainer}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { flex: 1 },
  tabsSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 8 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F9FAFB', gap: 6 },
  activeTab: { backgroundColor: '#4ABAB820' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#4ABAB8', fontWeight: '600' },
  postCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, color: '#4ABAB8', fontWeight: '600' },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  postTime: { fontSize: 12, color: '#9CA3AF' },
  postContent: { marginBottom: 16 },
  postText: { fontSize: 14, lineHeight: 20, color: '#374151', marginBottom: 12 },
  postImagesContainer: { flexDirection: 'row', marginBottom: 12 },
  postImage: { width: 100, height: 100, borderRadius: 8, marginRight: 8, resizeMode: 'cover' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 12, color: '#6B7280' },
  postActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: '#6B7280' },
  actionTextActive: { color: '#EF4444' },
  emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6B7280' },
});
