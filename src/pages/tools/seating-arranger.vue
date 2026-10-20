<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Users class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">婚宴座位安排器</h1>
          <p class="text-sm text-muted-foreground mt-1">宾客按关系分组摆圆桌，同组聚坐并规避冲突对，一键生成桌次座位图打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        婚礼筹备刚需：粘贴宾客名单（姓名+关系组，如「张伟,男方同学」），设定每桌人数（默认10人）与桌数，
        再把不想同桌的两人登记进「避免同坐」清单。算法按关系组聚合贪心摆桌——亲属、同学、同事尽量同桌，
        被标记冲突的宾客强制分到不同桌，无法避免时给出明确警告；输出圆桌编号+每桌名单的桌次图，
        支持打印张贴与复制文本发给酒店督导，全部计算在浏览器本地完成，宾客隐私不出本机。
      </p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="space-y-5 no-print">
        <!-- 宾客名单 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Users class="w-4 h-4 text-primary" /> 宾客名单
            </h2>
            <span class="text-xs text-muted-foreground">{{ guests.length }} 人</span>
          </div>
          <textarea
            v-model="rosterText"
            @input="rearrange"
            rows="10"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一位宾客，逗号分隔关系组&#10;张伟,男方同学&#10;李娜,女方闺蜜"
          ></textarea>
          <p class="text-xs text-muted-foreground">
            每行一位，格式「姓名,关系组」；逗号支持中英文，未填关系组的归入「其他嘉宾」，空行自动忽略。
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              @click="loadSample"
              class="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >
              载入示例名单
            </button>
          </div>
        </div>

        <!-- 桌数与容量 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <CircleDot class="w-4 h-4 text-primary" /> 桌数设置
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">每桌人数上限</label>
              <input
                v-model.number="tableCap"
                @input="rearrange"
                type="number"
                min="2"
                max="20"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">桌数</label>
              <input
                v-model.number="tableCount"
                @input="rearrange"
                type="number"
                min="0"
                :disabled="autoTable"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                placeholder="0=自动"
              >
              <p class="text-xs text-muted-foreground mt-1">{{ autoTable ? `自动约 ${suggestedTables} 桌` : '按指定桌数摆桌' }}</p>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input v-model="autoTable" @change="rearrange" type="checkbox" class="w-4 h-4 rounded border-border">
            自动计算桌数（按人数 ÷ 每桌人数向上取整）
          </label>
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">主桌设置（可选）</label>
            <input
              v-model="headTableName"
              @input="rearrange"
              type="text"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="留空则不标注主桌，如填「双方父母」则第1桌标为主桌"
            >
          </div>
        </div>

        <!-- 避免同坐 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Ban class="w-4 h-4 text-red-500" /> 避免同坐
            </h2>
            <span class="text-xs text-muted-foreground">{{ conflictPairs.length }} 对</span>
          </div>
          <textarea
            v-model="conflictText"
            @input="rearrange"
            rows="4"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一对，逗号分隔两个姓名&#10;王强,刘洋"
          ></textarea>
          <p class="text-xs text-muted-foreground">
            每行登记一对不宜同桌的宾客（姓名需与名单完全一致）。算法会强制将两人分开安排在不同圆桌。
          </p>
        </div>
      </div>

      <!-- 输出区域：桌次图 -->
      <div class="xl:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4 no-print">
            <div class="text-sm text-foreground font-medium">
              {{ eventTitle || '婚宴桌次安排表' }}
              <span v-if="guests.length > 0" class="text-muted-foreground font-normal ml-2">
                共 {{ guests.length }} 人 · {{ result.usedTables }} 桌 · 每桌 ≤ {{ capValue }} 人
              </span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                @click="printPlan"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
              >
                <Printer class="w-4 h-4" /> 打印桌次图
              </button>
              <button
                @click="copyPlan"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm hover:bg-accent transition"
              >
                <Copy class="w-4 h-4" /> {{ copyLabel }}
              </button>
            </div>
          </div>

          <div class="mb-3 no-print">
            <input
              v-model="eventTitle"
              type="text"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="桌次图标题，如「张三 & 李四 新婚答谢宴」"
            >
          </div>

          <div v-if="guests.length === 0" class="p-10 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            在左侧粘贴宾客名单（每行「姓名,关系组」）后自动生成圆桌安排
          </div>

          <div v-else class="print-area space-y-4">
            <!-- 警告区 -->
            <div v-if="result.warnings.length > 0" class="no-print space-y-1.5">
              <div
                v-for="(w, wi) in result.warnings"
                :key="wi"
                class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-1.5"
              >
                <AlertTriangle class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{{ w }}</span>
              </div>
            </div>

            <!-- 圆桌卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="table in result.tables"
                :key="table.index"
                class="rounded-xl border-2 border-dashed border-primary/40 bg-muted/30 p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow">
                      {{ table.index }}
                    </span>
                    <div>
                      <div class="text-sm font-semibold text-foreground">第 {{ table.index }} 桌</div>
                      <div class="text-[11px] text-muted-foreground">{{ table.guests.length }} / {{ capValue }} 人</div>
                    </div>
                  </div>
                  <span
                    v-if="table.index === 1 && headTableName.trim()"
                    class="px-2 py-1 rounded-full bg-red-500 text-white text-[11px] font-medium"
                  >
                    主桌 · {{ headTableName.trim() }}
                  </span>
                </div>
                <ul class="space-y-1">
                  <li
                    v-for="(g, gi) in table.guests"
                    :key="gi"
                    class="flex items-center justify-between text-sm px-2 py-1 rounded bg-background/60 border border-border/60"
                  >
                    <span class="text-foreground font-medium">{{ g.name }}</span>
                    <span class="text-[11px] text-muted-foreground">{{ g.group }}</span>
                  </li>
                </ul>
                <p class="text-[11px] text-muted-foreground mt-2">
                  本桌构成：{{ groupSummary(table) }}
                </p>
              </div>
            </div>

            <p class="text-center text-xs text-muted-foreground print-only">
              {{ eventTitle || '婚宴桌次安排表' }} · 共 {{ guests.length }} 位宾客 / {{ result.usedTables }} 桌 · 由有条工具「婚宴座位安排器」生成
            </p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground no-print">
          说明：同桌人数尽量贴近上限以省桌；关系组人数超过每桌上限时该组自动拆到相邻桌。修改任一输入即时重排。
        </p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是婚宴座位安排器？
        </h2>
        <p class="text-muted-foreground mb-4">
          婚宴座位安排器是面向婚礼筹备的圆桌排桌工具：与教室座位表（单人单座网格排布）不同，它按「关系组」把宾客聚合成整桌——
          男方亲属、女方同学、同事朋友等各归各桌，同时尊重「避免同坐」名单，把不合的两人强制分开在不同桌。
          生成结果以圆桌编号+每桌名单呈现，可打印贴在签到台，或复制文本发给酒店宴会督导照桌引领。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">摆桌算法怎么工作</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          第一步按关系组聚合，人多的组先安排以保证成团入桌；第二步贪心填桌——每位宾客优先放入「已有同组人且尚未坐满」的桌子，
          其次优先坐满中的桌以省桌数；每次放置前检查该桌是否有其「避免同坐」对象，有则整桌跳过；
          现有桌都不合适时开新桌（自动模式）或放入冲突最少的桌并给出警告（固定桌数模式）。人数始终守恒：名单里每个人都必有桌可坐。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">每桌坐几人、要不要设主桌</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          国内婚宴圆桌常见规格为每桌 10 人（大桌 12 人），工具默认 10 并可改。主桌一般放双方父母与最亲近长辈，
          可在「主桌设置」中填写称谓，第 1 桌即标注主桌。建议长辈组单独成桌，儿童家庭按整户计人数；
          同事朋友桌尽量凑满桌活跃气氛，避免「半生不熟拼一桌」的冷场。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">关系组怎么填，效果最好</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          组名即同桌倾向：写得越细，同类宾客越容易聚成一桌。推荐粒度是「男方亲属 / 女方亲属 / 男方同学 / 女方同学 / 父母同事 / 自由桌」，
          一般 5-8 组即可覆盖；组人数最好接近每桌容量的整数倍，1-2 人的碎组建议并入「亲友混桌」。
          长辈桌单独成组便于安排主桌与敬酒动线；名单中途增删只需改一行，桌次图即时重排。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">「避免同坐」一定能满足吗？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              自动桌数模式下几乎总能满足——实在凑不到一起就多开一桌。只有当您指定了固定桌数且余量很小（如 1 桌硬塞冲突二人）时，
              算法才会在保证所有人有座位的前提下牺牲冲突约束，并在结果顶部给出黄色警告说明是哪一桌无法分开。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">关系组可以自定义吗？名单量大怎么办？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              可以。第二列写什么组名都可以，如「男方亲属」「女方闺蜜」「父母同事」「大学同学」，同组名即视为同一关系圈。
              百人规模（10-20 桌）完全没问题；建议一次粘贴全量名单，改动任意输入都会即时重排并保留上一次的桌数预期。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">宾客名单会被上传吗？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              不会。本工具是纯前端页面，名单解析、分组聚桌、冲突规避全部在您浏览器内存中计算，
              不请求任何服务器接口，关闭页面即清空，适合宾客姓名等隐私信息。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'seating-arranger'" :category="'others'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Users, CircleDot, Ban, Printer, Copy, ChevronUp, ChevronDown, AlertTriangle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '婚宴座位安排器 - 圆桌宾客分组摆桌与冲突规避工具',
  description: '在线婚宴座位安排器：粘贴宾客名单按关系组自动聚桌，同组聚坐、避免同坐冲突强制分开，每桌人数与桌数可设，输出圆桌桌次图打印或复制，纯浏览器本地计算不上传',
  keywords: '婚宴座位安排, 婚礼排桌, 宾客分组坐, 婚宴桌次图, 圆桌座位表, 结婚酒席安排',
  author: 'Util工具箱',
  ogTitle: '婚宴座位安排器 - 有条工具',
  ogDescription: '宾客按关系分组摆圆桌，同组聚坐并规避冲突对，一键生成桌次座位图打印',
  ogUrl: 'https://www.util.cn/tools/seating-arranger',
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
          name: '婚宴座位安排器',
          url: 'https://www.util.cn/tools/seating-arranger',
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['宾客名单粘贴导入', '关系组自动聚桌', '避免同坐冲突规避', '每桌人数与桌数可设', '主桌标注', '桌次图打印与复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '婚宴座位安排器', item: 'https://www.util.cn/tools/seating-arranger/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '「避免同坐」一定能满足吗？',
              acceptedAnswer: { '@type': 'Answer', text: '自动桌数模式下几乎总能满足；仅当固定桌数且余量很小时，算法会在保证人人有座位的前提下牺牲冲突约束并给出警告。' }
            },
            {
              '@type': 'Question',
              name: '关系组可以自定义吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。名单第二列写任意组名，如男方亲属、女方闺蜜、父母同事、大学同学，同组名即视为同一关系圈，尽量聚在同一桌。' }
            },
            {
              '@type': 'Question',
              name: '宾客名单会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。纯前端工具，名单解析与排桌计算全部在浏览器内存完成，不请求服务器，关闭页面即清空。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'seating-arranger')

/* ===== PURE-BEGIN ===== */
// 名单解析：每行「姓名,关系组」，逗号支持中英文；无组名归入「其他嘉宾」
function parseRoster(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l !== '')
  return lines.map(line => {
    const parts = line.split(/[,，]/)
    const name = (parts[0] || '').trim()
    const group = parts.length > 1 ? parts.slice(1).join('，').trim() : ''
    return { name, group: group || '其他嘉宾' }
  }).filter(g => g.name !== '')
}

