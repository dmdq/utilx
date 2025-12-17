<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">正则表达式调试器</h1>
      <p class="text-muted-foreground mb-4">实时测试和调试正则表达式，支持详细匹配分析和常用模式库</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧输入和控制 -->
      <div class="space-y-6">
        <!-- 正则表达式输入 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">正则表达式</h3>
            <div class="flex gap-2">
              <button
                @click="clearRegex"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
              <button
                @click="copyRegex"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                复制
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <code class="px-2 py-1 bg-muted rounded text-sm font-mono">/</code>
              <input
                v-model="regexPattern"
                @input="updateRegex"
                placeholder="输入正则表达式，如: \d+"
                class="flex-1 px-3 py-2 font-mono text-sm border rounded-md"
              >
              <code class="px-2 py-1 bg-muted rounded text-sm font-mono">/</code>
              <input
                v-model="regexFlags"
                @input="updateRegex"
                placeholder="gim"
                maxlength="10"
                class="w-16 px-2 py-1 font-mono text-sm border rounded-md text-center"
              >
            </div>

            <!-- 标志位说明 -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <label class="flex items-center gap-1">
                <input
                  v-model="regexFlags"
                  type="checkbox"
                  value="g"
                  @change="updateFlags"
                >
                <span>g - 全局匹配</span>
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="regexFlags"
                  type="checkbox"
                  value="i"
                  @change="updateFlags"
                >
                <span>i - 忽略大小写</span>
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="regexFlags"
                  type="checkbox"
                  value="m"
                  @change="updateFlags"
                >
                <span>m - 多行匹配</span>
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="regexFlags"
                  type="checkbox"
                  value="s"
                  @change="updateFlags"
                >
                <span>s - 单行匹配</span>
              </label>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="regexError" class="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p class="text-sm text-destructive">{{ regexError }}</p>
          </div>
        </div>

        <!-- 测试文本 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">测试文本</h3>
            <div class="flex gap-2">
              <button
                @click="loadSampleText"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                加载示例
              </button>
              <button
                @click="clearTestText"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="testText"
            @input="testRegex"
            placeholder="输入要测试的文本..."
            class="w-full h-48 p-3 font-mono text-sm border rounded-md resize-none"
          ></textarea>

          <div class="mt-2 text-sm text-muted-foreground">
            文本长度: {{ testText.length }} 字符 | 匹配数: {{ matches.length }}
          </div>
        </div>

        <!-- 常用模式 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">常用模式</h3>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="pattern in commonPatterns"
              :key="pattern.name"
              @click="applyPattern(pattern)"
              class="p-2 text-left bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              <div class="font-medium">{{ pattern.name }}</div>
              <div class="text-xs text-muted-foreground font-mono">{{ pattern.pattern }}</div>
              <div class="text-xs text-muted-foreground">{{ pattern.description }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果和分析 -->
      <div class="space-y-6">
        <!-- 匹配结果 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">匹配结果</h3>
            <div class="flex gap-2">
              <button
                @click="exportMatches"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                导出
              </button>
            </div>
          </div>

          <!-- 匹配统计 -->
          <div class="mb-4 p-3 bg-muted rounded-md">
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div class="text-center">
                <div class="text-lg font-bold text-primary">{{ matches.length }}</div>
                <div class="text-muted-foreground">总匹配数</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-success">{{ groups.length }}</div>
                <div class="text-muted-foreground">捕获组</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-warning">{{ regexError ? 1 : 0 }}</div>
                <div class="text-muted-foreground">错误数</div>
              </div>
            </div>
          </div>

          <!-- 匹配详情 -->
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(match, index) in matches"
              :key="index"
              class="p-3 border rounded-md bg-success/5 border-success/20"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium">匹配 {{ index + 1 }}</span>
                <span class="text-xs text-muted-foreground">
                  位置: {{ match.index }}-{{ match.index + match[0].length }}
                </span>
              </div>
              <div class="font-mono text-sm bg-success/10 p-2 rounded">
                {{ match[0] }}
              </div>
              <div v-if="match.length > 1" class="mt-2 space-y-1">
                <div class="text-xs text-muted-foreground">捕获组:</div>
                <div
                  v-for="(group, groupIndex) in match.slice(1)"
                  :key="groupIndex"
                  class="text-xs font-mono bg-muted p-1 rounded"
                >
                  ${{ groupIndex + 1 }}: {{ group || '(空)' }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="matches.length === 0 && !regexError" class="text-center py-8 text-muted-foreground">
            暂无匹配结果
          </div>
        </div>

        <!-- 可视化高亮 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">可视化高亮</h3>
          <div class="border rounded-md p-4 bg-white min-h-32 max-h-48 overflow-auto">
            <div v-html="highlightedText" class="font-mono text-sm whitespace-pre-wrap"></div>
          </div>
        </div>

        <!-- 正则解释器 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">正则解释</h3>
          <div class="space-y-2 text-sm">
            <div
              v-for="(explanation, index) in regexExplanation"
              :key="index"
              class="p-2 bg-muted rounded"
            >
              {{ explanation }}
            </div>
            <div v-if="regexExplanation.length === 0" class="text-muted-foreground">
              输入正则表达式后查看解释
            </div>
          </div>
        </div>

        <!-- 测试用例 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">测试用例</h3>
          <div class="space-y-2">
            <div
              v-for="(testCase, index) in testCases"
              :key="index"
              class="flex items-center justify-between p-2 border rounded"
            >
              <div class="flex-1">
                <div class="font-mono text-sm">{{ testCase.input }}</div>
                <div class="text-xs text-muted-foreground">{{ testCase.description }}</div>
              </div>
              <div
                :class="[
                  'px-2 py-1 rounded text-xs',
                  testCase.matched ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                ]"
              >
                {{ testCase.matched ? '匹配' : '不匹配' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('正则表达式调试器 - 在线正则表达式测试工具')

// 数据
const regexPattern = ref('\\d+')
const regexFlags = ref('g')
const testText = ref('')
const regexError = ref('')

// 匹配结果
const matches = ref([])
const groups = ref([])

// 常用模式
const commonPatterns = [
  {
    name: '邮箱地址',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    description: '匹配常见的邮箱地址格式'
  },
  {
    name: '手机号码',
    pattern: '1[3-9]\\d{9}',
    description: '匹配中国大陆手机号码'
  },
  {
    name: '身份证号',
    pattern: '[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]',
    description: '匹配18位身份证号码'
  },
  {
    name: 'URL地址',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&\\/\\/=]*)',
    description: '匹配HTTP/HTTPS URL'
  },
  {
    name: 'IPv4地址',
    pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b',
    description: '匹配IPv4地址格式'
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    description: '匹配中文字符'
  },
  {
    name: 'HTML标签',
    pattern: '<([a-z][a-z0-9]*)\\b[^>]*>(.*?)<\\/\\1>',
    description: '匹配HTML标签对'
  },
  {
    name: '日期格式',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    description: '匹配YYYY-MM-DD日期格式'
  }
]

// 测试用例
const testCases = computed(() => {
  if (!regexPattern.value) return []

  return [
    {
      input: '123',
      description: '纯数字',
      matched: false
    },
    {
      input: 'abc',
      description: '纯字母',
      matched: false
    },
    {
      input: 'abc123',
      description: '字母数字混合',
      matched: false
    },
    {
      input: '',
      description: '空字符串',
      matched: false
    }
  ].map(testCase => ({
    ...testCase,
    matched: testSingleInput(testCase.input)
  }))
})

// 高亮文本
const highlightedText = computed(() => {
  if (!regexPattern.value || !testText.value || regexError.value) {
    return testText.value || '请输入正则表达式和测试文本'
  }

  try {
    const regex = new RegExp(regexPattern.value, regexFlags.value)
    return testText.value.replace(regex, (match) => {
      return `<mark class="bg-yellow-200 px-1 rounded">${match}</mark>`
    })
  } catch (e) {
    return testText.value
  }
})

// 正则解释
const regexExplanation = computed(() => {
  if (!regexPattern.value) return []

  const explanations = []
  const pattern = regexPattern.value

  // 简单的解释器
  const tokenMap = {
    '\\d': '匹配任意数字 (0-9)',
    '\\D': '匹配任意非数字字符',
    '\\w': '匹配任意字母数字字符 (a-z, A-Z, 0-9, _)',
    '\\W': '匹配任意非字母数字字符',
    '\\s': '匹配任意空白字符',
    '\\S': '匹配任意非空白字符',
    '.': '匹配除换行符外的任意字符',
    '^': '匹配字符串开始',
    '$': '匹配字符串结束',
    '*': '匹配前一个字符0次或多次',
    '+': '匹配前一个字符1次或多次',
    '?': '匹配前一个字符0次或1次',
    '{n}': '匹配前一个字符恰好n次',
    '{n,}': '匹配前一个字符至少n次',
    '{n,m}': '匹配前一个字符n到m次',
    '[...]': '匹配字符集中的任意字符',
    '[^...]': '匹配不在字符集中的任意字符',
    '(...)': '分组和捕获',
    '(?:...)': '非捕获分组',
    '|': '或操作符',
    '\\b': '单词边界',
    '\\B': '非单词边界'
  }

  // 简单的解析逻辑
  let i = 0
  while (i < pattern.length) {
    let found = false

    // 检查特殊字符
    if (pattern[i] === '\\') {
      if (i + 1 < pattern.length) {
        const token = pattern.substring(i, i + 2)
        if (tokenMap[token]) {
          explanations.push(tokenMap[token])
          i += 2
          found = true
        }
      }
    }

    // 检查其他特殊字符
    if (!found && tokenMap[pattern[i]]) {
      explanations.push(tokenMap[pattern[i]])
      i++
      found = true
    }

    // 字符集
    if (!found && pattern[i] === '[') {
      let j = i + 1
      while (j < pattern.length && pattern[j] !== ']') j++
      if (j < pattern.length) {
        explanations.push(`字符集: ${pattern.substring(i, j + 1)}`)
        i = j + 1
        found = true
      }
    }

    // 分组
    if (!found && pattern[i] === '(') {
      let j = i + 1
      let depth = 1
      while (j < pattern.length && depth > 0) {
        if (pattern[j] === '(') depth++
        if (pattern[j] === ')') depth--
        j++
      }
      if (depth === 0) {
        const group = pattern.substring(i, j)
        if (group.startsWith('(?:')) {
          explanations.push(`非捕获分组: ${group}`)
        } else {
          explanations.push(`捕获分组: ${group}`)
        }
        i = j
        found = true
      }
    }

    // 量词
    if (!found && pattern[i] === '{') {
      let j = i + 1
      while (j < pattern.length && pattern[j] !== '}') j++
      if (j < pattern.length) {
        explanations.push(`量词: ${pattern.substring(i, j + 1)}`)
        i = j + 1
        found = true
      }
    }

    // 普通字符
    if (!found) {
      if (/[a-zA-Z0-9]/.test(pattern[i])) {
        explanations.push(`字符: ${pattern[i]}`)
      } else {
        explanations.push(`特殊字符: ${pattern[i]}`)
      }
      i++
    }
  }

  return explanations
})

// 方法
const updateRegex = () => {
  testRegex()
}

const updateFlags = () => {
  const checked = ['g', 'i', 'm', 's'].filter(flag => regexFlags.value.includes(flag))
  regexFlags.value = checked.join('')
  testRegex()
}

const testRegex = () => {
  if (!regexPattern.value || !testText.value) {
    matches.value = []
    regexError.value = ''
    return
  }

  try {
    const regex = new RegExp(regexPattern.value, regexFlags.value)
    regexError.value = ''

    // 查找所有匹配
    const result = []
    let match

    // 重置正则表达式的lastIndex
    if (regex.global) {
      regex.lastIndex = 0
    }

    while ((match = regex.exec(testText.value)) !== null) {
      result.push({
        ...match,
        index: match.index
      })

      // 防止无限循环
      if (!regex.global) break
      if (match[0].length === 0) break
    }

    matches.value = result

    // 计算捕获组数
    if (result.length > 0) {
      groups.value = Array.from({ length: result[0].length - 1 }, (_, i) => `组${i + 1}`)
    } else {
      groups.value = []
    }

  } catch (e) {
    regexError.value = e.message
    matches.value = []
    groups.value = []
  }
}

const testSingleInput = (input) => {
  if (!regexPattern.value) return false

  try {
    const regex = new RegExp(regexPattern.value)
    return regex.test(input)
  } catch (e) {
    return false
  }
}

const clearRegex = () => {
  regexPattern.value = ''
  regexFlags.value = 'g'
  matches.value = []
  groups.value = []
  regexError.value = ''
}

const clearTestText = () => {
  testText.value = ''
  matches.value = []
  groups.value = []
}

const copyRegex = async () => {
  try {
    const regexString = `/${regexPattern.value}/${regexFlags.value}`
    await navigator.clipboard.writeText(regexString)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const loadSampleText = () => {
  testText.value = `联系方式：张三 13812345678，邮箱 zhangsan@example.com
李四的电话是 13987654321，邮箱 lisi@gmail.com
王五: 13666666666, wangwu@163.com
网址: https://www.example.com, http://test.org
身份证: 110101199001011234, 310101198502022345
IP地址: 192.168.1.1, 10.0.0.1, 172.16.0.1
日期: 2024-01-15, 2024-12-31, 2023-06-01
价格: ￥99.99, $123.45, €200.00`
  testRegex()
}

const applyPattern = (patternObj) => {
  regexPattern.value = patternObj.pattern
  updateRegex()

  // 如果有对应的示例文本，自动加载
  if (patternObj.name === '邮箱地址') {
    testText.value = 'test@example.com\nuser.name+tag@domain.co.uk\ninvalid-email\nanother@test.org'
  } else if (patternObj.name === '手机号码') {
    testText.value = '13812345678\n15987654321\n12345678901\n18911112222'
  } else if (patternObj.name === '身份证号') {
    testText.value = '110101199001011234\n310101198502022345\n123456789012345678\n440101197803033456'
  } else if (patternObj.name === 'URL地址') {
    testText.value = 'https://www.example.com\nhttp://test.org\nftp://server.com\nwww.invalid-url'
  }

  testRegex()
}

const exportMatches = () => {
  if (matches.value.length === 0) return

  const exportData = {
    regex: `/${regexPattern.value}/${regexFlags.value}`,
    testText: testText.value,
    matches: matches.value.map((match, index) => ({
      index: index + 1,
      value: match[0],
      position: {
        start: match.index,
        end: match.index + match[0].length
      },
      groups: match.slice(1).map((group, i) => ({
        name: `$${i + 1}`,
        value: group
      }))
    })),
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'regex_matches.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 初始化
loadSampleText()
</script>

<style scoped>
mark {
  background-color: #fef08a;
  border-radius: 2px;
}
</style>