---
title: "AI Agent架构设计模式：从单一智能到群体协作"
summary: "深入探讨AI Agent的架构设计模式，涵盖ReAct、CoT、多智能体协作等核心模式，帮助开发者构建更强大的AI应用系统。"
date: 2025-12-30T08:00:00+08:00
draft: false
tags: ["AI Agent", "LLM", "架构设计", "多智能体", "ReAct"]
categories: ["AI开发"]
author: "有条工具团队"
---

随着大语言模型（LLM）的快速发展，AI Agent已成为构建智能应用的核心范式。从单一的工具调用到复杂的多智能体协作，Agent架构正在经历快速演进。

## Agent基础架构

### 核心组件

一个完整的AI Agent系统包含以下核心组件：

```python
from typing import TypedDict, List, Callable, Any
from abc import ABC, abstractmethod
from dataclasses import dataclass

class Message(TypedDict):
    role: str  # 'system' | 'user' | 'assistant' | 'tool'
    content: str
    tool_calls: List[dict] = []

class Tool(ABC):
    """工具抽象基类"""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        pass

@dataclass
class AgentConfig:
    """Agent配置"""
    name: str
    model: str
    temperature: float = 0.7
    max_tokens: int = 2000
    tools: List[Tool] = None
    system_prompt: str = ""

class BaseAgent(ABC):
    """Agent基类"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.memory: List[Message] = []
        self.tools = {tool.name: tool for tool in (config.tools or [])}

    @abstractmethod
    async def think(self, input: str) -> str:
        """思考并生成响应"""
        pass

    @abstractmethod
    async def act(self, action: str) -> Any:
        """执行动作"""
        pass

    async def run(self, input: str) -> str:
        """运行Agent"""
        response = await self.think(input)
        return response
```

## ReAct模式

推理-行动（Reasoning + Acting）模式是最基础的Agent架构：

```python
import re
import json

class ReActAgent(BaseAgent):
    """ReAct模式Agent"""

    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.max_iterations = 10

    async def think(self, input: str) -> str:
        """ReAct思考循环"""
        # 构建系统提示
        system_prompt = f"""你是一个有帮助的AI助手。你可以使用以下工具：

{self._get_tools_description()}

请按照以下格式思考：

Thought: 我应该...
Action: 工具名称[参数]
Observation: 工具返回结果
... (可以重复Thought/Action/Observation多次)
Thought: 我现在知道最终答案了
Answer: 最终答案

开始吧！"""

        # 初始化对话
        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=input)
        ]

        iteration = 0
        while iteration < self.max_iterations:
            # 调用LLM
            response = await self._call_llm(messages)
            messages.append(Message(role="assistant", content=response))

            # 解析响应
            thought_match = re.search(r'Thought:\s*(.*?)(?=\n(?:Action|Answer)|$)', response, re.DOTALL)
            action_match = re.search(r'Action:\s*(.*?)\[(.*?)\]', response)
            answer_match = re.search(r'Answer:\s*(.*)', response, re.DOTALL)

            if thought_match:
                thought = thought_match.group(1).strip()
                print(f"Thought: {thought}")

            if action_match:
                tool_name = action_match.group(1).strip()
                tool_args_str = action_match.group(2).strip()

                # 解析参数
                try:
                    tool_args = json.loads(tool_args_str)
                except:
                    tool_args = {"input": tool_args_str}

                # 执行工具
                if tool_name in self.tools:
                    observation = await self.tools[tool_name].execute(**tool_args)
                    messages.append(Message(
                        role="user",
                        content=f"Observation: {observation}"
                    ))
                    print(f"Action: {tool_name}{tool_args}")
                    print(f"Observation: {observation}")

            if answer_match:
                answer = answer_match.group(1).strip()
                print(f"Answer: {answer}")
                return answer

            iteration += 1

        return "未能找到答案"

    def _get_tools_description(self) -> str:
        """获取工具描述"""
        descriptions = []
        for name, tool in self.tools.items():
            descriptions.append(f"- {name}: {tool.description}")
        return "\n".join(descriptions)

    async def _call_llm(self, messages: List[Message]) -> str:
        """调用LLM（示例实现）"""
        # 这里集成实际的LLM API
        # 返回模拟响应
        return "Thought: 我需要使用工具\nAction: search[query]"

    async def act(self, action: str) -> Any:
        """执行动作"""
        pass
```

