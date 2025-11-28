/**
 * 健康成就系统
 * 参考Keep的徽章系统设计，结合医疗健康特性
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'weight' | 'consistency' | 'milestone' | 'social';
  isUnlocked: boolean;
  progress: number; // 0-100
  unlockedDate?: string;
  requirements: {
    type: 'weight_loss' | 'streak' | 'records' | 'days_active' | 'goal_reached';
    target: number;
    current: number;
  };
}

export class AchievementManager {
  private achievements: Achievement[] = [
    // 体重相关成就
    {
      id: 'weight_first',
      name: '初识健康',
      description: '完成第一次体重记录',
      icon: '⚖️',
      color: '#3B82F6',
      category: 'weight',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'records',
        target: 1,
        current: 0,
      }
    },
    {
      id: 'weight_weekly',
      name: '坚持记录',
      description: '连续7天记录体重',
      icon: '📅',
      color: '#10B981',
      category: 'consistency',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'streak',
        target: 7,
        current: 0,
      }
    },
    {
      id: 'weight_monthly',
      name: '月度达人',
      description: '连续30天记录体重',
      icon: '🏆',
      color: '#F59E0B',
      category: 'consistency',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'streak',
        target: 30,
        current: 0,
      }
    },
    {
      id: 'weight_loss_5kg',
      name: '减重先锋',
      description: '成功减重5公斤',
      icon: '🔥',
      color: '#EF4444',
      category: 'milestone',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'weight_loss',
        target: 5,
        current: 0,
      }
    },
    {
      id: 'weight_loss_10kg',
      name: '减重达人',
      description: '成功减重10公斤',
      icon: '💪',
      color: '#8B5CF6',
      category: 'milestone',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'weight_loss',
        target: 10,
        current: 0,
      }
    },
    {
      id: 'goal_reached',
      name: '目标达成',
      description: '达到设定的体重目标',
      icon: '🎯',
      color: '#06B6D4',
      category: 'milestone',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'goal_reached',
        target: 1,
        current: 0,
      }
    },
    {
      id: 'data_expert',
      name: '数据专家',
      description: '累计记录50次健康数据',
      icon: '📊',
      color: '#6366F1',
      category: 'weight',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'records',
        target: 50,
        current: 0,
      }
    },
    {
      id: 'active_user',
      name: '活跃用户',
      description: '使用应用超过30天',
      icon: '⭐',
      color: '#F97316',
      category: 'consistency',
      isUnlocked: false,
      progress: 0,
      requirements: {
        type: 'days_active',
        target: 30,
        current: 0,
      }
    },
  ];

  constructor() {
    this.loadAchievements();
  }

  /**
   * 加载用户成就数据
   */
  private async loadAchievements() {
    try {
      // 这里应该从本地存储或API加载
      // const savedAchievements = await AsyncStorage.getItem('achievements');
      // if (savedAchievements) {
      //   this.achievements = JSON.parse(savedAchievements);
      // }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  }

  /**
   * 保存成就数据
   */
  private async saveAchievements() {
    try {
      // await AsyncStorage.setItem('achievements', JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  /**
   * 获取所有成就
   */
  getAchievements(): Achievement[] {
    return this.achievements;
  }

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(achievement => achievement.isUnlocked);
  }

  /**
   * 获取进行中的成就
   */
  getInProgressAchievements(): Achievement[] {
    return this.achievements.filter(achievement => !achievement.isUnlocked && achievement.progress > 0);
  }

  /**
   * 更新体重记录相关的成就进度
   */
  async updateWeightRecordProgress(weightRecords: any[], targetWeight?: number) {
    const today = new Date();
    const streakDays = this.calculateStreakDays(weightRecords);
    const totalRecords = weightRecords.length;
    const weightLoss = this.calculateWeightLoss(weightRecords);
    const daysActive = this.calculateDaysActive(weightRecords);

    this.achievements.forEach(achievement => {
      const { requirements } = achievement;

      switch (requirements.type) {
        case 'records':
          requirements.current = totalRecords;
          achievement.progress = Math.min(100, (totalRecords / requirements.target) * 100);
          break;

        case 'streak':
          requirements.current = streakDays;
          achievement.progress = Math.min(100, (streakDays / requirements.target) * 100);
          break;

        case 'weight_loss':
          requirements.current = weightLoss;
          achievement.progress = Math.min(100, (weightLoss / requirements.target) * 100);
          break;

        case 'goal_reached':
          if (targetWeight && weightRecords.length > 0) {
            const currentWeight = weightRecords[weightRecords.length - 1].weight;
            requirements.current = currentWeight <= targetWeight ? 1 : 0;
            achievement.progress = requirements.current * 100;
          }
          break;

        case 'days_active':
          requirements.current = daysActive;
          achievement.progress = Math.min(100, (daysActive / requirements.target) * 100);
          break;
      }

      // 检查是否应该解锁成就
      if (!achievement.isUnlocked && achievement.progress >= 100) {
        this.unlockAchievement(achievement);
      }
    });

    await this.saveAchievements();
  }

  /**
   * 解锁成就
   */
  private async unlockAchievement(achievement: Achievement) {
    achievement.isUnlocked = true;
    achievement.unlockedDate = new Date().toLocaleDateString('zh-CN');

    // 触发成就解锁事件
    this.onAchievementUnlocked?.(achievement);
  }

  /**
   * 计算连续记录天数
   */
  private calculateStreakDays(weightRecords: any[]): number {
    if (weightRecords.length === 0) return 0;

    const sortedRecords = [...weightRecords].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedRecords.length - 1; i++) {
      const currentDate = new Date(sortedRecords[i].date);
      currentDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(sortedRecords[i + 1].date);
      nextDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 计算减重量
   */
  private calculateWeightLoss(weightRecords: any[]): number {
    if (weightRecords.length < 2) return 0;

    const sortedRecords = [...weightRecords].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const initialWeight = sortedRecords[0].weight;
    const currentWeight = sortedRecords[sortedRecords.length - 1].weight;

    return Math.max(0, initialWeight - currentWeight);
  }

  /**
   * 计算活跃天数
   */
  private calculateDaysActive(weightRecords: any[]): number {
    const uniqueDays = new Set(
      weightRecords.map(record => new Date(record.date).toDateString())
    );

    return uniqueDays.size;
  }

  /**
   * 成就解锁回调
   */
  onAchievementUnlocked?: (achievement: Achievement) => void;

  /**
   * 获取成就统计
   */
  getAchievementStats() {
    const total = this.achievements.length;
    const unlocked = this.getUnlockedAchievements().length;
    const inProgress = this.getInProgressAchievements().length;

    return {
      total,
      unlocked,
      inProgress,
      completionRate: Math.round((unlocked / total) * 100)
    };
  }
}

// 全局成就管理器实例
export const achievementManager = new AchievementManager();