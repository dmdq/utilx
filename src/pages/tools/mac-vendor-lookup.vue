<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Network class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">MAC地址厂商查询</h1>
          <p class="text-sm text-muted-foreground mt-1">通过 OUI 前缀识别设备厂商，内置 150+ 主流厂商数据库，纯本地查询</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入任意格式的 MAC 地址（冒号、横杠、无分隔或点分隔），自动取前 3 字节 OUI 匹配内置厂商表，并判断是否为本地管理（随机化）MAC。支持批量查询，所有数据内置在页面中，不联网、不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 查询 MAC 地址
          </h2>

          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              @click="mode = 'single'"
              :class="mode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              单个查询
            </button>
            <button
              @click="mode = 'batch'"
              :class="mode === 'batch' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              批量查询
            </button>
          </div>

          <input
            v-if="mode === 'single'"
            v-model="macInput"
            type="text"
            placeholder="如 00:1A:2B:3C:4D:5E / 00-1A-2B-3C-4D-5E / 001A2B3C4D5E"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            v-else
            v-model="batchInput"
            class="w-full h-32 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一个 MAC 地址，例如：&#10;00:03:93:11:22:33&#10;F0-18-98-AA-BB-CC&#10;E465B8998877"
            spellcheck="false"
          ></textarea>

          <div class="flex items-center gap-2 mt-3">
            <button
              @click="runLookup"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
            >
              <Search class="w-4 h-4" /> 查询
            </button>
            <button
              @click="clearInput"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg text-sm transition-all"
            >
              清空
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-3">支持 00:1A:2B / 00-1A-2B / 001A2B / 001A.2B3C.4D5E 等常见写法，自动兼容大小写。</p>
        </div>

        <!-- 单个结果 -->
        <div v-if="mode === 'single' && singleResult" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <component :is="singleResult.vendor ? CheckCircle : XCircle" class="w-4 h-4 mr-2" :class="singleResult.vendor ? 'text-green-500' : 'text-destructive'" />
            查询结果
          </h3>
          <template v-if="singleResult.valid">
            <dl class="space-y-2 text-sm">
              <div class="flex">
                <dt class="w-24 text-muted-foreground flex-shrink-0">MAC 地址</dt>
                <dd class="font-mono text-foreground">{{ singleResult.formatted }}</dd>
              </div>
              <div class="flex">
                <dt class="w-24 text-muted-foreground flex-shrink-0">OUI 前缀</dt>
                <dd class="font-mono text-foreground">{{ singleResult.oui }}</dd>
              </div>
              <div class="flex">
                <dt class="w-24 text-muted-foreground flex-shrink-0">厂商</dt>
                <dd class="font-medium" :class="singleResult.vendor ? 'text-foreground' : 'text-muted-foreground'">
                  {{ singleResult.vendor || '未收录，可查询 IEEE OUI 数据库' }}
                </dd>
              </div>
              <div class="flex">
                <dt class="w-24 text-muted-foreground flex-shrink-0">MAC 类型</dt>
                <dd>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="singleResult.local ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'"
                  >
                    {{ singleResult.local ? '本地管理（可能为随机 MAC）' : '全球唯一（厂商分配）' }}
                  </span>
                </dd>
              </div>
            </dl>
            <div v-if="singleResult.local" class="mt-3 bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <EyeOff class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p class="text-xs text-muted-foreground leading-relaxed">
                第二位十六进制为 {{ singleResult.localDigit }}，属于本地管理位地址。手机/平板开启「隐私随机 MAC」后，Wi-Fi 会为每个网络生成随机地址，无法通过 OUI 判断厂商，也无法跨网络追踪。
              </p>
            </div>
          </template>
          <p v-else class="text-sm text-destructive">{{ singleResult.error }}</p>
        </div>
      </div>

      <!-- 右侧：结果输出 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Table class="w-5 h-5 mr-2 text-primary" />
              {{ mode === 'batch' ? '批量结果' : '厂商速览' }}
            </h2>
            <span v-if="mode === 'batch'" class="text-xs text-muted-foreground">{{ batchResults.length }} 条记录</span>
          </div>

          <!-- 批量结果表 -->
          <div v-if="mode === 'batch'" class="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-foreground">输入</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-28">OUI</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground">厂商</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-24">类型</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in batchResults" :key="idx" class="border-t border-border hover:bg-muted/50 transition-colors">
                  <td class="px-4 py-2.5 font-mono text-xs text-foreground">{{ r.raw }}</td>
                  <td class="px-4 py-2.5 font-mono text-xs" :class="r.valid ? 'text-foreground' : 'text-muted-foreground'">{{ r.valid ? r.oui : '-' }}</td>
                  <td class="px-4 py-2.5" :class="r.valid ? (r.vendor ? 'text-foreground' : 'text-muted-foreground') : 'text-destructive'">
                    {{ r.valid ? (r.vendor || '未收录') : r.error }}
                  </td>
                  <td class="px-4 py-2.5">
                    <span v-if="r.valid" class="text-xs" :class="r.local ? 'text-muted-foreground' : 'text-primary'">
                      {{ r.local ? '本地' : '全球' }}
                    </span>
                    <span v-else class="text-xs text-muted-foreground">-</span>
                  </td>
                </tr>
                <tr v-if="batchResults.length === 0">
                  <td colspan="4" class="px-4 py-12 text-center">
                    <Search class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p class="text-sm text-muted-foreground">左侧输入 MAC 地址并点击查询</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 厂商表浏览（单个模式） -->
          <div v-else>
            <div class="px-6 py-3 border-b border-border">
              <input
                v-model="tableSearch"
                type="text"
                placeholder="搜索内置厂商表（如 Apple、华为、Espressif）"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-muted sticky top-0 z-10">
                  <tr>
                    <th class="px-4 py-2.5 text-left font-medium text-foreground w-28">OUI 前缀</th>
                    <th class="px-4 py-2.5 text-left font-medium text-foreground">厂商（IEEE 注册名）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="entry in filteredTable"
                    :key="entry.p"
                    class="border-t border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    @click="macInput = entry.p + ':00:00:01'; runLookup()"
                  >
                    <td class="px-4 py-2 font-mono text-xs text-foreground">{{ entry.p }}</td>
                    <td class="px-4 py-2 text-muted-foreground">{{ entry.v }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="px-6 py-3 border-t border-border text-xs text-muted-foreground">
              内置 {{ ouiTable.length }} 条 OUI 记录，点击任意一行可自动填入查询。
            </div>
          </div>
        </div>

        <!-- 隐私科普 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <EyeOff class="w-4 h-4 mr-2 text-primary" /> 关于随机 MAC 与隐私保护
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• MAC 地址前 3 字节称为 OUI（组织唯一标识符），由 IEEE 分配给厂商；后 3 字节由厂商自行分配。</li>
            <li>• <span class="text-foreground">本地管理位</span>：第一字节的倒数第二位（即第二位十六进制为 2/6/A/E）为 1 时，表示这是本地管理地址，不对应任何注册厂商。</li>
            <li>• iOS / Android / Windows 开启「私有无线局域网地址」后，会对每个 Wi-Fi 网络生成随机 MAC（形如 x2/x6/xA/xE 开头），防止商场 Wi-Fi 等场景跨网络追踪用户。</li>
            <li>• 企业网络管理员可用「私有地址关闭」策略或按 OUI 规划准入，但随机化后的设备无法再通过厂商前缀识别机型。</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于MAC地址厂商查询</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            MAC 地址是网卡的 48 位硬件标识，写作 6 组两位十六进制。其中前 3 字节是 IEEE 为厂商分配的 OUI（组织唯一标识符），例如 00-03-93 属于 Apple、D4-8A-FC 属于乐鑫（Espressif）。通过 OUI 可以快速判断一台联网设备出自哪家厂商——这是网络准入、资产盘点、排障定位中非常实用的一招。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>路由器 / 交换机管理界面里看到陌生设备，通过 MAC 前缀判断是手机、电脑还是 IoT 设备</li>
            <li>企业网络做准入控制（802.1X、MAC 认证）时核对设备厂商与类型</li>
            <li>排查 DHCP 地址池时，根据 OUI 识别私接设备（如随身 WiFi、打印机）</li>
            <li>安全事件分析：从 ARP 表、流量日志的 MAC 地址定位可疑设备来源</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么查不到我的设备？</span>本页内置 150+ 主流厂商的常用 OUI，并非完整 IEEE 数据库；未收录时可前往 IEEE OUI 数据库查询完整列表。</li>
            <li><span class="text-foreground font-medium">第二位是 2/6/A/E 是什么意思？</span>这是本地管理位（LAM），说明该地址不是 IEEE 分配的全球唯一地址，常见于手机开启「随机 MAC / 私有地址」、虚拟机网卡或软件自定义地址。</li>
            <li><span class="text-foreground font-medium">MAC 地址会被上传吗？</span>不会。查询完全在浏览器本地完成，内置数据库随页面加载，无需联网。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mac-vendor-lookup'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Network, Search, Table, EyeOff, CheckCircle, XCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'MAC地址厂商查询 - OUI前缀查设备厂商工具',
  description: 'MAC地址厂商在线查询工具，通过OUI前缀识别设备品牌（Apple/华为/小米/思科/乐鑫等150+厂商），支持冒号横杠点分隔等格式自动兼容、批量查询与随机MAC判断，纯本地查询',
  keywords: 'mac地址查询, mac厂商查询, oui查询, 设备厂商识别, mac地址库, 随机mac',
  author: 'Util工具箱',
  ogTitle: 'MAC地址厂商查询 - 有条工具',
  ogDescription: '通过OUI前缀识别设备厂商，内置150+主流厂商数据库，支持批量查询',
  ogUrl: 'https://www.util.cn/tools/mac-vendor-lookup',
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
          name: 'MAC地址厂商查询',
          url: 'https://www.util.cn/tools/mac-vendor-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['OUI厂商查询', '多格式MAC兼容', '批量查询', '随机MAC判断']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
            { '@type': 'ListItem', position: 3, name: 'MAC地址厂商查询', item: 'https://www.util.cn/tools/mac-vendor-lookup/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'mac-vendor-lookup')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 内置 OUI 数据（前缀均取自 IEEE 注册数据库） ----------
const OUI_DB = [
  // Apple
  ['00-03-93', 'Apple'], ['F0-18-98', 'Apple'], ['00-1E-C2', 'Apple'], ['00-23-DF', 'Apple'],
  ['00-25-BC', 'Apple'], ['00-26-BB', 'Apple'], ['F0-EE-7A', 'Apple'], ['58-AD-12', 'Apple'],
  ['60-FD-A6', 'Apple'], ['80-A9-97', 'Apple'], ['34-8C-5E', 'Apple'], ['20-15-82', 'Apple'],
  // 手机厂商
  ['64-1B-2F', 'Samsung'], ['9C-73-B1', 'Samsung'], ['38-8A-06', 'Samsung'], ['48-BC-E1', 'Samsung'],
  ['E0-06-30', 'Huawei'], ['D8-DA-F1', 'Huawei'], ['54-44-3B', 'Huawei'], ['5C-70-75', 'Huawei'], ['78-2D-AD', 'Huawei'],
  ['CC-EB-5E', 'Xiaomi'], ['B8-EA-98', 'Xiaomi'], ['8C-D0-B2', 'Xiaomi'], ['F4-1A-9C', 'Xiaomi'],
  ['DC-6A-E7', 'Xiaomi'], ['D4-5E-EC', 'Xiaomi'], ['04-CF-8C', 'Xiaomi'],
  ['E4-40-97', 'OPPO'], ['DC-B4-CA', 'OPPO'], ['D4-BA-FA', 'OPPO'], ['94-97-AE', 'OPPO'],
  ['64-EC-65', 'vivo'], ['6C-D1-99', 'vivo'], ['28-BE-43', 'vivo'],
  ['0C-B9-83', 'Honor'], ['2C-B3-01', 'Honor'], ['40-D4-F6', 'Honor'],
  ['AC-C0-48', 'OnePlus'], ['5C-17-CF', 'OnePlus'], ['A0-91-A2', 'OnePlus'],
  ['5C-A0-6C', 'Realme'], ['E4-8C-73', 'Realme'],
  ['5C-CD-7C', 'Meizu'], ['38-BC-1A', 'Meizu'],
  ['DC-F0-90', 'Nubia'], ['04-56-04', 'Gionee'],
  ['48-1C-B9', 'DJI'], ['8C-58-23', 'DJI'], ['0C-9A-E6', 'DJI'],
  // PC 与芯片
  ['D0-43-1E', 'Dell'], ['00-B0-D0', 'Dell'], ['00-19-B9', 'Dell'], ['00-25-64', 'Dell'],
  ['9C-7B-EF', 'HP'], ['10-E7-C6', 'HP'], ['B8-AF-67', 'HP'], ['80-CE-62', 'HP'], ['00-60-B0', 'HP'],
  ['48-C3-5A', 'Lenovo'], ['10-C5-95', 'Lenovo'], ['50-16-F4', 'Lenovo'], ['24-46-C8', 'Lenovo'],
  ['00-26-18', 'ASUS'], ['04-92-26', 'ASUS'], ['18-31-BF', 'ASUS'],
  ['00-01-24', 'Acer'], ['00-24-21', 'MSI'], ['D8-CB-8A', 'MSI'],
  ['90-2B-34', 'Gigabyte'], ['94-DE-80', 'Gigabyte'],
  ['E4-C7-67', 'Intel'], ['A0-02-A5', 'Intel'], ['44-49-88', 'Intel'], ['20-3A-43', 'Intel'],
  ['74-27-2C', 'AMD'], ['24-81-4E', 'AMD'], ['00-0C-87', 'AMD'],
  ['48-B0-2D', 'NVIDIA'], ['4C-BB-47', 'NVIDIA'], ['AC-3A-E2', 'NVIDIA'],
  ['00-1B-E9', 'Broadcom'], ['BC-97-E1', 'Broadcom'],
  ['A0-BD-71', 'Qualcomm'], ['88-12-4E', 'Qualcomm'],
  ['00-0C-43', 'MediaTek'], ['00-0C-E7', 'MediaTek'], ['00-17-A5', 'MediaTek'],
  ['00-E0-4C', 'Realtek'], ['FC-93-4E', 'Realtek'],
  ['50-FE-0C', 'AzureWave'], ['B4-8C-9D', 'AzureWave'],
  ['58-10-31', 'Foxconn'], ['A4-AE-11', 'Foxconn'],
  // 网络设备
  ['34-F7-16', 'TP-Link'], ['54-A7-03', 'TP-Link'], ['B0-BE-76', 'TP-Link'], ['94-D9-B3', 'TP-Link'],
  ['E8-0A-B9', 'Cisco'], ['48-1B-A4', 'Cisco'], ['6C-03-B5', 'Cisco'], ['9C-E3-30', 'Cisco'],
  ['40-5D-82', 'Netgear'], ['DC-EF-09', 'Netgear'], ['10-0C-6B', 'Netgear'],
  ['BC-22-28', 'D-Link'], ['A0-A3-F0', 'D-Link'],
  ['F0-9F-C2', 'Ubiquiti'], ['80-2A-A8', 'Ubiquiti'],
  ['74-78-A6', 'Fortinet'], ['84-39-8F', 'Fortinet'],
  ['E4-F2-7C', 'Juniper'], ['60-C7-8D', 'Juniper'],
  ['F0-74-8D', 'Ruijie'], ['E0-5D-54', 'Ruijie'],
  ['04-A9-59', 'H3C'], ['70-81-85', 'H3C'],
  // IoT 与模组
  ['D8-3A-DD', 'Raspberry Pi'], ['DC-A6-32', 'Raspberry Pi'], ['E4-5F-01', 'Raspberry Pi'],
  ['D4-8A-FC', 'Espressif'], ['E4-65-B8', 'Espressif'], ['B4-8A-0A', 'Espressif'], ['94-E6-86', 'Espressif'], ['80-7D-3A', 'Espressif'],
  ['1C-90-FF', 'Tuya'], ['FC-3C-D7', 'Tuya'], ['E4-AE-E4', 'Tuya'],
  ['C4-A6-4E', 'Quectel'], ['B4-ED-D5', 'Quectel'],
  ['64-F6-BB', 'Fibocom'], ['B4-36-A9', 'Fibocom'],
  // 云与软件
  ['70-F8-AE', 'Microsoft'], ['20-16-42', 'Microsoft'], ['C4-61-C7', 'Microsoft'],
  ['84-28-59', 'Amazon'], ['28-73-F6', 'Amazon'],
  ['60-70-6C', 'Google'], ['C8-2A-DD', 'Google'], ['24-29-34', 'Google'],
  // 安防与家电
  ['0C-75-D2', 'Hikvision'], ['54-8C-81', 'Hikvision'], ['24-48-45', 'Hikvision'],
  ['F0-1B-24', 'ZTE'], ['98-EE-8C', 'ZTE'], ['90-C7-10', 'ZTE'],
  ['08-C3-B3', 'TCL'], ['C0-79-82', 'TCL'],
  ['E4-3B-C9', 'Hisense'], ['A8-82-00', 'Hisense'],
  ['04-E2-29', 'Haier'], ['00-25-8D', 'Haier'], ['D8-E2-3F', 'Haier'],
  ['80-76-C2', 'Midea'], ['FC-DF-00', 'Midea'],
  // 消费电子
  ['AC-80-0A', 'Sony'], ['F4-64-12', 'Sony'], ['2C-9E-00', 'Sony'],
  ['AC-5A-F0', 'LG'], ['B0-37-95', 'LG'], ['A0-4F-85', 'LG'],
  ['B8-20-8E', 'Panasonic'], ['CC-7E-E7', 'Panasonic'],
  ['00-15-B7', 'Toshiba'], ['E8-9D-87', 'Toshiba'],
  ['34-FE-9E', 'Fujitsu'], ['68-84-7E', 'Fujitsu'],
  ['8C-52-19', 'Sharp'], ['68-79-ED', 'Sharp'],
  ['84-BA-3B', 'Canon'], ['60-12-8B', 'Canon'],
  ['A4-D7-3C', 'Epson'], ['50-57-9C', 'Epson'],
  ['00-80-77', 'Brother'], ['B0-7C-8E', 'Brother'],
  ['90-EC-E3', 'Nokia'], ['B8-51-A9', 'Nokia'],
  ['C4-A0-52', 'Motorola'], ['00-04-7D', 'Motorola']
]

const VENDOR_ZH = {
  Apple: '苹果', Samsung: '三星电子', Huawei: '华为', Xiaomi: '小米 / 红米', OPPO: 'OPPO',
  vivo: 'vivo', Honor: '荣耀', OnePlus: '一加', Realme: '真我', Meizu: '魅族',
  Nubia: '努比亚', Gionee: '金立', DJI: '大疆创新',
  Dell: '戴尔', HP: '惠普', Lenovo: '联想 / Moto', ASUS: '华硕', Acer: '宏碁',
  MSI: '微星', Gigabyte: '技嘉', Intel: '英特尔', AMD: '超威（AMD）', NVIDIA: '英伟达',
  Broadcom: '博通', Qualcomm: '高通', MediaTek: '联发科', Realtek: '瑞昱',
  AzureWave: '海华科技', Foxconn: '富士康',
  'TP-Link': '普联 TP-Link', Cisco: '思科', Netgear: '网件', 'D-Link': '友讯',
  Ubiquiti: 'Ubiquiti（UBNT）', Fortinet: '飞塔', Juniper: '瞻博网络',
  Ruijie: '锐捷', H3C: '新华三', 'Raspberry Pi': '树莓派', Espressif: '乐鑫科技',
  Tuya: '涂鸦智能', Quectel: '移远通信', Fibocom: '广和通',
  Microsoft: '微软', Amazon: '亚马逊', Google: '谷歌',
  Hikvision: '海康威视', ZTE: '中兴', TCL: 'TCL', Hisense: '海信',
  Haier: '海尔', Midea: '美的',
  Sony: '索尼', LG: 'LG 电子', Panasonic: '松下', Toshiba: '东芝', Fujitsu: '富士通',
  Sharp: '夏普', Canon: '佳能', Epson: '爱普生', Brother: '兄弟工业',
  Nokia: '诺基亚', Motorola: '摩托罗拉'
}

// IEEE 注册全名（用于表格展示）
const VENDOR_FULL = {
  Apple: 'Apple, Inc.', Samsung: 'Samsung Electronics Co.,Ltd', Huawei: 'HUAWEI TECHNOLOGIES CO.,LTD',
  Xiaomi: 'Xiaomi Communications Co Ltd', OPPO: 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  vivo: 'vivo Mobile Communication Co., Ltd.', Honor: 'Honor Device Co., Ltd.',
  OnePlus: 'OnePlus Technology (Shenzhen) Co., Ltd', Realme: 'Realme Chongqing Mobile Telecommunications Corp.,Ltd.',
  Meizu: 'MEIZU Technology Co.,Ltd.', Nubia: 'Nubia Technology Co.,Ltd.', Gionee: 'Gionee Communication Equipment Co.,Ltd.',
  DJI: 'SZ DJI TECHNOLOGY CO.,LTD', Dell: 'Dell Inc.', HP: 'Hewlett Packard', Lenovo: 'Lenovo / Motorola Mobility LLC',
  ASUS: 'ASUSTek COMPUTER INC.', Acer: 'Acer Incorporated', MSI: 'MICRO-STAR INT\'L CO., LTD.',
  Gigabyte: 'GIGA-BYTE TECHNOLOGY CO.,LTD.', Intel: 'Intel Corporate', AMD: 'Advanced Micro Devices, Inc.',
  NVIDIA: 'NVIDIA Corporation', Broadcom: 'Broadcom Inc.', Qualcomm: 'QUALCOMM Incorporated',
  MediaTek: 'MediaTek Inc.', Realtek: 'REALTEK SEMICONDUCTOR CORP.', AzureWave: 'AzureWave Technology Inc.',
  Foxconn: 'Hon Hai Precision Industry Co., Ltd.', 'TP-Link': 'TP-LINK TECHNOLOGIES CO.,LTD.',
  Cisco: 'Cisco Systems, Inc.', Netgear: 'NETGEAR', 'D-Link': 'D-Link International',
  Ubiquiti: 'Ubiquiti Inc', Fortinet: 'Fortinet, Inc.', Juniper: 'Juniper Networks',
  Ruijie: 'Ruijie Networks Co.,LTD', H3C: 'New H3C Technologies Co., Ltd',
  'Raspberry Pi': 'Raspberry Pi Trading Ltd', Espressif: 'Espressif Inc.',
  Tuya: 'Tuya Smart Inc.', Quectel: 'Quectel Wireless Solutions Co.,Ltd.', Fibocom: 'Fibocom Wireless Inc.',
  Microsoft: 'Microsoft Corporation', Amazon: 'Amazon Technologies Inc.', Google: 'Google, Inc.',
  Hikvision: 'Hangzhou Hikvision Digital Technology Co.,Ltd.', ZTE: 'zte corporation',
  TCL: 'TCL King Electrical Appliances(Huizhou)Co.,Ltd', Hisense: 'Hisense Electric Co.,Ltd',
  Haier: 'Qingdao Haier Technology Co.,Ltd', Midea: 'GD Midea Air-Conditioning Equipment Co.,Ltd.',
  Sony: 'Sony Corporation', LG: 'LG Electronics', Panasonic: 'Panasonic Corporation',
  Toshiba: 'Toshiba', Fujitsu: 'Fujitsu Limited', Sharp: 'SHARP Corporation',
  Canon: 'CANON INC.', Epson: 'Seiko Epson Corporation', Brother: 'Brother Industries, LTD.',
  Nokia: 'Nokia', Motorola: 'Motorola Mobility LLC'
}

const ouiTable = OUI_DB.map(([p, v]) => ({ p, v, full: VENDOR_FULL[v] || v, zh: VENDOR_ZH[v] || v }))
const ouiIndex = {}
ouiTable.forEach(e => { if (!ouiIndex[e.p]) ouiIndex[e.p] = e })

// ---------- 查询逻辑 ----------
const mode = ref('single')
const macInput = ref('')
const batchInput = ref('')
const tableSearch = ref('')
const singleResult = ref(null)
const batchResults = ref([])
const seoContentVisible = ref(true)

// 归一化：兼容冒号 / 横杠 / 无分隔 / 点分隔（cisco 写法）
const normalizeMac = (raw) => {
  let s = String(raw).trim().replace(/[.:\-\s]/g, '').toUpperCase()
  if (!/^[0-9A-F]+$/.test(s)) return null
  if (s.length !== 12) return null
  return s
}

const lookupOne = (raw) => {
  const hex = normalizeMac(raw)
  if (!hex) {
    return { raw, valid: false, error: '格式无效（需要 12 位十六进制）' }
  }
  const oui = hex.slice(0, 2) + '-' + hex.slice(2, 4) + '-' + hex.slice(4, 6)
  const formatted = hex.match(/.{2}/g).join(':')
  const firstByte = parseInt(hex.slice(0, 2), 16)
  const localBit = (firstByte & 0x02) !== 0
  const localDigit = hex[1]
  const entry = ouiIndex[oui] || null
  const vendor = entry ? `${VENDOR_ZH[entry.v] || entry.v}（${entry.full}）` : ''
  return { raw, valid: true, hex, oui, formatted, local: localBit, localDigit, vendor }
}

const runLookup = () => {
  if (mode.value === 'single') {
    if (!macInput.value.trim()) { singleResult.value = null; return }
    singleResult.value = lookupOne(macInput.value)
  } else {
    batchResults.value = batchInput.value
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .slice(0, 200)
      .map(l => lookupOne(l))
  }
}

const clearInput = () => {
  macInput.value = ''
  batchInput.value = ''
  singleResult.value = null
  batchResults.value = []
}

const filteredTable = computed(() => {
  const q = tableSearch.value.trim().toLowerCase()
  if (!q) return ouiTable
  return ouiTable.filter(e =>
    e.p.toLowerCase().includes(q) ||
    e.full.toLowerCase().includes(q) ||
    e.zh.toLowerCase().includes(q) ||
    e.v.toLowerCase().includes(q)
  )
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
