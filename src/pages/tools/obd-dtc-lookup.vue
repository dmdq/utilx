<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Search class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">OBD故障码速查</h1>
          <p class="text-sm text-muted-foreground mt-1">常见 OBD-II P0xxx 标准故障码速查：含义、常见原因与严重度分档，仅供线索参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 OBD-II 故障码查询表：内置 {{ DTC_DB.length }} 个最常见 P0 标准码（空气流量/进气温度/水温/节气门/氧传感器等燃油空气计量系列、
        P0300-P0305 失火系列、爆震与曲轴/凸轮轴位置、EGR 与 EVAP 排放系列、P0420/P0430 催化效率、车速/怠速/系统电压、
        P0700 起的变速箱通用码），每条给出系统分类、一句话含义、常见原因 2-3 条与「可观察 / 尽快检修 / 立即停车」三档严重度提示，
        附故障码结构讲解（P=动力系统、0=标准码、数字位子系统口径）。支持码号与关键词检索，全部数据本地渲染，不上传任何数据。
      </p>
    </div>

    <!-- 免责与数据口径（显著位置） -->
    <div class="p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        <strong>本页释义与常见原因仅供线索参考，诊断与维修以实车为准。</strong>
        同一故障码在不同品牌、车型、年款上的触发条件与真实原因可能完全不同；P1/P2 开头的厂商自定义码与多数 P07xx 之后的变速箱码
        请务必查对应车型原厂资料。故障灯亮起不代表必须立即停车，也不代表可以继续硬开——按严重度分档判断并尽快用读码器确认实车故障码。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧主列 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 搜索 + 分类过滤 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 故障码检索
          </h2>
          <input
            v-model="query"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="输入码号或关键词，如 P0171、0300、氧传感器、失火、EVAP、变速箱"
            class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="c in CATS" :key="c.id"
              @click="catFilter = c.id"
              :class="catFilter === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >{{ c.name }}<span v-if="c.id !== 'all'" class="ml-1 text-[10px] opacity-70">{{ countByCat(c.id) }}</span></button>
          </div>
          <!-- 码列表 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            <button
              v-for="d in filteredDtcs" :key="d.code"
              @click="selectDtc(d.code)"
              class="text-left px-3 py-2 rounded-lg border transition-all"
              :class="selectedCode === d.code ? 'border-primary bg-primary/10' : 'border-border bg-muted/50 hover:bg-muted'"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="font-mono font-bold text-sm" :class="selectedCode === d.code ? 'text-primary' : 'text-foreground'">{{ d.code }}</p>
                <span class="px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap" :class="sevBadgeCls(d.severity)">{{ d.severity }}</span>
              </div>
              <p class="text-[11px] text-muted-foreground mt-0.5 leading-tight">{{ d.meaning }}</p>
            </button>
            <p v-if="!filteredDtcs.length" class="col-span-full text-sm text-muted-foreground py-4 text-center">
              没有匹配「{{ query }}」的故障码，试试更短的关键词（本页只收录常见 P0 标准码，厂商码请查原厂资料）。
            </p>
          </div>
        </div>

        <!-- 详情卡 -->
        <div v-if="selectedDtc" class="bg-card border border-border rounded-lg p-6 space-y-5">
          <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-2xl font-bold font-mono text-foreground">{{ selectedDtc.code }}</h2>
                <span class="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{{ catLabel(selectedDtc.cat) }}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-medium" :class="sevBadgeCls(selectedDtc.severity)">{{ selectedDtc.severity }}</span>
              </div>
              <p class="text-sm text-foreground mt-2 leading-relaxed">{{ selectedDtc.meaning }}</p>
            </div>
            <NuxtLink to="/tools/headlight-bulb" class="text-xs text-primary hover:underline whitespace-nowrap mt-1">
              修好之后年检要查灯光？→ 车灯型号对照
            </NuxtLink>
          </div>

          <!-- 常见原因 -->
          <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
            <p class="text-sm font-medium text-foreground">常见原因（线索方向，非确诊结论）</p>
            <div v-for="(c, ci) in selectedDtc.causes" :key="ci" class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p class="text-xs text-muted-foreground leading-relaxed">{{ c }}</p>
            </div>
          </div>

          <!-- 严重度建议 -->
          <div class="rounded-lg border p-4" :class="sevBoxCls(selectedDtc.severity)">
            <p class="text-sm font-semibold mb-1" :class="sevTextCls(selectedDtc.severity)">严重度：{{ selectedDtc.severity }}</p>
            <p class="text-xs leading-relaxed text-muted-foreground">{{ sevAdvice(selectedDtc.severity) }}</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 码结构讲解 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 故障码结构讲解
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            OBD-II 故障码 = 1 位字母 + 4 位字符，以 <span class="font-mono text-foreground">P0171</span> 为例逐位拆解：
          </p>
          <div class="bg-muted/50 border border-border rounded-lg p-3 space-y-2 text-xs leading-relaxed">
            <p><span class="font-mono font-bold text-primary text-base">P</span>　系统：<span class="text-foreground">P=动力系统</span>（发动机/变速箱）；B=车身、C=底盘、U=网络通讯。</p>
            <p><span class="font-mono font-bold text-primary text-base">0</span>　属性：<span class="text-foreground">0=SAE/ISO 统一标准码</span>；1、2=厂商自定义码（必须查原厂资料，本页不收录）。</p>
            <p><span class="font-mono font-bold text-primary text-base">1</span>　子系统（数字位第 1 位）：燃油空气计量（2=喷油器电路、3=点火/失火、4=辅助排放 EGR/EVAP/催化、5=车速/怠速、6=电脑输出、7=变速箱）。</p>
            <p><span class="font-mono font-bold text-primary text-base">71</span>　具体编号：本例为「燃油系统过稀（第一列缸组）」。</p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            记住这个骨架就能"望码生义"：P0171 与 P0174 是同一件事发生在两个缸组，P0300 是"随机多缸失火"、P0301 是"具体哪一缸在失火"。
          </p>
        </div>

        <!-- 严重度分档说明 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 严重度三档怎么看
          </h2>
          <div class="space-y-2 text-xs leading-relaxed">
            <div class="flex items-start gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap" :class="sevBadgeCls('可观察')">可观察</span>
              <p class="text-muted-foreground">不影响行车安全：油耗可能略升、年检排放可能不过，找方便的时间检修即可。</p>
            </div>
            <div class="flex items-start gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap" :class="sevBadgeCls('尽快检修')">尽快检修</span>
              <p class="text-muted-foreground">短期可谨慎行驶，但持续开可能加重损伤或半路趴窝：几天内安排检修。</p>
            </div>
            <div class="flex items-start gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap" :class="sevBadgeCls('立即停车')">立即停车</span>
              <p class="text-muted-foreground">有烧催化器或行驶中失去动力的风险：灯闪/剧烈抖动/异响时立即靠边停车，呼叫救援。</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            分档为通用口径：实际风险取决于具体车型与故障真实原因，最终以实车诊断为准。
          </p>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 相关工具
          </h2>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/tools/headlight-bulb" class="text-primary hover:underline">车灯型号对照</NuxtLink>
              <span class="text-muted-foreground text-xs"> — H 系/900 系灯泡型号、灯座与功率速查</span>
            </li>
            <li>
              <NuxtLink to="/tools/tire-pressure-convert" class="text-primary hover:underline">胎压换算</NuxtLink>
              <span class="text-muted-foreground text-xs"> — psi/bar/kPa 胎压冷热换算与年检参考</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页收录的是 SAE 统一标准口径的常见 P0 码释义与经验性常见原因，仅供线索参考；
        诊断与维修请以实车故障码（含厂商自定义码）、原厂维修手册与实际检测结果为准。涉及故障灯闪烁、明显失火、水温报警等情形请立即停车处置。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>OBD 故障码速查指南</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          OBD-II（On-Board Diagnostics 第二代）是 1996 年起在美国强制、随后在全球普及的车载自诊断标准：
          ECU 持续监控传感器与执行器，发现信号越界就把对应的故障码（DTC）存进存储器并点亮仪表上的故障灯（MIL，发动机形状图标）。
          本页按 SAE J2012 统一标准口径整理了 {{ DTC_DB.length }} 个最高频的 P0 标准码，覆盖燃油空气计量、点火失火、
          排放控制、车速怠速与变速箱五大系统，支持检索与分类浏览。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">故障灯为什么亮</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          故障灯亮起只说明一件事：<span class="text-foreground font-medium">ECU 在某个监控项上看到了"不合理"</span>——可能是传感器本身坏了，
          也可能是传感器忠实报告了一个真实故障（比如真空漏气让氧传感器长期报稀）。所以亮灯 ≠ 坏了某个零件，读码只是拿到线索：
          先读码记下冻结帧（故障发生瞬间的转速、水温、负荷等快照），再按线索做检查。断电瓶、拔插头这类"清码仪式"只会把线索和冻结帧一起抹掉。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">清码不等于修好</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          清除故障码只是删掉了记录，故障条件还在就会重新触发——很多码（尤其 EVAP 泄漏类）要连续多个驾驶循环不复发才会自动熄灯，
          所以"清完灯灭了"既可能是修好了，也可能是 ECU 还没攒够证据。正确的闭环是：读码 → 记录冻结帧 → 检修 → 清码 →
          按该车型的驾驶循环验证不再复现。另外清码会把 readiness 就绪状态清零，<span class="text-foreground font-medium">年检前急着清码会导致排放检测项"未就绪"而无法通过</span>。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">闪码与常码的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          常亮（steady）说明存在已确认的故障，系统进入保护或降级运行，尽快检修即可；
          <span class="text-foreground font-medium">闪烁（flashing）是"催化剂损坏级失火"的报警</span>——ECU 检测到失火率足以让未燃混合气进三元催化器燃烧，
          持续行驶会把催化器烧穿（千元的维修变万元的维修）。灯闪时正确做法是立即松油门降速，仍闪就靠边停车，不要再高速巡航。
          本页把失火类码（P0300-P0305）与曲轴位置码（P0335）列为「立即停车」档，就是这个原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">读码器的 CAN 口径</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          OBD-II 只规定了诊断接口（SAE J1962 16 针梯形口）与协议族，读码器与车的对话方式有五档：K 线（ISO 9141-2）、
          KWP2000（ISO 14230）、J1850 PWM/VPW（美系老车），以及 2008 年起在北美新车上强制统一、如今已是绝对主流的
          <span class="text-foreground font-medium">CAN（ISO 15765-4，500kbps/11 位或 29 位 ID）</span>。
          买读码器认准"支持 CAN"基本不会踩坑；但老车（2004 年前欧系/2008 年前美系）可能需要支持多协议的机器，纯 CAN 读码器连不上老车不是车坏了。
          另外读码器读到的是"排放相关"标准码，完整诊断（含厂商码、数据流、动作测试）要用支持对应车型的专业软件。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">故障灯亮了还能继续开吗？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              先看灯的状态再看症状：灯常亮且车无异常（不抖、不响、水温正常），通常是排放类故障，可谨慎短途行驶并尽快读码；
              灯闪烁、伴随明显抖动/异响/水温报警，说明存在失火或严重故障，应立即靠边停车呼叫救援。
              用本页查到码后按「可观察/尽快检修/立即停车」三档参考判断，最终以实车诊断为准。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么清码后故障灯过几天又亮了？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              清码只是删除记录，故障条件仍在。很多监控项（如 EVAP 泄漏、催化效率）需要跨多个驾驶循环采样，
              条件再触发就再次亮灯——这说明故障真实存在，请按码检修。反过来，修好后灯自动熄灭也需要同样的采样周期，不必反复清码"催它"。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">故障灯闪烁和常亮有什么区别？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              常亮 = 已确认故障，系统记录故障码并可能进入降级模式，尽快检修；闪烁 = 催化剂损坏级失火正在发生，
              未燃汽油正在进三元催化器里燃烧，继续高速行驶会烧毁催化器。灯闪时松油门降速，仍不熄就立即停车。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">我的老车连不上读码器，是 CAN 口径的问题吗？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              有可能。CAN（ISO 15765-4）是 2008 年后美系新车的强制口径，如今的主流；但 2004 年前的欧系车多用 K 线或 KWP2000，
              部分美系老车用 J1850。纯 CAN 读码器连老车会"插上没反应"，不是车坏了，需要支持多协议的读码器。
              连上后若读到 P1xxx 开头的码，那是厂商自定义码，请查该车型原厂资料，本页的标准码释义不适用。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'obd-dtc-lookup'" :category="'others'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Search, Info, CheckCircle, TriangleAlert, ChevronUp, ChevronDown, BookOpen
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

