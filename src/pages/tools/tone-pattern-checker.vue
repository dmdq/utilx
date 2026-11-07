<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Music2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">律诗平仄检查器</h1>
          <p class="text-sm text-muted-foreground mt-1">五绝/七绝/五律/七律 16 谱对照，逐字平仄标注 + 入声提示 + 押韵粘对检查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        格律诗平仄自查工具：选择体式（五绝/七绝/五律/七律）与格式（平起/仄起 × 首句入韵/不入韵，共 16 种标准谱，
        依王力《诗词格律》口径录入），粘贴诗句后逐字标注普通话声调（一二声为平、三四声为仄），与标准谱对照——
        采用"一三五不论、二四六分明"宽口径：二、四、六字必须合谱（五言为二、四字），一、三、五字宽容；
        内置常见中古入声字表，普通话读平声的入声字（如白、竹、石、独、菊、一、七、八、十、出、屋、国）会黄标提示
        "此字中古为入声（仄）"。附带简化的押韵检查（末字韵基比对）与粘对检查、三平尾与孤平基础告警。
        声调数据覆盖 3700+ 常用字，纯本地运行。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Music2 class="w-5 h-5 mr-2 text-primary" /> 体式与格式
          </h2>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">体式</label>
            <div class="grid grid-cols-4 gap-1">
              <button
                v-for="s in STYLES"
                :key="s.id"
                type="button"
                @click="styleId = s.id"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="styleId === s.id ? BTN_ON : BTN_OFF"
              >
                {{ s.name }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">格式</label>
            <div class="grid grid-cols-2 gap-1">
              <button
                v-for="f in FORMS"
                :key="f.id"
                type="button"
                @click="formId = f.id"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="formId === f.id ? BTN_ON : BTN_OFF"
              >
                {{ f.name }}
              </button>
            </div>
          </div>
          <div class="bg-muted/50 rounded-xl p-3">
            <p class="text-xs text-muted-foreground mb-1">当前标准谱（{{ currentStyle.name }}·{{ currentForm.name }}）</p>
            <p class="text-sm text-foreground font-mono leading-relaxed">{{ currentPattern.join('　/　') }}</p>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ClipboardPaste class="w-5 h-5 mr-2 text-primary" /> 诗句输入
          </h2>
          <textarea
            v-model="poemText"
            rows="6"
            :placeholder="'每句一行，或直接粘贴整首（自动按标点分句）\n例如：\n床前明月光，疑是地上霜。'"
            :class="SEL_CLS + ' font-mono resize-y'"
          />
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              @click="loadSample(0)"
              class="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-medium text-foreground hover:bg-muted/70 transition"
            >
              示例：登鹳雀楼（仄起不入韵）
            </button>
            <button
              type="button"
              @click="loadSample(1)"
              class="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-medium text-foreground hover:bg-muted/70 transition"
            >
              示例：静夜思（普通话逐字演示）
            </button>
          </div>
          <p v-if="checkResult.errors.length" class="text-xs text-amber-600 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" /> {{ checkResult.errors.join('；') }}
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            口径：普通话一二声＝平、三四声＝仄、轻声按平计；二四六（五言二四）必须合谱，一三五宽容（"一三五不论、二四六分明"）；
            多音字取最常见读音；未收录字标灰，可自行查证。
          </p>
        </div>

        <!-- 图例 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2 text-xs text-muted-foreground">
          <h2 class="text-base font-semibold text-foreground flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 标注图例
          </h2>
          <p><span class="inline-block w-3 h-3 rounded-sm align-middle bg-red-500/80 mr-1.5"></span>偶数位（二四六）不合谱</p>
          <p><span class="inline-block w-3 h-3 rounded-sm align-middle bg-amber-400/80 mr-1.5"></span>普通话为平、中古为入声（仄）——黄标提示</p>
          <p><span class="inline-block w-3 h-3 rounded-sm align-middle bg-muted border border-border mr-1.5"></span>未收录 / 无法判定（标灰）</p>
          <p class="pt-1 border-t border-border">常见入声字表收录 {{ RUSHENG_SET.size }} 字，命中即提示；该表为常见字速查口径，非完备中古音系。</p>
        </div>
      </div>

      <!-- 右：检查结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 逐字标注 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <ScanLine class="w-5 h-5 mr-2 text-primary" /> 逐字平仄标注
          </h2>
          <template v-if="checkResult.lines.length">
            <div
              v-for="(ln, li) in checkResult.lines"
              :key="li"
              class="mb-4 pb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
            >
              <div class="flex items-baseline justify-between mb-2">
                <span class="text-xs text-muted-foreground">第 {{ li + 1 }} 句 · 谱：{{ currentPattern[li] || '—' }}</span>
                <span class="text-xs" :class="ln.mismatches.length ? 'text-red-500' : 'text-green-600'">
                  {{ ln.toneText }}{{ ln.mismatches.length ? ' · 偶数位不合：第 ' + ln.mismatches.join('、') + ' 字' : ' · 偶数位合谱' }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(ch, ci) in ln.chars"
                  :key="ci"
                  class="flex flex-col items-center rounded-lg border px-2 py-1.5 min-w-[44px]"
                  :class="charCls(ch, ci, ln)"
                  :title="charTitle(ch, ci)"
                >
                  <span class="text-lg leading-tight text-foreground">{{ ch.char }}</span>
                  <span class="text-[10px] leading-tight" :class="ch.cat ? 'text-muted-foreground' : 'text-muted-foreground/50'">
                    {{ ch.toneMark || '?' }}·{{ ch.cat || '?' }}
                  </span>
                </div>
              </div>
              <p v-for="(note, ni) in ln.notes" :key="ni" class="text-xs text-amber-600 mt-2 flex items-start gap-1">
                <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" /> {{ note }}
              </p>
            </div>
          </template>
          <div v-else class="py-8 text-center text-sm text-muted-foreground">
            粘贴诗句或点一个示例开始检查。
          </div>
        </div>

        <!-- 押韵与粘对 -->
        <div v-if="checkResult.lines.length > 1" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-3">
              <AudioLines class="w-5 h-5 mr-2 text-primary" /> 押韵检查（简化口径）
            </h2>
            <p class="text-sm text-foreground mb-2">
              韵脚（偶数句末字）：
              <span v-for="(r, i) in checkResult.rhymes" :key="i" class="inline-flex items-baseline gap-1 mr-2">
                <b>{{ r.char }}</b><span class="text-xs text-muted-foreground">({{ r.key || '?' }})</span>
              </span>
            </p>
            <p class="text-sm" :class="checkResult.rhymeOk ? 'text-green-600' : 'text-amber-600'">
              {{ checkResult.rhymeMsg }}
            </p>
            <p class="text-xs text-muted-foreground mt-2">按韵基（去介音）比较，en 组含 in/un/ün、eng 组含 ing（中华新韵宽组口径）；与平水韵不同，仅供自查参考。</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-3">
              <Link2 class="w-5 h-5 mr-2 text-primary" /> 粘对检查
            </h2>
            <p v-if="checkResult.adhesion.length" class="space-y-2">
              <span v-for="(iss, i) in checkResult.adhesion" :key="i" class="block text-xs text-amber-600">{{ iss }}</span>
            </p>
            <p v-else class="text-sm text-green-600">逐联相对、邻联相粘，未发现问题（按二四六位口径）。</p>
            <p class="text-xs text-muted-foreground mt-2">对：同联出句对句偶数位平仄相反；粘：下联出句与上联对句偶数位相同。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <details class="bg-card border border-border rounded-lg mb-12 group">
        <summary class="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-foreground"><span class="text-primary mr-2">#</span>普通话查平仄的局限、一三五不论与常见问题</h2>
          <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
        </summary>
        <div class="px-6 pb-6 space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">用普通话判断平仄有什么局限？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              近体诗按中古汉语四声八调定平仄：平声为平，上、去、入声为仄。普通话"入声消失"后，中古入声字被派入四声——
              大批原为仄声的字今天读成了平声：如 白、竹、石、独、菊、直、读、国（派入阳平），一、七、八、出、屋、黑、失、说（派入阴平）。
              用普通话口径检查"床前明月光"会得到平平平仄平（月读四声算仄），而按中古音"月"也是入声仄，此处恰好一致；
              但"李白"的"白"、"独钓寒江雪"的"独"按普通话是平声、按中古是入声仄——本工具对这类字给出黄标提示，
              常用入声字表收录 {{ RUSHENG_SET.size }} 字（依维基百科"入声"条目规律与"古入今平字表"两类来源交叉整理）。
              严谨创作或投稿请以《平水韵》或权威韵书为准，本页的普通话口径适合初学者自查与教学演示。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">"一三五不论、二四六分明"怎么理解？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              这是近体诗平仄的宽严口诀：七言句的第 1、3、5 字（五言为第 1、3 字）处于节奏点之间，平仄可以放宽；
              第 2、4、6 字（五言第 2、4 字）是节奏点，必须与谱一致——本工具即按此口径标红偶数位失谱。
              但这条口诀有边界：<b class="text-foreground">孤平</b>——韵句"平平仄仄平"（五言）首字改仄、或"仄仄平平仄仄平"（七言）第三字改仄，
              全句除韵脚外只剩一个平声，是大忌，工具会给出基础告警；<b class="text-foreground">三平尾</b>——句末连续三个平声
              （如"更上一层楼"按普通话正是平平平收尾），律句不允许，工具直接检测句末三连平并告警。
              所以"一三五"并非真的随便，改后是否落孤平、三平尾要单独看。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">粘对是什么？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              "对"指同一联内出句与对句在节奏点（二、四、六字）上平仄相反，如"仄仄平平仄"对"平平仄仄平"；
              "粘"指相邻两联之间，下联出句与上联对句的节奏点平仄相同（相粘），如第二句"平平仄仄平"与第三句"平平平仄仄"的二、四字同为平、仄。
              失对、失粘都会破坏律诗的声律框架，工具按二四六位口径逐联检查并给出具体位置。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-semibold text-foreground">16 种标准谱从哪里来？</p>
                <p class="text-sm text-muted-foreground mt-1">依王力《诗词格律》体系整理：五言以仄起不入韵为常见、七言以平起入韵为常见；律诗格式即绝句谱按粘对规则加倍（首句入韵式将第 1、5 句换成收平的韵句）。录入后与多处格律资料交叉核对（维基百科"律诗"条、诗词格律专文等）。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">押韵检查为什么和韵书不一样？</p>
                <p class="text-sm text-muted-foreground mt-1">本工具是"简化口径"：只比较句末字的韵基（去掉介音的韵母主体），并把 en/in/un/ün、eng/ing 按中华新韵宽组归并；平水韵按中古音系分 106 部，两者结论常不同。写近体诗押平水韵、填词押词林正韵，需要以韵书为准。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">多音字怎么办？</p>
                <p class="text-sm text-muted-foreground mt-1">内置 3700+ 常用字声调表按最常见读音取值（如"看"取 kàn）；古诗中多音字常依格律变读，标注结果仅供参考，请结合句意判断。未收录的生僻字会标灰提示。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">想继续玩诗词相关的工具？</p>
                <p class="text-sm text-muted-foreground mt-1">可以试试 <NuxtLink to="/tools/idiom-dictionary/" class="text-primary hover:underline">成语词典接龙</NuxtLink>：内置高频成语库，支持首尾字接龙与随机挑战，配合本页一起做语文练习。</p>
              </div>
            </div>
          </div>
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-semibold text-foreground mb-1">口径与来源</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              16 谱依王力《诗词格律》口径录入，与维基百科"律诗"条目及多份诗词格律资料交叉核对；入声字规律依维基百科"入声"条目
              （今读阴平/阳平的入声规律、不送气阳平多入声）与"古入今平字表"整理；普通话声调归平仄、轻声按平、"一三五不论二四六分明"
              与三平尾/孤平告警均为本页声明的简化口径，权威创作请查韵书。
            </p>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Music2, ClipboardPaste, Info, TriangleAlert, ChevronDown, ScanLine, AudioLines, Link2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'

// ---------- SEO ----------
useSeoMeta({
  title: '律诗平仄检查器 - 五绝七绝五律七律格律逐字标注 | 有条工具',
  description: '免费在线律诗平仄检查：五绝/七绝/五律/七律16种标准谱（王力《诗词格律》口径），逐字普通话声调标注、偶数位合谱检查（一三五不论二四六分明），内置常见中古入声字黄标提示，押韵韵基比对、粘对检查、三平尾与孤平基础告警，3700+常用字声调，纯本地运行',
  keywords: '平仄检查,律诗格律,平仄检测,入声字,诗词格律,粘对,三平尾',
  author: '有条工具',
  ogTitle: '律诗平仄检查器 - 16谱逐字平仄标注 | 有条工具',
  ogDescription: '五绝七绝五律七律标准谱对照，普通话平仄标注、入声提示、押韵粘对检查。',
  ogUrl: 'https://www.util.cn/tools/tone-pattern-checker',
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
          name: '律诗平仄检查器',
          url: 'https://www.util.cn/tools/tone-pattern-checker',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '五绝/七绝/五律/七律 × 平仄起 × 首句入韵与否，共16种标准谱',
            '逐字普通话声调标注（一二声平、三四声仄、轻声按平）',
            '一三五不论、二四六分明口径，偶数位失谱标红',
            '常见中古入声字表，普通话平声入声字黄标提示',
            '简化押韵检查（韵基比对）与粘对检查',
            '三平尾与孤平基础告警'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '律诗平仄检查器', item: 'https://www.util.cn/tools/tone-pattern-checker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '用普通话判断平仄有什么局限？',
              acceptedAnswer: { '@type': 'Answer', text: '中古入声字在普通话里派入四声，如白竹石独菊直读国今读阳平、一七八出屋黑今读阴平，按普通话都是平声而中古为仄。本工具内置常见入声字表对这类字黄标提示，严谨创作请以平水韵为准。' }
            },
            {
              '@type': 'Question',
              name: '一三五不论、二四六分明是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '七言第1、3、5字（五言第1、3字）平仄可放宽，第2、4、6字（五言2、4）为节奏点必须合谱；但一三五并非随便，改仄可能犯孤平，句末三连平犯三平尾，工具对两者都有基础告警。' }
            },
            {
              '@type': 'Question',
              name: '粘对是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '对指同联出句对句节奏点平仄相反；粘指下联出句与上联对句节奏点平仄相同。失对失粘破坏律诗声律框架，工具按二四六位逐联检查。' }
            }
          ]
        }
      ]
    })
  }]
})

