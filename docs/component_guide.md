# BabyDaily 组件使用指南

## 📦 通用组件库

所有通用组件位于 `src/components/common/`，可以通过以下方式导入：

```typescript
import { Button, Loading, EmptyState, ErrorState, Skeleton } from '@/components/common';
```

---

## 🔘 Button 组件

### 基础用法

```typescript
import { Button } from '@/components/common';

// 主要按钮
<Button variant="primary" onClick={handleClick}>
  保存
</Button>

// 次要按钮
<Button variant="secondary" onClick={handleClick}>
  取消
</Button>

// 幽灵按钮
<Button variant="ghost" onClick={handleClick}>
  了解更多
</Button>

// 危险按钮
<Button variant="danger" onClick={handleClick}>
  删除
</Button>
```

### 带图标

```typescript
import { Plus, Save } from 'lucide-react';

// 图标在左侧
<Button icon={<Plus size={18} />} iconPosition="left">
  添加记录
</Button>

// 图标在右侧
<Button icon={<Save size={18} />} iconPosition="right">
  保存
</Button>
```

### 加载状态

```typescript
<Button loading={isLoading} disabled={isLoading}>
  {isLoading ? '保存中...' : '保存'}
</Button>
```

### 尺寸

```typescript
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>
```

### FAB（悬浮操作按钮）

```typescript
import { FAB } from '@/components/common';
import { Plus } from 'lucide-react';

<FAB
  icon={<Plus size={18} />}
  label="添加记录"
  onClick={handleAdd}
  position="bottom-right" // 或 'bottom-left', 'bottom-center'
/>
```

### IconButton（图标按钮）

```typescript
import { IconButton } from '@/components/common';
import { Edit2, Trash2 } from 'lucide-react';

<IconButton
  icon={<Edit2 size={16} />}
  label="编辑"
  onClick={handleEdit}
  variant="ghost"
  size="md"
/>
```

---

## ⏳ Loading 组件

### 基础用法

```typescript
import { Loading } from '@/components/common';

// 默认加载器
<Loading />

// 带文字
<Loading text="加载中..." />

// 不同尺寸
<Loading size="sm" />
<Loading size="md" />
<Loading size="lg" />

// 全屏加载
<Loading fullScreen text="正在加载数据..." />
```

### 内联加载器

```typescript
import { InlineLoading } from '@/components/common';

<button disabled>
  <InlineLoading className="mr-2" />
  加载中...
</button>
```

---

## 📭 EmptyState 组件

### 基础用法

```typescript
import { EmptyState } from '@/components/common';

// 无数据
<EmptyState type="no-data" />

// 无搜索结果
<EmptyState type="no-results" />

// 无记录
<EmptyState type="no-records" />
```

### 自定义

```typescript
import { Inbox } from 'lucide-react';

<EmptyState
  type="custom"
  title="暂无内容"
  description="这里还没有任何数据"
  icon={<Inbox size={64} className="text-sakura-pink/40" />}
  action={{
    label: '添加第一条',
    onClick: handleAdd,
  }}
/>
```

---

## ❌ ErrorState 组件

### 基础用法

```typescript
import { ErrorState } from '@/components/common';

// 网络错误
<ErrorState type="network" onRetry={handleRetry} />

// 服务器错误
<ErrorState type="server" onRetry={handleRetry} />

// 通用错误
<ErrorState
  type="generic"
  message="加载失败，请重试"
  onRetry={handleRetry}
/>
```

### 内联错误

```typescript
import { InlineError } from '@/components/common';

<InlineError message="用户名不能为空" />
```

### Toast 通知

```typescript
import { ErrorToast } from '@/components/common';

<ErrorToast
  message="操作失败，请重试"
  onClose={() => setShowToast(false)}
/>
```

---

## 💀 Skeleton 组件

### 基础骨架屏

```typescript
import { Skeleton } from '@/components/common';

// 文本骨架
<Skeleton variant="text" width="100%" />

// 圆形骨架
<Skeleton variant="circular" width={40} height={40} />

// 矩形骨架
<Skeleton variant="rectangular" width="100%" height={200} />

// 圆角骨架
<Skeleton variant="rounded" width="100%" height={150} />
```

### 预设骨架屏

```typescript
import {
  KPICardSkeleton,
  ListItemSkeleton,
  CardSkeleton,
  MobileHomeSkeleton,
  DashboardSkeleton,
} from '@/components/common';

// KPI 卡片骨架
<KPICardSkeleton />

// 列表项骨架
<ListItemSkeleton />

// 卡片骨架
<CardSkeleton />

// 移动端 Home 骨架
<MobileHomeSkeleton />

// Dashboard 骨架
<DashboardSkeleton />
```