// 冲突解析：每行「姓名A,姓名B」
function parseConflicts(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l !== '')
  const pairs = []
  for (const line of lines) {
    const parts = line.split(/[,，]/).map(s => s.trim()).filter(s => s !== '')
    if (parts.length >= 2 && parts[0] !== parts[1]) pairs.push([parts[0], parts[1]])
  }
  return pairs
}

// 核心摆桌：按关系组聚合 + 贪心填桌（同组尽量同桌、优先坐满省桌），冲突对强制不同桌
function arrange(guests, tableCap, conflicts, tableCount) {
  const warnings = []
  const cap = Math.max(1, Math.floor(Number(tableCap) || 10))
  const list = Array.isArray(guests) ? guests.filter(g => g && g.name) : []
  if (list.length === 0) return { tables: [], warnings, usedTables: 0 }

  // 重名提醒（重名会使「避免同坐」按姓名失效）
  const seen = new Set()
  for (const g of list) {
    if (seen.has(g.name)) warnings.push(`宾客「${g.name}」出现多次，重名会导致「避免同坐」按姓名整体规避，请确认是否同一人`)
    seen.add(g.name)
  }

  // 冲突邻接表
  const conflictMap = new Map()
  const nameSet = new Set(list.map(g => g.name))
  for (const pair of (conflicts || [])) {
    const a = pair[0]; const b = pair[1]
    if (!nameSet.has(a) || !nameSet.has(b)) {
      warnings.push(`避免同坐「${a}, ${b}」中存在名单外的姓名，已忽略该对（姓名须与名单完全一致）`)
      continue
    }
    if (!conflictMap.has(a)) conflictMap.set(a, new Set())
    if (!conflictMap.has(b)) conflictMap.set(b, new Set())
    conflictMap.get(a).add(b)
    conflictMap.get(b).add(a)
  }

  const suggested = Math.ceil(list.length / cap)
  let maxTables = Infinity
  if (Number(tableCount) > 0) {
    maxTables = Math.max(1, Math.floor(Number(tableCount)))
    if (maxTables < suggested) {
      warnings.push(`每桌 ${cap} 人共 ${list.length} 位宾客建议至少 ${suggested} 桌，指定 ${maxTables} 桌可能导致临时加桌或拆分`)
    }
  }

  const tables = []
  const pushTable = () => { tables.push([]); }

  // 关系组按人数从多到少聚合（同大小保持出现顺序），大组优先成团入桌
  const groupMap = new Map()
  for (const g of list) {
    if (!groupMap.has(g.group)) groupMap.set(g.group, [])
    groupMap.get(g.group).push(g)
  }
  const ordered = []
  for (const [group, members] of groupMap.entries()) ordered.push({ group, members })
  ordered.sort((a, b) => b.members.length - a.members.length)

  const partnersOf = (g) => conflictMap.get(g.name) || new Set()

  for (const entry of ordered) {
    for (const g of entry.members) {
      const partners = partnersOf(g)
      let best = -1
      let bestScore = -1
      for (let t = 0; t < tables.length; t++) {
        const seats = tables[t]
        if (seats.length >= cap) continue
        if (seats.some(x => partners.has(x.name))) continue // 冲突桌整桌跳过
        const sameGroup = seats.filter(x => x.group === g.group).length
        // 同组人多 > 坐满中的桌（省桌） > 空桌
        const score = sameGroup * 1000 + (seats.length > 0 ? 100 + seats.length : 0)
        if (score > bestScore) { bestScore = score; best = t }
      }
      if (best >= 0) { tables[best].push(g); continue }
      if (tables.length < maxTables) { pushTable(); tables[tables.length - 1].push(g); continue }
      // 固定桌数且全部坐满：临时加桌保人人有座
      if (tables.every(seats => seats.length >= cap)) {
        warnings.push(`已达指定桌数且各桌坐满，为容纳「${g.name}」临时加开第 ${tables.length + 1} 桌`)
        pushTable(); tables[tables.length - 1].push(g); continue
      }
      // 固定桌数且冲突无处可避：放入冲突最少的桌并警告
      let cand = 0
      let minKey = Infinity
      for (let t = 0; t < tables.length; t++) {
        const c = tables[t].filter(x => partners.has(x.name)).length
        const key = c * 1000 + tables[t].length
        if (key < minKey) { minKey = key; cand = t }
      }
      tables[cand].push(g)
      const conflictNames = [...tables[cand]].filter(x => partners.has(x.name)).map(x => x.name)
      warnings.push(`桌位约束下无法将「${g.name}」与${conflictNames.join('、')}分开，已同安排在第 ${cand + 1} 桌`)
    }
  }

  const resultTables = tables.map((seats, i) => ({ index: i + 1, guests: seats }))
  return { tables: resultTables, warnings, usedTables: tables.length }
}

