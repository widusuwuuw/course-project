import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GradientBackground from '@/components/GradientBackground';

export default function TestBackgroundScreen() {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>🎨 渐变背景测试页面</Text>
        <Text style={styles.subtitle}>如果你能看到彩色背景，说明渐变背景工作正常</Text>

        <View style={styles.testBox}>
          <Text style={styles.testText}>这是一个半透明的测试框</Text>
          <Text style={styles.testText}>背景应该是彩色渐变</Text>
        </View>

        <View style={styles.colorList}>
          <Text style={styles.colorItem}>🔵 浅蓝色</Text>
          <Text style={styles.colorItem}>🟣 浅紫色</Text>
          <Text style={styles.colorItem}>🟡 浅黄色</Text>
          <Text style={styles.colorItem}>🟢 浅青色</Text>
          <Text style={styles.colorItem}>🔴 浅粉色</Text>
          <Text style={styles.colorItem}>🟢 浅绿色</Text>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  testBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 30,
    borderRadius: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  testText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  colorList: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 20,
    borderRadius: 15,
  },
  colorItem: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
});