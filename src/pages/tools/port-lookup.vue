<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Network class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">常用端口速查表</h1>
          <p class="text-sm text-muted-foreground mt-1">80 个常用端口：协议、服务、用途说明与公网暴露安全备注</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        收录 Web、数据库、中间件、远程管理等 80 个常用端口，支持按端口号或服务名搜索、按 TCP/UDP 筛选，高危端口红色标记，并提供端口号反向定位。所有数据内置在页面中，离线可用。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：搜索与筛选 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 查找端口
          </h2>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入端口号或服务名（如 3306 / mysql）"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div class="mt-4">
            <label class="block text-sm font-medium text-foreground mb-2">协议筛选</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="opt in protocolOptions"
                :key="opt.value"
                @click="protocolFilter = opt.value"
                :class="protocolFilter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <label class="flex items-center justify-between cursor-pointer mt-4">
            <span class="text-sm text-foreground">仅看危险端口</span>
            <button
              type="button"
              @click="onlyDanger = !onlyDanger"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="onlyDanger ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="onlyDanger ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>
        </div>

        <!-- 反向查询 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <ArrowLeftRight class="w-4 h-4 mr-2 text-primary" /> 端口反向定位
          </h3>
          <div class="flex gap-2">
            <input
              v-model="jumpPort"
              type="number"
              min="0"
              max="65535"
              placeholder="输入端口号"
              class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              @keyup.enter="jumpToPort"
            />
            <button
              @click="jumpToPort"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 rounded-lg text-sm transition-all"
            >
              定位
            </button>
          </div>
          <p v-if="jumpMessage" class="text-xs mt-2" :class="jumpFound ? 'text-green-500' : 'text-destructive'">{{ jumpMessage }}</p>
          <p class="text-xs text-muted-foreground mt-2">输入端口号后回车，表格会自动滚动并高亮对应行。</p>
        </div>

        <!-- 统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 当前结果
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ filteredPorts.length }}</p>
              <p class="text-xs text-muted-foreground">匹配端口</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-destructive">{{ filteredPorts.filter(p => p.danger).length }}</p>
              <p class="text-xs text-muted-foreground">危险端口</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：端口表格 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Table class="w-5 h-5 mr-2 text-primary" />
              端口列表
            </h2>
            <span class="text-xs text-muted-foreground">红色行 = 暴露公网高危</span>
          </div>
          <div class="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-20">端口</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-24">协议</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-36">服务</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredPorts"
                  :id="'port-row-' + item.port"
                  :key="item.port"
                  class="border-t border-border transition-colors"
                  :class="[
                    item.danger ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50',
                    highlightPort === item.port ? 'ring-2 ring-inset ring-primary' : ''
                  ]"
                >
                  <td class="px-4 py-3 align-top">
                    <div class="flex items-center gap-1.5">
                      <span class="font-mono font-bold text-foreground text-base">{{ item.port }}</span>
                      <AlertTriangle v-if="item.danger" class="w-3.5 h-3.5 text-destructive" />
                    </div>
                  </td>
                  <td class="px-4 py-3 align-top">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="protocolBadgeClass(item.protocol)"
                    >
                      {{ item.protocol }}
                    </span>
                  </td>
                  <td class="px-4 py-3 align-top">
                    <p class="font-medium text-foreground">{{ item.service }}</p>
                    <p v-if="item.danger" class="text-xs text-destructive mt-0.5">公网暴露高危</p>
                  </td>
                  <td class="px-4 py-3 align-top">
                    <p class="text-muted-foreground">{{ item.desc }}</p>
                    <p class="text-xs mt-1" :class="item.danger ? 'text-destructive' : 'text-muted-foreground'">{{ item.note }}</p>
                  </td>
                </tr>
                <tr v-if="filteredPorts.length === 0">
                  <td colspan="4" class="px-4 py-12 text-center">
                    <XCircle class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p class="text-sm text-muted-foreground">没有匹配的端口，试试其他关键词</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 安全建议 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <AlertTriangle class="w-4 h-4 mr-2 text-primary" /> 公网暴露安全建议
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">数据库端口</span>（3306/5432/1433/1521/6379/27017）绝不直接暴露公网，应通过堡垒机或内网访问</li>
            <li>• <span class="text-foreground">Redis 6379</span> 默认无密码，历史上大量未授权访问导致勒索与挖矿事件，务必设置 requirepass 并绑定内网</li>
            <li>• <span class="text-foreground">Docker 2375/2376</span> 等同于宿主机 root 权限，暴露公网是最常见的入侵入口之一</li>
            <li>• <span class="text-foreground">远程管理端口</span>（22/3389/5900）建议改用 VPN/堡垒机中转，并开启防爆破与双因素</li>
            <li>• <span class="text-foreground">NetBIOS/SMB</span>（137~139/445）是永恒之蓝等蠕虫的攻击面，云主机安全组默认应封禁</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于常用端口速查表</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            端口是 TCP/UDP 传输层用于区分不同服务的 16 位编号（0~65535）。0~1023 为知名端口（Well-Known），由 IANA 统一分配给 HTTP、SSH、DNS 等经典服务；1024~49151 为注册端口，常见数据库与中间件多在此区间；49152~65535 为动态/私有端口。拿到一台陌生服务器，第一步往往是「端口扫描 + 服务识别」，而运维做好安全加固的第一步，则是「关闭不必要的对外端口」。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>配置防火墙 / 安全组规则时，确认需要放行的端口与服务对应关系</li>
            <li>排查「端口被占用」或服务启动失败时，确认默认端口号</li>
            <li>阅读 Nmap / netstat 扫描结果时，快速识别端口背后的服务与风险</li>
            <li>安全加固：识别哪些端口暴露在公网属于高危行为（如 6379、2375、3306）</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">TCP 和 UDP 端口冲突吗？</span>不冲突。TCP 与 UDP 的端口空间相互独立，同一个数字可以同时被 TCP 服务和 UDP 服务使用。</li>
            <li><span class="text-foreground font-medium">如何查看本机端口占用？</span>Linux/macOS 用 netstat -tunlp 或 lsof -i:端口号，Windows 用 netstat -ano 配合任务管理器。</li>
            <li><span class="text-foreground font-medium">危险端口一定要关闭吗？</span>是的，除非有明确需求。数据库、缓存、容器 API 等端口应仅监听内网，并通过跳板机访问。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'port-lookup'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import {
  Network, Search, Info, AlertTriangle, Table, XCircle, ArrowLeftRight,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '常用端口速查表 - 端口号大全与安全备注',
  description: '常用端口大全在线查询，收录80个常用端口号及对应服务说明，含TCP/UDP协议标注、用途解释与公网暴露安全风险备注，支持端口号搜索与反向定位',
  keywords: '端口号, 端口大全, 常用端口, 3306, 6379, 8080, 443端口, 端口查询, tcp端口',
  author: 'Util工具箱',
  ogTitle: '常用端口速查表 - 有条工具',
  ogDescription: '80个常用端口：协议、服务、用途说明与公网暴露安全备注',
  ogUrl: 'https://www.util.cn/tools/port-lookup',
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
          name: '常用端口速查表',
          url: 'https://www.util.cn/tools/port-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['常用端口查询', 'TCP/UDP协议标注', '危险端口标记', '端口号反向定位']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
            { '@type': 'ListItem', position: 3, name: '常用端口速查表', item: 'https://www.util.cn/tools/port-lookup/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'port-lookup')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 端口数据 ----------
const ports = [
  { port: 20, protocol: 'TCP', service: 'FTP-Data', desc: 'FTP 数据连接端口，主动模式下服务器用该端口向客户端传输文件内容。', note: '现代 FTP 多用被动模式（PASV），20 端口使用较少。', danger: false },
  { port: 21, protocol: 'TCP', service: 'FTP', desc: 'FTP 控制连接端口，用于传输命令与响应，文件数据走 20 或随机高位端口。', note: '明文传输账号密码，建议改用 SFTP（22）或 FTPS，避免暴露公网。', danger: true },
  { port: 22, protocol: 'TCP', service: 'SSH / SFTP', desc: 'SSH 加密远程登录与 SFTP 文件传输的标准端口，Linux 服务器管理标配。', note: '暴露公网会被持续爆破，建议改端口、禁用密码登录、仅允许密钥认证。', danger: false },
  { port: 23, protocol: 'TCP', service: 'Telnet', desc: '早期明文远程登录协议，无任何加密，密码与命令全部明文传输。', note: '极危险，应彻底禁用，改用 SSH。', danger: true },
  { port: 25, protocol: 'TCP', service: 'SMTP', desc: '邮件发送协议端口，服务器间投递邮件使用。', note: '云服务商普遍封禁 25 端口防止滥发垃圾邮件，发信建议用 465/587。', danger: false },
  { port: 53, protocol: 'TCP/UDP', service: 'DNS', desc: '域名解析服务，UDP 53 处理常规查询，TCP 53 用于区域传送与响应过大时。', note: '开放递归解析可能被用于 DNS 放大攻击，公网 DNS 应限制 recursion。', danger: false },
  { port: 67, protocol: 'UDP', service: 'DHCP Server', desc: 'DHCP 服务端端口，接收客户端的 IP 地址申请（bootps）。', note: '仅在需要提供 DHCP 服务的内网设备上开放。', danger: false },
  { port: 68, protocol: 'UDP', service: 'DHCP Client', desc: 'DHCP 客户端端口，用于接收服务器分配的地址（bootpc）。', note: '客户端本地监听，无需对外开放。', danger: false },
  { port: 69, protocol: 'UDP', service: 'TFTP', desc: '简单文件传输协议，无认证无加密，常用于路由器固件、PXE 网络启动。', note: '无认证特性使任何主机都可读取文件，严禁暴露公网。', danger: false },
  { port: 80, protocol: 'TCP', service: 'HTTP', desc: '超文本传输协议默认端口，网站最基础的对外端口。', note: '建议仅用于 301 跳转 HTTPS，实际业务走 443。', danger: false },
  { port: 88, protocol: 'TCP/UDP', service: 'Kerberos', desc: 'Kerberos 认证协议端口，Active Directory 域环境核心组件。', note: '仅域控制器与域内通信需要，不应暴露公网。', danger: false },
  { port: 110, protocol: 'TCP', service: 'POP3', desc: '邮局协议第三版，用于拉取邮件，默认明文。', note: '建议使用加密版本 POP3S（995）。', danger: false },
  { port: 119, protocol: 'TCP', service: 'NNTP', desc: '网络新闻传输协议，用于 Usenet 新闻组，现已很少使用。', note: '若无明确需求应关闭。', danger: false },
  { port: 123, protocol: 'UDP', service: 'NTP', desc: '网络时间协议，用于服务器与时钟源同步时间。', note: 'monlist 功能可被用于 DDoS 放大攻击，应升级 NTP 版本并限制访问。', danger: false },
  { port: 135, protocol: 'TCP', service: 'MSRPC', desc: 'Windows RPC 端点映射服务，远程管理、DCOM 依赖此端口。', note: '历史蠕虫（冲击波等）的攻击面，Windows 服务器严禁对公网开放。', danger: true },
  { port: 137, protocol: 'UDP', service: 'NetBIOS-NS', desc: 'NetBIOS 名称服务，用于局域网主机名解析。', note: '可泄露主机信息，公网暴露高危，建议关闭。', danger: true },
  { port: 138, protocol: 'UDP', service: 'NetBIOS-DGM', desc: 'NetBIOS 数据报服务，用于局域网浏览与广播。', note: '同 137，属老旧协议，建议关闭。', danger: true },
  { port: 139, protocol: 'TCP', service: 'NetBIOS-SSN', desc: 'NetBIOS 会话服务，旧版 Windows 文件共享入口。', note: '暴露公网可被枚举与攻击，建议禁用。', danger: true },
  { port: 143, protocol: 'TCP', service: 'IMAP', desc: '邮件访问协议，邮件保留在服务器端，多端同步场景使用，默认明文。', note: '建议使用加密版本 IMAPS（993）。', danger: false },
  { port: 161, protocol: 'UDP', service: 'SNMP', desc: '简单网络管理协议，用于交换机、服务器监控采集。', note: '默认团体字 public/private 人尽皆知，暴露公网等同交出设备信息。', danger: true },
  { port: 162, protocol: 'UDP', service: 'SNMP-Trap', desc: 'SNMP 陷阱端口，设备主动向管理端推送告警消息。', note: '与管理端配套使用，不应暴露公网。', danger: false },
  { port: 179, protocol: 'TCP', service: 'BGP', desc: '边界网关协议，运营商与大型网络间交换路由信息。', note: '应配合 MD5/TTL 校验与 ACL，严禁公网随意建邻。', danger: false },
  { port: 389, protocol: 'TCP/UDP', service: 'LDAP', desc: '轻量目录访问协议，AD/OpenLDAP 用户认证与目录查询，默认明文。', note: '建议使用加密版本 LDAPS（636）。', danger: false },
  { port: 443, protocol: 'TCP', service: 'HTTPS', desc: 'HTTP over TLS 加密网页端口，现代网站与 API 的标准对外端口。', note: '保持证书有效与 TLS 1.2+，禁用老旧协议。', danger: false },
  { port: 445, protocol: 'TCP', service: 'SMB / CIFS', desc: 'Windows 文件共享（Samba）端口，局域网共享打印与文件。', note: '永恒之蓝勒索蠕虫的攻击面，公网暴露极其危险。', danger: true },
  { port: 465, protocol: 'TCP', service: 'SMTPS', desc: 'SMTP over SSL 加密发信端口，客户端提交邮件的推荐方式之一。', note: '正常邮件服务端口，按需开放。', danger: false },
  { port: 500, protocol: 'UDP', service: 'IKE / IPSec', desc: 'IPSec VPN 密钥交换（Internet Key Exchange）端口。', note: 'VPN 网关端口，配合 4500 使用。', danger: false },
  { port: 514, protocol: 'UDP', service: 'Syslog', desc: '系统日志协议端口，网络设备与服务器集中收集日志。', note: '明文传输，敏感日志环境建议改用 TLS 版本（6514）。', danger: false },
  { port: 587, protocol: 'TCP', service: 'SMTP Submission', desc: '邮件提交端口，用户客户端通过 STARTTLS 加密发信的标准端口。', note: '正常邮件服务端口。', danger: false },
  { port: 631, protocol: 'TCP/UDP', service: 'IPP / CUPS', desc: '互联网打印协议，Linux/macOS 打印服务 CUPS 的管理端口。', note: '打印服务漏洞时有曝光，非必要不开放。', danger: false },
  { port: 636, protocol: 'TCP', service: 'LDAPS', desc: 'LDAP over SSL/TLS 加密目录访问端口。', note: 'LDAP 的推荐暴露方式。', danger: false },
  { port: 873, protocol: 'TCP', service: 'Rsync', desc: '远程同步协议守护进程端口，用于服务器间增量文件同步。', note: 'rsync daemon 无加密且可配置匿名模块，暴露公网需白名单限制并用 SSH 隧道替代。', danger: false },
  { port: 993, protocol: 'TCP', service: 'IMAPS', desc: 'IMAP over SSL 加密邮件收取端口。', note: '邮件客户端推荐配置。', danger: false },
  { port: 995, protocol: 'TCP', service: 'POP3S', desc: 'POP3 over SSL 加密邮件收取端口。', note: '邮件客户端推荐配置。', danger: false },
  { port: 1080, protocol: 'TCP', service: 'SOCKS 代理', desc: 'SOCKS4/5 代理服务标准端口，常用于科学上网与爬虫代理。', note: '无认证的 SOCKS 代理会被扫描滥用为跳板，务必加认证。', danger: false },
  { port: 1194, protocol: 'UDP', service: 'OpenVPN', desc: 'OpenVPN 默认监听端口，企业远程接入常用。', note: 'VPN 服务端口，按需开放。', danger: false },
  { port: 1433, protocol: 'TCP', service: 'Microsoft SQL Server', desc: 'SQL Server 数据库默认端口。', note: '暴露公网会被持续爆破，sa 弱口令是重灾区，务必内网化。', danger: true },
  { port: 1521, protocol: 'TCP', service: 'Oracle Database', desc: 'Oracle 数据库监听器默认端口。', note: '数据库端口不应暴露公网。', danger: false },
  { port: 1723, protocol: 'TCP', service: 'PPTP VPN', desc: '点对点隧道协议 VPN 端口，配合 GRE 使用。', note: 'PPTP 加密已被破解，建议迁移到 IPSec/WireGuard。', danger: false },
  { port: 2049, protocol: 'TCP/UDP', service: 'NFS', desc: '网络文件系统端口，Linux 间共享文件系统。', note: '依赖 rpcbind（111），公网暴露可被枚举挂载，须限制来源 IP。', danger: false },
  { port: 2181, protocol: 'TCP', service: 'ZooKeeper', desc: 'ZooKeeper 分布式协调服务客户端端口。', note: '默认无认证，历史上大量集群被公开篡改，务必内网化并启用 ACL。', danger: false },
  { port: 2375, protocol: 'TCP', service: 'Docker API（无 TLS）', desc: 'Docker Remote API 非加密端口，可完全控制容器与宿主机。', note: '暴露公网等同把 root 交给全世界，多次重大入侵事件的根源，严禁开放。', danger: true },
  { port: 2376, protocol: 'TCP', service: 'Docker API（TLS）', desc: 'Docker Remote API 加密端口，需客户端证书认证。', note: '比 2375 安全，但仍不应暴露公网，改用 Unix socket。', danger: true },
  { port: 2379, protocol: 'TCP', service: 'etcd', desc: 'etcd 分布式键值存储客户端端口，Kubernetes 集群数据所在。', note: '存储着集群全部敏感配置，必须内网隔离并启用证书认证。', danger: true },
  { port: 3306, protocol: 'TCP', service: 'MySQL / MariaDB', desc: 'MySQL 系数据库默认端口，应用最广的开源数据库。', note: '暴露公网被爆破是勒索删库的主要途径，应仅内网监听或走跳板机。', danger: true },
  { port: 3389, protocol: 'TCP', service: 'RDP 远程桌面', desc: 'Windows 远程桌面默认端口，图形化远程管理。', note: '公网暴露会被爆破并勒索病毒定向利用，建议改端口 + VPN + 双因素。', danger: true },
  { port: 3478, protocol: 'UDP', service: 'STUN / TURN', desc: 'NAT 穿透协议端口，音视频通话（WebRTC）打洞必备。', note: 'TURN 服务需认证，防止被白嫖中继流量。', danger: false },
  { port: 4500, protocol: 'UDP', service: 'IPSec NAT-T', desc: 'IPSec NAT 穿越，让 IPSec 流量通过 NAT 设备。', note: 'VPN 网关配套端口。', danger: false },
  { port: 5000, protocol: 'TCP', service: 'Flask / Registry', desc: 'Flask 开发服务器、Docker Registry v2 等常用端口。', note: '开发服务器禁用于生产，Registry 需开启认证。', danger: false },
  { port: 5060, protocol: 'TCP/UDP', service: 'SIP', desc: '会话发起协议端口，VoIP 电话与视频会议信令。', note: 'SIP 爆破扫描非常普遍，需限制来源并启用 fail2ban。', danger: false },
  { port: 5353, protocol: 'UDP', service: 'mDNS', desc: '组播 DNS，局域网设备发现（Bonjour/Avahi）。', note: '仅限本地链路，不应出现在公网。', danger: false },
  { port: 5432, protocol: 'TCP', service: 'PostgreSQL', desc: 'PostgreSQL 数据库默认端口。', note: '配置 pg_hba.conf 限制来源，严禁公网裸奔。', danger: false },
  { port: 5555, protocol: 'TCP', service: 'ADB 调试', desc: 'Android 设备网络调试（adb over TCP）常用端口。', note: '开启网络 ADB 的设备可被完全控制，用后即关。', danger: false },
  { port: 5601, protocol: 'TCP', service: 'Kibana', desc: 'Elasticsearch 可视化控制台端口，能浏览全部索引数据。', note: '暴露公网等于暴露日志与业务数据，必须加认证与内网限制。', danger: false },
  { port: 5672, protocol: 'TCP', service: 'AMQP / RabbitMQ', desc: 'RabbitMQ 消息队列 AMQP 协议端口。', note: 'guest 弱口令问题常见，公网暴露需启用认证与 TLS。', danger: false },
  { port: 5900, protocol: 'TCP', service: 'VNC 远程桌面', desc: 'VNC 远程桌面基础端口（:0 显示器），明文传输。', note: '无加密且常配弱口令，被爆破后可直接控制桌面，公网高危。', danger: true },
  { port: 5984, protocol: 'TCP', service: 'CouchDB', desc: 'CouchDB 文档数据库默认端口。', note: '历史未授权访问漏洞多发，需启用认证。', danger: false },
  { port: 6379, protocol: 'TCP', service: 'Redis', desc: 'Redis 缓存数据库默认端口，默认无密码。', note: '未授权访问可直接写 crontab/SSH key 拿到服务器权限，是入侵重灾区，严禁公网开放。', danger: true },
  { port: 6443, protocol: 'TCP', service: 'Kubernetes API', desc: 'Kubernetes API Server 的 HTTPS 端口，集群控制面入口。', note: '拿到 API 权限即拿到整个集群，应通过堡垒机与 RBAC 严格管控。', danger: true },
  { port: 7077, protocol: 'TCP', service: 'Spark Master', desc: 'Spark 集群独立模式下 Master 的 RPC 端口。', note: '未授权提交任务的历史漏洞，需内网隔离。', danger: false },
  { port: 8000, protocol: 'TCP', service: 'Django / HTTP-Alt', desc: 'Django、FastAPI 等开发服务器常用端口。', note: '开发服务器不用于生产。', danger: false },
  { port: 8080, protocol: 'TCP', service: 'HTTP-Alt / Tomcat', desc: '最常见的 HTTP 备用端口，Tomcat、Nginx 反代、各类 Web 控制台默认端口。', note: '控制台类应用（manager 等）暴露公网需开启强认证。', danger: false },
  { port: 8081, protocol: 'TCP', service: 'HTTP-Alt', desc: 'Nexus、Jenkins 等服务的常用备用端口。', note: 'CI/CD 控制台暴露公网风险高，需认证与内网限制。', danger: false },
  { port: 8086, protocol: 'TCP', service: 'InfluxDB', desc: 'InfluxDB 时序数据库 HTTP API 端口。', note: '需启用认证，防止数据泄露与写入。', danger: false },
  { port: 8443, protocol: 'TCP', service: 'HTTPS-Alt', desc: 'HTTPS 备用端口，各类 Web 控制台、VMware vCenter 等常用。', note: '控制台类应用需强认证。', danger: false },
  { port: 8848, protocol: 'TCP', service: 'Nacos', desc: 'Nacos 注册与配置中心默认端口。', note: '默认 nacos/nacos 弱口令与未授权漏洞多发，必须修改并内网化。', danger: true },
  { port: 8888, protocol: 'TCP', service: 'HTTP-Alt / Jupyter', desc: 'Jupyter Notebook、宝塔面板等常用端口。', note: 'Jupyter 可执行任意代码，暴露公网等同交出服务器。', danger: false },
  { port: 9000, protocol: 'TCP', service: 'PHP-FPM / SonarQube / MinIO', desc: 'PHP-FPM FastCGI、SonarQube Web、MinIO 控制台共用端口。', note: 'PHP-FPM 直接暴露曾被大规模利用（CVE-2019-11043）。', danger: false },
  { port: 9042, protocol: 'TCP', service: 'Cassandra', desc: 'Cassandra 数据库 CQL 原生协议端口。', note: '数据库端口不应暴露公网。', danger: false },
  { port: 9090, protocol: 'TCP', service: 'Prometheus', desc: 'Prometheus 监控服务与 Web UI 端口。', note: '指标数据含基础设施信息，建议内网访问。', danger: false },
  { port: 9092, protocol: 'TCP', service: 'Kafka', desc: 'Kafka 消息队列 Broker 监听端口。', note: '未认证 Kafka 可被任意读写，需启用 SASL/SSL。', danger: false },
  { port: 9200, protocol: 'TCP', service: 'Elasticsearch', desc: 'Elasticsearch REST API 与集群通信端口。', note: '未授权访问导致大量数据泄露与勒索删除事件，严禁公网开放。', danger: true },
  { port: 9300, protocol: 'TCP', service: 'Elasticsearch Transport', desc: 'Elasticsearch 节点间传输端口，仅集群内部使用。', note: '不应暴露公网。', danger: false },
  { port: 9418, protocol: 'TCP', service: 'Git Daemon', desc: 'Git 协议守护进程端口，匿名只读代码仓库访问。', note: '无认证特性需谨慎评估暴露的仓库内容。', danger: false },
  { port: 10250, protocol: 'TCP', service: 'Kubelet', desc: 'Kubelet 节点代理 API 端口，可获取 Pod 信息与执行命令。', note: '未授权访问可接管节点，必须由 API Server 与网络策略保护。', danger: true },
  { port: 11211, protocol: 'TCP/UDP', service: 'Memcached', desc: 'Memcached 缓存服务端口，默认无认证。', note: 'UDP 模式曾引发创纪录 DDoS 反射放大攻击，公网必须禁用 UDP。', danger: true },
  { port: 15672, protocol: 'TCP', service: 'RabbitMQ 管理', desc: 'RabbitMQ Web 管理控制台端口。', note: '默认 guest/guest 弱口令，暴露公网需立即修改。', danger: false },
  { port: 16379, protocol: 'TCP', service: 'Redis Cluster', desc: '部分 Redis 集群部署使用的业务端口（如腾讯云集群变体）。', note: '与 6379 同等对待，严禁公网开放。', danger: false },
  { port: 18080, protocol: 'TCP', service: 'HTTP-Alt', desc: '各类应用与数据服务的备用 HTTP 端口（如 Hadoop 生态）。', note: '确认端口背后的服务是否需要认证。', danger: false },
  { port: 27017, protocol: 'TCP', service: 'MongoDB', desc: 'MongoDB 数据库默认端口。', note: '未授权访问曾造成全球性数据泄露勒索潮，务必启用认证并绑定内网。', danger: true },
  { port: 50070, protocol: 'TCP', service: 'HDFS NameNode', desc: 'Hadoop HDFS NameNode Web UI 端口，可浏览文件系统。', note: '暴露公网可浏览甚至操作集群数据，需内网隔离。', danger: false }
]

// ---------- 筛选与搜索 ----------
const protocolOptions = [
  { value: 'all', label: '全部' },
  { value: 'TCP', label: 'TCP' },
  { value: 'UDP', label: 'UDP' }
]

const searchQuery = ref('')
const protocolFilter = ref('all')
const onlyDanger = ref(false)
const highlightPort = ref(null)
const jumpPort = ref('')
const jumpMessage = ref('')
const jumpFound = ref(false)
const seoContentVisible = ref(true)

const filteredPorts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return ports.filter(item => {
    if (protocolFilter.value !== 'all') {
      if (!item.protocol.split('/').includes(protocolFilter.value)) return false
    }
    if (onlyDanger.value && !item.danger) return false
    if (!q) return true
    return (
      String(item.port).includes(q) ||
      item.service.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.note.toLowerCase().includes(q)
    )
  })
})

const protocolBadgeClass = (protocol) => {
  if (protocol === 'TCP') return 'bg-primary/10 text-primary'
  if (protocol === 'UDP') return 'bg-muted text-muted-foreground'
  return 'bg-muted text-foreground'
}

const jumpToPort = async () => {
  const port = parseInt(jumpPort.value, 10)
  jumpMessage.value = ''
  jumpFound.value = false
  if (isNaN(port) || port < 0 || port > 65535) {
    jumpMessage.value = '请输入 0~65535 之间的端口号'
    return
  }
  const target = ports.find(p => p.port === port)
  if (!target) {
    jumpMessage.value = `端口 ${port} 不在收录列表中，可在搜索框尝试模糊搜索`
    return
  }
  jumpFound.value = true
  jumpMessage.value = `已定位到端口 ${port}（${target.service}）`
  // 清除筛选与搜索干扰，确保目标行可见
  searchQuery.value = ''
  onlyDanger.value = false
  highlightPort.value = port
  await nextTick()
  const el = document.getElementById('port-row-' + port)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  setTimeout(() => {
    highlightPort.value = null
  }, 4000)
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