/* ===== 纯函数区开始（node 单测直接复用本段，勿混入 Vue 响应式或浏览器 API） ===== */

// 严重度三档（枚举口径固定，测试校验合法性）
type Sev = '可观察' | '尽快检修' | '立即停车'

// 系统分类（码结构数字位口径）
type Cat = 'fuelair' | 'ignition' | 'emission' | 'speed' | 'trans'

interface Dtc {
  code: string          // 码号，如 P0171
  cat: Cat              // 系统分类
  meaning: string       // 一句话含义
  causes: string[]      // 常见原因 2-3 条
  severity: Sev         // 严重度三档
  kw: string[]          // 检索关键词（含英文别名）
}

const CATS: { id: 'all' | Cat; name: string }[] = [
  { id: 'all', name: '全部' },
  { id: 'fuelair', name: '燃油/空气计量' },
  { id: 'ignition', name: '点火与失火' },
  { id: 'emission', name: '排放控制' },
  { id: 'speed', name: '车速/怠速/电压' },
  { id: 'trans', name: '变速箱' }
]

// 常见 P0 标准码数据（SAE J2012 统一口径 + 通用维修经验常见原因）
const DTC_DB: Dtc[] = [
  // ===== 燃油/空气计量（P0100-P0230）=====
  {
    code: 'P0100', cat: 'fuelair',
    meaning: '空气流量(MAF)传感器电路故障：ECU 收不到进气量信号',
    causes: ['MAF 插头松脱或线束破损', 'MAF 热丝脏污或内部损坏', 'MAF 供电保险丝熔断'],
    severity: '尽快检修', kw: ['maf', '空气流量计', '进气量']
  },
  {
    code: 'P0101', cat: 'fuelair',
    meaning: 'MAF 信号范围/性能：进气量信号与节气门开度、转速不匹配',
    causes: ['MAF 热丝脏污（劣质空滤、油气）', '进气道漏气', 'MAF 安装不严或老化漂移'],
    severity: '尽快检修', kw: ['maf', '空气流量', '范围性能']
  },
  {
    code: 'P0102', cat: 'fuelair',
    meaning: 'MAF 信号低输入：信号电压/频率低于预期下限',
    causes: ['信号线接触不良或对地短路', 'MAF 脏污或老化', '插头针脚腐蚀'],
    severity: '尽快检修', kw: ['maf', '低输入']
  },
  {
    code: 'P0103', cat: 'fuelair',
    meaning: 'MAF 信号高输入：信号电压/频率高于预期上限',
    causes: ['信号线对电源短路', 'MAF 内部故障', '改装进气改变了流场'],
    severity: '尽快检修', kw: ['maf', '高输入']
  },
  {
    code: 'P0105', cat: 'fuelair',
    meaning: '歧管绝对压力(MAP)传感器电路故障',
    causes: ['MAP 真空管脱落或裂损', '插头接触不良', 'MAP 传感器损坏'],
    severity: '尽快检修', kw: ['map', '歧管压力', '真空']
  },
  {
    code: 'P0106', cat: 'fuelair',
    meaning: 'MAP 信号范围/性能：压力信号与节气门、转速状态不符',
    causes: ['真空管泄漏', '节气门积碳导致怠速异常', 'MAP 漂移失准'],
    severity: '尽快检修', kw: ['map', '歧管压力']
  },
  {
    code: 'P0110', cat: 'fuelair',
    meaning: '进气温度(IAT)传感器电路故障',
    causes: ['IAT 插头松脱', '传感器断路或短路', '线束破损'],
    severity: '尽快检修', kw: ['iat', '进气温度']
  },
  {
    code: 'P0112', cat: 'fuelair',
    meaning: '进气温度传感器电路低输入：信号电压低于下限',
    causes: ['信号线对地短路', '传感器内部短路', '插头针脚搭接'],
    severity: '尽快检修', kw: ['iat', '进气温度', '低输入']
  },
  {
    code: 'P0113', cat: 'fuelair',
    meaning: '进气温度传感器电路高输入：信号电压超过上限，多为断路',
    causes: ['传感器内部断路', '插头松脱', '信号线断路'],
    severity: '尽快检修', kw: ['iat', '进气温度', '高输入']
  },
  {
    code: 'P0115', cat: 'fuelair',
    meaning: '发动机冷却液温度(ECT)传感器电路故障',
    causes: ['ECT 插头松脱或腐蚀', '传感器损坏', '线束断路或短路'],
    severity: '尽快检修', kw: ['ect', '水温传感器', '冷却液温度']
  },
  {
    code: 'P0116', cat: 'fuelair',
    meaning: '水温信号范围/性能：升温曲线不合理（如冷启动长时间不升温）',
    causes: ['节温器常开或常闭', 'ECT 漂移失准', '冷却液液位偏低'],
    severity: '尽快检修', kw: ['ect', '水温', '节温器']
  },
  {
    code: 'P0117', cat: 'fuelair',
    meaning: '水温传感器电路低输入：信号电压低于下限',
    causes: ['信号线对地短路', '传感器内部短路', '插头针脚搭接'],
    severity: '尽快检修', kw: ['ect', '水温', '低输入']
  },
  {
    code: 'P0118', cat: 'fuelair',
    meaning: '水温传感器电路高输入：信号电压超过上限，多为断路',
    causes: ['传感器内部断路', '插头松脱', '线束断路'],
    severity: '尽快检修', kw: ['ect', '水温', '高输入']
  },
  {
    code: 'P0120', cat: 'fuelair',
    meaning: '节气门/踏板位置(TPS)传感器 A 电路故障',
    causes: ['TPS 磨损或损坏', '插头接触不良', '线束短路或断路'],
    severity: '尽快检修', kw: ['tps', '节气门位置', '电子节气门']
  },
  {
    code: 'P0121', cat: 'fuelair',
    meaning: '节气门位置信号范围/性能：信号与实际开度不符',
    causes: ['TPS 磨损导致信号抖动', '节气门体积碳', '传感器调整或安装不当'],
    severity: '尽快检修', kw: ['tps', '节气门位置']
  },
  {
    code: 'P0122', cat: 'fuelair',
    meaning: '节气门位置信号低输入：信号电压低于下限',
    causes: ['信号线对地短路', 'TPS 内部故障', '插头接触不良'],
    severity: '尽快检修', kw: ['tps', '低输入']
  },
  {
    code: 'P0123', cat: 'fuelair',
    meaning: '节气门位置信号高输入：信号电压高于上限，多为断路',
    causes: ['TPS 断路', '信号线断路', '搭铁点不良'],
    severity: '尽快检修', kw: ['tps', '高输入']
  },
  {
    code: 'P0130', cat: 'fuelair',
    meaning: '氧传感器电路故障（第一列缸组前氧 O2 B1S1）',
    causes: ['氧传感器老化或中毒（硅、铅）', '插头与线束故障', '信号或加热线路断路短路'],
    severity: '尽快检修', kw: ['o2', '氧传感器', 'lambda', '前氧']
  },
  {
    code: 'P0131', cat: 'fuelair',
    meaning: '氧传感器信号电压持续偏低（第一列前氧）：判定过稀或信号对地短路',
    causes: ['排气歧管前段漏气', '信号线对地短路', '燃油压力偏低或喷嘴堵塞'],
    severity: '尽快检修', kw: ['o2', '氧传感器', '稀', '低电压']
  },
  {
    code: 'P0132', cat: 'fuelair',
    meaning: '氧传感器信号电压持续偏高（第一列前氧）：判定过浓或信号对电源短路',
    causes: ['喷油器泄漏或油压过高', '信号线对电源短路', '传感器被冷却液/油污污染'],
    severity: '尽快检修', kw: ['o2', '氧传感器', '浓', '高电压']
  },
  {
    code: 'P0133', cat: 'fuelair',
    meaning: '氧传感器响应迟缓：信号摆动速率低于阈值（老化特征）',
    causes: ['传感器老化', '硅中毒（劣质密封胶/养护品）', '表面积碳积灰'],
    severity: '可观察', kw: ['o2', '氧传感器', '响应慢', '老化']
  },
  {
    code: 'P0134', cat: 'fuelair',
    meaning: '氧传感器无活动：信号静止不摆动，退出闭环控制',
    causes: ['传感器完全失效', '信号线断路', '插头脱落'],
    severity: '可观察', kw: ['o2', '氧传感器', '无信号']
  },
  {
    code: 'P0135', cat: 'fuelair',
    meaning: '氧传感器加热器电路故障（第一列前氧）：冷车闭环变慢',
    causes: ['加热器内部断路', '加热器保险丝或继电器故障', '线束插头故障'],
    severity: '可观察', kw: ['o2', '氧传感器', '加热器']
  },
  {
    code: 'P0136', cat: 'fuelair',
    meaning: '下游氧传感器电路故障（第一列后氧 O2 B1S2，用于催化器监测）',
    causes: ['后氧传感器老化或损坏', '插头线束故障', '排气中段漏气影响读数'],
    severity: '可观察', kw: ['o2', '氧传感器', '后氧', '下游']
  },
  {
    code: 'P0171', cat: 'fuelair',
    meaning: '燃油系统过稀（第一列缸组）：燃油修剪已达稀的极限，ECU 多喷油仍测到偏稀',
    causes: ['真空管或进气道漏气', 'MAF 脏污或 MAP 失准', '燃油压力低（油泵/滤芯）'],
    severity: '尽快检修', kw: ['稀', '燃油修剪', 'lean', '漏气']
  },
  {
    code: 'P0172', cat: 'fuelair',
    meaning: '燃油系统过浓（第一列缸组）：燃油修剪已达浓的极限',
    causes: ['喷油器滴漏或油压过高', '空滤堵塞或 MAF 失准', '碳罐电磁阀常开'],
    severity: '尽快检修', kw: ['浓', '燃油修剪', 'rich']
  },
  {
    code: 'P0174', cat: 'fuelair',
    meaning: '燃油系统过稀（第二列缸组）：与 P0171 同类，发生在另一侧缸组',
    causes: ['该侧进气漏气', 'MAF 失准（V 型机两列共用进气量信号）', '该侧供油不足'],
    severity: '尽快检修', kw: ['稀', '燃油修剪', '第二列']
  },
  {
    code: 'P0175', cat: 'fuelair',
    meaning: '燃油系统过浓（第二列缸组）：与 P0172 同类，发生在另一侧缸组',
    causes: ['该侧喷油器泄漏', '油压调节器故障', '该侧传感器失准'],
    severity: '尽快检修', kw: ['浓', '燃油修剪', '第二列']
  },
  {
    code: 'P0200', cat: 'fuelair',
    meaning: '喷油器电路故障（通用）：ECU 检测到喷油器驱动电路异常',
    causes: ['喷油器线束破损', '驱动模块或保险丝故障', '插头腐蚀'],
    severity: '尽快检修', kw: ['喷油器', 'injector', '油嘴']
  },
  {
    code: 'P0201', cat: 'fuelair',
    meaning: '1 缸喷油器电路故障',
    causes: ['1 缸喷油器插头松脱', '喷油器线圈断路', '该缸驱动线断路或短路'],
    severity: '尽快检修', kw: ['喷油器', '1缸']
  },
  {
    code: 'P0202', cat: 'fuelair',
    meaning: '2 缸喷油器电路故障',
    causes: ['2 缸喷油器插头松脱', '喷油器线圈断路', '该缸驱动线断路或短路'],
    severity: '尽快检修', kw: ['喷油器', '2缸']
  },
  {
    code: 'P0203', cat: 'fuelair',
    meaning: '3 缸喷油器电路故障',
    causes: ['3 缸喷油器插头松脱', '喷油器线圈断路', '该缸驱动线断路或短路'],
    severity: '尽快检修', kw: ['喷油器', '3缸']
  },
  {
    code: 'P0204', cat: 'fuelair',
    meaning: '4 缸喷油器电路故障',
    causes: ['4 缸喷油器插头松脱', '喷油器线圈断路', '该缸驱动线断路或短路'],
    severity: '尽快检修', kw: ['喷油器', '4缸']
  },
  {
    code: 'P0230', cat: 'fuelair',
    meaning: '燃油泵主电路故障：油泵继电器/供电回路异常，可能供油中断',
    causes: ['燃油泵继电器故障', '油泵插头或线束故障', '油泵保险丝熔断'],
    severity: '尽快检修', kw: ['燃油泵', '油泵继电器', 'fuel pump']
  },

  // ===== 点火与失火（P0300-P0351）=====
  {
    code: 'P0300', cat: 'ignition',
    meaning: '检测到随机/多缸失火：转速波动超出阈值，无法定位单一气缸',
    causes: ['火花塞与点火线圈整体老化', '多个喷油器堵塞', '真空漏气或气门积碳'],
    severity: '立即停车', kw: ['失火', 'misfire', '抖动']
  },
  {
    code: 'P0301', cat: 'ignition',
    meaning: '检测到 1 缸失火：该缸做功贡献不足',
    causes: ['火花塞间隙过大或积碳', '点火线圈失效', '喷油器堵塞或缸压不足'],
    severity: '立即停车', kw: ['失火', '1缸', 'misfire']
  },
  {
    code: 'P0302', cat: 'ignition',
    meaning: '检测到 2 缸失火',
    causes: ['火花塞间隙过大或积碳', '点火线圈失效', '喷油器堵塞或缸压不足'],
    severity: '立即停车', kw: ['失火', '2缸', 'misfire']
  },
  {
    code: 'P0303', cat: 'ignition',
    meaning: '检测到 3 缸失火',
    causes: ['火花塞间隙过大或积碳', '点火线圈失效', '喷油器堵塞或缸压不足'],
    severity: '立即停车', kw: ['失火', '3缸', 'misfire']
  },
  {
    code: 'P0304', cat: 'ignition',
    meaning: '检测到 4 缸失火',
    causes: ['火花塞间隙过大或积碳', '点火线圈失效', '喷油器堵塞或缸压不足'],
    severity: '立即停车', kw: ['失火', '4缸', 'misfire']
  },
  {
    code: 'P0305', cat: 'ignition',
    meaning: '检测到 5 缸失火',
    causes: ['火花塞间隙过大或积碳', '点火线圈失效', '喷油器堵塞或缸压不足'],
    severity: '立即停车', kw: ['失火', '5缸', 'misfire']
  },
  {
    code: 'P0325', cat: 'ignition',
    meaning: '爆震传感器(KS)电路故障（第一列）：ECU 无法感知爆震，被迫保守退点火角',
    causes: ['KS 插头松脱或线束破损', '传感器安装扭矩不当', '传感器损坏'],
    severity: '尽快检修', kw: ['爆震', 'knock', '点火提前角']
  },
  {
    code: 'P0335', cat: 'ignition',
    meaning: '曲轴位置(CKP)传感器 A 电路故障：点火与喷油的正时基准丢失，行驶中可能突然熄火',
    causes: ['CKP 插头松脱或信号间隙不当', '传感器热失效（热车熄火常见）', '信号盘脏污或损坏'],
    severity: '立即停车', kw: ['曲轴位置', 'ckp', '熄火', '不着车']
  },
  {
    code: 'P0340', cat: 'ignition',
    meaning: '凸轮轴位置(CMP)传感器电路故障：判缸与正时校验信号丢失',
    causes: ['CMP 传感器损坏', '插头或线束故障', '正时链条跳齿或信号盘问题'],
    severity: '尽快检修', kw: ['凸轮轴位置', 'cmp', '判缸']
  },
  {
    code: 'P0351', cat: 'ignition',
    meaning: '点火线圈 A（1 缸）初/次级控制电路故障',
    causes: ['线圈内部断路', '插头或驱动线故障', '联动火花塞损坏'],
    severity: '尽快检修', kw: ['点火线圈', '1缸', 'coil']
  },

  // ===== 排放控制（P0400-P0455）=====
  {
    code: 'P0400', cat: 'emission',
    meaning: '废气再循环(EGR)流量异常：实际流量超出预期范围',
    causes: ['EGR 阀积碳卡滞', 'EGR 通道堵塞', '控制电磁阀或位置传感器故障'],
    severity: '尽快检修', kw: ['egr', '废气再循环']
  },
  {
    code: 'P0401', cat: 'emission',
    meaning: 'EGR 流量不足：再循环气量低于预期',
    causes: ['EGR 阀积碳卡在关闭位', '真空或电磁阀管路泄漏', '冷却器与通道堵塞'],
    severity: '尽快检修', kw: ['egr', '流量不足']
  },
  {
    code: 'P0402', cat: 'emission',
    meaning: 'EGR 流量过大：再循环气量高于预期',
    causes: ['EGR 阀卡在开启位', '控制电路故障', '真空管接错'],
    severity: '尽快检修', kw: ['egr', '流量过大']
  },
  {
    code: 'P0403', cat: 'emission',
    meaning: 'EGR 控制电路故障：执行器回路异常',
    causes: ['电磁阀线圈断路', '线束或插头故障', 'ECU 驱动级故障'],
    severity: '尽快检修', kw: ['egr', '控制电路']
  },
  {
    code: 'P0420', cat: 'emission',
    meaning: '三元催化器效率低于阈值（第一列）：储氧能力下降，前后氧波形趋于一致',
    causes: ['催化器老化或中毒失效', '前氧信号漂移误报', '排气前段漏气'],
    severity: '可观察', kw: ['催化', '三元催化', 'p0420', '年检']
  },
  {
    code: 'P0430', cat: 'emission',
    meaning: '三元催化器效率低于阈值（第二列）：与 P0420 同类，另一侧缸组',
    causes: ['该侧催化器老化失效', '该侧氧传感器漂移', '该侧排气漏气'],
    severity: '可观察', kw: ['催化', '三元催化', '第二列', '年检']
  },
  {
    code: 'P0440', cat: 'emission',
    meaning: '燃油蒸发排放(EVAP)控制系统故障（通用口径）',
    causes: ['油箱盖密封圈老化', '碳罐或电磁阀故障', 'EVAP 管路泄漏'],
    severity: '可观察', kw: ['evap', '碳罐', '油箱盖', '蒸发排放']
  },
  {
    code: 'P0441', cat: 'emission',
    meaning: 'EVAP 吹扫流量不正确：吹扫量与预期不符',
    causes: ['吹扫阀卡滞', '碳罐堵塞', '管路弯折或泄漏'],
    severity: '可观察', kw: ['evap', '吹扫', '碳罐']
  },
  {
    code: 'P0442', cat: 'emission',
    meaning: 'EVAP 系统小泄漏：保压测试未达标（细微漏点）',
    causes: ['油箱盖没拧紧或密封圈老化', '软管细微裂纹', '碳罐电磁阀关闭不严'],
    severity: '可观察', kw: ['evap', '小泄漏', '油箱盖']
  },
  {
    code: 'P0443', cat: 'emission',
    meaning: 'EVAP 吹扫控制阀电路故障',
    causes: ['电磁阀线圈断路', '线束或插头故障', '保险丝熔断'],
    severity: '可观察', kw: ['evap', '吹扫阀', '电磁阀']
  },
  {
    code: 'P0446', cat: 'emission',
    meaning: 'EVAP 通风控制电路/路径故障：系统无法正常进排气',
    causes: ['通风阀卡滞或堵塞', '碳罐通风口被灰尘堵塞', '线束故障'],
    severity: '可观察', kw: ['evap', '通风阀', '碳罐']
  },
  {
    code: 'P0455', cat: 'emission',
    meaning: 'EVAP 系统大泄漏：系统无法建立真空，多为明显漏点',
    causes: ['油箱盖未拧紧或丢失', '油箱或管路明显破损', '碳罐或阀体接口脱落'],
    severity: '可观察', kw: ['evap', '大泄漏', '油箱盖']
  },

  // ===== 车速/怠速/电压（P0500-P0563）=====
  {
    code: 'P0500', cat: 'speed',
    meaning: '车速传感器(VSS) A 电路故障：仪表、变速箱与巡航共用的车速信号异常',
    causes: ['VSS 传感器损坏', '信号齿圈脏污或损坏', '线束插头故障'],
    severity: '尽快检修', kw: ['车速传感器', 'vss', '里程表不动']
  },
  {
    code: 'P0505', cat: 'speed',
    meaning: '怠速控制系统故障：怠速执行器或怠速学习值异常',
    causes: ['节气门体积碳', '怠速马达故障（拉线节气门车型）', '怠速学习值丢失需重新匹配'],
    severity: '尽快检修', kw: ['怠速', 'iac', '节气门匹配']
  },
  {
    code: 'P0506', cat: 'speed',
    meaning: '实际怠速转速低于目标值：怠速进气量不足',
    causes: ['节气门旁通道积碳堵塞', '怠速执行器动作不到位', '进气系统异常补偿'],
    severity: '尽快检修', kw: ['怠速低', '熄火']
  },
  {
    code: 'P0507', cat: 'speed',
    meaning: '实际怠速转速高于目标值：怠速进气量过多',
    causes: ['节气门卡滞或积碳', '真空泄漏', '怠速学习未复位'],
    severity: '尽快检修', kw: ['怠速高', '转速高']
  },
  {
    code: 'P0562', cat: 'speed',
    meaning: '系统电压低：ECU 检测到供电电压低于阈值，充电系统异常',
    causes: ['发电机皮带打滑或发电机故障', '电瓶老化亏电', '搭铁点腐蚀'],
    severity: '尽快检修', kw: ['电压低', '发电机', '电瓶', '充电']
  },
  {
    code: 'P0563', cat: 'speed',
    meaning: '系统电压高：供电电压超过阈值，可能损坏用电部件',
    causes: ['发电机调节器故障', '电压采样线故障', '电瓶失效导致电压尖峰'],
    severity: '尽快检修', kw: ['电压高', '发电机', '调节器']
  },

  // ===== 变速箱（P0700-P0751）=====
  {
    code: 'P0700', cat: 'trans',
    meaning: '变速箱控制系统故障：TCM 存有故障码并请求亮灯（需进变速箱模块读具体码）',
    causes: ['TCM 内另有具体故障码待读取', '换挡电磁阀或转速传感器故障', '变速箱油老化或油位低'],
    severity: '尽快检修', kw: ['变速箱', 'tcm', 'p0700']
  },
  {
    code: 'P0715', cat: 'trans',
    meaning: '变速箱输入轴/涡轮转速传感器电路故障：换挡基准信号丢失',
    causes: ['输入转速传感器损坏', '插头或线束故障', '信号盘问题'],
    severity: '尽快检修', kw: ['变速箱', '输入轴转速', '涡轮转速']
  },
  {
    code: 'P0720', cat: 'trans',
    meaning: '变速箱输出轴转速传感器电路故障：换挡点与仪表车速参考异常',
    causes: ['输出转速传感器损坏', '线束插头故障', '齿圈脏污或损坏'],
    severity: '尽快检修', kw: ['变速箱', '输出轴转速']
  },
  {
    code: 'P0730', cat: 'trans',
    meaning: '齿比不正确：实际齿比与指令档位不符，典型为离合器打滑',
    causes: ['离合器/制动带打滑', '变速箱油位低或油质劣化', '换挡电磁阀故障'],
    severity: '尽快检修', kw: ['变速箱', '打滑', '齿比']
  },
  {
    code: 'P0740', cat: 'trans',
    meaning: '锁止变矩器离合器(TCC)控制电路故障',
    causes: ['TCC 电磁阀故障', '线束或插头故障', '变速箱油污染'],
    severity: '尽快检修', kw: ['变矩器', 'tcc', '锁止']
  },
  {
    code: 'P0741', cat: 'trans',
    meaning: '变矩器离合器打滑或卡在分离位：锁止比达不到目标（高速抖动、油耗升高）',
    causes: ['TCC 电磁阀卡滞', '变矩器内部磨损', '油压不足'],
    severity: '尽快检修', kw: ['变矩器', '打滑', '锁止']
  },
  {
    code: 'P0750', cat: 'trans',
    meaning: '换挡电磁阀 A 控制电路故障',
    causes: ['电磁阀线圈断路或短路', '线束插头故障', '阀体污染卡滞'],
    severity: '尽快检修', kw: ['变速箱', '换挡电磁阀']
  },
  {
    code: 'P0751', cat: 'trans',
    meaning: '换挡电磁阀 A 卡滞：执行位置与指令不符（换挡冲击或锁档）',
    causes: ['阀体积碳或金属屑卡阀', '电磁阀老化', '变速箱油超期未换'],
    severity: '尽快检修', kw: ['变速箱', '换挡电磁阀', '锁档']
  }
]

