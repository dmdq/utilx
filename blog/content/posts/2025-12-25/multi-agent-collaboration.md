---
title: "多智能体协作系统：构建团队协作式AI应用"
summary: "深入探讨多Agent协作系统的设计架构、通信机制和协调策略，让多个AI智能体像人类团队一样高效协作完成复杂任务。"
date: 2025-12-25T16:00:00+08:00
draft: false
tags: ["AI Agent", "多智能体", "协作系统", "LLM", "CrewAI"]
categories: ["AI开发"]
author: "有条工具团队"
---

单个AI Agent的能力有限，就像单个人无法完成复杂项目一样。多智能体协作系统（Multi-Agent Collaboration）让多个专门的Agent像人类团队一样协作，每个Agent发挥专长，共同完成复杂任务。

## 为什么需要多Agent协作

### 单Agent的局限

```typescript
// 单个Agent试图完成所有任务 - 效率低下
class SingleAgent {
  async buildWebsite(requirements: string): Promise<Website> {
    // 1. 分析需求
    const analysis = await this.analyze(requirements);

    // 2. 设计UI - 不擅长
    const design = await this.designUI(analysis);

    // 3. 编写前端代码 - 还可以
    const frontend = await this.writeFrontend(design);

    // 4. 编写后端API - 不擅长
    const backend = await this.writeBackend(analysis);

    // 5. 测试 - 不全面
    const tests = await this.writeTests(frontend, backend);

    // 结果：每个环节都做，但都不够专业
  }
}
```

### 多Agent协作的优势

```typescript
// 多个专业Agent协作 - 各司其职
class MultiAgentTeam {
  private agents = {
    pm: new ProductManagerAgent(),      // 需求分析
    designer: new DesignerAgent(),       // UI设计
    frontend: new FrontendAgent(),       // 前端开发
    backend: new BackendAgent(),         // 后端开发
    qa: new QAAgent()                    // 测试
  };

  async buildWebsite(requirements: string): Promise<Website> {
    // 1. PM分析需求
    const spec = await this.agents.pm.analyze(requirements);

    // 2. 设计师设计UI
    const design = await this.agents.designer.createUI(spec);

    // 3. 前后端并行开发
    const [frontend, backend] = await Promise.all([
      this.agents.frontend.build(design),
      this.agents.backend.build(spec)
    ]);

    // 4. QA测试
    const report = await this.agents.qa.test(frontend, backend);

    return { frontend, backend, report };
  }
}
```

## 核心架构

### Agent角色定义

```typescript
// Agent角色接口
interface AgentRole {
  name: string;
  description: string;
  expertise: string[];
  responsibilities: string[];
  capabilities: Capability[];
}

// 预定义角色库
const AgentRoles = {
  PRODUCT_MANAGER: {
    name: 'Product Manager',
    description: '负责需求分析、项目规划和团队协调',
    expertise: ['需求分析', '项目管理', '沟通协调'],
    responsibilities: [
      '理解和分析用户需求',
      '制定项目计划',
      '协调团队资源',
      '跟踪项目进度'
    ],
    capabilities: [
      'analyze_requirements',
      'create_specification',
      'coordinate_team',
      'generate_report'
    ]
  },

  RESEARCHER: {
    name: 'Researcher',
    description: '负责信息收集和数据分析',
    expertise: ['信息检索', '数据分析', '报告撰写'],
    responsibilities: [
      '收集相关信息',
      '分析数据',
      '生成研究报告'
    ],
    capabilities: [
      'web_search',
      'data_analysis',
      'code_interpreter',
      'generate_report'
    ]
  },

  DEVELOPER: {
    name: 'Developer',
    description: '负责代码编写和实现',
    expertise: ['编程', '代码审查', '调试'],
    responsibilities: [
      '编写高质量代码',
      '进行代码审查',
      '修复Bug',
      '优化性能'
    ],
    capabilities: [
      'write_code',
      'review_code',
      'debug',
      'optimize'
    ]
  },

  DESIGNER: {
    name: 'Designer',
    description: '负责用户界面和体验设计',
    expertise: ['UI设计', 'UX设计', '原型制作'],
    responsibilities: [
      '设计用户界面',
      '创建交互原型',
      '优化用户体验'
    ],
    capabilities: [
      'create_wireframe',
      'design_ui',
      'create_prototype',
      'user_research'
    ]
  },

  TESTER: {
    name: 'QA Tester',
    description: '负责质量保证和测试',
    expertise: ['测试', 'Bug发现', '自动化测试'],
    responsibilities: [
      '编写测试用例',
      '执行测试',
      '报告Bug',
      '验证修复'
    ],
    capabilities: [
      'write_test',
      'automated_test',
      'manual_test',
      'generate_report'
    ]
  }
};
```

