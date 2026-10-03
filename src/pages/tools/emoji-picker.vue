<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Smile class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Emoji速查复制器</h1>
          <p class="text-sm text-muted-foreground mt-1">按分类浏览、按名称搜索，点击即复制，支持最近使用记录</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        内置 {{ totalCount }} 个常用 Emoji，分为笑脸情感、手势人物、动物自然、食物饮料、活动、物品、符号、旗帜八大分组，支持中文关键词搜索。点击即可复制到剪贴板，最近使用的 24 个会保存在本机浏览器 localStorage，不上传任何数据。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：搜索 / 预览 / 最近使用 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 搜索与预览 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <List class="w-5 h-5 mr-2 text-primary" /> 搜索与预览
          </h2>
          <input
            v-model="query"
            type="text"
            placeholder="搜索名称或关键词，如：笑、赞、cat"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <!-- 放大预览条 -->
          <div class="mt-4 bg-muted/50 rounded-lg p-4 flex items-center gap-4 min-h-[84px]">
            <template v-if="previewItem">
              <span class="text-5xl leading-none">{{ previewItem.emoji }}</span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground truncate">{{ previewItem.name }}</p>
                <p class="text-xs text-muted-foreground truncate mt-0.5">{{ previewItem.keywords }}</p>
                <p v-if="copied" class="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle class="w-3.5 h-3.5" /> 已复制 {{ copied }}
                </p>
              </div>
            </template>
            <div v-else class="text-sm text-muted-foreground">点击右侧任意 Emoji 复制并预览</div>
          </div>

          <p class="text-xs text-muted-foreground mt-3">共收录 {{ totalCount }} 个 Emoji；搜索时在全部分组中匹配中文名与关键词</p>
        </div>

        <!-- 最近使用 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-foreground flex items-center">
              <History class="w-4 h-4 mr-2 text-primary" /> 最近使用
            </h3>
            <button
              v-if="recentEmojis.length"
              @click="clearRecent"
              class="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              title="清空最近使用"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
          <div v-if="recentEmojis.length" class="flex flex-wrap gap-1">
            <button
              v-for="em in recentEmojis"
              :key="em"
              @click="copyEmoji(findItem(em))"
              class="h-9 w-9 rounded text-2xl hover:bg-muted flex items-center justify-center transition-colors"
              :title="findItem(em)?.name || em"
            >{{ em }}</button>
          </div>
          <p v-else class="text-xs text-muted-foreground">点击 Emoji 后会在这里保留最近 24 个，数据仅存于本机</p>
        </div>
      </div>

      <!-- 右侧：分类与网格 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border">
            <div class="flex flex-wrap gap-1.5">
              <button
                @click="activeGroup = 'all'"
                :class="activeGroup === 'all' && !query ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded text-xs font-medium transition-all"
              >全部</button>
              <button
                v-for="g in groups"
                :key="g.key"
                @click="activeGroup = g.key; query = ''"
                :class="activeGroup === g.key && !query ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded text-xs font-medium transition-all"
              >{{ g.label }} <span class="opacity-60">{{ g.items.length }}</span></button>
            </div>
          </div>

          <div class="p-6">
            <!-- 搜索结果 -->
            <template v-if="query.trim()">
              <p class="text-xs text-muted-foreground mb-3">「{{ query.trim() }}」匹配到 {{ searchResults.length }} 个 Emoji</p>
              <div v-if="searchResults.length" class="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1">
                <button
                  v-for="item in searchResults"
                  :key="'s-' + item.emoji"
                  @click="copyEmoji(item)"
                  class="h-10 rounded text-2xl hover:bg-muted flex items-center justify-center transition-colors"
                  :title="item.name"
                >{{ item.emoji }}</button>
              </div>
              <div v-else class="py-16 text-center">
                <List class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p class="text-sm text-muted-foreground">没有匹配的 Emoji，换个关键词试试</p>
              </div>
            </template>

            <!-- 分类浏览 -->
            <template v-else>
              <div v-if="activeGroup === 'all'">
                <div v-for="g in groups" :key="g.key" class="mb-6 last:mb-0">
                  <p class="text-xs font-semibold text-muted-foreground mb-2">{{ g.label }}</p>
                  <div class="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1">
                    <button
                      v-for="item in g.items"
                      :key="g.key + item.emoji"
                      @click="copyEmoji(item)"
                      class="h-10 rounded text-2xl hover:bg-muted flex items-center justify-center transition-colors"
                      :title="item.name"
                    >{{ item.emoji }}</button>
                  </div>
                </div>
              </div>
              <div v-else>
                <div class="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1">
                  <button
                    v-for="item in currentGroup.items"
                    :key="item.emoji"
                    @click="copyEmoji(item)"
                    class="h-10 rounded text-2xl hover:bg-muted flex items-center justify-center transition-colors"
                    :title="item.name"
                  >{{ item.emoji }}</button>
                </div>
              </div>
            </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Emoji速查复制器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Emoji 已经成为聊天、文档、提交说明乃至产品文案里的通用「第二语言」，但系统自带的输入面板往往分类不清晰、名称无法搜索、复制路径繁琐。本工具把常用 Emoji 集中在一页里，按八大分组浏览，支持中文关键词搜索，点一下就进剪贴板，并记录最近使用的 24 个方便快速复用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>给文档、README、周报挑选合适的分隔图标（🚀 feat、🐛 fix 这类约定俗成的用法）</li>
            <li>运营文案、社群公告快速配色点睛，避免在输入法面板里来回翻找</li>
            <li>给 Git 提交标题、PR 描述加前缀图标，让历史记录一眼可扫</li>
            <li>查找某个 Emoji 的中文名称，聊天时准确描述它</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">复制的是纯文本吗？</span>是的，复制的是 Unicode 字符本身，可粘贴到任何支持文本的地方。</li>
            <li><span class="text-foreground font-medium">为什么有些 Emoji 显示成方框？</span>取决于你系统的字体版本，较新的 Emoji 在旧系统上可能无法渲染，但字符本身复制后仍然有效。</li>
            <li><span class="text-foreground font-medium">最近使用会同步吗？</span>不会。记录只保存在本机浏览器的 localStorage 中，清除浏览器数据会一并清空。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'emoji-picker'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Smile, List, History, Trash2, CheckCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Emoji速查复制器 - 在线Emoji表情大全一键复制',
  description: '在线Emoji表情大全，收录290+常用emoji，按笑脸/手势/动物/食物/活动/物品/符号/旗帜分类，支持中文关键词搜索，点击一键复制，最近使用本地保存',
  keywords: 'emoji大全, emoji复制, 表情符号, emoji搜索, emoji含义, 特殊符号, 一键复制emoji',
  author: 'Util工具箱',
  ogTitle: 'Emoji速查复制器 - 有条工具',
  ogDescription: '按分类浏览、按名称搜索，点击即复制，支持最近使用记录',
  ogUrl: 'https://www.util.cn/tools/emoji-picker',
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
          name: 'Emoji速查复制器',
          url: 'https://www.util.cn/tools/emoji-picker',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Emoji分类浏览', '中文关键词搜索', '点击一键复制', '最近使用本地记录']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Emoji速查复制器', item: 'https://www.util.cn/tools/emoji-picker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '复制得到的Emoji可以直接粘贴到哪里？',
              acceptedAnswer: { '@type': 'Answer', text: '复制的是Unicode文本字符，可粘贴到聊天窗口、文档、代码、Git提交说明等任何支持文本输入的地方。' }
            },
            {
              '@type': 'Question',
              name: '最近使用的记录会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，最近使用只保存在本机浏览器的localStorage中，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'emoji-picker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadRecent()
})

