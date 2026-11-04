<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Lock class="w-8 h-8 text-primary" />
        随机密码生成（游戏版）
      </h1>
      <p class="text-muted-foreground">用游戏化的方式生成易记的随机密码</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 游戏模式选择 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">选择游戏模式</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="mode in gameModes"
            :key="mode.id"
            :class="[
              'p-4 border rounded-lg cursor-pointer transition-all',
              selectedMode === mode.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            ]"
            @click="selectMode(mode.id)"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <component :is="mode.icon" class="w-5 h-5 text-primary" />
              </div>
              <h3 class="font-semibold">{{ mode.name }}</h3>
            </div>
            <p class="text-sm text-muted-foreground">{{ mode.description }}</p>
          </div>
        </div>
      </div>

      <!-- 密码配置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">密码配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 密码长度 -->
          <div>
            <label class="text-sm font-medium mb-2 block">密码长度</label>
            <div class="flex gap-2">
              <input
                v-model.number="passwordLength"
                type="number"
                min="4"
                max="32"
                class="flex-1 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">字符</span>
            </div>
          </div>

          <!-- 生成数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">生成数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="generateCount"
                type="number"
                min="1"
                max="10"
                class="flex-1 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">个</span>
            </div>
          </div>
        </div>

        <!-- 字符类型 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-3 block">包含字符类型</label>
          <div class="flex flex-wrap gap-3">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="includeLowercase"
                class="mr-2"
              />
              <span class="text-sm">小写字母 (a-z)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="includeUppercase"
                class="mr-2"
              />
              <span class="text-sm">大写字母 (A-Z)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="includeNumbers"
                class="mr-2"
              />
              <span class="text-sm">数字 (0-9)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="includeSymbols"
                class="mr-2"
              />
              <span class="text-sm">特殊符号 (!@#$%^&*)</span>
            </label>
          </div>
        </div>

        <!-- 记忆词配置 -->
        <div v-if="selectedMode === 'mnemonic'" class="mt-6">
          <label class="text-sm font-medium mb-2 block">记忆词主题</label>
          <select v-model="mnemonicTheme" class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="animals">动物</option>
            <option value="fruits">水果</option>
            <option value="colors">颜色</option>
            <option value="places">地点</option>
            <option value="mixed">混合主题</option>
          </select>
        </div>
      </div>

      <!-- 游戏化生成区域 -->
      <div class="bg-card border border-border rounded-lg p-8">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold mb-2">密码寻宝游戏</h2>
          <p class="text-muted-foreground">点击宝藏盒，获取神秘密码！</p>
        </div>

        <!-- 宝藏盒动画 -->
        <div class="flex justify-center mb-8">
          <div
            @click="generatePasswords"
            :disabled="isGenerating || !canGenerate"
            class="relative cursor-pointer transform transition-transform hover:scale-105"
          >
            <div
              :class="[
                'w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg',
                isGenerating ? 'animate-bounce' : ''
              ]"
            >
              <component
                :is="isGenerating ? RefreshCw : (showReward ? Sparkles : Lock)"
                :class="isGenerating ? 'w-12 h-12 animate-spin' : 'w-12 h-12'"
                class="text-white"
              />
            </div>
            <div
              v-if="showReward"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="text-4xl animate-ping">✨</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-center gap-4">
          <button
            @click="generatePasswords"
            :disabled="isGenerating || !canGenerate"
            class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw v-if="isGenerating" class="w-5 h-5 animate-spin" />
            <Sparkles v-else class="w-5 h-5" />
            {{ isGenerating ? '生成中...' : '寻宝获取密码' }}
          </button>

          <button
            @click="rollDiceMode"
            class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Dice6 class="w-5 h-5" />
            骰子模式
          </button>

          <button
            v-if="results.length > 0"
            @click="clearResults"
            class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Trash2 class="w-5 h-5" />
            清空结果
          </button>
        </div>
      </div>

      <!-- 密码结果 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">寻宝成果</h2>
          <div class="flex gap-2">
            <button
              @click="copyPasswords"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制密码' }}
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground">宝藏 {{ index + 1 }}</span>
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="(password, passwordIndex) in result.passwords"
                :key="passwordIndex"
                class="bg-card border border-border rounded-lg p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-muted-foreground">密码 {{ passwordIndex + 1 }}</span>
                  <button
                    @click="copySinglePassword(password.value)"
                    class="text-muted-foreground hover:text-primary p-1"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
                <div class="font-mono text-lg break-all">{{ password.value }}</div>
                <div class="mt-2 flex items-center gap-2">
                  <div class="flex-1 bg-muted rounded-full h-2">
                    <div
                      :class="[
                        'h-2 rounded-full',
                        password.strength === 'strong' ? 'bg-green-500 w-full' :
                        password.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                        'bg-red-500 w-1/3'
                      ]"
                    ></div>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ getStrengthText(password.strength) }}</span>
                </div>

                <!-- 提示词 -->
                <div v-if="password.hint" class="mt-2 text-xs text-muted-foreground italic">
                  💡 {{ password.hint }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 密码统计 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">寻宝统计</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-primary">{{ totalPasswords }}</div>
            <div class="text-sm text-muted-foreground">总密码数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ strengthStats.strong || 0 }}</div>
            <div class="text-sm text-muted-foreground">强密码</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ strengthStats.medium || 0 }}</div>
            <div class="text-sm text-muted-foreground">中等密码</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ strengthStats.weak || 0 }}</div>
            <div class="text-sm text-muted-foreground">弱密码</div>
          </div>
        </div>
      </div>

      <!-- 游戏说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">游戏玩法</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">游戏模式介绍</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">故事模式</h4>
                <p class="text-muted-foreground">通过小故事生成有意义的密码组合</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">记忆词模式</h4>
                <p class="text-muted-foreground">使用熟悉的词汇组合生成易记密码</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">骰子模式</h4>
                <p class="text-muted-foreground">模拟掷骰子，元素随机组合</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">图案模式</h4>
                <p class="text-muted-foreground">键盘图案位置生成密码</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">密码安全建议</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>密码长度建议至少12位</li>
              <li>包含大小写字母、数字和特殊符号</li>
              <li>避免使用生日、姓名等个人信息</li>
              <li>不同网站使用不同密码</li>
              <li>定期更换重要账户密码</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/random-dice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Dice6 class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机骰子</p>
              <p class="text-xs text-muted-foreground">投掷虚拟骰子</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-number-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机数字生成器</p>
              <p class="text-xs text-muted-foreground">生成指定范围的随机数</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-choice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <List class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机选择器</p>
              <p class="text-xs text-muted-foreground">从列表中随机选择</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Lock, RefreshCw, Trash2, Copy, Sparkles, Dice6, Hash, List, ArrowRight } from 'lucide-vue-next'