### Agent基类

```typescript
// Agent基类
abstract class BaseAgent {
  abstract role: AgentRole;
  protected llm: LLMClient;
  protected memory: AgentMemory;
  protected tools: Map<string, Tool>;

  constructor(config: AgentConfig) {
    this.llm = config.llm;
    this.memory = config.memory;
    this.tools = new Map();

    // 注册角色专用工具
    this.registerTools(config.tools || []);
  }

  // 执行任务
  async execute(task: Task, context: Context): Promise<TaskResult> {
    // 1. 理解任务
    const understanding = await this.understand(task, context);

    // 2. 制定计划
    const plan = await this.plan(understanding);

    // 3. 执行计划
    const result = await this.executePlan(plan);

    // 4. 反思改进
    await this.reflect(task, result);

    return result;
  }

  // 与其他Agent通信
  async sendMessage(
    to: Agent,
    message: AgentMessage
  ): Promise<AgentMessage> {
    // 通过协调器转发消息
    return await this.coordinator.route(this, to, message);
  }

  // 处理来自其他Agent的消息
  async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'task_request':
        return await this.handleTaskRequest(message);
      case 'task_result':
        return await this.handleTaskResult(message);
      case 'query':
        return await this.handleQuery(message);
      case 'notification':
        return await this.handleNotification(message);
    }
  }

  // 子类实现具体能力
  protected abstract understand(task: Task, context: Context): Promise<Understanding>;
  protected abstract plan(understanding: Understanding): Promise<Plan>;
  protected abstract executePlan(plan: Plan): Promise<TaskResult>;

  private registerTools(tools: Tool[]): void {
    for (const tool of tools) {
      this.tools.set(tool.name, tool);
    }
  }
}
```

## 协作模式

### 1. 层级协作模式

```typescript
// 协调器Agent - 管理整个工作流
class CoordinatorAgent extends BaseAgent {
  role = AgentRoles.PRODUCT_MANAGER;
  private teamMembers: Map<string, BaseAgent> = new Map();

  async execute(project: Project): Promise<ProjectResult> {
    // 1. 分解项目为任务
    const tasks = await this.decomposeProject(project);

    // 2. 分配任务给合适的Agent
    const assignments = await this.assignTasks(tasks);

    // 3. 协调执行
    const results = await this.coordinateExecution(assignments);

    // 4. 整合结果
    return await this.integrateResults(results);
  }

  private async decomposeProject(project: Project): Promise<Task[]> {
    const prompt = `
分解以下项目为具体的任务：

项目描述：${project.description}
预算：${project.budget}
截止日期：${project.deadline}

为每个任务提供：
- 任务描述
- 所需技能
- 预估时间
- 依赖关系
`;

    const response = await this.llm.complete(prompt);
    return this.parseTasks(response);
  }

  private async assignTasks(tasks: Task[]): Promise<Assignment[]> {
    const assignments: Assignment[] = [];

    for (const task of tasks) {
      // 找到最合适的Agent
      const agent = await this.findBestAgent(task);

      assignments.push({
        task,
        agent: agent.role.name,
        estimatedTime: task.estimatedTime,
        dependencies: task.dependencies
      });
    }

    return this.buildExecutionOrder(assignments);
  }

  private async coordinateExecution(
    assignments: Assignment[]
  ): Promise<Map<string, TaskResult>> {
    const results = new Map<string, TaskResult>();
    const completed = new Set<string>();

    // 按依赖关系顺序执行
    for (const assignment of assignments) {
      // 等待依赖任务完成
      await this.waitForDependencies(
        assignment.dependencies,
        completed
      );

      // 分配任务给Agent
      const agent = this.teamMembers.get(assignment.agent);

      if (!agent) {
        throw new Error(`Agent ${assignment.agent} not found`);
      }

      // 执行任务
      const result = await agent.execute(
        assignment.task,
        { previousResults: results }
      );

      results.set(assignment.task.id, result);
      completed.add(assignment.task.id);

      // 通知其他Agent进度更新
      await this.notifyProgress(assignment.task.id, result);
    }

    return results;
  }

  private async findBestAgent(task: Task): Promise<BaseAgent> {
    // 评估每个Agent的能力匹配度
    const candidates = Array.from(this.teamMembers.values());

    const scores = await Promise.all(
      candidates.map(async agent => {
        const score = await this.evaluateCapability(
          agent,
          task.requiredSkills
        );
        return { agent, score };
      })
    );

    // 返回最匹配的Agent
    return scores.sort((a, b) => b.score - a.score)[0].agent;
  }
}
```

