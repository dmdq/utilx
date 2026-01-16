---
title: "微信小游戏性能优化实战：60FPS 流畅体验的秘密"
slug: "mini-game-performance"
date: 2026-01-16T09:00:00+08:00
draft: false
tags: ['小游戏开发', '性能优化', '游戏优化', '内存管理']
categories: ['游戏开发']
author: '有条工具团队'
summary: '深入探讨微信小游戏的性能优化技术，包括渲染优化、内存管理、CPU优化等实战技巧'
---

## 前言

在小游戏中实现 60FPS 的流畅体验是一项挑战。受限于设备和平台特性，我们需要在渲染、内存、CPU 等多个维度进行优化。本文将分享小游戏性能优化的实战经验。

## 渲染性能优化

### 1. DrawCall 优化

```typescript
// DrawCall 分析器
class DrawCallProfiler {
    private drawCalls: number = 0;
    private vertices: number = 0;
    private triangles: number = 0;
    private history: DrawCallStats[] = [];

    record(): void {
        this.drawCalls = cc.renderer.drawCalls;
        this.vertices = cc.renderer.renderedVertices;
        this.triangles = cc.renderer.renderedTriangles;

        this.history.push({
            frame: this.history.length,
            drawCalls: this.drawCalls,
            vertices: this.vertices,
            triangles: this.triangles,
            timestamp: Date.now()
        });

        // 只保留最近 100 帧数据
        if (this.history.length > 100) {
            this.history.shift();
        }
    }

    getAverageDrawCalls(): number {
        if (this.history.length === 0) return 0;
        const sum = this.history.reduce((s, h) => s + h.drawCalls, 0);
        return Math.round(sum / this.history.length);
    }

    // 分析高 DrawCall 场景
    analyzeHighDrawCallScenes(): SceneAnalysis[] {
        const threshold = this.getAverageDrawCalls() * 1.5;

        return this.history
            .filter(h => h.drawCalls > threshold)
            .map(h => ({
                frame: h.frame,
                drawCalls: h.drawCalls,
                potentialCauses: this.identifyCauses(h)
            }));
    }
}

// 合批渲染系统
class BatchRenderSystem {
    private batchGroups = new Map<string, cc.Node[]>();

    // 按材质分组
    groupByMaterial(nodes: cc.Node[]): void {
        this.batchGroups.clear();

        for (const node of nodes) {
            const sprite = node.getComponent(cc.Sprite);
            if (!sprite) continue;

            const material = sprite.getMaterial(0);
            const key = this.getMaterialKey(material);

            if (!this.batchGroups.has(key)) {
                this.batchGroups.set(key, []);
            }

            this.batchGroups.get(key)!.push(node);
        }
    }

    // 自动合批
    autoBatch(): void {
        for (const [key, nodes] of this.batchGroups) {
            if (nodes.length < 3) continue; // 至少3个才合批

            this.mergeNodes(nodes);
        }
    }

    private mergeNodes(nodes: cc.Node[]): void {
        // 合并多个节点为单个 DrawCall
        const firstNode = nodes[0];
        const spriteBatch = firstNode.getComponent(cc.Sprite)!;

        // 设置合批模式
        spriteBatch.setType(cc.Sprite.Type.SIMPLE);
        spriteBatch.setSizeMode(cc.Sprite.SizeMode.CUSTOM);

        // 合并几何数据
        const vertices = this.collectVertices(nodes);
        const indices = this.generateIndices(vertices.length);

        // 创建共享几何体
        const mesh = new cc.Mesh();
        mesh.init(vertices, indices);
        mesh.setBoundingBox(new cc.AABB());

        // 应用到所有节点
        for (const node of nodes) {
            const sprite = node.getComponent(cc.Sprite)!;
            sprite.setMaterial(0, spriteBatch.getMaterial(0));
            sprite.setMesh(mesh);
        }
    }
}

// 自动图集系统
class AutoAtlasSystem {
    private atlasCache = new Map<string, cc.SpriteAtlas>();

    // 动态创建图集
    async createDynamicAtlas(
        textures: string[],
        maxSize: number = 2048
    ): Promise<cc.SpriteAtlas> {
        // 加载所有纹理
        const assets = await Promise.all(
            textures.map(t => this.loadTexture(t))
        );

        // 使用装箱算法排列纹理
        const packResult = this.packTextures(assets, maxSize, maxSize);

        // 创建图集
        const atlasTexture = new cc.Texture2D();
        atlasTexture.initWithElement(packResult.canvas);
        atlasTexture.handleLoadedTexture();

        // 生成帧数据
        const frames = packResult.rects.map((rect, i) => ({
            name: textures[i],
            rect: new cc.Rect(rect.x, rect.y, rect.width, rect.height),
            offset: cc.v2(0, 0),
            originalSize: cc.size(assets[i].width, assets[i].height),
            rotated: false
        }));

        const atlas = cc.SpriteAtlas.createWithTexture(atlasTexture, frames);
        this.atlasCache.set('dynamic', atlas);

        return atlas;
    }

    // MaxRects 装箱算法
    private packTextures(
        textures: cc.Texture2D[],
        maxWidth: number,
        maxHeight: number
    ): PackResult {
        const packer = new MaxRects();
        const rectMap = new Map<cc.Texture2D, cc.Rect>();

        // 按面积排序（大者优先）
        const sorted = [...textures].sort((a, b) =>
            (b.width * b.height) - (a.width * a.height)
        );

        for (const texture of sorted) {
            const rect = packer.insert(texture.width, texture.height);
            if (!rect) {
                console.warn('Atlas full, consider increasing size');
                break;
            }
            rectMap.set(texture, rect);
        }

        return {
            canvas: this.drawAtlas(rectMap),
            rects: Array.from(rectMap.values())
        };
    }
}
```

