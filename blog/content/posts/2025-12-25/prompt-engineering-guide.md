---
title: "Prompt工程完全指南：掌握与大语言模型沟通的艺术"
summary: "系统性地介绍Prompt工程的核心原理、设计模式、高级技巧和最佳实践，帮助你更好地驾驭LLM的能力。"
date: 2025-12-25T23:45:00+08:00
draft: false
tags: ["Prompt工程", "LLM", "AI应用", "Claude", "ChatGPT"]
categories: ["AI开发"]
author: "有条工具团队"
---

Prompt工程是与大语言模型有效沟通的核心技能。一个精心设计的prompt可以显著提升模型的输出质量和准确性。

## Prompt核心要素

### 基础结构

```python
"""
有效的Prompt结构：

┌─────────────────────────────────────┐
│ 1. 角色/上下文 (Role/Context)       │
│    - 定义AI的角色                     │
│    - 提供背景信息                     │
├─────────────────────────────────────┤
│ 2. 任务描述 (Task Description)      │
│    - 清晰说明需要完成的任务           │
│    - 定义输入和输出格式               │
├─────────────────────────────────────┤
│ 3. 约束条件 (Constraints)           │
│    - 限制和规则                       │
│    - 需要避免的内容                   │
├─────────────────────────────────────┤
│ 4. 示例 (Examples)                  │
│    - Few-shot学习示例                 │
│    - 期望的输出格式                   │
├─────────────────────────────────────┤
│ 5. 输出格式 (Output Format)         │
│    - JSON/代码/表格等                 │
└─────────────────────────────────────┘
"""

class PromptBuilder:
    """Prompt构建器"""

    def __init__(self):
        self.parts = []

    def add_role(self, role: str, description: str = ""):
        """添加角色定义"""
        self.parts.append(f"""
## 角色设定
你是一个{role}。
{f"你的职责是：{description}" if description else ""}
""".strip())
        return self

    def add_context(self, context: str):
        """添加上下文信息"""
        self.parts.append(f"""
## 背景信息
{context}
""".strip())
        return self

    def add_task(self, task: str):
        """添加任务描述"""
        self.parts.append(f"""
## 任务
{task}
""".strip())
        return self

    def add_constraints(self, constraints: list):
        """添加约束条件"""
        constraint_text = "\n".join([
            f"- {c}" for c in constraints
        ])
        self.parts.append(f"""
## 约束条件
{constraint_text}
""".strip())
        return self

    def add_examples(self, examples: list):
        """添加示例"""
        example_text = ""
        for i, ex in enumerate(examples, 1):
            example_text += f"\n### 示例 {i}\n"
            example_text += f"输入：{ex['input']}\n"
            example_text += f"输出：{ex['output']}\n"

        self.parts.append(f"""
## 示例
{example_text}
""".strip())
        return self

    def add_output_format(self, format_spec: str):
        """添加输出格式"""
        self.parts.append(f"""
## 输出格式
{format_spec}
""".strip())
        return self

    def build(self) -> str:
        """构建最终prompt"""
        return "\n\n".join(self.parts)

# 使用示例
prompt = (PromptBuilder()
    .add_role("Python代码专家", "编写高质量的Python代码")
    .add_context("用户正在开发一个Web爬虫")
    .add_task("编写一个异步的HTTP请求函数，支持超时和重试")
    .add_constraints([
        "使用asyncio库",
        "超时时间设为30秒",
        "最多重试3次",
        "要有完整的错误处理"
    ])
    .add_examples([
        {
            "input": "GET请求示例",
            "output": "..."
        }
    ])
    .add_output_format("""
```python
# 请以代码块格式输出
```""")
    .build())
```

## 高级技巧

### Chain-of-Thought Prompting

