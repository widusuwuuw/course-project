import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { getCommentsForPost, createComment } from '../../api/client';
import { RootStackParamList } from '../../../App';

// Types
interface User {
  id: number;
  email: string;
}
interface Comment {
  id: number;
  content: string;
  created_at: string;
  owner: User;
}

type CommentScreenRouteProp = RouteProp<RootStackParamList, 'Comments'>;

export default function CommentScreen({ navigation }) {
  const { colors } = useTheme();
  const route = useRoute<CommentScreenRouteProp>();
  const { postId } = route.params;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const fetchedComments = await getCommentsForPost(postId);
      setComments(fetchedComments);
    } catch (error) {
      Alert.alert('错误', '加载评论失败。');
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment(postId, newComment);
      setNewComment('');
      fetchComments(); // Refresh comments
    } catch (error) {
      Alert.alert('错误', '发表评论失败。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    // Improved time-ago logic with 8-hour offset compensation
    const getTimeAgo = (dateString: string) => {
      const commentDate = new Date(dateString);
      // Explicitly add 8 hours to compensate for the UTC+8 offset
      commentDate.setHours(commentDate.getHours() + 8); 

      const now = new Date();
      const diffSeconds = Math.round((now.getTime() - commentDate.getTime()) / 1000);
      const diffMinutes = Math.round(diffSeconds / 60);
      const diffHours = Math.round(diffMinutes / 60);

      if (diffSeconds < 60) {
        return '刚刚';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else {
        return commentDate.toLocaleDateString();
      }
    };
    const timeDisplay = getTimeAgo(item.created_at);

    return (
      <View style={styles.commentContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.owner.email.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.commentContent}>
          <Text style={styles.authorName}>{item.owner.email}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
          <Text style={styles.postTime}>{timeDisplay}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>评论</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无评论，快来抢沙发吧！</Text>}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="发表你的看法..."
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handlePostComment} disabled={isSubmitting}>
            <Ionicons name="send" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    list: { flex: 1 },
    commentContainer: { flexDirection: 'row', padding: 16 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, color: '#4ABAB8', fontWeight: '600' },
    commentContent: { flex: 1 },
    authorName: { fontWeight: '600', marginBottom: 4 },
    commentText: { lineHeight: 20, marginBottom: 4 },
    postTime: { fontSize: 12, color: '#9CA3AF' },
    separator: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 68 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
    inputContainer: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' },
    input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
    sendButton: { backgroundColor: '#4ABAB8', padding: 10, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});
