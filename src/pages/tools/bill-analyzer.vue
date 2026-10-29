<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wallet class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">账单分析器</h1>
          <p class="text-sm text-muted-foreground mt-1">微信 / 支付宝 CSV 账单本地解析，月度收支、分类占比与 Top10 一目了然，账单不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线账单分析器：把微信支付、支付宝 App 导出的账单 CSV 拖进来，即可在浏览器本地完成解析与统计——自动识别账单平台与文件编码（UTF-8 / GBK），
        跳过表头前的说明文字与尾部汇总行，逐笔提取交易时间、交易对方、商品、收/支与金额；再按内置关键词规则把支出归入餐饮美食、交通出行、日用百货等 10 个分类，
        生成月度收支柱状图、分类支出占比与支出 Top10 交易对方榜单，支持一次选择多个 CSV 合并分析、一键导出带分类的明细 CSV。
        整个解析过程不经过任何服务器，账单不上传，刷新页面数据即清空。
      </p>
    </div>

    <!-- 隐私说明条 -->
    <div class="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm text-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p>账单仅在浏览器本地解析，不会上传到任何服务器；支持一次勾选多个 CSV 合并统计，多次选择会自动追加合并。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 汇总面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Wallet class="w-5 h-5 mr-2 text-primary" /> 汇总统计
        </h2>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">总支出</p>
          <p class="text-2xl font-bold text-primary">¥{{ formatMoney(stats.totalExpense) }}</p>
          <p class="text-xs text-muted-foreground mt-1">共 {{ stats.count }} 笔有效记录</p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">总收入</p>
            <p class="text-lg font-bold text-foreground">¥{{ formatMoney(stats.totalIncome) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">不计收支</p>
            <p class="text-lg font-bold text-foreground">{{ stats.neutralCount }} 笔</p>
          </div>
        </div>

        <p
          v-if="statusMsg"
          class="text-xs leading-relaxed p-2.5 rounded text-foreground flex items-start gap-1.5"
          :class="statusMsg.type === 'ok' ? 'bg-green-500/10' : statusMsg.type === 'warn' ? 'bg-amber-500/10' : 'bg-red-500/10'"
        >
          <TriangleAlert v-if="statusMsg.type === 'error'" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <TriangleAlert v-else-if="statusMsg.type === 'warn'" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>{{ statusMsg.text }}</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span>还没有数据：在右侧选择或拖入解压后的账单 CSV，汇总结果会实时显示在这里。</span>
        </p>

        <button
          @click="exportCsv"
          :disabled="!hasData"
          class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90"
        >
          <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 导出分类明细 CSV
        </button>
        <button
          @click="clearAll"
          :disabled="!hasData && !fileCards.length"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空全部数据
        </button>
      </div>

      <!-- 主区（占两列）：文件选择 + 识别结果 + 图表 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <FileSpreadsheet class="w-5 h-5 mr-2 text-primary" /> 选择账单文件
        </h2>

        <!-- 拖拽 / 选择区 -->
        <div
          class="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition select-none"
          :class="dragActive ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'"
          @click="openFilePicker"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="dragActive = false"
          @drop.prevent="handleDrop"
        >
          <Upload class="w-10 h-10 text-primary/40 mx-auto mb-2" />
          <p class="text-sm font-medium text-foreground">点击选择或拖拽账单 CSV 到这里（可多选）</p>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            微信 / 支付宝 App 导出的账单是带密码的 zip，请先自行解压，再把里面的 .csv 文件拖进来
          </p>
          <p class="text-xs text-muted-foreground/80 mt-1">
            <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />多次选择自动合并追加，分析完可用「清空全部数据」重置
          </p>
          <input ref="fileInputRef" type="file" multiple accept=".csv" class="hidden" @change="handleFileChange" />
        </div>

        <!-- 文件识别结果卡 -->
        <div v-if="fileCards.length" class="space-y-2">
          <div v-for="card in fileCards" :key="card.id" class="bg-muted/40 border border-border rounded-lg p-3 flex items-start gap-3">
            <FileSpreadsheet class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-foreground truncate">{{ card.name }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ platformLabelOf(card.platform) }} · 编码 {{ encodingLabelOf(card.encoding) }} · 有效 {{ card.rowCount }} 笔 · 跳过说明行 {{ card.skipped }} 行<template v-if="card.errorCount"> · 异常 {{ card.errorCount }} 行</template>
              </p>
              <p v-if="card.big" class="text-xs text-amber-600 mt-1">文件较大或行数较多，分析可能稍慢</p>
              <p v-if="card.error" class="text-xs text-red-600 mt-1 flex items-start gap-1">
                <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{{ card.error }}
              </p>
            </div>
          </div>
        </div>

        <!-- 月度收支柱状图 -->
        <div v-if="stats.byMonth.length" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold flex items-center">
              <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 月度收支柱状图
            </h3>
            <div class="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full inline-block bg-emerald-500"></i>收入</span>
              <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full inline-block bg-red-500"></i>支出</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <div class="flex items-end gap-3 h-44 min-w-full">
              <div v-for="m in stats.byMonth" :key="m.ym" class="flex-1 min-w-[52px] h-full flex flex-col items-center justify-end gap-1">
                <div class="w-full flex-1 flex items-end justify-center gap-1">
                  <div
                    class="w-1/3 max-w-[22px] bg-emerald-500/70 rounded-t"
                    :style="{ height: barHeightOf(m.income, maxMonthValue) }"
                    :title="`${m.ym} 收入 ¥${formatMoney(m.income)}`"
                  ></div>
                  <div
                    class="w-1/3 max-w-[22px] bg-red-500/70 rounded-t"
                    :style="{ height: barHeightOf(m.expense, maxMonthValue) }"
                    :title="`${m.ym} 支出 ¥${formatMoney(m.expense)}`"
                  ></div>
                </div>
                <p class="text-[10px] text-muted-foreground truncate w-full text-center">{{ m.ym }}</p>
                <p class="text-[10px] font-medium text-foreground truncate w-full text-center">{{ m.expense > 0 ? '¥' + formatMoney(m.expense) : '—' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 分类支出占比 -->
        <div v-if="categoryBars.length" class="space-y-3">
          <h3 class="text-base font-semibold flex items-center">
            <PieChart class="w-5 h-5 mr-2 text-primary" /> 支出分类占比
          </h3>
          <div class="space-y-2.5">
            <div v-for="c in categoryBars" :key="c.name">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-foreground font-medium">{{ c.name }}</span>
                <span class="text-muted-foreground">¥{{ formatMoney(c.expense) }} · {{ c.pct }}%</span>
              </div>
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full" :style="{ width: c.widthPct + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 支出 Top10 -->
        <div v-if="stats.top10.length" class="space-y-3">
          <h3 class="text-base font-semibold flex items-center">
            <Wallet class="w-5 h-5 mr-2 text-primary" /> 支出 Top10 交易对方
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-2 font-medium w-8">#</th>
                  <th class="py-2 pr-2 font-medium">交易对方</th>
                  <th class="py-2 pr-2 font-medium text-right">笔数</th>
                  <th class="py-2 font-medium text-right">支出合计</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in stats.top10" :key="p.counterparty" class="border-b border-border/60 last:border-0">
                  <td class="py-2 pr-2 text-muted-foreground">{{ i + 1 }}</td>
                  <td class="py-2 pr-2 text-foreground truncate max-w-[200px]" :title="p.counterparty">{{ p.counterparty }}</td>
                  <td class="py-2 pr-2 text-right text-muted-foreground">{{ p.count }}</td>
                  <td class="py-2 text-right font-medium text-foreground">¥{{ formatMoney(p.expense) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          提示：本工具按表头自动识别微信（含「交易时间」列）与支付宝（含「交易创建时间」列）账单，自动跳过表头前的说明文字与尾部分隔线；
          分类基于内置关键词规则，仅供参考，无法识别的记录会归入「其他」。导出的 CSV 含 UTF-8 BOM，可直接用 Excel / WPS 打开不乱码。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是账单分析器？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          账单分析器是一款在浏览器本地运行的微信 / 支付宝账单分析工具。它读取你从 App 导出的账单 CSV 文件，自动识别账单来源（微信按「交易时间」表头、支付宝按「交易创建时间」表头）
          与文件编码（先按 UTF-8 解码，乱码比例过高时改用 GBK，正好覆盖支付宝账单的 GBK 导出），跳过表头前的说明行与尾部的分隔线、汇总行，
          逐笔提取交易时间、交易对方、商品、收/支与金额；再按内置关键词规则把每笔支出归入餐饮美食、交通出行、日用百货、服饰美妆、住房物业、医疗健康、文娱教育、人情往来、通讯网络、其他共 10 个分类，
          最终生成月度收支柱状图、分类支出占比与支出 Top10 交易对方榜单，并支持把带分类的明细一键导出为 CSV。支持一次选择多个文件合并统计，适合做年度或跨账号的账单盘点。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么导出微信 / 支付宝账单？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">两家 App 都不提供直接的 CSV 下载，需要走「账单导出到邮箱」流程，拿到带密码的 zip 后解压出 CSV：</p>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground mb-3">
          <li>微信：打开微信，依次进入「我 → 服务 → 钱包 → 账单」；</li>
          <li>点击右上角「常见问题」，选择「下载账单」，用途选「用于个人对账」；</li>
          <li>选择起止时间段，填写接收邮箱，确认导出；</li>
          <li>邮箱会收到一个带密码的 zip 压缩包，解压密码在邮件正文里；</li>
          <li>解压后得到微信支付账单 CSV，把它拖进本页即可开始分析。</li>
        </ol>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>支付宝：打开支付宝，进入「我的 → 账单」；</li>
          <li>点击右上角「…」，选择「开具交易流水证明」，用途选「用于个人对账」；</li>
          <li>选择时间段并填写接收邮箱，确认生成；</li>
          <li>邮箱收到带密码的 zip 后按邮件提示解压，把其中的支付宝账单 CSV 拖进本页。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">账单数据会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。文件读取、编码探测、CSV 解析、分类与统计全部在你的浏览器内存中完成，页面不会发出任何包含账单内容的网络请求，也不会把数据写入服务器或本地存储；
          刷新或关闭页面后所有解析结果自动清空。你可以断网后使用本页验证：分析功能完全不受影响。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">支出分类可以自定义吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          当前版本使用内置关键词规则分类（如「咖啡 / 外卖 / 美团」归入餐饮美食，「地铁 / 加油 / 12306」归入交通出行），暂不支持自定义分类与关键词。
          无法命中规则的记录会归入「其他」；如果个别记录归类不符合预期，可以先「导出分类明细 CSV」，在表格软件中自行调整，我们会持续扩充关键词库。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么导出微信 / 支付宝账单？</h3>
            <p class="text-sm text-muted-foreground mt-1">微信依次打开「我 → 服务 → 钱包 → 账单 → 右上角常见问题 → 下载账单」，用途选「用于个人对账」并填写邮箱，收到带密码的 zip 后按邮件提示解压；支付宝走「我的 → 账单 → 右上角… → 开具交易流水证明」，同样发到邮箱后解压，把解压出的 CSV 拖进本页即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">账单数据会被上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。文件读取、编码探测、解析与统计全部在浏览器本地内存中完成，不发出任何包含账单内容的网络请求，也不写入服务器；刷新或离开页面后数据自动清空。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">支出分类可以自定义吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">当前版本使用内置关键词规则，把支出归入餐饮美食、交通出行、日用百货等 10 个分类，暂不支持自定义；未命中规则的记录归入「其他」，可导出分类明细 CSV 后自行调整。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'bill-analyzer'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wallet, Upload, FileSpreadsheet, BarChart3, PieChart, TriangleAlert, CheckCircle,
  Download, Trash2, RefreshCw, ChevronUp, ChevronDown, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '账单分析器 - 微信支付宝账单本地分类分析工具',
  description: '免费在线账单分析器，本地解析微信、支付宝导出的 CSV 账单明细，自动识别平台与 UTF-8/GBK 编码，按月统计收支、支出分类占比与 Top10 交易对方，支持多文件合并与分类明细 CSV 导出，账单不上传，保护隐私',
  keywords: '账单分析器,微信账单分析,支付宝账单分析,账单分类统计,月度收支分析,CSV账单解析,支出分析,记账工具',
  author: '有条工具',
  ogTitle: '账单分析器 - 微信支付宝账单本地分类分析工具 | 有条工具',
  ogDescription: '本地解析微信/支付宝 CSV 账单，月度收支、分类占比、Top10 交易对方一目了然，账单不上传。',
  ogUrl: 'https://www.util.cn/tools/bill-analyzer',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '账单分析器',
          url: 'https://www.util.cn/tools/bill-analyzer',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['微信/支付宝 CSV 账单自动识别', 'UTF-8 与 GBK 编码自动探测', '多文件合并分析', '月度收支柱状图', '支出分类占比统计', '支出 Top10 交易对方', '分类明细 CSV 导出', '纯本地解析账单不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '账单分析器', item: 'https://www.util.cn/tools/bill-analyzer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么导出微信 / 支付宝账单？',
              acceptedAnswer: { '@type': 'Answer', text: '微信依次打开「我 → 服务 → 钱包 → 账单 → 右上角常见问题 → 下载账单」，用途选「用于个人对账」并填写邮箱，收到带密码的zip后按邮件提示解压；支付宝走「我的 → 账单 → 右上角… → 开具交易流水证明」，同样发到邮箱后解压，把解压出的CSV拖进本页即可。' }
            },
            {
              '@type': 'Question',
              name: '账单数据会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。文件读取、编码探测、解析与统计全部在浏览器本地内存中完成，不发出任何包含账单内容的网络请求，也不写入服务器；刷新或离开页面后数据自动清空。' }
            },
            {
              '@type': 'Question',
              name: '支出分类可以自定义吗？',
              acceptedAnswer: { '@type': 'Answer', text: '当前版本使用内置关键词规则，把支出归入餐饮美食、交通出行、日用百货等10个分类，暂不支持自定义；未命中规则的记录归入「其他」，可导出分类明细CSV后自行调整。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const OTHER_CATEGORY = '其他'
const MAX_BYTES = 2 * 1024 * 1024 // 单文件超过 2MB 提示分析可能稍慢
const MAX_ROWS = 5000             // 单文件有效行超过 5000 行提示分析可能稍慢
const EXPORT_CSV_HEADER = '交易时间,交易对方,商品,收/支,金额,分类,来源文件'

// 编码探测：先按 UTF-8 解码，替换符 U+FFFD 占比超过 0.5% 时改用 GBK
function detectEncoding(buffer) {
  let utf8Text = ''
  try {
    utf8Text = new TextDecoder('utf-8').decode(buffer)
  } catch (e) {
    utf8Text = ''
  }
  let bad = 0
  let idx = utf8Text.indexOf('\uFFFD')
  while (idx !== -1) {
    bad += 1
    idx = utf8Text.indexOf('\uFFFD', idx + 1)
  }
  const ratio = utf8Text.length ? bad / utf8Text.length : 0
  if (ratio > 0.005) {
    try {
      return { text: new TextDecoder('gbk').decode(buffer), encoding: 'gbk' }
    } catch (e) {
      return { text: utf8Text, encoding: 'utf-8' }
    }
  }
  return { text: utf8Text, encoding: 'utf-8' }
}

// 轻量 CSV 行解析：处理双引号包裹与 "" 转义，返回字段数组
function splitCsvLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur)
  return fields
}

// 收/支 归一化：收入 / 支出 / 不计收支
function normalizeBillType(raw) {
  const s = String(raw || '').trim()
  if (s.includes('收入')) return '收入'
  if (s.includes('支出')) return '支出'
  return '不计收支'
}

// 金额解析：去掉 ¥、逗号等非数字字符后取浮点数，失败返回 NaN
function parseAmountYuan(raw) {
  const n = parseFloat(String(raw || '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

// 从交易时间字符串提取月份键 YYYY-MM（兼容 - / . 年 等分隔符）
function monthKeyOf(date) {
  const m = /(\d{4})[-/.年](\d{1,2})/.exec(String(date || ''))
  if (!m) return null
  return `${m[1]}-${String(m[2]).padStart(2, '0')}`
}

// 按候选列名查找列索引：先精确匹配，再包含匹配
function findColIndex(headers, candidates) {
  const cleaned = headers.map((h) => h.trim())
  for (const cand of candidates) {
    const i = cleaned.indexOf(cand)
    if (i !== -1) return i
  }
  for (const cand of candidates) {
    const i = cleaned.findIndex((h) => h.includes(cand))
    if (i !== -1) return i
  }
  return -1
}

// 解析微信/支付宝账单 CSV 文本：
// 微信表头行含「交易时间」（金额带 ¥ 前缀，UTF-8），支付宝表头行含「交易创建时间」（GBK，导出前已由 detectEncoding 转为文本）
function parseBillCsv(text, filename) {
  const clean = String(text || '').replace(/^\uFEFF/, '')
  const lines = clean.split(/\r?\n/)

  // 第一遍：定位表头行（不提前 break，跳过表头前的说明行与分隔线）
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易创建时间') || lines[i].includes('交易时间')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) {
    return {
      platform: null,
      rows: [],
      skippedPreamble: 0,
      errors: [`「${filename}」未找到表头行（需包含「交易时间」或「交易创建时间」），无法识别为微信/支付宝账单`]
    }
  }
  const platform = lines[headerIdx].includes('交易创建时间') ? 'alipay' : 'wechat'

  const headers = splitCsvLine(lines[headerIdx])
  const dateIdx = findColIndex(headers, platform === 'alipay' ? ['交易创建时间'] : ['交易时间'])
  const typeIdx = findColIndex(headers, ['收/支'])
  const amountIdx = findColIndex(headers, ['金额(元)', '金额（元）', '金额'])
  const counterpartyIdx = findColIndex(headers, ['交易对方'])
  const goodsIdx = findColIndex(headers, platform === 'alipay' ? ['商品名称'] : ['商品'])

  if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1) {
    return {
      platform,
      rows: [],
      skippedPreamble: headerIdx,
      errors: [`「${filename}」表头缺少关键列（交易时间 / 收支 / 金额），无法解析`]
    }
  }

  // 第二遍：逐行取数据，遇空行跳过，遇 ----- 分隔线（账单尾）终止
  const rows = []
  const errors = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (/-{5,}/.test(line)) break
    const cells = splitCsvLine(line)
    const date = (dateIdx >= 0 ? cells[dateIdx] || '' : '').trim()
    const amount = parseAmountYuan(amountIdx >= 0 ? cells[amountIdx] : '')
    if (!date || !Number.isFinite(amount)) {
      errors.push(`第 ${i + 1} 行无法解析：${line.slice(0, 40)}${line.length > 40 ? '…' : ''}`)
      continue
    }
    rows.push({
      date,
      counterparty: (counterpartyIdx >= 0 ? cells[counterpartyIdx] || '' : '').trim(),
      goods: (goodsIdx >= 0 ? cells[goodsIdx] || '' : '').trim(),
      type: normalizeBillType(typeIdx >= 0 ? cells[typeIdx] : ''),
      amount
    })
  }
  return { platform, rows, skippedPreamble: headerIdx, errors }
}

// 分类关键词表（按顺序匹配，先命中先归类）
const CATEGORY_RULES = [
  { name: '餐饮美食', keywords: ['餐', '饮', '咖啡', '奶茶', '外卖', '美团', '饿了么', '小吃', '火锅', '烧烤', '食堂', '面馆'] },
  { name: '交通出行', keywords: ['滴', '打车', '地铁', '公交', '加油', '铁路', '航空', '12306', '出租', '网约车', '出行', '停车'] },
  { name: '日用百货', keywords: ['超市', '便利店', '百货', '淘宝', '京东', '拼多多', '天猫', '生鲜', '水果', '杂货', '烟酒'] },
  { name: '服饰美妆', keywords: ['服饰', '服装', '美妆', '化妆', '护肤', '口红', '理发', '美发', '鞋', '洗衣'] },
  { name: '住房物业', keywords: ['房租', '物业', '水电', '燃气', '供暖', '家居', '家具', '建材', '中介'] },
  { name: '医疗健康', keywords: ['医院', '药房', '药店', '医药', '诊所', '体检', '牙科', '口腔', '挂号', '疫苗'] },
  { name: '文娱教育', keywords: ['教育', '培训', '学费', '图书', '书店', '电影', '游戏', '音乐', '视频会员', '网课', '考试'] },
  { name: '人情往来', keywords: ['红包', '转账', '礼物', '礼金', '压岁', '随礼', '借款', '还款', '请客'] },
  { name: '通讯网络', keywords: ['话费', '流量', '充值', '移动', '联通', '电信', '宽带', '网费'] }
]

// 按交易对方 + 商品做关键词分类，未命中归入「其他」
function classifyCategory(counterparty, goods) {
  const text = `${counterparty || ''}${goods || ''}`
  if (!text) return OTHER_CATEGORY
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.name
  }
  return OTHER_CATEGORY
}

// 聚合：总收入/总支出/不计收支笔数、按月收支（YYYY-MM 升序）、分类支出占比、支出 Top10 交易对方
function aggregate(rows) {
  let totalIncome = 0
  let totalExpense = 0
  let neutralCount = 0
  const monthMap = new Map()
  const catMap = new Map()
  const partyMap = new Map()
  for (const r of rows) {
    const ym = monthKeyOf(r.date)
    if (r.type === '收入') {
      totalIncome += r.amount
      if (ym) {
        if (!monthMap.has(ym)) monthMap.set(ym, { ym, income: 0, expense: 0 })
        monthMap.get(ym).income += r.amount
      }
    } else if (r.type === '支出') {
      totalExpense += r.amount
      if (ym) {
        if (!monthMap.has(ym)) monthMap.set(ym, { ym, income: 0, expense: 0 })
        monthMap.get(ym).expense += r.amount
      }
      const cat = r.category || OTHER_CATEGORY
      const c = catMap.get(cat) || { name: cat, expense: 0 }
      c.expense += r.amount
      catMap.set(cat, c)
      const party = r.counterparty || '（未知）'
      const p = partyMap.get(party) || { counterparty: party, expense: 0, count: 0 }
      p.expense += r.amount
      p.count += 1
      partyMap.set(party, p)
    } else {
      neutralCount += 1
    }
  }
  const round2 = (n) => Math.round(n * 100) / 100
  const byMonth = [...monthMap.values()]
    .map((m) => ({ ym: m.ym, income: round2(m.income), expense: round2(m.expense) }))
    .sort((a, b) => a.ym.localeCompare(b.ym))
  const byCategory = [...catMap.values()]
    .map((c) => ({ name: c.name, expense: round2(c.expense), pct: totalExpense > 0 ? Math.round((c.expense / totalExpense) * 1000) / 10 : 0 }))
    .sort((a, b) => b.expense - a.expense)
  const top10 = [...partyMap.values()]
    .map((p) => ({ counterparty: p.counterparty, expense: round2(p.expense), count: p.count }))
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 10)
  return { totalIncome: round2(totalIncome), totalExpense: round2(totalExpense), neutralCount, count: rows.length, byMonth, byCategory, top10 }
}

// CSV 字段转义：含逗号 / 引号 / 换行时用双引号包裹并转义内部引号
function csvEscapeField(value) {
  const s = String(value === null || value === undefined ? '' : value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// 金额格式化：千分位 + 保留 2 位小数
function formatMoney(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '0.00'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 柱状图高度：相对最高月自适应，最小 2% 保证可见
function barHeightOf(value, maxValue) {
  if (!maxValue || !(value > 0)) return '0%'
  return `${Math.max(2, Math.round((value / maxValue) * 100))}%`
}

function platformLabelOf(platform) {
  if (platform === 'wechat') return '微信账单'
  if (platform === 'alipay') return '支付宝账单'
  return '未识别'
}

function encodingLabelOf(encoding) {
  return encoding === 'gbk' ? 'GBK' : 'UTF-8'
}

// ---------- 页面状态 ----------
const SEO_VISIBLE_KEY = 'bill-analyzer:seo-visible'
const fileInputRef = ref(null)
const fileCards = ref([])   // 每个文件的识别结果卡
const allRows = ref([])     // 合并后的全部交易记录（含分类与来源文件）
const statusMsg = ref(null) // { type: 'ok' | 'warn' | 'error', text }
const dragActive = ref(false)
const processing = ref(false)
const seoContentVisible = ref(true)
let fileCardSeq = 0

const stats = computed(() => aggregate(allRows.value))
const hasData = computed(() => allRows.value.length > 0)

const maxMonthValue = computed(() => {
  let max = 0
  for (const m of stats.value.byMonth) {
    max = Math.max(max, m.income, m.expense)
  }
  return max > 0 ? max : 1
})

// 占比过小的分类给一个最小可见宽度
const categoryBars = computed(() =>
  stats.value.byCategory.map((c) => ({ ...c, widthPct: c.pct > 0 ? Math.max(c.pct, 1.5) : 0 }))
)

// ---------- 事件处理（仅在用户回调中触达 FileReader / TextDecoder / Blob，SSR 安全） ----------
function openFilePicker() {
  if (processing.value) return
  if (fileInputRef.value) fileInputRef.value.click()
}

function handleFileChange(e) {
  const files = e.target.files
  handleFiles(files)
  e.target.value = '' // 允许重复选择同一个文件
}

function handleDrop(e) {
  dragActive.value = false
  if (processing.value) return
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
    handleFiles(e.dataTransfer.files)
  }
}

async function handleFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => /\.csv$/i.test(f.name))
  if (!files.length) {
    statusMsg.value = { type: 'error', text: '未找到 .csv 文件：微信/支付宝导出的是带密码 zip，请先自行解压，再选择里面的账单 CSV。' }
    return
  }
  processing.value = true
  statusMsg.value = null
  const nextCards = []
  const nextRows = []
  let slow = false
  let okFiles = 0
  try {
    for (const file of files) {
      fileCardSeq += 1
      const id = fileCardSeq
      const big = file.size > MAX_BYTES
      const buffer = await file.arrayBuffer()
      const { text, encoding } = detectEncoding(buffer)
      const parsed = parseBillCsv(text, file.name)
      if (!parsed.platform) {
        nextCards.push({ id, name: file.name, platform: null, encoding, rowCount: 0, skipped: 0, errorCount: 0, big, error: parsed.errors[0] || '无法识别的账单格式' })
        continue
      }
      for (const r of parsed.rows) {
        nextRows.push({ ...r, category: classifyCategory(r.counterparty, r.goods), source: file.name })
      }
      const fileSlow = big || parsed.rows.length > MAX_ROWS
      if (fileSlow) slow = true
      okFiles += 1
      nextCards.push({ id, name: file.name, platform: parsed.platform, encoding, rowCount: parsed.rows.length, skipped: parsed.skippedPreamble, errorCount: parsed.errors.length, big: fileSlow, error: '' })
    }
    fileCards.value = [...fileCards.value, ...nextCards]
    allRows.value = [...allRows.value, ...nextRows]
    const added = nextRows.length
    if (!okFiles) {
      statusMsg.value = { type: 'error', text: '没有识别出有效的微信/支付宝账单，请确认拖入的是解压后的账单 CSV 文件。' }
    } else if (slow) {
      statusMsg.value = { type: 'warn', text: `已分析 ${okFiles} 个文件，新增 ${added} 笔记录；文件较大或超过 ${MAX_ROWS} 行，分析可能稍慢。` }
    } else if (added === 0) {
      statusMsg.value = { type: 'warn', text: `已分析 ${okFiles} 个文件，但未解析出有效交易记录，请确认选择的是账单明细 CSV。` }
    } else {
      statusMsg.value = { type: 'ok', text: `已分析 ${okFiles} 个文件，新增 ${added} 笔记录，已合并统计。` }
    }
  } catch (err) {
    statusMsg.value = { type: 'error', text: `解析失败：${err && err.message ? err.message : '未知错误'}` }
  } finally {
    processing.value = false
  }
}

function exportCsv() {
  if (!allRows.value.length) return
  const lines = [EXPORT_CSV_HEADER].concat(
    allRows.value.map((r) => [r.date, r.counterparty, r.goods, r.type, r.amount.toFixed(2), r.category, r.source].map(csvEscapeField).join(','))
  )
  // 带 UTF-8 BOM，Excel / WPS 直接打开不乱码
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bills-classified.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  statusMsg.value = { type: 'ok', text: `已导出 ${allRows.value.length} 条分类明细到 bills-classified.csv。` }
}

function clearAll() {
  allRows.value = []
  fileCards.value = []
  statusMsg.value = null
  dragActive.value = false
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
  try {
    window.localStorage.setItem(SEO_VISIBLE_KEY, seoContentVisible.value ? '1' : '0')
  } catch (e) {
    // 隐私模式下写入失败可忽略
  }
}

onMounted(() => {
  addRecentTool('bill-analyzer')
  try {
    const saved = window.localStorage.getItem(SEO_VISIBLE_KEY)
    if (saved === '0') seoContentVisible.value = false
  } catch (e) {
    // 隐私模式下读取失败可忽略，保持默认展开
  }
})
</script>