// 数据完整性自检（供交付报告引用；页面端用守卫取值，不因缺字段崩溃）
function dtcHealthCheck() {
  const sevSet: Sev[] = ['可观察', '尽快检修', '立即停车']
  const codes = DTC_DB.map(d => d.code)
  return {
    total: DTC_DB.length,
    bad: DTC_DB.filter(d => !(
      /^P0\d{3}$/.test(d.code) && d.meaning && d.causes.length >= 2 &&
      sevSet.includes(d.severity) && CATS.some(c => c.id === d.cat)
    )).map(d => d.code),
    dup: codes.filter((c, i) => codes.indexOf(c) !== i),
    p0171Lean: DTC_DB.some(d => d.code === 'P0171' && d.meaning.includes('稀'))
  }
}
/* ===== 纯函数区结束 ===== */

// ---------- SEO ----------
useSeoMeta({
  title: 'OBD故障码速查 - P0xxx 故障码含义与常见原因对照表',
  description: `在线 OBD-II 故障码查询表：${DTC_DB.length} 个常见 P0 标准码（P0100 空气流量、P0115 水温、P0130 氧传感器、P0171 混合气过稀、P0300-P0305 失火、P0335 曲轴位置、P0420/P0430 催化、P0440-P0455 EVAP、P0500 车速、P0700 变速箱）一句话含义、常见原因与「可观察/尽快检修/立即停车」严重度分档，附故障码结构与读码 CAN 口径讲解，纯本地运行。`,
  keywords: 'obd故障码查询,p0171,p0420,p0300,故障灯亮,obd2 codes,dtc查询,故障码含义,汽车诊断',
  author: '有条工具',
  ogTitle: 'OBD故障码速查 - 含义、原因与严重度分档 | 有条工具',
  ogDescription: '70+ 常见 P0xxx 故障码一句话含义、常见原因与严重度三档提示，故障码结构讲解。',
  ogUrl: 'https://www.util.cn/tools/obd-dtc-lookup',
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
          name: 'OBD故障码速查',
          url: 'https://www.util.cn/tools/obd-dtc-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            `${DTC_DB.length} 个常见 P0 标准故障码（燃油空气计量/点火失火/排放控制/车速怠速/变速箱）`,
            '每码一句话含义与常见原因 2-3 条',
            '可观察/尽快检修/立即停车三档严重度提示',
            '故障码结构逐位讲解（P=动力系统、0=标准码、数字位子系统）',
            '码号与关键词检索、系统分类过滤',
            '故障灯亮灯/清码/闪码/CAN 口径知识',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: 'OBD故障码速查', item: 'https://www.util.cn/tools/obd-dtc-lookup/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '故障灯亮了还能继续开吗？',
              acceptedAnswer: { '@type': 'Answer', text: '先看灯再看症状：灯常亮且车辆无异常，通常是排放类故障，可谨慎短途行驶并尽快读码；灯闪烁或伴随明显抖动、异响、水温报警，说明存在失火等严重故障，应立即靠边停车呼叫救援。查到码后按可观察/尽快检修/立即停车三档参考判断，最终以实车诊断为准。' }
            },
            {
              '@type': 'Question',
              name: '为什么清码后故障灯过几天又亮了？',
              acceptedAnswer: { '@type': 'Answer', text: '清码只是删除记录，故障条件仍在。EVAP 泄漏、催化效率这类监控需要跨多个驾驶循环采样，条件再触发就会再次亮灯，说明故障真实存在。修好后灯自动熄灭也需要同样的采样周期；另外清码会把排放就绪状态清零，年检前清码可能导致检测项未就绪而无法通过。' }
            },
            {
              '@type': 'Question',
              name: '故障灯闪烁和常亮有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '常亮表示已确认故障，系统记录故障码并可能进入降级模式，尽快检修即可；闪烁表示正在发生催化剂损坏级失火，未燃汽油正在三元催化器内燃烧，继续高速行驶会烧毁催化器。灯闪时先松油门降速，仍不熄灭就立即靠边停车。' }
            },
            {
              '@type': 'Question',
              name: '老车连不上读码器是 CAN 口径的问题吗？',
              acceptedAnswer: { '@type': 'Answer', text: '有可能。CAN（ISO 15765-4）是 2008 年后美系新车的强制诊断口径与如今主流；2004 年前的欧系车多用 K 线（ISO 9141-2）或 KWP2000，部分美系老车用 J1850。纯 CAN 读码器连老车会没有反应，需要支持多协议的读码器。读到 P1xxx 开头的码属于厂商自定义码，要查该车型原厂资料。' }
            }
          ]
        }
      ]
    })
  }]
})