/* PURE-FNS-START（纯函数区：供 node 自测提取，勿在此使用浏览器 API / Vue 响应式） */

// ---------- 字 → 拼音/声调表（3700+ 常用字，pypinyin 生成，多音字取最常见读音） ----------
// 每条记录为「汉字 + 拼音字母 + 声调数字 1-5（5 为轻声）」
const PINYIN_DATA =
  '啊a5阿a1埃ai1挨ai1哎ai1唉ai1哀ai1皑ai2癌ai2蔼ai3矮ai3艾ai4碍ai4爱ai4隘ai4鞍an1氨an1安an1俺an3按an4暗an4岸an4胺a' +
  'n4案an4肮ang1昂ang2盎ang4凹ao1敖ao2熬ao2翱ao2袄ao3傲ao4奥ao4懊ao4澳ao4芭ba1捌ba1扒ba1叭ba1吧ba5笆ba1八ba1疤ba' +
  '1巴ba1拔ba2跋ba2靶ba3把ba3耙ba4坝ba4霸ba4罢ba4爸ba4白bai2柏bai3百bai3摆bai3佰bai3败bai4拜bai4稗bai4斑ban1班b' +
  'an1搬ban1扳ban1般ban1颁ban1板ban3版ban3扮ban4拌ban4伴ban4瓣ban4半ban4办ban4绊ban4邦bang1帮bang1梆bang1榜b' +
  'ang3膀bang3绑bang3棒bang4磅bang4蚌bang4镑bang4傍bang4谤bang4苞bao1胞bao1包bao1褒bao1剥bo1薄bao2雹bao2保b' +
  'ao3堡bao3饱bao3宝bao3抱bao4报bao4暴bao4豹bao4鲍bao4爆bao4杯bei1碑bei1悲bei1卑bei1北bei3辈bei4背bei4贝bei4' +
  '钡bei4倍bei4狈bei4备bei4惫bei4焙bei4被bei4奔ben1苯ben3本ben3笨ben4崩beng1绷beng1甭beng2泵beng4蹦beng4迸be' +
  'ng4逼bi1鼻bi2比bi3鄙bi3笔bi3彼bi3碧bi4蓖bi4蔽bi4毕bi4毙bi4毖bi4币bi4庇bi4痹bi4闭bi4敝bi4弊bi4必bi4辟pi4壁bi4臂' +
  'bi4避bi4陛bi4鞭bian1边bian1编bian1贬bian3扁bian3便bian4变bian4卞bian4辨bian4辩bian4辫bian4遍bian4标biao' +
  '1彪biao1膘biao1表biao3鳖bie1憋bie1别bie2瘪bie3彬bin1斌bin1濒bin1滨bin1宾bin1摈bin4兵bing1冰bing1柄bing3丙' +
  'bing3秉bing3饼bing3炳bing3病bing4并bing4玻bo1菠bo1播bo1拨bo1钵bo1波bo1博bo2勃bo2搏bo2铂bo2箔bo2伯bo2帛bo2舶' +
  'bo2脖bo2膊bo2渤bo2泊po1驳bo2捕bu3卜bo5哺bu3补bu3埠bu4不bu4布bu4步bu4簿bu4部bu4怖bu4擦ca1猜cai1裁cai2材cai2才c' +
  'ai2财cai2睬cai3踩cai3采cai3彩cai3菜cai4蔡cai4餐can1参can1蚕can2残can2惭can2惨can3灿can4苍cang1舱cang1仓ca' +
  'ng1沧cang1藏cang2操cao1糙cao1槽cao2曹cao2草cao3厕ce4策ce4侧ce4册ce4测ce4层ceng2蹭ceng4插cha1叉cha1茬cha2茶' +
  'cha2查cha2碴cha2搽cha2察cha2岔cha4差cha4诧cha4拆chai1柴chai2豺chai2搀chan1掺can4蝉chan2馋chan2谗chan2缠c' +
  'han2铲chan3产chan3阐chan3颤chan4昌chang1猖chang1场chang3尝chang2常chang2长zhang3偿chang2肠chang2厂cha' +
  'ng3敞chang3畅chang4唱chang4倡chang4超chao1抄chao1钞chao1朝chao2嘲chao2潮chao2巢chao2吵chao3炒chao3车ch' +
  'e1扯che3撤che4掣che4彻che4澈che4郴chen1臣chen2辰chen2尘chen2晨chen2忱chen2沉chen2陈chen2趁chen4衬chen4撑' +
  'cheng1称cheng1城cheng2橙cheng2成cheng2呈cheng2乘cheng2程cheng2惩cheng2澄cheng2诚cheng2承cheng2逞chen' +
  'g3骋cheng3秤cheng4吃chi1痴chi1持chi2匙shi5池chi2迟chi2弛chi2驰chi2耻chi3齿chi3侈chi3尺chi3赤chi4翅chi4斥c' +
  'hi4炽chi4充chong1冲chong1虫chong2崇chong2宠chong3抽chou1酬chou2畴chou2踌chou2稠chou2愁chou2筹chou2仇ch' +
  'ou2绸chou2瞅chou3丑chou3臭chou4初chu1出chu1橱chu2厨chu2躇chu2锄chu2雏chu2滁chu2除chu2楚chu3础chu3储chu3矗' +
  'chu4搐chu4触chu4处chu4揣chuai1川chuan1穿chuan1椽chuan2传chuan2船chuan2喘chuan3串chuan4疮chuang1窗chua' +
  'ng1幢chuang2床chuang2闯chuang3创chuang4吹chui1炊chui1捶chui2锤chui2垂chui2春chun1椿chun1醇chun2唇chun' +
  '2淳chun2纯chun2蠢chun3戳chuo1绰chuo4疵ci1茨ci2磁ci2雌ci2辞ci2慈ci2瓷ci2词ci2此ci3刺ci4赐ci4次ci4聪cong1葱co' +
  'ng1囱cong1匆cong1从cong2丛cong2凑cou4粗cu1醋cu4簇cu4促cu4蹿cuan1篡cuan4窜cuan4摧cui1崔cui1催cui1脆cui4瘁c' +
  'ui4粹cui4淬cui4翠cui4村cun1存cun2寸cun4磋cuo1撮cuo1搓cuo1措cuo4挫cuo4错cuo4搭da1达da2答da2瘩da1打da3大da4呆' +
  'dai1歹dai3傣dai3戴dai4带dai4殆dai4代dai4贷dai4袋dai4待dai4逮dai3怠dai4耽dan1担dan1丹dan1单dan1郸dan1掸dan' +
  '3胆dan3旦dan4氮dan4但dan4惮dan4淡dan4诞dan4弹dan4蛋dan4当dang1挡dang3党dang3荡dang4档dang4刀dao1捣dao3蹈d' +
  'ao3倒dao4岛dao3祷dao3导dao3到dao4稻dao4悼dao4道dao4盗dao4德de2得de2的de5蹬deng1灯deng1登deng1等deng3瞪den' +
  'g4凳deng4邓deng4堤di1低di1滴di1迪di2敌di2笛di2狄di2涤di2翟di2嫡di2抵di3底di3地di4蒂di4第di4帝di4弟di4递di4缔d' +
  'i4颠dian1掂dian1滇dian1碘dian3点dian3典dian3靛dian4垫dian4电dian4佃dian4甸dian1店dian4惦dian4奠dian4淀d' +
  'ian4殿dian4碉diao1叼diao1雕diao1凋diao1刁diao1掉diao4吊diao4钓diao4调diao4跌die1爹die1碟die2蝶die2迭die' +
  '2谍die2叠die2丁ding1盯ding1叮ding1钉ding1顶ding3鼎ding3锭ding4定ding4订ding4丢diu1东dong1冬dong1董dong3' +
  '懂dong3动dong4栋dong4侗dong4恫dong4冻dong4洞dong4兜dou1抖dou3斗dou4陡dou3豆dou4逗dou4痘dou4都dou1督du1毒d' +
  'u2犊du2独du2读du2堵du3睹du3赌du3杜du4镀du4肚du4度du4渡du4妒du4端duan1短duan3锻duan4段duan4断duan4缎duan4堆d' +
  'ui1兑dui4队dui4对dui4墩dun1吨dun1蹲dun1敦dun1顿dun4囤dun4钝dun4盾dun4遁dun4掇duo1哆duo1多duo1夺duo2垛duo3' +
  '躲duo3朵duo3跺duo4舵duo4剁duo4惰duo4堕duo4蛾e2峨e2鹅e2俄e2额e2讹e2娥e2恶e4厄e4扼e4遏e4鄂e4饿e4恩en1而er2儿er2耳e' +
  'r3尔er3饵er3洱er3二er4贰er4发fa1罚fa2筏fa2伐fa2乏fa2阀fa2法fa3珐fa4藩fan1帆fan1番fan1翻fan1樊fan2矾fan2钒fan' +
  '2繁fan2凡fan2烦fan2反fan3返fan3范fan4贩fan4犯fan4饭fan4泛fan4坊fang1芳fang1方fang1肪fang2房fang2防fang2妨' +
  'fang2仿fang3访fang3纺fang3放fang4菲fei1非fei1啡fei1飞fei1肥fei2匪fei3诽fei3吠fei4肺fei4废fei4沸fei4费fei' +
  '4芬fen1酚fen1吩fen1氛fen1分fen1纷fen1坟fen2焚fen2汾fen2粉fen3奋fen4份fen4忿fen4愤fen4粪fen4丰feng1封feng1' +
  '枫feng1蜂feng1峰feng1锋feng1风feng1疯feng1烽feng1逢feng2冯feng2缝feng4讽feng3奉feng4凤feng4佛fu2否fou3夫' +
  'fu1敷fu1肤fu1孵fu1扶fu2拂fu2辐fu2幅fu2氟fu2符fu2伏fu2俘fu2服fu2浮fu2涪fu2福fu2袱fu2弗fu2甫fu3抚fu3辅fu3俯fu3釜' +
  'fu3斧fu3脯pu2腑fu3府fu3腐fu3赴fu4副fu4覆fu4赋fu4复fu4傅fu4付fu4阜fu4父fu4腹fu4负fu4富fu4讣fu4附fu4妇fu4缚fu4咐' +
  'fu4噶ga2嘎ga1该gai1改gai3概gai4钙gai4盖gai4溉gai4干gan4甘gan1杆gan1柑gan1竿gan1肝gan1赶gan3感gan3秆gan3敢g' +
  'an3赣gan4冈gang1刚gang1钢gang1缸gang1肛gang1纲gang1岗gang3港gang3杠gang1篙gao1皋gao1高gao1膏gao1羔gao1糕' +
  'gao1搞gao3镐gao3稿gao3告gao4哥ge1歌ge1搁ge1戈ge1鸽ge1胳ge1疙ge1割ge1革ge2葛ge2格ge2蛤ha2阁ge2隔ge2铬ge4个ge4' +
  '各ge4给gei3根gen1跟gen1耕geng1更geng4庚geng1羹geng1埂geng3耿geng3梗geng3工gong1攻gong1功gong1恭gong1龚go' +
  'ng1供gong1躬gong1公gong1宫gong1弓gong1巩gong3汞gong3拱gong3贡gong4共gong4钩gou1勾gou1沟gou1苟gou3狗gou3' +
  '垢gou4构gou4购gou4够gou4辜gu1菇gu1咕gu1箍gu1估gu1沽gu1孤gu1姑gu1鼓gu3古gu3蛊gu3骨gu3谷gu3股gu3故gu4顾gu4固gu4' +
  '雇gu4刮gua1瓜gua1剐gua3寡gua3挂gua4褂gua4乖guai1拐guai3怪guai4棺guan1关guan1官guan1冠guan1观guan1管guan3' +
  '馆guan3罐guan4惯guan4灌guan4贯guan4光guang1广guang3逛guang4瑰gui1规gui1圭gui1硅gui1归gui1龟gui1闺gui1轨g' +
  'ui3鬼gui3诡gui3癸gui3桂gui4柜gui4跪gui4贵gui4刽gui4辊gun3滚gun3棍gun4锅guo1郭guo1国guo2果guo3裹guo3过guo4' +
  '哈ha1骸hai2孩hai2海hai3氦hai4亥hai4害hai4骇hai4酣han1憨han1邯han2韩han2含han2涵han2寒han2函han2喊han3罕han' +
  '3翰han4撼han4捍han4旱han4憾han4悍han4焊han4汗han4汉han4夯hang1杭hang2航hang2壕hao2嚎hao2豪hao2毫hao2郝hao' +
  '3好hao3耗hao4号hao4浩hao4呵he1喝he1荷he2菏he2核he2禾he2和he2何he2合he2盒he2貉hao2阂he2河he2涸he2赫he4褐he4鹤h' +
  'e4贺he4嘿hei1黑hei1痕hen2很hen3狠hen3恨hen4哼heng1亨heng1横heng2衡heng2恒heng2轰hong1哄hong3烘hong1虹hon' +
  'g2鸿hong2洪hong2宏hong2弘hong2红hong2喉hou2侯hou2猴hou2吼hou3厚hou4候hou4后hou4呼hu1乎hu1忽hu1瑚hu2壶hu2葫' +
  'hu2胡hu2蝴hu2狐hu2糊hu2湖hu2弧hu2虎hu3唬hu3护hu4互hu4沪hu4户hu4花hua1哗hua1华hua2猾hua2滑hua2画hua4划hua4化h' +
  'ua4话hua4槐huai2徊huai2怀huai2淮huai2坏huai4欢huan1环huan2桓huan2还hai2缓huan3换huan4患huan4唤huan4痪hu' +
  'an4豢huan4焕huan4涣huan4宦huan4幻huan4荒huang1慌huang1黄huang2磺huang2蝗huang2簧huang2皇huang2凰huang' +
  '2惶huang2煌huang2晃huang3幌huang3恍huang3谎huang3灰hui1挥hui1辉hui1徽hui1恢hui1蛔hui2回hui2毁hui3悔hui3' +
  '慧hui4卉hui4惠hui4晦hui4贿hui4秽hui4会hui4烩hui4汇hui4讳hui4诲hui4绘hui4荤hun1昏hun1婚hun1魂hun2浑hun2混hu' +
  'n4豁huo1活huo2伙huo3火huo3获huo4或huo4惑huo4霍huo4货huo4祸huo4击ji1圾ji1基ji1机ji1畸ji1稽ji1积ji1箕ji1肌ji1' +
  '饥ji1迹ji4激ji1讥ji1鸡ji1姬ji1绩ji4缉ji1吉ji2极ji2棘ji2辑ji2籍ji2集ji2及ji2急ji2疾ji2汲ji2即ji2嫉ji2级ji2挤ji3' +
  '几ji3脊ji2己ji3蓟ji4技ji4冀ji4季ji4伎ji4祭ji4剂ji4悸ji4济ji4寄ji4寂ji4计ji4记ji4既ji4忌ji4际ji4妓ji4继ji4纪ji4' +
  '嘉jia1枷jia1夹jia1佳jia1家jia1加jia1荚jia2颊jia2贾jia3甲jia3钾jia3假jia3稼jia4价jia4架jia4驾jia4嫁jia4歼ji' +
  'an1监jian1坚jian1尖jian1笺jian1间jian1煎jian1兼jian1肩jian1艰jian1奸jian1缄jian1茧jian3检jian3柬jian3碱' +
  'jian3硷jian3拣jian3捡jian3简jian3俭jian3剪jian3减jian3荐jian4槛kan3鉴jian4践jian4贱jian4见jian4键jian4' +
  '箭jian4件jian4健jian4舰jian4剑jian4饯jian4渐jian4溅jian4涧jian4建jian4僵jiang1姜jiang1将jiang1浆jiang1' +
  '江jiang1疆jiang1蒋jiang3桨jiang3奖jiang3讲jiang3匠jiang4酱jiang4降jiang4蕉jiao1椒jiao1礁jiao1焦jiao1胶' +
  'jiao1交jiao1郊jiao1浇jiao1骄jiao1娇jiao1嚼jue2搅jiao3铰jiao3矫jiao3侥jiao3脚jiao3狡jiao3角jiao3饺jiao3' +
  '缴jiao3绞jiao3剿jiao3教jiao4酵jiao4轿jiao4较jiao4叫jiao4窖jiao4揭jie1接jie1皆jie1秸jie1街jie1阶jie1截jie' +
  '2劫jie2节jie2桔ju2杰jie2捷jie2睫jie2竭jie2洁jie2结jie2解jie3姐jie3戒jie4藉ji2芥jie4界jie4借jie4介jie4疥jie' +
  '4诫jie4届jie4巾jin1筋jin1斤jin1金jin1今jin1津jin1襟jin1紧jin3锦jin3仅jin3谨jin3进jin4靳jin4晋jin4禁jin4近j' +
  'in4烬jin4浸jin4尽jin3劲jin4荆jing1兢jing1茎jing1睛jing1晶jing1鲸jing1京jing1惊jing1精jing1粳jing1经jing' +
  '1井jing3警jing3景jing3颈jing3静jing4境jing4敬jing4镜jing4径jing4痉jing4靖jing4竟jing4竞jing4净jing4炯ji' +
  'ong3窘jiong3揪jiu1究jiu1纠jiu1玖jiu3韭jiu3久jiu3灸jiu3九jiu3酒jiu3厩jiu4救jiu4旧jiu4臼jiu4舅jiu4咎jiu4就j' +
  'iu4疚jiu4鞠ju1拘ju1狙ju1疽ju1居ju1驹ju1菊ju2局ju2咀ju3矩ju3举ju3沮ju3聚ju4拒ju4据ju4巨ju4具ju4距ju4踞ju4锯ju4' +
  '俱ju4句ju4惧ju4炬ju4剧ju4捐juan1鹃juan1娟juan1倦juan4眷juan4卷juan3绢juan4撅jue1攫jue2抉jue2掘jue2倔jue2爵' +
  'jue2觉jue2决jue2诀jue2绝jue2均jun1菌jun1钧jun1军jun1君jun1峻jun4俊jun4竣jun4浚jun4郡jun4骏jun4喀ka1咖ka1卡' +
  'ka3咯ge1开kai1揩kai1楷kai3凯kai3慨kai3刊kan1堪kan1勘kan1坎kan3砍kan3看kan4康kang1慷kang1糠kang1扛kang2抗k' +
  'ang4亢kang4炕kang4考kao3拷kao3烤kao3靠kao4坷ke3苛ke1柯ke1棵ke1磕ke1颗ke1科ke1壳ke2咳ke2可ke3渴ke3克ke4刻ke4' +
  '客ke4课ke4肯ken3啃ken3垦ken3恳ken3坑keng1吭keng1空kong1恐kong3孔kong3控kong4抠kou1口kou3扣kou4寇kou4枯ku1' +
  '哭ku1窟ku1苦ku3酷ku4库ku4裤ku4夸kua1垮kua3挎kua4跨kua4胯kua4块kuai4筷kuai4侩kuai4快kuai4宽kuan1款kuan3匡ku' +
  'ang1筐kuang1狂kuang2框kuang1矿kuang4眶kuang4旷kuang4况kuang4亏kui1盔kui1岿kui1窥kui1葵kui2奎kui2魁kui2' +
  '傀gui1馈kui4愧kui4溃kui4坤kun1昆kun1捆kun3困kun4括kuo4扩kuo4廓kuo4阔kuo4垃la1拉la1喇la3蜡la4腊la4辣la4啦la5' +
  '莱lai2来lai2赖lai4蓝lan2婪lan2栏lan2拦lan2篮lan2阑lan2兰lan2澜lan2谰lan2揽lan3览lan3懒lan3缆lan3烂lan4滥la' +
  'n4琅lang2榔lang2狼lang2廊lang2郎lang2朗lang3浪lang4捞lao1劳lao2牢lao2老lao3佬lao3姥lao3酪lao4烙lao4涝lao' +
  '4勒lei1乐le4雷lei2镭lei2蕾lei3磊lei3累lei4儡lei3垒lei3擂lei2肋le1类lei4泪lei4棱leng2楞leng2冷leng3厘li2梨l' +
  'i2犁li2黎li2篱li2狸li2离li2漓li2理li3李li3里li3鲤li3礼li3莉li4荔li4吏li4栗li4丽li4厉li4励li4砾li4历li4利li4傈l' +
  'i4例li4俐li4痢li4立li4粒li4沥li4隶li4力li4璃li2哩li1俩lia3联lian2莲lian2连lian2镰lian2廉lian2怜lian2涟lian' +
  '2帘lian2敛lian3脸lian3链lian4恋lian4炼lian4练lian4粮liang2凉liang2梁liang2粱liang2良liang2两liang3辆li' +
  'ang4量liang4晾liang4亮liang4谅liang4撩liao1聊liao2僚liao2疗liao2燎liao2寥liao2辽liao2潦lao3了le5撂liao' +
  '4镣liao4廖liao4料liao4列lie4裂lie4烈lie4劣lie4猎lie4琳lin2林lin2磷lin2霖lin2临lin2邻lin2鳞lin2淋lin2凛lin' +
  '3赁lin4吝lin4拎lin1玲ling2菱ling2零ling2龄ling2铃ling2伶ling2羚ling2凌ling2灵ling2陵ling2岭ling3领ling3' +
  '另ling4令ling4溜liu1琉liu2榴liu2硫liu2馏liu2留liu2刘liu2瘤liu2流liu2柳liu3六liu4龙long2聋long2咙long2笼lo' +
  'ng2窿long2隆long2垄long3拢long3陇long3楼lou2娄lou2搂lou3篓lou3漏lou4陋lou4芦lu2卢lu2颅lu2庐lu2炉lu2掳lu3卤' +
  'lu3虏lu3鲁lu3麓lu4碌lu4露lu4路lu4赂lu4鹿lu4潞lu4禄lu4录lu4陆lu4戮lu4驴lü2吕lü3铝lü3侣lü3旅lü3履lü3屡lü3缕lü3虑' +
  'lü4氯lü4律lü4率lü4滤lü4绿lü4峦luan2挛luan2孪luan2滦luan2卵luan3乱luan4掠lüe4略lüe4抡lun1轮lun2伦lun2仑lun' +
  '2沦lun2纶lun2论lun4萝luo2螺luo2罗luo2逻luo2锣luo2箩luo2骡luo2裸luo3落luo4洛luo4骆luo4络luo4妈ma1麻ma2玛ma3' +
  '码ma3蚂ma3马ma3骂ma4嘛ma5吗ma5埋mai2买mai3麦mai4卖mai4迈mai4脉mai4瞒man2馒man2蛮man2满man3蔓man4曼man4慢man' +
  '4漫man4谩man2芒mang2茫mang2盲mang2氓mang2忙mang2莽mang3猫mao1茅mao2锚mao2毛mao2矛mao2铆mao3卯mao3茂mao4冒' +
  'mao4帽mao4貌mao4贸mao4么me5玫mei2枚mei2梅mei2酶mei2霉mei2煤mei2没mei2眉mei2媒mei2镁mei3每mei3美mei3昧mei4' +
  '寐mei4妹mei4媚mei4门men2闷men4们men5萌meng2蒙meng2檬meng2盟meng2锰meng3猛meng3梦meng4孟meng4眯mi1醚mi2靡m' +
  'i2糜mi2迷mi2谜mi2弥mi2米mi3秘mi4觅mi4泌mi4蜜mi4密mi4幂mi4棉mian2眠mian2绵mian2冕mian3免mian3勉mian3娩mian3' +
  '缅mian3面mian4苗miao2描miao2瞄miao2藐miao3秒miao3渺miao3庙miao4妙miao4蔑mie4灭mie4民min2抿min3皿min3敏mi' +
  'n3悯min3闽min3明ming2螟ming2鸣ming2铭ming2名ming2命ming4谬miu4摸mo1摹mo2蘑mo2模mo2膜mo2磨mo2摩mo2魔mo2抹mo' +
  '3末mo4莫mo4墨mo4默mo4沫mo4漠mo4寞mo4陌mo4谋mou2牟mou2某mou3拇mu3牡mu3亩mu3姆mu3母mu3墓mu4暮mu4幕mu4募mu4慕mu4' +
  '木mu4目mu4睦mu4牧mu4穆mu4拿na2哪na3呐na4钠na4那na4娜na4纳na4氖nai3乃nai3奶nai3耐nai4奈nai4南nan2男nan2难nan2' +
  '囊nang2挠nao2脑nao3恼nao3闹nao4淖nao4呢ne5馁nei3内nei4嫩nen4能neng2妮ni1霓ni2倪ni2泥ni2尼ni2拟ni3你ni3匿ni4' +
  '腻ni4逆ni4溺ni4蔫nian1拈nian1年nian2碾nian3撵nian3捻nian3念nian4娘niang2酿niang4鸟niao3尿niao4捏nie1聂ni' +
  'e4孽nie4啮nie4镊nie4镍nie4涅nie4您nin2柠ning2狞ning2凝ning2宁ning2拧ning2泞ning4牛niu2扭niu3钮niu3纽niu3' +
  '脓nong2浓nong2农nong2弄nong4奴nu2努nu3怒nu4女nü3暖nuan3虐nüe4疟nüe4挪nuo2懦nuo4糯nuo4诺nuo4哦o2欧ou1鸥ou1殴' +
  'ou1藕ou3呕ou3偶ou3沤ou1啪pa1趴pa1爬pa2帕pa4怕pa4琶pa2拍pai1排pai2牌pai2徘pai2湃pai4派pai4攀pan1潘pan1盘pan2' +
  '磐pan2盼pan4畔pan4判pan4叛pan4乓pang1庞pang2旁pang2耪pang3胖pang4抛pao1咆pao2刨pao2炮pao4袍pao2跑pao3泡pa' +
  'o4呸pei1胚pei1培pei2裴pei2赔pei2陪pei2配pei4佩pei4沛pei4喷pen1盆pen2砰peng1抨peng1烹peng1澎peng1彭peng2蓬' +
  'peng2棚peng2硼peng2篷peng2膨peng2朋peng2鹏peng2捧peng3碰peng4坯pi1砒pi1霹pi1批pi1披pi1劈pi1琵pi2毗pi2啤pi' +
  '2脾pi2疲pi2皮pi2匹pi3痞pi3僻pi4屁pi4譬pi4篇pian1偏pian1片pian4骗pian4飘piao1漂piao1瓢piao2票piao4撇pie1瞥p' +
  'ie1拼pin1频pin2贫pin2品pin3聘pin4乒ping1坪ping2苹ping2萍ping2平ping2凭ping2瓶ping2评ping2屏ping2坡po1泼p' +
  'o1颇po3婆po2破po4魄po4迫po4粕po4剖pou1扑pu1铺pu4仆pu1莆pu2葡pu2菩pu2蒲pu2埔pu3朴pu3圃pu3普pu3浦pu3谱pu3曝pu4瀑' +
  'pu4期qi1欺qi1栖qi1戚qi1妻qi1七qi1凄qi1漆qi1柒qi1沏qi1其qi2棋qi2奇qi2歧qi2畦qi2崎qi2脐qi2齐qi2旗qi2祈qi2祁qi2骑' +
  'qi2起qi3岂qi3乞qi3企qi3启qi3契qi4砌qi4器qi4气qi4迄qi4弃qi4汽qi4泣qi4讫qi4掐qia1恰qia4洽qia4牵qian1扦qian1钎q' +
  'ian1铅qian1千qian1迁qian1签qian1仟qian1谦qian1乾qian2黔qian2钱qian2钳qian2前qian2潜qian2遣qian3浅qian3' +
  '谴qian3堑qian4嵌qian4欠qian4歉qian4枪qiang1呛qiang1腔qiang1羌qiang1墙qiang2蔷qiang2强qiang2抢qiang3橇q' +
  'iao1锹qiao1敲qiao1悄qiao1桥qiao2瞧qiao2乔qiao2侨qiao2巧qiao3鞘qiao4撬qiao4翘qiao4峭qiao4俏qiao4窍qiao4' +
  '切qie4茄jia1且qie3怯qie4窃qie4钦qin1侵qin1亲qin1秦qin2琴qin2勤qin2芹qin2擒qin2禽qin2寝qin3沁qin4青qing1轻q' +
  'ing1氢qing1倾qing1卿qing1清qing1擎qing2晴qing2氰qing2情qing2顷qing3请qing3庆qing4琼qiong2穷qiong2秋qiu' +
  '1丘qiu1邱qiu1球qiu2求qiu2囚qiu2酋qiu2泅qiu2趋qu1区qu1蛆qu1曲qu1躯qu1屈qu1驱qu1渠qu2取qu3娶qu3龋qu3趣qu4去qu4' +
  '圈quan1颧quan2权quan2醛quan2泉quan2全quan2痊quan2拳quan2犬quan3券quan4劝quan4缺que1炔gui4瘸que2却que4鹊q' +
  'ue4榷que4确que4雀que4裙qun2群qun2然ran2燃ran2冉ran3染ran3瓤rang2壤rang3攘rang3嚷rang3让rang4饶rao2扰rao3' +
  '绕rao4惹re3热re4壬ren2仁ren2人ren2忍ren3韧ren4任ren4认ren4刃ren4妊ren4纫ren4扔reng1仍reng2日ri4戎rong2茸ro' +
  'ng1蓉rong2荣rong2融rong2熔rong2溶rong2容rong2绒rong2冗rong3揉rou2柔rou2肉rou4茹ru2蠕ru2儒ru2孺ru2如ru2辱r' +
  'u3乳ru3汝ru3入ru4褥ru4软ruan3阮ruan3蕊rui3瑞rui4锐rui4闰run4润run4若ruo4弱ruo4撒sa1洒sa3萨sa4腮sai1鳃sai1塞' +
  'sai1赛sai4三san1叁san1伞san3散san4桑sang1嗓sang3丧sang4搔sao1骚sao1扫sao3嫂sao3瑟se4色se4涩se4森sen1僧sen' +
  'g1莎sha1砂sha1杀sha1刹sha1沙sha1纱sha1傻sha3啥sha2煞sha1筛shai1晒shai4珊shan1苫shan1杉shan1山shan1删shan' +
  '1煽shan1衫shan1闪shan3陕shan3擅shan4赡shan4膳shan4善shan4汕shan4扇shan4缮shan4墒shang1伤shang1商shang1' +
  '赏shang3晌shang3上shang4尚shang4裳shang5梢shao1捎shao1稍shao1烧shao1芍shao2勺shao2韶shao2少shao3哨shao' +
  '4邵shao4绍shao4奢she1赊she1蛇she2舌she2舍she3赦she4摄she4射she4慑she4涉she4社she4设she4砷shen1申shen1呻sh' +
  'en1伸shen1身shen1深shen1娠shen1绅shen1神shen2沈shen3审shen3婶shen3甚shen4肾shen4慎shen4渗shen4声sheng1' +
  '生sheng1甥sheng1牲sheng1升sheng1绳sheng2省sheng3盛sheng4剩sheng4胜sheng4圣sheng4师shi1失shi1狮shi1施sh' +
  'i1湿shi1诗shi1尸shi1虱shi1十shi2石shi2拾shi2时shi2什shen2食shi2蚀shi2实shi2识shi2史shi3矢shi3使shi3屎shi3' +
  '驶shi3始shi3式shi4示shi4士shi4世shi4柿shi4事shi4拭shi4誓shi4逝shi4势shi4是shi4嗜shi4噬shi4适shi4仕shi4侍sh' +
  'i4释shi4饰shi4氏shi4市shi4恃shi4室shi4视shi4试shi4收shou1手shou3首shou3守shou3寿shou4授shou4售shou4受sho' +
  'u4瘦shou4兽shou4蔬shu1枢shu1梳shu1殊shu1抒shu1输shu1叔shu1舒shu1淑shu1疏shu1书shu1赎shu2孰shu2熟shu2薯shu' +
  '3暑shu3曙shu3署shu3蜀shu3黍shu3鼠shu3属shu3术shu4述shu4树shu4束shu4戍shu4竖shu4墅shu4庶shu4数shu4漱shu4恕s' +
  'hu4刷shua1耍shua3摔shuai1衰shuai1甩shuai3帅shuai4栓shuan1拴shuan1霜shuang1双shuang1爽shuang3谁shui2水' +
  'shui3睡shui4税shui4吮shun3瞬shun4顺shun4舜shun4说shuo1硕shuo4朔shuo4烁shuo4斯si1撕si1嘶si1思si1私si1司si' +
  '1丝si1死si3肆si4寺si4嗣si4四si4伺ci4似shi4饲si4巳si4松song1耸song3怂song3颂song4送song4宋song4讼song4诵son' +
  'g4搜sou1艘sou1擞sou3嗽sou4苏su1酥su1俗su2素su4速su4粟su4僳su4塑su4溯su4宿su4诉su4肃su4酸suan1蒜suan4算suan4' +
  '虽sui1隋sui2随sui2绥sui2髓sui3碎sui4岁sui4穗sui4遂sui4隧sui4祟sui4孙sun1损sun3笋sun3蓑suo1梭suo1唆suo1缩su' +
  'o1琐suo3索suo3锁suo3所suo3塌ta1他ta1它ta1她ta1塔ta3獭ta3挞ta4蹋ta4踏ta4胎tai1苔tai2抬tai2台tai2泰tai4酞tai4' +
  '太tai4态tai4汰tai4坍tan1摊tan1贪tan1瘫tan1滩tan1坛tan2檀tan2痰tan2潭tan2谭tan2谈tan2坦tan3毯tan3袒tan3碳ta' +
  'n4探tan4叹tan4炭tan4汤tang1塘tang2搪tang2堂tang2棠tang2膛tang2唐tang2糖tang2倘tang3躺tang3淌tang3趟tang' +
  '4烫tang4掏tao1涛tao1滔tao1绦tao1萄tao2桃tao2逃tao2淘tao2陶tao2讨tao3套tao4特te4藤teng2腾teng2疼teng2誊ten' +
  'g2梯ti1剔ti1踢ti1锑ti1提ti2题ti2蹄ti2啼ti2体ti3替ti4嚏ti4惕ti4涕ti4剃ti4屉ti4天tian1添tian1填tian2田tian2甜t' +
  'ian2恬tian2舔tian3腆tian3挑tiao1条tiao2迢tiao2眺tiao4跳tiao4贴tie1铁tie3帖tie1厅ting1听ting1烃ting1汀ti' +
  'ng1廷ting2停ting2亭ting2庭ting2挺ting3艇ting3通tong1桐tong2酮tong2瞳tong2同tong2铜tong2彤tong2童tong2桶' +
  'tong3捅tong3筒tong3统tong3痛tong4偷tou1投tou2头tou2透tou4凸tu1秃tu1突tu1图tu2徒tu2途tu2涂tu2屠tu2土tu3吐tu' +
  '3兔tu4湍tuan1团tuan2推tui1颓tui2腿tui3蜕tui4褪tui4退tui4吞tun1屯tun2臀tun2拖tuo1托tuo1脱tuo1鸵tuo2陀tuo2驮' +
  'tuo2驼tuo2椭tuo3妥tuo3拓tuo4唾tuo4挖wa1哇wa5蛙wa1洼wa1娃wa2瓦wa3袜wa4歪wai1外wai4豌wan1弯wan1湾wan1玩wan2顽' +
  'wan2丸wan2烷wan2完wan2碗wan3挽wan3晚wan3皖wan3惋wan3宛wan3婉wan3万wan4腕wan4汪wang1王wang2亡wang2枉wang3' +
  '网wang3往wang3旺wang4望wang4忘wang4妄wang4威wei1巍wei1微wei1危wei1韦wei2违wei2桅wei2围wei2唯wei2惟wei2为w' +
  'ei4潍wei2维wei2苇wei3萎wei1委wei3伟wei3伪wei3尾wei3纬wei3未wei4蔚wei4味wei4畏wei4胃wei4喂wei4魏wei4位wei4' +
  '渭wei4谓wei4尉wei4慰wei4卫wei4瘟wen1温wen1蚊wen2文wen2闻wen2纹wen2吻wen3稳wen3紊wen3问wen4嗡weng1翁weng1瓮' +
  'weng4挝wo1蜗wo1涡wo1窝wo1我wo3斡wo4卧wo4握wo4沃wo4巫wu1呜wu1钨wu1乌wu1污wu1诬wu1屋wu1无wu2芜wu2梧wu2吾wu2吴wu' +
  '2毋wu2武wu3五wu3捂wu3午wu3舞wu3伍wu3侮wu3坞wu4戊wu4雾wu4晤wu4物wu4勿wu4务wu4悟wu4误wu4昔xi1熙xi1析xi1西xi1硒xi' +
  '1矽xi4晰xi1嘻xi1吸xi1锡xi1牺xi1稀xi1息xi1希xi1悉xi1膝xi1夕xi1惜xi1熄xi1烯xi1溪xi1汐xi1犀xi1檄xi2袭xi2席xi2习xi' +
  '2媳xi2喜xi3铣xi3洗xi3系xi4隙xi4戏xi4细xi4瞎xia1虾xia1匣xia2霞xia2辖xia2暇xia2峡xia2侠xia2狭xia2下xia4厦sha4' +
  '夏xia4吓xia4掀xian1锨xian1先xian1仙xian1鲜xian1纤xian1咸xian2贤xian2衔xian2舷xian2闲xian2涎xian2弦xian2' +
  '嫌xian2显xian3险xian3现xian4献xian4县xian4腺xian4馅xian4羡xian4宪xian4陷xian4限xian4线xian4相xiang1厢xi' +
  'ang1镶xiang1香xiang1箱xiang1襄xiang1湘xiang1乡xiang1翔xiang2祥xiang2详xiang2想xiang3响xiang3享xiang3' +
  '项xiang4巷xiang4橡xiang4像xiang4向xiang4象xiang4萧xiao1硝xiao1霄xiao1削xue1哮xiao1嚣xiao1销xiao1消xiao' +
  '1宵xiao1淆xiao2晓xiao3小xiao3孝xiao4校xiao4肖xiao4啸xiao4笑xiao4效xiao4楔xie1些xie1歇xie1蝎xie1鞋xie2协x' +
  'ie2挟xie2携xie2邪xie2斜xie2胁xie2谐xie2写xie3械xie4卸xie4蟹xie4懈xie4泄xie4泻xie4谢xie4屑xie4薪xin1芯xin1' +
  '锌xin1欣xin1辛xin1新xin1忻xin1心xin1信xin4衅xin4星xing1腥xing1猩xing1惺xing1兴xing1刑xing2型xing2形xing2' +
  '邢xing2行xing2醒xing3幸xing4杏xing4性xing4姓xing4兄xiong1凶xiong1胸xiong1匈xiong1汹xiong1雄xiong2熊xio' +
  'ng2休xiu1修xiu1羞xiu1朽xiu3嗅xiu4锈xiu4秀xiu4袖xiu4绣xiu4墟xu1戌xu1需xu1虚xu1嘘xu1须xu1徐xu2许xu3蓄xu4酗xu4' +
  '叙xu4旭xu4序xu4畜chu4恤xu4絮xu4婿xu4绪xu4续xu4轩xuan1喧xuan1宣xuan1悬xuan2旋xuan2玄xuan2选xuan3癣xuan3眩xu' +
  'an4绚xuan4靴xue1薛xue1学xue2穴xue2雪xue3血xue4勋xun1熏xun1循xun2旬xun2询xun2寻xun2驯xun4巡xun2殉xun4汛xun' +
  '4训xun4讯xun4逊xun4迅xun4压ya1押ya1鸦ya1鸭ya1呀ya5丫ya1芽ya2牙ya2蚜ya2崖ya2衙ya2涯ya2雅ya3哑ya3亚ya4讶ya4焉ya' +
  'n1咽yan4阉yan1烟yan1淹yan1盐yan2严yan2研yan2蜒yan2岩yan2延yan2言yan2颜yan2阎yan2炎yan2沿yan2奄yan3掩yan3眼' +
  'yan3衍yan3演yan3艳yan4堰yan4燕yan4厌yan4砚yan4雁yan4唁yan4彦yan4焰yan4宴yan4谚yan4验yan4殃yang1央yang1鸯y' +
  'ang1秧yang1杨yang2扬yang2佯yang2疡yang2羊yang2洋yang2阳yang2氧yang3仰yang3痒yang3养yang3样yang4漾yang4' +
  '邀yao1腰yao1妖yao1瑶yao2摇yao2尧yao2遥yao2窑yao2谣yao2姚yao2咬yao3舀yao3药yao4要yao4耀yao4椰ye1噎ye1耶ye2爷' +
  'ye2野ye3冶ye3也ye3页ye4掖ye1业ye4叶ye4曳ye4腋ye4夜ye4液ye4一yi1壹yi1医yi1揖yi1铱yi1依yi1伊yi1衣yi1颐yi2夷yi2遗' +
  'yi2移yi2仪yi2胰yi2疑yi2沂yi2宜yi2姨yi2彝yi2椅yi3蚁yi3倚yi3已yi3乙yi3矣yi3以yi3艺yi4抑yi4易yi4邑yi4屹yi4亿yi4役' +
  'yi4臆yi4逸yi4肄yi4疫yi4亦yi4裔yi4意yi4毅yi4忆yi4义yi4益yi4溢yi4诣yi4议yi4谊yi4译yi4异yi4翼yi4翌yi4绎yi4茵yin1' +
  '荫yin1因yin1殷yin1音yin1阴yin1姻yin1吟yin2银yin2淫yin2寅yin2饮yin3尹yin3引yin3隐yin3印yin4英ying1樱ying1婴' +
  'ying1鹰ying1应ying1缨ying1莹ying2萤ying2营ying2荧ying2蝇ying2迎ying2赢ying2盈ying2影ying3颖ying3硬ying' +
  '4映ying4哟yo1拥yong1佣yong1臃yong1痈yong1庸yong1雍yong1踊yong3蛹yong3咏yong3泳yong3涌yong3永yong3恿yong' +
  '3勇yong3用yong4幽you1优you1悠you1忧you1尤you2由you2邮you2铀you2犹you2油you2游you2酉you3有you3友you3右you4' +
  '佑you4釉you4诱you4又you4幼you4迂yu1淤yu1于yu2盂yu2榆yu2虞yu2愚yu2舆yu2余yu2俞yu2逾yu2鱼yu2愉yu2渝yu2渔yu2隅yu' +
  '2予yu3娱yu2雨yu3与yu3屿yu3禹yu3宇yu3语yu3羽yu3玉yu4域yu4芋yu4郁yu4吁xu1遇yu4喻yu4峪yu4御yu4愈yu4欲yu4狱yu4育yu' +
  '4誉yu4浴yu4寓yu4裕yu4预yu4豫yu4驭yu4鸳yuan1渊yuan1冤yuan1元yuan2垣yuan2袁yuan2原yuan2援yuan2辕yuan2园yuan' +
  '2员yuan2圆yuan2猿yuan2源yuan2缘yuan2远yuan3苑yuan4愿yuan4怨yuan4院yuan4曰yue1约yue1越yue4跃yue4钥yao4岳y' +
  'ue4粤yue4月yue4悦yue4阅yue4耘yun2云yun2郧yun2匀yun2陨yun3允yun3运yun4蕴yun4酝yun4晕yun1韵yun4孕yun4匝za1砸' +
  'za2杂za2栽zai1哉zai1灾zai1宰zai3载zai4再zai4在zai4咱zan2攒zan3暂zan4赞zan4赃zang1脏zang4葬zang4遭zao1糟za' +
  'o1凿zao2藻zao3枣zao3早zao3澡zao3蚤zao3躁zao4噪zao4造zao4皂zao4灶zao4燥zao4责ze2择ze2则ze2泽ze2贼zei2怎zen3' +
  '增zeng1憎zeng1曾ceng2赠zeng4扎zha1喳zha1渣zha1札zha2轧ya4铡zha2闸zha2眨zha3栅zha4榨zha4咋za3乍zha4炸zha4诈' +
  'zha4摘zhai1斋zhai1宅zhai2窄zhai3债zhai4寨zhai4瞻zhan1毡zhan1詹zhan1粘zhan1沾zhan1盏zhan3斩zhan3辗nian3' +
  '崭zhan3展zhan3蘸zhan4栈zhan4占zhan4战zhan4站zhan4湛zhan4绽zhan4樟zhang1章zhang1彰zhang1漳zhang1张zhang' +
  '1掌zhang3涨zhang3杖zhang4丈zhang4帐zhang4账zhang4仗zhang4胀zhang4瘴zhang4障zhang4招zhao1昭zhao1找zhao' +
  '3沼zhao3赵zhao4照zhao4罩zhao4兆zhao4肇zhao4召zhao4遮zhe1折zhe2哲zhe2蛰zhe2辙zhe2者zhe3锗zhe3蔗zhe4这zhe4' +
  '浙zhe4珍zhen1斟zhen1真zhen1甄zhen1砧zhen1臻zhen1贞zhen1针zhen1侦zhen1枕zhen3疹zhen3诊zhen3震zhen4振zhen' +
  '4镇zhen4阵zhen4蒸zheng1挣zheng1睁zheng1征zheng1狰zheng1争zheng1怔zheng1整zheng3拯zheng3正zheng4政zhen' +
  'g4帧zhen1症zheng4郑zheng4证zheng4芝zhi1枝zhi1支zhi1吱zhi1蜘zhi1知zhi1肢zhi1脂zhi1汁zhi1之zhi1织zhi1职zhi' +
  '2直zhi2植zhi2殖zhi2执zhi2值zhi2侄zhi2址zhi3指zhi3止zhi3趾zhi3只zhi3旨zhi3纸zhi3志zhi4挚zhi4掷zhi4至zhi4致z' +
  'hi4置zhi4帜zhi4峙zhi4制zhi4智zhi4秩zhi4稚zhi4质zhi4炙zhi4痔zhi4滞zhi4治zhi4窒zhi4中zhong1盅zhong1忠zhong' +
  '1钟zhong1衷zhong1终zhong1种zhong3肿zhong3重zhong4仲zhong4众zhong4舟zhou1周zhou1州zhou1洲zhou1诌zhou1粥' +
  'zhou1轴zhou2肘zhou3帚zhou3咒zhou4皱zhou4宙zhou4昼zhou4骤zhou4珠zhu1株zhu1蛛zhu1朱zhu1猪zhu1诸zhu1诛zhu1' +
  '逐zhu2竹zhu2烛zhu2煮zhu3拄zhu3瞩zhu3嘱zhu3主zhu3著zhu4柱zhu4助zhu4蛀zhu4贮zhu4铸zhu4筑zhu4住zhu4注zhu4祝zh' +
  'u4驻zhu4抓zhua1爪zhao3拽zhuai1专zhuan1砖zhuan1转zhuan3撰zhuan4赚zhuan4篆zhuan4桩zhuang1庄zhuang1装zhu' +
  'ang1妆zhuang1撞zhuang4壮zhuang4状zhuang4椎chui2锥zhui1追zhui1赘zhui4坠zhui4缀zhui4谆zhun1准zhun3捉zhu' +
  'o1拙zhuo1卓zhuo2桌zhuo1琢zuo2茁zhuo2酌zhuo2啄zhuo2着zhe5灼zhuo2浊zhuo2兹zi1咨zi1资zi1姿zi1滋zi1淄zi1孜zi1' +
  '紫zi3仔zai3籽zi3滓zi3子zi5自zi4渍zi4字zi4鬃zong1棕zong1踪zong1宗zong1综zong1总zong3纵zong4邹zou1走zou3奏zo' +
  'u4揍zou4租zu1足zu2卒zu2族zu2祖zu3诅zu3阻zu3组zu3钻zuan1纂zuan3嘴zui3醉zui4最zui4罪zui4尊zun1遵zun1昨zuo2左z' +
  'uo3佐zuo3柞zha4做zuo4作zuo4坐zuo4座zuo4戟ji3撷xie2鹂li2仄ze4';

