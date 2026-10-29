<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gamepad2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">游戏手柄测试</h1>
          <p class="text-sm text-muted-foreground mt-1">多手柄连接检测、17 键标准映射按键计数、LT/RT 行程条、双摇杆可视化与漂移校准、网页震动测试</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线游戏手柄测试工具：手柄连上电脑后按任意键唤醒，即可实时查看每个按键的按下高亮与累计按压次数、LT/RT 模拟扳机的 0-100% 行程条、
        左右摇杆的实时位置，并通过 3 秒静置校准得到摇杆零点基准，自动判定摇杆是否漂移（静置偏移超过 0.15 提示送修或调死区）；
        支持 XInput 标准映射与第三方接收器的非标准映射设备，可触发双马达震动测试。全部检测在浏览器本地完成，不上传任何数据，买二手手柄验货必备。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：连接状态面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 连接状态
        </h2>

        <!-- 顶部大状态区 -->
        <div class="rounded-lg p-4 text-center" :class="padList.length ? 'bg-green-500/10' : 'bg-amber-500/10'">
          <template v-if="padList.length">
            <CheckCircle class="w-8 h-8 text-green-500 mx-auto mb-1" />
            <p class="text-sm font-semibold text-foreground">已连接 {{ padList.length }} 个手柄</p>
            <p class="text-xs text-muted-foreground mt-1">
              当前测试：{{ currentPad ? '#' + currentPad.index : '未选择' }} · {{ mappingText }}
            </p>
          </template>
          <template v-else>
            <Gamepad2 class="w-8 h-8 text-amber-500/80 mx-auto mb-1" />
            <p class="text-sm font-semibold text-foreground">未连接手柄</p>
            <p class="text-xs text-muted-foreground mt-1">请按下手柄任意按键或摇动摇杆唤醒（浏览器安全机制）</p>
          </template>
        </div>

        <!-- 手柄列表（点击切换当前测试对象） -->
        <div v-if="padList.length" class="space-y-2">
          <p class="text-sm font-medium text-foreground">手柄列表（点击切换）</p>
          <button
            v-for="pad in padList"
            :key="pad.index"
            @click="setActivePad(pad.index)"
            class="w-full text-left rounded-lg border p-3 transition"
            :class="pad.index === activeIndex ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/60'"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">手柄 #{{ pad.index }}</span>
              <span class="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle class="w-3.5 h-3.5" /> 已连接
              </span>
            </div>
            <p class="text-xs text-muted-foreground truncate mt-0.5" :title="pad.id">{{ pad.id }}</p>
            <span
              class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1"
              :class="pad.mapping === 'standard' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'"
            >
              {{ pad.mapping === 'standard' ? 'mapping: standard 标准映射' : 'mapping: non-standard 非标准' }}
            </span>
          </button>
        </div>

        <!-- 累计按键总数 -->
        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">累计按键总数（当前手柄）</p>
          <p class="text-2xl font-bold text-primary">{{ totalPresses }} 次</p>
          <p class="text-xs text-muted-foreground mt-1">此刻按住 {{ pressedNowCount }} / 17 键</p>
        </div>

        <!-- 最近事件 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">最近事件</p>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <p v-for="ev in eventLog" :key="ev.time + ev.text" class="text-xs text-muted-foreground truncate" :title="ev.text">
              <span class="text-muted-foreground/60 font-mono mr-1">{{ ev.time }}</span>{{ ev.text }}
            </p>
            <p v-if="!eventLog.length" class="text-xs text-muted-foreground">—</p>
          </div>
        </div>

        <!-- 校准零点 + 漂移判定 -->
        <div class="space-y-2">
          <button
            @click="startCalibration"
            :disabled="!currentPad || calibrating"
            class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" :class="calibrating ? 'animate-spin' : ''" />
            {{ calibrating ? '校准中 ' + calibProgress + '%' : '校准零点（3 秒，保持摇杆不动）' }}
          </button>
          <div v-if="calibrating" class="h-1.5 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary" :style="{ width: calibProgress + '%' }"></div>
          </div>
          <p v-if="currentPad && !activeBaseline" class="text-xs text-muted-foreground">
            未校准：静置手柄 3 秒记录零点后，才能判定摇杆漂移。
          </p>
          <p v-else-if="activeBaseline" class="text-[10px] text-muted-foreground font-mono truncate" :title="baselineText">
            基准 {{ baselineText }}
          </p>
          <div
            v-if="drift.leftDrift && stickIdle"
            class="flex items-start gap-1.5 text-xs leading-relaxed p-2.5 rounded border"
            :class="driftSeverityClass"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>左摇杆疑似漂移：静置偏移 {{ drift.leftDeviation.toFixed(2) }}（阈值 0.15），建议送修或在系统里调死区</span>
          </div>
          <div
            v-if="drift.rightDrift && stickIdle"
            class="flex items-start gap-1.5 text-xs leading-relaxed p-2.5 rounded border"
            :class="driftSeverityClass"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>右摇杆疑似漂移：静置偏移 {{ drift.rightDeviation.toFixed(2) }}（阈值 0.15），建议送修或在系统里调死区</span>
          </div>
          <div
            v-if="!stickIdle && (drift.leftDrift || drift.rightDrift)"
            class="text-[10px] text-muted-foreground p-1.5"
          >
            摇杆正在移动，松手静置后再看漂移判定结果。
          </div>
        </div>

        <!-- 震动测试 -->
        <div class="space-y-1.5">
          <button
            @click="triggerVibrate"
            :disabled="!vibrateAvailable"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Vibrate class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 震动测试（400ms 双马达）
          </button>
          <p v-if="!currentPad" class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 连接手柄后可测试震动。
          </p>
          <p v-else-if="!vibrateAvailable" class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 当前浏览器/手柄不支持网页震动
          </p>
          <p v-else-if="vibrateMessage" class="text-xs text-red-500">{{ vibrateMessage }}</p>
        </div>

        <button
          @click="resetTest"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置计数与事件
        </button>
      </div>

      <!-- 右：测试区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Gamepad2 class="w-5 h-5 mr-2 text-primary" />
            按键与摇杆测试{{ currentPad ? '（当前手柄 #' + currentPad.index + '）' : '' }}
          </h2>
          <span
            v-if="currentPad"
            class="inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium"
            :class="currentPad.mapping === 'standard' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'"
          >
            {{ currentPad.mapping === 'standard' ? 'standard：17 键标准命名' : 'non-standard：按键以 #序号 显示' }}
          </span>
        </div>

        <!-- 未连接时的空状态 -->
        <div
          v-if="!currentPad"
          class="h-[280px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border select-none"
        >
          <Gamepad2 class="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">未连接或未选择手柄</p>
          <p class="text-xs text-muted-foreground/70 mt-1">用手柄有线/蓝牙连接电脑后，按任意键唤醒，再点击左侧列表开始测试</p>
        </div>

        <template v-else>
          <!-- 按键网格 -->
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <div
              v-for="(btn, i) in buttons"
              :key="i"
              class="rounded-lg border p-2 text-center transition-colors"
              :class="btn.down ? 'border-primary bg-primary/15 ring-2 ring-primary/30' : 'border-border bg-muted/40'"
            >
              <p class="text-xs font-medium truncate" :class="btn.down ? 'text-primary font-bold' : 'text-foreground'" :title="buttonLabelOf(i)">
                {{ buttonLabelOf(i) }}
              </p>
              <p class="text-sm font-bold" :class="pressCounts[i] > 0 ? 'text-primary' : 'text-muted-foreground'">
                {{ pressCounts[i] }}<span class="text-[10px] font-normal text-muted-foreground ml-0.5">次</span>
              </p>
              <template v-if="isAnalogButton(i)">
                <div class="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div class="h-full rounded-full bg-primary" :style="{ width: travelPercent(btn.value) + '%' }"></div>
                </div>
                <p class="text-[10px] text-muted-foreground font-mono mt-0.5">行程 {{ travelPercent(btn.value) }}%</p>
              </template>
            </div>
          </div>

          <!-- 摇杆可视化 -->
          <div class="grid grid-cols-2 gap-4">
            <div v-for="stick in stickViews" :key="stick.key" class="flex flex-col items-center gap-2">
              <p class="text-sm font-medium text-foreground">{{ stick.name }}</p>
              <div class="relative w-36 h-36 rounded-full border-2 border-border bg-muted/30 overflow-hidden">
                <!-- 0.15 死区虚线圆（直径为圆域的 30%） -->
                <div class="absolute left-1/2 top-1/2 w-[30%] h-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-muted-foreground/40"></div>
                <div class="absolute left-1/2 top-0 bottom-0 w-px bg-border/60"></div>
                <div class="absolute top-1/2 left-0 right-0 h-px bg-border/60"></div>
                <!-- 摇杆动点 -->
                <div
                  class="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-primary shadow-md"
                  :style="stickDotStyle(stick.dx, stick.dy)"
                ></div>
              </div>
              <p class="text-[10px] font-mono text-muted-foreground">X {{ stick.textX }} · Y {{ stick.textY }}</p>
            </div>
          </div>

          <!-- 四轴数值读数 -->
          <div class="grid grid-cols-4 gap-2 text-center">
            <div v-for="ax in axisReadout" :key="ax.name" class="bg-muted/50 rounded-lg p-2">
              <p class="text-[10px] text-muted-foreground mb-0.5">{{ ax.name }}</p>
              <p class="text-sm font-bold font-mono" :class="ax.hot ? 'text-primary' : 'text-foreground'">{{ ax.text }}</p>
            </div>
          </div>
        </template>

        <!-- 底部提示条 -->
        <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>
            Gamepad API 出于安全设计，需要手柄产生输入（按一下按键或摇动摇杆）后才会出现在列表；非标准映射（non-standard）手柄（如部分第三方接收器）按钮名以 #序号 显示。
            震动测试需要 Chrome/Edge 等支持 GamepadHapticActuator 的浏览器与对应硬件。
          </span>
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>游戏手柄测试是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          游戏手柄测试是一款基于浏览器 Gamepad API 的在线外设检测工具。手柄通过 USB 或蓝牙连接电脑后，按任意按键即可被浏览器枚举；
          页面每帧读取手柄的按键与摇杆状态：标准映射（mapping=standard）设备按 W3C 标准布局显示 A/B/X/Y、肩键、扳机、Back/Start、
          L3/R3、Guide 与十字键共 17 个按键的按下状态与累计次数，LT/RT 两个模拟扳机额外显示 0-100% 的行程条；
          左右摇杆以双圆域可视化，动点实时跟随 axes 数值移动，并画出 0.15 死区虚线圆。
          工具还提供 3 秒静置校准求摇杆零点基准，之后持续判定静置偏移是否超过 0.15，帮你判断摇杆是否漂移；并可在支持的浏览器里触发双马达震动。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么测手柄按键和摇杆？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>把手柄连接电脑（USB 最稳，蓝牙需先配对），按下手柄任意按键或摇动摇杆，左侧列表出现手柄即代表唤醒成功。</li>
          <li>逐个按下全部按键：对应格子会高亮并累计次数，按完后确认 17 个格子的计数都与实际按下次数一致、无卡键（不按也亮）也无失灵（按了不亮）。</li>
          <li>慢推 LT/RT 扳机：观察行程条能否从 0% 平滑走到 100% 再回落，中途跳变说明电位器（霍尔 Sensor）有坏点。</li>
          <li>把左右摇杆各推到上下左右四个极限方向：右侧圆域内动点应能贴到边缘，四个方向的读数都应接近 ±1，中心回中后读数应接近 0。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">摇杆漂移是什么？怎么判断？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          摇杆漂移指你没有碰摇杆，游戏画面里的视角/角色却在缓慢移动——成因通常是电位器磨损、进灰或弹簧回中不良，导致零点电压偏离中心。
          判断方法：先把手柄静置放在桌上，点「校准零点」采集 3 秒各轴平均值作为基准（正常应接近 0），
          之后工具会持续对比实时轴值与基准的偏差；在你没有触碰摇杆（静置）时，任一轴的静置偏移超过 0.15 即判定为疑似漂移，
          偏移越大警告颜色越深（超过 0.35 为红色严重）。偏移在 0.05 以内属正常老化；若确认漂移，可先在系统/驱动里调大死区缓解，根治需更换摇杆模块。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">买二手手柄验货清单</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>连接唤醒：插上即被识别，mapping 显示 standard（XInput 手柄优先，兼容性最好）。</li>
          <li>全键计数：17 个键逐个按 3-5 次，计数准确、不亮不卡；连点 A/B 快速敲击不漏按。</li>
          <li>扳机行程：LT/RT 行程条 0-100% 平滑无跳变；数值漂移的线性扳机 play 游戏时等于半自动开枪，务必测。</li>
          <li>摇杆回中与漂移：静置校准后确认两个摇杆偏移都低于 0.15；再画圈摇一摇，确认全程无断层（坏点）。</li>
          <li>震动：点震动测试，两个马达都应有感；微软手柄在浏览器里通常可触发，测不了不一定是坏（Firefox/Safari 不支持网页震动）。</li>
          <li>十字键：斜方向（如上+右同时）确认无误触、无串键。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么按了手柄没反应？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Gamepad API 有一个刻意的安全机制：出于隐私考虑，浏览器不会主动暴露静置的手柄——你必须先按下手柄任意按键或摇动摇杆，
          触发 gamepadconnected 事件后它才会出现在列表里，这是「按了没反应」最常见的原因。
          其次请检查：浏览器支持（Chrome/Edge/Firefox/Safari 桌面版均支持 Gamepad API，但震动只有 Chromium 系内核支持）；
          手柄模式开关（部分手柄有 XInput/DInput 或 Switch/Android 模式拨键，需切到对应 PC 模式）；
          蓝牙连接时要先完成系统配对；以及非标准映射手柄的按键序号与实体按键不对应，属正常现象。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">测试数据会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。手柄的按键、摇杆与震动数据全部在你的浏览器内存中通过 Gamepad API 读取与计算，页面不发送任何网络请求，
          刷新或离开页面后计数与校准基准自动清零。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">手柄已经连上了，页面为什么显示未连接？</h3>
            <p class="text-sm text-muted-foreground mt-1">这是浏览器的唤醒机制：静置的手柄不会出现在 Gamepad API 列表里，按下手柄任意按键或摇动摇杆即可唤醒。若仍无反应，检查浏览器兼容性、手柄模式拨键与蓝牙配对状态。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">摇杆漂移的判断标准是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">先静置 3 秒校准零点基准，之后在摇杆静置（未触碰）状态下，任一轴与基准的偏移超过 0.15 即判定疑似漂移；超过 0.35 为严重漂移。判定前请勿触碰摇杆，正在移动时的偏差不计入。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">震动测试按钮为什么是灰的？</h3>
            <p class="text-sm text-muted-foreground mt-1">网页震动依赖 GamepadHapticActuator 接口，目前仅 Chrome/Edge 等 Chromium 内核浏览器支持，Firefox、Safari 以及部分无线接收器方案的手柄不支持，按钮会自动置灰并提示。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">测试数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有按键、摇杆与校准数据都在浏览器本地内存中处理，不发送任何网络请求，刷新或离开页面后自动清零。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gamepad-tester'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import {
  Gamepad2, Gauge, TriangleAlert, CheckCircle, RefreshCw,
  ChevronUp, ChevronDown, Info, Vibrate
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '游戏手柄测试 - 在线手柄按键/摇杆漂移/震动检测工具',
  description: '免费在线游戏手柄测试工具，支持多手柄连接检测、17 键标准映射按键计数、LT/RT 模拟扳机行程条、双摇杆实时可视化与漂移校准判定（静置偏移>0.15 提醒）、网页双马达震动测试，买二手手柄验货必备，纯浏览器本地运行不上传',
  keywords: '游戏手柄测试,手柄按键测试,摇杆漂移检测,手柄漂移测试,LT RT扳机测试,手柄震动测试,二手手柄验货,Gamepad API',
  author: '有条工具',
  ogTitle: '游戏手柄测试 - 在线手柄按键/摇杆漂移/震动检测工具 | 有条工具',
  ogDescription: '17 键按键计数、LT/RT 行程条、摇杆漂移校准判定与震动测试，买二手手柄验货必备。',
  ogUrl: 'https://www.util.cn/tools/gamepad-tester',
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
          name: '游戏手柄测试',
          url: 'https://www.util.cn/tools/gamepad-tester',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多手柄连接状态检测', '17 键标准映射按键测试与计数', 'LT/RT 模拟扳机行程条', '双摇杆实时可视化与死区显示', '摇杆零点校准与漂移判定', '网页双马达震动测试', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '游戏手柄测试', item: 'https://www.util.cn/tools/gamepad-tester/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '手柄已经连上了，页面为什么显示未连接？',
              acceptedAnswer: { '@type': 'Answer', text: '这是浏览器的唤醒机制：出于隐私考虑，静置的手柄不会出现在 Gamepad API 列表里，按下手柄任意按键或摇动摇杆即可唤醒。若仍无反应，检查浏览器兼容性、手柄模式拨键与蓝牙配对状态。' }
            },
            {
              '@type': 'Question',
              name: '摇杆漂移的判断标准是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '先静置 3 秒校准零点基准，之后在摇杆静置未触碰状态下，任一轴与基准的偏移超过 0.15 即判定疑似漂移，超过 0.35 为严重漂移，建议送修或在系统里调死区。' }
            },
            {
              '@type': 'Question',
              name: '震动测试按钮为什么是灰的？',
              acceptedAnswer: { '@type': 'Answer', text: '网页震动依赖 GamepadHapticActuator 接口，目前仅 Chrome、Edge 等 Chromium 内核浏览器支持，Firefox、Safari 以及部分无线接收器方案的手柄不支持，按钮会自动置灰并提示。' }
            },
            {
              '@type': 'Question',
              name: '测试数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有按键、摇杆与校准数据都在浏览器本地内存中处理，不发送任何网络请求，刷新或离开页面后自动清零。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const DRIFT_THRESHOLD = 0.15 // 静置偏移超过该值判定为疑似漂移
const DEADZONE = 0.15        // 可视化死区半径（相对满行程）

// 标准映射（W3C standard gamepad layout）17 键命名，索引与 gamepad.buttons 对齐
const STANDARD_BUTTONS = ['A(底)', 'B(右)', 'X(左)', 'Y(顶)', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'L3', 'R3', 'Guide', '十字上', '十字下', '十字左', '十字右']
const ANALOG_BUTTONS = [6, 7] // LT / RT：模拟扳机，显示行程条

// 按键显示名：标准映射用命名表，非标准映射（含未知 mapping）用 #序号
function buttonLabel(i, mapping) {
  if (mapping !== 'standard') return `#${i}`
  return STANDARD_BUTTONS[i] || `#${i}`
}

// 是否为模拟扳机键（LT/RT）
function isAnalogButton(i) {
  return ANALOG_BUTTONS.indexOf(i) !== -1
}

// 按键是否算按下：pressed 为真，或模拟值超过半程（0.5）
function isButtonDown(btn) {
  return !!(btn && (btn.pressed || btn.value > 0.5))
}

// 行程百分比：value(0-1) → 0-100 整数，越界截断
function travelPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n * 100)))
}

