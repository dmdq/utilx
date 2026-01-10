---
title: "AI Agent工作流编排：从LangChain到AutoGPT的实战指南"
date: 2026-01-06T12:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨AI Agent工作流编排技术，包括LangChain Chains、Agent Orchestration、AutoGPT模式、CrewAI等主流框架，以及如何构建复杂的多步骤AI Agent系统"
tags: ["AI Agent", "LangChain", "工作流编排", "AutoGPT", "LLM应用"]
categories: ["人工智能", "AI Agent"]
---

## 引言

AI Agent的强大能力来自于其工作流编排能力——将复杂任务分解为多个步骤，并智能地协调执行。从简单的链式调用到复杂的多Agent协作，工作流编排是Agent系统的核心。本文将深入探讨主流的Agent编排框架和实战技巧。

## LangChain Chains

### 基础Chain

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import OpenAI

# 创建LLM
llm = OpenAI(temperature=0)

# 创建Prompt模板
prompt_template = PromptTemplate(
    input_variables=["product"],
    template="为{product}写一段吸引人的产品描述。"
)

# 创建Chain
chain = LLMChain(llm=llm, prompt=prompt_template)

# 运行
description = chain.run(product="智能手表")
print(description)
```

### Sequential Chain

```python
from langchain.chains import SequentialChain

# Chain 1: 生成产品名称
name_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["product_type"],
        template="为{product_type}产品想一个创意名称，只返回名称。"
    ),
    output_key="product_name"
)

# Chain 2: 生成Slogan
slogan_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["product_name"],
        template="为{product_name}写一句简短有力的广告语。"
    ),
    output_key="slogan"
)

# Chain 3: 生成完整描述
description_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["product_name", "slogan"],
        template="产品名称：{product_name}\n广告语：{slogan}\n请基于以上信息写一段100字的产品描述。"
    ),
    output_key="description"
)

# 组合Chain
overall_chain = SequentialChain(
    chains=[name_chain, slogan_chain, description_chain],
    input_variables=["product_type"],
    output_variables=["product_name", "slogan", "description"]
)

# 执行
result = overall_chain("智能手表")
print(result)
# {
#   'product_name': 'TimePulse',
#   'slogan': 'TimePulse - 让时间更有价值',
#   'description': '...'
# }
```

### Conditional Chain

```python
from langchain.chains import TransformChain

# 条件判断函数
def categorize_price(inputs: dict) -> dict:
    price = inputs.get('price', 0)

    if price < 100:
        category = "low"
    elif price < 500:
        category = "medium"
    else:
        category = "high"

    return {"price_category": category}

# 条件Chain
price_categorize_chain = TransformChain(
    transform=categorize_price,
    input_variables=["price"],
    output_variables=["price_category"]
)

# 不同价格段的不同处理
low_price_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["product"],
        template="{product}是经济实惠的选择，适合预算有限的用户。写一段强调性价比的描述。"
    )
)

high_price_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["product"],
        template="{product}是高端产品，强调其品质和独特价值。写一段描述。"
    )
)

from langchain.chains import RouterChain

# 路由Chain
router_chain = RouterChain(
    chains={
        "low": low_price_chain,
        "medium": medium_price_chain,
        "high": high_price_chain
    },
    default_chain=medium_price_chain
)
```

### LCEL (LangChain Expression Language)

```python
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# 使用LCEL构建Chain
prompt = PromptTemplate.from_template(
    "Tell me a joke about {topic}"
)

# 使用管道操作符 (|)
chain = (
    prompt
    | llm
    | StrOutputParser()
)

# 等价于
chain = prompt | llm | StrOutputParser()

# 执行
result = chain.invoke({"topic": "programming"})
print(result)

# 复杂的LCEL示例
from langchain_community.utilities import WikipediaSearch

wiki_search = WikipediaSearch()

research_chain = (
    {
        "context": lambda x: wiki_search.run(x["topic"]),
        "topic": RunnablePassthrough()
    }
    | PromptTemplate.from_template(
        "Topic: {topic}\n\nResearch: {context}\n\nBased on the research, explain {topic} in simple terms."
    )
    | llm
    | StrOutputParser()
)
```

## LangChain Agents

### ReAct Agent

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_openai import OpenAI

# 定义工具
def search_tool(query: str) -> str:
    """搜索工具"""
    # 实际应用中调用搜索API
    return f"搜索'{query}'的结果：..."

def calculator_tool(expression: str) -> str:
    """计算器工具"""
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except:
        return "计算错误"

tools = [
    Tool(
        name="Search",
        func=search_tool,
        description="用于搜索网络信息，输入应该是搜索查询"
    ),
    Tool(
        name="Calculator",
        func=calculator_tool,
        description="用于数学计算，输入应该是数学表达式"
    )
]

# 创建Agent
llm = OpenAI(temperature=0)

prompt = PromptTemplate.from_template(
    """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought: {agent_scratchpad}"""
)

agent = create_react_agent(
    llm=llm,
    tools=tools,
    prompt=prompt
)

# 创建Agent执行器
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=5
)

# 执行
result = agent_executor.invoke({
    "input": "苹果公司现在的股价是多少？如果我有100股，总价值多少？"
})

print(result["output"])
```