import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机密码生成游戏 - 游戏化密码工具')

// 配置
const selectedMode = ref('story')
const passwordLength = ref(12)
const generateCount = ref(3)
const includeLowercase = ref(true)
const includeUppercase = ref(true)
const includeNumbers = ref(true)
const includeSymbols = ref(false)
const mnemonicTheme = ref('animals')

// 状态
const isGenerating = ref(false)
const showReward = ref(false)
const results = ref([])
const copied = ref(false)

// 游戏模式
const gameModes = [
  {
    id: 'story',
    name: '故事模式',
    description: '通过小故事生成有意义的密码组合',
    icon: Lock
  },
  {
    id: 'mnemonic',
    name: '记忆词模式',
    description: '使用熟悉的词汇组合生成易记密码',
    icon: Sparkles
  },
  {
    id: 'dice',
    name: '骰子模式',
    description: '模拟掷骰子，元素随机组合',
    icon: Dice6
  },
  {
    id: 'pattern',
    name: '图案模式',
    description: '键盘图案位置生成密码',
    icon: Hash
  },
  {
    id: 'adventure',
    name: '冒险模式',
    description: '模拟冒险寻宝获取密码',
    icon: Sparkles
  },
  {
    id: 'puzzle',
    name: '拼图模式',
    description: '拼图式密码元素组合',
    icon: Lock
  }
]

// 计算属性
const canGenerate = computed(() => {
  return includeLowercase.value || includeUppercase.value || includeNumbers.value || includeSymbols.value
})

const totalPasswords = computed(() => {
  return results.value.reduce((total, result) => total + result.passwords.length, 0)
})

