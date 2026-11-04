<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">SQL查询优化器</h1>
      <p class="text-muted-foreground mb-4">分析SQL查询性能并提供优化建议，支持多种数据库语法</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧SQL输入和分析 -->
      <div class="space-y-6">
        <!-- 数据库选择和配置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">数据库配置</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">数据库类型</label>
              <select v-model="databaseType" @change="analyzeQuery" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlite">SQLite</option>
                <option value="oracle">Oracle</option>
                <option value="sqlserver">SQL Server</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">表大小估计</label>
              <select v-model="tableSize" @change="analyzeQuery" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="small">小表 (< 1万行)</option>
                <option value="medium">中表 (1万-100万行)</option>
                <option value="large">大表 (> 100万行)</option>
                <option value="custom">自定义</option>
              </select>
            </div>
          </div>

          <div v-if="tableSize === 'custom'" class="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">表行数</label>
              <input
                v-model.number="customTableRows"
                type="number"
                class="w-full px-2 py-1 border border-border rounded text-sm"
                placeholder="1000000"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">索引数</label>
              <input
                v-model.number="customIndexCount"
                type="number"
                class="w-full px-2 py-1 border border-border rounded text-sm"
                placeholder="5"
              >
            </div>
          </div>
        </div>

        <!-- SQL输入 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">SQL查询</h3>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                加载示例
              </button>
              <button
                @click="formatSQL"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                格式化
              </button>
              <button
                @click="clearSQL"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="sqlQuery"
            @input="analyzeQuery"
            class="w-full h-64 p-3 font-mono text-sm border border-border rounded-md resize-none"
            placeholder="输入SQL查询语句，例如:
SELECT * FROM users WHERE age > 18 ORDER BY name"
          ></textarea>

          <div class="mt-2 text-sm text-muted-foreground">
            <span>行数: {{ sqlQuery.split('\n').length }} | 字符数: {{ sqlQuery.length }}</span>
            <span v-if="sqlError" class="text-destructive ml-4">语法错误</span>
          </div>
        </div>

        <!-- 快速示例 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">常见优化场景</h3>
          <div class="space-y-2">
            <button
              v-for="scenario in optimizationScenarios"
              :key="scenario.name"
              @click="loadScenario(scenario)"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              <div class="font-medium">{{ scenario.name }}</div>
              <div class="text-xs text-muted-foreground">{{ scenario.description }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧分析和建议 -->
      <div class="space-y-6">
        <!-- 性能分析结果 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">性能分析</h3>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" :class="performanceScore.color"></div>
              <span class="text-sm font-medium">{{ performanceScore.text }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold">{{ analysisResults.cost }}</div>
              <div class="text-xs text-muted-foreground">查询成本</div>
            </div>
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold">{{ analysisResults.rows }}</div>
              <div class="text-xs text-muted-foreground">预计行数</div>
            </div>
          </div>

          <!-- 性能指标 -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm">索引使用率</span>
              <div class="w-32 bg-muted rounded-full h-2">
                <div
                  class="bg-green-500 h-2 rounded-full"
                  :style="{ width: analysisResults.indexUsage + '%' }"
                ></div>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">查询复杂度</span>
              <span class="text-sm font-medium">{{ analysisResults.complexity }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">预估时间</span>
              <span class="text-sm font-medium">{{ analysisResults.estimatedTime }}ms</span>
            </div>
          </div>
        </div>

        <!-- 优化建议 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">优化建议</h3>
            <span class="text-sm text-muted-foreground">{{ suggestions.length }} 条建议</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="p-3 border rounded-lg"
              :class="getSuggestionClass(suggestion.priority)"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="getSuggestionIcon(suggestion.priority)"
                  ></div>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ suggestion.title }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ suggestion.description }}</div>
                  <div v-if="suggestion.code" class="mt-2">
                    <pre class="text-xs bg-muted p-2 rounded overflow-x-auto"><code>{{ suggestion.code }}</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="suggestions.length === 0" class="text-center py-8 text-muted-foreground">
            暂无优化建议
          </div>
        </div>

        <!-- 索引建议 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">索引建议</h3>
          <div class="space-y-2">
            <div
              v-for="(index, idx) in indexSuggestions"
              :key="idx"
              class="p-2 border rounded"
            >
              <div class="font-mono text-sm bg-success/10 p-2 rounded">
                {{ index.type }} INDEX {{ index.name }} ({{ index.columns.join(', ') }})
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                预计提升: {{ index.improvement }}
              </div>
            </div>
          </div>
        </div>

        <!-- 优化规则说明 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">优化规则</h3>
          <div class="space-y-3 text-sm">
            <div class="p-2 bg-blue-50 rounded border border-blue-200">
              <strong class="text-blue-800">📊 基础优化:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• 使用索引加速查询</li>
                <li>• 避免SELECT *</li>
                <li>• 使用WHERE条件过滤</li>
                <li>• 合理使用LIMIT</li>
              </ul>
            </div>

            <div class="p-2 bg-green-50 rounded border border-green-200">
              <strong class="text-green-800">⚡ 性能优化:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• 避免全表扫描</li>
                <li>• 优化JOIN操作</li>
                <li>• 使用EXISTS替代IN</li>
                <li>• 合理使用子查询</li>
              </ul>
            </div>

            <div class="p-2 bg-yellow-50 rounded border border-yellow-200">
              <strong class="text-yellow-800">🔧 高级优化:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• 使用覆盖索引</li>
                <li>• 避免函数操作</li>
                <li>• 优化数据类型</li>
                <li>• 合理使用缓存</li>
              </ul>
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
setPageTitle('SQL查询优化器 - SQL性能分析和优化建议')

