import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';

/**
 * 登录界面四色流动渐变背景+水波纹理效果(Web兼容版):
 * - 基于登录界面的四种主题色: Sky-500, Green-500, Violet-500, Amber-500
 * - 使用中等透明度(25-35%)营造可见的渐变效果
 * - 添加水波流动纹理和条纹效果
 * - 16秒缓慢流动切换，与登录界面的完整循环周期保持一致
 */
const PALE_GRADIENTS = [
  `radial-gradient(ellipse at 20% 30%, rgba(14, 165, 233, 0.35) 0%, transparent 50%),
   linear-gradient(45deg, rgba(14, 165, 233, 0.25) 0%, rgba(34, 197, 94, 0.3) 100%),
   repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(14, 165, 233, 0.05) 10px, rgba(14, 165, 233, 0.05) 20px)`,

  `radial-gradient(ellipse at 80% 70%, rgba(34, 197, 94, 0.35) 0%, transparent 50%),
   linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(139, 92, 246, 0.3) 100%),
   repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(34, 197, 94, 0.05) 15px, rgba(34, 197, 94, 0.05) 30px)`,

  `radial-gradient(ellipse at 30% 80%, rgba(139, 92, 246, 0.35) 0%, transparent 50%),
   linear-gradient(225deg, rgba(139, 92, 246, 0.25) 0%, rgba(245, 158, 11, 0.3) 100%),
   repeating-linear-gradient(60deg, transparent, transparent 12px, rgba(139, 92, 246, 0.05) 12px, rgba(139, 92, 246, 0.05) 24px)`,

  `radial-gradient(ellipse at 70% 20%, rgba(245, 158, 11, 0.35) 0%, transparent 50%),
   linear-gradient(315deg, rgba(245, 158, 11, 0.25) 0%, rgba(14, 165, 233, 0.3) 100%),
   repeating-linear-gradient(120deg, transparent, transparent 18px, rgba(245, 158, 11, 0.05) 18px, rgba(245, 158, 11, 0.05) 36px)`,

  `linear-gradient(135deg, rgba(14, 165, 233, 0.28) 0%, rgba(34, 197, 94, 0.28) 50%, rgba(139, 92, 246, 0.28) 100%),
   repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(14, 165, 233, 0.08) 30deg, transparent 60deg)`,

  `linear-gradient(45deg, rgba(34, 197, 94, 0.28) 0%, rgba(139, 92, 246, 0.28) 50%, rgba(245, 158, 11, 0.28) 100%),
   repeating-conic-gradient(from 120deg at 50% 50%, transparent 0deg, rgba(34, 197, 94, 0.08) 40deg, transparent 80deg)`,
];

// 对应中等透明度纯色用于原生端 - 基于登录界面四色
const PALE_COLORS = [
  'rgba(14, 165, 233, 0.25)', // Sky-500中等透明度
  'rgba(34, 197, 94, 0.25)', // Green-500中等透明度
  'rgba(139, 92, 246, 0.25)', // Violet-500中等透明度
  'rgba(245, 158, 11, 0.25)', // Amber-500中等透明度
  'rgba(14, 165, 233, 0.22)', // Sky-500稍淡
  'rgba(34, 197, 94, 0.22)', // Green-500稍淡
];

interface Props {
  children: React.ReactNode;
}

export const GradientBackground: React.FC<Props> = ({ children }: Props) => {
  const [index, setIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 移除调试信息以减少控制台噪音

  useEffect(() => {
    const cycle = () => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 16000, // 16秒循环，与登录界面保持一致
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false, // Web需要false
      }).start(() => {
        setIndex((prev) => (prev + 1) % PALE_GRADIENTS.length);
        setNextIndex((prev) => (prev + 1) % PALE_GRADIENTS.length);
        cycle();
      });
    };
    cycle();
    
    // 清理函数
    return () => {
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim]);

  if (Platform.OS === 'web') {
    // Web端使用双图层动画实现平滑过渡
    return (
      <View style={styles.container}>
        {/* 当前背景层 - 淡出 */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -2,
              // @ts-ignore - Web特有属性
              backgroundImage: PALE_GRADIENTS[index],
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }
          ]}
        />
        {/* 下一个背景层 - 淡入 */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -2,
              // @ts-ignore - Web特有属性
              backgroundImage: PALE_GRADIENTS[nextIndex],
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              opacity: fadeAnim,
            }
          ]}
        />
        {/* 内容层 */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  // 原生端使用纯色过渡 + 水波纹理效果
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: PALE_COLORS[index],
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }
        ]}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: PALE_COLORS[nextIndex],
            opacity: fadeAnim,
          }
        ]}
      />

      {/* 水波纹理层 - 原生端使用多个半透明圆圈模拟 */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.waveTextureLayer]}>
        <View style={[styles.waveCircle, { top: '10%', left: '15%', backgroundColor: 'rgba(14, 165, 233, 0.1)' }]} />
        <View style={[styles.waveCircle, { top: '60%', left: '70%', backgroundColor: 'rgba(34, 197, 94, 0.1)' }]} />
        <View style={[styles.waveCircle, { top: '30%', left: '80%', backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
        <View style={[styles.waveCircle, { top: '80%', left: '25%', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} />

        {/* 水波条纹效果 */}
        <View style={[styles.waveStripe, { top: '20%', transform: [{ rotate: '15deg' }] }]} />
        <View style={[styles.waveStripe, { top: '50%', transform: [{ rotate: '-10deg' }] }]} />
        <View style={[styles.waveStripe, { top: '70%', transform: [{ rotate: '25deg' }] }]} />
      </Animated.View>

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1, // 确保内容在背景之上
  },
  // 原生端水波纹理效果
  waveTextureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // 在背景层之上，内容层之下
    opacity: 0.6,
  },
  waveCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  waveStripe: {
    position: 'absolute',
    left: -50,
    right: -50,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
  },
});

export default GradientBackground;