const allPasswords = computed(() => {
  return results.value.flatMap(result => result.passwords)
})

const strengthStats = computed(() => {
  const stats = { strong: 0, medium: 0, weak: 0 }
  allPasswords.value.forEach(password => {
    stats[password.strength]++
  })
  return stats
})

// 记忆词汇
const mnemonicWords = {
  animals: ['tiger', 'elephant', 'rabbit', 'dragon', 'phoenix', 'unicorn', 'panda', 'koala', 'eagle', 'wolf'],
  fruits: ['apple', 'banana', 'orange', 'grape', 'mango', 'cherry', 'peach', 'berry', 'lemon', 'melon'],
  colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'white'],
  places: ['beach', 'mountain', 'forest', 'city', 'ocean', 'desert', 'river', 'lake', 'valley', 'island'],
  mixed: ['happy', 'lucky', 'magic', 'dream', 'star', 'moon', 'sun', 'cloud', 'rain', 'snow']
}

// 故事模板
const storyTemplates = [
  '勇敢的{hero}在{place}找到了{treasure}',
  '{hero}和{companion}一起{action}了{treasure}',
  '在{time}，{hero}发现了神秘的{treasure}',
  '{place}里隐藏着{adjective}{treasure}',
  '{hero}的{color}{weapon}能够{action}{treasure}'
]

// 生成字符池
const getCharacterPool = () => {
  let pool = ''
  if (includeLowercase.value) pool += 'abcdefghijklmnopqrstuvwxyz'
  if (includeUppercase.value) pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (includeNumbers.value) pool += '0123456789'
  if (includeSymbols.value) pool += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  return pool
}

// 计算密码强度
const calculateStrength = (password) => {
  let score = 0

  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score >= 5) return 'strong'
  if (score >= 3) return 'medium'
  return 'weak'
}

// 获取强度文本
const getStrengthText = (strength) => {
  const texts = {
    strong: '强',
    medium: '中等',
    weak: '弱'
  }
  return texts[strength] || '未知'
}

// 选择模式
const selectMode = (modeId) => {
  selectedMode.value = modeId
}

// 故事模式生成
const generateStoryPassword = () => {
  const templates = storyTemplates
  const template = templates[Math.floor(Math.random() * templates.length)]

  const words = {
    hero: ['骑士', '法师', '游侠', '战士', '忍者', '海盗', '探险家'],
    place: ['森林', '城堡', '洞穴', '海底', '天空', '沙漠', '雪山'],
    treasure: ['宝石', '钥匙', '地图', '卷轴', '法杖', '圣剑', '护身符'],
    companion: ['巨龙', '凤凰', '独角兽', '精灵', '矮人', '巨人'],
    action: ['找到', '发现', '获得', '解锁', '激活', '召唤'],
    time: ['清晨', '午夜', '黄昏', '黎明', '夜晚', '白天'],
    adjective: ['神秘的', '古老的', '强大的', '闪耀的', '传奇的'],
    color: ['金色', '银色', '彩虹', '黑暗', '光明', '血色'],
    weapon: ['宝剑', '魔法棒', '盾牌', '弓箭', '战斧', '法杖']
  }

  let password = template
  Object.keys(words).forEach(key => {
    const options = words[key]
    const word = options[Math.floor(Math.random() * options.length)]
    password = password.replace(`{${key}}`, word)
  })

  return password
}

// 记忆词模式生成
const generateMnemonicPassword = () => {
  const theme = mnemonicTheme.value === 'mixed'
    ? Object.keys(mnemonicWords)[Math.floor(Math.random() * Object.keys(mnemonicWords).length)]
    : mnemonicTheme.value

  const words = mnemonicWords[theme] || mnemonicWords.animals
  const word1 = words[Math.floor(Math.random() * words.length)]
  const word2 = words[Math.floor(Math.random() * words.length)]

  return `${word1}${word2}${Math.floor(Math.random() * 1000)}`
}

// 骰子模式生成
const generateDicePassword = () => {
  const elements = []
  const diceCount = Math.floor(Math.random() * 4) + 2

  for (let i = 0; i < diceCount; i++) {
    const value = Math.floor(Math.random() * 6) + 1
    elements.push(value)
  }

  return elements.join('-')
}

