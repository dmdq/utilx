<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">XSS攻击检测器</h1>
      <p class="text-muted-foreground mb-6">检测和防御XSS跨站脚本攻击</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- XSS检测输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">XSS检测</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入待检测内容</label>
              <textarea
                v-model="inputContent"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="4"
                placeholder="请输入要检测的内容..."
                @input="detectXSS"
              ></textarea>
            </div>

            <!-- 检测选项 -->
            <div>
              <label class="block text-sm font-medium mb-2">检测选项</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" v-model="options.checkTags" class="mr-2">
                  <span class="text-sm">检测HTML标签</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="options.checkEvents" class="mr-2">
                  <span class="text-sm">检测事件处理器</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="options.checkProtocols" class="mr-2">
                  <span class="text-sm">检测危险协议</span>
                </label>
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
                @click="copyContent"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                复制
              </button>
            </div>
          </div>
        </div>

        <!-- 批量检测 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">批量检测</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">批量输入（每行一个）</label>
              <textarea
                v-model="batchContent"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="6"
                placeholder="请输入多个待检测内容，每行一个..."
              ></textarea>
            </div>

            <button
              @click="batchDetect"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              批量检测
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：检测结果 -->
      <div class="space-y-6">
        <!-- 检测结果 -->
        <div v-if="detectionResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">检测结果</h3>

          <div class="space-y-4">
            <!-- 安全状态 -->
            <div class="p-4 rounded-lg"
                 :class="detectionResult.isSafe ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
              <div class="flex items-center gap-2 mb-2">
                <Shield v-if="detectionResult.isSafe" class="w-5 h-5" />
                <AlertTriangle v-else class="w-5 h-5" />
                <span class="font-medium">
                  {{ detectionResult.isSafe ? '安全' : '检测到XSS攻击' }}
                </span>
              </div>
              <div class="text-sm">{{ detectionResult.message }}</div>
            </div>

            <!-- 威胁详情 -->
            <div v-if="detectionResult.threats && detectionResult.threats.length > 0">
              <h4 class="font-medium mb-2">威胁详情</h4>
              <div class="space-y-2">
                <div v-for="(threat, index) in detectionResult.threats" :key="index"
                     class="p-3 bg-red-50 border border-red-200 rounded">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm">{{ threat.type }}</span>
                    <span class="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                      {{ threat.severity }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600 mt-1">{{ threat.description }}</div>
                </div>
              </div>
            </div>

            <!-- 安全建议 -->
            <div>
              <h4 class="font-medium mb-2">安全建议</h4>
              <div class="text-sm space-y-1">
                <div>• 使用输出编码和转义</div>
                <div>• 实施内容安全策略(CSP)</div>
                <div>• 验证和过滤用户输入</div>
                <div>• 使用安全的API方法</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量检测结果 -->
        <div v-if="batchResults.length > 0" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">批量检测结果</h3>
          <div class="space-y-3">
            <div v-for="(result, index) in batchResults" :key="index"
                 class="p-3 border rounded">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm truncate">{{ result.content }}</span>
                <span class="text-xs px-2 py-1 rounded"
                      :class="result.isSafe ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'">
                  {{ result.isSafe ? '安全' : '危险' }}
                </span>
              </div>
              <div v-if="!result.isSafe" class="text-xs text-red-600">
                检测到威胁: {{ result.threatCount }} 个
              </div>
            </div>
          </div>
        </div>

        <!-- XSS防护知识 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">XSS防护知识</h3>
          <div class="space-y-4 text-sm">
            <div>
              <h4 class="font-medium mb-2">常见XSS攻击类型</h4>
              <div class="space-y-1 text-xs">
                <div>• <strong>存储型XSS</strong>: 恶意代码存储在服务器上</div>
                <div>• <strong>反射型XSS</strong>: 恶意代码通过URL参数反射</div>
                <div>• <strong>DOM型XSS</strong>: 修改DOM树执行攻击</div>
              </div>
            </div>

            <div>
              <h4 class="font-medium mb-2">防护措施</h4>
              <div class="space-y-1 text-xs">
                <div>• 输入验证和过滤</div>
                <div>• 输出编码和转义</div>
                <div>• 使用HTTP Only Cookie</div>
                <div>• 实施CSP策略</div>
                <div>• 使用安全的框架和库</div>
              </div>
            </div>

            <div>
              <h4 class="font-medium mb-2">检测工具推荐</h4>
              <div class="space-y-1 text-xs">
                <div>• OWASP ZAP</div>
                <div>• Burp Suite</div>
                <div>• XSStrike</div>
                <div>• 手工代码审查</div>
              </div>
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
setPageTitle('XSS攻击检测器')

// 状态管理
const inputContent = ref('')
const batchContent = ref('')
const detectionResult = ref(null)
const batchResults = ref([])

// 检测选项
const options = ref({
  checkTags: true,
  checkEvents: true,
  checkProtocols: true
})

