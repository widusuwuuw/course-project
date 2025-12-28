import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator, // Import ActivityIndicator for loading state
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { createPost, uploadImage } from '../../api/client';
import * as ImagePicker from 'expo-image-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

const PRESET_TAGS = ['减脂', '增肌', '每日食谱', '健身打卡', '有氧运动', '力量训练', '康复理疗'];

export default function CreatePostScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]); // To store image URIs (URLs from backend)
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // State for image upload status

  // Request media library permissions on component mount
  useEffect(() => {
    (async () => {
      // Platform.OS !== 'web' check is important for Expo web, as permissions are different
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('权限不足', '需要相册权限才能上传图片。');
        }
      }
    })();
  }, []);

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('内容不能为空', '请输入您想要分享的想法。');
      return;
    }
    if (isSubmitting || uploadingImage) return; // Prevent multiple submissions or posting while uploading

    setIsSubmitting(true);
    try {
      await createPost(content, images, tags); // Call the actual API

      navigation.navigate('MainTabs', { screen: 'Community', params: { postCreated: true } });
    } catch (error) {
      Alert.alert('发布失败', `无法发布帖子：${error instanceof Error ? error.message : '未知错误'}`);
      console.error('Create Post Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddImage = async () => {
    if (images.length >= 5) {
      Alert.alert('图片已达上限', '最多只能添加5张图片。');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Allow user to crop/edit
      aspect: [4, 3],
      quality: 0.7, // Compress image quality
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      setUploadingImage(true);
      try {
        // Correctly get the file extension and type for FormData
        const fileExtension = selectedAsset.uri.split('.').pop();
        const mimeType = selectedAsset.type === 'image' ? `image/${fileExtension}` : selectedAsset.type;

        const uploadedImage = await uploadImage(selectedAsset.uri, mimeType);
        setImages([...images, uploadedImage.url]);
      } catch (error) {
        Alert.alert('上传失败', `无法上传图片：${error instanceof Error ? error.message : '未知错误'}`);
        console.error('Image Upload Error:', error);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close-outline" size={30} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>创建新帖子</Text>
          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: (isSubmitting || uploadingImage) ? '#A5D6A7' : '#4ABAB8' }]}
            onPress={handlePost}
            disabled={isSubmitting || uploadingImage}
          >
            {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.postButtonText}>发布</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="分享您的健康心得、目标或问题..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
          />

          {/* Image selection and preview */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScrollContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                  <Ionicons name="close-circle" size={24} color="#00000080" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage} disabled={uploadingImage}>
                {uploadingImage ? (
                    <ActivityIndicator size="small" color="#4ABAB8" />
                ) : (
                    <Ionicons name="camera-outline" size={32} color="#4ABAB8" />
                )}
                <Text style={styles.addImageText}>添加图片</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Tag selection */}
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>添加标签</Text>
            <View style={styles.selectedTagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => toggleTag(tag)}>
                     <Ionicons name="close-circle" size={16} color="#4ABAB8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetTagsContainer}>
              {PRESET_TAGS.filter(pt => !tags.includes(pt)).map((tag, index) => (
                <TouchableOpacity key={index} style={styles.presetTag} onPress={() => toggleTag(tag)}>
                  <Text style={styles.presetTagText}>+ {tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.customTagContainer}>
              <TextInput
                style={styles.customTagInput}
                placeholder="或创建自定义标签"
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={handleAddCustomTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={handleAddCustomTag}>
                <Text style={styles.addTagButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  textInput: {
    paddingTop: 16,
    fontSize: 18,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  imagePreviewScrollContainer: {
    marginTop: 16,
    height: 90, // Fixed height for scrollable image preview
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 10,
    color: '#4ABAB8',
    marginTop: 4,
  },
  imagePreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  tagsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ABAB820',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  selectedTagText: {
    color: '#4ABAB8',
    fontWeight: '600',
    marginRight: 6,
  },
  presetTagsContainer: {
    marginBottom: 12,
  },
  presetTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  presetTagText: {
    color: '#6B7280',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addTagButton: {
    marginLeft: 8,
    backgroundColor: '#4ABAB8',
    borderRadius: 8,
    padding: 10,
  },
  addTagButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});