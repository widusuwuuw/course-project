import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { registerRequest } from '@/api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 注册页面轮播图片 - 使用生成的高质量图片
const registerCarouselImages = [
  {
    id: 0,
    source: { uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/145439c2-9a79-4ded-a09f-1924874b21b5/22289326a03b705cf6918673513de4f1.webp?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763398365&Signature=eLodmdI4v+sFae4wTAMCryYHbX4=' },
    title: '专业健康管理',
    subtitle: '数字化医疗注册，开启智能健康生活'
  },
  {
    id: 1,
    source: { uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/145439c2-9a79-4ded-a09f-1924874b21b5/8edeed4b0a06e8719808aceecbf76b5b.webp?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763398365&Signature=OUTbsG746gFOygcausHF79i0YbA=' },
    title: '智能健康追踪',
    subtitle: '个性化健康数据记录与分析'
  },
  {
    id: 2,
    source: { uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/145439c2-9a79-4ded-a09f-1924874b21b5/5de2491fa6c734d236213e1a96b18751.webp?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763398365&Signature=88EKqXR2kzVDdB8Zl62DQES%2FAWI=' },
    title: '医疗级服务',
    subtitle: '专业医护人员为您保驾护航'
  },
  {
    id: 3,
    source: { uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/145439c2-9a79-4ded-a09f-1924874b21b5/4fc7195ed06ccce9482eb2dd5b81bcd4.webp?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763398365&Signature=VyDFfhDgs%2Fw%2FhodQTPiYy4gVd1I=' },
    title: '科学健康生活',
    subtitle: '基于数据的健康管理与建议'
  }
];

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  // 背景色动画逻辑 - 与登录页面相同，但使用不同的颜色方案
  useEffect(() => {
    const backgroundAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 16000, // 16秒完整循环
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
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // 切换图片
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % registerCarouselImages.length);
        // 淡入效果
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }).start();
      });
    }, 4000); // 每4秒切换一次图片

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const onRegister = async () => {
    setLoading(true);
    try {
      await registerRequest(email.trim(), password);
      Alert.alert('注册成功', '请使用刚刚的账号密码登录');
      navigation.replace('Login');
    } catch (e: any) {
      Alert.alert('注册失败', e?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 计算背景色 - 注册页面专属的绿色健康主题
  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    outputRange: [
      '#10B981', // 0-2秒: Emerald-500 - 对应专业健康管理
      '#10B981', // 2-4秒: Emerald-500 - 图片1显示期间
      '#3B82F6', // 4-6秒: Blue-500 - 对应智能健康追踪
      '#3B82F6', // 6-8秒: Blue-500 - 图片2显示期间
      '#8B5CF6', // 8-10秒: Violet-500 - 对应医疗级服务
      '#8B5CF6', // 10-12秒: Violet-500 - 图片3显示期间
      '#F59E0B', // 12-14秒: Amber-500 - 对应科学健康生活
      '#F59E0B', // 14-16秒: Amber-500 - 图片4显示期间
      '#10B981', // 16秒: 循环回到起点
    ],
  });

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* 左侧：注册表单 */}
        <View style={styles.leftPanel}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.logo}>✨</Text>
              <Text style={styles.title}>创建账号</Text>
              <Text style={styles.subtitle}>开启您的健康管理之旅</Text>
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
                  placeholder="请输入密码（至少6位）"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{loading ? '注册中...' : '注册'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerText}>已有账号？<Text style={styles.registerTextBold}>立即登录</Text></Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 右侧：图片轮播 */}
        <Animated.View style={[styles.rightPanel, { backgroundColor }]}>
          {/* 简化动态纹理背景层 */}
          <Animated.View style={[styles.textureLayer, { opacity: 0.3 }]}>
            {/* 装饰性几何图形 - 六边形 */}
            <Animated.View
              style={[
                styles.geoShape,
                {
                  position: 'absolute',
                  top: '10%',
                  right: '15%',
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  transform: [
                    { rotate: backgroundAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '120deg'] }) }
                  ]
                }
              ]}
            />

            {/* 装饰性几何图形 - 三角形模拟 */}
            <Animated.View
              style={[
                styles.geoShape,
                {
                  position: 'absolute',
                  bottom: '20%',
                  left: '8%',
                  width: 60,
                  height: 52,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  borderBottomLeftRadius: 2,
                  borderBottomRightRadius: 2,
                  transform: [
                    { rotate: backgroundAnim.interpolate({ inputRange: [0, 1], outputRange: ['60deg', '300deg'] }) }
                  ]
                }
              ]}
            />

            {/* 装饰性几何图形 - 正方形 */}
            <Animated.View
              style={[
                styles.geoShape,
                {
                  position: 'absolute',
                  top: '65%',
                  right: '25%',
                  width: 50,
                  height: 50,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.11)',
                  transform: [
                    { rotate: backgroundAnim.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '225deg'] }) }
                  ]
                }
              ]}
            />

            {/* 涟漪圆环 1 */}
            <Animated.View
              style={{
                position: 'absolute',
                top: '15%',
                left: '20%',
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 1.5,
                backgroundColor: 'transparent',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                transform: [
                  { scale: backgroundAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }
                ],
                opacity: backgroundAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0.3, 0] })
              }}
            />

            {/* 涟漪圆环 2 */}
            <Animated.View
              style={{
                position: 'absolute',
                bottom: '25%',
                right: '18%',
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 1.5,
                backgroundColor: 'transparent',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                transform: [
                  { scale: backgroundAnim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1.6] }) }
                ],
                opacity: backgroundAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.4, 0] })
              }}
            />

            {/* 流动线条 1 */}
            <Animated.View
              style={{
                position: 'absolute',
                top: '25%',
                left: '-10%',
                width: '120%',
                height: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                transform: [
                  { translateX: backgroundAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 50] }) }
                ],
                opacity: backgroundAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0.2] })
              }}
            />

            {/* 流动线条 2 */}
            <Animated.View
              style={{
                position: 'absolute',
                bottom: '30%',
                right: '-10%',
                width: '120%',
                height: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 1,
                transform: [
                  { translateX: backgroundAnim.interpolate({ inputRange: [0, 1], outputRange: [50, -50] }) }
                ],
                opacity: backgroundAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.5, 0.3] })
              }}
            />
          </Animated.View>

          <View style={styles.carouselContainer}>
            {/* 高质量轮播图片 */}
            <Animated.Image
              source={registerCarouselImages[currentImageIndex].source}
              style={[
                styles.carouselImage,
                {
                  opacity: fadeAnim,
                },
              ]}
              resizeMode="cover"
            />

            {/* 图片遮罩层和文字内容 */}
            <Animated.View style={[
              styles.carouselOverlay,
              {
                opacity: fadeAnim,
              },
            ]}>
              <Text style={styles.carouselTitle}>
                {registerCarouselImages[currentImageIndex].title}
              </Text>
              <Text style={styles.carouselSubtitle}>
                {registerCarouselImages[currentImageIndex].subtitle}
              </Text>

              {/* 轮播指示器 */}
              <View style={styles.indicatorsContainer}>
                {registerCarouselImages.map((_, index) => (
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

  // 左侧面板 - 注册表单
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
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
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
    color: '#10B981',
    fontWeight: '700',
  },

  // 右侧面板 - 图片轮播
  rightPanel: {
    flex: 1,
    backgroundColor: '#10B981', // 会被动态背景色覆盖
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
    borderRadius: 20,
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  carouselTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  carouselSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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

  // 简化纹理效果样式
  textureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // 在背景色之上，图片容器之下
    overflow: 'hidden',
  },
  geoShape: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
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
