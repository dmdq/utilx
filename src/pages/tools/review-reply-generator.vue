<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <MessagesSquare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电商评价回复生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">选评价类型与场景，一键生成得体客服回复话术</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        差评先致歉再给解决方案并邀请联系，好评感谢之余自然引导复购，中评表达重视与改进决心。
        支持物流慢、质量不符、客服态度、包装破损、无理由差评等场景组合，三种店铺风格（亲切/专业/活泼）任选，
        可附优惠券、退款、补发等补偿方案。生成结果可直接编辑、一键复制，并内置广告法违禁词自查提示。全部在浏览器本地生成，不上传任何内容。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：选项表单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 评价与风格设置
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">评价类型</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="t in REPLY_TYPES"
              :key="t"
              @click="ratingType = t"
              :class="ratingType === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ t }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            差评/中评场景（可多选，好评可留空）
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="s in SCENES"
              :key="s"
              @click="toggleScene(s)"
              :class="scenes.includes(s) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ s }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">店铺风格</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="st in STYLES"
              :key="st"
              @click="shopStyle = st"
              :class="shopStyle === st ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ st }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">亲切偏口语拉近距离，专业偏书面稳重，活泼适合年轻客群</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">补偿方案（可不选）</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="c in COMPENSATIONS"
              :key="c"
              @click="toggleComp(c)"
              :class="compensations.includes(c) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ c }}</button>
          </div>
        </div>

        <button
          @click="generateReplies"
          class="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Sparkles class="w-4 h-4" /> 生成 3 条候选回复
        </button>
      </div>

      <!-- 右侧：生成结果 -->
      <div class="bg-card border border-border rounded-lg p-6 flex flex-col">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 回复结果（可直接编辑）
        </h2>

        <div v-if="replies.length > 0" class="flex flex-col flex-1">
          <!-- 多条切换 -->
          <div class="flex flex-wrap gap-1.5 mb-3">
            <button
              v-for="(r, i) in replies"
              :key="i"
              @click="selectReply(i)"
              :class="activeIndex === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            >{{ ['A', 'B', 'C'][i] }} 版</button>
          </div>

          <textarea
            v-model="editableReply"
            rows="8"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          ></textarea>

          <div v-if="banHits.length > 0" class="mt-3 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-red-600 dark:text-red-400 leading-relaxed">
              文案中检测到疑似广告法违禁词：{{ banHits.join('、') }}。建议替换为客观描述，
              或前往
              <NuxtLink to="/tools/banned-words-checker" class="underline font-medium">广告法违禁词检测</NuxtLink>
              做完整自查后再发布。
            </p>
          </div>
          <p v-else class="mt-3 text-xs text-muted-foreground">未检测到常见极限词，发布前仍建议人工复核。</p>

          <div class="mt-4 flex gap-2">
            <button
              @click="copyReply"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
            >
              <Check v-if="copyDone" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              {{ copyDone ? '已复制' : '复制回复' }}
            </button>
            <button
              @click="regenerateSame"
              class="flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-all"
            >
              <RotateCcw class="w-4 h-4" /> 重新生成
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            A/B/C 三版仅在开场与收束措辞上不同，便于对比挑选；编辑后切换版本会丢失未保存修改，请先复制。
          </p>
        </div>

        <div v-else class="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
          先在左侧选好评价类型与场景，点击「生成 3 条候选回复」
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        使用建议：回复速度比措辞更重要，差评尽量在 24 小时内响应；补偿口径（优惠券面额、是否退款补发）请按店铺实际政策修改后再发送，避免承诺无法兑现造成二次差评。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于电商评价回复</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            评价回复不只是回给这一位买家看的，更是回给后面成千上万的潜在顾客看的。一条得体的差评回复能对冲差评的杀伤力，
            而一条敷衍或硬怼的回复往往比差评本身更劝退下单。本工具按「差评先致歉、再给解决方案、邀请私信联系」的公认结构，
            配合好评的感谢加复购引导，生成可直接微调使用的话术。
          </p>
          <h3 class="text-lg font-semibold text-foreground">差评回复为什么要「先致歉」</h3>
          <p>
            哪怕买家描述夸张、诉求不合理，公开回复里争对错都是输家：围观顾客默认商家应比顾客更专业。
            先致歉只承认「体验不佳」这一事实，不等于承认商品有质量问题；随后用具体动作（已核查物流、已加强质检、已再培训客服）
            展示处理诚意，最后把细枝末节引到私聊，公开页面只留下负责任的姿态。
          </p>
          <h3 class="text-lg font-semibold text-foreground">好评怎么回复才自然</h3>
          <p>
            只回「感谢支持」四个字浪费了一个免费广告位。推荐三段式：先具体回应买家夸过的点（说明你真的读了评价），
            再带一句店铺差异化信息（发货时效、售后承诺、上新节奏），最后给一个复购理由（关注店铺、会员券、搭配款）。
            避免「全网最低、绝对正品、100%满意」这类广告法禁用的绝对化用语，本工具会对你编辑后的文案做违禁词自查提示。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">无理由差评要不要回怼？</span>不要。对明显恶意或无具体描述的差评，选用「无理由差评」场景生成不卑不亢的回复即可，回怼只会让围观顾客觉得店家情绪不稳定。</li>
            <li><span class="text-foreground font-medium">可以承诺返款或补发吗？</span>可以，但补偿口径必须与店铺真实售后政策一致。先选择「附补偿」生成话术，再把面额、条件改成你能兑现的版本，切勿照发无法执行的承诺。</li>
            <li><span class="text-foreground font-medium">生成的回复可以直接发布吗？</span>建议作为底稿快速微调：替换商品名、补上订单号、按实际情况删改场景句即可，逐字照发容易显得模板化，反而拉低观感。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'review-reply-generator'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  MessagesSquare, ClipboardList, FileText, Sparkles, Copy, Check,
  RotateCcw, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '电商评价回复生成器 - 好评差评客服话术在线生成',
  description: '在线电商评价回复生成器，选择好评/中评/差评类型与物流慢、质量不符、客服态度、包装破损等场景，按亲切/专业/活泼店铺风格生成得体客服回复话术，支持补偿方案与违禁词自查，可编辑可复制',
  keywords: '差评回复模板, 评价回复话术, 电商客服话术, 好评回复语, 中评怎么回复, 差评怎么回复',
  author: 'Util工具箱',
  ogTitle: '电商评价回复生成器 - 有条工具',
  ogDescription: '选评价类型与场景，一键生成得体客服回复话术',
  ogUrl: 'https://www.util.cn/tools/review-reply-generator',
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
          name: '电商评价回复生成器',
          url: 'https://www.util.cn/tools/review-reply-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['好评/中评/差评三类话术', '五种差评场景组合', '亲切/专业/活泼三种风格', '优惠券/退款/补发补偿方案', '违禁词自查提示', '三版切换与一键复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '电商评价回复生成器', item: 'https://www.util.cn/tools/review-reply-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '无理由差评要不要回怼？',
              acceptedAnswer: { '@type': 'Answer', text: '不要。对无明显理由的差评选用「无理由差评」场景生成不卑不亢的回复即可，公开回怼只会让围观顾客对店铺观感更差。' }
            },
            {
              '@type': 'Question',
              name: '可以承诺返款或补发吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，但补偿面额与条件必须改成店铺真实可兑现的政策再发送，避免无法执行的承诺引发二次差评。' }
            },
            {
              '@type': 'Question',
              name: '生成的回复可以直接发布吗？',
              acceptedAnswer: { '@type': 'Answer', text: '建议作为底稿微调：替换商品名、补订单号、按实际删改场景句，逐字照发会显得模板化。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'review-reply-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
const REPLY_TYPES = ['好评', '中评', '差评']
const SCENES = ['物流慢', '质量不符', '客服态度', '包装破损', '无理由差评']
const STYLES = ['亲切', '专业', '活泼']
const COMPENSATIONS = ['优惠券', '退款', '补发']

// 常见广告法绝对化用语（轻量自查，完整检测见违禁词检测页）
const BAN_WORDS = ['最好', '最佳', '第一', '顶级', '国家级', '全网最低', '绝对', '100%', '永久', '万能']

const findBanWords = (text) => {
  const t = String(text || '')
  return BAN_WORDS.filter(w => t.includes(w))
}

const asArray = (v) => {
  if (Array.isArray(v)) return v.filter(x => x !== '' && x != null)
  if (v === '' || v == null || v === true || v === false) return []
  return [String(v)]
}

// 补偿参数归一：true → 默认优惠券；字符串/数组 → 过滤合法项
const normalizeComp = (v) => {
  if (v === true) return ['优惠券']
  return asArray(v).filter(x => COMPENSATIONS.includes(x))
}

const SCENE_LINES = {
  物流慢: '这次物流时效没达到您的预期，我们已与快递方沟通并调整发货仓配安排，后续订单会优先保障时效。',
  质量不符: '商品与页面描述、与您的预期出现了出入，我们已重新核对详情页并加强出库质检，给您添麻烦了。',
  客服态度: '客服接待中让您感到不被重视，是我们培训不到位，已对相关同事进行再培训并复盘本次会话。',
  包装破损: '运输途中包装防护不足导致破损，是我们考虑不周，之后会加固缓冲包装并更换更可靠的承运方案。',
  无理由差评: '虽然这次没能让您满意也没留下具体问题，我们仍会持续打磨商品与服务，不辜负每一份信任。'
}

const OPENERS = {
  差评: {
    亲切: ['亲亲，看到您的评价我们真的很抱歉，这次让您受委屈了。', '亲爱的，实在抱歉给您添堵了，您的心情我们完全理解。', '亲，抱歉抱歉，这条评价让我们心里特别不是滋味。'],
    专业: ['尊敬的顾客，非常抱歉本次购物给您带来了不佳体验，我们对此高度重视。', '您好，对于此次服务中的问题，我们谨代表店铺向您郑重致歉。', '尊敬的顾客您好，未能达到您的期待我们深表歉意，已第一时间核查处理。'],
    活泼: ['哎呀，这次没能让您满意，我们赶紧自查整改，先给您道个歉！', '收到您的吐槽啦，抱歉这次体验掉了链子，我们马上补救！', '这条差评让我们狠狠自省了一波，先真诚说声抱歉！']
  },
  中评: {
    亲切: ['亲，谢谢您的中肯评价，没能拿满五星说明我们还有差距。', '亲爱的，感谢您的真实反馈，差的那一点我们一定补上。', '亲，看到您的中评我们既感谢又有点不服气，想做得更好给您看。'],
    专业: ['感谢您的客观评价，您的意见是我们改进的重要依据。', '您好，中评是对我们的鞭策，我们已梳理本次服务中的不足。', '感谢中肯反馈，我们会持续改进商品与服务的细节。'],
    活泼: ['中评收到！感谢真实反馈，我们这就把短板补起来！', '谢谢中肯打分，离五星的距离就是我们的努力方向！', '中评也不灰心，下次争取让您忍不住改好评！']
  },
  好评: {
    亲切: ['亲爱的，感谢您的认可与好评，您的满意就是我们最开心的事。', '亲，谢谢您的五星好评，看到您的喜欢我们特别有动力。', '感谢亲的喜爱与好评，您的信任我们一定好好珍惜。'],
    专业: ['感谢您的认可与好评，您的满意是我们持续精进的动力。', '您好，非常感谢您的五星评价，我们将继续保持品质与服务标准。', '感谢您的正面反馈，期待持续为您提供可靠的商品与服务。'],
    活泼: ['感谢好评！您的五星让我们开心得转圈圈！', '谢谢认可！这波好评我们收下啦，动力加满！', '收到您的好评，整个团队都干劲十足！']
  }
}

const CLOSERS = {
  差评: {
    亲切: ['有任何问题随时联系在线客服，我们把后续给您安排好～', '麻烦您动动小手联系一下在线客服，给我们一个弥补的机会呀。', '记得找在线客服聊聊情况哦，我们一直都在，一定负责到底。'],
    专业: ['恳请您通过在线客服与我们取得联系，我们将为您妥善解决并跟进处理结果。', '如仍有疑问，欢迎随时联系客服团队，我们将竭诚为您妥善处理。', '请您联系店铺客服，我们承诺对本次订单跟进处理到满意为止。'],
    活泼: ['有问题尽管召唤在线客服，我们随时在线等撩！', '快去私信客服小伙伴，补救方案已经备好！', '戳一下在线客服，我们保证把问题解决得漂漂亮亮！']
  },
  中评: {
    亲切: ['方便的话跟在线客服说说具体情况呀，我们改好再邀您来验收～', '哪里没做好欢迎私信告诉我们，下次一定给您惊喜。', '我们随时在线等您的建议，一定把体验拉上来。'],
    专业: ['欢迎您通过客服渠道反馈具体建议，我们将逐项改进并跟进落实。', '如有进一步意见，请随时联系客服，我们珍视每一条真实反馈。', '期待您再次光临，检验我们的改进成果。'],
    活泼: ['欢迎私信客服提意见，改进清单已拉满随时监督！', '下次来记得验收我们的进步哦！', '意见尽管砸过来，我们接得住改得好！']
  },
  好评: {
    亲切: ['喜欢的话记得收藏店铺，上新和会员券第一时间喊您～', '常回来看看呀，老客户福利不会少的。', '期待与您的下次相遇，有问题随时找我们～'],
    专业: ['欢迎持续关注店铺上新与会员权益，我们也将不断为您带来更优质的商品与服务。', '建议收藏店铺以便查询售后与获取最新优惠信息，感谢您的支持。', '期待再次为您服务，祝您使用愉快。'],
    活泼: ['顺手点个关注不迷路，上新福利第一时间推送！', '收藏店铺下次回购更顺手，还有会员券等着你！', '欢迎安利给朋友，复购福利安排上！']
  }
}

// 生成一条回复：type 评价类型 / scenes 场景(字符串或数组) / style 风格 / compensation 补偿(bool或列表) / variant 0|1|2
const genReply = (type, scenes, style, compensation, variant) => {
  const t = REPLY_TYPES.includes(type) ? type : '差评'
  const s = STYLES.includes(style) ? style : '亲切'
  const v = Number.isInteger(variant) && variant >= 0 ? variant % 3 : 0
  const sceneList = asArray(scenes).filter(x => SCENES.includes(x))
  const compList = normalizeComp(compensation)

  const opener = OPENERS[t][s][v % OPENERS[t][s].length]
  const closer = CLOSERS[t][s][v % CLOSERS[t][s].length]

  const parts = [opener]

  if (t === '差评' || t === '中评') {
    if (sceneList.length > 0) {
      parts.push(sceneList.map(x => SCENE_LINES[x]).join(''))
    }
    if (compList.length > 0) {
      parts.push('为表诚意，我们已为您准备补偿方案：' + compList.join('、') + '，联系客服核对订单后即可办理。')
    } else if (t === '差评') {
      parts.push('虽暂不涉及费用补偿，但问题本身我们已经记录并启动整改。')
    }
  } else {
    parts.push('您的肯定我们会转达给整个团队。')
    parts.push('店铺会持续上新并保持发货与售后节奏，欢迎常来逛逛。')
  }

  parts.push(closer)
  return parts.join('')
}

// 生成三版候选
const genReplies = (type, scenes, style, compensation) => [0, 1, 2].map(v => genReply(type, scenes, style, compensation, v))
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const ratingType = ref('差评')
const scenes = ref([])
const shopStyle = ref('亲切')
const compensations = ref([])
const replies = ref([])
const activeIndex = ref(0)
const editableReply = ref('')
const copyDone = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const toggleScene = (s) => {
  const idx = scenes.value.indexOf(s)
  if (idx >= 0) scenes.value.splice(idx, 1)
  else scenes.value.push(s)
}

const toggleComp = (c) => {
  const idx = compensations.value.indexOf(c)
  if (idx >= 0) compensations.value.splice(idx, 1)
  else compensations.value.push(c)
}

const generateReplies = () => {
  replies.value = genReplies(ratingType.value, scenes.value, shopStyle.value, compensations.value)
  activeIndex.value = 0
  editableReply.value = replies.value[0]
  copyDone.value = false
}

const regenerateSame = () => { generateReplies() }

const selectReply = (i) => {
  activeIndex.value = i
  editableReply.value = replies.value[i] || ''
  copyDone.value = false
}

const banHits = computed(() => findBanWords(editableReply.value))

let copyTimer = null
const copyReply = async () => {
  try {
    await navigator.clipboard.writeText(editableReply.value)
    copyDone.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copyDone.value = false }, 2000)
  } catch (e) { /* 剪贴板不可用时静默，用户可手动选择复制 */ }
}
</script>
