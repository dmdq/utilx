<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplet class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">机油标号解读器（SAE J300）</h1>
          <p class="text-sm text-muted-foreground mt-1">5W-30 每个数字什么意思：低温泵送边界 + 100°C 粘度区间，按 J300 标准对照解读</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线机油粘度标号解读工具：输入或选择 0W-20、5W-40、15W-40 这类标号，按 SAE J300 粘度分类逐项解读——
        W 前数字是低温等级（泵送边界温度与冷启动粘度上限），横杠后数字是 100°C 运动粘度区间与高温剪切（HTHS）下限。
        附完整 J300 对照表、常见误读科普与按气候 / 车况的选择引导。全部解读在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：本页数值取自 SAE J300 粘度分类表（Chevron Marine 技术简报全文转载 + Wikipedia 互校，两源数值一致）。
        W 前数字看两项低温试验：<span class="text-foreground font-medium">CCS 冷启动模拟（ASTM D5293）</span>与
        <span class="text-foreground font-medium">MRV 低温泵送（ASTM D4684）</span>；横杠后数字看
        <span class="text-foreground font-medium">100°C 运动粘度区间（ASTM D445）</span>与
        <span class="text-foreground font-medium">HTHS 高温高剪切粘度下限（ASTM D4683）</span>。
        本页是标准解读，不是选油结论——<span class="text-foreground font-medium">以车辆说明书为准</span>。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左列：标号输入 + 解读 + 误读科普 -->
      <div class="space-y-6">
        <!-- 标号输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Wrench class="w-5 h-5 mr-2 text-primary" /> 输入机油标号
          </h2>

          <div>
            <label for="ovg-grade" class="block text-sm font-medium text-foreground mb-1.5">标号（如 5W-30，或单级油 40）</label>
            <input
              id="ovg-grade"
              v-model="gradeText"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 5W-30"
              autocomplete="off"
              spellcheck="false"
            >
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="g in commonGrades"
                :key="g"
                @click="gradeText = g"
                :class="['px-3 py-1.5 rounded-lg text-xs transition font-mono', gradeText.toUpperCase() === g ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
              >{{ g }}</button>
            </div>
          </div>

          <!-- 非法标号报错 -->
          <div v-if="parsed && !parsed.ok" class="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <p class="text-sm font-bold text-red-600 dark:text-red-400 mb-1">标号不对</p>
            <p class="text-xs leading-relaxed text-red-600/90 dark:text-red-400/90">{{ parseError }}</p>
          </div>
          <p v-else-if="!parsed" class="text-xs text-muted-foreground">输入标号或点击上方常用标号开始解读。</p>
        </div>

        <!-- 解读卡 -->
        <div v-if="parsed && parsed.ok" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 标号解读：{{ parsed.mono ? parsed.h + '（单级油）' : parsed.w + 'W-' + parsed.h }}
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- W 位解读 -->
            <div v-if="!parsed.mono" class="p-4 rounded-lg border border-border bg-muted/50 space-y-2">
              <p class="text-sm text-muted-foreground">W 前数字 = 低温等级</p>
              <p class="text-3xl font-bold text-primary">{{ parsed.w }}<span class="text-lg font-semibold">W</span></p>
              <ul class="text-xs leading-relaxed text-muted-foreground space-y-1">
                <li>• {{ parsed.wRow.pumpTemp }}°C 以下泵送失效风险：MRV 泵送粘度上限 60000 mPa·s 在 {{ parsed.wRow.pumpTemp }}°C 测</li>
                <li>• 冷启动能力：{{ parsed.wRow.ccsTemp }}°C 下 CCS 粘度不超过 {{ parsed.wRow.ccsMax.toLocaleString() }} mPa·s</li>
                <li>• 100°C 运动粘度下限 {{ parsed.wRow.kvMin }} cSt（兜底油膜）</li>
                <li>• 数字越小，低温流动性越好，冷启动保护越好</li>
              </ul>
            </div>
            <div v-else class="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
              <p class="text-sm font-bold text-amber-700 dark:text-amber-400">单级油（无 W 位）</p>
              <p class="text-xs leading-relaxed text-amber-700/90 dark:text-amber-400/90">
                SAE {{ parsed.h }} 单级油没有低温等级标注，低温性能未经过 W 系列试验验证，
                只适合环境温度常年稳定在 0°C 以上的场景或特定工业用途；家用车日常通勤请选 xW-yy 多级油。
              </p>
            </div>

            <!-- 高温位解读 -->
            <div class="p-4 rounded-lg border border-border bg-muted/50 space-y-2">
              <p class="text-sm text-muted-foreground">横杠后数字 = 高温粘度档</p>
              <p class="text-3xl font-bold text-primary">{{ parsed.h }}</p>
              <ul class="text-xs leading-relaxed text-muted-foreground space-y-1">
                <li>• 100°C 运动粘度须落在 {{ parsed.hRow.kvMin }} ~ &lt;{{ parsed.hRow.kvMax }} cSt 区间（ASTM D445）</li>
                <li>• HTHS 高温高剪切粘度下限：{{ parsed.hRow.hthsNote }}（150°C，mPa·s）</li>
                <li>• 数字越大，高温油膜越厚、牌号越"稠"</li>
              </ul>
            </div>
          </div>

          <div v-if="!parsed.mono" class="p-3 rounded-lg bg-muted/60 border border-border">
            <p class="text-xs leading-relaxed text-muted-foreground">
              <span class="text-foreground font-medium">为什么 {{ parsed.w }}W-{{ parsed.h }} 能两头兼顾：</span>
              靠粘度指数改进剂（VI improver）——基础油先满足 {{ parsed.w }}W 的低温泵送与冷启动试验，
              再由增粘聚合物把 100°C 粘度补足到 {{ parsed.h }} 档区间。两组数字是两套温度下的两项独立指标，不存在"从 5 稠到 30"这回事。
            </p>
          </div>
        </div>

        <!-- 误读科普 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 三个最常见的标号误读
          </h2>
          <ul class="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">"5W-30 不是 5 到 30"：</span>W 前数字管低温（{{ W_GRADES[1].pumpTemp }}°C 泵送边界，对 5W 而言），后数字管高温（100°C 粘度区间）。它不是"粘度范围从 5 排到 30"，是两个温度点上的两项独立指标。</span>
            </li>
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">W 是 Winter 不是 Weight：</span>W 取自"冬季"（winter），表示这个数字属于低温等级，与"重量/厚度"无关。口语里说"W 前数字越小说明越稀"没错，但它的标准含义是低温泵送与冷启动能力的等级。</span>
            </li>
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">不是数字越大越保护：</span>油膜厚不等于保护强。粘度档要匹配发动机的油路、间隙与泵设计（如可变气门正时、液压挺柱对低粘度有硬要求），擅自升档会增大运转阻力、拉高油耗，严重时影响供油响应。选档的唯一权威是说明书。</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 右列：J300 对照表 + 选择引导 + 免责 -->
      <div class="space-y-6">
        <!-- J300 对照表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> SAE J300 粘度等级对照表
          </h2>

          <div class="overflow-x-auto">
            <p class="text-xs font-medium text-foreground mb-1.5">低温（冬级，W）等级</p>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">等级</th>
                  <th class="py-2 pr-3 font-medium">CCS 冷启动粘度上限</th>
                  <th class="py-2 pr-3 font-medium">低温泵送边界</th>
                  <th class="py-2 font-medium">100°C 粘度下限</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in wRows"
                  :key="row.w"
                  class="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  @click="pickW(row.w)"
                >
                  <td class="py-2 pr-3 font-semibold text-foreground">{{ row.w }}W</td>
                  <td class="py-2 pr-3 text-muted-foreground">{{ row.ccsMax.toLocaleString() }} mPa·s @ {{ row.ccsTemp }}°C</td>
                  <td class="py-2 pr-3 font-medium text-foreground">{{ row.pumpTemp }}°C</td>
                  <td class="py-2 text-muted-foreground">≥ {{ row.kvMin }} cSt</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="overflow-x-auto">
            <p class="text-xs font-medium text-foreground mb-1.5">高温（100°C）等级</p>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">等级</th>
                  <th class="py-2 pr-3 font-medium">100°C 运动粘度（cSt）</th>
                  <th class="py-2 font-medium">HTHS 下限（mPa·s @150°C）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in hRows"
                  :key="row.h"
                  class="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  @click="pickH(row.h)"
                >
                  <td class="py-2 pr-3 font-semibold text-foreground">{{ row.h }}</td>
                  <td class="py-2 pr-3 text-muted-foreground">{{ row.kvMin }} ~ &lt;{{ row.kvMax }}</td>
                  <td class="py-2 text-muted-foreground">{{ row.hthsNote }}</td>
                </tr>
              </tbody>
            </table>
            <p class="text-xs text-muted-foreground mt-2">
              点击任意行会把该档位与当前另一档位组合填入输入框（如已输入 5W-30 时点 0W 行 → 变为 0W-30）。
              较新的 SAE 8、12、16 超低粘度等级（部分新机型与混动使用）本表未收录，选型仍以说明书为准。
            </p>
          </div>
        </div>

        <!-- 选择引导 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ClipboardCheck class="w-5 h-5 mr-2 text-primary" /> 怎么选：按气候定 W 位，按车况定高温档
          </h2>

          <div class="space-y-3">
            <div class="p-3 rounded-lg bg-muted/50 border border-border">
              <p class="text-sm font-medium text-foreground mb-1">第一步：按冬季气温选 W 位</p>
              <p class="text-xs leading-relaxed text-muted-foreground">
                W 位是低温保险：对照上表"低温泵送边界"，比当地冬季极端低温再低一档是稳妥做法——
                严寒地区（东北、西北，冬季常态 -25°C 以下）一般看 0W / 5W；
                华北平原 5W / 10W 足够；华南冬季 10W 常见。这是常识性引导，具体以说明书标注为准。
              </p>
            </div>
            <div class="p-3 rounded-lg bg-muted/50 border border-border">
              <p class="text-sm font-medium text-foreground mb-1">第二步：按车况与手册定高温档</p>
              <p class="text-xs leading-relaxed text-muted-foreground">
                高温档以说明书为准：厂家验证过哪个档就用哪个档。
                高里程发动机内部间隙增大时，一些技师会在手册允许的粘度清单里建议取高一档高温位以降低烧机油与噪音——
                这是经验做法不是标准，且渗漏 / 烧机油应先修根源；带 GPF 颗粒捕捉器与混动车型的低粘度要求尤其不能随意升档。
              </p>
            </div>
          </div>

          <!-- 金句卡 -->
          <div class="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p class="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0" />
              一句话原则：以车辆说明书为准
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground mt-1.5">
              说明书标注的粘度是厂家对这台发动机验证过的结论；换档前先翻手册的"推荐粘度表"，
              而不是听"老车就得用稠油"的口口相传。说明书说 5W-30，就别因为"感觉"擅自换成 5W-40。
            </p>
          </div>
        </div>

        <!-- 免责 -->
        <div class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
            免责声明：本页解读 SAE J300 标准本身，不构成用油建议。机油选型以车辆说明书、厂家技术服务通报与机油产品认证（API / ACEA / 厂家认证码）为准。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>SAE J300 标号怎么读？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          SAE J300 是美国汽车工程师学会的发动机油粘度分类标准，市面上"0W-20""5W-40""15W-40"都由它定义。
          一个标号拆成两半看：<span class="text-foreground font-medium">W 前数字是低温等级</span>，
          由两项低温试验约束——CCS 冷启动模拟（保证低温下转得动）与 MRV 低温泵送（保证低温下泵得起来），
          0W 的泵送边界是 -40°C、5W 是 -35°C、10W 是 -30°C，数字越小冷启动与冷泵送能力越强；
          <span class="text-foreground font-medium">横杠后数字是高温等级</span>，约束 100°C 运动粘度区间
          （30 是 9.3~&lt;12.5 cSt，40 是 12.5~&lt;16.3 cSt）与 150°C 高温高剪切（HTHS）下限，
          数字越大高温油膜越厚。两组数字互不换算，靠粘度指数改进剂把两套要求合成一瓶多级油。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>什么场景用得上这张解读卡？</h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>换油保养前：看懂说明书与机油桶上的标号，明白自己买的是什么</li>
          <li>北方过冬：核对现用机油的 W 位能否覆盖当地极端低温</li>
          <li>网购机油比价：不同品牌同标号，J300 要求是一致的，再比认证与价格</li>
          <li>二手车接手：前任车主用油不明，重新确定该用的粘度档</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>如何使用本工具？</h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框敲标号，或点常用标号（0W-20、5W-30、15W-40 等）</li>
          <li>读解读卡：W 位看泵送边界与冷启动试验，高温位看 100°C 粘度区间与 HTHS 下限</li>
          <li>对照右侧 J300 全表，点任意行可快速填入对应档位</li>
          <li>非法标号会直接报错，并说明正确的档位清单</li>
          <li>结合"怎么选"卡按气候与车况核对，最终以车辆说明书为准</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>W 前数字和后数字，哪个更要紧？</h2>
        <p class="text-sm text-muted-foreground mb-6 leading-relaxed">
          都要紧，分工不同：北方用户先看 W 位（冬季打不着火多半是低温能力不够），
          高温档决定热机后的油膜厚度与油耗表现。多数误操作发生在高温档——"老车用稠油"的民间说法
          只在说明书允许的粘度清单内才有意义。两项都是厂家验证结论优先，本页负责把数字翻译成人话。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">5W-30 是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              W 前的 5 是低温等级：-35°C 下泵送粘度不超限（MRV），-30°C 下冷启动粘度不超过 6600 mPa·s（CCS）；
              横杠后的 30 是高温等级：100°C 运动粘度须落在 9.3~&lt;12.5 cSt，HTHS ≥ 2.9 mPa·s。
              它不是"从 5 稠到 30"，是两个温度上的两项独立指标。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">0W-20 和 5W-30 能互相替换吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不建议擅自替换。两者低温档和高温档都不同，0W-20 明显更稀。
              能不能换只看一件事：说明书是否同时把两个标号列入推荐粘度表（不少日系车允许 0W-20 / 5W-30 二选一，
              按气温选）。手册没列的，就别换。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">W 是什么缩写？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              W 是 Winter（冬季）的首字母，标示 W 前数字属于低温等级，与重量（Weight）无关。
              民间把 W 位叫"稀稠度"是口语习惯，标准含义是低温泵送与冷启动能力分级。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">老车是不是要用更稠的机油？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              只在说明书允许的粘度清单内成立。高里程发动机间隙增大，有些技师建议在允许清单里取高一档高温位，
              以缓解轻微烧机油与噪音；但根源性的渗漏与烧机油要靠维修解决，靠加稠只是遮掩。
              手册没允许的档位，不要自行升级。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">机油粘度越高越保护发动机吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不是。粘度档是为发动机的油路、间隙与泵设计匹配的：过稠会增大运转阻力、拉高油耗、
              影响可变气门正时与液压元件响应，冷启动时机油到达润滑点也更慢；过稀则高温油膜不足。
              匹配说明书才是真正的"保护"。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'oil-viscosity-guide'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Droplet, Wrench, BookOpen, Lightbulb, Table, ClipboardCheck,
  Info, AlertTriangle, CheckCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// SAE J300 发动机油粘度分类表。
