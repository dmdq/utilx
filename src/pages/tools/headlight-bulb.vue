<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">车灯型号对照</h1>
          <p class="text-sm text-muted-foreground mt-1">H 系/900 系/W 系常见车灯型号速查：灯座形态、丝数功能、功率与典型用途线索</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线车灯泡型号对照表：内置 {{ BULB_DB.length }} 个最常见型号（H1/H3/H4/H7/H8/H9/H11/H16 欧标系、
        9004/9005(HB3)/9006(HB4)/9007/880/881 美标系、W5W/T10/T15 楔形系、P21W(1156)/PY21W/1157 卡口系），
        每条给出灯座形态一句话、单丝/双丝与功能（远光/近光/远近一体/雾灯/示宽/转向/刹车/倒车）、常见功率与典型车型用途线索，
        附型号命名讲解（H=Halogen 欧标、900 系美标 HB 口径、W=Wedged 无座楔形）与换 LED 合规提示。
        支持型号与关键词检索，全部数据本地渲染，不上传任何数据。
      </p>
    </div>

    <!-- 免责与数据口径（显著位置） -->
    <div class="p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        <strong>本页型号与用途仅供线索参考，购买与改装以实料（旧灯泡印字/车辆手册）与当地法规为准。</strong>
        同一型号在不同品牌车型上的用途分配可能不同；换装 LED 属灯光改装，光型、色温与认证要求请按当地年检法规执行，
        近光拼光型（切线）不符合要求的改装会晃到对向车辆且年检不过。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧主列 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 搜索 + 用途过滤 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 型号检索
          </h2>
          <input
            v-model="query"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="输入型号或关键词，如 H7、9005、雾灯、远近一体、T10、1156"
            class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="r in ROLE_TABS" :key="r.id"
              @click="roleFilter = r.id"
              :class="roleFilter === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >{{ r.name }}<span v-if="r.id !== 'all'" class="ml-1 text-[10px] opacity-70">{{ countByRole(r.id) }}</span></button>
          </div>
          <!-- 型号列表 -->
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            <button
              v-for="b in filteredBulbs" :key="b.id"
              @click="selectBulb(b.id)"
              class="text-left px-3 py-2 rounded-lg border transition-all"
              :class="selectedId === b.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/50 hover:bg-muted'"
            >
              <p class="font-mono font-bold text-sm" :class="selectedId === b.id ? 'text-primary' : 'text-foreground'">{{ b.id }}</p>
              <p class="text-[11px] text-muted-foreground mt-0.5 leading-tight">{{ roleSummary(b) }}</p>
            </button>
            <p v-if="!filteredBulbs.length" class="col-span-full text-sm text-muted-foreground py-4 text-center">
              没有匹配「{{ query }}」的型号，试试看旧灯泡底座印字后用印的型号来搜。
            </p>
          </div>
        </div>

        <!-- 详情卡 -->
        <div v-if="selectedBulb" class="bg-card border border-border rounded-lg p-6 space-y-5">
          <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-2xl font-bold font-mono text-foreground">{{ selectedBulb.id }}</h2>
                <span class="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{{ familyLabel(selectedBulb.family) }}</span>
                <span class="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{{ selectedBulb.filaments === 2 ? '双丝' : '单丝' }}</span>
                <span
                  v-for="r in selectedBulb.roles" :key="r"
                  class="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary"
                >{{ r }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">别名/同族：{{ selectedBulb.alias }}</p>
            </div>
            <NuxtLink to="/tools/obd-dtc-lookup" class="text-xs text-primary hover:underline whitespace-nowrap mt-1">
              故障灯亮了？→ OBD故障码速查
            </NuxtLink>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
              <div>
                <p class="text-xs text-muted-foreground mb-1">灯座形态</p>
                <p class="text-sm text-foreground leading-relaxed">{{ selectedBulb.base }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">常见功率</p>
                <p class="text-sm text-foreground leading-relaxed">{{ selectedBulb.power }}</p>
              </div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
              <div>
                <p class="text-xs text-muted-foreground mb-1">功能与丝数</p>
                <p class="text-sm text-foreground leading-relaxed">
                  {{ selectedBulb.filaments === 2 ? '双丝（一根灯丝对应一个功能）' : '单丝（只承担一个功能）' }} ·
                  {{ selectedBulb.roles.join(' / ') }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">典型车型用途线索</p>
                <p class="text-sm text-foreground leading-relaxed">{{ selectedBulb.usage }}</p>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            对照方法：拔下旧灯泡看<span class="text-foreground font-medium">底座塑料或玻壳上的印字</span>（品牌会把型号与功率印在灯座上），
            用印的型号回到上方检索即可确认灯座形态与功率；印字磨损不清时，按灯座防呆口形状在本页逐个比对。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 型号命名讲解 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 型号命名讲解
          </h2>
          <div class="space-y-2 text-xs leading-relaxed">
            <div class="bg-muted/50 border border-border rounded-lg px-3 py-2">
              <p class="text-foreground font-medium">H 系（H1/H4/H7…）= Halogen 欧标系</p>
              <p class="text-muted-foreground mt-0.5">ECE 认证编号，欧洲口径；灯座为 P 系（P14.5s、PX26d、P43t 等）。H4/H1/H7 是欧系车大灯三大件。</p>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg px-3 py-2">
              <p class="text-foreground font-medium">900 系/880 系 = 美标 SAE 系</p>
              <p class="text-muted-foreground mt-0.5">美标编号，对应 HB 口径：9004=HB1、9005=HB3、9006=HB4、9007=HB5；880/881 是美标雾灯族。灯座为塑料插脚锁扣式。</p>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg px-3 py-2">
              <p class="text-foreground font-medium">W 系（W5W/W16W）= Wedged 无座楔形</p>
              <p class="text-muted-foreground mt-0.5">玻壳自带扁插脚、直接楔入灯座，没有独立灯座；W 后数字=功率（W5W=5W、W16W=16W）。俗称按玻壳直径叫 T10/T15。</p>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg px-3 py-2">
              <p class="text-foreground font-medium">卡口系（P21W/PY21W/P21/5W）</p>
              <p class="text-muted-foreground mt-0.5">P=卡口泡、数字=功率：P21W=21W 单丝（1156）、PY21W 的 Y=黄色转向泡（偏置脚）、P21/5W=21/5W 双丝（1157）。</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            同座家族（如 H8/H9/H11/H16 的 PGJ19 系）外形接近但防呆口不同——插不进去就说明拿错了，不要强行互插。
          </p>
        </div>

        <!-- LED 升级合规提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 换 LED 升级合规提示
          </h2>
          <div class="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />法规按当地执行：多数地区要求灯光符合认证口径（如国标 GB 4785、欧标 ECE 对应法规），改装件要有认证且不得改变光型，年检以当地规定为准。</p>
            <p class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />近光拼光型（切线）不能乱改：卤素反光碗按卤素灯丝发光点设计，直接塞 LED 芯片会导致光型发散、眩目，照不成合格切线，既晃对向司机也过不了年检。</p>
            <p class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />解码（Canbus）：LED 功率远低于卤素（55W 对 20W 级），部分车 BCM 检测电流过小会报"灯泡故障"或频闪，需并联电阻或用带解码方案。</p>
            <p class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />色温：建议 4300K~6000K 白光区间，越白越蓝穿透越差，雨雾天反光明显衰减，过蓝的色温年检也可能被判不合格。</p>
          </div>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 相关工具
          </h2>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/tools/obd-dtc-lookup" class="text-primary hover:underline">OBD故障码速查</NuxtLink>
              <span class="text-muted-foreground text-xs"> — 常见 P0xxx 故障码含义、原因与严重度分档</span>
            </li>
            <li>
              <NuxtLink to="/tools/tire-pressure-convert" class="text-primary hover:underline">胎压换算</NuxtLink>
              <span class="text-muted-foreground text-xs"> — psi/bar/kPa 胎压冷热换算</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页为常见车灯型号的通用对照线索，具体车型用什么型号、能不能装 LED、色温与光型是否合规，
        以实车旧灯泡印字、车辆用户手册与当地年检法规为准；本页不构成改装建议。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>车灯型号对照指南</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          车灯泡型号本质上是"灯座 + 灯丝结构 + 功率"的组合编码。全世界车用卤素泡分两大口径：
          欧标 ECE 体系（H1/H4/H7/H11 这些 H 系）和美标 SAE 体系（9004-9007、880/881 这些数字系），
          再加上楔形（W5W/T10/T15）与卡口（1156/1157）两个"小灯"家族。本页收录 {{ BULB_DB.length }} 个最高频型号，
          按用途（远光/近光/远近一体/雾灯/示宽/转向/刹车/倒车）组织，支持检索与过滤。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">车灯型号怎么看：旧灯泡底座印字</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          最可靠的途径是看旧灯泡：拔下灯泡后，<span class="text-foreground font-medium">型号通常印在底座塑料或金属环上</span>
          （如 "H7 12V 55W PX26d"、"9005 HB3 12V 65W"），玻壳上也会印品牌与型号；印字磨损时按灯座防呆口形状对照本页表格。
          三种定位逻辑要分清：卡簧法兰压住的是 H1/H7 这类"平板法兰座"，塑料插脚锁扣的是 H8/H11/9005/9006 这类"美标/PGJ19 座"，
          玻壳直接楔进去的是 W5W/T10/T15 楔形座，旋转卡入的是 1156/1157 卡口座。
          车主手册的灯泡规格页也会列全车灯型号，但部分车型手册印得笼统，仍以旧泡印字为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">换 LED 为什么要解码</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          卤素泡是"电阻丝"，功率大（55W 级）；LED 驱动只拉 20W 级甚至更低电流。
          不少车的车身控制模块（BCM）靠"回路电流是否正常"判断灯泡在不在，电流小一半以上就判定"灯泡烧了"：
          仪表报故障、屏幕提示灯泡失效，转向灯还会因闪继电器节奏检测而快速频闪。
          解决思路是"把电流补回来"——并联解码电阻（注意电阻发热与安装位置）或选用带解码电路（Canbus）的 LED 产品。
          另外散热风冷/铜带方式决定 LED 寿命，灯杯空间小的车型先量尺寸再下单。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">LED 色温与年检</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          色温单位 K，数值越高越白越蓝：原厂卤素约 3200K（偏黄），主流 LED 改装在 5000K~6000K。
          年检（按当地法规）通常检查两点：光型（近光切线是否规整、亮度是否达标）与色温（过蓝白偏光可能判不合格）。
          实用建议：<span class="text-foreground font-medium">近光留在 4300K~6000K 白光区间</span>，雨雾穿透与对向眩目都更稳妥；
          别追求 8000K 以上"冰蓝"——穿透差、眩目、年检风险三头不讨好。雾灯建议保持偏黄光（3000K 级或原厂卤素），黄光在雾滴里散射更弱、看得更远。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">车灯型号在哪里看？旧灯泡印字磨损了怎么办？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              拔下旧灯泡看底座塑料/金属环与玻壳上的印字（型号、电压功率、座型号），这是最可靠口径；
              印字不清时按灯座形态对照本页：法兰卡簧座看 P 系座号、塑料插脚锁扣座对照 H8/H11/9005/9006 系列、
              无座楔形对照 W5W/T10/T15、旋转卡口对照 1156/1157。车主手册灯泡规格页可作为辅助参考。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">换 LED 后仪表报"灯泡故障"或转向灯频闪是怎么回事？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              这是电流检测问题：LED 功率比卤素低一半以上，BCM 认为灯泡断路。加装解码电阻并联补电流，
              或换带 Canbus 解码电路的 LED 产品即可解决；注意解码电阻发热明显，要固定在耐热位置。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">LED 色温选多少年检稳？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              4300K~6000K 白光区间最稳妥：接近日光白、光型检查容易达标，也符合多数地区对"白色光"的法规口径。
              高于 6500K 偏蓝白，雨雾天穿透明显变差，过蓝还可能被判定光色不合规。雾灯建议保留偏黄光。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">H4 和 9004/9007 都是远近一体，能互换吗？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              不能。三者灯座结构、防呆口、灯丝位置与光轴设计完全不同（H4 是欧标 P43t 三插片座，
              9004/9007 是美标矩形塑料座且两型号插脚排布互不相同），互换会导致灯装不进去或光型错乱。
              近远一体泡换任何型号前，先确认灯座防呆口一致。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'headlight-bulb'" :category="'others'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Zap, Search, Info, CheckCircle, TriangleAlert, ChevronUp, ChevronDown, BookOpen, Lightbulb
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

/* ===== 纯函数区开始（node 单测直接复用本段，勿混入 Vue 响应式或浏览器 API） ===== */

// 家族口径：eu=欧标 H 系 / us=美标 900-880 系 / wedge=楔形 / bay=卡口
type Family = 'eu' | 'us' | 'wedge' | 'bay'

interface Bulb {
  id: string          // 型号
  family: Family      // 家族
  alias: string       // 别名/同族口径
  base: string        // 灯座形态一句话
  filaments: 1 | 2    // 丝数
  roles: string[]     // 功能：远光/近光/远近一体/雾灯/示宽/转向/刹车/倒车/牌照/阅读
  power: string       // 常见功率
  usage: string       // 典型车型用途线索
}

const ROLE_TABS: { id: string; name: string }[] = [
  { id: 'all', name: '全部' },
  { id: '远近一体', name: '远近一体' },
  { id: '远光', name: '远光' },
  { id: '近光', name: '近光' },
  { id: '雾灯', name: '雾灯' },
  { id: '示宽', name: '示宽' },
  { id: '转向', name: '转向' },
  { id: '刹车', name: '刹车/倒车' },
  { id: '倒车', name: '倒车' }
]

const BULB_DB: Bulb[] = [
  {
    id: 'H1', family: 'eu', alias: '欧标远光经典',
    base: 'P14.5s 金属法兰座：扁平板法兰 + 卡簧压紧，两根扁插脚',
    filaments: 1, roles: ['远光', '雾灯'],
    power: '12V 55W',
    usage: '欧系老车远光位常见，也是独立雾灯与改装射灯的主力型号之一'
  },
  {
    id: 'H3', family: 'eu', alias: '欧标雾灯/射灯',
    base: 'PK22s 玻璃管座：圆柱玻管自带三根引线，轴向插入卡座定位',
    filaments: 1, roles: ['雾灯'],
    power: '12V 55W',
    usage: '老款车雾灯与越野射灯的经典型号，后装射灯市场仍在大量使用'
  },
  {
    id: 'H4', family: 'eu', alias: '9003/HB2（美标口径）',
    base: 'P43t 三插片塑料座：双丝同壳，三爪卡扣 + 防呆缺口定位',
    filaments: 2, roles: ['远近一体'],
    power: '12V 近光 55W / 远光 60W',
    usage: '老款紧凑型车与摩托车大灯主流（老捷达/桑塔纳、面包车与大部分摩托车）'
  },
  {
    id: 'H7', family: 'eu', alias: '欧标近光主力',
    base: 'PX26d 扁平金属座：两根扁平插脚 + 金属卡爪与卡扣固定',
    filaments: 1, roles: ['近光', '远光', '雾灯'],
    power: '12V 55W',
    usage: '2000 年后欧系/国产车近光位最常见（大众/奥迪/现代/国产轿车），部分车型也用作远光'
  },
  {
    id: 'H8', family: 'eu', alias: 'PGJ19-1',
    base: 'PGJ19-1 塑料锁扣座：三线单丝插脚，防呆键与 H11 不同',
    filaments: 1, roles: ['雾灯', '近光'],
    power: '12V 35W',
    usage: '低功率雾灯/近光位，日系与美系部分车型雾灯'
  },
  {
    id: 'H9', family: 'eu', alias: 'PGJ19-5',
    base: 'PGJ19-5 塑料锁扣座：与 H8/H11 同家族，防呆口不同',
    filaments: 1, roles: ['远光', '雾灯'],
    power: '12V 65W',
    usage: 'H11 家族的高功率版，部分车型远光或雾灯位'
  },
  {
    id: 'H11', family: 'eu', alias: 'PGJ19-2',
    base: 'PGJ19-2 塑料锁扣座：单丝两脚，防呆键非对称',
    filaments: 1, roles: ['雾灯', '近光'],
    power: '12V 55W',
    usage: '近十年最常见雾灯型号之一（大众/丰田/本田/国产 SUV 雾灯），部分车型近光'
  },
  {
    id: 'H16', family: 'eu', alias: 'PGJ19-3（19W 口径）',
    base: 'PGJ19-3 塑料锁扣座：与 H11 同家族外形、防呆口不同',
    filaments: 1, roles: ['雾灯'],
    power: '12V 19W（小功率口径）',
    usage: '日系车小功率雾灯位；功率低，注意不要拿去当 55W 雾灯用'
  },
  {
    id: '9004', family: 'us', alias: 'HB1',
    base: '美标矩形塑料三脚座：三根插片 + 防呆缺口，双丝双触点',
    filaments: 2, roles: ['远近一体'],
    power: '12V 近光 45W / 远光 65W',
    usage: '90 年代美系车大灯（老道奇/福特、部分老款起亚）'
  },
  {
    id: '9005', family: 'us', alias: 'HB3',
    base: '美标塑料两插脚锁扣座：单触点插脚，非对称锁扣定位',
    filaments: 1, roles: ['远光', '示宽'],
    power: '12V 65W',
    usage: '美系/日系远光位主力，也常被用作日行灯（DRL）光源'
  },
  {
    id: '9006', family: 'us', alias: 'HB4',
    base: '美标塑料两插脚锁扣座：与 9005 造型近似、防呆口不同',
    filaments: 1, roles: ['近光', '雾灯'],
    power: '12V 51W',
    usage: '美系车近光位主力，雾灯位也广泛使用'
  },
  {
    id: '9007', family: 'us', alias: 'HB5',
    base: '美标矩形塑料三脚座：与 9004 外形近似、插脚排布与防呆口不同',
    filaments: 2, roles: ['远近一体'],
    power: '12V 近光 55W / 远光 65W',
    usage: '美系皮卡与老款轿车大灯（老 F-150、部分道奇/克莱斯勒车型）'
  },
  {
    id: '880', family: 'us', alias: 'H27W（PG13 口径）',
    base: 'PG13 玻璃管塑料座：玻管带两插脚引线，轴向插入定位',
    filaments: 1, roles: ['雾灯'],
    power: '12V 27W',
    usage: '老款美系与部分国产车雾灯位'
  },
  {
    id: '881', family: 'us', alias: 'H27W/2（PGJ13 口径）',
    base: 'PGJ13 键位塑料座：与 880 同功率、防呆键不同，不可互换',
    filaments: 1, roles: ['雾灯'],
    power: '12V 27W',
    usage: '880 同族：美系/进口车雾灯与射灯位'
  },
  {
    id: 'W5W', family: 'wedge', alias: 'T10 / 194 / 168（美标同族）',
    base: 'W2.1x9.5d 无座楔形：玻壳自带扁插脚，直接楔入塑料灯座',
    filaments: 1, roles: ['示宽', '牌照', '阅读'],
    power: '12V 5W',
    usage: '示宽灯（小灯）、牌照灯、阅读灯最通用的型号'
  },
  {
    id: 'T10', family: 'wedge', alias: '与 W5W 同一口径（玻壳直径约 10mm）',
    base: 'W2.1x9.5d 无座楔形：与 W5W 完全同形，可视为同一只灯的两种叫法',
    filaments: 1, roles: ['示宽', '牌照', '阅读'],
    power: '12V 5W',
    usage: '同 W5W：示宽灯/牌照灯/内饰灯；LED 改装市场常直接标 "T10 LED"'
  },
  {
    id: 'T15', family: 'wedge', alias: 'W16W / 921（美标同族）',
    base: 'W2.1x16d 无座楔形：与 T10 同形但玻壳与座孔更大',
    filaments: 1, roles: ['倒车', '刹车'],
    power: '12V 16W',
    usage: '倒车灯与刹车灯位（美标 921 同族），倒车影像车型的倒车灯常客'
  },
  {
    id: 'P21W', family: 'bay', alias: '1156 / 7506（美标同族）',
    base: 'BA15s 单触点卡口：单触点 + 两颗对称圆柱定位销，旋转卡入',
    filaments: 1, roles: ['刹车', '转向', '倒车'],
    power: '12V 21W',
    usage: '刹车灯/倒车灯/转向灯通用泡（欧标 P21W、美标 1156 同族）'
  },
  {
    id: 'PY21W', family: 'bay', alias: '1156NA / 7507（黄色转向口径）',
    base: 'BAU15s 偏置卡口：两颗定位销一高一低错位，防装进普通 1156 座',
    filaments: 1, roles: ['转向'],
    power: '12V 21W（琥珀黄色）',
    usage: '黄色转向灯专用泡；偏置定位销设计防止装错到白色灯位'
  },
  {
    id: '1157', family: 'bay', alias: 'P21/5W / BAY15d（欧标口径）',
    base: 'BAY15d 双触点卡口：双触点 + 两颗对称定位销，双丝同壳',
    filaments: 2, roles: ['刹车', '示宽'],
    power: '12V 21/5W（高丝刹车、低丝示宽）',
    usage: '刹车灯 + 尾灯示宽一体泡（美标 1157 同族、欧标 P21/5W）'
  }
]

// 数据完整性自检（供交付报告引用）
function bulbHealthCheck() {
  const ids = BULB_DB.map(b => b.id)
  return {
    total: BULB_DB.length,
    bad: BULB_DB.filter(b => !(
      b.id && b.base && b.power && b.usage && b.alias &&
      (b.filaments === 1 || b.filaments === 2) &&
      Array.isArray(b.roles) && b.roles.length > 0
    )).map(b => b.id),
    dup: ids.filter((c, i) => ids.indexOf(c) !== i),
    h4Combo: BULB_DB.some(b => b.id === 'H4' && b.roles.includes('远近一体'))
  }
}
/* ===== 纯函数区结束 ===== */

// ---------- SEO ----------
useSeoMeta({
  title: '车灯型号对照表 - H7/H4/9005/1156 灯座功率与用途速查',
  description: `在线车灯泡型号对照表：${BULB_DB.length} 个常见型号（H1/H3/H4/H7/H8/H9/H11/H16 欧标、9004/9005/9006/9007/880/881 美标、W5W/T10/T15 楔形、P21W(1156)/PY21W/1157 卡口）灯座形态、单丝双丝功能、常见功率与车型用途线索，附型号命名讲解与换 LED 解码/色温合规提示，纯本地运行。`,
  keywords: '车灯型号,h7,h4,9005,9006,h11灯泡,1156,1157,t10,w5w,车灯泡对照表,汽车灯泡型号',
  author: '有条工具',
  ogTitle: '车灯型号对照表 - 灯座、功率与用途速查 | 有条工具',
  ogDescription: '20 个常见车灯泡型号对照：灯座形态、丝数功能、功率与典型用途线索，含 LED 改装合规提示。',
  ogUrl: 'https://www.util.cn/tools/headlight-bulb',
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
          name: '车灯型号对照',
          url: 'https://www.util.cn/tools/headlight-bulb',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            `${BULB_DB.length} 个常见车灯泡型号（欧标 H 系/美标 900 系/楔形/卡口）`,
            '每条灯座形态一句话与防呆口说明',
            '单丝/双丝与功能标注（远光/近光/远近一体/雾灯/示宽/转向/刹车/倒车）',
            '常见功率与典型车型用途线索',
            '型号命名讲解（H=Halogen 欧标、900 系美标 HB 口径、W=Wedged 无座）',
            '换 LED 解码原理与色温/光型合规提示',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '车灯型号对照', item: 'https://www.util.cn/tools/headlight-bulb/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '车灯型号在哪里看？旧灯泡印字磨损了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '拔下旧灯泡看底座塑料或金属环与玻壳上的印字，型号与电压功率（如 H7 12V 55W PX26d）都印在那里，这是最可靠口径；印字不清时按灯座形态对照：法兰卡簧座、塑料插脚锁扣座、无座楔形、旋转卡口分别对应 H 系/900 系/W 系/1156 系，车主手册灯泡规格页可作辅助。' }
            },
            {
              '@type': 'Question',
              name: '换 LED 后仪表报灯泡故障或转向灯频闪是怎么回事？',
              acceptedAnswer: { '@type': 'Answer', text: 'LED 功率比卤素低一半以上，车身控制模块按回路电流判断灯泡状态，电流过小被判为灯泡断路。加装解码电阻并联补电流或选用带 Canbus 解码电路的 LED 产品即可解决；解码电阻发热明显，需固定在耐热位置。' }
            },
            {
              '@type': 'Question',
              name: 'LED 色温选多少年检稳？',
              acceptedAnswer: { '@type': 'Answer', text: '4300K~6000K 白光区间最稳妥：接近日光白、光型检查容易达标，符合多数地区对白色光的法规口径。高于 6500K 偏蓝白，雨雾穿透差，过蓝还可能被判光色不合规。雾灯建议保留偏黄光，黄光在雾滴中散射更弱。' }
            },
            {
              '@type': 'Question',
              name: 'H4 和 9004/9007 都是远近一体，能互换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。三者灯座结构、防呆口、灯丝位置与光轴设计完全不同：H4 是欧标 P43t 三插片座，9004/9007 是美标矩形塑料座且两型号插脚排布互不相同。互换会导致装不进去或光型错乱，换灯前先确认灯座防呆口一致。' }
            }
          ]
        }
      ]
    })
  }]
})