// 校准基准：对 3 秒采样（samples 为二维数组 samples[帧][轴]）逐轴求平均，保留 3 位小数
function calibrateBaseline(samples) {
  if (!samples || !samples.length) return []
  const cols = samples[0].length
  const baseline = []
  for (let c = 0; c < cols; c++) {
    let sum = 0
    let n = 0
    for (const row of samples) {
      if (row && typeof row[c] === 'number' && Number.isFinite(row[c])) {
        sum += row[c]
        n++
      }
    }
    baseline.push(n ? Math.round((sum / n) * 1000) / 1000 : 0)
  }
  return baseline
}

// 漂移判定：实时轴值与校准基准逐轴求偏差的绝对值，
// 左摇杆看轴 0/1，右摇杆看轴 2/3，任一轴超过阈值即判漂移（严格大于，恰好等于阈值不算）
function judgeDrift(axes, baseline, threshold = DRIFT_THRESHOLD) {
  if (!baseline || !baseline.length) {
    return { leftDrift: false, rightDrift: false, maxDeviation: 0, leftDeviation: 0, rightDeviation: 0 }
  }
  // 偏差用原始值与阈值比较（避免舍入吞掉边界附近的漂移），展示值再舍入到 3 位小数
  const devRawOf = (i) => {
    if (!axes || typeof axes[i] !== 'number' || typeof baseline[i] !== 'number') return 0
    return Math.abs(axes[i] - baseline[i])
  }
  const leftRaw = Math.max(devRawOf(0), devRawOf(1))
  const rightRaw = Math.max(devRawOf(2), devRawOf(3))
  const round3 = (n) => Math.round(n * 1000) / 1000
  return {
    leftDrift: leftRaw > threshold,
    rightDrift: rightRaw > threshold,
    maxDeviation: round3(Math.max(leftRaw, rightRaw)),
    leftDeviation: round3(leftRaw),
    rightDeviation: round3(rightRaw)
  }
}

