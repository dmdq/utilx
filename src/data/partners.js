// 「元器件合作伙伴」位（导流三阶段·阶段2 基础设施）
// ============================================================
// 用法：collections.js 条目加 partnerSlot: true → 该专题页尾渲染 PartnerLinks 组件；
//       本文件中 enabled: true 且 item.url 非空的条目才会实际渲染。
// 红线（见 docs/TOOL_ELECTRONICS_RESEARCH_2026-11-05.md 附录·建议三）：
//   1) 栏目标注「合作伙伴」而非「广告」；
//   2) 外链一律 rel="sponsored nofollow"（组件内已固化）；
//   3) 只挂在内容强相关的专题页，不做全站横幅；
//   4) 数据不上传品牌不变，此栏位为静态展示，无任何追踪脚本。
// 上线步骤：拿到合作方店铺/服务真实链接后，填入 items 并把 enabled 改 true，
//           重新 npm run build:static 即生效；不填则整块不渲染（当前态）。

export const partners = [
  {
    id: 'partner-electronics',
    enabled: true, // ← 总开关：待合作方真实链接填入后改 true
    slotTitle: '元器件合作伙伴',
    note: '本栏目面向元器件销售与 IC 测试服务商开放，按页面内容相关性展示，非广告投放；与本站无数据交换。',
    items: [
      {
        enabled: true, // ← 单条开关
        name: '上海工品实业有限公司',
        tag: '元器件供应',
        desc: '电容器、传感器、IC 芯片、PCB 板现货供应，面向工程师选型与维修换件。',
        url: 'https://www.shgopi.cn/', // ← 待填：合作方店铺或官网链接
      },
      {
        enabled: true,
        name: '苏州哆咪泰科智能科技有限公司',
        tag: 'IC 测试',
        desc: '集成电路测试代工、批量筛选与来料检验。',
        url: 'http://www.domitech.cn/', // ← 待填：测试服务介绍页链接
      },
      {
        enabled: true, // ← 单条开关
        name: '深圳市唯电电子有限公司',
        tag: '元器件供应',
        desc: '电容器生产厂家；定制电容、替代电容、电容选型、电容现货销售',
        url: 'https://www.dianrong1.com/', // ← 待填：合作方店铺或官网链接
      },
    ],
  },
]
