<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Layers class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">砂纸目数对照</h1>
          <p class="text-sm text-muted-foreground mt-1">P40-P3000 常见 24 档目数对照：平均粒径、典型工序与木工/金属/漆面三条工序走法</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线砂纸目数（P 制）对照表：覆盖 P40 到 P3000 共 {{ GRIT_DB.length }} 个常见档位，每档给出 FEPA 口径平均粒径（µm）与典型工序一句话；
        内置木工、金属除锈、漆面水磨三条推荐工序走法，附「相邻跳级不超过一倍」的渐进原则讲解与粒径反查小工具
        （输入 µm 求最近 P 档）。全部数据本地渲染，不上传任何数据。
      </p>
    </div>

    <!-- 免责与数据口径（显著位置） -->
    <div class="p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        <strong>本页粒径与工序推荐仅供线索参考，实际选用以实料（砂纸包装标注）、工艺要求与相关法规为准。</strong>
        粒径为 FEPA 标准口径的平均粒径，不同厂家/批次与植砂方式（开孔/闭孔涂层）会有实际手感差异；
        漆面与精密件打磨请按涂料厂商或工艺文件的工序要求执行。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧主列 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 工序线 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Route class="w-5 h-5 mr-2 text-primary" /> 三条工序线推荐走法
          </h2>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="l in PROCESS_LINES" :key="l.id"
              @click="lineId = l.id"
              :class="lineId === l.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >{{ l.name }}</button>
          </div>
          <div v-if="activeLine" class="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <template v-for="(step, si) in activeLine.steps" :key="step">
                <span class="px-2.5 py-1 rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">{{ step }}</span>
                <ChevronRight v-if="si < activeLine.steps.length - 1" class="w-4 h-4 text-muted-foreground" />
              </template>
              <span v-if="activeLine.finish" class="text-xs text-muted-foreground ml-1">→ {{ activeLine.finish }}</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ activeLine.note }}</p>
          </div>
        </div>

        <!-- 对照表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Layers class="w-5 h-5 mr-2 text-primary" /> P 目数对照表（FEPA 粒径口径）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground border-b border-border">
                  <th class="text-left py-2 pr-3 font-medium whitespace-nowrap">目数</th>
                  <th class="text-left py-2 pr-3 font-medium whitespace-nowrap">平均粒径</th>
                  <th class="text-left py-2 font-medium">典型工序</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="g in GRIT_DB" :key="g.id"
                  class="border-b border-border/50 last:border-0 transition-colors"
                  :class="isInActiveLine(g.id) ? 'bg-primary/10' : ''"
                >
                  <td class="py-2 pr-3 font-mono font-bold whitespace-nowrap" :class="isInActiveLine(g.id) ? 'text-primary' : 'text-foreground'">{{ g.id }}</td>
                  <td class="py-2 pr-3 font-mono text-foreground whitespace-nowrap">{{ fmtUm(g.um) }} µm</td>
                  <td class="py-2 text-muted-foreground">{{ g.task }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            高亮行 = 当前选中工序线用到或经过的档位；粒径为 FEPA 标准的平均粒径值，P240 是粗粒度/微粉粒度的分界档。
          </p>
        </div>

        <!-- 粒径反查 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 目数 vs 粒径反查
          </h2>
          <div class="flex flex-wrap items-center gap-3">
            <input
              v-model="umInput"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              spellcheck="false"
              placeholder="输入粒径，如 200 或 18.3"
              class="w-48 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
            <span class="text-sm text-muted-foreground">µm →</span>
            <span
              v-if="nearestResult"
              class="px-3 py-1.5 rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary whitespace-nowrap"
            >{{ nearestResult.id }}（{{ fmtUm(nearestResult.um) }} µm）</span>
            <span v-else-if="umInput.trim()" class="text-sm text-red-500 whitespace-nowrap">请输入有效的正数粒径</span>
            <span v-else class="text-sm text-muted-foreground">输入后显示最接近的 P 档</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            用途：量了旧砂纸粒径、看到磨料颗粒直径数据，或按涂层厚度倒推该用哪档砂纸时，取最近档即可；
            结果取粒径差最小的档（同距取更细一档），跳档打磨仍需遵守渐进原则。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- P 制讲解 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> P 制与"目数"是什么
          </h2>
          <div class="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p><span class="text-foreground font-medium">P 制 = FEPA 欧标编号</span>（对应 ISO 6344）：数字越大颗粒越细，本页每档的平均粒径都按该口径标注（如 P80≈201µm、P180≈82µm、P400≈35µm、P1000≈18.3µm）。</p>
            <p><span class="text-foreground font-medium">口语"目数" ≈ 每英寸筛网孔数</span>：筛网目数与 P 制在低段大体对应、高段差异加大（如 P3000 的"目数"各家口径不一），跨品牌采购时认包装上的 P 编号最稳。</p>
            <p><span class="text-foreground font-medium">粗/细分界在 P240</span>：P240 以上是"粗粒度"（Macrogrit），P240 起进入"微粉粒度"（Microgrit），两段的粒径定义方式不同，所以 P220（66µm）与 P240（58.5µm）只差一点。</p>
          </div>
          <NuxtLink to="/wiki/sandpaper-grit-chart" class="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            术语细节 → 砂纸目数与打磨工序词条
          </NuxtLink>
        </div>

        <!-- 跳级警示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TriangleAlert class="w-5 h-5 mr-2 text-primary" /> 跳级警示：相邻不超过一倍
          </h2>
          <div class="bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            每次换档，<span class="text-foreground font-medium">下一档号不要超过当前档的一倍</span>：
            P120 → P220（约 ×1.8）可以，P120 → P400 不行——更细的砂纸削不动粗磨留下的深划痕，只能把划痕边缘磨圆，
            漆一喷、光一照，粗痕全部现形（俗称"照妖镜"）。
          </div>
          <div class="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>木工：每档磨到上一档划痕均匀消失再换，方向交替 90° 便于看清残留。</p>
            <p>漆面水磨：档位更密（P400 → P600 → P800），一档一档走，配水防堵塞。</p>
            <p>重锈重漆：可以从 P40/P80 起步猛除料，但进入精磨段必须回到渐进节奏。</p>
          </div>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 相关工具
          </h2>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/tools/bolt-torque-table" class="text-primary hover:underline">螺栓拧紧扭矩对照</NuxtLink>
              <span class="text-muted-foreground text-xs"> — 车间/装配工况的扭矩速查，与打磨同属工程工具链</span>
            </li>
            <li>
              <NuxtLink to="/tools/obd-dtc-lookup" class="text-primary hover:underline">OBD故障码速查</NuxtLink>
              <span class="text-muted-foreground text-xs"> — 修车打磨后的故障码线索速查</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页粒径数值依据 FEPA/ISO 6344 标准口径整理，工序推荐为通用经验线索；
        实际打磨以砂纸实料包装标注、被加工件工艺要求与涂料厂商工序文件为准。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>砂纸目数对照指南</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          砂纸的"P 数字"（P40、P240、P3000……）来自欧洲磨料标准 FEPA（Federation of European Producers of Abrasives，
          对应 ISO 6344），它规定的不只是"颗粒多大"，而是<span class="text-foreground font-medium">粒度分布的三个控制点</span>：
          允许最粗颗粒、名义粒径与允许最细颗粒都设上限——所以两包都印着 P240 的砂纸，手感可以不一致但都不得超过标准上限。
          本页按 FEPA 口径给出 P40-P3000 共 {{ GRIT_DB.length }} 档的平均粒径与典型工序，并给出三条工序线的推荐走法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">P 制与目数（筛网目）是什么关系</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          国内口语说的"目数"来自筛网：每英寸长度上有多少个孔，就能漏下多大的颗粒，数字越大颗粒越细，方向与 P 制一致。
          但两者口径不同：目数是"筛网几何"，P 制是"磨料粒度分布"，在 P240 以上的微粉段差异明显加大——
          P1200 这类微粉已经不靠筛网分级，而是沉淀/水力分级。所以<span class="text-foreground font-medium">低段（P40-P220）可以把 P 数字近似当目数看，
          高段请直接认 P 编号</span>。JIS（日标）还有一套 J 编号（#240、#1000…），同号粒径与 P 制也有差别，跨标准对比时以粒径 µm 为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">水磨与干磨怎么选</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          看磨料与粘结剂：碳化硅（黑/绿色砂）+ 树脂或乳胶纸底的是"水砂纸"，能泡水，适合漆面、腻子、金属精磨的水磨——
          水把磨屑冲走，防堵塞、划痕细、粉尘小；氧化铝/石榴石（棕黄色砂）是干砂，遇水会掉砂或发软，适合木工与金属粗磨的干磨。
          水磨小技巧：水勤换（磨屑水是划痕元凶）、海绵块压平手劲、磨完擦干防锈；
          木工干磨则要用尘袋或吸尘器，木粉堆积会磨热表面并糊住砂纸。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">砂纸堵塞（发亮打滑）怎么办</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          堵塞是磨屑把砂粒间隙糊死，砂纸表面发亮、磨削力骤降——<span class="text-foreground font-medium">继续磨等于在"抛光"而不是磨削</span>，
          还会把工件磨热。处理方法：轻堵用钢丝刷/专用砂纸梳顺纹路刷掉磨屑；软磨屑（漆面、木脂）用橡胶清洁块搓；
          堵得发亮就直接换新纸，别心疼。预防端有三招：选<span class="text-foreground font-medium">开放涂层（open coat）</span>砂纸——砂粒覆盖率约七成，
          间隙大不易糊；软材质配大间隙磨料；水磨加水冲屑。另一个常被忽略的参数是植砂密度：
          闭孔涂层（closed coat）覆盖率高、切削快但易堵，适合硬材质；开孔涂层适合软材质与漆面，寿命长、发热少。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">渐进原则：相邻不超过一倍</h3>
        <p class="text-sm text-muted-foreground mb-4">
          打磨的本质是"用更细的划痕覆盖上一档的粗划痕"。每档砂纸留下的划痕深度与其粒径同量级，
          跳级超过一倍时，细砂削不动粗划痕的谷底，只能把谷的边缘磨圆，划痕仍在——上漆或抛光后全部现形。
          经验节奏：粗磨段可以每两档一跳（P80 → P120 → P180），精磨段（P240 以上）逐档走，漆面水磨逐档走并配合水。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">P240 和 240 目是一回事吗？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              不是同一套标准但低段大致对应。P 制是 FEPA/ISO 6344 的磨料粒度分布标准，"目"是筛网孔数口径；
              P240 以下可以近似互认，P240 以上的微粉段（P400/P800/P1200…）两套口径差异加大，且日标 JIS 又是第三套，
              对比时认平均粒径 µm 最可靠（如 P400≈35µm、P1000≈18.3µm）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">水磨和干磨怎么选？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              水砂纸（碳化硅+防水底）用于漆面、腻子与金属精磨的水磨，水冲走磨屑防堵塞、划痕更细；
              氧化铝干砂用于木工与金属粗磨的干磨，遇水会损坏。判断方法：包装标注" waterproof/dry "，
              或看磨料颜色与纸底——不确定时漆面一律水磨，木工一律干磨。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">砂纸磨一会儿就发亮不切削了怎么办？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              这是磨屑堵塞：轻堵用砂纸梳或钢丝刷清理，软磨屑用橡胶块搓，发亮就换新纸——继续磨等于抛光。
              预防：软材质与漆面选开放涂层（open coat）砂纸，水磨加水冲屑，手劲放轻多走几遍。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">能不能从 P120 直接跳 P400 省时间？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              不建议。跳级超过一倍时，细砂纸削不动粗划痕谷底，只能磨圆边缘，深划痕全部残留，
              喷漆后光线一照全部现形。渐进原则是相邻档号不超过一倍（P120→P220 可以）；
              省时间的正确做法是把粗磨段做扎实，而不是在精磨段跳档。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sandpaper-grit'" :category="'others'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Layers, Search, Route, Info, BookOpen, TriangleAlert, ChevronUp, ChevronDown, ChevronRight
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

/* ===== 纯函数区开始（node 单测直接复用本段，勿混入 Vue 响应式或浏览器 API） ===== */

interface Grit {
  id: string   // P 编号，如 P240
  um: number   // FEPA 口径平均粒径（µm）
  task: string // 典型工序一句话
}

// FEPA/ISO 6344 平均粒径口径（粗粒度 P12-P220 与微粉 P240-P3000 两段）
const GRIT_DB: Grit[] = [
  { id: 'P40',   um: 425,  task: '重度除料起步：铲旧漆、除厚锈、木料大面找平' },
  { id: 'P50',   um: 336,  task: '粗磨旧漆层与焊缝整平' },
  { id: 'P60',   um: 269,  task: '木料粗磨找平、金属厚锈去除' },
  { id: 'P70',   um: 213,  task: '粗磨过渡：除料收尾' },
  { id: 'P80',   um: 201,  task: '木工初磨去毛刺、金属除锈主力档' },
  { id: 'P100',  um: 162,  task: '粗磨收尾、接痕找平' },
  { id: 'P120',  um: 125,  task: '木工中间过渡磨' },
  { id: 'P150',  um: 100,  task: '过渡磨：细化粗磨划痕' },
  { id: 'P180',  um: 82,   task: '木工精磨前过渡、腻子底漆前打磨' },
  { id: 'P220',  um: 66,   task: '木工精磨收尾、漆前最后干磨' },
  { id: 'P240',  um: 58.5, task: '腻子水磨起步、金属细磨（粗粒度/微粉分界档）' },
  { id: 'P280',  um: 52.2, task: '细磨过渡、中涂前处理' },
  { id: 'P320',  um: 46.2, task: '腻子收尾水磨、中涂打磨' },
  { id: 'P360',  um: 40.5, task: '细磨：为喷漆打底' },
  { id: 'P400',  um: 35,   task: '喷漆前水磨起步、面漆间层水磨' },
  { id: 'P500',  um: 30.2, task: '面漆间层水磨' },
  { id: 'P600',  um: 25.8, task: '面漆间层水磨、塑料件精磨' },
  { id: 'P800',  um: 21.8, task: '清漆间层水磨主力档' },
  { id: 'P1000', um: 18.3, task: '清漆水磨收尾、橘皮/流挂处理' },
  { id: 'P1200', um: 15.3, task: '精细水磨：抛光前处理' },
  { id: 'P1500', um: 12.6, task: '抛光前水磨' },
  { id: 'P2000', um: 10.3, task: '镜面抛光前细磨' },
  { id: 'P2500', um: 8.4,  task: '抛光收尾磨：配合研磨剂' },
  { id: 'P3000', um: 6.5,  task: '镜面处理起步：配合抛光机与精抛剂' }
]

// 三条工序线推荐走法（steps 引用的档位必须存在于 GRIT_DB）
interface ProcessLine {
  id: 'wood' | 'metal' | 'paint'
  name: string
  steps: string[]
  finish: string
  note: string
}

const PROCESS_LINES: ProcessLine[] = [
  {
    id: 'wood', name: '木工',
    steps: ['P80', 'P120', 'P180', 'P220'],
    finish: '白坯收尾（可加 P240）',
    note: '顺纹磨、每档磨到上一档划痕均匀消失再换档，方向交替 90° 便于检查残留；P80 除料/去毛刺起，P220 收尾后即可上底漆。硬木可从 P120 起步，松木等软木 P80 起更省力。'
  },
  {
    id: 'metal', name: '金属除锈',
    steps: ['P80', 'P120', 'P240', 'P400'],
    finish: '细磨后防锈处理',
    note: '厚锈从 P40/P80 起步猛除料，P120 过渡后 P240/P400 收细；除锈到底材发亮即可，不要过度磨削；收尾后立即擦净做防锈（底漆/防锈油），裸钢暴露越久返锈越快。'
  },
  {
    id: 'paint', name: '漆面水磨',
    steps: ['P400', 'P600', 'P800', 'P1000', 'P1200', 'P1500', 'P2000', 'P2500', 'P3000'],
    finish: '抛光机还原镜面',
    note: '逐档走、全程配水防堵塞：P400-P800 处理腻子与中涂，P1000-P1500 处理清漆橘皮，P2000 以上配合研磨剂交抛光机。水勤换，磨屑水是划痕元凶。'
  }
]

// 锚点自检（FEPA 口径核对点）
const GRIT_ANCHORS: { id: string; um: number }[] = [
  { id: 'P80', um: 201 },
  { id: 'P180', um: 82 },
  { id: 'P400', um: 35 },
  { id: 'P1000', um: 18.3 }
]

// 粒径 → 最近 P 档（同距取更细一档；输入非法或 <=0 返回 null）
function nearestGrit(umInput: number): Grit | null {
  if (!Number.isFinite(umInput) || umInput <= 0) return null
  let best: Grit | null = null
  let bestDiff = Infinity
  for (const g of GRIT_DB) {
    const diff = Math.abs(umInput - g.um)
    if (diff < bestDiff || (diff === bestDiff && best && g.um < best.um)) {
      best = g
      bestDiff = diff
    }
  }
  return best
}

// µm 显示格式：整数不带小数，小数保留 1 位（无浮点尾差）
function fmtUm(um: number): string {
  return Number.isInteger(um) ? String(um) : um.toFixed(1)
}

// 数据完整性自检（供交付报告引用）
function gritHealthCheck() {
  const ums = GRIT_DB.map(g => g.um)
  const ids = GRIT_DB.map(g => g.id)
  const lineIds = PROCESS_LINES.flatMap(l => l.steps)
  return {
    total: GRIT_DB.length,
    bad: GRIT_DB.filter(g => !(/^P\d{2,4}$/.test(g.id) && g.um > 0 && g.task)).map(g => g.id),
    monotonicDecreasing: ums.every((v, i) => i === 0 || ums[i - 1] > v),
    dup: ids.filter((c, i) => ids.indexOf(c) !== i),
    anchorsOk: GRIT_ANCHORS.every(a => {
      const g = GRIT_DB.find(x => x.id === a.id)
      return !!g && Math.abs(g.um - a.um) < 0.05
    }),
    linesComplete: PROCESS_LINES.every(l => l.steps.length >= 2 && l.steps.every(s => ids.includes(s))),
    lineStepsDefined: lineIds.every(s => ids.includes(s))
  }
}
/* ===== 纯函数区结束 ===== */

// ---------- SEO ----------
useSeoMeta({
  title: '砂纸目数对照表 - P40-P3000 粒径与工序选择速查',
  description: `在线砂纸目数（P 制）对照表：${GRIT_DB.length} 档常见 P 目数（P40-P3000）的 FEPA 平均粒径（µm）与典型工序，木工/金属除锈/漆面水磨三条工序线推荐走法，相邻跳级不超过一倍的渐进原则讲解，粒径 µm 反查最近 P 档小工具，纯本地运行。`,
  keywords: '砂纸目数对照表,p80,p240,p400,p1000,砂纸粒径,目数对照,打磨工序,sandpaper grit chart,水磨干磨',
  author: '有条工具',
  ogTitle: '砂纸目数对照表 - 粒径、工序与三条工序线 | 有条工具',
  ogDescription: 'P40-P3000 常见 24 档目数对照：FEPA 粒径、典型工序、木工/金属/漆面工序线与粒径反查。',
  ogUrl: 'https://www.util.cn/tools/sandpaper-grit',
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
          name: '砂纸目数对照',
          url: 'https://www.util.cn/tools/sandpaper-grit',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            `${GRIT_DB.length} 档常见 P 目数（P40-P3000）FEPA 平均粒径对照`,
            '每档典型工序一句话',
            '木工/金属除锈/漆面水磨三条工序线推荐走法',
            '相邻跳级不超过一倍的渐进原则讲解',
            '粒径 µm 反查最近 P 档小工具',
            'P 制与目数、水磨干磨、堵塞处理知识',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '砂纸目数对照', item: 'https://www.util.cn/tools/sandpaper-grit/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'P240 和 240 目是一回事吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是同一套标准但低段大致对应。P 制是 FEPA/ISO 6344 的磨料粒度分布标准，"目"是筛网孔数口径；P240 以下可近似互认，P240 以上的微粉段（P400/P800/P1200 等）差异加大，日标 JIS 又是第三套口径。跨标准对比以平均粒径 µm 为准，如 P400≈35µm、P1000≈18.3µm。' }
            },
            {
              '@type': 'Question',
              name: '水磨和干磨怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '水砂纸（碳化硅磨料+防水底材）用于漆面、腻子与金属精磨的水磨，水冲走磨屑防堵塞、划痕更细；氧化铝干砂用于木工与金属粗磨的干磨，遇水会损坏。漆面一律水磨，木工一律干磨，不确定时看包装 waterproof 标注。' }
            },
            {
              '@type': 'Question',
              name: '砂纸磨一会儿就发亮不切削了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '这是磨屑堵塞：轻堵用砂纸梳或钢丝刷清理，软磨屑用橡胶清洁块搓，发亮就换新纸，继续磨等于抛光不是磨削。预防选开放涂层（open coat）砂纸，软材质与漆面尤其合适；水磨加水冲屑，手劲放轻多走几遍。' }
            },
            {
              '@type': 'Question',
              name: '能不能从 P120 直接跳 P400 省时间？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议。跳级超过一倍时细砂纸削不动粗划痕谷底，只能磨圆边缘，深划痕残留，喷漆后光线一照全部现形。渐进原则是相邻档号不超过一倍（P120 到 P220 约一点八倍可以），省时间的正确做法是把粗磨段做扎实，而不是在精磨段跳档。' }
            }
          ]
        }
      ]
    })
  }]
})

const STORAGE_KEY = 'sandpaper-grit:state'

onMounted(() => {
  addRecentTool('sandpaper-grit')
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        if (typeof saved.lineId === 'string' && PROCESS_LINES.some(l => l.id === saved.lineId)) lineId.value = saved.lineId as ProcessLine['id']
      }
    }
  } catch {
    // 本地存储不可用或内容损坏时忽略，使用默认值
  }
  watch(
    lineId,
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ lineId: lineId.value }))
      } catch {
        // 忽略写入失败（隐私模式等）
      }
    }
  )
})

// ---------- 交互状态 ----------
const lineId = ref<'wood' | 'metal' | 'paint'>('wood')
const umInput = ref('')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const activeLine = computed<ProcessLine | null>(() => PROCESS_LINES.find(l => l.id === lineId.value) || null)

function isInActiveLine(id: string): boolean {
  const line = activeLine.value
  return !!line && line.steps.includes(id)
}

// 粒径反查结果（守卫非法输入）
const nearestResult = computed<Grit | null>(() => {
  const v = Number(umInput.value.trim())
  if (!umInput.value.trim() || Number.isNaN(v)) return null
  return nearestGrit(v)
})
</script>