### Custom Agent

```python
from langchain.agents import AgentExecutor, BaseSingleActionAgent
from langchain_openai import BaseOpenAI

class CustomAgent(BaseSingleActionAgent):
    """自定义Agent"""

    llm: BaseOpenAI
    tools: list[Tool]

    @property
    def input_keys(self):
        return ["input"]

    def plan(
        self,
        intermediate_steps: list[tuple[str, str]],
        **kwargs: Any
    ) -> tuple[AgentAction, str]:
        """规划下一步行动"""
        user_input = kwargs["input"]

        # 构建思考过程
        thoughts = ""

        for action, observation in intermediate_steps:
            thoughts += f"Action: {action.tool}\n"
            thoughts += f"Input: {action.tool_input}\n"
            thoughts += f"Observation: {observation}\n"

        # 让LLM决定下一步
        prompt = f"""
        输入: {user_input}

        之前的步骤:
        {thoughts}

        可用工具: {[tool.name for tool in self.tools]}

        请决定下一步行动，格式为：
        Action: [工具名称]
        Input: [工具输入]
        或如果已完成：
        Final Answer: [最终答案]
        """

        response = self.llm.predict(prompt)

        # 解析响应
        if "Final Answer:" in response:
            final_answer = response.split("Final Answer:")[-1].strip()
            return AgentAction(
                tool="FINAL",
                tool_input=final_answer,
                log=response
            ), final_answer

        else:
            # 提取Action和Input
            action_line = [l for l in response.split("\n") if "Action:" in l][0]
            input_line = [l for l in response.split("\n") if "Input:" in l][0]

            tool_name = action_line.split("Action:")[-1].strip()
            tool_input = input_line.split("Input:")[-1].strip()

            return AgentAction(
                tool=tool_name,
                tool_input=tool_input,
                log=response
            ), ""

    async def aplan(
        self,
        intermediate_steps: list[tuple[str, str]],
        **kwargs: Any
    ) -> tuple[AgentAction, str]:
        """异步规划"""
        return self.plan(intermediate_steps, **kwargs)

# 使用自定义Agent
custom_agent = CustomAgent(
    llm=OpenAI(temperature=0),
    tools=tools
)

agent_executor = AgentExecutor(
    agent=custom_agent,
    tools=tools
)

result = agent_executor.invoke({"input": "查询北京今天的天气"})
```

## AutoGPT模式

### 基础AutoGPT实现

