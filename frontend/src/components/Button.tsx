import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Button variants for healthcare app design
export type ButtonVariant =
  | 'primary'     // Main action (Keep green)
  | 'secondary'   // Secondary action (light blue)
  | 'outline'     // Outlined button
  | 'ghost'       // Transparent with text color
  | 'success'     // Success state
  | 'warning'     // Warning state
  | 'danger'      // Alert/delete action
  | 'link'        // Text-only button
  | 'gradient';   // Gradient background

export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  gradientColors,
  children,
  ...touchableProps
}) => {
  const buttonStyle = [
    styles.button,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const textStyle_ = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getTextColor(variant)}
          style={styles.spinner}
        />
      );
    }

    return (
      <>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        {title && <Text style={textStyle_}>{title}</Text>}
        {children}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </>
    );
  };

  // Gradient button
  if (variant === 'gradient' || (variant === 'primary' && !disabled)) {
    const colors = gradientColors || getGradientColors(variant);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled || loading}
        style={[
          buttonStyle,
          { backgroundColor: 'transparent' },
        ]}
        {...touchableProps}
      >
        <LinearGradient
          colors={disabled ? ['#E5E7EB', '#E5E7EB'] : colors}
          style={[StyleSheet.absoluteFillObject, styles.gradientBorder]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.gradientContent}>
          {renderContent()}
        </View>
      </TouchableOpacity>
    );
  }

  // Regular button
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={buttonStyle}
      {...touchableProps}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Helper functions
const getGradientColors = (variant: ButtonVariant): string[] => {
  switch (variant) {
    case 'primary':
    case 'gradient':
      return ['#10B981', '#059669']; // Keep green gradient
    default:
      return ['#6366F1', '#8B5CF6']; // Default purple gradient
  }
};

const getTextColor = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
    case 'gradient':
    case 'success':
    case 'danger':
    case 'link':
      return '#FFFFFF';
    case 'secondary':
    case 'outline':
    case 'ghost':
    case 'warning':
    default:
      return '#374151';
  }
};

const styles = StyleSheet.create({
  // Base button styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Size variants
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 8,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 12,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
    borderRadius: 16,
  },

  // Variant styles
  primary: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOpacity: 0.05,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  success: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  warning: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  danger: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  link: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    paddingVertical: 4,
    minHeight: 'auto',
  },
  gradient: {
    backgroundColor: 'transparent',
    shadowOpacity: 0.2,
  },

  // State styles
  disabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  loading: {
    opacity: 0.8,
  },

  // Layout styles
  fullWidth: {
    width: '100%',
  },
  gradientBorder: {
    borderRadius: 12,
  },
  gradientContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
    zIndex: 1,
  },

  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mediumText: {
    fontSize: 16,
    fontWeight: '600',
  },
  largeText: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Text colors
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: '#374151' },
  outlineText: { color: '#10B981' },
  ghostText: { color: '#10B981' },
  successText: { color: '#FFFFFF' },
  warningText: { color: '#FFFFFF' },
  dangerText: { color: '#FFFFFF' },
  linkText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  gradientText: { color: '#FFFFFF' },
  disabledText: { color: '#9CA3AF' },

  // Icon styles
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  spinner: {
    marginHorizontal: 8,
  },

  // Platform specific
  ...Platform.select({
    web: {
      button: {
        cursor: 'pointer',
      },
    },
  }),
});

export default Button;