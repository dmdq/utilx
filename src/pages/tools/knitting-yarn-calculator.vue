<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Heart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">毛线用量估算器</h1>
          <p class="text-sm text-muted-foreground mt-1">10×10cm 小样称重换算密度克重，按部位清单展开织物面积，估算总克重 / 两数 / 团数，米数核对与同批染号提醒</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线毛线用量计算工具：先织一块 10×10cm 小样称重（克数即「克/百平方厘米」密度口径），或直接用中粗棒针、钩针短针、蕾丝、粗棒针等档位参考带；
        再按毛衣前片 / 后片 / 袖 / 领 / 帽子 / 围巾 / 开衫等部位清单填宽×长×件数，工具展开总面积并算出所需克重（克与两双显）、向上取整的线团数，
        还能用线标「X 米/Y 克」核对米数。全部在浏览器本地完成，不上传任何数据，棒针钩针开织前备料参考。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>毛线用量=织物面积×密度克重（经验带），不同针法松紧与线材品牌差异可达 ±25%；强烈建议一次买够同批次染号，余 10%——补色差批是编织圈最大的痛。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：两步设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-6">
        <!-- 第一步：密度小样卡 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ① 密度小样卡（可选跳过）
          </h2>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button
              @click="stepMode = 'default'"
              class="px-3 py-2 rounded-lg text-sm font-medium border transition"
              :class="stepMode === 'default' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >用档位默认</button>
            <button
              @click="stepMode = 'swatch'"
              class="px-3 py-2 rounded-lg text-sm font-medium border transition"
              :class="stepMode === 'swatch' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >我测了小样</button>
          </div>

          <div v-show="stepMode === 'swatch'" class="space-y-2">
            <label class="text-sm text-muted-foreground block">
              织 10×10cm 小样，洗后平铺晾干复称，克重（g）
              <input
                v-model="swatchGrams"
                type="number"
                min="1"
                step="0.1"
                placeholder="如 24"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <p class="text-xs text-muted-foreground">10×10cm 恰为 100cm²，所以小样克数就是「克/百平方厘米」。</p>
            <p v-show="swatchWarning" class="text-xs flex items-start gap-1.5 p-2 rounded bg-red-500/10 text-red-600">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ swatchWarning }}</span>
            </p>
            <p v-if="gaugeInfo" class="text-xs flex items-start gap-1.5 p-2 rounded bg-muted/60 text-foreground">
              <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>按小样口径预估：这件成衣约 {{ fmtInt(gaugeInfo.grams) }} g {{ liangTextOf(gaugeInfo.grams) }}（净重，未含余量）。</span>
            </p>
          </div>

          <div v-show="stepMode === 'default'" class="space-y-2">
            <label
              v-for="tier in YIELD_DEFAULTS"
              :key="tier.id"
              class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
              :class="yieldId === tier.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/60'"
            >
              <input type="radio" name="yarn-tier" :value="tier.id" v-model="yieldId" class="mt-1 accent-[var(--primary,#6366f1)]" />
              <span class="text-sm">
                <span class="font-medium text-foreground">{{ tier.label }}</span>
                <span class="block text-xs text-muted-foreground">{{ tier.g }}g/百平方厘米 · 参考带 {{ tier.range[0] }}–{{ tier.range[1] }}g · {{ tier.note }}</span>
              </span>
            </label>
            <p class="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>以上为常见参考带非标准，不同品牌与松紧差异可达 ±25%，有条件尽量测小样。</span>
            </p>
          </div>
        </div>

        <hr class="border-border" />

        <!-- 第二步：织物部位清单 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ② 织物部位清单（宽×长 cm）
          </h2>
          <label class="text-sm text-muted-foreground block mb-3">
            件型
            <select
              :value="garmentId"
              @change="onGarmentChange($event.target.value)"
              class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="(preset, id) in GARMENT_PRESETS" :key="id" :value="id">{{ preset.name }}</option>
            </select>
          </label>

          <div class="grid grid-cols-[1fr_60px_60px_48px_24px] gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
            <span>部位</span><span>宽cm</span><span>长cm</span><span>件数</span><span></span>
          </div>
          <div class="space-y-1.5">
            <div v-for="row in rows" :key="row.key" class="grid grid-cols-[1fr_60px_60px_48px_24px] gap-1.5 items-center">
              <input
                v-model="row.name"
                class="min-w-0 px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                aria-label="部位名称"
              />
              <input v-model="row.w" type="number" min="0" class="px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs w-full" aria-label="宽度" />
              <input v-model="row.h" type="number" min="0" class="px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs w-full" aria-label="长度" />
              <input v-model="row.count" type="number" min="1" class="px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs w-full" aria-label="件数" />
              <button
                @click="removeRow(row.key)"
                class="text-muted-foreground hover:text-red-500 text-sm leading-none"
                aria-label="删除该行"
              >×</button>
            </div>
          </div>
          <button
            @click="addRow"
            class="mt-2 text-xs text-primary hover:underline"
          >+ 加一行自定义部位</button>

          <div class="flex flex-wrap gap-2 mt-3">
            <button
              v-for="p in playPresets"
              :key="p.id"
              @click="applyPreset(p.id)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition"
            >
              <Play class="w-3.5 h-3.5 text-primary" /> {{ p.name }}
            </button>
          </div>
        </div>

        <hr class="border-border" />

        <!-- 第三步：线团与余量 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> ③ 线团规格与余量
          </h2>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <label class="text-sm text-muted-foreground">
              每团克重（g）
              <input v-model="skeinGrams" type="number" min="1" class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <div class="text-sm text-muted-foreground">
              线标核对（可选）
              <div class="mt-1 flex gap-1.5">
                <input v-model="labelMeters" type="number" min="1" placeholder="米" class="w-1/2 px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input v-model="labelGrams" type="number" min="1" placeholder="克" class="w-1/2 px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
          </div>
          <label class="block text-sm text-muted-foreground mb-1">
            余量系数 ×{{ waste.toFixed(2) }}——图案交换、麻花、线头多取高值
          </label>
          <input v-model.number="waste" type="range" min="1" max="1.3" step="0.05" class="w-full accent-[var(--primary,#6366f1)]" />
          <p class="text-xs text-muted-foreground mt-1">范围 1.0–1.3；默认 1.1 即「买线多备 10%」。</p>

          <button
            @click="resetAll"
            class="mt-4 w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复初始（成年M套头毛衣示例）
          </button>
        </div>
      </div>

      <!-- 右侧：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 大结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="bg-primary/10 rounded-lg p-5 text-center mb-4">
            <p class="text-xs text-muted-foreground mb-1">预估用线（含余量 ×{{ waste.toFixed(2) }}）</p>
            <p class="text-5xl font-bold text-primary">{{ fmtInt(totalGrams) }}<span class="text-lg font-semibold ml-1">g</span></p>
            <p class="text-sm text-muted-foreground mt-2">双显：{{ liangTextOf(totalGrams) }} · 传统读法 {{ qianTextOf(totalGrams) }}（1 两 = 50g）</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">口径</p>
              <p class="text-sm font-bold text-foreground">{{ gramsPer100 ? gramsPer100 + ' g/百cm²' : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">总面积</p>
              <p class="text-sm font-bold text-foreground">{{ fmtInt(totalArea) }} cm²</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">净用量</p>
              <p class="text-sm font-bold text-foreground">{{ fmtInt(netGrams) }} g</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">线团数</p>
              <p class="text-sm font-bold text-primary">{{ valid ? skeinInfo.skeins + ' 团' : '—' }}</p>
            </div>
          </div>

          <p v-show="valid" class="text-sm text-foreground flex items-start gap-1.5 p-2.5 rounded bg-muted/60 mb-3">
            <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>
              按 {{ num(skeinGrams) }}g/团 向上取整需 <b>{{ skeinInfo.skeins }}</b> 团{{ skeinInfo.meters ? `，折合约 ${fmtInt(skeinInfo.meters)} 米` : '' }}；
              {{ metersInfo ? `按线标 ${num(labelMeters)}米/${num(labelGrams)}克 核对，总长约 ${fmtInt(metersInfo.meters)} 米（每 100g ≈ ${fmtInt(metersInfo.metersPer100g)} 米）。` : '填线标「米/克」可加一行米数核对。' }}
            </span>
          </p>
          <p v-show="!valid" class="text-sm text-foreground flex items-start gap-1.5 p-2.5 rounded bg-red-500/10 mb-3">
            <TriangleAlert class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{{ invalidHint }}</span>
          </p>

          <p class="text-xs text-muted-foreground flex items-start gap-1.5 p-2.5 rounded bg-amber-500/10">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>一次买够同批次染号、多留一团：同色号不同染批会有可见色差，断线后补批基本无解——这是编织圈最大的痛。</span>
          </p>
        </div>

        <!-- 部位明细表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 部位明细
          </h2>
          <div class="space-y-2">
            <div v-for="d in detail" :key="d.key" class="grid grid-cols-[90px_1fr_120px] sm:grid-cols-[120px_1fr_160px] items-center gap-3 text-sm">
              <span class="truncate text-foreground" :title="d.name">{{ d.name || '未命名' }}</span>
              <span class="h-2 rounded-full bg-muted overflow-hidden">
                <i class="block h-full rounded-full bg-primary/70" :style="{ width: d.share + '%' }"></i>
              </span>
              <span class="text-right text-xs text-muted-foreground font-mono">{{ fmtInt(d.area) }} cm² · {{ fmtInt(d.grams) }} g · {{ d.share }}%</span>
            </div>
          </div>
          <p v-show="!detail.length" class="text-sm text-muted-foreground">清单为空，先选件型或加一行自定义部位。</p>
          <p class="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
            常识参考（常见，非标准）：蕾丝细线 100g ≈ 400–500m · 中粗毛线 100g ≈ 180–250m · 粗棒针线 100g ≈ 80–120m。
          </p>
        </div>

        <!-- SVG 件型简图 + 备料清单 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 件型简图与备料清单
          </h2>
          <div v-show="garmentSvg" class="text-primary/60 flex justify-center py-2" v-html="garmentSvg"></div>

          <pre class="bg-muted/50 rounded-lg p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono">{{ checklistText }}</pre>
          <div class="flex items-center gap-3 mt-3">
            <button
              @click="copyChecklist"
              :disabled="!valid"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle v-if="copied === 'ok'" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              {{ copiedText }}
            </button>
            <span class="text-xs text-muted-foreground">复制到微信群 / 备忘录，下单对单用。</span>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>毛线用量估算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          毛线用量估算器是一款面向棒针 / 钩针爱好者的本地计算工具。核心公式只有一条：用量（克）= 织物展开面积（cm²）× 密度克重（克/百平方厘米）÷ 100，再乘余量系数。
          密度克重优先用自己的 10×10cm 小样克重实测（小样克数恰等于每 100cm² 克重），也提供中粗棒针平针 22g、钩针短针 28g、蕾丝 12g、粗棒针 10g 等常见参考带档位；
          面积按毛衣前片 / 后片 / 袖 / 领 / 下摆、围巾、帽子、开衫等部位清单展开，结果同时给出克、两（1 两 = 50g）双显、向上取整的团数，以及按线标「X 米/Y 克」的米数核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么毛线用量老算不准？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三个变量叠加：一是针法松紧，同一个人换一号针、紧一点或松一点，织物克重能差出 10-20%；二是织片密度差，平针、罗纹、麻花、镂空对线的「吃线程度」完全不同，麻花绞合会把布片收小、实际用线更多；
          三是线材品牌差异，同样标「中粗」的两款线，股数、捻度、纺法不同，每百米克重也不同。所以任何「M 码毛衣用几两线」的经验帖都只能是参考，唯一可靠的办法是织小样称重，把密度口径换成你自己的数字。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">小样为什么必须洗后量？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          羊毛、羊绒等动物纤维下水后会缩水、回弹并重新定型，湿前干后的尺寸和密度不一样；棉线、腈纶也有不同程度的定型变化。小样洗一次、平铺晾干后再量 10×10cm 的克重，
          得到的才是「成衣状态」的密度，否则按未洗小样估算会系统性偏差，常见后果是衣服下水后短一圈、线却以为自己算多了。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">两和克为什么双显？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          老一辈买线说「两」——去毛线店讲「织件毛衣要几两线」是通用语言；而网购线团标签、克重秤都以克为准。按 1 两 = 50g 的市制换算（克 × 0.02 = 两），
          本工具把总量同时写成「2468g ≈ 49.4 两」和传统读法「49 两 13 钱」，对线店老板和对着克下单都能用，避免换算口误买错。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">同批染号是什么坑？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          毛线按「缸号 / 染号」批次染色，同一色号不同批次之间存在肉眼可辨的色差，织成成品后在光下尤其明显。最痛的场景是：织到袖子上半截发现线不够，
          补买的却是新一缸，整件衣服两只袖子颜色不同，只能拆。对策就是本页那条：一次按估算量再余 10% 买齐同批次染号，宁可剩一团。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">钩针比棒针费线吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          常见说法是钩针短针比棒针平针费线约 20-30%：钩织物的线圈结构更立体、更厚实，同样面积自然更吃线。但这只是「常见说法」的经验区间，
          棒针若用挑花、双股、密实针法同样费线。本工具把两者都收进档位参考带（钩针短针 28g vs 中粗棒针平针 22g/百平方厘米），最终以各自小样克重为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">织毛衣到底要几两线？</h3>
            <p class="text-sm text-muted-foreground mt-1">取决于面积和密度：先织 10×10cm 小样称重得「克/百平方厘米」，再乘衣服展开面积（成年 M 码前片约 48×60、袖约 36×45），最后放 1.0–1.3 的余量系数。本工具内置部位清单与常见档位，一键估算并给出两数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">没有小样能用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以跳过，直接用中粗棒针 22g、钩针短针 28g、蕾丝 12g、粗棒针 10g 等档位参考带（均为常见参考非标准）。结果波动会大，建议按区间上限买线。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">克和两怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">市制 1 两 = 50 克，克 × 0.02 = 两；1 钱 = 5 克。结果卡对总量做克 / 两 / 两钱三种写法双显，方便对照线下毛线店口径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么要按线标米数核对？</h3>
            <p class="text-sm text-muted-foreground mt-1">同克重不同粗细的线米数差别很大（长毛线 100g 可达 400m，粗线 100g 可能只有 100m）。填线标「X 米/Y 克」，工具把所需克重折成米数，和手边已有的线对照更稳。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有输入与计算都在浏览器本地完成，不发送任何网络请求，刷新页面即清空。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'knitting-yarn-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Heart, Ruler, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '毛线用量估算器 - 织毛衣要几两线/棒针钩针用线在线计算',
  description: '免费在线毛线用量计算器：10×10cm 小样称重换算密度克重，按毛衣/围巾/帽子/开衫部位清单展开织物面积，估算总克重与两数双显、团数向上取整，支持线标米数核对与余量调节，提醒同批次染号，纯浏览器本地运行不上传。',
  keywords: '毛线用量计算,织毛衣要几两线,棒针密度换算,钩针用线估算,编织克重',
  author: '有条工具',
  ogTitle: '毛线用量估算器 - 织毛衣要几两线/棒针钩针用线在线计算 | 有条工具',
  ogDescription: '小样克重换算密度，部位清单展开面积，估算克重/两数/团数并核对米数，同批染号一次买够。',
  ogUrl: 'https://www.util.cn/tools/knitting-yarn-calculator',
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
          name: '毛线用量估算器',
          url: 'https://www.util.cn/tools/knitting-yarn-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['10×10cm 小样克重换算克/百平方厘米', '成年M码部位清单预填可改', '面积×参考克重估算总用量', '克/两双显与团数向上取整', '线标米/克换算米数核对', '1.0–1.3 余量滑杆', '备料清单一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '毛线用量估算器', item: 'https://www.util.cn/tools/knitting-yarn-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '织毛衣到底要几两线？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于面积和密度：先织10×10cm小样称重得克/百平方厘米，再乘衣服展开面积（成年M码前片约48×60、袖约36×45），最后放1.0-1.3的余量系数。本工具内置部位清单与常见档位，可一键估算并给出两数。' }
            },
            {
              '@type': 'Question',
              name: '没有小样能用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以跳过，直接用中粗棒针22g、钩针短针28g、蕾丝12g、粗棒针10g等档位参考带估算（均为常见参考非标准）。结果波动会更大，建议按区间上限买线并放足余量。' }
            },
            {
              '@type': 'Question',
              name: '克和两怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '市制1两=50克，克×0.02=两；1钱=5克。结果卡对总量同时给出克、两与传统两钱三种写法，方便对照线下毛线店的说法和网购克重规格。' }
            },
            {
              '@type': 'Question',
              name: '钩针比棒针费线吗？',
              acceptedAnswer: { '@type': 'Answer', text: '常见说法是钩针短针比棒针平针费线约20-30%，因为钩织物结构更厚实吃线；但这只是经验区间，实际以各自小样克重为准，本工具档位参考带已按此差异区分。' }
            },
            {
              '@type': 'Question',
              name: '为什么强调同批次染号？',
              acceptedAnswer: { '@type': 'Answer', text: '同色号不同染色批次存在可见色差，织到一半断线再补基本买不到同缸号，成品会出现色差。按估算量再余10%一次买够同批染号，宁可剩一团。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 数值解析：非法 / 空 / 负数一律记 0，保证表格与算式不因输入抖动而 NaN
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
function round1(v) { return Math.round(v * 10) / 10 }
function fmtInt(v) { return Math.round(num(v) || 0).toLocaleString('en-US') }

// 品类默认克重表：g = 克/百平方厘米（10×10cm 小样口径）。均为常见参考带非标准
const YIELD_DEFAULTS = [
  { id: 'worsted', label: '中粗棒针平针（4–4.5mm 针）', g: 22, range: [18, 26], note: '常见参考带非标准' },
  { id: 'crochet', label: '钩针短针（3–5mm 钩）', g: 28, range: [24, 34], note: '常见说法：短针比平针费线约 20–30%' },
  { id: 'lace', label: '蕾丝 / 细针（2–3mm 针）', g: 12, range: [9, 15], note: '常见参考带非标准' },
  { id: 'bulky', label: '粗棒针（5–8mm 针 / 段染粗线）', g: 10, range: [7, 14], note: '常见参考带非标准' }
]

// 件型部位预置清单（成年 M 码尺寸，可改；宽×长 cm × 件数）
const GARMENT_PRESETS = {
  sweater: {
    name: '套头毛衣（成年 M·六部位）',
    yieldId: 'worsted',
    rows: [
      { name: '前片', w: 48, h: 60, count: 1 },
      { name: '后片', w: 48, h: 60, count: 1 },
      { name: '袖子', w: 36, h: 45, count: 2 },
      { name: '领子', w: 40, h: 10, count: 1 },
      { name: '袖口', w: 20, h: 10, count: 2 },
      { name: '下摆', w: 40, h: 10, count: 1 }
    ]
  },
  cardigan: {
    name: '开衫（成年 M·前片×2）',
    yieldId: 'worsted',
    rows: [
      { name: '前片', w: 24, h: 60, count: 2 },
      { name: '后片', w: 48, h: 60, count: 1 },
      { name: '袖子', w: 36, h: 45, count: 2 },
      { name: '门襟', w: 5, h: 60, count: 2 }
    ]
  },
  hat: {
    name: '毛线帽（成年）',
    yieldId: 'worsted',
    rows: [
      { name: '帽身', w: 50, h: 24, count: 1 },
      { name: '翻边', w: 50, h: 8, count: 1 }
    ]
  },
  scarf: {
    name: '围巾（30×180 粗针）',
    yieldId: 'bulky',
    rows: [{ name: '围巾主体', w: 30, h: 180, count: 1 }]
  },
  custom: {
    name: '自定义清单',
    yieldId: null,
    rows: [{ name: '自定义部位', w: 30, h: 40, count: 1 }]
  }
}

// 面积合计（cm²）：每行 宽×长×件数，非法输入记 0
function areaOf(rows) {
  return rows.reduce((s, r) => s + num(r.w) * num(r.h) * num(r.count || 1), 0)
}

// 克重 = 面积 × 克/百平方厘米 ÷ 100
function gramsOf(area, gramsPer100cm2) {
  return (num(area) * num(gramsPer100cm2)) / 100
}

// 余量系数：限定 1.0–1.3，默认 1.1（图案交换、线头多取高值）
function clampWaste(f) {
  if (!Number.isFinite(f)) return 1.1
  return Math.min(1.3, Math.max(1, f))
}
function applyWaste(grams, factor) {
  return num(grams) * clampWaste(factor)
}

// 团数：向上取整；给每团米数则折算总米；附同批染号提醒
function skeinsOf(grams, gramsPerSkein, metersPerSkein) {
  const g = num(grams), s = num(gramsPerSkein)
  if (!g || !s) return { skeins: 0, meters: 0, hint: '填写所需克重与每团克重后得出团数' }
  const skeins = Math.ceil(g / s)
  const meters = num(metersPerSkein) * skeins
  return { skeins, meters: round1(meters), hint: '同批次染号一次买够，宁可多一团' }
}

// 米数核对：线标「X 米 / Y 克」→ 所需克重折米，并给出每 100g 米数
function metersCheckOf(grams, labelMeters, labelGrams) {
  const g = num(grams), m = num(labelMeters), y = num(labelGrams)
  if (!g || !m || !y) return null
  return { meters: round1((g * m) / y), metersPer100g: round1((m / y) * 100) }
}

// 小样校验：10×10cm 小样克数即克/百平方厘米 → 预估成衣克重与两数
function gaugeCheckOf(swatchGrams, area) {
  const s = num(swatchGrams), a = num(area)
  if (!s || !a) return null
  const grams = gramsOf(a, s)
  return { gramsPer100cm2: s, grams, taels: taelsOf(grams) }
}

// 市制换算：1 两 = 50 g（g × 0.02），1 钱 = 5 g
function taelsOf(grams) { return num(grams) * 0.02 }
function liangTextOf(grams) {
  const t = taelsOf(grams)
  return t > 0 ? `≈ ${round1(t)} 两` : '—'
}
function qianTextOf(grams) {
  const g = num(grams)
  if (!g) return '—'
  const t = Math.floor(g / 50)
  const q = Math.floor((g - t * 50) / 5)
  return `${t} 两 ${q} 钱`
}

// XML 文本转义（SVG 模板内动态标签防注入）
function escapeText(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]))
}

