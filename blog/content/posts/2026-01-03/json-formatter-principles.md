---
title: "JSON格式化工具的幕后原理与实现"
slug: "json-formatter-principles"
date: 2026-01-03T11:00:00+08:00
draft: false
tags: ['JSON', '格式化', '前端开发', '代码解析', '工具开发']
categories: ['技术教程']
author: 'util.cn Team'
summary: '深入解析JSON格式化工具的工作原理，包括词法分析、语法树构建和格式化算法的实现'
layout: "single"
ShowToc: true
---

# JSON格式化工具的幕后原理

JSON格式化工具是开发者最常用的工具之一。点击一个按钮，杂乱无章的JSON就变成了结构清晰、易于阅读的格式。这个看似简单的功能背后，究竟隐藏着怎样的技术实现？

## JSON格式化的核心挑战

### 什么是格式化

JSON格式化是指将紧凑的JSON字符串转换为具有良好缩进、换行和空格的可读格式。

**紧凑格式**：
```json
{"name":"John","age":30,"address":{"city":"Beijing","street":"Chaoyang"}}
```

**格式化后**：
```json
{
  "name": "John",
  "age": 30,
  "address": {
    "city": "Beijing",
    "street": "Chaoyang"
  }
}
```

### 核心挑战

1. **正确解析**：必须正确处理各种JSON语法
2. **错误处理**：提供清晰的错误提示
3. **性能优化**：处理大型JSON文件
4. **格式选项**：支持不同的格式风格

## JSON格式化的实现原理

### 方法一：使用原生JSON API

最简单的实现方式：

```javascript
function formatJSON(jsonString, indent = 2) {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}
```

**优点**：
- 简单可靠
- 性能好
- 浏览器原生支持

**缺点**：
- 错误提示不够友好
- 格式选项有限

### 方法二：自定义词法和语法分析

为了提供更好的用户体验，我们需要自己实现JSON解析器。

#### 1. 词法分析（Tokenization）

将JSON字符串分解为一个个token：

```javascript
class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
  }

  tokenize() {
    while (this.position < this.input.length) {
      const char = this.input[this.position];

      // 跳过空白字符
      if (this.isWhitespace(char)) {
        this.position++;
        continue;
      }

      // 处理不同的token类型
      if (char === '{' || char === '}' || char === '[' || char === ']' ||
          char === ':' || char === ',') {
        this.tokens.push({ type: 'PUNCTUATION', value: char });
        this.position++;
      } else if (char === '"') {
        this.tokens.push(this.readString());
      } else if (this.isDigit(char) || char === '-') {
        this.tokens.push(this.readNumber());
      } else if (this.isKeywordStart(char)) {
        this.tokens.push(this.readKeyword());
      } else {
        throw new Error(`Unexpected character: ${char} at position ${this.position}`);
      }
    }

    return this.tokens;
  }

  readString() {
    let value = '';
    let position = this.position + 1; // 跳过开始引号

    while (position < this.input.length) {
      const char = this.input[position];

      if (char === '\\') {
        // 处理转义字符
        value += char + this.input[position + 1];
        position += 2;
      } else if (char === '"') {
        const result = {
          type: 'STRING',
          value: value,
          position: this.position
        };
        this.position = position + 1;
        return result;
      } else {
        value += char;
        position++;
      }
    }

    throw new Error('Unterminated string');
  }

  readNumber() {
    let value = '';
    let position = this.position;

    while (position < this.input.length) {
      const char = this.input[position];
      if (this.isDigit(char) || char === '.' || char === '-' || char === 'e' || char === 'E') {
        value += char;
        position++;
      } else {
        break;
      }
    }

    const result = {
      type: 'NUMBER',
      value: parseFloat(value),
      position: this.position
    };
    this.position = position;
    return result;
  }

  readKeyword() {
    const keywords = ['true', 'false', 'null'];
    for (const keyword of keywords) {
      if (this.input.startsWith(keyword, this.position)) {
        const result = {
          type: 'KEYWORD',
          value: keyword,
          position: this.position
        };
        this.position += keyword.length;
        return result;
      }
    }
    throw new Error(`Invalid keyword at position ${this.position}`);
  }

  isWhitespace(char) {
    return char === ' ' || char === '\n' || char === '\r' || char === '\t';
  }

  isDigit(char) {
    return char >= '0' && char <= '9';
  }

  isKeywordStart(char) {
    return char === 't' || char === 'f' || char === 'n';
  }
}
```

