<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Grid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">编织密度计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">10cm 标样针数×行数 → 起针数/行数换算，含旧图解密度缩放卡与宽松度口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线编织密度计算工具：先织一块 10×10cm 密度样片（洗后平铺晾干再量），数出 10cm 内的针数与行数，
        工具按「起针数 = 针密度 × 成衣胸围 ÷ 10、行数 = 行密度 × 衣长 ÷ 10」换算，并按编织方式把起针取整到偶数（罗纹/平针对称）或 4 的倍数（麻花绞花）；
        还能加填袖长算袖上行数。换线后密度变了？缩放卡按「新针数 = 旧针数 × 新密度 ÷ 旧密度」把旧图解整体缩放，行数同理并提示行数陷阱。
        成衣胸围 = 净胸围 + 松量（常见 4–10cm 口径）。全部计算在浏览器本地完成，不上传任何数据，起针前算一算，密度不准全白织。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>密度样片至少织 12×12cm，洗后平铺晾干、量中间 10×10cm 数针数与行数；样片织法要和成衣一致——圈织的部位用圈织样片，片织的部位用片织样片，两者密度常差 1–2 针。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- ① 密度样片 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ① 密度样片（10×10cm，洗后量）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="stitch-gauge" class="block text-sm font-medium text-foreground mb-1.5">针密度（针 / 10cm）</label>
              <input
                id="stitch-gauge"
                v-model.number="stitchGauge"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="10cm 内的针数，如 22"
              >
            </div>
            <div>
              <label for="row-gauge" class="block text-sm font-medium text-foreground mb-1.5">行密度（行 / 10cm）</label>
              <input
                id="row-gauge"
                v-model.number="rowGauge"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="10cm 内的行数，如 30"
              >
            </div>
          </div>
          <p class="text-xs text-muted-foreground">数法：样片平铺不拉伸，用尺子对齐量 10cm，数这段里的针脚（上针+下针都算）与行纹；两边各量一次取平均更稳。</p>
        </div>

        <!-- ② 成衣尺寸与取整 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ② 成衣尺寸与取整方式
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="chest" class="block text-sm font-medium text-foreground mb-1.5">成衣胸围（cm）</label>
              <input
                id="chest"
                v-model.number="chest"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="净胸围 + 松量，如 100"
              >
              <p class="text-xs text-muted-foreground mt-1">成衣胸围 = 净胸围 + 松量（4–10cm 口径）</p>
            </div>
            <div>
              <label for="body-len" class="block text-sm font-medium text-foreground mb-1.5">衣长（cm）</label>
              <input
                id="body-len"
                v-model.number="bodyLen"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="下摆到领口，如 60"
              >
            </div>
            <div>
              <label for="sleeve-len" class="block text-sm font-medium text-foreground mb-1.5">袖长（cm，可选）</label>
              <input
                id="sleeve-len"
                v-model.number="sleeveLen"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="袖口到袖山，如 45"
              >
            </div>
          </div>
          <div>
            <label for="stitch-mode" class="block text-sm font-medium text-foreground mb-1.5">起针取整方式（按编织方式选）</label>
            <select
              id="stitch-mode"
              v-model="stitchMode"
              class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="m in STITCH_MODES" :key="m.k" :value="m.k">{{ m.label }}——{{ m.note }}</option>
            </select>
          </div>
        </div>

        <!-- 结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Grid class="w-5 h-5 mr-2 text-primary" /> 起针数与行数
          </h2>
          <div v-if="valid" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">起针数（{{ modeLabel }}）</p>
                <p class="text-4xl font-bold text-primary">{{ stitches }}<span class="text-base font-semibold ml-1">针</span></p>
                <p class="text-xs text-muted-foreground mt-2">精确值 {{ fmt(stitchesExact, 1) }} 针</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">衣长行数</p>
                <p class="text-4xl font-bold text-primary">{{ bodyRows }}<span class="text-base font-semibold ml-1">行</span></p>
                <p class="text-xs text-muted-foreground mt-2">精确值 {{ fmt(bodyRowsExact, 1) }} 行</p>
              </div>
            </div>

            <div v-if="sleeveInfo" class="bg-muted/50 border border-border rounded-lg p-3 flex justify-between items-center text-sm">
              <span class="text-muted-foreground">袖长 {{ fmt(num(sleeveLen), 1) }} cm → 袖上行数</span>
              <span class="font-bold text-foreground">{{ sleeveInfo.rows }} 行（精确 {{ fmt(sleeveInfo.exact, 1) }}）</span>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 font-mono">{{ processText }}</p>

            <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li>· 偶数/4 的倍数只为对称与花样成组：罗纹 2 针一组、麻花 4 针一绞；前后片各减半针也要落在这档上。</li>
              <li>· 行数向上取整保证衣长够用，落肩、挂肩收针的行数分配请再按图解分段。</li>
              <li>· 成衣胸围记得含松量：合身 4–6cm、宽松 8–10cm，直接量最合身的一件成衣最稳。</li>
            </ul>

            <div class="flex items-center gap-3">
              <button
                @click="copyGaugeCard"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition"
              >
                <Copy class="w-4 h-4" /> 复制参数卡
              </button>
              <span class="text-xs text-muted-foreground">贴进图解笔记，起针时照着织。</span>
            </div>
          </div>
          <div v-else class="p-8 text-center text-muted-foreground">
            填入样片密度与成衣尺寸后自动算起针数与行数
          </div>
        </div>

        <!-- ③ 密度缩放卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> ③ 密度缩放卡（换线后旧图解怎么缩放）
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            换了线或换了针，密度和原图解不一样时：新针数 = 旧针数 × 新密度 ÷ 旧密度，行数同理。
            新密度比旧密度大（织得紧）就加针，织得松就减针；填旧图解起针数与两版密度即可。
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 针数缩放 -->
            <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-2.5">
              <p class="text-sm font-medium text-foreground">针数缩放</p>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-1">旧起针数</label>
                  <input v-model.number="scOldSt" type="number" min="0" class="w-full px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-xs" placeholder="如 100" >
                </div>
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-1">旧针密度</label>
                  <input v-model.number="scOldG" type="number" min="0" step="0.5" class="w-full px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-xs" placeholder="如 20" >
                </div>
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-1">新针密度</label>
                  <input v-model.number="scNewG" type="number" min="0" step="0.5" class="w-full px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-xs" placeholder="如 22" >
                </div>
              </div>
              <p v-if="scaleSt" class="text-sm text-foreground">
                新起针 <b class="text-primary">{{ scaleSt.suggest }}</b> 针（精确 {{ fmt(scaleSt.value, 1) }}，比例 ×{{ fmt(scaleSt.factor, 2) }}）
              </p>
              <p v-else class="text-xs text-muted-foreground">填旧起针数与两版针密度后得出</p>
            </div>
            <!-- 行数缩放 -->
            <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-2.5">
              <p class="text-sm font-medium text-foreground">行数缩放</p>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-1">旧行数</label>
                  <input v-model.number="scOldRow" type="number" min="0" class="w-full px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-xs" placeholder="如 150" >
                </div>
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-1">旧行密度</label>
                  <input v-model.number="scOldRowG" type="number" min="0" step="0.5" class="w-full px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-xs" placeholder="如 28" >
                </div>
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-1">新行密度</label>
                  <input v-model.number="scNewRowG" type="number" min="0" step="0.5" class="w-full px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-xs" placeholder="如 30" >
                </div>
              </div>
              <p v-if="scaleRow" class="text-sm text-foreground">
                新行数 <b class="text-primary">{{ scaleRow.suggest }}</b> 行（精确 {{ fmt(scaleRow.value, 1) }}，比例 ×{{ fmt(scaleRow.factor, 2) }}）
              </p>
              <p v-else class="text-xs text-muted-foreground">填旧行数与两版行密度后得出</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground flex items-start gap-1.5 p-2.5 rounded bg-amber-500/10">
            <Info class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>行数陷阱：针、行密度变化比例通常不同（横向 ×1.1 不代表竖向也 ×1.1），必须分别缩放；
            且收袖山、开领这类按行分配的段落要按新行数重新分段，直接按旧行数织长度会歪。</span>
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-4">
        <!-- 宽松度口径 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 宽松度速配（松量 4–10cm）
          </h2>
          <label class="block text-sm text-muted-foreground mb-2">
            净胸围（cm，量身体或量衣服）
            <input
              v-model.number="easeBust"
              type="number"
              min="0"
              class="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 88"
            >
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="e in [4, 6, 8, 10]"
              :key="e"
              @click="easeCm = e"
              :class="easeCm === e ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >松量 {{ e }}cm</button>
          </div>
          <p v-if="easeBust > 0" class="text-sm text-foreground mt-3">
            建议成衣胸围 <b class="text-primary">{{ fmt(easeSuggest, 1) }} cm</b>（净 {{ fmt(num(easeBust), 1) }} + 松量 {{ easeCm }}）
            <button @click="applyEase" class="ml-1 text-xs text-primary hover:underline">填入胸围</button>
          </p>
          <p class="text-xs text-muted-foreground mt-2">口径：合身 4–6cm、舒适 6–8cm、宽松外穿 8–10cm；开衫另加门襟重叠量。</p>
        </div>

        <!-- 常见密度参考 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Grid class="w-5 h-5 mr-2 text-primary" /> 常见密度参考带
          </h2>
          <div class="space-y-2">
            <button
              v-for="ref_ in GAUGE_REFS"
              :key="ref_.label"
              @click="applyGaugeRef(ref_)"
              class="w-full flex justify-between items-center px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-sm transition"
            >
              <span class="text-foreground">{{ ref_.label }}</span>
              <span class="font-mono text-xs text-muted-foreground">{{ ref_.st }} 针 × {{ ref_.row }} 行</span>
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-3">常见口径非标准，仅够先起样：手劲松紧、针法与线材都能差 ±2 针，正式织前必须用自己的样片校准。</p>
        </div>

        <!-- 互链 -->
        <div class="bg-muted/50 border border-border rounded-lg p-6">
          <h2 class="text-sm font-semibold text-foreground mb-2">配套工具</h2>
          <p class="text-sm text-muted-foreground leading-relaxed">
            起针行数定了之后，算这件衣服要备几团线？
            <NuxtLink to="/tools/knitting-yarn-calculator" class="text-primary hover:underline">毛线用量估算器</NuxtLink>
            按 10×10cm 小样克重 × 部位面积展开，估算总克重与团数。
          </p>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>编织密度计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          编织密度计算器是棒针 / 钩针开织前的第一道工具：把 10×10cm 密度样片上数出的针数与行数，
          换算成整件成衣的起针数与行数——起针数 = 针密度 × 成衣胸围 ÷ 10，行数 = 行密度 × 衣长 ÷ 10，
          起针按编织方式取整到偶数（罗纹、平针要左右对称、2 针一组）或 4 的倍数（麻花、绞花 4 针一组）。
          工具还带密度缩放卡：换线换针后密度变了，按「新针数 = 旧针数 × 新密度 ÷ 旧密度」把旧图解整体缩放，行数分别换算并提示行数陷阱；
          成衣胸围按「净胸围 + 松量 4–10cm」口径填写。算完线要备多少，可继续用
          <NuxtLink to="/tools/knitting-yarn-calculator" class="text-primary hover:underline">毛线用量估算器</NuxtLink>。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么必须织密度样片？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为每个人的手劲、针法松紧和线材粗细都不一样，同一款线同一副针，两个人织出的密度能差 2–4 针/10cm。
          而密度差 1 针，100cm 胸围就是差 10 针、成衣差约 4.5cm——起针时错一点，织到一半才看出来，拆也不是、硬穿也不是，
          这就是「密度不准全白织」。样片至少 12×12cm（边缘针目不齐，只量中间 10cm），洗后平铺晾干再量：
          羊毛羊绒下水会缩绒回弹，未洗样片的密度是假的。花半小时织样，省下的是整件拆掉的几周。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">圈织和片织的密度为什么不一样？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          片织来回翻面，正针反针交替，两个方向的手劲略有抵消；圈织始终同一方向下针，用力更顺，线圈结构更紧致，
          常见说法是圈织密度比片织略小（同样 10cm 少 1–2 针）或行距更松。所以成衣里圈织的身筒要用圈织样片（或往返织不翻面的假圈织）来测，
          片织的前片、门襟用片织样片测。用片织密度去起圈织的身筒，腰身宽度会偏差 2–4cm 量级。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">换线后旧图解怎么缩放？行数陷阱是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          旧图解按「旧密度」写的针行数，换线后密度变了就按比例缩放：新针数 = 旧针数 × 新针密度 ÷ 旧针密度，
          新行数 = 旧行数 × 新行密度 ÷ 旧行密度。例：图解 100 针按密度 20 织，你的样片是密度 22 → 100 × 22 ÷ 20 = 110 针。
          两个陷阱：一是针、行两个方向的比例通常不同（横向 ×1.1 不等于竖向也 ×1.1），必须分开各算各的；
          二是收袖山、开领这类按行分配的段落，缩放后要按新行数重新分段行数，否则肩线斜度、袖山弧度都会变形。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">松量该留多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          成衣胸围 = 净胸围 + 松量。常见口径：贴身打底 0–4cm、合身 4–6cm、舒适常规 6–8cm、宽松外穿 8–10cm 以上；
          儿童装要另留生长余量，开衫还要加门襟重叠。最稳的做法是量一件你穿着最合适的成衣的胸围直接填入，连松量判断都省了。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">密度样片要多大、怎么量？</h3>
            <p class="text-sm text-muted-foreground mt-1">至少 12×12cm（10×10 太小边缘失真），用与成衣相同的针法与针圈织或片织，洗后平铺晾干，量中间 10×10cm 数针数与行数；上下左右各量一次取平均。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">起针数为什么要取偶数或 4 的倍数？</h3>
            <p class="text-sm text-muted-foreground mt-1">罗纹上下针 2 针一组、左右片对称要求偶数起针；麻花、绞花、菱形等花样以 4 针（或 4 的倍数）为一组循环，起针落在组宽上花型才完整不缺针。本工具按你选的编织方式自动取整。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">密度 20 换 22，针数怎么变？</h3>
            <p class="text-sm text-muted-foreground mt-1">按比例 ×22/20 = ×1.1：原图解 100 针要织成 110 针（织得密要加针）。行数另用行密度单独算，别沿用同一个比例。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">不织样片直接按线标织行吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不建议。线标密度只是厂商标称，个人手劲差异普遍 ±2 针/10cm，对 100cm 胸围就是 ±8–9cm 的成衣误差。赶时间可以用线标密度先起一小段边织边量，及时纠偏。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">钩针也能用这个算法吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以，口径完全一样：数 10×10cm 内的针目数与行数填入即可。钩针密度对线材粗细更敏感，样片照织；算用线量可用毛线用量估算器的钩针档位。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'knitting-gauge'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Grid, Ruler, Info, ArrowRightLeft,
  ChevronUp, ChevronDown, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'knitting-gauge'
