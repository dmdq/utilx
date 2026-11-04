<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sprout class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">植物浇水提醒</h1>
          <p class="text-sm text-muted-foreground mt-1">给家里绿植设定浇水周期，自动排出「今天浇 / 逾期 / 还差几天」日程，一键打卡浇水并留存最近养护记录</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线植物浇水提醒工具：为每盆植物记录上次浇水日期与浇水周期（1-60 天），页面按日期自动推算下次到期日并标色排序——今天该浇的绿、已逾期的红、未来一周的灰；
        内置绿萝、虎皮兰、多肉等常见绿植的参考频率模板，点一下即可开养。浇完水点「浇水」按钮打卡，周期自动顺延，最近 10 次记录进活动流，方便复盘养护节奏。全部在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>清单和浇水记录只存在这台设备的浏览器里；提醒需要打开本页才会显示——浏览器网页无法在后台推送。</span>
    </p>

    <!-- 反馈状态条（内联，自动消失） -->
    <p
      v-if="statusBar"
      class="flex items-center gap-2 text-xs rounded-lg border px-3 py-2 mb-4"
      :class="statusBarClass"
    >
      <CheckCircle v-if="statusBar.kind === 'ok'" class="w-3.5 h-3.5 flex-shrink-0" />
      <TriangleAlert v-else class="w-3.5 h-3.5 flex-shrink-0" />
      <span>{{ statusBar.text }}</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：添加植物 / 模板 / 数据管理 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Plus class="w-5 h-5 mr-2 text-primary" /> 添加植物
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">名称</label>
            <input
              v-model="formName"
              type="text"
              maxlength="20"
              placeholder="如：客厅龟背竹"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">图标</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="e in PLANT_EMOJIS"
                :key="e"
                @click="formEmoji = e"
                class="w-9 h-9 rounded-lg border text-lg leading-none transition"
                :class="formEmoji === e ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-border bg-muted/40 hover:bg-muted'"
                :aria-label="`选择图标 ${e}`"
              >{{ e }}</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">浇水周期（天）</label>
              <input
                v-model.number="formInterval"
                type="number"
                min="1"
                max="60"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">光照标签</label>
              <select
                v-model="formSun"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="s in SUN_OPTIONS" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">备注（选填，最多 40 字）</label>
            <input
              v-model="formNote"
              type="text"
              :maxlength="NOTE_MAX"
              placeholder="如：自来水晾一晚 / 冬天减半"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            @click="addPlant"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Plus class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 加入浇水清单（上限 {{ MAX_PLANTS }} 盆）
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Sprout class="w-5 h-5 mr-2 text-primary" /> 常用模板
          </h2>
          <p class="text-xs text-muted-foreground -mt-1">点一下即按参考频率加入清单，加入后可随时改周期。</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in PLANT_PRESETS"
              :key="preset.name"
              @click="addFromPreset(preset)"
              class="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs text-foreground transition"
            >
              {{ preset.emoji }} {{ preset.name }} · {{ preset.intervalDays }} 天
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground">参考频率，实际看盆土干湿。</p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Trash2 class="w-5 h-5 mr-2 text-red-500" /> 数据管理
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            当前共 {{ plants.length }} 盆。删除单盆用卡片右下角的垃圾桶（需点两次确认）；清空全部会连浇水记录一起抹掉，不可恢复。
          </p>
          <template v-if="confirmClear">
            <div class="flex gap-2">
              <button
                @click="clearAll"
                class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition"
              >确认清空全部 {{ plants.length }} 盆</button>
              <button
                @click="confirmClear = false"
                class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs text-foreground transition"
              >取消</button>
            </div>
          </template>
          <button
            v-else
            @click="askClearAll"
            class="w-full px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
          >
            <Trash2 class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> 清空全部数据
          </button>
        </div>
      </div>

      <!-- 右面板：日程总览 + 植物卡片 + 活动流（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 四状态卡 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div v-for="card in summaryCards" :key="card.label" class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ card.label }}</p>
            <p class="text-2xl font-bold" :class="card.accent">{{ card.value }}</p>
          </div>
        </div>

        <!-- 植物清单 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Droplet class="w-5 h-5 mr-2 text-primary" /> 浇水日程
            </h2>
            <div class="flex items-center gap-2">
              <div class="flex rounded-lg border border-border overflow-hidden">
                <button
                  v-for="tab in filterTabs"
                  :key="tab.id"
                  @click="filterTab = tab.id"
                  class="px-2.5 py-1 text-xs font-medium transition"
                  :class="filterTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
                >{{ tab.label }}</button>
              </div>
              <button
                @click="toggleSort"
                class="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition"
                :title="sortMode === 'due' ? '当前按到期先后排序，点击改为按名称' : '当前按名称排序，点击改为按到期先后'"
              >
                <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" />{{ sortMode === 'due' ? '按到期' : '按名称' }}
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!plants.length" class="py-10 text-center">
            <Sprout class="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <p class="text-sm text-muted-foreground">清单还是空的，先在左侧添加一盆，或点一个常用模板快速开养。</p>
          </div>

          <!-- 筛选后为空 -->
          <div v-else-if="!viewPlants.length" class="py-8 text-center">
            <p class="text-sm text-muted-foreground">当前筛选下没有植物：切到「全部」看看其余日程。</p>
          </div>

          <!-- 植物卡片网格 -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="plant in viewPlants"
              :key="plant.id"
              class="bg-muted/40 border rounded-lg p-4 space-y-3 transition-all duration-300"
              :class="wateredFlash === plant.id ? 'border-green-500/50 ring-2 ring-green-500/30' : 'border-border'"
            >
              <div class="flex items-start gap-3">
                <span class="text-3xl leading-none flex-shrink-0">{{ plant.emoji }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-foreground truncate" :title="plant.name">{{ plant.name }}</p>
                  <p class="text-xs text-muted-foreground mt-1">每 {{ plant.intervalDays }} 天 · 下次 {{ plant.dueText }}</p>
                </div>
                <span class="px-2 py-0.5 rounded-full border text-[10px] font-medium flex-shrink-0" :class="plant.badgeClass">
                  {{ plant.badge }}
                </span>
              </div>

              <div class="flex items-center gap-2 text-[10px]">
                <span class="px-1.5 py-0.5 rounded" :class="sunClass[plant.sun]">{{ plant.sun }}</span>
                <span v-if="plant.note" class="text-muted-foreground truncate" :title="plant.note">{{ plant.note }}</span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="waterPlant(plant.id)"
                  class="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition"
                  :class="wateredFlash === plant.id ? 'bg-green-500/15 text-green-600 border border-green-500/30' : 'bg-primary hover:bg-primary/90 text-primary-foreground'"
                >
                  <CheckCircle v-if="wateredFlash === plant.id" class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  <Droplet v-else class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  {{ wateredFlash === plant.id ? '已浇 ✓' : '浇水' }}
                </button>
                <button
                  @click="openEdit(plant)"
                  class="px-2.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs text-muted-foreground transition"
                >编辑</button>
                <template v-if="pendingDelete === plant.id">
                  <button
                    @click="deletePlant(plant.id)"
                    class="px-2.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
                  >确认删除</button>
                  <button
                    @click="pendingDelete = null"
                    class="px-2 py-2 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition"
                    aria-label="取消删除"
                  ><X class="w-3.5 h-3.5" /></button>
                </template>
                <button
                  v-else
                  @click="pendingDelete = plant.id"
                  class="px-2 py-2 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition"
                  aria-label="删除这盆"
                ><Trash2 class="w-3.5 h-3.5" /></button>
              </div>

              <p v-if="plant.lastHistoryText" class="text-[10px] text-muted-foreground">最近浇过：{{ plant.lastHistoryText }}</p>
            </div>
          </div>
        </div>

        <!-- 最近浇水活动流 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplet class="w-5 h-5 mr-2 text-primary" /> 最近浇水活动
          </h2>
          <p v-if="!activityFeed.length" class="text-sm text-muted-foreground">还没有浇水记录：给任意一盆点「浇水」按钮，打卡记录会按日期归组显示在这里（全局最近 15 次）。</p>
          <div v-else class="space-y-3">
            <div v-for="group in activityFeed" :key="group.date">
              <p class="text-xs font-medium text-muted-foreground mb-1.5">{{ group.date }}</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="item in group.items"
                  :key="item.key"
                  class="px-2 py-1 rounded-md bg-muted/50 border border-border text-xs text-foreground"
                >{{ item.emoji }} {{ item.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹层 -->
    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="closeEdit"></div>
      <div class="relative bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Sprout class="w-5 h-5 mr-2 text-primary" /> 编辑植物
          </h2>
          <button @click="closeEdit" class="text-muted-foreground hover:text-foreground" aria-label="关闭">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">名称</label>
          <input
            v-model="editForm.name"
            type="text"
            maxlength="20"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">图标</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="e in PLANT_EMOJIS"
              :key="e"
              @click="editForm.emoji = e"
              class="w-9 h-9 rounded-lg border text-lg leading-none transition"
              :class="editForm.emoji === e ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-border bg-muted/40 hover:bg-muted'"
              :aria-label="`选择图标 ${e}`"
            >{{ e }}</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">浇水周期（天）</label>
            <input
              v-model.number="editForm.intervalDays"
              type="number"
              min="1"
              max="60"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">光照标签</label>
            <select
              v-model="editForm.sun"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="s in SUN_OPTIONS" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">上次浇水日期</label>
          <input
            v-model="editForm.lastWatered"
            type="date"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1">补记实际日期（如忘了打卡），下次到期会按它重算。</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">备注（选填，最多 40 字）</label>
          <input
            v-model="editForm.note"
            type="text"
            :maxlength="NOTE_MAX"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div class="flex gap-2 pt-1">
          <button
            @click="saveEdit"
            class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >保存修改</button>
          <button
            @click="closeEdit"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >取消</button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>植物浇水提醒是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          植物浇水提醒是一款在线绿植浇水日程管理工具。你为每盆植物设定浇水周期（1-60 天）和上次浇水日期，
          工具按 UTC 日历日口径推算下次到期日，并与今天对比标成「今天浇 / 逾期 X 天 / 还差 X 天」三档状态；
          浇完水点一下「浇水」按钮即完成打卡：上次浇水日期更新为今天、周期自动顺延，同时写入该盆最近 10 次的浇水历史，
          全局活动流按日期归组展示最近 15 条记录，方便复盘养护节奏。清单与记录保存在这台设备的浏览器 localStorage 中，不联网、不上传、不需要注册。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">浇水频率怎么定？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          模板里的天数只是通用参考，真正的判据是盆土。最常用的「指节法」：把食指第二指节插入土中约一指深，
          取出时干燥、不带湿土、指尖无明显凉意，就可以浇透；仍微潮发凉就再等。季节会明显挪动周期——
          春夏生长季蒸发快，周期可按下限执行；秋冬光照弱、多数植物半休眠，通常把周期拉长 50%-100%（如 7 天改 10-14 天），
          暖气房内例外要观察盆土。宁可先用模板值起步，再按盆土实况每次微调 1-3 天，比死守日历更可靠。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么这个网页工具不弹通知？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          诚实说明边界：纯网页工具没有常驻后台，「到点自动提醒」做不到——网页无法在后台推送，提醒只在打开本页时重新计算显示。
          想提高可靠性，可以把本页加为书签固定、或养成每天早晨打开一眼的习惯；浏览器通知 API 需要站点提供推送服务，
          本站不搭服务器、不收集设备令牌，因此刻意不做。对怕忘的人来说，「打开就有红字逾期」本身就是补救信号。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">室内植物最常见的死法是浇水过多</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          多数室内绿植不是干死的，而是被浇死的：盆土长期过湿使根部缺氧、烂根，表现为叶尖发黄发软、掉落、土面返潮异味。
          所以本工具把「按时打卡、记录周期」而不是「天天浇水」当作核心——浇水按钮的意义是记录，不是提醒你多浇。
          拿不准时先摸土；托盘积水要及时倒掉。烂根救回来的关键是停水、通风、修根换干土，而不是继续补浇。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">多肉和绿萝的周期为什么差一倍以上？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          绿萝叶片薄、蒸腾快，原生环境潮湿，7 天左右浇透正合适；多肉把水存在肥厚叶片里，根系浅、耐旱怕涝，
          14 天甚至更久浇一次反而更健康，浇水频率差 2-3 倍是常态。同理虎皮兰（21 天）比吊兰（5 天）耐旱得多。
          同一种植物在不同盆材（陶盆比塑料盆干得快）、盆径与位置上周期还会再变，模板值请按实况修正。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">光照标签（喜阳 / 耐阴 / 散射）是什么意思？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          这是养护位置提示，与浇水周期联动理解：喜阳（多肉、虎皮兰、天堂鸟）需要直射光，放南窗台，光照足蒸发快但本身耐旱；
          散射（绿萝、龟背竹、散尾葵、琴叶榕、吊兰）适合明亮但无直射的位置，如东向窗旁；耐阴（发财树等）能放离窗较远处，
          但蒸发更慢，浇水周期建议在模板值基础上再加几天。标签不改变到期计算，只帮你想清楚「这盆该放哪、干得快不快」。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">「今天浇 / 逾期」是怎么判定的？</h3>
            <p class="text-sm text-muted-foreground mt-1">按上次浇水日期加浇水周期算出下次到期日，再和今天（日历日）比较：相差 0 天显示「今天浇」，到期日已过显示「逾期 X 天」，未到显示「还差 X 天」。判定在每次打开页面时重算，浏览器网页无法在后台推送提醒。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">模板给的天数不准怎么办？忘了打卡能补吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">模板只是参考频率，请结合盆土指节法实测后在编辑里微调周期（1-60 天整数）。忘了打卡可点「编辑」把「上次浇水日期」改成实际浇的那天，下次到期会自动重算，历史列表不受影响。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">清单数据存在哪？换设备 / 清缓存会丢吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">只存在这台设备浏览器的 localStorage 里（上限 60 盆），不联网不上传。清除浏览器数据、换设备或换浏览器都不会带走记录，本页也没有云端同步，重要清单建议自己抄一份。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'plant-watering-tracker'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Sprout, Droplet, Plus, X, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '植物浇水提醒 - 在线绿植浇水日程与养花打卡记录工具',
  description: '免费在线植物浇水提醒工具，为绿植设定浇水周期自动排出今天浇/逾期/未来日程，内置绿萝虎皮兰多肉等参考频率模板，一键浇水打卡周期顺延，最近浇水记录本地留存，纯浏览器运行不上传',
  keywords: '浇水提醒,植物养护日程,多肉浇水频率,养花记录,植物浇水周期',
  author: '有条工具',
  ogTitle: '植物浇水提醒 - 在线绿植浇水日程与养花打卡记录工具 | 有条工具',
  ogDescription: '设定浇水周期自动排日程，浇水一键打卡顺延，内置常见绿植参考频率模板，数据只存本机浏览器。',
  ogUrl: 'https://www.util.cn/tools/plant-watering-tracker',
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
          name: '植物浇水提醒',
          url: 'https://www.util.cn/tools/plant-watering-tracker',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['浇水周期自动推算下次到期日', '今天浇/逾期/还差几天三档状态', '绿萝虎皮兰多肉等 10 种参考频率模板', '一键浇水打卡周期顺延', '最近浇水活动流按日归组', '光照标签与养护备注', '数据仅存本机浏览器']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '植物浇水提醒', item: 'https://www.util.cn/tools/plant-watering-tracker' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '「今天浇/逾期」是怎么判定的？',
              acceptedAnswer: { '@type': 'Answer', text: '按上次浇水日期加浇水周期算出下次到期日，再和今天（日历日）比较：相差0天显示今天浇，到期日已过显示逾期X天，未到显示还差X天。判定在每次打开页面时重算，浏览器网页无法在后台推送提醒。' }
            },
            {
              '@type': 'Question',
              name: '模板给的天数不准怎么办？忘了打卡能补吗？',
              acceptedAnswer: { '@type': 'Answer', text: '模板只是参考频率，请结合盆土指节法实测后在编辑里微调周期（1-60天整数）。忘了打卡可点编辑把上次浇水日期改成实际浇的那天，下次到期会自动重算，历史列表不受影响。' }
            },
            {
              '@type': 'Question',
              name: '清单数据存在哪？换设备或清缓存会丢吗？',
              acceptedAnswer: { '@type': 'Answer', text: '只存在这台设备浏览器的localStorage里（上限60盆），不联网不上传。清除浏览器数据、换设备或换浏览器都不会带走记录，本页没有云端同步，重要清单建议自己抄一份。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const DAY_MS = 86400000
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_PLANTS = 60   // 清单上限（盆）
const MAX_HISTORY = 10  // 每植物保留的浇水记录条数
const NOTE_MAX = 40     // 备注字数上限
const WEEK_HORIZON = 7  // 「未来一周」与 healthy 统计的天数口径

const PLANT_EMOJIS = ['🌵', '🌿', '🪴', '🌱', '🍀', '🌸', '🌻', '🌾', '🎋', '🌴', '🍃', '🌺']
const SUN_OPTIONS = ['喜阳', '耐阴', '散射']
// 常用模板：参考频率（天），实际以盆土干湿为准
const PLANT_PRESETS = [
  { name: '绿萝', emoji: '🌿', intervalDays: 7, sun: '散射' },
  { name: '散尾葵', emoji: '🌴', intervalDays: 5, sun: '散射' },
  { name: '龟背竹', emoji: '🍃', intervalDays: 7, sun: '散射' },
  { name: '虎皮兰', emoji: '🌵', intervalDays: 21, sun: '喜阳' },
  { name: '琴叶榕', emoji: '🪴', intervalDays: 10, sun: '散射' },
  { name: '多肉', emoji: '🌸', intervalDays: 14, sun: '喜阳' },
  { name: '发财树', emoji: '🌱', intervalDays: 15, sun: '耐阴' },
  { name: '吊兰', emoji: '🍀', intervalDays: 5, sun: '散射' },
  { name: '天堂鸟', emoji: '🌻', intervalDays: 7, sun: '喜阳' },
  { name: '芦荟', emoji: '🎋', intervalDays: 14, sun: '喜阳' }
]

function isValidIso(iso) {
  return typeof iso === 'string' && ISO_DATE_RE.test(iso)
}

// 'YYYY-MM-DD' → UTC 毫秒（纯计算，与时区无关）
function isoToUtcMs(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// UTC 毫秒 → 'YYYY-MM-DD'
function utcMsToIso(ms) {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

// 下次到期日 = 上次浇水日 + 周期天数；输入非法返回 null
function nextDueOf(lastWatered, intervalDays) {
  const n = Number(intervalDays)
  if (!isValidIso(lastWatered) || !Number.isInteger(n) || n < 1) return null
  return utcMsToIso(isoToUtcMs(lastWatered) + n * DAY_MS)
}

// 距到期天数（正 = 还需 N 天，0 = 今天浇，负 = 已逾期 N 天）；非法输入返回 null
function daysUntilDue(plant, todayIso) {
  const due = nextDueOf(plant.lastWatered, plant.intervalDays)
  if (!due || !isValidIso(todayIso)) return null
  return Math.round((isoToUtcMs(due) - isoToUtcMs(todayIso)) / DAY_MS)
}

// 状态判定：days<0 → overdue，days=0 → due-today，days>0 → upcoming；数据/日期非法 → unknown
function statusOf(plant, todayIso) {
  const days = daysUntilDue(plant, todayIso)
  if (days === null) return { state: 'unknown', days: null }
  if (days < 0) return { state: 'overdue', days }
  if (days === 0) return { state: 'due-today', days }
  return { state: 'upcoming', days }
}

// 总览统计：total 总数 / dueToday 今天该浇 / overdue 已逾期 / healthy 未来 7 天内（不含今天）
function summarizeOf(plants, todayIso) {
  const result = { total: plants.length, dueToday: 0, overdue: 0, healthy: 0 }
  for (const p of plants) {
    const { state, days } = statusOf(p, todayIso)
    if (state === 'due-today') result.dueToday += 1
    else if (state === 'overdue') result.overdue += 1
    else if (state === 'upcoming' && days <= WEEK_HORIZON) result.healthy += 1
  }
  return result
}

// 浇水记录规整：去重、过滤非法日期、按 ISO 日期降序
function waterLogSortOf(logs) {
  const seen = new Set()
  const clean = []
  for (const iso of logs) {
    if (!isValidIso(iso) || seen.has(iso)) continue
    seen.add(iso)
    clean.push(iso)
  }
  return clean.sort((a, b) => b.localeCompare(a))
}

// 打卡：上次浇水日设为 today，并把它追加进历史（去重 + 降序 + 只留最近 MAX_HISTORY 条）
function appendHistoryOf(history, todayIso) {
  return waterLogSortOf(history.concat(todayIso)).slice(0, MAX_HISTORY)
}

// 不可变更新：返回打卡后的新 plant 对象
function waterPlantOf(plant, todayIso) {
  if (!isValidIso(todayIso)) return plant
  return { ...plant, lastWatered: todayIso, history: appendHistoryOf(plant.history || [], todayIso) }
}

// 单条清洗：非法字段丢弃或夹紧到合法范围；不是合法植物返回 null
function normalizePlant(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 20) : ''
  const interval = Number(raw.intervalDays)
  if (!name || !Number.isInteger(interval) || interval < 1 || interval > 60) return null
  if (!isValidIso(raw.lastWatered)) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `p-${raw.lastWatered}-${name}`,
    name,
    emoji: PLANT_EMOJIS.includes(raw.emoji) ? raw.emoji : '🌿',
    intervalDays: interval,
    lastWatered: raw.lastWatered,
    note: typeof raw.note === 'string' ? raw.note.slice(0, NOTE_MAX) : '',
    sun: SUN_OPTIONS.includes(raw.sun) ? raw.sun : '散射',
    history: waterLogSortOf(Array.isArray(raw.history) ? raw.history : []).slice(0, MAX_HISTORY)
  }
}

// 列表清洗：过滤脏数据并裁到上限
function normalizePlants(list) {
  if (!Array.isArray(list)) return []
  return list.map(normalizePlant).filter(Boolean).slice(0, MAX_PLANTS)
}

// ---------- 页面状态与交互 ----------
const plants = ref([])
// 今天日期仅在 onMounted 填充：SSR 首屏与客户端首次渲染都拿固定占位，避免 hydration 不一致
const todayIso = ref('')
const filterTab = ref('all')
const sortMode = ref('due')
const wateredFlash = ref('')
const pendingDelete = ref(null)
const confirmClear = ref(false)
const editing = ref(null) // 正在编辑的 plant id（null 不渲染弹层）
const seoContentVisible = ref(true)
const statusBar = ref(null)

const formName = ref('')
const formEmoji = ref('🌿')
const formInterval = ref(7)
const formSun = ref('散射')
const formNote = ref('')

const editForm = reactive({ name: '', emoji: '🌿', intervalDays: 7, sun: '散射', note: '', lastWatered: '' })

const filterTabs = [
  { id: 'all', label: '全部' },
  { id: 'urgent', label: '今日与逾期' },
  { id: 'week', label: '未来一周' }
]

const sunClass = {
  '喜阳': 'bg-amber-500/10 text-amber-600',
  '耐阴': 'bg-sky-500/10 text-sky-600',
  '散射': 'bg-emerald-500/10 text-emerald-600'
}

const badgeClass = {
  'due-today': 'bg-green-500/10 text-green-600 border-green-500/30',
  'overdue': 'bg-red-500/10 text-red-600 border-red-500/30',
  'upcoming': 'bg-muted/60 text-muted-foreground border-border',
  'unknown': 'bg-muted/60 text-muted-foreground border-border'
}

let statusTimer = null
let flashTimer = null

const todayReady = computed(() => isValidIso(todayIso.value))

const summaryCards = computed(() => {
  const s = summarizeOf(plants.value, todayIso.value)
  return [
    { label: '今日该浇', value: todayReady.value ? s.dueToday : '—', accent: 'text-green-600' },
    { label: '已逾期', value: todayReady.value ? s.overdue : '—', accent: todayReady.value && s.overdue ? 'text-red-600' : 'text-foreground' },
    { label: '未来 7 天内', value: todayReady.value ? s.healthy : '—', accent: 'text-primary' },
    { label: '总数', value: s.total, accent: 'text-foreground' }
  ]
})

const viewPlants = computed(() => {
  const list = plants.value.map((p) => {
    const st = statusOf(p, todayIso.value)
    const due = nextDueOf(p.lastWatered, p.intervalDays)
    let badge = '待载入'
    if (st.state === 'due-today') badge = '今天浇'
    else if (st.state === 'overdue') badge = `逾期 ${Math.abs(st.days)} 天`
    else if (st.state === 'upcoming') badge = `还差 ${st.days} 天`
    const history = waterLogSortOf(p.history || []).slice(0, 3)
    return {
      ...p,
      state: st.state,
      days: st.days,
      due,
      dueText: due || '—',
      badge,
      badgeClass: badgeClass[st.state] || badgeClass.unknown,
      lastHistoryText: history.length ? history.join('、') : ''
    }
  })
  let filtered = list
  if (filterTab.value === 'urgent') filtered = list.filter((p) => p.state === 'overdue' || p.state === 'due-today')
  else if (filterTab.value === 'week') filtered = list.filter((p) => p.state === 'upcoming' && p.days <= WEEK_HORIZON)
  if (sortMode.value === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
  } else {
    filtered.sort((a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'))
  }
  return filtered
})

// 全局活动流：合并所有植物历史，按日期降序取最近 15 条，再按日分组
const activityFeed = computed(() => {
  const entries = []
  for (const p of plants.value) {
    for (const iso of p.history || []) {
      if (isValidIso(iso)) entries.push({ iso, name: p.name, emoji: p.emoji })
    }
  }
  entries.sort((a, b) => b.iso.localeCompare(a.iso))
  const groups = []
  for (const e of entries.slice(0, 15)) {
    const last = groups[groups.length - 1]
    if (last && last.date === e.iso) last.items.push({ key: `${e.iso}-${e.name}`, name: e.name, emoji: e.emoji })
    else groups.push({ date: e.iso, items: [{ key: `${e.iso}-${e.name}`, name: e.name, emoji: e.emoji }] })
  }
  return groups
})

const statusBarClass = computed(() => {
  if (!statusBar.value) return ''
  if (statusBar.value.kind === 'ok') return 'bg-green-500/10 border-green-500/20 text-green-600'
  if (statusBar.value.kind === 'warn') return 'bg-amber-500/10 border-amber-500/20 text-amber-600'
  return 'bg-primary/10 border-primary/20 text-primary'
})

function setStatus(kind, text) {
  statusBar.value = { kind, text }
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    statusBar.value = null
    statusTimer = null
  }, 4000)
}

// ---------- 浏览器存储（核心数据，均带 try/catch；读只在 onMounted） ----------
const STORAGE_KEY = 'plant-wa…r:v1'

function loadStoredPlants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizePlants(JSON.parse(raw))
  } catch {
    setStatus('warn', '本地清单读取失败或格式异常，本次从空清单开始')
    return []
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plants.value))
    return true
  } catch {
    setStatus('warn', '写入浏览器本地存储失败，本次改动暂存于内存，请勿关闭页面')
    return false
  }
}

