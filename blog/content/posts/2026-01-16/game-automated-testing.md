---
title: "游戏自动化测试：构建可靠的质量保障体系"
slug: "game-automated-testing"
date: 2026-01-16T14:00:00+08:00
draft: false
tags: ['游戏测试', '自动化测试', '单元测试', '集成测试', '性能测试']
categories: ['测试']
author: '有条工具团队'
summary: '深入探讨游戏自动化测试体系，包括单元测试、集成测试、UI自动化、性能测试等'
---

## 前言

游戏测试具有其特殊性：图形渲染、实时交互、复杂逻辑等。构建完善的自动化测试体系对于保证游戏质量至关重要。本文将深入探讨游戏自动化测试的最佳实践。

## 单元测试框架

### 1. 游戏逻辑测试

```csharp
// Tests/CombatSystemTests.cs
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using System.Collections;

public class CombatSystemTests
{
    private GameObject playerGameObject;
    private Player player;
    private GameObject enemyGameObject;
    private Enemy enemy;

    [SetUp]
    public void Setup()
    {
        // 创建测试用玩家
        playerGameObject = new GameObject("TestPlayer");
        player = playerGameObject.AddComponent<Player>();
        player.Initialize(new PlayerConfig
        {
            maxHealth = 100,
            attackPower = 20,
            defense = 10
        });

        // 创建测试用敌人
        enemyGameObject = new GameObject("TestEnemy");
        enemy = enemyGameObject.AddComponent<Enemy>();
        enemy.Initialize(new EnemyConfig
        {
            maxHealth = 50,
            attackPower = 15,
            defense = 5
        });
    }

    [TearDown]
    public void TearDown()
    {
        Object.DestroyImmediate(playerGameObject);
        Object.DestroyImmediate(enemyGameObject);
    }

    [Test]
    public void Player_InitialHealth_ShouldBeMaxHealth()
    {
        // Assert
        Assert.AreEqual(100, player.CurrentHealth,
            "Player initial health should equal max health");
    }

    [Test]
    public void Player_TakeDamage_ShouldReduceHealth()
    {
        // Arrange
        int initialHealth = player.CurrentHealth;
        int damage = 30;

        // Act
        player.TakeDamage(damage);

        // Assert
        Assert.AreEqual(initialHealth - damage, player.CurrentHealth,
            "Health should be reduced by damage amount");
    }

    [Test]
    public void Player_TakeDamage_WithDefense_ShouldReduceDamage()
    {
        // Arrange
        int initialHealth = player.CurrentHealth;
        int damage = 30;
        int defense = 10;
        int expectedDamage = damage - defense;

        // Act
        player.TakeDamage(damage, defense);

        // Assert
        Assert.AreEqual(initialHealth - expectedDamage, player.CurrentHealth,
            "Damage should be reduced by defense");
    }

    [Test]
    public void Player_Health_WhenZero_ShouldBeDead()
    {
        // Arrange
        player.SetHealth(1);

        // Act
        player.TakeDamage(10);

        // Assert
        Assert.IsTrue(player.IsDead,
            "Player should be dead when health reaches zero");
    }

    [Test]
    public void Player_Heal_ShouldNotExceedMaxHealth()
    {
        // Arrange
        player.SetHealth(80);
        int healAmount = 30;

        // Act
        player.Heal(healAmount);

        // Assert
        Assert.AreEqual(100, player.CurrentHealth,
            "Health should not exceed max health");
    }

    [UnityTest]
    public IEnumerator Combat_Attack_ShouldReduceEnemyHealth()
    {
        // Arrange
        int initialEnemyHealth = enemy.CurrentHealth;

        // Act
        player.Attack(enemy);

        // Wait for attack animation
        yield return new WaitForSeconds(0.5f);

        // Assert
        Assert.Less(enemy.CurrentHealth, initialEnemyHealth,
            "Enemy health should be reduced after attack");
    }

    [UnityTest]
    public IEnumerator Combat_PlayerKillsEnemy_ShouldGainExperience()
    {
        // Arrange
        long initialExp = player.Experience;
        enemy.SetHealth(1);

        // Act
        player.Attack(enemy);

        // Wait for enemy death
        yield return new WaitUntil(() => enemy.IsDead);

        // Assert
        Assert.Greater(player.Experience, initialExp,
            "Player should gain experience after killing enemy");
    }

    [Test]
    public void LevelUp_ShouldIncreaseStats()
    {
        // Arrange
        int initialAttack = player.AttackPower;
        int initialDefense = player.Defense;
        player.AddExperience(player.RequiredExperience);

        // Act
        player.LevelUp();

        // Assert
        Assert.Greater(player.AttackPower, initialAttack,
            "Attack power should increase after level up");
        Assert.Greater(player.Defense, initialDefense,
            "Defense should increase after level up");
    }
}
```

