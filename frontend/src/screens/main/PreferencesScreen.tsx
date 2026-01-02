import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { apiGet, apiPost } from '../../api/client';

const { width } = Dimensions.get('window');

// 偏好选项定义
const TASTE_OPTIONS = ['清淡', '适中', '浓郁'];
const INTENSITY_OPTIONS = ['light', 'moderate', 'high'];
const INTENSITY_LABELS = { light: '低强度', moderate: '中等强度', high: '高强度' };
const STRESS_LEVELS = [1, 2, 3, 4, 5];
const STRESS_LABELS: Record<number, string> = { 1: '很低', 2: '较低', 3: '中等', 4: '较高', 5: '很高' };
const GOAL_OPTIONS = ['保持健康', '减重', '增肌', '改善睡眠', '提高体能'];
const TIME_SLOT_OPTIONS = ['清晨', '上午', '中午', '下午', '傍晚', '晚上'];

// 常见过敏原
const COMMON_ALLERGENS = ['牛奶', '鸡蛋', '花生', '海鲜', '小麦/麸质', '大豆', '坚果'];

// 工作强度选项
const WORK_INTENSITY_OPTIONS = ['low', 'medium', 'high'];
const WORK_INTENSITY_LABELS = { low: '低', medium: '中等', high: '高' };

interface UserPreferences {
  // 饮食偏好
  taste_preference: string;
  allergens: string[];
  forbidden_foods: string[];
  dietary_restrictions: string[];
  
  // 运动偏好
  preferred_exercises: string[];
  disliked_exercises: string[];
  exercise_frequency: number;
  exercise_duration: number;
  preferred_intensity: string;
  exercise_time_slots: string[];
  available_equipment: string[];
  
  // 生活方式
  wake_up_time: string;
  sleep_time: string;
  work_style: string;
  weekly_schedule: Record<string, any>;
  stress_level: number;
  
  // 目标
  primary_goal: string;
  target_weight: number | null;
  additional_goals: string[];
}

const defaultPreferences: UserPreferences = {
  taste_preference: '适中',
  allergens: [],
  forbidden_foods: [],
  dietary_restrictions: [],
  preferred_exercises: [],
  disliked_exercises: [],
  exercise_frequency: 4,
  exercise_duration: 45,
  preferred_intensity: 'moderate',
  exercise_time_slots: ['傍晚'],
  available_equipment: [],
  wake_up_time: '07:00',
  sleep_time: '23:00',
  work_style: 'office',
  weekly_schedule: {},
  stress_level: 2,
  primary_goal: '保持健康',
  target_weight: null,
  additional_goals: [],
};

