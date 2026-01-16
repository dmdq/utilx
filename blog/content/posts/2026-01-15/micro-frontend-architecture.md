---
title: "微前端架构2.0：模块联邦与云前端实践"
slug: "micro-frontend-architecture"
date: 2026-01-15T12:00:00+08:00
draft: false
tags: ['微前端', 'Module Federation', '前端架构', 'Webpack', '云前端']
categories: ['前端架构']
author: '有条工具团队'
summary: '深入探讨微前端架构的最新实践，包括Module Federation、云前端部署、独立发布等核心技术'
---

## 前言

微前端架构已经从 iframe 集成发展到 Module Federation，再到如今的云前端模式。2026年，微前端已成为大型前端应用的标准架构选择。本文将介绍微前端架构的最新实践和设计模式。

## Module Federation 深度实践

### 1. 基础配置

```javascript
// webpack.config.js - Host 应用
const ModuleFederationPlugin = require('@module-federation/enhanced').default;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host_app',

      // 远程模块配置
      remotes: {
        product: 'product@https://product.example.com/remoteEntry.js',
        checkout: 'checkout@https://checkout.example.com/remoteEntry.js',
        user: 'user@https://user.example.com/remoteEntry.js',
      },

      // 共享依赖
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.0',
          eager: false,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.0',
          eager: false,
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.22.0',
        },
        '@mui/material': {
          singleton: false,
          requiredVersion: '^5.15.0',
        },
      },
    }),
  ],
};

// webpack.config.js - Remote 应用（产品模块）
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'product',

      filename: 'remoteEntry.js',

      // 暴露的模块
      exposes: {
        './ProductList': './src/components/ProductList',
        './ProductDetail': './src/components/ProductDetail',
        './ProductSearch': './src/components/ProductSearch',
        './utils': './src/utils',
      },

      // 共享依赖
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
      },
    }),
  ],
};
```

### 2. 动态加载微应用

```typescript
// utils/dynamic-import.ts
import { useRef, useState, useEffect } from 'react';

interface UseRemoteModuleOptions {
  url: string;
  scope: string;
  module: string;
}

export function useRemoteModule<T = unknown>({
  url,
  scope,
  module,
}: UseRemoteModuleOptions) {
  const [loadedModule, setLoadedModule] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const loadModule = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. 加载 remoteEntry
        await loadScript(url);

        // 2. 初始化共享作用域
        await __webpack_init_sharing__('default');

        // 3. 获取容器
        const container = (window as any)[scope];

        // 4. 初始化容器
        await container.init(__webpack_share_scopes__.default);

        // 5. 加载模块
        const factory = await container.get(module);
        const module = factory();

        setLoadedModule(module as T);
        isInitialized.current = true;
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModule();
  }, [url, scope, module]);

  return { module: loadedModule, error, isLoading };
}

// 加载脚本工具函数
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const element = document.createElement('script');
    element.src = url;
    element.type = 'text/javascript';
    element.async = true;

    element.onload = () => {
      resolve();
    };

    element.onerror = () => {
      reject(new Error(`Failed to load script: ${url}`));
    };

    document.head.appendChild(element);
  });
}
```

### 3. 错误边界与回退

```typescript
// components/ErrorBoundary.tsx
interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MicroAppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 上报错误
    this.props.onError?.(error, errorInfo);

    // 记录到监控系统
    console.error('MicroApp Error:', error, errorInfo);

    // 发送到错误追踪服务
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          microFrontend: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <div className="micro-app-error">
          <h3>应用加载失败</h3>
          <p>请刷新页面重试</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用示例
function ProductModule() {
  const { module: ProductList, error, isLoading } = useRemoteModule({
    url: 'https://product.example.com/remoteEntry.js',
    scope: 'product',
    module: './ProductList',
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorFallback error={error} />;
  }

  if (!ProductList) {
    return null;
  }

  return <ProductList />;
}
```

## 状态管理方案

### 1. 事件总线通信