// 桌次文本导出（复制 / 打印兜底）
function planToText(tables, title, headTable) {
  const head = title || '婚宴桌次安排表'
  const lines = tables.map(tb => {
    const mark = tb.index === 1 && String(headTable || '').trim() ? `（主桌·${String(headTable).trim()}）` : ''
    const names = tb.guests.map(g => `${g.name}[${g.group}]`).join('、')
    return `第${tb.index}桌${mark}（${tb.guests.length}人）：${names}`
  })
  return `${head}\n${lines.join('\n')}`
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const SAMPLE_ROSTER = [
  '张伟,男方同学', '王强,男方同学', '刘洋,男方同学', '陈晨,男方同学', '赵磊,男方同学',
  '李娜,女方闺蜜', '孙悦,女方闺蜜', '周婷,女方闺蜜', '吴珊,女方闺蜜',
  '张建国,男方亲属', '刘秀兰,男方亲属', '张军,男方亲属', '王芳,男方亲属',
  '李国强,女方亲属', '陈玉梅,女方亲属', '李敏,女方亲属',
  '胡斌,同事', '郭静,同事', '何伟,同事', '林芳,同事', '高翔,同事', '罗霞,同事',
  '郑凯,球友', '冯亮,球友', '韩雪,球友'
].join('\n')
const SAMPLE_CONFLICTS = '王强,刘洋'

const rosterText = ref(SAMPLE_ROSTER)
const conflictText = ref(SAMPLE_CONFLICTS)
const tableCap = ref(10)
const autoTable = ref(true)
const tableCount = ref(0)
const headTableName = ref('双方父母')
const eventTitle = ref('')
const copyLabel = ref('复制桌次文本')
const isSeoContentVisible = ref(true)

// ---------- 派生 ----------
const guests = computed(() => parseRoster(rosterText.value))
const conflictPairs = computed(() => parseConflicts(conflictText.value))
const capValue = computed(() => Math.max(2, Math.min(20, Math.round(Number(tableCap.value) || 10))))
const suggestedTables = computed(() => guests.value.length === 0 ? 0 : Math.ceil(guests.value.length / capValue.value))
const result = computed(() => arrange(
  guests.value,
  capValue.value,
  conflictPairs.value,
  autoTable.value ? 0 : (Math.floor(Number(tableCount.value) || 0))
))

const groupSummary = (table) => {
  const counts = new Map()
  for (const g of table.guests) counts.set(g.group, (counts.get(g.group) || 0) + 1)
  return [...counts.entries()].map(([grp, n]) => `${grp}×${n}`).join('、')
}

const loadSample = () => {
  rosterText.value = SAMPLE_ROSTER
  conflictText.value = SAMPLE_CONFLICTS
  tableCap.value = 10
  autoTable.value = true
  tableCount.value = 0
}

const rearrange = () => {
  // result 是 computed，依赖自动重算；此处仅用于占位刷新复制按钮文案
  copyLabel.value = '复制桌次文本'
}

const printPlan = () => {
  window.print()
}

const copyPlan = async () => {
  const text = planToText(result.value.tables, eventTitle.value, headTableName.value)
  try {
    await navigator.clipboard.writeText(text)
    copyLabel.value = '已复制 ✓'
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copyLabel.value = '已复制 ✓'
  }
  setTimeout(() => { copyLabel.value = '复制桌次文本' }, 2000)
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})
</script>

<style scoped>
.print-only {
  display: none;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block;
  }
  .print-area,
  .print-area * {
    color: #000 !important;
  }
  .print-area > div > div {
    break-inside: avoid;
    border-color: #999 !important;
    background: #fff !important;
  }
  .print-area span,
  .print-area li {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
