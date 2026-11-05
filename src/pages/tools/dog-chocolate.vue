<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Heart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">巧克力毒性评估 - 狗狗可可碱摄入剂量分级</h1>
          <p class="text-sm text-muted-foreground mt-1">按狗体重 × 巧克力种类 × 食用量估算可可碱摄入（mg/kg），对照兽医分级口径给出观察 / 就医 / 急诊参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线狗狗巧克力中毒评估工具：输入狗体重（kg）、巧克力种类与食用量（g），按可可碱含量预设（牛奶 ≈2.1、半甜黑巧 ≈5.3、
        黑巧 70-85% 约 5.5-7、无糖烘焙 ≈13.6、白巧 ≈0 mg/g）计算总摄入量与每公斤体重剂量，
        对照常见兽医分级：<span class="font-medium text-foreground">轻度 &lt;20、中度 20-40、重度 40-60、致命风险 &gt;60 mg/kg</span>。
        支持吉娃娃 / 柯基 / 金毛等体型快捷输入与自定义可可碱含量。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>本工具为剂量参考分级，不替代兽医判断；疑似中毒请立即联系宠物医院。种类或分量不确定时，一律按更高风险档处理（就高原则）。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Heart class="w-5 h-5 mr-2 text-primary" /> 摄入情况
          </h2>

          <!-- 狗体重 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">狗体重 (kg)</label>
            <input
              v-model.number="weightKg"
              type="number"
              min="0.5"
              step="0.1"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 10"
            />
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="preset in WEIGHT_PRESETS"
                :key="preset.kg"
                @click="weightKg = preset.kg"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-xs',
                  weightKg === preset.kg
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                ]"
              >{{ preset.label }}</button>
            </div>
          </div>

          <!-- 巧克力种类 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">巧克力种类</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in CHOCO_TYPES"
                :key="t.id"
                @click="selectType(t.id)"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-xs',
                  chocoType === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                ]"
              >{{ t.label }}</button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1">可可碱含量预设：{{ currentTypeHint }}</p>
          </div>

          <!-- 自定义含量 -->
          <div v-if="chocoType === 'custom'">
            <label class="block text-xs font-medium text-foreground mb-1">自定义可可碱含量 (mg/g)</label>
            <input
              v-model.number="customMgPerG"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 7（黑巧上限）"
            />
            <p class="text-[11px] text-muted-foreground mt-1">不确定种类时按更高含量档评估（就高原则）。</p>
          </div>

          <!-- 食用量 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">食用量 (g)</label>
            <input
              v-model.number="grams"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 50"
            />
            <p class="text-[11px] text-muted-foreground mt-1">常见参照：一块排装约 100g，一块方砖约 5g，一颗巧克力豆约 1g。</p>
          </div>

          <button
            @click="resetInputs"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认输入
          </button>
        </div>

        <!-- 免责卡（显著） -->
        <div class="bg-amber-500/10 border border-amber-500/40 rounded-lg p-5 space-y-2">
          <h3 class="text-sm font-semibold flex items-center text-amber-600 dark:text-amber-400">
            <Siren class="w-4 h-4 mr-1.5" /> 重要免责与就医提示
          </h3>
          <ul class="text-xs leading-relaxed text-foreground space-y-1.5 list-disc list-inside">
            <li>本工具是<span class="font-semibold">剂量参考分级，不是诊断</span>，不能替代兽医面诊与临床检查。</li>
            <li>疑似巧克力中毒请<span class="font-semibold">立即联系宠物医院 / 24 小时急诊</span>，并携带包装或拍下剩余巧克力。</li>
            <li>种类、分量、时间任何一项不确定，<span class="font-semibold">一律按就高处理</span>——宁可白跑一趟，不可错过窗口。</li>
            <li>是否催吐、如何催吐必须由医生决定，请勿自行用盐、双氧水等催吐。</li>
          </ul>
        </div>
      </div>

      <!-- 右栏：结果（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <template v-if="doseResult">
          <!-- 剂量总览 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 class="text-lg font-semibold flex items-center">
                <Activity class="w-5 h-5 mr-2 text-primary" /> 可可碱摄入估算
              </h2>
              <span class="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{{ currentTypeLabel }} · {{ weightKg }}kg 犬</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">摄入剂量</p>
                <p class="text-3xl font-bold text-primary">{{ doseResult.perKg }} <span class="text-sm font-medium">mg/kg</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">总摄入 ÷ 体重，1 位小数</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">总摄入量</p>
                <p class="text-2xl font-bold text-foreground">{{ doseResult.totalMg }} <span class="text-sm font-medium">mg</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ grams }}g × {{ mgPerG }}mg/g</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">相当于</p>
                <p class="text-2xl font-bold text-foreground">{{doseResult.perKg >= 20 ? '已有症状剂量' : '症状阈值以下'}}</p>
                <p class="text-[11px] text-muted-foreground mt-1">多数个体 20mg/kg 起出现明显症状</p>
              </div>
            </div>
          </div>

          <!-- 分级判定 -->
          <div v-if="grade" :class="['border rounded-lg p-6', gradeCardClass]">
            <div class="flex items-center gap-2 mb-2">
              <Siren class="w-5 h-5" />
              <h3 class="text-xl font-bold">{{ grade.label }}</h3>
              <span class="text-sm opacity-80">（{{ grade.range }} mg/kg）</span>
            </div>
            <p class="text-sm leading-relaxed mb-2"><span class="font-semibold">典型表现：</span>{{ grade.signs }}</p>
            <p class="text-sm leading-relaxed"><span class="font-semibold">建议：</span>{{ grade.action }}</p>
          </div>

          <!-- 分级对照表 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-sm font-semibold text-foreground mb-3">分级对照（常见兽医参考口径，非诊断）</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border text-muted-foreground">
                    <th class="py-2 px-3 text-left">剂量 (mg/kg)</th>
                    <th class="py-2 px-3 text-left">分级</th>
                    <th class="py-2 px-3 text-left">典型表现</th>
                    <th class="py-2 px-3 text-left">处置</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="band in GRADE_TABLE"
                    :key="band.key"
                    class="border-b border-border/60 hover:bg-muted/50"
                    :class="grade && grade.key === band.key ? 'bg-primary/5 font-medium' : ''"
                  >
                    <td class="py-2 px-3 text-foreground whitespace-nowrap">{{ band.range }}</td>
                    <td class="py-2 px-3 text-foreground">{{ band.label }}</td>
                    <td class="py-2 px-3 text-muted-foreground">{{ band.signs }}</td>
                    <td class="py-2 px-3 text-muted-foreground">{{ band.action }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              个体差异大：幼犬、老年犬、心脏病犬更低剂量即可出现症状；可可碱半衰期长（约 17.5 小时），症状可持续 12-36 小时甚至更久。
            </p>
          </div>
        </template>

        <div v-else class="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          请输入体重、选择巧克力种类并填写食用量开始评估
        </div>

        <!-- 白巧特别注记 -->
        <div v-if="isWhiteType" class="bg-card border border-border rounded-lg p-5 space-y-2">
          <h3 class="text-sm font-semibold flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 白巧克力：可可碱风险≈0，但不是"随便吃"
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            白巧克力几乎不含可可固形物，可可碱≈0，按本页口径没有可可碱中毒风险；
            但它<span class="font-medium text-foreground">高糖高脂</span>，大量食用仍可引起呕吐、腹泻，甚至诱发胰腺炎（尤其迷你雪纳瑞等易感犬种）。
            若吃下量较大或出现持续呕吐，仍建议咨询兽医。
          </p>
        </div>

        <!-- 猫注记 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-2">
          <h3 class="text-sm font-semibold flex items-center">
            <Cat class="w-4 h-4 mr-1.5 text-primary" /> 猫也适用吗？
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            猫对可可碱的敏感度比狗更高，但猫缺乏甜味受体、几乎不会主动吃巧克力，实际中毒案例很少。
            若确认猫吃了巧克力（尤其黑巧 / 无糖烘焙 / 可可粉），剂量参考本页分级即可，但建议直接联系兽医，
            因为猫的可可碱代谢与剂量-毒性关系研究更少、个体差异更大。
          </p>
        </div>

        <!-- 时间窗提示 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-2">
          <h3 class="text-sm font-semibold flex items-center">
            <Clock class="w-4 h-4 mr-1.5 text-primary" /> 症状时间窗：吃下后 6-12 小时是关键
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            可可碱中毒症状多在<span class="font-medium text-foreground">食用后 6-12 小时内</span>出现（早期：口渴、呕吐、躁动、多尿；
            进展：心动过速、震颤、心律失常、癫痫），并因半衰期长可持续 12-36 小时以上。
            就医时务必告知<span class="font-medium text-foreground">种类、估计克数、食用时间</span>——这三项比任何估算都重要。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>可可碱是什么？为什么狗不能吃巧克力？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          可可碱（Theobromine）是可可豆中天然存在的甲基黄嘌呤类生物碱，与咖啡因同族，也是巧克力"提神"的来源之一。
          人类肝脏代谢可可碱很快，少量摄入毫无压力；而狗代谢可可碱的速度只有人的约六分之一，
          半衰期长达 17.5 小时左右——同样一块巧克力，人很快分解掉，狗体内却在持续蓄积，
          作用于中枢神经、心肌与平滑肌，引起心动过速、震颤、心律失常乃至癫痫。
        </p>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          可可碱含量随可可固形物比例升高：白巧几乎为 0，牛奶巧克力约 2.1 mg/g，半甜黑巧约 5.3 mg/g，
          70-85% 黑巧约 5.5-7 mg/g，无糖烘焙巧克力与可可粉可达 13.6 mg/g 以上（本页预设按公开兽医手册口径 mg/oz 折算，
          不同资料略有出入，故按就高原则评估）。这意味着 10kg 的狗吃 50g 黑巧（按 7mg/g）摄入约 350mg，即 35mg/kg，已进入中度分级。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">分级是怎么定的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          常见兽医资料把犬可可碱剂量风险粗分为四档：&lt;20mg/kg 多为轻度胃肠道反应，居家观察即可；
          20-40mg/kg 出现呕吐腹泻与心动过速，应在 24 小时内就医；40-60mg/kg 可发生心律失常与肌肉震颤，需要紧急处理；
          &gt;60mg/kg 有癫痫发作与死亡风险，必须立即急诊。个体差异很大，幼犬、老年犬与心脏病犬阈值更低，
          所以任何估算都只是参考——不确定就按更高档处理。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">吃了之后多久出现症状？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          通常在食用后 6-12 小时内出现早期症状：口渴加剧、呕吐、躁动、排尿增多（可可碱有利尿作用）。
          由于可可碱半衰期约 17.5 小时，中重度病例的症状可持续 12-36 小时甚至 72 小时。
          这也是为什么"现在看着没事"不代表安全——万一吃下的是黑巧或无糖烘焙，请按本页估算剂量并尽早联系兽医，
          而不是等症状出现再行动。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">能不能在家催吐？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          催吐在摄入后 1-2 小时内效果最好，但<span class="font-medium text-foreground">是否催吐、用什么药物催吐，必须由兽医决定</span>：
          网传的盐水、双氧水、手指抠喉都可能造成食道灼伤、吸入性肺炎或延误处理；
          已出现震颤、抽搐或意识异常的狗催吐风险更高。正确做法是：记录种类与克数、估算剂量、立即联系宠物医院，
          由医生决定催吐、洗胃或活性炭吸附。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-base font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'dog-chocolate'" :category="'others'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Heart, Info, ChevronUp, ChevronDown,
  Cat, Clock, Siren, Activity, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'dog-chocolate'
const STORAGE_KEY = 'dog-chocolate-inputs'

// ---------- SEO ----------
useSeoMeta({
  title: '巧克力毒性评估 - 狗狗可可碱摄入剂量分级 | 有条工具',
  description: '免费在线狗巧克力中毒评估：按体重、种类（牛奶/黑巧/无糖烘焙/白巧）与食用量计算可可碱 mg/kg，对照轻度<20、中度20-40、重度40-60、致命>60 兽医分级，给出观察/就医/急诊参考。',
  keywords: '狗吃巧克力,巧克力中毒,可可碱,狗狗巧克力,狗巧克力剂量,巧克力毒性评估,宠物急救',
  author: '有条工具',
  ogTitle: '巧克力毒性评估 - 狗狗可可碱摄入剂量分级 | 有条工具',
  ogDescription: '体重×种类×食用量→可可碱 mg/kg 分级，观察/就医/急诊参考，纯本地计算。',
  ogUrl: 'https://www.util.cn/tools/dog-chocolate',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// ---------- 纯逻辑（可独立单测） ----------
// __PURE_FNS_START__
function round1(n: number): number { return Math.round(n * 10) / 10 }
function round2(n: number): number { return Math.round(n * 100) / 100 }

// 巧克力可可碱含量预设（mg/g）。口径来源类型：公开兽医参考资料（如默克兽医手册以 mg/oz 给出的
// 可可碱含量表折算：牛奶 44-64mg/oz≈1.6-2.3、半甜 150-160≈5.3-5.6、无糖烘焙 390-450≈13.8-15.9），
// 不同资料略有出入，取常用中低值作为预设；黑巧 70-85% 资料区间 5.5-7，预设取中值 6.3，示例与不确定场景可自定义就高。
const CHOCO_TYPES = [
  { id: 'white', label: '白巧', mgPerG: 0, hint: '≈0 mg/g（几乎不含可可固形物）' },
  { id: 'milk', label: '牛奶巧', mgPerG: 2.1, hint: '≈2.1 mg/g' },
  { id: 'semi', label: '半甜黑巧', mgPerG: 5.3, hint: '≈5.3 mg/g' },
  { id: 'dark', label: '黑巧 70-85%', mgPerG: 6.3, hint: '约 5.5-7 mg/g，取中值 6.3' },
  { id: 'baking', label: '无糖烘焙', mgPerG: 13.6, hint: '≈13.6 mg/g（部分资料到 16，按就高评估）' },
  { id: 'custom', label: '自定义', mgPerG: null, hint: '手动输入 mg/g' }
]

// 体型快捷预设
const WEIGHT_PRESETS = [
  { label: '吉娃娃 2kg', kg: 2 },
  { label: '柯基 12kg', kg: 12 },
  { label: '金毛 30kg', kg: 30 }
]

// 分级表（常见兽医参考口径，非诊断）：轻度<20、中度20-40、重度40-60、致命>60（60 计入重度）
const GRADE_TABLE = [
  { key: 'safe', range: '= 0', label: '无可可碱风险', signs: '白巧等可可碱≈0 的品类', action: '留意高糖高脂引起的肠胃不适 / 胰腺炎' },
  { key: 'mild', range: '< 20', label: '轻度', signs: '恶心、轻度呕吐或腹泻、口渴', action: '居家观察 12-24 小时，保证饮水；有异常再就医' },
  { key: 'moderate', range: '20 - 40', label: '中度', signs: '呕吐腹泻、心动过速、躁动不安', action: '24 小时内联系兽医，按医嘱处理' },
  { key: 'severe', range: '40 - 60', label: '重度', signs: '心律失常、肌肉震颤、高热', action: '立即送医急诊' },
  { key: 'lethal', range: '> 60', label: '致命风险', signs: '癫痫发作、虚脱，可能致死', action: '立即急诊，越快越好' }
]

// 剂量估算：总摄入 = 食用g × 含量mg/g；每公斤 = 总摄入 ÷ 体重kg。非法输入返回 null
function theobromineDose(weightKg: number, grams: number, mgPerG: number) {
  const w = Number(weightKg)
  const g = Number(grams)
  const c = Number(mgPerG)
  if (!(w > 0) || !(g > 0) || !(c >= 0) || !Number.isFinite(w) || !Number.isFinite(g) || !Number.isFinite(c)) return null
  const totalMg = round2(g * c)
  const perKg = round1(totalMg / w)
  return { totalMg, perKg }
}

// 分级判定：<20 轻度、<40 中度、<=60 重度、>60 致命；0 视为无可可碱风险
function gradeLevel(perKg: number) {
  const d = Number(perKg)
  if (!Number.isFinite(d) || d < 0) return null
  if (d === 0) return GRADE_TABLE[0]
  if (d < 20) return GRADE_TABLE[1]
  if (d < 40) return GRADE_TABLE[2]
  if (d <= 60) return GRADE_TABLE[3]
  return GRADE_TABLE[4]
}
// __PURE_FNS_END__

// ---------- 响应式状态 ----------
const weightKg = ref<number>(10)
const chocoType = ref<string>('dark')
const customMgPerG = ref<number>(7)
const grams = ref<number>(50)
const seoContentVisible = ref(true)

const faqs = [
  {
    q: '狗吃了巧克力多久会出现症状？',
    a: '多在食用后 6-12 小时内出现：早期表现为口渴、呕吐、躁动、多尿；重者随后出现心动过速、震颤、心律失常甚至癫痫。可可碱半衰期约 17.5 小时，症状可持续 12-36 小时以上。因此"现在没事"不等于安全，吃了黑巧或无糖烘焙请尽早按剂量分级就医。'
  },
  {
    q: '白巧克力对狗安全吗？',
    a: '按可可碱口径基本安全：白巧几乎不含可可固形物，可可碱≈0mg/g，不会引起可可碱中毒。但它高糖高脂，大量食用可导致呕吐、腹泻，甚至诱发胰腺炎（迷你雪纳瑞等犬种尤其易感）。若吃下量较大或持续呕吐，仍应咨询兽医。'
  },
  {
    q: '多少可可碱会致命？',
    a: '文献中犬可可碱半数致死量（LD50）约在 100-200mg/kg，但个体差异极大：>60mg/kg 即有癫痫与死亡风险，20mg/kg 起多数个体出现明显症状，幼犬、老年犬与心脏病犬阈值更低。不要卡线评估——任何不确定都按就高处理并联系兽医。'
  },
  {
    q: '不确定吃的是哪种巧克力怎么办？',
    a: '按就高原则：无糖烘焙 / 可可粉（≈13.6mg/g 起步）> 黑巧（5.5-7）> 半甜（≈5.3）> 牛奶（≈2.1）。可以直接在本页选"自定义"输入 13.6 评估最坏情况；同时保留包装或拍照，就医时提供给兽医。'
  },
  {
    q: '猫吃了巧克力怎么办？',
    a: '猫对可可碱敏感度比狗更高，但缺乏甜味受体、几乎不会主动吃巧克力。若确认猫吃了巧克力（尤其黑巧 / 无糖烘焙 / 可可粉），即使量很小也建议直接联系兽医，猫的剂量-毒性关系研究更少，不宜自行观察等待。'
  }
]

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '巧克力毒性评估',
          url: 'https://www.util.cn/tools/dog-chocolate',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['可可碱摄入剂量计算 (mg/kg)', '常见巧克力含量预设与自定义', '轻度/中度/重度/致命四级分级', '吉娃娃/柯基/金毛体型快捷输入', '分级对照表与就医建议', '白巧与猫的特别注记']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '巧克力毒性评估', item: 'https://www.util.cn/tools/dog-chocolate' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a }
          }))
        }
      ]
    })
  }]
})