```python
from typing import List, Dict
import json

class AutoGPTAgent:
    """AutoGPT风格的Agent"""

    def __init__(
        self,
        name: str,
        role: str,
        goals: List[str],
        llm,
        tools: Dict[str, callable]
    ):
        self.name = name
        self.role = role
        self.goals = goals
        self.llm = llm
        self.tools = tools
        self.memory = []
        self.task_list = []

    def think(self) -> Dict:
        """思考下一步行动"""
        prompt = f"""
        Name: {self.name}
        Role: {self.role}
        Goals: {', '.join(self.goals)}

        Memory:
        {self.format_memory()}

        Current Tasks:
        {self.format_tasks()}

        请决定下一步行动。返回JSON格式：
        {{
            "thought": "思考过程",
            "reasoning": "推理过程",
            "plan": "计划",
            "criticism": "自我批评",
            "action": "行动名称",
            "action_input": "行动输入"
        }}
        """

        response = self.llm.generate(prompt)

        try:
            return json.loads(response)
        except:
            return {
                "thought": "解析错误",
                "action": "finish",
                "action_input": ""
            }

    def execute(self, action: str, action_input: str) -> str:
        """执行行动"""
        if action == "finish":
            return "任务完成"

        if action in self.tools:
            result = self.tools[action](action_input)

            # 记录到记忆
            self.memory.append({
                "action": action,
                "input": action_input,
                "result": result
            })

            return result
        else:
            return f"未知行动: {action}"

    def format_memory(self) -> str:
        """格式化记忆"""
        if not self.memory:
            return "No memories yet."

        return "\n".join([
            f"- {m['action']}: {m['input']} -> {m['result'][:100]}"
            for m in self.memory[-5:]
        ])

    def format_tasks(self) -> str:
        """格式化任务列表"""
        if not self.task_list:
            return "No tasks."

        return "\n".join([
            f"{i+1}. {task}"
            for i, task in enumerate(self.task_list)
        ])

    def run(self, max_iterations: int = 10) -> str:
        """运行Agent"""
        for i in range(max_iterations):
            # 思考
            thought_process = self.think()

            print(f"\n=== Iteration {i+1} ===")
            print(f"Thought: {thought_process['thought']}")
            print(f"Reasoning: {thought_process['reasoning']}")
            print(f"Plan: {thought_process['plan']}")
            print(f"Criticism: {thought_process['criticism']}")

            # 执行
            action = thought_process['action']
            action_input = thought_process['action_input']

            result = self.execute(action, action_input)
            print(f"Action: {action}")
            print(f"Result: {result[:200]}")

            # 检查是否完成
            if action == "finish":
                return result

        return "达到最大迭代次数"

# 使用示例
def search_web(query: str) -> str:
    """搜索网络"""
    return f"搜索'{query}'的结果..."

def write_file(content: str) -> str:
    """写入文件"""
    return "文件已写入"

def read_file(filename: str) -> str:
    """读取文件"""
    return f"文件{filename}的内容..."

tools = {
    "search": search_web,
    "write": write_file,
    "read": read_file
}

agent = AutoGPTAgent(
    name="Researcher",
    role="AI研究员",
    goals=["研究最新AI技术", "生成研究报告"],
    llm=OpenAI(temperature=0),
    tools=tools
)

result = agent.run()
print(result)
```

### BabyAGI模式

```python
class BabyAGI:
    """BabyAGI实现"""

    def __init__(
        self,
        objective: str,
        llm,
        tools: Dict[str, callable],
        max_iterations: int = 10
    ):
        self.objective = objective
        self.llm = llm
        self.tools = tools
        self.max_iterations = max_iterations
        self.task_list = []
        self.completed_tasks = []

    def create_initial_tasks(self) -> List[str]:
        """创建初始任务列表"""
        prompt = f"""
        目标: {self.objective}

        请为这个目标创建一个任务列表。返回JSON数组格式：
        ["任务1", "任务2", "任务3"]
        """

        response = self.llm.generate(prompt)

        try:
            tasks = json.loads(response)
            return tasks
        except:
            return ["研究相关资料", "分析问题", "制定方案"]

    def prioritize_tasks(self) -> List[str]:
        """任务优先级排序"""
        if not self.task_list:
            return []

        prompt = f"""
        目标: {self.objective}

        当前任务列表:
        {json.dumps(self.task_list, ensure_ascii=False)}

        已完成任务:
        {json.dumps(self.completed_tasks[-5:], ensure_ascii=False)}

        请根据当前情况重新排列任务优先级。
        返回JSON数组格式（从高到低）：
        ["任务1", "任务2", ...]
        """

        response = self.llm.generate(prompt)

        try:
            return json.loads(response)
        except:
            return self.task_list

    def execute_task(self, task: str) -> str:
        """执行任务"""
        prompt = f"""
        目标: {self.objective}

        任务: {task}

        请执行这个任务并返回结果。
        如果需要使用工具，请说明：
        - search: 搜索信息
        - calculate: 计算数据
        - write: 写入内容
        """

        response = self.llm.generate(prompt)

        # 记录完成的任务
        self.completed_tasks.append({
            "task": task,
            "result": response
        })

        return response

    def run(self) -> Dict:
        """运行BabyAGI"""
        # 创建初始任务
        self.task_list = self.create_initial_tasks()

        for i in range(self.max_iterations):
            if not self.task_list:
                print("所有任务已完成！")
                break

            # 优先级排序
            self.task_list = self.prioritize_tasks()

            # 执行第一个任务
            current_task = self.task_list[0]
            print(f"\n=== 迭代 {i+1} ===")
            print(f"当前任务: {current_task}")

            result = self.execute_task(current_task)
            print(f"执行结果: {result[:200]}")

            # 从列表中移除
            self.task_list.pop(0)

        return {
            "objective": self.objective,
            "completed_tasks": self.completed_tasks
        }

# 使用
baby_agi = BabyAGI(
    objective="研究并总结2024年AI大模型的最新进展",
    llm=OpenAI(temperature=0),
    tools=tools
)

result = baby_agi.run()
```

## CrewAI多Agent协作

### Crew定义

