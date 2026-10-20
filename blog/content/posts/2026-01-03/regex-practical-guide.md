---
title: "正则表达式实战指南：从入门到精通"
slug: "regex-practical-guide"
date: 2026-01-03T12:00:00+08:00
draft: false
tags: ['正则表达式', 'Regex', '字符串处理', '文本匹配', '开发技巧']
categories: ['技术教程']
author: 'util.cn Team'
summary: '全面讲解正则表达式的核心概念、常用模式和实战案例，帮助开发者掌握强大的文本处理工具'
layout: "single"
ShowToc: true
---

# 正则表达式实战指南

正则表达式（Regular Expression，简称Regex）是一种强大的文本匹配工具。它使用特定的模式来描述和匹配字符串，是每个开发者都应该掌握的技能。

## 正则表达式基础

### 什么是正则表达式

正则表达式是一种描述字符串模式的语法，可以用于：
- 查找匹配的文本
- 替换文本内容
- 验证数据格式
- 提取特定信息

### 基本语法

#### 字符匹配

```javascript
// 字面字符
/abc/         // 匹配 "abc"
/A/           // 匹配 "A"

// 字符集
[abc]         // 匹配 a、b 或 c
[^abc]        // 匹配除了 a、b、c 之外的字符
[a-z]         // 匹配任意小写字母
[A-Z]         // 匹配任意大写字母
[0-9]         // 匹配任意数字
[a-zA-Z0-9]   // 匹配任意字母或数字
```

#### 预定义字符类

```javascript
.     // 匹配任意字符（除换行符）
\d    // 匹配数字 [0-9]
\D    // 匹配非数字 [^0-9]
\w    // 匹配字母、数字、下划线 [a-zA-Z0-9_]
\W    // 匹配非字母数字下划线 [^a-zA-Z0-9_]
\s    // 匹配空白字符（空格、制表符、换行符）
\S    // 匹配非空白字符
```

#### 量词

```javascript
*     // 0次或多次
+     // 1次或多次
?     // 0次或1次
{n}   // 恰好n次
{n,}  // 至少n次
{n,m} // n到m次
```

#### 边界匹配

```javascript
^     // 字符串开始
$     // 字符串结束
\b    // 单词边界
\B    // 非单词边界
```

## 常用模式示例

### 1. 验证邮箱地址

```javascript
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// 测试
console.log(validateEmail('user@example.com'));      // true
console.log(validateEmail('user.name@example.com')); // true
console.log(validateEmail('invalid@'));              // false
```

### 2. 验证手机号

```javascript
function validatePhone(phone) {
  // 中国大陆手机号：1开头，第二位3-9，共11位
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}

console.log(validatePhone('13800138000')); // true
console.log(validatePhone('12345678901')); // false
```

### 3. 验证身份证号

```javascript
function validateIDCard(id) {
  // 18位身份证号
  const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return regex.test(id);
}
```

### 4. 验证URL

```javascript
function validateURL(url) {
  const regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return regex.test(url);
}
```

### 5. 匹配IP地址

```javascript
function validateIP(ip) {
  const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
}

console.log(validateIP('192.168.1.1'));    // true
console.log(validateIP('256.1.1.1'));      // false
```

## 高级技巧

### 1. 捕获分组

```javascript
// 提取日期
const text = '今天是2026-01-03';
const regex = /(\d{4})-(\d{2})-(\d{2})/;
const match = text.match(regex);

console.log(match[0]); // "2026-01-03"
console.log(match[1]); // "2026" (年)
console.log(match[2]); // "01" (月)
console.log(match[3]); // "03" (日)
```

### 2. 非捕获分组

```javascript
// 使用 ?: 创建非捕获分组
const regex = /(?:https?:\/\/)?(?:www\.)?example\.com/;
```

### 3. 前瞻断言

```javascript
// 正向前瞻：匹配后面跟着特定内容的模式
const regex1 = /\d+(?= dollars)/;
console.log('100 dollars'.match(regex1)); // ["100"]

// 负向前瞻：匹配后面不跟着特定内容的模式
const regex2 = /\d+(?! dollars)/;
console.log('100 yuan'.match(regex2)); // ["100"]
```

### 4. 后顾断言

```javascript
// 正向后顾：匹配前面有特定内容的模式
const regex1 = /(?<=\$)\d+/;
console.log('Price: $100'.match(regex1)); // ["100"]

// 负向后顾：匹配前面没有特定内容的模式
const regex2 = /(?<!\$)\d+/;
console.log('Price: 100'.match(regex2)); // ["100"]
```

### 5. 贪婪与非贪婪

```javascript
// 贪婪匹配（默认）
const text = '<div>内容1</div><div>内容2</div>';
const greedy = /<div>.*<\/div>/;
console.log(text.match(greedy)[0]); // 匹配整个字符串

// 非贪婪匹配
const lazy = /<div>.*?<\/div>/;
console.log(text.match(lazy)[0]); // 只匹配第一个div
```