// ---------- 派生结果 ----------
const currentType = computed(() => CHOCO_TYPES.find(t => t.id === chocoType.value) || CHOCO_TYPES[3])
const currentTypeLabel = computed(() => currentType.value.label)
const currentTypeHint = computed(() => currentType.value.hint)
const isWhiteType = computed(() => chocoType.value === 'white')

const mgPerG = computed(() => {
  if (chocoType.value === 'custom') {
    const v = Number(customMgPerG.value)
    return Number.isFinite(v) && v >= 0 ? v : 0
  }
  return currentType.value.mgPerG as number
})

const doseResult = computed(() => theobromineDose(weightKg.value, grams.value, mgPerG.value))
const grade = computed(() => (doseResult.value ? gradeLevel(doseResult.value.perKg) : null))

const gradeCardClass = computed(() => {
  switch (grade.value?.key) {
    case 'safe': return 'bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400'
    case 'mild': return 'bg-yellow-500/10 border-yellow-500/40 text-yellow-600 dark:text-yellow-400'
    case 'moderate': return 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400'
    case 'severe': return 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400'
    case 'lethal': return 'bg-red-500/20 border-red-500/60 text-red-600 dark:text-red-400'
    default: return 'bg-muted border-border text-foreground'
  }
})

// ---------- 操作（纯本地状态，SSR 安全） ----------
function selectType(id: string) { chocoType.value = id }

const DEFAULT_INPUTS = { weightKg: 10, chocoType: 'dark', customMgPerG: 7, grams: 50 }

function resetInputs() {
  weightKg.value = DEFAULT_INPUTS.weightKg
  chocoType.value = DEFAULT_INPUTS.chocoType
  customMgPerG.value = DEFAULT_INPUTS.customMgPerG
  grams.value = DEFAULT_INPUTS.grams
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 持久化：仅客户端交互回调中写 localStorage（键前缀 = 工具 id）
watch([weightKg, chocoType, customMgPerG, grams], () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        weightKg: weightKg.value,
        chocoType: chocoType.value,
        customMgPerG: customMgPerG.value,
        grams: grams.value
      }))
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.weightKg === 'number' && s.weightKg > 0) weightKg.value = s.weightKg
      if (typeof s.chocoType === 'string' && CHOCO_TYPES.some(t => t.id === s.chocoType)) chocoType.value = s.chocoType
      if (typeof s.customMgPerG === 'number' && s.customMgPerG >= 0) customMgPerG.value = s.customMgPerG
      if (typeof s.grams === 'number' && s.grams >= 0) grams.value = s.grams
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})
</script>
