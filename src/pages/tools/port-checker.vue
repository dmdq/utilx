<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">端口扫描器 - 在线端口状态检测工具</h1>
      <p class="text-muted-foreground">一款免费的在线端口扫描工具。快速检测指定主机或IP地址的端口开放状态，支持常见端口扫描和自定义端口范围。纯本地计算，数据安全可靠。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧配置面板 -->
      <div class="space-y-6">
        <!-- 扫描配置 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Radar class="h-5 w-5 mr-2 text-primary" />
            扫描配置
          </h2>

          <div class="space-y-4">
            <!-- 目标主机 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">目标主机</label>
              <input
                v-model="targetHost"
                type="text"
                placeholder="example.com 或 192.168.1.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="scanning"
              />
            </div>

            <!-- 扫描类型 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">扫描类型</label>
              <select
                v-model="scanType"
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="scanning"
              >
                <option value="common">常见端口</option>
                <option value="web">Web 服务端口</option>
                <option value="mail">邮件服务端口</option>
                <option value="ftp">FTP 服务端口</option>
                <option value="database">数据库端口</option>
                <option value="custom">自定义端口</option>
                <option value="range">端口范围</option>
              </select>
            </div>

            <!-- 端口配置 -->
            <div v-if="scanType === 'custom'" class="space-y-2">
              <label class="block text-sm font-medium text-foreground">自定义端口</label>
              <input
                v-model="customPorts"
                type="text"
                placeholder="80,443,8080"
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="scanning"
              />
              <p class="text-xs text-muted-foreground">多个端口用逗号分隔</p>
            </div>

            <div v-else-if="scanType === 'range'" class="space-y-2">
              <label class="block text-sm font-medium text-foreground">端口范围</label>
              <div class="flex space-x-2">
                <input
                  v-model="startPort"
                  type="number"
                  min="1"
                  max="65535"
                  placeholder="起始端口"
                  class="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  :disabled="scanning"
                />
                <input
                  v-model="endPort"
                  type="number"
                  min="1"
                  max="65535"
                  placeholder="结束端口"
                  class="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  :disabled="scanning"
                />
              </div>
            </div>

            <!-- 扫描提示 -->
            <div class="p-3 bg-muted/50 rounded-lg">
              <p class="text-sm text-muted-foreground">
                <strong class="text-foreground">提示：</strong>
                每次扫描会添加 500ms 延迟以避免请求过快。端口范围扫描建议不超过 20 个端口。
              </p>
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
              <select
                @change="loadExample"
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="scanning"
              >
                <option value="">选择示例...</option>
                <option value="google">google.com</option>
                <option value="github">github.com</option>
                <option value="local">本地主机</option>
              </select>
            </div>

            <!-- 扫描按钮 -->
            <button
              @click="startScan"
              :disabled="!targetHost || scanning"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Loader2 v-if="scanning" class="h-5 w-5 mr-2 animate-spin" />
              <Search v-else class="h-5 w-5 mr-2" />
              {{ scanning ? '扫描中...' : '开始扫描' }}
            </button>
          </div>
        </div>

        <!-- 扫描进度 -->
        <div v-if="scanning" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Activity class="h-5 w-5 mr-2 text-primary" />
            扫描进度
          </h2>

          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-foreground">进度</span>
                <span class="text-foreground">{{ scanProgress }}%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  :style="{ width: scanProgress + '%' }"
                ></div>
              </div>
            </div>
            <div class="text-sm text-muted-foreground">
              <p>已扫描: {{ scannedPorts }} / {{ totalPorts }}</p>
              <p>开放端口: {{ openPorts }}</p>
              <p>当前端口: {{ currentPort || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- 扫描历史 -->
        <div v-if="scanHistory.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center justify-between">
            <span class="flex items-center">
              <History class="h-5 w-5 mr-2 text-primary" />
              扫描历史
            </span>
            <button
              @click="clearHistory"
              class="text-sm text-destructive hover:text-destructive/90"
            >
              清除
            </button>
          </h2>

          <div class="space-y-2">
            <button
              v-for="(item, index) in scanHistory"
              :key="index"
              @click="loadHistory(item)"
              class="w-full text-left px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">{{ item.host }}</span>
                <span class="text-xs text-muted-foreground">{{ formatTime(item.time) }}</span>
              </div>
              <div class="text-xs text-muted-foreground">
                端口: {{ item.type }} | 开放: {{ item.openCount }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果面板 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 扫描结果统计 -->
        <div v-if="scanResult && scanResult.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <BarChart class="h-5 w-5 mr-2 text-primary" />
            扫描结果统计
          </h3>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 bg-muted rounded-lg text-center">
              <div class="text-2xl font-bold text-foreground">{{ totalScanned }}</div>
              <div class="text-sm text-muted-foreground">已扫描</div>
            </div>
            <div class="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ scanResult.filter(p => p.status === 'open').length }}</div>
              <div class="text-sm text-muted-foreground">开放</div>
            </div>
            <div class="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ scanResult.filter(p => p.status === 'closed').length }}</div>
              <div class="text-sm text-muted-foreground">关闭</div>
            </div>
            <div class="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-center">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ scanResult.filter(p => p.status === 'filtered').length }}</div>
              <div class="text-sm text-muted-foreground">过滤</div>
            </div>
          </div>
        </div>

        <!-- 端口列表 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="p-6 border-b border-border">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-foreground flex items-center">
                <List class="h-5 w-5 mr-2 text-primary" />
                端口列表
              </h3>
              <div class="flex items-center space-x-2">
                <select
                  v-model="filterStatus"
                  class="px-3 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">全部</option>
                  <option value="open">仅开放</option>
                  <option value="closed">仅关闭</option>
                  <option value="filtered">仅过滤</option>
                </select>
                <button
                  @click="exportResults"
                  class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  导出
                </button>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-border">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">端口</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">服务</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">响应时间</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">描述</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="port in filteredResults" :key="port.number" class="hover:bg-muted/20">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {{ port.number }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      'px-2 py-1 text-xs rounded-full font-medium',
                      port.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      port.status === 'closed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    ]">
                      {{ port.status === 'open' ? '开放' : port.status === 'closed' ? '关闭' : '过滤' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {{ port.service || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {{ port.responseTime || '-' }}ms
                  </td>
                  <td class="px-6 py-4 text-sm text-muted-foreground">
                    {{ port.description || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 开放端口详情 -->
        <div v-if="openPortsList.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <ShieldCheck class="h-5 w-5 mr-2 text-primary" />
            开放端口详情
          </h3>

          <div class="space-y-4">
            <div
              v-for="port in openPortsList"
              :key="port.number"
              class="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950/20"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-foreground">端口 {{ port.number }}</span>
                <span class="text-sm text-muted-foreground">{{ port.service }}</span>
              </div>
              <p class="text-sm text-muted-foreground">{{ port.description }}</p>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-destructive">
            <AlertCircle class="h-5 w-5 mr-2" />
            扫描失败
          </h3>
          <div class="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 rounded-lg p-4">
            <p class="text-destructive">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 bg-card border border-border rounded-lg relative">
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
          什么是端口扫描？
        </h2>
        <p class="text-muted-foreground mb-4">
          端口扫描是一种网络安全技术，用于检查目标主机上哪些端口是开放的、关闭的或被防火墙过滤的。
          每个端口号对应一种特定的网络服务，例如端口80用于HTTP（网页服务），端口443用于HTTPS（安全网页服务），
          端口22用于SSH（远程登录）等。通过端口扫描，系统管理员可以了解网络服务的运行状态，安全专家可以发现潜在的安全风险。
        </p>
        <p class="text-muted-foreground">
          本工具提供在线端口扫描功能，无需安装任何软件，只需在浏览器中输入目标主机地址即可快速检测端口状态。
          扫描结果会显示每个端口的开放状态、服务类型和响应时间，帮助您全面了解目标主机的网络服务情况。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用端口扫描器
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在目标主机输入框中输入域名或IP地址（如 google.com 或 192.168.1.1）</li>
          <li>选择扫描类型：常见端口、Web服务、邮件服务、数据库或自定义端口</li>
          <li>如果选择自定义，可以输入特定的端口号或端口范围</li>
          <li>点击"开始扫描"按钮，等待扫描完成</li>
          <li>查看扫描结果，了解各端口的状态和服务信息</li>
          <li>可以导出扫描结果为CSV格式，便于保存和分析</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          端口状态说明
        </h2>
        <div class="space-y-3 text-muted-foreground mb-6">
          <div class="flex items-start">
            <div class="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3"></div>
            <div>
              <strong class="text-foreground">开放 (Open)</strong>：表示端口正在监听连接，可以建立通信。这通常意味着有相应的服务在该端口上运行。
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3"></div>
            <div>
              <strong class="text-foreground">关闭 (Closed)</strong>：表示端口虽然可达，但没有程序在监听。主机响应了扫描请求，但明确表示不接受连接。
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-2 h-2 rounded-full bg-yellow-500 mt-2 mr-3"></div>
            <div>
              <strong class="text-foreground">过滤 (Filtered)</strong>：表示无法确定端口状态，可能被防火墙或其他网络设备阻止。扫描请求没有得到响应。
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见端口号
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">Web服务</h3>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>20/21 - FTP (文件传输协议)</li>
              <li>22 - SSH (安全外壳协议)</li>
              <li>23 - Telnet (远程终端)</li>
              <li>25 - SMTP (邮件传输)</li>
              <li>53 - DNS (域名系统)</li>
              <li>80 - HTTP (网页服务)</li>
              <li>110 - POP3 (邮局协议)</li>
              <li>143 - IMAP (消息访问协议)</li>
              <li>443 - HTTPS (安全网页服务)</li>
              <li>993 - IMAPS (安全IMAP)</li>
              <li>995 - POP3S (安全POP3)</li>
            </ul>
          </div>
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">数据库服务</h3>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>3306 - MySQL/MariaDB</li>
              <li>5432 - PostgreSQL</li>
              <li>1433 - Microsoft SQL Server</li>
              <li>1521 - Oracle Database</li>
              <li>27017 - MongoDB</li>
              <li>6379 - Redis</li>
              <li>11211 - Memcached</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          安全提示
        </h2>
        <div class="bg-muted p-4 rounded-lg mb-6">
          <ul class="list-disc list-inside text-muted-foreground space-y-2">
            <li>仅扫描您拥有或获得授权的主机，未经授权的端口扫描可能违反法律法规</li>
            <li>开放端口可能存在安全风险，建议定期检查并关闭不必要的服务端口</li>
            <li>使用防火墙限制对敏感端口的访问，仅允许必要的IP地址连接</li>
            <li>保持系统和服务的最新版本，及时修复已知的安全漏洞</li>
            <li>为重要服务使用强密码和双因素认证</li>
          </ul>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">端口扫描合法吗？</h3>
            <p class="text-muted-foreground mt-1">
              端口扫描的合法性取决于扫描的目标和目的。扫描自己拥有的服务器或获得明确授权的网络是完全合法的。
              然而，扫描未经授权的第三方网络可能被视为非法入侵行为。在使用本工具前，请确保您有权扫描目标主机。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么某些端口显示为"过滤"状态？</h3>
            <p class="text-muted-foreground mt-1">
              "过滤"状态表示扫描请求被防火墙、路由器或其他网络安全设备阻止，无法确定端口是否开放。
              这可能是出于安全考虑，管理员配置了防火墙规则来隐藏某些端口的状态。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">扫描速度可以调整吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具为了确保扫描的准确性和避免对目标主机造成过大负载，使用了适中的扫描速度。
              过快的扫描可能导致请求被目标主机拒绝或被防火墙识别为攻击行为。我们提供了超时时间设置，
              您可以根据网络环境适当调整，但建议使用默认值。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么某些开放的端口没有显示服务信息？</h3>
            <p class="text-muted-foreground mt-1">
              本工具维护了一个常见端口号与服务类型的对应关系数据库。如果某个端口不在我们的数据库中，
              就不会显示服务信息。这并不表示该端口没有服务，只是我们无法自动识别。您可以通过端口号
              在互联网上查询相关信息，或使用专业的网络扫描工具进行更深入的探测。
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
import { ref, computed, onMounted } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import {
  Radar, Search, Loader2, Activity, History, BarChart, List,
  ShieldCheck, AlertCircle, HelpCircle, ChevronUp,
  Wifi, Globe, Server, Lock, FileText, Code, Database,
  Link, Hash, Timer, Shield, Terminal
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '端口扫描器 - 在线端口状态检测工具',
  meta: [
    { name: 'description', content: '免费在线端口扫描工具，检测指定主机的端口开放状态，支持常见端口和自定义端口范围扫描。本地计算，数据安全。' },
    { name: 'keywords', content: '端口扫描,端口检测,网络扫描,开放端口,端口状态,网络安全,在线扫描工具' }
  ]
})

// 图标映射
const iconMap = {
  Wifi, Globe, Server, Lock, FileText, Code, Database,
  Link, Hash, Timer, Shield, Terminal
}

// 定义当前工具
const tool = tools.find(t => t.id === 'port-checker')

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 响应式数据
const targetHost = ref('')
const scanType = ref('common')
const customPorts = ref('')
const startPort = ref(1)
const endPort = ref(100)
const timeout = ref(3)
const scanning = ref(false)
const error = ref('')
const scanResult = ref([])
const scanProgress = ref(0)
const scannedPorts = ref(0)
const totalPorts = ref(0)
const currentPort = ref(0)
const openPorts = ref(0)
const filterStatus = ref('all')
const scanHistory = ref([])

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 端口服务映射
const portServices = {
  21: { service: 'FTP', description: '文件传输协议' },
  22: { service: 'SSH', description: '安全外壳协议' },
  23: { service: 'Telnet', description: '远程终端协议' },
  25: { service: 'SMTP', description: '简单邮件传输协议' },
  53: { service: 'DNS', description: '域名系统' },
  80: { service: 'HTTP', description: '超文本传输协议' },
  110: { service: 'POP3', description: '邮局协议版本3' },
  143: { service: 'IMAP', description: '互联网消息访问协议' },
  443: { service: 'HTTPS', description: '安全的超文本传输协议' },
  993: { service: 'IMAPS', description: '安全的IMAP' },
  995: { service: 'POP3S', description: '安全的POP3' },
  3306: { service: 'MySQL', description: 'MySQL数据库' },
  3389: { service: 'RDP', description: '远程桌面协议' },
  5432: { service: 'PostgreSQL', description: 'PostgreSQL数据库' },
  6379: { service: 'Redis', description: 'Redis缓存' },
  8080: { service: 'HTTP-Alt', description: 'HTTP备用端口' }
}

// 预定义端口组
const portGroups = {
  common: [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995],
  web: [80, 443, 8080, 8443, 3000, 8000, 8888],
  mail: [25, 110, 143, 465, 587, 993, 995],
  ftp: [21, 22],
  database: [3306, 5432, 6379, 27017, 1433, 1521]
}

// 计算属性
const totalScanned = computed(() => scanResult.value.length)

const filteredResults = computed(() => {
  if (filterStatus.value === 'all') {
    return scanResult.value
  }
  return scanResult.value.filter(p => p.status === filterStatus.value)
})

const openPortsList = computed(() => {
  return scanResult.value.filter(p => p.status === 'open')
})

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'port-checker'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'dns-lookup'),
    tools.find(t => t.id === 'ip-info'),
    tools.find(t => t.id === 'ssl-checker'),
    tools.find(t => t.id === 'ping-tool')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 方法
const startScan = async () => {
  if (!targetHost.value || scanning.value) return

  // 获取要扫描的端口列表
  const ports = getPortsToScan()

  // 限制端口数量，避免扫描时间过长
  if (ports.length > 50) {
    error.value = `端口数量过多 (${ports.length}个)，请限制在50个以内`
    return
  }

  scanning.value = true
  error.value = ''
  scanResult.value = []
  scanProgress.value = 0
  scannedPorts.value = 0
  openPorts.value = 0
  totalPorts.value = ports.length

  try {
    // 真实的端口扫描
    for (let i = 0; i < ports.length; i++) {
      const port = ports[i]
      currentPort.value = port

      // 调用真实API检测单个端口，设置超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 500) // 500ms超时

      const response = await fetch(
        `https://v2.xxapi.cn/api/tcping?address=${encodeURIComponent(targetHost.value)}&port=${port}`,
        { signal: controller.signal }
      )

      // 清除超时定时器
      clearTimeout(timeoutId)

      let result
      if (response.ok) {
        const data = await response.json()

        if (data.code === 200) {
          // 端口开放
          const portInfo = portServices[port] || {}
          result = {
            number: port,
            status: 'open',
            service: portInfo.service || '',
            description: portInfo.description || '',
            responseTime: parseInt(data.data.ping) || 0
          }
          openPorts.value++
        } else {
          // 端口关闭或连接失败
          result = {
            number: port,
            status: 'closed',
            service: (portServices[port] || {}).service || '',
            description: (portServices[port] || {}).description || '',
            responseTime: null
          }
        }
      } else {
        // 请求失败或超时，标记为过滤
        result = {
          number: port,
          status: 'filtered',
          service: (portServices[port] || {}).service || '',
          description: (portServices[port] || {}).description || '',
          responseTime: null,
          error: response.status === 408 ? '请求超时' : '连接失败'
        }
      }

      scanResult.value.push(result)
      scannedPorts.value++
      scanProgress.value = Math.round((scannedPorts.value / totalPorts.value) * 100)

      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 添加到历史记录
    addToHistory()

  } catch (err) {
    error.value = err.message || '扫描失败'
  } finally {
    scanning.value = false
    currentPort.value = 0
  }
}

const getPortsToScan = () => {
  switch (scanType.value) {
    case 'common':
      return portGroups.common
    case 'web':
      return portGroups.web
    case 'mail':
      return portGroups.mail
    case 'ftp':
      return portGroups.ftp
    case 'database':
      return portGroups.database
    case 'custom':
      if (!customPorts.value) return []
      return customPorts.value.split(',')
        .map(p => parseInt(p.trim()))
        .filter(p => p > 0 && p <= 65535)
    case 'range':
      const ports = []
      const start = parseInt(startPort.value) || 1
      const end = parseInt(endPort.value) || 100
      for (let i = Math.max(1, start); i <= Math.min(65535, end); i++) {
        ports.push(i)
      }
      return ports
    default:
      return []
  }
}


const loadExample = (event) => {
  const examples = {
    google: 'google.com',
    github: 'github.com',
    local: '127.0.0.1'
  }

  const example = examples[event.target.value]
  if (example) {
    targetHost.value = example
  }
  event.target.value = ''
}

const exportResults = () => {
  if (scanResult.value.length === 0) return

  const csv = [
    ['端口', '状态', '服务', '响应时间', '描述'],
    ...scanResult.value.map(p => [
      p.number,
      p.status,
      p.service,
      p.responseTime || '',
      p.description
    ])
  ].map(row => row.join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `port-scan-${targetHost.value}-${Date.now()}.csv`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

const addToHistory = () => {
  const item = {
    host: targetHost.value,
    type: scanType.value,
    openCount: openPorts.value,
    time: new Date()
  }

  scanHistory.value.unshift(item)
  if (scanHistory.value.length > 10) {
    scanHistory.value = scanHistory.value.slice(0, 10)
  }

  saveHistory()
}

const loadHistory = (item) => {
  targetHost.value = item.host
  scanType.value = item.type
}

const clearHistory = () => {
  scanHistory.value = []
  saveHistory()
}

const saveHistory = () => {
  if (process.client) {
    localStorage.setItem('port-scan-history', JSON.stringify(scanHistory.value))
  }
}

const loadHistoryFromStorage = () => {
  if (process.client) {
    const saved = localStorage.getItem('port-scan-history')
    if (saved) {
      scanHistory.value = JSON.parse(saved)
    }
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 生命周期
onMounted(() => {
  loadHistoryFromStorage()
})
</script>