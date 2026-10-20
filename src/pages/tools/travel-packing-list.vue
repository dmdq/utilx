<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Backpack class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">旅行行李清单生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">按目的地×季节×人群自动生成打包清单，逐项勾选，怕落东西的旅行急救包</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入天数，选择目的地类型（海边/城市/山地/商务）、出行人群（成人男/成人女/儿童）与季节，
        一键生成按「证件财务、电子设备、衣物、洗护、药品、其他」六大分类的打包清单：海边自动加泳衣防晒、
        山地加冲锋衣、冬季加保暖、带娃加奶粉尿布。逐项勾选带进度条，勾选状态自动保存在本机浏览器，
        出发前复制或打印照单收拾。全部数据本地计算与存储，不上传任何信息。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 tools-grid">
      <!-- 左侧：条件输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print lg:sticky lg:top-20 self-start">
        <h2 class="text-lg font-semibold flex items-center">
          <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 行程条件
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="daysInput">行程天数</label>
          <input
            id="daysInput"
            v-model.number="days"
            type="number"
            min="1"
            max="30"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">衣物数量按天数折算，支持 1-30 天</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">目的地类型（可多选）</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="d in DESTS"
              :key="d.value"
              @click="toggleDest(d.value)"
              :class="dests.includes(d.value) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ d.label }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">出行人群（可多选）</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="c in CROWDS"
              :key="c.value"
              @click="toggleCrowd(c.value)"
              :class="crowds.includes(c.value) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ c.label }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">季节</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="s in SEASONS"
              :key="s.value"
              @click="season = s.value"
              :class="season === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ s.label }}</button>
          </div>
        </div>

        <div class="pt-2 border-t border-border space-y-2">
          <button
            @click="copyList"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <Copy class="w-4 h-4" /> {{ copyLabel }}
          </button>
          <div class="flex gap-2">
            <button
              @click="printList"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-all"
            >
              <Printer class="w-4 h-4" /> 打印清单
            </button>
            <button
              @click="resetChecks"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-all"
            >
              <RotateCcw class="w-4 h-4" /> 清空勾选
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：清单 -->
      <div class="lg:col-span-2 space-y-6 print-area">
        <!-- 进度卡片 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-2 no-print">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckSquare class="w-5 h-5 mr-2 text-primary" /> 打包进度
            </h2>
            <span class="text-sm text-muted-foreground">{{ checkedCount }} / {{ totalItems }} 项</span>
          </div>
          <div class="h-3 bg-muted rounded-full overflow-hidden no-print">
            <div
              class="h-full bg-primary transition-all duration-300"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <div class="print-only text-sm text-neutral-600">打包进度：{{ checkedCount }} / {{ totalItems }} 项</div>
          <p class="text-xs text-muted-foreground mt-2 no-print flex items-center gap-1.5">
            <Save class="w-3.5 h-3.5" /> 勾选状态自动保存在本机浏览器，下次进入继续打包
          </p>
        </div>

        <!-- 打印表头 -->
        <div class="print-only text-center mb-2">
          <h2 class="text-xl font-bold text-neutral-900">旅行行李清单</h2>
          <p class="text-xs text-neutral-500 mt-1">{{ conditionSummary }}</p>
        </div>

        <!-- 分类清单 -->
        <div
          v-for="group in generated.groups"
          :key="group.name"
          class="bg-card border border-border rounded-lg p-6"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-foreground flex items-center">
              <component :is="groupIcon(group.name)" class="w-4 h-4 mr-2 text-primary" />
              {{ group.name }}
            </h3>
            <span class="text-xs text-muted-foreground no-print">{{ groupDone(group) }}/{{ group.items.length }}</span>
          </div>
          <ul class="space-y-1.5">
            <li v-for="item in group.items" :key="item.id">
              <label
                class="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
                :class="isChecked(item.id) ? 'opacity-60' : ''"
              >
                <input
                  type="checkbox"
                  class="w-4 h-4 mt-0.5 rounded border-border accent-primary flex-shrink-0"
                  :checked="isChecked(item.id)"
                  @change="toggleItem(item.id)"
                />
                <span class="text-sm">
                  <span class="text-foreground" :class="isChecked(item.id) ? 'line-through' : ''">{{ item.name }}</span>
                  <span v-if="item.note" class="text-muted-foreground text-xs ml-1.5">（{{ item.note }}）</span>
                </span>
              </label>
            </li>
          </ul>
        </div>

        <div v-if="!totalItems" class="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground text-sm">
          <Backpack class="w-10 h-10 mx-auto mb-3 opacity-40" />
          请至少选择一个目的地类型以生成清单
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        :aria-label="seoContentVisible ? '收起说明' : '展开说明'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于旅行行李清单</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            旅行最怕两件事：落了证件误了机，和背了一堆没用的东西超重。人脑记忆靠不住，
            老旅行者的做法是照单打包——本工具按目的地类型、季节与出行人群自动过滤生成六大分类清单，
            海边加泳衣防晒、山地加冲锋衣登山杖、商务行程加电脑名片、冬季加保暖三件套、带娃加奶粉尿布，
            照着勾一遍就不会漏。
          </p>
          <h3 class="text-lg font-semibold text-foreground">怎么生成自己的清单</h3>
          <p>
            先填行程天数（衣物数量按天数折算，如内衣裤建议「天数÷2+1」套），再勾选目的地类型与出行人群，
            选择季节。清单即时生成，逐项勾选，顶部进度条显示「已勾/总数」。
            换行程重新生成后，历史勾选仍保存在本机，误删可回来继续核对。
          </p>
          <h3 class="text-lg font-semibold text-foreground">分类逻辑与取舍原则</h3>
          <p>
            证件财务永远排第一类，护照、签证材料、预订单截图建议集中放在一个文件袋；电子设备注意充电宝登机须随身且标识清晰；
            衣物按「一套穿两天 + 一套备用」压缩；洗护尽量分装小样；药品按行程强度与目的地医疗条件取舍。
            清单条目自带备注提示（数量、场景、注意事项），不确定时按备注的保守值准备。
          </p>
          <h3 class="text-lg font-semibold text-foreground">带娃出行额外注意什么</h3>
          <p>
            勾选「儿童」后会自动追加奶粉/辅食、尿布湿巾、婴儿推车、儿童餐具、儿童常用药与安抚玩具。
            建议儿童物品单独打包成「应急包」随身带，托运延误时保证当天吃喝拉撒不断档。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">勾选数据会丢吗？</span>勾选状态保存在你当前浏览器的 localStorage 中，不上传服务器；清除浏览器数据或换设备会重置，出发前建议复制或打印一份留存。</li>
            <li><span class="text-foreground font-medium">出境游需要特别注意什么？</span>证件类加护照与签证材料、电子设备加转换插头、洗护分装符合 100ml 登机限制；药品避免含违禁成分（如部分感冒药），以目的地海关公示为准。</li>
            <li><span class="text-foreground font-medium">清单可以自定义吗？</span>本工具按条件自动过滤公共模板，暂不支持手动增删条目；复制文本后粘贴到备忘录可自行补充个性化物品。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'travel-packing-list'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Backpack, SlidersHorizontal, Copy, Printer, RotateCcw, CheckSquare, Save,
  ChevronUp, ChevronDown, IdCard, Smartphone, Shirt, Bath, Pill, MoreHorizontal
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '旅行行李清单生成器 - 按目的地季节人群打包清单',
  description: '在线旅行行李清单生成器，按天数、目的地类型（海边/城市/山地/商务）、出行人群与季节自动打包六大分类清单，海边加泳衣防晒、带娃加奶粉尿布，逐项勾选带进度条，支持复制与打印，纯本地计算',
  keywords: '旅行行李清单, 打包清单, 出差行李, 旅游带什么, 行李核对表, 出门物品清单',
  author: '有条工具',
  ogTitle: '旅行行李清单生成器 - 有条工具',
  ogDescription: '按目的地×季节×人群自动生成打包清单，逐项勾选不怕落东西',
  ogUrl: 'https://www.util.cn/tools/travel-packing-list',
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
          name: '旅行行李清单生成器',
          url: 'https://www.util.cn/tools/travel-packing-list',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按目的地/季节/人群过滤条目', '六大分类清单', '逐项勾选与进度条', '本机自动保存', '复制与打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '旅行行李清单生成器', item: 'https://www.util.cn/tools/travel-packing-list/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '勾选数据会丢吗？',
              acceptedAnswer: { '@type': 'Answer', text: '勾选状态保存在本机浏览器 localStorage，不上传服务器；清除浏览器数据或更换设备会重置，出发前建议复制或打印一份留存。' }
            },
            {
              '@type': 'Question',
              name: '出境游需要特别注意什么？',
              acceptedAnswer: { '@type': 'Answer', text: '证件类加护照与签证材料，电子设备加转换插头，洗护分装需符合登机液体限制，部分感冒药在个别国家属违禁成分，以目的地海关公示为准。' }
            },
            {
              '@type': 'Question',
              name: '清单可以自定义吗？',
              acceptedAnswer: { '@type': 'Answer', text: '工具按条件自动过滤公共模板，暂不支持手动增删条目；可复制文本后粘贴到备忘录自行补充个性化物品。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'travel-packing-list')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// 物品目录：dest/season/crowd 任一维度打标签即按「与所选条件有交集」过滤，未打标签则必选
const CATALOG = [
  // 证件财务
  { id: 'idcard', cat: '证件财务', name: '身份证' },
  { id: 'passport', cat: '证件财务', name: '护照/通行证/签证材料', note: '出境必带，拍照留档' },
  { id: 'booking', cat: '证件财务', name: '机票酒店预订单', note: '离线截图' },
  { id: 'cash', cat: '证件财务', name: '现金+分散银行卡' },
  { id: 'prefer-id', cat: '证件财务', name: '学生证等优惠证件', note: '有则带' },
  { id: 'biz-doc', cat: '证件财务', name: '合同/公章/资质文件', dest: ['business'] },
  // 电子设备
  { id: 'phone', cat: '电子设备', name: '手机' },
  { id: 'charger', cat: '电子设备', name: '充电器+数据线', note: '按设备数' },
  { id: 'powerbank', cat: '电子设备', name: '充电宝', note: '登机随身≤100Wh' },
  { id: 'earphone', cat: '电子设备', name: '耳机' },
  { id: 'adapter', cat: '电子设备', name: '转换插头', note: '出境按需' },
  { id: 'camera', cat: '电子设备', name: '相机+备用电池', note: '海边山地注意防水防沙' },
  { id: 'selfie-stick', cat: '电子设备', name: '自拍杆/三脚架' },
  { id: 'laptop', cat: '电子设备', name: '笔记本电脑+电源', dest: ['business', 'city'] },
  // 衣物
  { id: 'underwear', cat: '衣物', name: '内衣裤', note: '约 {half} 套或一次内裤' },
  { id: 'socks', cat: '衣物', name: '袜子', note: '约 {half} 双' },
  { id: 'top-summer', cat: '衣物', name: '短袖/T恤', season: 'summer', note: '约 {half} 件' },
  { id: 'top-all', cat: '衣物', name: '长袖上衣', season: 'all', note: '约 {half} 件' },
  { id: 'pants', cat: '衣物', name: '长裤/休闲裤', note: '2 条' },
  { id: 'jacket-light', cat: '衣物', name: '薄外套', season: 'all', note: '早晚温差与空调房' },
  { id: 'thermo', cat: '衣物', name: '保暖内衣', season: 'winter', note: '2 套' },
  { id: 'down', cat: '衣物', name: '羽绒服', season: 'winter' },
  { id: 'hat-scarf', cat: '衣物', name: '帽子围巾手套', season: 'winter' },
  { id: 'swimsuit', cat: '衣物', name: '泳衣', dest: ['beach'] },
  { id: 'sandals', cat: '衣物', name: '沙滩凉鞋', dest: ['beach'] },
  { id: 'shoes-walk', cat: '衣物', name: '舒适步行鞋', note: '已穿一双+备用' },
  { id: 'boots-hike', cat: '衣物', name: '登山鞋', dest: ['mountain'], note: '中高帮护踝' },
  { id: 'shell', cat: '衣物', name: '冲锋衣+抓绒', dest: ['mountain'] },
  { id: 'biz-suit', cat: '衣物', name: '正装/衬衫+皮鞋', dest: ['business'] },
  { id: 'pajamas', cat: '衣物', name: '睡衣' },
  // 洗护
  { id: 'toiletry-kit', cat: '洗护', name: '牙刷牙膏毛巾', note: '酒店可免带' },
  { id: 'shampoo', cat: '洗护', name: '洗发水沐浴露', note: '分装≤100ml 登机' },
  { id: 'sunscreen', cat: '洗护', name: '防晒霜', dest: ['beach', 'mountain'], note: 'SPF50+ 勤补' },
  { id: 'moisturizer', cat: '洗护', name: '润肤霜+润唇膏', season: 'winter' },
  { id: 'makeup', cat: '洗护', name: '化妆品+卸妆', crowd: ['female'] },
  { id: 'shaver', cat: '洗护', name: '剃须刀', crowd: ['male'] },
  { id: 'feminine', cat: '洗护', name: '生理期用品', crowd: ['female'], note: '按周期备足' },
  // 药品
  { id: 'med-basics', cat: '药品', name: '肠胃药/感冒药/创可贴' },
  { id: 'motion-sick', cat: '药品', name: '晕车晕船药', dest: ['beach', 'mountain'] },
  { id: 'mosquito', cat: '药品', name: '驱蚊液+止痒膏', season: 'summer' },
  { id: 'altitude', cat: '药品', name: '高反药/氧气罐', dest: ['mountain'], note: '海拔3000m+ 按需' },
  { id: 'rx', cat: '药品', name: '个人处方药', note: '按疗程+病历' },
  { id: 'kid-meds', cat: '药品', name: '儿童退烧药+体温计', crowd: ['kid'] },
  // 其他
  { id: 'umbrella', cat: '其他', name: '折叠伞', note: '防晒防雨两用' },
  { id: 'bag-trash', cat: '其他', name: '环保袋+密封袋', note: '装湿衣脏物' },
  { id: 'neck-pillow', cat: '其他', name: '颈枕+眼罩耳塞', note: '长途/红眼航班' },
  { id: 'bottle', cat: '其他', name: '便携水杯' },
  { id: 'kid-milk', cat: '其他', name: '奶粉/辅食', crowd: ['kid'], note: '按天数+1 天余量' },
  { id: 'kid-diaper', cat: '其他', name: '尿布+湿巾', crowd: ['kid'], note: '每天约 4-6 片' },
  { id: 'kid-stroller', cat: '其他', name: '婴儿推车', crowd: ['kid'], note: '可登机折叠款' },
  { id: 'kid-toy', cat: '其他', name: '安抚玩具+零食', crowd: ['kid'] },
  { id: 'snacks', cat: '其他', name: '路餐能量零食', dest: ['mountain'] }
]

const CAT_ORDER = ['证件财务', '电子设备', '衣物', '洗护', '药品', '其他']

// 天数折算衣物数量：穿两天换一套
const qtyForDays = (days) => Math.max(2, Math.ceil(days / 2) + 1)

const seasonMatch = (itemSeason, season) => {
  if (!itemSeason) return true
  return itemSeason === season
}

// 生成清单：dests/crowds 为已选数组，season 为字符串（summer|winter|all）
const buildList = (days, dests, crowds, season) => {
  const d = Math.min(30, Math.max(1, Math.round(Number(days) || 1)))
  const ds = (dests || []).filter(Boolean)
  const cs = (crowds || []).filter(Boolean)
  if (!ds.length) return { groups: [], total: 0, days: d }
  const picked = CATALOG.filter((it) => {
    if (it.dest && !it.dest.some((x) => ds.includes(x))) return false
    if (it.crowd && !it.crowd.some((x) => cs.includes(x))) return false
    if (!seasonMatch(it.season, season)) return false
    return true
  })
  const groups = CAT_ORDER
    .map((name) => ({
      name,
      items: picked
        .filter((it) => it.cat === name)
        .map((it) => ({
          id: it.id,
          name: it.name,
          note: it.note ? String(it.note).replace('{half}', String(qtyForDays(d))) : ''
        }))
    }))
    .filter((g) => g.items.length > 0)
  return { groups, total: picked.length, days: d }
}
/* ==== PURE:END ==== */

// ---------- 选项与状态 ----------
const DESTS = [
  { value: 'beach', label: '海边' },
  { value: 'city', label: '城市' },
  { value: 'mountain', label: '山地' },
  { value: 'business', label: '商务' }
]
const CROWDS = [
  { value: 'male', label: '成人男' },
  { value: 'female', label: '成人女' },
  { value: 'kid', label: '儿童' }
]
const SEASONS = [
  { value: 'summer', label: '夏' },
  { value: 'winter', label: '冬' },
  { value: 'all', label: '四季' }
]

const STORAGE_KEY = 'travel-packing-checked-v1'

const days = ref(5)
const dests = ref(['city'])
const crowds = ref(['female'])
const season = ref('summer')
const checked = ref({})
const copyLabel = ref('复制清单')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const generated = computed(() => buildList(days.value, dests.value, crowds.value, season.value))

const totalItems = computed(() => generated.value.total)

const checkedCount = computed(() => {
  const ids = new Set()
  generated.value.groups.forEach((g) => g.items.forEach((it) => {
    if (checked.value[it.id]) ids.add(it.id)
  }))
  return ids.size
})

const progressPercent = computed(() =>
  totalItems.value ? Math.round((checkedCount.value / totalItems.value) * 100) : 0
)

const conditionSummary = computed(() => {
  const destLabels = dests.value.map((v) => (DESTS.find((d) => d.value === v) || {}).label).filter(Boolean).join('/')
  const crowdLabels = crowds.value.map((v) => (CROWDS.find((c) => c.value === v) || {}).label).filter(Boolean).join('/')
  const seasonLabel = (SEASONS.find((s) => s.value === season.value) || {}).label || ''
  return `${days.value} 天 · ${destLabels || '未选目的地'} · ${crowdLabels || '未选人群'} · ${seasonLabel}`
})

const toggleDest = (v) => {
  const idx = dests.value.indexOf(v)
  if (idx > -1) dests.value.splice(idx, 1)
  else dests.value.push(v)
}

const toggleCrowd = (v) => {
  const idx = crowds.value.indexOf(v)
  if (idx > -1) crowds.value.splice(idx, 1)
  else crowds.value.push(v)
}

// ---------- 勾选与持久化（回调/onMounted 内访问浏览器 API） ----------
const isChecked = (id) => !!checked.value[id]

const persist = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked.value))
  } catch (e) { /* 隐私模式等场景静默失败 */ }
}