// 统一提交：清洗 + 落库，保证 plants.value 永远是合法数据
function commit(nextList) {
  plants.value = normalizePlants(nextList)
  persist()
}

// 本地日历日 ISO（浏览器 API，仅 onMounted 调用一次）
function localDateIso() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function genId() {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function clampInterval(n) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v)) return 7
  return Math.min(60, Math.max(1, v))
}

// ---------- 操作 ----------
function addPlant() {
  const name = formName.value.trim()
  if (!name) return setStatus('warn', '请先填写植物名称')
  if (plants.value.length >= MAX_PLANTS) return setStatus('warn', `清单已有 ${MAX_PLANTS} 盆，达到上限，请先删减`)
  const plant = {
    id: genId(),
    name: name.slice(0, 20),
    emoji: PLANT_EMOJIS.includes(formEmoji.value) ? formEmoji.value : '🌿',
    intervalDays: clampInterval(formInterval.value),
    lastWatered: todayIso.value,
    note: formNote.value.slice(0, NOTE_MAX),
    sun: SUN_OPTIONS.includes(formSun.value) ? formSun.value : '散射',
    history: []
  }
  commit(plants.value.concat(plant))
  const due = nextDueOf(plant.lastWatered, plant.intervalDays)
  setStatus('ok', `已加入「${plant.name}」，下次浇水 ${due}`)
  formName.value = ''
  formNote.value = ''
}