// 数据
const databaseType = ref('mysql')
const tableSize = ref('medium')
const customTableRows = ref(100000)
const customIndexCount = ref(5)
const sqlQuery = ref('')
const sqlError = ref(false)

const analysisResults = ref({
  cost: 0,
  rows: 0,
  indexUsage: 0,
  complexity: '中等',
  estimatedTime: 0
})

const suggestions = ref([])
const indexSuggestions = ref([])

// 优化场景
const optimizationScenarios = [
  {
    name: '缺少WHERE条件',
    description: '未使用WHERE条件导致全表扫描',
    sql: `SELECT * FROM orders ORDER BY created_at DESC`
  },
  {
    name: 'SELECT * 查询',
    description: '使用SELECT *查询所有列',
    sql: `SELECT * FROM users WHERE status = 'active'`
  },
  {
    name: '未使用索引的WHERE',
    description: 'WHERE条件未使用索引',
    sql: `SELECT * FROM products WHERE description LIKE '%keyword%'`
  },
  {
    name: '低效的IN查询',
    description: 'IN子查询中包含大量数据',
    sql: `SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE level = 'premium')`
  },
  {
    name: '隐式类型转换',
    description: 'WHERE条件中存在类型转换',
    sql: `SELECT * FROM users WHERE phone = 13800138000`
  }
]

// 计算属性
const performanceScore = computed(() => {
  let score = 0
  let color = 'bg-red-500'
  let text = '需要优化'

  // 根据各种因素计算得分
  if (analysisResults.value.indexUsage > 80) score += 30
  if (analysisResults.value.complexity === '简单') score += 25
  if (analysisResults.value.estimatedTime < 100) score += 25
  if (suggestions.value.filter(s => s.priority === 'high').length === 0) score += 20

  if (score >= 80) {
    color = 'bg-green-500'
    text = '优秀'
  } else if (score >= 60) {
    color = 'bg-yellow-500'
    text = '良好'
  } else if (score >= 40) {
    color = 'bg-orange-500'
    text = '一般'
  } else {
    color = 'bg-red-500'
    text = '需要优化'
  }

  return { color, text }
})

// 方法
const getSuggestionClass = (priority) => {
  const classes = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50'
  }
  return classes[priority] || classes.low
}

const getSuggestionIcon = (priority) => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  }
  return colors[priority] || colors.low
}

const loadExample = () => {
  sqlQuery.value = `SELECT
  u.id,
  u.name,
  u.email,
  p.title as profile_title,
  COUNT(o.id) as order_count
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
  AND u.created_at >= '2024-01-01'
GROUP BY u.id, u.name, u.email, p.title
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 10`
  analyzeQuery()
}