## 实战案例

### 案例1：提取HTML标签内容

```javascript
function extractTagContent(html, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 'gi');
  const matches = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

const html = '<div>第一段</div><p>第二段</p><div>第三段</div>';
console.log(extractTagContent(html, 'div')); // ["第一段", "第三段"]
```

### 案例2：Markdown转HTML

```javascript
function markdownToHtml(markdown) {
  // 标题
  let html = markdown.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  // 代码块
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

  return html;
}
```

### 案例3：敏感词过滤

```javascript
function filterSensitiveWords(text, words) {
  // 转义特殊字符
  const escaped = words.map(word =>
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // 创建正则表达式
  const regex = new RegExp(escaped.join('|'), 'gi');

  // 替换为星号
  return text.replace(regex, match => '*'.repeat(match.length));
}

const sensitive = ['坏话', '不当内容'];
const text = '这句话包含坏话和不当内容';
console.log(filterSensitiveWords(text, sensitive));
// "这句话包含**和****"
```

### 案例4：代码格式化

```javascript
// 移除多余空行
function removeExtraBlankLines(code) {
  return code.replace(/\n\s*\n\s*\n/g, '\n\n');
}

// 统一缩进
function standardizeIndent(code, spaces = 2) {
  const indent = ' '.repeat(spaces);
  return code.replace(/^\t+/gm, match => indent.repeat(match.length));
}
```

### 案例5：数据清洗

```javascript
// 清理用户输入
function cleanInput(input) {
  return input
    .trim()                              // 去除首尾空白
    .replace(/\s+/g, ' ')                // 合并多余空格
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 只保留字母、数字、中文
    .toLowerCase();                      // 转小写
}

console.log(cleanInput('  Hello  World!  ')); // "hello world"
```

## 性能优化

### 1. 避免回溯

```javascript
// 不好的写法
/(a+)+b/

// 好的写法
/a+b/
```

### 2. 使用原子分组

```javascript
// 防止回溯
/(?>a+)b/
```

### 3. 预编译正则表达式

```javascript
// 重复使用时预编译
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateMultipleEmails(emails) {
  return emails.every(email => emailRegex.test(email));
}
```

### 4. 使用具体字符类

```javascript
// 不好的写法
/.*/  // 匹配任意字符

// 好的写法
/[a-zA-Z0-9]/  // 明确指定字符范围
```

## 常见陷阱

### 1. 忘记转义

```javascript
// 错误
/https://example.com/

// 正确
/https:\/\/example\.com/
```

### 2. 多行模式

```javascript
const text = 'line1\nline2\nline3';

// ^ 和 $ 默认匹配字符串开始和结束
/^line/.test(text); // true
/line3$/.test(text); // true

// 使用 m 标志匹配每行的开始和结束
/^line\d$/m.test(text); // true
```

### 3. 匹配换行符

```javascript
// . 不匹配换行符
/.*/.test('hello\nworld'); // false

// 使用 [\s\S] 匹配包括换行的任意字符
/[\s\S]*/.test('hello\nworld'); // true
```

## 正则表达式测试工具

### 简单的测试函数

```javascript
function testRegex(pattern, string, flags = '') {
  try {
    const regex = new RegExp(pattern, flags);
    const match = string.match(regex);

    return {
      success: true,
      pattern: pattern,
      input: string,
      match: match ? match[0] : null,
      groups: match ? match.slice(1) : [],
      index: match ? match.index : -1
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## 最佳实践

1. **添加注释**：复杂正则表达式添加注释说明
2. **使用原始字符串**：避免双重转义
3. **分步构建**：复杂模式分步骤测试
4. **考虑边界情况**：空字符串、特殊字符等
5. **性能优先**：避免过于复杂的正则表达式
6. **可读性**：权衡性能和可读性

## 总结

正则表达式是强大的文本处理工具，掌握它能极大提升开发效率。通过理解基本语法、学习常用模式和不断实践，你将能够轻松应对各种文本处理需求。

记住：简单的正则表达式往往比复杂的更好，只有在必要时才使用高级特性。良好的代码注释和测试能让你的正则表达式更易维护。

## 🧰 本章配套工具箱

边读边练：以下工具均在浏览器本地运行，数据不上传，可直接打开使用。

- [正则表达式测试](https://www.util.cn/tools/regex-tester/)：粘贴测试文本实时验证文中示例
- [正则生成器](https://www.util.cn/tools/regex-generator/)：从描述需求反向生成正则表达式
- [正则表达式调试器](https://www.util.cn/tools/regex-debugger/)：逐步拆解匹配过程看懂回溯走向
- [正则备忘单](https://www.util.cn/tools/regex-cheatsheet/)：元字符与语法速查随用随查
- [ReDoS风险检测器](https://www.util.cn/tools/redos-detector/)：检测文中案例的灾难性回溯风险
- [正则可视化图解](https://www.util.cn/tools/regex-visualizer/)：把复杂表达式画成分段结构图
