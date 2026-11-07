<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PlugZap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PoE 供电功率预算器</h1>
          <p class="text-sm text-muted-foreground mt-1">摄像头/AP/门禁设备清单汇总 PD 功耗，乘余量系数得 PSE 需求，对照交换机预算与口数判超载</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线 PoE 供电功率预算器：做监控 / 无线覆盖工程先算电——把 IPC 摄像头（6W）、球机 PTZ（25W）、WiFi AP（15W）、门禁（12W）、
        IP 话机（8W）等 PD 设备加进清单，自动汇总设备端总功耗；乘上可调余量系数（默认 1.2）得到交换机 PSE 端需求，
        再对照你输入的交换机 PoE 总预算与供电口数，实时给出剩余预算、剩余口数与「超载红 / 正常绿」徽章。
        内置 802.3af / at / bt Type3 / Type4 标准功率对照表（PSE 端输出 / PD 端可用）与 Class 功率等级简表，
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：设备清单编辑 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <ListPlus class="w-5 h-5 mr-2 text-primary" /> PoE 设备清单
          </h2>
          <button type="button" class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition" @click="addRow">
            <Plus class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 添加设备
          </button>
        </div>

        <div v-for="(row, idx) in devices" :key="row.uid" class="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{{ idx + 1 }}</span>
            <select v-model="row.typeId" class="flex-1 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" :aria-label="'设备 ' + (idx + 1) + ' 类型'">
              <option v-for="t in DEVICE_TYPES" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
            <button type="button" class="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition" :aria-label="'删除设备 ' + (idx + 1)" @click="removeRow(row.uid)">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <div v-if="row.typeId === 'custom'" class="flex items-center gap-1.5">
              <label :for="'poe-pw-' + row.uid" class="text-xs text-muted-foreground">单台功率</label>
              <input :id="'poe-pw-' + row.uid" v-model.number="row.customPower" type="number" min="0.1" step="0.5" class="w-20 border border-border bg-background rounded-lg px-2 py-1.5 text-sm text-foreground font-mono">
              <span class="text-xs text-muted-foreground">W</span>
            </div>
            <div class="flex items-center gap-1.5">
              <label :for="'poe-qty-' + row.uid" class="text-xs text-muted-foreground">数量</label>
              <input :id="'poe-qty-' + row.uid" v-model.number="row.qty" type="number" min="1" max="48" step="1" class="w-16 border border-border bg-background rounded-lg px-2 py-1.5 text-sm text-foreground font-mono">
              <span class="text-xs text-muted-foreground">台</span>
            </div>
            <div class="flex items-center gap-1.5">
              <label :for="'poe-tier-' + row.uid" class="text-xs text-muted-foreground">标准档</label>
              <select :id="'poe-tier-' + row.uid" v-model="row.tierId" class="border border-border bg-background rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="t in POE_TIERS" :key="t.id" :value="t.id">{{ t.short }}</option>
              </select>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="px-2 py-0.5 rounded-full bg-muted/60 border border-border text-muted-foreground">PD 端 {{ fmtNum(rowPowerOf(row)) }}W/台 × {{ fmtNum(row.qty, 0) }} 台 = <b class="text-foreground">{{ fmtNum(rowWattsOf(row)) }}W</b></span>
            <span v-if="row.typeId !== 'custom'" class="px-2 py-0.5 rounded-full border" :class="tierFits(rowPowerOf(row), row.tierId) ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'">
              {{ tierFits(rowPowerOf(row), row.tierId) ? '适配 ' + tierOf(row.tierId).short : '超出 ' + tierOf(row.tierId).short + ' 的 PD 可用 ' + fmtNum(tierOf(row.tierId).pd) + 'W' }}
            </span>
          </div>
        </div>

        <p v-if="!devices.length" class="text-sm text-muted-foreground text-center py-6">清单为空，点击「添加设备」开始配置</p>

        <div>
          <label for="poe-margin" class="block text-sm font-medium text-foreground mb-1.5">余量系数：×{{ fmtNum(margin, 2) }}</label>
          <input id="poe-margin" v-model.number="margin" type="range" min="1" max="1.5" step="0.05" class="w-full accent-primary">
          <div class="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>1.0 理想值</span>
            <span>1.2 工程默认</span>
            <span>1.5 保守</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">PSE 需求 = 设备端总功耗 × 余量系数。系数用于覆盖线损、设备峰值与未来扩容，工程惯例取 1.2。</p>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition" @click="resetAll">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复示例清单
        </button>
      </div>

      <!-- 右：汇总与交换机对照 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <BatteryCharging class="w-5 h-5 mr-2 text-primary" /> 功率预算汇总
          </h2>
          <div v-if="summary" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">PD 端总功耗</p>
                <p class="text-3xl font-bold text-foreground">{{ fmtNum(summary.pdTotal) }}<span class="text-base font-medium text-muted-foreground ml-1">W</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ fmtNum(summary.portsUsed, 0) }} 台设备</p>
              </div>
              <div class="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">PSE 需求（×{{ fmtNum(margin, 2) }}）</p>
                <p class="text-3xl font-bold text-primary">{{ fmtNum(summary.pseNeed) }}<span class="text-base font-medium text-muted-foreground ml-1">W</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">交换机需提供的总功率</p>
              </div>
            </div>

            <!-- 交换机对照 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="poe-budget" class="block text-xs font-medium text-foreground mb-1">交换机 PoE 总预算（W）</label>
                <input id="poe-budget" v-model.number="switchBudget" type="number" min="1" step="1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
              </div>
              <div>
                <label for="poe-ports" class="block text-xs font-medium text-foreground mb-1">供电口数</label>
                <input id="poe-ports" v-model.number="switchPorts" type="number" min="1" max="48" step="1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
              </div>
            </div>

            <!-- 徽章判定 -->
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1.5 rounded-full text-xs font-semibold border" :class="verdict.powerOk ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'">
                {{ verdict.powerOk ? '功率正常' : '功率超载' }} · 剩余 {{ fmtNum(verdict.budgetLeft) }}W
              </span>
              <span class="px-3 py-1.5 rounded-full text-xs font-semibold border" :class="verdict.portsOk ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'">
                {{ verdict.portsOk ? '口数正常' : '口数不足' }} · 剩余 {{ fmtNum(verdict.portsLeft, 0) }} 口
              </span>
            </div>

            <p v-if="!verdict.powerOk" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>PSE 需求 {{ fmtNum(summary.pseNeed) }}W 超过交换机预算 {{ fmtNum(switchBudget) }}W：请减少设备、换更大预算机型，或拆到多台交换机。</span>
            </p>
            <p v-else-if="verdict.budgetLeft / switchBudget < 0.15" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>剩余预算不足 15%，后续加设备可能超载，建议选更大预算机型。</span>
            </p>

            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制预算清单
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">添加设备并填写交换机参数开始校验</p>
        </div>

        <!-- PoE 标准对照表（锚点成表） -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Cable class="w-5 h-5 mr-2 text-primary" /> IEEE 802.3 PoE 标准功率表
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-muted-foreground text-xs">
                  <th class="text-left px-3 py-2 font-medium">标准档</th>
                  <th class="text-right px-3 py-2 font-medium">PSE 端输出</th>
                  <th class="text-right px-3 py-2 font-medium">PD 端可用</th>
                  <th class="text-right px-3 py-2 font-medium">线缆损耗</th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr v-for="t in POE_TIERS" :key="'std-' + t.id" class="border-t border-border">
                  <td class="px-3 py-2 text-foreground">{{ t.label }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ t.pse }}W</td>
                  <td class="px-3 py-2 text-right font-mono">{{ t.pd }}W</td>
                  <td class="px-3 py-2 text-right font-mono">{{ fmtNum(t.pse - t.pd) }}W</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">PSE 端为交换机每口的输出功率上限，PD 端为设备在 100m 网线末端可用的保证功率，差值即百米通道的线缆损耗预算（按最坏 100m 线路计）。</p>
        </div>
      </div>
    </div>

    <!-- SEO 可折叠区 -->
    <details open class="bg-card border border-border rounded-lg p-6 mb-6">
      <summary class="cursor-pointer select-none text-lg font-semibold text-foreground">标准依据、Class 功率等级与常见问题（FAQ）</summary>
      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算口径</h3>
          <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>PD 端总功耗 = Σ(单台功率 × 数量)，按设备额定功耗取值。</li>
            <li>PSE 需求 = PD 端总功耗 × 余量系数（1.0~1.5 可调，默认 1.2，覆盖线损 / 峰值 / 扩容）。</li>
            <li>判定：PSE 需求 ≤ 交换机 PoE 总预算且设备总数 ≤ 供电口数 即「正常」，任一超出即「超载」。</li>
            <li>标准表：802.3af = 15.4W / 12.95W、802.3at = 30W / 25.5W、802.3bt Type3 = 60W / 51W、Type4 = 90W / 71W（PSE 端 / PD 端）。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">PD 功率等级（Class）简表</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-muted-foreground text-xs">
                  <th class="text-left px-3 py-2 font-medium">Class</th>
                  <th class="text-right px-3 py-2 font-medium">PSE 端预留</th>
                  <th class="text-right px-3 py-2 font-medium">PD 端功率范围</th>
                  <th class="text-left px-3 py-2 font-medium">备注</th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">Class 0</td><td class="px-3 py-2 text-right font-mono">15.4W</td><td class="px-3 py-2 text-right font-mono">0.44 ~ 12.95W</td><td class="px-3 py-2">未分级默认档</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">Class 1</td><td class="px-3 py-2 text-right font-mono">4.0W</td><td class="px-3 py-2 text-right font-mono">0.44 ~ 3.84W</td><td class="px-3 py-2">超低功耗</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">Class 2</td><td class="px-3 py-2 text-right font-mono">7.0W</td><td class="px-3 py-2 text-right font-mono">3.84 ~ 6.49W</td><td class="px-3 py-2">低功耗</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">Class 3</td><td class="px-3 py-2 text-right font-mono">15.4W</td><td class="px-3 py-2 text-right font-mono">6.49 ~ 12.95W</td><td class="px-3 py-2">主流 IPC 档</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">Class 4</td><td class="px-3 py-2 text-right font-mono">30W</td><td class="px-3 py-2 text-right font-mono">12.95 ~ 25.5W</td><td class="px-3 py-2">需 802.3at PSE</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">802.3bt 另扩展 Class 5~8（对应 45/40、60/51、75/60、90/71W，PSE/PD 端）。Class 0~4 分级依据 IEEE 802.3af/at：Class 4 电气签名在纯 af 交换机上按 Class 0 处理，仅 at（PoE+）及以上能真正输出 30W。以上为 IEEE 802.3 标准公开口径，以现行标准原文为准。</p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">百米网损去哪了？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            PoE 走的是双绞线直流供电，回路电阻在 100m 五类 / 六类线上约有 12.5Ω~25Ω（依线规），电流流过即发热损耗。
            标准按最坏 100m 线路预留：af 档 PSE 出 15.4W、线端保 12.95W，差值 2.45W 就是线损预算；at 档 30W→25.5W 差 4.5W；
            bt 档因电流更大、用全部 4 对线供电，Type4 为 90W→71W 差 19W。线越短损耗越小、发热越少——
            长距离供电时 PD 端「可用功率」按上表 PD 列取值最稳妥，别拿 PSE 端数字当设备可用功率。
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">8 个摄像头该选多大预算的交换机？</h3>
            <p class="text-sm text-muted-foreground mt-1">8 台普通 IPC（各 6W）PD 端共 48W，乘 1.2 余量 PSE 需求 57.6W——af 总预算机型（常见 8 口 60W~96W）即可；若其中有云台球机（25W），整机需求明显上升，应选 at 及以上、总预算 120W+ 的机型，并确认球机所接口支持 at。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">余量系数为什么要留 1.2？</h3>
            <p class="text-sm text-muted-foreground mt-1">三重用途：一是线缆损耗随长度增加；二是 PTZ 转动、红外补光全开时设备瞬时功率会超过标称值；三是为后续加装设备留空间。预算紧张时可降到 1.0~1.1，重要项目建议 1.3 以上。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">af 交换机能带 25W 球机吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。802.3af 每口 PD 端最多 12.95W，25W 球机至少需要 802.3at（PD 端 25.5W）档；若球机带加热器 / 大功率红外，可能需要 bt Type3（51W）甚至 Type4（71W）。设备规格书的功耗需求要与端口标准档逐一核对。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。设备清单、功率汇总与预算校验全部在你的浏览器内完成，无网络请求，参数不被保存或上传。</p>
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground border-t border-border pt-3">数据来源：IEEE 802.3af / 802.3at / 802.3bt 标准公开功率值（af=15.4/12.95W、at=30/25.5W、bt Type3=60/51W、Type4=90/71W），与 Wikipedia「Power over Ethernet」等公开资料交叉核对；设备功耗预设为典型值，以设备规格书与现行标准原文为准。</p>
      </div>
    </details>

    <RelatedTools :currentToolId="'poe-power-budget'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlugZap, ListPlus, Plus, Trash2, RefreshCw, BatteryCharging, Cable, Copy, TriangleAlert, Info } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'PoE 供电功率预算器 - 802.3af/at/bt 功率与交换机预算校验 | 有条工具',
  description: '免费在线 PoE 供电功率预算器：IPC 摄像头/球机/WiFi AP/门禁/IP 话机设备清单实时汇总 PD 端功耗，乘 1.0~1.5 余量系数得 PSE 需求，对照交换机 PoE 总预算与供电口数给超载告警，内置 802.3af=15.4/12.95W、at=30/25.5W、bt Type3=60/51W、Type4=90/71W 标准表与 Class 0-4 功率等级，纯浏览器本地计算不上传',
  keywords: 'PoE 供电计算,PoE 交换机功率预算,802.3af 功率,802.3at,802.3bt,PD PSE 功率,PoE 口数',
  author: '有条工具',
  ogTitle: 'PoE 供电功率预算器 - 802.3af/at/bt 功率与交换机预算校验 | 有条工具',
  ogDescription: '设备清单汇总 PD 功耗，余量系数算 PSE 需求，对照交换机预算与口数实时判超载。',
  ogUrl: 'https://www.util.cn/tools/poe-power-budget',
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
          name: 'PoE 供电功率预算器',
          url: 'https://www.util.cn/tools/poe-power-budget',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'IPC/球机/AP/门禁/IP 话机设备清单编辑与数量汇总',
            '自定义设备功率与 af/at/bt-T3/bt-T4 标准档标注',
            'PD 端总功耗 × 余量系数（1.0~1.5）= PSE 需求',
            '交换机 PoE 总预算与供电口数对照、超载红绿徽章',
            '802.3af/at/bt Type3/Type4 标准功率表',
            'Class 0-4 功率等级简表与百米线损说明',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'PoE 供电功率预算器', item: 'https://www.util.cn/tools/poe-power-budget' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '8 个摄像头该选多大预算的交换机？',
              acceptedAnswer: { '@type': 'Answer', text: '8 台 6W IPC 的 PD 端总功耗 48W，乘 1.2 余量系数得 PSE 需求 57.6W，选 af 总预算 60W 以上机型即可；含 25W 球机时应选 at 及以上、总预算 120W 以上机型。' }
            },
            {
              '@type': 'Question',
              name: '余量系数为什么要留 1.2？',
              acceptedAnswer: { '@type': 'Answer', text: '覆盖线缆损耗、设备瞬时峰值（PTZ 转动、红外全开）与后续扩容。预算紧张可降至 1.0~1.1，重要项目建议 1.3 以上。' }
            },
            {
              '@type': 'Question',
              name: 'af 交换机能带 25W 球机吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。802.3af 每口 PD 端最多 12.95W，25W 球机至少需要 802.3at（PD 端 25.5W）；带加热器或大功率红外可能需要 bt Type3（51W）甚至 Type4（71W）。' }
            },
            {
              '@type': 'Question',
              name: 'PSE 端 15.4W 为什么到设备只剩 12.95W？',
              acceptedAnswer: { '@type': 'Answer', text: '差值是标准为最坏 100m 双绞线预留的线缆损耗预算：100m 线路回路电阻约 12.5~25Ω，直流电流流过即发热损耗。af 档预留 2.45W，at 档 4.5W，bt Type4 为 19W。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== 纯逻辑与静态数据（单测区开始） =====
// 单位约定：功率 W。标准口径（IEEE 802.3 公开值）：PSE 端=交换机每口输出上限，PD 端=100m 线末端可用保证功率。

// PoE 标准档（锚点表：PSE 端输出 / PD 端可用，差值为百米线缆损耗预算）
const POE_TIERS = [
  { id: 'af', label: '802.3af（PoE）', short: 'af', pse: 15.4, pd: 12.95 },
  { id: 'at', label: '802.3at（PoE+）', short: 'at', pse: 30, pd: 25.5 },
  { id: 'bt3', label: '802.3bt Type3', short: 'bt-T3', pse: 60, pd: 51 },
  { id: 'bt4', label: '802.3bt Type4', short: 'bt-T4', pse: 90, pd: 71 }
]

// 设备类型预设（PD 端额定功耗典型值，可自定义）
const DEVICE_TYPES = [
  { id: 'ipc', label: 'IPC 摄像头（6W）', power: 6 },
  { id: 'ptz', label: '球机 PTZ（25W）', power: 25 },
  { id: 'ap', label: 'WiFi AP（15W）', power: 15 },
  { id: 'access', label: '门禁（12W）', power: 12 },
  { id: 'phone', label: 'IP 话机（8W）', power: 8 },
  { id: 'custom', label: '自定义功率…', custom: true }
]

// PD 功率等级（IEEE 802.3af/at Class 0-4，PSE 端预留 / PD 端功率范围）
const POE_CLASSES = [
  { cls: 0, pse: 15.4, pdMin: 0.44, pdMax: 12.95, note: '未分级默认档' },
  { cls: 1, pse: 4.0, pdMin: 0.44, pdMax: 3.84, note: '超低功耗' },
  { cls: 2, pse: 7.0, pdMin: 3.84, pdMax: 6.49, note: '低功耗' },
  { cls: 3, pse: 15.4, pdMin: 6.49, pdMax: 12.95, note: '主流 IPC 档' },
  { cls: 4, pse: 30, pdMin: 12.95, pdMax: 25.5, note: '需 802.3at PSE' }
]

// 单行设备功率（W）：自定义取 customPower，否则取类型预设
function rowPowerOf(row) {
  if (!row) return 0
  if (row.typeId === 'custom') {
    const p = Number(row.customPower)
    return Number.isFinite(p) && p > 0 ? p : 0
  }
  const t = DEVICE_TYPES.find((d) => d.id === row.typeId)
  return t && !t.custom ? t.power : 0
}

// 单行合计（W）= 单台功率 × 数量
function rowWattsOf(row) {
  const q = Number(row ? row.qty : NaN)
  const qty = Number.isFinite(q) && q > 0 ? q : 0
  return rowPowerOf(row) * qty
}

// PD 端总功耗 = Σ(单台功率 × 数量)
function pdTotalOf(rows) {
  if (!Array.isArray(rows)) return 0
  return rows.reduce((sum, r) => sum + rowWattsOf(r), 0)
}

// PSE 需求 = PD 端总功耗 × 余量系数
function pseDemandOf(pdTotalW, margin) {
  const p = Number(pdTotalW)
  const m = Number(margin)
  if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(m) || m <= 0) return 0
  return p * m
}

// 标准档查询
function tierOf(tierId) {
  return POE_TIERS.find((t) => t.id === tierId) || POE_TIERS[0]
}

// 设备功率是否不超过某标准档 PD 端可用功率
function tierFits(powerW, tierId) {
  const p = Number(powerW)
  return Number.isFinite(p) && p > 0 && p <= tierOf(tierId).pd
}

// 预算校验：rows 设备清单、margin 余量系数、switchBudgetW 交换机 PoE 总预算、switchPorts 供电口数
function budgetCheck(switchBudgetW, switchPorts, rows, margin) {
  const budget = Number(switchBudgetW)
  const ports = Number(switchPorts)
  const portsUsed = Array.isArray(rows) ? rows.reduce((sum, r) => {
    const q = Number(r ? r.qty : NaN)
    return sum + (Number.isFinite(q) && q > 0 ? q : 0)
  }, 0) : 0
  const pdTotal = pdTotalOf(rows)
  const pseNeed = pseDemandOf(pdTotal, margin)
  const budgetOk = Number.isFinite(budget) && budget > 0 && pseNeed <= budget
  const portsOk = Number.isFinite(ports) && ports > 0 && portsUsed <= ports
  return {
    pdTotal,
    pseNeed,
    portsUsed,
    budgetLeft: Number.isFinite(budget) ? budget - pseNeed : null,
    portsLeft: Number.isFinite(ports) ? ports - portsUsed : null,
    powerOk: budgetOk,
    portsOk,
    ok: budgetOk && portsOk
  }
}

// 千分位数字格式化：去除多余小数零，非法输入返回 '—'
function fmtNum(n, digits) {
  const d = digits === undefined ? 2 : digits
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 })
}
// ===== 单测区结束 =====