// ---------- 常量与状态 ----------
const CALIBRATE_MS = 3000 // 校准采样时长
const STICK_TRAVEL_PX = 52 // 摇杆动点最大位移（像素）
const IDLE_FRAMES = 30    // 连续静止帧数阈值（约 0.5 秒）视为静置

const padList = ref([]) // [{ index, id, mapping }] 已连接手柄
const activeIndex = ref(null)
const buttons = ref(STANDARD_BUTTONS.map(() => ({ down: false, value: 0 })))
const pressCounts = ref(STANDARD_BUTTONS.map(() => 0))
const axes = ref([0, 0, 0, 0])
const eventLog = ref([]) // [{ time, text }] 最近事件（新的在前）
const baselineMap = reactive({}) // gamepadIndex -> number[] 校准基准
const drift = ref({ leftDrift: false, rightDrift: false, maxDeviation: 0, leftDeviation: 0, rightDeviation: 0 })
const stickIdle = ref(true)
const calibrating = ref(false)
const calibProgress = ref(0)
const vibrateAvailable = ref(false)
const vibrateMessage = ref('')
const seoContentVisible = ref(true)

// 非响应式循环内部变量
let rafId = null
let lastPadSig = ''
let idleFrames = 0
let prevAxes = null
let calibSamples = []
let calibStart = 0