function addFromPreset(preset) {
  if (!todayReady.value) return setStatus('warn', '今天日期尚未载入，稍等再点')
  if (plants.value.length >= MAX_PLANTS) return setStatus('warn', `清单已有 ${MAX_PLANTS} 盆，达到上限，请先删减`)
  const plant = {
    id: genId(),
    name: preset.name,
    emoji: preset.emoji,
    intervalDays: preset.intervalDays,
    lastWatered: todayIso.value, // 新入手默认按「今天刚浇过」起算
    note: '',
    sun: preset.sun,
    history: []
  }
  commit(plants.value.concat(plant))
  const due = nextDueOf(plant.lastWatered, plant.intervalDays)
  setStatus('ok', `已按模板加入「${preset.name}」（每 ${preset.intervalDays} 天），下次浇水 ${due}`)
}

function askClearAll() {
  if (!plants.value.length) return setStatus('warn', '清单本来就是空的')
  confirmClear.value = true
  setTimeout(() => { confirmClear.value = false }, 6000)
}

function clearAll() {
  confirmClear.value = false
  commit([])
  setStatus('ok', '已清空全部植物与浇水记录')
}

function waterPlant(id) {
  const target = plants.value.find((p) => p.id === id)
  if (!target || !todayReady.value) return
  commit(plants.value.map((p) => (p.id === id ? waterPlantOf(p, todayIso.value) : p)))
  wateredFlash.value = id
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    wateredFlash.value = ''
    flashTimer = null
  }, 1500)
  const due = nextDueOf(todayIso.value, target.intervalDays)
  setStatus('ok', `已记录给「${target.name}」浇水，下次到期顺延至 ${due}`)
}

