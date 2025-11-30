import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

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

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none" // We handle animation ourselves
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable onPress={onCancel} style={styles.backdrop}>
        <Animated.View
          style={animatedStyle}
          // Prevents the backdrop press from closing the modal when pressing on the card
          onStartShouldSetResponder={() => true} 
        >
          <View
            className="w-11/12 max-w-sm rounded-xl p-6 shadow-xl"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>
              {title}
            </Text>
            <Text className="text-sm leading-5 mb-6" style={{ color: colors.textSecondary }}>
              {description}
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-4 py-2.5 rounded-lg active:opacity-80"
                style={{ backgroundColor: colors.backgroundSecondary }}
                onPress={onCancel}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2.5 rounded-lg active:opacity-80"
                style={{ backgroundColor: colors.error }}
                onPress={onConfirm}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.textWhite }}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