```python
class CoTPrompt:
    """思维链提示"""

    @staticmethod
    def solve_math_problem(problem: str) -> str:
        return f"""
请一步步思考以下数学问题：

问题：{problem}

请按以下格式回答：

**步骤1：** 理解问题
- 问题的已知条件是什么？
- 需要求解的是什么？

**步骤2：** 制定计划
- 应该用什么方法？
- 分哪几个步骤？

**步骤3：** 逐步计算
- 每一步的计算过程

**步骤4：** 验证答案
- 检查计算是否正确
- 答案是否合理

**最终答案：** [你的答案]
"""

    @staticmethod
    def code_debugging(code: str, error: str) -> str:
        return f"""
以下是出现错误的代码：

```代码
{code}
```

错误信息：
```
{error}
```

请按照以下步骤调试：

1. **分析错误**：这个错误是什么意思？可能的原因有哪些？

2. **检查代码**：逐行检查代码，找出可能的问题位置

3. **提出假设**：最可能的问题是什么？

4. **验证假设**：如何验证这个假设？

5. **修复方案**：提供修复后的代码

请详细说明你的思考过程。
"""
```

### Few-Shot Prompting

```python
class FewShotPrompt:
    """少样本提示"""

    @staticmethod
    def sentiment_classifier(text: str) -> str:
        examples = [
            {
                "text": "这个产品太棒了！非常喜欢！",
                "sentiment": "正面",
                "confidence": 0.95
            },
            {
                "text": "质量一般般，价格有点贵",
                "sentiment": "中性",
                "confidence": 0.6
            },
            {
                "text": "完全浪费钱，再也不买了",
                "sentiment": "负面",
                "confidence": 0.98
            }
        ]

        prompt = "以下是情感分类的示例：\n\n"

        for ex in examples:
            prompt += f"文本：{ex['text']}\n"
            prompt += f"情感：{ex['sentiment']}\n"
            prompt += f"置信度：{ex['confidence']}\n\n"

        prompt += f"现在分类以下文本：\n{text}\n\n"
        prompt += "请按以下格式输出：\n"
        prompt += "情感：[正面/中性/负面]\n"
        prompt += "置信度：[0-1之间的数字]"

        return prompt

    @staticmethod
    def code_explanation(code: str) -> str:
        return f"""
请解释以下代码的工作原理：

```代码
{code}
```

请按以下格式回答：

**1. 代码目的：**
这段代码的目的是什么？

**2. 关键概念：**
涉及哪些编程概念和技术？

**3. 逐步分析：**
逐段或逐函数解释代码逻辑

**4. 示例输出：**
给定输入X，输出是什么？

**5. 潜在问题：**
代码可能存在什么问题或可以改进的地方？
"""
```

## Structured Output

### JSON格式控制

```python
class JSONPrompt:
    """结构化输出提示"""

    @staticmethod
    def extract_entities(text: str) -> str:
        return f"""
从以下文本中提取命名实体，以JSON格式输出：

文本：{text}

请提取以下实体类型：
- 人名（PERSON）
- 组织（ORG）
- 地点（LOC）
- 日期（DATE）
- 数量（MONEY/NUMBER）

输出格式（必须是有效的JSON）：
```json
{{
  "text": "原文",
  "entities": [
    {{
      "text": "实体文本",
      "type": "实体类型",
      "start": 0,
      "end": 10
    }}
  ]
}}
```

注意：
- 确保JSON格式正确
- 所有引号和括号必须匹配
- 如果某个实体类型不存在，该字段为空数组
"""

    @staticmethod
    def data_analysis(data: str) -> str:
        return f"""
分析以下数据并生成报告，以JSON格式输出：

数据：
{data}

请生成以下格式的分析报告：
```json
{{
  "summary": "数据概览",
  "key_findings": [
    "发现1",
    "发现2",
    "发现3"
  ],
  "statistics": {{
    "total_records": 100,
    "average_value": 50.5,
    "max_value": 100,
    "min_value": 0
  }},
  "recommendations": [
    "建议1",
    "建议2"
  ]
}}
```
"""
```

## 迭代优化

### A/B测试不同Prompt

