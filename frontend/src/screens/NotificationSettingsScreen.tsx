import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const [newLogAlerts, setNewLogAlerts] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [assistantUpdates, setAssistantUpdates] = useState(true);

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { backgroundColor: colors.backgroundSecondary },
    card: { backgroundColor: colors.backgroundCard },
    title: { color: colors.text },
    settingRow: { borderBottomColor: colors.border },
    settingText: { color: colors.text },
    descriptionText: { color: colors.textSecondary },
  };

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
            value={newLogAlerts}
            onValueChange={setNewLogAlerts}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={newLogAlerts ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={[styles.settingRow, dynamicStyles.settingRow]}>
          <View style={styles.textContainer}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>成就达成</Text>
            <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>当您解锁新成就时收到通知。</Text>
          </View>
          <Switch
            value={achievementAlerts}
            onValueChange={setAchievementAlerts}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={achievementAlerts ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={[styles.settingRow, dynamicStyles.settingRow]}>
          <View style={styles.textContainer}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>每周小结</Text>
            <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>每周接收一次您的健康趋势总结。</Text>
          </View>
          <Switch
            value={weeklySummary}
            onValueChange={setWeeklySummary}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={weeklySummary ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.textContainer}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>AI助手更新</Text>
            <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>当AI助手有新的建议时通知您。</Text>
          </View>
          <Switch
            value={assistantUpdates}
            onValueChange={setAssistantUpdates}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={assistantUpdates ? colors.primary : '#f4f3f4'}
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
