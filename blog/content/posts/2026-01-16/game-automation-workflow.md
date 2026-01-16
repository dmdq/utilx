---
title: "游戏运营自动化工作流：提升运营效率的利器"
slug: "game-automation-workflow"
date: 2026-01-16T15:00:00+08:00
draft: false
tags: ['游戏运营', '自动化', '工作流', '活动系统', '数据分析']
categories: ['游戏运营']
author: '有条工具团队'
summary: '深入探讨游戏运营的自动化工作流设计，包括活动配置、数据分析、用户运营等'
---

## 前言

游戏运营需要处理大量重复性工作，如活动配置、数据监控、用户反馈等。通过自动化工作流可以大幅提升运营效率，降低人工成本。本文将深入探讨游戏运营自动化工作流的设计与实现。

## 活动自动化系统

### 1. 活动配置引擎

```typescript
// services/activity/ActivityEngine.ts
interface ActivityConfig {
    id: string;
    name: string;
    type: 'login' | 'purchase' | 'battle' | 'social';
    startTime: Date;
    endTime: Date;
    rewards: Reward[];
    conditions: ActivityCondition[];
    schedule?: ActivitySchedule;
}

interface ActivitySchedule {
    type: 'once' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:mm
    weekDay?: number; // 0-6
    monthDay?: number; // 1-31
}

class ActivityEngine {
    private activities = new Map<string, ActivityConfig>();
    private scheduler: TaskScheduler;
    private eventBus: EventBus;

    async loadActivities(configs: ActivityConfig[]): Promise<void> {
        for (const config of configs) {
            await this.registerActivity(config);
        }
    }

    async registerActivity(config: ActivityConfig): Promise<void> {
        // 验证配置
        this.validateConfig(config);

        // 保存配置
        this.activities.set(config.id, config);

        // 计算触发时间
        const triggerTimes = this.calculateTriggerTimes(config);

        // 调度任务
        for (const time of triggerTimes) {
            await this.scheduler.schedule({
                id: `activity-${config.id}`,
                executeAt: time,
                handler: () => this.executeActivity(config)
            });
        }

        // 发布事件
        this.eventBus.publish('activity.registered', { activityId: config.id });
    }

    private async executeActivity(config: ActivityConfig): Promise<void> {
        try {
            // 检查活动是否有效
            if (!this.isActivityValid(config)) {
                return;
            }

            // 获取符合条件的玩家
            const players = await this.getEligiblePlayers(config);

            // 发放奖励
            const results = await this.grantRewards(players, config.rewards);

            // 记录日志
            await this.logActivityExecution(config, results);

            // 发布事件
            this.eventBus.publish('activity.completed', {
                activityId: config.id,
                playerCount: players.length,
                results
            });

        } catch (error) {
            console.error(`Activity execution failed: ${config.id}`, error);
            await this.handleActivityError(config, error);
        }
    }

    private async getEligiblePlayers(config: ActivityConfig): Promise<Player[]> {
        let players: Player[] = [];

        // 基础查询
        const query: any = { status: 'active' };

        // 应用活动条件
        for (const condition of config.conditions) {
            switch (condition.type) {
                case 'level':
                    query.level = { $gte: condition.minLevel, $lte: condition.maxLevel };
                    break;

                case 'vip':
                    query.vipLevel = { $gte: condition.minVip };
                    break;

                case 'registration':
                    query.registeredAt = {
                        $gte: new Date(Date.now() - condition.days * 86400000)
                    };
                    break;

                case 'purchase':
                    query.totalPurchase = { $gte: condition.minAmount };
                    break;
            }
        }

        players = await this.db.players.find(query).toArray();

        // 后处理过滤
        return players.filter(player => this.checkAllConditions(player, config.conditions));
    }

    private async grantRewards(players: Player[], rewards: Reward[]): Promise<GrantResult[]> {
        const results: GrantResult[] = [];

        for (const player of players) {
            const playerResults: ItemResult[] = [];

            for (const reward of rewards) {
                try {
                    const result = await this.grantReward(player, reward);
                    playerResults.push(result);
                } catch (error) {
                    playerResults.push({
                        itemId: reward.itemId,
                        success: false,
                        error: error.message
                    });
                }
            }

            results.push({
                playerId: player.id,
                items: playerResults
            });

            // 通知玩家
            await this.notifyPlayer(player, rewards);
        }

        return results;
    }

    private async grantReward(player: Player, reward: Reward): Promise<ItemResult> {
        // 调用游戏服务器API
        const response = await this.gameServerApi.post('/api/grant', {
            playerId: player.id,
            itemId: reward.itemId,
            count: reward.count,
            reason: 'activity_reward',
            activityId: reward.activityId
        });

        return {
            itemId: reward.itemId,
            success: response.success,
            newCount: response.newCount
        };
    }
}
```