const restore = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) checked.value = JSON.parse(raw) || {}
  } catch (e) {
    checked.value = {}
  }
}

onMounted(() => { restore() })

const toggleItem = (id) => {
  if (checked.value[id]) delete checked.value[id]
  else checked.value[id] = true
  persist()
}

const resetChecks = () => {
  checked.value = {}
  persist()
}

const groupDone = (group) => group.items.filter((it) => checked.value[it.id]).length

const GROUP_ICONS = {
  '证件财务': IdCard,
  '电子设备': Smartphone,
  '衣物': Shirt,
  '洗护': Bath,
  '药品': Pill,
  '其他': MoreHorizontal
}
const groupIcon = (name) => GROUP_ICONS[name] || MoreHorizontal

// ---------- 复制 / 打印 ----------
const buildListText = () => {
  const lines = ['旅行行李清单（' + conditionSummary.value + '）', '进度：' + checkedCount.value + '/' + totalItems.value, '']
  generated.value.groups.forEach((g) => {
    lines.push('【' + g.name + '】')
    g.items.forEach((it) => {
      lines.push((checked.value[it.id] ? '[x] ' : '[ ] ') + it.name + (it.note ? '（' + it.note + '）' : ''))
    })
    lines.push('')
  })
  return lines.join('\n').trim()
}

const copyList = async () => {
  const text = buildListText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyLabel.value = '已复制 ✓'
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      copyLabel.value = '已复制 ✓'
    } catch (e2) {
      copyLabel.value = '复制失败'
    }
    document.body.removeChild(ta)
  }
  setTimeout(() => { copyLabel.value = '复制清单' }, 2000)
}

const printList = () => {
  window.print()
}
</script>

<style scoped>
.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .tools-grid {
    display: block !important;
  }

  .print-only {
    display: block;
  }

  .print-area {
    border: none !important;
  }

  .bg-card {
    border: none !important;
    padding: 0 0 12px 0 !important;
  }

  ul li {
    break-inside: avoid;
  }
}
</style>