// ---------- 计算属性 ----------
const currentPad = computed(() => padList.value.find((p) => p.index === activeIndex.value) || null)
const mappingText = computed(() => {
  if (!currentPad.value) return '—'
  return currentPad.value.mapping === 'standard' ? 'standard 标准映射' : 'non-standard 非标准映射'
})
const totalPresses = computed(() => pressCounts.value.reduce((s, n) => s + n, 0))
const pressedNowCount = computed(() => buttons.value.filter((b) => b.down).length)
const activeBaseline = computed(() => (activeIndex.value === null ? null : baselineMap[activeIndex.value] || null))
const baselineText = computed(() => {
  const bl = activeBaseline.value
  if (!bl || bl.length < 4) return '—'
  return `LX ${bl[0].toFixed(2)} / LY ${bl[1].toFixed(2)} / RX ${bl[2].toFixed(2)} / RY ${bl[3].toFixed(2)}`
})
const driftSeverityClass = computed(() =>
  drift.value.maxDeviation >= 0.35
    ? 'bg-red-500/10 border-red-500/30 text-red-600'
    : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
)
const stickViews = computed(() => {
  const a = axes.value
  return [
    { key: 'left', name: '左摇杆', dx: a[0] || 0, dy: a[1] || 0, textX: (a[0] || 0).toFixed(2), textY: (a[1] || 0).toFixed(2) },
    { key: 'right', name: '右摇杆', dx: a[2] || 0, dy: a[3] || 0, textX: (a[2] || 0).toFixed(2), textY: (a[3] || 0).toFixed(2) }
  ]
})
const axisReadout = computed(() => {
  const names = ['LX', 'LY', 'RX', 'RY']
  return names.map((name, i) => {
    const v = axes.value[i] || 0
    return { name, text: v.toFixed(2), hot: Math.abs(v) > DEADZONE }
  })
})

