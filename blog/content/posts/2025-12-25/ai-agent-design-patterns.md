---
title: "AI Agent设计模式：构建智能系统的核心方法论"
summary: "深入解析AI Agent的设计模式和实现方法，包括ReAct模式、工具使用、记忆系统、规划与推理，以及如何构建可靠的Agent应用。"
date: 2025-12-25T12:00:00+08:00
draft: false
tags: ["AI Agent", "LLM", "智能体", "设计模式", "Claude"]
categories: ["AI开发"]
author: "有条工具团队"
---

AI Agent（AI智能体）代表了AI应用的新范式。与传统的聊天机器人不同，Agent能够主动理解目标、规划行动、使用工具，并与环境交互完成复杂任务。本文将系统性地介绍AI Agent的设计模式和实现方法。

## 理解AI Agent

### Agent vs Chatbot

```typescript
// 传统聊天机器人 - 被动响应
class Chatbot {
  async respond(message: string): Promise<string> {
    const response = await llm.generate(message);
    return response; // 仅返回文本
  }
}

// AI Agent - 主动执行
class Agent {
  async execute(goal: string): Promise<Result> {
    // 1. 理解目标
    const plan = await this.plan(goal);

    // 2. 执行步骤
    const results = [];
    for (const step of plan) {
      const result = await this.runStep(step);
      results.push(result);
    }

    // 3. 返回最终结果
    return this.finalize(results);
  }
}
```

### Agent的核心能力

1. **感知**：理解环境和任务
2. **推理**：规划执行路径
3. **行动**：调用工具执行操作
4. **记忆**：存储和检索信息
5. **反思**：评估和调整策略

## 核心设计模式

### 1. ReAct模式：推理+行动

ReAct（Reasoning + Acting）是最流行的Agent架构模式。

```typescript
class ReActAgent {
  private tools: Map<string, Tool>;
  private maxIterations = 10;

  async solve(task: string): Promise<string> {
    let thought = `Task: ${task}\n`;
    const history: Message[] = [];

    for (let i = 0; i < this.maxIterations; i++) {
      // 推理阶段
      const reasoning = await this.reason(thought, history);
      thought += `Thought ${i + 1}: ${reasoning}\n`;

      // 判断是否需要使用工具
      const action = await this.decideAction(reasoning);

      if (action.type === 'answer') {
        // 任务完成，返回答案
        return action.content;
      }

      // 执行行动
      const observation = await this.executeAction(action);
      thought += `Action ${i + 1}: ${action.tool}(${action.input})\n`;
      thought += `Observation ${i + 1}: ${observation}\n`;

      history.push({
        role: 'assistant',
        content: thought
      });
    }

    return thought;
  }

  private async reason(
    context: string,
    history: Message[]
  ): Promise<string> {
    const prompt = `
You are a helpful assistant. Think step by step to solve the task.

${context}

Available tools:
${this.listTools()}

Respond with your thought process.
`;
    const response = await this.llm.chat(history, prompt);
    return response;
  }

  private async decideAction(
    reasoning: string
  ): Promise<{ type: 'tool' | 'answer'; tool?: string; input?: string; content?: string }> {
    // 解析推理结果，决定下一步行动
    const decision = await this.llm.complete(`
Based on this reasoning: "${reasoning}"

Decide what to do next:
- If you need to use a tool, respond with: TOOL: tool_name: input
- If you have the final answer, respond with: ANSWER: your answer
`);
    // 解析决策...
    return this.parseDecision(decision);
  }

  private async executeAction(action: any): Promise<string> {
    const tool = this.tools.get(action.tool);
    if (!tool) {
      return `Error: Tool ${action.tool} not found`;
    }
    return await tool.execute(action.input);
  }
}
```

### 2. 工具使用（Tool Use）

```typescript
// 定义工具接口
interface Tool {
  name: string;
  description: string;
  parameters: Schema;
  execute: (input: any) => Promise<any>;
}

// 示例工具：搜索
class SearchTool implements Tool {
  name = 'web_search';
  description = 'Search the web for current information';

  parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query'
      },
      num_results: {
        type: 'number',
        description: 'Number of results to return',
        default: 5
      }
    },
    required: ['query']
  };

  async execute(input: { query: string; num_results?: number }): Promise<string> {
    const results = await this.searchEngine.search(
      input.query,
      input.num_results || 5
    );
    return JSON.stringify(results, null, 2);
  }
}

// 示例工具：代码执行
class CodeExecutionTool implements Tool {
  name = 'code_interpreter';
  description = 'Execute Python code and get the result';

  parameters = {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The Python code to execute'
      }
    },
    required: ['code']
  };

  async execute(input: { code: string }): Promise<string> {
    try {
      const result = await this.pythonRunner.run(input.code);
      return result.stdout || result.stderr || 'Execution completed';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}

// Agent使用工具
class ToolUsingAgent {
  private tools = new Map<string, Tool>();

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async execute(task: string): Promise<string> {
    // 1. 让LLM选择工具
    const toolChoice = await this.selectTool(task);

    // 2. 验证参数
    const tool = this.tools.get(toolChoice.name);
    const validated = this.validateParameters(
      tool.parameters,
      toolChoice.arguments
    );

    // 3. 执行工具
    const result = await tool.execute(validated);

    // 4. 处理结果
    return await this.processResult(result, task);
  }

  private async selectTool(task: string): Promise<any> {
    const toolsSpec = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    }));

    const prompt = `
