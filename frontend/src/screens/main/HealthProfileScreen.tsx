import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { getHealthProfile } from '../../api/client';

// 后端返回的单个指标格式
interface BackendMetric {
  key: string;
  name: string;
  value: number;
  updated_at: string | null;
}

// 前端使用的指标格式
interface MetricData {
  value: number;
  unit: string;
  updated_at: string;
  status?: string;
}

interface CategoryMetrics {
  [key: string]: MetricData;
}

// 后端返回的原始数据格式
interface BackendHealthProfileData {
  success: boolean;
  has_profile: boolean;
  gender?: string;
  total_metrics?: number;
  last_updated?: string;
  metrics?: {
    [category: string]: BackendMetric[];
  };
}

// 前端使用的数据格式
interface HealthProfileData {
  success: boolean;
  has_profile: boolean;
  gender?: string;
  total_metrics?: number;
  last_updated?: string;
  metrics?: {
    blood_routine?: CategoryMetrics;
    liver_function?: CategoryMetrics;
    kidney_function?: CategoryMetrics;
    lipid?: CategoryMetrics;
    glucose?: CategoryMetrics;
    electrolyte?: CategoryMetrics;
  };
}

// 完整的46项指标定义（按分类组织）
interface MetricDefinition {
  name: string;
  unit: string;
}

// 每个分类包含的指标
const categoryMetrics: Record<string, Record<string, MetricDefinition>> = {
  blood_routine: {
    wbc: { name: '白细胞计数', unit: '×10⁹/L' },
    rbc: { name: '红细胞计数', unit: '×10¹²/L' },
    hgb: { name: '血红蛋白', unit: 'g/L' },
    plt: { name: '血小板计数', unit: '×10⁹/L' },
    neut_per: { name: '中性粒细胞%', unit: '%' },
    lymp_per: { name: '淋巴细胞%', unit: '%' },
    mono_per: { name: '单核细胞%', unit: '%' },
    hct: { name: '红细胞压积', unit: '%' },
    mcv: { name: '平均红细胞体积', unit: 'fL' },
    mch: { name: '平均血红蛋白含量', unit: 'pg' },
    mchc: { name: '平均血红蛋白浓度', unit: 'g/L' },
  },
  liver_function: {
    alt: { name: '谷丙转氨酶', unit: 'U/L' },
    ast: { name: '谷草转氨酶', unit: 'U/L' },
    alp: { name: '碱性磷酸酶', unit: 'U/L' },
    ggt: { name: 'γ-谷氨酰转肽酶', unit: 'U/L' },
    tbil: { name: '总胆红素', unit: 'μmol/L' },
    dbil: { name: '直接胆红素', unit: 'μmol/L' },
    tp: { name: '总蛋白', unit: 'g/L' },
    alb: { name: '白蛋白', unit: 'g/L' },
    glb: { name: '球蛋白', unit: 'g/L' },
  },
  kidney_function: {
    crea: { name: '肌酐', unit: 'μmol/L' },
    bun: { name: '尿素氮', unit: 'mmol/L' },
    urea: { name: '尿素', unit: 'mmol/L' },
    uric_acid: { name: '尿酸', unit: 'μmol/L' },
    cysc: { name: '胱抑素C', unit: 'mg/L' },
    egfr: { name: '肾小球滤过率', unit: 'mL/min/1.73m²' },
    microalb: { name: '尿微量白蛋白', unit: 'mg/L' },
    upcr: { name: '尿蛋白/肌酐比值', unit: 'mg/g' },
  },
  lipid: {
    tc: { name: '总胆固醇', unit: 'mmol/L' },
    tg: { name: '甘油三酯', unit: 'mmol/L' },
    hdl_c: { name: '高密度脂蛋白', unit: 'mmol/L' },
    ldl_c: { name: '低密度脂蛋白', unit: 'mmol/L' },
    vldl_c: { name: '极低密度脂蛋白', unit: 'mmol/L' },
    apolipoprotein_a: { name: '载脂蛋白A', unit: 'g/L' },
    apolipoprotein_b: { name: '载脂蛋白B', unit: 'g/L' },
  },
  glucose: {
    glu: { name: '空腹血糖', unit: 'mmol/L' },
    hba1c: { name: '糖化血红蛋白', unit: '%' },
    fasting_insulin: { name: '空腹胰岛素', unit: 'μU/mL' },
    c_peptide: { name: 'C肽', unit: 'ng/mL' },
    homa_ir: { name: '胰岛素抵抗指数', unit: '' },
  },
  electrolyte: {
    na: { name: '钠', unit: 'mmol/L' },
    k: { name: '钾', unit: 'mmol/L' },
    cl: { name: '氯', unit: 'mmol/L' },
    ca: { name: '钙', unit: 'mmol/L' },
    p: { name: '磷', unit: 'mmol/L' },
    mg: { name: '镁', unit: 'mmol/L' },
  },
};