### 2. 活动模板系统

```typescript
// services/activity/ActivityTemplates.ts
class ActivityTemplateManager {
    private templates = new Map<string, ActivityTemplate>();

    async loadTemplates(templatesDir: string): Promise<void> {
        const files = await fs.readdir(templatesDir);

        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(
                    path.join(templatesDir, file),
                    'utf-8'
                );
                const template = JSON.parse(content);
                this.templates.set(template.id, template);
            }
        }
    }

    // 使用模板创建活动
    createActivityFromTemplate(
        templateId: string,
        params: Record<string, any>
    ): ActivityConfig {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        // 填充参数
        const config: ActivityConfig = {
            id: this.generateId(),
            name: this.fillTemplate(template.name, params),
            type: template.type,
            startTime: new Date(params.startTime),
            endTime: new Date(params.endTime),
            rewards: this.fillRewards(template.rewards, params),
            conditions: this.fillConditions(template.conditions, params),
            schedule: params.schedule
        };

        return config;
    }

    private fillTemplate(template: string, params: Record<string, any>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] || match;
        });
    }

    private fillRewards(
        template: Reward[],
        params: Record<string, any>
    ): Reward[] {
        return template.map(reward => ({
            ...reward,
            count: this.evaluateExpression(reward.count, params)
        }));
    }

    // 常用活动模板
    getBuiltinTemplates(): ActivityTemplate[] {
        return [
            {
                id: 'daily_login',
                name: '每日签到',
                type: 'login',
                description: '玩家每日登录即可获得奖励',
                rewards: [
                    { itemId: 'gold', count: 100 },
                    { itemId: 'gem', count: 10 }
                ],
                conditions: [],
                schedule: {
                    type: 'daily',
                    time: '00:00'
                }
            },
            {
                id: 'cumulative_login',
                name: '累计登录',
                type: 'login',
                description: '累计登录天数达到要求获得奖励',
                rewards: [
                    { itemId: 'gem', count: 50 },
                    { itemId: 'rare_item', count: 1 }
                ],
                conditions: [
                    { type: 'cumulative_login', days: 7 }
                ]
            },
            {
                id: 'first_purchase',
                name: '首充礼包',
                type: 'purchase',
                description: '首次充值购买特定档位',
                rewards: [
                    { itemId: 'legendary_weapon', count: 1 },
                    { itemId: 'gem', count: 1000 }
                ],
                conditions: [
                    { type: 'purchase_count', count: 0 },
                    { type: 'purchase_amount', minAmount: 6 }
                ]
            },
            {
                id: 'consumption_return',
                name: '消费返利',
                type: 'purchase',
                description: '累计消费达到指定金额返利',
                rewards: [
                    { itemId: 'gem', count: 500 }
                ],
                conditions: [
                    { type: 'total_purchase', minAmount: 100 }
                ]
            },
            {
                id: 'battle_pass',
                name: '战斗通行证',
                type: 'battle',
                description: '完成战斗任务获得积分',
                rewards: [
                    { itemId: 'exp', count: 1000 },
                    { itemId: 'gold', count: 500 }
                ],
                conditions: [
                    { type: 'battle_win', count: 10 }
                ]
            },
            {
                id: 'social_share',
                name: '社交分享',
                type: 'social',
                description: '分享游戏获得奖励',
                rewards: [
                    { itemId: 'gem', count: 20 }
                ],
                conditions: [
                    { type: 'share', platform: 'wechat' }
                ]
            }
        ];
    }
}
```