// ---------- 内置 Emoji 数据（{ emoji, name, keywords }） ----------
const groups = [
  {
    key: 'smileys', label: '笑脸与情感',
    items: [
      { emoji: '😀', name: '咧嘴笑', keywords: '笑 开心 grin happy' },
      { emoji: '😃', name: '大笑', keywords: '开心 哈哈 smiling' },
      { emoji: '😄', name: '眉眼大笑', keywords: '开心 笑 smile eyes' },
      { emoji: '😁', name: '露齿笑', keywords: '嘿嘿 开心 beam grin' },
      { emoji: '😆', name: '挤眼笑', keywords: '哈哈 大笑 squint laugh' },
      { emoji: '😅', name: '苦笑流汗', keywords: '尴尬 汗 sweat smile' },
      { emoji: '🤣', name: '笑得打滚', keywords: '笑死 笑哭 rofl lol' },
      { emoji: '😂', name: '笑哭', keywords: '开心 泪 joy tears lol' },
      { emoji: '🙂', name: '微微一笑', keywords: '微笑 slightly smile' },
      { emoji: '🙃', name: '倒脸', keywords: '无语 讽刺 upside down' },
      { emoji: '😉', name: '眨眼', keywords: 'wink 暗示' },
      { emoji: '😊', name: '羞涩微笑', keywords: '脸红 温柔 blush smile' },
      { emoji: '😇', name: '微笑天使', keywords: '光环 善良 angel innocent' },
      { emoji: '🥰', name: '被爱包围', keywords: '恋爱 甜蜜 hearts love' },
      { emoji: '😍', name: '爱心眼', keywords: '花痴 喜欢 heart eyes love' },
      { emoji: '🤩', name: '星星眼', keywords: '兴奋 惊叹 star struck wow' },
      { emoji: '😘', name: '飞吻', keywords: '亲亲 吻 kiss love' },
      { emoji: '😋', name: '好吃', keywords: '馋 美味 delicious yum' },
      { emoji: '😛', name: '吐舌', keywords: '调皮 tongue' },
      { emoji: '😜', name: '挤眼吐舌', keywords: '调皮 疯狂 zany wink' },
      { emoji: '🤪', name: '滑稽脸', keywords: '疯狂 搞怪 crazy zany' },
      { emoji: '😝', name: '眯眼吐舌', keywords: '调皮 得意 squint tongue' },
      { emoji: '🤗', name: '拥抱', keywords: '抱抱 hug 温暖' },
      { emoji: '🤭', name: '捂嘴偷笑', keywords: '偷笑 Oops giggle' },
      { emoji: '🤫', name: '嘘', keywords: '安静 保密 shush quiet' },
      { emoji: '🤔', name: '思考', keywords: '想想 疑问 thinking hmm' },
      { emoji: '🫡', name: '敬礼', keywords: '收到 遵命 salute yes' },
      { emoji: '🤐', name: '拉链嘴', keywords: '闭嘴 保密 zipper quiet' },
      { emoji: '🤨', name: '挑眉', keywords: '怀疑 意味深长 eyebrow suspicious' },
      { emoji: '😐', name: '面无表情', keywords: '淡定 neutral blank' },
      { emoji: '😏', name: '得意', keywords: '坏笑 smirking' },
      { emoji: '😒', name: '不屑', keywords: '无聊 白眼 unamused' },
      { emoji: '🙄', name: '翻白眼', keywords: '无语 白眼 rolling eyes' },
      { emoji: '😌', name: '宽慰', keywords: '放松 安心 relieved calm' },
      { emoji: '😔', name: '低落', keywords: '沮丧 遗憾 sad pensive' },
      { emoji: '😪', name: '瞌睡', keywords: '困 流鼻涕 sleepy tired' },
      { emoji: '🤤', name: '流口水', keywords: '馋 想要 drool' },
      { emoji: '😴', name: '熟睡', keywords: '睡觉 zzz sleeping' },
      { emoji: '😷', name: '戴口罩', keywords: '生病 防护 mask' },
      { emoji: '🤕', name: '受伤', keywords: '绷带 受伤 bandage hurt' },
      { emoji: '🥵', name: '热化了', keywords: '出汗 高温 hot heat' },
      { emoji: '🥶', name: '冷得发抖', keywords: '寒冷 冰冻 cold freezing' },
      { emoji: '🤯', name: '爆炸头', keywords: '震惊 惊呆 mind blown shocked' },
      { emoji: '🥳', name: '庆祝派对', keywords: '生日 派对 庆祝 party celebrate' },
      { emoji: '😎', name: '墨镜酷脸', keywords: '酷 帅 cool sunglasses' },
      { emoji: '🤓', name: '书呆子', keywords: '学霸 眼镜 nerd geek' },
      { emoji: '🧐', name: '单片眼镜', keywords: '审查 研究 monocle inspect' },
      { emoji: '😳', name: '脸红害羞', keywords: '尴尬 flushed' },
      { emoji: '😢', name: '流泪', keywords: '哭 crying tear' },
      { emoji: '😭', name: '大哭', keywords: '嚎啕 泪崩 loudly crying sob' },
      { emoji: '😱', name: '尖叫', keywords: '恐吓 吓 scream horror' },
      { emoji: '😤', name: '不服气', keywords: '生气 哼 triumph steam' },
      { emoji: '😡', name: '愤怒', keywords: '生气 enraged angry' },
      { emoji: '🤬', name: '爆粗', keywords: '骂人 符号 cursing' },
      { emoji: '😈', name: '恶魔', keywords: '调皮 鬼点子 devil imp' },
      { emoji: '💀', name: '骷髅', keywords: '死 skull dead' },
      { emoji: '👻', name: '幽灵', keywords: '鬼 万圣节 ghost halloween' },
      { emoji: '🤖', name: '机器人', keywords: 'AI robot bot' }
    ]
  },
  {
    key: 'people', label: '手势与人',
    items: [
      { emoji: '👋', name: '挥手', keywords: '你好 再见 wave hello' },
      { emoji: '🤚', name: '抬起手背', keywords: '停止 raised hand' },
      { emoji: '🖐️', name: '张开五指', keywords: '手掌 splayed fingers' },
      { emoji: '✋', name: '举手停止', keywords: '停 stop hi five' },
      { emoji: '🖖', name: '瓦肯礼', keywords: '星际迷航 spock' },
      { emoji: '👌', name: 'OK', keywords: '好的 没问题 ok perfect' },
      { emoji: '🤌', name: '捏手指', keywords: '疑问 意大利 pinched' },
      { emoji: '✌️', name: '胜利手势', keywords: '耶 胜利 victory peace' },
      { emoji: '🤞', name: '交叉手指', keywords: '祈祷 好运 luck fingers crossed' },
      { emoji: '🤟', name: '爱你手势', keywords: '摇滚 爱 love you' },
      { emoji: '🤘', name: '摇滚手势', keywords: 'rock 摇滚' },
      { emoji: '🤙', name: '打电话手势', keywords: 'call me 电话' },
      { emoji: '👈', name: '向左指', keywords: '左 point left' },
      { emoji: '👉', name: '向右指', keywords: '右 point right' },
      { emoji: '👆', name: '向上指', keywords: '上 point up' },
      { emoji: '👇', name: '向下指', keywords: '下 point down' },
      { emoji: '👍', name: '点赞', keywords: '赞 好 thumb up like' },
      { emoji: '👎', name: '点踩', keywords: '差评 不行 thumb down dislike' },
      { emoji: '✊', name: '举拳', keywords: '加油 fist' },
      { emoji: '👊', name: '出拳', keywords: '打 punch bump' },
      { emoji: '🤝', name: '握手', keywords: '合作 达成 handshake deal' },
      { emoji: '👏', name: '鼓掌', keywords: '拍手 赞 clap praise' },
      { emoji: '🙌', name: '高举双手', keywords: '庆祝 万岁 raising hands hooray' },
      { emoji: '👐', name: '张开双手', keywords: 'open hands 拥抱' },
      { emoji: '🤲', name: '掌心向上', keywords: '祈祷 求 palms up' },
      { emoji: '🙏', name: '合十', keywords: '感谢 拜托 pray thanks please' },
      { emoji: '✍️', name: '写字', keywords: '签名 书写 write sign' },
      { emoji: '💅', name: '美甲', keywords: '指甲 polish nails' },
      { emoji: '🤳', name: '自拍', keywords: 'selfie 手机' },
      { emoji: '💪', name: '肌肉', keywords: '加油 强 muscle strong flex' },
      { emoji: '🧠', name: '大脑', keywords: '脑 智慧 brain smart' },
      { emoji: '👀', name: '眼睛', keywords: '看 观察 eyes look' },
      { emoji: '👂', name: '耳朵', keywords: '听 ear listen' },
      { emoji: '🦷', name: '牙齿', keywords: '牙 tooth dentist' },
      { emoji: '🦵', name: '腿', keywords: '脚踢 leg kick' },
      { emoji: '🧑‍💻', name: '程序员', keywords: '技术 开发 coder developer' },
      { emoji: '🧑‍🎓', name: '学生', keywords: '毕业 学习 student' },
      { emoji: '👨‍👩‍👧‍👦', name: '家庭', keywords: '一家 family' },
      { emoji: '👶', name: '婴儿', keywords: '宝宝 baby' },
      { emoji: '🎅', name: '圣诞老人', keywords: '圣诞 santa christmas' }
    ]
  },
  {
    key: 'nature', label: '动物与自然',
    items: [
      { emoji: '🐶', name: '狗', keywords: '小狗 dog puppy' },
      { emoji: '🐱', name: '猫', keywords: '小猫 cat kitty' },
      { emoji: '🐭', name: '老鼠', keywords: 'mouse 鼠' },
      { emoji: '🐹', name: '仓鼠', keywords: 'hamster' },
      { emoji: '🐰', name: '兔子', keywords: 'rabbit bunny' },
      { emoji: '🦊', name: '狐狸', keywords: 'fox' },
      { emoji: '🐻', name: '熊', keywords: 'bear' },
      { emoji: '🐼', name: '熊猫', keywords: 'panda 国宝' },
      { emoji: '🐨', name: '考拉', keywords: '树袋熊 koala' },
      { emoji: '🐯', name: '老虎', keywords: 'tiger' },
      { emoji: '🦁', name: '狮子', keywords: 'lion 勇气' },
      { emoji: '🐮', name: '奶牛', keywords: '牛 cow' },
      { emoji: '🐷', name: '猪', keywords: 'pig' },
      { emoji: '🐸', name: '青蛙', keywords: 'frog' },
      { emoji: '🐵', name: '猴子', keywords: 'monkey' },
      { emoji: '🙈', name: '非礼勿视', keywords: '捂眼 monkey see' },
      { emoji: '🐔', name: '鸡', keywords: 'chicken 母鸡' },
      { emoji: '🐧', name: '企鹅', keywords: 'penguin' },
      { emoji: '🐦', name: '小鸟', keywords: 'bird' },
      { emoji: '🦆', name: '鸭子', keywords: 'duck' },
      { emoji: '🐴', name: '马', keywords: 'horse' },
      { emoji: '🦄', name: '独角兽', keywords: 'unicorn' },
      { emoji: '🐝', name: '蜜蜂', keywords: 'bee 蜂蜜' },
      { emoji: '🐛', name: '毛毛虫', keywords: '虫 bug' },
      { emoji: '🦋', name: '蝴蝶', keywords: 'butterfly' },
      { emoji: '🐌', name: '蜗牛', keywords: 'snail 慢' },
      { emoji: '🐢', name: '乌龟', keywords: 'turtle 慢' },
      { emoji: '🐍', name: '蛇', keywords: 'snake python' },
      { emoji: '🐙', name: '章鱼', keywords: 'octopus' },
      { emoji: '🐳', name: '鲸鱼', keywords: 'whale' },
      { emoji: '🐬', name: '海豚', keywords: 'dolphin' },
      { emoji: '🐟', name: '鱼', keywords: 'fish' },
      { emoji: '🌵', name: '仙人掌', keywords: 'cactus' },
      { emoji: '🌲', name: '松树', keywords: '树 evergreen forest' },
      { emoji: '🌴', name: '棕榈树', keywords: '椰树 度假 palm' },
      { emoji: '🌸', name: '樱花', keywords: '花 blossom sakura' },
      { emoji: '🌹', name: '玫瑰', keywords: '爱情 rose flower' },
      { emoji: '🌻', name: '向日葵', keywords: 'sunflower' },
      { emoji: '🍀', name: '四叶草', keywords: '幸运 luck clover' },
      { emoji: '🌈', name: '彩虹', keywords: 'rainbow' },
      { emoji: '⭐', name: '星星', keywords: 'star 收藏' },
      { emoji: '🌙', name: '月亮', keywords: '夜晚 moon night' },
      { emoji: '☀️', name: '太阳', keywords: '晴 sun sunny' },
      { emoji: '☁️', name: '云', keywords: 'cloud 阴天' },
      { emoji: '⚡', name: '闪电', keywords: '电 快 lightning zap' },
      { emoji: '🔥', name: '火', keywords: '热门 fire hot flame' },
    ]
  },
  {
    key: 'food', label: '食物与饮料',
    items: [
      { emoji: '🍎', name: '苹果', keywords: 'apple' },
      { emoji: '🍊', name: '橘子', keywords: '橙 orange tangerine' },
      { emoji: '🍋', name: '柠檬', keywords: 'lemon' },
      { emoji: '🍌', name: '香蕉', keywords: 'banana' },
      { emoji: '🍉', name: '西瓜', keywords: 'watermelon 夏天' },
      { emoji: '🍇', name: '葡萄', keywords: 'grapes' },
      { emoji: '🍓', name: '草莓', keywords: 'strawberry' },
      { emoji: '🫐', name: '蓝莓', keywords: 'blueberry' },
      { emoji: '🍒', name: '樱桃', keywords: 'cherries' },
      { emoji: '🍑', name: '桃子', keywords: 'peach 屁股' },
      { emoji: '🥭', name: '芒果', keywords: 'mango' },
      { emoji: '🥑', name: '牛油果', keywords: 'avocado' },
      { emoji: '🥦', name: '西兰花', keywords: 'broccoli 健康' },
      { emoji: '🥕', name: '胡萝卜', keywords: 'carrot' },
      { emoji: '🌶️', name: '辣椒', keywords: '辣 hot pepper' },
      { emoji: '🥔', name: '土豆', keywords: 'potato 马铃薯' },
      { emoji: '🍞', name: '面包', keywords: 'bread 吐司' },
      { emoji: '🥐', name: '牛角包', keywords: '可颂 croissant' },
      { emoji: '🧀', name: '奶酪', keywords: 'cheese' },
      { emoji: '🍳', name: '煎蛋', keywords: '鸡蛋 cooking egg' },
      { emoji: '🍔', name: '汉堡', keywords: 'burger 快餐' },
      { emoji: '🍟', name: '薯条', keywords: 'fries 快餐' },
      { emoji: '🍕', name: '披萨', keywords: 'pizza' },
      { emoji: '🌭', name: '热狗', keywords: 'hot dog' },
      { emoji: '🌮', name: '塔可', keywords: '墨西哥卷 taco' },
      { emoji: '🍣', name: '寿司', keywords: 'sushi 日料' },
      { emoji: '🍜', name: '拉面', keywords: '面条 ramen noodles' },
      { emoji: '🍱', name: '便当', keywords: 'bento 套餐' },
      { emoji: '🍚', name: '米饭', keywords: 'rice 米' },
      { emoji: '🥟', name: '饺子', keywords: 'dumpling 饺' },
      { emoji: '🍦', name: '冰淇淋', keywords: 'ice cream 雪糕' },
      { emoji: '🍩', name: '甜甜圈', keywords: 'donut doughnut' },
      { emoji: '🍪', name: '饼干', keywords: 'cookie 曲奇' },
      { emoji: '🎂', name: '生日蛋糕', keywords: 'cake 生日 庆祝' },
      { emoji: '🍫', name: '巧克力', keywords: 'chocolate' },
      { emoji: '🍬', name: '糖果', keywords: 'candy 糖' },
      { emoji: '🍿', name: '爆米花', keywords: 'popcorn 电影' },
      { emoji: '☕', name: '咖啡', keywords: 'coffee 咖啡因' },
      { emoji: '🍵', name: '茶', keywords: 'tea 绿茶' },
      { emoji: '🧋', name: '珍珠奶茶', keywords: '奶茶 bubble tea boba' },
      { emoji: '🥤', name: '带杯饮料', keywords: '可乐 奶昔 soda straw' },
      { emoji: '🍺', name: '啤酒', keywords: 'beer 干杯' },
      { emoji: '🍻', name: '碰杯', keywords: '干杯 聚会 cheers beer' },
      { emoji: '🍷', name: '红酒', keywords: '葡萄酒 wine' },
      { emoji: '🥂', name: '香槟', keywords: '庆祝 champagne toast' }
    ]
  },
  {
    key: 'activity', label: '活动',
    items: [
      { emoji: '⚽', name: '足球', keywords: 'soccer football' },
      { emoji: '🏀', name: '篮球', keywords: 'basketball' },
      { emoji: '🏈', name: '橄榄球', keywords: 'football' },
      { emoji: '⚾', name: '棒球', keywords: 'baseball' },
      { emoji: '🎾', name: '网球', keywords: 'tennis' },
      { emoji: '🏐', name: '排球', keywords: 'volleyball' },
      { emoji: '🎱', name: '台球', keywords: 'pool billiards 8' },
      { emoji: '🏓', name: '乒乓球', keywords: 'ping pong 桌球' },
      { emoji: '🏸', name: '羽毛球', keywords: 'badminton' },
      { emoji: '🥊', name: '拳击手套', keywords: 'boxing 拳击' },
      { emoji: '⛳', name: '高尔夫', keywords: 'golf 球洞' },
      { emoji: '🏆', name: '奖杯', keywords: '冠军 第一 trophy win' },
      { emoji: '🥇', name: '金牌', keywords: '第一 gold medal' },
      { emoji: '🎮', name: '游戏手柄', keywords: '游戏 game controller' },
      { emoji: '🕹️', name: '摇杆', keywords: '街机 joystick arcade' },
      { emoji: '🎲', name: '骰子', keywords: 'random 随机 dice' },
      { emoji: '♟️', name: '棋子', keywords: '国际象棋 chess' },
      { emoji: '🎯', name: '靶心', keywords: '目标 dart bullseye' },
      { emoji: '🎳', name: '保龄球', keywords: 'bowling' },
      { emoji: '🎤', name: '麦克风', keywords: '唱歌 KTV mic karaoke' },
      { emoji: '🎧', name: '耳机', keywords: '音乐 headphone music' },
      { emoji: '🎸', name: '吉他', keywords: 'guitar 摇滚' },
      { emoji: '🎹', name: '钢琴', keywords: 'piano 键盘乐器' },
      { emoji: '🎬', name: '场记板', keywords: '电影 开拍 clapper movie' },
      { emoji: '🎨', name: '调色板', keywords: '画画 设计 art palette' }
    ]
  },
  {
    key: 'objects', label: '物品',
    items: [
      { emoji: '💻', name: '笔记本电脑', keywords: '电脑 laptop coding' },
      { emoji: '🖥️', name: '台式电脑', keywords: '显示器 desktop monitor' },
      { emoji: '⌨️', name: '键盘', keywords: 'keyboard 打字' },
      { emoji: '🖱️', name: '鼠标', keywords: 'mouse computer' },
      { emoji: '💾', name: '软盘', keywords: '保存 floppy save' },
      { emoji: '📱', name: '手机', keywords: 'phone mobile 移动' },
      { emoji: '☎️', name: '电话', keywords: 'telephone 座机' },
      { emoji: '🔋', name: '电池', keywords: '电量 battery 充电' },
      { emoji: '🔌', name: '插头', keywords: '电源 plug electric' },
      { emoji: '💡', name: '灯泡', keywords: '想法 idea light bulb' },
      { emoji: '🔍', name: '放大镜', keywords: '搜索 查找 search magnifier' },
      { emoji: '🔒', name: '锁定', keywords: '锁 安全 lock secure' },
      { emoji: '🔑', name: '钥匙', keywords: 'key 密钥' },
      { emoji: '🛠️', name: '工具', keywords: '维修 扳手 tools wrench' },
      { emoji: '⚙️', name: '齿轮', keywords: '设置 配置 settings config gear' },
      { emoji: '🧲', name: '磁铁', keywords: '磁力 magnet 吸引' },
      { emoji: '🧪', name: '试管', keywords: '实验 test tube' },
      { emoji: '🔬', name: '显微镜', keywords: '科研 microscope' },
      { emoji: '🔭', name: '望远镜', keywords: '观察 telescope' },
      { emoji: '📡', name: '卫星天线', keywords: '信号 satellite dish' },
      { emoji: '🚀', name: '火箭', keywords: '发布 上线 rocket launch ship' },
      { emoji: '✈️', name: '飞机', keywords: '旅行 airplane travel' },
      { emoji: '🚗', name: '汽车', keywords: 'car 开车' },
      { emoji: '🚌', name: '公交车', keywords: 'bus' },
      { emoji: '🚲', name: '自行车', keywords: 'bike cycling 骑行' },
      { emoji: '🛴', name: '滑板车', keywords: 'scooter' },
      { emoji: '🚢', name: '轮船', keywords: 'ship 航海' },
      { emoji: '🏠', name: '房子', keywords: '家 house home' },
      { emoji: '🏢', name: '办公楼', keywords: '公司 office' },
      { emoji: '🏥', name: '医院', keywords: 'hospital 看病' },
      { emoji: '🏦', name: '银行', keywords: 'bank 存钱' },
      { emoji: '🎒', name: '背包', keywords: '书包 backpack' },
      { emoji: '👜', name: '手提包', keywords: '包 handbag' },
      { emoji: '👓', name: '眼镜', keywords: 'glasses 近视' },
      { emoji: '🕶️', name: '墨镜', keywords: '太阳镜 sunglasses cool' },
      { emoji: '🧢', name: '棒球帽', keywords: '帽子 cap hat' },
      { emoji: '👑', name: '皇冠', keywords: '王 crown 国王' },
      { emoji: '📦', name: '包裹', keywords: '快递 package box' },
    ]
  },
  {
    key: 'symbols', label: '符号',
    items: [
      { emoji: '❤️', name: '红心', keywords: '爱 heart love 喜欢' },
      { emoji: '🧡', name: '橙心', keywords: 'orange heart' },
      { emoji: '💛', name: '黄心', keywords: 'yellow heart' },
      { emoji: '💚', name: '绿心', keywords: 'green heart' },
      { emoji: '💙', name: '蓝心', keywords: 'blue heart' },
      { emoji: '💜', name: '紫心', keywords: 'purple heart' },
      { emoji: '🖤', name: '黑心', keywords: 'black heart 暗黑' },
      { emoji: '🤍', name: '白心', keywords: 'white heart' },
      { emoji: '💔', name: '心碎', keywords: '分手 broken heart' },
      { emoji: '💕', name: '两颗心', keywords: '恋爱 two hearts love' },
      { emoji: '💞', name: '旋转心', keywords: '甜蜜 revolving hearts' },
      { emoji: '💯', name: '一百分', keywords: '满分 满分 hundred perfect' },
      { emoji: '✅', name: '对勾', keywords: '完成 通过 check 完成 done' },
      { emoji: '❌', name: '叉号', keywords: '错误 取消 cross wrong no' },
      { emoji: '❓', name: '问号', keywords: '疑问 question 帮助' },
      { emoji: '❗', name: '感叹号', keywords: '注意 exclamation' },
      { emoji: '⚠️', name: '警告', keywords: '注意 风险 warning caution' },
      { emoji: '🚫', name: '禁止', keywords: '不许 prohibited no' },
      { emoji: '♻️', name: '回收', keywords: '循环 recycle 环保' },
      { emoji: '✨', name: '闪亮', keywords: '星星 亮点 sparkles shiny' },
      { emoji: '💫', name: '眩晕星', keywords: '头晕 dizzy star' },
      { emoji: '💥', name: '爆炸', keywords: '碰撞 boom 惊爆' },
      { emoji: '🔴', name: '红圆', keywords: '红色 red circle 状态' },
      { emoji: '🟢', name: '绿圆', keywords: '绿色 green circle 在线' },
      { emoji: '🔵', name: '蓝圆', keywords: '蓝色 blue circle' },
      { emoji: '➕', name: '加号', keywords: '添加 plus add' },
      { emoji: '➖', name: '减号', keywords: '移除 minus remove' },
      { emoji: '©️', name: '版权', keywords: 'copyright 版权所有' },
      { emoji: '®️', name: '注册商标', keywords: 'registered trademark' },
      { emoji: '™️', name: '商标', keywords: 'trademark tm' },
    ]
  },
  {
    key: 'flags', label: '旗帜',
    items: [
      { emoji: '🏁', name: '方格旗', keywords: '终点 chequered finish' },
      { emoji: '🚩', name: '三角旗', keywords: '红旗 标记 red flag' },
      { emoji: '🎌', name: '交叉旗', keywords: '庆祝日本 crossed flags' },
      { emoji: '🏳️', name: '白旗', keywords: '投降 white flag' },
      { emoji: '🏳️‍🌈', name: '彩虹旗', keywords: '骄傲 rainbow pride' },
      { emoji: '🇨🇳', name: '中国', keywords: 'china 国旗 cn' },
      { emoji: '🇭🇰', name: '中国香港', keywords: 'hong kong hk' },
      { emoji: '🇹🇼', name: '中国台湾', keywords: 'taiwan tw' },
      { emoji: '🇺🇸', name: '美国', keywords: 'usa america us' },
      { emoji: '🇯🇵', name: '日本', keywords: 'japan jp' },
      { emoji: '🇰🇷', name: '韩国', keywords: 'korea kr' },
      { emoji: '🇬🇧', name: '英国', keywords: 'uk britain uk' },
      { emoji: '🇫🇷', name: '法国', keywords: 'france fr' },
      { emoji: '🇩🇪', name: '德国', keywords: 'germany de' },
      { emoji: '🇸🇬', name: '新加坡', keywords: 'singapore sg' },
      { emoji: '🇨🇦', name: '加拿大', keywords: 'canada ca' },
      { emoji: '🇦🇺', name: '澳大利亚', keywords: 'australia au' }
    ]
  }
]