// 件型简图：第一行部位展开矩形示意（毛衣轮廓 + 两袖），标签经 escape
function sweaterSvgOf(name, w, h) {
  const width = num(w), height = num(h)
  if (!width || !height) return ''
  const scale = 150 / Math.max(width, height)
  const bw = Math.max(12, Math.round(width * scale))
  const bh = Math.max(12, Math.round(height * scale))
  const x = Math.round(150 - bw / 2)
  const y = 30
  const label = `${escapeText(String(name || '织片'))} ${width}×${height} cm ×${1} 件（展开示意）`
  return `<svg viewBox="0 0 300 ${y + bh + 34}" class="w-full max-w-xs" role="img" aria-label="部位简图">`
    + `<polygon points="${x},${y + 2} ${x - 30},${y + 20} ${x - 22},${y + 34} ${x},${y + 40}" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.5"/>`
    + `<polygon points="${x + bw},${y + 2} ${x + bw + 30},${y + 20} ${x + bw + 22},${y + 34} ${x + bw},${y + 40}" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.5"/>`
    + `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="2"/>`
    + `<text x="150" y="${y + bh + 20}" text-anchor="middle" font-size="12" fill="currentColor">${label}</text>`
    + `</svg>`
}

// 备料清单文案（可独立单测）
function buildChecklistText(info) {
  const lines = []
  lines.push('【毛线备料清单】毛线用量估算器')
  lines.push(`口径：${info.sourceLabel}`)
  lines.push(`面积：${fmtInt(info.area)} cm²（${info.partCount} 个部位）`)
  lines.push(`净用量 ${fmtInt(info.netGrams)} g；含余量 ×${clampWaste(info.waste).toFixed(2)} → ${fmtInt(info.totalGrams)} g ${liangTextOf(info.totalGrams)}（${qianTextOf(info.totalGrams)}）`)
  lines.push(`团数：${fmtInt(info.gramsPerSkein)} g/团 × ${info.skeins} 团（向上取整）${info.skeinsMeters ? `，约 ${fmtInt(info.skeinsMeters)} 米` : ''}`)
  if (info.meters) lines.push(`米数核对：按线标 ${info.meters.text}，总长约 ${fmtInt(info.meters.meters)} 米`)
  lines.push('购买：一次买足同批次染号，宁可多一团；补色差批基本无解。')
  lines.push('说明：经验参考带非标准，针法松紧与线材差异 ±25%，建议洗后测小样校准。')
  return lines.join('\n')
}