// 来源：Chevron Marine "Viscosity Classifications" 技术简报 Table 1（SAE J300，转载全文），
// 与 Wikipedia SAE J300 词条表逐值互校一致；试验方法 ASTM D5293（CCS）/ D4684（MRV）/ D445（KV100）/ D4683（HTHS）。
// 注：现行 J300 对 0W/5W/10W 等冬级另按多级油执行 HTHS ≥ 1.7 下限，本表沿用简报原文不列冬级 HTHS 列。
const W_GRADES = [
  { w: 0, ccsMax: 6200, ccsTemp: -35, pumpTemp: -40, kvMin: 3.8 },
  { w: 5, ccsMax: 6600, ccsTemp: -30, pumpTemp: -35, kvMin: 3.8 },
  { w: 10, ccsMax: 7000, ccsTemp: -25, pumpTemp: -30, kvMin: 4.1 },
  { w: 15, ccsMax: 7000, ccsTemp: -20, pumpTemp: -25, kvMin: 5.6 },
  { w: 20, ccsMax: 9500, ccsTemp: -15, pumpTemp: -20, kvMin: 5.6 },
  { w: 25, ccsMax: 13000, ccsTemp: -10, pumpTemp: -15, kvMin: 9.3 }
]

const H_GRADES = [
  { h: 20, kvMin: 5.6, kvMax: 9.3, hthsNote: '≥ 2.6' },
  { h: 30, kvMin: 9.3, kvMax: 12.5, hthsNote: '≥ 2.9' },
  // J300 对 40 有两行：2.9 适用 0W-40 / 5W-40 / 10W-40；3.7 适用 15W-40 / 20W-40 / 25W-40 与单级 40
  { h: 40, kvMin: 12.5, kvMax: 16.3, hthsNote: '≥ 2.9（0W-40、5W-40、10W-40）/ ≥ 3.7（15W-40、20W-40、25W-40、40）' },
  { h: 50, kvMin: 16.3, kvMax: 21.9, hthsNote: '≥ 3.7' },
  { h: 60, kvMin: 21.9, kvMax: 26.1, hthsNote: '≥ 3.7' }
]

