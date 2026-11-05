<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-foreground mb-3">WebSocket测试工具 - 在线WebSocket连接调试工具</h1>
      <p class="text-muted-foreground">终端式消息日志、毫秒级收发时序、文本/JSON/二进制/HEX 四种格式收发、自动心跳与断线重连——把调试 WebSocket 的常用动作放在一个页面，纯前端实现，数据不出浏览器。</p>
    </div>

    <!-- ① 连接命令栏 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center gap-3">
        <div class="flex-1 min-w-0">
          <label class="sr-only" for="ws-url-input">WebSocket URL</label>
          <input
            id="ws-url-input"
            v-model="wsUrl"
            list="ws-url-history"
            type="text"
            placeholder="wss://echo.websocket.org 或 ws://127.0.0.1:3106"
            class="w-full px-3 py-2 bg-background border border-border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            :disabled="isConnected || connecting"
            @keyup.enter="toggleConnection"
          />
          <datalist id="ws-url-history">
            <option v-for="u in urlHistory" :key="u" :value="u" />
          </datalist>
        </div>
        <input
          v-model="protocol"
          type="text"
          placeholder="子协议，可选"
          class="lg:w-36 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          :disabled="isConnected || connecting"
        />
        <select
          @change="loadExample"
          :disabled="isConnected || connecting"
          class="lg:w-44 px-3 py-2 bg-background border border-border rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">示例端点…</option>
          <option value="echo">WebSocket Echo（公网）</option>
          <option value="local">本地服务 ws://127.0.0.1:3106</option>
        </select>
        <button
          @click="toggleConnection"
          :disabled="!wsUrl || connecting"
          class="lg:w-32 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
          :class="isConnected
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed'"
        >
          <Loader2 v-if="connecting" class="h-4 w-4 mr-1.5 animate-spin" />
          <X v-else-if="isConnected" class="h-4 w-4 mr-1.5" />
          <Wifi v-else class="h-4 w-4 mr-1.5" />
          {{ connecting ? '连接中…' : (isConnected ? '断开' : '连接') }}
        </button>
        <div class="flex items-center gap-2 lg:justify-end lg:w-24">
          <span class="w-2 h-2 rounded-full shrink-0" :class="statusDotClass" />
          <span class="text-sm font-medium text-foreground whitespace-nowrap">{{ statusText }}</span>
        </div>
      </div>
    </div>

    <!-- ②③ 主体：日志 + 侧栏 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- ② 消息日志（终端行风） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col overflow-hidden">
        <!-- 工具条 -->
        <div class="border-b border-border p-3 space-y-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              type="button"
              @click="filterTab = tab.value"
              class="px-2.5 py-1 rounded-full border text-xs font-medium transition-colors"
              :class="filterTab === tab.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'"
            >
              {{ tab.label }}
              <span class="tabular-nums opacity-70 ml-0.5">{{ tab.count }}</span>
            </button>
            <div class="flex-1" />
            <button
              type="button"
              @click="autoScroll = !autoScroll"
              class="px-2 py-1 text-xs rounded-md transition-colors flex items-center"
              :class="autoScroll ? 'bg-primary/10 text-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              title="新消息到达时自动滚到底部"
            >
              <ArrowDown class="h-3.5 w-3.5 mr-1" />
              自动滚动
            </button>
            <button
              type="button"
              @click="copyAll"
              class="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            >
              {{ allCopied ? '已复制' : '复制全部' }}
            </button>
            <button
              type="button"
              @click="exportLog"
              class="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors flex items-center"
            >
              <Download class="h-3.5 w-3.5 mr-1" />
              导出
            </button>
            <button
              type="button"
              @click="clearMessages"
              class="px-2 py-1 text-xs rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center"
            >
              <Trash2 class="h-3.5 w-3.5 mr-1" />
              清空
            </button>
          </div>
          <input
            v-model="searchText"
            type="text"
            placeholder="按内容过滤日志…"
            class="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- 日志体 -->
        <div ref="messageContainer" class="flex-1 overflow-y-auto font-mono text-xs leading-5 h-[420px] lg:h-[calc(100dvh-300px)] lg:min-h-[520px]">
          <div v-if="filteredMessages.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground px-6 text-center">
            <Terminal class="h-12 w-12 mb-3" />
            <p class="text-sm">暂无消息</p>
            <p class="text-xs mt-1">在上方填入 WebSocket 地址连接后，收发记录会以终端风格列在这里</p>
          </div>
          <div
            v-for="msg in filteredMessages"
            :key="msg.id"
            class="group border-b border-border/60 px-3 py-1.5 hover:bg-muted/50 cursor-pointer"
            :class="{ 'bg-destructive/5': msg.type === 'error' }"
            @click="toggleExpand(msg.id)"
          >
            <div class="flex items-start gap-2">
              <span class="text-muted-foreground tabular-nums shrink-0 w-[7.25rem] hidden sm:inline">{{ formatMs(msg.timestamp) }}</span>
              <span class="shrink-0 font-medium w-12" :class="badgeClass(msg)">{{ badgeText(msg) }}</span>
              <span v-if="msg.deltaMs !== null" class="shrink-0 text-muted-foreground tabular-nums w-16 hidden md:inline">+{{ msg.deltaMs }}ms</span>
              <span
                v-if="msg.format !== 'text'"
                class="shrink-0 px-1 rounded bg-muted text-muted-foreground text-[10px] leading-4"
              >{{ msg.format.toUpperCase() }}</span>
              <div class="flex-1 min-w-0">
                <p class="truncate" :class="msg.type === 'error' ? 'text-destructive' : 'text-foreground'">{{ msgPreview(msg) }}</p>
                <div
                  v-if="expandedId === msg.id"
                  class="mt-1.5 p-2 rounded bg-muted/70 border border-border whitespace-pre-wrap break-all text-foreground select-text"
                >{{ msgDetail(msg) }}</div>
              </div>
              <span class="text-muted-foreground shrink-0 tabular-nums w-12 text-right">{{ formatSize(msg.size) }}</span>
              <span class="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  :title="copiedId === msg.id ? '已复制' : '复制内容'"
                  @click.stop="copyMessage(msg)"
                >
                  <Check v-if="copiedId === msg.id" class="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <Copy v-else class="h-3.5 w-3.5" />
                </button>
                <button
                  v-if="canResend"
                  type="button"
                  class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="按原格式重发这条消息"
                  @click.stop="resendMessage(msg)"
                >
                  <RotateCcw class="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- 底部计数 -->
        <div class="border-t border-border px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
          <span class="tabular-nums">显示 {{ filteredMessages.length }} / 共 {{ messages.length }} 条</span>
          <span v-if="droppedCount > 0">日志上限 {{ MAX_MESSAGES }} 条，已丢弃最早 {{ droppedCount }} 条</span>
        </div>
      </div>

      <!-- ③ 侧栏 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 发送构造器 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h2 class="text-base font-semibold mb-3 flex items-center">
            <Send class="h-4 w-4 mr-2 text-primary" />
            发送消息
          </h2>

          <!-- 类型 segmented -->
          <div class="grid grid-cols-4 gap-1 p-1 bg-muted rounded-md mb-3">
            <button
              v-for="f in sendFormats"
              :key="f.value"
              type="button"
              @click="sendFormat = f.value"
              class="py-1 text-xs rounded transition-colors"
              :class="sendFormat === f.value ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'"
            >{{ f.label }}</button>
          </div>
          <p v-if="formatHint" class="text-xs text-muted-foreground mb-2">{{ formatHint }}</p>

          <textarea
            v-model="messageContent"
            :placeholder="messagePlaceholder"
            rows="5"
            class="w-full px-3 py-2 bg-background border border-border rounded-md font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            @keydown.ctrl.enter.prevent="sendMessage()"
            @keydown.meta.enter.prevent="sendMessage()"
          />
          <p v-if="sendError" class="text-xs text-destructive mt-1">{{ sendError }}</p>

          <button
            @click="sendMessage"
            :disabled="!isConnected || !messageContent"
            class="mt-2 w-full bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send class="h-4 w-4 mr-1.5" />
            发送（Ctrl/⌘+Enter）
          </button>

          <!-- payload 历史 -->
          <div v-if="payloadHistory.length" class="mt-3">
            <p class="text-xs text-muted-foreground mb-1.5">最近发送（点击回填）</p>
            <div class="space-y-1 max-h-28 overflow-y-auto">
              <button
                v-for="(p, i) in payloadHistory"
                :key="i"
                type="button"
                @click="restorePayload(p)"
                class="w-full text-left px-2 py-1 rounded bg-muted/60 hover:bg-muted text-xs font-mono truncate flex items-center gap-1.5"
              >
                <span class="px-1 rounded bg-background text-muted-foreground text-[10px] shrink-0">{{ p.format.toUpperCase() }}</span>
                <span class="truncate">{{ p.content }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 心跳 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h2 class="text-base font-semibold mb-3 flex items-center">
            <HeartPulse class="h-4 w-4 mr-2 text-primary" />
            心跳
          </h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">自动心跳（发文本 ping）</span>
              <button
                type="button"
                role="switch"
                :aria-checked="autoHeartbeat"
                :disabled="!isConnected"
                @click="toggleHeartbeat"
                class="relative w-9 h-5 rounded-full transition-colors disabled:opacity-40"
                :class="autoHeartbeat ? 'bg-primary' : 'bg-muted border border-border'"
              >
                <span
                  class="absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all"
                  :class="autoHeartbeat ? 'left-[1.15rem]' : 'left-0.5'"
                />
              </button>
            </div>
            <div v-if="autoHeartbeat" class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">间隔</span>
              <input
                v-model.number="heartbeatSeconds"
                type="number"
                min="1"
                max="600"
                class="w-20 px-2 py-1 bg-background border border-border rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                @change="applyHeartbeat"
              />
              <span class="text-xs text-muted-foreground">秒</span>
            </div>
            <button
              type="button"
              @click="sendPing"
              :disabled="!isConnected"
              class="w-full py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              手动发送 Ping
            </button>
          </div>
        </div>

        <!-- 连接统计 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h2 class="text-base font-semibold mb-3 flex items-center">
            <Info class="h-4 w-4 mr-2 text-primary" />
            连接
          </h2>
          <div v-if="stats" class="space-y-2 text-sm">
            <div class="flex justify-between gap-2">
              <span class="text-muted-foreground shrink-0">端点</span>
              <span class="font-mono text-xs text-foreground break-all text-right">{{ stats.endpoint }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">连接时间</span>
              <span class="text-foreground tabular-nums">{{ stats.connectedAtText }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">持续</span>
              <span class="text-foreground tabular-nums">{{ stats.durationText }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">发送</span>
              <span class="text-foreground tabular-nums">{{ stats.sentCount }} 条 / {{ formatSize(stats.sentBytes) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">接收</span>
              <span class="text-foreground tabular-nums">{{ stats.recvCount }} 条 / {{ formatSize(stats.recvBytes) }}</span>
            </div>
            <div class="pt-2 border-t border-border flex items-center justify-between">
              <span class="text-sm text-muted-foreground">自动重连（最多 5 次）</span>
              <button
                type="button"
                role="switch"
                :aria-checked="autoReconnect"
                @click="autoReconnect = !autoReconnect"
                class="relative w-9 h-5 rounded-full transition-colors"
                :class="autoReconnect ? 'bg-primary' : 'bg-muted border border-border'"
              >
                <span
                  class="absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all"
                  :class="autoReconnect ? 'left-[1.15rem]' : 'left-0.5'"
                />
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">尚未建立连接。断开后统计会保留，方便回看上一次连接的收发情况。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <button
        @click="isSeoContentVisible = !isSeoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 WebSocket？
        </h2>
        <p class="text-muted-foreground mb-4">
          WebSocket 是一种在单个TCP连接上进行全双工通信的协议。WebSocket使得客户端和服务器之间的数据交换变得更加简单，
          允许服务端主动向客户端推送数据。在WebSocket API中，浏览器和服务器只需要完成一次握手，
          两者之间就直接可以创建持久性的连接，并进行双向数据传输。
        </p>
        <p class="text-muted-foreground mb-6">
          相较于传统的HTTP轮询方式，WebSocket具有更低的延迟和更高的效率，特别适合需要实时通信的应用场景，
          如在线聊天、实时数据推送、股票行情、在线游戏等。使用WebSocket测试工具可以帮助开发者快速验证WebSocket服务器的功能，
          调试通信问题，确保应用的稳定性和可靠性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何用本工具调试 WebSocket
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在顶部命令栏输入服务器地址（支持 ws:// 与 wss://），可从 URL 历史里直接选以前测过的端点</li>
          <li>需要子协议的填子协议，点击「连接」，状态点变绿即握手成功</li>
          <li>右侧发送区切换格式：文本、JSON（发送前校验语法）、二进制（按 UTF-8 编码）、HEX（如 48 65 6c，调试二进制协议）</li>
          <li>日志区按毫秒时间戳列出每条收发，点击任意一行展开 JSON 美化或二进制 hex+ASCII 预览</li>
          <li>用方向 Tab（发送/接收/系统/错误）和搜索框过滤日志；hover 消息行可复制或按原格式重发</li>
          <li>长连接测试打开自动心跳与自动重连；断开连接后统计卡保留收发字节数供回看</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>终端式日志</strong>：毫秒时间戳 + 收发间隔 + 字节数，单行一条，方向 Tab 过滤、内容搜索、一键导出 JSON</li>
          <li><strong>四种发送格式</strong>：文本 / JSON（语法校验）/ 二进制（UTF-8 字节）/ HEX（十六进制字节流）</li>
          <li><strong>二进制可视化</strong>：收到的二进制帧按 hex + ASCII 分栏预览（前 256 字节），不再只显示"二进制数据"</li>
          <li><strong>一键重发</strong>：hover 任意收发记录按原格式重发，配合 payload 历史回填，改一个字就能再测</li>
          <li><strong>自动心跳与重连</strong>：按自定义间隔发 ping 保活；异常断线 3 秒后自动重连（最多 5 次）</li>
          <li><strong>关闭码释义</strong>：断开时把 1006、1015 这类数字代码翻译成人话，快速定位是网络、证书还是服务端问题</li>
          <li><strong>连接统计保留</strong>：断开后仍可回看上次连接的时长与收发字节数</li>
          <li><strong>纯本地实现</strong>：连接与数据都在浏览器内完成，不做任何服务端转发</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          WebSocket 关闭码含义对照
        </h2>
        <p class="text-muted-foreground mb-4">
          连接断开时浏览器会给出 close code，对照下表可以快速判断断开原因：
        </p>
        <div class="space-y-1.5 text-sm text-muted-foreground mb-6">
          <p><strong class="text-foreground font-mono">1000</strong> — 正常关闭（双方协商一致）</p>
          <p><strong class="text-foreground font-mono">1001</strong> — 端点离开（页面关闭或服务器下线）</p>
          <p><strong class="text-foreground font-mono">1002</strong> — 协议错误（帧格式不符合 WebSocket 规范）</p>
          <p><strong class="text-foreground font-mono">1003</strong> — 收到了端点无法处理的数据类型</p>
          <p><strong class="text-foreground font-mono">1006</strong> — 异常关闭：网络中断、代理断连或握手未完成，最常见的"莫名掉线"就是它</p>
          <p><strong class="text-foreground font-mono">1008</strong> — 策略原因被拒（鉴权失败、Token 过期、来源不在白名单）</p>
          <p><strong class="text-foreground font-mono">1009</strong> — 单条消息超出服务器限制</p>
          <p><strong class="text-foreground font-mono">1011</strong> — 服务器内部错误</p>
          <p><strong class="text-foreground font-mono">1015</strong> — TLS 握手失败（wss:// 证书无效或被中间设备拦截）</p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">WebSocket 和 HTTP 轮询有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              WebSocket是全双工通信协议，客户端和服务器可以同时发送数据，而HTTP轮询需要客户端不断发起请求。
              WebSocket连接建立后可以持久保持，减少了握手开销，延迟更低，效率更高。
              对于需要频繁通信的应用，WebSocket是更好的选择。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么 WebSocket 连接失败？</h3>
            <p class="text-muted-foreground mt-1">
              可能的原因包括：URL格式错误、服务器不支持WebSocket、防火墙阻止连接、SSL证书问题（对于wss://）。
              本工具会在关闭码释义里给出断开原因提示：1015 优先查证书链，1006 优先查网络与代理，1008 优先查鉴权与来源限制。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">怎么测试本机的 WebSocket 服务？</h3>
            <p class="text-muted-foreground mt-1">
              本地起的服务直接填 ws://127.0.0.1:端口 即可（本页面就是浏览器环境，访问本机回环地址没有跨域限制——
              WebSocket 握手遵循同源策略但服务端通常不校验 Origin 时可直连；若服务端校验 Origin，请把允许来源加上本页域名）。
              示例下拉里内置了本地回环端点，方便从命令行起一个 echo 服务后快速联调。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">WebSocket 支持哪些消息类型？</h3>
            <p class="text-muted-foreground mt-1">
              协议层面只有文本帧和二进制帧两种。文本帧可以放任何 UTF-8 字符串（JSON 是其上的约定），
              二进制帧可以承载图片、Protocol Buffers、自定义协议等任意字节。
              本工具的发送区把这两种帧拆成了文本 / JSON / 二进制 / HEX 四个入口，接收日志会对每一帧自动识别格式并给出对应预览。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐 -->
    <RelatedTools :currentToolId="'websocket-test'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useSeoMeta, useHead } from 'nuxt/app'
import {
  Send, Wifi, X, Loader2, Info, ArrowDown, Trash2,
  Download, HelpCircle, ChevronUp, Copy, Check, RotateCcw,
  Terminal, HeartPulse
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'
import { trackEvent } from '~/utils/track'

// SEO配置
useSeoMeta({
  title: 'WebSocket测试工具 - 在线WebSocket连接调试工具',
  meta: [
    { name: 'description', content: '终端式在线WebSocket调试工具：毫秒级消息时序、JSON/二进制/HEX收发、方向过滤与搜索、自动心跳与断线重连、关闭码中文释义。纯前端实现，数据不出浏览器。' },
    { name: 'keywords', content: 'WebSocket测试,WebSocket客户端,WebSocket调试,websocket在线测试,WSS,WS,心跳,断线重连,二进制,HEX' }
  ]
})

const tool = tools.find(t => t.id === 'websocket-test')

// JSON-LD（与全站工具页同构：WebApplication + Offer）
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'WebSocket 测试工具',
            url: 'https://www.util.cn/tools/websocket-test/',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            description: '终端式在线 WebSocket 调试工具：毫秒级消息时序、JSON/二进制/HEX 收发、自动心跳与断线重连，纯浏览器本地运行。',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }
          }
        ]
      })
    }
  ]
})

