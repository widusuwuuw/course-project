import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useGenerateWeeklyPlan } from '../../hooks/useWeeklyPlan';
import { apiGet } from '../../api/client';

interface MonthlyPlan {
  id: number;
  plan_month: string;
  plan_title: string;
}

export default function GenerateWeeklyPlanScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { generate, generating } = useGenerateWeeklyPlan();

  const [loading, setLoading] = useState(true);
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  useEffect(() => {
    loadMonthlyPlan();
  }, []);

  const loadMonthlyPlan = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/v1/monthly-plans/current');
      setMonthlyPlan(response);
    } catch (error) {
      console.error('加载月计划失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWeekPlan = async () => {
    if (!monthlyPlan) {
      Alert.alert('提示', '请先生成月度计划');
      return;
    }

    try {
      const result = await generate(monthlyPlan.id, selectedWeek);
      if (result) {
        Alert.alert(
          '成功',
          `第${selectedWeek}周计划已生成！\n现在可以在"运动健身"页面查看详细计划。`,
          [
            {
              text: '查看计划',
              onPress: () => navigation.navigate('SportsTraining' as never),
            },
            { text: '留在此页', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('失败', '生成周计划失败，请重试');
      }
    } catch (error: any) {
      console.error('生成周计划失败:', error);
      Alert.alert('错误', error.message || '生成周计划失败');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ABAB8" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <LinearGradient colors={['#4ABAB8', '#3A9A98']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>生成周计划</Text>
            <Text style={styles.headerSubtitle}>基于月度计划生成详细的周计划</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* 月计划信息卡片 */}
        {monthlyPlan ? (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="calendar-outline" size={24} color="#4ABAB8" />
              <Text style={styles.infoTitle}>当前月计划</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.monthText}>{monthlyPlan.plan_month}</Text>
              <Text style={styles.planTitle}>{monthlyPlan.plan_title}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="alert-circle-outline" size={48} color="#F59E0B" />
            <Text style={styles.noDataTitle}>暂无月度计划</Text>
            <Text style={styles.noDataText}>请先在"长期规划"中生成月度计划</Text>
            <TouchableOpacity
              style={styles.gotoButton}
              onPress={() => navigation.navigate('MonthlyPlan' as never)}
            >
              <Text style={styles.gotoButtonText}>去生成月计划</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 选择周数 */}
        {monthlyPlan && (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>选择要生成的周</Text>
              <Text style={styles.sectionSubtitle}>基于月度计划，为指定周生成详细的运动和饮食安排</Text>

              <View style={styles.weekSelector}>
                {[1, 2, 3, 4].map((week) => (
                  <TouchableOpacity
                    key={week}
                    style={[
                      styles.weekButton,
                      selectedWeek === week && styles.weekButtonSelected,
                    ]}
                    onPress={() => setSelectedWeek(week)}
                  >
                    <Text
                      style={[
                        styles.weekButtonText,
                        selectedWeek === week && styles.weekButtonTextSelected,
                      ]}
                    >
                      第{week}周
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 说明卡片 */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                <Text style={styles.tipsTitle}>生成说明</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                  <Text style={styles.tipText}>根据月计划主题和目标，生成7天详细计划</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                  <Text style={styles.tipText}>包含每日运动项目、时长和强度</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                  <Text style={styles.tipText}>包含每日饮食建议和卡路里目标</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                  <Text style={styles.tipText}>结合您的健康偏好和体检数据</Text>
                </View>
              </View>
            </View>

            {/* 生成按钮 */}
            <TouchableOpacity
              style={[styles.generateButton, generating && styles.generateButtonDisabled]}
              onPress={handleGenerateWeekPlan}
              disabled={generating}
            >
              {generating ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>生成中...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="flash-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>生成第{selectedWeek}周计划</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  infoContent: {
    paddingLeft: 32,
  },
  monthText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  noDataCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  gotoButton: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  gotoButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 18,
  },
  weekSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  weekButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekButtonSelected: {
    backgroundColor: '#4ABAB820',
    borderColor: '#4ABAB8',
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekButtonTextSelected: {
    color: '#4ABAB8',
  },
  tipsCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
    marginLeft: 8,
    lineHeight: 18,
  },
  generateButton: {
    margin: 16,
    marginTop: 8,
    flexDirection: 'row',
    backgroundColor: '#4ABAB8',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
