import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

interface HealthScoreProps {
  score: number;
  maxScore?: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  subtitle?: string;
}

const HealthScore: React.FC<HealthScoreProps> = ({
  score,
  maxScore = 100,
  size = 'medium',
  showLabel = true,
  subtitle = 'Health Score',
}) => {
  const { colors } = useTheme();

  // 获取尺寸配置
  const getSizeConfig = () => {
    const screenWidth = Dimensions.get('window').width;
    switch (size) {
      case 'small':
        return { radius: 40, strokeWidth: 8, fontSize: 16, subtitleSize: 10 };
      case 'large':
        return { radius: 80, strokeWidth: 12, fontSize: 28, subtitleSize: 14 };
      default:
        return { radius: 60, strokeWidth: 10, fontSize: 22, subtitleSize: 12 };
    }
  };

  const sizeConfig = getSizeConfig();
  const { radius, strokeWidth, fontSize, subtitleSize } = sizeConfig;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / maxScore) * circumference;

  // 计算颜色
  const getScoreColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const createArcPath = () => {
    const startAngle = -90; // 从顶部开始
    const endAngle = -90 + (360 * score) / maxScore;

    const start = polarToCartesian(0, 0, normalizedRadius, endAngle);
    const end = polarToCartesian(0, 0, normalizedRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y} A ${normalizedRadius} ${normalizedRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const scoreColor = getScoreColor();

  return (
    <View style={[styles.container, { width: radius * 2, height: radius * 2 }]}>
      <Svg height={radius * 2} width={radius * 2}>
        {/* 背景圆环 */}
        <Circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* 进度圆环 */}
        <Path
          d={createArcPath()}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          transform={`translate(${radius}, ${radius})`}
        />
      </Svg>

      {/* 中心内容 */}
      <View style={styles.centerContent}>
        <Text style={[styles.scoreText, { color: colors.textWhite, fontSize }]}>
          {score}
        </Text>
        {showLabel && (
          <Text style={[styles.labelText, { color: 'rgba(255, 255, 255, 0.9)', fontSize: subtitleSize }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '700',
    letterSpacing: -1,
  },
  labelText: {
    fontWeight: '500',
    marginTop: 2,
  },
});

export default HealthScore;