const toneMap = new Map()
{
  const RE = /([\u3400-\u9fff])([a-zü]+)([1-5])/g
  let m
  while ((m = RE.exec(PINYIN_DATA)) !== null) {
    if (!toneMap.has(m[1])) toneMap.set(m[1], { py: m[2], tone: Number(m[3]) })
  }
}

// 常见中古入声字表（速查口径，依维基百科「入声」条目规律与「古入今平字表」两类来源交叉整理）
const RUSHENG_CHARS = '一七八十不日月出入百白柏伯北薄帛博搏黑发法罚伐乏阀佛福幅服伏拂屋物勿竹烛逐筑粥独读毒得德国菊局橘节结洁接揭急及级吉极疾集即辑直值职植执织汁只质食蚀拾实失湿石叔俗别蝶叠迭灭蔑铁贴帖列烈裂劣猎雪血穴学觉决绝掘雀鹊却曲屈缺切插擦割鸽阁格隔葛合盒泽择则责昨杂砸匝舌折哲蜜密木目牧六肉录禄鹿绿落洛络乐腊蜡辣立力历粒笠掠略突秃托脱桌捉卓啄琢浊镯酌着约跃岳悦阅越'
const RUSHENG_SET = new Set(RUSHENG_CHARS.split(''))

// 声调数字 → 平仄：一二声（与轻声）为平，三四声为仄；未收录返回 null
function toneCategoryOf(char) {
  const e = toneMap.get(char)
  if (!e) return null
  return e.tone <= 2 || e.tone === 5 ? '平' : '仄'
}

