# 🎨 Shadcn风格健康UI组件库

基于shadcn/ui设计原则为React Native健康助手应用创建的现代化UI组件库，参考了Dribbble加密货币仪表板的设计风格。

## 📦 已安装的依赖

```json
{
  "dependencies": {
    "expo-blur": "~13.0.2",
    "lucide-react-native": "^0.263.1",
    "nativewind": "^2.0.11",
    "tailwindcss": "^3.3.0",
    "react-native-reanimated": "^3.3.0"
  }
}
```

## 🧩 核心组件库

### 1. 卡片组件 (`ShadcnCard.tsx`)

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  GradientCard
} from '@/components/ui/ShadcnCard';

// 基础卡片
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>
    内容
  </CardContent>
  <CardFooter>
    底部操作
  </CardFooter>
</Card>

// 渐变卡片
<GradientCard gradientColors={['#6366F1', '#8B5CF6']}>
  内容
</GradientCard>
```

### 2. 按钮组件 (`ShadcnButton.tsx`)

```tsx
import { Button, GradientButton } from '@/components/ui/ShadcnButton';

// 基础按钮
<Button variant="default" size="lg" onPress={handlePress}>
  主要按钮
</Button>

// 渐变按钮
<GradientButton
  gradientColors={['#10B981', '#059669']}
  onPress={handlePress}
>
  渐变按钮
</GradientButton>
```

### 3. 徽章组件 (`ShadcnBadge.tsx`)

```tsx
import { Badge, GradientBadge, StatusBadge } from '@/components/ui/ShadcnBadge';

// 基础徽章
<Badge variant="secondary">标签</Badge>

// 渐变徽章
<GradientBadge gradientColors={['#F59E0B', '#D97706']}>
  重要
</GradientBadge>

// 状态徽章
<StatusBadge status="success">成功</StatusBadge>
<StatusBadge status="warning">警告</StatusBadge>
<StatusBadge status="error">错误</StatusBadge>
```

### 4. 进度条组件 (`ShadcnProgress.tsx`)

```tsx
import { Progress, GradientProgress, CircularProgress } from '@/components/ui/ShadcnProgress';

// 线性进度条
<Progress value={60} max={100} color="#6366F1" height={8} />

// 渐变进度条
<GradientProgress
  value={75}
  gradientColors={['#10B981', '#059669']}
  height={8}
/>

// 圆形进度条
<CircularProgress
  value={80}
  size={120}
  strokeWidth={8}
  color="#6366F1"
  showPercentage={true}
/>
```

## 🎯 完整仪表板实现

### 新的仪表板页面 (`ShadcnHealthDashboard.tsx`)

基于shadcn设计原则创建的现代化健康仪表板，包含：

- **快速统计**: 心率、步数、睡眠、饮水
- **目标进度**: 带渐变效果的进度条
- **健康指标**: 渐变卡片展示关键指标
- **周统计**: 圆形进度条展示周数据
- **快速操作**: 渐变按钮和基础按钮
- **健康提醒**: 带状态徽章的提示卡片

### 集成方式

1. **在App.tsx中添加路由**:
```tsx
import ShadcnHealthDashboard from '@/screens/ShadcnHealthDashboard';

<Stack.Screen
  name="ShadcnHealthDashboard"
  component={ShadcnHealthDashboard}
  options={{ title: 'Shadcn健康仪表盘', headerShown: false }}
/>
```

2. **替换现有路由**（可选）:
```tsx
// 替换原有的Dashboard
<Stack.Screen name="Dashboard" component={ShadcnHealthDashboard} />
```

## 🎨 设计特色

### 色彩系统
- **深色主题**: 基于`rgba(30, 41, 59, 0.8)`的半透明背景
- **渐变强调**: 蓝紫色系(`#6366F1` → `#8B5CF6`)
- **状态颜色**: 成功(#10B981)、警告(#F59E0B)、错误(#EF4444)

### 视觉效果
- **玻璃态**: 半透明背景 + 模糊边框效果
- **渐变元素**: 卡片、按钮、进度条的渐变效果
- **阴影层次**: 多层次阴影增加深度感
- **圆角设计**: 统一的8-12px圆角

### 动画效果
- **进度条动画**: 使用`react-native-reanimated`实现平滑动画
- **按钮反馈**: 按压时的透明度变化
- **圆形进度**: 流畅的数值变化动画

## 🔧 配置说明

### Tailwind配置 (`tailwind.config.js`)
```js
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn设计系统颜色
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        // ... 其他颜色
      }
    },
  },
  plugins: [],
  presets: [require("nativewind/preset")],
}
```

### Babel配置 (`babel.config.js`)
```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel"]
  };
};
```

## 📱 响应式设计

组件采用相对尺寸和Flexbox布局：
- **卡片宽度**: `flex: 1` 或固定宽度 + 边距
- **字体大小**: 相对单位适配不同屏幕
- **间距**: 统一的8px基础间距系统
- **圆角**: 8-12px范围适应不同组件

## 🚀 使用建议

### 1. 渐进式集成
可以先在部分页面测试，确认效果后全面推广：
```tsx
// 创建测试路由
<Stack.Screen name="TestShadcnUI" component={ShadcnHealthDashboard} />
```

### 2. 性能优化
- 避免在列表中过度使用渐变效果
- 使用`useMemo`优化复杂计算
- 合理使用动画，避免同时运行过多动画

### 3. 自定义主题
可以修改`global.css`中的CSS变量来自定义主题：
```css
.health-dark {
  --primary: 252 91% 68%;
  --secondary: 210 40% 16%;
  /* 自定义颜色 */
}
```

## 🎯 设计灵感来源

这套设计参考了Dribbble上的加密货币流动性仪表板：
- **深色主题**: 专业的科技感
- **数据可视化**: 清晰的层次结构
- **渐变装饰**: 现代化的视觉效果
- **卡片布局**: 信息模块化展示

## 📋 组件清单

✅ **已完成组件**:
- `ShadcnCard.tsx` - 卡片组件
- `ShadcnButton.tsx` - 按钮组件
- `ShadcnBadge.tsx` - 徽章组件
- `ShadcnProgress.tsx` - 进度条组件
- `ShadcnHealthDashboard.tsx` - 完整仪表板
- `ModernBackground.tsx` - 背景组件

🔄 **待扩展组件**:
- `ShadcnChart.tsx` - 图表组件
- `ShadcnInput.tsx` - 输入框组件
- `ShadcnModal.tsx` - 模态框组件
- `ShadcnTable.tsx` - 表格组件

---

现在你就可以使用这套基于shadcn设计原则的现代化UI组件库了！🎉