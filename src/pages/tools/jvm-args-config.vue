<template>
  <div class="max-w-8xl mx-auto">
    <!-- 标题区域 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JVM 启动参数配置工具</h1>
      <p class="text-muted-foreground">可视化配置 Java 虚拟机启动参数，支持内存设置、GC 选择、性能调优等选项</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：配置区域 -->
      <div class="space-y-4">
        <!-- 智能推荐模块 -->
        <div class="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-primary" />
            智能参数推荐
          </h2>
          <p class="text-sm text-muted-foreground mb-4">根据服务器配置和应用场景，智能推荐最优 JVM 参数配置</p>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <!-- 服务器内存 -->
            <div>
              <label class="text-sm font-medium mb-2 block">服务器内存</label>
              <select v-model="recommendation.serverMemory" class="w-full px-3 py-2 border rounded-md text-sm bg-background">
                <option value="1">1 GB</option>
                <option value="2">2 GB</option>
                <option value="4">4 GB</option>
                <option value="8">8 GB</option>
                <option value="16">16 GB</option>
                <option value="32">32 GB</option>
                <option value="64">64 GB</option>
                <option value="128">128 GB+</option>
              </select>
            </div>

            <!-- CPU 核心数 -->
            <div>
              <label class="text-sm font-medium mb-2 block">CPU 核心数</label>
              <select v-model="recommendation.cpuCores" class="w-full px-3 py-2 border rounded-md text-sm bg-background">
                <option value="2">2 核</option>
                <option value="4">4 核</option>
                <option value="8">8 核</option>
                <option value="16">16 核</option>
                <option value="32">32 核</option>
                <option value="64">64 核+</option>
              </select>
            </div>

            <!-- Java 版本 -->
            <div>
              <label class="text-sm font-medium mb-2 block">Java 版本</label>
              <select v-model="recommendation.javaVersion" class="w-full px-3 py-2 border rounded-md text-sm bg-background">
                <option value="8">Java 8</option>
                <option value="11">Java 11</option>
                <option value="17">Java 17 (LTS)</option>
                <option value="21">Java 21 (LTS)</option>
                <option value="23">Java 23 (最新)</option>
              </select>
            </div>

            <!-- 应用场景 -->
            <div>
              <label class="text-sm font-medium mb-2 block">应用场景</label>
              <select v-model="recommendation.scenario" class="w-full px-3 py-2 border rounded-md text-sm bg-background">
                <option value="microservice">微服务</option>
                <option value="web">Web 应用</option>
                <option value="batch">批处理任务</option>
                <option value="bigdata">大数据处理</option>
                <option value="gateway">API 网关</option>
                <option value="cache">缓存服务</option>
                <option value="message">消息队列</option>
                <option value="lowlatency">低延迟交易</option>
              </select>
            </div>
          </div>

          <!-- 场景说明 -->
          <div class="p-3 bg-background/50 rounded-lg mb-4">
            <p class="text-sm">
              <span class="font-medium">场景特点：</span>
              <span class="text-muted-foreground">{{ scenarioDescription }}</span>
            </p>
          </div>

          <div class="flex gap-3">
            <button
              @click="applyRecommendation"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Sparkles class="w-4 h-4" />
              应用推荐配置
            </button>
            <button
              @click="resetConfig"
              class="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm"
            >
              重置
            </button>
          </div>
        </div>

        <!-- 内存配置 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <MemoryStick class="w-5 h-5 text-primary" />
            内存配置
          </h2>
          <div class="space-y-4">
            <!-- 堆内存 -->
            <div>
              <label class="text-sm font-medium flex justify-between">
                <span>初始堆内存 (-Xms)</span>
                <span class="text-primary">{{ config.heapSize.initial }}M</span>
              </label>
              <input
                v-model.number="config.heapSize.initial"
                type="range"
                min="128"
                max="8192"
                step="128"
                class="w-full mt-2"
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>128M</span>
                <span>8192M</span>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium flex justify-between">
                <span>最大堆内存 (-Xmx)</span>
                <span class="text-primary">{{ config.heapSize.max }}M</span>
              </label>
              <input
                v-model.number="config.heapSize.max"
                type="range"
                min="128"
                max="16384"
                step="128"
                class="w-full mt-2"
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>128M</span>
                <span>16384M</span>
              </div>
            </div>

            <!-- 新生代内存 -->
            <div>
              <label class="text-sm font-medium flex justify-between">
                <span>新生代内存 (-Xmn / -XX:NewRatio)</span>
                <span class="text-primary">{{ config.youngGenRatio }}%</span>
              </label>
              <input
                v-model.number="config.youngGenRatio"
                type="range"
                min="10"
                max="75"
                step="5"
                class="w-full mt-2"
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>75%</span>
              </div>
            </div>

            <!-- 元空间 -->
            <div>
              <label class="text-sm font-medium">元空间大小 (-XX:MetaspaceSize)</label>
              <div class="flex gap-2 mt-2">
                <input
                  v-model.number="config.metaspaceSize"
                  type="number"
                  min="64"
                  max="1024"
                  class="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <span class="flex items-center text-sm text-muted-foreground">M</span>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium">最大元空间 (-XX:MaxMetaspaceSize)</label>
              <div class="flex gap-2 mt-2">
                <input
                  v-model.number="config.maxMetaspaceSize"
                  type="number"
                  min="64"
                  max="2048"
                  class="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <span class="flex items-center text-sm text-muted-foreground">M</span>
              </div>
            </div>

            <!-- 线程栈大小 -->
            <div>
              <label class="text-sm font-medium">线程栈大小 (-Xss)</label>
              <div class="flex gap-2 mt-2">
                <input
                  v-model.number="config.stackSize"
                  type="number"
                  min="256"
                  max="4096"
                  step="128"
                  class="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <span class="flex items-center text-sm text-muted-foreground">K</span>
              </div>
            </div>
          </div>
        </div>

        <!-- GC 配置 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <RotateCcw class="w-5 h-5 text-primary" />
            垃圾回收器 (GC)
          </h2>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">GC 算法选择</label>
              <select v-model="config.gcAlgorithm" class="mt-2 w-full px-3 py-2 border rounded-md text-sm">
                <option value="G1">G1 GC (推荐, Java 9+)</option>
                <option value="Parallel">Parallel GC (吞吐量优先)</option>
                <option value="CMS">CMS GC (低延迟, 已废弃)</option>
                <option value="ZGC">ZGC (超低延迟, Java 15+)</option>
                <option value="Shenandoah">Shenandoah GC (低延迟)</option>
                <option value="Serial">Serial GC (单线程, 小应用)</option>
              </select>
            </div>

            <div v-if="config.gcAlgorithm === 'G1'" class="p-3 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground">
                G1 GC 是服务器应用的默认选择，平衡了吞吐量和延迟，适合大堆内存场景。
              </p>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">打印 GC 详情</label>
              <input
                v-model="config.printGCDetails"
                type="checkbox"
                class="rounded text-primary focus:ring-primary"
              />
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">GC 日志文件</label>
              <input
                v-model="config.gcLogFile"
                type="text"
                placeholder="/logs/gc.log"
                class="w-48 px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>

        <!-- 性能调优 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap class="w-5 h-5 text-primary" />
            性能调优
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium">启用 AggressiveOpts</label>
                <p class="text-xs text-muted-foreground">启用激进的优化选项</p>
              </div>
              <input
                v-model="config.aggressiveOpts"
                type="checkbox"
                class="rounded text-primary focus:ring-primary"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium">使用 CompressedOops</label>
                <p class="text-xs text-muted-foreground">压缩普通对象指针(堆<32G自动启用)</p>
              </div>
              <input
                v-model="config.compressedOops"
                type="checkbox"
                class="rounded text-primary focus:ring-primary"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium">启用 String Deduplication</label>
                <p class="text-xs text-muted-foreground">字符串去重(G1 GC)</p>
              </div>
              <input
                v-model="config.stringDeduplication"
                type="checkbox"
                class="rounded text-primary focus:ring-primary"
              />
            </div>

            <div>
              <label class="text-sm font-medium">编译器模式</label>
              <select v-model="config.compilerMode" class="mt-2 w-full px-3 py-2 border rounded-md text-sm">
                <option value="mixed">混合模式 (C1 + C2)</option>
                <option value="c1">仅 C1 (快速编译)</option>
                <option value="c2">仅 C2 (深度优化)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 其他配置 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings class="w-5 h-5 text-primary" />
            其他配置
          </h2>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">时区 (-Duser.timezone)</label>
              <input
                v-model="config.timezone"
                type="text"
                placeholder="Asia/Shanghai"
                class="mt-2 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div>
              <label class="text-sm font-medium">文件编码 (-Dfile.encoding)</label>
              <select v-model="config.fileEncoding" class="mt-2 w-full px-3 py-2 border rounded-md text-sm">
                <option value="UTF-8">UTF-8</option>
                <option value="GBK">GBK</option>
                <option value="ISO-8859-1">ISO-8859-1</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">自定义 JVM 参数</label>
              <textarea
                v-model="config.customArgs"
                placeholder="-XX:+UseLargePages&#10;-XX:ParallelGCThreads=8"
                class="mt-2 w-full px-3 py-2 border rounded-md text-sm h-20 resize-none"
              ></textarea>
            </div>

            <div>
              <label class="text-sm font-medium">Java Agent</label>
              <textarea
                v-model="config.javaAgents"
                placeholder="-javaagent:/path/to/agent.jar&#10;-javaagent:/path/to/skywalking-agent.jar"
                class="mt-2 w-full px-3 py-2 border rounded-md text-sm h-20 resize-none"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览区域 -->
      <div class="space-y-4">
        <!-- 生成的命令 -->
        <div class="bg-card rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">生成的启动命令</h2>
            <button
              @click="copyCommand"
              :disabled="!generatedCommand"
              class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <div class="bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
            <code v-if="generatedCommand" class="text-sm whitespace-pre-wrap break-all">{{ generatedCommand }}</code>
            <div v-else class="text-center text-muted-foreground py-8">
              <Cpu class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>配置 JVM 参数以生成启动命令</p>
            </div>
          </div>
        </div>

        <!-- 快速预设 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">快速预设</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="p-3 bg-muted hover:bg-muted/80 rounded-lg text-left transition-colors"
            >
              <div class="font-medium text-sm">{{ preset.name }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ preset.description }}</div>
            </button>
          </div>
        </div>

        <!-- 参数说明 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">常用参数说明</h2>
          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-primary font-mono">-Xms</code>
              <p class="text-muted-foreground mt-1">初始堆内存大小，建议与 -Xmx 相同避免动态调整</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-primary font-mono">-Xmx</code>
              <p class="text-muted-foreground mt-1">最大堆内存大小，生产环境建议不超过物理内存的 75%</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-primary font-mono">-Xmn / -XX:NewRatio</code>
              <p class="text-muted-foreground mt-1">新生代大小，建议设置为堆内存的 30%-50%</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-primary font-mono">-XX:MetaspaceSize</code>
              <p class="text-muted-foreground mt-1">元空间初始大小，取代永久代(PermGen)</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-primary font-mono">-Xss</code>
              <p class="text-muted-foreground mt-1">线程栈大小，默认 1MB，递归深度大时可适当增加</p>
            </div>
          </div>
        </div>

        <!-- 最佳实践 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info class="w-5 h-5 text-primary" />
            JVM 调优最佳实践
          </h2>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>生产环境将 -Xms 和 -Xmx 设置为相同值，避免内存动态调整开销</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>堆内存不超过物理内存的 75%，预留空间给操作系统和元空间</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>选择合适的 GC 算法：大内存用 G1，低延迟用 ZGC/Shenandoah</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>开启 GC 日志便于问题排查，生产环境建议开启</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>监控 JVM 指标：堆使用率、GC 频率、GC 耗时、线程数</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>避免过早优化，先进行性能测试找出瓶颈</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 描述区域 -->
    <div class="mt-12 space-y-6">
      <!-- 关于 JVM -->
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于 JVM 启动参数
        </h3>
        <div class="space-y-3 text-sm text-muted-foreground">
          <p>JVM (Java Virtual Machine) 启动参数是优化 Java 应用性能的关键。合理配置堆内存、选择合适的垃圾回收器、调整新生代比例等参数，可以显著提升应用的吞吐量和响应速度。</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 class="font-medium text-foreground mb-2">常用参数分类：</h4>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>-Xms/-Xmx</strong>：堆内存大小设置</li>
                <li><strong>-XX:NewRatio</strong>：新生代与老年代比例</li>
                <li><strong>-XX:MetaspaceSize</strong>：元空间大小</li>
                <li><strong>-Xss</strong>：线程栈大小</li>
                <li><strong>-XX:+UseG1GC</strong>：使用 G1 垃圾回收器</li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-foreground mb-2">性能调优建议：</h4>
              <ul class="list-disc list-inside space-y-1">
                <li>生产环境将 -Xms 和 -Xmx 设为相同值</li>
                <li>堆内存不超过物理内存的 75%</li>
                <li>大堆(>16GB)优先选择 G1 GC 或 ZGC</li>
                <li>低延迟场景考虑 ZGC 或 Shenandoah</li>
                <li>开启 GC 日志便于问题排查</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 常见问题 -->
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">常见问题</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium text-foreground mb-2">如何设置合适的堆内存大小？</h4>
            <p class="text-muted-foreground">建议设置为物理内存的 60-75%。例如 8GB 内存的服务器，堆内存可设置为 5-6GB。</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium text-foreground mb-2">什么是 OOM (OutOfMemoryError)？</h4>
            <p class="text-muted-foreground">当 JVM 堆内存不足时抛出的错误。可通过增大 -Xmx 值或优化代码减少内存占用来解决。</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium text-foreground mb-2">G1 GC 和 Parallel GC 有什么区别？</h4>
            <p class="text-muted-foreground">G1 GC 适合大内存、低延迟场景；Parallel GC 适合小内存、追求高吞吐量的场景。</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium text-foreground mb-2">什么时候使用 ZGC？</h4>
            <p class="text-muted-foreground">ZGC 适合对延迟要求极高的应用（如金融交易），需要 Java 15+ 版本支持。</p>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/docker-command"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Package class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Docker 命令生成</p>
              <p class="text-xs text-muted-foreground">可视化生成 Docker 命令</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/linux-command"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Terminal class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Linux 命令生成</p>
              <p class="text-xs text-muted-foreground">生成常用 Linux 命令</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/git-command"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <GitBranch class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Git 命令生成</p>
              <p class="text-xs text-muted-foreground">生成 Git 操作命令</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MemoryStick, RotateCcw, Zap, Settings, Cpu, Info, Sparkles, Package, Terminal, GitBranch, ArrowRight } from 'lucide-vue-next'