## 数据监控与告警

### 1. 实时指标监控

```typescript
// services/monitoring/MetricsMonitor.ts
class GameMetricsMonitor {
    private collectors = new Map<string, MetricCollector>();
    private alertRules = new Map<string, AlertRule>();
    private alertManager: AlertManager;

    async collectMetrics(): Promise<MetricsSnapshot> {
        const snapshot: MetricsSnapshot = {
            timestamp: Date.now(),
            metrics: {}
        };

        // 收集所有指标
        for (const [name, collector] of this.collectors) {
            const value = await collector.collect();
            snapshot.metrics[name] = value;

            // 检查告警规则
            await this.checkAlertRules(name, value);
        }

        // 存储快照
        await this.storeSnapshot(snapshot);

        return snapshot;
    }

    private async checkAlertRules(metricName: string, value: number): Promise<void> {
        const rules = Array.from(this.alertRules.values())
            .filter(r => r.metric === metricName);

        for (const rule of rules) {
            const triggered = this.evaluateRule(rule, value);

            if (triggered) {
                await this.alertManager.sendAlert({
                    rule: rule.name,
                    metric: metricName,
                    value,
                    threshold: rule.threshold,
                    severity: rule.severity,
                    timestamp: Date.now()
                });
            }
        }
    }

    private evaluateRule(rule: AlertRule, value: number): boolean {
        switch (rule.operator) {
            case 'gt':
                return value > rule.threshold;
            case 'lt':
                return value < rule.threshold;
            case 'eq':
                return value === rule.threshold;
            case 'ne':
                return value !== rule.threshold;
            default:
                return false;
        }
    }
}

// 内置指标收集器
class BuiltinMetricCollectors {
    // DAU 收集器
    static createDAUCollector(db: Database): MetricCollector {
        return {
            name: 'dau',
            collect: async () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const count = await db.players.countDocuments({
                    lastLoginAt: { $gte: today }
                });

                return count;
            }
        };
    }

    // 在线人数收集器
    static createOnlineCollector(servers: ServerRegistry): MetricCollector {
        return {
            name: 'online_users',
            collect: async () => {
                const servers = await servers.getAll();
                let total = 0;

                for (const server of servers) {
                    total += server.onlineCount || 0;
                }

                return total;
            }
        };
    }

    // 收入收集器
    static createRevenueCollector(db: Database): MetricCollector {
        return {
            name: 'revenue',
            collect: async () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const result = await db.payments.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: today },
                            status: 'completed'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' }
                        }
                    }
                ]);

                return result[0]?.total || 0;
            }
        };
    }

    // 留存率收集器
    static createRetentionCollector(db: Database): MetricCollector {
        return {
            name: 'retention_d1',
            collect: async () => {
                const yesterday = new Date(Date.now() - 86400000);
                yesterday.setHours(0, 0, 0, 0);

                const twoDaysAgo = new Date(yesterday.getTime() - 86400000);

                const newUsers = await db.players.find({
                    registeredAt: {
                        $gte: twoDaysAgo,
                        $lt: yesterday
                    }
                }).toArray();

                if (newUsers.length === 0) return 0;

                const retained = newUsers.filter(p =>
                    p.lastLoginAt >= yesterday
                );

                return (retained.length / newUsers.length) * 100;
            }
        };
    }

    // 平均帧率收集器
    static createFPSCollector(servers: ServerRegistry): MetricCollector {
        return {
            name: 'avg_fps',
            collect: async () => {
                const servers = await servers.getAll();
                let totalFPS = 0;
                let count = 0;

                for (const server of servers) {
                    if (server.metrics?.fps) {
                        totalFPS += server.metrics.fps;
                        count++;
                    }
                }

                return count > 0 ? totalFPS / count : 0;
            }
        };
    }
}
```

### 2. 异常检测

