<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <LayoutGrid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">会议桌牌批量生成</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴名单批量生成对折桌牌，双面镜像排版，A4 打印即用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        每行一位参会人（可附职位），工具为每人生成一页 A4 横向桌牌：下半为正面、上半旋转 180°，
        沿中线对折后正反两面都能读。姓名字号按字数自动适配，支持批量预览与直接打印。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 tools-grid">
      <!-- 左侧：名单输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <Users class="w-5 h-5 mr-2 text-primary" /> 参会名单
        </h2>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground" for="rosterInput">名单（每行一位）</label>
            <button
              @click="fillSample"
              class="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Sparkles class="w-3.5 h-3.5" /> 填入示例名单
            </button>
          </div>
          <textarea
            id="rosterInput"
            v-model="rosterText"
            rows="12"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="每行一位，格式：姓名 或 姓名,职位&#10;例如：&#10;张三&#10;李四,总经理&#10;王芳，人力资源总监"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            支持「姓名,职位」（半角/全角逗号均可）；不写职位则只显示姓名。
          </p>
        </div>

        <!-- 统计 -->
        <div class="bg-muted/50 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span class="text-muted-foreground flex items-center gap-1.5">
            <ListChecks class="w-4 h-4 text-primary" /> 解析结果
          </span>
          <span class="font-semibold text-foreground">共 {{ people.length }} 人</span>
        </div>

        <button
          @click="printCards"
          :disabled="!people.length"
          class="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Printer class="w-4 h-4" /> 打印全部桌牌（{{ people.length }} 页 A4 横向）
        </button>

        <!-- 折叠与打印说明 -->
        <div class="bg-muted/40 rounded-lg p-3">
          <p class="text-xs text-muted-foreground leading-relaxed">
            打印后沿页面中部虚线对折即可立在桌面：下半为面向对面参会者的正面，上半（旋转 180°）面向自己一侧，
            两面姓名方向均朝上可读。建议使用略厚的纸张（120g 以上）更挺括。
          </p>
        </div>
      </div>

      <!-- 右侧：批量预览（打印时仅保留桌牌页） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 preview-panel">
        <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
          <Eye class="w-5 h-5 mr-2 text-primary" /> 批量预览（1:1，可横向滚动）
        </h2>
        <div v-if="people.length" class="overflow-auto pb-2 sheet-scroll">
          <div class="inline-block space-y-6">
            <div v-for="(person, i) in people" :key="i" class="table-page">
              <div class="table-half table-half-top">
                <div class="table-content">
                  <div class="table-name" :style="{ fontSize: person.size + 'pt' }">{{ person.name }}</div>
                  <div v-if="person.title" class="table-title">{{ person.title }}</div>
                </div>
              </div>
              <div class="fold-line"></div>
              <div class="table-half">
                <div class="table-content">
                  <div class="table-name" :style="{ fontSize: person.size + 'pt' }">{{ person.name }}</div>
                  <div v-if="person.title" class="table-title">{{ person.title }}</div>
                </div>
              </div>
              <div class="page-no">{{ i + 1 }} / {{ people.length }} · {{ person.name }}</div>
            </div>
          </div>
        </div>
        <div v-else class="p-10 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg no-print">
          在左侧输入名单或点击「填入示例名单」，这里会按人分页生成桌牌预览
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于会议桌牌批量生成</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            会议、培训、面试、宴席都离不开桌牌（席卡）。与其手写或逐个排版，不如把名单粘贴进来，
            一次性生成全部桌牌页：每人一页 A4 横向纸，对折后就是一个挺括的双面桌牌，会议布置几分钟搞定。
          </p>
          <h3 class="text-lg font-semibold text-foreground">对折桌牌为什么上下两半要旋转 180°</h3>
          <p>
            桌牌沿 A4 页面中线对折后，上半与下半分别朝向桌子的两侧。下半按正常方向打印，面对对面的参会者；
            上半旋转 180° 打印，折叠后恰好面向另一侧时文字是正的——这就是「双面镜像」排版，
            保证桌前两侧的人都能正着看到姓名。
          </p>
          <h3 class="text-lg font-semibold text-foreground">姓名字号如何自动适配</h3>
          <p>
            字数越多、字号越小才能保证不溢出：1-3 字用 96pt 大字，4 字姓名降到 72pt，5 字及以上用 54pt。
            有职位时姓名下方加一行约 30pt 的职位小字，层级清晰。字号阶梯对中文姓名最友好，无需手动调整。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">打印时为什么要选横向？</span>每页桌牌按 A4 横向（297×210mm）排版，打印对话框保持「横向 + 100% 缩放」即可一页一人；本工具已通过打印样式自动声明横向，一般无需手动改。</li>
            <li><span class="text-foreground font-medium">名字与职位用什么分隔？</span>每行「姓名,职位」，半角、全角逗号都可以；只写姓名则桌牌只有姓名一行，居中更大更醒目。</li>
            <li><span class="text-foreground font-medium">可以生成英文或中英混排桌牌吗？</span>可以，字号阶梯按字符数计算，英文姓名同样适用；混排时建议姓名在上、部门职位写在逗号后。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'meeting-table-card'" :category="'file'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  LayoutGrid, Users, Sparkles, Printer, ListChecks, Eye,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '会议桌牌批量生成 - 对折席卡 A4 打印模板',
  description: '在线会议桌牌批量生成工具，粘贴名单每人一页 A4 横向对折桌牌，上下两半旋转 180° 双面镜像排版，姓名字号自适应，支持职位行与直接打印',
  keywords: '会议桌牌生成, 席卡模板, 姓名桌牌, 桌牌打印, 会议名牌, 对折桌牌',
  author: 'Util工具箱',
  ogTitle: '会议桌牌批量生成 - 有条工具',
  ogDescription: '粘贴名单批量生成对折桌牌，双面镜像排版，A4 打印即用',
  ogUrl: 'https://www.util.cn/tools/meeting-table-card',
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
          name: '会议桌牌批量生成',
          url: 'https://www.util.cn/tools/meeting-table-card',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['名单批量生成桌牌', 'A4 横向对折排版', '上下两半 180° 旋转双面可读', '姓名字号自动适配', '支持姓名+职位两行']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '会议桌牌批量生成', item: 'https://www.util.cn/tools/meeting-table-card/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '打印时为什么要选横向？',
              acceptedAnswer: { '@type': 'Answer', text: '每页桌牌按 A4 横向 297×210mm 排版，保持横向与 100% 缩放即可一页一人，工具已自动声明横向打印。' }
            },
            {
              '@type': 'Question',
              name: '名字与职位用什么分隔？',
              acceptedAnswer: { '@type': 'Answer', text: '每行写「姓名,职位」，半角或全角逗号均可；只写姓名则桌牌仅显示姓名一行。' }
            },
            {
              '@type': 'Question',
              name: '可以生成英文或中英混排桌牌吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，字号阶梯按字符数计算，英文姓名同样适用，混排时建议职位写在逗号后。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'meeting-table-card')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// 解析名单：每行「姓名」或「姓名,职位」（半角/全角逗号均可），空行忽略
const parseRoster = (text) => {
  const people = []
  const lines = String(text || '').split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const commaIdx = line.search(/[,，]/)
    if (commaIdx >= 0) {
      const name = line.slice(0, commaIdx).trim()
      const title = line.slice(commaIdx + 1).trim()
      if (name) people.push({ name, title })
    } else {
      people.push({ name: line, title: '' })
    }
  }
  return people
}