// 声调标注位置规则：a > o > e；无则 iu/ui 标在后（最后一个元音）
const TONE_MARKS = { a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè', i: 'īíǐì', u: 'ūúǔù', ü: 'ǖǘǚǜ' }
function toneMarkOf(py, tone) {
  let target = ''
  for (const v of ['a', 'o', 'e']) {
    if (py.includes(v)) { target = v; break }
  }
  if (!target) {
    for (let i = py.length - 1; i >= 0; i--) {
      const ch = py[i]
      if (ch === 'i' || ch === 'u' || ch === 'ü') { target = ch; break }
    }
  }
  if (!target || tone < 1 || tone > 4) return py
  const idx = py.lastIndexOf(target)
  return py.slice(0, idx) + TONE_MARKS[target][tone - 1] + py.slice(idx + 1)
}

// 拼音韵母（取初始辅音之后；y/w 零声母拼写还原为 i/u 开头）
function finalOf(py) {
  for (const ini of ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's']) {
    if (py.startsWith(ini) && py.length > ini.length) return py.slice(ini.length)
  }
  if (py[0] === 'y') {
    if (py === 'yi') return 'i'
    if (py.startsWith('yu')) return 'u' + py.slice(2)
    return 'i' + py.slice(1)
  }
  if (py[0] === 'w') return 'u' + py.slice(1)
  return py
}

