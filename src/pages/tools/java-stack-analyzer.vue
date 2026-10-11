<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Bug class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Java堆栈异常解析器</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴异常堆栈，折叠框架帧、高亮业务代码行、理清 Caused by 异常链</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        把又长又乱的 Java 异常堆栈粘贴进来，自动按 Caused by / Suppressed 分段，识别每帧的包名、类名、方法与文件行号；JDK、Spring、Netty 等框架帧默认折叠，业务代码帧高亮置顶，点击任意一帧即可复制。顶部摘要直接给出根因异常、消息、堆栈深度与完整异常链。解析全部在浏览器本地完成。
      </p>
    </div>

    <!-- 摘要区 -->
    <div v-if="parsed.secs.length > 0" class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
        <Info class="w-5 h-5 mr-2 text-primary" /> 异常摘要
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs text-muted-foreground mb-1">根因异常</p>
          <p class="text-sm font-bold text-red-600 dark:text-red-400 break-all">{{ rootException.name || '—' }}</p>
          <p v-if="rootException.message" class="text-xs text-muted-foreground mt-1 break-all">{{ rootException.message }}</p>
        </div>
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs text-muted-foreground mb-1">堆栈深度</p>
          <p class="text-sm font-bold text-foreground">{{ parsed.total }} 帧</p>
          <p class="text-xs text-muted-foreground mt-1">业务帧 {{ parsed.business }} 个 · 框架帧 {{ parsed.total - parsed.business }} 个</p>
        </div>
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs text-muted-foreground mb-1">异常链（{{ chain.length }} 层）</p>
          <div class="flex flex-wrap items-center gap-1 mt-0.5">
            <template v-for="(name, i) in chain" :key="i">
              <span v-if="i > 0" class="text-muted-foreground text-xs">←</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono break-all">{{ shortName(name) }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 堆栈输入
        </h2>
        <textarea
          v-model="inputText"
          class="w-full h-96 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴完整的 Java 异常堆栈，例如：&#10;java.lang.NullPointerException: xxx is null&#10;&#9;at com.example.service.UserService.getUser(UserService.java:45)&#10;&#9;at java.base/java.lang.reflect.Method.invoke(Method.java:568)&#10;Caused by: java.lang.IllegalStateException: ..."
          spellcheck="false"
        ></textarea>
        <div class="flex gap-2">
          <button
            @click="fillSample"
            class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
          >填入示例</button>
          <button
            @click="inputText = ''"
            class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
          >清空</button>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          已识别的框架前缀（命中即默认折叠）：java. / javax. / sun. / jdk. / org.springframework. / org.apache. / io.netty. / com.alibaba. / ch.qos.logback. / org.hibernate. / com.mysql. 等。业务代码帧始终显示并高亮。
        </p>
      </div>

      <!-- 右侧：分段结果 -->
      <div class="space-y-4">
        <div v-if="parsed.secs.length > 0">
          <div v-for="(sec, si) in parsed.secs" :key="si" class="bg-card border border-border rounded-lg p-4 mb-4">
            <!-- 段头 -->
            <div class="flex items-start gap-2 mb-3">
              <span
                :class="sec.kind === 'root' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : sec.kind === 'suppressed' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'"
                class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5"
              >{{ kindLabel(sec.kind) }}</span>
              <div class="min-w-0">
                <p class="text-sm font-bold text-foreground font-mono break-all">{{ sec.exceptionName || sec.header }}</p>
                <p v-if="sec.message" class="text-xs text-muted-foreground mt-0.5 break-all">{{ sec.message }}</p>
              </div>
            </div>

            <!-- 业务帧（高亮） -->
            <div class="space-y-1">
              <template v-for="(f, fi) in sec.frames" :key="fi">
                <button
                  v-if="!f.framework"
                  @click="copyText(f.full, 'f' + si + '-' + fi)"
                  class="w-full text-left px-2.5 py-1.5 rounded border-l-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors font-mono text-xs"
                  :title="copiedKey === 'f' + si + '-' + fi ? '已复制' : '点击复制这一帧'"
                >
                  <span class="text-muted-foreground">at </span><span class="text-muted-foreground">{{ f.pkg ? f.pkg + '.' : '' }}</span><span class="text-primary font-semibold">{{ f.simple }}</span>.{{ f.method }}(<span class="text-orange-600 dark:text-orange-400">{{ f.file }}{{ f.line ? ':' + f.line : '' }}</span>)
                  <Check v-if="copiedKey === 'f' + si + '-' + fi" class="w-3 h-3 inline text-green-600 ml-1" />
                </button>

                <!-- 框架帧（默认折叠） -->
                <button
                  v-else-if="expandedSections[si]"
                  @click="copyText(f.full, 'f' + si + '-' + fi)"
                  class="w-full text-left px-2.5 py-1.5 rounded border-l-2 border-border text-muted-foreground hover:bg-muted/50 transition-colors font-mono text-xs"
                  :title="copiedKey === 'f' + si + '-' + fi ? '已复制' : '点击复制这一帧'"
                >
                  <span>at {{ f.pkg ? f.pkg + '.' : '' }}{{ f.simple }}.{{ f.method }}({{ f.file }}{{ f.line ? ':' + f.line : '' }})</span>
                  <Check v-if="copiedKey === 'f' + si + '-' + fi" class="w-3 h-3 inline text-green-600 ml-1" />
                </button>
              </template>

              <!-- 折叠开关 -->
              <button
                v-if="sec.frameworkCount > 0 && !expandedSections[si]"
                @click="toggleSection(si)"
                class="w-full text-left px-2.5 py-1.5 rounded border-l-2 border-dashed border-border text-muted-foreground hover:bg-muted/50 transition-colors text-xs"
              >
                <ChevronDown class="w-3.5 h-3.5 inline mr-1" />
                已折叠 {{ sec.frameworkCount }} 个框架帧（JDK / Spring / 中间件等），点击展开
              </button>
              <button
                v-if="sec.frameworkCount > 0 && expandedSections[si]"
                @click="toggleSection(si)"
                class="w-full text-left px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                <ChevronUp class="w-3.5 h-3.5 inline mr-1" />
                收起框架帧
              </button>

              <p v-if="sec.more > 0" class="px-2.5 py-1 text-xs text-muted-foreground font-mono">... 还有 {{ sec.more }} 帧与上文相同</p>
            </div>
          </div>
        </div>

        <div v-else class="bg-card border border-border rounded-lg py-16 text-center">
          <Bug class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">粘贴异常堆栈后，这里会显示分段与折叠后的解析结果</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 Java 堆栈异常解析器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            一条真实的线上异常堆栈动辄几十上百帧，其中绝大部分是 JDK 反射、Spring AOP、Tomcat 容器这类与问题无关的框架帧。本工具按 <code class="font-mono">at 包名.类名.方法(文件名:行号)</code> 的格式切分每一帧，把框架帧默认折叠、业务帧高亮显示，让「第一眼看到自己代码」成为默认体验。
          </p>
          <h3 class="text-lg font-semibold text-foreground">怎么读堆栈</h3>
          <p>
            堆栈从上往下是调用顺序：第一段的第一帧就是异常抛出点。遇到 Caused by 表示下层异常被包装成了上层异常，最下面一个 Caused by 通常才是真正的根因；Suppressed 则是 try-with-resources 中被抑制的异常。本工具在摘要区直接给出异常链层级，帮助快速定位根因。
          </p>
          <h3 class="text-lg font-semibold text-foreground">使用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>排查日志平台复制出来的长堆栈，快速定位自己项目的类与行号</li>
            <li>把异常链发给同事或贴到工单时，折叠框架帧让内容更简洁可读</li>
            <li>点击复制某一帧，用于搜索、断点或在 Code Review 中引用</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">哪些帧会被折叠？</span>类名以 java.、javax.、sun.、jdk.、org.springframework.、org.apache.、io.netty.、com.alibaba.、ch.qos.logback.、org.hibernate.、com.mysql. 等框架前缀开头的帧默认折叠，随时可展开，展开后同样可以点击复制。</li>
            <li><span class="text-foreground font-medium">Caused by 和 Suppressed 是什么关系？</span>Caused by 表示异常包装链（下层是因、上层是果），Suppressed 表示资源关闭时被抑制的附加异常，两者都会分段展示并打上不同标签。</li>
            <li><span class="text-foreground font-medium">堆栈会上传吗？</span>不会。解析全部在浏览器本地完成，适合粘贴包含内网类名、机密消息的堆栈。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'java-stack-analyzer'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Bug, Info, FileText, Copy, Check,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Java堆栈异常解析器 - 折叠框架帧/高亮业务代码/异常链分析',
  description: '粘贴 Java 异常堆栈自动按 Caused by / Suppressed 分段，折叠 JDK、Spring、Netty 等框架帧，高亮业务代码行并显示文件行号，点击复制单帧，摘要展示根因异常与异常链，纯本地处理',
  keywords: 'java堆栈解析, 异常堆栈美化, caused by分析, 堆栈折叠, 日志排错工具',
  author: 'Util工具箱',
  ogTitle: 'Java堆栈异常解析器 - 有条工具',
  ogDescription: '折叠框架帧、高亮业务代码、理清 Caused by 异常链',
  ogUrl: 'https://www.util.cn/tools/java-stack-analyzer',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Java堆栈异常解析器',
          url: 'https://www.util.cn/tools/java-stack-analyzer',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Caused by/Suppressed 分段', '框架帧默认折叠', '业务帧高亮', '文件行号展示', '点击复制单帧']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Java堆栈异常解析器', item: 'https://www.util.cn/tools/java-stack-analyzer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '哪些帧会被折叠？',
              acceptedAnswer: { '@type': 'Answer', text: '类名以 java.、javax.、sun.、jdk.、org.springframework.、org.apache.、io.netty.、com.alibaba.、ch.qos.logback.、org.hibernate.、com.mysql. 等框架前缀开头的帧默认折叠，随时可展开，展开后同样可以点击复制。' }
            },
            {
              '@type': 'Question',
              name: 'Caused by 和 Suppressed 是什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: 'Caused by 表示异常包装链（下层是因、上层是果），Suppressed 表示资源关闭时被抑制的附加异常，两者都会分段展示并打上不同标签。' }
            },
            {
              '@type': 'Question',
              name: '堆栈会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析全部在浏览器本地完成，适合粘贴包含内网类名、机密消息的堆栈。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'java-stack-analyzer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const seoContentVisible = ref(true)
const expandedSections = ref({}) // 段索引 -> 是否展开框架帧，默认折叠
const copiedKey = ref('')
let copyTimer = null

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const toggleSection = (si) => {
  expandedSections.value[si] = !expandedSections.value[si]
}

// ---------- 复制 ----------
const copyText = async (text, key) => {
  if (!text) return
  let ok = false
  try {
    await navigator.clipboard.writeText(text)
    ok = true
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ok = true
    } catch (e2) {
      ok = false
    }
  }
  if (ok) {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  }
}