### 2. 纹理优化

```typescript
// 纹理压缩管理器
class TextureCompressionManager {
    // iOS: PVRTC 压缩
    compressPVRTC(texture: cc.Texture2D, quality: 'low' | 'medium' | 'high'): Promise<cc.Texture2D> {
        const format = quality === 'high' ? 4 : 2; // PVRTC 4bpp/2bpp

        return new Promise((resolve, reject) => {
            wx.compressImage({
                src: texture.url,
                quality: quality === 'high' ? 100 : 80,
                compressedDataType: format,
                success: (res) => {
                    const compressed = new cc.Texture2D();
                    compressed.initWithElement(res.tempFilePath);
                    resolve(compressed);
                },
                fail: reject
            });
        });
    }

    // Android: ETC2 压缩
    compressETC2(texture: cc.Texture2D): Promise<cc.Texture2D> {
        return new Promise((resolve, reject) => {
            // ETC2 需要 RGB8 格式
            const canvas = cc.game.canvas;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(texture.getHtmlElementObj(), 0, 0);

            const imageData = ctx.getImageData(0, 0, texture.width, texture.height);
            const etc2Data = this.encodeETC2(imageData);

            const compressed = new cc.Texture2D();
            compressed.initWithData(etc2Data, cc.Texture2D.PixelFormat.RGB_ETC2, texture.width, texture.height);
            resolve(compressed);
        });
    }

    // Mipmap 生成
    generateMipmaps(texture: cc.Texture2D): void {
        const width = texture.width;
        const height = texture.height;
        const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;

        texture.setMipmaps(levels);

        for (let level = 1; level < levels; level++) {
            const prevWidth = Math.max(1, width >> (level - 1));
            const prevHeight = Math.max(1, height >> (level - 1));
            const currWidth = Math.max(1, width >> level);
            const currHeight = Math.max(1, height >> level);

            // 降采样
            const prevData = texture.getTexImageData(level - 1);
            const currData = this.downsample(prevData, prevWidth, prevHeight, currWidth, currHeight);

            texture.setTexImageData(level, currData);
        }
    }
}
```

## 内存优化

### 1. 内存监控与预警