const STORAGE_KEY = 'headlight-bulb:state'

onMounted(() => {
  addRecentTool('headlight-bulb')
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        if (typeof saved.query === 'string') query.value = saved.query
        if (typeof saved.roleFilter === 'string' && ROLE_TABS.some(r => r.id === saved.roleFilter)) roleFilter.value = saved.roleFilter
        if (typeof saved.selectedId === 'string' && BULB_DB.some(b => b.id === saved.selectedId)) selectBulb(saved.selectedId)
      }
    }
  } catch {
    // 本地存储不可用或内容损坏时忽略，使用默认值
  }
  watch(
    [query, roleFilter, selectedId],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: query.value,
          roleFilter: roleFilter.value,
          selectedId: selectedId.value
        }))
      } catch {
        // 忽略写入失败（隐私模式等）
      }
    }
  )
})

// ---------- 交互状态 ----------
const query = ref('')
const roleFilter = ref('all')
const selectedId = ref('H4')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const filteredBulbs = computed(() => {
  const q = query.value.trim().toLowerCase().replace(/\s+/g, '')
  return BULB_DB.filter(b => {
    if (roleFilter.value !== 'all' && !b.roles.includes(roleFilter.value)) return false
    if (!q) return true
    const hay = [b.id, b.alias, b.base, b.power, b.usage, b.family, ...b.roles].join(' ').toLowerCase().replace(/\s+/g, '')
    return hay.includes(q)
  })
})

function countByRole(role: string): number {
  return BULB_DB.filter(b => b.roles.includes(role)).length
}

function selectBulb(id: string) {
  if (!BULB_DB.some(b => b.id === id)) return
  selectedId.value = id
}

const selectedBulb = computed<Bulb | null>(() => BULB_DB.find(b => b.id === selectedId.value) || null)

// ---------- 展示辅助 ----------
function familyLabel(f: Family): string {
  if (f === 'eu') return '欧标 H 系（ECE）'
  if (f === 'us') return '美标 900/880 系（SAE）'
  if (f === 'wedge') return '楔形无座系（W/T）'
  return '卡口系（P/BA）'
}
function roleSummary(b: Bulb): string {
  return b.roles.slice(0, 2).join(' / ')
}
</script>