import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('JVM 启动参数配置工具 - Java 虚拟机参数可视化配置')

// 状态管理
const copied = ref(false)

// 智能推荐配置
const recommendation = ref({
  serverMemory: '8',
  cpuCores: '4',
  javaVersion: '17',
  scenario: 'microservice'
})

// 场景说明
const scenarioDescriptions = {
  microservice: '轻量级、快速启动、低内存占用，适合容器化部署',
  web: '高并发、稳定响应，需要平衡吞吐量和延迟',
  batch: '高吞吐量、长时间运行，优先处理速度',
  bigdata: '大内存、高吞吐，需要处理海量数据',
  gateway: '高并发、低延迟，需要快速路由和转发',
  cache: '高并发、低延迟，内存访问密集型',
  message: '高吞吐、持久化要求，消息积压处理能力强',
  lowlatency: '超低延迟、GC 暂停最小化，适合金融交易'
}

const scenarioDescription = computed(() => {
  return scenarioDescriptions[recommendation.value.scenario] || ''
})

// 默认配置（用于重置）
const defaultConfig = {
  heapSize: {
    initial: 512,
    max: 1024
  },
  youngGenRatio: 30,
  metaspaceSize: 256,
  maxMetaspaceSize: 512,
  stackSize: 1024,
  gcAlgorithm: 'G1',
  printGCDetails: true,
  gcLogFile: '/logs/gc.log',
  aggressiveOpts: false,
  compressedOops: true,
  stringDeduplication: false,
  compilerMode: 'mixed',
  timezone: 'Asia/Shanghai',
  fileEncoding: 'UTF-8',
  customArgs: '',
  javaAgents: ''
}