function lookupW(w) {
  return W_GRADES.find(g => g.w === Number(w)) || null
}

function lookupH(h) {
  return H_GRADES.find(g => g.h === Number(h)) || null
}

// 100°C 运动粘度 kv 是否落在档位区间：下界闭、上界开（标准写法 kvMin ~ <kvMax）
function kvInRange(h, kv) {
  const row = lookupH(h)
  const v = Number(kv)
  if (!row || !Number.isFinite(v)) return false
  return v >= row.kvMin && v < row.kvMax
}

// 标号解析：接受 "xW-yy" 多级油与 "yy" 单级油（大小写不敏感，须有横杠）。
// 返回 { ok, code, w, h, wRow, hRow, mono }；code: 'format' 格式错 / 'w' W 位非法 / 'h' 高温位非法
function parseGrade(text) {
  const s = String(text === null || text === undefined ? '' : text).trim().toUpperCase()
  const m = s.match(/^(\d{1,2})W-(\d{1,2})$/)
  if (m) {
    const w = Number(m[1])
    const h = Number(m[2])
    const wRow = lookupW(w)
    const hRow = lookupH(h)
    if (!wRow && !hRow) return { ok: false, code: 'both', w, h, wRow: null, hRow: null, mono: false }
    if (!wRow) return { ok: false, code: 'w', w, h, wRow: null, hRow, mono: false }
    if (!hRow) return { ok: false, code: 'h', w, h, wRow, hRow: null, mono: false }
    return { ok: true, code: null, w, h, wRow, hRow, mono: false }
  }
  const mono = s.match(/^(\d{1,2})$/)
  if (mono) {
    const h = Number(mono[1])
    const hRow = lookupH(h)
    if (!hRow) return { ok: false, code: 'h', w: null, h, wRow: null, hRow: null, mono: true }
    return { ok: true, code: null, w: null, h, wRow: null, hRow, mono: true }
  }
  return { ok: false, code: 'format', w: null, h: null, wRow: null, hRow: null, mono: false }
}