// ---------- 响应式状态 ----------
let uidSeq = 1
function makeRow(typeId, qty, tierId, customPower) {
  return { uid: uidSeq++, typeId, qty, tierId: tierId || 'af', customPower: customPower === undefined ? 10 : customPower }
}

const devices = ref([
  makeRow('ipc', 4, 'af'),
  makeRow('ptz', 1, 'at'),
  makeRow('ap', 1, 'at')
])
const margin = ref(1.2)
const switchBudget = ref(120)
const switchPorts = ref(8)

const summary = computed(() => {
  if (!devices.value.length) return null
  const pdTotal = pdTotalOf(devices.value)
  return {
    pdTotal,
    portsUsed: devices.value.reduce((sum, r) => sum + (Number(r.qty) > 0 ? Number(r.qty) : 0), 0),
    pseNeed: pseDemandOf(pdTotal, margin.value)
  }
})

const verdict = computed(() => budgetCheck(switchBudget.value, switchPorts.value, devices.value, margin.value))

const listText = computed(() => {
  if (!summary.value) return ''
  const lines = devices.value.map((r, i) => {
    const t = DEVICE_TYPES.find((d) => d.id === r.typeId)
    const pw = rowPowerOf(r)
    return `${i + 1}. ${t ? t.label.replace(/（.*）/, '') : '设备'} ${pw}W × ${r.qty} 台（${tierOf(r.tierId).short}）= ${fmtNum(rowWattsOf(r))}W`
  })
  return [
    'PoE 供电功率预算清单（IEEE 802.3af/at/bt）',
    ...lines,
    `PD 端总功耗：${fmtNum(summary.value.pdTotal)}W`,
    `PSE 需求（×${fmtNum(margin.value, 2)} 余量）：${fmtNum(summary.value.pseNeed)}W`,
    `交换机：总预算 ${fmtNum(switchBudget.value)}W / 供电 ${fmtNum(switchPorts.value, 0)} 口 → ${verdict.value.powerOk && verdict.value.portsOk ? '正常' : '超载'}（剩余功率 ${fmtNum(verdict.value.budgetLeft)}W，剩余口 ${fmtNum(verdict.value.portsLeft, 0)}）`
  ].join('\n')
})

// ---------- 交互动作 ----------
function addRow() {
  devices.value.push(makeRow('ipc', 1, 'af'))
}

function removeRow(uid) {
  devices.value = devices.value.filter((r) => r.uid !== uid)
}

function resetAll() {
  devices.value = [makeRow('ipc', 4, 'af'), makeRow('ptz', 1, 'at'), makeRow('ap', 1, 'at')]
  margin.value = 1.2
  switchBudget.value = 120
  switchPorts.value = 8
}

async function copyResult() {
  const text = listText.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动复制')
  }
}

onMounted(() => {
  addRecentTool('poe-power-budget')
})
</script>