```typescript
// services/monitoring/AnomalyDetector.ts
class MetricsAnomalyDetector {
    private history = new Map<string, number[]>();
    private models = new Map<string, AnomalyModel>();

    // 检测异常
    async detectAnomaly(metricName: string, value: number): Promise<AnomalyResult> {
        // 获取历史数据
        const history = this.history.get(metricName) || [];

        // 基于统计的异常检测
        const statisticalResult = this.statisticalAnomalyDetection(value, history);

        // 基于模型的异常检测
        const modelResult = await this.modelAnomalyDetection(metricName, value);

        return {
            metricName,
            value,
            isAnomaly: statisticalResult.isAnomaly || modelResult.isAnomaly,
            statisticalScore: statisticalResult.score,
            modelScore: modelResult.score,
            confidence: this.calculateConfidence(statisticalResult, modelResult)
        };
    }

    private statisticalAnomalyDetection(value: number, history: number[]): AnomalyDetection {
        if (history.length < 30) {
            return { isAnomaly: false, score: 0 };
        }

        // 计算均值和标准差
        const mean = history.reduce((a, b) => a + b) / history.length;
        const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
        const stdDev = Math.sqrt(variance);

        // Z-score
        const zScore = Math.abs((value - mean) / stdDev);

        // 3-sigma 规则
        return {
            isAnomaly: zScore > 3,
            score: zScore
        };
    }

    private async modelAnomalyDetection(metricName: string, value: number): Promise<AnomalyDetection> {
        const model = this.models.get(metricName);

        if (!model) {
            return { isAnomaly: false, score: 0 };
        }

        // 使用模型预测
        const predicted = await model.predict(value);
        const error = Math.abs(value - predicted);
        const threshold = model.getThreshold();

        return {
            isAnomaly: error > threshold,
            score: error / threshold
        };
    }

    // 训练异常检测模型
    async trainModel(metricName: string, data: number[]): Promise<void> {
        // 准备训练数据
        const X = [];
        const y = [];

        for (let i = 10; i < data.length; i++) {
            X.push(data.slice(i - 10, i));
            y.push(data[i]);
        }

        // 训练模型（使用 ARIMA 或 LSTM）
        const model = new ARIMA({ p: 1, d: 1, q: 1 });
        await model.fit(X, y);

        this.models.set(metricName, model);
    }
}
```

## 用户行为自动化

### 1. 用户分层系统

