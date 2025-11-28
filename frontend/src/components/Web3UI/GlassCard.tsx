import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  gradient?: string[];
  border?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 80,
  gradient = ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
  border = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      {gradient && (
        <LinearGradient
          colors={gradient}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <BlurView
        intensity={intensity}
        style={styles.blur}
        tint="dark"
      >
        <View style={[
          styles.content,
          border && styles.border
        ]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blur: {
    borderRadius: 20,
  },
  content: {
    padding: 24,
    minHeight: 120,
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});

export default GlassCard;