// ---------- 常量 ----------
const MAX_MESSAGES = 200
const MAX_RECONNECT = 5
const encoder = new TextEncoder()

const CLOSE_CODE_TEXT = {
  1000: '正常关闭',
  1001: '端点离开（页面关闭/服务器下线）',
  1002: '协议错误',
  1003: '收到无法处理的数据类型',
  1005: '未提供状态码',
  1006: '异常关闭（网络中断/代理断连/握手未完成）',
  1007: '数据格式不一致',
  1008: '策略原因拒绝（鉴权/来源限制）',
  1009: '消息超出大小限制',
  1010: '客户端要求的扩展未协商',
  1011: '服务器内部错误',
  1015: 'TLS 握手失败（证书无效或被拦截）'
}

// ---------- 状态 ----------
const wsUrl = ref('wss://echo.websocket.org')
const protocol = ref('')
const urlHistory = ref([])
const sendFormat = ref('text') // text | json | binary | hex
const messageContent = ref('')
const sendError = ref('')
const isConnected = ref(false)
const connecting = ref(false)
const messages = ref([])
const expandedId = ref(null)
const copiedId = ref(null)
const filterTab = ref('all')
const searchText = ref('')
const autoScroll = ref(true)
const autoHeartbeat = ref(false)
const heartbeatSeconds = ref(30)
const autoReconnect = ref(false)
const payloadHistory = ref([])
const stats = ref(null)
const droppedCount = ref(0)
const messageContainer = ref(null)

