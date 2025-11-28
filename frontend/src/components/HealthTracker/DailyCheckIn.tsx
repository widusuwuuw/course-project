import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface DailyCheckInProps {
  onCheckIn?: (data: CheckInData) => void;
  hasCheckedIn?: boolean;
  streak?: number;
}

interface CheckInData {
  mood: number;
  energy: number;
  sleep: number;
  water: number;
  exercise: boolean;
}

const DailyCheckIn: React.FC<DailyCheckInProps> = ({
  onCheckIn,
  hasCheckedIn = false,
  streak = 0,
}) => {
  const { colors } = useTheme();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(4);
  const [exercise, setExercise] = useState(false);

  const handleCheckIn = () => {
    const data: CheckInData = {
      mood,
      energy,
      sleep,
      water,
      exercise,
    };
    onCheckIn?.(data);
  };

  const MoodSelector = () => {
    const moods = ['😔', '😐', '🙂', '😊', '😄'];

    return (
      <View style={styles.moodContainer}>
        <Text style={[styles.moodLabel, { color: colors.textWhite }]}>今天的心情</Text>
        <View style={styles.moodOptions}>
          {moods.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.moodOption,
                {
                  backgroundColor: mood === index + 1 ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                  borderColor: colors.textWhite,
                },
              ]}
              onPress={() => setMood(index + 1)}
            >
              <Text style={styles.moodEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const EnergySlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Text style={[styles.sliderLabel, { color: colors.textWhite }]}>精力水平</Text>
        <View style={styles.sliderOptions}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.sliderOption,
                {
                  backgroundColor: energy === level ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                  borderColor: colors.textWhite,
                },
              ]}
              onPress={() => setEnergy(level)}
            >
              <Text style={[styles.sliderText, { color: colors.textWhite }]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const SleepHours = () => {
    return (
      <View style={styles.sleepContainer}>
        <Text style={[styles.sleepLabel, { color: colors.textWhite }]}>睡眠时长 (小时)</Text>
        <View style={styles.sleepOptions}>
          {[5, 6, 7, 8, 9, 10].map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.sleepOption,
                {
                  backgroundColor: sleep === hours ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                  borderColor: colors.textWhite,
                },
              ]}
              onPress={() => setSleep(hours)}
            >
              <Text style={[styles.sleepText, { color: colors.textWhite }]}>
                {hours}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const WaterIntake = () => {
    return (
      <View style={styles.waterContainer}>
        <Text style={[styles.waterLabel, { color: colors.textWhite }]}>饮水 (杯)</Text>
        <View style={styles.waterOptions}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((glasses) => (
            <TouchableOpacity
              key={glasses}
              style={[
                styles.waterOption,
                {
                  backgroundColor: water === glasses ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                  borderColor: colors.textWhite,
                },
              ]}
              onPress={() => setWater(glasses)}
            >
              <Text style={[styles.waterText, { color: colors.textWhite }]}>
                {glasses}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (hasCheckedIn) {
    return (
      <View style={[styles.container, styles.checkedInContainer]}>
        <View style={styles.checkedInContent}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={[styles.checkedInTitle, { color: colors.textWhite }]}>
            今日已打卡
          </Text>
          <Text style={[styles.checkedInSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
            连续打卡 {streak} 天
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textWhite }]}>每日打卡</Text>
        <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
          记录今天的健康状态
        </Text>
      </View>

      <MoodSelector />
      <EnergySlider />
      <SleepHours />
      <WaterIntake />

      <TouchableOpacity style={styles.exerciseContainer} onPress={() => setExercise(!exercise)}>
        <View style={[styles.checkbox, {
          backgroundColor: exercise ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
          borderColor: colors.textWhite
        }]}>
          {exercise && <Ionicons name="checkmark" size={16} color={colors.textWhite} />}
        </View>
        <Text style={[styles.exerciseLabel, { color: colors.textWhite }]}>
          今天运动了
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
        <Text style={styles.checkInButtonText}>完成打卡</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  checkedInContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedInContent: {
    alignItems: 'center',
  },
  checkedInTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  checkedInSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodContainer: {
    marginBottom: 20,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sliderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sleepContainer: {
    marginBottom: 20,
  },
  sleepLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sleepOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  sleepOption: {
    width: 50,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sleepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  waterContainer: {
    marginBottom: 20,
  },
  waterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  waterOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  waterOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  waterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DailyCheckIn;