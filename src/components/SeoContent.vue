<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: String,
    required: true
  }
})

// SEO内容映射
const seoContent = computed(() => {
  const contentMap = {
    finance: {
      title: '金融理财知识库',
      sections: [
        {
          id: 'investment-basics',
          title: '投资基础知识',
          content: '投资是指通过投入资金或资源，以期在未来获得收益的行为。投资的基本原则包括风险与收益的平衡、分散投资、长期投资等。',
          details: {
            title: '常见投资类型：',
            items: [
              '股票投资：购买公司股票成为股东，分享公司成长收益',
              '债券投资：购买债券成为债权人，获得固定利息收入',
              '基金投资：通过基金公司间接投资多种金融产品',
              '房地产投资：购买房产进行出租或等待升值',
              '商品投资：投资黄金、石油等大宗商品'
            ]
          }
        },
        {
          id: 'risk-management',
          title: '风险管理原则',
          content: '风险管理是投资过程中最重要的环节之一。合理的风险管理可以帮助投资者在市场波动中保护本金并获得稳定收益。',
          details: {
            title: '风险管理方法：',
            items: [
              '分散投资：不要把鸡蛋放在同一个篮子里',
              '资产配置：根据风险承受能力配置不同类型资产',
              '止损设置：设定合理的止损点控制损失',
              '定期调整：根据市场变化调整投资组合',
              '风险承受能力评估：了解自己的风险承受能力'
            ]
          }
        },
        {
          id: 'compound-interest',
          title: '复利效应',
          content: '复利是指投资产生的收益会继续产生收益的现象。爱因斯坦称之为"世界第八大奇迹"，长期来看复利效应能够带来惊人的财富增长。',
          details: {
            title: '复利计算公式：',
            items: [
              '复利终值 = 本金 × (1 + 年化收益率) ^ 投资年限',
              '72法则：72 ÷ 年化收益率 = 本金翻倍所需年限',
              '定期定投：定期定额投资能够平滑市场波动风险',
              '时间价值：投资时间越长，复利效应越明显'
            ]
          }
        },
        {
          id: 'retirement-planning',
          title: '退休规划要点',
          content: '退休规划是为确保退休后有足够的收入来源而进行的财务规划。合理的退休规划应该考虑通货膨胀、医疗支出、生活品质等因素。',
          details: {
            title: '退休规划步骤：',
            items: [
              '设定退休目标：确定退休年龄和期望的生活水平',
              '评估当前财务状况：了解现有的储蓄和投资',
              '计算退休金需求：估算退休后所需的总金额',
              '制定储蓄计划：设定定期储蓄目标和投资策略',
              '定期审视调整：根据实际情况调整退休计划'
            ]
          }
        }
      ]
    },
    encode: {
      title: '编码格式速查手册',
      sections: [
        {
          id: 'base64',
          title: 'Base64 原理与应用',
          content: 'Base64 是一种基于64个可打印字符来表示二进制数据的表示方法。它常用于在通常处理文本数据的场合传输二进制数据。',
          details: {
            title: '应用场景：',
            items: [
              '电子邮件附件传输（MIME）',
              '在URL、Cookie或表单数据中嵌入二进制数据',
              'CSS中嵌入小图片以减少HTTP请求'
            ]
          }
        }
      ]
    },
    format: {
      title: '数据格式化指南',
      sections: [
        {
          id: 'json-format',
          title: 'JSON 格式化规则',
          content: 'JSON (JavaScript Object Notation) 是一种轻量级的数据交换格式。良好的格式化可以提高代码可读性和维护性。',
          details: {
            title: '格式化要点：',
            items: [
              '使用2个空格进行缩进',
              '对象属性名使用双引号',
              '字符串值使用双引号',
              '数组元素之间适当换行'
            ]
          }
        }
      ]
    }
  }

  return contentMap[props.category] || {
    title: '工具使用指南',
    sections: [
      {
        id: 'getting-started',
        title: '快速入门',
        content: '使用我们的在线工具可以大大提高您的工作效率。所有工具都支持实时处理，无需下载安装。',
        details: {
          title: '使用特点：',
          items: [
            '完全免费使用，无需注册',
            '支持多种数据格式',
            '实时处理，即时反馈',
            '数据本地处理，安全可靠'
          ]
        }
      }
    ]
  }
})
</script>

<template>
  <div class="mt-12 border-t pt-8">
    <h2 class="text-2xl font-bold mb-6">{{ seoContent.title }}</h2>

    <div class="space-y-8">
      <div
        v-for="section in seoContent.sections"
        :key="section.id"
        :id="section.id"
        class="scroll-mt-24"
      >
        <h3 class="text-xl font-semibold mb-4 text-primary">
          {{ section.id }}. {{ section.title }}
        </h3>

        <p class="text-muted-foreground mb-4 leading-relaxed">
          {{ section.content }}
        </p>

        <div v-if="section.details" class="bg-muted/50 rounded-lg p-6">
          <h4 class="font-semibold mb-3">{{ section.details.title }}</h4>
          <ul class="space-y-2">
            <li
              v-for="(item, index) in section.details.items"
              :key="index"
              class="flex items-start"
            >
              <span class="text-primary mr-2 mt-1">•</span>
              <span class="text-sm text-muted-foreground">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>