```typescript
// utils/event-bus.ts
type EventHandler = (...args: unknown[]) => void;

class MicroEventBus {
  private events: Map<string, Set<EventHandler>> = new Map();
  private sandbox: Map<string, unknown> = new Map();

  // 订阅事件
  on(event: string, handler: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    this.events.get(event)!.add(handler);

    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  // 取消订阅
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // 触发事件
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // 设置共享状态
  setSharedState(key: string, value: unknown): void {
    this.sandbox.set(key, value);
    this.emit(`state:${key}`, value);
  }

  // 获取共享状态
  getSharedState<T = unknown>(key: string): T | undefined {
    return this.sandbox.get(key) as T;
  }
}

// 创建全局单例
export const microEventBus = new MicroEventBus();

// 类型定义
interface UserAuthEvent {
  type: 'login' | 'logout';
  user: User | null;
}

interface CartUpdateEvent {
  type: 'add' | 'remove' | 'update';
  productId: string;
  quantity: number;
}

// 使用示例
// 微应用A：登录模块
microEventBus.on('auth:change', (event: UserAuthEvent) => {
  if (event.type === 'login') {
    // 更新本地状态
    updateUserState(event.user);
  } else {
    // 清除本地状态
    clearUserState();
  }
});

// 微应用B：购物车模块
microEventBus.on('auth:logout', () => {
  // 清空购物车
  clearCart();
});

// 主应用：触发事件
function handleLogin(user: User) {
  microEventBus.emit('auth:change', { type: 'login', user });
  microEventBus.setSharedState('currentUser', user);
}
```

### 2. 共享状态管理

```typescript
// utils/shared-store.ts
import { create } from 'zustand';

// 定义共享状态类型
interface SharedUserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

interface SharedCartState {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

// 创建共享状态
export const useSharedUser = create<SharedUserState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));

export const useSharedCart = create<SharedCartState>((set, get) => ({
  items: [],
  total: 0,

  addItem: (item) => {
    const items = [...get().items];
    const existing = items.find(i => i.productId === item.productId);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }

    const total = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    set({ items, total });
  },

  removeItem: (productId) => {
    const items = get().items.filter(i => i.productId !== productId);
    const total = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    set({ items, total });
  },

  clear: () => set({ items: [], total: 0 }),
}));

// 微应用中使用
// 在产品微应用中
function AddToCartButton({ product }: { product: Product }) {
  const addItem = useSharedCart(state => state.addItem);

  const handleClick = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  return <button onClick={handleClick}>加入购物车</button>;
}

// 在购物车微应用中
function CartWidget() {
  const { items, total, removeItem, clear } = useSharedCart();

  return (
    <div>
      <h3>购物车 ({items.length})</h3>
      <ul>
        {items.map(item => (
          <li key={item.productId}>
            {item.name} x {item.quantity}
            <button onClick={() => removeItem(item.productId)}>
              删除
            </button>
          </li>
        ))}
      </ul>
      <p>总计: ¥{total}</p>
      <button onClick={clear}>清空</button>
    </div>
  );
}
```

## 路由集成方案

### 1. 统一路由管理

```typescript
// router/integration.ts
import { createBrowserRouter, Navigate } from 'react-router-dom';

// 微应用路由配置
interface MicroRoute {
  path: string;
  microApp: string;
  module: string;
  fallback?: React.ComponentType;
}

const microRoutes: MicroRoute[] = [
  {
    path: '/products/*',
    microApp: 'product',
    module: './ProductRouter',
  },
  {
    path: '/checkout/*',
    microApp: 'checkout',
    module: './CheckoutRouter',
  },
  {
    path: '/user/*',
    microApp: 'user',
    module: './UserRouter',
  },
];

// 创建统一路由
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/products" replace />,
      },
      // 基础路由
      {
        path: '/home',
        element: <HomePage />,
      },
      // 微应用路由
      ...microRoutes.map(route => ({
        path: route.path,
        element: (
          <MicroAppLoader
            scope={route.microApp}
            module={route.module}
            fallback={route.fallback}
          />
        ),
      })),
      // 404 页面
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

// 微应用加载器组件
function MicroAppLoader({
  scope,
  module,
  fallback: Fallback,
}: {
  scope: string;
  module: string;
  fallback?: React.ComponentType;
}) {
  const url = `https://${scope}.example.com/remoteEntry.js`;

  const { module: Component, error, isLoading } = useRemoteModule({
    url,
    scope,
    module,
  });

  if (isLoading) {
    return Fallback ? <Fallback /> : <PageLoading />;
  }

  if (error) {
    return <ErrorFallback error={error} />;
  }

  if (!Component) {
    return null;
  }

  return <Component />;
}

// 微应用内部路由
// product/src/router.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

export function ProductRouter() {
  return (
    <Routes>
      <Route path="/" element={<ProductList />} />
      <Route path="/list" element={<ProductList />} />
      <Route path="/:id" element={<ProductDetail />} />
      <Route path="/search" element={<ProductSearch />} />
      <Route path="*" element={<Navigate to="/list" replace />} />
    </Routes>
  );
}
```

## 独立部署与发布

### 1. CI/CD 流水线

```yaml
# .github/workflows/deploy-microapp.yml
name: Deploy Micro App