// 图案模式生成
const generatePatternPassword = () => {
  const patterns = [
    'qwerty', 'asdf', 'zxcv', '12345', '98765',
    'qaz', 'wsx', 'edc', 'rfv', 'tgb', 'yhn', 'ujm', 'ik,',
    '1qa', '2ws', '3ed', '4rf', '5tg', '6yh', '7uj', '8ik', '9ol', '0p;'
  ]

  return patterns[Math.floor(Math.random() * patterns.length)]
}

// 冒险模式生成
const generateAdventurePassword = () => {
  const adventures = [
    'explore-quest', 'dragon-treasure', 'magic-kingdom', 'hero-journey',
    'mystery-island', 'ancient-ruins', 'crystal-cave', 'star-wars'
  ]

  const adventure = adventures[Math.floor(Math.random() * adventures.length)]
  const number = Math.floor(Math.random() * 1000)

  return `${adventure}-${number}`
}

// 拼图模式生成
const generatePuzzlePassword = () => {
  const pieces = ['puzzle', 'mystery', 'secret', 'hidden', 'code', 'key']
  const piece1 = pieces[Math.floor(Math.random() * pieces.length)]
  const piece2 = pieces[Math.floor(Math.random() * pieces.length)]

  return `${piece1}${piece2}${Date.now().toString().slice(-4)}`
}

// 生成密码
const generatePassword = () => {
  let password = ''

  // 根据模式生成密码
  switch (selectedMode.value) {
    case 'story':
      password = generateStoryPassword()
      break
    case 'mnemonic':
      password = generateMnemonicPassword()
      break
    case 'dice':
      password = generateDicePassword()
      break
    case 'pattern':
      password = generatePatternPassword()
      break
    case 'adventure':
      password = generateAdventurePassword()
      break
    case 'puzzle':
      password = generatePuzzlePassword()
      break
    default:
      // 默认随机生成
      const pool = getCharacterPool()
      for (let i = 0; i < passwordLength.value; i++) {
        password += pool[Math.floor(Math.random() * pool.length)]
      }
  }

  // 确保密码长度符合要求
  if (password.length > passwordLength.value) {
    password = password.substring(0, passwordLength.value)
  } else if (password.length < passwordLength.value) {
    const pool = getCharacterPool()
    while (password.length < passwordLength.value) {
      password += pool[Math.floor(Math.random() * pool.length)]
    }
  }

  const strength = calculateStrength(password)
  const hint = generateHint(password)

  return { value: password, strength, hint }
}

// 生成提示
const generateHint = (password) => {
  const hints = [
    `首字母是 ${password[0].toUpperCase()}`,
    `包含 ${password.length} 个字符`,
    `以 ${password[password.length - 1].toUpperCase()} 结尾`,
    `这个密码很好记！`,
    `记得要妥善保管哦~`,
    `强度评级：${getStrengthText(calculateStrength(password))}`
  ]

  return hints[Math.floor(Math.random() * hints.length)]
}

// 骰子模式
const rollDiceMode = () => {
  selectedMode.value = 'dice'
  generatePasswords()
}

// 生成密码
const generatePasswords = async () => {
  if (isGenerating.value || !canGenerate) return

  isGenerating.value = true
  showReward.value = false

  // 模拟开宝箱动画
  await new Promise(resolve => setTimeout(resolve, 1000))

  const passwords = []
  for (let i = 0; i < generateCount.value; i++) {
    passwords.push(generatePassword())
  }

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  results.value.unshift({
    passwords,
    timestamp,
    mode: selectedMode.value
  })

  if (results.value.length > 10) {
    results.value = results.value.slice(0, 10)
  }

  showReward.value = true
  setTimeout(() => {
    showReward.value = false
  }, 2000)

  isGenerating.value = false
}

// 复制单个密码
const copySinglePassword = async (password) => {
  try {
    await navigator.clipboard.writeText(password)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 复制所有密码
const copyPasswords = async () => {
  try {
    const passwords = results.value[0].passwords.map(p => p.value)
    const text = passwords.join('\n')

    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 清空结果
const clearResults = () => {
  results.value = []
}
</script>