### 2. 平等协作模式

```typescript
// 对等协作 - 所有Agent地位平等
class PeerCollaboration {
  private agents: BaseAgent[];
  private sharedContext: SharedContext;

  async solve(problem: Problem): Promise<Solution> {
    // 1. 所有Agent独立思考
    const proposals = await Promise.all(
      this.agents.map(agent =>
        agent.generateProposal(problem, this.sharedContext)
      )
    );

    // 2. 共享和讨论提案
    const discussion = await this.conductDiscussion(proposals);

    // 3. 投票选择最佳方案
    const selected = await this.voteOnProposals(discussion);

    // 4. 协作实施
    return await this.collaborativeImplement(selected);
  }

  private async conductDiscussion(
    proposals: Proposal[]
  ): Promise<Discussion> {
    const discussion: Discussion = {
      rounds: []
    };

    // 多轮讨论
    for (let round = 0; round < 3; round++) {
      const comments: Comment[] = [];

      for (const agent of this.agents) {
        // 每个Agent对其他提案发表意见
        const comment = await agent.evaluateProposals(
          proposals,
          discussion
        );

        comments.push({
          agent: agent.role.name,
          content: comment,
          timestamp: Date.now()
        });
      }

      discussion.rounds.push({ round, comments });

      // 根据讨论更新提案
      proposals = await this.updateProposals(
        proposals,
        discussion
      );
    }

    return discussion;
  }

  private async voteOnProposals(
    discussion: Discussion
  ): Promise<Proposal> {
    // 每个Agent投票
    const votes = await Promise.all(
      this.agents.map(async agent => {
        const preference = await agent.rankProposals(
          discussion
        );
        return {
          agent: agent.role.name,
          preference
        };
      })
    );

    // 计算票数
    return this.tallyVotes(votes);
  }
}
```

### 3. 流水线协作模式

```typescript
// 流水线协作 - 任务按顺序在不同Agent间流转
class PipelineCollaboration {
  private pipeline: Agent[];

  constructor(pipelineConfig: PipelineConfig) {
    this.pipeline = this.buildPipeline(pipelineConfig);
  }

  async process(input: any): Promise<any> {
    let currentOutput = input;

    // 依次通过每个Agent
    for (const agent of this.pipeline) {
      try {
        // Agent处理输入
        const result = await agent.process(currentOutput);

        // 验证输出
        const validation = await this.validateOutput(
          agent,
          result
        );

        if (!validation.valid) {
          // 请求Agent修正
          result = await agent.fix(validation.errors);
        }

        currentOutput = result;
      } catch (error) {
        // 处理失败，决定是否继续
        const shouldContinue = await this.handleFailure(
          agent,
          error,
          currentOutput
        );

        if (!shouldContinue) {
          throw error;
        }
      }
    }

    return currentOutput;
  }

  // 示例：内容创作流水线
  static async createContentPipeline(): Promise<PipelineCollaboration> {
    return new PipelineCollaboration({
      stages: [
        {
          agent: new ResearcherAgent(),
          name: 'research',
          validate: (output) => output.facts?.length > 0
        },
        {
          agent: new WriterAgent(),
          name: 'draft',
          validate: (output) => output.wordCount > 500
        },
        {
          agent: new EditorAgent(),
          name: 'edit',
          validate: (output) => output.grammarScore > 0.9
        },
        {
          agent: new DesignerAgent(),
          name: 'format',
          validate: (output) => output.formatted === true
        }
      ]
    });
  }
}
```