// 韵基（简化押韵口径）：iu→ou、ui→ei 还原主元音；去介音（剩余部分须含 a/o/e）；en 组含 in/un/ün、eng 组含 ing（中华新韵宽组）
function rhymeKeyOf(char) {
  const e = toneMap.get(char)
  if (!e) return ''
  let f = finalOf(e.py)
  if (f === 'iu') f = 'ou'
  else if (f === 'ui') f = 'ei'
  if (/^[iüu]/.test(f) && /^[aeo]/.test(f.slice(1))) f = f.slice(1)
  f = f.replace(/ü/g, 'u')
  const MERGE = { in: 'en', un: 'en', ün: 'en', ing: 'eng' }
  return MERGE[f] || f
}

// 逐字标注：{char, py, toneMark, toneNum, cat(平/仄/null), rusheng, conflict(普通话平但中古入声)}
function annotateChar(char) {
  const e = toneMap.get(char)
  const cat = toneCategoryOf(char)
  const rusheng = RUSHENG_SET.has(char)
  return {
    char,
    py: e ? e.py : '',
    toneMark: e ? toneMarkOf(e.py, e.tone) : '',
    toneNum: e ? e.tone : null,
    cat,
    rusheng,
    conflict: !!(rusheng && cat === '平')
  }
}
function annotateLine(line) {
  return Array.from(String(line || '')).filter((ch) => /[\u3400-\u9fff]/.test(ch)).map(annotateChar)
}