// SEO 内容折叠状态
const isSeoContentVisible = ref(true)

const sendFormats = [
  { value: 'text', label: '文本' },
  { value: 'json', label: 'JSON' },
  { value: 'binary', label: '二进制' },
  { value: 'hex', label: 'HEX' }
]
const filterTabs = computed(() => [
  { value: 'all', label: '全部', count: messages.value.length },
  { value: 'sent', label: '发送', count: messages.value.filter((m) => m.type === 'sent').length },
  { value: 'received', label: '接收', count: messages.value.filter((m) => m.type === 'received').length },
  { value: 'system', label: '系统', count: messages.value.filter((m) => m.type === 'system').length },
  { value: 'error', label: '错误', count: messages.value.filter((m) => m.type === 'error').length }
])

// ---------- 内部句柄（不进入响应式） ----------
let ws = null
let msgId = 0
let durationTimer = null
let heartbeatTimer = null
let reconnectTimer = null
let durationSeconds = 0
let lastMessageAt = null
let manualClose = false
let reconnectAttempts = 0
let copiedTimer = null
let allCopiedTimer = null
const allCopied = ref(false)

// ---------- 计算属性 ----------
const statusText = computed(() => {
  if (connecting.value) return '连接中'
  if (isConnected.value) return '已连接'
  return '未连接'
})
const statusDotClass = computed(() => {
  if (connecting.value) return 'bg-yellow-500 animate-pulse'
  if (isConnected.value) return 'bg-green-500'
  return 'bg-muted-foreground/40'
})
const formatHint = computed(() => {
  switch (sendFormat.value) {
    case 'json': return '发送前会校验 JSON 语法，原样字符串发出'
    case 'binary': return '按 UTF-8 编码转字节后以二进制帧发送'
    case 'hex': return '十六进制字节流，如 48 65 6c 6c 6f（可带空格）'
    default: return ''
  }
})
const messagePlaceholder = computed(() => {
  switch (sendFormat.value) {
    case 'json': return '{"type":"message","content":"hello"}'
    case 'binary': return '要作为二进制帧发送的文本'
    case 'hex': return '48 65 6c 6c 6f'
    default: return '输入要发送的消息…'
  }
})
const canResend = computed(() => isConnected.value)

