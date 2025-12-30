import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiGet, apiPut } from '@/api/client';
import { useFocusEffect } from '@react-navigation/native';

// Define a type for the settings state
type NotificationSettings = {
  new_log_alerts: boolean;
  achievement_alerts: boolean;
  weekly_summary: boolean;
  assistant_updates: boolean;
};

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await apiGet('/me');
      setSettings({
        new_log_alerts: userData.new_log_alerts,
        achievement_alerts: userData.achievement_alerts,
        weekly_summary: userData.weekly_summary,
        assistant_updates: userData.assistant_updates,
      });
    } catch (error) {
      Alert.alert('错误', '无法加载设置');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleValueChange = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    // Optimistically update UI
    const originalSettings = { ...settings };
    setSettings(prev => prev ? { ...prev, [key]: value } : null);

    try {
      await apiPut('/me/settings', { [key]: value });
    } catch (error) {
      // Revert UI on failure
      setSettings(originalSettings);
      Alert.alert('错误', '无法更新设置');
    }
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { backgroundColor: colors.backgroundSecondary },
    card: { backgroundColor: colors.backgroundCard },
    title: { color: colors.text },
    settingRow: { borderBottomColor: colors.border },
    settingText: { color: colors.text },
    descriptionText: { color: colors.textSecondary },
  };
  
  if (loading || !settings) {
    return (
      <View style={[styles.container, dynamicStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>通知设置</Text>
      </View>

      <View style={[styles.card, dynamicStyles.card]}>
        <View style={[styles.settingRow, dynamicStyles.settingRow]}>
          <View style={styles.textContainer}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>新记录提醒</Text>
            <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>当添加新健康日志时接收确认。</Text>
          </View>
          <Switch
            value={settings.new_log_alerts}
            onValueChange={(value) => handleValueChange('new_log_alerts', value)}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={settings.new_log_alerts ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={[styles.settingRow, dynamicStyles.settingRow]}>
          <View style={styles.textContainer}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>成就达成</Text>
            <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>当您解锁新成就时收到通知。</Text>
          </View>
          <Switch
            value={settings.achievement_alerts}
            onValueChange={(value) => handleValueChange('achievement_alerts', value)}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={settings.achievement_alerts ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={[styles.settingRow, dynamicStyles.settingRow]}>
          <View style={styles.textContainer}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>每周小结</Text>
            <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>每周接收一次您的健康趋势总结。</Text>
          </View>
          <Switch
            value={settings.weekly_summary}
            onValueChange={(value) => handleValueChange('weekly_summary', value)}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={settings.weekly_summary ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.textContainer}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>AI助手更新</Text>
            <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>当AI助手有新的建议时通知您。</Text>
          </View>
          <Switch
            value={settings.assistant_updates}
            onValueChange={(value) => handleValueChange('assistant_updates', value)}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={settings.assistant_updates ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 4,
  },
});
