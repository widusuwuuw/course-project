import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { getSavedAIReport } from '../../api/client';

const { width: screenWidth } = Dimensions.get('window');

interface SavedReport {
  success: boolean;
  has_report: boolean;
  ai_report: string | null;
  generated_at: string | null;
  total_metrics: number | null;
}

export default function HealthReportScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<SavedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载报告
  const loadReport = async () => {
    try {
      setError(null);
      const response = await getSavedAIReport();
      
      if (response.success) {
        setReportData(response);
      } else {
        setError('加载报告失败');
      }
    } catch (err: any) {
      console.error('加载健康报告失败:', err);
      setError(err.message || '加载失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 页面聚焦时刷新（实现实时更新）
  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [])
  );

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    loadReport();
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未知时间';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 解析报告内容为段落
  const parseReportContent = (content: string) => {
    const sections: Array<{ type: 'title' | 'subtitle' | 'text'; content: string }> = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('# ')) {
        sections.push({ type: 'title', content: trimmedLine.replace(/^# /, '') });
      } else if (trimmedLine.startsWith('## ')) {
        sections.push({ type: 'subtitle', content: trimmedLine.replace(/^## /, '') });
      } else if (trimmedLine.startsWith('### ')) {
        sections.push({ type: 'subtitle', content: trimmedLine.replace(/^### /, '') });
      } else {
        sections.push({ type: 'text', content: trimmedLine });
      }
    }

    return sections;
  };

  // 渲染加载状态
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ABAB8" />
          <Text style={styles.loadingText}>加载健康报告...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>健康报告</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadReport}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 渲染无报告状态
  if (!reportData?.has_report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>健康报告</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>暂无健康报告</Text>
          <Text style={styles.emptySubtitle}>
            请先在「体检解读」中录入体检数据，{'\n'}然后生成AI体质报告
          </Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={() => navigation.navigate('LabAnalysis' as never)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>去录入体检数据</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 解析报告内容
  const reportSections = parseReportContent(reportData.ai_report || '');

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>健康报告</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#4ABAB8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4ABAB8']} />
        }
      >
        {/* 报告信息卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>生成时间：</Text>
            <Text style={styles.infoValue}>{formatDate(reportData.generated_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="analytics-outline" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>分析指标：</Text>
            <Text style={styles.infoValue}>{reportData.total_metrics || 0} 项</Text>
          </View>
        </View>

        {/* 报告内容 */}
        <View style={styles.reportContent}>
          {reportSections.map((section, index) => {
            if (section.type === 'title') {
              return (
                <Text key={index} style={styles.reportTitle}>
                  {section.content}
                </Text>
              );
            } else if (section.type === 'subtitle') {
              return (
                <Text key={index} style={styles.reportSubtitle}>
                  {section.content}
                </Text>
              );
            } else {
              return (
                <Text key={index} style={styles.reportText}>
                  {section.content}
                </Text>
              );
            }
          })}
        </View>

        {/* 底部提示 */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
          <Text style={styles.disclaimerText}>
            本报告基于您的健康档案数据生成，仅供健康参考，不能替代医生诊断。
          </Text>
        </View>

        {/* 重新生成按钮 */}
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={() => navigation.navigate('LabAnalysis' as never)}
        >
          <Ionicons name="refresh-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.regenerateButtonText}>重新生成报告</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#4ABAB8',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  generateButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#4ABAB8',
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  reportContent: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  reportSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  reportText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#4ABAB8',
    borderRadius: 12,
    gap: 8,
  },
  regenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
