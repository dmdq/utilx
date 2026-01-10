<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Unix时间戳边界查询工具 - 时间戳最大最小值查询</h1>
      <p class="text-muted-foreground">在线Unix时间戳边界查询工具，查询32位、64位时间戳范围，Y2K38问题，特殊日期时间戳对照表。支持时间戳与日期互转，纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 时间戳边界查询 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          时间戳边界查询
        </h2>

        <div class="space-y-4">
          <!-- 32位有符号整数范围 -->
          <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div class="text-sm font-medium text-destructive mb-2">32位有符号整数范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">最小值:</span>
                <code class="font-mono text-foreground">{{ int32Min }}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">最大值:</span>
                <code class="font-mono text-foreground">{{ int32Max }}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">日期:</span>
                <span class="text-destructive font-medium">
                  {{ formatDate(int32MinDate) }} ~ {{ formatDate(int32MaxDate) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 32位无符号整数范围 -->
          <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div class="text-sm font-medium text-green-600 dark:text-green-400 mb-2">32位无符号整数范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">最小值:</span>
                <code class="font-mono text-foreground">0</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">最大值:</span>
                <code class="font-mono text-foreground">{{ uint32Max }}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">日期:</span>
                <span class="text-green-600 dark:text-green-400 font-medium">
                  1970-01-01 ~ {{ formatDate(uint32MaxDate) }}
                </span>
              </div>
            </div>
          </div>

          <!-- JavaScript范围 -->
          <div class="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div class="text-sm font-medium text-primary mb-2">JavaScript Number范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">安全整数:</span>
                <code class="font-mono text-foreground">±{{ Number.MAX_SAFE_INTEGER }}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">日期:</span>
                <span class="text-primary font-medium">
                  {{ jsMinDateStr }} ~ {{ jsMaxDateStr }}
                </span>
              </div>
            </div>
          </div>

          <!-- 64位整数范围 -->
          <div class="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div class="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">64位整数范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">毫秒级最大值:</span>
                <code class="font-mono text-foreground text-xs truncate">{{ int64MaxMs }}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">日期:</span>
                <span class="text-purple-600 dark:text-purple-400 font-medium">
                  ~ {{ int64MaxDateStr }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 特殊日期时间戳 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary" />
          特殊日期时间戳
        </h2>

        <div class="space-y-3">
          <!-- Unix纪元 -->
          <div class="p-4 bg-muted rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-foreground">Unix纪元</div>
                <div class="text-sm text-muted-foreground">1970-01-01 00:00:00 UTC</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm text-foreground">秒: <span class="text-green-600">0</span></div>
                <div class="font-mono text-sm text-foreground">毫秒: <span class="text-green-600">0</span></div>
              </div>
            </div>
          </div>

          <!-- Y2K38问题 -->
          <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-destructive">Y2K38问题</div>
                <div class="text-sm text-muted-foreground">2038-01-19 03:14:07 UTC</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm text-foreground">秒: <span class="text-destructive">{{ int32Max }}</span></div>
                <div class="text-xs text-destructive">32位溢出</div>
              </div>
            </div>
          </div>

          <!-- 千年虫 -->
          <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-orange-600 dark:text-orange-400">千年虫</div>
                <div class="text-sm text-muted-foreground">2000-01-01 00:00:00 UTC</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm text-foreground">秒: <span class="text-orange-600">946684800</span></div>
              </div>
            </div>
          </div>

          <!-- 常用时间点 -->
          <div class="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div class="font-medium text-primary mb-3">常用时间点</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">2020-01-01:</span>
                <code class="font-mono text-foreground">{{ timestamp2020 }}</code>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">2024-01-01:</span>
                <code class="font-mono text-foreground">{{ timestamp2024 }}</code>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">2025-01-01:</span>
                <code class="font-mono text-foreground">{{ timestamp2025 }}</code>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">当前时间:</span>
                <code class="font-mono text-foreground">{{ currentTimestamp }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间戳计算器 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">时间戳计算</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- 日期转时间戳 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">日期转时间戳</label>
          <input
            v-model="inputDate"
            type="datetime-local"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            @input="convertToTimestamp"
          >
          <div v-if="convertedTimestamp" class="p-3 bg-muted rounded-lg">
            <div class="text-sm text-muted-foreground mb-1">时间戳</div>
            <div class="font-mono text-sm text-foreground">秒: {{ convertedTimestamp.sec }}</div>
            <div class="font-mono text-sm text-foreground">毫秒: {{ convertedTimestamp.ms }}</div>
          </div>
        </div>

        <!-- 时间戳转日期 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">时间戳转日期</label>
          <input
            v-model="inputTimestamp"
            type="number"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            placeholder="输入Unix时间戳(秒)"
            @input="convertToDate"
          >
          <div v-if="convertedDate" class="p-3 bg-muted rounded-lg">
            <div class="text-sm text-muted-foreground mb-1">对应日期</div>
            <div class="font-mono text-sm text-foreground">{{ convertedDate }}</div>
            <div class="text-xs text-muted-foreground mt-1">UTC时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 p-2 hover:bg-muted rounded transition-colors"
        :title="isSeoContentVisible ? '收起' : '展开'"
      >
        <HelpCircle v-if="!isSeoContentVisible" :size="20" class="text-muted-foreground" />
        <ChevronUp v-else :size="20" class="text-muted-foreground" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span class="text-primary">#</span>
          Unix时间戳边界查询工具 - 使用指南
        </h2>

        <div class="space-y-6 text-muted-foreground">
          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">什么是Unix时间戳？</h3>
            <p>
              Unix时间戳（Unix timestamp）是一种时间表示方式，定义为从格林威治时间1970年01月01日00时00分00秒起至现在的总秒数。
              它是Unix和类Unix系统中广泛使用的时间表示方法，也被许多编程语言和数据库采用。
              时间戳的优点是简单、易于计算和比较，但在使用时需要注意其有效范围。
            </p>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">时间戳的边界范围</h3>
            <p>
              不同数据类型的时间戳有不同的有效范围：<br>
              <strong class="text-foreground">32位有符号整数</strong>：范围从-2147483648到2147483647，对应日期为1901年到2038年。<br>
              <strong class="text-foreground">32位无符号整数</strong>：范围从0到4294967295，对应日期为1970年到2106年。<br>
              <strong class="text-foreground">JavaScript Number</strong>：安全整数范围±9007199254740991，可表示约±285616年的日期范围。<br>
              <strong class="text-foreground">64位整数</strong>：理论最大值为9223372036854775807毫秒，对应日期约为公元292278994年。
            </p>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">什么是Y2K38问题？</h3>
            <p>
              Y2K38问题（又称Unix千年虫）是指2038年1月19日03:14:07 UTC时，32位有符号整数Unix时间戳将达到最大值2147483647，
              再过一秒将溢出变为-2147483648。这会导致时间显示为1901年，引发系统故障。
              这类似于2000年的千年虫问题，会影响使用32位有符号整数存储时间戳的系统。
              解决方案是使用64位整数存储时间戳，或将时间戳存储为毫秒级。
            </p>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">如何使用本工具？</h3>
            <ul class="list-disc list-inside space-y-2">
              <li>查看不同数据类型的时间戳边界范围和对应日期</li>
              <li>了解Y2K38问题和千年虫等特殊时间节点</li>
              <li>使用时间戳计算器进行日期和时间戳互转</li>
              <li>查询常用日期的时间戳值</li>
              <li>在开发中验证时间戳是否在有效范围内</li>
            </ul>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">编程语言的时间戳处理差异</h3>
            <div class="space-y-3">
              <div>
                <h4 class="font-medium text-foreground">JavaScript</h4>
                <p class="text-sm">使用Number类型存储时间戳，精度到毫秒。安全整数范围±2^53，约±285616年。Date对象可表示范围约为±100000000天。</p>
              </div>
              <div>
                <h4 class="font-medium text-foreground">Java</h4>
                <p class="text-sm">System.currentTimeMillis()返回long类型64位毫秒时间戳，Integer类型32位秒级时间戳。</p>
              </div>
              <div>
                <h4 class="font-medium text-foreground">Python</h4>
                <p class="text-sm">int类型自动扩展，理论上无溢出问题。time.time()返回浮点数秒级时间戳。</p>
              </div>
              <div>
                <h4 class="font-medium text-foreground">C/C++</h4>
                <p class="text-sm">time_t类型，32位或64位取决于系统和编译器。需要注意跨平台兼容性。</p>
              </div>
            </div>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">应用场景</h3>
            <ul class="list-disc list-inside space-y-2">
              <li>数据库时间戳字段设计和验证</li>
              <li>API接口中的时间参数校验</li>
              <li>日志系统和监控系统的时间记录</li>
              <li>缓存过期时间的计算和设置</li>
              <li>定时任务调度系统的时间处理</li>
              <li>跨时区应用的时间标准化处理</li>
            </ul>
          </section>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              :size="20"
              class="text-primary"
            />
            <h3 class="font-semibold text-foreground">{{ relatedTool.name }}</h3>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Clock, Calendar, RefreshCw, Calculator, HelpCircle, ChevronUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'Unix时间戳边界查询工具 - 时间戳最大最小值 | Util工具箱',
  description: '在线Unix时间戳边界查询工具，查询32位、64位时间戳范围，Y2K38问题，特殊日期时间戳对照表。支持时间戳与日期互转，纯本地计算，数据隐私绝对安全。',
  keywords: 'Unix时间戳边界,Y2K38,时间戳最大值,时间戳范围,Unix时间戳溢出,时间戳转换,时间戳计算',
  author: 'Util工具箱',
  ogTitle: 'Unix时间戳边界查询工具 - 时间戳范围查询',
  ogDescription: '专业的Unix时间戳边界查询工具，查询32位、64位时间戳范围，Y2K38问题，特殊日期时间戳对照表。',
  ogImage: 'https://www.util.cn/images/tools/unix-timestamp-bounds.png',
  ogUrl: 'https://www.util.cn/tools/unix-timestamp-bounds',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Unix时间戳边界查询工具 - 时间戳范围查询',
  twitterDescription: '专业的Unix时间戳边界查询工具，查询32位、64位时间戳范围，Y2K38问题。',
  twitterImage: 'https://www.util.cn/images/tools/unix-timestamp-bounds.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Unix时间戳边界查询工具',
            description: '在线Unix时间戳边界查询工具，查询32位、64位时间戳范围，Y2K38问题',
            url: 'https://www.util.cn/tools/unix-timestamp-bounds',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '32位时间戳范围查询',
              '64位时间戳范围查询',
              'Y2K38问题说明',
              '时间戳转换',
              '日期时间戳互转',
              '特殊日期查询',
              '本地安全处理'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Util工具箱',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Unix时间戳边界查询工具',
                item: 'https://www.util.cn/tools/unix-timestamp-bounds'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 常量
const int32Min = -2147483648
const int32Max = 2147483647
const uint32Max = 4294967295
const int64MaxMs = '9223372036854775807'

// 计算日期
const int32MinDate = new Date(int32Min * 1000)
const int32MaxDate = new Date(int32Max * 1000)
const uint32MaxDate = new Date(uint32Max * 1000)

// JavaScript安全整数范围对应的日期（大约范围）
// Number.MAX_SAFE_INTEGER = 9007199254740991 毫秒 ≈ 285616年
const jsMinDateStr = '约公元-271821年'
const jsMaxDateStr = '约公元275760年'

// 64位毫秒时间戳最大值对应的日期
// int64MaxMs = 9223372036854775807 毫秒 ≈ 公元292278994年
const int64MaxDateStr = '约公元292278994年'

// 格式化日期
function formatDate(date) {
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '超出Date范围'
  }
  return date.toISOString().replace('T', ' ').replace('.000Z', ' UTC')
}

// 常用时间戳
const timestamp2020 = Math.floor(new Date('2020-01-01').getTime() / 1000)
const timestamp2024 = Math.floor(new Date('2024-01-01').getTime() / 1000)
const timestamp2025 = Math.floor(new Date('2025-01-01').getTime() / 1000)
const currentTimestamp = Math.floor(Date.now() / 1000)

// State
const inputDate = ref('')
const inputTimestamp = ref('')
const convertedTimestamp = ref(null)
const convertedDate = ref('')
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Clock, Calendar, RefreshCw, Calculator
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'timestamp-convert'),
    tools.find(t => t.id === 'timestamp-batch-convert'),
    tools.find(t => t.id === 'date-formatter'),
    tools.find(t => t.id === 'time-unit-convert')
  ].filter(Boolean)

  return recommended
})

// 日期转时间戳
function convertToTimestamp() {
  if (!inputDate.value) {
    convertedTimestamp.value = null
    return
  }

  const date = new Date(inputDate.value)
  const ms = date.getTime()
  const sec = Math.floor(ms / 1000)

  convertedTimestamp.value = {
    sec,
    ms
  }
}

// 时间戳转日期
function convertToDate() {
  const ts = parseInt(inputTimestamp.value)
  if (isNaN(ts)) {
    convertedDate.value = '无效的时间戳'
    return
  }

  const date = new Date(ts * 1000)
  if (isNaN(date.getTime())) {
    convertedDate.value = '日期超出有效范围'
    return
  }

  convertedDate.value = formatDate(date)
}

// SEO内容折叠状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
