<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Baby class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">儿童身高预测器</h1>
          <p class="text-sm text-muted-foreground mt-1">CMH 中亲法与欧洲遗传法则双公式预测遗传靶身高，附预测区间与影响因素说明</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线儿童身高预测器：输入父亲与母亲身高和孩子性别，并列输出两种通行遗传学公式的结果——
        ① CMH 中亲法（FPH）：男孩 =（父 + 母 + 13）÷ 2，女孩 =（父 + 母 − 13）÷ 2；
        ② 欧洲遗传法则：男孩 =（父 + 母）× 1.08 ÷ 2，女孩 =（父 × 0.923 + 母）÷ 2。
        结果为遗传靶身高参考，附 ±5cm 预测区间（环境影响可达 ±5~7cm）、两式差异说明卡与就医边界免责卡。
        本工具为统计学参考，不构成医疗诊断，精确评估请至儿科内分泌科进行骨龄等检测。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Baby class="w-5 h-5 mr-2 text-primary" /> 家庭数据
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="ch-father" class="block text-sm font-medium text-foreground mb-1.5">父亲身高（cm）</label>
            <input id="ch-father" v-model.number="father" type="number" min="120" max="220" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label for="ch-mother" class="block text-sm font-medium text-foreground mb-1.5">母亲身高（cm）</label>
            <input id="ch-mother" v-model.number="mother" type="number" min="120" max="220" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">孩子性别</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="sex = 'boy'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="sex === 'boy' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >男孩</button>
            <button
              type="button"
              @click="sex = 'girl'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="sex === 'girl' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >女孩</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">两个公式的性别修正方向不同，切换后双式结果都会更新。</p>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复示例（父 175 / 母 162）
        </button>

        <div v-if="validationIssue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ validationIssue }}</span>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <!-- 双公式结果 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 遗传靶身高预测（{{ sex === 'boy' ? '男孩' : '女孩' }}）
          </h2>
          <div v-if="result" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">CMH 中亲法（FPH）</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ result.cmh }} <span class="text-sm font-normal text-muted-foreground">cm</span></p>
                <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{{ result.cmhFormula }}</p>
                <p class="text-xs text-muted-foreground mt-2">参考区间 {{ result.cmhLow }} ~ {{ result.cmhHigh }} cm（±5cm）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">欧洲遗传法则</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.eu }} <span class="text-sm font-normal text-muted-foreground">cm</span></p>
                <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{{ result.euFormula }}</p>
                <p class="text-xs text-muted-foreground mt-2">参考区间 {{ result.euLow }} ~ {{ result.euHigh }} cm（±5cm）</p>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">两式均值</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.avg }} cm</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">两式差异</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.diff }} cm</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>两式结果都落在遗传靶身高附近即属正常；差异 {{ result.diff }} cm 来自公式系数口径不同，可取均值做参考中值。</span>
            </p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">输入父母身高后自动预测</p>
        </div>

        <!-- 两式差异说明卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 为什么两个公式结果不一样？
          </h2>
          <div class="space-y-3">
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">CMH 中亲法（Mid-parental Height / FPH）</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                国内临床与科普最常用：把父母平均身高整体加（男）或减（女）约半个性别差（13÷2 = 6.5cm），是 Tanner 等中亲身高方法的简化口径。结果偏「均值回归」，男孩通常略保守。
              </p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">欧洲遗传法则（国内常见版本）</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                男 =（父 + 母）× 1.08 ÷ 2、女 =（父 × 0.923 + 母）÷ 2：通过对父母身高加权放大性别差，男孩结果通常比 CMH 高几厘米。两式差异一般在 3 ~ 8cm，都属正常口径差异。
              </p>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              两个公式都是群体统计均值：遗传对成年身高的解释力约 70% ~ 80%，剩余由营养、睡眠、运动、疾病与内分泌状态决定，环境因素可带来 ±5~7cm 的偏离（页面注明「以通行经验/标准原文为准」）。
            </p>
          </div>
        </div>

        <!-- 影响因素卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Moon class="w-5 h-5 mr-2 text-primary" /> 遗传之外能做什么
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">睡眠</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">生长激素夜间深睡眠分泌最高，通行建议学龄儿童 9 小时以上、学龄前 10 小时以上并早入睡。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">运动与营养</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">纵向跳跃类运动（跳绳、篮球）与足量蛋白质、钙、维生素 D 有利于生长板健康；避免长期高糖饮料。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">监测与就医</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">定期记录生长曲线；年增速 &lt;5cm（学龄期）、明显偏离曲线或性早熟迹象，及时到儿科内分泌科评估骨龄。</p>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <NuxtLink
              to="/tools/pediatric-growth/"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition"
            >
              <Ruler class="w-4 h-4" /> 用儿童生长曲线工具记录趋势 →
            </NuxtLink>
            <NuxtLink
              to="/tools/age-calculator/"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition"
            >
              用年龄计算器核对月龄 →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- 免责卡 -->
    <div class="bg-card border border-amber-500/40 rounded-lg p-5 mb-6 flex items-start gap-3">
      <TriangleAlert class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p class="text-sm font-semibold text-foreground">医疗边界声明</p>
        <p class="text-xs text-muted-foreground leading-relaxed mt-1">
          本工具输出为遗传学统计参考（非诊断工具）：公式基于群体均值，无法覆盖骨龄、青春期启动时间、疾病与内分泌状态等个体因素，
          不用于任何健康评估、诊断或治疗决策。精确评估请至正规医院儿科内分泌科进行骨龄 X 光、生长激素等专项检测，并遵医嘱。
        </p>
      </div>
    </div>

    <!-- SEO 折叠区 -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>身高预测公式的出处与边界</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>CMH 中亲法</strong>：男孩 =（父身高 + 母身高 + 13）÷ 2；女孩 =（父身高 + 母身高 − 13）÷ 2。</p>
            <p><strong>欧洲遗传法则</strong>：男孩 =（父身高 + 母身高）× 1.08 ÷ 2；女孩 =（父身高 × 0.923 + 母身高）÷ 2。</p>
            <p><strong>预测区间</strong>：两式均按 ±5cm 提示遗传靶区间；营养、睡眠、运动与内分泌等环境因素可带来 ±5~7cm 的额外偏离。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">CMH 公式是什么来头？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            CMH（Corrected Midparental Height， corrected 中亲身高）源自 Tanner 等提出的「父母平均身高」遗传学方法：
            孩子成年身高围绕父母身高均值分布，再按性别修正约半个男女平均身高差（约 13cm 的一半）。
            该简化口径被国内儿科普遍采用（梅奥诊所中文站、中华医学会科普等均引用同款系数）；
            「欧洲遗传法则」是流传于国内的另一版本系数（1.08 / 0.923），两式差异来自对性别差的加权方式不同，本页并列展示便于对照。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">影响身高的因素有哪些？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            遗传解释约 70% ~ 80% 的成年身高差异，其余来自环境：① 睡眠——生长激素在夜间深睡眠出现分泌高峰，长期熬夜直接压缩分泌窗口；
            ② 营养——蛋白质、钙、维生素 D 与锌是生长板物质基础，但过度进补（尤其含性激素类补品）反而促成骨龄提前；
            ③ 运动——纵向跳跃与拉伸类运动刺激生长板，每日累计 1 小时中高强度活动是通行建议；
            ④ 疾病与内分泌——生长激素缺乏、甲状腺功能异常、性早熟等都会显著偏离靶身高，需要专科评估。
            想跟踪趋势，可用本站儿童生长曲线工具按月龄对照百分位。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">父 175、母 162，孩子能长多高？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                CMH：男孩（175+162+13）÷2 = 175cm，女孩（175+162−13）÷2 = 162cm；欧洲法则男孩（175+162）×1.08÷2 ≈ 182cm。
                各取 ±5cm 为遗传靶区间，实际落在区间外也常见。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">预测准吗？误差多大？</h4>
              <p class="text-sm text-muted-foreground leading-relaxed mt-1">
                公式只给群体均值水平的「遗传靶」，个体差异普遍 ±5cm、环境因素充分时可到 ±7cm；
                临床上更精确的手段是骨龄片（TW3 / 中华 05 计分法）结合 Current Height 与青春期进展评估。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">父母不高孩子就一定不高吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                不一定：身高是多基因遗传，隔代与基因重组都会带来偏离；睡眠、运动与营养管理充分的孩子，成年身高超过遗传靶上限并不罕见。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">计算数据会上传吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">不会。身高与性别输入只在你的浏览器内即时计算，无网络请求，不保存不上传。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            CMH 中亲法系数（±13）经梅奥诊所中文健康问答与国内医院科普两源交叉核对一致；欧洲遗传法则系数（1.08 / 0.923）经国内医院科普与百科两源核对；
            预测区间 ±5cm 为通行口径，环境影响 ±5~7cm 为儿科普遍表述（页面注明「以通行经验/标准原文为准」）。本页为统计参考，非医疗诊断工具。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'child-height-predictor'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Baby, Ruler, Info, Moon, RefreshCw, TriangleAlert, CheckCircle, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '儿童身高预测器 - CMH中亲法与欧洲遗传法则双公式 | 有条工具',
  description: '免费在线儿童身高预测器：输入父母身高与孩子性别，并列输出 CMH 中亲法（男+13/女-13）与欧洲遗传法则（1.08/0.923）双公式遗传靶身高，附±5cm预测区间、两式差异说明、睡眠运动营养影响因素与就医边界声明，纯浏览器本地计算不上传',
  keywords: '孩子身高预测,父母身高算孩子身高,儿童成年身高计算,遗传身高预测,CMH公式,身高计算公式',
  author: '有条工具',
  ogTitle: '儿童身高预测器 - 双公式遗传靶身高 | 有条工具',
  ogDescription: 'CMH 中亲法与欧洲遗传法则并列预测，±5cm 区间与影响因素说明，非诊断工具。',
  ogUrl: 'https://www.util.cn/tools/child-height-predictor',
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
          '@type': 'SoftwareApplication',
          name: '儿童身高预测器',
          url: 'https://www.util.cn/tools/child-height-predictor',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'CMH 中亲法：男（父+母+13）/2，女（父+母−13）/2',
            '欧洲遗传法则：男（父+母）×1.08/2，女（父×0.923+母）/2',
            '双公式并列与差异说明',
            '±5cm 遗传靶区间提示（环境影响 ±5~7cm）',
            '睡眠 / 运动 / 营养影响因素卡',
            '医疗边界免责声明（非诊断工具）',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '儿童身高预测器', item: 'https://www.util.cn/tools/child-height-predictor' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '父 175cm、母 162cm，孩子预测多高？',
              acceptedAnswer: { '@type': 'Answer', text: 'CMH 中亲法：男孩（175+162+13）÷2 = 175cm，女孩（175+162−13）÷2 = 162cm；欧洲遗传法则男孩（175+162）×1.08÷2 ≈ 182cm。各取 ±5cm 为遗传靶区间。' }
            },
            {
              '@type': 'Question',
              name: '身高预测公式准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '公式输出的是群体统计意义的遗传靶身高，个体普遍有 ±5cm、环境因素充分时 ±7cm 的偏离；精确评估需儿科内分泌科骨龄检测。' }
            },
            {
              '@type': 'Question',
              name: 'CMH 公式出自哪里？',
              acceptedAnswer: { '@type': 'Answer', text: '源自 Tanner 等的中亲身高（Mid-parental Height）方法：以父母平均身高为基准按性别修正约 13cm 的一半，是国内儿科与科普最常用的简化口径。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// CMH 中亲法：男 =（父+母+13)/2，女 =（父+母−13)/2；
// 欧洲遗传法则：男 =（父+母)×1.08/2，女 =（父×0.923+母)/2。结果四舍五入到 0.1cm。
function cmhOf(father, mother, boy) {
  const f = Number(father)
  const m = Number(mother)
  if (!Number.isFinite(f) || !Number.isFinite(m) || f <= 0 || m <= 0) return null
  return boy ? (f + m + 13) / 2 : (f + m - 13) / 2
}
function euOf(father, mother, boy) {
  const f = Number(father)
  const m = Number(mother)
  if (!Number.isFinite(f) || !Number.isFinite(m) || f <= 0 || m <= 0) return null
  return boy ? ((f + m) * 1.08) / 2 : (f * 0.923 + m) / 2
}
const fmtCm = (v) => (v === null ? '—' : +(Math.round(v * 10) / 10).toFixed(1))

// ---------- 响应式参数 ----------
const father = ref(175)
const mother = ref(162)
const sex = ref('boy')

const isBoy = computed(() => sex.value === 'boy')

const validationIssue = computed(() => {
  const f = Number(father.value)
  const m = Number(mother.value)
  if (!Number.isFinite(f) || !Number.isFinite(m) || f <= 0 || m <= 0) return '请输入父母身高（cm，大于 0）'
  if (f < 130 || f > 220 || m < 130 || m > 220) return '身高输入超出常规范围（130 ~ 220cm），请确认'
  return ''
})

// ---------- 计算结果 ----------
const result = computed(() => {
  const cmh = cmhOf(father.value, mother.value, isBoy.value)
  const eu = euOf(father.value, mother.value, isBoy.value)
  if (cmh === null || eu === null) return null
  const cmhFormula = isBoy.value
    ? `（${father.value} + ${mother.value} + 13）÷ 2`
    : `（${father.value} + ${mother.value} − 13）÷ 2`
  const euFormula = isBoy.value
    ? `（${father.value} + ${mother.value}）× 1.08 ÷ 2`
    : `（${father.value} × 0.923 + ${mother.value}）÷ 2`
  return {
    cmh: fmtCm(cmh),
    cmhFormula,
    cmhLow: fmtCm(cmh - 5),
    cmhHigh: fmtCm(cmh + 5),
    eu: fmtCm(eu),
    euFormula,
    euLow: fmtCm(eu - 5),
    euHigh: fmtCm(eu + 5),
    avg: fmtCm((cmh + eu) / 2),
    diff: fmtCm(Math.abs(eu - cmh))
  }
})

// ---------- 交互动作 ----------
function resetAll() {
  father.value = 175
  mother.value = 162
  sex.value = 'boy'
}

onMounted(() => {
  addRecentTool('child-height-predictor')
})
</script>