const filteredMessages = computed(() => {
  const kw = searchText.value.trim().toLowerCase()
  return messages.value.filter((m) => {
    if (filterTab.value !== 'all' && m.type !== filterTab.value) return false
    if (kw && !msgPlainText(m).toLowerCase().includes(kw)) return false
    return true
  })
})

// ---------- 消息模型 ----------
function pushMessage({ type, format = 'text', data, size = 0 }) {
  const now = new Date()
  const deltaMs = lastMessageAt ? now.getTime() - lastMessageAt.getTime() : null
  lastMessageAt = now
  messages.value.push({ id: ++msgId, type, format, data, size, timestamp: now, deltaMs })
  if (messages.value.length > MAX_MESSAGES) {
    messages.value.shift()
    droppedCount.value++
  }
}

function addSystem(text) {
  pushMessage({ type: 'system', format: 'text', data: text, size: encoder.encode(text).length })
}
function addError(text) {
  pushMessage({ type: 'error', format: 'text', data: text, size: encoder.encode(text).length })
}

// ---------- 展示辅助 ----------
function pad(n, w = 2) {
  return String(n).padStart(w, '0')
}
function formatMs(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}
function formatSize(n) {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  return `${(n / 1024).toFixed(1)} KB`
}
function msgDataText(msg) {
  if (msg.format === 'binary' || msg.format === 'hex') {
    return bytesToHex(msg.data.bytes)
  }
  if (msg.format === 'json') {
    try { return JSON.stringify(msg.data) } catch { return String(msg.data) }
  }
  return String(msg.data)
}
function msgPlainText(msg) {
  const dir = msg.type === 'sent' ? '发送' : msg.type === 'received' ? '接收' : msg.type === 'error' ? '错误' : '系统'
  return `${dir} ${msgDataText(msg)}`
}
function msgPreview(msg) {
  const text = msgDataText(msg)
  return text.length > 200 ? text.slice(0, 200) + '…' : text
}
function msgDetail(msg) {
  if (msg.format === 'json') {
    try { return JSON.stringify(msg.data, null, 2) } catch { return String(msg.data) }
  }
  if (msg.format === 'binary' || msg.format === 'hex') {
    return hexDump(msg.data.bytes)
  }
  return String(msg.data)
}
function badgeText(msg) {
  return msg.type === 'sent' ? '发送' : msg.type === 'received' ? '接收' : msg.type === 'error' ? '错误' : '系统'
}
function badgeClass(msg) {
  switch (msg.type) {
    case 'sent': return 'text-primary'
    case 'received': return 'text-green-600 dark:text-green-400'
    case 'error': return 'text-destructive'
    default: return 'text-muted-foreground'
  }
}
function bytesToHex(bytes, limit = Infinity) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const n = Math.min(arr.length, limit)
  const out = []
  for (let i = 0; i < n; i++) out.push(pad(arr[i].toString(16), 2))
  const hex = out.join(' ')
  return n < arr.length ? hex + ` …（共 ${arr.length} 字节）` : hex
}
function hexDump(bytes, maxBytes = 256) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const n = Math.min(arr.length, maxBytes)
  const lines = []
  for (let off = 0; off < n; off += 16) {
    const chunk = arr.slice(off, off + 16)
    const hexParts = []
    const asciiParts = []
    for (const b of chunk) {
      hexParts.push(pad(b.toString(16), 2))
      asciiParts.push(b >= 32 && b < 127 ? String.fromCharCode(b) : '·')
    }
    lines.push(`${pad(off.toString(16), 8)}  ${pad(hexParts.join(' '), 47)}  |${asciiParts.join('')}|`)
  }
  const head = `共 ${arr.length} 字节${arr.length > maxBytes ? `（仅预览前 ${maxBytes} 字节）` : ''}\n`
  return head + lines.join('\n')
}
function hexToBytes(input) {
  const clean = (input || '').replace(/[\s,]+/g, '')
  if (clean.length === 0) throw new Error('HEX 内容为空')
  if (clean.length % 2 !== 0) throw new Error('HEX 长度为奇数，检查是否漏了一位')
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('HEX 只允许 0-9 a-f A-F 和空格')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

// ---------- 剪贴板（带降级，参照 thread-reference-table 模式） ----------
async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}
function flashCopied(id) {
  copiedId.value = id
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copiedId.value = null }, 1500)
}
async function copyMessage(msg) {
  const ok = await writeClipboard(msgDetail(msg))
  if (ok) flashCopied(msg.id)
}
async function copyAll() {
  const text = filteredMessages.value
    .map((m) => `${formatMs(m.timestamp)} [${badgeText(m)}] ${msgDataText(m)}`)
    .join('\n')
  const ok = await writeClipboard(text)
  if (ok) {
    allCopied.value = true
    if (allCopiedTimer) clearTimeout(allCopiedTimer)
    allCopiedTimer = setTimeout(() => { allCopied.value = false }, 1500)
  }
}

