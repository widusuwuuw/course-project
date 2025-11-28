import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';

interface CheckInData {
  date: string;
  weight?: number;
  steps?: number;
  sleep?: number;
  mood?: number; // 1-5 心情评分
  note?: string;
}

interface HealthCheckInProps {
  onCheckIn?: (data: CheckInData) => void;
  todayData?: CheckInData;
  streak?: number;
}

const HealthCheckIn: React.FC<HealthCheckInProps> = ({
  onCheckIn,
  todayData,
  streak = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempData, setTempData] = useState<CheckInData>({
    date: new Date().toISOString().split('T')[0],
    weight: undefined,
    steps: undefined,
    sleep: undefined,
    mood: undefined,
    note: undefined,
  });

  const expandAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (todayData) {
      setTempData(todayData);
    }
  }, [todayData]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);

    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleCheckIn = () => {
    // 弹性动画效果
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 验证数据
    if (!tempData.weight && !tempData.steps && !tempData.sleep) {
      Alert.alert('提示', '请至少填写一项健康数据');
      return;
    }

    onCheckIn?.(tempData);
    setIsExpanded(false);
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const isCheckedIn = !!todayData;
  const today = new Date();
  const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];

  const getMoodEmoji = (mood: number) => {
    const moods = ['😢', '😕', '😐', '😊', '😄'];
    return moods[Math.min(Math.max(0, mood - 1), 4)] || '😐';
  };

  const getCheckInStatus = () => {
    if (isCheckedIn) {
      return {
        status: '已完成',
        color: '#10B981',
        emoji: '✅',
        message: '今天已经打卡了，明天再来吧！'
      };
    }
    return {
      status: '未打卡',
      color: '#F59E0B',
      emoji: '⏰',
      message: streak > 0 ? `已连续打卡 ${streak} 天，继续加油！` : '开始今天的健康打卡吧！'
    };
  };

  const statusInfo = getCheckInStatus();

  return (
    <View style={styles.container}>
      {/* 打卡状态卡片 */}
      <TouchableOpacity
        style={[styles.statusCard, { borderColor: statusInfo.color }]}
        onPress={handleExpand}
        activeOpacity={0.8}
        disabled={isCheckedIn}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusLeft}>
            <Text style={styles.dateText}>
              {today.getMonth() + 1}月{today.getDate()}日 星期{dayOfWeek}
            </Text>
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.emoji} {statusInfo.status}
              </Text>
              {streak > 0 && (
                <Text style={styles.streakText}>
                  🔥 连续{streak}天
                </Text>
              )}
            </View>
          </View>

          {!isCheckedIn && (
            <Animated.View style={[styles.checkInButton, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.checkInButtonText}>打卡</Text>
            </Animated.View>
          )}
        </View>

        <Text style={styles.statusMessage}>{statusInfo.message}</Text>

        {/* 展开指示器 */}
        {!isCheckedIn && (
          <Animated.View
            style={[
              styles.expandIndicator,
              {
                transform: [
                  {
                    rotate: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg']
                    })
                  }
                ]
              }
            ]}
          >
            <Text style={styles.expandIcon}>▼</Text>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* 展开的打卡表单 */}
      {!isCheckedIn && (
        <Animated.View
          style={[
            styles.formContainer,
            {
              height: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 280]
              }),
              opacity: expandAnim,
            }
          ]}
        >
          {/* 体重输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>⚖️ 体重 (kg)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputValue}>{tempData.weight || '--'}</Text>
            </View>
            <View style={styles.quickInputRow}>
              {[60, 65, 70, 75, 80].map(weight => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.quickInputButton,
                    tempData.weight === weight && styles.quickInputActive
                  ]}
                  onPress={() => setTempData({ ...tempData, weight })}
                >
                  <Text style={[
                    styles.quickInputText,
                    tempData.weight === weight && styles.quickInputTextActive
                  ]}>
                    {weight}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 步数输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>👟 步数</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputValue}>{tempData.steps?.toLocaleString() || '--'}</Text>
            </View>
            <View style={styles.quickInputRow}>
              {[5000, 8000, 10000, 12000, 15000].map(steps => (
                <TouchableOpacity
                  key={steps}
                  style={[
                    styles.quickInputButton,
                    tempData.steps === steps && styles.quickInputActive
                  ]}
                  onPress={() => setTempData({ ...tempData, steps })}
                >
                  <Text style={[
                    styles.quickInputText,
                    tempData.steps === steps && styles.quickInputTextActive
                  ]}>
                    {steps / 1000}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 睡眠时长 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>😴 睡眠时长 (小时)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputValue}>{tempData.sleep || '--'}</Text>
            </View>
            <View style={styles.quickInputRow}>
              {[6, 7, 8, 9, 10].map(sleep => (
                <TouchableOpacity
                  key={sleep}
                  style={[
                    styles.quickInputButton,
                    tempData.sleep === sleep && styles.quickInputActive
                  ]}
                  onPress={() => setTempData({ ...tempData, sleep })}
                >
                  <Text style={[
                    styles.quickInputText,
                    tempData.sleep === sleep && styles.quickInputTextActive
                  ]}>
                    {sleep}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 心情评分 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>😊 今日心情</Text>
            <View style={styles.moodRow}>
              {[1, 2, 3, 4, 5].map(mood => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodButton,
                    tempData.mood === mood && styles.moodActive
                  ]}
                  onPress={() => setTempData({ ...tempData, mood })}
                >
                  <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 打卡按钮 */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCheckIn}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>完成打卡</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusMessage: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  quickInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickInputButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickInputActive: {
    backgroundColor: '#6366F1',
  },
  quickInputText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickInputTextActive: {
    color: '#FFFFFF',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  moodButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  moodActive: {
    backgroundColor: '#FBBF24',
  },
  moodEmoji: {
    fontSize: 20,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default HealthCheckIn;