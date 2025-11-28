import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';

interface FamilyMember {
  id: string;
  name: string;
  relationship: 'parent' | 'spouse' | 'child' | 'sibling' | 'other';
  avatar?: string;
  age: number;
  isOnline: boolean;
  lastActive: string;
  healthScore: number; // 0-100 健康评分
  recentActivity?: {
    type: 'weight_check' | 'exercise' | 'medication' | 'check_in';
    date: string;
    description: string;
  };
  healthData?: {
    weight?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    steps?: number;
  };
  concerns?: string[]; // 健康关注点
}

interface FamilyHealthCareProps {
  currentUser: string;
  onMemberPress?: (member: FamilyMember) => void;
  onSendMessage?: (memberId: string, message: string) => void;
}

const FamilyHealthCare: React.FC<FamilyHealthCareProps> = ({
  currentUser,
  onMemberPress,
  onSendMessage
}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    // 模拟家庭成员数据
    const mockMembers: FamilyMember[] = [
      {
        id: '1',
        name: '爸爸',
        relationship: 'parent',
        age: 65,
        isOnline: false,
        lastActive: '2小时前',
        healthScore: 85,
        recentActivity: {
          type: 'weight_check',
          date: '2024-01-29',
          description: '记录了体重72.5kg'
        },
        healthData: {
          weight: 72.5,
          bloodPressure: { systolic: 135, diastolic: 85 },
          heartRate: 72,
          steps: 6500
        },
        concerns: ['血压偏高', '需要增加运动']
      },
      {
        id: '2',
        name: '妈妈',
        relationship: 'parent',
        age: 62,
        isOnline: true,
        lastActive: '刚刚',
        healthScore: 78,
        recentActivity: {
          type: 'check_in',
          date: '2024-01-30',
          description: '完成了健康打卡'
        },
        healthData: {
          weight: 65.2,
          bloodPressure: { systolic: 128, diastolic: 82 },
          heartRate: 75,
          steps: 4800
        },
        concerns: ['睡眠质量', '骨密度']
      },
      {
        id: '3',
        name: '小明',
        relationship: 'child',
        age: 12,
        isOnline: false,
        lastActive: '昨天',
        healthScore: 95,
        recentActivity: {
          type: 'exercise',
          date: '2024-01-29',
          description: '完成了足球训练'
        },
        healthData: {
          weight: 42.0,
          heartRate: 85,
          steps: 12000
        }
      }
    ];

    setFamilyMembers(mockMembers);
    setLoading(false);
  };

  const getRelationshipLabel = (relationship: string) => {
    const labels = {
      parent: '父母',
      spouse: '配偶',
      child: '子女',
      sibling: '兄弟姐妹',
      other: '其他'
    };
    return labels[relationship as keyof typeof labels] || '其他';
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // 优秀 - 绿色
    if (score >= 75) return '#F59E0B'; // 良好 - 黄色
    if (score >= 60) return '#FB923C'; // 一般 - 橙色
    return '#EF4444'; // 需要关注 - 红色
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 75) return '良好';
    if (score >= 60) return '一般';
    return '需要关注';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      weight_check: '⚖️',
      exercise: '🏃',
      medication: '💊',
      check_in: '✅'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const handleMemberPress = (member: FamilyMember) => {
    Alert.alert(
      `${member.name}的健康详情`,
      `
健康评分: ${member.healthScore}分 (${getHealthScoreLabel(member.healthScore)})

最近活动:
${getActivityIcon(member.recentActivity?.type || 'check_in')} ${member.recentActivity?.description || '无记录'}

健康数据:
${member.healthData?.weight ? `⚖️ 体重: ${member.healthData.weight}kg` : ''}
${member.healthData?.bloodPressure ? `💉 血压: ${member.healthData.bloodPressure.systolic}/${member.healthData.bloodPressure.diastolic}` : ''}
${member.healthData?.heartRate ? `❤️ 心率: ${member.healthData.heartRate}bpm` : ''}
${member.healthData?.steps ? `👟 步数: ${member.healthData.steps.toLocaleString()}` : ''}

关注点:
${member.concerns?.map(c => `⚠️ ${c}`).join('\n') || '暂无特殊关注'}
      `,
      [
        { text: '发送提醒', onPress: () => sendReminder(member) },
        { text: '查看详情', onPress: () => onMemberPress?.(member) },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const sendReminder = (member: FamilyMember) => {
    Alert.alert(
      '发送健康提醒',
      '请选择提醒类型：',
      [
        { text: '测量血压', onPress: () => onSendMessage?.(member.id, '记得今天测量血压哦') },
        { text: '运动提醒', onPress: () => onSendMessage?.(member.id, '今天记得做运动呀！') },
        { text: '用药提醒', onPress: () => onSendMessage?.(member.id, '该吃药了，不要忘记哦') },
        { text: '自定义消息', onPress: () => sendCustomMessage(member) },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const sendCustomMessage = (member: FamilyMember) => {
    Alert.prompt(
      '发送自定义消息',
      `给${member.name}发送健康提醒消息：`,
      [
        { text: '取消', style: 'cancel' },
        { text: '发送', onPress: (message) => onSendMessage?.(member.id, message || '') }
      ],
      'plain-text'
    );
  };

  const renderHealthScore = (score: number) => {
    const color = getHealthScoreColor(score);
    const label = getHealthScoreLabel(score);

    return (
      <View style={[styles.healthScore, { borderColor: color }]}>
        <Text style={[styles.scoreNumber, { color }]}>
          {score}
        </Text>
        <Text style={[styles.scoreLabel, { color }]}>
          {label}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载家庭成员数据中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 标题和添加按钮 */}
      <View style={styles.header}>
        <Text style={styles.title}>👨‍👩‍👧‍👦 家庭健康</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('添加家庭成员', '功能开发中，敬请期待...')}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      {/* 家庭成员列表 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.membersScroll}
        contentContainerStyle={styles.membersList}
      >
        {familyMembers.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberCard}
            onPress={() => handleMemberPress(member)}
            activeOpacity={0.8}
          >
            {/* 头像和在线状态 */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: getHealthScoreColor(member.healthScore) }]}>
                <Text style={styles.avatarText}>
                  {member.name.charAt(0)}
                </Text>
              </View>
              {member.isOnline && (
                <View style={styles.onlineIndicator} />
              )}
            </View>

            {/* 基本信息 */}
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRelation}>
                {getRelationshipLabel(member.relationship)} · {member.age}岁
              </Text>
              <Text style={styles.lastActive}>
                {member.isOnline ? '🟢 在线' : `📅 ${member.lastActive}`}
              </Text>
            </View>

            {/* 健康评分 */}
            {renderHealthScore(member.healthScore)}

            {/* 最近活动 */}
            {member.recentActivity && (
              <View style={styles.recentActivity}>
                <Text style={styles.activityIcon}>
                  {getActivityIcon(member.recentActivity.type)}
                </Text>
                <Text style={styles.activityText} numberOfLines={1}>
                  {member.recentActivity.description}
                </Text>
              </View>
            )}

            {/* 健康关注点 */}
            {member.concerns && member.concerns.length > 0 && (
              <View style={styles.concerns}>
                {member.concerns.slice(0, 2).map((concern, index) => (
                  <View key={index} style={styles.concernBadge}>
                    <Text style={styles.concernText}>⚠️ {concern}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 快速操作 */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => sendReminder(member)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>📬 提醒</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 家庭健康概览 */}
      <View style={styles.overviewSection}>
        <Text style={styles.overviewTitle}>🏠 家庭健康概览</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{familyMembers.length}</Text>
            <Text style={styles.overviewLabel}>家庭成员</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {familyMembers.filter(m => m.healthScore >= 80).length}
            </Text>
            <Text style={styles.overviewLabel}>健康良好</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {familyMembers.filter(m => m.isOnline).length}
            </Text>
            <Text style={styles.overviewLabel}>在线活跃</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 20,
  },
  membersScroll: {
    marginBottom: 16,
  },
  membersList: {
    paddingRight: 8,
  },
  memberCard: {
    width: 240,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  healthScore: {
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  recentActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  activityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  activityText: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
  },
  concerns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  concernBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  concernText: {
    fontSize: 9,
    color: '#92400E',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  overviewSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default FamilyHealthCare;