```typescript
// 内存监控器
class MemoryMonitor {
    private maxMemory: number = 0;
    private currentMemory: number = 0;
    private memoryHistory: MemorySample[] = [];
    private alertThreshold: number = 0.8;

    start(): void {
        setInterval(() => {
            this.sample();
        }, 1000);
    }

    sample(): void {
        this.currentMemory = this.getCurrentMemory();
        this.maxMemory = Math.max(this.maxMemory, this.currentMemory);

        this.memoryHistory.push({
            timestamp: Date.now(),
            memory: this.currentMemory
        });

        // 只保留最近 60 秒数据
        if (this.memoryHistory.length > 60) {
            this.memoryHistory.shift();
        }

        // 检查内存告警
        if (this.currentMemory > wx.getPerformance().memory.limit * this.alertThreshold) {
            this.handleMemoryWarning();
        }
    }

    // 内存分析
    analyze(): MemoryReport {
        const peakMemory = Math.max(...this.memoryHistory.map(s => s.memory));
        const avgMemory = this.memoryHistory.reduce((sum, s) => sum + s.memory, 0) / this.memoryHistory.length;

        return {
            current: this.currentMemory,
            peak: peakMemory,
            average: avgMemory,
            usagePercent: (this.currentMemory / wx.getPerformance().memory.limit) * 100,
            trend: this.calculateTrend()
        };
    }

    // 内存泄漏检测
    detectLeak(): LeakReport | null {
        if (this.memoryHistory.length < 30) return null;

        const recent = this.memoryHistory.slice(-20);
        const older = this.memoryHistory.slice(-40, -20);

        const recentAvg = recent.reduce((sum, s) => sum + s.memory, 0) / recent.length;
        const olderAvg = older.reduce((sum, s) => sum + s.memory, 0) / older.length;

        // 内存持续增长超过 20%
        if (recentAvg > olderAvg * 1.2) {
            return {
                detected: true,
                severity: (recentAvg / olderAvg - 1) * 100,
                suggestion: 'Possible memory leak detected. Check for:'
                    + '\n1. Event listeners not removed'
                    + '\n2. Timers not cleared'
                    + '\n3. Assets not released'
                    + '\n4. Circular references'
            };
        }

        return null;
    }
}
```

### 2. 资源生命周期管理

```typescript
// 资源生命周期管理器
class AssetLifecycleManager {
    private assets = new Map<string, AssetInfo>();
    private references = new Map<string, Set<string>>();

    // 注册资源
    register(asset: cc.Asset, owner: string): void {
        const info: AssetInfo = {
            asset,
            owner,
            refCount: 1,
            loadTime: Date.now(),
            lastAccess: Date.now(),
            size: this.calculateSize(asset)
        };

        this.assets.set(asset.uuid, info);

        if (!this.references.has(owner)) {
            this.references.set(owner, new Set());
        }
        this.references.get(owner)!.add(asset.uuid);
    }

    // 引用资源
    reference(assetId: string, owner: string): void {
        const info = this.assets.get(assetId);
        if (info) {
            info.refCount++;
            info.lastAccess = Date.now();
        }

        if (!this.references.has(owner)) {
            this.references.set(owner, new Set());
        }
        this.references.get(owner)!.add(assetId);
    }

    // 释放资源
    release(assetId: string): void {
        const info = this.assets.get(assetId);
        if (!info) return;

        info.refCount--;

        if (info.refCount <= 0) {
            // 从所有引用中移除
            for (const refs of this.references.values()) {
                refs.delete(assetId);
            }

            // 释放资源
            if (cc.assetManager.assets.contains(assetId)) {
                cc.assetManager.releaseAsset(assetId);
            }

            this.assets.delete(assetId);
        }
    }

    // 批量释放（场景切换）
    releaseByOwner(owner: string): void {
        const refs = this.references.get(owner);
        if (!refs) return;

        for (const assetId of refs) {
            this.release(assetId);
        }

        this.references.delete(owner);
    }

    // LRU 清理
    async cleanup(targetSize: number): Promise<void> {
        const currentSize = this.getTotalSize();
        if (currentSize <= targetSize) return;

        // 按最后访问时间排序
        const sorted = Array.from(this.assets.entries())
            .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

        let freedSize = 0;
        for (const [id, info] of sorted) {
            if (info.refCount === 0) {
                freedSize += info.size;
                this.release(id);

                if (freedSize >= currentSize - targetSize) {
                    break;
                }
            }
        }
    }
}
```

## CPU 优化

### 1. 脚本优化