### 2. Mock 游戏服务

```csharp
// Tests/Mocks/MockInventoryService.cs
public class MockInventoryService : IInventoryService
{
    private Dictionary<string, int> items = new Dictionary<string, int>();

    public bool AddItem(string itemId, int count)
    {
        if (items.ContainsKey(itemId))
        {
            items[itemId] += count;
        }
        else
        {
            items[itemId] = count;
        }

        return true;
    }

    public bool RemoveItem(string itemId, int count)
    {
        if (!items.ContainsKey(itemId) || items[itemId] < count)
        {
            return false;
        }

        items[itemId] -= count;
        if (items[itemId] <= 0)
        {
            items.Remove(itemId);
        }

        return true;
    }

    public int GetItemCount(string itemId)
    {
        return items.ContainsKey(itemId) ? items[itemId] : 0;
    }

    public void Clear()
    {
        items.Clear();
    }

    // 测试辅助方法
    public void SetItem(string itemId, int count)
    {
        items[itemId] = count;
    }

    public bool HasItem(string itemId)
    {
        return items.ContainsKey(itemId);
    }
}

// Tests/ShopSystemTests.cs
[TestFixture]
public class ShopSystemTests
{
    private ShopSystem shopSystem;
    private MockInventoryService mockInventory;
    private MockCurrencyService mockCurrency;

    [SetUp]
    public void Setup()
    {
        mockInventory = new MockInventoryService();
        mockCurrency = new MockCurrencyService();
        shopSystem = new ShopSystem(mockInventory, mockCurrency);
    }

    [Test]
    public void PurchaseItem_WithEnoughCurrency_ShouldSucceed()
    {
        // Arrange
        string itemId = "potion";
        int price = 50;
        mockCurrency.SetCurrency(CurrencyType.Gold, 100);

        // Act
        var result = shopSystem.PurchaseItem(itemId, price);

        // Assert
        Assert.IsTrue(result.Success,
            "Purchase should succeed with enough currency");
        Assert.IsTrue(mockInventory.HasItem(itemId),
            "Item should be added to inventory");
        Assert.AreEqual(50, mockCurrency.GetCurrency(CurrencyType.Gold),
            "Currency should be deducted");
    }

    [Test]
    public void PurchaseItem_WithInsufficientCurrency_ShouldFail()
    {
        // Arrange
        string itemId = "potion";
        int price = 50;
        mockCurrency.SetCurrency(CurrencyType.Gold, 30);

        // Act
        var result = shopSystem.PurchaseItem(itemId, price);

        // Assert
        Assert.IsFalse(result.Success,
            "Purchase should fail with insufficient currency");
        Assert.IsFalse(mockInventory.HasItem(itemId),
            "Item should not be added to inventory");
        Assert.AreEqual(30, mockCurrency.GetCurrency(CurrencyType.Gold),
            "Currency should not be deducted");
    }
}
```

## UI 自动化测试

### 1. 游戏UI测试

