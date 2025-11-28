import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Web3BackgroundSimpleProps {
  children: React.ReactNode;
}

export const Web3BackgroundSimple: React.FC<Web3BackgroundSimpleProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* 静态渐变背景 */}
      <LinearGradient
        colors={['#0A0B0D', '#1A1D23', '#0F172A']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* 装饰性渐变球体 */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      {/* 网格线 */}
      <View style={styles.gridOverlay}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              {
                position: 'absolute',
                top: i * 50,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.03)',
              },
            ]}
          />
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              {
                position: 'absolute',
                left: i * 50,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: 'rgba(255,255,255,0.03)',
              },
            ]}
          />
        ))}
      </View>

      {/* 内容 */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 100,
  },
  orb1: {
    top: '20%',
    left: '10%',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  orb2: {
    top: '60%',
    right: '15%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  orb3: {
    bottom: '30%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    opacity: 0.3,
  },
});

export default Web3BackgroundSimple;