```typescript
// services/users/SegmentationEngine.ts
interface SegmentRule {
    id: string;
    name: string;
    description: string;
    conditions: SegmentCondition[];
    actions: SegmentAction[];
}

interface SegmentCondition {
    type: 'property' | 'behavior' | 'cohort';
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
    value: any;
}

interface SegmentAction {
    type: 'tag' | 'push' | 'email' | 'reward' | 'restrict';
    config: any;
}

class UserSegmentationEngine {
    private rules = new Map<string, SegmentRule>();
    private userSegments = new Map<string, Set<string>>();

    // 运行用户分层
    async runSegmentation(): Promise<void> {
        // 清空现有分层
        this.userSegments.clear();

        // 获取所有用户
        const users = await this.getAllUsers();

        // 应用所有规则
        for (const [ruleId, rule] of this.rules) {
            const matchedUsers = new Set<string>();

            for (const user of users) {
                if (await this.matchRule(user, rule)) {
                    matchedUsers.add(user.id);
                }
            }

            this.userSegments.set(ruleId, matchedUsers);

            // 执行动作
            await this.executeActions(ruleId, matchedUsers);
        }
    }

    private async matchRule(user: User, rule: SegmentRule): Promise<boolean> {
        // 检查所有条件（AND）
        for (const condition of rule.conditions) {
            const matched = await this.matchCondition(user, condition);
            if (!matched) {
                return false;
            }
        }

        return true;
    }

    private async matchCondition(user: User, condition: SegmentCondition): Promise<boolean> {
        switch (condition.type) {
            case 'property':
                return this.matchProperty(user, condition);

            case 'behavior':
                return await this.matchBehavior(user, condition);

            case 'cohort':
                return await this.matchCohort(user, condition);

            default:
                return false;
        }
    }

    private matchProperty(user: User, condition: SegmentCondition): boolean {
        const value = (user as any)[condition.property];

        switch (condition.operator) {
            case 'eq':
                return value === condition.value;
            case 'gt':
                return value > condition.value;
            case 'lt':
                return value < condition.value;
            case 'gte':
                return value >= condition.value;
            case 'lte':
                return value <= condition.value;
            case 'in':
                return condition.value.includes(value);
            case 'not_in':
                return !condition.value.includes(value);
            default:
                return false;
        }
    }

    private async matchBehavior(user: User, condition: SegmentCondition): Promise<boolean> {
        const behavior = await this.db.userBehavior.findOne({
            userId: user.id,
            type: condition.behaviorType
        });

        if (!behavior) {
            return condition.operator === 'eq' && condition.value === 0;
        }

        return this.matchProperty(behavior, condition);
    }

    private async matchCohort(user: User, condition: SegmentCondition): Promise<boolean> {
        // 队列分析
        const cohortUsers = await this.getCohort(condition.cohortId);
        return cohortUsers.includes(user.id);
    }

    // 预定义用户分层规则
    getBuiltinRules(): SegmentRule[] {
        return [
            {
                id: 'whales',
                name: '大R玩家',
                description: '累计充值超过1000元',
                conditions: [
                    { type: 'property', property: 'totalPurchase', operator: 'gte', value: 100000 }
                ],
                actions: [
                    { type: 'tag', config: { tags: ['whale', 'vip'] } },
                    { type: 'push', config: { priority: 'high' } }
                ]
            },
            {
                id: 'dolphins',
                name: '中R玩家',
                description: '累计充值100-1000元',
                conditions: [
                    { type: 'property', property: 'totalPurchase', operator: 'gte', value: 10000 },
                    { type: 'property', property: 'totalPurchase', operator: 'lt', value: 100000 }
                ],
                actions: [
                    { type: 'tag', config: { tags: ['dolphin'] } },
                    { type: 'push', config: { priority: 'medium' } }
                ]
            },
            {
                id: 'minnows',
                name: '小R玩家',
                description: '累计充值小于100元',
                conditions: [
                    { type: 'property', property: 'totalPurchase', operator: 'lt', value: 10000 }
                ],
                actions: [
                    { type: 'tag', config: { tags: ['minnow'] } },
                    { type: 'push', config: { priority: 'low' } }
                ]
            },
            {
                id: 'churn_risk',
                name: '流失风险',
                description: '7天未登录',
                conditions: [
                    { type: 'behavior', behaviorType: 'login', operator: 'lt', value: 7 }
                ],
                actions: [
                    { type: 'tag', config: { tags: ['churn_risk'] } },
                    { type: 'email', config: { template: 'win_back' } }
                ]
            },
            {
                id: 'new_users',
                name: '新用户',
                description: '注册7天内',
                conditions: [
                    { type: 'property', property: 'registeredAt', operator: 'gte', value: Date.now() - 7 * 86400000 }
                ],
                actions: [
                    { type: 'tag', config: { tags: ['new'] } },
                    { type: 'reward', config: { rewards: [{ itemId: 'welcome_gift', count: 1 }] } }
                ]
            }
        ];
    }
}
```

### 2. 自动化运营