// 配置选项
const config = ref({
  heapSize: {
    initial: 512,
    max: 1024
  },
  youngGenRatio: 30,
  metaspaceSize: 256,
  maxMetaspaceSize: 512,
  stackSize: 1024,
  gcAlgorithm: 'G1',
  printGCDetails: true,
  gcLogFile: '/logs/gc.log',
  aggressiveOpts: false,
  compressedOops: true,
  stringDeduplication: false,
  compilerMode: 'mixed',
  timezone: 'Asia/Shanghai',
  fileEncoding: 'UTF-8',
  customArgs: '',
  javaAgents: ''
})

// 快速预设
const presets = [
  {
    name: '小型应用',
    description: '适合小型微服务或工具',
    config: {
      heapSize: { initial: 256, max: 512 },
      youngGenRatio: 30,
      metaspaceSize: 128,
      maxMetaspaceSize: 256,
      stackSize: 512,
      gcAlgorithm: 'G1',
      printGCDetails: false
    }
  },
  {
    name: '中型应用',
    description: '适合标准 Web 应用',
    config: {
      heapSize: { initial: 1024, max: 2048 },
      youngGenRatio: 30,
      metaspaceSize: 256,
      maxMetaspaceSize: 512,
      stackSize: 1024,
      gcAlgorithm: 'G1',
      printGCDetails: true
    }
  },
  {
    name: '大型应用',
    description: '适合高并发服务',
    config: {
      heapSize: { initial: 4096, max: 8192 },
      youngGenRatio: 25,
      metaspaceSize: 512,
      maxMetaspaceSize: 1024,
      stackSize: 1024,
      gcAlgorithm: 'G1',
      printGCDetails: true,
      compressedOops: true
    }
  },
  {
    name: '低延迟',
    description: '追求最低 GC 延迟',
    config: {
      heapSize: { initial: 2048, max: 4096 },
      youngGenRatio: 35,
      metaspaceSize: 256,
      maxMetaspaceSize: 512,
      stackSize: 1024,
      gcAlgorithm: 'ZGC',
      printGCDetails: true,
      stringDeduplication: true
    }
  }
]