// ---------- 框架前缀 ----------
const FRAMEWORK_PREFIXES = [
  'java.', 'javax.', 'sun.', 'jdk.', 'com.sun.',
  'org.springframework.', 'org.apache.', 'io.netty.',
  'com.alibaba.', 'ch.qos.logback.', 'org.hibernate.',
  'com.mysql.', 'com.fasterxml.', 'org.slf4j.',
  'org.junit.', 'io.undertow.', 'org.eclipse.jetty.',
  'org.quartz.', 'reactor.', 'kotlin.', 'groovy.'
]

const isFramework = (cls) => {
  for (const p of FRAMEWORK_PREFIXES) {
    if (cls.startsWith(p)) return true
  }
  return false
}

// ---------- 解析 ----------
// 兼容 JDK9+ 模块格式：at java.base/java.lang.reflect.Method.invoke(Method.java:568)
const FRAME_RE = /^\s*at\s+(?:[\w.$-]+\/)?([\w$]+(?:\.[\w$]+)*)\.([\w$<>]+)\(([^)]*)\)\s*$/

const buildFrame = (m) => {
  const full = m[0].trim()
  const cls = m[1]
  const method = m[2]
  const inside = m[3]
  const lm = inside.match(/^(.*?):(\d+)$/)
  const file = lm ? lm[1] : inside
  const line = lm ? lm[2] : ''
  const lastDot = cls.lastIndexOf('.')
  const pkg = lastDot > -1 ? cls.slice(0, lastDot) : ''
  const simple = lastDot > -1 ? cls.slice(lastDot + 1) : cls
  return {
    full,
    cls,
    method,
    file,
    line,
    pkg,
    simple,
    framework: isFramework(cls)
  }
}