```typescript
// tests/ui/MainMenu.test.ts
import { screen, waitFor, within } from '@testing-library/game';
import userEvent from '@testing-library/user-event';
import { GameEngine } from '../engine/GameEngine';

describe('MainMenu', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
        engine.initialize();
    });

    afterEach(() => {
        engine.cleanup();
    });

    test('should display main menu on start', async () => {
        // 启动游戏
        await engine.start();

        // 检查主菜单元素
        expect(screen.getByText('Start Game')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Quit')).toBeInTheDocument();
    });

    test('should navigate to game scene on start click', async () => {
        const user = userEvent.setup();

        await engine.start();

        // 点击开始游戏
        const startButton = screen.getByText('Start Game');
        await user.click(startButton);

        // 等待场景切换
        await waitFor(() => {
            expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
        });

        // 验证游戏场景已加载
        expect(screen.getByTestId('game-scene')).toBeInTheDocument();
    });

    test('should open settings panel on settings click', async () => {
        const user = userEvent.setup();

        await engine.start();

        // 点击设置
        const settingsButton = screen.getByText('Settings');
        await user.click(settingsButton);

        // 验证设置面板
        expect(screen.getByText('Sound')).toBeInTheDocument();
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('Graphics')).toBeInTheDocument();
    });

    test('should adjust sound volume', async () => {
        const user = userEvent.setup();

        await engine.start();

        // 打开设置
        await user.click(screen.getByText('Settings'));

        // 拖动音量滑块
        const volumeSlider = screen.getByRole('slider', { name: 'Sound Volume' });
        await user.clear(volumeSlider);
        await user.type(volumeSlider, '50');

        // 验证音量设置
        const audioManager = engine.getAudioManager();
        expect(audioManager.getSoundVolume()).toBe(0.5);
    });
});

// 游戏内UI测试
describe('InGameUI', () => {
    let engine: GameEngine;

    beforeEach(async () => {
        engine = new GameEngine();
        await engine.initialize();
        await engine.loadScene('Game');
    });

    afterEach(() => {
        engine.cleanup();
    });

    test('should display player health bar', () => {
        const healthBar = screen.getByTestId('health-bar');
        const healthText = within(healthBar).getByText(/HP:/);

        expect(healthBar).toBeInTheDocument();
        expect(healthText).toBeInTheDocument();
    });

    test('should update health bar on damage', async () => {
        const player = engine.getPlayer();
        const initialHealth = player.getHealth();

        // 模拟受伤
        player.takeDamage(20);

        // 等待UI更新
        await waitFor(() => {
            const healthBar = screen.getByTestId('health-bar');
            const healthPercent = (player.getHealth() / initialHealth) * 100;
            expect(healthBar).toHaveStyle(`width: ${healthPercent}%`);
        });
    });

    test('should show skill cooldowns', async () => {
        const skillButton = screen.getByTestId('skill-1');
        const player = engine.getPlayer();

        // 使用技能
        player.useSkill(0);

        // 验证冷却状态
        await waitFor(() => {
            expect(skillButton).toHaveClass('cooldown');
        });

        // 等待冷却结束
        await waitFor(() => {
            expect(skillButton).not.toHaveClass('cooldown');
        }, { timeout: 5000 });
    });

    test('should display inventory panel', async () => {
        const user = userEvent.setup();

        // 打开背包
        const inventoryButton = screen.getByTestId('inventory-button');
        await user.click(inventoryButton);

        // 验证背包面板
        expect(screen.getByTestId('inventory-panel')).toBeInTheDocument();
        expect(screen.getByTestId('inventory-grid')).toBeInTheDocument();
    });

    test('should drag item in inventory', async () => {
        const user = userEvent.setup();

        // 打开背包
        await user.click(screen.getByTestId('inventory-button'));

        // 拖拽物品
        const item = screen.getByTestId('item-0');
        const slot = screen.getByTestId('slot-5');

        await user.drag(item, slot);

        // 验证物品移动
        await waitFor(() => {
            expect(slot).toContainElement(item);
        });
    });
});
```

### 2. 自动化截图测试

