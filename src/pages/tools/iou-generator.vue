<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileSignature class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">借条生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">填写双方信息与金额自动生成规范借条，金额自动转人民币大写，利率红线即时提醒</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        亲友借款、个人拆借都建议立一张要素齐全的借条。填写出借人、借款人、借款金额、借款日期与还款日期，
        自动生成人民币大写金额（防篡改），并对年利率是否接近 LPR 四倍红线给出黄 / 红提示；可选填身份证号、出借地点、担保人与其他约定。
        右侧即时生成规范借条版式，可一键复制全文或直接打印、另存 PDF 让借款人签名按手印。
        全部内容仅在当前浏览器本地处理，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：表单 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <FileSignature class="w-5 h-5 mr-2 text-primary" /> 填写借款信息
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">出借人姓名</label>
            <input
              v-model="lenderName"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 李四"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">借款人姓名</label>
            <input
              v-model="borrowerName"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 张三（借款人本人）"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted-foreground mb-2">出借人身份证号（选填）</label>
            <input
              v-model="lenderId"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="写明身份更规范"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted-foreground mb-2">借款人身份证号（选填）</label>
            <input
              v-model="borrowerId"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="建议填写，便于确定主体"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">借款金额（元）</label>
            <input
              v-model.number="amount"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 50000"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted-foreground mb-2">出借地点（选填）</label>
            <input
              v-model="place"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 北京市朝阳区"
            />
          </div>
        </div>

        <!-- 金额大写 -->
        <div class="bg-muted/50 rounded-lg p-3 text-sm flex items-center justify-between gap-3">
          <span class="text-muted-foreground shrink-0">人民币大写</span>
          <span v-if="upperText" class="font-bold text-primary tracking-wider text-right">{{ upperText }}</span>
          <span v-else-if="amountError" class="text-red-600 font-medium text-right">{{ amountError }}</span>
          <span v-else class="text-muted-foreground text-right">填写金额后自动生成</span>
        </div>

        <!-- 日期 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              <Calendar class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-muted-foreground" />借款日期
            </label>
            <input
              v-model="loanDate"
              type="date"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              <Calendar class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-muted-foreground" />约定还款日期
            </label>
            <input
              v-model="repayDate"
              type="date"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <p
          v-if="dateError"
          class="text-xs text-red-600 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
        >
          <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ dateError }}
        </p>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">借款用途</label>
          <input
            v-model="purpose"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 资金周转"
          />
        </div>

        <!-- 利息与逾期 -->
        <p class="text-sm font-medium text-foreground flex items-center pt-1">
          <Scale class="w-4 h-4 mr-1.5 text-primary" /> 利息与逾期约定
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年利率（%，留空为无息）</label>
            <input
              v-model.number="rate"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 10（留空 = 无息借款）"
            />
            <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
              <Info class="w-3 h-3 shrink-0 mt-0.5" />
              <span>超过合同成立时一年期 LPR 四倍的部分不受法律保护，以最新 LPR 为准</span>
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">逾期利率</label>
            <select
              v-model="overdueType"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">不约定逾期利率</option>
              <option value="annual">按年利率计逾期利息</option>
              <option value="daily5">按日万分之五</option>
            </select>
            <input
              v-if="overdueType === 'annual'"
              v-model.number="overdueRate"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="逾期年利率 %，如 14"
            />
          </div>
        </div>

        <!-- 利率红线提示条 -->
        <p
          v-if="rateWarning === 'ok'"
          class="text-xs leading-relaxed px-3 py-2.5 rounded-lg border flex items-start gap-1.5 bg-green-500/10 text-green-700 border-green-500/20"
        >
          <CheckCircle class="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>当前年利率处于近年 LPR 四倍红线之内，约定受法律保护。</span>
        </p>
        <p
          v-else-if="rateWarning === 'warn'"
          class="text-xs leading-relaxed px-3 py-2.5 rounded-lg border flex items-start gap-1.5 bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
        >
          <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>已接近近年 LPR 四倍红线，注意以最新 LPR 为准。</span>
        </p>
        <p
          v-else-if="rateWarning === 'danger'"
          class="text-xs leading-relaxed px-3 py-2.5 rounded-lg border flex items-start gap-1.5 bg-red-500/10 text-red-600 border-red-500/20"
        >
          <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>超出近年 LPR 四倍的部分可能不受法律保护。</span>
        </p>

        <!-- 担保人（选填，折叠） -->
        <div class="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            @click="showGuarantor = !showGuarantor"
            class="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-foreground bg-muted/40 hover:bg-muted/70 transition"
          >
            <span class="flex items-center">
              <CheckCircle v-if="hasGuarantor" class="w-4 h-4 mr-1.5 text-green-500" />
              担保人信息（选填）
            </span>
            <ChevronUp v-if="showGuarantor" class="w-4 h-4 text-muted-foreground" />
            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
          </button>
          <div v-show="showGuarantor" class="p-4 grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-2">担保人姓名</label>
              <input
                v-model="guarantorName"
                type="text"
                class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 王五"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-2">担保人身份证号</label>
              <input
                v-model="guarantorId"
                type="text"
                class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="选填"
              />
            </div>
            <p class="col-span-2 text-xs text-muted-foreground leading-relaxed">
              涉及担保的借贷法律关系更复杂，建议由担保人当面签名并咨询执业律师后再出具。
            </p>
          </div>
        </div>

        <!-- 其他约定 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">其他约定（选填，每行一条）</label>
          <textarea
            v-model="extraTerms"
            rows="3"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如：&#10;借款人承诺按时足额还款&#10;因本借款发生争议，双方协商解决"
          ></textarea>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-2 pt-1">
          <button
            @click="copyIou"
            class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制全文
          </button>
          <button
            @click="printIou"
            class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
          <button
            @click="resetForm"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 清空重填
          </button>
        </div>
      </div>

      <!-- 右：借条预览 -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 借条预览
          </h2>
          <button
            @click="printIou"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
        </div>

        <div
          v-if="canGenerate"
          class="bg-white text-black border border-gray-400 rounded-lg shadow-sm font-serif"
          style="font-family: 'SimSun', 'Songti SC', serif;"
        >
          <div class="p-8 md:p-10">
            <template v-for="(sec, idx) in iouSections" :key="idx">
              <!-- 标题 -->
              <div v-if="sec.type === 'title'" class="text-center mb-6">
                <p class="text-3xl font-bold tracking-[0.8em]">{{ sec.text }}</p>
              </div>
              <!-- 正文段落（首行缩进） -->
              <p v-else-if="sec.type === 'para'" class="whitespace-pre-wrap indent-[2em] text-[17px] leading-[2.1] mb-4">
                {{ sec.text }}
              </p>
              <!-- 落款区 -->
              <div v-else class="mt-10 text-right text-[16px] leading-[2.4] pr-2">
                <p v-for="(ln, j) in sec.lines" :key="j">
                  {{ ln }}<span v-if="ln.endsWith('：')" class="sign-line">&nbsp;</span>
                </p>
              </div>
            </template>
          </div>
        </div>
        <div
          v-else
          class="bg-card border border-dashed border-border rounded-lg h-[420px] flex flex-col items-center justify-center text-center px-8"
        >
          <FileSignature class="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">填写出借人与借款人姓名、有效金额后，此处生成借条预览</p>
          <p class="text-xs text-muted-foreground/70 mt-1">还款日期不能早于借款日期</p>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时仅输出借条正文。请由借款人在签名处当场手写签名并按手印后再交付款项。
        </p>
      </div>
    </div>

    <!-- 法律提示卡（固定展示） -->
    <div class="no-print bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center text-blue-700 dark:text-blue-400">
        <Info class="w-5 h-5 mr-2" /> 使用须知与法律提示
      </h2>
      <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-3 leading-relaxed">
        <li>本模板仅供参考，不构成法律意见；大额、复杂或涉担保的借贷，建议先咨询执业律师。</li>
        <li>借条宜由借款人当场手写签名并按手印，可附身份证复印件；使用打印稿时，需借款人在签名处手写签名。</li>
        <li>款项交付请通过银行 / 微信 / 支付宝转账并备注「借款」，保留转账凭证；现金交付建议在借条中写明「已当场现金收讫」。</li>
        <li>利息红线：超过合同成立时一年期 LPR 四倍的利息部分，法院不予支持。</li>
      </ol>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>借条生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          借条生成器是一款在线法律文书辅助工具：填写出借人、借款人、借款金额、借款 / 还款日期与利息约定，
          自动套用规范的借条版式生成正文——居中「借条」标题、「今借款人……向出借人……借到人民币（大写）……」正文、
          利息与逾期条款、落款签名区，并自动把阿拉伯金额转换为人民币中文大写（防篡改）。
          工具还会按近年 LPR 水平对年利率给出提示，帮助把利息约定控制在法律保护范围内。生成的借条可复制为纯文本，
          也可直接打印或另存 PDF，交由借款人签名按手印后生效使用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">借条怎么写才有法律效力</h3>
        <div class="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            要素齐全是基础：写清双方姓名（最好附身份证号）、借款金额（大小写一致，以大写为准）、借款日期、还款期限、
            利息与逾期利息约定、借款用途与交付方式，最后由借款人本人签名并按手印、注明出具日期。
            借条文字宜表述为「借到」而非「借给」，强调款项已实际交付；金额大写可防止涂改。
          </p>
          <p>
            除借条本身外，还应保留款项交付凭证：银行、微信、支付宝转账记录并备注「借款」，与借条互相印证。
            若以现金交付，建议在借条中写明「已当场现金收讫」。发生争议时，借条加转账凭证的组合证明力最强。
          </p>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">借条和欠条的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          借条证明的是「借贷关系」：借款人向出借人借到款项，直接对应借款合意与交付事实；欠条证明的是「欠款状态」，
          可能由货款、工程款、赌债外的各类结算产生，但不能单独说明欠款原因。在诉讼中，持有借条的出借人对借贷事实的举证责任更轻，
          而仅有欠条时往往还需说明欠款成因。因此个人之间发生借款，应当写「借条」而不是「欠条」；
          还款时出借人退还借条或出具收条，避免「借条还在、钱已还清」的纠纷。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">利息约定多少受法律保护</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          依据最高人民法院关于民间借贷的司法解释，借条中约定的利息与逾期利息，超过「合同成立时一年期贷款市场报价利率（LPR）四倍」的部分，
          法院不予支持；四倍以内的部分受法律保护。一年期 LPR 由中国人民银行定期公布、逐月可能变化，
          例如 LPR 为 3.65% 时四倍上限即 14.6%。因此约定年利率前建议查询最新 LPR；
          未约定利息的视为无息借款，但约定了还款期限、逾期未还的，出借人仍可主张逾期利息。
          本工具会在年利率超过约 14.8% 时给出红线提示，仅供参考，请以最新公布的 LPR 为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本工具会保存我的信息吗</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会上传。你填写的姓名、金额、日期等内容只保存在当前浏览器本地（localStorage 草稿），
          用于刷新页面后自动恢复，方便继续填写；全程不向服务器发送任何数据，也不收集身份证号等信息。
          如需彻底清除，点击「清空重填」即可删除本地草稿；在公共电脑上使用后建议清空再离开。
        </p>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'iou-generator'" :category="'file'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  FileSignature, Scale, Printer, Copy, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, CheckCircle, Info, Calendar
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '借条生成器 - 规范借条模板在线生成，金额大写自动转换',
  description: '在线借条生成器：填写出借人、借款人、借款金额与还款日期自动生成规范借条，人民币大写金额自动转换防篡改，LPR 四倍利率红线提醒，支持担保人与逾期利息条款，一键复制或打印另存PDF，纯浏览器本地处理不上传',
  keywords: '借条怎么写,借条模板,借条生成器,个人借条范本,金额大写转换,民间借贷利率,借条和欠条的区别',
  author: '有条工具',
  ogTitle: '借条生成器 - 规范借条模板在线生成 | 有条工具',
  ogDescription: '填写信息自动生成规范借条，金额自动转中文大写，利率红线提醒，打印签名即用',
  ogUrl: 'https://www.util.cn/tools/iou-generator',
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
          name: '借条生成器',
          url: 'https://www.util.cn/tools/iou-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['规范借条版式生成', '人民币大写金额自动转换', 'LPR 四倍利率红线提示', '逾期利息条款选择', '担保人条款与落款', '一键复制 / 打印另存 PDF', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '借条生成器', item: 'https://www.util.cn/tools/iou-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '借条怎么写才有法律效力？',
              acceptedAnswer: { '@type': 'Answer', text: '要素齐全：写清双方姓名（宜附身份证号）、借款金额大小写一致、借款日期、还款期限、利息与逾期利息、借款用途，由借款人本人签名并按手印、注明出具日期，同时保留备注「借款」的转账凭证互相印证。' }
            },
            {
              '@type': 'Question',
              name: '借条和欠条有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '借条证明借贷关系，直接对应借款合意与交付事实；欠条只证明欠款状态，成因可以是货款、结算等多种情形，不能单独说明欠款原因。个人之间借款应写借条，举证责任更轻、证明力更强。' }
            },
            {
              '@type': 'Question',
              name: '利息约定多少受法律保护？',
              acceptedAnswer: { '@type': 'Answer', text: '民间借贷利率受合同成立时一年期 LPR 四倍上限约束，超出部分法院不予支持，四倍以内受法律保护。一年期 LPR 由中国人民银行定期公布，约定前建议查询最新数值，本工具的超限提示仅供参考。' }
            },
            {
              '@type': 'Question',
              name: '本工具会保存我的信息吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会上传。填写内容只保存在当前浏览器本地（localStorage 草稿），用于刷新后恢复，不向服务器发送任何数据；点击「清空重填」即可删除本地草稿。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_AMOUNT = 9999999999.99 // 金额上限（约 99.99 亿）

const CN_DIGITS = '零壹贰叁肆伍陆柒捌玖'
const CN_UNITS = ['', '拾', '佰', '仟']
const CN_GROUPS = ['', '万', '亿']

// 整数部分转中文（万 / 亿分组，组内与组间按规范补零）
function intToCn(n) {
  if (n <= 0) return ''
  const s = String(n)
  const len = s.length
  let result = ''
  let zeroSeen = false
  for (let i = 0; i < len; i++) {
    const d = Number(s[i])
    const pos = len - 1 - i
    if (d === 0) {
      zeroSeen = true
    } else {
      if (zeroSeen && result !== '') result += '零'
      result += CN_DIGITS[d] + CN_UNITS[pos % 4]
      zeroSeen = false
    }
    if (pos % 4 === 0) {
      const g = CN_GROUPS[pos / 4]
      const groupVal = Math.floor(n / Math.pow(10, pos)) % 10000
      if (g && groupVal > 0) result += g
    }
  }
  return result
}

// 人民币金额转中文大写：0 ~ 9999999999.99，非法输入返回空串
// 规则：100.00 → 壹佰元整；1005.50 → 壹仟零伍元伍角；0.05 → 零元零伍分；0 → 零元整
function rmbUpper(amount) {
  const num = Number(amount)
  if (typeof amount !== 'number' && typeof amount !== 'string') return ''
  if (!isFinite(num) || num < 0 || num > MAX_AMOUNT) return ''
  const fenTotal = Math.round(num * 100)
  if (fenTotal === 0) return '零元整'
  const yuan = Math.floor(fenTotal / 100)
  const jiao = Math.floor(fenTotal / 10) % 10
  const fen = fenTotal % 10
  let out = ''
  out += yuan > 0 ? intToCn(yuan) + '元' : '零元'
  if (jiao === 0 && fen === 0) {
    out += '整'
  } else {
    if (jiao === 0 && fen > 0) out += '零' // 只有分时先补零（壹拾元零伍分 / 零元零伍分）
    if (jiao > 0) out += CN_DIGITS[jiao] + '角'
    if (fen > 0) out += CN_DIGITS[fen] + '分'
  }
  return out
}

// 年利率红线判定：null/非数字 → 'none'；≤12 → 'ok'；12<x≤14.8 → 'warn'；>14.8 → 'danger'
// ≤0 视为无息，同样返回 'none'
function judgeRateWarning(rate) {
  if (rate === null || rate === undefined || rate === '') return 'none'
  const r = Number(rate)
  if (!isFinite(r) || r <= 0) return 'none'
  if (r <= 12) return 'ok'
  if (r <= 14.8) return 'warn'
  return 'danger'
}

// 'YYYY-MM-DD' → 'YYYY年M月D日'，非法返回占位符
function formatCnDate(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return '＿＿＿＿年＿＿月＿＿日'
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`
}

// 由表单数据生成借条分节结构（标题 / 正文段落 / 落款），选填字段为空时整段省略
function buildIouSections(form) {
  const borrower = String(form.borrowerName || '').trim() || '＿＿＿'
  const lender = String(form.lenderName || '').trim() || '＿＿＿'
  const borrowerId = String(form.borrowerId || '').trim()
  const lenderId = String(form.lenderId || '').trim()
  const purpose = String(form.purpose || '').trim() || '资金周转'
  const place = String(form.place || '').trim()
  const guarantor = String(form.guarantorName || '').trim()
  const amountNum = Number(form.amount)
  const upper = rmbUpper(amountNum) || '＿＿＿'
  const lower = isFinite(amountNum) && amountNum > 0 ? amountNum.toFixed(2) : '＿＿＿'
  const loanCn = formatCnDate(form.loanDate)
  const repayCn = formatCnDate(form.repayDate)
  const rateNum = Number(form.rate)
  const hasRate = isFinite(rateNum) && rateNum > 0

  const sections = [{ type: 'title', text: '借条' }]

  // 正文主句（选填括注省略时以空格衔接，避免「张三因」「李四借到」粘连）
  let main = `今借款人 ${borrower}`
  main += borrowerId ? `（身份证号：${borrowerId}）` : ' '
  main += `因 ${purpose} 于 ${loanCn}`
  main += place ? `（${place}）` : ' '
  main += `向出借人 ${lender}`
  main += lenderId ? `（身份证号：${lenderId}）` : ' '
  main += `借到人民币（大写）${upper}（¥${lower}），约定于 ${repayCn} 前一次性归还。`
  sections.push({ type: 'para', text: main })

  // 利率条款
  sections.push({
    type: 'para',
    text: hasRate
      ? `双方约定年利率为 ${rateNum}%，利息随本金一并归还。`
      : '本次借款为无息借款。'
  })

  // 逾期条款
  const overdueType = String(form.overdueType || 'none')
  let overdueText = '双方未就逾期利率另行约定。'
  if (overdueType === 'daily5') {
    overdueText = '若借款人未按期足额归还借款，就逾期部分按日利率万分之五计付逾期利息，直至实际清偿之日止。'
  } else if (overdueType === 'annual') {
    const odRate = Number(form.overdueRate)
    if (isFinite(odRate) && odRate > 0) {
      overdueText = `若借款人未按期足额归还借款，就逾期部分按年利率 ${odRate}% 计付逾期利息，直至实际清偿之日止。`
    }
  }
  sections.push({ type: 'para', text: overdueText })

  // 担保条款 + 担保人落款
  if (guarantor) {
    sections.push({
      type: 'para',
      text: `担保人 ${guarantor} 自愿为上述借款提供连带责任保证，保证范围包括借款本金、利息、逾期利息及实现债权的费用。`
    })
  }

  // 其他约定（逐条）
  const extraLines = String(form.extraTerms || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (extraLines.length) {
    sections.push({
      type: 'para',
      text: '双方另约定如下：\n' + extraLines.map((l, i) => `${i + 1}. ${l}`).join('\n')
    })
  }

  // 落款区
  sections.push({
    type: 'sign',
    lines: ['借款人（签名并按手印）：', '身份证号：', '日期：    年  月  日']
  })
  if (guarantor) {
    sections.push({
      type: 'sign',
      lines: ['担保人（签名并按手印）：', '身份证号：', '日期：    年  月  日']
    })
  }
  return sections
}

// 由分节结构拼接多行纯文本（供复制）
function buildIouText(form) {
  const sections = buildIouSections(form)
  const title = sections.filter((s) => s.type === 'title').map((s) => s.text).join('')
  const paras = sections.filter((s) => s.type === 'para').map((s) => s.text).join('\n\n')
  const signs = sections.filter((s) => s.type === 'sign').map((s) => s.lines.join('\n')).join('\n\n')
  return [title, paras, signs].filter(Boolean).join('\n\n')
}

// ---------- 表单状态 ----------
const PURPOSE_DEFAULT = '资金周转'
const DRAFT_KEY = 'iou-generator-draft'

const lenderName = ref('')
const lenderId = ref('')
const borrowerName = ref('')
const borrowerId = ref('')
const amount = ref('')
const place = ref('')
const loanDate = ref('')
const repayDate = ref('')
const purpose = ref(PURPOSE_DEFAULT)
const rate = ref('')
const overdueType = ref('none')
const overdueRate = ref('')
const guarantorName = ref('')
const guarantorId = ref('')
const extraTerms = ref('')
const showGuarantor = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 校验与派生 ----------
const amountError = computed(() => {
  const a = amount.value
  if (a === '' || a === null || a === undefined) return ''
  if (typeof a !== 'number' || !isFinite(a) || a <= 0) return '借款金额需为大于 0 的数字'
  if (a > MAX_AMOUNT) return `金额超出支持范围（最大 ${MAX_AMOUNT} 元）`
  return ''
})

const upperText = computed(() => (amountError.value ? '' : rmbUpper(amount.value)))

const dateError = computed(() => {
  const re = /^(\d{4})-(\d{2})-(\d{2})$/
  if (!re.test(String(loanDate.value || '')) || !re.test(String(repayDate.value || ''))) return ''
  if (repayDate.value < loanDate.value) return '约定还款日期不能早于借款日期，请重新选择。'
  return ''
})

const rateWarning = computed(() => judgeRateWarning(rate.value))
const hasGuarantor = computed(() => String(guarantorName.value || '').trim() !== '')

const canGenerate = computed(() =>
  Boolean(
    String(lenderName.value || '').trim() &&
    String(borrowerName.value || '').trim() &&
    !amountError.value &&
    upperText.value &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(loanDate.value || '')) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(repayDate.value || '')) &&
    !dateError.value
  )
)

const iouForm = computed(() => ({
  lenderName: lenderName.value,
  lenderId: lenderId.value,
  borrowerName: borrowerName.value,
  borrowerId: borrowerId.value,
  amount: amount.value,
  place: place.value,
  loanDate: loanDate.value,
  repayDate: repayDate.value,
  purpose: purpose.value,
  rate: rate.value,
  overdueType: overdueType.value,
  overdueRate: overdueRate.value,
  guarantorName: guarantorName.value,
  guarantorId: guarantorId.value,
  extraTerms: extraTerms.value
}))

const iouSections = computed(() => (canGenerate.value ? buildIouSections(iouForm.value) : []))
const iouText = computed(() => (canGenerate.value ? buildIouText(iouForm.value) : ''))

// ---------- 操作 ----------
async function copyIou() {
  if (!iouText.value) {
    alert('请先完整填写出借人、借款人姓名与有效金额，再复制借条全文。')
    return
  }
  try {
    await navigator.clipboard.writeText(iouText.value)
    alert('借条全文已复制到剪贴板，可粘贴到备忘录或聊天工具发给对方确认。')
  } catch (e) {
    alert('复制失败，请在预览区手动选择文本复制。')
  }
}

function printIou() {
  if (!canGenerate.value) {
    alert('请先完整填写出借人、借款人姓名与有效金额，再打印借条。')
    return
  }
  window.print()
}

function toIsoDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function resetForm() {
  lenderName.value = ''
  lenderId.value = ''
  borrowerName.value = ''
  borrowerId.value = ''
  amount.value = ''
  place.value = ''
  loanDate.value = toIsoDate(new Date())
  repayDate.value = toIsoDate(new Date(Date.now() + 90 * 86400000))
  purpose.value = PURPOSE_DEFAULT
  rate.value = ''
  overdueType.value = 'none'
  overdueRate.value = ''
  guarantorName.value = ''
  guarantorId.value = ''
  extraTerms.value = ''
  showGuarantor.value = false
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch (e) { /* 忽略本地存储异常 */ }
}

// ---------- 本地草稿（localStorage，仅本机保存） ----------
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(iouForm.value))
  } catch (e) { /* 忽略本地存储异常 */ }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d && typeof d === 'object' ? d : null
  } catch (e) {
    return null
  }
}

onMounted(() => {
  // 恢复本地草稿（存在才恢复，否则设置默认日期：今天 / +90 天）
  const draft = loadDraft()
  const assign = (key, target) => {
    if (typeof draft[key] === 'string' || typeof draft[key] === 'number') target.value = draft[key]
  }
  if (draft) {
    assign('lenderName', lenderName)
    assign('lenderId', lenderId)
    assign('borrowerName', borrowerName)
    assign('borrowerId', borrowerId)
    assign('amount', amount)
    assign('place', place)
    assign('loanDate', loanDate)
    assign('repayDate', repayDate)
    assign('purpose', purpose)
    assign('rate', rate)
    assign('overdueType', overdueType)
    assign('overdueRate', overdueRate)
    assign('guarantorName', guarantorName)
    assign('guarantorId', guarantorId)
    assign('extraTerms', extraTerms)
    if (['none', 'annual', 'daily5'].indexOf(overdueType.value) === -1) overdueType.value = 'none'
  }
  if (!loanDate.value) loanDate.value = toIsoDate(new Date())
  if (!repayDate.value) repayDate.value = toIsoDate(new Date(Date.now() + 90 * 86400000))
  if (hasGuarantor.value) showGuarantor.value = true

  // 挂载后再监听，避免 SSR 阶段写 localStorage
  watch(iouForm, saveDraft)

  addRecentTool('iou-generator')
})
</script>

<style scoped>
.sign-line {
  display: inline-block;
  min-width: 130px;
  border-bottom: 1px solid #555;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    box-shadow: none;
  }
  .bg-white {
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