// ---------- 交互状态 ----------
const stepMode = ref('default') // 'default' 用档位 | 'swatch' 用小样
const yieldId = ref('worsted')
const swatchGrams = ref('')
const garmentId = ref('sweater')
const rows = ref(
  GARMENT_PRESETS.sweater.rows.map((r, i) => ({ key: `sweater-${i}`, ...r }))
)
const skeinGrams = ref('90')
const labelMeters = ref('')
const labelGrams = ref('')
const waste = ref(1.1)
const copied = ref('') // '' | 'ok' | 'fail'
const seoContentVisible = ref(true)
let customSeq = 0

const playPresets = [
  { id: 'sweater', name: '成年 M 码套头毛衣（六部位·中粗 22g 档）' },
  { id: 'scarf', name: '围巾 30×180（粗针 10g 档）' }
]

const currentTier = computed(() => YIELD_DEFAULTS.find((t) => t.id === yieldId.value) || YIELD_DEFAULTS[0])
const gramsPer100 = computed(() =>
  stepMode.value === 'swatch' ? num(swatchGrams.value) : currentTier.value.g
)
const sourceLabel = computed(() =>
  stepMode.value === 'swatch'
    ? `实测小样 ${gramsPer100.value}g/百平方厘米（10×10cm）`
    : `${currentTier.value.label}（默认 ${currentTier.value.g}g/百平方厘米，${currentTier.value.note}）`
)
const swatchWarning = computed(() => {
  if (stepMode.value !== 'swatch') return ''
  const s = num(swatchGrams.value)
  if (!s) return '填小样克重（10×10cm 称出的克数）后才有估算结果。'
  if (s < 5 || s > 60) return '小样克重超出常见 5–60g/百平方厘米区间，请复称或确认小样确为 10×10cm。'
  return ''
})

