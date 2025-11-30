import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AccountSettingsScreen() {
  const { colors } = useTheme();

  const dynamicStyles = {
    container: { backgroundColor: colors.backgroundSecondary },
    card: { backgroundColor: colors.backgroundCard },
    title: { color: colors.text },
    settingRow: { borderBottomColor: colors.border },
    settingText: { color: colors.text },
    deleteText: { color: colors.error },
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>账户与安全</Text>
      </View>

      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow]}>
          <Text style={[styles.settingText, dynamicStyles.settingText]}>修改密码</Text>
          <Ionicons name="chevron-forward-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow]}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>关联账户</Text>
            <Ionicons name="chevron-forward-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.settingText, dynamicStyles.deleteText]}>删除账户</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteText: {
    fontWeight: '600',
  }
});
