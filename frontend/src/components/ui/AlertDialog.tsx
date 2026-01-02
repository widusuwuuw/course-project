import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface AlertDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AlertDialog({
  visible,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.95, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Dynamic styles based on theme
  const dynamicStyles = {
    card: {
      backgroundColor: colors.backgroundCard,
      shadowColor: colors.shadow,
    },
    title: {
      color: colors.text,
    },
    description: {
      color: colors.textSecondary,
    },
    cancelButton: {
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
    confirmButton: {
      backgroundColor: colors.error,
    },
    confirmButtonText: {
      color: colors.textWhite,
    },
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable onPress={onCancel} style={styles.backdrop}>
        <Animated.View
          style={animatedStyle}
          onStartShouldSetResponder={() => true} 
        >
          <View style={[styles.card, dynamicStyles.card]}>
            <Text style={[styles.title, dynamicStyles.title]}>
              {title}
            </Text>
            <Text style={[styles.description, dynamicStyles.description]}>
              {description}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, dynamicStyles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText, dynamicStyles.cancelButtonText]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, dynamicStyles.confirmButton]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText, dynamicStyles.confirmButtonText]}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderWidth: 2,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  confirmButton: {
    // styles defined in dynamicStyles
  },
  confirmButtonText: {
    // styles defined in dynamicStyles
  },
});