## 通信机制

### 消息协议

```typescript
// Agent消息格式
interface AgentMessage {
  id: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'task_request' | 'task_result' | 'query' | 'response' | 'notification';
  payload: any;
  priority: 'low' | 'normal' | 'high';
  correlationId?: string;
}

// 消息总线
class AgentMessageBus {
  private queues = new Map<string, AgentMessage[]>();
  private handlers = new Map<string, MessageHandler[]>();

  // 发送消息
  async send(message: AgentMessage): Promise<void> {
    const queue = this.queues.get(message.to);

    if (queue) {
      queue.push(message);

      // 通知接收者
      const handlers = this.handlers.get(message.to) || [];
      for (const handler of handlers) {
        await handler(message);
      }
    }
  }

  // 广播消息
  async broadcast(
    from: string,
    message: any,
    exclude: string[] = []
  ): Promise<void> {
    for (const [agentId] of this.queues) {
      if (!exclude.includes(agentId)) {
        await this.send({
          id: uuidv4(),
          from,
          to: agentId,
          timestamp: Date.now(),
          type: 'notification',
          payload: message,
          priority: 'normal'
        });
      }
    }
  }

  // 订阅消息
  subscribe(agentId: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(agentId) || [];
    handlers.push(handler);
    this.handlers.set(agentId, handlers);
  }

  // 请求-响应模式
  async request(
    from: string,
    to: string,
    payload: any,
    timeout: number = 30000
  ): Promise<any> {
    const correlationId = uuidv4();

    return new Promise((resolve, reject) => {
      // 设置响应监听
      const timer = setTimeout(() => {
        this.unsubscribe(correlationId);
        reject(new Error('Request timeout'));
      }, timeout);

      this.subscribe(correlationId, async (message) => {
        if (message.correlationId === correlationId) {
          clearTimeout(timer);
          this.unsubscribe(correlationId);
          resolve(message.payload);
        }
      });

      // 发送请求
      this.send({
        id: uuidv4(),
        from,
        to,
        timestamp: Date.now(),
        type: 'query',
        payload,
        correlationId,
        priority: 'normal'
      });
    });
  }
}
```

### 共享记忆

```typescript
// Agent共享工作记忆
class SharedMemory {
  private facts = new Map<string, any>();
  private context = new Map<string, any>();
  private history: MemoryEvent[] = [];

  // 存储事实（全局可见）
  async storeFact(key: string, value: any, source: string): Promise<void> {
    this.facts.set(key, value);

    this.history.push({
      type: 'fact_stored',
      key,
      source,
      timestamp: Date.now()
    });
  }

  // 检索事实
  async retrieveFact(key: string): Promise<any> {
    return this.facts.get(key);
  }

  // 更新上下文
  async updateContext(updates: Record<string, any>, agent: string): Promise<void> {
    for (const [key, value] of Object.entries(updates)) {
      this.context.set(key, value);
    }

    this.history.push({
      type: 'context_updated',
      updates,
      agent,
      timestamp: Date.now()
    });
  }

  // 获取完整上下文
  async getContext(): Promise<Record<string, any>> {
    return Object.fromEntries(this.context);
  }

  // 搜索相关记忆
  async search(query: string, k: number = 5): Promise<MemoryEvent[]> {
    const all = [...this.history].reverse();

    // 使用向量搜索
    const embedding = await this.embed(query);

    const results = all
      .map(event => ({
        event,
        similarity: this.cosineSimilarity(
          embedding,
          event.embedding
        )
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    return results.map(r => r.event);
  }
}
```

## 冲突解决