```typescript
// tests/visual/VisualRegression.test.ts
import { takeScreenshot, compareScreenshots } from '../utils/visual';

describe('Visual Regression Tests', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    afterEach(() => {
        engine.cleanup();
    });

    test('main menu should match baseline', async () => {
        await engine.initialize();
        await engine.loadScene('MainMenu');

        // 等待UI稳定
        await engine.waitForUIReady();

        // 截图
        const screenshot = await takeScreenshot(engine);

        // 与基线对比
        const diff = await compareScreenshots('main-menu', screenshot);

        expect(diff.percentage).toBeLessThan(0.01); // 允许1%差异
    });

    test('character select should match baseline', async () => {
        await engine.initialize();
        await engine.loadScene('CharacterSelect');

        // 选择特定角色
        await engine.selectCharacter(0);

        await engine.waitForUIReady();

        const screenshot = await takeScreenshot(engine);
        const diff = await compareScreenshots('character-select-warrior', screenshot);

        expect(diff.percentage).toBeLessThan(0.01);
    });

    test('game scene should match baseline', async () => {
        await engine.initialize();
        await engine.loadScene('Game');

        // 设置游戏状态
        await engine.setGameState({
            player: { health: 100, position: { x: 0, y: 0 } },
            enemies: []
        });

        await engine.waitForRender();

        const screenshot = await takeScreenshot(engine);
        const diff = await compareScreenshots('game-scene', screenshot);

        expect(diff.percentage).toBeLessThan(0.02); // 游戏场景允许2%差异
    });
});

// 视觉测试工具
// tests/utils/visual.ts
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

export async function takeScreenshot(engine: GameEngine): Promise<PNG> {
    const buffer = await engine.captureFrame();

    return new Promise((resolve, reject) => {
        const png = new PNG();
        png.parse(buffer, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

export async function compareScreenshots(
    name: string,
    actual: PNG,
    options: { threshold?: number; diffMask?: boolean } = {}
): Promise<{ percentage: number; diffImage?: PNG }> {
    const baselinePath = path.join(__dirname, 'baselines', `${name}.png`);
    const diffPath = path.join(__dirname, 'diffs', `${name}.png`);

    // 读取基线图片
    const baseline = await readPNG(baselinePath);

    // 确保尺寸一致
    if (baseline.width !== actual.width || baseline.height !== actual.height) {
        throw new Error('Image dimensions do not match baseline');
    }

    // 比较像素
    const diff = new PNG({ width: baseline.width, height: baseline.height });
    let mismatchedPixels = 0;

    const threshold = options.threshold || 10;

    for (let y = 0; y < baseline.height; y++) {
        for (let x = 0; x < baseline.width; x++) {
            const idx = (baseline.width * y + x) << 2;

            const rDiff = Math.abs(baseline.data[idx] - actual.data[idx]);
            const gDiff = Math.abs(baseline.data[idx + 1] - actual.data[idx + 1]);
            const bDiff = Math.abs(baseline.data[idx + 2] - actual.data[idx + 2]);

            const isMismatch = rDiff > threshold || gDiff > threshold || bDiff > threshold;

            if (isMismatch) {
                mismatchedPixels++;
                diff.data[idx] = 255;     // R
                diff.data[idx + 1] = 0;   // G
                diff.data[idx + 2] = 0;   // B
                diff.data[idx + 3] = 255; // A
            } else {
                diff.data[idx] = actual.data[idx];
                diff.data[idx + 1] = actual.data[idx + 1];
                diff.data[idx + 2] = actual.data[idx + 2];
                diff.data[idx + 3] = actual.data[idx + 3];
            }
        }
    }

    const percentage = mismatchedPixels / (baseline.width * baseline.height);

    // 保存差异图
    if (percentage > 0 && options.diffMask !== false) {
        await writePNG(diff, diffPath);
    }

    return { percentage, diffImage: diff };
}

async function readPNG(path: string): Promise<PNG> {
    const buffer = fs.readFileSync(path);

    return new Promise((resolve, reject) => {
        const png = new PNG();
        png.parse(buffer, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

async function writePNG(png: PNG, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        png.pack().pipe(fs.createWriteStream(path))
            .on('finish', resolve)
            .on('error', reject);
    });
}
```

## 性能测试

### 1. 帧率测试