---

## 🎨 设计 Tokens

### 导入和使用

```typescript
import { colors, spacing, borderRadius, shadows, typography } from '@/styles/tokens';

// 在组件中使用
const MyComponent = () => (
  <div style={{
    color: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.themeB.medium,
    fontSize: typography.fontSize.lg,
  }}>
    内容
  </div>
);
```

### 可用的 Tokens

```typescript
// 颜色
colors.primary          // #FFB7C5
colors.textMain         // #5A3A2E
colors.bgLight          // #FFF7F9
colors.success          // #48BB78
colors.error            // #F56565

// 间距
spacing.xs              // 4px
spacing.sm              // 8px
spacing.md              // 12px
spacing.lg              // 16px
spacing.xl              // 24px

// 圆角
borderRadius.sm         // 8px
borderRadius.md         // 12px
borderRadius.lg         // 16px
borderRadius.xl         // 18px
borderRadius['2xl']     // 20px

// 阴影
shadows.themeA.soft
shadows.themeA.medium
shadows.themeA.strong
shadows.themeB.soft
shadows.themeB.medium
shadows.themeB.strong

// 字体
typography.fontSize.xs  // 12px
typography.fontSize.sm  // 14px
typography.fontSize.base // 16px
typography.fontSize.lg  // 18px
typography.fontSize.xl  // 20px
```

---

## 📱 页面状态处理模式

### 推荐模式

```typescript
import { DashboardSkeleton, EmptyState, ErrorState } from '@/components/common';

const MyPage = () => {
  const { loading, error, data } = useMyData();

  // 加载中
  if (loading) {
    return <DashboardSkeleton />;
  }

  // 错误
  if (error) {
    return (
      <ErrorState
        type="server"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // 空数据
  if (!data || data.length === 0) {
    return (
      <EmptyState
        type="no-data"
        action={{
          label: '添加第一条',
          onClick: handleAdd,
        }}
      />
    );
  }

  // 正常渲染
  return (
    <div>
      {data.map(item => <ItemCard key={item.id} item={item} />)}
    </div>
  );
};
```

---

## 🎭 主题切换

### 使用主题

```typescript
import { useTheme } from '@/contexts/ThemeContext';

const MyComponent = () => {
  const { theme } = useTheme();

  return (
    <div className={`p-4 rounded-2xl ${
      theme === 'A' 
        ? 'glass-panel'  // 玻璃态
        : 'bg-white shadow-sm border border-gray-100'  // 扁平
    }`}>
      内容
    </div>
  );
};
```

### 主题特点

- **主题 A（可爱微调）**:
  - 玻璃态效果（backdrop-blur）
  - 柔和阴影
  - 半透明背景
  - 适合可爱风格

- **主题 B（半扁平）**:
  - 清爽扁平
  - 简洁阴影
  - 纯色背景
  - 现代简约风格

---

## 🎬 动画效果

### 可用动画

```typescript
// 淡入
<div className="animate-fade-in">
  内容
</div>

// 滑入
<div className="animate-slide-up">
  内容
</div>

// 微妙脉冲
<div className="animate-pulse-subtle">
  内容
</div>
```

---

## 📝 完整示例

### Dashboard 页面示例

```typescript
import { KPIGrid } from '../components/web/KPIGrid';
import { TrendChart } from '../components/web/TrendChart';
import { ActivityTable } from '../components/web/ActivityTable';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardSkeleton, EmptyState, ErrorState } from '../components/common';

export const Dashboard = () => {
    const { loading, error, summary, trends, activities } = useDashboardData();

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <ErrorState
                type="server"
                message={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    const hasData = activities.length > 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
                <h2 className="text-2xl font-display font-bold text-sakura-text">
                    今日总览
                </h2>
                <p className="text-sakura-text/60 text-sm">
                    查看宝宝今天的喂养、睡眠与尿布记录
                </p>
            </div>

            <KPIGrid
                milkMl={summary.milkMl}
                diaperWet={summary.diaperWet}
                diaperSoiled={summary.diaperSoiled}
                sleepMinutes={summary.sleepMinutes}
                lastFeedTime={summary.lastFeedTime}
            />

            {hasData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TrendChart data={trends} />
                    </div>
                    <div className="lg:col-span-1">
                        <ActivityTable activities={activities} />
                    </div>
                </div>
            ) : (
                <EmptyState
                    type="no-records"
                    action={{
                        label: '添加第一条记录',
                        onClick: () => console.log('Add record'),
                    }}
                />
            )}
        </div>
    );
};
```

---

## 🔗 相关文档

- [设计蓝图](./prototype_blueprints.md)
- [执行规划](./execution_plan.md)
- [进度总结](./progress_summary.md)