```typescript
// 事件节流与防抖
class EventOptimizer {
    private throttleMap = new Map<string, ThrottleInfo>();
    private debounceMap = new Map<string, DebounceInfo>();

    // 节流
    throttle<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        delay: number
    ): T {
        return ((...args: any[]) => {
            const info = this.throttleMap.get(key);

            if (!info || Date.now() - info.lastCall >= delay) {
                const result = fn(...args);
                this.throttleMap.set(key, {
                    lastCall: Date.now(),
                    result
                });
                return result;
            }

            return info?.result;
        }) as T;
    }

    // 防抖
    debounce<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        delay: number
    ): T {
        return ((...args: any[]) => {
            const info = this.debounceMap.get(key);

            if (info) {
                clearTimeout(info.timer);
            }

            const timer = setTimeout(() => {
                fn(...args);
                this.debounceMap.delete(key);
            }, delay);

            this.debounceMap.set(key, { timer });
        }) as T;
    }
}

// 使用示例
const eventOptimizer = new EventOptimizer();

// 节流：每 100ms 最多执行一次
const updatePosition = eventOptimizer.throttle(
    'position',
    (x: number, y: number) => {
        player.position = cc.v2(x, y);
    },
    100
);

// 防抖：停止输入后 200ms 执行
const search = eventOptimizer.debounce(
    'search',
    (keyword: string) => {
        performSearch(keyword);
    },
    200
);

// 物理优化
class PhysicsOptimizer {
    private updateRate: number = 1 / 60;

    // 降低物理更新频率
    setPhysicsRate(rate: number): void {
        this.updateRate = rate;
    }

    // 分帧更新
    update(dt: number): void {
        const steps = Math.ceil(dt / this.updateRate);
        const stepDt = dt / steps;

        for (let i = 0; i < steps; i++) {
            this.stepPhysics(stepDt);
        }
    }

    // 睡眠优化
    enableSleep(bodies: cc.RigidBody[]): void {
        for (const body of bodies) {
            if (body.linearVelocity.mag() < 0.1) {
                body.sleep();
            }
        }
    }
}
```

### 2. AI 优化

```typescript
// AI 计算分帧
class AISystem {
    private entities: GameEntity[] = [];
    private currentIndex: number = 0;
    private batchSize: number = 10;

    // 分帧更新 AI
    update(dt: number): void {
        const endIndex = Math.min(
            this.currentIndex + this.batchSize,
            this.entities.length
        );

        for (let i = this.currentIndex; i < endIndex; i++) {
            const entity = this.entities[i];
            if (entity.active) {
                this.updateAI(entity, dt);
            }
        }

        this.currentIndex = endIndex >= this.entities.length
            ? 0
            : endIndex;
    }

    // LOD 系统
    updateAI(entity: GameEntity, dt: number): void {
        const distance = cc.v2(entity.position).sub(cc.Camera.main.getNode().position).mag();

        if (distance < 100) {
            // 近距离：完整 AI
            this.updateFullAI(entity, dt);
        } else if (distance < 500) {
            // 中距离：简化 AI
            this.updateSimpleAI(entity, dt);
        } else {
            // 远距离：最低 AI
            this.updateBasicAI(entity, dt);
        }
    }

    // 行为树优化
    private behaviorTreeCache = new Map<string, BehaviorTree>();

    getBehaviorTree(key: string): BehaviorTree {
        if (!this.behaviorTreeCache.has(key)) {
            const tree = this.loadBehaviorTree(key);
            this.behaviorTreeCache.set(key, tree);
        }
        return this.behaviorTreeCache.get(key)!;
    }
}
```

## 性能监控与分析

### 1. 实时性能面板