export default function PreferencesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [exerciseOptions, setExerciseOptions] = useState<Array<{id: string, name: string}>>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>('diet');
  const [hasChanges, setHasChanges] = useState(false);
  
  // 加载偏好设置和选项
  useEffect(() => {
    loadData();
  }, []);
  
  // 页面聚焦时重新加载数据（仅当没有未保存的更改时）
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // 如果有未保存的更改，不重新加载，避免丢失用户的编辑
      if (!hasChanges) {
        loadData();
      }
    });
    return unsubscribe;
  }, [navigation, hasChanges]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 并行请求
      const [prefsResponse, exercisesResponse, equipmentResponse] = await Promise.all([
        apiGet('/api/v1/preferences'),
        apiGet('/api/v1/preferences/options/exercises').catch(() => ({ exercises: [] })),
        apiGet('/api/v1/preferences/options/equipment').catch(() => ({ equipment: [] })),
      ]);
      
      // 提取data字段（后端返回的是 {success, message, data} 格式）
      const prefsData = prefsResponse?.data || prefsResponse;
      
      console.log('从后端加载的偏好数据:', prefsData);
      
      // 确保stress_level是数字类型
      const loadedPrefs = {
        ...defaultPreferences,
        ...prefsData,
      };
      
      // 删除后端可能返回的内部标记字段
      delete (loadedPrefs as any)._is_default;
      delete (loadedPrefs as any).id;
      delete (loadedPrefs as any).user_id;
      delete (loadedPrefs as any).created_at;
      delete (loadedPrefs as any).updated_at;
      
      // 后端返回的stress_level应该已经是数字，但为安全起见再转换一次
      if (loadedPrefs.stress_level && typeof loadedPrefs.stress_level !== 'number') {
        loadedPrefs.stress_level = 2; // 默认中等
      }
      
      console.log('处理后的偏好数据:', loadedPrefs);
      setPreferences(loadedPrefs);
      setExerciseOptions(exercisesResponse.exercises || []);
      setEquipmentOptions(equipmentResponse.equipment || []);
    } catch (error) {
      console.error('加载偏好设置失败:', error);
      // 如果是首次加载失败，使用默认值；否则保持当前值
      if (!preferences.wake_up_time) {
        setPreferences(defaultPreferences);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 保存偏好
  const savePreferences = async () => {
    try {
      setSaving(true);
      // 确保stress_level是数字类型
      const dataToSend = {
        ...preferences,
        stress_level: typeof preferences.stress_level === 'number' 
          ? preferences.stress_level 
          : 2
      };
      const response = await apiPost('/api/v1/preferences', dataToSend);
      
      // 检查响应是否成功
      if (response?.success === false) {
        throw new Error(response.message || '保存失败');
      }
      
      // 保存成功后重新加载数据，确保显示最新状态
      await loadData();
      setHasChanges(false);
      
      if (Platform.OS === 'web') {
        alert('偏好设置已保存');
      } else {
        Alert.alert('成功', '偏好设置已保存');
      }
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      if (Platform.OS === 'web') {
        alert('保存失败，请重试');
      } else {
        Alert.alert('错误', '保存失败，请重试');
      }
    } finally {
      setSaving(false);
    }
  };
  
  // 更新偏好
  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };
  
  // 切换数组项
  const toggleArrayItem = (key: keyof UserPreferences, item: string) => {
    const currentArray = (preferences[key] as string[]) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updatePreference(key, newArray);
  };
  
  // 渲染选择按钮组
  const renderChipGroup = (
    options: (string | number)[],
    selectedValue: string | number,
    onSelect: (value: any) => void,
    labels?: Record<string, string> | Record<number, string>
  ) => (
    <View style={styles.chipContainer}>
      {options.map(option => {
        const isSelected = selectedValue === option;
        const displayLabel = labels ? labels[option] : option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.chip,
              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.chipText,
              isSelected && { color: '#fff' }
            ]}>
              {displayLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
  
  // 渲染多选按钮组
  const renderMultiSelectChipGroup = (
    options: string[],
    selectedValues: string[],
    onToggle: (value: string) => void
  ) => (
    <View style={styles.chipContainer}>
      {options.map(option => {
        const isSelected = selectedValues.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.chip,
              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => onToggle(option)}
          >
            <Text style={[
              styles.chipText,
              isSelected && { color: '#fff' }
            ]}>
              {option}
            </Text>
            {isSelected && (
              <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
  
  // 渲染滑块（模拟）
  const renderSlider = (
    value: number,
    min: number,
    max: number,
    step: number,
    label: string,
    unit: string,
    onChange: (value: number) => void
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: colors.primary }]}>{value}{unit}</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View
          style={[
            styles.sliderFill,
            {
              width: `${((value - min) / (max - min)) * 100}%`,
              backgroundColor: colors.primary,
            }
          ]}
        />
      </View>
      <View style={styles.sliderButtons}>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Ionicons name="remove" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // 渲染可折叠的设置区域
  const renderSection = (
    id: string,
    title: string,
    icon: string,
    iconColor: string,
    content: React.ReactNode
  ) => {
    const isExpanded = activeSection === id;
    
    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setActiveSection(isExpanded ? null : id)}
        >
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={icon as any} size={20} color={iconColor} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            {content}
          </View>
        )}
      </View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            加载偏好设置...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>偏好设置</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonDisabled
          ]}
          onPress={savePreferences}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 饮食偏好 */}
        {renderSection(
          'diet',
          '饮食偏好',
          'restaurant-outline',
          '#4ABAB8',
          <>
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>口味偏好</Text>
              {renderChipGroup(
                TASTE_OPTIONS,
                preferences.taste_preference,
                (value) => updatePreference('taste_preference', value)
              )}
            </View>
            
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>过敏原</Text>
              <Text style={[styles.settingHint, { color: colors.textSecondary }]}>
                选择您需要避免的食物
              </Text>
              {renderMultiSelectChipGroup(
                COMMON_ALLERGENS,
                preferences.allergens,
                (item) => toggleArrayItem('allergens', item)
              )}
            </View>
          </>
        )}
        
        {/* 运动偏好 */}
        {renderSection(
          'exercise',
          '运动偏好',
          'fitness-outline',
          '#FFD88C',
          <>
            <View style={styles.settingGroup}>
              {renderSlider(
                preferences.exercise_frequency,
                1, 7, 1,
                '每周运动次数',
                '次',
                (value) => updatePreference('exercise_frequency', value)
              )}
            </View>
            
            <View style={styles.settingGroup}>
              {renderSlider(
                preferences.exercise_duration,
                15, 120, 5,
                '每次运动时长',
                '分钟',
                (value) => updatePreference('exercise_duration', value)
              )}
            </View>
            
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>运动强度</Text>
              {renderChipGroup(
                INTENSITY_OPTIONS,
                preferences.preferred_intensity,
                (value) => updatePreference('preferred_intensity', value),
                INTENSITY_LABELS
              )}
            </View>
            
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>偏好时段</Text>
              {renderMultiSelectChipGroup(
                TIME_SLOT_OPTIONS,
                preferences.exercise_time_slots,
                (item) => toggleArrayItem('exercise_time_slots', item)
              )}
            </View>
          </>
        )}
        
        {/* 生活方式 */}
        {renderSection(
          'lifestyle',
          '生活方式',
          'sunny-outline',
          '#D4EDD4',
          <>
            <View style={styles.settingGroup}>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>起床时间</Text>
                  <View style={[styles.timeInput, { borderColor: colors.border }]}>
                    <Ionicons name="sunny-outline" size={18} color={colors.primary} />
                    <TextInput
                      style={[styles.timeInputText, { color: colors.text }]}
                      value={preferences.wake_up_time}
                      onChangeText={(text) => updatePreference('wake_up_time', text)}
                      placeholder="07:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
                
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>睡眠时间</Text>
                  <View style={[styles.timeInput, { borderColor: colors.border }]}>
                    <Ionicons name="moon-outline" size={18} color={colors.primary} />
                    <TextInput
                      style={[styles.timeInputText, { color: colors.text }]}
                      value={preferences.sleep_time}
                      onChangeText={(text) => updatePreference('sleep_time', text)}
                      placeholder="23:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>压力水平</Text>
              {renderChipGroup(
                STRESS_LEVELS,
                preferences.stress_level,
                (value: number) => updatePreference('stress_level', value),
                STRESS_LABELS
              )}
            </View>
          </>
        )}
        
        {/* 健康目标 */}
        {renderSection(
          'goals',
          '健康目标',
          'trophy-outline',
          '#FFB5C5',
          <>
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>主要目标</Text>
              {renderChipGroup(
                GOAL_OPTIONS,
                preferences.primary_goal,
                (value) => updatePreference('primary_goal', value)
              )}
            </View>
            
            {preferences.primary_goal === '减重' && (
              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>目标体重 (kg)</Text>
                <View style={[styles.numberInput, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.numberInputText, { color: colors.text }]}
                    value={preferences.target_weight?.toString() || ''}
                    onChangeText={(text) => {
                      const num = parseFloat(text);
                      updatePreference('target_weight', isNaN(num) ? null : num);
                    }}
                    placeholder="输入目标体重"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
          </>
        )}
        
        {/* 底部间距 */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  settingHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  timeInputText: {
    flex: 1,
    fontSize: 14,
  },
  numberInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  numberInputText: {
    fontSize: 14,
  },
});
