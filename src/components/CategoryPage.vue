<script setup>
import { computed } from 'vue'
import { 
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  tools: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['tool-select'])

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

const iconComponent = computed(() => {
  return iconMap[props.category.icon] || FileText
})

// 当前分类的工具
const categoryTools = computed(() => {
  return props.tools.filter(tool => tool.category === props.category.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

// SEO内容映射
const seoContent = computed(() => {
  const contentMap = {
    format: {
      title: '在线数据格式化工具箱',
      description: '专业的JSON、XML、SQL等数据格式化和美化工具，支持实时预览和多种格式转换，提高开发效率。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">常见数据格式说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">JSON格式</h4>
            <p class="text-sm text-muted-foreground mb-2">JavaScript Object Notation是一种轻量级的数据交换格式，易于人阅读和编写，也易于机器解析和生成。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 语法简洁，层次结构清晰</li>
              <li>• 广泛应用于Web API数据传输</li>
              <li>• 支持数组、对象、字符串、数字等数据类型</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">XML格式</h4>
            <p class="text-sm text-muted-foreground mb-2">可扩展标记语言，用于标记电子文件使其具有结构性的标记语言，可以用来标记数据、定义数据类型。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 支持自定义标签和命名空间</li>
              <li>• 严格的语法规则，便于验证</li>
              <li>• 广泛用于配置文件和数据交换</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">为什么需要格式化数据？</h4>
            <p class="text-sm text-muted-foreground mt-1">格式化能够提高数据的可读性，便于调试和分析，特别是在处理复杂嵌套结构时尤为重要。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">格式化会影响数据内容吗？</h4>
            <p class="text-sm text-muted-foreground mt-1">不会，格式化只是改变数据显示的方式，不会修改数据的实际内容和结构。</p>
          </div>
        </div>
      `
    },
    encode: {
      title: '在线编码解码工具箱',
      description: '支持Base64、URL编码、HTML实体编码等多种编码解码操作，保障数据传输安全性和完整性。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">常见编码格式说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">Base64编码</h4>
            <p class="text-sm text-muted-foreground mb-2">一种基于64个可打印字符来表示二进制数据的表示方法，常用于在通常处理文本数据的场合传输二进制数据。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 编码后数据体积约增加33%</li>
              <li>• 广泛用于图片、文件等二进制数据传输</li>
              <li>• 不是加密算法，不能用于数据保密</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">URL编码</h4>
            <p class="text-sm text-muted-foreground mb-2">也称为百分号编码，是特定上下文的统一资源定位符（URL）的编码机制，主要用于统一资源标识符（URI）中。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 将特殊字符转换为%加两位十六进制数</li>
              <li>• 确保URL在各种网络协议中正确传输</li>
              <li>• 常见于GET参数和表单提交</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">Base64编码安全吗？</h4>
            <p class="text-sm text-muted-foreground mt-1">Base64不是加密算法，仅仅是编码方式，任何人都可以轻松解码，不能用于敏感数据保护。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">什么情况下需要URL编码？</h4>
            <p class="text-sm text-muted-foreground mt-1">当URL中包含非ASCII字符、特殊符号或保留字符时，需要进行URL编码以确保正确传输。</p>
          </div>
        </div>
      `
    },
    crypto: {
      title: '在线加密解密工具箱',
      description: '提供MD5、SHA系列、AES等主流加密算法工具，保障数据安全性和完整性校验。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">常见加密算法说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">MD5哈希算法</h4>
            <p class="text-sm text-muted-foreground mb-2">一种广泛使用的密码散列函数，可以产生出一个128位（16字节）的散列值，用于确保信息传输完整一致。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 输出固定长度的128位摘要</li>
              <li>• 不可逆，不能用于加密</li>
              <li>• 已不推荐用于安全敏感场景</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">SHA系列算法</h4>
            <p class="text-sm text-muted-foreground mb-2">安全哈希算法家族，包括SHA-1、SHA-256、SHA-512等，安全性逐级增强。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• SHA-256是目前推荐使用的安全算法</li>
              <li>• 广泛用于数字签名和证书验证</li>
              <li>• 输出长度越长，安全性越高</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">哈希算法和加密算法有什么区别？</h4>
            <p class="text-sm text-muted-foreground mt-1">哈希算法是单向的，不可逆转，主要用于数据完整性校验；加密算法是双向的，可以加密和解密。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">如何选择合适的加密算法？</h4>
            <p class="text-sm text-muted-foreground mt-1">对于数据传输加密，推荐使用AES；对于密码存储，推荐使用bcrypt或scrypt；对于数据完整性校验，推荐使用SHA-256。</p>
          </div>
        </div>
      `
    },
    time: {
      title: '在线时间日期工具箱',
      description: 'Unix时间戳转换、时区计算、日期格式化等时间处理工具，解决跨时区时间计算问题。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">时间概念说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">Unix时间戳</h4>
            <p class="text-sm text-muted-foreground mb-2">Unix时间戳是从1970年1月1日（UTC/GMT的午夜）开始所经过的秒数，不包括闰秒。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 10位数字表示秒级时间戳</li>
              <li>• 13位数字表示毫秒级时间戳</li>
              <li>• 广泛用于程序日志和数据库记录</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">时区与时差</h4>
            <p class="text-sm text-muted-foreground mb-2">全球划分为24个时区，相邻时区相差1小时，解决不同时区之间的时间协调问题。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• UTC是协调世界时，作为全球标准时间</li>
              <li>• CST是中国标准时间，UTC+8</li>
              <li>• PST是太平洋标准时间，UTC-8</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">为什么需要时间戳？</h4>
            <p class="text-sm text-muted-foreground mt-1">时间戳不受时区影响，便于程序处理和排序，是系统间时间同步的标准方式。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">如何处理夏令时问题？</h4>
            <p class="text-sm text-muted-foreground mt-1">使用标准时区库处理夏令时转换，避免手动计算造成的时间误差。</p>
          </div>
        </div>
      `
    },
    text: {
      title: '在线文本处理工具箱',
      description: '正则表达式测试、文本对比、大小写转换、字符统计等文本处理工具，提高文本操作效率。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">文本处理概念说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">正则表达式</h4>
            <p class="text-sm text-muted-foreground mb-2">一种特殊的字符序列，用于匹配、查找和替换符合某个句法规则的字符串，是强大的文本处理工具。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• ^匹配行首，$匹配行尾</li>
              <li>• []表示字符集合，()表示分组</li>
              <li>• *表示0次或多次，+表示1次或多次</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">文本对比</h4>
            <p class="text-sm text-muted-foreground mb-2">比较两个文本之间的差异，标识新增、删除和修改的内容，常用于版本控制和文档审核。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 支持行级和字符级差异对比</li>
              <li>• 可视化显示差异内容</li>
              <li>• 支持忽略空白字符等选项</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">如何学习正则表达式？</h4>
            <p class="text-sm text-muted-foreground mt-1">从基础语法开始，多练习常用模式，使用在线工具测试验证，逐步掌握复杂表达式。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">文本处理有哪些最佳实践？</h4>
            <p class="text-sm text-muted-foreground mt-1">备份原始数据，使用合适工具，注意编码格式，对于复杂处理建议编写脚本自动化。</p>
          </div>
        </div>
      `
    },
    network: {
      title: '在线网络工具箱',
      description: 'IP地址查询、DNS解析、HTTP请求测试等网络诊断工具，帮助排查网络连接问题。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">网络基础知识</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">IP地址</h4>
            <p class="text-sm text-muted-foreground mb-2">互联网协议地址是分配给网络上使用IP协议的设备的数字标签，分为IPv4和IPv6两种格式。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• IPv4是32位地址，通常表示为四个十进制数</li>
              <li>• IPv6是128位地址，表示为八组四位十六进制数</li>
              <li>• 内网IP用于局域网，公网IP用于互联网</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">DNS解析</h4>
            <p class="text-sm text-muted-foreground mb-2">域名系统将人类可读的域名转换为机器可读的IP地址，是互联网访问的基础服务。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 递归查询获取最终解析结果</li>
              <li>• 缓存机制提高解析效率</li>
              <li>• A记录指向IPv4地址，AAAA记录指向IPv6地址</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">如何排查网络连接问题？</h4>
            <p class="text-sm text-muted-foreground mt-1">依次检查物理连接、IP配置、DNS解析、防火墙设置，使用ping、traceroute等工具定位故障点。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">什么是CDN？</h4>
            <p class="text-sm text-muted-foreground mt-1">内容分发网络通过在全球部署节点，让用户就近获取所需内容，降低网络拥塞，提高访问响应速度。</p>
          </div>
        </div>
      `
    },
    image: {
      title: '在线图像处理工具箱',
      description: '图片压缩、格式转换、尺寸调整、水印添加等图像处理工具，无需上传即可本地处理。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">图像处理基础知识</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">图像格式</h4>
            <p class="text-sm text-muted-foreground mb-2">不同的图像格式适用于不同场景，JPEG适合照片，PNG支持透明度，GIF支持动画。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• JPEG有损压缩，文件小，适合照片</li>
              <li>• PNG无损压缩，支持透明，适合图标</li>
              <li>• WebP兼顾质量和体积，是现代网页首选</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">图像压缩原理</h4>
            <p class="text-sm text-muted-foreground mb-2">通过算法减少图像文件大小，分为有损压缩和无损压缩两种方式。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 有损压缩会损失部分图像细节</li>
              <li>• 无损压缩保持图像质量不变</li>
              <li>• 压缩率和质量需要平衡考虑</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">如何选择合适的图像格式？</h4>
            <p class="text-sm text-muted-foreground mt-1">照片选择JPEG，需要透明度选择PNG，追求最佳效果选择WebP，简单图形选择SVG。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">图像压缩会影响质量吗？</h4>
            <p class="text-sm text-muted-foreground mt-1">有损压缩会降低图像质量，无损压缩不会，需要根据用途选择合适的压缩方式。</p>
          </div>
        </div>
      `
    },
    dev: {
      title: '在线开发辅助工具箱',
      description: 'Mock数据生成、API文档查看、代码片段生成等开发辅助工具，提升开发效率。',
      knowledge: `
        <h3 class="text-lg font-semibold mb-3">开发辅助工具说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-primary mb-2">Mock数据</h4>
            <p class="text-sm text-muted-foreground mb-2">模拟真实数据用于前端开发和测试，避免依赖后端接口，提高开发效率。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• 支持自定义数据结构和格式</li>
              <li>• 可生成大量测试数据</li>
              <li>• 支持RESTful API模拟</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">API文档</h4>
            <p class="text-sm text-muted-foreground mb-2">标准化的接口文档，描述API的请求参数、响应格式、错误码等信息，便于前后端协作。</p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li>• OpenAPI/Swagger是主流标准</li>
              <li>• 自动生成交互式文档</li>
              <li>• 支持在线测试API接口</li>
            </ul>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-3">常见问题FAQ</h3>
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-primary">为什么要使用Mock数据？</h4>
            <p class="text-sm text-muted-foreground mt-1">前后端可以并行开发，前端不依赖后端接口完成，提高开发效率和测试覆盖率。</p>
          </div>
          <div>
            <h4 class="font-medium text-primary">如何编写好的API文档？</h4>
            <p class="text-sm text-muted-foreground mt-1">详细描述每个接口的功能、参数、返回值和示例，使用标准格式，保持及时更新。</p>
          </div>
        </div>
      `
    }
  }
  
  return contentMap[props.category.id] || {
    title: `${props.category.name}工具箱`,
    description: props.category.description,
    knowledge: '<p>暂无相关知识库内容</p>'
  }
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

// 处理工具选择
const handleToolSelect = (tool) => {
  emit('tool-select', tool)
  // 添加到最近使用
  addRecentTool(tool.id)
}
</script>

<template>
  <div class="max-w-8xl mx-auto">
    <!-- 增强型头部 -->
    <div class="mb-8">
      <!-- 面包屑导航 -->
      <Breadcrumb :category="category" />
      
      <!-- 标题和描述 -->
      <div class="mt-4">
        <h1 class="text-3xl font-bold mb-3">{{ seoContent.title }}</h1>
        <p class="text-muted-foreground max-w-3xl">{{ seoContent.description }}</p>
      </div>
    </div>
    
    <!-- 工具网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
      <ToolCard
        v-for="tool in categoryTools"
        :key="tool.id"
        :tool="tool"
        :title="tool.name"
        :description="tool.description"
        :category="tool.category"
        :usage-count="formatViewCount(tool.viewCount)"
        :icon="tool.icon"
        @select="handleToolSelect"
      />
    </div>
    
    <!-- 空状态 -->
    <div 
      v-if="categoryTools.length === 0"
      class="text-center py-12"
    >
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <FolderOpen class="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-medium text-foreground">暂无工具</h3>
      <p class="text-muted-foreground mt-2">该分类下还没有添加工具</p>
    </div>
    
    <!-- SEO知识库区域 -->
    <div 
      v-if="categoryTools.length > 0"
      class="bg-gray-900 rounded-xl p-6 mt-8"
    >
      <div class="prose prose-invert max-w-none">
        <div v-html="seoContent.knowledge"></div>
      </div>
    </div>
  </div>
</template>