const formatSQL = () => {
  // 简单的SQL格式化
  if (!sqlQuery.value) return

  try {
    let formatted = sqlQuery.value
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',\n  ')
      .replace(/\s+FROM\s+/gi, '\nFROM ')
      .replace(/\s+WHERE\s+/gi, '\nWHERE ')
      .replace(/\s+AND\s+/gi, '\n  AND ')
      .replace(/\s+OR\s+/gi, '\n  OR ')
      .replace(/\s+ORDER BY\s+/gi, '\nORDER BY ')
      .replace(/\s+GROUP BY\s+/gi, '\nGROUP BY ')
      .replace(/\s+HAVING\s+/gi, '\nHAVING ')
      .replace(/\s+LIMIT\s+/gi, '\nLIMIT ')
      .trim()

    sqlQuery.value = formatted
  } catch (e) {
    console.error('格式化失败:', e)
  }
}

const clearSQL = () => {
  sqlQuery.value = ''
  suggestions.value = []
  indexSuggestions.value = []
  analysisResults.value = {
    cost: 0,
    rows: 0,
    indexUsage: 0,
    complexity: '简单',
    estimatedTime: 0
  }
}

const loadScenario = (scenario) => {
  sqlQuery.value = scenario.sql
  analyzeQuery()
}

const analyzeQuery = () => {
  if (!sqlQuery.value.trim()) {
    clearSQL()
    return
  }

  sqlError.value = false
  suggestions.value = []
  indexSuggestions.value = []

  const query = sqlQuery.value.toLowerCase()
  const newSuggestions = []
  const newIndexSuggestions = []

  try {
    // 简单的SQL语法检查
    if (!query.includes('select')) {
      sqlError.value = true
      return
    }

    // 分析查询类型
    const hasJoin = query.includes('join')
    const hasGroupBy = query.includes('group by')
    const hasOrderBy = query.includes('order by')
    const hasLimit = query.includes('limit')

    // 计算基础性能指标
    let complexity = '简单'
    let estimatedRows = 1000
    let estimatedTime = 50
    let indexUsage = 70

    if (tableSize.value === 'small') {
      estimatedRows = 100
      estimatedTime = 10
    } else if (tableSize.value === 'medium') {
      estimatedRows = 10000
      estimatedTime = 100
    } else if (tableSize.value === 'large') {
      estimatedRows = 1000000
      estimatedTime = 500
    } else {
      estimatedRows = customTableRows.value
      estimatedTime = Math.ceil(customTableRows.value / 2000)
    }

    // 分析具体问题
    if (query.includes('select *')) {
      newSuggestions.push({
        priority: 'high',
        title: '避免使用SELECT *',
        description: '只查询需要的列可以减少I/O和网络传输开销',
        code: 'SELECT id, name, email FROM users'
      })
      estimatedTime *= 1.3
      indexUsage -= 20
    }

    if (query.includes('select *') && hasJoin) {
      estimatedTime *= 2
      complexity = '复杂'
    }

    if (!query.includes('where') && !hasJoin) {
      newSuggestions.push({
        priority: 'high',
        title: '添加WHERE条件',
        description: '没有WHERE条件会导致全表扫描',
        code: 'SELECT * FROM users WHERE status = "active"'
      })
      estimatedTime *= 10
      indexUsage = 0
    } else if (query.includes('where')) {
      // 检查WHERE条件是否可能使用索引
      if (query.includes('like \'%')) {
        newSuggestions.push({
          priority: 'high',
          title: '避免前导通配符的LIKE',
          description: '前导通配符无法使用索引，考虑全文索引或修改查询',
          code: 'WHERE name LIKE "keyword%" OR name = "keyword"'
        })
        indexUsage = 20
      } else {
        indexUsage = 85
      }
    }

    if (hasJoin) {
      const joinCount = (query.match(/join/gi) || []).length
      if (joinCount > 3) {
        newSuggestions.push({
          priority: 'medium',
          title: '减少JOIN数量',
          description: '多个JOIN会影响性能，考虑分步查询或使用子查询',
          code: '-- 先查询必要数据，再进行关联'
        })
        estimatedTime *= joinCount * 0.8
        complexity = '复杂'
      }

      // 检查JOIN条件
      newSuggestions.push({
        priority: 'medium',
        title: '确保JOIN条件使用索引',
        description: 'JOIN字段应该建立索引以提高连接性能',
        code: 'CREATE INDEX idx_orders_user_id ON orders(user_id)'
      })

      // 检查是否有ON条件
      if (!query.includes('on ')) {
        newSuggestions.push({
          priority: 'high',
          title: '确保JOIN有ON条件',
          description: '缺少ON条件会导致笛卡尔积，严重影响性能',
          code: 'FROM users u JOIN orders o ON u.id = o.user_id'
        })
        estimatedTime *= 50
      }
    }

    if (hasGroupBy && !hasJoin && query.includes('having')) {
      newSuggestions.push({
        priority: 'medium',
        title: '优化GROUP BY查询',
        description: 'GROUP BY + HAVING可能较慢，考虑使用子查询预处理',
        code: 'SELECT * FROM (SELECT category, COUNT(*) FROM products GROUP BY category) WHERE count > 10'
      })
      estimatedTime *= 1.5
    }

    if (!query.includes('limit') && !hasGroupBy && query.includes('select')) {
      newSuggestions.push({
        priority: 'medium',
        title: '添加LIMIT限制',
        description: '限制结果集数量可以减少内存使用和传输时间',
        code: 'SELECT * FROM users LIMIT 100'
      })
      estimatedRows = Math.min(estimatedRows, 100)
      estimatedTime = Math.min(estimatedTime, 100)
    }

    if (query.includes('in (') && query.includes('select')) {
      newSuggestions.push({
        priority: 'medium',
        title: '优化IN子查询',
        description: 'IN子查询可能较慢，考虑使用EXISTS或JOIN替代',
        code: 'SELECT * FROM orders o WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id AND u.status = "active")'
      })
      estimatedTime *= 1.2
    }

    if (query.includes('function(') || query.includes('substring(') || query.includes('concat(')) {
      newSuggestions.push({
        priority: 'medium',
        title: '避免在WHERE中使用函数',
        description: '函数操作会导致索引失效，考虑在应用层处理或使用计算列',
        code: 'WHERE created_at >= "2024-01-01" -- 而不是 YEAR(created_at) = 2024'
      })
      indexUsage = 30
    }

    // 生成索引建议
    if (query.includes('where') && query.includes('users')) {
      if (query.includes('status =')) {
        newIndexSuggestions.push({
          type: 'CREATE',
          name: 'idx_users_status',
          columns: ['status'],
          improvement: '提升WHERE条件过滤速度80%'
        })
      }
      if (query.includes('created_at')) {
        newIndexSuggestions.push({
          type: 'CREATE',
          name: 'idx_users_created_at',
          columns: ['created_at'],
          improvement: '提升时间范围查询速度70%'
        })
      }
    }

    // 根据数据库类型调整建议
    if (databaseType.value === 'mysql') {
      if (query.includes('group by') && !query.includes('order by')) {
        newSuggestions.push({
          priority: 'low',
          title: 'MySQL GROUP BY建议',
          description: 'MySQL的GROUP BY可能包含所有非聚合字段',
          code: 'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id ORDER BY COUNT(*) DESC'
        })
      }
    } else if (databaseType.value === 'postgresql') {
      newSuggestions.push({
        priority: 'low',
        title: '考虑使用PostgreSQL特性',
        description: 'PostgreSQL支持窗口函数和更好的查询优化器',
        code: 'SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price) as rn FROM products'
      })
    }

    // 更新分析结果
    analysisResults.value = {
      cost: Math.round(estimatedRows / 100),
      rows: estimatedRows,
      indexUsage: Math.max(0, Math.min(100, indexUsage)),
      complexity,
      estimatedTime: Math.round(estimatedTime)
    }

    suggestions.value = newSuggestions
    indexSuggestions.value = newIndexSuggestions

  } catch (e) {
    console.error('分析失败:', e)
    sqlError.value = true
  }
}
</script>