// 应用预设
const applyPreset = (preset) => {
  Object.assign(config.value, preset.config)
}

// GC 算法映射
const gcMapping = {
  'G1': '-XX:+UseG1GC',
  'Parallel': '-XX:+UseParallelGC',
  'CMS': '-XX:+UseConcMarkSweepGC',
  'ZGC': '-XX:+UseZGC',
  'Shenandoah': '-XX:+UseShenandoahGC',
  'Serial': '-XX:+UseSerialGC'
}

// 编译器模式映射
const compilerMapping = {
  'mixed': '',
  'c1': '-Xint',
  'c2': '-XX:-TieredCompilation'
}

// 生成 JVM 参数
const generateArgs = () => {
  const args = []

  // 堆内存
  if (config.value.heapSize.initial) {
    args.push(`-Xms${config.value.heapSize.initial}M`)
  }
  if (config.value.heapSize.max) {
    args.push(`-Xmx${config.value.heapSize.max}M`)
  }

  // 新生代
  if (config.value.youngGenRatio) {
    const newRatio = Math.round((100 - config.value.youngGenRatio) / config.value.youngGenRatio)
    args.push(`-XX:NewRatio=${newRatio}`)
  }

  // 元空间
  if (config.value.metaspaceSize) {
    args.push(`-XX:MetaspaceSize=${config.value.metaspaceSize}M`)
  }
  if (config.value.maxMetaspaceSize) {
    args.push(`-XX:MaxMetaspaceSize=${config.value.maxMetaspaceSize}M`)
  }

  // 线程栈
  if (config.value.stackSize) {
    args.push(`-Xss${config.value.stackSize}K`)
  }

  // GC 算法
  if (gcMapping[config.value.gcAlgorithm]) {
    args.push(gcMapping[config.value.gcAlgorithm])
  }

  // GC 日志
  if (config.value.printGCDetails) {
    args.push('-XX:+PrintGC')
    args.push('-XX:+PrintGCDetails')
    args.push('-XX:+PrintGCTimeStamps')
    if (config.value.gcLogFile) {
      args.push(`-Xlog:gc*:file=${config.value.gcLogFile}:time,tags:filecount=5,filesize=10m`)
    }
  }

  // G1 GC 特殊配置
  if (config.value.gcAlgorithm === 'G1' && config.value.stringDeduplication) {
    args.push('-XX:+UseStringDeduplication')
  }

  // 性能调优
  if (config.value.aggressiveOpts) {
    args.push('-XX:+AggressiveOpts')
  }
  if (config.value.compressedOops && config.value.heapSize.max < 32768) {
    args.push('-XX:+UseCompressedOops')
    args.push('-XX:+UseCompressedClassPointers')
  }

  // 编译器模式
  if (compilerMapping[config.value.compilerMode]) {
    args.push(compilerMapping[config.value.compilerMode])
  }

  // 系统属性
  if (config.value.timezone) {
    args.push(`-Duser.timezone=${config.value.timezone}`)
  }
  if (config.value.fileEncoding) {
    args.push(`-Dfile.encoding=${config.value.fileEncoding}`)
  }

  // 自定义参数
  if (config.value.customArgs) {
    const custom = config.value.customArgs.split('\n').filter(a => a.trim())
    args.push(...custom)
  }

  // Java Agent
  if (config.value.javaAgents) {
    const agents = config.value.javaAgents.split('\n').filter(a => a.trim())
    args.push(...agents)
  }

  return args
}

