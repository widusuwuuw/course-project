import React from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface HealthChartProps {
  data: DataPoint[];
  type: 'weight' | 'progress' | 'steps';
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  targetValue?: number;
  color?: string;
}

const HealthChart: React.FC<HealthChartProps> = ({
  data,
  type,
  height = 200,
  showGrid = true,
  showLabels = true,
  targetValue,
  color = '#10B981'
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // 入场动画
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>暂无数据</Text>
      </View>
    );
  }

  const chartWidth = screenWidth - 64; // 左右边距
  const chartPadding = 20;
  const plotWidth = chartWidth - chartPadding * 2;
  const plotHeight = height - 60;

  // 计算数据范围
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // 生成网格线
  const gridLines = showGrid ? [0.25, 0.5, 0.75] : [];

  // 生成数据点
  const points = data.map((point, index) => {
    const x = (index / Math.max(1, data.length - 1)) * plotWidth + chartPadding;
    const y = plotHeight - ((point.value - minValue) / valueRange) * plotHeight;
    return { x, y, data: point };
  });

  // 生成曲线路径
  const generateCurvePath = () => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];

      // 二次贝塞尔曲线，创建平滑效果
      const controlX = (prevPoint.x + currentPoint.x) / 2;
      const controlY = prevPoint.y;

      path += ` Q ${controlX} ${controlY} ${currentPoint.x} ${currentPoint.y}`;
    }

    return path;
  };

  const curvePath = generateCurvePath();

  // 生成渐变区域路径
  const generateAreaPath = () => {
    if (points.length < 2) return '';

    let path = curvePath;
    path += ` L ${points[points.length - 1].x} ${plotHeight}`;
    path += ` L ${points[0].x} ${plotHeight}`;
    path += ' Z';

    return path;
  };

  const getChartLabel = () => {
    switch (type) {
      case 'weight': return '体重趋势';
      case 'progress': return '目标进度';
      case 'steps': return '步数统计';
      default: return '健康数据';
    }
  };

  const getValueUnit = () => {
    switch (type) {
      case 'weight': return 'kg';
      case 'steps': return '步';
      default: return '';
    }
  };

  return (
    <Animated.View style={[styles.container, { height, opacity: fadeAnim }]}>
      {/* 标题 */}
      <Text style={styles.chartTitle}>{getChartLabel()}</Text>

      {/* 图表区域 */}
      <View style={[styles.chartArea, { height: plotHeight + 40 }]}>
        {/* 网格线 */}
        {showGrid && gridLines.map((ratio, index) => (
          <View
            key={index}
            style={[
              styles.gridLine,
              {
                top: plotHeight * (1 - ratio) + 20,
                width: plotWidth + chartPadding,
                left: chartPadding,
              }
            ]}
          />
        ))}

        {/* 目标线 */}
        {targetValue && (
          <View
            style={[
              styles.targetLine,
              {
                top: plotHeight - ((targetValue - minValue) / valueRange) * plotHeight + 20,
                width: plotWidth,
                left: chartPadding,
              }
            ]}
          >
            <Text style={styles.targetLabel}>
              目标: {targetValue}{getValueUnit()}
            </Text>
          </View>
        )}

        {/* 数据点和曲线 (简化版本，使用View模拟) */}
        {points.map((point, index) => (
          <View
            key={index}
            style={[
              styles.dataPoint,
              {
                left: point.x - 4,
                top: point.y + 20 - 4,
                backgroundColor: color,
              }
            ]}
          >
            {showLabels && index % Math.ceil(data.length / 5) === 0 && (
              <View style={styles.dataLabel}>
                <Text style={styles.dataLabelText}>
                  {point.data.value}{getValueUnit()}
                </Text>
                <Text style={styles.dataLabelDate}>
                  {new Date(point.data.date).getDate()}日
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* 连接线 (简化版本) */}
        {points.slice(0, -1).map((point, index) => {
          const nextPoint = points[index + 1];
          const distance = Math.sqrt(
            Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
          );
          const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;

          return (
            <View
              key={`line-${index}`}
              style={[
                styles.dataLine,
                {
                  left: point.x,
                  top: point.y + 20,
                  width: distance,
                  transform: [{ rotate: `${angle}deg` }],
                  backgroundColor: color,
                }
              ]}
            />
          );
        })}

        {/* Y轴标签 */}
        {showLabels && [0, 0.5, 1].map((ratio, index) => {
          const value = minValue + valueRange * ratio;
          return (
            <Text
              key={index}
              style={[
                styles.yAxisLabel,
                {
                  top: plotHeight * (1 - ratio) + 20 - 8,
                  right: chartWidth - chartPadding + 8,
                }
              ]}
            >
              {value.toFixed(1)}
            </Text>
          );
        })}
      </View>

      {/* 统计信息 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{values[values.length - 1]?.toFixed(1) || '0'}</Text>
          <Text style={styles.statLabel}>当前</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {values.length > 1 ? (values[values.length - 1] - values[0] > 0 ? '+' : '') +
             (values[values.length - 1] - values[0]).toFixed(1) : '0'}
          </Text>
          <Text style={styles.statLabel}>变化</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{values.length}</Text>
          <Text style={styles.statLabel}>记录数</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartArea: {
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  targetLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#EF4444',
    zIndex: 1,
  },
  targetLabel: {
    position: 'absolute',
    top: -20,
    right: 0,
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dataLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  dataLabel: {
    position: 'absolute',
    top: -40,
    left: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 4,
  },
  dataLabelText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dataLabelDate: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HealthChart;