const totalArea = computed(() => areaOf(rows.value))
const netGrams = computed(() => gramsOf(totalArea.value, gramsPer100.value))
const totalGrams = computed(() => applyWaste(netGrams.value, waste.value))
const valid = computed(() => gramsPer100.value > 0 && totalArea.value > 0 && num(skeinGrams.value) > 0)
const invalidHint = computed(() => {
  if (!gramsPer100.value) return '缺少密度口径：测小样填克重，或选一个档位默认。'
  if (!totalArea.value) return '面积合计为 0：给部位填上宽×长×件数。'
  return '填写每团克重后得出团数。'
})

const gaugeInfo = computed(() =>
  stepMode.value === 'swatch' ? gaugeCheckOf(swatchGrams.value, totalArea.value) : null
)
const metersPerSkein = computed(() => {
  const lm = num(labelMeters.value), lg = num(labelGrams.value), sg = num(skeinGrams.value)
  return lm && lg && sg ? round1((lm / lg) * sg) : 0
})
const skeinInfo = computed(() => skeinsOf(totalGrams.value, num(skeinGrams.value), metersPerSkein.value))
const metersInfo = computed(() => {
  const r = metersCheckOf(totalGrams.value, num(labelMeters.value), num(labelGrams.value))
  if (!r) return null
  return { ...r, text: `${num(labelMeters.value)}米/${num(labelGrams.value)}克（每 100g ≈ ${fmtInt(r.metersPer100g)} 米）` }
})

