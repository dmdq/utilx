<template>
  <div class="max-w-8xl mx-auto">
    <!-- 动态 @page 规则：横版纸张时打印页面随排版切换 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Tag class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">标价签生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">商品清单配 EAN-13/Code128 条码，按 A4 自动排版分页，配合不干胶贴纸打印即贴</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线标价签生成器：录入商品品名、规格、价格与条码号，按标签尺寸（40×30 / 50×38 / 60×40 mm 或自定义 20-100mm）在 A4 纸上自动排满、自动分页，
        实时预览每一枚标签的版式并渲染可被扫码枪识别的条码（EAN-13/EAN-8 按校验位验证），价格自动千分位格式化。
        浏览器直接打印或另存 PDF，商品清单保存在本机浏览器中，不上传任何数据——小商户、便利店、市集摊位批量做价签必备。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左面板：商品清单 + 版式参数 -->
      <div class="no-print space-y-6">
        <!-- 商品清单 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Tag class="w-5 h-5 mr-2 text-primary" /> 商品清单
            </h2>
            <span class="text-xs text-muted-foreground">共 {{ products.length }} 件商品</span>
          </div>

          <!-- 逐条添加 -->
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="draft.name"
              @keyup.enter="addProduct"
              type="text"
              class="col-span-2 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="品名（必填，如 农夫山泉 饮用天然水）"
            />
            <input
              v-model="draft.spec"
              @keyup.enter="addProduct"
              type="text"
              class="px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="规格（选填，如 550ml×24）"
            />
            <input
              v-model="draft.price"
              @keyup.enter="addProduct"
              type="number"
              min="0"
              step="0.01"
              class="px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="价格（元）"
            />
            <input
              v-model="draft.barcode"
              @keyup.enter="addProduct"
              type="text"
              class="col-span-2 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="条码号（选填：EAN-13/EAN-8 或 Code128 内容）"
            />
            <button
              @click="addProduct"
              :disabled="!draft.name.trim()"
              class="col-span-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
            >
              <Plus class="w-4 h-4" /> 添加商品
            </button>
          </div>

          <!-- 商品列表（可编辑可删除） -->
          <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            <div v-for="(p, idx) in products" :key="p.id" class="border border-border rounded-lg p-2.5 bg-muted/30 space-y-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] text-muted-foreground font-mono w-4 shrink-0">{{ idx + 1 }}</span>
                <input
                  v-model="p.name"
                  @input="schedulePersist"
                  type="text"
                  class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="品名"
                />
                <button
                  @click="removeProduct(p.id)"
                  class="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition shrink-0"
                  title="删除该商品"
                  aria-label="删除该商品"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
              <div class="grid grid-cols-3 gap-1.5 pl-5">
                <input
                  v-model="p.spec"
                  @input="schedulePersist"
                  type="text"
                  class="min-w-0 px-2 py-1.5 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="规格"
                />
                <input
                  v-model.number="p.price"
                  @input="schedulePersist"
                  type="number"
                  min="0"
                  step="0.01"
                  class="min-w-0 px-2 py-1.5 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="价格"
                />
                <input
                  v-model="p.barcode"
                  @input="onBarcodeInput"
                  type="text"
                  class="min-w-0 px-2 py-1.5 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="条码号"
                />
              </div>
              <p v-if="isBarcodeInvalid(p.barcode)" class="pl-5 text-[11px] text-amber-600 flex items-center gap-1">
                <TriangleAlert class="w-3 h-3 shrink-0" /> 条码号校验未通过，该标签将只显示价格
              </p>
            </div>
            <p v-if="!products.length" class="text-xs text-muted-foreground text-center py-4">
              清单是空的：在上方添加商品，或点击下方「恢复示例数据」
            </p>
          </div>

          <div class="flex gap-2 pt-1">
            <button
              @click="clearAll"
              class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center justify-center gap-1"
            >
              <X class="w-3.5 h-3.5" /> 全部清空
            </button>
            <button
              @click="restoreSamples"
              class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center justify-center gap-1"
            >
              <RefreshCw class="w-3.5 h-3.5" /> 恢复示例数据
            </button>
          </div>
        </div>

        <!-- 版式参数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 版式参数
          </h2>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">标签尺寸</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="preset in tagPresets"
                :key="preset.id"
                @click="selectPreset(preset.id)"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="tagPreset === preset.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
              >
                {{ preset.label }}
              </button>
            </div>
            <div v-show="tagPreset === 'custom'" class="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label class="block text-[11px] text-muted-foreground mb-1">宽 20-100 mm</label>
                <input
                  v-model.number="customW"
                  @input="schedulePersist"
                  type="number"
                  min="20"
                  max="100"
                  class="w-full px-2 py-1.5 bg-background border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="block text-[11px] text-muted-foreground mb-1">高 20-100 mm</label>
                <input
                  v-model.number="customH"
                  @input="schedulePersist"
                  type="number"
                  min="20"
                  max="100"
                  class="w-full px-2 py-1.5 bg-background border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">纸张方向</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="selectPaper('portrait')"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="paperOrientation === 'portrait' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
              >
                A4 竖版 210×297
              </button>
              <button
                @click="selectPaper('landscape')"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="paperOrientation === 'landscape' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
              >
                A4 横版 297×210
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="flex justify-between items-center text-sm font-medium text-foreground mb-1">
                <span>页边距</span>
                <span class="text-primary font-mono text-xs">{{ margin }} mm</span>
              </label>
              <input v-model.number="margin" @input="schedulePersist" type="range" min="5" max="15" step="1" class="w-full accent-primary" />
            </div>
            <div>
              <label class="flex justify-between items-center text-sm font-medium text-foreground mb-1">
                <span>标签间隙</span>
                <span class="text-primary font-mono text-xs">{{ gap }} mm</span>
              </label>
              <input v-model.number="gap" @input="schedulePersist" type="range" min="0" max="6" step="1" class="w-full accent-primary" />
            </div>
          </div>

          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="showBarcode" @change="onToggleBarcode" type="checkbox" class="accent-primary w-4 h-4" /> 显示条码
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="showSpec" @change="saveState" type="checkbox" class="accent-primary w-4 h-4" /> 显示规格
            </label>
          </div>

          <p
            v-if="perPage > 0"
            class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          >
            <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>每页排 {{ perPage }} 枚（{{ pageLayout.cols }} 列 × {{ pageLayout.rows }} 行），当前 {{ products.length }} 件商品共 {{ pages.length }} 页。</span>
          </p>
          <p
            v-else
            class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-foreground flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>当前标签尺寸在该纸张上放不下：请调小标签尺寸 / 页边距，或改用横版纸张。</span>
          </p>
        </div>
      </div>

      <!-- 右面板：预览（占两列） -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 标价签预览
          </h2>
          <button
            @click="printTags"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
        </div>

        <div class="no-print flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Info class="w-3.5 h-3.5 shrink-0" />
            {{ perPage > 0 ? `每页 ${perPage} 枚 · 共 ${pages.length} 页 · 标签 ${tagW}×${tagH} mm · ${paperOrientation === 'landscape' ? 'A4 横版' : 'A4 竖版'}` : '标签放不下当前纸张，请调整版式参数' }}
          </span>
          <span v-if="invalidCount > 0" class="flex items-center gap-1 text-amber-600">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ invalidCount }} 枚标签条码无效，已在预览中标黄
          </span>
          <span v-else-if="barcodeUsedCount > 0" class="flex items-center gap-1 text-green-600">
            <CheckCircle class="w-3.5 h-3.5 shrink-0" /> 条码校验全部通过，可放心打印
          </span>
        </div>

        <div ref="previewWrapRef" class="w-full">
          <!-- 多张 A4 页堆叠展示：屏幕上整体缩放适配宽度，打印时还原真实 mm 尺寸 -->
          <div v-if="pages.length" class="preview-holder mx-auto" :style="holderStyle">
            <div class="pages-stack" :style="stackStyle">
              <div
                v-for="(page, pi) in pages"
                :key="pi"
                class="a4-page"
                :style="{ width: pageW + 'mm', height: pageH + 'mm', marginBottom: pi === pages.length - 1 ? '0' : pageGapPx + 'px' }"
              >
                <div class="tag-grid" :style="gridStyle">
                  <div
                    v-for="tag in page"
                    :key="tag.id"
                    class="price-tag"
                    :class="{ 'tag-invalid': showBarcode && tag.barcodeInvalid }"
                  >
                    <p class="tag-name" :style="{ fontSize: tagTitleFontMm(tagW) + 'mm' }">{{ tag.name || '未命名商品' }}</p>
                    <p v-if="showSpec && tag.spec" class="tag-spec" :style="{ fontSize: tagSpecFontMm(tagW) + 'mm' }">{{ tag.spec }}</p>
                    <p class="tag-price" :style="{ fontSize: tagPriceFontMm(tagW) + 'mm' }">
                      <span class="tag-yen">¥</span><span>{{ formatPrice(tag.price) }}</span>
                    </p>
                    <img v-if="showBarcode && tag.dataUrl" :src="tag.dataUrl" class="tag-barcode" alt="商品条码" />
                    <p v-else-if="showBarcode && tag.barcodeInvalid" class="tag-warn">
                      <TriangleAlert class="w-2.5 h-2.5" /> 条码无效
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="border border-dashed border-border rounded-xl p-10 text-center">
            <Info class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">暂无商品：在左侧添加商品，或点击「恢复示例数据」查看预览效果</p>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印时请在浏览器对话框中选择「另存为 PDF」或目标打印机，缩放保持「100% / 实际大小」、页边距选「无」，即可得到与预览一致的物理尺寸。
          条码标黄的标签请修正号码后再打印；实际张贴前建议先用一张普通纸试印并试扫一次。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>标价签怎么做：尺寸、纸张与条码要点</h2>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">标价签尺寸怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          40×30mm 是便利店、超市货架最常用的尺寸，适合饮料、零食等小型单品；50×38mm 空间更宽裕，能同时放下品名、规格、条码，适合日百、粮油等常规商品；
          60×40mm 适合大件商品或希望价格数字特别醒目的场景。本工具也支持 20-100mm 自定义，覆盖首饰、文具、水果散称等特殊需求。
          选尺寸前先确认你买的不干胶标签纸的分切规格，标签尺寸与纸面分格一致才能对位打印。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打印标签纸买哪种？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          推荐购买 A4 不干胶贴纸（背胶标签纸）：整张 A4 的适合打印后手工裁剪；预分切款按行列分格（如 40×30mm 常见为 4 列 × 8 行起），
          购买时认准与你在本页选择的尺寸一致的规格。打印机方面，激光打印机打印不干胶效果最好、墨粉耐潮；喷墨机请选防水不干胶，否则遇水字迹会洇。
          打印时缩放务必选 100%（实际大小），浏览器缩放会让标签与分格错位。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">价格签需要哪些信息？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一枚规范的价格签通常包含：品名（可带品牌与口味）、规格单位（如 550ml、500g、五连包）、售价（字体最大最醒目，保留两位小数更规范）、
          以及条码（有商品条码的印上，方便扫码收银与盘点对账）。散称商品可把单位写在规格里（如「每 500g」）避免歧义。
          本工具的标签版式即按「品名 + 规格 + 价格 + 条码」自上而下排布，不需要的字段可关闭显示或留空。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么让条码能被扫码枪识别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          常见商品条码是 EAN-13（13 位数字）或 EAN-8（8 位数字），最后一位是校验位——号码错一位就会校验失败，扫码枪读不出或读出别家商品。
          本工具会按校验位逐个验证：标黄的标签说明号码有问题，修正后即可渲染。条码要打得足够黑、四周留白足够，打印时不要用省墨模式；
          内部自编码可用 Code128（支持字母数字组合）。批量张贴前先试扫一张，确认每一枚都能「嘀」一声读出价格。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">商品数据保存在哪？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          全部商品清单与版式参数只保存在你当前浏览器的 localStorage 中，不经过任何服务器，也不上传任何数据。
          更换设备、更换浏览器或清除浏览器数据后不会保留；手机隐私模式退出即失效。需要备份时可在打印前截图，或重新录入后统一打印。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">每页能排多少枚标价签？</h3>
            <p class="text-sm text-muted-foreground mt-1">由标签尺寸、纸张、页边距与间隙自动计算。例如 A4 竖版、40×30mm、页边距 8mm、间隙 2mm 时为 4 列 × 8 行共 32 枚/页，把间隙调到 0 可排到 4 × 9 = 36 枚；60×40mm 约为 3 × 6 = 18 枚。预览区会实时显示每页数量与总页数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印用什么纸？怎么保证尺寸准？</h3>
            <p class="text-sm text-muted-foreground mt-1">建议购买 A4 不干胶贴纸（背胶标签纸），分切规格与本页标签尺寸一致。打印或另存 PDF 时缩放选「100% / 实际大小」、页边距选「无」，本页已按真实毫米排版，输出即为物理尺寸。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">条码为什么提示「条码无效」？</h3>
            <p class="text-sm text-muted-foreground mt-1">13 位或 8 位纯数字会按 EAN-13/EAN-8 校验位验证，校验和不对即判无效；含中文或特殊字符的内容也无法编码。修正号码（或改用无校验要求的 Code128 内容）后即可正常渲染，无效标签只显示价格并标黄提醒。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">商品数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。商品清单与参数只保存在本机浏览器 localStorage，刷新、关闭页面都在，清除浏览器数据或更换设备后不保留，请自行做好备份。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'price-tag-generator'" :category="'file'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Tag, Plus, X, Printer, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, CheckCircle, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '标价签生成器 - 商品价格签+条码在线排版打印',
  description: '免费在线标价签生成器：录入商品品名、规格、价格与条码，按 40×30/50×38/60×40mm 或自定义尺寸在 A4 上自动排版分页，EAN-13/EAN-8/Code128 条码校验渲染，价格千分位格式化，浏览器直接打印或另存 PDF，纯本地处理不上传',
  keywords: '标价签生成器,价格签模板,价签打印,A4不干胶标签,条码标签打印,商品标价签,标签排版,价格签制作',
  author: '有条工具',
  ogTitle: '标价签生成器 - 商品价格签+条码在线排版打印 | 有条工具',
  ogDescription: '商品清单自动排版成 A4 标价签，条码校验渲染，打印即贴。',
  ogUrl: 'https://www.util.cn/tools/price-tag-generator',
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
          name: '标价签生成器',
          url: 'https://www.util.cn/tools/price-tag-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['商品清单管理与本地保存', '40×30/50×38/60×40 及自定义标签尺寸', 'A4 横竖版自动排版分页', 'EAN-13/EAN-8 校验位验证', 'Code128 条码渲染', '价格千分位格式化', '浏览器直接打印或另存 PDF']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '标价签生成器', item: 'https://www.util.cn/tools/price-tag-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '每页能排多少枚标价签？',
              acceptedAnswer: { '@type': 'Answer', text: '由标签尺寸、纸张、页边距与间隙自动计算。例如 A4 竖版、40×30mm、页边距 8mm、间隙 2mm 时为 4 列 × 8 行共 32 枚/页，间隙调到 0 可排到 4×9=36 枚；60×40mm 约为 3×6=18 枚。预览区实时显示每页数量与总页数。' }
            },
            {
              '@type': 'Question',
              name: '打印用什么纸？怎么保证尺寸准？',
              acceptedAnswer: { '@type': 'Answer', text: '建议购买 A4 不干胶贴纸（背胶标签纸），分切规格与本页标签尺寸一致。打印或另存 PDF 时缩放选 100%（实际大小）、页边距选无，本页按真实毫米排版，输出即为物理尺寸。' }
            },
            {
              '@type': 'Question',
              name: '条码为什么提示条码无效？',
              acceptedAnswer: { '@type': 'Answer', text: '13 位或 8 位纯数字会按 EAN-13/EAN-8 校验位验证，校验和不对即判无效；含中文或特殊字符的内容也无法编码。修正号码后即可正常渲染，无效标签只显示价格并标黄提醒。' }
            },
            {
              '@type': 'Question',
              name: '商品数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。商品清单与参数只保存在本机浏览器 localStorage，刷新、关闭页面都在，清除浏览器数据或更换设备后不保留，请自行做好备份。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MM_PX = 96 / 25.4 // 浏览器 CSS 中 1mm 对应的像素（96dpi）

// 将数值夹取到 [min, max]，非法输入返回 min
function clampMm(v, min, max) {
  const n = Number(v)
  if (!isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

// 价格格式化：千分位 + 固定两位小数（非法输入按 0 处理，保留负号）
function formatPrice(n) {
  const num = Number(n)
  if (!isFinite(num)) return '0.00'
  const fixed = Math.abs(num).toFixed(2)
  const parts = fixed.split('.')
  const withSep = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (num < 0 ? '-' : '') + withSep + '.' + parts[1]
}

// 条码号清洗：去空格（含全角）、连字符、下划线、间隔点、逗号句号等分隔符
function sanitizeBarcode(raw) {
  return String(raw == null ? '' : raw)
    .replace(/[\s\-–—_·.,，。]/g, '')
    .trim()
}

// EAN-13 / EAN-8 校验位验证（13 位权重从 1 起 1,3 交替；8 位从 3 起 3,1 交替）
function eanChecksumValid(code) {
  if (!/^(\d{13}|\d{8})$/.test(code)) return false
  const nums = code.split('').map(Number)
  const check = nums.pop()
  const first = code.length === 13 ? 1 : 3
  let sum = 0
  nums.forEach((n, i) => { sum += n * (i % 2 === 0 ? first : first === 1 ? 3 : 1) })
  return (10 - (sum % 10)) % 10 === check
}

// 识别条码类型：合法 EAN-13/EAN-8 → 对应格式；其余非空 ASCII → Code128；空或校验失败 → null
function detectBarcodeFormat(rawCode) {
  const code = sanitizeBarcode(rawCode)
  if (!code) return null
  if (/^\d{13}$/.test(code)) return eanChecksumValid(code) ? 'EAN13' : null
  if (/^\d{8}$/.test(code)) return eanChecksumValid(code) ? 'EAN8' : null
  if (/^[\x20-\x7e]+$/.test(code)) return 'CODE128' // Code128 仅支持 ASCII 可见字符与空格
  return null
}

// 条码号是否无效：填了内容但无法生成条码
function isBarcodeInvalid(raw) {
  const code = sanitizeBarcode(raw)
  return code !== '' && detectBarcodeFormat(code) === null
}

// 排版计算：可用区 = 纸张 - 2×页边距；cols = floor((可用宽+间隙)/(标签宽+间隙))；放不下时各值为 0
function gridLayout(pageW, pageH, tagW, tagH, gap, margin) {
  const availW = pageW - 2 * margin
  const availH = pageH - 2 * margin
  if (!(tagW > 0) || !(tagH > 0) || availW <= 0 || availH <= 0) return { cols: 0, rows: 0, perPage: 0 }
  const g = Math.max(0, Number(gap) || 0)
  const cols = Math.floor((availW + g) / (tagW + g))
  const rows = Math.floor((availH + g) / (tagH + g))
  if (cols < 1 || rows < 1) return { cols: 0, rows: 0, perPage: 0 }
  return { cols, rows, perPage: cols * rows }
}

// 把标签序列切成每页 size 枚（size 非法按 1 枚处理，保证仍可预览）
function chunkList(list, size) {
  const n = Math.max(1, Math.floor(Number(size) > 0 ? Number(size) : 1))
  const pages = []
  for (let i = 0; i < list.length; i += n) pages.push(list.slice(i, i + n))
  return pages
}

// 生成不与现有 id 冲突的商品 id（p 前缀最大数字 +1）
function nextProductId(list) {
  let max = 0
  for (const item of list || []) {
    const m = /^p(\d+)$/.exec(String((item && item.id) || ''))
    if (m) max = Math.max(max, Number(m[1]))
  }
  return 'p' + (max + 1)
}

// 标签字号自适应：按标签宽度换算字号（mm），带上下限（相当于 mm 版 clamp）
function tagTitleFontMm(tagW) { return Math.min(Math.max(tagW / 11, 2.2), 4.6) }
function tagSpecFontMm(tagW) { return Math.min(Math.max(tagW / 18, 1.6), 2.8) }
function tagPriceFontMm(tagW) { return Math.min(Math.max(tagW / 5.5, 4), 9) }

// ---------- 常量 ----------
const TAG_PRESETS = [
  { id: '40x30', label: '40×30 mm（常用）', w: 40, h: 30 },
  { id: '50x38', label: '50×38 mm', w: 50, h: 38 },
  { id: '60x40', label: '60×40 mm', w: 60, h: 40 },
  { id: 'custom', label: '自定义尺寸', custom: true }
]
const PAPER_SIZES = { portrait: { w: 210, h: 297 }, landscape: { w: 297, h: 210 } }
const PAGE_GAP_PX = 16 // 屏幕上多页之间的间距（打印时归零）
const PRODUCTS_KEY = 'price-tag-generator:products'
const LAYOUT_KEY = 'price-tag-generator:layout'

// ---------- 状态 ----------
function makeSampleProducts() {
  // 示例条码为按 EAN-13 校验位规则构造的合法号码（6901234567892 / 6901234560014）
  return [
    { id: 'p1', name: '农夫山泉 饮用天然水', spec: '550ml', price: 2, barcode: '6901234567892' },
    { id: 'p2', name: '康师傅 红烧牛肉面', spec: '五连包', price: 17.5, barcode: '6901234560014' },
    { id: 'p3', name: '散称水果糖', spec: '每 500g', price: 12.8, barcode: '' }
  ]
}

const products = ref(makeSampleProducts())
const draft = ref({ name: '', spec: '', price: '', barcode: '' })
const tagPreset = ref('40x30')
const customW = ref(40)
const customH = ref(30)
const paperOrientation = ref('portrait')
const margin = ref(8)
const gap = ref(2)
const showBarcode = ref(true)
const showSpec = ref(true)
const barcodeMap = ref({})          // 清洗后的码号 → 条码 dataURL
const barcodeFailed = ref(new Set()) // 渲染失败的码号集合
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 版式计算 ----------
const tagPresets = TAG_PRESETS
const pageGapPx = PAGE_GAP_PX

const activePreset = computed(() => TAG_PRESETS.find((p) => p.id === tagPreset.value) || TAG_PRESETS[0])
const tagW = computed(() => (activePreset.value.custom ? clampMm(customW.value, 20, 100) : activePreset.value.w))
const tagH = computed(() => (activePreset.value.custom ? clampMm(customH.value, 20, 100) : activePreset.value.h))
const pageW = computed(() => PAPER_SIZES[paperOrientation.value].w)
const pageH = computed(() => PAPER_SIZES[paperOrientation.value].h)

const pageLayout = computed(() => gridLayout(pageW.value, pageH.value, tagW.value, tagH.value, gap.value, margin.value))
const perPage = computed(() => pageLayout.value.perPage)

const tags = computed(() =>
  products.value.map((p) => {
    const code = sanitizeBarcode(p.barcode)
    const fmt = detectBarcodeFormat(code)
    const priceNum = Number(p.price)
    return {
      id: p.id,
      name: String(p.name || '').trim(),
      spec: String(p.spec || '').trim(),
      price: isFinite(priceNum) ? priceNum : 0,
      code,
      dataUrl: fmt ? (barcodeMap.value[code] || null) : null,
      barcodeInvalid: Boolean(code) && (!fmt || barcodeFailed.value.has(code))
    }
  })
)

const pages = computed(() => chunkList(tags.value, perPage.value))
const invalidCount = computed(() => tags.value.filter((t) => t.barcodeInvalid).length)
const barcodeUsedCount = computed(() => tags.value.filter((t) => t.code).length)

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${pageLayout.value.cols || 1}, ${tagW.value}mm)`,
  gridAutoRows: tagH.value + 'mm',
  gap: gap.value + 'mm',
  justifyContent: 'center',
  alignContent: 'start',
  padding: margin.value + 'mm'
}))

// 动态 @page：横版纸张时打印页框随之切换（其余打印规则见底部 scoped 样式）
const printPageCss = computed(
  () => `@media print { @page { size: A4 ${paperOrientation.value === 'landscape' ? 'landscape' : 'portrait'}; margin: 0; } }`
)

// ---------- 屏幕缩放（预览适配面板宽度） ----------
const previewWrapRef = ref(null)
const previewScale = ref(1)
let resizeObserver = null

const pageWpx = computed(() => pageW.value * MM_PX)
const pageHpx = computed(() => pageH.value * MM_PX)

const holderStyle = computed(() => ({
  width: pageWpx.value * previewScale.value + 'px',
  height:
    (pages.value.length * pageHpx.value + Math.max(0, pages.value.length - 1) * PAGE_GAP_PX) *
      previewScale.value + 'px'
}))

const stackStyle = computed(() => ({
  width: pageWpx.value + 'px',
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'top left'
}))

function updateScale() {
  const wrap = previewWrapRef.value
  if (!wrap) return
  const avail = wrap.clientWidth
  const need = pageWpx.value
  if (need > 0 && avail > 0) {
    previewScale.value = Math.min(1, (avail - 2) / need)
  }
}

// ---------- localStorage 持久化（读写都带 try/catch，读只在 onMounted） ----------
function normalizeProduct(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const price = Number(r.price)
  return {
    id: typeof r.id === 'string' && r.id ? r.id : nextProductId(products.value),
    name: String(r.name || '').slice(0, 60),
    spec: String(r.spec || '').slice(0, 40),
    price: isFinite(price) ? price : 0,
    barcode: sanitizeBarcode(r.barcode).slice(0, 32)
  }
}

function saveState() {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products.value))
    localStorage.setItem(
      LAYOUT_KEY,
      JSON.stringify({
        preset: tagPreset.value,
        cw: customW.value,
        ch: customH.value,
        paper: paperOrientation.value,
        margin: margin.value,
        gap: gap.value,
        showBarcode: showBarcode.value,
        showSpec: showSpec.value
      })
    )
  } catch (e) {
    // 隐私模式 / 配额不足时忽略存储失败
  }
}

function loadState() {
  try {
    const rawProducts = localStorage.getItem(PRODUCTS_KEY)
    if (rawProducts) {
      const arr = JSON.parse(rawProducts)
      if (Array.isArray(arr) && arr.length) {
        products.value = arr.map(normalizeProduct)
      }
    }
    const rawLayout = localStorage.getItem(LAYOUT_KEY)
    if (rawLayout) {
      const l = JSON.parse(rawLayout)
      if (l && typeof l === 'object') {
        if (TAG_PRESETS.some((p) => p.id === l.preset)) tagPreset.value = l.preset
        customW.value = clampMm(l.cw, 20, 100)
        customH.value = clampMm(l.ch, 20, 100)
        if (l.paper === 'landscape' || l.paper === 'portrait') paperOrientation.value = l.paper
        margin.value = clampMm(l.margin, 5, 15)
        gap.value = clampMm(l.gap, 0, 6)
        showBarcode.value = l.showBarcode !== false
        showSpec.value = l.showSpec !== false
      }
    }
  } catch (e) {
    // 解析失败则沿用默认示例数据
  }
}

let persistTimer = null
function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(saveState, 400)
}

// ---------- 条码渲染（jsbarcode 动态 import，仅回调内触发，SSR 安全） ----------
let barcodeTimer = null
let barcodeToken = 0

async function refreshBarcodes() {
  const token = ++barcodeToken
  if (!showBarcode.value) {
    barcodeMap.value = {}
    barcodeFailed.value = new Set()
    return
  }
  const JsBarcode = (await import('jsbarcode')).default
  const codes = [
    ...new Set(
      products.value
        .map((p) => sanitizeBarcode(p.barcode))
        .filter((c) => c && detectBarcodeFormat(c))
    )
  ]
  const map = {}
  const failed = []
  for (const code of codes) {
    if (token !== barcodeToken) return // 已有更新的渲染任务，放弃本轮
    const fmt = detectBarcodeFormat(code)
    const canvas = document.createElement('canvas')
    try {
      JsBarcode(canvas, code, {
        format: fmt,
        width: 2,
        height: 56,
        displayValue: true,
        fontSize: 14,
        font: 'monospace',
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000'
      })
      map[code] = canvas.toDataURL('image/png')
    } catch (e) {
      failed.push(code)
    }
  }
  if (token !== barcodeToken) return
  barcodeMap.value = map
  barcodeFailed.value = new Set(failed)
}

function onBarcodeInput() {
  schedulePersist()
  if (barcodeTimer) clearTimeout(barcodeTimer)
  barcodeTimer = setTimeout(refreshBarcodes, 350)
}

// ---------- 商品操作 ----------
function addProduct() {
  const name = draft.value.name.trim()
  if (!name) return
  const price = Number(draft.value.price)
  products.value = [
    ...products.value,
    {
      id: nextProductId(products.value),
      name: name.slice(0, 60),
      spec: draft.value.spec.trim().slice(0, 40),
      price: isFinite(price) ? price : 0,
      barcode: sanitizeBarcode(draft.value.barcode).slice(0, 32)
    }
  ]
  draft.value = { name: '', spec: '', price: '', barcode: '' }
  saveState()
  refreshBarcodes()
}

function removeProduct(id) {
  products.value = products.value.filter((p) => p.id !== id)
  saveState()
  refreshBarcodes()
}

function clearAll() {
  if (!window.confirm('确定要清空全部商品吗？此操作不可恢复。')) return
  products.value = []
  saveState()
  refreshBarcodes()
}

function restoreSamples() {
  products.value = makeSampleProducts()
  saveState()
  refreshBarcodes()
}

// ---------- 版式操作 ----------
function selectPreset(id) {
  tagPreset.value = id
  saveState()
}

function selectPaper(orientation) {
  paperOrientation.value = orientation
  saveState()
  updateScale() // 页宽变化后重新适配缩放
}

function onToggleBarcode() {
  saveState()
  refreshBarcodes()
}

async function printTags() {
  await refreshBarcodes() // 确保条码为最新
  window.print()
}

// ---------- 生命周期（DOM/存储只在此后访问，SSR 安全） ----------
onMounted(() => {
  loadState()
  updateScale()
  refreshBarcodes()
  if (previewWrapRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewWrapRef.value)
  }
  addRecentTool('price-tag-generator')
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (barcodeTimer) {
    clearTimeout(barcodeTimer)
    barcodeTimer = null
  }
})
</script>

<style scoped>
/* 屏幕上的 A4 页面 */
.a4-page {
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}
.pages-stack {
  transform-origin: top left;
}

/* 单枚标价签：精确 mm 尺寸由 grid 控制行高列宽 */
.price-tag {
  border: 1px dashed #b9b9b9;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1mm 1.2mm;
  line-height: 1.15;
  page-break-inside: avoid;
  break-inside: avoid;
}
.tag-name {
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
  width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}
.tag-spec {
  color: #6b7280;
  line-height: 1.2;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tag-price {
  color: #dc2626;
  font-weight: 800;
  line-height: 1;
  margin-top: 0.8mm;
  white-space: nowrap;
}
.tag-yen {
  font-size: 0.55em;
  font-weight: 700;
  vertical-align: 0.08em;
  margin-right: 0.3mm;
}
.tag-barcode {
  max-width: 94%;
  max-height: 8mm;
  object-fit: contain;
  margin-top: 0.8mm;
}
.tag-warn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: #fef3c7;
  color: #b45309;
  border-radius: 3px;
  padding: 0 3px;
  font-size: 8px;
  margin-top: 0.8mm;
  white-space: nowrap;
}
.tag-invalid {
  border-color: #f59e0b;
  box-shadow: inset 0 0 0 1px #fde68a;
  background: #fffbeb;
}

@media print {
  .no-print {
    display: none !important;
  }
  /* 打印时放开布局壳层的裁剪，保证多页 A4 完整输出 */
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .preview-holder {
    width: auto !important;
    height: auto !important;
  }
  .pages-stack {
    transform: none !important;
    width: auto !important;
  }
  .a4-page {
    box-shadow: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    break-after: page;
    page-break-inside: avoid;
  }
  .a4-page:last-child {
    break-after: auto;
  }
  .tag-grid {
    page-break-inside: avoid;
  }
}
</style>