const STORAGE_KEY = 'knitting-gauge.inputs'

// ---------- SEO ----------
useSeoMeta({
  title: '编织密度计算器 - 起针数/行数换算与旧图解缩放在线计算',
  description: '免费在线编织密度计算器：10×10cm 样片针数×行数换算成衣起针数与行数，按编织方式取整到偶数或 4 的倍数，含换线后旧图解密度缩放卡（新针数=旧针数×新密度/旧密度）、袖长行数与净胸围+松量 4–10cm 口径，纯浏览器本地计算。',
  keywords: '编织密度,起针数计算,密度样片,棒针密度换算,图解缩放,gauge编织,knitting gauge,织毛衣起针',
  author: '有条工具',
  ogTitle: '编织密度计算器 - 起针数/行数换算与旧图解缩放 | 有条工具',
  ogDescription: '10cm 标样换算起针数与行数，换线后旧图解按密度比例缩放，行数陷阱提示。',
  ogUrl: 'https://www.util.cn/tools/knitting-gauge',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '编织密度计算器',
  twitterDescription: '10×10cm 样片换算起针数/行数，密度缩放卡缩放旧图解，松量口径速配。'
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
          name: '编织密度计算器',
          url: 'https://www.util.cn/tools/knitting-gauge',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '10×10cm 样片密度换算起针数与行数',
            '起针按编织方式取整到偶数/4 的倍数',
            '袖长行数可选计算',
            '换线后旧图解密度缩放卡（针/行分别换算）',
            '净胸围+松量 4–10cm 宽松度速配',
            '常见密度参考带一键填入',
            '参数卡一键复制',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '编织密度计算器', item: 'https://www.util.cn/tools/knitting-gauge/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么必须织密度样片？',
              acceptedAnswer: { '@type': 'Answer', text: '手劲、针法与线材差异使同一款线同一副针的密度能差 2-4 针/10cm；密度差 1 针，100cm 胸围就差 10 针、成衣差约 4.5cm，起针错了只能整件拆。样片至少 12×12cm，洗后平铺晾干再量中间 10×10cm。' }
            },
            {
              '@type': 'Question',
              name: '圈织和片织的密度为什么不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '片织正反针交替、圈织始终同向下针，用力方式不同导致密度常差 1-2 针/10cm。圈织的身筒要用圈织样片（或假圈织）测密度，片织部位用片织样片测。' }
            },
            {
              '@type': 'Question',
              name: '密度 20 换 22，旧图解针数怎么缩放？',
              acceptedAnswer: { '@type': 'Answer', text: '新针数 = 旧针数 × 新密度 ÷ 旧密度 = 旧针数 × 22/20 = ×1.1，原图解 100 针需织 110 针。行数要用行密度单独换算，且收袖山、开领等分段按新行数重新分配。' }
            },
            {
              '@type': 'Question',
              name: '起针数为什么要取偶数或 4 的倍数？',
              acceptedAnswer: { '@type': 'Answer', text: '罗纹上下针 2 针一组、左右对称要求偶数起针；麻花绞花等花样以 4 针为一组循环，起针落在组宽上花型才完整。本工具按所选编织方式自动向上取整。' }
            },
            {
              '@type': 'Question',
              name: '成衣胸围的松量留多少？',
              acceptedAnswer: { '@type': 'Answer', text: '成衣胸围 = 净胸围 + 松量，常见口径：合身 4-6cm、舒适 6-8cm、宽松外穿 8-10cm 以上；开衫另加门襟重叠。最稳的办法是量一件穿着最合适的成衣胸围直接使用。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- 纯逻辑（可独立单测） ----------
// 数值解析：非法/空记 0
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}
function pos(v) {
  const n = num(v)
  return n > 0 ? n : 0
}
// 格式化：toFixed + 去尾零，避免浮点尾差
function fmt(v, dp = 2) {
  if (!Number.isFinite(v)) return '—'
  const s = Number(v).toFixed(dp)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}
function roundN(v, dp) {
  const f = Math.pow(10, dp)
  return Math.round(v * f) / f
}

// 起针数 = 针密度 × 宽(cm) / 10；行数 = 行密度 × 长(cm) / 10
function stitchesOf(gauge, cm) { return pos(gauge) * pos(cm) / 10 }
function rowsOf(gauge, cm) { return pos(gauge) * pos(cm) / 10 }

// 起针取整：even 向上取偶数（平针/罗纹 2 针一组、左右对称）；mult4 向上取 4 的倍数（麻花/绞花 4 针一组）；raw 四舍五入
function roundStitch(n, mode) {
  const v = num(n)
  if (v <= 0) return 0
  if (mode === 'mult4') return Math.ceil(v / 4) * 4
  if (mode === 'raw') return Math.round(v)
  return Math.ceil(v / 2) * 2
}
// 行数向上取整（保证衣长够用）
function ceilRows(n) { return Math.ceil(pos(n)) }

// 宽松度：成衣胸围 = 净胸围 + 松量（常见 4–10cm 口径）
function chestWithEase(bust, ease) { return pos(bust) + num(ease) }

// 密度缩放：新针数 = 旧针数 × 新密度 ÷ 旧密度（先乘后除，整数输入通常整除无尾差）
function scaleFactor(oldGauge, newGauge) {
  const g0 = pos(oldGauge)
  return g0 ? pos(newGauge) / g0 : 0
}
function scaledCount(oldN, oldGauge, newGauge) {
  const g0 = pos(oldGauge), g1 = pos(newGauge), n = pos(oldN)
  if (!g0 || !g1 || !n) return 0
  return (n * g1) / g0
}

// 起针取整方式注记
const STITCH_MODES = [
  { k: 'even', label: '平针/罗纹（取偶数）', note: '上下针 2 针一组、左右对称' },
  { k: 'mult4', label: '麻花/绞花/花样（取 4 的倍数）', note: '花样 4 针一组循环成组' },
  { k: 'raw', label: '不强制取整（四舍五入）', note: '仅估尺寸用时参考' }
]

// 常见密度参考带（常见口径非标准）
const GAUGE_REFS = [
  { label: '蕾丝细线（2–2.5mm 针）', st: 28, row: 40 },
  { label: '中粗线平针（3.5–4.5mm 针）', st: 22, row: 30 },
  { label: '粗线平针（5–6mm 针）', st: 16, row: 22 },
  { label: '极粗线（7–8mm 针）', st: 12, row: 16 }
]

// 参数卡文案（可独立单测）
function buildGaugeCard(info) {
  const lines = []
  lines.push('【编织参数卡】编织密度计算器')
  lines.push(`密度：${fmt(info.stGauge, 1)} 针 × ${fmt(info.rowGauge, 1)} 行 /10cm（10×10cm 样片洗后口径）`)
  lines.push(`成衣：胸围 ${fmt(info.chest, 1)} cm · 衣长 ${fmt(info.bodyLen, 1)} cm${info.sleeveLen > 0 ? ` · 袖长 ${fmt(info.sleeveLen, 1)} cm` : ''} · ${info.modeLabel}`)
  lines.push(`起针数：${info.stitches} 针（精确 ${fmt(info.stitchesExact, 1)}）`)
  lines.push(`衣长行数：${info.bodyRows} 行（精确 ${fmt(info.bodyRowsExact, 1)}）`)
  if (info.sleeveLen > 0) lines.push(`袖长行数：${info.sleeveRows} 行（精确 ${fmt(info.sleeveRowsExact, 1)}）`)
  lines.push('口径：成衣胸围 = 净胸围 + 松量 4–10cm；行数向上取整保证衣长够用。')
  lines.push('提示：换线先重织样片；密度变了用缩放卡换算，收袖山/开领分段按新行数重新分配。')
  return lines.join('\n')
}
// __PURE_FNS_END__

// ---------- 交互状态 ----------
const stitchGauge = ref(22)
const rowGauge = ref(30)
const chest = ref(100)
const bodyLen = ref(60)
const sleeveLen = ref('')
const stitchMode = ref('even')

// 缩放卡
const scOldSt = ref(100)
const scOldG = ref(20)
const scNewG = ref(22)
const scOldRow = ref(150)
const scOldRowG = ref(28)
const scNewRowG = ref(30)

// 宽松度速配
const easeBust = ref('')
const easeCm = ref(6)

const seoContentVisible = ref(true)

// ---------- 派生计算 ----------
const modeLabel = computed(() => (STITCH_MODES.find((m) => m.k === stitchMode.value) || STITCH_MODES[0]).label)
const valid = computed(() => pos(stitchGauge.value) > 0 && pos(rowGauge.value) > 0 && pos(chest.value) > 0 && pos(bodyLen.value) > 0)

const stitchesExact = computed(() => stitchesOf(stitchGauge.value, chest.value))
const stitches = computed(() => roundStitch(stitchesExact.value, stitchMode.value))
const bodyRowsExact = computed(() => rowsOf(rowGauge.value, bodyLen.value))
const bodyRows = computed(() => ceilRows(bodyRowsExact.value))
const sleeveInfo = computed(() => {
  const l = pos(sleeveLen.value)
  if (!l || !pos(rowGauge.value)) return null
  const exact = rowsOf(rowGauge.value, l)
  return { exact, rows: ceilRows(exact) }
})

const processText = computed(() => {
  return `起针 = ${fmt(num(stitchGauge.value), 1)} 针 × ${fmt(num(chest.value), 1)} cm ÷ 10 = ${fmt(stitchesExact.value, 1)} → ${modeLabel.value} ${stitches.value} 针；` +
    `衣长行数 = ${fmt(num(rowGauge.value), 1)} 行 × ${fmt(num(bodyLen.value), 1)} cm ÷ 10 = ${fmt(bodyRowsExact.value, 1)} → 取整 ${bodyRows.value} 行`
})

// 缩放卡结果（v-if 渲染，可空）
const scaleSt = computed(() => {
  const value = scaledCount(scOldSt.value, scOldG.value, scNewG.value)
  if (!value) return null
  return { value, factor: scaleFactor(scOldG.value, scNewG.value), suggest: Math.ceil(value) }
})
const scaleRow = computed(() => {
  const value = scaledCount(scOldRow.value, scOldRowG.value, scNewRowG.value)
  if (!value) return null
  return { value, factor: scaleFactor(scOldRowG.value, scNewRowG.value), suggest: Math.ceil(value) }
})

// 宽松度速配
const easeSuggest = computed(() => chestWithEase(easeBust.value, easeCm.value))
function applyEase() {
  if (easeSuggest.value > 0) chest.value = roundN(easeSuggest.value, 1)
}
function applyGaugeRef(r) {
  stitchGauge.value = r.st
  rowGauge.value = r.row
}

const gaugeCardText = computed(() => buildGaugeCard({
  stGauge: num(stitchGauge.value),
  rowGauge: num(rowGauge.value),
  chest: num(chest.value),
  bodyLen: num(bodyLen.value),
  sleeveLen: pos(sleeveLen.value),
  modeLabel: modeLabel.value,
  stitches: stitches.value,
  stitchesExact: stitchesExact.value,
  bodyRows: bodyRows.value,
  bodyRowsExact: bodyRowsExact.value,
  sleeveRows: sleeveInfo.value ? sleeveInfo.value.rows : 0,
  sleeveRowsExact: sleeveInfo.value ? sleeveInfo.value.exact : 0
}))

// ---------- 事件（浏览器 API 只在回调，SSR 安全） ----------
async function copyGaugeCard() {
  try {
    await navigator.clipboard.writeText(gaugeCardText.value)
    alert('参数卡已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选中参数文本复制')
  }
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id；watch 仅由用户交互触发，SSR 安全）
watch([stitchGauge, rowGauge, chest, bodyLen, sleeveLen, stitchMode, scOldSt, scOldG, scNewG, scOldRow, scOldRowG, scNewRowG, easeBust, easeCm], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      stGauge: stitchGauge.value,
      rowGauge: rowGauge.value,
      chest: chest.value,
      bodyLen: bodyLen.value,
      sleeveLen: sleeveLen.value,
      mode: stitchMode.value,
      scOldSt: scOldSt.value,
      scOldG: scOldG.value,
      scNewG: scNewG.value,
      scOldRow: scOldRow.value,
      scOldRowG: scOldRowG.value,
      scNewRowG: scNewRowG.value,
      easeBust: easeBust.value,
      easeCm: easeCm.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 挂载：注册最近使用 + 恢复上次输入 ----------
onMounted(() => {
  addRecentTool(TOOL_ID)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.stGauge === 'number') stitchGauge.value = s.stGauge
      if (typeof s.rowGauge === 'number') rowGauge.value = s.rowGauge
      if (typeof s.chest === 'number') chest.value = s.chest
      if (typeof s.bodyLen === 'number') bodyLen.value = s.bodyLen
      if (typeof s.sleeveLen === 'number' || typeof s.sleeveLen === 'string') sleeveLen.value = s.sleeveLen
      if (typeof s.mode === 'string') stitchMode.value = s.mode
      if (typeof s.scOldSt === 'number') scOldSt.value = s.scOldSt
      if (typeof s.scOldG === 'number') scOldG.value = s.scOldG
      if (typeof s.scNewG === 'number') scNewG.value = s.scNewG
      if (typeof s.scOldRow === 'number') scOldRow.value = s.scOldRow
      if (typeof s.scOldRowG === 'number') scOldRowG.value = s.scOldRowG
      if (typeof s.scNewRowG === 'number') scNewRowG.value = s.scNewRowG
      if (typeof s.easeBust === 'number' || typeof s.easeBust === 'string') easeBust.value = s.easeBust
      if (typeof s.easeCm === 'number') easeCm.value = s.easeCm
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})
</script>