## 链式思维（Chain of Thought）

CoT通过引导模型展示推理过程来提升性能：

```python
class CoTAgent(BaseAgent):
    """链式思维Agent"""

    async def think(self, input: str) -> str:
        """使用链式思维思考"""

        cot_prompt = f"""请一步步思考这个问题：

问题：{input}

让我们一步步分析：

1. 首先，让我理解问题的核心...
2. 然后，我需要考虑...
3. 接下来...
4. 最后，得出结论...

请完成上述思考过程。"""

        # 零样本CoT
        response = await self._call_llm([
            Message(role="user", content=cot_prompt)
        ])

        return response

    async def think_with_examples(self, input: str) -> str:
        """少样本CoT（提供示例）"""

        examples = """
示例1：
问题：小明有3个苹果，小红有5个苹果，他们一共有多少个苹果？
思考：
- 小明有3个苹果
- 小红有5个苹果
- 总数 = 3 + 5 = 8个苹果
答案：8个苹果

示例2：
问题：一个数乘以3等于15，这个数是多少？
思考：
- 设这个数为x
- x × 3 = 15
- x = 15 ÷ 3 = 5
答案：5
"""

        cot_prompt = f"""{examples}

问题：{input}
思考："""

        return await self._call_llm([
            Message(role="user", content=cot_prompt)
        ])

    async def _call_llm(self, messages: List[Message]) -> str:
        """调用LLM"""
        pass
```

## 多智能体协作

复杂任务需要多个Agent协作完成：

```python
from enum import Enum
import asyncio

class AgentRole(Enum):
    """Agent角色"""
    PLANNER = "planner"      # 规划者
    RESEARCHER = "researcher" # 研究者
    CODER = "coder"          # 编码者
    REVIEWER = "reviewer"     # 审查者
    SUMMARIZER = "summarizer" # 总结者

@dataclass
class Task:
    """任务定义"""
    id: str
    description: str
    requirements: List[str]
    status: str = "pending"
    result: Any = None

class MultiAgentSystem:
    """多智能体协作系统"""

    def __init__(self):
        self.agents: Dict[AgentRole, BaseAgent] = {}
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.completed_tasks: List[Task] = []

    def register_agent(self, role: AgentRole, agent: BaseAgent):
        """注册Agent"""
        self.agents[role] = agent

    async def execute_task(self, task: Task) -> Task:
        """执行任务（多Agent协作）"""

        print(f"\n{'='*50}")
        print(f"开始执行任务: {task.description}")
        print(f"{'='*50}\n")

        # 1. 规划阶段
        if AgentRole.PLANNER in self.agents:
            print("[阶段1] 规划")
            planner = self.agents[AgentRole.PLANNER]
            plan = await planner.run(f"""
            为以下任务制定详细执行计划：
            任务描述：{task.description}
            要求：{', '.join(task.requirements)}

            请输出：
            1. 任务分解
            2. 执行步骤
            3. 所需资源
            4. 风险评估
            """)
            print(f"规划结果：\n{plan}\n")

        # 2. 研究阶段
        if AgentRole.RESEARCHER in self.agents:
            print("[阶段2] 研究")
            researcher = self.agents[AgentRole.RESEARCHER]
            research = await researcher.run(f"""
            研究任务相关背景信息：
            {task.description}

            请提供：
            1. 技术背景
            2. 最佳实践
            3. 参考资源
            """)
            print(f"研究结果：\n{research}\n")

        # 3. 执行阶段
        if AgentRole.CODER in self.agents:
            print("[阶段3] 执行")
            coder = self.agents[AgentRole.CODER]
            result = await coder.run(f"""
            根据以下信息实现任务：
            任务：{task.description}
            计划：{plan if AgentRole.PLANNER in self.agents else 'N/A'}
            研究：{research if AgentRole.RESEARCHER in self.agents else 'N/A'}

            请提供完整的实现。
            """)
            task.result = result
            print(f"执行结果：\n{result}\n")

        # 4. 审查阶段
        if AgentRole.REVIEWER in self.agents:
            print("[阶段4] 审查")
            reviewer = self.agents[AgentRole.REVIEWER]
            review = await reviewer.run(f"""
            审查以下实现：
            任务：{task.description}
            实现：{result}

            请评估：
            1. 正确性
            2. 性能
            3. 安全性
            4. 可维护性
            """)
            print(f"审查结果：\n{review}\n")

        # 5. 总结阶段
        if AgentRole.SUMMARIZER in self.agents:
            print("[阶段5] 总结")
            summarizer = self.agents[AgentRole.SUMMARIZER]
            summary = await summarizer.run(f"""
            总结整个任务执行过程：
            任务：{task.description}
            结果：{result}
            审查：{review}

            请提供：
            1. 执行总结
            2. 关键收获
            3. 改进建议
            """)
            print(f"总结：\n{summary}\n")

        task.status = "completed"
        self.completed_tasks.append(task)

        print(f"{'='*50}")
        print(f"任务完成！")
        print(f"{'='*50}\n")

        return task

    async def run_workflow(self, tasks: List[Task]):
        """运行工作流"""

        # 并行执行独立任务
        await asyncio.gather(*[
            self.execute_task(task)
            for task in tasks
        ])

        return self.completed_tasks
```

