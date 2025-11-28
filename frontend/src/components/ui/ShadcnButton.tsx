import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  activeOpacity?: number;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  style,
  textStyle,
  className = '',
  activeOpacity = 0.7
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: { [key: string]: ViewStyle } = {
      default: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 40,
      },
      sm: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 32,
      },
      lg: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 48,
      },
      icon: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        minHeight: 40,
        minWidth: 40,
      },
    };

    // Variant styles
    const variantStyles: { [key: string]: ViewStyle } = {
      default: {
        backgroundColor: '#6366F1',
      },
      destructive: {
        backgroundColor: '#EF4444',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E2E8F0',
      },
      secondary: {
        backgroundColor: '#F1F5F9',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      link: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingVertical: 0,
        minHeight: 'auto',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '500',
    };

    const sizeStyles: { [key: string]: TextStyle } = {
      default: {
        fontSize: 14,
      },
      sm: {
        fontSize: 12,
      },
      lg: {
        fontSize: 16,
      },
      icon: {
        fontSize: 16,
      },
    };

    const variantStyles: { [key: string]: TextStyle } = {
      default: {
        color: '#FFFFFF',
      },
      destructive: {
        color: '#FFFFFF',
      },
      outline: {
        color: '#F1F5F9',
      },
      secondary: {
        color: '#0F172A',
      },
      ghost: {
        color: '#F1F5F9',
      },
      link: {
        color: '#6366F1',
        textDecorationLine: 'underline',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
    >
      <Text style={[getTextStyle(), textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  gradientColors?: string[];
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onPress,
  size = 'default',
  disabled = false,
  style,
  textStyle,
  gradientColors = ['#6366F1', '#8B5CF6'],
  activeOpacity = 0.8
}) => {
  const getSizeStyle = (): ViewStyle => {
    const sizeStyles: { [key: string]: ViewStyle } = {
      default: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 40,
      },
      sm: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 32,
      },
      lg: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 48,
      },
      icon: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        minHeight: 40,
        minWidth: 40,
      },
    };

    return {
      borderRadius: 8,
      ...sizeStyles[size],
      opacity: disabled ? 0.5 : 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: { [key: string]: TextStyle } = {
      default: {
        fontSize: 14,
      },
      sm: {
        fontSize: 12,
      },
      lg: {
        fontSize: 16,
      },
      icon: {
        fontSize: 16,
      },
    };

    return {
      fontWeight: '600',
      color: '#FFFFFF',
      ...sizeStyles[size],
    };
  };

  return (
    <TouchableOpacity
      style={[getSizeStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <Text style={[getTextStyle(), textStyle]}>
          {children}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default {
  Button,
  GradientButton,
};