on:
  push:
    branches: [main]
    paths:
      - 'apps/product/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/product/package-lock.json

      - name: Install dependencies
        working-directory: apps/product
        run: npm ci

      - name: Run tests
        working-directory: apps/product
        run: npm test

      - name: Build
        working-directory: apps/product
        run: npm run build
        env:
          CI: true

      - name: Generate version
        id: version
        run: |
          VERSION=$(date +%Y.%m.%d.%H%M%S)
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Deploy to CDN
        run: |
          # 上传到 CDN
          aws s3 sync apps/product/dist s3://micro-apps/product/${{ steps.version.outputs.version }}/ \
            --cache-control "public, max-age=31536000, immutable"

          # 更新版本元数据
          aws s3 cp version.json s3://micro-apps/product/latest-version.json

      - name: Update service discovery
        run: |
          # 更新服务注册中心
          curl -X POST https://service-discovery.example.com/register \
            -H "Content-Type: application/json" \
            -d '{
              "name": "product",
              "version": "${{ steps.version.outputs.version }}",
              "url": "https://cdn.example.com/micro-apps/product/${{ steps.version.outputs.version }}/remoteEntry.js"
            }'

      - name: Notify teams
        run: |
          # 发送部署通知
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H "Content-Type: application/json" \
            -d '{
              "text": "Product microapp deployed successfully!",
              "version": "${{ steps.version.outputs.version }}"
            }'
```

### 2. 版本管理与回滚

```typescript
// utils/version-manager.ts
interface MicroAppVersion {
  name: string;
  version: string;
  url: string;
  deployedAt: string;
  status: 'active' | 'canary' | 'deprecated';
}

class VersionManager {
  private versionCache = new Map<string, MicroAppVersion[]>();

  async getVersions(appName: string): Promise<MicroAppVersion[]> {
    if (this.versionCache.has(appName)) {
      return this.versionCache.get(appName)!;
    }

    const response = await fetch(
      `https://service-discovery.example.com/versions/${appName}`
    );
    const versions = await response.json();

    this.versionCache.set(appName, versions);

    return versions;
  }

  async getActiveVersion(appName: string): Promise<MicroAppVersion | null> {
    const versions = await this.getVersions(appName);
    return versions.find(v => v.status === 'active') || null;
  }

  async getCanaryVersion(appName: string): Promise<MicroAppVersion | null> {
    const versions = await this.getVersions(appName);
    return versions.find(v => v.status === 'canary') || null;
  }

  async canaryRelease(
    appName: string,
    version: string,
    percentage: number
  ): Promise<void> {
    // 配置灰度发布
    await fetch(
      `https://service-discovery.example.com/canary/${appName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          percentage,
          rules: [
            {
              type: 'user_segment',
              value: 'beta_testers',
            },
            {
              type: 'geo',
              value: ['cn'],
            },
          ],
        }),
      }
    );
  }

  async rollback(appName: string, targetVersion?: string): Promise<void> {
    const versions = await this.getVersions(appName);

    let versionToRollback: MicroAppVersion;

    if (targetVersion) {
      versionToRollback = versions.find(v => v.version === targetVersion)!;
    } else {
      // 回滚到上一个版本
      const activeIndex = versions.findIndex(v => v.status === 'active');
      versionToRollback = versions[activeIndex + 1];
    }

    await fetch(
      `https://service-discovery.example.com/activate/${appName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: versionToRollback.version,
        }),
      }
    );
  }
}

export const versionManager = new VersionManager();
```

## 性能优化

### 1. 预加载策略

```typescript
// utils/preload.ts
class MicroAppPreloader {
  private preloadedApps = new Set<string>();

  // 预加载 remoteEntry
  preloadRemoteEntry(url: string): void {
    if (this.preloadedApps.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = url;
    document.head.appendChild(link);

    this.preloadedApps.add(url);
  }

  // 预加载微应用
  async preloadMicroApp(scope: string, module: string): Promise<void> {
    const url = `https://${scope}.example.com/remoteEntry.js`;

    // 预加载 remoteEntry
    this.preloadRemoteEntry(url);

    // 初始化容器
    await loadScript(url);
    await __webpack_init_sharing__('default');

    const container = (window as any)[scope];
    await container.init(__webpack_share_scopes__.default);

    // 预加载具体模块
    await container.get(module);
  }

  // 基于路由预加载
  preloadByRoute(currentPath: string): void {
    const preloadMap: Record<string, string> = {
      '/home': 'product',
      '/products': 'product',
      '/user': 'user',
    };

    const appsToPreload = Object.values(preloadMap);

    for (const app of appsToPreload) {
      this.preloadMicroApp(app, './index');
    }
  }

  // 基于用户行为预加载
  preloadOnHover(element: HTMLElement, scope: string, module: string): void {
    element.addEventListener('mouseenter', () => {
      this.preloadMicroApp(scope, module);
    }, { once: true });
  }
}

export const microAppPreloader = new MicroAppPreloader();

// 在主应用中使用
function App() {
  const location = useLocation();

  useEffect(() => {
    microAppPreloader.preloadByRoute(location.pathname);
  }, [location.pathname]);

  return (
    <nav>
      <Link
        to="/products"
        onMouseEnter={() => microAppPreloader.preloadMicroApp('product', './ProductRouter')}
      >
        产品
      </Link>
      <Link
        to="/checkout"
        onMouseEnter={() => microAppPreloader.preloadMicroApp('checkout', './CheckoutRouter')}
      >
        结算
      </Link>
    </nav>
  );
}
```

### 2. 缓存优化

```typescript
// utils/cache.ts
interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate: number;
}

class MicroAppCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private config: CacheConfig = {
    maxAge: 3600000, // 1小时
    staleWhileRevalidate: 7200000, // 2小时
  };

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): unknown | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;

    // 新鲜数据
    if (age < this.config.maxAge) {
      return cached.data;
    }

    // 过期但可用
    if (age < this.config.staleWhileRevalidate) {
      // 异步刷新
      this.refresh(key);
      return cached.data;
    }

    // 完全过期
    this.cache.delete(key);
    return null;
  }

  private async refresh(key: string): Promise<void> {
    // 实现异步刷新逻辑
    const parts = key.split(':');
    const scope = parts[1];
    const module = parts[2];

    try {
      await microAppPreloader.preloadMicroApp(scope, module);
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.staleWhileRevalidate) {
        this.cache.delete(key);
      }
    }
  }
}

export const microAppCache = new MicroAppCache();

// 定期清理
setInterval(() => {
  microAppCache.cleanup();
}, 300000); // 每5分钟
```

## 监控与诊断

### 1. 性能监控

```typescript
// utils/monitoring.ts
interface MicroAppMetrics {
  appName: string;
  version: string;
  loadTime: number;
  renderTime: number;
  errorCount: number;
  memoryUsage: number;
}

class MicroAppMonitoring {
  private metrics: Map<string, Partial<MicroAppMetrics>> = new Map();

  recordLoadStart(appName: string): void {
    if (!this.metrics.has(appName)) {
      this.metrics.set(appName, {});
    }

    const metrics = this.metrics.get(appName)!;
    metrics.loadStartTime = performance.now();
  }

  recordLoadEnd(appName: string): void {
    const metrics = this.metrics.get(appName);
    if (metrics && metrics.loadStartTime) {
      metrics.loadTime = performance.now() - metrics.loadStartTime;
      delete metrics.loadStartTime;

      // 上报数据
      this.reportMetrics(appName, metrics as MicroAppMetrics);
    }
  }

  recordError(appName: string, error: Error): void {
    const metrics = this.metrics.get(appName);
    if (metrics) {
      metrics.errorCount = (metrics.errorCount || 0) + 1;

      // 上报错误
      this.reportError(appName, error);
    }
  }

  recordMemoryUsage(appName: string): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const metrics = this.metrics.get(appName);
      if (metrics) {
        metrics.memoryUsage = memory.usedJSHeapSize;
      }
    }
  }

  private async reportMetrics(appName: string, metrics: MicroAppMetrics): Promise<void> {
    await fetch('/api/metrics/microapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName,
        ...metrics,
        timestamp: Date.now(),
      }),
    });
  }

  private async reportError(appName: string, error: Error): Promise<void> {
    await fetch('/api/errors/microapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName,
        error: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      }),
    });
  }

  getMetrics(appName: string): Partial<MicroAppMetrics> | undefined {
    return this.metrics.get(appName);
  }

  getAllMetrics(): Map<string, Partial<MicroAppMetrics>> {
    return this.metrics;
  }
}

export const microAppMonitoring = new MicroAppMonitoring();
```

## 总结

微前端架构2.0的核心要点：

1. **Module Federation**：现代化的模块共享机制
2. **独立部署**：各团队自主发布
3. **状态管理**：事件总线 + 共享状态
4. **路由集成**：统一路由体系
5. **性能优化**：预加载、缓存、版本管理
6. **监控诊断**：完善的可观测性

微前端让大型前端应用可以按业务域拆分，实现真正的技术栈无关和团队自治。

---

**相关工具：**
- [URL 编码解码](https://www.util.cn/tools/url-encoder/)
- [HTML 格式化工具](https://www.util.cn/tools/html-formatter/)