## 工具调用模式

```python
from typing import get_type_hints
import inspect

class ToolRegistry:
    """工具注册表"""

    def __init__(self):
        self.tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        """注册工具"""
        self.tools[tool.name] = tool

    def get_tool_schema(self) -> List[dict]:
        """获取工具Schema（用于OpenAI Function Calling）"""

        schemas = []
        for tool in self.tools.values():
            schema = {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": self._extract_parameters(tool)
                }
            }
            schemas.append(schema)

        return schemas

    def _extract_parameters(self, tool: Tool) -> dict:
        """从工具中提取参数Schema"""

        # 获取execute方法的签名
        sig = inspect.signature(tool.execute)
        parameters = {}

        required = []
        properties = {}

        for name, param in sig.parameters.items():
            if name == 'self':
                continue

            param_type = param.annotation

            # 类型映射
            type_map = {
                str: "string",
                int: "integer",
                float: "number",
                bool: "boolean",
                list: "array",
                dict: "object"
            }

            json_type = type_map.get(param_type, "string")

            property_def = {"type": json_type}

            if param.default == inspect.Parameter.empty:
                required.append(name)

            properties[name] = property_def

        return {
            "type": "object",
            "properties": properties,
            "required": required
        }

class FunctionCallingAgent(BaseAgent):
    """函数调用Agent"""

    def __init__(self, config: AgentConfig, registry: ToolRegistry):
        super().__init__(config)
        self.registry = registry

    async def think(self, input: str) -> str:
        """使用函数调用思考"""

        messages = [
            Message(role="system", content=self.config.system_prompt),
            Message(role="user", content=input)
        ]

        while True:
            # 调用LLM（带函数调用）
            response = await self._call_llm_with_tools(
                messages,
                tools=self.registry.get_tool_schema()
            )

            # 处理响应
            if response.get("tool_calls"):
                messages.append(Message(
                    role="assistant",
                    content="",
                    tool_calls=response["tool_calls"]
                ))

                # 执行工具调用
                for tool_call in response["tool_calls"]:
                    tool_name = tool_call["function"]["name"]
                    tool_args = json.loads(tool_call["function"]["arguments"])

                    if tool_name in self.registry.tools:
                        result = await self.registry.tools[tool_name].execute(**tool_args)

                        messages.append(Message(
                            role="tool",
                            content=str(result),
                            tool_call_id=tool_call["id"]
                        ))
            else:
                # 最终响应
                return response.get("content", "")

    async def _call_llm_with_tools(self, messages: List[Message], tools: List[dict]) -> dict:
        """调用LLM（带工具）"""
        # 集成实际的LLM API
        pass
```

## 记忆系统

