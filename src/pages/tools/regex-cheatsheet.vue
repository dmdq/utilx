<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">正则表达式速查表</h1>
      <p class="text-muted-foreground">常用正则表达式模式和语法参考，支持实时测试</p>
    </div>

    <!-- 实时测试区域 -->
    <div class="bg-card   rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">实时测试</h2>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">正则表达式</label>
          <div class="mt-2 flex gap-2">
            <input
              v-model="testPattern"
              type="text"
              placeholder="输入正则表达式，如：\d{3}-\d{4}-\d{4}"
              class="flex-1 px-3 py-2 border border-border rounded-md text-sm font-mono"
            />
            <select v-model="testFlags" class="px-3 py-2 border border-border rounded-md text-sm">
              <option value="">无标志</option>
              <option value="g">全局 (g)</option>
              <option value="i">忽略大小写 (i)</option>
              <option value="m">多行 (m)</option>
              <option value="gi">全局 + 忽略大小写</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium">测试文本</label>
          <textarea
            v-model="testText"
            placeholder="输入要测试的文本..."
            class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm h-32 resize-none"
          ></textarea>
        </div>
        <div>
          <label class="text-sm font-medium">匹配结果</label>
          <div class="mt-2 p-4 bg-muted/30 rounded-lg min-h-[100px]">
            <div v-if="matches.length > 0" class="space-y-2">
              <div
                v-for="(match, index) in matches"
                :key="index"
                class="p-2 bg-background border rounded"
              >
                <span class="font-mono text-sm">{{ match }}</span>
              </div>
            </div>
            <div v-else class="text-center text-muted-foreground py-8">
              无匹配结果
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 速查表内容 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 基本语法 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">基本语法</h2>
        <div class="space-y-3">
          <div
            v-for="item in basicSyntax"
            :key="item.pattern"
            class="p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center justify-between mb-1">
              <code class="font-mono text-sm">{{ item.pattern }}</code>
              <button
                @click="applyPattern(item.pattern)"
                class="text-xs text-primary hover:text-primary/80"
              >
                使用
              </button>
            </div>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
            <div class="mt-1">
              <span class="text-xs text-muted-foreground">示例：</span>
              <code class="text-xs">{{ item.example }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 字符类 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">字符类</h2>
        <div class="space-y-3">
          <div
            v-for="item in characterClasses"
            :key="item.pattern"
            class="p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center justify-between mb-1">
              <code class="font-mono text-sm">{{ item.pattern }}</code>
              <button
                @click="applyPattern(item.pattern)"
                class="text-xs text-primary hover:text-primary/80"
              >
                使用
              </button>
            </div>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
            <div class="mt-1">
              <span class="text-xs text-muted-foreground">示例：</span>
              <code class="text-xs">{{ item.example }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 量词 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">量词</h2>
        <div class="space-y-3">
          <div
            v-for="item in quantifiers"
            :key="item.pattern"
            class="p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center justify-between mb-1">
              <code class="font-mono text-sm">{{ item.pattern }}</code>
              <button
                @click="applyPattern(item.pattern)"
                class="text-xs text-primary hover:text-primary/80"
              >
                使用
              </button>
            </div>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
            <div class="mt-1">
              <span class="text-xs text-muted-foreground">示例：</span>
              <code class="text-xs">{{ item.example }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 分组和引用 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">分组和引用</h2>
        <div class="space-y-3">
          <div
            v-for="item in groups"
            :key="item.pattern"
            class="p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center justify-between mb-1">
              <code class="font-mono text-sm">{{ item.pattern }}</code>
              <button
                @click="applyPattern(item.pattern)"
                class="text-xs text-primary hover:text-primary/80"
              >
                使用
              </button>
            </div>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
            <div class="mt-1">
              <span class="text-xs text-muted-foreground">示例：</span>
              <code class="text-xs">{{ item.example }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 断言 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">断言</h2>
        <div class="space-y-3">
          <div
            v-for="item in assertions"
            :key="item.pattern"
            class="p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center justify-between mb-1">
              <code class="font-mono text-sm">{{ item.pattern }}</code>
              <button
                @click="applyPattern(item.pattern)"
                class="text-xs text-primary hover:text-primary/80"
              >
                使用
              </button>
            </div>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
            <div class="mt-1">
              <span class="text-xs text-muted-foreground">示例：</span>
              <code class="text-xs">{{ item.example }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 常用模式 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">常用模式</h2>
        <div class="space-y-3">
          <div
            v-for="item in commonPatterns"
            :key="item.pattern"
            class="p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center justify-between mb-1">
              <code class="font-mono text-sm">{{ item.pattern }}</code>
              <button
                @click="applyPattern(item.pattern)"
                class="text-xs text-primary hover:text-primary/80"
              >
                使用
              </button>
            </div>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
            <div class="mt-1">
              <span class="text-xs text-muted-foreground">示例：</span>
              <code class="text-xs">{{ item.example }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用技巧 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          使用技巧
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-foreground mb-2">性能优化</h4>
            <ul class="space-y-1 text-sm text-muted-foreground">
              <li>• 使用具体字符类代替 .*（如用 \d 代替 .）</li>
              <li>• 避免过度使用回溯（如避免嵌套量词）</li>
              <li>• 使用非捕获组 (?:) 提高性能</li>
              <li>• 锚定模式开头和结尾</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">调试技巧</h4>
            <ul class="space-y-1 text-sm text-muted-foreground">
              <li>• 从简单模式开始逐步构建</li>
              <li>• 使用在线正则测试工具</li>
              <li>• 分组测试复杂模式</li>
              <li>• 注意转义字符的使用</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const testPattern = ref('')
const testFlags = ref('')
const testText = ref('测试文本：\n电话号码：138-1234-5678\n邮箱：user@example.com\nIP地址：192.168.1.1\n日期：2024-01-15')
const matches = ref([])

// 基本语法
const basicSyntax = [
  { pattern: '.', description: '匹配任意单个字符（除换行符）', example: 'a.c 匹配 abc' },
  { pattern: '^', description: '匹配字符串开头', example: '^Hello 匹配 Hello World' },
  { pattern: '$', description: '匹配字符串结尾', example: 'world$ 匹配 Hello world' },
  { pattern: '|', description: '或运算符', example: 'cat|dog 匹配 cat 或 dog' },
  { pattern: '\\', description: '转义特殊字符', example: '\\. 匹配点号' }
]

// 字符类
const characterClasses = [
  { pattern: '[abc]', description: '匹配方括号内任意字符', example: '[abc] 匹配 a 或 b 或 c' },
  { pattern: '[^abc]', description: '匹配除方括号内字符外的任意字符', example: '[^abc] 不匹配 a、b、c' },
  { pattern: '[a-z]', description: '匹配小写字母 a 到 z', example: '[a-z] 匹配任意小写字母' },
  { pattern: '[A-Z]', description: '匹配大写字母 A 到 Z', example: '[A-Z] 匹配任意大写字母' },
  { pattern: '[0-9]', description: '匹配数字 0 到 9', example: '[0-9] 匹配任意数字' },
  { pattern: '\\d', description: '匹配任意数字（等同 [0-9]）', example: '\\d 匹配 123' },
  { pattern: '\\D', description: '匹配非数字字符', example: '\\D 匹配 abc' },
  { pattern: '\\w', description: '匹配字母、数字、下划线', example: '\\w 匹配 a_b1' },
  { pattern: '\\W', description: '匹配非单词字符', example: '\\W 匹配 @#$' },
  { pattern: '\\s', description: '匹配空白字符（空格、制表符等）', example: '\\s 匹配空格和制表符' },
  { pattern: '\\S', description: '匹配非空白字符', example: '\\S 匹配非空格字符' }
]

// 量词
const quantifiers = [
  { pattern: '*', description: '匹配 0 次或多次', example: 'a* 匹配 aaa、空字符串' },
  { pattern: '+', description: '匹配 1 次或多次', example: 'a+ 匹配 a、aaa' },
  { pattern: '?', description: '匹配 0 次或 1 次', example: 'a? 匹配 a 或空' },
  { pattern: '{n}', description: '匹配恰好 n 次', example: 'a{3} 匹配 aaa' },
  { pattern: '{n,}', description: '匹配至少 n 次', example: 'a{2,} 匹配 aa、aaa' },
  { pattern: '{n,m}', description: '匹配 n 到 m 次', example: 'a{2,4} 匹配 aa、aaa、aaaa' }
]

// 分组和引用
const groups = [
  { pattern: '()', description: '捕获组', example: '(ab)+ 匹配 ababab' },
  { pattern: '(?:)', description: '非捕获组', example: '(?:ab)+ 匹配 ababab' },
  { pattern: '(?=)', description: '正向先行断言', example: 'a(?=b) 匹配 a 后面是 b 的 a' },
  { pattern: '(?!)', description: '负向先行断言', example: 'a(?!b) 匹配 a 后面不是 b 的 a' },
  { pattern: '(?<=)', description: '正向后行断言', example: '(?<=a)b 匹配 a 后面的 b' },
  { pattern: '(?<!)', description: '负向后行断言', example: '(?<!a)b 匹配不在 a 后面的 b' },
  { pattern: '\\1', description: '引用第一个捕获组', example: '(a)\\1 匹配 aa' },
  { pattern: '\\2', description: '引用第二个捕获组', example: '(a)(b)\\2\\1 匹配 abba' }
]

// 断言
const assertions = [
  { pattern: '^', description: '字符串开始', example: '^Start' },
  { pattern: '$', description: '字符串结束', example: 'End$' },
  { pattern: '\\b', description: '单词边界', example: '\\bword\\b 匹配完整单词' },
  { pattern: '\\B', description: '非单词边界', example: '\\Bword\\B 不匹配独立单词' }
]

// 常用模式
const commonPatterns = [
  { pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', description: '邮箱地址', example: 'user@example.com' },
  { pattern: '\\b(?:https?://)?(?:www\\.)?[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}(?:/[^\\s]*)?\\b', description: 'URL', example: 'https://www.example.com/path' },
  { pattern: '\\b1[3-9]\\d{9}\\b', description: '手机号码（中国）', example: '13812345678' },
  { pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', description: '日期（YYYY-MM-DD）', example: '2024-01-15' },
  { pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b', description: 'IP 地址', example: '192.168.1.1' },
  { pattern: '\\b\\d{3}-\\d{4}-\\d{4}\\b', description: '电话号码（带分隔符）', example: '138-1234-5678' },
  { pattern: '\\b[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}\\b', description: 'UUID', example: '550e8400-e29b-41d4-a716-446655440000' },
  { pattern: '\\b(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}\\b', description: '强密码（至少8位，包含大小写字母和数字）', example: 'Password123' },
  { pattern: '<([a-zA-Z][a-zA-Z0-9]*)(?:\\s[^>]*)?>.*?</\\1>', description: 'HTML 标签', example: '<div class="test">内容</div>' }
]

// 应用模式到测试区
const applyPattern = (pattern) => {
  testPattern.value = pattern
}

// 执行匹配
const performMatch = () => {
  if (!testPattern.value || !testText.value) {
    matches.value = []
    return
  }

  try {
    const flags = testFlags.value
    const regex = new RegExp(testPattern.value, flags)
    const found = testText.value.match(regex)
    matches.value = found || []
  } catch (error) {
    matches.value = []
  }
}

// 监听输入变化
watch([testPattern, testFlags, testText], () => {
  performMatch()
})

// 初始匹配
performMatch()

// SEO配置
useSeoMeta({
  title: '正则表达式速查表 - 正则表达式语法参考和测试工具',
  description: '免费的在线正则表达式速查表，包含常用正则模式、语法参考和实时测试功能。',
  keywords: ['正则表达式', 'regex', '速查表', '模式匹配', '文本处理', '语法参考', '在线测试']
})


</script>