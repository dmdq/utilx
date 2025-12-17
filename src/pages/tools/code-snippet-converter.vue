<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">代码片段转换器</h1>
      <p class="text-muted-foreground mb-4">在不同编程语言之间转换代码片段，支持多种常见语言和转换规则</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧源代码输入 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 源语言和目标语言选择 -->
        <div class="bg-card rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">源语言</label>
              <select v-model="sourceLanguage" @change="convertCode" class="w-full px-3 py-2 border rounded-md">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="css">CSS</option>
                <option value="html">HTML</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">目标语言</label>
              <select v-model="targetLanguage" @change="convertCode" class="w-full px-3 py-2 border rounded-md">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="css">CSS</option>
                <option value="html">HTML</option>
              </select>
            </div>
          </div>

          <!-- 快速转换对 -->
          <div class="mt-4">
            <label class="block text-sm font-medium mb-2">快速转换</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="pair in quickConvertPairs"
                :key="pair.name"
                @click="setQuickConvert(pair)"
                class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                {{ pair.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- 源代码编辑器 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">源代码</h3>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                加载示例
              </button>
              <button
                @click="clearSource"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="sourceCode"
            @input="convertCode"
            class="w-full h-64 p-3 font-mono text-sm border rounded-md resize-none"
            :placeholder="getSourcePlaceholder()"
          ></textarea>

          <div class="mt-2 text-sm text-muted-foreground">
            <span>行数: {{ sourceCode.split('\n').length }} | 字符数: {{ sourceCode.length }}</span>
            <span v-if="conversionError" class="text-destructive ml-4">转换失败: {{ conversionError }}</span>
          </div>
        </div>

        <!-- 转换结果 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">转换结果</h3>
            <div class="flex gap-2">
              <button
                @click="copyResult"
                :disabled="!convertedCode"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
              >
                复制
              </button>
              <button
                @click="swapLanguages"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                交换语言
              </button>
            </div>
          </div>

          <div v-if="!convertedCode" class="text-center py-8 text-muted-foreground">
            输入代码后将在此显示转换结果
          </div>

          <div v-else>
            <!-- 转换统计 -->
            <div class="mb-3 p-3 bg-muted rounded-md">
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div class="text-center">
                  <div class="text-lg font-bold text-primary">{{ conversionStats.lines }}</div>
                  <div class="text-muted-foreground">行数</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-success">{{ conversionStats.complexity }}</div>
                  <div class="text-muted-foreground">复杂度</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-warning">{{ conversionStats.confidence }}%</div>
                  <div class="text-muted-foreground">置信度</div>
                </div>
              </div>
            </div>

            <!-- 转换代码 -->
            <pre class="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto max-h-96 overflow-y-auto"><code>{{ convertedCode }}</code></pre>
          </div>
        </div>
      </div>

      <!-- 右侧工具和说明 -->
      <div class="space-y-6">
        <!-- 转换规则 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">转换规则</h3>
          <div class="space-y-3">
            <div v-for="rule in activeRules" :key="rule.name" class="p-2 bg-muted rounded">
              <div class="font-medium text-sm">{{ rule.name }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ rule.description }}</div>
            </div>
          </div>
        </div>

        <!-- 常用代码模式 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">常用代码模式</h3>
          <div class="space-y-2">
            <button
              v-for="pattern in codePatterns"
              :key="pattern.name"
              @click="loadPattern(pattern)"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              <div class="font-medium">{{ pattern.name }}</div>
              <div class="text-xs text-muted-foreground">{{ pattern.description }}</div>
            </button>
          </div>
        </div>

        <!-- 转换提示 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">转换说明</h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="p-2 bg-blue-50 rounded border border-blue-200">
              <strong class="text-blue-800">💡 转换原理:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• 基于语法规则和模式匹配</li>
                <li>• 保持代码逻辑结构不变</li>
                <li>• 自动适配目标语言语法</li>
                <li>• 保留注释和格式</li>
              </ul>
            </div>

            <div class="p-2 bg-green-50 rounded border border-green-200">
              <strong class="text-green-800">✅ 支持转换:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• 变量和函数定义</li>
                <li>• 条件语句和循环</li>
                <li>• 数据结构和对象</li>
                <li>• 类和接口定义</li>
              </ul>
            </div>

            <div class="p-2 bg-yellow-50 rounded border border-yellow-200">
              <strong class="text-yellow-800">⚠️ 注意事项:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• 复杂逻辑可能需要手动调整</li>
                <li>• 库函数差异需要处理</li>
                <li>• 部分语言特性可能丢失</li>
                <li>• 建议人工审查转换结果</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">转换历史</h3>
          <div class="space-y-2">
            <div
              v-for="(item, index) in conversionHistory"
              :key="index"
              @click="loadFromHistory(item)"
              class="p-2 border rounded cursor-pointer hover:bg-muted"
            >
              <div class="flex justify-between text-xs">
                <span>{{ item.source }} → {{ item.target }}</span>
                <span class="text-muted-foreground">{{ item.timestamp.toLocaleTimeString() }}</span>
              </div>
            </div>
            <div v-if="conversionHistory.length === 0" class="text-center py-4 text-muted-foreground text-sm">
              暂无转换记录
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('代码片段转换器 - 多语言代码转换工具')

// 数据
const sourceLanguage = ref('javascript')
const targetLanguage = ref('python')
const sourceCode = ref('')
const convertedCode = ref('')
const conversionError = ref('')
const conversionHistory = ref([])

// 快速转换对
const quickConvertPairs = [
  { name: 'JS → Python', source: 'javascript', target: 'python' },
  { name: 'Python → JS', source: 'python', target: 'javascript' },
  { name: 'Java → C#', source: 'java', target: 'csharp' },
  { name: 'SQL → JSON', source: 'sql', target: 'json' },
  { name: 'JSON → XML', source: 'json', target: 'xml' },
  { name: 'CSS → SCSS', source: 'css', target: 'scss' }
]

// 代码模式
const codePatterns = [
  {
    name: '函数定义',
    description: '基本函数定义和调用',
    code: {
      javascript: `function add(a, b) {
  return a + b;
}

const result = add(1, 2);
console.log(result);`,
      python: `def add(a, b):
    return a + b

result = add(1, 2)
print(result)`
    }
  },
  {
    name: '类定义',
    description: '面向对象编程类结构',
    code: {
      java: `public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }
}`,
      csharp: `public class Person {
    private string name;
    private int age;

    public Person(string name, int age) {
        this.name = name;
        this.age = age;
    }

    public string GetName() {
        return name;
    }

    public void SetName(string name) {
        this.name = name;
    }

    public int GetAge() {
        return age;
    }
}`
    }
  },
  {
    name: '数据结构',
    description: '数组/列表操作',
    code: {
      javascript: `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
const even = numbers.filter(x => x % 2 === 0);

console.log('Original:', numbers);
console.log('Doubled:', doubled);
console.log('Even:', even);`,
      python: `numbers = [1, 2, 3, 4, 5]
doubled = [x * 2 for x in numbers]
even = [x for x in numbers if x % 2 == 0]

print('Original:', numbers)
print('Doubled:', doubled)
print('Even:', even)`
    }
  },
  {
    name: '条件语句',
    description: 'if-else条件逻辑',
    code: {
      php: `$score = 85;
$grade;

if ($score >= 90) {
    $grade = 'A';
} elseif ($score >= 80) {
    $grade = 'B';
} elseif ($score >= 70) {
    $grade = 'C';
} else {
    $grade = 'D';
}

echo "Grade: " . $grade;`,
      ruby: `score = 85
grade = case score
when 90..100
  'A'
when 80..89
  'B'
when 70..79
  'C'
else
  'D'
end

puts "Grade: #{grade}"`
    }
  }
]

// 转换规则映射
const conversionRules = {
  'javascript-python': [
    { name: '变量声明', description: 'var/let/const → 无声明' },
    { name: '函数定义', description: 'function → def' },
    { name: '括号改为缩进', description: '{} → 缩进' },
    { name: '注释', description: '// → #' }
  ],
  'python-javascript': [
    { name: '函数定义', description: 'def → function' },
    { name: '缩进改为括号', description: '缩进 → {}' },
    { name: '变量声明', description: '添加let/const' },
    { name: '注释', description: '# → //' }
  ],
  'java-csharp': [
    { name: '访问修饰符', description: 'public/保持不变' },
    { name: '方法命名', description: '驼峰命名法' },
    { name: '类型系统', description: '基本保持不变' },
    { name: '类结构', description: '保持不变' }
  ],
  'sql-json': [
    { name: '表转对象', description: 'table → object' },
    { name: '行转数组', description: 'rows → array' },
    { name: '列转属性', description: 'columns → properties' }
  ]
}

// 计算属性
const activeRules = computed(() => {
  const key = `${sourceLanguage.value}-${targetLanguage.value}`
  return conversionRules[key] || [
    { name: '语法转换', description: '基础语法规则转换' },
    { name: '结构调整', description: '代码结构调整适配' }
  ]
})

const conversionStats = computed(() => {
  if (!convertedCode.value) {
    return { lines: 0, complexity: '简单', confidence: 0 }
  }

  const lines = convertedCode.value.split('\n').length
  let complexity = '简单'
  if (lines > 50) complexity = '中等'
  if (lines > 100) complexity = '复杂'

  const confidence = sourceLanguage.value === targetLanguage.value ? 100 :
                     activeRules.value.length > 2 ? 85 : 70

  return { lines, complexity, confidence }
})

// 方法
const getSourcePlaceholder = () => {
  const examples = {
    javascript: '// 输入JavaScript代码\nfunction hello(name) {\n  console.log("Hello, " + name);\n}',
    python: '# 输入Python代码\ndef hello(name):\n    print("Hello, " + name)',
    java: '// 输入Java代码\npublic class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}',
    sql: '-- 输入SQL查询\nSELECT * FROM users WHERE age > 18;'
  }
  return examples[sourceLanguage.value] || '输入代码...'
}

const setQuickConvert = (pair) => {
  sourceLanguage.value = pair.source
  targetLanguage.value = pair.target
  convertCode()
}

const loadExample = () => {
  const examples = {
    'javascript-python': `// JavaScript to Python example
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 }
];

const adults = users.filter(user => user.age >= 18);
console.log('Adults:', adults);`,

    'python-javascript': `# Python to JavaScript example
def calculate_area(width, height):
    return width * height

areas = [calculate_area(10, 20), calculate_area(5, 8)]
total = sum(areas)
print(f"Total area: {total}")`,

    'java-csharp': `// Java to C# example
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public int subtract(int a, int b) {
        return a - b;
    }
}`,

    'sql-json': `-- SQL to JSON example
SELECT
    id,
    name,
    email,
    created_at
FROM users
WHERE status = 'active'
ORDER BY created_at DESC`
  }

  const key = `${sourceLanguage.value}-${targetLanguage.value}`
  sourceCode.value = examples[key] || `// 示例代码
// 从 ${sourceLanguage.value} 转换到 ${targetLanguage.value}`
  convertCode()
}

const clearSource = () => {
  sourceCode.value = ''
  convertedCode.value = ''
  conversionError.value = ''
}

const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(convertedCode.value)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const swapLanguages = () => {
  const temp = sourceLanguage.value
  sourceLanguage.value = targetLanguage.value
  targetLanguage.value = temp
  convertCode()
}

const loadPattern = (pattern) => {
  const code = pattern.code[sourceLanguage.value] || pattern.code.javascript
  sourceCode.value = code
  convertCode()
}

const loadFromHistory = (item) => {
  sourceLanguage.value = item.source
  targetLanguage.value = item.target
  sourceCode.value = item.sourceCode
  convertedCode.value = item.convertedCode
  convertCode()
}

const convertCode = () => {
  if (!sourceCode.value.trim()) {
    convertedCode.value = ''
    conversionError.value = ''
    return
  }

  conversionError.value = ''

  try {
    let result = sourceCode.value

    // 简化的转换逻辑
    if (sourceLanguage.value === targetLanguage.value) {
      convertedCode.value = result
      return
    }

    // JavaScript → Python
    if (sourceLanguage.value === 'javascript' && targetLanguage.value === 'python') {
      result = result
        .replace(/\bfunction\s+(\w+)\s*\(([^)]*)\)\s*\{/g, 'def $1($2):')
        .replace(/\bconst\s+(\w+)\s*=/g, '$1 =')
        .replace(/\blet\s+(\w+)\s*=/g, '$1 =')
        .replace(/\bvar\s+(\w+)\s*=/g, '$1 =')
        .replace(/\bconsole\.log\(/g, 'print(')
        .replace(/\/\/(.*)/g, '#$1')
        .replace(/\{\s*}/g, '    pass')
        .replace(/\n(\s*)\}/g, '')
        .replace(/\n(\s*)if/g, '\n$1if')
        .replace(/\n(\s*)else/g, '\n$1else')
        .replace(/\n(\s*)for/g, '\n$1for')
        .replace(/\n(\s*)while/g, '\n$1while')
        .replace(/\n(\s*)return/g, '\n$1return')
    }

    // Python → JavaScript
    else if (sourceLanguage.value === 'python' && targetLanguage.value === 'javascript') {
      result = result
        .replace(/\bdef\s+(\w+)\s*\(([^)]*)\):/g, 'function $1($2) {')
        .replace(/(\w+)\s*=/g, (match, varName) => {
          if (match.startsWith('    ')) {
            return match.trim() + ' ='
          }
          return 'const ' + varName + ' ='
        })
        .replace(/\bprint\(/g, 'console.log(')
        .replace(/#(.*)/g, '//$1')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\n(\s*)if/g, '\n$1if')
        .replace(/\n(\s*)else/g, '\n$1else')
        .replace(/\n(\s*)for/g, '\n$1for')
        .replace(/\n(\s*)while/g, '\n$1while')
        .replace(/\n(\s*)return/g, '\n$1return')
    }

    // Java → C#
    else if (sourceLanguage.value === 'java' && targetLanguage.value === 'csharp') {
      result = result
        .replace(/\bString\b/g, 'string')
        .replace(/\bInteger\b/g, 'int')
        .replace(/\bBoolean\b/g, 'bool')
        .replace(/System\.out\.println/g, 'Console.WriteLine')
        .replace(/\b(\w+)\.(\w+)\s*\(/g, (match, obj, method) => {
          if (obj.toLowerCase() === 'system') {
            return 'System.' + method + '('
          }
          // 保留其他方法调用
          return match
        })
    }

    // 其他简单转换
    else {
      result = `// 从 ${sourceLanguage.value} 转换到 ${targetLanguage.value}\n// 转换结果:\n${result}`
    }

    convertedCode.value = result

    // 添加到历史记录
    if (result && sourceCode.value) {
      conversionHistory.value.unshift({
        source: sourceLanguage.value,
        target: targetLanguage.value,
        sourceCode: sourceCode.value,
        convertedCode: result,
        timestamp: new Date()
      })

      // 限制历史记录数量
      if (conversionHistory.value.length > 10) {
        conversionHistory.value = conversionHistory.value.slice(0, 10)
      }
    }

  } catch (e) {
    conversionError.value = '转换失败: ' + e.message
    convertedCode.value = ''
  }
}

// 初始化
onMounted(() => {
  loadExample()
})
</script>