```python
from crewai import Agent, Task, Crew, Process

# 定义Agent
researcher = Agent(
    role='研究员',
    goal='研究最新的AI技术趋势',
    backstory="""你是一位经验丰富的AI研究员，
    专注于追踪和分析最新的AI技术发展""",
    verbose=True,
    tools=[search_tool, wikipedia_tool]
)

writer = Agent(
    role='技术作家',
    goal='将复杂的技术内容转化为易懂的文章',
    backstory="""你是一位技术写作专家，
    擅长将技术细节转化为吸引人的内容""",
    verbose=True
)

reviewer = Agent(
    role='内容审核员',
    goal='确保内容准确、完整、有价值',
    backstory="""你是一位资深的内容审核专家，
    对技术内容的质量有极高要求""",
    verbose=True
)

# 定义任务
research_task = Task(
    description="""研究2024年大语言模型的最新发展，
    包括GPT-4、Claude、Gemini等模型的更新""",
    expected_output='详细的研究报告，包含关键发现和技术突破',
    agent=researcher
)

write_task = Task(
    description="""基于研究报告，撰写一篇关于2024年LLM发展的技术文章。
    文章应该面向技术读者，但保持通俗易懂""",
    expected_output='结构完整、内容丰富的技术文章（1000-1500字）',
    agent=writer
)

review_task = Task(
    description="""审核技术文章，确保：
    1. 技术准确性
    2. 内容完整性
    3. 可读性
    4. 价值性

    提供修改建议和最终评价""",
    expected_output='详细的审核报告，包含修改建议和最终评分',
    agent=reviewer
)

# 创建Crew
tech_crew = Crew(
    agents=[researcher, writer, reviewer],
    tasks=[research_task, write_task, review_task],
    process=Process.sequential,  # 顺序执行
    verbose=True
)

# 执行
result = tech_crew.kickoff()
print(result)
```

### 并行Process

```python
# 定义并行任务
crew_parallel = Crew(
    agents=[agent1, agent2, agent3],
    tasks=[task1, task2, task3],
    process=Process.parallel,  # 并行执行
    verbose=True
)

# 或者使用层级Process
crew_hierarchical = Crew(
    agents=[manager_agent, worker_agent1, worker_agent2],
    tasks=[manager_task, worker_task1, worker_task2],
    process=Process.hierarchical,  # 层级执行
    manager_llm=OpenAI(temperature=0),
    verbose=True
)
```

## Agent编排框架对比

### LangGraph

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

# 定义状态
class AgentState(TypedDict):
    input: str
    research: str
    draft: str
    review: str
    final: str

# 创建图
workflow = StateGraph(AgentState)

# 添加节点
def research_node(state: AgentState) -> AgentState:
    result = researcher_agent.run(state["input"])
    return {**state, "research": result}

def write_node(state: AgentState) -> AgentState:
    result = writer_agent.run(state["research"])
    return {**state, "draft": result}

def review_node(state: AgentState) -> AgentState:
    result = reviewer_agent.run(state["draft"])
    return {**state, "review": result}

# 添加节点到图
workflow.add_node("researcher", research_node)
workflow.add_node("writer", write_node)
workflow.add_node("reviewer", review_node)

# 添加边
workflow.set_entry_point("researcher")
workflow.add_edge("researcher", "writer")
workflow.add_edge("writer", "reviewer")
workflow.add_edge("reviewer", END)

# 编译图
app = workflow.compile()

# 执行
result = app.invoke({"input": "研究AI最新进展"})
```

### Semantic Kernel

```python
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
from semantic_kernel.planning import SequentialPlanner

# 初始化Kernel
kernel = Kernel()
kernel.add_chat_service(
    "chat-gpt",
    OpenAIChatCompletion("gpt-4", api_key="...")
)

# 定义技能（Skill）
from semantic_kernel.skill_definition import sk_function

class ResearchSkills:
    @sk_function(description="搜索信息")
    def search(self, query: str) -> str:
        return f"搜索'{query}'的结果..."

    @sk_function(description="总结内容")
    def summarize(self, content: str) -> str:
        return f"总结: {content[:100]}..."

# 注册技能
kernel.import_skill(ResearchSkills(), skill_name="research")

# 创建计划器
planner = SequentialPlanner(kernel)

# 执行计划
ask = "研究2024年AI技术进展并生成报告"
plan = await planner.create_plan_async(ask)