const buttonLabelOf = (i) => buttonLabel(i, currentPad.value ? currentPad.value.mapping : undefined)

function stickDotStyle(dx, dy) {
  return {
    transform: `translate(-50%, -50%) translate(${(dx * STICK_TRAVEL_PX).toFixed(1)}px, ${(dy * STICK_TRAVEL_PX).toFixed(1)}px)`
  }
}

// ---------- 事件处理 ----------
function pushEvent(text) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  eventLog.value = [{ time, text }, ...eventLog.value].slice(0, 8)
}

function setActivePad(index) {
  if (activeIndex.value === index) return
  activeIndex.value = index
  buttons.value = STANDARD_BUTTONS.map(() => ({ down: false, value: 0 }))
  pressCounts.value = STANDARD_BUTTONS.map(() => 0)
  axes.value = [0, 0, 0, 0]
  drift.value = { leftDrift: false, rightDrift: false, maxDeviation: 0, leftDeviation: 0, rightDeviation: 0 }
  stickIdle.value = true
  idleFrames = 0
  prevAxes = null
  calibrating.value = false
  calibProgress.value = 0
  if (index !== null) pushEvent(`切换到手柄 #${index}`)
}

function startCalibration() {
  if (activeIndex.value === null || calibrating.value) return
  calibrating.value = true
  calibProgress.value = 0
  calibSamples = []
  calibStart = performance.now()
  pushEvent('开始校准零点（3 秒，请勿触碰摇杆）')
}

