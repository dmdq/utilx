<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">User-Agent解析工具 - 在线浏览器识别与设备检测</h1>
      <p class="text-muted-foreground">专业的User-Agent解析工具，准确识别浏览器类型、操作系统、设备信息，支持机器人检测和安全分析。帮助开发者优化网站兼容性和用户体验。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <!-- 左侧输入 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 输入区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Monitor class="h-5 w-5 mr-2 text-primary" />
            User-Agent 输入
          </h2>

          <div class="space-y-4">
            <!-- User-Agent 输入 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">User-Agent 字符串</label>
              <textarea
                v-model="userAgent"
                placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm text-foreground"
                rows="4"
                @input="parseUserAgent"
              ></textarea>
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
              <select
                @change="loadExample"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">选择示例...</option>
                <option value="chrome-windows">Chrome on Windows</option>
                <option value="safari-mac">Safari on macOS</option>
                <option value="firefox-linux">Firefox on Linux</option>
                <option value="chrome-android">Chrome on Android</option>
                <option value="safari-ios">Safari on iOS</option>
                <option value="edge-windows">Edge on Windows</option>
                <option value="bot-google">Googlebot</option>
                <option value="bot-bing">Bingbot</option>
                <option value="python-requests">Python Requests</option>
                <option value="java-http">Java HTTP Client</option>
              </select>
            </div>

            <!-- 使用当前浏览器 -->
            <button
              @click="useCurrentUA"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              <Globe class="h-5 w-5 mr-2" />
              使用当前浏览器的 User-Agent
            </button>
          </div>
        </div>

        <!-- 解析选项 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            解析选项
          </h2>

          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="parseOptions.detailed"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary bg-background"
              />
              <span class="ml-2 text-sm text-foreground">显示详细信息</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="parseOptions.showHints"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary bg-background"
              />
              <span class="ml-2 text-sm text-foreground">显示提示信息</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="parseOptions.showSecurity"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary bg-background"
              />
              <span class="ml-2 text-sm text-foreground">显示安全信息</span>
            </label>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="history.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center justify-between text-foreground">
            <span class="flex items-center">
              <History class="h-5 w-5 mr-2 text-primary" />
              解析历史
            </span>
            <button
              @click="clearHistory"
              class="text-sm text-destructive hover:text-destructive/80"
            >
              清除
            </button>
          </h2>

          <div class="space-y-2">
            <button
              v-for="(item, index) in history"
              :key="index"
              @click="loadHistory(item)"
              class="w-full text-left px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium truncate text-foreground">{{ item.browser || item.ua.substring(0, 30) }}...</span>
                <span class="text-xs text-muted-foreground">{{ formatTime(item.time) }}</span>
              </div>
              <div class="text-xs text-muted-foreground">{{ item.os }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧解析结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 基本信息 -->
        <div v-if="parsed" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Info class="h-5 w-5 mr-2 text-primary" />
            基本信息
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground mb-1">浏览器</div>
              <div class="text-lg font-semibold flex items-center text-foreground">
                <component :is="getBrowserIconComponent(parsed.browser.name)" class="h-6 w-6 mr-2" />
                {{ parsed.browser.name }}
              </div>
              <div class="text-sm text-muted-foreground">版本: {{ parsed.browser.version }}</div>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground mb-1">操作系统</div>
              <div class="text-lg font-semibold flex items-center text-foreground">
                <component :is="getOSIconComponent(parsed.os.name)" class="h-6 w-6 mr-2" />
                {{ parsed.os.name }}
              </div>
              <div class="text-sm text-muted-foreground">版本: {{ parsed.os.version }}</div>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground mb-1">设备类型</div>
              <div class="text-lg font-semibold text-foreground">{{ parsed.device.type || '未知' }}</div>
              <div class="text-sm text-muted-foreground">品牌: {{ parsed.device.brand || '未知' }}</div>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground mb-1">引擎</div>
              <div class="text-lg font-semibold text-foreground">{{ parsed.engine.name || '未知' }}</div>
              <div class="text-sm text-muted-foreground">版本: {{ parsed.engine.version || '未知' }}</div>
            </div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div v-if="parsed && parseOptions.detailed" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <List class="h-5 w-5 mr-2 text-primary" />
            详细信息
          </h3>

          <div class="space-y-4">
            <!-- 浏览器详细信息 -->
            <div>
              <h4 class="text-sm font-medium text-foreground mb-2">浏览器信息</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">名称:</span>
                  <span class="font-medium text-foreground">{{ parsed.browser.name }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">版本:</span>
                  <span class="font-medium text-foreground">{{ parsed.browser.version }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">主版本:</span>
                  <span class="font-medium text-foreground">{{ parsed.browser.major || '未知' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">类型:</span>
                  <span class="font-medium text-foreground">{{ parsed.browser.type || '未知' }}</span>
                </div>
              </div>
            </div>

            <!-- 操作系统详细信息 -->
            <div>
              <h4 class="text-sm font-medium text-foreground mb-2">操作系统信息</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">名称:</span>
                  <span class="font-medium text-foreground">{{ parsed.os.name }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">版本:</span>
                  <span class="font-medium text-foreground">{{ parsed.os.version }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">平台:</span>
                  <span class="font-medium text-foreground">{{ parsed.os.platform || '未知' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">架构:</span>
                  <span class="font-medium text-foreground">{{ parsed.os.architecture || '未知' }}</span>
                </div>
              </div>
            </div>

            <!-- 设备详细信息 -->
            <div>
              <h4 class="text-sm font-medium text-foreground mb-2">设备信息</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">类型:</span>
                  <span class="font-medium text-foreground">{{ parsed.device.type || '未知' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">品牌:</span>
                  <span class="font-medium text-foreground">{{ parsed.device.brand || '未知' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">型号:</span>
                  <span class="font-medium text-foreground">{{ parsed.device.model || '未知' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">识别码:</span>
                  <span class="font-medium text-foreground">{{ parsed.device.identifier || '未知' }}</span>
                </div>
              </div>
            </div>

            <!-- CPU 信息 -->
            <div v-if="parsed.cpu">
              <h4 class="text-sm font-medium text-foreground mb-2">CPU 信息</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between py-1">
                  <span class="text-muted-foreground">架构:</span>
                  <span class="font-medium text-foreground">{{ parsed.cpu.architecture || '未知' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 特性支持 -->
        <div v-if="parsed" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Zap class="h-5 w-5 mr-2 text-primary" />
            特性支持
          </h3>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="feature in features"
              :key="feature.name"
              class="text-center p-3 rounded-lg"
              :class="feature.supported ? 'bg-green-100/20 dark:bg-green-900/30' : 'bg-red-100/20 dark:bg-red-900/30'"
            >
              <CheckCircle v-if="feature.supported" class="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <XCircle v-else class="h-8 w-8 mx-auto mb-2 text-red-600 dark:text-red-400" />
              <div class="text-sm font-medium text-foreground">{{ feature.name }}</div>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div v-if="parsed && parseOptions.showHints" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Lightbulb class="h-5 w-5 mr-2 text-primary" />
            提示信息
          </h3>

          <div class="space-y-3">
            <div
              v-for="hint in hints"
              :key="hint.type"
              class="p-3 rounded-lg"
              :class="hint.type === 'warning' ? 'bg-yellow-100/20 dark:bg-yellow-900/30' : 'bg-blue-100/20 dark:bg-blue-900/30'"
            >
              <div class="flex items-start">
                <AlertTriangle v-if="hint.type === 'warning'" class="h-5 w-5 mr-2 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                <Info v-else class="h-5 w-5 mr-2 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div class="font-medium text-sm text-foreground">{{ hint.title }}</div>
                  <div class="text-sm text-muted-foreground mt-1">{{ hint.message }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 安全信息 -->
        <div v-if="parsed && parseOptions.showSecurity" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Shield class="h-5 w-5 mr-2 text-primary" />
            安全信息
          </h3>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span class="text-sm font-medium text-foreground">是否为机器人</span>
              <span :class="[
                'px-2 py-1 text-xs rounded-full',
                parsed.bot ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              ]">
                {{ parsed.bot ? '是' : '否' }}
              </span>
            </div>

            <div v-if="parsed.bot" class="p-3 bg-yellow-100/20 dark:bg-yellow-900/30 rounded-lg">
              <div class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">机器人信息</div>
              <div class="text-sm text-muted-foreground">
                <p>名称: {{ parsed.bot.name || '未知' }}</p>
                <p v-if="parsed.bot.url">URL: {{ parsed.bot.url }}</p>
                <p v-if="parsed.bot.producer">生产者: {{ parsed.bot.producer }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span class="text-sm font-medium text-foreground">隐私浏览模式</span>
              <span :class="[
                'px-2 py-1 text-xs rounded-full',
                hasPrivacyMode ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              ]">
                {{ hasPrivacyMode ? '可能' : '否' }}
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span class="text-sm font-medium text-foreground">VPN/代理检测</span>
              <span :class="[
                'px-2 py-1 text-xs rounded-full',
                hasVPN ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              ]">
                {{ hasVPN ? '可能使用' : '未检测到' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 原始信息 -->
        <div v-if="parsed" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Code class="h-5 w-5 mr-2 text-primary" />
            原始 User-Agent
          </h3>

          <div class="bg-muted p-4 rounded-lg">
            <pre class="text-sm font-mono text-foreground whitespace-pre-wrap">{{ userAgent }}</pre>
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
          什么是 User-Agent 解析？
        </h2>
        <p class="text-muted-foreground mb-4">
          User-Agent 是 HTTP 请求头的一部分，包含了客户端的信息，如浏览器类型、操作系统、设备型号等。
          User-Agent 解析工具可以提取这些信息，帮助开发者了解访问者使用的设备和浏览器，从而优化网站的兼容性和用户体验。
        </p>
        <p class="text-muted-foreground mb-4">
          通过解析 User-Agent 字符串，我们可以获取以下信息：
        </p>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>浏览器名称和版本（Chrome、Firefox、Safari等）</li>
          <li>操作系统类型和版本（Windows、macOS、Linux、Android、iOS等）</li>
          <li>设备类型（桌面、移动设备、平板电脑等）</li>
          <li>渲染引擎信息（WebKit、Gecko、Trident等）</li>
          <li>是否为机器人或爬虫</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>精准识别</strong>: 准确识别主流浏览器、操作系统和设备类型</li>
          <li><strong>机器人检测</strong>: 识别搜索引擎爬虫和其他自动化程序</li>
          <li><strong>安全分析</strong>: 检测隐私浏览模式和 VPN/代理使用情况</li>
          <li><strong>特性支持</strong>: 分析浏览器对现代 Web 特性的支持情况</li>
          <li><strong>历史记录</strong>: 保存解析历史，方便重复查看</li>
          <li><strong>实时解析</strong>: 输入 User-Agent 字符串即时获得解析结果</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>网站兼容性测试</strong>: 了解访问者使用的浏览器和设备，针对性优化网站</li>
          <li><strong>数据分析</strong>: 统计网站访问者的设备分布，指导产品决策</li>
          <li><strong>安全防护</strong>: 识别恶意爬虫和异常访问行为</li>
          <li><strong>广告投放</strong>: 根据设备和浏览器类型定向投放广告</li>
          <li><strong>用户体验优化</strong>: 针对不同设备提供最佳的界面和功能</li>
          <li><strong>开发调试</strong>: 快速测试不同 User-Agent 下的网站表现</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">User-Agent 解析准确吗？</h3>
            <p class="text-muted-foreground mt-1">
              User-Agent 解析的准确性取决于 User-Agent 字符串本身。大多数情况下解析是准确的，
              但需要注意的是，User-Agent 字符串可以被用户或程序伪造，因此不能完全依赖它来做安全决策。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要解析 User-Agent？</h3>
            <p class="text-muted-foreground mt-1">
              解析 User-Agent 有助于了解网站访问者的设备和浏览器分布，这对于网站优化、兼容性测试和用户体验改进非常重要。
              同时也可以用于识别机器人流量，保护网站免受恶意爬虫的影响。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何获取当前浏览器的 User-Agent？</h3>
            <p class="text-muted-foreground mt-1">
              您可以使用浏览器开发者工具查看 User-Agent，或者在 JavaScript 中通过 navigator.userAgent 获取。
              我们的工具也提供了"使用当前浏览器的 User-Agent"按钮，一键获取并解析。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">User-Agent 会影响网站显示吗？</h3>
            <p class="text-muted-foreground mt-1">
              是的，许多网站会根据 User-Agent 提供不同的内容或界面。这种做法称为"User-Agent 嗅探"。
              虽然有时有用，但更好的做法是使用特性检测而不是依赖 User-Agent 来决定功能支持。
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
              :is="iconMap[relatedTool.icon] || iconMap.default" 
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
  Monitor, Globe, Settings, History, Info, List, Zap, Lightbulb,
  Shield, Code, HelpCircle, ChevronUp, CheckCircle, XCircle, AlertTriangle,
  Terminal, Check, X, Wifi, Key, Hash, Lock, FileText, Database,
  Calendar, Clock, Calculator, Users, Timer, Activity, Regex, FileDiff, Type,
  List as ListIcon, FileJson, Code as CodeIcon, Package, Terminal as TerminalIcon,
  Image, Palette, FileSignature, FileCode, Check as CheckIcon, Link, Replace,
  Search, Sparkles, House, Compass, ShieldCheck, Github
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'User-Agent解析工具 - 在线浏览器识别与设备检测',
  meta: [
    { name: 'description', content: '免费在线User-Agent解析工具，识别浏览器类型、操作系统、设备信息，支持机器人检测和安全分析。帮助开发者优化网站兼容性和用户体验。' },
    { name: 'keywords', content: 'User-Agent解析,浏览器检测,操作系统识别,设备类型检测,机器人识别,UA解析,浏览器识别,设备检测' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'user-agent-parser')
const category = categories.find(c => c.id === 'network')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 响应式数据
const userAgent = ref('')
const parsed = ref(null)
const history = ref([])
const parseOptions = ref({
  detailed: true,
  showHints: true,
  showSecurity: true
})

// 图标映射
const iconMap = {
  Monitor, Globe, Settings, History, Info, List, Zap, Lightbulb,
  Shield, Code, HelpCircle, ChevronUp, CheckCircle, XCircle, AlertTriangle,
  Terminal, Wifi, Key, Hash, Lock, FileText, Database,
  Calendar, Clock, Calculator, Timer, Activity, Regex, FileDiff, Type,
  ListIcon: List, FileJson, CodeIcon: Code, Package, TerminalIcon: Terminal,
  Image, Palette, FileSignature, FileCode, CheckIcon: Check, Link, Replace,
  Search, Sparkles, House, Compass, ShieldCheck, Github,
  // 添加默认图标，以防某些工具的图标不存在
  default: Monitor
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t => 
    t.category === 'network' && t.id !== 'user-agent-parser'
  ).slice(0, 2)
  
  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'http-client'),
    tools.find(t => t.id === 'dns-lookup'),
    tools.find(t => t.id === 'port-checker'),
    tools.find(t => t.id === 'ssl-checker')
  ].filter(Boolean)
  
  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算属性
const features = computed(() => {
  if (!parsed.value) return []

  const features = [
    { name: 'JavaScript', supported: true },
    { name: 'Cookies', supported: true },
    { name: 'WebGL', supported: false },
    { name: 'WebRTC', supported: false },
    { name: 'LocalStorage', supported: true },
    { name: 'SessionStorage', supported: true },
    { name: 'WebSockets', supported: true },
    { name: 'Canvas', supported: true }
  ]

  // 根据 UA 推断特性支持
  const browser = parsed.value.browser.name.toLowerCase()
  const version = parseInt(parsed.value.browser.version || '0')

  if (browser.includes('chrome') && version >= 10) {
    features[2].supported = true // WebGL
    features[3].supported = true // WebRTC
  } else if (browser.includes('firefox') && version >= 4) {
    features[2].supported = true // WebGL
    features[3].supported = true // WebRTC
  } else if (browser.includes('safari') && version >= 5) {
    features[2].supported = true // WebGL
  }

  return features
})

const hints = computed(() => {
  if (!parsed.value) return []

  const hints = []

  // 浏览器版本提示
  const browser = parsed.value.browser.name
  const version = parseInt(parsed.value.browser.version || '0')

  if (browser === 'Internet Explorer' && version < 11) {
    hints.push({
      type: 'warning',
      title: '过时的浏览器',
      message: '检测到过时的 Internet Explorer 版本，建议升级到现代浏览器'
    })
  }

  // 移动设备提示
  if (parsed.value.device.type === 'mobile') {
    hints.push({
      type: 'info',
      title: '移动设备',
      message: '检测到移动设备访问，建议确保网站具有响应式设计'
    })
  }

  // 平板设备提示
  if (parsed.value.device.type === 'tablet') {
    hints.push({
      type: 'info',
      title: '平板设备',
      message: '检测到平板设备访问，需要优化触摸交互体验'
    })
  }

  // 机器人提示
  if (parsed.value.bot) {
    hints.push({
      type: 'warning',
      title: '机器人访问',
      message: '检测到机器人或爬虫访问，请确保正确处理 robots.txt'
    })
  }

  return hints
})

const hasPrivacyMode = computed(() => {
  if (!userAgent.value) return false
  // 简单的隐私模式检测逻辑
  return userAgent.value.includes('Private') || userAgent.value.includes('Incognito')
})

const hasVPN = computed(() => {
  if (!userAgent.value) return false
  // 简单的 VPN/代理检测逻辑
  const vpnIndicators = ['VPN', 'Proxy', 'Tor', 'Opera']
  return vpnIndicators.some(indicator => userAgent.value.includes(indicator))
})

// 方法
const parseUserAgent = () => {
  if (!userAgent.value.trim()) {
    parsed.value = null
    return
  }

  // 模拟 UA 解析（实际应用中应该使用专门的库如 ua-parser-js）
  const ua = userAgent.value.toLowerCase()

  // 解析浏览器
  let browser = { name: 'Unknown', version: '', major: '', type: 'browser' }

  // Chrome
  const chromeMatch = ua.match(/chrome\/(\d+\.\d+)/)
  if (chromeMatch && !ua.includes('edg')) {
    browser.name = 'Chrome'
    browser.version = chromeMatch[1]
    browser.major = chromeMatch[1].split('.')[0]
  }

  // Edge
  const edgeMatch = ua.match(/edg\/(\d+\.\d+)/)
  if (edgeMatch) {
    browser.name = 'Edge'
    browser.version = edgeMatch[1]
    browser.major = edgeMatch[1].split('.')[0]
  }

  // Firefox
  const firefoxMatch = ua.match(/firefox\/(\d+\.\d+)/)
  if (firefoxMatch) {
    browser.name = 'Firefox'
    browser.version = firefoxMatch[1]
    browser.major = firefoxMatch[1].split('.')[0]
  }

  // Safari
  if (ua.includes('safari') && !ua.includes('chrome')) {
    const safariMatch = ua.match(/version\/(\d+\.\d+)/)
    if (safariMatch) {
      browser.name = 'Safari'
      browser.version = safariMatch[1]
      browser.major = safariMatch[1].split('.')[0]
    }
  }

  // Internet Explorer
  const ieMatch = ua.match(/msie (\d+\.\d+)|rv:(\d+\.\d+).*gecko/)
  if (ieMatch) {
    browser.name = 'Internet Explorer'
    browser.version = ieMatch[1] || ieMatch[2]
    browser.major = (ieMatch[1] || ieMatch[2]).split('.')[0]
  }

  // 解析操作系统
  let os = { name: 'Unknown', version: '', platform: '', architecture: '' }

  if (ua.includes('windows')) {
    os.name = 'Windows'
    if (ua.includes('windows nt 10.0')) os.version = '10'
    else if (ua.includes('windows nt 6.3')) os.version = '8.1'
    else if (ua.includes('windows nt 6.2')) os.version = '8'
    else if (ua.includes('windows nt 6.1')) os.version = '7'
  } else if (ua.includes('mac os')) {
    os.name = 'macOS'
    const macMatch = ua.match(/mac os x ([0-9_]+)/)
    if (macMatch) {
      os.version = macMatch[1].replace(/_/g, '.')
    }
  } else if (ua.includes('linux')) {
    os.name = 'Linux'
    if (ua.includes('ubuntu')) os.name = 'Ubuntu'
    else if (ua.includes('debian')) os.name = 'Debian'
    else if (ua.includes('fedora')) os.name = 'Fedora'
  } else if (ua.includes('android')) {
    os.name = 'Android'
    const androidMatch = ua.match(/android ([0-9\.]+)/)
    if (androidMatch) {
      os.version = androidMatch[1]
    }
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os.name = 'iOS'
    const iosMatch = ua.match(/os ([0-9_]+)/)
    if (iosMatch) {
      os.version = iosMatch[1].replace(/_/g, '.')
    }
  }

  // 解析设备
  let device = { type: 'desktop', brand: '', model: '', identifier: '' }

  if (ua.includes('mobile')) {
    device.type = 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device.type = 'tablet'
  }

  // 检测特定设备品牌
  if (ua.includes('iphone')) {
    device.brand = 'Apple'
    device.model = 'iPhone'
  } else if (ua.includes('ipad')) {
    device.brand = 'Apple'
    device.model = 'iPad'
  } else if (ua.includes('samsung')) {
    device.brand = 'Samsung'
  } else if (ua.includes('huawei')) {
    device.brand = 'Huawei'
  } else if (ua.includes('xiaomi')) {
    device.brand = 'Xiaomi'
  }

  // 解析引擎
  let engine = { name: 'Unknown', version: '' }

  if (ua.includes('webkit')) {
    engine.name = 'WebKit'
    const webkitMatch = ua.match(/webkit\/(\d+\.\d+)/)
    if (webkitMatch) engine.version = webkitMatch[1]
  } else if (ua.includes('gecko')) {
    engine.name = 'Gecko'
    const geckoMatch = ua.match(/rv:(\d+\.\d+)/)
    if (geckoMatch) engine.version = geckoMatch[1]
  } else if (ua.includes('trident')) {
    engine.name = 'Trident'
    const tridentMatch = ua.match(/trident\/(\d+\.\d+)/)
    if (tridentMatch) engine.version = tridentMatch[1]
  }

  // 检测机器人
  let bot = null
  if (ua.includes('googlebot')) {
    bot = { name: 'Googlebot', url: 'https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers' }
  } else if (ua.includes('bingbot')) {
    bot = { name: 'Bingbot', url: 'https://www.bing.com/webmasters/help/how-does-bingbot-work-8c1b0c5c' }
  } else if (ua.includes('slurp')) {
    bot = { name: 'Yahoo! Slurp', url: 'https://help.yahoo.com/kb/search/slurp-crawling-page-SLN22657.html' }
  } else if (ua.includes('duckduckbot')) {
    bot = { name: 'DuckDuckBot', url: 'https://help.duckduckgo.com/duckduckbot.html' }
  } else if (ua.includes('baiduspider')) {
    bot = { name: 'Baidu Spider', url: 'http://help.baidu.com/question/1852' }
  } else if (ua.includes('spider') || ua.includes('crawler') || ua.includes('bot')) {
    bot = { name: 'Unknown Bot' }
  }

  // CPU 架构
  let cpu = { architecture: '' }
  if (ua.includes('win64') || ua.includes('x64') || ua.includes('x86_64') || ua.includes('wow64')) {
    cpu.architecture = 'x64'
  } else if (ua.includes('win32') || ua.includes('i386') || ua.includes('x86')) {
    cpu.architecture = 'x86'
  } else if (ua.includes('arm')) {
    cpu.architecture = 'ARM'
  }

  parsed.value = {
    browser,
    os,
    device,
    engine,
    cpu,
    bot
  }

  // 添加到历史记录
  addToHistory()
}

const getBrowserIconComponent = (browserName) => {
  const icons = {
    'Chrome': Globe,
    'Firefox': Globe,
    'Safari': Globe,
    'Edge': Globe,
    'Internet Explorer': Globe,
    'Opera': Globe,
    'Unknown': Monitor
  }
  return icons[browserName] || icons['Unknown']
}

const getOSIconComponent = (osName) => {
  const icons = {
    'Windows': Monitor,
    'macOS': Monitor,
    'Linux': Terminal,
    'Android': Monitor,
    'iOS': Monitor,
    'Unknown': Monitor
  }
  return icons[osName] || icons['Unknown']
}

const loadExample = (event) => {
  const examples = {
    'chrome-windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'safari-mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'firefox-linux': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'chrome-android': 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    'safari-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
    'edge-windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    'bot-google': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'bot-bing': 'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'python-requests': 'python-requests/2.26.0',
    'java-http': 'Java/1.8.0_292'
  }

  const example = examples[event.target.value]
  if (example) {
    userAgent.value = example
    parseUserAgent()
  }
  event.target.value = ''
}

const useCurrentUA = () => {
  if (process.client) {
    userAgent.value = navigator.userAgent
    parseUserAgent()
  }
}

const addToHistory = () => {
  if (!parsed.value) return

  const item = {
    ua: userAgent.value,
    browser: parsed.value.browser.name,
    os: parsed.value.os.name,
    time: new Date()
  }

  history.value.unshift(item)
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }

  saveHistory()
}

const loadHistory = (item) => {
  userAgent.value = item.ua
  parseUserAgent()
}

const clearHistory = () => {
  history.value = []
  saveHistory()
}

const saveHistory = () => {
  if (process.client) {
    localStorage.setItem('ua-parser-history', JSON.stringify(history.value))
  }
}

const loadHistoryFromStorage = () => {
  if (process.client) {
    const saved = localStorage.getItem('ua-parser-history')
    if (saved) {
      try {
        history.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse history:', e)
        history.value = []
      }
    }
  }
}

const formatTime = (time) => {
  // 检查 time 是否有效
  if (!time) return ''
  
  const date = new Date(time)
  // 检查日期是否有效
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diff = now - date

  if (diff < 0) return '' // 未来的时间
  
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

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 生命周期
onMounted(() => {
  loadHistoryFromStorage()
})
</script>