```typescript
// services/operations/AutomationEngine.ts
class GameAutomationEngine {
    private workflows = new Map<string, Workflow>();

    // 注册工作流
    registerWorkflow(workflow: Workflow): void {
        this.workflows.set(workflow.id, workflow);
    }

    // 执行工作流
    async executeWorkflow(workflowId: string, context: any): Promise<WorkflowResult> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        const state: WorkflowState = {
            currentStep: 0,
            context,
            history: []
        };

        try {
            // 执行所有步骤
            for (let i = 0; i < workflow.steps.length; i++) {
                state.currentStep = i;
                const step = workflow.steps[i];

                const result = await this.executeStep(step, state.context);
                state.history.push({ step: i, result });
                state.context = { ...state.context, ...result.data };

                // 检查条件
                if (step.condition && !this.evaluateCondition(step.condition, state.context)) {
                    break;
                }
            }

            return {
                workflowId,
                success: true,
                context: state.context,
                stepsCompleted: state.history.length
            };

        } catch (error) {
            return {
                workflowId,
                success: false,
                error: error.message,
                stepsCompleted: state.history.length
            };
        }
    }

    private async executeStep(step: WorkflowStep, context: any): Promise<StepResult> {
        switch (step.type) {
            case 'http_request':
                return await this.executeHTTPRequest(step, context);

            case 'delay':
                return await this.executeDelay(step);

            case 'condition':
                return this.evaluateConditionBranch(step, context);

            case 'loop':
                return await this.executeLoop(step, context);

            case 'database':
                return await this.executeDatabaseOperation(step, context);

            case 'notification':
                return await this.executeNotification(step, context);

            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }

    // 内置工作流
    getBuiltinWorkflows(): Workflow[] {
        return [
            {
                id: 'welcome_series',
                name: '新用户欢迎系列',
                description: '新用户注册后发送系列消息',
                trigger: { type: 'event', event: 'user.registered' },
                steps: [
                    {
                        type: 'delay',
                        duration: 0 // 立即执行
                    },
                    {
                        type: 'notification',
                        notification: {
                            type: 'in_game',
                            template: 'welcome_message_1'
                        }
                    },
                    {
                        type: 'delay',
                        duration: 86400000 // 1天后
                    },
                    {
                        type: 'notification',
                        notification: {
                            type: 'push',
                            template: 'welcome_message_2'
                        }
                    },
                    {
                        type: 'delay',
                        duration: 86400000 // 再1天后
                    },
                    {
                        type: 'notification',
                        notification: {
                            type: 'email',
                            template: 'welcome_guide'
                        }
                    }
                ]
            },
            {
                id: 'purchase_reminder',
                name: '购买提醒',
                description: '购物车放弃提醒',
                trigger: { type: 'event', event: 'cart.abandoned' },
                steps: [
                    {
                        type: 'delay',
                        duration: 1800000 // 30分钟后
                    },
                    {
                        type: 'notification',
                        notification: {
                            type: 'in_game',
                            template: 'cart_reminder_1'
                        }
                    },
                    {
                        type: 'condition',
                        condition: {
                            type: 'check_purchased',
                            property: 'purchased'
                        },
                        onFalse: [
                            {
                                type: 'delay',
                                duration: 86400000 // 1天后
                            },
                            {
                                type: 'notification',
                                notification: {
                                    type: 'push',
                                    template: 'cart_reminder_2'
                                }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'level_up_congratulate',
                name: '升级祝贺',
                description: '玩家升级时发送祝贺',
                trigger: { type: 'event', event: 'player.level_up' },
                steps: [
                    {
                        type: 'notification',
                        notification: {
                            type: 'in_game',
                            template: 'level_up_congratulations'
                        }
                    },
                    {
                        type: 'reward',
                        reward: {
                            type: 'level_up_bonus',
                            calculate: true
                        }
                    }
                ]
            }
        ];
    }
}
```

## A/B 测试系统

### 1. 实验配置