result = await plan.invoke_async(kernel)
print(result)
```

## 实战案例

### 案例一：智能研究报告生成

```python
class ReportGenerator:
    """智能报告生成器"""

    def __init__(self):
        self.llm = OpenAI(temperature=0)
        self.tools = self._init_tools()

    def _init_tools(self) -> Dict[str, callable]:
        return {
            "search": self._search,
            "analyze": self._analyze,
            "write": self._write,
            "format": self._format
        }

    def generate_report(self, topic: str) -> str:
        """生成报告"""

        # 阶段1：研究
        research_data = self._research_stage(topic)

        # 阶段2：分析
        analysis = self._analysis_stage(research_data)

        # 阶段3：撰写
        draft = self._writing_stage(analysis)

        # 阶段4：审阅
        final_report = self._review_stage(draft)

        return final_report

    def _research_stage(self, topic: str) -> Dict:
        """研究阶段"""
        # 生成研究计划
        plan = self.llm.generate(f"""
        为"{topic}"创建一个研究计划，
        包含需要研究的关键点。
        """)

        # 执行研究
        research_data = {}
        for key_point in plan.split('\n'):
            if key_point.strip():
                result = self._search(key_point.strip())
                research_data[key_point.strip()] = result

        return research_data

    def _analysis_stage(self, data: Dict) -> str:
        """分析阶段"""
        prompt = f"""
        分析以下研究数据：

        {json.dumps(data, ensure_ascii=False, indent=2)}

        提供关键发现和洞察。
        """

        return self.llm.generate(prompt)

    def _writing_stage(self, analysis: str) -> str:
        """撰写阶段"""
        prompt = f"""
        基于以下分析，撰写一份专业的研究报告：

        {analysis}

        报告应该包含：
        1. 执行摘要
        2. 背景介绍
        3. 主要发现
        4. 结论和建议
        """

        return self.llm.generate(prompt)

    def _review_stage(self, draft: str) -> str:
        """审阅阶段"""
        prompt = f"""
        审阅以下报告草稿：

        {draft}

        提供改进建议并进行必要的修改。
        """

        reviewed = self.llm.generate(prompt)
        return reviewed

    def _search(self, query: str) -> str:
        """搜索实现"""
        # 实际调用搜索API
        return f"关于'{query}'的搜索结果..."
```

### 案例二：客户服务自动化

```python
class CustomerServiceAgent:
    """客户服务Agent"""

    def __init__(self):
        self.llm = OpenAI(temperature=0.7)
        self.knowledge_base = self._load_kb()
        self.conversation_history = {}

    def handle_customer_query(
        self,
        customer_id: str,
        query: str
    ) -> str:
        """处理客户查询"""

        # 获取历史对话
        history = self.conversation_history.get(customer_id, [])

        # 检索相关知识
        relevant_docs = self._retrieve_knowledge(query)

        # 理解意图
        intent = self._classify_intent(query)

        # 生成响应
        response = self._generate_response(
            query=query,
            intent=intent,
            history=history,
            knowledge=relevant_docs
        )

        # 更新历史
        history.append({"role": "user", "content": query})
        history.append({"role": "assistant", "content": response})
        self.conversation_history[customer_id] = history[-10:]

        return response

    def _classify_intent(self, query: str) -> str:
        """分类意图"""
        prompt = f"""
        分类以下客户查询的意图：

        查询: {query}

        可能的意图：
        1. 产品咨询
        2. 订单查询
        3. 投诉建议
        4. 售后服务
        5. 其他

        只返回意图名称。
        """

        return self.llm.generate(prompt).strip()

    def _retrieve_knowledge(self, query: str) -> List[str]:
        """检索相关知识"""
        # 使用向量搜索
        # 简化示例
        return [
            doc for doc in self.knowledge_base
            if any(word in doc.lower() for word in query.lower().split())
        ][:3]

    def _generate_response(
        self,
        query: str,
        intent: str,
        history: List[Dict],
        knowledge: List[str]
    ) -> str:
        """生成响应"""
        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in history[-5:]
        ])

        knowledge_text = "\n".join(knowledge)

        prompt = f"""
        意图: {intent}
        知识库:
        {knowledge_text}

        对话历史:
        {history_text}

        客户查询: {query}

        请提供专业、友好的回复。
        """

        return self.llm.generate(prompt)
```

## 总结

AI Agent工作流编排是构建复杂AI应用的关键技术。从简单的LangChain Chains到复杂的Multi-Agent Systems，不同的框架和模式适用于不同的场景。

选择合适的编排框架需要考虑：
- 任务复杂度
- 团队技术栈
- 可扩展性需求
- 成本和性能

未来，Agent编排技术将更加智能化、自动化，成为AI应用开发的核心能力。

## 参考资料

- [LangChain Documentation](https://python.langchain.com/)
- [AutoGPT GitHub](https://github.com/Significant-Gravitas/AutoGPT)
- [CrewAI Documentation](https://docs.crewai.com/)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