```typescript
// tests/performance/FrameRate.test.ts
import { PerformanceMonitor } from '../utils/performance';

describe('Performance Tests', () => {
    let engine: GameEngine;
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        engine = new GameEngine();
        monitor = new PerformanceMonitor(engine);
    });

    afterEach(() => {
        engine.cleanup();
    });

    test('should maintain 60 FPS in empty scene', async () => {
        await engine.initialize();
        await engine.loadScene('Empty');

        // 运行100帧
        await monitor.runFrames(100);

        const metrics = monitor.getMetrics();

        expect(metrics.averageFPS).toBeGreaterThanOrEqual(55);
        expect(metrics.frameTime.average).toBeLessThan(20); // < 20ms
    });

    test('should maintain 30 FPS with 100 enemies', async () => {
        await engine.initialize();
        await engine.loadScene('Game');

        // 生成100个敌人
        await engine.spawnEnemies(100);

        await monitor.runFrames(300); // 5秒

        const metrics = monitor.getMetrics();

        expect(metrics.averageFPS).toBeGreaterThanOrEqual(28);
    });

    test('should measure memory usage', async () => {
        await engine.initialize();
        await engine.loadScene('Game');

        const initialMemory = monitor.getMemoryUsage();

        // 执行游戏操作
        await engine.playFor(10000); // 10秒

        const finalMemory = monitor.getMemoryUsage();
        const memoryIncrease = finalMemory - initialMemory;

        // 内存增长应该合理
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
    });

    test('should detect frame drops', async () => {
        await engine.initialize();
        await engine.loadScene('Game');

        await monitor.runFrames(600); // 10秒

        const frameDrops = monitor.getFrameDrops();

        // 不应有超过5帧的帧率下降
        expect(frameDrops.severe).toBeLessThan(5);
    });
});

// 性能监控工具
// tests/utils/performance.ts
export class PerformanceMonitor {
    private engine: GameEngine;
    private frameTimes: number[] = [];
    private memorySnapshots: number[] = [];

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    async runFrames(count: number): Promise<void> {
        const startTime = performance.now();

        for (let i = 0; i < count; i++) {
            const frameStart = performance.now();

            await this.engine.update();
            await this.engine.render();

            const frameTime = performance.now() - frameStart;
            this.frameTimes.push(frameTime);

            // 每秒记录一次内存
            if (i % 60 === 0) {
                this.memorySnapshots.push(this.getMemoryUsage());
            }
        }
    }

    getMetrics(): PerformanceMetrics {
        const frameTimeSum = this.frameTimes.reduce((a, b) => a + b, 0);
        const frameTimeAvg = frameTimeSum / this.frameTimes.length;
        const fps = 1000 / frameTimeAvg;

        return {
            averageFPS: fps,
            frameTime: {
                average: frameTimeAvg,
                min: Math.min(...this.frameTimes),
                max: Math.max(...this.frameTimes),
                p95: this.percentile(this.frameTimes, 0.95)
            },
            memory: {
                average: this.average(this.memorySnapshots),
                peak: Math.max(...this.memorySnapshots)
            }
        };
    }

    getFrameDrops(): FrameDrops {
        const drops = {
            mild: 0, // 45-55 FPS
            moderate: 0, // 30-45 FPS
            severe: 0 // < 30 FPS
        };

        for (const frameTime of this.frameTimes) {
            const fps = 1000 / frameTime;

            if (fps < 30) drops.severe++;
            else if (fps < 45) drops.moderate++;
            else if (fps < 55) drops.mild++;
        }

        return drops;
    }

    getMemoryUsage(): number {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }

        // Chrome DevTools Protocol
        // @ts-ignore
        if (window.chrome && window.chrome.memory) {
            // @ts-ignore
            return window.chrome.memory.usedJSHeapSize;
        }

        return 0;
    }

    private percentile(arr: number[], p: number): number {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * p);
        return sorted[index];
    }

    private average(arr: number[]): number {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
}

interface PerformanceMetrics {
    averageFPS: number;
    frameTime: {
        average: number;
        min: number;
        max: number;
        p95: number;
    };
    memory: {
        average: number;
        peak: number;
    };
}

interface FrameDrops {
    mild: number;
    moderate: number;
    severe: number;
}
```

### 2. 压力测试

```typescript
// tests/stress/load.test.ts
describe('Stress Tests', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    afterEach(() => {
        engine.cleanup();
    });

    test('should handle 1000 entities', async () => {
        await engine.initialize();
        await engine.loadScene('Game');

        // 生成1000个实体
        const entities = await engine.spawnEntities(1000, {
            type: 'npc',
            ai: 'idle'
        });

        // 运行5分钟
        await engine.playFor(300000);

        // 验证所有实体仍然存在
        const aliveCount = entities.filter(e => e.isAlive()).length;
        expect(aliveCount).toBe(1000);
    });

    test('should handle rapid spawn/despawn', async () => {
        await engine.initialize();
        await engine.loadScene('Game');

        const iterations = 100;
        const batchSize = 50;

        for (let i = 0; i < iterations; i++) {
            // 生成
            const entities = await engine.spawnEntities(batchSize);

            // 立即销毁
            for (const entity of entities) {
                entity.destroy();
            }

            // 等待垃圾回收
            await engine.waitForGC();
        }

        // 验证内存没有泄漏
        const memoryUsage = engine.getMemoryUsage();
        expect(memoryUsage).toBeLessThan(500 * 1024 * 1024); // < 500MB
    });

    test('should handle network stress', async () => {
        await engine.initialize(true); // 启用网络
        await engine.loadScene('Game');

        // 模拟100个并发玩家
        const players = await engine.connectPlayers(100);

        // 每个玩家每秒发送10个动作
        const promises: Promise<void>[] = [];

        for (const player of players) {
            for (let i = 0; i < 10; i++) {
                promises.push(player.performAction('move', {
                    x: Math.random() * 1000,
                    y: Math.random() * 1000
                }));
            }
        }

        await Promise.all(promises);

        // 验证服务器响应时间
        const responseTime = engine.getAverageServerResponseTime();
        expect(responseTime).toBeLessThan(200); // < 200ms
    });
});
```

