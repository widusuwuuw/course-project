import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiGet, apiPost } from '@/api/client';
import GradientBackground from '@/components/GradientBackground';
import { RootStackParamList } from 'App';
import { Ionicons } from '@expo/vector-icons';

type Log = {
  id: number;
  metric_type: string;
  value1: number;
  unit: string;
  logged_at?: string;
};

type HealthLogsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HealthLogs'>;
type HealthLogsScreenRouteProp = RouteProp<RootStackParamList, 'HealthLogs'>;

const metricConfigMap: { [key: string]: { title: string; placeholder: string; unit: string; icon: string } } = {
  weight: { title: '体重日志', placeholder: '输入体重', unit: 'kg', icon: 'scale-outline' },
  heartRate: { title: '心率日志', placeholder: '输入心率', unit: 'bpm', icon: 'heart-outline' },
  steps: { title: '步数日志', placeholder: '输入步数', unit: '步', icon: 'walk-outline' },
  sleep: { title: '睡眠日志', placeholder: '输入睡眠时长', unit: '小时', icon: 'moon-outline' },
  water: { title: '饮水日志', placeholder: '输入饮水量', unit: '杯', icon: 'water-outline' },
};

export default function HealthLogsScreen() {
  const [items, setItems] = useState<Log[]>([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<HealthLogsScreenNavigationProp>();
  const route = useRoute<HealthLogsScreenRouteProp>();
  const { metric } = route.params || { metric: 'weight' };

  const currentMetricConfig = metricConfigMap[metric || 'weight'];


  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/health-logs/?metric_type=${metric}`);
      setItems(data);
    } catch (e: any) {
      Alert.alert('加载失败', e?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    const v = Number(value);
    if (!v || v <= 0) {
      Alert.alert('提示', `请输入有效的${currentMetricConfig.title.replace('日志', '')}`);
      return;
    }
    setLoading(true);
    try {
      await apiPost('/health-logs/', { 
        metric_type: metric, 
        value1: v, 
        unit: currentMetricConfig.unit 
      });
      setValue('');
      await load();
    } catch (e: any) {
      Alert.alert('提交失败', e?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [metric]); // 当metric变化时重新加载数据

  return (
    <GradientBackground>
      <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{currentMetricConfig.title}</Text>
          <Text style={styles.subtitle}>记录您的{currentMetricConfig.title.replace('日志', '')}变化</Text>
        </View>
        <View style={styles.headerActions}>
            <Text style={styles.countBadge}>{items.length} 条</Text>
            {metric === 'weight' && ( // 只有体重日志才显示查看趋势按钮
              <TouchableOpacity style={styles.trendsButton} onPress={() => navigation.navigate('Trends')}>
                  <Text style={styles.trendsButtonText}>查看趋势</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>添加新记录</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`${currentMetricConfig.placeholder} (${currentMetricConfig.unit})`}
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={setValue}
          />
          <TouchableOpacity 
            style={[styles.addButton, loading && styles.addButtonDisabled]} 
            onPress={add} 
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>{loading ? '...' : '添加'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name={currentMetricConfig.icon as any} size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardValue}>{item.value1} <Text style={styles.cardUnit}>{item.unit}</Text></Text>
              <Text style={styles.cardDate}>{new Date(item.logged_at || '').toLocaleString('zh-CN', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>暂无记录</Text>
            <Text style={styles.emptySubtext}>添加第一条{currentMetricConfig.title.replace('日志', '')}记录吧</Text>
          </View>
        }
      />
    </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  // 半透明允许渐变背景显示
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(249,250,251,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  countBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendsButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconText: { // 样式已从 HealthLogsScreen.tsx 中移除，因为我们使用 Ionicons
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardValue: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#111827',
  },
  cardUnit: {
    fontSize: 16, 
    fontWeight: '600',
    color: '#6B7280',
  },
  cardDate: { 
    fontSize: 13, 
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