const parseStack = (text) => {
  const lines = text.split(/\r?\n/)
  const secs = []
  let cur = null
  const pushSection = (kind, header) => {
    cur = { kind, header, frames: [], more: 0 }
    secs.push(cur)
  }
  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ')
    if (!line.trim()) continue
    const cm = line.match(/^\s*(Caused by|Suppressed):\s*(.*)$/)
    const fm = line.match(FRAME_RE)
    const more = line.match(/^\s*\.\.\.\s*(\d+)\s+more\s*$/)
    if (cm) {
      pushSection(cm[1] === 'Caused by' ? 'caused' : 'suppressed', cm[2].trim())
    } else if (fm) {
      if (!cur) pushSection('root', '')
      cur.frames.push(buildFrame(fm))
    } else if (more) {
      if (cur) cur.more = parseInt(more[1], 10)
    } else {
      const trimmed = line.trim()
      const looksLikeHeader = /^[\w$.]+(Exception|Error|Throwable)/.test(trimmed)
      if (cur && cur.kind === 'root' && cur.frames.length === 0 && !looksLikeHeader) {
        // 异常消息的续行，拼回同一段头
        cur.header = (cur.header ? cur.header + ' ' : '') + trimmed
      } else {
        pushSection('root', trimmed)
      }
    }
  }
  return secs
}

