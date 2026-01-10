<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Cookies管理器 - 在线Cookie编辑与会话管理工具</h1>
      <p class="text-muted-foreground">一款免费的在线Cookie管理工具。支持Cookie解析、编辑、导入导出，可查看和修改浏览器Cookie信息，支持Secure、HttpOnly等属性标志，适用于开发调试和会话管理。纯本地处理，数据安全可靠。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：添加和导入 -->
      <div class="space-y-4">
        <!-- 添加新Cookie -->
        <div class="bg-card border border-border rounded-lg p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-foreground">添加Cookie</h3>
            <button
              v-if="!isAddingNew"
              @click="isAddingNew = true"
              class="text-primary hover:text-primary/80 transition"
            >
              <Plus :size="18" />
            </button>
          </div>

          <div v-if="isAddingNew" class="space-y-3">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">名称 *</label>
              <input
                v-model="newCookie.name"
                type="text"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                placeholder="Cookie名称"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">值</label>
              <input
                v-model="newCookie.value"
                type="text"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                placeholder="Cookie值"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">域名</label>
              <input
                v-model="newCookie.domain"
                type="text"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                placeholder=".example.com"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">路径</label>
                <input
                  v-model="newCookie.path"
                  type="text"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                  placeholder="/"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">过期时间</label>
                <input
                  v-model="newCookie.expiration"
                  type="text"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                  placeholder="留空为会话"
                />
              </div>
            </div>
            <div class="flex flex-wrap gap-3">
              <label class="flex items-center gap-2 text-sm">
                <input
                  v-model="newCookie.secure"
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary"
                />
                <span class="text-foreground">Secure</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  v-model="newCookie.httpOnly"
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary"
                />
                <span class="text-foreground">HttpOnly</span>
              </label>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">SameSite</label>
              <select
                v-model="newCookie.sameSite"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
              >
                <option value="lax">Lax (宽松)</option>
                <option value="strict">Strict (严格)</option>
                <option value="none">None (无)</option>
              </select>
            </div>
            <div class="flex gap-2">
              <button
                @click="addCookie"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition text-sm"
              >
                添加
              </button>
              <button
                @click="isAddingNew = false"
                class="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </div>

        <!-- 导入Cookie字符串 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Upload :size="18" />
            导入Cookie字符串
          </h3>
          <textarea
            v-model="rawCookieString"
            class="w-full h-32 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted font-mono text-xs resize-none"
            placeholder="粘贴Cookie字符串，每行一个&#10;name=value; Domain=.example.com; Path=/; Secure"
          ></textarea>
          <button
            @click="importCookies"
            class="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition text-sm flex items-center justify-center gap-2"
          >
            <Upload :size="16" />
            导入
          </button>
        </div>

        <!-- 统计信息 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="font-semibold text-foreground mb-3">统计信息</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-foreground">{{ cookies.length }}</div>
              <div class="text-xs text-muted-foreground">Cookie总数</div>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-foreground">{{ domains.length }}</div>
              <div class="text-xs text-muted-foreground">域名数量</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：Cookie列表 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 搜索和过滤 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <div class="flex flex-wrap gap-3">
            <div class="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search :size="18" class="text-muted-foreground" />
              <input
                v-model="searchQuery"
                type="text"
                class="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                placeholder="搜索Cookie..."
              />
            </div>
            <select
              v-model="selectedDomain"
              class="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
            >
              <option value="all">所有域名</option>
              <option v-for="domain in domains" :key="domain" :value="domain">
                {{ domain }}
              </option>
            </select>
          </div>
        </div>

        <!-- Cookie列表 -->
        <div class="bg-card border border-border rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-border bg-muted flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">
              Cookie列表
              <span class="text-sm font-normal text-muted-foreground ml-2">
                ({{ filteredCookies.length }} 条)
              </span>
            </h3>
            <div class="flex gap-2">
              <button
                @click="exportAsJSON"
                :disabled="cookies.length === 0"
                class="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition text-sm"
              >
                导出JSON
              </button>
              <button
                @click="exportAsString"
                :disabled="cookies.length === 0"
                class="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition text-sm flex items-center gap-1"
              >
                <Download :size="14" />
                导出
              </button>
            </div>
          </div>

          <!-- 编辑表单 -->
          <div v-if="editingCookie" class="p-5 bg-muted border-b border-border">
            <h4 class="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Edit2 :size="18" />
              编辑Cookie
            </h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">名称 *</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">值</label>
                <input
                  v-model="editForm.value"
                  type="text"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">域名</label>
                <input
                  v-model="editForm.domain"
                  type="text"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">路径</label>
                <input
                  v-model="editForm.path"
                  type="text"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">过期时间</label>
                <input
                  v-model="editForm.expiration"
                  type="text"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">SameSite</label>
                <select
                  v-model="editForm.sameSite"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-muted text-sm"
                >
                  <option value="lax">Lax</option>
                  <option value="strict">Strict</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-3">
              <label class="flex items-center gap-2 text-sm">
                <input
                  v-model="editForm.secure"
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary"
                />
                <Secure class="w-4 h-4 text-foreground" />
                <span class="text-foreground">Secure</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  v-model="editForm.httpOnly"
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary"
                />
                <Lock class="w-4 h-4 text-foreground" />
                <span class="text-foreground">HttpOnly</span>
              </label>
            </div>
            <div class="flex gap-2 mt-3">
              <button
                @click="saveEdit"
                class="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition text-sm"
              >
                保存
              </button>
              <button
                @click="cancelEdit"
                class="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition text-sm"
              >
                取消
              </button>
            </div>
          </div>

          <!-- Cookie卡片列表 -->
          <div v-if="filteredCookies.length > 0" class="p-5 space-y-3">
            <div
              v-for="cookie in filteredCookies"
              :key="cookie.id"
              class="bg-muted hover:bg-accent rounded-lg p-4 transition group"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <h4 class="font-mono font-semibold text-primary truncate">
                      {{ cookie.name }}
                    </h4>
                    <div class="flex gap-1">
                      <span v-if="cookie.secure" class="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs" title="Secure">
                        <Shield :size="12" />
                      </span>
                      <span v-if="cookie.httpOnly" class="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs" title="HttpOnly">
                        <Lock :size="12" />
                      </span>
                    </div>
                  </div>
                  <p class="text-sm text-foreground break-all font-mono mb-2">
                    {{ cookie.value }}
                  </p>
                  <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span v-if="cookie.domain" class="flex items-center gap-1">
                      <Globe :size="12" />
                      {{ cookie.domain }}
                    </span>
                    <span>{{ cookie.path || '/' }}</span>
                    <span class="flex items-center gap-1">
                      <Clock :size="12" />
                      {{ formatExpiration(cookie.expiration) }}
                    </span>
                    <span>SameSite: {{ getSameSiteText(cookie.sameSite) }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    @click="copyCookie(cookie)"
                    class="p-2 text-muted-foreground hover:text-primary transition"
                    title="复制"
                  >
                    <Copy :size="16" />
                  </button>
                  <button
                    @click="startEdit(cookie)"
                    class="p-2 text-muted-foreground hover:text-primary transition"
                    title="编辑"
                  >
                    <Edit2 :size="16" />
                  </button>
                  <button
                    @click="deleteCookie(cookie.id)"
                    class="p-2 text-muted-foreground hover:text-destructive transition"
                    title="删除"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="p-12 text-center text-muted-foreground"
          >
            <Cookie :size="48" class="mx-auto mb-3 opacity-50" />
            <p>没有找到Cookie</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-center gap-4 mb-12">
      <button
        @click="loadSample"
        class="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium"
      >
        加载示例
      </button>
      <button
        @click="clearAll"
        class="px-6 py-3 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-colors font-medium"
      >
        清空所有
      </button>
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
          什么是 Cookie？
        </h2>
        <p class="text-muted-foreground mb-4">
          Cookie（HTTP Cookie）是服务器发送到用户浏览器并保存在浏览器上的一小块数据，它会在浏览器下次向同一服务器再发起请求时被携带并发送到服务器上。
          Cookie 主要用于会话管理（如用户登录状态、购物车）、个性化设置（如用户偏好、主题）以及跟踪和记录用户行为。
        </p>
        <p class="text-muted-foreground">
          Cookie 由服务器通过响应头 Set-Cookie 发送，浏览器会自动保存并在后续请求中通过 Cookie 请求头将数据发送回服务器。
          每个 Cookie 通常包含名称、值、域、路径、过期时间等属性，可以通过 Secure、HttpOnly、SameSite 等标志来增强安全性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          Cookie 属性说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Secure</strong>: 标记为 Secure 的 Cookie 只能通过 HTTPS 协议传输，不能通过 HTTP 传输，这有助于防止中间人攻击</li>
          <li><strong>HttpOnly</strong>: 标记为 HttpOnly 的 Cookie 不能通过 JavaScript 的 Document.cookie API 访问，可以有效防范 XSS 攻击窃取 Cookie</li>
          <li><strong>SameSite</strong>: 控制 Cookie 在跨站请求时的发送策略。Strict 模式下完全不发送；Lax 模式允许部分跨站请求（如链接跳转）；None 模式允许所有跨站请求（必须配合 Secure）</li>
          <li><strong>Domain</strong>: 指定 Cookie 所属的域名，设置为 .example.com 可以让所有子域名共享该 Cookie</li>
          <li><strong>Path</strong>: 指定 Cookie 的生效路径，只有访问该路径下的页面时才会发送 Cookie</li>
          <li><strong>Expires/Max-Age</strong>: 设置 Cookie 的过期时间，如果不设置则为会话 Cookie，浏览器关闭后即失效</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>手动添加 Cookie：在左侧表单中填写 Cookie 的各项属性，点击"添加"按钮</li>
          <li>批量导入：将 Cookie 字符串粘贴到导入区域，支持标准格式批量导入</li>
          <li>编辑管理：点击 Cookie 卡片上的编辑按钮可以修改 Cookie 属性</li>
          <li>导出使用：支持导出为 JSON 格式或 Cookie 字符串格式，方便备份和迁移</li>
          <li>搜索过滤：使用搜索框和域名筛选器快速定位目标 Cookie</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Cookie 数据会保存到哪里？</h3>
            <p class="text-muted-foreground mt-1">
              所有 Cookie 数据都保存在浏览器的 localStorage 中，纯本地存储，不会上传到任何服务器。
              这确保了您的敏感信息（如会话令牌）的隐私和安全。您可以随时清空数据或导出备份。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">SameSite 属性应该选择哪个值？</h3>
            <p class="text-muted-foreground mt-1">
              推荐使用 Lax（默认值），它在安全性和用户体验之间取得了良好平衡。
              Strict 模式安全性最高但可能导致某些跨站跳转失败；None 模式必须配合 Secure 使用，适用于需要跨站发送的场景（如第三方登录）。
              现代浏览器默认将 SameSite 设置为 Lax。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">会话 Cookie 和持久 Cookie 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              会话 Cookie 不设置过期时间（Expires/Max-Age 为空），当浏览器关闭后自动删除。
              持久 Cookie 设置了明确的过期时间，即使关闭浏览器也会一直保存直到过期或用户手动删除。
              本工具中如果不填写过期时间字段，创建的就是会话 Cookie。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要 HttpOnly 标志？</h3>
            <p class="text-muted-foreground mt-1">
              HttpOnly 标志是防范 XSS（跨站脚本攻击）的重要安全措施。
              当 Cookie 被标记为 HttpOnly 后，即使攻击者通过 XSS 注入了恶意脚本，
              也无法通过 JavaScript 的 document.cookie 读取到这些敏感 Cookie（如会话 ID、认证令牌等），
              从而有效降低了账号被盗用的风险。
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
import { useRouter } from 'vue-router'
import {
  Cookie, Plus, Trash2, Edit2, Search, Download, Upload, Shield, Clock, Globe, Lock, Copy,
  FileJson, FileText, Code, Terminal, Hash, Key,
  HelpCircle, ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'Cookies管理器 - 在线Cookie编辑与会话管理工具 | Util工具箱',
  description: '免费在线Cookie管理工具，支持Cookie解析、编辑、导入导出，可查看和修改浏览器Cookie信息，支持Secure、HttpOnly等属性标志，适用于开发调试和会话管理。纯本地处理，数据安全可靠。',
  keywords: 'Cookie管理,Cookie编辑,会话管理,浏览器Cookie,Cookie解析,Session管理,在线Cookie工具,Cookie查看器',
  author: 'Util工具箱',
  ogTitle: 'Cookies管理器 - 在线Cookie编辑与会话管理',
  ogDescription: '专业的Cookie管理工具，支持Cookie解析、编辑、导入导出。支持Secure、HttpOnly等属性标志，适用于开发调试和会话管理。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/cookies-manager.png',
  ogUrl: 'https://www.util.cn/tools/cookies-manager',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Cookies管理器 - 在线Cookie编辑与会话管理',
  twitterDescription: '专业的Cookie管理工具，支持Cookie解析、编辑、导入导出。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/cookies-manager.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Cookies管理器',
            description: '免费在线Cookie管理工具，支持Cookie解析、编辑、导入导出',
            url: 'https://www.util.cn/tools/cookies-manager',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'Cookie解析和编辑',
              '批量导入导出',
              'Secure/HttpOnly属性管理',
              'SameSite策略设置',
              '域名筛选和搜索',
              '本地安全存储'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Cookies管理器',
                item: 'https://www.util.cn/tools/cookies-manager'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Cookie数据会保存到哪里？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '所有Cookie数据都保存在浏览器的localStorage中，纯本地存储，不会上传到任何服务器。'
                }
              },
              {
                '@type': 'Question',
                name: 'SameSite属性应该选择哪个值？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '推荐使用Lax（默认值），它在安全性和用户体验之间取得了良好平衡。'
                }
              },
              {
                '@type': 'Question',
                name: '为什么需要HttpOnly标志？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'HttpOnly标志是防范XSS（跨站脚本攻击）的重要安全措施，可以防止恶意脚本通过JavaScript读取敏感Cookie。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'cookies-manager')