// 手算断言参考（开发期逐条在 node 中对已发布文件跑过，详见交付报告）：
//   parseGrade('5W-30') ok, w=5,h=30；'0W-20' ok；'10W-60' ok；'5w-30' 大小写不敏感 ok
//   parseGrade('40') ok 且 mono=true,h=40
//   parseGrade('15W40') 不 ok（缺横杠）；'W-30' 不 ok；'-5W-30' 不 ok；'abc' 不 ok（format）
//   parseGrade('7W-30') 不 ok code='w'；'5W-100' 不 ok code='h'；'5W-16' 不 ok code='h'（16 未收录）
//   lookupW(5).pumpTemp=-35；lookupW(0).pumpTemp=-40；lookupW(10).pumpTemp=-30；lookupW(25).pumpTemp=-15
//   lookupW(20).pumpTemp=-20 且 ccsTemp=-15 且 ccsMax=9500；lookupW(5).ccsMax=6600 且 ccsTemp=-30
//   lookupH(30): kvMin=9.3, kvMax=12.5；lookupH(40): 12.5/16.3；lookupH(20): 5.6/9.3
//   lookupH(50): 16.3/21.9；lookupH(60): 21.9/26.1
//   kvInRange(30,9.3)=true（下界闭）；kvInRange(30,12.5)=false（上界开）；kvInRange(30,10)=true；kvInRange(40,12.5)=true 且 kvInRange(40,16.3)=false
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '机油标号解读器 - SAE J300 粘度等级对照 | 有条工具',
  description: '在线机油标号解读工具：按 SAE J300 解读 5W-30 等标号，W 前数字看低温泵送边界（0W→-40°C、5W→-35°C），横杠后数字看 100°C 粘度区间与 HTHS 下限，附 J300 对照表、常见误读科普与按气候车况选择引导，纯本地计算。',
  keywords: '机油标号,5w30是什么意思,机油粘度等级,sae j300,0w20和5w30区别,机油选择,机油w是什么意思',
  author: '有条工具',
  ogTitle: '机油标号解读器（SAE J300）',
  ogDescription: '5W-30 每个数字什么意思：低温泵送边界 + 100°C 粘度区间对照解读',
  ogUrl: 'https://www.util.cn/tools/oil-viscosity-guide',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '机油标号解读器（SAE J300）',
  twitterDescription: 'J300 标号逐项解读 + 全表对照 + 误读科普，纯本地计算'
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
          name: '机油标号解读器（SAE J300）',
          url: 'https://www.util.cn/tools/oil-viscosity-guide',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'xW-yy 标号解析与非法标号报错',
            'W 位低温泵送边界与 CCS 冷启动试验解读',
            '高温档 100°C 运动粘度区间与 HTHS 下限解读',
            'SAE J300 低温 / 高温等级对照表',
            '"5W-30 不是 5 到 30" 等误读科普',
            '按气候与车况的选择引导（以说明书为准）'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '机油标号解读器', item: 'https://www.util.cn/tools/oil-viscosity-guide' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '5W-30 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: 'W 前的 5 是低温等级（-35°C 泵送边界、-30°C 冷启动粘度上限 6600 mPa·s），横杠后的 30 是高温等级（100°C 运动粘度 9.3~<12.5 cSt，HTHS ≥ 2.9）。两项是不同温度下的独立指标。' }
            },
            {
              '@type': 'Question',
              name: '0W-20 和 5W-30 能互相替换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议擅自替换，能不能换只看车辆说明书是否同时把两个标号列入推荐粘度表；手册没列的就别换。' }
            },
            {
              '@type': 'Question',
              name: '机油标号里的 W 是什么缩写？',
              acceptedAnswer: { '@type': 'Answer', text: 'W 是 Winter（冬季）的首字母，表示 W 前数字属于低温等级，与重量（Weight）无关。' }
            },
            {
              '@type': 'Question',
              name: '老车是不是要用更稠的机油？',
              acceptedAnswer: { '@type': 'Answer', text: '只在说明书允许的粘度清单内成立；高里程发动机可在允许清单内取高一档高温位，但渗漏与烧机油应先维修根源，手册没允许的档位不要自行升级。' }
            },
            {
              '@type': 'Question',
              name: '机油粘度越高越保护发动机吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。粘度要匹配发动机油路、间隙与泵设计；过稠增大阻力拉高油耗并影响 VVT 与液压元件响应，过稀则高温油膜不足，匹配说明书才是真正的保护。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'oil-viscosity-guide'
const SETTINGS_KEY = 'oil-viscosity-guide-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const gradeText = ref('5W-30')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const commonGrades = ['0W-20', '0W-30', '5W-20', '5W-30', '5W-40', '10W-30', '10W-40', '15W-40', '20W-50']

// ---------- 解析与解读 ----------
const parsed = computed(() => parseGrade(gradeText.value))

const parseError = computed(() => {
  const p = parsed.value
  if (!p || p.ok) return ''
  if (p.code === 'format') {
    return '格式不对：应为「xW-yy」样式（如 5W-30），W 前与横杠后都是 1~2 位数字；单级油可直接写数字（如 40）。注意 15W40 这种少了横杠的写法也是错的。'
  }
  if (p.code === 'w') {
    return 'W 前只有 0、5、10、15、20、25 这六档（SAE J300 低温等级），' + p.w + 'W 不是标准等级。'
  }
  if (p.code === 'both') {
    return 'W 前 ' + p.w + ' 与横杠后 ' + p.h + ' 都不在 J300 档位清单里：W 位只有 0/5/10/15/20/25，高温位常见 20/30/40/50/60。'
  }
  return '横杠后常见 20、30、40、50、60 这五档；8、12、16 等超低粘度是较新的等级，本表未收录，选型以说明书为准。'
})

// ---------- 对照表 ----------
const wRows = W_GRADES
const hRows = H_GRADES

function pickW(w) {
  const h = parsed.value && parsed.value.ok ? parsed.value.h : 30
  gradeText.value = w + 'W-' + h
}

function pickH(h) {
  const p = parsed.value
  if (p && p.ok && !p.mono) {
    gradeText.value = p.w + 'W-' + h
  } else {
    gradeText.value = String(h)
  }
}

// ---------- 设置持久化（localStorage，仅 onMounted/交互回调触达，SSR 安全） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (typeof s.gradeText === 'string' && s.gradeText.length <= 12) gradeText.value = s.gradeText
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch(gradeText, () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ gradeText: gradeText.value }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