// ---------- 16 种标准谱（依王力《诗词格律》口径逐谱录入；P 平 Z 仄 → 本表直接用「平」「仄」） ----------
const STYLES = [
  { id: 'wujue', name: '五绝', lines: 4, len: 5 },
  { id: 'qijue', name: '七绝', lines: 4, len: 7 },
  { id: 'wulu', name: '五律', lines: 8, len: 5 },
  { id: 'qilu', name: '七律', lines: 8, len: 7 }
]
const FORMS = [
  { id: 'zeqi-norhyme', name: '仄起不入韵' },
  { id: 'zeqi-rhyme', name: '仄起入韵' },
  { id: 'pingqi-norhyme', name: '平起不入韵' },
  { id: 'pingqi-rhyme', name: '平起入韵' }
]
const PATTERNS = {
  // 五绝（仄起首句不入韵为正例）
  'wujue|zeqi-norhyme': ['仄仄平平仄', '平平仄仄平', '平平平仄仄', '仄仄仄平平'],
  'wujue|zeqi-rhyme': ['仄仄仄平平', '平平仄仄平', '平平平仄仄', '仄仄仄平平'],
  'wujue|pingqi-norhyme': ['平平平仄仄', '仄仄仄平平', '仄仄平平仄', '平平仄仄平'],
  'wujue|pingqi-rhyme': ['平平仄仄平', '仄仄仄平平', '仄仄平平仄', '平平仄仄平'],
  // 七绝（平起首句入韵为正例；七言=五言句首加两字，平起加仄仄、仄起加平平）
  'qijue|pingqi-rhyme': ['平平仄仄仄平平', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平'],
  'qijue|pingqi-norhyme': ['平平仄仄平平仄', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平'],
  'qijue|zeqi-rhyme': ['仄仄平平仄仄平', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平'],
  'qijue|zeqi-norhyme': ['仄仄平平平仄仄', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平'],
  // 五律（绝句谱按粘对加倍；首句入韵式第 1、5 句换成收平韵句）
  'wulu|zeqi-norhyme': ['仄仄平平仄', '平平仄仄平', '平平平仄仄', '仄仄仄平平', '仄仄平平仄', '平平仄仄平', '平平平仄仄', '仄仄仄平平'],
  'wulu|zeqi-rhyme': ['仄仄仄平平', '平平仄仄平', '平平平仄仄', '仄仄仄平平', '仄仄仄平平', '平平仄仄平', '平平平仄仄', '仄仄仄平平'],
  'wulu|pingqi-norhyme': ['平平平仄仄', '仄仄仄平平', '仄仄平平仄', '平平仄仄平', '平平平仄仄', '仄仄仄平平', '仄仄平平仄', '平平仄仄平'],
  'wulu|pingqi-rhyme': ['平平仄仄平', '仄仄仄平平', '仄仄平平仄', '平平仄仄平', '平平仄仄平', '仄仄仄平平', '仄仄平平仄', '平平仄仄平'],
  // 七律
  'qilu|pingqi-rhyme': ['平平仄仄仄平平', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平', '平平仄仄仄平平', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平'],
  'qilu|pingqi-norhyme': ['平平仄仄平平仄', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平'],
  'qilu|zeqi-rhyme': ['仄仄平平仄仄平', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平', '仄仄平平仄仄平', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平'],
  'qilu|zeqi-norhyme': ['仄仄平平平仄仄', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平']
}

// 与标准谱对照：偶数位（二四六，五言二四）必须合谱，一三五宽容；末字（韵脚/白脚）单列判断
function compareWithPattern(chars, pattern) {
  const mismatches = []
  const tones = chars.map((c) => c.cat)
  for (let i = 0; i < pattern.length; i++) {
    const pos = i + 1
    if (pos % 2 !== 0) continue // 一三五不论
    if (tones[i] && tones[i] !== pattern[i]) mismatches.push(pos)
  }
  const lastPos = pattern.length
  const lastTone = tones[lastPos - 1]
  const lastOff = !!(lastTone && lastTone !== pattern[lastPos - 1])
  return { mismatches, lastOff }
}

// 三平尾：句末三字全平（基础版告警）
function isSanPingWei(chars) {
  if (chars.length < 3) return false
  return chars.slice(-3).every((c) => c.cat === '平')
}

// 孤平（基础版）：五言"平平仄仄平"首字改仄 / 七言"仄仄平平仄仄平"第三字改仄 → 除韵脚外只剩一个平声
function isGuPing(chars, pattern) {
  if (pattern === '平平仄仄平' && chars.length === 5) return chars[0].cat === '仄'
  if (pattern === '仄仄平平仄仄平' && chars.length === 7) return chars[2].cat === '仄'
  return false
}

// 粘对检查：对=同联出句/对句偶数位相反；粘=下联出句与上联对句偶数位相同
function checkAdhesion(linesChars, len) {
  const issues = []
  const checkPos = len === 5 ? [1, 3] : [1, 3, 5] // 0 起始的偶数位
  const tone = (chars, p) => (chars[p] ? chars[p].cat : null)
  for (let c = 0; c * 2 + 1 < linesChars.length; c++) {
    const a = linesChars[c * 2]
    const b = linesChars[c * 2 + 1]
    if (!a || !b) continue
    for (const p of checkPos) {
      if (tone(a, p) && tone(b, p) && tone(a, p) === tone(b, p)) {
        issues.push('失对：第 ' + (c * 2 + 1) + '、' + (c * 2 + 2) + ' 句第 ' + (p + 1) + ' 字应相对（平仄相反）')
      }
    }
  }
  for (let c = 0; c * 2 + 2 < linesChars.length; c++) {
    const a = linesChars[c * 2 + 1]
    const b = linesChars[c * 2 + 2]
    if (!a || !b) continue
    for (const p of checkPos) {
      if (tone(a, p) && tone(b, p) && tone(a, p) !== tone(b, p)) {
        issues.push('失粘：第 ' + (c * 2 + 2) + ' 句与上联对句（第 ' + (c * 2 + 1) + ' 句）第 ' + (p + 1) + ' 字应相粘（平仄相同）')
      }
    }
  }
  return issues
}

// 押韵检查（简化）：偶数句末字韵基一致
function checkRhyme(linesChars) {
  const rhymeChars = []
  for (let i = 1; i < linesChars.length; i += 2) {
    const line = linesChars[i]
    if (line && line.length) rhymeChars.push(line[line.length - 1])
  }
  if (linesChars.length % 2 === 1 && linesChars.length) {
    // 首句入韵时首句末字也是韵脚：由调用者按谱判断，这里只列偶数句
  }
  const keys = rhymeChars.map((c) => ({ char: c.char, key: rhymeKeyOf(c.char) }))
  const valid = keys.filter((k) => k.key)
  const rhymeOk = valid.length >= 2 && valid.every((k) => k.key === valid[0].key)
  return {
    rhymes: keys,
    rhymeOk,
    rhymeMsg: valid.length < 2
      ? '韵脚不足两个，无法判断。'
      : rhymeOk
        ? '韵脚韵基一致（' + valid[0].key + '），按简化口径押韵。'
        : '韵脚韵基不一致（' + valid.map((k) => k.char + ':' + k.key).join('、') + '），按简化口径未押韵或换韵。'
  }
}

// 诗句解析：按标点/换行分句，只保留含汉字的句子
function parsePoemLines(text) {
  return String(text || '')
    .split(/[\s，。！？、；：,.!?;:()"'"“”·—\n\r]+/)
    .map((s) => s.replace(/[^\u3400-\u9fff]/g, ''))
    .filter((s) => s.length > 0)
}

// 整体检查入口：{poemText, styleId, formId} → 逐行标注 + 校验 + 对照 + 押韵 + 粘对 + 告警
function checkPoem(poemText, styleId, formId) {
  const style = STYLES.find((s) => s.id === styleId) || STYLES[0]
  const form = FORMS.find((f) => f.id === formId) || FORMS[0]
  const key = style.id + '|' + form.id
  const pattern = PATTERNS[key] || []
  const rawLines = parsePoemLines(poemText)
  const errors = []
  if (!rawLines.length) {
    return { style, form, pattern, lines: [], errors: [], rhymes: [], rhymeOk: false, rhymeMsg: '', adhesion: [] }
  }
  if (rawLines.length !== style.lines) {
    errors.push(style.name + '应为 ' + style.lines + ' 句，当前 ' + rawLines.length + ' 句')
  }
  const lines = rawLines.map((line, li) => {
    const chars = annotateLine(line)
    if (chars.length !== style.len) {
      errors.push('第 ' + (li + 1) + ' 句应为 ' + style.len + ' 字，当前 ' + chars.length + ' 字')
    }
    const pat = pattern[li] || ''
    let mismatches = []
    let lastOff = false
    if (pat.length === chars.length) {
      const r = compareWithPattern(chars, pat)
      mismatches = r.mismatches
      lastOff = r.lastOff
    }
    const notes = []
    const conflicts = chars.filter((c) => c.conflict)
    for (const c of conflicts) {
      notes.push('「' + c.char + '」（' + c.toneMark + '）普通话读平声，但中古为入声（仄）——按中古音此处应作仄')
    }
    if (isGuPing(chars, pat)) notes.push('疑似孤平：除韵脚外全句只剩一个平声，律句大忌')
    if (isSanPingWei(chars)) notes.push('三平尾：句末连续三个平声，律句不允许')
    if (lastOff) notes.push('末字' + (chars[chars.length - 1] ? chars[chars.length - 1].cat : '') + '，谱为' + (pat[pat.length - 1] || '?') + '——首句入韵/白脚请核对')
    return {
      raw: line,
      chars,
      toneText: chars.map((c) => c.cat || '?').join(''),
      mismatches,
      notes
    }
  })
  const adhesion = checkAdhesion(lines.map((l) => l.chars), style.len)
  const rhyme = checkRhyme(lines.map((l) => l.chars))
  return { style, form, pattern, lines, errors: [...new Set(errors)], rhymes: rhyme.rhymes, rhymeOk: rhyme.rhymeOk, rhymeMsg: rhyme.rhymeMsg, adhesion }
}

/* PURE-FNS-END */

// ---------- 页面状态 ----------
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const SAMPLES = [
  { style: 'wujue', form: 'zeqi-norhyme', text: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。' },
  { style: 'wujue', form: 'zeqi-norhyme', text: '床前明月光，疑是地上霜。举头望明月，低头思故乡。' }
]

const styleId = ref('wujue')
const formId = ref('zeqi-norhyme')
const poemText = ref('')

const currentStyle = computed(() => STYLES.find((s) => s.id === styleId.value) || STYLES[0])
const currentForm = computed(() => FORMS.find((f) => f.id === formId.value) || FORMS[0])
const currentPattern = computed(() => PATTERNS[currentStyle.value.id + '|' + currentForm.value.id] || [])

const checkResult = computed(() => checkPoem(poemText.value, styleId.value, formId.value))

function loadSample(i) {
  const s = SAMPLES[i] || SAMPLES[0]
  styleId.value = s.style
  formId.value = s.form
  poemText.value = s.text
}

function charCls(ch, ci, ln) {
  if (!ch.cat) return 'bg-muted/40 border-border opacity-60'
  const pos = ci + 1
  if (pos % 2 === 0 && ln.mismatches.includes(pos)) return 'bg-red-500/10 border-red-400/60'
  if (ch.conflict) return 'bg-amber-400/10 border-amber-400/70'
  return 'bg-muted/40 border-border'
}

function charTitle(ch, ci) {
  const parts = []
  if (ch.py) parts.push(ch.toneMark + '（' + ch.toneNum + '声·' + ch.cat + '）')
  else parts.push('未收录，请自行查证')
  if (ch.rusheng) parts.push('中古入声字（仄）')
  const pos = ci + 1
  parts.push(pos % 2 === 0 ? '节奏点：须合谱' : '一三五不论：宽容')
  return parts.join(' · ')
}

onMounted(() => {
  addRecentTool('tone-pattern-checker')
})
</script>