// XSS检测模式
const xssPatterns = {
  tags: [
    { pattern: /<script[^>]*>/gi, type: 'Script标签', severity: 'high' },
    { pattern: /<iframe[^>]*>/gi, type: 'Iframe标签', severity: 'high' },
    { pattern: /<object[^>]*>/gi, type: 'Object标签', severity: 'high' },
    { pattern: /<embed[^>]*>/gi, type: 'Embed标签', severity: 'high' },
    { pattern: /<link[^>]*>/gi, type: 'Link标签', severity: 'medium' },
    { pattern: /<meta[^>]*>/gi, type: 'Meta标签', severity: 'medium' },
    { pattern: /<style[^>]*>/gi, type: 'Style标签', severity: 'medium' },
    { pattern: /<img[^>]*>/gi, type: 'Img标签', severity: 'low' }
  ],

  events: [
    { pattern: /on\w+\s*=/gi, type: '事件处理器', severity: 'high' },
    { pattern: /onload/gi, type: 'Onload事件', severity: 'high' },
    { pattern: /onerror/gi, type: 'Onerror事件', severity: 'high' },
    { pattern: /onclick/gi, type: 'Onclick事件', severity: 'medium' }
  ],

  protocols: [
    { pattern: /javascript:/gi, type: 'JavaScript协议', severity: 'high' },
    { pattern: /data:/gi, type: 'Data协议', severity: 'medium' },
    { pattern: /vbscript:/gi, type: 'VBScript协议', severity: 'high' }
  ]
}

// XSS检测函数
const detectXSS = () => {
  if (!inputContent.value.trim()) {
    detectionResult.value = null
    return
  }

  const content = inputContent.value
  const threats = []

  // 检测HTML标签
  if (options.value.checkTags) {
    xssPatterns.tags.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        threats.push({
          type: pattern.type,
          severity: pattern.severity,
          description: `检测到${pattern.type}，可能被用于XSS攻击`
        })
      }
    })
  }

  // 检测事件处理器
  if (options.value.checkEvents) {
    xssPatterns.events.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        threats.push({
          type: pattern.type,
          severity: pattern.severity,
          description: `检测到${pattern.type}，可能执行恶意脚本`
        })
      }
    })
  }

  // 检测危险协议
  if (options.value.checkProtocols) {
    xssPatterns.protocols.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        threats.push({
          type: pattern.type,
          severity: pattern.severity,
          description: `检测到${pattern.type}，可能执行恶意代码`
        })
      }
    })
  }

  // 额外的模式检测
  const additionalPatterns = [
    { pattern: /eval\s*\(/gi, type: 'Eval函数', severity: 'high' },
    { pattern: /document\.cookie/gi, type: 'Cookie访问', severity: 'medium' },
    { pattern: /document\.write/gi, type: 'Document写入', severity: 'medium' },
    { pattern: /innerHTML\s*=/gi, type: 'InnerHTML', severity: 'medium' },
    { pattern: /outerHTML\s*=/gi, type: 'OuterHTML', severity: 'medium' }
  ]

  additionalPatterns.forEach(pattern => {
    if (pattern.pattern.test(content)) {
      threats.push({
        type: pattern.type,
        severity: pattern.severity,
        description: `检测到${pattern.type}，存在安全风险`
      })
    }
  })

  // 计算风险等级
  const highThreats = threats.filter(t => t.severity === 'high').length
  const mediumThreats = threats.filter(t => t.severity === 'medium').length
  const lowThreats = threats.filter(t => t.severity === 'low').length

  let riskLevel = 'safe'
  let message = '内容安全，未检测到XSS威胁'

  if (highThreats > 0) {
    riskLevel = 'danger'
    message = `检测到${highThreats}个高风险威胁，内容可能包含XSS攻击`
  } else if (mediumThreats > 2) {
    riskLevel = 'warning'
    message = `检测到${mediumThreats}个中风险威胁，建议进一步检查`
  } else if (mediumThreats > 0 || lowThreats > 3) {
    riskLevel = 'low'
    message = `检测到${mediumThreats + lowThreats}个低风险威胁，需要注意`
  }

  detectionResult.value = {
    isSafe: riskLevel === 'safe',
    riskLevel,
    message,
    threats,
    threatCount: threats.length,
    highThreats,
    mediumThreats,
    lowThreats
  }
}

// 批量检测
const batchDetect = () => {
  if (!batchContent.value.trim()) {
    alert('请输入要批量检测的内容')
    return
  }

  const lines = batchContent.value.split('\n').filter(line => line.trim())
  const results = []

  lines.forEach(content => {
    const tempContent = inputContent.value
    inputContent.value = content
    detectXSS()

    results.push({
      content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      isSafe: detectionResult.value?.isSafe || true,
      threatCount: detectionResult.value?.threatCount || 0,
      riskLevel: detectionResult.value?.riskLevel || 'safe'
    })

    inputContent.value = tempContent
  })

  batchResults.value = results
}

// 清空输入
const clearInput = () => {
  inputContent.value = ''
  detectionResult.value = null
}

// 粘贴内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputContent.value = text
    detectXSS()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 复制内容
const copyContent = async () => {
  if (!inputContent.value) return

  try {
    await navigator.clipboard.writeText(inputContent.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}
</script>

<style scoped>
textarea:focus,
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>