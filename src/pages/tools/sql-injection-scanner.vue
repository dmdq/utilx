<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">SQL注入检测器</h1>
      <p class="text-muted-foreground mb-6">检测输入内容中的SQL注入攻击代码，提供安全建议和防护方案</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 输入内容 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">输入检测内容</h3>
          <div class="space-y-4">
            <div>
              <textarea
                v-model="inputContent"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="8"
                placeholder="请输入要检测的内容..."
                @input="detectSQLInjection"
              ></textarea>
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium mb-2">SQL注入示例</label>
              <div class="grid grid-cols-1 gap-2">
                <button
                  @click="inputContent = '1\' OR \'1\'=\'1'; detectSQLInjection()"
                  class="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm text-left"
                >
                  1' OR '1'='1'
                </button>
                <button
                  @click="inputContent = 'admin\'--'; detectSQLInjection()"
                  class="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm text-left"
                >
                  admin'--
                </button>
                <button
                  @click="inputContent = '1 UNION SELECT * FROM users--'; detectSQLInjection()"
                  class="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm text-left"
                >
                  1 UNION SELECT * FROM users--
                </button>
                <button
                  @click="inputContent = '正常用户输入内容'; detectSQLInjection()"
                  class="px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm text-left"
                >
                  正常用户输入内容
                </button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="clearInput"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                清空
              </button>
              <button
                @click="pasteFromClipboard"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                粘贴
              </button>
              <button
                @click="loadFromRequest"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                模拟请求
              </button>
            </div>
          </div>
        </div>

        <!-- 检测配置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">检测配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">数据库类型</label>
              <select
                v-model="detectionConfig.databaseType"
                @change="detectSQLInjection"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlite">SQLite</option>
                <option value="oracle">Oracle</option>
                <option value="mssql">SQL Server</option>
                <option value="all">全部</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">检测级别</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="detectionConfig.level = 'basic'"
                  :class="detectionConfig.level === 'basic' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                  class="px-3 py-2 rounded text-sm"
                >
                  基础
                </button>
                <button
                  @click="detectionConfig.level = 'standard'"
                  :class="detectionConfig.level === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                  class="px-3 py-2 rounded text-sm"
                >
                  标准
                </button>
                <button
                  @click="detectionConfig.level = 'advanced'"
                  :class="detectionConfig.level === 'advanced' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                  class="px-3 py-2 rounded text-sm"
                >
                  高级
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">检测选项</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="detectionConfig.checkUnion"
                    type="checkbox"
                    class="mr-2"
                    @change="detectSQLInjection"
                  />
                  <span class="text-sm">UNION注入</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="detectionConfig.checkBoolean"
                    type="checkbox"
                    class="mr-2"
                    @change="detectSQLInjection"
                  />
                  <span class="text-sm">布尔盲注</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="detectionConfig.checkTime"
                    type="checkbox"
                    class="mr-2"
                    @change="detectSQLInjection"
                  />
                  <span class="text-sm">时间盲注</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="detectionConfig.checkError"
                    type="checkbox"
                    class="mr-2"
                    @change="detectSQLInjection"
                  />
                  <span class="text-sm">报错注入</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 请求模拟器 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">请求模拟器</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">HTTP方法</label>
              <select
                v-model="requestSimulator.method"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">参数</label>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="requestSimulator.paramKey"
                    type="text"
                    placeholder="参数名"
                    class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    v-model="requestSimulator.paramValue"
                    type="text"
                    placeholder="参数值"
                    class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  @click="addParameter"
                  class="w-full px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  添加参数
                </button>
              </div>

              <div v-if="requestSimulator.parameters.length > 0" class="mt-2 space-y-1">
                <div v-for="(param, index) in requestSimulator.parameters" :key="index"
                     class="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                  <span>{{ param.key }}: {{ param.value }}</span>
                  <button
                    @click="removeParameter(index)"
                    class="text-red-600 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>

            <button
              @click="simulateRequest"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              模拟请求检测
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：检测结果 -->
      <div class="space-y-6">
        <!-- 检测结果概览 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">检测结果</h3>
          <div v-if="detectionResult" class="space-y-4">
            <!-- 风险等级 -->
            <div class="text-center">
              <div class="text-5xl font-bold mb-2" :class="getRiskColorClass(detectionResult.riskLevel)">
                {{ detectionResult.riskLevel }}
              </div>
              <div class="text-lg text-muted-foreground">风险等级</div>
            </div>

            <!-- 统计信息 -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="text-center p-3 bg-secondary rounded-lg">
                <div class="text-lg font-semibold">{{ detectionResult.totalThreats }}</div>
                <div class="text-xs text-muted-foreground">威胁总数</div>
              </div>
              <div class="text-center p-3 bg-secondary rounded-lg">
                <div class="text-lg font-semibold">{{ detectionResult.threatTypes.length }}</div>
                <div class="text-xs text-muted-foreground">威胁类型</div>
              </div>
            </div>

            <!-- 威胁类型 -->
            <div v-if="detectionResult.threatTypes.length > 0">
              <div class="text-sm font-medium mb-2">检测到的威胁类型</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="type in detectionResult.threatTypes" :key="type"
                      class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  {{ type }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入内容进行SQL注入检测
          </div>
        </div>

        <!-- 详细分析 -->
        <div v-if="detectionResult && detectionResult.details" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">详细分析</h3>
          <div class="space-y-3">
            <div v-for="detail in detectionResult.details" :key="detail.id"
                 class="p-3 rounded-lg border"
                 :class="getSeverityClass(detail.severity)">
              <div class="flex items-center gap-2 mb-2">
                <AlertTriangle class="w-4 h-4" />
                <span class="font-medium">{{ detail.type }}</span>
                <span class="text-xs px-2 py-1 rounded"
                      :class="getSeverityBadgeClass(detail.severity)">
                  {{ detail.severity }}
                </span>
              </div>
              <div class="text-sm text-muted-foreground mb-1">
                {{ detail.description }}
              </div>
              <div class="font-mono text-xs bg-secondary p-2 rounded">
                匹配内容: {{ detail.match }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                位置: 字符 {{ detail.position?.start }} - {{ detail.position?.end }}
              </div>
            </div>
          </div>
        </div>

        <!-- 安全查询建议 -->
        <div v-if="detectionResult && detectionResult.safeQuery" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">安全查询建议</h3>
          <div class="space-y-2">
            <div class="p-3 bg-green-50 rounded font-mono text-sm break-all">
              {{ detectionResult.safeQuery }}
            </div>
            <button
              @click="copySafeQuery"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              复制安全查询
            </button>
          </div>
        </div>

        <!-- 防护建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">防护建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">使用参数化查询</div>
                <div class="text-xs text-muted-foreground">使用PreparedStatement或参数化查询避免SQL拼接</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">输入验证</div>
                <div class="text-xs text-muted-foreground">对用户输入进行类型、长度、格式验证</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">最小权限原则</div>
                <div class="text-xs text-muted-foreground">数据库用户只授予必要的最小权限</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">ORM框架</div>
                <div class="text-xs text-muted-foreground">使用成熟的ORM框架自动处理SQL安全</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <div class="font-medium">错误处理</div>
                <div class="text-xs text-muted-foreground">避免向用户展示详细的数据库错误信息</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <div class="font-medium">Web应用防火墙</div>
                <div class="text-xs text-muted-foreground">部署WAF提供额外的安全防护层</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 编程语言示例 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">安全代码示例</h3>
          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">PHP (PDO)</h4>
              <pre class="text-xs bg-secondary p-2 rounded overflow-x-auto"><code>$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);</code></pre>
            </div>

            <div>
              <h4 class="font-medium mb-2">Java (PreparedStatement)</h4>
              <pre class="text-xs bg-secondary p-2 rounded overflow-x-auto"><code>String sql = "SELECT * FROM users WHERE id = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setInt(1, userId);</code></pre>
            </div>

            <div>
              <h4 class="font-medium mb-2">Python (SQLAlchemy)</h4>
              <pre class="text-xs bg-secondary p-2 rounded overflow-x-auto"><code>user = session.query(User).filter(User.id == user_id).first()</code></pre>
            </div>

            <div>
              <h4 class="font-medium mb-2">Node.js (mysql2)</h4>
              <pre class="text-xs bg-secondary p-2 rounded overflow-x-auto"><code>const [rows] = await pool.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { AlertTriangle, Shield } from 'lucide-vue-next'

const { setPageTitle } = useSEO()
setPageTitle('SQL注入检测器')

// 状态管理
const inputContent = ref('')
const detectionResult = ref(null)

// 检测配置
const detectionConfig = ref({
  databaseType: 'all',
  level: 'standard',
  checkUnion: true,
  checkBoolean: true,
  checkTime: true,
  checkError: true
})

// 请求模拟器
const requestSimulator = ref({
  method: 'GET',
  paramKey: 'id',
  paramValue: '',
  parameters: []
})

// SQL注入检测规则
const sqlInjectionPatterns = {
  // 基础SQL注入
  basic: [
    { pattern: /('|(\')|(\'|\")|(\"))/gi, type: '引号注入', severity: 'high' },
    { pattern: /(;\s*$|;\s*\w+)/gi, type: '多语句注入', severity: 'high' },
    { pattern: /(\/\*|\*\/|--|#)/gi, type: '注释注入', severity: 'high' },
    { pattern: /(union\s+select)/gi, type: 'UNION注入', severity: 'high' },
    { pattern: /(select\s+.*\s+from\s+\w+)/gi, type: 'SELECT注入', severity: 'high' },
    { pattern: /(insert\s+into\s+\w+)/gi, type: 'INSERT注入', severity: 'high' },
    { pattern: /(update\s+\w+\s+set)/gi, type: 'UPDATE注入', severity: 'high' },
    { pattern: /(delete\s+from\s+\w+)/gi, type: 'DELETE注入', severity: 'high' }
  ],

  // 布尔盲注
  boolean: [
    { pattern: /(and\s+\d+\s*=\s*\d+)/gi, type: '布尔盲注', severity: 'medium' },
    { pattern: /(or\s+\d+\s*=\s*\d+)/gi, type: '布尔盲注', severity: 'medium' },
    { pattern: /(and\s+1\s*=\s*1)/gi, type: '恒真条件', severity: 'high' },
    { pattern: /(or\s+1\s*=\s*1)/gi, type: '恒真条件', severity: 'high' },
    { pattern: /(and\s+exists\s*\()/gi, type: 'EXISTS注入', severity: 'medium' }
  ],

  // 时间盲注
  time: [
    { pattern: /(sleep\s*\(|benchmark\s*\(|waitfor\s+delay)/gi, type: '时间盲注', severity: 'high' },
    { pattern: /(pg_sleep\s*\(|dbms_pipe\.receive_message)/gi, type: '时间盲注', severity: 'high' },
    { pattern: /(count\s*\(\s*\*\s*\))/gi, type: '计数攻击', severity: 'medium' }
  ],

  // 报错注入
  error: [
    { pattern: /(extractvalue\s*\(|updatexml\s*\(|floor\s*\(rand\s*\()/gi, type: '报错注入', severity: 'high' },
    { pattern: /(group_concat\s*\(|concat_ws\s*\()/gi, type: '报错注入', severity: 'medium' },
    { pattern: /(information_schema|sysobjects|sys\.tables)/gi, type: '信息查询', severity: 'high' }
  ],

  // 数据库特定
  mysql: [
    { pattern: /(@@version|@@datadir|@@hostname)/gi, type: 'MySQL变量', severity: 'high' },
    { pattern: /(load_file\s*\(|into\s+outfile)/gi, type: '文件操作', severity: 'high' }
  ],

  postgresql: [
    { pattern: /(pg_read_file|current_database\(\)|version\(\))/gi, type: 'PostgreSQL函数', severity: 'high' },
    { pattern: /(pg_sleep\s*\(|generate_series\s*\()/gi, type: 'PostgreSQL函数', severity: 'medium' }
  ],

  oracle: [
    { pattern: /(utl_http\.request|dbms_pipe\.receive_message)/gi, type: 'Oracle函数', severity: 'high' },
    { pattern: /(user_tables|all_tables|user_tab_columns)/gi, type: 'Oracle表查询', severity: 'high' }
  ]
}

// SQL注入检测
const detectSQLInjection = () => {
  if (!inputContent.value) {
    detectionResult.value = null
    return
  }

  const content = inputContent.value
  const threats = []
  const threatTypes = new Set()
  let totalThreats = 0

  const details = []

  // 根据检测级别选择规则
  let patterns = []
  if (detectionConfig.value.level === 'basic') {
    patterns = [...sqlInjectionPatterns.basic]
  } else if (detectionConfig.value.level === 'standard') {
    patterns = [...sqlInjectionPatterns.basic, ...sqlInjectionPatterns.boolean, ...sqlInjectionPatterns.error]
  } else {
    patterns = [
      ...sqlInjectionPatterns.basic,
      ...sqlInjectionPatterns.boolean,
      ...sqlInjectionPatterns.time,
      ...sqlInjectionPatterns.error
    ]
  }

  // 根据配置添加特定检测
  if (detectionConfig.value.checkUnion) {
    patterns.push(...sqlInjectionPatterns.basic.filter(p => p.type.includes('UNION')))
  }

  if (detectionConfig.value.checkBoolean) {
    patterns.push(...sqlInjectionPatterns.boolean)
  }

  if (detectionConfig.value.checkTime) {
    patterns.push(...sqlInjectionPatterns.time)
  }

  if (detectionConfig.value.checkError) {
    patterns.push(...sqlInjectionPatterns.error)
  }

  // 添加数据库特定规则
  if (detectionConfig.value.databaseType === 'mysql' || detectionConfig.value.databaseType === 'all') {
    patterns.push(...sqlInjectionPatterns.mysql)
  }
  if (detectionConfig.value.databaseType === 'postgresql' || detectionConfig.value.databaseType === 'all') {
    patterns.push(...sqlInjectionPatterns.postgresql)
  }
  if (detectionConfig.value.databaseType === 'oracle' || detectionConfig.value.databaseType === 'all') {
    patterns.push(...sqlInjectionPatterns.oracle)
  }

  // 检测SQL注入模式
  patterns.forEach(rule => {
    const matches = content.match(rule.pattern)
    if (matches) {
      matches.forEach(match => {
        const position = findPosition(content, match)
        details.push({
          id: `sql-${totalThreats++}`,
          type: rule.type,
          severity: rule.severity,
          description: `检测到${rule.type}，可能是SQL注入攻击`,
          match: match,
          position
        })
        threatTypes.add(rule.type)
      })
    }
  })

  // 计算风险等级
  let riskLevel = '安全'
  if (details.length > 0) {
    const highSeverityCount = details.filter(d => d.severity === 'high').length
    const mediumSeverityCount = details.filter(d => d.severity === 'medium').length

    if (highSeverityCount > 0) {
      riskLevel = '高危'
    } else if (mediumSeverityCount > 0) {
      riskLevel = '中危'
    } else {
      riskLevel = '低危'
    }
  }

  // 生成安全查询建议
  const safeQuery = generateSafeQuery(content)

  detectionResult.value = {
    riskLevel,
    totalThreats: details.length,
    threatTypes: Array.from(threatTypes),
    details: details.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    }),
    safeQuery
  }
}

// 查找字符串位置
const findPosition = (content, match) => {
  const index = content.indexOf(match)
  return {
    start: index,
    end: index + match.length
  }
}

// 生成安全查询建议
const generateSafeQuery = (content) => {
  if (detectionResult.value?.riskLevel === '安全') {
    return '输入内容安全，无需修改'
  }

  // 简单的安全查询生成示例
  return `// 使用参数化查询
PreparedStatement stmt = connection.prepareStatement(
    "SELECT * FROM users WHERE username = ?"
);
stmt.setString(1, userInput);
ResultSet rs = stmt.executeQuery();`
}

// 清空输入
const clearInput = () => {
  inputContent.value = ''
  detectionResult.value = null
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputContent.value = text
    detectSQLInjection()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 模拟请求
const loadFromRequest = () => {
  // 模拟HTTP请求参数
  inputContent.value = '1\' OR \'1\'=\'1'
  detectSQLInjection()
}

// 添加参数
const addParameter = () => {
  if (requestSimulator.value.paramKey && requestSimulator.value.paramValue) {
    requestSimulator.value.parameters.push({
      key: requestSimulator.value.paramKey,
      value: requestSimulator.value.paramValue
    })
    requestSimulator.value.paramKey = ''
    requestSimulator.value.paramValue = ''
  }
}

// 移除参数
const removeParameter = (index) => {
  requestSimulator.value.parameters.splice(index, 1)
}

// 模拟请求检测
const simulateRequest = () => {
  if (requestSimulator.value.parameters.length === 0) {
    return
  }

  // 构建请求字符串
  const params = requestSimulator.value.parameters.map(p => `${p.key}=${p.value}`).join('&')
  inputContent.value = params
  detectSQLInjection()
}

// 复制安全查询
const copySafeQuery = async () => {
  if (!detectionResult.value?.safeQuery) return

  try {
    await navigator.clipboard.writeText(detectionResult.value.safeQuery)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 获取风险等级颜色
const getRiskColorClass = (level) => {
  switch (level) {
    case '高危': return 'text-red-600'
    case '中危': return 'text-yellow-600'
    case '低危': return 'text-blue-600'
    default: return 'text-green-600'
  }
}

// 获取严重性样式
const getSeverityClass = (severity) => {
  switch (severity) {
    case 'high': return 'bg-red-50 text-red-800 border-red-200'
    case 'medium': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-blue-50 text-blue-800 border-blue-200'
    default: return 'bg-gray-50 text-gray-800 border-gray-200'
  }
}

// 获取严重性徽章样式
const getSeverityBadgeClass = (severity) => {
  switch (severity) {
    case 'high': return 'bg-red-600 text-white'
    case 'medium': return 'bg-yellow-600 text-white'
    case 'low': return 'bg-blue-600 text-white'
    default: return 'bg-gray-600 text-white'
  }
}
</script>

<style scoped>
textarea:focus,
select:focus,
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>