// 指标中文名映射（兼容旧代码）
const metricNames: Record<string, string> = Object.entries(categoryMetrics).reduce(
  (acc, [_, metrics]) => {
    Object.entries(metrics).forEach(([key, def]) => {
      acc[key] = def.name;
    });
    return acc;
  },
  {} as Record<string, string>
);

const categoryNames: Record<string, string> = {
  blood_routine: '血常规',
  liver_function: '肝功能',
  kidney_function: '肾功能',
  lipid: '血脂',
  glucose: '血糖',
  electrolyte: '电解质',
};

const categoryIcons: Record<string, string> = {
  blood_routine: 'water',
  liver_function: 'fitness',
  kidney_function: 'medical',
  lipid: 'heart',
  glucose: 'nutrition',
  electrolyte: 'flash',
};

const categoryColors: Record<string, string> = {
  blood_routine: '#4ABAB8',
  liver_function: '#EF4444',
  kidney_function: '#A855F7',
  lipid: '#059669',
  glucose: '#DC2626',
  electrolyte: '#F59E0B',
};

export default function HealthProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<HealthProfileData | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // 转换后端数据格式为前端格式
  const transformBackendData = (backendData: BackendHealthProfileData): HealthProfileData => {
    if (!backendData.metrics) {
      return backendData as HealthProfileData;
    }

    const transformedMetrics: HealthProfileData['metrics'] = {};
    
    for (const [categoryKey, metricsArray] of Object.entries(backendData.metrics)) {
      if (Array.isArray(metricsArray)) {
        const categoryMetricsObj: CategoryMetrics = {};
        for (const metric of metricsArray) {
          // 从 categoryMetrics 定义中获取单位
          const metricDef = categoryMetrics[categoryKey]?.[metric.key];
          categoryMetricsObj[metric.key] = {
            value: metric.value,
            unit: metricDef?.unit || '',
            updated_at: metric.updated_at || '',
          };
        }
        (transformedMetrics as any)[categoryKey] = categoryMetricsObj;
      }
    }

    return {
      ...backendData,
      metrics: transformedMetrics,
    };
  };

  const loadProfile = async () => {
    try {
      const response = await getHealthProfile();
      const transformedData = transformBackendData(response);
      setProfileData(transformedData);
    } catch (error) {
      console.error('加载健康档案失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 计算分类中已录入的指标数量
  const getRecordedCount = (categoryKey: string, categoryData: CategoryMetrics | undefined) => {
    if (!categoryData) return 0;
    return Object.keys(categoryData).length;
  };

  // 获取分类的总指标数
  const getTotalCount = (categoryKey: string) => {
    return Object.keys(categoryMetrics[categoryKey] || {}).length;
  };

  const renderCategoryCard = (categoryKey: string, categoryData: CategoryMetrics | undefined) => {
    const isExpanded = expandedCategory === categoryKey;
    const allMetrics = categoryMetrics[categoryKey] || {};
    const totalCount = getTotalCount(categoryKey);
    const recordedCount = getRecordedCount(categoryKey, categoryData);

    return (
      <View key={categoryKey} style={styles.categoryCard}>
        <TouchableOpacity
          style={[styles.categoryHeader, { backgroundColor: categoryColors[categoryKey] + '15' }]}
          onPress={() => setExpandedCategory(isExpanded ? null : categoryKey)}
        >
          <View style={styles.categoryHeaderLeft}>
            <View style={[styles.categoryIconContainer, { backgroundColor: categoryColors[categoryKey] }]}>
              <Ionicons name={categoryIcons[categoryKey] as any} size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.categoryTitle}>{categoryNames[categoryKey]}</Text>
              <Text style={styles.categoryCount}>
                <Text style={{ color: '#4ABAB8', fontWeight: '600' }}>{recordedCount}</Text>
                <Text> / {totalCount} 项已录入</Text>
              </Text>
            </View>
          </View>
          <View style={styles.categoryHeaderRight}>
            {recordedCount === totalCount && (
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
            )}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.metricsContainer}>
            {Object.entries(allMetrics).map(([metricKey, metricDef]) => {
              const metricData = categoryData?.[metricKey];
              const hasValue = metricData !== undefined;

              return (
                <View key={metricKey} style={styles.metricItem}>
                  <View style={styles.metricInfo}>
                    <Text style={[styles.metricName, !hasValue && styles.metricNameEmpty]}>
                      {metricDef.name}
                    </Text>
                    {hasValue ? (
                      <Text style={styles.metricDate}>
                        更新于 {formatDate(metricData.updated_at)}
                      </Text>
                    ) : (
                      <Text style={styles.metricDateEmpty}>尚未录入</Text>
                    )}
                  </View>
                  <View style={styles.metricValueContainer}>
                    {hasValue ? (
                      <>
                        <Text style={[
                          styles.metricValue,
                          metricData.status === 'abnormal' && styles.abnormalValue
                        ]}>
                          {metricData.value}
                        </Text>
                        <Text style={styles.metricUnit}>{metricData.unit || metricDef.unit}</Text>
                      </>
                    ) : (
                      <Text style={styles.metricValueEmpty}>--</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ABAB8" />
          <Text style={styles.loadingText}>加载健康档案...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>健康档案</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!profileData?.has_profile ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color="#CCC" />
            <Text style={styles.emptyTitle}>暂无健康档案</Text>
            <Text style={styles.emptyText}>
              请先在体检解读中录入您的检测数据
            </Text>
            <TouchableOpacity
              style={styles.goToLabButton}
              onPress={() => navigation.navigate('LabAnalysis' as never)}
            >
              <Text style={styles.goToLabButtonText}>去录入数据</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 概览卡片 */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Ionicons name="person-circle-outline" size={50} color="#4ABAB8" />
                <View style={styles.overviewInfo}>
                  <Text style={styles.overviewTitle}>我的健康档案</Text>
                  <Text style={styles.overviewSubtitle}>
                    性别: {profileData.gender === 'male' ? '男' : profileData.gender === 'female' ? '女' : '未设置'}
                  </Text>
                </View>
              </View>
              <View style={styles.overviewStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profileData.total_metrics || 0}</Text>
                  <Text style={styles.statLabel}>已录入指标</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>46</Text>
                  <Text style={styles.statLabel}>总指标数</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {profileData.last_updated ? formatDate(profileData.last_updated) : '-'}
                  </Text>
                  <Text style={styles.statLabel}>最后更新</Text>
                </View>
              </View>
            </View>

            {/* 指标分类列表 */}
            <Text style={styles.sectionTitle}>指标详情</Text>
            
            {profileData.metrics && (
              <>
                {renderCategoryCard('blood_routine', profileData.metrics.blood_routine)}
                {renderCategoryCard('liver_function', profileData.metrics.liver_function)}
                {renderCategoryCard('kidney_function', profileData.metrics.kidney_function)}
                {renderCategoryCard('lipid', profileData.metrics.lipid)}
                {renderCategoryCard('glucose', profileData.metrics.glucose)}
                {renderCategoryCard('electrolyte', profileData.metrics.electrolyte)}
              </>
            )}

            {/* 提示信息 */}
            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={20} color="#4ABAB8" />
              <Text style={styles.tipText}>
                健康档案会自动保存您每次录入的最新指标值，支持增量更新。
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  goToLabButton: {
    marginTop: 24,
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goToLabButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewInfo: {
    marginLeft: 16,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  overviewSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ABAB8',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeBadge: {
    marginRight: 8,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  metricsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 14,
    color: '#333',
  },
  metricNameEmpty: {
    color: '#999',
  },
  metricDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  metricDateEmpty: {
    fontSize: 11,
    color: '#CCC',
    marginTop: 2,
    fontStyle: 'italic',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  metricValueEmpty: {
    fontSize: 16,
    fontWeight: '400',
    color: '#DDD',
  },
  abnormalValue: {
    color: '#EF4444',
  },
  metricUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 30,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    lineHeight: 18,
  },
});
