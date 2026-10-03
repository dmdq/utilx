<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Server class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">HTTP状态码速查表</h1>
          <p class="text-sm text-muted-foreground mt-1">1xx~5xx 五大组 60+ 状态码：含义、触发场景与排查建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        HTTP 状态码是服务器对请求的处理结果标记。本页内置五大状态码分组的常用码值，支持按号码或关键词搜索，点击任意一行可展开常见原因与排查建议，纯静态数据、无需联网查询。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：搜索与分组 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 查找状态码
          </h2>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入状态码（如 404）或关键词（如 超时、redirect）"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div class="mt-4">
            <label class="block text-sm font-medium text-foreground mb-2">状态码分组</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="group in groups"
                :key="group.key"
                @click="activeGroup = group.key"
                :class="activeGroup === group.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 px-2 rounded text-xs font-medium transition-all text-left"
              >
                {{ group.label }}
                <span class="opacity-70 ml-1">{{ group.count }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 当前结果
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ filteredCodes.length }}</p>
              <p class="text-xs text-muted-foreground">匹配条数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ statusCodes.length }}</p>
              <p class="text-xs text-muted-foreground">收录总数</p>
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <AlertTriangle class="w-4 h-4 mr-2 text-primary" /> 左侧色条含义
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li class="flex items-center gap-2"><span class="inline-block w-1 h-4 rounded bg-green-500"></span> 1xx/2xx/3xx：信息、成功、重定向</li>
            <li class="flex items-center gap-2"><span class="inline-block w-1 h-4 rounded bg-yellow-500"></span> 4xx：客户端错误，优先检查请求</li>
            <li class="flex items-center gap-2"><span class="inline-block w-1 h-4 rounded bg-destructive"></span> 5xx：服务端错误，优先检查服务</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：状态码表格 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Table class="w-5 h-5 mr-2 text-primary" />
              {{ activeGroupLabel }}
            </h2>
            <span class="text-xs text-muted-foreground">点击行展开排查建议</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-20">状态码</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground">名称</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredCodes"
                  :key="item.code"
                  @click="toggleExpand(item.code)"
                  class="border-t border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td class="px-4 py-3 align-top">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-block w-1 self-stretch rounded"
                        :class="statusBarClass(item.code)"
                        style="min-height: 2rem"
                      ></span>
                      <span class="font-mono font-bold text-foreground text-base">{{ item.code }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 align-top">
                    <p class="font-medium text-foreground">{{ item.name }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ item.zh }}</p>
                    <div v-if="expandedCode === item.code" class="mt-2 bg-muted/50 rounded-lg p-3">
                      <p class="text-xs font-medium text-foreground mb-1 flex items-center">
                        <AlertTriangle class="w-3.5 h-3.5 mr-1 text-yellow-500" /> 常见原因与排查建议
                      </p>
                      <p class="text-xs text-muted-foreground leading-relaxed">{{ item.tips }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-3 align-top text-muted-foreground">{{ item.desc }}</td>
                </tr>
                <tr v-if="filteredCodes.length === 0">
                  <td colspan="3" class="px-4 py-12 text-center">
                    <XCircle class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p class="text-sm text-muted-foreground">没有匹配的状态码，试试其他关键词</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 分组说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 分组速记
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">1xx 信息响应</span>：请求已接收，继续处理，如 100 Continue</li>
            <li>• <span class="text-foreground">2xx 成功</span>：请求被成功接收并处理，最常见 200/204</li>
            <li>• <span class="text-foreground">3xx 重定向</span>：需要进一步操作，关注 301/302/304 缓存语义</li>
            <li>• <span class="text-foreground">4xx 客户端错误</span>：请求有误，如 401 未认证、404 不存在、429 限流</li>
            <li>• <span class="text-foreground">5xx 服务端错误</span>：服务器处理失败，如 500、502 网关错误、504 网关超时</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于HTTP状态码速查表</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            HTTP 状态码由三位数字组成，是 HTTP 响应的第一行，用于告诉客户端请求的处理结果。排查线上问题时，第一步往往就是看状态码：4xx 说明请求侧有问题，5xx 说明服务侧有问题，3xx 提示资源位置或缓存发生了变化。本工具收录了 60 多个常用状态码，并为每个高频状态码整理了常见原因与排查思路。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>接口联调时快速确认 401/403/404/405 的语义差异，定位是认证、权限还是路径问题</li>
            <li>运维排查 502/504 时，区分上游进程崩溃与网关超时两种方向</li>
            <li>SEO 检查：确认 301 与 302 对搜索引擎权重传递的不同处理</li>
            <li>阅读第三方 API 文档时查询陌生状态码（如 422、429、451）</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">301 与 302 有什么区别？</span>301 是永久重定向，搜索引擎会把权重转移到新地址；302 是临时重定向，原地址权重不变。</li>
            <li><span class="text-foreground font-medium">418 是真实状态码吗？</span>它源自 1998 年愚人节玩笑「Hyper Text Coffee Pot Control Protocol」，未被正式标准化，但被广泛实现和收录在 RFC 2324 中。</li>
            <li><span class="text-foreground font-medium">为什么 401 和 403 容易混淆？</span>401 表示「未认证」（不知道你是谁，需要登录），403 表示「已认证但无权限」（知道你是谁，但你不能访问）。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'http-status-codes'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Server, Search, Info, AlertTriangle, Table, XCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'HTTP状态码速查表 - HTTP响应码大全与排查建议',
  description: 'HTTP状态码大全在线查询，收录1xx~5xx五大分组60+常用状态码，包含含义说明、触发场景与常见原因排查建议，支持按号码或关键词搜索',
  keywords: 'http状态码, http响应码, 404, 502, 301, 302, 429, 状态码查询, http code',
  author: 'Util工具箱',
  ogTitle: 'HTTP状态码速查表 - 有条工具',
  ogDescription: '1xx~5xx五大组60+状态码：含义、触发场景与排查建议，支持搜索',
  ogUrl: 'https://www.util.cn/tools/http-status-codes',
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
          name: 'HTTP状态码速查表',
          url: 'https://www.util.cn/tools/http-status-codes',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['HTTP状态码查询', '五大分组浏览', '关键词搜索', '排查建议展开']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
            { '@type': 'ListItem', position: 3, name: 'HTTP状态码速查表', item: 'https://www.util.cn/tools/http-status-codes/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'http-status-codes')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态码数据 ----------
const statusCodes = [
  // 1xx 信息响应
  { code: 100, name: 'Continue', zh: '继续', desc: '服务器已收到请求头，客户端应继续发送请求体，通常配合 Expect: 100-continue 使用。', tips: '多为客户端主动声明 Expect 头后的正常响应；若卡在 100，检查客户端是否继续发送了请求体，以及中间代理是否拦截了 Expect 头。' },
  { code: 101, name: 'Switching Protocols', zh: '切换协议', desc: '服务器同意切换到客户端请求的新协议，最常见于 WebSocket 握手（Upgrade: websocket）。', tips: 'WebSocket 握手成功即返回 101；若未返回，检查 Upgrade 与 Connection 头是否正确、代理是否支持协议升级。' },
  { code: 102, name: 'Processing', zh: '处理中', desc: 'WebDAV 扩展状态码，表示服务器已收到请求仍在处理，防止客户端超时。', tips: '长时间大请求（如 PROPFIND）出现属正常；若客户端误报超时，调整客户端超时时间即可。' },
  { code: 103, name: 'Early Hints', zh: '早期提示', desc: '允许服务器在最终响应前提前发送预加载提示（如 Link: preload），用于优化页面加载。', tips: '需浏览器与服务器同时支持；若未生效，检查 CDN/网关是否剥离了 103 响应。' },

  // 2xx 成功
  { code: 200, name: 'OK', zh: '请求成功', desc: '请求成功，响应体中包含所请求的资源或处理结果，最通用的成功状态码。', tips: '正常成功；若接口返回 200 但业务失败，检查响应体中的错误码字段（很多 API 用 200 包裹业务错误）。' },
  { code: 201, name: 'Created', zh: '已创建', desc: '请求成功且服务器创建了新资源，通常用于 POST/PUT，响应头 Location 指向新资源。', tips: 'RESTful 创建接口应返回 201 而非 200；若未返回，检查后端路由实现。' },
  { code: 202, name: 'Accepted', zh: '已接受', desc: '请求已接受但尚未处理完成，适合异步任务、消息队列场景。', tips: '异步接口的正常返回；调用方需通过任务查询接口或回调获取最终结果。' },
  { code: 203, name: 'Non-Authoritative Information', zh: '非权威信息', desc: '请求成功，但返回的元信息来自本地或副本，而非源服务器。', tips: '常见于代理缓存场景；若内容不一致，检查中间层缓存策略。' },
  { code: 204, name: 'No Content', zh: '无内容', desc: '请求成功但响应体为空，常用于 DELETE 成功、表单提交后无需刷新页面。', tips: '若前端期待响应体却拿到 204，属于设计问题；浏览器在 204 后不会跳转刷新。' },
  { code: 205, name: 'Reset Content', zh: '重置内容', desc: '请求成功，要求客户端重置表单或文档视图。', tips: '现代前端很少使用；若需要重置表单，建议在前端自行处理。' },
  { code: 206, name: 'Partial Content', zh: '部分内容', desc: '服务器成功处理了部分 GET 请求（Range 头），用于断点续传、视频拖动播放。', tips: '视频无法拖动时检查是否支持 Range 请求、是否返回 206；下载工具断点续传也依赖它。' },
  { code: 207, name: 'Multi-Status', zh: '多状态', desc: 'WebDAV 扩展，响应体包含多个状态的 XML 信息。', tips: '仅在 WebDAV 批量操作中出现；解析 response 中的 multistatus 节点即可。' },
  { code: 208, name: 'Already Reported', zh: '已报告', desc: 'WebDAV 扩展，避免 207 响应中重复列出同一资源的绑定成员。', tips: '通常无需处理，属 WebDAV 内部去重机制。' },
  { code: 226, name: 'IM Used', zh: '已使用增量编码', desc: '服务器完成了资源的 GET 请求，响应是对实例的增量表示（Delta encoding）。', tips: '极少见；出现时检查 Accept-Encoding 中是否带了 delta 编码协商。' },

  // 3xx 重定向
  { code: 300, name: 'Multiple Choices', zh: '多种选择', desc: '请求的资源有多个可用表示，客户端需自行选择（如多语言/多格式版本）。', tips: '现代网站很少主动返回；若意外出现，检查内容协商配置。' },
  { code: 301, name: 'Moved Permanently', zh: '永久重定向', desc: '资源已永久移动到新 URL，搜索引擎会转移权重，浏览器会缓存该跳转。', tips: '域名迁移、URL 改版首选；注意浏览器缓存较顽固，调试时可用无痕窗口；确保新旧 URL 协议与域名一致。' },
  { code: 302, name: 'Found', zh: '临时重定向', desc: '资源临时移动到新 URL，后续请求仍应使用原地址，不转移搜索权重。', tips: '登录跳转常用；若把本应永久的跳转用成 302，会影响 SEO；检查跳转循环（ERR_TOO_MANY_REDIRECTS）。' },
  { code: 303, name: 'See Other', zh: '查看其他', desc: '用 GET 访问另一个 URL 获取资源，常见于 POST 后重定向（PRG 模式）防止重复提交。', tips: '表单提交后返回 303 可避免刷新重复提交；确认客户端会用 GET 访问新地址。' },
  { code: 304, name: 'Not Modified', zh: '未修改', desc: '资源未变化（配合 If-Modified-Since / If-None-Match），客户端使用本地缓存，无响应体。', tips: '缓存协商正常表现；若本应更新的内容返回 304，检查 ETag/Last-Modified 生成是否正确；强制刷新可绕过。' },
  { code: 305, name: 'Use Proxy', zh: '使用代理', desc: '要求通过指定的代理访问资源，因安全原因已被现代浏览器废弃。', tips: '无需实现；若遇到属历史遗留或中间设备注入。' },
  { code: 307, name: 'Temporary Redirect', zh: '临时重定向', desc: '临时重定向，且要求保持原请求方法（POST 仍为 POST），不会变为 GET。', tips: '需要保留请求方法的临时跳转用 307；注意与 302 的区别：302 可能被客户端改为 GET。' },
  { code: 308, name: 'Permanent Redirect', zh: '永久重定向（保持方法）', desc: '永久重定向且保持原请求方法，是 301 的方法保持版本。', tips: 'API 迁移域名时优先用 308，避免客户端把 POST 降级为 GET。' },

  // 4xx 客户端错误
  { code: 400, name: 'Bad Request', zh: '错误请求', desc: '服务器无法理解请求：语法错误、参数格式非法、请求体损坏等。', tips: '检查 JSON 是否合法、参数名拼写、Content-Type 是否正确、URL 编码是否完整；后端日志通常会打印具体校验失败原因。' },
  { code: 401, name: 'Unauthorized', zh: '未认证', desc: '请求未携带有效身份凭证（未登录、Token 过期或无效），需要认证。', tips: '检查 Authorization 头是否携带、Token 是否过期；JWT 场景常见 exp 超时；确认返回头含 WWW-Authenticate。' },
  { code: 402, name: 'Payment Required', zh: '需要付款', desc: '保留状态码，最初为付费电子交易设计，现多被用于「配额/套餐限制」的自定义语义。', tips: '一般见于一方 API 的额度限制；按平台文档升级套餐或等待配额重置。' },
  { code: 403, name: 'Forbidden', zh: '禁止访问', desc: '服务器已理解请求但拒绝执行：权限不足、IP 被封、目录禁止列出等。', tips: '与 401 区分：403 是「知道你是谁但不让访问」；检查用户角色权限、文件系统权限、Nginx deny 规则、WAF 拦截。' },
  { code: 404, name: 'Not Found', zh: '资源不存在', desc: '服务器找不到请求的资源：URL 拼错、资源已删除、路由未注册。', tips: '核对 URL 大小写与拼写；RESTful 中也可用 404 表示「查无此数据」；检查前端路由 history 模式的服务器 fallback 配置。' },
  { code: 405, name: 'Method Not Allowed', zh: '方法不允许', desc: '请求方法（GET/POST/PUT 等）不被目标资源支持，响应头 Allow 列出可用方法。', tips: '检查请求方法是否与接口定义一致；确认网关/Nginx 是否拦截了 PUT/DELETE。' },
  { code: 406, name: 'Not Acceptable', zh: '无法接受', desc: '服务器无法生成符合请求头 Accept/Accept-Language 要求的响应。', tips: '检查 Accept 头取值；服务端内容协商未命中时就会返回此码，例如只支持 JSON 却请求 XML。' },
  { code: 407, name: 'Proxy Authentication Required', zh: '需要代理认证', desc: '客户端必须先通过代理服务器的身份认证（Proxy-Authenticate）。', tips: '公司内网代理常见；配置代理的用户名密码或检查 Proxy-Authorization 头。' },
  { code: 408, name: 'Request Timeout', zh: '请求超时', desc: '服务器等待客户端发送请求的时间过长，主动关闭连接。', tips: '弱网大请求常见；客户端增大超时或减小请求体；服务端可调大 keepalive_timeout。' },
  { code: 409, name: 'Conflict', zh: '冲突', desc: '请求与资源当前状态冲突，如并发修改、唯一键重复、版本号过期。', tips: '乐观锁场景提示用户刷新后重试；检查唯一索引冲突（邮箱/用户名重复注册常用 409）。' },
  { code: 410, name: 'Gone', zh: '已删除', desc: '资源已永久删除且不可恢复，比 404 语义更强，搜索引擎会尽快移除索引。', tips: '下线内容可返回 410 以加速搜索引擎清理；误返回会伤害 SEO，谨慎使用。' },
  { code: 411, name: 'Length Required', zh: '需要 Content-Length', desc: '服务器要求请求携带 Content-Length 头，拒绝不带长度的请求。', tips: 'chunked 传输被服务器禁用时出现；客户端改为定长请求或服务端开启 chunked 支持。' },
  { code: 412, name: 'Precondition Failed', zh: '前置条件失败', desc: '请求头中的 If-Match / If-Unmodified-Since 等前置条件不满足。', tips: '并发编辑冲突时常见；重新获取最新资源并携带最新 ETag 重试。' },
  { code: 413, name: 'Payload Too Large', zh: '请求体过大', desc: '请求体超过服务器允许的最大尺寸，如上传文件超限。', tips: '调大 Nginx client_max_body_size、PHP post_max_size/upload_max_filesize、Node body-parser limit 等对应配置。' },
  { code: 414, name: 'URI Too Long', zh: 'URI 过长', desc: '请求 URL 超过服务器能处理的长度上限，常见于 GET 参数过多。', tips: '把长参数改为 POST 请求体传递；调大 Nginx large_client_header_buffers。' },
  { code: 415, name: 'Unsupported Media Type', zh: '不支持的媒体类型', desc: '请求的 Content-Type 格式服务器不支持，如接口只收 JSON 却发送 form-data。', tips: '核对接口文档的 Content-Type；JSON 接口需显式设置 application/json。' },
  { code: 416, name: 'Range Not Satisfiable', zh: '范围无法满足', desc: 'Range 头请求的字节区间超出资源实际大小。', tips: '断点续传时本地记录的文件大小与服务器不一致导致；删除本地残留文件重新下载。' },
  { code: 417, name: 'Expectation Failed', zh: '期望失败', desc: '请求头 Expect 要求的条件服务器无法满足。', tips: '部分老代理对 Expect: 100-continue 处理不佳；客户端可移除该头重试。' },
  { code: 418, name: 'I\'m a teapot', zh: '我是一个茶壶', desc: '源自 RFC 2324 愚人节玩笑的超文本咖啡壶协议，被广泛用于彩蛋或反爬虫拦截。', tips: '遇到 418 多半是被 Cloudflare 等服务的反爬机制拦截，或纯属服务端彩蛋。' },
  { code: 421, name: 'Misdirected Request', zh: '错误定向的请求', desc: '请求被发往无法产生响应的服务器，常见于 HTTP/2 连接复用配置错误。', tips: '检查多证书共用一个连接的配置、CDN 回源 SNI 设置。' },
  { code: 422, name: 'Unprocessable Entity', zh: '无法处理的实体', desc: '请求格式正确但语义错误无法处理，如表单校验失败；WebDAV 与 Laravel 等框架常用。', tips: '查看响应体中的字段级错误信息；与 400 区分：422 强调「能解析但不合法」。' },
  { code: 423, name: 'Locked', zh: '已锁定', desc: 'WebDAV 扩展，目标资源被锁定，无法执行写入操作。', tips: '其他用户或进程持有锁；等待锁释放或用锁令牌（Lock-Token）操作。' },
  { code: 425, name: 'Too Early', zh: '过早', desc: '服务器不愿意处理可能被重放的请求（0-RTT early data 场景）。', tips: 'TLS 1.3 0-RTT 重放风险触发；客户端正常重试即可，服务端可按需关闭 early data。' },
  { code: 426, name: 'Upgrade Required', zh: '需要升级协议', desc: '客户端应切换到服务器要求的协议版本，响应头 Upgrade 指明目标协议。', tips: '旧协议访问新服务时出现；按 Upgrade 头升级客户端协议（如 HTTP/2、WebSocket）。' },
  { code: 428, name: 'Precondition Required', zh: '需要前置条件', desc: '服务器要求请求携带条件头（如 If-Match）以防止「丢失更新」问题。', tips: '并发修改接口强制乐观锁；客户端先 GET 获取 ETag，再带 If-Match 提交。' },
  { code: 429, name: 'Too Many Requests', zh: '请求过多', desc: '触发限流（Rate Limit），请求过于频繁，响应头可能包含 Retry-After。', tips: '按 Retry-After 退避重试；实现指数退避与请求合并；检查是否触发了网关/服务的 QPS 限制。' },
  { code: 431, name: 'Request Header Fields Too Large', zh: '请求头字段过大', desc: '请求头总大小超过服务器限制，常见于 Cookie 累积过多。', tips: '清理该域名下 Cookie；调大 Nginx large_client_header_buffers 或 Node maxHeaderSize。' },
  { code: 451, name: 'Unavailable For Legal Reasons', zh: '因法律原因不可用', desc: '资源因法律要求（审查、版权投诉等）被拒绝访问，编号致敬小说《华氏451》。', tips: '确认访问地区是否被限制、内容是否被投诉下架；属服务端主动策略。' },

  // 5xx 服务端错误
  { code: 500, name: 'Internal Server Error', zh: '服务器内部错误', desc: '服务器执行请求时抛出了未捕获的异常，最通用的服务端错误。', tips: '第一优先看服务端错误日志堆栈；排查最近一次发布；检查依赖服务与数据库连接；网关层 500 也可能是上游返回被透传。' },
  { code: 501, name: 'Not Implemented', zh: '未实现', desc: '服务器不支持实现请求所需的功能，如不认识的 HTTP 方法。', tips: '确认服务端版本是否支持该接口/方法；代理层不支持 CONNECT 也可能返回。' },
  { code: 502, name: 'Bad Gateway', zh: '网关错误', desc: '网关/代理从上游服务器收到了无效响应或上游直接断开，如 PHP-FPM 挂了、后端崩溃。', tips: '检查上游进程是否存活、端口是否正确；查看 Nginx error.log 中 connect() failed / upstream prematurely closed 等关键字。' },
  { code: 503, name: 'Service Unavailable', zh: '服务不可用', desc: '服务器暂时过载或正在维护（如停机发布、限流熔断），可能带 Retry-After 头。', tips: '确认是否处于发布窗口；检查连接数/线程池是否打满、健康检查是否摘除节点；配合 Retry-After 做退避重试。' },
  { code: 504, name: 'Gateway Timeout', zh: '网关超时', desc: '网关等待上游响应超时，如 Nginx proxy_read_timeout 内后端未返回。', tips: '定位上游慢在何处：慢 SQL、外部接口阻塞、Full GC；调大网关超时只是止血，根治需优化上游耗时。' },
  { code: 505, name: 'HTTP Version Not Supported', zh: 'HTTP 版本不受支持', desc: '服务器不支持请求所用的 HTTP 协议版本。', tips: '检查客户端使用的 HTTP 版本（如强制 HTTP/3 而服务端未开启）。' },
  { code: 506, name: 'Variant Also Negotiates', zh: '变体也在协商中', desc: '服务器存在内部透明内容协商配置错误，选中的变体自身又被配置为参与协商。', tips: '检查服务器内容协商配置的循环引用，属服务端配置错误。' },
  { code: 507, name: 'Insufficient Storage', zh: '存储空间不足', desc: 'WebDAV 扩展，服务器没有足够空间完成请求（如磁盘写满）。', tips: '检查服务器磁盘使用率、上传目录配额、数据库文件大小限制。' },
  { code: 508, name: 'Loop Detected', zh: '检测到循环', desc: 'WebDAV 扩展，服务器在处理请求时检测到无限循环。', tips: '检查资源绑定是否形成环（A 绑定 B、B 绑定 A）。' },
  { code: 510, name: 'Not Extended', zh: '未扩展', desc: '请求需要服务器不支持的进一步扩展才能处理。', tips: '检查请求是否缺失服务端要求的扩展声明头。' },
  { code: 511, name: 'Network Authentication Required', zh: '需要网络认证', desc: '需要在网络接入层认证后才能访问（典型如机场、酒店 Wi-Fi 的 Portal 登录页）。', tips: '连接公共 Wi-Fi 后打开任意网页触发 Portal 登录即可；代码请求遇到时提示用户先完成网络认证。' }
]

// ---------- 分组与搜索 ----------
const groups = [
  { key: 'all', label: '全部', match: () => true },
  { key: '1xx', label: '1xx 信息', match: c => c.code < 200 },
  { key: '2xx', label: '2xx 成功', match: c => c.code >= 200 && c.code < 300 },
  { key: '3xx', label: '3xx 重定向', match: c => c.code >= 300 && c.code < 400 },
  { key: '4xx', label: '4xx 客户端错误', match: c => c.code >= 400 && c.code < 500 },
  { key: '5xx', label: '5xx 服务端错误', match: c => c.code >= 500 }
]

groups.forEach(g => {
  g.count = statusCodes.filter(g.match).length
})

const activeGroup = ref('all')
const searchQuery = ref('')
const expandedCode = ref(null)
const seoContentVisible = ref(true)

const activeGroupLabel = computed(() => {
  return groups.find(g => g.key === activeGroup.value)?.label || '全部'
})

const filteredCodes = computed(() => {
  const group = groups.find(g => g.key === activeGroup.value)
  const q = searchQuery.value.trim().toLowerCase()
  return statusCodes.filter(item => {
    if (!group.match(item)) return false
    if (!q) return true
    return (
      String(item.code).includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.zh.includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.tips.toLowerCase().includes(q)
    )
  })
})

const statusBarClass = (code) => {
  if (code >= 500) return 'bg-destructive'
  if (code >= 400) return 'bg-yellow-500'
  return 'bg-green-500'
}

const toggleExpand = (code) => {
  expandedCode.value = expandedCode.value === code ? null : code
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