const STORAGE_KEY = 'obd-dtc-lookup:state'

onMounted(() => {
  addRecentTool('obd-dtc-lookup')
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        if (typeof saved.query === 'string') query.value = saved.query
        if (typeof saved.catFilter === 'string' && CATS.some(c => c.id === saved.catFilter)) catFilter.value = saved.catFilter as Cat
        if (typeof saved.selectedCode === 'string' && DTC_DB.some(d => d.code === saved.selectedCode)) selectDtc(saved.selectedCode)
      }
    }
  } catch {
    // 本地存储不可用或内容损坏时忽略，使用默认值
  }
  watch(
    [query, catFilter, selectedCode],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: query.value,
          catFilter: catFilter.value,
          selectedCode: selectedCode.value
        }))
      } catch {
        // 忽略写入失败（隐私模式等）
      }
    }
  )
})

// ---------- 交互状态 ----------
const query = ref('')
const catFilter = ref<'all' | Cat>('all')
const selectedCode = ref('P0171')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const filteredDtcs = computed(() => {
  const q = query.value.trim().toLowerCase().replace(/\s+/g, '')
  return DTC_DB.filter(d => {
    if (catFilter.value !== 'all' && d.cat !== catFilter.value) return false
    if (!q) return true
    const hay = [d.code, d.meaning, ...d.causes, ...d.kw].join(' ').toLowerCase().replace(/\s+/g, '')
    return hay.includes(q)
  })
})