Task: ${task}

Available tools:
${JSON.stringify(toolsSpec, null, 2)}

Select the appropriate tool and provide its arguments as JSON.
`;

    const response = await this.llm.complete(prompt);
    return JSON.parse(response);
  }
}
```

### 3. 记忆系统

```typescript
// 多层次记忆架构
class AgentMemory {
  private workingMemory: Map<string, any> = new Map(); // 短期记忆
  private episodicMemory: VectorDatabase; // 情景记忆
  private semanticMemory: KnowledgeGraph; // 语义记忆

  // 存储到工作记忆
  store(key: string, value: any): void {
    this.workingMemory.set(key, value);
  }

  // 存储重要信息到长期记忆
  async remember(
    content: string,
    metadata: any
  ): Promise<void> {
    const embedding = await this.embed(content);

    // 存储到情景记忆（按时间）
    await this.episodicMemory.add({
      content,
      embedding,
      timestamp: Date.now(),
      metadata
    });

    // 提取并存储到语义记忆（按知识）
    const facts = await this.extractFacts(content);
    for (const fact of facts) {
      await this.semanticMemory.add(fact);
    }
  }

  // 检索相关记忆
  async recall(query: string, k: number = 5): Promise<Memory[]> {
    const embedding = await this.embed(query);
    return await this.episodicMemory.search(embedding, k);
  }

  // 反思和总结
  async reflect(): Promise<void> {
    // 获取最近的记忆
    const recentMemories = await this.episodicMemory.getRecent(20);

    // 使用LLM进行反思总结
    const reflection = await this.llm.complete(`
Review these recent memories and extract key insights:

${recentMemories.map(m => m.content).join('\n')}

Provide a summary of important patterns and insights.
`);

    // 存储反思结果
    await this.remember(reflection, { type: 'reflection' });
  }
}
```

### 4. 规划与分解

```typescript
// 任务分解Agent
class PlanningAgent {
  async createPlan(goal: string): Promise<Plan> {
    // 1. 理解目标
    const understanding = await this.understandGoal(goal);

    // 2. 分解任务
    const subtasks = await this.decompose(understanding);

    // 3. 排序和依赖分析
    const ordered = this.topologicalSort(subtasks);

    // 4. 生成执行计划
    return {
      goal,
      steps: ordered,
      estimatedTime: this.estimateTime(ordered),
      requiredTools: this.identifyTools(ordered)
    };
  }

  private async decompose(goal: Goal): Promise<Subtask[]> {
    const prompt = `
Break down this goal into specific, executable subtasks:

Goal: ${goal.description}

Considerations:
- Constraints: ${goal.constraints}
- Available resources: ${goal.resources}

For each subtask, provide:
- Description
- Dependencies (which other subtasks must complete first)
- Estimated difficulty (1-10)
- Required tools
`;

    const response = await this.llm.complete(prompt);
    return this.parseSubtasks(response);
  }

  // 动态调整计划
  async adjustPlan(
    plan: Plan,
    progress: Progress
  ): Promise<Plan> {
    const feedback = `
Current plan:
${this.stringifyPlan(plan)}

Progress so far:
${this.stringifyProgress(progress)}

Issues encountered:
${progress.failures.map(f => f.error).join('\n')}

Adjust the plan to address issues and optimize for completion.
`;

    const adjustments = await this.llm.complete(feedback);
    return this.mergePlanAdjustments(plan, adjustments);
  }
}
```

## 高级Agent模式

### 自主循环Agent

```typescript
class AutonomousAgent {
  private state: AgentState;

  async run(): Promise<void> {
    while (!this.isGoalAchieved()) {
      // 1. 感知环境
      const observation = await this.perceive();

      // 2. 更新信念
      this.updateBelief(observation);

      // 3. 规划下一步
      const action = await this.plan();

      // 4. 执行行动
      const result = await this.act(action);

      // 5. 反思学习
      await this.reflect(result);

      // 6. 更新状态
      this.updateState(result);
    }
  }

  private async perceive(): Promise<Observation> {
    // 收集环境信息
    return {
      time: Date.now(),
      context: await this.getContext(),
      feedback: await this.getFeedback()
    };
  }

  private async plan(): Promise<Action> {
    // 基于当前状态和目标规划行动
    const prompt = `