```python
from datetime import datetime
from typing import Optional

class Memory:
    """记忆抽象"""

    def __init__(self, content: str, importance: float = 0.5):
        self.content = content
        self.importance = importance  # 0-1
        self.timestamp = datetime.now()
        self.access_count = 0

class MemorySystem:
    """Agent记忆系统"""

    def __init__(self, max_short_term: int = 100, max_long_term: int = 1000):
        self.short_term: List[Memory] = []  # 短期记忆
        self.long_term: List[Memory] = []   # 长期记忆
        self.max_short_term = max_short_term
        self.max_long_term = max_long_term

    async def add(self, memory: Memory, importance: Optional[float] = None):
        """添加记忆"""

        if importance is not None:
            memory.importance = importance

        # 根据重要性决定存储位置
        if memory.importance > 0.7:
            self.long_term.append(memory)
            # 长期记忆排序（按重要性）
            self.long_term.sort(key=lambda m: m.importance, reverse=True)
            # 保持大小限制
            if len(self.long_term) > self.max_long_term:
                self.long_term = self.long_term[:self.max_long_term]
        else:
            self.short_term.append(memory)
            if len(self.short_term) > self.max_short_term:
                self.short_term.pop(0)

    async def retrieve(self, query: str, top_k: int = 5) -> List[Memory]:
        """检索相关记忆"""

        # 合并所有记忆
        all_memories = self.short_term + self.long_term

        # 简单的关键词匹配（实际应使用向量相似度）
        relevant = [
            memory for memory in all_memories
            if any(word in memory.content.lower() for word in query.lower().split())
        ]

        # 按重要性和最近访问排序
        relevant.sort(
            key=lambda m: (m.importance, m.access_count),
            reverse=True
        )

        return relevant[:top_k]

    def summarize(self) -> str:
        """总结记忆"""

        summary_parts = []

        if self.short_term:
            summary_parts.append(f"短期记忆: {len(self.short_term)}条")

        if self.long_term:
            important = [m for m in self.long_term if m.importance > 0.8]
            summary_parts.append(f"重要记忆: {len(important)}条")

        return "; ".join(summary_parts)

class MemoryAgent(BaseAgent):
    """带记忆的Agent"""

    def __init__(self, config: AgentConfig, memory: MemorySystem):
        super().__init__(config)
        self.memory = memory

    async def think(self, input: str) -> str:
        """带记忆的思考"""

        # 检索相关记忆
        relevant_memories = await self.memory.retrieve(input)

        # 构建上下文
        context = f"""相关记忆：
{chr(10).join(f"- {m.content}" for m in relevant_memories)}

当前问题：{input}
"""

        # 生成响应
        response = await self._call_llm([
            Message(role="user", content=context)
        ])

        # 存储新记忆
        await self.memory.add(Memory(
            content=f"Q: {input}\nA: {response}",
            importance=0.5
        ))

        return response

    async def _call_llm(self, messages: List[Message]) -> str:
        """调用LLM"""
        pass
```

## Agent评估

```python
class AgentEvaluator:
    """Agent评估器"""

    async def evaluate(
        self,
        agent: BaseAgent,
        test_cases: List[dict]
    ) -> dict:
        """
        test_cases: [
            {
                "input": "问题",
                "expected_output": "预期输出",
                "criteria": ["准确性", "完整性", "相关性"]
            }
        ]
        """

        results = {
            "total": len(test_cases),
            "success": 0,
            "failed": 0,
            "avg_score": 0,
            "details": []
        }

        total_score = 0

        for case in test_cases:
            # 执行
            try:
                output = await agent.run(case["input"])

                # 评估
                score = await self._score_output(
                    output,
                    case["expected_output"],
                    case.get("criteria", [])
                )

                detail = {
                    "input": case["input"],
                    "output": output,
                    "expected": case["expected_output"],
                    "score": score,
                    "success": score > 0.6
                }

                results["details"].append(detail)
                total_score += score

                if score > 0.6:
                    results["success"] += 1
                else:
                    results["failed"] += 1

            except Exception as e:
                results["failed"] += 1
                results["details"].append({
                    "input": case["input"],
                    "error": str(e)
                })

        results["avg_score"] = total_score / len(test_cases)

        return results

    async def _score_output(
        self,
        output: str,
        expected: str,
        criteria: List[str]
    ) -> float:
        """评分"""

        # 简单实现：检查关键词匹配
        expected_keywords = set(expected.lower().split())
        output_keywords = set(output.lower().split())

        overlap = len(expected_keywords & output_keywords)
        coverage = overlap / len(expected_keywords) if expected_keywords else 0

        return coverage
```

## 最佳实践

1. **明确角色定位**：每个Agent应有清晰的职责
2. **合理拆分任务**：复杂任务分解为可管理的子任务
3. **工具选择**：提供高质量的工具集
4. **记忆管理**：区分短期和长期记忆
5. **迭代优化**：持续评估和改进

AI Agent架构正在快速发展，掌握这些核心模式将帮助开发者构建更强大的AI应用。