const detail = computed(() => {
  const total = totalArea.value
  return rows.value.map((r) => {
    const area = num(r.w) * num(r.h) * num(r.count || 1)
    return {
      key: r.key,
      name: r.name,
      area,
      grams: gramsOf(area, gramsPer100.value),
      share: total > 0 ? Math.round((area / total) * 100) : 0
    }
  })
})

const checklistText = computed(() =>
  buildChecklistText({
    sourceLabel: sourceLabel.value,
    area: totalArea.value,
    partCount: rows.value.length,
    netGrams: netGrams.value,
    totalGrams: totalGrams.value,
    waste: waste.value,
    gramsPerSkein: num(skeinGrams.value),
    skeins: skeinInfo.value.skeins,
    skeinsMeters: skeinInfo.value.meters,
    meters: metersInfo.value
  })
)
const copiedText = computed(() =>
  copied.value === 'ok' ? '已复制' : copied.value === 'fail' ? '复制失败，请手动选中' : '复制备料清单'
)
const garmentSvg = computed(() => {
  const first = rows.value[0]
  return first ? sweaterSvgOf(first.name, first.w, first.h) : ''
})

// ---------- 事件（浏览器 API 只在回调，SSR 安全） ----------
function loadGarment(id) {
  const preset = GARMENT_PRESETS[id] || GARMENT_PRESETS.custom
  garmentId.value = id
  rows.value = preset.rows.map((r, i) => ({ key: `${id}-${i}`, ...r }))
}
function onGarmentChange(id) { loadGarment(id) }
function applyPreset(id) {
  loadGarment(id)
  const tier = GARMENT_PRESETS[id] && GARMENT_PRESETS[id].yieldId
  if (tier) { stepMode.value = 'default'; yieldId.value = tier }
}
function addRow() {
  customSeq += 1
  rows.value = rows.value.concat({ key: `custom-${customSeq}`, name: '自定义部位', w: 30, h: 40, count: 1 })
}
function removeRow(key) {
  rows.value = rows.value.filter((r) => r.key !== key)
}
function resetAll() {
  stepMode.value = 'default'
  yieldId.value = 'worsted'
  swatchGrams.value = ''
  loadGarment('sweater')
  skeinGrams.value = '90'
  labelMeters.value = ''
  labelGrams.value = ''
  waste.value = 1.1
  copied.value = ''
}

async function copyChecklist() {
  try {
    await navigator.clipboard.writeText(checklistText.value)
    copied.value = 'ok'
  } catch {
    copied.value = 'fail'
  }
  setTimeout(() => { copied.value = '' }, 2000)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('knitting-yarn-calculator')
})
</script>