// ---------- 导出 ----------
function exportLog() {
  const payload = filteredMessages.value.map((m) => ({
    time: formatMs(m.timestamp),
    direction: badgeText(m),
    format: m.format,
    size: m.size,
    content: msgDataText(m)
  }))
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `websocket-log-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------- 连接 ----------
function toggleConnection() {
  if (isConnected.value) disconnect(true)
  else connect()
}

function connect() {
  const url = wsUrl.value.trim()
  if (!url || connecting.value) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  connecting.value = true
  manualClose = false
  try {
    const p = protocol.value.trim()
    ws = p ? new WebSocket(url, p) : new WebSocket(url)
    ws.binaryType = 'arraybuffer'
  } catch (err) {
    connecting.value = false
    addError('创建连接失败：' + err.message)
    return
  }

  ws.onopen = () => {
    isConnected.value = true
    connecting.value = false
    reconnectAttempts = 0
    durationSeconds = 0
    stats.value = {
      endpoint: url,
      connectedAtText: new Date().toLocaleTimeString(),
      durationText: '0秒',
      sentCount: 0,
      recvCount: 0,
      sentBytes: 0,
      recvBytes: 0
    }
    addSystem(`已连接 ${url}`)
    trackEvent('工具转化', '连接成功', 'websocket-test')
    // URL 历史（去重，最多 10）
    urlHistory.value = [url, ...urlHistory.value.filter((u) => u !== url)].slice(0, 10)
    startDurationTimer()
    applyHeartbeat()
  }

  ws.onclose = (event) => {
    const code = event.code
    const reason = event.reason || CLOSE_CODE_TEXT[code] || '未知原因'
    isConnected.value = false
    connecting.value = false
    stopDurationTimer()
    stopHeartbeat()
    addSystem(`连接已关闭（${code}: ${reason}）`)
    if (!manualClose && autoReconnect.value && reconnectAttempts < MAX_RECONNECT && wsUrl.value.trim()) {
      reconnectAttempts++
      addSystem(`3 秒后进行第 ${reconnectAttempts}/${MAX_RECONNECT} 次自动重连…`)
      reconnectTimer = setTimeout(() => {
        if (autoReconnect.value && !isConnected.value) connect()
      }, 3000)
    }
  }

  ws.onerror = () => {
    // WebSocket 的 error 事件不携带失败原因，具体原因以紧随其后的 close code 为准
    connecting.value = false
    addError('连接出错，原因见紧随其后的关闭码（wss 证书、网络、鉴权都可能）')
  }

  ws.onmessage = (event) => {
    const raw = event.data
    if (raw instanceof ArrayBuffer) {
      const bytes = new Uint8Array(raw)
      if (stats.value) { stats.value.recvCount++; stats.value.recvBytes += bytes.length }
      pushMessage({ type: 'received', format: 'binary', data: { bytes }, size: bytes.length })
      return
    }
    const size = encoder.encode(raw).length
    if (stats.value) { stats.value.recvCount++; stats.value.recvBytes += size }
    let format = 'text'
    let data = raw
    try {
      data = JSON.parse(raw)
      format = 'json'
    } catch { /* 保持原始文本 */ }
    pushMessage({ type: 'received', format, data, size })
  }
}

function disconnect(byUser) {
  if (byUser) manualClose = true
  stopHeartbeat()
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (ws) {
    try { ws.close() } catch { /* 忽略已断开时的异常 */ }
    ws = null
  }
  if (byUser) {
    isConnected.value = false
    connecting.value = false
    stopDurationTimer()
  }
}

// ---------- 发送 ----------
function sendMessage() {
  if (!isConnected.value || !ws || !messageContent.value) return
  try {
    sendPayload(sendFormat.value, messageContent.value)
    // payload 历史（去重，最多 20）
    payloadHistory.value = [
      { content: messageContent.value, format: sendFormat.value },
      ...payloadHistory.value.filter((p) => !(p.format === sendFormat.value && p.content === messageContent.value))
    ].slice(0, 20)
    messageContent.value = ''
    sendError.value = ''
  } catch (err) {
    sendError.value = err.message
  }
}

function sendPayload(format, content) {
  let payload
  let size = 0
  let logFormat = format
  let logData = content

  if (format === 'json') {
    try {
      JSON.parse(content)
    } catch (err) {
      throw new Error('JSON 语法错误：' + err.message)
    }
    payload = content
    size = encoder.encode(content).length
  } else if (format === 'hex') {
    const bytes = hexToBytes(content)
    payload = bytes
    size = bytes.length
    logData = { bytes }
  } else if (format === 'binary') {
    const bytes = encoder.encode(content)
    payload = bytes
    size = bytes.length
    logFormat = 'binary'
    logData = { bytes }
  } else {
    payload = content
    size = encoder.encode(content).length
  }

  ws.send(payload)
  if (stats.value) { stats.value.sentCount++; stats.value.sentBytes += size }
  pushMessage({ type: 'sent', format: logFormat, data: logData, size })
  trackEvent('工具转化', '发送消息', 'websocket-test')
}

function restorePayload(p) {
  sendFormat.value = p.format
  messageContent.value = p.content
  sendError.value = ''
}

function canResendPayload(msg) {
  return msg.type === 'sent' || msg.type === 'received'
}

function resendMessage(msg) {
  if (!isConnected.value || !ws || !canResendPayload(msg)) return
  try {
    if (msg.format === 'binary' || msg.format === 'hex') {
      const bytes = msg.data.bytes
      ws.send(bytes)
      if (stats.value) { stats.value.sentCount++; stats.value.sentBytes += bytes.length }
      pushMessage({ type: 'sent', format: msg.format, data: { bytes: bytes.slice() }, size: bytes.length })
    } else {
      const text = msg.format === 'json' ? JSON.stringify(msg.data) : String(msg.data)
      ws.send(text)
      const size = encoder.encode(text).length
      if (stats.value) { stats.value.sentCount++; stats.value.sentBytes += size }
      pushMessage({ type: 'sent', format: msg.format, data: msg.data, size })
    }
    trackEvent('工具转化', '发送消息', 'websocket-test')
    sendError.value = ''
  } catch (err) {
    sendError.value = '重发失败：' + err.message
  }
}

// ---------- 心跳 ----------
function toggleHeartbeat() {
  autoHeartbeat.value = !autoHeartbeat.value
  applyHeartbeat()
}
function applyHeartbeat() {
  stopHeartbeat()
  if (!autoHeartbeat.value || !isConnected.value) return
  const ms = Math.max(1, Number(heartbeatSeconds.value) || 30) * 1000
  heartbeatTimer = setInterval(() => {
    if (!isConnected.value || !ws) { stopHeartbeat(); return }
    try {
      ws.send('ping')
      if (stats.value) { stats.value.sentCount++; stats.value.sentBytes += 4 }
      pushMessage({ type: 'system', format: 'text', data: '自动心跳 ping', size: 4 })
    } catch {
      stopHeartbeat()
    }
  }, ms)
}
function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
}
function sendPing() {
  if (!isConnected.value || !ws) return
  try {
    ws.send('ping')
    if (stats.value) { stats.value.sentCount++; stats.value.sentBytes += 4 }
    pushMessage({ type: 'system', format: 'text', data: '手动心跳 ping', size: 4 })
  } catch (err) {
    addError('发送 Ping 失败：' + err.message)
  }
}

// ---------- 示例 ----------
function loadExample(event) {
  const examples = {
    echo: { url: 'wss://echo.websocket.org' },
    local: { url: 'ws://127.0.0.1:3106' }
  }
  const example = examples[event.target.value]
  if (example) wsUrl.value = example.url
  event.target.value = ''
}

// ---------- 其它 ----------
function clearMessages() {
  messages.value = []
  expandedId.value = null
  droppedCount.value = 0
  lastMessageAt = null
}

function startDurationTimer() {
  stopDurationTimer()
  durationTimer = setInterval(() => {
    durationSeconds++
    if (stats.value) {
      const s = durationSeconds
      stats.value.durationText = s < 60
        ? `${s}秒`
        : s < 3600
          ? `${Math.floor(s / 60)}分${s % 60}秒`
          : `${Math.floor(s / 3600)}小时${Math.floor((s % 3600) / 60)}分`
    }
  }, 1000)
}
function stopDurationTimer() {
  if (durationTimer) { clearInterval(durationTimer); durationTimer = null }
}

watch(() => messages.value.length, () => {
  if (!autoScroll.value) return
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
})

if (tool) {
  addRecentTool(tool.id)
}

onUnmounted(() => {
  manualClose = true
  stopDurationTimer()
  stopHeartbeat()
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (copiedTimer) clearTimeout(copiedTimer)
  if (allCopiedTimer) clearTimeout(allCopiedTimer)
  if (ws) {
    try { ws.close() } catch { /* 忽略 */ }
    ws = null
  }
})
</script>
