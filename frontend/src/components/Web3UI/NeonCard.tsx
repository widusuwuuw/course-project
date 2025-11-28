import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Heart, Brain, TrendingUp, Zap, Shield } from 'lucide-react-native';

interface NeonCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: 'activity' | 'heart' | 'brain' | 'trending' | 'zap' | 'shield';
  gradient: string[];
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onPress?: () => void;
  style?: ViewStyle;
}

const iconMap = {
  activity: Activity,
  heart: Heart,
  brain: Brain,
  trending: TrendingUp,
  zap: Zap,
  shield: Shield,
};

export const NeonCard: React.FC<NeonCardProps> = ({
  title,
  value,
  subtitle,
  icon = 'activity',
  gradient,
  trend,
  onPress,
  style,
}) => {
  const IconComponent = iconMap[icon];

  const CardContent = (
    <LinearGradient
      colors={gradient}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* 发光边框效果 */}
      <View style={styles.glowBorder} />

      {/* 内容区域 */}
      <View style={styles.content}>
        {/* 图标和标题 */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconComponent size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* 主要数值 */}
        <Text style={styles.value}>{value}</Text>

        {/* 副标题 */}
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}

        {/* 趋势指示器 */}
        {trend && (
          <View style={[
            styles.trendBadge,
            { backgroundColor: trend.isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
          ]}>
            <Text style={[
              styles.trendText,
              { color: trend.isPositive ? '#22C55E' : '#EF4444' }
            ]}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.container, style]}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {CardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    minHeight: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NeonCard;