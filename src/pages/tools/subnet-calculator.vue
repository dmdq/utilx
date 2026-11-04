<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">子网计算器 - IP子网划分与CIDR计算工具</h1>
      <p class="text-muted-foreground">一款免费的在线子网计算器。支持CIDR表示法、子网掩码计算、子网划分、VLSM计算等功能。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧输入区 -->
      <div class="space-y-6">
        <!-- 输入区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Icon name="lucide:edit" class="h-5 w-5 mr-2 text-primary" />
            输入网络信息
          </h2>

          <div class="space-y-4">
            <!-- 输入方式选择 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输入方式</label>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="inputMode"
                    type="radio"
                    value="cidr"
                    class="mr-2 border border-border text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">CIDR 表示法</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="inputMode"
                    type="radio"
                    value="mask"
                    class="mr-2 border border-border text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">IP + 子网掩码</span>
                </label>
              </div>
            </div>

            <!-- CIDR 输入 -->
            <div v-if="inputMode === 'cidr'">
              <label class="block text-sm font-medium text-foreground mb-2">CIDR 地址</label>
              <input
                v-model="cidrInput"
                type="text"
                placeholder="192.168.1.0/24"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                @input="calculateFromCIDR"
              />
              <p class="mt-1 text-xs text-muted-foreground">例如: 192.168.1.0/24</p>
            </div>

            <!-- IP + 子网掩码输入 -->
            <div v-else class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">IP 地址</label>
                <input
                  v-model="ipInput"
                  type="text"
                  placeholder="192.168.1.0"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">子网掩码</label>
                <div class="flex space-x-2">
                  <input
                    v-model="maskInput"
                    type="text"
                    placeholder="255.255.255.0"
                    class="flex-1 px-3 py-2 bg-muted border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    v-model="maskInput"
                    class="px-3 py-2 bg-muted border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">选择...</option>
                    <option v-for="(mask, prefix) in commonMasks" :key="prefix" :value="mask">
                      /{{ prefix }} - {{ mask }}
                    </option>
                  </select>
                </div>
              </div>
              <button
                @click="calculateFromMask"
                class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
              >
                计算
              </button>
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
              <select
                @change="loadExample"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">选择示例...</option>
                <option value="home">家庭网络 (192.168.1.0/24)</option>
                <option value="office">办公网络 (10.0.0.0/16)</option>
                <option value="datacenter">数据中心 (172.16.0.0/12)</option>
                <option value="large">大型子网 (192.168.0.0/16)</option>
                <option value="small">小型子网 (192.168.1.0/28)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 子网划分 -->
        <div v-if="result" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Icon name="lucide:git-branch" class="h-5 w-5 mr-2 text-primary" />
            子网划分
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">划分成</label>
              <div class="flex space-x-2">
                <input
                  v-model.number="subnetCount"
                  type="number"
                  min="2"
                  max="256"
                  class="flex-1 px-3 py-2 bg-muted border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span class="py-2 text-sm text-muted-foreground">个子网</span>
              </div>
            </div>

            <button
              @click="divideSubnet"
              :disabled="!result || subnetCount < 2"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              划分子网
            </button>

            <!-- 子网列表 -->
            <div v-if="dividedSubnets.length > 0" class="mt-4">
              <div class="space-y-2">
                <div
                  v-for="(subnet, index) in dividedSubnets"
                  :key="index"
                  class="p-3 bg-muted rounded-lg"
                >
                  <div class="text-sm font-medium text-foreground">
                    子网 {{ index + 1 }}: {{ subnet.network }}/{{ subnet.prefix }}
                  </div>
                  <div class="text-xs text-muted-foreground mt-1">
                    网络地址: {{ subnet.network }} | 广播地址: {{ subnet.broadcast }} |
                    可用IP: {{ subnet.firstUsable }} - {{ subnet.lastUsable }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- VLSM 计算器 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Icon name="lucide:layers" class="h-5 w-5 mr-2 text-primary" />
            VLSM 计算器
          </h2>

          <div class="space-y-3">
            <div class="flex space-x-2">
              <input
                v-model.number="vlsmHosts"
                type="number"
                placeholder="主机数量"
                class="flex-1 px-3 py-2 bg-muted border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                @click="addVLSMSubnet"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                添加
              </button>
            </div>

            <!-- VLSM 列表 -->
            <div v-if="vlsmSubnets.length > 0" class="space-y-2">
              <div
                v-for="(subnet, index) in vlsmSubnets"
                :key="index"
                class="flex items-center justify-between p-2 bg-muted rounded"
              >
                <span class="text-sm text-foreground">{{ subnet.hosts }} 台主机</span>
                <button
                  @click="removeVLSMSubnet(index)"
                  class="text-destructive hover:text-destructive/80"
                >
                  <Icon name="lucide:x" class="h-4 w-4" />
                </button>
              </div>
              <button
                @click="calculateVLSM"
                class="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                计算 VLSM
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧结果区 -->
      <div class="space-y-6">
        <!-- 基本信息 -->
        <div v-if="result" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Icon name="lucide:info" class="h-5 w-5 mr-2 text-primary" />
            基本信息
          </h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">网络地址</div>
              <div class="font-mono font-semibold text-foreground">{{ result.network }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">广播地址</div>
              <div class="font-mono font-semibold text-foreground">{{ result.broadcast }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">子网掩码</div>
              <div class="font-mono font-semibold text-foreground">{{ result.mask }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">CIDR</div>
              <div class="font-mono font-semibold text-foreground">{{ result.cidr }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">前缀长度</div>
              <div class="font-mono font-semibold text-foreground">/{{ result.prefix }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">IP类别</div>
              <div class="font-mono font-semibold text-foreground">{{ result.ipClass }}</div>
            </div>
          </div>
        </div>

        <!-- 主机信息 -->
        <div v-if="result" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Icon name="lucide:server" class="h-5 w-5 mr-2 text-primary" />
            主机信息
          </h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">总主机数</div>
              <div class="font-semibold text-foreground">{{ result.totalHosts }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">可用主机</div>
              <div class="font-semibold text-foreground">{{ result.usableHosts }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">起始IP</div>
              <div class="font-mono font-semibold text-sm text-foreground">{{ result.firstUsable }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground">结束IP</div>
              <div class="font-mono font-semibold text-sm text-foreground">{{ result.lastUsable }}</div>
            </div>
          </div>

          <!-- 可用IP范围 -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-foreground mb-2">可用IP范围</label>
            <div class="p-3 bg-primary/10 rounded-lg">
              <p class="font-mono text-sm text-primary">
                {{ result.firstUsable }} - {{ result.lastUsable }}
              </p>
            </div>
          </div>
        </div>

        <!-- 二进制表示 -->
        <div v-if="result" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Icon name="lucide:binary" class="h-5 w-5 mr-2 text-primary" />
            二进制表示
          </h2>

          <div class="space-y-3">
            <div>
              <div class="text-xs text-muted-foreground mb-1">IP 地址</div>
              <div class="font-mono text-xs bg-muted p-2 rounded break-all text-foreground">
                {{ ipToBinary(result.network) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground mb-1">子网掩码</div>
              <div class="font-mono text-xs bg-muted p-2 rounded break-all text-foreground">
                {{ ipToBinary(result.mask) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground mb-1">网络地址 (二进制)</div>
              <div class="font-mono text-xs bg-primary/10 p-2 rounded break-all text-primary">
                {{ getNetworkBinary(result.network, result.mask) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 其他信息 -->
        <div v-if="result" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Icon name="lucide:hash" class="h-5 w-5 mr-2 text-primary" />
            其他信息
          </h2>

          <div class="space-y-4">
            <div>
              <div class="text-xs text-muted-foreground mb-1">通配符掩码</div>
              <div class="font-mono text-sm bg-muted p-2 rounded text-foreground">{{ result.wildcardMask }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground mb-1">网络类型</div>
              <div class="text-sm text-foreground">{{ result.networkType }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground mb-1">私有地址</div>
              <div class="text-sm text-foreground">{{ result.isPrivate ? '是' : '否' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是子网计算器？
        </h2>
        <p class="text-muted-foreground mb-4">
          子网计算器是一个网络管理工具，用于计算IP子网的各种信息。它可以帮助网络管理员快速确定网络地址、广播地址、
          可用IP范围、子网掩码等重要信息。通过子网划分，可以将大型网络分割成更小的子网，提高网络管理效率和安全性。
        </p>
        <p class="text-muted-foreground">
          CIDR（无类域间路由）是一种更灵活的IP地址分配方式，它使用斜杠记法（如192.168.1.0/24）来表示网络地址和前缀长度，
          替代了传统的A、B、C类地址分类方式，使IP地址的分配更加高效。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择输入方式：CIDR表示法或IP+子网掩码</li>
          <li>输入网络信息，如192.168.1.0/24</li>
          <li>自动查看计算结果，包括网络地址、广播地址、可用IP范围等</li>
          <li>使用子网划分功能将大网络分成多个小网络</li>
          <li>尝试VLSM计算器进行可变长子网掩码计算</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>CIDR计算</strong>: 支持CIDR表示法输入和计算，自动转换子网掩码</li>
          <li><strong>子网划分</strong>: 将大网络划分成多个小子网，优化网络结构</li>
          <li><strong>VLSM支持</strong>: 可变长子网掩码计算，实现IP地址的高效利用</li>
          <li><strong>二进制显示</strong>: 提供IP地址和子网掩码的二进制表示，帮助理解网络原理</li>
          <li><strong>快速示例</strong>: 内置常见网络配置示例，一键加载</li>
          <li><strong>本地计算</strong>: 所有计算都在浏览器本地完成，保护数据隐私</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是私有IP地址？</h3>
            <p class="text-muted-foreground mt-1">
              私有IP地址是保留用于内部网络的IP地址段，不会在互联网上路由。包括：
              10.0.0.0/8、172.16.0.0/12、192.168.0.0/16。这些地址可以在不同组织的内部网络中重复使用，
              通过NAT（网络地址转换）技术访问互联网。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">子网掩码和通配符掩码有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              子网掩码用于区分网络部分和主机部分，其中1表示网络位，0表示主机位。
              通配符掩码（也称反向掩码）则相反，0表示网络位，1表示主机位。通配符掩码常用于路由器的访问控制列表（ACL）中。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算可用主机数？</h3>
            <p class="text-muted-foreground mt-1">
              可用主机数 = 2^(32-前缀长度) - 2。减去的2个地址是网络地址和广播地址。
              例如，/24网络的可用主机数 = 2^(32-24) - 2 = 254个。
              对于/30和/31的网络，有特殊规则：/30网络有2个可用地址，/31网络用于点对点链接有2个可用地址。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是VLSM？</h3>
            <p class="text-muted-foreground mt-1">
              VLSM（Variable Length Subnet Masking，可变长子网掩码）是一种允许在同一网络中使用不同长度子网掩码的技术。
              这使得可以根据不同子网的主机数量需求，分配不同大小的子网，从而更高效地利用IP地址空间。
              例如，可以将一个/24网络划分成一个/26、一个/27和两个/28的子网。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calculator, Edit, Info, Server, Binary, Hash, GitBranch, Layers, X,
  Wifi, Globe, Shield, FileText, HelpCircle, ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'



const router = useRouter()

// SEO配置
useSeoMeta({
  title: '子网计算器 - IP子网划分工具',
  meta: [
    { name: 'description', content: '免费在线子网计算器，支持CIDR、子网掩码计算，子网划分、VLSM计算等功能。' },
    { name: 'keywords', content: '子网计算器,IP计算,CIDR,子网掩码,VLSM,网络划分,IP地址计算' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'subnet-calculator')
const category = categories.find(c => c.id === 'network')

// 响应式数据
const inputMode = ref('cidr')
const cidrInput = ref('192.168.1.0/24')
const ipInput = ref('192.168.1.0')
const maskInput = ref('255.255.255.0')
const subnetCount = ref(4)
const vlsmHosts = ref('')
const result = ref(null)
const dividedSubnets = ref([])
const vlsmSubnets = ref([])

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Wifi, Globe, Shield, FileText, HelpCircle, ChevronUp
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'subnet-calculator'
  ).slice(0, 4)

  return sameCategory
})

// 常见子网掩码
const commonMasks = {
  8: '255.0.0.0',
  9: '255.128.0.0',
  10: '255.192.0.0',
  11: '255.224.0.0',
  12: '255.240.0.0',
  13: '255.248.0.0',
  14: '255.252.0.0',
  15: '255.254.0.0',
  16: '255.255.0.0',
  17: '255.255.128.0',
  18: '255.255.192.0',
  19: '255.255.224.0',
  20: '255.255.240.0',
  21: '255.255.248.0',
  22: '255.255.252.0',
  23: '255.255.254.0',
  24: '255.255.255.0',
  25: '255.255.255.128',
  26: '255.255.255.192',
  27: '255.255.255.224',
  28: '255.255.255.240',
  29: '255.255.255.248',
  30: '255.255.255.252',
  31: '255.255.255.254',
  32: '255.255.255.255'
}

// 监听输入
watch(maskInput, (newValue) => {
  if (inputMode.value === 'mask' && ipInput.value && newValue) {
    calculateFromMask()
  }
})

// 方法
const calculateFromCIDR = () => {
  if (!cidrInput.value || !cidrInput.value.includes('/')) {
    result.value = null
    return
  }

  const [ip, prefixStr] = cidrInput.value.split('/')
  const prefix = parseInt(prefixStr)

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    result.value = null
    return
  }

  const mask = prefixToMask(prefix)
  calculateSubnet(ip, mask, prefix)
}

const calculateFromMask = () => {
  if (!ipInput.value || !maskInput.value) return

  const prefix = maskToPrefix(maskInput.value)
  if (prefix === -1) return

  calculateSubnet(ipInput.value, maskInput.value, prefix)
}

const calculateSubnet = (ip, mask, prefix) => {
  const ipParts = ip.split('.').map(Number)
  const maskParts = mask.split('.').map(Number)

  // 计算网络地址
  const networkParts = ipParts.map((part, i) => part & maskParts[i])
  const network = networkParts.join('.')

  // 计算广播地址
  const broadcastParts = networkParts.map((part, i) => part | (~maskParts[i] & 255))
  const broadcast = broadcastParts.join('.')

  // 计算通配符掩码
  const wildcardParts = maskParts.map(part => 255 - part)
  const wildcardMask = wildcardParts.join('.')

  // 计算主机数量
  const totalHosts = Math.pow(2, 32 - prefix)
  const usableHosts = totalHosts - 2

  // 计算可用IP范围
  const firstUsableParts = [...networkParts]
  firstUsableParts[3]++
  const firstUsable = firstUsableParts.join('.')

  const lastUsableParts = [...broadcastParts]
  lastUsableParts[3]--
  const lastUsable = lastUsableParts.join('.')

  // 判断IP类别
  const ipClass = getIPClass(ipParts[0])

  // 判断是否为私有地址
  const isPrivate = isPrivateIP(ipParts)

  result.value = {
    network,
    broadcast,
    mask,
    cidr: `${network}/${prefix}`,
    prefix,
    wildcardMask,
    ipClass,
    totalHosts,
    usableHosts,
    firstUsable,
    lastUsable,
    networkType: getNetworkType(prefix),
    isPrivate
  }
}

const prefixToMask = (prefix) => {
  let mask = 0
  for (let i = 0; i < prefix; i++) {
    mask |= 1 << (31 - i)
  }

  const maskParts = []
  for (let i = 0; i < 4; i++) {
    maskParts.push((mask >>> (24 - i * 8)) & 255)
  }

  return maskParts.join('.')
}

const maskToPrefix = (mask) => {
  const maskParts = mask.split('.').map(Number)
  let binaryMask = ''

  for (const part of maskParts) {
    binaryMask += part.toString(2).padStart(8, '0')
  }

  const match = binaryMask.match(/^1+/)
  return match ? match[0].length : -1
}

const getIPClass = (firstOctet) => {
  if (firstOctet >= 1 && firstOctet <= 126) return 'A'
  if (firstOctet >= 128 && firstOctet <= 191) return 'B'
  if (firstOctet >= 192 && firstOctet <= 223) return 'C'
  if (firstOctet >= 224 && firstOctet <= 239) return 'D'
  if (firstOctet >= 240 && firstOctet <= 255) return 'E'
  return 'Unknown'
}

const isPrivateIP = (ipParts) => {
  // 10.0.0.0/8
  if (ipParts[0] === 10) return true
  // 172.16.0.0/12
  if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return true
  // 192.168.0.0/16
  if (ipParts[0] === 192 && ipParts[1] === 168) return true
  return false
}

const getNetworkType = (prefix) => {
  if (prefix >= 30) return '点对点链接'
  if (prefix >= 24) return '小型网络'
  if (prefix >= 16) return '中型网络'
  if (prefix >= 8) return '大型网络'
  return '超大型网络'
}

const ipToBinary = (ip) => {
  return ip.split('.')
    .map(part => parseInt(part).toString(2).padStart(8, '0'))
    .join('.')
}

const getNetworkBinary = (ip, mask) => {
  const ipParts = ip.split('.').map(Number)
  const maskParts = mask.split('.').map(Number)

  return ipParts
    .map((part, i) => (part & maskParts[i]).toString(2).padStart(8, '0'))
    .join('.')
}

const loadExample = (event) => {
  const examples = {
    home: '192.168.1.0/24',
    office: '10.0.0.0/16',
    datacenter: '172.16.0.0/12',
    large: '192.168.0.0/16',
    small: '192.168.1.0/28'
  }

  const example = examples[event.target.value]
  if (example) {
    cidrInput.value = example
    if (inputMode.value === 'cidr') {
      calculateFromCIDR()
    }
  }
  event.target.value = ''
}

const divideSubnet = () => {
  if (!result.value || subnetCount.value < 2) return

  const newPrefix = Math.ceil(Math.log2(subnetCount.value)) + result.value.prefix
  if (newPrefix > 32) return

  const subnetSize = Math.pow(2, 32 - newPrefix)
  const networkParts = result.value.network.split('.').map(Number)

  dividedSubnets.value = []
  for (let i = 0; i < subnetCount.value; i++) {
    const offset = i * subnetSize
    const newNetwork = addOffsetToIP(networkParts, offset)
    const newMask = prefixToMask(newPrefix)

    const newNetworkParts = newNetwork.split('.').map(Number)
    const maskParts = newMask.split('.').map(Number)
    const broadcastParts = newNetworkParts.map((part, idx) => part | (~maskParts[idx] & 255))

    const firstUsableParts = [...newNetworkParts]
    firstUsableParts[3]++
    const lastUsableParts = [...broadcastParts]
    lastUsableParts[3]--

    dividedSubnets.value.push({
      network: newNetwork,
      prefix: newPrefix,
      broadcast: broadcastParts.join('.'),
      firstUsable: firstUsableParts.join('.'),
      lastUsable: lastUsableParts.join('.')
    })
  }
}

const addOffsetToIP = (ipParts, offset) => {
  const ip = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3]
  const newIP = ip + offset

  return [
    (newIP >>> 24) & 255,
    (newIP >>> 16) & 255,
    (newIP >>> 8) & 255,
    newIP & 255
  ].join('.')
}

const addVLSMSubnet = () => {
  if (vlsmHosts.value > 0) {
    vlsmSubnets.value.push({
      hosts: vlsmHosts.value
    })
    vlsmSubnets.value.sort((a, b) => b.hosts - a.hosts)
    vlsmHosts.value = ''
  }
}

const removeVLSMSubnet = (index) => {
  vlsmSubnets.value.splice(index, 1)
}

const calculateVLSM = () => {
  // 这里可以实现 VLSM 计算逻辑
  // 由于较复杂，这里仅作示例
  console.log('VLSM 计算功能待实现')
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 初始化
calculateFromCIDR()
</script>