const category = categories.find(c => c.id === 'network')

// Cookie数据结构
const cookies = ref([])

// 搜索和过滤
const searchQuery = ref('')
const selectedDomain = ref('all')

// 编辑状态
const editingCookie = ref(null)
const isAddingNew = ref(false)

// 新建Cookie表单
const newCookie = ref({
  name: '',
  value: '',
  domain: '',
  path: '/',
  expiration: '',
  secure: false,
  httpOnly: false,
  sameSite: 'lax'
})

// Cookie编辑表单
const editForm = ref({
  name: '',
  value: '',
  domain: '',
  path: '',
  expiration: '',
  secure: false,
  httpOnly: false,
  sameSite: 'lax'
})

// 原始Cookie字符串输入
const rawCookieString = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileJson, FileText, Code, Terminal, Hash, Key, Cookie, Shield, Lock, Globe
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'cookies-manager'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'headers-viewer'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'base64-encoder'),
    tools.find(t => t.id === 'url-encoder')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 过滤后的Cookies
const filteredCookies = computed(() => {
  let filtered = cookies.value

  // 域名过滤
  if (selectedDomain.value !== 'all') {
    filtered = filtered.filter(c => c.domain === selectedDomain.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.value.toLowerCase().includes(query) ||
      c.domain.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 获取所有域名
const domains = computed(() => {
  const domainSet = new Set()
  cookies.value.forEach(c => {
    if (c.domain) domainSet.add(c.domain)
  })
  return Array.from(domainSet).sort()
})

// 解析Cookie字符串
const parseCookieString = (str) => {
  const cookies = []
  const lines = str.split('\n')

  lines.forEach(line => {
    line = line.trim()
    if (!line || line.startsWith('#')) return

    // 尝试解析标准Cookie格式
    const parts = line.split(';').map(p => p.trim())
    if (parts.length === 0) return

    const [nameValue, ...attributes] = parts
    const [name, value] = nameValue.split('=').map(s => s.trim())

    if (!name) return

    const cookie = {
      id: Date.now() + Math.random(),
      name,
      value: value || '',
      domain: '',
      path: '/',
      expiration: '',
      secure: false,
      httpOnly: false,
      sameSite: 'lax'
    }

    // 解析属性
    attributes.forEach(attr => {
      const [key, val] = attr.split('=').map(s => s.trim())
      const lowerKey = key.toLowerCase()

      if (lowerKey === 'domain') cookie.domain = val || ''
      else if (lowerKey === 'path') cookie.path = val || '/'
      else if (lowerKey === 'expires' || lowerKey === 'max-age') {
        cookie.expiration = val || ''
      }
      else if (lowerKey === 'secure') cookie.secure = true
      else if (lowerKey === 'httponly') cookie.httpOnly = true
      else if (lowerKey === 'samesite') cookie.sameSite = val || 'lax'
    })

    cookies.push(cookie)
  })

  return cookies
}

// 导入Cookie字符串
const importCookies = () => {
  if (!rawCookieString.value.trim()) {
    alert('请输入Cookie字符串')
    return
  }

  const parsed = parseCookieString(rawCookieString.value)
  if (parsed.length > 0) {
    cookies.value = [...cookies.value, ...parsed]
    rawCookieString.value = ''
    saveToStorage()
    alert(`成功导入 ${parsed.length} 个Cookie`)
  } else {
    alert('未能解析出有效的Cookie')
  }
}

// 添加新Cookie
const addCookie = () => {
  if (!newCookie.value.name.trim()) {
    alert('请输入Cookie名称')
    return
  }

  cookies.value.push({
    id: Date.now(),
    ...newCookie.value
  })

  // 重置表单
  newCookie.value = {
    name: '',
    value: '',
    domain: '',
    path: '/',
    expiration: '',
    secure: false,
    httpOnly: false,
    sameSite: 'lax'
  }

  isAddingNew.value = false
  saveToStorage()
}

// 开始编辑Cookie
const startEdit = (cookie) => {
  editingCookie.value = cookie
  editForm.value = { ...cookie }
}

// 取消编辑
const cancelEdit = () => {
  editingCookie.value = null
  editForm.value = {
    name: '',
    value: '',
    domain: '',
    path: '',
    expiration: '',
    secure: false,
    httpOnly: false,
    sameSite: 'lax'
  }
}

// 保存编辑
const saveEdit = () => {
  if (!editForm.value.name.trim()) {
    alert('Cookie名称不能为空')
    return
  }

  const index = cookies.value.findIndex(c => c.id === editingCookie.value.id)
  if (index > -1) {
    cookies.value[index] = {
      ...editForm.value,
      id: editingCookie.value.id
    }
  }

  cancelEdit()
  saveToStorage()
}

// 删除Cookie
const deleteCookie = (cookieId) => {
  if (confirm('确定要删除这个Cookie吗？')) {
    cookies.value = cookies.value.filter(c => c.id !== cookieId)
    saveToStorage()
  }
}

// 导出为JSON
const exportAsJSON = () => {
  const data = cookies.value.map(({ id, ...c }) => c)
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, 'cookies.json', 'application/json')
}

// 导出为Cookie字符串
const exportAsString = () => {
  const lines = cookies.value.map(c => {
    let line = `${c.name}=${c.value}`
    if (c.domain) line += `; Domain=${c.domain}`
    if (c.path && c.path !== '/') line += `; Path=${c.path}`
    if (c.expiration) line += `; Expires=${c.expiration}`
    if (c.secure) line += '; Secure'
    if (c.httpOnly) line += '; HttpOnly'
    if (c.sameSite && c.sameSite !== 'lax') line += `; SameSite=${c.sameSite}`
    return line
  })

  downloadFile(lines.join('\n'), 'cookies.txt', 'text/plain')
}

// 下载文件
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 复制单个Cookie
const copyCookie = (cookie) => {
  let text = `${cookie.name}=${cookie.value}`
  if (cookie.domain) text += `; Domain=${cookie.domain}`
  if (cookie.path) text += `; Path=${cookie.path}`
  if (cookie.expiration) text += `; Expires=${cookie.expiration}`
  if (cookie.secure) text += '; Secure'
  if (cookie.httpOnly) text += '; HttpOnly'
  if (cookie.sameSite) text += `; SameSite=${cookie.sameSite}`

  navigator.clipboard.writeText(text)
  alert('已复制到剪贴板')
}

// 格式化过期时间
const formatExpiration = (exp) => {
  if (!exp) return '会话Cookie'
  return exp
}

// 获取SameSite显示文本
const getSameSiteText = (site) => {
  const texts = {
    'strict': '严格',
    'lax': '宽松',
    'none': '无'
  }
  return texts[site] || site
}

// 清空所有
const clearAll = () => {
  if (confirm('确定要清空所有Cookie吗？')) {
    cookies.value = []
    saveToStorage()
  }
}

// 加载示例
const loadSample = () => {
  cookies.value = [
    {
      id: 1,
      name: 'session_id',
      value: 'abc123def456',
      domain: '.example.com',
      path: '/',
      expiration: '2026-01-05T12:00:00Z',
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    },
    {
      id: 2,
      name: 'user_preferences',
      value: '{"theme":"dark","lang":"zh"}',
      domain: '.example.com',
      path: '/',
      expiration: '2026-12-31T23:59:59Z',
      secure: true,
      httpOnly: false,
      sameSite: 'lax'
    },
    {
      id: 3,
      name: 'csrf_token',
      value: 'x9y8z7w6v5u4',
      domain: '.example.com',
      path: '/api',
      expiration: '',
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    },
    {
      id: 4,
      name: 'analytics_id',
      value: 'GA_123456789',
      domain: '.analytics.example.com',
      path: '/',
      expiration: '2027-01-01T00:00:00Z',
      secure: false,
      httpOnly: false,
      sameSite: 'none'
    }
  ]
  saveToStorage()
}

// 保存到本地存储
const saveToStorage = () => {
  localStorage.setItem('cookies-manager-data', JSON.stringify(cookies.value))
}

// 从本地存储加载
const loadFromStorage = () => {
  const saved = localStorage.getItem('cookies-manager-data')
  if (saved) {
    try {
      cookies.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载失败', e)
    }
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

onMounted(() => {
  loadFromStorage()
  if (cookies.value.length === 0) {
    loadSample()
  }
})
</script>