async function triggerVibrate() {
  const idx = activeIndex.value
  if (idx === null) return
  let pad = null
  try {
    pad = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads()[idx] : null
  } catch (e) {
    pad = null
  }
  const actuator = pad && pad.vibrationActuator
  if (!actuator) {
    vibrateMessage.value = '当前浏览器/手柄不支持网页震动'
    return
  }
  try {
    await actuator.playEffect('dual-rumble', { duration: 400, strongMagnitude: 1.0, weakMagnitude: 0.6 })
    vibrateMessage.value = ''
    pushEvent('震动测试：双马达 400ms 已触发')
  } catch (e) {
    vibrateMessage.value = '当前浏览器/手柄不支持网页震动'
    pushEvent('震动测试失败：playEffect 被拒绝')
  }
}

function resetTest() {
  buttons.value = STANDARD_BUTTONS.map(() => ({ down: false, value: 0 }))
  pressCounts.value = STANDARD_BUTTONS.map(() => 0)
  eventLog.value = []
  drift.value = { leftDrift: false, rightDrift: false, maxDeviation: 0, leftDeviation: 0, rightDeviation: 0 }
  vibrateMessage.value = ''
}

function toggleSeoContent() {
  seoContentVisible.value = !seoContentVisible.value
}

function handleGamepadConnected(e) {
  pushEvent(`手柄已连接：${e.gamepad.id}`)
}