// 姓名字号自适应（pt）：1-3 字 96、4 字 72、≥5 字 54
const nameFontSize = (len) => {
  if (len <= 3) return 96
  if (len === 4) return 72
  return 54
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const rosterText = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const SAMPLE = [
  '张三',
  '李四,总经理',
  '王芳，人力资源总监',
  '陈大明',
  '赵子轩,技术负责人',
  '钱晓雅,市场部经理'
].join('\n')

const fillSample = () => { rosterText.value = SAMPLE }

const people = computed(() => {
  return parseRoster(rosterText.value).map(p => ({
    name: p.name,
    title: p.title,
    size: nameFontSize(p.name.length)
  }))
})

const printCards = () => {
  if (!people.value.length) return
  window.print()
}
</script>

<style scoped>
/* 桌牌页：A4 横向 297×210mm，上下两半 */
.table-page {
  position: relative;
  width: 297mm;
  height: 210mm;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-half {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 上半旋转 180°：对折后背面的姓名方向仍然朝上可读 */
.table-half-top {
  transform: rotate(180deg);
}

.table-content {
  text-align: center;
  padding: 0 10mm;
  font-family: 'SimSun', 'Songti SC', 'Noto Serif CJK SC', serif;
  color: #111;
}

.table-name {
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.table-title {
  font-size: 30pt;
  font-weight: 500;
  margin-top: 4mm;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: #222;
}

/* 折线：屏幕上虚线提示，打印保留浅色便于折叠 */
.fold-line {
  border-top: 1px dashed rgba(0, 0, 0, 0.35);
}

.page-no {
  position: absolute;
  bottom: 3mm;
  right: 6mm;
  font-size: 9pt;
  color: #bbb;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .tools-grid {
    display: block !important;
  }

  .preview-panel {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }

  .sheet-scroll {
    overflow: visible !important;
  }

  .table-page {
    width: 297mm;
    height: 209.5mm;
    box-shadow: none;
    page-break-after: always;
  }

  .table-page:last-child {
    page-break-after: auto;
  }

  .fold-line {
    border-top-color: rgba(0, 0, 0, 0.2);
  }
}
</style>