const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0)
const allItems = groups.flatMap(g => g.items)
const itemMap = new Map(allItems.map(i => [i.emoji, i]))

// ---------- 状态 ----------
const activeGroup = ref('all')
const query = ref('')
const previewItem = ref(null)
const copied = ref('')
const recentEmojis = ref([])
const seoContentVisible = ref(true)
let copyTimer = null

const RECENT_KEY = 'emoji-picker-recent'
const RECENT_MAX = 24

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const currentGroup = computed(() => groups.find(g => g.key === activeGroup.value) || groups[0])

const searchResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return allItems.filter(item =>
    item.emoji.includes(q) ||
    item.name.toLowerCase().includes(q) ||
    item.keywords.toLowerCase().includes(q)
  )
})

const findItem = (emoji) => itemMap.get(emoji) || { emoji, name: '自定义', keywords: '' }

// ---------- 复制 ----------
const writeToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

const copyEmoji = async (item) => {
  if (!item) return
  await writeToClipboard(item.emoji)
  previewItem.value = item
  copied.value = item.emoji
  pushRecent(item.emoji)
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = '' }, 1500)
}

// ---------- 最近使用 ----------
const loadRecent = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    if (Array.isArray(data)) recentEmojis.value = data.filter(e => typeof e === 'string').slice(0, RECENT_MAX)
  } catch (e) { /* 忽略 */ }
}

const persistRecent = () => {
  if (!process.client) return
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentEmojis.value)) } catch (e) { /* 忽略 */ }
}

const pushRecent = (emoji) => {
  recentEmojis.value = [emoji, ...recentEmojis.value.filter(e => e !== emoji)].slice(0, RECENT_MAX)
  persistRecent()
}

const clearRecent = () => {
  recentEmojis.value = []
  persistRecent()
}
</script>