function openEdit(plant) {
  editing.value = plant.id
  editForm.name = plant.name
  editForm.emoji = plant.emoji
  editForm.intervalDays = plant.intervalDays
  editForm.sun = plant.sun
  editForm.note = plant.note
  editForm.lastWatered = plant.lastWatered
}

function closeEdit() {
  editing.value = null
}

function saveEdit() {
  const id = editing.value
  if (!id) return
  const name = editForm.name.trim()
  if (!name) return setStatus('warn', '植物名称不能为空')
  const lastWatered = isValidIso(editForm.lastWatered) ? editForm.lastWatered : null
  if (!lastWatered) return setStatus('warn', '请选择有效的上次浇水日期')
  commit(plants.value.map((p) => (p.id === id
    ? {
        ...p,
        name: name.slice(0, 20),
        emoji: PLANT_EMOJIS.includes(editForm.emoji) ? editForm.emoji : p.emoji,
        intervalDays: clampInterval(editForm.intervalDays),
        sun: SUN_OPTIONS.includes(editForm.sun) ? editForm.sun : p.sun,
        note: editForm.note.slice(0, NOTE_MAX),
        lastWatered
      }
    : p)))
  closeEdit()
  setStatus('ok', `已更新「${name}」的养护档案`)
}

function deletePlant(id) {
  const target = plants.value.find((p) => p.id === id)
  pendingDelete.value = null
  commit(plants.value.filter((p) => p.id !== id))
  setStatus('ok', `已删除「${target ? target.name : '该植物'}」及其浇水记录`)
}

function toggleSort() {
  sortMode.value = sortMode.value === 'due' ? 'name' : 'due'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  todayIso.value = localDateIso()
  plants.value = loadStoredPlants()
  addRecentTool('plant-watering-tracker')
})

onBeforeUnmount(() => {
  if (statusTimer) clearTimeout(statusTimer)
  if (flashTimer) clearTimeout(flashTimer)
})
</script>
