<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Webcam class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">监控镜头焦距计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">传感器尺寸 × 焦距 × 距离互算视场宽度，反向按期望视野选镜头档位，DORI 四档像素密度按 EN 62676-4 定焦距</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线监控镜头焦距计算器：装监控选镜头不再凭感觉——正向输入传感器规格、焦距与监控距离，按 W=D×w/f 算出视场宽高；
        反向输入「想看多宽的画面」自动反算焦距并吸附 2.8/3.6/4/6/8/12/16mm 常用档；
        再按 EN 62676-4 的 DORI 像素密度（侦测 25、观察 63、识别 125、辨认 250 px/m）结合相机分辨率，
        算出「看清人脸 / 认出车牌」所需的镜头焦距。内置全画幅到 1/4" 传感器尺寸对照表，
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 模式切换 -->
    <div class="flex flex-wrap gap-2 mb-6" role="group" aria-label="计算模式">
      <button
        v-for="m in MODES"
        :key="m.id"
        type="button"
        class="px-4 py-2 rounded-lg border text-sm font-medium transition"
        :class="mode === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
        @click="mode = m.id"
      >
        {{ m.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <!-- 传感器规格（三种模式共用） -->
        <div>
          <label for="lens-sensor" class="block text-sm font-medium text-foreground mb-1.5">传感器规格（有效宽×高 mm）</label>
          <select id="lens-sensor" v-model="sensorId" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="s in SENSORS" :key="s.id" :value="s.id">{{ s.label }}</option>
          </select>
          <div v-if="isCustomSensor" class="flex items-center gap-2 mt-2">
            <input v-model.number="customSw" type="number" min="1" step="0.01" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="自定义传感器宽 mm">
            <span class="text-xs text-muted-foreground">×</span>
            <input v-model.number="customSh" type="number" min="1" step="0.01" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="自定义传感器高 mm">
            <span class="text-xs text-muted-foreground">mm</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">当前传感器有效面积 {{ fmtNum(sensorW) }} × {{ fmtNum(sensorH) }} mm——传感器越大，同焦距视场越宽。</p>
        </div>

        <!-- 正向：焦距 + 距离 -->
        <div v-if="mode === 'forward'">
          <label for="lens-focal" class="block text-sm font-medium text-foreground mb-1.5">镜头焦距（mm）</label>
          <div class="flex items-center gap-2 flex-wrap">
            <input id="lens-focal" v-model.number="focal" type="number" min="1" step="0.1" class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
            <button
              v-for="f in COMMON_FOCALS"
              :key="f"
              type="button"
              class="px-2.5 py-1.5 rounded-md text-xs font-medium border transition"
              :class="focal === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="focal = f"
            >{{ f }}mm</button>
          </div>
          <div class="mt-4">
            <label for="lens-dist" class="block text-sm font-medium text-foreground mb-1.5">监控距离（m）</label>
            <input id="lens-dist" v-model.number="distance" type="number" min="0.5" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          </div>
        </div>

        <!-- 反向：期望视场宽 + 距离 -->
        <div v-else-if="mode === 'reverse'">
          <label for="lens-target" class="block text-sm font-medium text-foreground mb-1.5">期望视场宽度（m）</label>
          <input id="lens-target" v-model.number="targetW" type="number" min="0.5" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          <p class="text-[11px] text-muted-foreground mt-1.5">例如门口宽 3m 就填 3，院子宽 15m 就填 15。</p>
          <div class="mt-4">
            <label for="lens-dist2" class="block text-sm font-medium text-foreground mb-1.5">监控距离（m）</label>
            <input id="lens-dist2" v-model.number="distance" type="number" min="0.5" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          </div>
        </div>

        <!-- DORI：相机 + 场景档 + 距离 -->
        <div v-else class="space-y-4">
          <div>
            <label for="lens-camera" class="block text-sm font-medium text-foreground mb-1.5">相机水平分辨率</label>
            <select id="lens-camera" v-model="cameraId" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option v-for="c in CAMERA_PRESETS" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
            <div v-if="isCustomCamera" class="mt-2">
              <input v-model.number="customResW" type="number" min="320" step="10" class="w-32 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="自定义水平像素">
              <span class="text-xs text-muted-foreground ml-2">水平方向像素数（如图像宽 2560 填 2560）</span>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">目标场景（EN 62676-4 像素密度档）</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="lv in DORI_LEVELS"
                :key="lv.key"
                type="button"
                class="px-3 py-2 rounded-lg border text-left transition"
                :class="doriKey === lv.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="doriKey = lv.key"
              >
                <p class="text-sm font-medium">{{ lv.label }}</p>
                <p class="text-[11px] opacity-80">{{ lv.ppm }} px/m</p>
              </button>
            </div>
          </div>
          <div>
            <label for="lens-dist3" class="block text-sm font-medium text-foreground mb-1.5">监控距离（m）</label>
            <input id="lens-dist3" v-model.number="distance" type="number" min="0.5" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          </div>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition" @click="resetAll">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <div v-if="issues.length" class="space-y-1.5">
          <p v-for="issue in issues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>

        <!-- 传感器尺寸对照表（页面展示，自核数据） -->
        <div class="pt-2">
          <p class="text-sm font-medium text-foreground mb-2">常见摄像机传感器尺寸对照表</p>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-muted-foreground">
                  <th class="text-left px-2.5 py-1.5 font-medium">规格</th>
                  <th class="text-right px-2.5 py-1.5 font-medium">有效宽×高（mm）</th>
                  <th class="text-right px-2.5 py-1.5 font-medium">对角线（mm）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="s in SENSORS.filter((x) => !x.custom)"
                  :key="'tbl-' + s.id"
                  class="border-t border-border cursor-pointer"
                  :class="sensorId === s.id ? 'bg-primary/10' : 'hover:bg-muted/40'"
                  @click="sensorId = s.id"
                >
                  <td class="px-2.5 py-1.5 text-foreground">{{ s.id === 'full' ? '全画幅' : s.inch + '"' }}</td>
                  <td class="px-2.5 py-1.5 text-right font-mono text-foreground">{{ s.w }} × {{ s.h }}</td>
                  <td class="px-2.5 py-1.5 text-right font-mono text-muted-foreground">{{ fmtNum(Math.hypot(s.w, s.h)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">英寸规格沿用电子管时代口径（1" 型 ≈ 16mm 对角线），与实际英寸不相等；具体机型以厂商标称为准。</p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <!-- 正向结果 -->
        <div v-if="mode === 'forward'" class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 视场计算结果
          </h2>
          <div v-if="forwardResult" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">视场宽度</p>
                <p class="text-3xl font-bold text-primary">{{ fmtNum(forwardResult.w) }}<span class="text-base font-medium text-muted-foreground ml-1">m</span></p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">视场高度</p>
                <p class="text-3xl font-bold text-foreground">{{ fmtNum(forwardResult.h) }}<span class="text-base font-medium text-muted-foreground ml-1">m</span></p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">水平视场角 {{ fmtNum(forwardResult.hfov, 1) }}°</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">{{ fmtNum(distance) }}m 处画面约 {{ fmtNum(forwardResult.w) }} × {{ fmtNum(forwardResult.h) }} m</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">公式：视场宽 W = 距离 D × 传感器宽 w ÷ 焦距 f（W=D×w/f），高同理。焦距越长画面越窄、远处目标越大。</p>
            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult(forwardResult.text)">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制结果
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">填入有效的焦距与距离开始计算</p>
        </div>

        <!-- 反向结果 -->
        <div v-else-if="mode === 'reverse'" class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 镜头选型结果
          </h2>
          <div v-if="reverseResult" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">理论所需焦距</p>
                <p class="text-3xl font-bold text-foreground">{{ fmtNum(reverseResult.exact) }}<span class="text-base font-medium text-muted-foreground ml-1">mm</span></p>
              </div>
              <div class="bg-primary/10 rounded-xl p-4 text-center border border-primary/30">
                <p class="text-xs text-muted-foreground mb-1">推荐常用档</p>
                <p class="text-3xl font-bold text-primary">{{ reverseResult.snap }}<span class="text-base font-medium text-muted-foreground ml-1">mm</span></p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>用 {{ reverseResult.snap }}mm 镜头，{{ fmtNum(distance) }}m 处实际视场宽约 {{ fmtNum(reverseResult.actualW) }}m（期望 {{ fmtNum(targetW) }}m，偏差 {{ fmtNum(reverseResult.devPct, 1) }}%）。</span>
            </p>
            <div class="flex flex-wrap gap-2 text-xs">
              <span v-for="f in COMMON_FOCALS" :key="'rf-' + f" class="px-2.5 py-1 rounded-full border font-mono" :class="f === reverseResult.snap ? 'bg-primary/10 border-primary/40 text-primary font-semibold' : 'bg-muted/60 border-border text-muted-foreground'">{{ f }}mm → {{ fmtNum(reverseWidthOf(f)) }}m 宽</span>
            </div>
            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult(reverseResult.text)">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制结果
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">填入有效的期望视场宽度与距离开始计算</p>
        </div>

        <!-- DORI 结果 -->
        <div v-else class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> DORI 焦距计算结果
          </h2>
          <div v-if="doriResult" class="space-y-4">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">{{ activeDori.label }}（{{ activeDori.ppm }} px/m）所需焦距</p>
              <p class="text-4xl font-bold text-primary">{{ fmtNum(doriResult.fExact) }}<span class="text-lg font-medium text-muted-foreground ml-1">mm</span></p>
              <p class="text-xs text-muted-foreground mt-2">常用档建议：<span class="font-mono text-foreground font-semibold">{{ doriResult.snap }}mm</span>（{{ fmtNum(distance) }}m 处实际 {{ fmtNum(doriResult.snapPpm, 0) }} px/m，
                <span :class="doriResult.snapPass ? 'text-green-600' : 'text-red-500'">{{ doriResult.snapPass ? '达标' : '未达标，建议升一档' }}</span>）</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr class="bg-muted/60 text-muted-foreground">
                    <th class="text-left px-2.5 py-1.5 font-medium">DORI 档位</th>
                    <th class="text-right px-2.5 py-1.5 font-medium">像素密度</th>
                    <th class="text-right px-2.5 py-1.5 font-medium">所需焦距</th>
                    <th class="text-right px-2.5 py-1.5 font-medium">常用档</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in doriRows" :key="r.key" class="border-t border-border" :class="r.key === doriKey ? 'bg-primary/10' : ''">
                    <td class="px-2.5 py-1.5 text-foreground">{{ r.label }}</td>
                    <td class="px-2.5 py-1.5 text-right font-mono text-muted-foreground">{{ r.ppm }} px/m</td>
                    <td class="px-2.5 py-1.5 text-right font-mono text-foreground">{{ fmtNum(r.fExact) }} mm</td>
                    <td class="px-2.5 py-1.5 text-right font-mono" :class="r.snapPass ? 'text-green-600' : 'text-muted-foreground'">{{ r.snap }} mm</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">公式：所需焦距 f = 目标像素密度(px/m) × 距离(m) × 传感器宽(mm) ÷ 水平分辨率(px)。像素密度越高细节越多：250 px/m 是「辨认陌生人」级别的硬指标。</p>
            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult(doriResult.text)">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制结果
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">选择相机分辨率、场景档与距离开始计算</p>
        </div>

        <!-- 场景速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 常见场景怎么选
          </h2>
          <div class="space-y-2.5 text-xs">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-medium text-foreground">门口 / 人脸抓拍</p>
              <p class="text-muted-foreground mt-1 leading-relaxed">距离 3~5m，目标「辨认」250 px/m：1/2.8" 200 万像素相机约需 8~12mm；只要认出熟人（识别 125 px/m）6mm 即可。</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-medium text-foreground">院子 / 周界侦测</p>
              <p class="text-muted-foreground mt-1 leading-relaxed">距离 10~20m，目标「侦测」25 px/m 即可：2.8~4mm 广角覆盖大部分院子；要看活动细节再上 6mm。</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-medium text-foreground">车道 / 车牌识别</p>
              <p class="text-muted-foreground mt-1 leading-relaxed">车牌识别通常按不低于辨认档（250 px/m）设计，车道 10~15m 处 200 万像素相机约需 12~16mm 长焦，并避开逆光与强红外直射。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 可折叠区 -->
    <details open class="bg-card border border-border rounded-lg p-6 mb-6">
      <summary class="cursor-pointer select-none text-lg font-semibold text-foreground">公式、DORI 标准与常见问题（FAQ）</summary>
      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">核心公式</h3>
          <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>正向视场：视场宽 W = 距离 D × 传感器有效宽 w ÷ 焦距 f；视场高 H = D × h ÷ f（单位统一为米 / 毫米混合时注意换算）。</li>
            <li>反向焦距：f = D × w ÷ W<sub>期望</sub>，结果吸附 2.8 / 3.6 / 4 / 6 / 8 / 12 / 16mm 常用档。</li>
            <li>DORI 焦距：f = 像素密度(px/m) × D(m) × 传感器宽(mm) ÷ 相机水平分辨率(px)。</li>
            <li>像素密度验证：px/m = 水平分辨率(px) ÷ 传感器宽(mm) × 焦距(mm) ÷ 距离(m)。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">DORI 四档用途（EN 62676-4）</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-muted-foreground text-xs">
                  <th class="text-left px-3 py-2 font-medium">档位</th>
                  <th class="text-right px-3 py-2 font-medium">像素密度</th>
                  <th class="text-left px-3 py-2 font-medium">画面里能看到什么</th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">侦测 Detect</td><td class="px-3 py-2 text-right font-mono">25 px/m</td><td class="px-3 py-2">有人 / 有车经过，分不清是什么</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">观察 Observe</td><td class="px-3 py-2 text-right font-mono">63 px/m</td><td class="px-3 py-2">看得出人形、衣着颜色、行为动作</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">识别 Recognize</td><td class="px-3 py-2 text-right font-mono">125 px/m</td><td class="px-3 py-2">能认出「认识的人」是谁</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">辨认 Identify</td><td class="px-3 py-2 text-right font-mono">250 px/m</td><td class="px-3 py-2">能看清陌生人面部特征，可作证据</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">依据 EN/IEC 62676-4 的 DORI 模型（观察档精确值为 62.5 px/m，标准取整记作 63；2025 版新标准扩充为更多视觉性能等级，工程选型仍普遍沿用上表口径），以现行标准原文为准。</p>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">全幅 50mm 在 10m 处能看多宽？</h3>
            <p class="text-sm text-muted-foreground mt-1">W = 10 × 36 ÷ 50 = 7.2m，H = 10 × 24 ÷ 50 = 4.8m。这是本工具的校准锚点：任何「传感器×焦距×距离」组合都按同一条公式换算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么同是 4mm 镜头，画面宽窄不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">镜头焦距相同，传感器越小视场越窄：4mm 装在全幅上是超广角，装在 1/3" 监控机上只剩约 53° 水平视场。所以选镜头必须「焦距 + 传感器规格」成对讨论，只说毫米数没有意义。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">想在 10m 外看清人脸，选多大镜头？</h3>
            <p class="text-sm text-muted-foreground mt-1">按辨认档 250 px/m：1/2.8" 传感器（宽 5.02mm）+ 1920px 分辨率，f = 250 × 10 × 5.02 ÷ 1920 ≈ 6.5mm，取常用 8mm 档更稳妥；若只需认出熟人（125 px/m），约 3.3mm 即达标。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">传感器英寸规格为什么和实际尺寸对不上？</h3>
            <p class="text-sm text-muted-foreground mt-1">1/2.8"、1/3" 这类规格沿用摄像管时代的口径：1" 型管的有效直径约 16mm 而不是 25.4mm，所以 1/2.8" 型的对角线约 6.3mm、有效面积约 5.02 × 3.76mm。本页对照表按行业通行的有效面积口径整理，个别机型以厂商标称为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。视场、焦距与像素密度换算全部在你的浏览器内完成，无网络请求，参数不被保存或上传。</p>
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground border-t border-border pt-3">数据来源：EN/IEC 62676-4（DORI 像素密度）；传感器有效尺寸对照综合 Wikipedia「Image sensor format」及主流镜头计算器口径交叉核对，以现行标准原文与厂商标称为准。</p>
      </div>
    </details>

    <RelatedTools :currentToolId="'cctv-lens-calculator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Webcam, Ruler, Calculator, Copy, CheckCircle, TriangleAlert, Info, RefreshCw } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '监控镜头焦距计算器 - 视场角/焦距/DORI 像素密度换算 | 有条工具',
  description: '免费在线监控镜头焦距计算器：传感器尺寸×焦距×距离互算视场宽高（W=D×w/f），反向按期望视野推荐 2.8/3.6/4/6/8/12/16mm 常用档，按 EN 62676-4 DORI 像素密度（侦测25/观察63/识别125/辨认250 px/m）算人脸车牌识别所需焦距，内置 1/2.8" 等传感器尺寸对照表，纯浏览器本地计算不上传',
  keywords: '监控镜头焦距计算,摄像头视场角计算,镜头毫米数选择,DORI 像素密度,人脸识别镜头,传感器尺寸对照表',
  author: '有条工具',
  ogTitle: '监控镜头焦距计算器 - 视场角/焦距/DORI 像素密度换算 | 有条工具',
  ogDescription: '焦距、传感器、距离三者互算，反向按视野选镜头档位，DORI 四档算清人脸车牌识别需求。',
  ogUrl: 'https://www.util.cn/tools/cctv-lens-calculator',
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
          name: '监控镜头焦距计算器',
          url: 'https://www.util.cn/tools/cctv-lens-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '传感器尺寸×焦距×距离正向算视场宽高',
            '期望视场宽度反向算焦距并吸附常用档',
            'EN 62676-4 DORI 四档像素密度定焦距',
            '全画幅至 1/4" 传感器尺寸对照表',
            '200万~800万相机分辨率预设与自定义',
            '门口人脸/院子侦测/车道车牌场景速查',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '监控镜头焦距计算器', item: 'https://www.util.cn/tools/cctv-lens-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '全幅 50mm 在 10m 处能看多宽？',
              acceptedAnswer: { '@type': 'Answer', text: '视场宽 W = 10 × 36 ÷ 50 = 7.2m，视场高 H = 10 × 24 ÷ 50 = 4.8m。公式为 W=D×w/f，w 为传感器有效宽度。' }
            },
            {
              '@type': 'Question',
              name: '为什么同是 4mm 镜头，画面宽窄不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '焦距相同，传感器越小视场越窄：4mm 在全幅上是超广角，在 1/3" 监控机上水平视场约 53°。选镜头必须焦距与传感器规格成对考虑。' }
            },
            {
              '@type': 'Question',
              name: '想在 10m 外看清人脸选多大镜头？',
              acceptedAnswer: { '@type': 'Answer', text: '按 EN 62676-4 辨认档 250 px/m，1/2.8" 传感器（5.02mm 宽）+1920px 分辨率时 f = 250×10×5.02÷1920 ≈ 6.5mm，工程上取 8mm 档更稳。认熟人（125 px/m）约 3.3mm 即可。' }
            },
            {
              '@type': 'Question',
              name: '传感器英寸规格为什么和实际尺寸对不上？',
              acceptedAnswer: { '@type': 'Answer', text: '英寸规格沿用摄像管口径，1" 型有效直径约 16mm 而非 25.4mm；如 1/2.8" 型有效面积约 5.02×3.76mm、1/3" 型约 4.8×3.6mm。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== 纯逻辑与静态数据（单测区开始） =====
// 单位约定：传感器宽高 mm、焦距 mm、距离 m、视场 m。
// 核心公式：视场宽 W = 距离 D × 传感器宽 w ÷ 焦距 f（W=D×w/f）。
// 传感器有效尺寸为公开口径交叉核对值（Wikipedia Image sensor format 与主流镜头计算器一致）。

// 传感器预设（w/h 为有效宽高 mm）
const SENSORS = [
  { id: 'full', label: '全画幅 35mm（36×24）', inch: '全画幅', w: 36, h: 24 },
  { id: 'in1', label: '1" 型（12.8×9.6）', inch: '1', w: 12.8, h: 9.6 },
  { id: 'in118', label: '1/1.8"（7.18×5.32）', inch: '1/1.8', w: 7.18, h: 5.32 },
  { id: 'in25', label: '1/2.5"（5.76×4.29）', inch: '1/2.5', w: 5.76, h: 4.29 },
  { id: 'in27', label: '1/2.7"（5.37×4.04）', inch: '1/2.7', w: 5.37, h: 4.04 },
  { id: 'in28', label: '1/2.8"（5.02×3.76）· 监控主流', inch: '1/2.8', w: 5.02, h: 3.76 },
  { id: 'in3', label: '1/3"（4.8×3.6）', inch: '1/3', w: 4.8, h: 3.6 },
  { id: 'in4', label: '1/4"（3.2×2.4）', inch: '1/4', w: 3.2, h: 2.4 },
  { id: 'custom', label: '自定义宽×高…', custom: true }
]

// 常用镜头焦距档（mm）
const COMMON_FOCALS = [2.8, 3.6, 4, 6, 8, 12, 16]

// DORI 像素密度档（EN 62676-4；观察档精确值 62.5 px/m，标准取整 63）
const DORI_LEVELS = [
  { key: 'detect', label: '侦测 Detect', ppm: 25 },
  { key: 'observe', label: '观察 Observe', ppm: 63 },
  { key: 'recognize', label: '识别 Recognize', ppm: 125 },
  { key: 'identify', label: '辨认 Identify', ppm: 250 }
]

// 相机水平分辨率预设
const CAMERA_PRESETS = [
  { id: 'c2mp', label: '200 万像素 1080P（水平 1920px）', wpx: 1920 },
  { id: 'c3mp', label: '300 万像素（水平 2048px）', wpx: 2048 },
  { id: 'c4mp', label: '400 万像素 2K（水平 2560px）', wpx: 2560 },
  { id: 'c5mp', label: '500 万像素（水平 2592px）', wpx: 2592 },
  { id: 'c8mp', label: '800 万像素 4K（水平 3840px）', wpx: 3840 },
  { id: 'custom', label: '自定义水平像素…', custom: true }
]

// 正向：焦距+距离 → 视场宽/高/水平视场角；非法输入返回 null
function fovOf(sensorW, sensorH, focalMm, distM) {
  const w = Number(sensorW); const h = Number(sensorH); const f = Number(focalMm); const d = Number(distM)
  if (![w, h, f, d].every(Number.isFinite) || w <= 0 || h <= 0 || f <= 0 || d <= 0) return null
  return {
    w: (d * w) / f,
    h: (d * h) / f,
    hfov: 2 * Math.atan(w / (2 * f)) * (180 / Math.PI)
  }
}

// 反向：期望视场宽+距离 → 理论焦距；非法输入返回 null
function focalForWidth(sensorW, targetW, distM) {
  const w = Number(sensorW); const t = Number(targetW); const d = Number(distM)
  if (![w, t, d].every(Number.isFinite) || w <= 0 || t <= 0 || d <= 0) return null
  return (d * w) / t
}

// 吸附最近常用焦距档（线性最近，平手取小）
function snapFocal(f, ladder) {
  const list = ladder || COMMON_FOCALS
  const v = Number(f)
  if (!Number.isFinite(v) || v <= 0) return null
  return list.reduce((best, cur) => (Math.abs(cur - v) < Math.abs(best - v) ? cur : best), list[0])
}

// DORI：所需焦距 f = 像素密度(px/m) × 距离(m) × 传感器宽(mm) ÷ 水平分辨率(px)
function doriFocal(ppm, distM, sensorW, resWpx) {
  const p = Number(ppm); const d = Number(distM); const w = Number(sensorW); const r = Number(resWpx)
  if (![p, d, w, r].every(Number.isFinite) || p <= 0 || d <= 0 || w <= 0 || r <= 0) return null
  return (p * d * w) / r
}

// 实际像素密度（px/m）= 分辨率(px) ÷ 传感器宽(mm) × 焦距(mm) ÷ 距离(m)
function pxPerMeter(focalMm, distM, sensorW, resWpx) {
  const f = Number(focalMm); const d = Number(distM); const w = Number(sensorW); const r = Number(resWpx)
  if (![f, d, w, r].every(Number.isFinite) || f <= 0 || d <= 0 || w <= 0 || r <= 0) return null
  return (r / w) * (f / d)
}

// 千分位数字格式化：去除多余小数零，非法输入返回 '—'
function fmtNum(n, digits) {
  const d = digits === undefined ? 2 : digits
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 })
}
// ===== 单测区结束 =====

// ---------- 响应式状态 ----------
const MODES = [
  { id: 'forward', label: '正向：焦距 → 视场' },
  { id: 'reverse', label: '反向：视场 → 焦距' },
  { id: 'dori', label: 'DORI：场景 → 焦距' }
]

const mode = ref('forward')
const sensorId = ref('in28')
const customSw = ref(5.02)
const customSh = ref(3.76)
const focal = ref(4)
const distance = ref(10)
const targetW = ref(6)
const cameraId = ref('c2mp')
const customResW = ref(1920)
const doriKey = ref('identify')

const isCustomSensor = computed(() => sensorId.value === 'custom')
const isCustomCamera = computed(() => cameraId.value === 'custom')
const sensorMeta = computed(() => SENSORS.find((s) => s.id === sensorId.value) || SENSORS[0])
const sensorW = computed(() => (isCustomSensor.value ? Number(customSw.value) || 0 : sensorMeta.value.w))
const sensorH = computed(() => (isCustomSensor.value ? Number(customSh.value) || 0 : sensorMeta.value.h))
const cameraMeta = computed(() => CAMERA_PRESETS.find((c) => c.id === cameraId.value) || CAMERA_PRESETS[0])
const resW = computed(() => (isCustomCamera.value ? Number(customResW.value) || 0 : cameraMeta.value.wpx))
const activeDori = computed(() => DORI_LEVELS.find((l) => l.key === doriKey.value) || DORI_LEVELS[0])

const issues = computed(() => {
  const list = []
  if (sensorW.value <= 0 || sensorH.value <= 0) list.push('传感器有效宽高需为大于 0 的数值（mm）')
  const d = Number(distance.value)
  if (!Number.isFinite(d) || d <= 0) list.push('监控距离需为大于 0 的数值（m）')
  if (mode.value === 'forward') {
    const f = Number(focal.value)
    if (!Number.isFinite(f) || f <= 0) list.push('焦距需为大于 0 的数值（mm）')
  }
  if (mode.value === 'reverse') {
    const t = Number(targetW.value)
    if (!Number.isFinite(t) || t <= 0) list.push('期望视场宽度需为大于 0 的数值（m）')
  }
  if (mode.value === 'dori') {
    const r = Number(resW.value)
    if (!Number.isFinite(r) || r < 320) list.push('相机水平分辨率需 ≥320 像素')
  }
  return list
})

const valid = computed(() => issues.value.length === 0)

// 正向结果
const forwardResult = computed(() => {
  if (mode.value !== 'forward' || !valid.value) return null
  const r = fovOf(sensorW.value, sensorH.value, focal.value, distance.value)
  if (!r) return null
  return {
    ...r,
    text: `监控镜头视场：${sensorMeta.value.label.includes('自定义') ? `${sensorW.value}×${sensorH.value}mm` : sensorMeta.value.label} · 焦距 ${focal.value}mm · 距离 ${fmtNum(distance.value)}m → 视场宽 ${fmtNum(r.w)}m × 高 ${fmtNum(r.h)}m（水平视场角 ${fmtNum(r.hfov, 1)}°）`
  }
})

// 反向：某档焦距在该距离下的视场宽（速查条用）
function reverseWidthOf(f) {
  const r = fovOf(sensorW.value, sensorH.value, f, distance.value)
  return r ? r.w : null
}

const reverseResult = computed(() => {
  if (mode.value !== 'reverse' || !valid.value) return null
  const exact = focalForWidth(sensorW.value, targetW.value, distance.value)
  if (exact === null) return null
  const snap = snapFocal(exact)
  const actual = fovOf(sensorW.value, sensorH.value, snap, distance.value)
  return {
    exact,
    snap,
    actualW: actual ? actual.w : null,
    devPct: actual ? ((actual.w - targetW.value) / targetW.value) * 100 : null,
    text: `镜头选型：期望 ${fmtNum(distance.value)}m 处视场宽 ${fmtNum(targetW.value)}m → 理论焦距 ${fmtNum(exact)}mm，推荐 ${snap}mm（实际视场宽约 ${fmtNum(actual ? actual.w : null)}m）`
  }
})

// DORI 全档行 + 当前档结果
const doriRows = computed(() => {
  if (mode.value !== 'dori' || !valid.value) return []
  return DORI_LEVELS.map((lv) => {
    const fExact = doriFocal(lv.ppm, distance.value, sensorW.value, resW.value)
    const snap = fExact === null ? null : snapFocal(fExact)
    const ppmWithSnap = snap === null ? null : pxPerMeter(snap, distance.value, sensorW.value, resW.value)
    return {
      key: lv.key,
      label: lv.label,
      ppm: lv.ppm,
      fExact,
      snap,
      snapPpm: ppmWithSnap,
      snapPass: ppmWithSnap !== null && ppmWithSnap >= lv.ppm
    }
  })
})

const doriResult = computed(() => {
  if (mode.value !== 'dori' || !valid.value) return null
  const row = doriRows.value.find((r) => r.key === doriKey.value)
  if (!row || row.fExact === null) return null
  return {
    ...row,
    text: `DORI 焦距（EN 62676-4）：${row.label} ${row.ppm}px/m · ${cameraMeta.value.label.includes('自定义') ? resW.value + 'px' : cameraMeta.value.label} · 距离 ${fmtNum(distance.value)}m → 所需焦距 ${fmtNum(row.fExact)}mm，常用档 ${row.snap}mm（${row.snapPass ? '达标' : '未达标'}）`
  }
})

// ---------- 交互动作 ----------
function resetAll() {
  mode.value = 'forward'
  sensorId.value = 'in28'
  customSw.value = 5.02
  customSh.value = 3.76
  focal.value = 4
  distance.value = 10
  targetW.value = 6
  cameraId.value = 'c2mp'
  customResW.value = 1920
  doriKey.value = 'identify'
}

async function copyResult(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动复制')
  }
}

onMounted(() => {
  addRecentTool('cctv-lens-calculator')
})
</script>