```typescript
// 冲突检测和解决
class ConflictResolver {
  async detectConflict(
    proposals: Proposal[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // 检测方案冲突
    for (let i = 0; i < proposals.length; i++) {
      for (let j = i + 1; j < proposals.length; j++) {
        const conflict = await this.compareProposals(
          proposals[i],
          proposals[j]
        );

        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  async resolveConflict(
    conflict: Conflict,
    agents: BaseAgent[]
  ): Promise<Resolution> {
    // 策略1：投票决定
    const vote = await this.vote(conflict, agents);

    if (vote.consensus > 0.7) {
      return {
        method: 'vote',
        outcome: vote.winner
      };
    }

    // 策略2：协商融合
    const merged = await this.mergeProposals(
      conflict.proposals
    );

    return {
      method: 'merge',
      outcome: merged
    };

    // 策略3：引入仲裁者
    // const arbitrator = new ArbitratorAgent();
    // return await arbitrator.resolve(conflict);
  }
}
```

## 实战案例：软件开发团队

```typescript
// 完整的软件开发多Agent系统
class SoftwareDevelopmentTeam {
  private coordinator: CoordinatorAgent;
  private messageBus: AgentMessageBus;
  private sharedMemory: SharedMemory;

  constructor() {
    this.messageBus = new AgentMessageBus();
    this.sharedMemory = new SharedMemory();

    // 创建团队成员
    const pm = new ProductManagerAgent({
      llm: new ClaudeClient(),
      memory: this.sharedMemory,
      tools: [new WebSearchTool(), new FileIOTool()]
    });

    const designer = new DesignerAgent({
      llm: new ClaudeClient(),
      memory: this.sharedMemory,
      tools: [new WireframeTool(), new ColorSchemeTool()]
    });

    const frontend = new FrontendDeveloperAgent({
      llm: new ClaudeClient(),
      memory: this.sharedMemory,
      tools: [new ReactTool(), new TailwindTool()]
    });

    const backend = new BackendDeveloperAgent({
      llm: new ClaudeClient(),
      memory: this.sharedMemory,
      tools: [new NodejsTool(), new PostgresTool()]
    });

    const qa = new QAAgent({
      llm: new ClaudeClient(),
      memory: this.sharedMemory,
      tools: [new TestFrameworkTool(), new LintingTool()]
    });

    // 注册团队成员
    this.coordinator = new CoordinatorAgent({
      llm: new ClaudeClient(),
      memory: this.sharedMemory
    });

    this.coordinator.addAgent('pm', pm);
    this.coordinator.addAgent('designer', designer);
    this.coordinator.addAgent('frontend', frontend);
    this.coordinator.addAgent('backend', backend);
    this.coordinator.addAgent('qa', qa);
  }

  async buildProject(requirements: string): Promise<ProjectResult> {
    // 1. PM分析需求
    const spec = await this.coordinator.delegate(
      'pm',
      'analyze_requirements',
      { requirements }
    );

    // 存储到共享记忆
    await this.sharedMemory.storeFact('spec', spec, 'pm');

    // 2. 设计和开发并行
    const [design, api] = await Promise.all([
      this.coordinator.delegate('designer', 'design_ui', spec),
      this.coordinator.delegate('backend', 'design_api', spec)
    ]);

    // 3. 前端实现
    const frontend = await this.coordinator.delegate(
      'frontend',
      'implement',
      { design, api }
    );

    // 4. 后端实现
    const backend = await this.coordinator.delegate(
      'backend',
      'implement',
      api
    );

    // 5. 集成测试
    const testResult = await this.coordinator.delegate(
      'qa',
      'integrate_test',
      { frontend, backend }
    );

    return {
      spec,
      design,
      frontend,
      backend,
      testResult
    };
  }
}

// 使用示例
const team = new SoftwareDevelopmentTeam();

const result = await team.buildProject(`
  创建一个任务管理应用
  - 用户可以创建、编辑、删除任务
  - 支持任务分类和标签
  - 有拖拽排序功能
  - 需要深色模式
`);

console.log(result);
```

## 最佳实践

1. **明确角色定位**：每个Agent有清晰的职责边界
2. **有效通信**：设计清晰的消息协议
3. **共享上下文**：维护团队共享记忆
4. **优雅降级**：单个Agent失败不影响整体
5. **可观测性**：记录所有决策和协作过程
6. **人类介入**：关键决策点请求人类确认

多智能体协作系统正在开启AI应用的新篇章，让AI不再是单点工具，而是能够协同工作的智能团队。
