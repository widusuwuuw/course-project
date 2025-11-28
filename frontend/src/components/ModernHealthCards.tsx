import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface ModernHealthCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  gradient?: string[];
  onPress?: () => void;
}

export const ModernHealthCard: React.FC<ModernHealthCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  gradient = ['#6366F1', '#8B5CF6'],
  onPress
}) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{title}</Text>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
          </View>

          <Text style={styles.cardValue}>{value}</Text>

          {subtitle && (
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          )}

          {trend && (
            <View style={styles.trendContainer}>
              <Text style={[
                styles.trendText,
                { color: trend.isPositive ? '#10B981' : '#EF4444' }
              ]}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardOverlay} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  return (
    <View style={[styles.glassCard, style]}>
      <BlurView intensity={80} tint="dark" style={styles.glassBlur}>
        {children}
      </BlurView>
    </View>
  );
};

interface StatsGridProps {
  data: Array<{
    label: string;
    value: string;
    change?: string;
    isPositive?: boolean;
  }>;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ data }) => {
  return (
    <GlassCard style={styles.statsGrid}>
      {data.map((item, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
          {item.change && (
            <Text style={[
              styles.statChange,
              { color: item.isPositive ? '#10B981' : '#EF4444' }
            ]}>
              {item.isPositive ? '↑' : '↓'} {item.change}
            </Text>
          )}
        </View>
      ))}
    </GlassCard>
  );
};

interface ModernButtonProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  subtitle,
  onPress,
  variant = 'primary',
  icon
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.modernButton,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'ghost' && styles.ghostButton
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={variant === 'primary' ? ['#6366F1', '#8B5CF6'] : ['transparent']}
        style={[
          styles.buttonGradient,
          variant !== 'primary' && { borderWidth: 1, borderColor: '#334155' }
        ]}
      >
        <View style={styles.buttonContent}>
          <View style={styles.buttonTextContainer}>
            <Text style={[
              styles.buttonTitle,
              variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
            ]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[
                styles.buttonSubtitle,
                variant === 'primary' ? styles.primaryButtonSubtitle : styles.secondaryButtonSubtitle
              ]}>
                {subtitle}
              </Text>
            )}
          </View>
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Modern Health Card
  cardContainer: {
    width: (width - 48) / 2,
    height: 140,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    opacity: 0.9,
  },
  iconContainer: {
    opacity: 0.8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    opacity: 0.8,
    marginBottom: 8,
  },
  trendContainer: {
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 1,
  },

  // Glass Card
  glassCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  glassBlur: {
    padding: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modern Button
  modernButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonIcon: {
    marginLeft: 16,
  },
  primaryButton: {
    // Gradient handled by LinearGradient
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  primaryButtonSubtitle: {
    color: '#CBD5E1',
  },
  secondaryButtonText: {
    color: '#F1F5F9',
  },
  secondaryButtonSubtitle: {
    color: '#94A3B8',
  },
});

export default {
  ModernHealthCard,
  GlassCard,
  StatsGrid,
  ModernButton,
};