#### 2. 语法分析（Parsing）

构建语法树：

```javascript
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  parse() {
    return this.parseValue();
  }

  parseValue() {
    const token = this.currentToken();

    if (!token) {
      throw new Error('Unexpected end of input');
    }

    if (token.type === 'STRING') {
      this.advance();
      return { type: 'STRING', value: token.value };
    } else if (token.type === 'NUMBER') {
      this.advance();
      return { type: 'NUMBER', value: token.value };
    } else if (token.type === 'KEYWORD') {
      this.advance();
      return { type: 'KEYWORD', value: token.value };
    } else if (token.type === 'PUNCTUATION' && token.value === '{') {
      return this.parseObject();
    } else if (token.type === 'PUNCTUATION' && token.value === '[') {
      return this.parseArray();
    } else {
      throw new Error(`Unexpected token: ${token.value} at position ${token.position}`);
    }
  }

  parseObject() {
    this.advance(); // 跳过 '{'
    const properties = [];

    while (this.currentToken() && this.currentToken().value !== '}') {
      const key = this.parseString();
      this.expect(':');
      const value = this.parseValue();
      properties.push({ key, value });

      if (this.currentToken() && this.currentToken().value === ',') {
        this.advance();
      }
    }

    this.expect('}');

    return {
      type: 'OBJECT',
      properties
    };
  }

  parseArray() {
    this.advance(); // 跳过 '['
    const elements = [];

    while (this.currentToken() && this.currentToken().value !== ']') {
      elements.push(this.parseValue());

      if (this.currentToken() && this.currentToken().value === ',') {
        this.advance();
      }
    }

    this.expect(']');

    return {
      type: 'ARRAY',
      elements
    };
  }

  parseString() {
    const token = this.currentToken();
    if (token && token.type === 'STRING') {
      this.advance();
      return token.value;
    }
    throw new Error('Expected string');
  }

  expect(value) {
    const token = this.currentToken();
    if (token && token.value === value) {
      this.advance();
    } else {
      throw new Error(`Expected '${value}' but found '${token ? token.value : 'EOF'}'`);
    }
  }

  currentToken() {
    return this.tokens[this.position];
  }

  advance() {
    this.position++;
  }
}
```

#### 3. 格式化生成（Formatting）

根据语法树生成格式化的JSON：

```javascript
class Formatter {
  constructor(options = {}) {
    this.indent = options.indent || 2;
    this.indentChar = options.indentChar || ' ';
    this.sortKeys = options.sortKeys || false;
  }

  format(ast) {
    return this.formatValue(ast, 0);
  }

  formatValue(node, level) {
    switch (node.type) {
      case 'OBJECT':
        return this.formatObject(node, level);
      case 'ARRAY':
        return this.formatArray(node, level);
      case 'STRING':
        return JSON.stringify(node.value);
      case 'NUMBER':
        return String(node.value);
      case 'KEYWORD':
        return node.value;
    }
  }

  formatObject(node, level) {
    if (node.properties.length === 0) {
      return '{}';
    }

    const indent = this.getIndent(level + 1);
    const closingIndent = this.getIndent(level);

    let properties = node.properties;

    if (this.sortKeys) {
      properties = [...properties].sort((a, b) =>
        a.key.localeCompare(b.key)
      );
    }

    const formatted = properties.map(prop =>
      `${indent}${JSON.stringify(prop.key)}: ${this.formatValue(prop.value, level + 1)}`
    );

    return `{\n${formatted.join(',\n')}\n${closingIndent}}`;
  }

  formatArray(node, level) {
    if (node.elements.length === 0) {
      return '[]';
    }

    const indent = this.getIndent(level + 1);
    const closingIndent = this.getIndent(level);

    const formatted = node.elements.map(elem =>
      `${indent}${this.formatValue(elem, level + 1)}`
    );

    return `[\n${formatted.join(',\n')}\n${closingIndent}]`;
  }

  getIndent(level) {
    return this.indentChar.repeat(this.indent * level);
  }
}
```