```typescript
// services/experiment/ExperimentManager.ts
interface Experiment {
    id: string;
    name: string;
    description: string;
    startTime: Date;
    endTime?: Date;
    variants: Variant[];
    traffic: number; // 0-1
    metrics: string[];
    segments?: string[]; // 用户分层
}

interface Variant {
    id: string;
    name: string;
    traffic: number; // 0-1
    config: any;
}

class ExperimentManager {
    private experiments = new Map<string, Experiment>();
    private userAssignments = new Map<string, Map<string, string>>();

    // 分配用户到实验变体
    async assignUser(experimentId: string, userId: string): Promise<Variant | null> {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return null;
        }

        // 检查实验是否有效
        if (!this.isExperimentActive(experiment)) {
            return null;
        }

        // 检查流量比例
        if (!this.shouldIncludeInExperiment(experiment, userId)) {
            return null;
        }

        // 获取或创建分配
        if (!this.userAssignments.has(experimentId)) {
            this.userAssignments.set(experimentId, new Map());
        }

        const assignments = this.userAssignments.get(experimentId)!;

        if (assignments.has(userId)) {
            // 已分配，返回对应变体
            const variantId = assignments.get(userId)!;
            return experiment.variants.find(v => v.id === variantId)!;
        }

        // 新分配
        const variant = this.selectVariant(experiment, userId);
        assignments.set(userId, variant.id);

        // 记录分配事件
        await this.trackEvent('experiment_assignment', {
            experimentId,
            variantId: variant.id,
            userId
        });

        return variant;
    }

    private selectVariant(experiment: Experiment, userId: string): Variant {
        // 基于用户ID的哈希分配
        const hash = this.hashUserId(userId, experiment.id);
        let trafficSum = 0;
        const random = hash % 100 / 100;

        for (const variant of experiment.variants) {
            trafficSum += variant.traffic;
            if (random <= trafficSum) {
                return variant;
            }
        }

        // 默认返回第一个变体
        return experiment.variants[0];
    }

    private hashUserId(userId: string, experimentId: string): number {
        const str = `${userId}-${experimentId}`;
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash);
    }

    // 获取实验结果
    async getExperimentResults(experimentId: string): Promise<ExperimentResults> {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment not found: ${experimentId}`);
        }

        const results: ExperimentResults = {
            experimentId,
            startTime: experiment.startTime,
            variants: []
        };

        for (const variant of experiment.variants) {
            const variantResult = await this.analyzeVariant(experiment, variant);
            results.variants.push(variantResult);
        }

        // 计算统计显著性
        results.significance = this.calculateSignificance(results.variants);

        return results;
    }

    private async analyzeVariant(experiment: Experiment, variant: Variant): Promise<VariantResult> {
        const result: VariantResult = {
            variantId: variant.id,
            name: variant.name,
            users: 0,
            metrics: {}
        };

        // 获取该变体的用户数
        const assignments = this.userAssignments.get(experiment.id);
        if (assignments) {
            result.users = Array.from(assignments.values())
                .filter(v => v === variant.id).length;
        }

        // 分析每个指标
        for (const metric of experiment.metrics) {
            const metricValue = await this.calculateMetric(experiment.id, variant.id, metric);
            result.metrics[metric] = metricValue;
        }

        return result;
    }

    private async calculateMetric(experimentId: string, variantId: string, metric: string): Promise<MetricValue> {
        // 从分析系统获取指标数据
        const data = await this.analytics.getMetric({
            experimentId,
            variantId,
            metric
        });

        return {
            value: data.value,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            confidence: data.confidence || 0
        };
    }

    private calculateSignificance(variants: VariantResult[]): SignificanceTest {
        if (variants.length !== 2) {
            return { test: 'none', significant: false };
        }

        // T检验或Z检验
        const control = variants[0];
        const treatment = variants[1];

        const controlMetric = control.metrics[Object.keys(control.metrics)[0]];
        const treatmentMetric = treatment.metrics[Object.keys(treatment.metrics)[0]];

        // 简化的显著性检验
        const pValue = this.tTest(controlMetric.value, treatmentMetric.value);

        return {
            test: 't_test',
            significant: pValue < 0.05,
            pValue,
            confidence: 1 - pValue
        };
    }
}
```

## 总结

游戏运营自动化工作流的核心要点：

1. **活动自动化**：活动配置引擎、模板系统
2. **数据监控**：实时指标、异常检测
3. **用户分层**：自动分层、精准运营
4. **自动化运营**：工作流引擎、事件触发
5. **A/B测试**：实验管理、结果分析
6. **消息推送**：多渠道触达、个性化

自动化工作流可以大幅提升运营效率，让运营人员专注于策略而非执行。

---

**相关工具：**
- [Cron 表达式生成](https://www.util.cn/tools/cron/)
- [UUID 生成器](https://www.util.cn/tools/uuid-generator/)