function handleGamepadDisconnected(e) {
  pushEvent(`手柄已断开：${e.gamepad.id}`)
}

// ---------- rAF 轮询：每帧读取 Gamepad 状态（仅在客户端 onMounted 之后启动） ----------
function pollLoop() {
  rafId = requestAnimationFrame(pollLoop)
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return
  let pads = null
  try {
    pads = navigator.getGamepads()
  } catch (e) {
    return
  }
  if (!pads) return

  // 汇总已连接手柄，签名变化才更新列表（避免无谓重渲染）
  const connected = []
  for (const p of pads) {
    if (p && p.connected) connected.push({ index: p.index, id: p.id, mapping: p.mapping })
  }
  const sig = connected.map((p) => `${p.index}:${p.mapping}`).join('|')
  if (sig !== lastPadSig) {
    lastPadSig = sig
    padList.value = connected
    if (activeIndex.value === null || !connected.some((p) => p.index === activeIndex.value)) {
      setActivePad(connected.length ? connected[0].index : null)
    }
  }

  const idx = activeIndex.value
  const pad = idx === null ? null : pads[idx]

  // 校准进行中但手柄掉线：取消本次校准
  if (calibrating.value && !pad) {
    calibrating.value = false
    calibProgress.value = 0
    pushEvent('校准取消：手柄已断开')
  }

  if (!pad) {
    vibrateAvailable.value = false
    return
  }

  // 震动能力探测（Firefox/Safari 或无硬件时按钮置灰）
  vibrateAvailable.value = !!(pad.vibrationActuator)

  // 按键状态与按压计数（按下沿触发）
  const bs = buttons.value
  const counts = pressCounts.value
  const mapping = pad.mapping
  for (let i = 0; i < bs.length; i++) {
    const raw = pad.buttons ? pad.buttons[i] : null
    const down = isButtonDown(raw)
    if (down && !bs[i].down) {
      counts[i] += 1
      pushEvent(`${buttonLabel(i, mapping)} 按下`)
    }
    bs[i].down = down
    bs[i].value = raw ? raw.value : 0
  }

  // 摇杆轴值
  const a = pad.axes || []
  const nx = [a[0] || 0, a[1] || 0, a[2] || 0, a[3] || 0]
  axes.value = nx

  // 静置判定：连续多帧轴值几乎不变视为静置（移动中的偏差不作为漂移依据）
  if (prevAxes) {
    const moved = nx.some((v, i) => Math.abs(v - prevAxes[i]) > 0.005)
    idleFrames = moved ? 0 : idleFrames + 1
  }
  prevAxes = nx
  stickIdle.value = idleFrames >= IDLE_FRAMES

  // 漂移判定（已有基准时）
  const baseline = baselineMap[idx]
  if (baseline && baseline.length) {
    drift.value = judgeDrift(nx, baseline)
  }

  // 校准采样
  if (calibrating.value) {
    const elapsed = performance.now() - calibStart
    calibProgress.value = Math.min(100, Math.round((elapsed / CALIBRATE_MS) * 100))
    calibSamples.push(nx.slice())
    if (elapsed >= CALIBRATE_MS) {
      const bl = calibrateBaseline(calibSamples)
      if (idx !== null) baselineMap[idx] = bl
      calibrating.value = false
      calibProgress.value = 0
      drift.value = judgeDrift(nx, bl)
      pushEvent('校准完成：已记录摇杆零点基准')
    }
  }
}

onMounted(() => {
  window.addEventListener('gamepadconnected', handleGamepadConnected)
  window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)
  rafId = requestAnimationFrame(pollLoop)
  addRecentTool('gamepad-tester')
})

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  window.removeEventListener('gamepadconnected', handleGamepadConnected)
  window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
})
</script>