### 完整的格式化工具

```javascript
class JSONFormatter {
  format(input, options = {}) {
    // 词法分析
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();

    // 语法分析
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // 格式化
    const formatter = new Formatter(options);
    return formatter.format(ast);
  }
}

// 使用示例
const formatter = new JSONFormatter();
const formatted = formatter.format(jsonString, {
  indent: 2,
  indentChar: ' ',
  sortKeys: true
});
```

## 高级功能实现

### 1. 错误位置标注

```javascript
function highlightError(input, position) {
  const lines = input.split('\n');
  let currentPos = 0;
  let lineNum = 0;
  let colNum = 0;

  for (let i = 0; i < lines.length; i++) {
    if (currentPos + lines[i].length >= position) {
      lineNum = i + 1;
      colNum = position - currentPos + 1;
      break;
    }
    currentPos += lines[i].length + 1;
  }

  return {
    line: lineNum,
    column: colNum,
    context: lines[lineNum - 1]
  };
}
```

### 2. 压缩JSON

```javascript
function minify(jsonString) {
  const obj = JSON.parse(jsonString);
  return JSON.stringify(obj);
}
```

### 3. JSON路径查询

```javascript
function queryByPath(obj, path) {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object') {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}
```

## 性能优化技巧

### 1. 流式处理

对于大型JSON文件，使用流式处理：

```javascript
function* streamFormat(tokens) {
  let depth = 0;
  const indent = '  ';

  for (const token of tokens) {
    if (token.value === '{' || token.value === '[') {
      yield indent.repeat(depth) + token.value;
      depth++;
    } else if (token.value === '}' || token.value === ']') {
      depth--;
      yield indent.repeat(depth) + token.value;
    } else {
      yield indent.repeat(depth) + token.value;
    }
  }
}
```

### 2. 增量格式化

只格式化可见部分：

```javascript
function formatVisibleRange(jsonString, startLine, endLine) {
  const lines = jsonString.split('\n');
  const visible = lines.slice(startLine, endLine);
  return formatJSON(visible.join('\n'));
}
```

## 实用工具函数

```javascript
// 检测JSON有效性
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// 修复常见JSON错误
function fixJSON(str) {
  return str
    .replace(/'/g, '"')           // 单引号转双引号
    .replace(/(\w+):/g, '"$1":')  // 添加键的引号
    .replace(/:\s*([^",{\[\]0-9]+)/g, ': "$1"'); // 添加值的引号
}

// JSON差异对比
function jsonDiff(obj1, obj2) {
  const diff = {};
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of keys) {
    if (obj1[key] !== obj2[key]) {
      diff[key] = {
        old: obj1[key],
        new: obj2[key]
      };
    }
  }

  return diff;
}
```

## 总结

JSON格式化工具看似简单，实际上涉及词法分析、语法树构建和格式化生成等多个复杂环节。理解这些原理不仅能帮助我们更好地使用格式化工具，还能让我们在需要时自定义实现更适合特定场景的格式化逻辑。

记住：好的工具不仅要功能正确，还要提供良好的用户体验，包括清晰的错误提示、灵活的配置选项和优秀的性能表现。

## 🧰 本章配套工具箱

边读边练：以下工具均在浏览器本地运行，数据不上传，可直接打开使用。

- [JSON格式化](https://www.util.cn/tools/json-formatter/)：对照文中词法分析看格式化效果
- [JSON/XML验证器](https://www.util.cn/tools/json-xml-validator/)：验证括号逗号引号并定位语法错误
- [JSON对比工具](https://www.util.cn/tools/json-diff-compare/)：对比两种格式化实现的输出差异
- [JSON路径查询](https://www.util.cn/tools/json-path/)：用路径查询体验语法树节点提取
- [JSON转YAML](https://www.util.cn/tools/json-to-yaml/)：序列化逻辑跨格式对照测试
- [截断JSON修复器](https://www.util.cn/tools/truncated-json-repair/)：残缺 JSON 补全括号引号救急