const splitHeader = (header) => {
  const m = header.match(/^([\w$.]+?(?:Exception|Error|Throwable))\s*(?::\s*([\s\S]*))?$/)
  if (m) {
    return { name: m[1], message: m[2] || '' }
  }
  return { name: header, message: '' }
}

// ---------- 派生数据 ----------
const parsed = computed(() => {
  const secs = parseStack(inputText.value)
  let total = 0
  let business = 0
  for (const s of secs) {
    s.frameworkCount = s.frames.filter(f => f.framework).length
    s.businessCount = s.frames.length - s.frameworkCount
    const h = splitHeader(s.header)
    s.exceptionName = h.name
    s.message = h.message
    total += s.frames.length
    business += s.businessCount
  }
  return { secs, total, business }
})

const rootException = computed(() => {
  const first = parsed.value.secs.find(s => s.kind === 'root')
  if (!first) return { name: '', message: '' }
  return { name: first.exceptionName || first.header, message: first.message }
})

const chain = computed(() => {
  return parsed.value.secs
    .filter(s => s.kind !== 'suppressed')
    .map(s => s.exceptionName)
    .filter(n => !!n)
})

const shortName = (name) => {
  const parts = name.split('.')
  return parts.length > 2 ? '...' + parts.slice(-2).join('.') : name
}

const kindLabel = (kind) => {
  if (kind === 'root') return '根异常'
  if (kind === 'suppressed') return 'Suppressed'
  return 'Caused by'
}

// ---------- 示例 ----------
const fillSample = () => {
  inputText.value = [
    'java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null',
    '\tat com.example.service.UserService.getDisplayName(UserService.java:45)',
    '\tat com.example.service.UserFacade.handle(UserFacade.java:30)',
    '\tat java.base/java.lang.reflect.Method.invoke(Method.java:568)',
    '\tat org.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:355)',
    'Caused by: java.lang.IllegalStateException: user profile not initialized',
    '\tat com.example.repository.UserRepository.load(UserRepository.java:88)',
    '\tat java.base/java.util.HashMap.get(HashMap.java:567)',
    '\t... 3 more',
    'Caused by: java.lang.IllegalArgumentException: empty config key',
    '\tat com.example.config.AppConfig.requireKey(AppConfig.java:12)',
    '\tat java.base/java.lang.Class.forName(Class.java:575)',
    '\t... 2 more'
  ].join('\n')
}
</script>