// 生成的命令
const generatedCommand = computed(() => {
  const args = generateArgs()
  if (args.length === 0) return ''

  // 格式化为多行命令
  const command = 'java ' + args.join(' \\\n  ')
  return command + ' \\\n  -jar your-application.jar'
})

// 复制命令
const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText(generatedCommand.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 智能推荐算法
const applyRecommendation = () => {
  const memory = parseInt(recommendation.value.serverMemory)
  const cores = parseInt(recommendation.value.cpuCores)
  const javaVersion = parseInt(recommendation.value.javaVersion)
  const scenario = recommendation.value.scenario

  // 计算堆内存 (建议使用物理内存的 60-75%)
  let heapMax = Math.floor(memory * 0.7 * 1024) // 转换为 MB
  // 向下取整到 128 的倍数
  heapMax = Math.floor(heapMax / 128) * 128
  // 限制最大值
  heapMax = Math.min(heapMax, 16384)

  // 初始堆内存与最大值相同，避免动态调整
  const heapInitial = heapMax

  // 新生代比例
  let youngGenRatio = 30
  if (scenario === 'bigdata' || scenario === 'cache') {
    youngGenRatio = 40 // 大数据/缓存需要更大的新生代
  } else if (scenario === 'batch') {
    youngGenRatio = 25 // 批处理任务可以减少新生代
  }

  // 元空间大小
  let metaspaceSize = 256
  let maxMetaspaceSize = 512
  if (scenario === 'bigdata' || scenario === 'web') {
    metaspaceSize = 512
    maxMetaspaceSize = 1024
  }

  // 线程栈大小
  let stackSize = 1024
  if (scenario === 'bigdata') {
    stackSize = 512 // 大数据应用可能有很多线程，减小栈大小
  }

  // GC 算法选择
  let gcAlgorithm = 'G1'
  if (javaVersion >= 15 && (scenario === 'lowlatency' || scenario === 'cache')) {
    gcAlgorithm = 'ZGC' // Java 15+ 且低延迟场景优先使用 ZGC
  } else if (javaVersion >= 12 && scenario === 'lowlatency') {
    gcAlgorithm = 'ZGC'
  } else if (javaVersion >= 15 && scenario === 'bigdata') {
    gcAlgorithm = 'Shenandoah' // 大数据场景可以使用 Shenandoah
  } else if (javaVersion < 9 && scenario === 'batch') {
    gcAlgorithm = 'Parallel' // Java 8 批处理任务用 Parallel
  } else if (scenario === 'batch' || memory < 4) {
    gcAlgorithm = 'Parallel' // 小内存或批处理用 Parallel
  }

  // 性能调优选项
  const compressedOops = heapMax < 32768 // 堆小于 32G 自动启用
  const aggressiveOpts = scenario === 'batch' || scenario === 'bigdata'
  const stringDeduplication = gcAlgorithm === 'G1' && (scenario === 'web' || scenario === 'cache')

  // GC 日志
  const printGCDetails = memory >= 4 // 大于 4GB 才开启详细 GC 日志

  // 应用推荐配置
  config.value = {
    heapSize: {
      initial: heapInitial,
      max: heapMax
    },
    youngGenRatio,
    metaspaceSize,
    maxMetaspaceSize,
    stackSize,
    gcAlgorithm,
    printGCDetails,
    gcLogFile: '/logs/gc.log',
    aggressiveOpts,
    compressedOops,
    stringDeduplication,
    compilerMode: 'mixed',
    timezone: 'Asia/Shanghai',
    fileEncoding: 'UTF-8',
    customArgs: generateCustomArgs(scenario, cores, javaVersion),
    javaAgents: ''
  }
}

// 生成自定义参数
const generateCustomArgs = (scenario, cores, javaVersion) => {
  const args = []

  // 并行 GC 线程数
  if (scenario !== 'lowlatency') {
    const gcThreads = Math.max(2, Math.floor(cores * 0.75))
    args.push(`-XX:ParallelGCThreads=${gcThreads}`)
  }

  // 根据场景添加特定参数
  switch (scenario) {
    case 'microservice':
      args.push('-XX:+UnlockExperimentalVMOptions')
      args.push('-XX:+UseCGroupMemoryLimitForHeap') // 容器环境
      break
    case 'web':
      args.push('-XX:+HeapDumpOnOutOfMemoryError')
      args.push('-XX:HeapDumpPath=/logs/')
      break
    case 'bigdata':
      args.push('-XX:+UseLargePages')
      args.push(`-XX:ParallelGCThreads=${cores}`)
      args.push('-XX:+AlwaysPreTouch')
      break
    case 'gateway':
      args.push('-XX:+UseTLAB')
      args.push('-XX:+ResizeTLAB')
      break
    case 'lowlatency':
      if (javaVersion >= 11) {
        args.push('-XX:+UseStringDeduplication')
      }
      break
  }

  return args.join('\n')
}

// 重置配置
const resetConfig = () => {
  Object.assign(config.value, defaultConfig)
}
</script>