## 测试报告与集成

### 1. 测试报告生成

```javascript
// tools/test-reporter/reporter.js
const MochaReporter = require('mocha/lib/reporters/base');
const fs = require('fs');
const path = require('path');

class GameTestReporter extends MochaReporter {
    constructor(runner, options) {
        super(runner, options);

        this.results = {
            suite: '',
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            timestamp: new Date().toISOString()
        };

        // 监听事件
        runner.on('start', () => this.onTestStart());
        runner.on('pass', test => this.onTestPass(test));
        runner.on('fail', (test, err) => this.onTestFail(test, err));
        runner.on('end', () => this.onTestEnd());
    }

    onTestStart() {
        this.results.timestamp = new Date().toISOString();
    }

    onTestPass(test) {
        this.results.passed++;
        this.results.tests.push({
            title: test.fullTitle(),
            status: 'passed',
            duration: test.duration,
            retries: test.retries
        });
    }

    onTestFail(test, err) {
        this.results.failed++;
        this.results.tests.push({
            title: test.fullTitle(),
            status: 'failed',
            duration: test.duration,
            error: {
                message: err.message,
                stack: err.stack,
                actual: err.actual,
                expected: err.expected
            }
        });
    }

    onTestEnd() {
        this.results.duration = this.stats.duration;

        // 生成报告
        this.generateReports();
    }

    generateReports() {
        // JSON 报告
        const jsonPath = path.join('test-results', 'results.json');
        fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
        fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

        // HTML 报告
        const htmlPath = path.join('test-results', 'index.html');
        const html = this.generateHTMLReport();
        fs.writeFileSync(htmlPath, html);

        // JUnit XML 报告
        const xmlPath = path.join('test-results', 'junit.xml');
        const xml = this.generateJUnitReport();
        fs.writeFileSync(xmlPath, xml);
    }

    generateHTMLReport() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
        .passed { color: green; }
        .failed { color: red; }
        .test { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
        .test.passed { border-left: 4px solid green; }
        .test.failed { border-left: 4px solid red; }
        .error { background: #ffebee; padding: 10px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total: ${this.results.tests.length}</p>
        <p class="passed">Passed: ${this.results.passed}</p>
        <p class="failed">Failed: ${this.results.failed}</p>
        <p>Duration: ${this.results.duration}ms</p>
    </div>
    ${this.results.tests.map(test => `
        <div class="test ${test.status}">
            <h3>${test.title}</h3>
            <p>Status: ${test.status}</p>
            <p>Duration: ${test.duration}ms</p>
            ${test.error ? `
                <div class="error">
                    <strong>Error:</strong>
                    <pre>${test.error.message}</pre>
                    <pre>${test.error.stack}</pre>
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
        `;
    }

    generateJUnitReport() {
        const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite tests="${this.results.tests.length}" failures="${this.results.failed}" time="${this.results.duration / 1000}">
        ${this.results.tests.map(test => `
            <testcase name="${test.title}" time="${test.duration / 1000}">
                ${test.status === 'failed' ? `
                    <failure message="${this.escapeXML(test.error.message)}">
                        ${this.escapeXML(test.error.stack)}
                    </failure>
                ` : ''}
            </testcase>
        `).join('')}
    </testsuite>
</testsuites>
        `;
        return xml;
    }

    escapeXML(str) {
        return str.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&apos;');
    }
}

module.exports = GameTestReporter;
```

## 总结

游戏自动化测试的核心要点：

1. **单元测试**：游戏逻辑、战斗系统、经济系统
2. **Mock技术**：模拟服务、依赖注入
3. **UI自动化**：UI测试框架、截图对比
4. **性能测试**：帧率、内存、压力测试
5. **测试报告**：多格式报告、趋势分析
6. **持续集成**：测试自动化、质量门禁

完善的自动化测试体系是保证游戏质量的重要基础。

---

**相关工具：**
- [JSON 格式化](https://www.util.cn/tools/json-formatter/)
- [HEX 转换](https://www.util.cn/tools/hex-converter/)
