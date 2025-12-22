---
title: "CSS Grid 布局完全教程"
slug: "css-grid-layout-tutorial"
date: 2025-12-11T09:00:00+08:00
draft: false
tags: ['CSS', 'Grid布局', '响应式设计', '前端布局']
categories: ['前端开发']
author: '有条工具团队'
summary: '全面学习 CSS Grid 布局系统，掌握现代网页布局技术'
---

## 前言

CSS Grid 是一个二维布局系统，专门用于解决复杂的网页布局问题。相比 Flexbox（一维布局），Grid 能够同时处理行和列，为网页设计提供了前所未有的灵活性。

## Grid 基础概念

### 1. Grid 容器和项目

```css
/* 定义 Grid 容器 */
.container {
  display: grid;
  /* 或者 */
  display: inline-grid;
}

/* Grid 项目会自动成为子元素 */
.container > div {
  /* 这些 div 自动成为 Grid 项目 */
}
```

### 2. 网格线和轨道

```css
.container {
  display: grid;
  grid-template-columns: 100px 200px 100px;  /* 3列 */
  grid-template-rows: 50px 100px;            /* 2行 */
  gap: 10px;                                 /* 网格间距 */
}
```

## 定义网格结构

### 1. 固定和弹性网格

```css
/* 固定尺寸 */
.grid-fixed {
  display: grid;
  grid-template-columns: 200px 1fr 200px; /* 1fr = 1个弹性单位 */
  grid-template-rows: 60px 1fr 40px;
  height: 100vh;
}

/* 响应式网格 */
.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 混合单位 */
.grid-mixed {
  display: grid;
  grid-template-columns: 200px 1fr 100px;
  grid-template-rows: auto 1fr auto;
}
```

### 2. 命名网格线

```css
.container {
  display: grid;
  grid-template-columns:
    [sidebar-start] 200px
    [main-start] 1fr
    [main-end sidebar-end];
  grid-template-rows:
    [header-start] 60px
    [main-start] 1fr
    [main-end footer-start] 40px
    [footer-end];
}

/* 使用命名网格线放置项目 */
.header {
  grid-column: sidebar-start / sidebar-end;
  grid-row: header-start;
}
```

### 3. 命名网格区域

```css
.container {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 40px;
  gap: 10px;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

## Grid 项目定位

### 1. 基于网格线定位

```css
.item {
  /* 从第2条列线到第4条列线 */
  grid-column: 2 / 4;
  /* 从第1条行线到第3条行线 */
  grid-row: 1 / 3;
}

/* 使用 span 关键字 */
.item-span {
  /* 占据2列 */
  grid-column: span 2;
  /* 占据3行 */
  grid-row: span 3;
}

/* 更简洁的写法 */
.item-compact {
  /* 从第2列开始，占据2列 */
  grid-column: 2 / span 2;
}
```

### 2. 基于区域定位

```css
.item-area {
  grid-area: 2 / 2 / 4 / 4;
  /* 等同于：
  grid-row-start: 2;
  grid-column-start: 2;
  grid-row-end: 4;
  grid-column-end: 4;
  */
}
```

### 3. 自动定位

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-flow: row; /* 或 column */
}

.item {
  /* Grid 会自动放置项目 */
}
```

## 高级 Grid 特性

### 1. 自动网格

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 100px; /* 自动创建的行高 */
  grid-auto-flow: dense;  /* 密集填充算法 */
}

/* 定义自动列 */
.auto-columns {
  display: grid;
  grid-template-rows: repeat(3, 100px);
  grid-auto-columns: 150px; /* 自动创建的列宽 */
  grid-auto-flow: column;  /* 按列填充 */
}
```

### 2. 子网格（Subgrid）

```css
.parent {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

.child {
  display: grid;
  grid-template-columns: subgrid; /* 继承父容器的列定义 */
  grid-column: span 2;
  gap: inherit; /* 继承父容器的间距 */
}
```

### 3. 网格对齐

```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 400px;

  /* 整个网格在容器中的对齐 */
  justify-content: center;  /* 水平对齐 */
  align-content: center;    /* 垂直对齐 */

  /* 所有项目的默认对齐 */
  justify-items: stretch;   /* 项目水平拉伸 */
  align-items: stretch;     /* 项目垂直拉伸 */
}

/* 单个项目的对齐 */
.item {
  justify-self: start;  /* 覆盖默认的 justify-items */
  align-self: end;      /* 覆盖默认的 align-items */
}
```

## 实际应用示例

### 1. 圣杯布局

```css
.holy-grail {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
  min-height: 100vh;
  gap: 10px;
}

.header { grid-area: header; background: #e3f2fd; }
.nav { grid-area: nav; background: #f3e5f5; }
.main { grid-area: main; background: #e8f5e8; }
.aside { grid-area: aside; background: #fff3e0; }
.footer { grid-area: footer; background: #fce4ec; }

/* 响应式调整 */
@media (max-width: 768px) {
  .holy-grail {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
  }
}
```

### 2. 卡片布局

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}
```

### 3. 仪表板布局

```css
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 60px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  height: 100vh;
  gap: 1px;
  background: #e0e0e0;
}

.sidebar {
  grid-area: sidebar;
  background: white;
  padding: 20px;
}

.header {
  grid-area: header;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.main {
  grid-area: main;
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}

/* 主内容区域的网格 */
.widgets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.widget {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
```

## 与 Flexbox 的配合使用

```css
.container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

## 性能优化技巧

### 1. 避免频繁重排

```css
.container {
  display: grid;
  /* 使用固定值减少重排 */
  grid-template-columns: 200px 1fr 200px;
  /* 使用 contain 属性优化 */
  contain: layout;
}
```

### 2. 合理使用 minmax()

```css
/* 更好的响应式设计 */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(100%, 300px), 1fr)
  );
}
```

## 浏览器兼容性

```css
/* 带前缀的写法 */
.grid {
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: 200px 1fr 200px;
  grid-template-columns: 200px 1fr 200px;
}

/* 使用 @supports */
@supports (display: grid) {
  .modern-layout {
    display: grid;
    /* 现代 Grid 布局 */
  }
}
```

## 调试技巧

### 1. 可视化网格

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* 开发时添加的调试样式 */
.container.debug {
  background-image:
    linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

### 2. 使用浏览器开发工具

```css
/* 在 Chrome DevTools 中 */
/* 选择 Grid 容器 */
/* 在 Styles 面板中点击 Grid 图标 */
/* 可以可视化网格线和网格区域 */
```

## 总结

CSS Grid 是一个强大的布局工具，它提供了：

1. **二维布局能力**：同时控制行和列
2. **灵活的尺寸控制**：固定、弹性、自动尺寸
3. **直观的命名系统**：网格线命名、区域命名
4. **优秀的响应式支持**：auto-fit、auto-fill、minmax()
5. **与其他 CSS 特性的良好集成**：Flexbox、自定义属性等

掌握 Grid 布局将大大提升你的网页布局能力，让复杂的布局变得简单直观。

---

**相关工具：**
- [Grid Garden](https://cssgridgarden.com/) - Grid 游戏化学习
- [CSS Grid Generator](https://cssgrid-generator.io/) - 可视化 Grid 生成器
