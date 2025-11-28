import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Web3ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'neon' | 'glass';
  color?: string[];
  showLabel?: boolean;
  label?: string;
}

export const Web3Progress: React.FC<Web3ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  color = ['#8B5CF6', '#6366F1'],
  showLabel = false,
  label,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: (value / max) * 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [value, max]);

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return { height: 6, borderRadius: 3 };
      case 'lg':
        return { height: 16, borderRadius: 8 };
      default:
        return { height: 10, borderRadius: 5 };
    }
  };

  const { height, borderRadius } = getSizeConfig();

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  if (variant === 'neon') {
    return (
      <View style={[styles.container]}>
        {showLabel && (
          <View style={styles.labelContainer}>
            <Animated.Text style={[styles.label, { marginRight: 8 }]}>
              {label || `${Math.round((value / max) * 100)}%`}
            </Animated.Text>
          </View>
        )}
        <View style={[styles.neonTrack, { height, borderRadius }]}>
          <Animated.View
            style={[
              styles.neonProgress,
              {
                width: progressWidth,
                height,
                borderRadius,
                shadowColor: color[0],
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
          >
            <LinearGradient
              colors={color}
              style={{ flex: 1, borderRadius }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  if (variant === 'glass') {
    return (
      <View style={[styles.container]}>
        {showLabel && (
          <View style={styles.labelContainer}>
            <Animated.Text style={[styles.label]}>
              {label || `${Math.round((value / max) * 100)}%`}
            </Animated.Text>
          </View>
        )}
        <View style={[
          styles.glassTrack,
          { height, borderRadius }
        ]}>
          <Animated.View
            style={[
              styles.glassProgress,
              {
                width: progressWidth,
                height,
                borderRadius,
              },
            ]}
          >
            <LinearGradient
              colors={color}
              style={{ flex: 1, borderRadius }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Animated.Text style={[styles.label]}>
            {label || `${Math.round((value / max) * 100)}%`}
          </Animated.Text>
        </View>
      )}
      <View style={[styles.defaultTrack, { height, borderRadius }]}>
        <Animated.View
          style={[
            styles.defaultProgress,
            {
              width: progressWidth,
              height,
              borderRadius,
            },
          ]}
        >
          <LinearGradient
            colors={color}
            style={{ flex: 1, borderRadius }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Default variant
  defaultTrack: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  defaultProgress: {
    overflow: 'hidden',
  },

  // Neon variant
  neonTrack: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    overflow: 'hidden',
  },
  neonProgress: {
    overflow: 'hidden',
  },

  // Glass variant
  glassTrack: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  glassProgress: {
    overflow: 'hidden',
  },
});

export default Web3Progress;