```python
class PromptOptimizer:
    """Prompt优化器"""

    def __init__(self, api_client):
        self.api = api_client
        self.results = []

    def test_prompts(self, task: str, prompts: list, test_cases: list):
        """测试多个prompt版本"""

        for prompt in prompts:
            prompt_results = []

            for test_case in test_cases:
                response = self.api.chat([
                    {"role": "user", "content": f"{prompt}\n\n{test_case['input']}"}
                ])

                # 评估输出质量
                score = self.evaluate_quality(
                    response,
                    test_case['expected']
                )

                prompt_results.append({
                    "prompt_id": prompt['id'],
                    "test_case": test_case['id'],
                    "output": response,
                    "score": score
                })

            # 计算平均分
            avg_score = sum(r['score'] for r in prompt_results) / len(prompt_results)

            self.results.append({
                "prompt": prompt,
                "avg_score": avg_score,
                "detailed_results": prompt_results
            })

        # 返回最佳prompt
        best = max(self.results, key=lambda x: x['avg_score'])
        return best['prompt']

    def evaluate_quality(self, output: str, expected: str) -> float:
        """评估输出质量"""

        # 简单方法：使用字符串相似度
        from difflib import SequenceMatcher
        similarity = SequenceMatcher(None, output, expected).ratio()

        return similarity
```

## 实战模式

### 角色扮演

```python
"""
角色扮演Prompt模板

专家角色列表：
- 技术架构师
- 代码审查员
- 产品经理
- 用户研究员
- 性能优化专家
"""

class RolePlayPrompt:
    """角色扮演提示"""

    @staticmethod
    def code_review(code: str) -> str:
        return f"""
你是一位资深的代码审查员，有20年的开发经验。

请审查以下代码：

```代码
{code}
```

请从以下几个维度进行审查：

1. **代码质量**
   - 可读性
   - 可维护性
   - 命名规范

2. **性能**
   - 时间复杂度
   - 空间复杂度
   - 潜在的性能问题

3. **安全性**
   - SQL注入
   - XSS漏洞
   - 敏感信息泄露

4. **最佳实践**
   - 设计模式应用
   - SOLID原则
   - 团队规范

5. **改进建议**
   - 具体的改进点
   - 重构建议

请以建设性的态度提供详细的审查意见。
"""

    @staticmethod
    def ux_designer(requirements: str) -> str:
        return f"""
你是一位经验丰富的UX/UI设计师，擅长创建用户友好的界面。

需求：
{requirements}

请提供以下设计建议：

1. **用户分析**
   - 目标用户群体
   - 用户需求和痛点
   - 使用场景

2. **信息架构**
   - 页面结构
   - 导航设计
   - 内容组织

3. **交互设计**
   - 用户流程
   - 交互方式
   - 反馈机制

4. **视觉设计**
   - 配色方案
   - 字体选择
   - 间距和布局

5. **可访问性**
   - 键盘导航
   - 屏幕阅读器支持
   - 颜色对比度

请提供详细的设计说明和理由。
"""
```

## Prompt模板库

```python
class PromptTemplates:
    """常用Prompt模板"""

    CODE_REVIEW = """
你是一位代码审查专家。请审查以下代码，重点关注：
- 代码质量和可读性
- 潜在的bug和边界情况
- 性能优化机会
- 安全漏洞
- 测试覆盖度

代码：
{code}

请提供具体的改进建议。
"""

    SUMMARIZATION = """
请为以下文本生成简洁的摘要，要求：
- 长度控制在{max_length}字以内
- 包含关键信息
- 使用清晰的语言
- 使用要点格式

文本：
{text}

摘要：
"""

    TRANSLATION = """
请将以下文本翻译成{target_language}。

要求：
- 保持原文的语气和风格
- 专业术语使用标准的翻译
- 如果有文化相关的内容，进行本地化调整
- 确保译文自然流畅

原文：
{text}

译文：
"""

    EXPLANATION = """
请用简单易懂的语言解释以下概念，要求：
- 假设读者是该领域的初学者
- 使用类比和实例
- 分步骤解释
- 提供相关资源链接

概念：
{concept}

解释：
"""
```

## 最佳实践总结

1. **明确具体**：详细描述任务要求
2. **提供上下文**：给模型足够的背景信息
3. **使用示例**：通过few-shot学习提升效果
4. **定义格式**：指定输出的结构化格式
5. **迭代优化**：根据结果持续调整prompt
6. **版本管理**：保存有效的prompt模板
7. **测试验证**：用多个测试用例验证效果

Prompt工程是一个持续优化的过程，需要不断实验和改进。