function countByCat(cat: 'all' | Cat): number {
  return cat === 'all' ? DTC_DB.length : DTC_DB.filter(d => d.cat === cat).length
}

function selectDtc(code: string) {
  if (!DTC_DB.some(d => d.code === code)) return
  selectedCode.value = code
}

const selectedDtc = computed<Dtc | null>(() => DTC_DB.find(d => d.code === selectedCode.value) || null)

function catLabel(cat: Cat): string {
  const c = CATS.find(x => x.id === cat)
  return c ? c.name : ''
}

// ---------- 展示辅助 ----------
function sevBadgeCls(s: Sev): string {
  if (s === '立即停车') return 'bg-red-500/15 text-red-600 dark:text-red-400'
  if (s === '尽快检修') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
}
function sevBoxCls(s: Sev): string {
  if (s === '立即停车') return 'bg-red-500/10 border-red-500/40'
  if (s === '尽快检修') return 'bg-amber-500/10 border-amber-500/40'
  return 'bg-sky-500/10 border-sky-500/40'
}
function sevTextCls(s: Sev): string {
  if (s === '立即停车') return 'text-red-600 dark:text-red-400'
  if (s === '尽快检修') return 'text-amber-600 dark:text-amber-400'
  return 'text-sky-600 dark:text-sky-400'
}
function sevAdvice(s: Sev): string {
  if (s === '立即停车') {
    return '存在烧毁三元催化器或行驶中失去动力的风险：故障灯闪烁、明显抖动异响或仪表再报警时，立即靠边停车，呼叫救援，不要继续高速行驶。'
  }
  if (s === '尽快检修') {
    return '短期可谨慎行驶，但持续行驶可能加重损伤、升高油耗或半路趴窝：建议几天内安排读码检修，并记录故障出现时的工况。'
  }
  return '不影响行车安全：可继续观察使用，尽快找方便的时间读取详细数据流确认；注意年检排放可能受影响。'
}
</script>