```typescript
// 性能监控面板
class PerformancePanel {
    private fps: number = 60;
    private frameTime: number = 0;
    private memory: number = 0;
    private drawCalls: number = 0;

    private fpsHistory: number[] = [];
    private frameTimeHistory: number[] = [];

    show(): void {
        const panel = wx.createPerformance();
        panel.show();

        // 注册性能指标
        panel.registerMetric('fps', () => this.fps);
        panel.registerMetric('frameTime', () => this.frameTime);
        panel.registerMetric('memory', () => this.memory);
        panel.registerMetric('drawCalls', () => this.drawCalls);
    }

    update(dt: number): void {
        // 更新 FPS
        this.fps = Math.round(1 / dt);
        this.fpsHistory.push(this.fps);
        if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
        }

        // 更新帧时间
        this.frameTime = Math.round(dt * 1000);
        this.frameTimeHistory.push(this.frameTime);
        if (this.frameTimeHistory.length > 60) {
            this.frameTimeHistory.shift();
        }

        // 更新其他指标
        this.memory = Math.round(wx.getPerformance().memory.used);
        this.drawCalls = cc.renderer.drawCalls;
    }

    // 生成性能报告
    generateReport(): PerformanceReport {
        return {
            fps: {
                current: this.fps,
                average: this.average(this.fpsHistory),
                min: Math.min(...this.fpsHistory),
                max: Math.max(...this.fpsHistory)
            },
            frameTime: {
                current: this.frameTime,
                average: this.average(this.frameTimeHistory),
                min: Math.min(...this.frameTimeHistory),
                max: Math.max(...this.frameTimeHistory)
            },
            memory: this.memory,
            drawCalls: this.drawCalls,
            timestamp: Date.now()
        };
    }

    private average(arr: number[]): number {
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
}
```

### 2. 性能瓶颈诊断

```typescript
// 性能诊断工具
class PerformanceDiagnostics {
    private samples: ProfileSample[] = [];

    // 开始采样
    startSampling(label: string): SamplingSession {
        return {
            label,
            startTime: Date.now(),
            startMemory: wx.getPerformance().memory.used,
            end: () => this.endSampling(this)
        };
    }

    // 结束采样
    endSampling(session: SamplingSession): ProfileResult {
        const endTime = Date.now();
        const endMemory = wx.getPerformance().memory.used;

        const result: ProfileResult = {
            label: session.label,
            duration: endTime - session.startTime,
            memoryDelta: endMemory - session.startMemory,
            timestamp: endTime
        };

        this.samples.push(result);

        // 自动分析
        this.analyzeSample(result);

        return result;
    }

    // 分析采样结果
    private analyzeSample(sample: ProfileResult): void {
        // 耗时过长
        if (sample.duration > 16) { // 超过一帧
            console.warn(`[Performance] ${sample.label} took ${sample.duration}ms`);
            this.suggestOptimization(sample);
        }

        // 内存增长过大
        if (sample.memoryDelta > 1024 * 1024) { // 超过 1MB
            console.warn(`[Memory] ${sample.label} allocated ${sample.memoryDelta} bytes`);
        }
    }

    // 优化建议
    private suggestOptimization(sample: ProfileResult): void {
        const suggestions: string[] = [];

        if (sample.duration > 50) {
            suggestions.push('Consider breaking this operation into multiple frames');
            suggestions.push('Use object pooling to reduce GC pressure');
        }

        if (sample.label.includes('render') || sample.label.includes('draw')) {
            suggestions.push('Reduce draw calls by batching');
            suggestions.push('Use texture atlases');
            suggestions.push('Implement occlusion culling');
        }

        if (sample.label.includes('physics')) {
            suggestions.push('Reduce physics sub-steps');
            suggestions.push('Use simplified collision shapes');
            suggestions.push('Implement spatial partitioning');
        }

        if (suggestions.length > 0) {
            console.log('[Optimization Suggestions]:');
            suggestions.forEach(s => console.log(`  - ${s}`));
        }
    }
}

// 使用示例
const diagnostics = new PerformanceDiagnostics();

// 监控场景加载
async function loadScene(sceneName: string) {
    const session = diagnostics.startSampling(`loadScene:${sceneName}`);

    await cc.director.loadScene(sceneName);

    const result = session.end();
    console.log(`Scene loaded in ${result.duration}ms`);
}
```

## 总结

小游戏性能优化的关键点：

1. **渲染优化**：减少 DrawCall、使用合图、纹理压缩
2. **内存管理**：对象池、资源生命周期管理、及时释放
3. **CPU 优化**：分帧计算、事件节流、AI 简化
4. **监控诊断**：实时性能面板、瓶颈分析、优化建议

持续的监控和优化是保持小游戏流畅运行的关键。

---

**相关工具：**
- [图片压缩工具](https://www.util.cn/tools/image-compressor/)
- [JSON 格式化](https://www.util.cn/tools/json-formatter/)
