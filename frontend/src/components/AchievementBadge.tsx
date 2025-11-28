import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface AchievementBadgeProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    isUnlocked: boolean;
    progress: number; // 0-100
    unlockedDate?: string;
  };
  size?: 'small' | 'medium' | 'large';
  onPress?: (badge: any) => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  badge,
  size = 'medium',
  onPress
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // 弹性动画效果
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.(badge);
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 60 },
          icon: { fontSize: 24 },
          name: { fontSize: 10 }, // Will be conditionally hidden
          description: {}, // Will be conditionally hidden
          progress: { height: 3 }
        };
      case 'large':
        return {
          container: { width: 120, height: 120 },
          icon: { fontSize: 48 },
          name: { fontSize: 14, fontWeight: '700' as const },
          description: { fontSize: 11 },
          progress: { height: 6 }
        };
      default: // medium
        return {
          container: { width: 80, height: 80 },
          icon: { fontSize: 32 },
          name: { fontSize: 12, fontWeight: '600' as const },
          description: { fontSize: 10 },
          progress: { height: 4 }
        };
    }
  };

  const sizeStyle = getSizeStyle();

  return (
    <TouchableOpacity
      style={[styles.container, sizeStyle.container]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={!badge.isUnlocked}
    >
      <Animated.View style={[
        styles.badgeContainer,
        {
          backgroundColor: badge.isUnlocked ? badge.color : '#F3F4F6',
          borderColor: badge.isUnlocked ? badge.color : '#E5E7EB',
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        {/* 徽章图标 */}
        <Text style={[
          styles.icon,
          sizeStyle.icon,
          { color: badge.isUnlocked ? '#FFFFFF' : '#9CA3AF' }
        ]}>
          {badge.isUnlocked ? badge.icon : '🔒'}
        </Text>

        {/* 进度环 */}
        {!badge.isUnlocked && size !== 'small' && (
          <View style={styles.progressRing}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${badge.progress}%`,
                  backgroundColor: badge.color,
                  height: sizeStyle.progress.height
                }
              ]}
            />
          </View>
        )}
      </Animated.View>

      {/* 徽章名称 */}
      {size !== 'small' && (
        <Text style={[
          styles.badgeName,
          sizeStyle.name,
          { color: badge.isUnlocked ? '#111827' : '#6B7280' }
        ]}>
          {badge.name}
        </Text>
      )}

      {/* 徽章描述 */}
      {size === 'large' && (
        <Text style={[
          styles.badgeDescription,
          sizeStyle.description,
          { color: '#6B7280' }
        ]}>
          {badge.description}
        </Text>
      )}

      {/* 解锁日期 */}
      {badge.isUnlocked && badge.unlockedDate && size === 'large' && (
        <Text style={styles.unlockedDate}>
          {badge.unlockedDate} 解锁
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 8,
  },
  badgeContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontWeight: 'bold',
  },
  progressRing: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 2,
  },
  badgeName: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  badgeDescription: {
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 12,
  },
  unlockedDate: {
    marginTop: 4,
    fontSize: 9,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AchievementBadge;