Current state: ${JSON.stringify(this.state)}
Goal: ${this.goal}

Plan the next action to make progress toward the goal.
`;
    const response = await this.llm.complete(prompt);
    return this.parseAction(response);
  }
}
```

### 多Agent协作

```typescript
// Agent角色定义
interface AgentRole {
  name: string;
  expertise: string[];
  responsibilities: string[];
}

// 协作协调器
class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();

  registerAgent(agent: Agent): void {
    this.agents.set(agent.role.name, agent);
  }

  async collaborate(task: Task): Promise<Result> {
    // 1. 分析任务，确定需要的Agent
    const requiredRoles = await this.analyzeTask(task);

    // 2. 分配子任务
    const subtasks = await this.delegate(task, requiredRoles);

    // 3. 协调执行
    const results = await Promise.all(
      subtasks.map(st => this.executeSubtask(st))
    );

    // 4. 整合结果
    return await this.integrate(results);
  }

  private async executeSubtask(
    subtask: Subtask
  ): Promise<SubtaskResult> {
    const agent = this.agents.get(subtask.assignedRole);

    // 执行子任务
    const result = await agent.execute(subtask);

    // 如果需要，请求其他Agent协助
    if (result.needsCollaboration) {
      return await this.handleCollaboration(result);
    }

    return result;
  }
}
```

## 可靠性保障

### 安全限制

```typescript
class SafeAgent {
  private safetyChecks = [
    this.checkPermission,
    this.validateInput,
    this.sanitizeOutput,
    this.rateLimit
  ];

  async execute(action: Action): Promise<Result> {
    // 执行安全检查
    for (const check of this.safetyChecks) {
      const result = await check(action);
      if (!result.allowed) {
        throw new SafetyError(result.reason);
      }
    }

    // 执行行动
    return await this.performAction(action);
  }

  private async checkPermission(action: Action): Promise<SafetyResult> {
    const dangerousTools = ['file_system', 'network', 'execution'];

    if (dangerousTools.includes(action.tool)) {
      // 需要用户确认
      const confirmed = await this.requestConfirmation(action);
      if (!confirmed) {
        return { allowed: false, reason: 'User denied permission' };
      }
    }

    return { allowed: true };
  }
}
```

### 错误处理和重试

```typescript
class ResilientAgent {
  async execute(task: Task): Promise<Result> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        return await this.tryExecute(task);
      } catch (error) {
        attempts++;

        if (attempts >= maxAttempts) {
          // 最后尝试失败，请求人类帮助
          return await this.requestHumanHelp(task, error);
        }

        // 分析错误并调整策略
        const adjustment = await this.analyzeError(error);
        task = this.adjustTask(task, adjustment);
      }
    }
  }

  private async analyzeError(error: Error): Promise<Adjustment> {
    const prompt = `
The agent encountered an error:
${error.message}

Analyze the error and suggest how to adjust the approach.
`;
    const response = await this.llm.complete(prompt);
    return this.parseAdjustment(response);
  }
}
```

## 实战案例：代码审查Agent

```typescript
class CodeReviewAgent extends ReActAgent {
  constructor() {
    super();
    this.registerTool(new FileReaderTool());
    this.registerTool(new ASTParserTool());
    this.registerTool(new SecurityCheckerTool());
  }

  async review(codebase: string): Promise<ReviewReport> {
    const task = `
Review the codebase at ${codebase} for:
1. Security vulnerabilities
2. Code quality issues
3. Performance problems
4. Best practice violations

Provide a detailed report with file locations and recommendations.
`;

    return await this.solve(task);
  }
}

// 使用示例
const reviewer = new CodeReviewAgent();
const report = await reviewer.review('./src');

console.log(report.summary);
console.log(report.issues.map(i => `${i.file}:${i.line} - ${i.severity}: ${i.message}`));
```

## 最佳实践

1. **明确边界**：清晰定义Agent的能力范围
2. **工具设计**：工具应该简单、专注、可靠
3. **记忆管理**：及时清理不重要的记忆
4. **渐进式复杂**：从简单Agent开始，逐步增强
5. **人机协作**：在关键节点请求人类确认
6. **可观测性**：记录Agent的决策过程

## 工具和框架

| 工具 | 用途 | 特点 |
|------|------|------|
| LangChain | Agent框架 | 丰富的工具生态 |
| AutoGPT | 自主Agent | 目标驱动执行 |
| CrewAI | 多Agent协作 | 角色定义清晰 |
| Claude Code | 编程Agent | 深度代码理解 |

AI Agent正在重新定义人机协作的方式。掌握这些设计模式，你将能够构建更智能、更可靠的AI应用。
