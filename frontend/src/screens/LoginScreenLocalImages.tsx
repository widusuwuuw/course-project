import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { loginRequest } from '@/api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 本地图片版本 - 如果外部链接失效时使用
const loginCarouselImages = [
  {
    url: require('@/assets/images/health-monitoring.jpg'),
    title: '智能健康监测',
    subtitle: '全面掌握您的健康数据趋势'
  },
  {
    url: require('@/assets/images/fitness-tracking.jpg'),
    title: '科学运动追踪',
    subtitle: '个性化健身计划与数据分析'
  },
  {
    url: require('@/assets/images/nutrition-management.jpg'),
    title: '精准营养管理',
    subtitle: '科学饮食搭配，健康生活每一天'
  },
  {
    url: require('@/assets/images/meditation-wellness.jpg'),
    title: '身心平衡管理',
    subtitle: '冥想放松，提升生活品质'
  }
];

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreenWithLocalImages({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  // 背景色动画逻辑 - 与图片轮播完全同步
  useEffect(() => {
    const backgroundAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 16000, // 16秒完整循环，与4张图片的节奏一致
          useNativeDriver: false,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 16000,
          useNativeDriver: false,
        }),
      ])
    );
    backgroundAnimation.start();

    return () => backgroundAnimation.stop();
  }, []);

  // 图片轮播逻辑
  useEffect(() => {
    const interval = setInterval(() => {
      // 淡出效果
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800, // 淡出时间
        useNativeDriver: true,
      }).start(() => {
        // 切换图片
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % loginCarouselImages.length);
        // 淡入效果
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200, // 淡入时间
          useNativeDriver: true,
        }).start();
      });
    }, 4000); // 每4秒切换一次图片，与背景色节点对齐

    return () => clearInterval(interval);
  }, [fadeAnim]);

  // 计算背景色 - 与图片轮播完美同步的8种颜色
  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    outputRange: [
      '#0EA5E9', // 0-2秒: Sky-500 - 对应智能健康监测
      '#0EA5E9', // 2-4秒: Sky-500 - 图片1显示期间
      '#22C55E', // 4-6秒: Green-500 - 对应科学运动追踪
      '#22C55E', // 6-8秒: Green-500 - 图片2显示期间
      '#8B5CF6', // 8-10秒: Violet-500 - 对应精准营养管理
      '#8B5CF6', // 10-12秒: Violet-500 - 图片3显示期间
      '#F59E0B', // 12-14秒: Amber-500 - 对应身心平衡管理
      '#F59E0B', // 14-16秒: Amber-500 - 图片4显示期间
      '#0EA5E9', // 16秒: 循环回到起点
    ],
  });

  const onLogin = async () => {
    setLoading(true);
    try {
      const data = await loginRequest(email.trim(), password);
      await AsyncStorage.setItem('token', data.access_token);
      navigation.replace('Dashboard');
    } catch (e: any) {
      Alert.alert('登录失败', e?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* 左侧：登录表单 */}
        <View style={styles.leftPanel}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.logo}>💙</Text>
              <Text style={styles.title}>Omnihealth</Text>
              <Text style={styles.subtitle}>您的智能健康助手</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>邮箱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入邮箱"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入密码"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{loading ? '登录中...' : '登录'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerText}>还没有账号？<Text style={styles.registerTextBold}>立即注册</Text></Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 右侧：图片轮播 */}
        <Animated.View style={[styles.rightPanel, { backgroundColor }]}>
          <View style={styles.carouselContainer}>
            <Animated.Image
              source={loginCarouselImages[currentImageIndex].url}
              style={[
                styles.carouselImage,
                {
                  opacity: fadeAnim,
                },
              ]}
            />
            <Animated.View style={[
              styles.carouselOverlay,
              {
                opacity: fadeAnim,
              },
            ]}>
              <Text style={styles.carouselTitle}>
                {loginCarouselImages[currentImageIndex].title}
              </Text>
              <Text style={styles.carouselSubtitle}>
                {loginCarouselImages[currentImageIndex].subtitle}
              </Text>

              {/* 轮播指示器 */}
              <View style={styles.indicatorsContainer}>
                {loginCarouselImages.map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.indicatorActive,
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// 样式与原版本完全相同
const styles = StyleSheet.create({
  // 主容器
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },

  // 左侧面板 - 登录表单
  leftPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 40,
    ...Platform.select({
      web: {
        maxWidth: 600,
      },
    }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerTextBold: {
    color: '#6366F1',
    fontWeight: '700',
  },

  // 右侧面板 - 图片轮播
  rightPanel: {
    flex: 1,
    backgroundColor: '#0F766E', // 会被动态背景色覆盖
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
    overflow: 'hidden',
  },
  carouselContainer: {
    width: '100%',
    maxWidth: 500,
    height: '80%',
    maxHeight: 600,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1, // 确保在渐变层之上
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  carouselTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  carouselSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // 轮播指示器
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },

  // 移动端适配
  ...Platform.select({
    android: {
      leftPanel: {
        paddingHorizontal: 24,
        paddingVertical: 20,
      },
      rightPanel: {
        display: 'none', // 在小屏幕设备上隐藏右侧面板
      },
    },
    ios: {
      leftPanel: {
        paddingHorizontal: 24,
        paddingVertical: 20,
      },
      rightPanel: {
        display: 'none', // 在小屏幕设备上隐藏右侧面板
      },
    },
    web: {
      // Web端显示完整布局
    },
  }),
});