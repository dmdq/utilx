import {
  Tag, Hash, FileJson, FileText, Database, Link, Timer, Regex,
  Globe, Shield, Code, Calculator, Image as ImageIcon, Heart, DollarSign, Zap,
  Lock, Palette, Calendar, Quote, BarChart, TrendingUp, Wifi, Cpu, Package,
  Braces, Terminal, Layers, Grid3X3, PieChart, Activity, SortAsc, Users,
  Building, Briefcase, PiggyBank, HelpCircle, Eye, RefreshCw, Send,
  GraduationCap, Home, Gamepad, Receipt, FileSpreadsheet, Edit, Utensils,
  CheckSquare, RotateCw, User, Gift, Circle, Percent, Shuffle, Merge,
  List, Presentation, TrendingDown, Key, File, FileCode, Wrench, Star,
  Plus, Gamepad2, SortDesc, Settings
} from 'lucide-vue-next'

// 标签详细信息配置
export const tagDefinitions = [
  {
    id: 'json',
    name: 'JSON',
    icon: 'FileJson',
    color: '#3B82F6',
    description: 'JSON数据格式化、解析和转换相关工具',
    sort: 1
  },
  {
    id: 'format',
    name: '格式化',
    icon: 'FileText',
    color: '#10B981',
    description: '代码和数据格式化美化工具',
    sort: 2
  },
  {
    id: 'beautify',
    name: '美化',
    icon: 'Palette',
    color: '#8B5CF6',
    description: '代码美化和格式化工具',
    sort: 3
  },
  {
    id: 'compress',
    name: '压缩',
    icon: 'Package',
    color: '#F59E0B',
    description: '文件和数据压缩工具',
    sort: 4
  },
  {
    id: 'validation',
    name: '验证',
    icon: 'Shield',
    color: '#EF4444',
    description: '数据验证和校验工具',
    sort: 5
  },
  {
    id: 'parsing',
    name: '解析',
    icon: 'Code',
    color: '#06B6D4',
    description: '数据解析和处理工具',
    sort: 6
  },
  {
    id: 'xml',
    name: 'XML',
    icon: 'FileCode',
    color: '#F97316',
    description: 'XML数据格式处理工具',
    sort: 7
  },
  {
    id: 'convert',
    name: '转换',
    icon: 'RefreshCw',
    color: '#84CC16',
    description: '各种数据格式转换工具',
    sort: 8
  },
  {
    id: 'data-format',
    name: '数据格式',
    icon: 'Database',
    color: '#0EA5E9',
    description: '数据格式处理和转换工具',
    sort: 9
  },
  {
    id: 'serialization',
    name: '序列化',
    icon: 'Layers',
    color: '#6366F1',
    description: '数据序列化和反序列化工具',
    sort: 10
  },
  {
    id: 'yaml',
    name: 'YAML',
    icon: 'FileJson',
    color: '#EC4899',
    description: 'YAML配置文件处理工具',
    sort: 11
  },
  {
    id: 'config',
    name: '配置文件',
    icon: 'Settings',
    color: '#14B8A6',
    description: '配置文件生成和编辑工具',
    sort: 12
  },
  {
    id: 'data-processing',
    name: '数据处理',
    icon: 'BarChart',
    color: '#F43F5E',
    description: '数据统计和分析处理工具',
    sort: 13
  },
  {
    id: 'text-tool',
    name: '文本工具',
    icon: 'FileText',
    color: '#6B7280',
    description: '文本编辑和处理工具集',
    sort: 14
  },
  {
    id: 'base64',
    name: 'Base64',
    icon: 'Hash',
    color: '#8B5CF6',
    description: 'Base64编码解码工具',
    sort: 15
  },
  {
    id: 'encoding',
    name: '编码',
    icon: 'Lock',
    color: '#DC2626',
    description: '字符编码和解码工具',
    sort: 16
  },
  {
    id: 'tool',
    name: '工具',
    icon: 'Wrench',
    color: '#059669',
    description: '实用工具集合',
    sort: 17
  },
  {
    id: 'practical',
    name: '实用',
    icon: 'Star',
    color: '#7C3AED',
    description: '实用小工具集合',
    sort: 18
  },
  {
    id: 'online',
    name: '在线',
    icon: 'Globe',
    color: '#0891B2',
    description: '在线使用的网络工具',
    sort: 19
  },
  {
    id: 'url',
    name: 'URL',
    icon: 'Link',
    color: '#2563EB',
    description: 'URL编码解码处理工具',
    sort: 20
  },
  {
    id: 'html',
    name: 'HTML',
    icon: 'Code',
    color: '#E11D48',
    description: 'HTML代码处理和格式化工具',
    sort: 21
  },
  {
    id: 'convenient',
    name: '便捷',
    icon: 'Zap',
    color: '#65A30D',
    description: '便捷实用的工具集',
    sort: 22
  },
  {
    id: 'efficient',
    name: '高效',
    icon: 'Activity',
    color: '#DC2626',
    description: '提高工作效率的工具',
    sort: 23
  },
  {
    id: 'qrcode',
    name: '二维码',
    icon: 'Grid3X3',
    color: '#1E40AF',
    description: '二维码生成和解析工具',
    sort: 24
  },
  {
    id: 'generate',
    name: '生成',
    icon: 'Plus',
    color: '#059669',
    description: '数据生成器工具',
    sort: 25
  },
  {
    id: 'encryption',
    name: '加密',
    icon: 'Lock',
    color: '#991B1B',
    description: '数据加密和安全保护工具',
    sort: 26
  },
  {
    id: 'decryption',
    name: '解密',
    icon: 'Unlock',
    color: '#059669',
    description: '数据解密工具',
    sort: 27
  },
  {
    id: 'security',
    name: '安全',
    icon: 'Shield',
    color: '#BE185D',
    description: '网络安全和加密工具',
    sort: 28
  },
  {
    id: 'hash',
    name: '哈希',
    icon: 'Hash',
    color: '#6D28D9',
    description: '哈希值生成和验证工具',
    sort: 29
  },
  {
    id: 'developer',
    name: '开发者',
    icon: 'Code',
    color: '#0369A1',
    description: '面向开发者的专业工具',
    sort: 30
  },
  {
    id: 'text-processing',
    name: '文本处理',
    icon: 'FileText',
    color: '#475569',
    description: '文本编辑和处理工具',
    sort: 31
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    icon: 'PieChart',
    color: '#B91C1C',
    description: '数据统计和分析工具',
    sort: 32
  },
  {
    id: 'cryptography',
    name: '密码学',
    icon: 'Key',
    color: '#581C87',
    description: '密码学相关工具',
    sort: 33
  },
  {
    id: 'network',
    name: '网络',
    icon: 'Wifi',
    color: '#1E3A8A',
    description: '网络协议和诊断工具',
    sort: 34
  },
  {
    id: 'time',
    name: '时间',
    icon: 'Timer',
    color: '#B45309',
    description: '时间和日期处理工具',
    sort: 35
  },
  {
    id: 'image',
    name: '图像',
    icon: 'ImageIcon',
    color: '#166534',
    description: '图片处理和转换工具',
    sort: 36
  },
  {
    id: 'file',
    name: '文件',
    icon: 'File',
    color: '#6B21A8',
    description: '文件处理和管理工具',
    sort: 37
  },
  {
    id: 'color',
    name: '颜色',
    icon: 'Palette',
    color: '#C2410C',
    description: '颜色选择和转换工具',
    sort: 38
  },
  {
    id: 'random',
    name: '随机',
    icon: 'Shuffle',
    color: '#15803D',
    description: '随机数生成器工具',
    sort: 39
  },
  {
    id: 'finance',
    name: '金融',
    icon: 'DollarSign',
    color: '#92400E',
    description: '金融计算和理财工具',
    sort: 40
  },
  {
    id: 'health',
    name: '健康',
    icon: 'Heart',
    color: '#BE123C',
    description: '健康指标计算工具',
    sort: 41
  },
  {
    id: 'calculator',
    name: '计算器',
    icon: 'Calculator',
    color: '#1D4ED8',
    description: '各类计算器工具',
    sort: 42
  },
  {
    id: 'regex',
    name: '正则',
    icon: 'Regex',
    color: '#7C2D12',
    description: '正则表达式测试工具',
    sort: 43
  },
  {
    id: 'test',
    name: '测试',
    icon: 'CheckSquare',
    color: '#166534',
    description: '测试和验证工具',
    sort: 44
  },
  {
    id: 'api',
    name: 'API',
    icon: 'Code',
    color: '#7C3AED',
    description: 'API开发和测试工具',
    sort: 45
  },
  {
    id: 'http',
    name: 'HTTP',
    icon: 'Globe',
    color: '#DC2626',
    description: 'HTTP请求处理工具',
    sort: 46
  },
  {
    id: 'port',
    name: '端口',
    icon: 'Activity',
    color: '#0891B2',
    description: '网络端口扫描工具',
    sort: 47
  },
  {
    id: 'domain',
    name: '域名',
    icon: 'Globe',
    color: '#1E40AF',
    description: '域名相关工具',
    sort: 48
  },
  {
    id: 'ip',
    name: 'IP',
    icon: 'Activity',
    color: '#047857',
    description: 'IP地址处理工具',
    sort: 49
  },
  {
    id: 'spine',
    name: 'Spine',
    icon: 'Layers',
    color: '#EC4899',
    description: 'Spine骨骼动画编辑器',
    sort: 50
  },
  {
    id: 'animation',
    name: '动画',
    icon: 'Activity',
    color: '#8B5CF6',
    description: '动画制作和编辑工具',
    sort: 51
  },
  {
    id: 'editor',
    name: '编辑器',
    icon: 'Code',
    color: '#3B82F6',
    description: '各类编辑器工具',
    sort: 52
  },
  {
    id: 'preview',
    name: '预览',
    icon: 'Eye',
    color: '#10B981',
    description: '预览和查看工具',
    sort: 53
  },
  {
    id: 'game-dev',
    name: '游戏开发',
    icon: 'Gamepad',
    color: '#F59E0B',
    description: '游戏开发相关工具',
    sort: 54
  },
  {
    id: 'css',
    name: 'CSS',
    icon: 'Code',
    color: '#3B82F6',
    description: 'CSS样式处理和格式化工具',
    sort: 55
  },
  {
    id: 'pdf',
    name: 'PDF',
    icon: 'FileText',
    color: '#DC2626',
    description: 'PDF文档处理工具',
    sort: 56
  },
  {
    id: 'roi',
    name: 'ROI',
    icon: 'TrendingUp',
    color: '#059669',
    description: '投资回报率计算工具',
    sort: 57
  },
  {
    id: 'tax',
    name: '个税',
    icon: 'Calculator',
    color: '#7C3AED',
    description: '个人所得税计算工具',
    sort: 58
  },
  {
    id: 'tax-deduction',
    name: '个税抵扣',
    icon: 'Receipt',
    color: '#0891B2',
    description: '个税专项扣除计算工具',
    sort: 59
  },
  {
    id: 'tax-calculator',
    name: '个税计算',
    icon: 'Calculator',
    color: '#B91C1C',
    description: '个人所得税计算器',
    sort: 60
  },
  {
    id: 'corporate-tax',
    name: '企业所得税',
    icon: 'Building',
    color: '#1E40AF',
    description: '企业所得税计算工具',
    sort: 61
  },
  {
    id: 'corporate-finance',
    name: '企业财务',
    icon: 'Briefcase',
    color: '#0F766E',
    description: '企业财务分析工具',
    sort: 62
  },
  {
    id: 'bonds',
    name: '债券',
    icon: 'FileText',
    color: '#6B21A8',
    description: '债券收益计算工具',
    sort: 63
  },
  {
    id: 'savings',
    name: '储蓄计算',
    icon: 'PiggyBank',
    color: '#059669',
    description: '储蓄利息计算工具',
    sort: 64
  },
  {
    id: 'retirement',
    name: '养老',
    icon: 'Heart',
    color: '#DC2626',
    description: '养老规划工具',
    sort: 65
  },
  {
    id: 'pension',
    name: '养老金',
    icon: 'DollarSign',
    color: '#EA580C',
    description: '养老金计算工具',
    sort: 66
  },
  {
    id: 'decision',
    name: '决策',
    icon: 'HelpCircle',
    color: '#7C3AED',
    description: '决策辅助工具',
    sort: 67
  },
  {
    id: 'grouping',
    name: '分组',
    icon: 'Users',
    color: '#0EA5E9',
    description: '随机分组工具',
    sort: 68
  },
  {
    id: 'team-division',
    name: '分队',
    icon: 'Users',
    color: '#6366F1',
    description: '团队分队工具',
    sort: 69
  },
  {
    id: 'list',
    name: '列表',
    icon: 'List',
    color: '#6B7280',
    description: '列表处理工具',
    sort: 70
  },
  {
    id: 'bonus-plan',
    name: '发放方案',
    icon: 'Gift',
    color: '#EC4899',
    description: '奖金发放方案工具',
    sort: 71
  },
  {
    id: 'sentence',
    name: '句子',
    icon: 'FileText',
    color: '#84CC16',
    description: '句子生成和处理工具',
    sort: 72
  },
  {
    id: 'visualization',
    name: '可视化',
    icon: 'PieChart',
    color: '#F59E0B',
    description: '数据可视化工具',
    sort: 73
  },
  {
    id: 'merge',
    name: '合并',
    icon: 'Merge',
    color: '#8B5CF6',
    description: '文件和数据合并工具',
    sort: 74
  },
  {
    id: 'quote',
    name: '名言',
    icon: 'Quote',
    color: '#F97316',
    description: '名言生成工具',
    sort: 75
  },
  {
    id: 'team',
    name: '团队',
    icon: 'Users',
    color: '#3B82F6',
    description: '团队管理工具',
    sort: 76
  },
  {
    id: 'picture',
    name: '图片',
    icon: 'ImageIcon',
    color: '#10B981',
    description: '图片处理工具',
    sort: 77
  },
  {
    id: 'fund',
    name: '基金',
    icon: 'TrendingUp',
    color: '#059669',
    description: '基金收益计算工具',
    sort: 78
  },
  {
    id: 'vat',
    name: '增值税',
    icon: 'Receipt',
    color: '#DC2626',
    description: '增值税计算工具',
    sort: 79
  },
  {
    id: 'compound-interest',
    name: '复利计算',
    icon: 'Calculator',
    color: '#7C3AED',
    description: '复利收益计算工具',
    sort: 80
  },
  {
    id: 'forex',
    name: '外汇',
    icon: 'Globe',
    color: '#059669',
    description: '外汇汇率工具',
    sort: 81
  },
  {
    id: 'multilingual',
    name: '多语言',
    icon: 'Globe',
    color: '#0EA5E9',
    description: '多语言处理工具',
    sort: 82
  },
  {
    id: 'name',
    name: '姓名',
    icon: 'User',
    color: '#8B5CF6',
    description: '姓名生成工具',
    sort: 83
  },
  {
    id: 'entertainment',
    name: '娱乐',
    icon: 'Gamepad',
    color: '#EC4899',
    description: '娱乐工具集',
    sort: 84
  },
  {
    id: 'string',
    name: '字符串',
    icon: 'FileText',
    color: '#6B7280',
    description: '字符串处理工具',
    sort: 85
  },
  {
    id: 'password',
    name: '密码',
    icon: 'Lock',
    color: '#DC2626',
    description: '密码生成和管理工具',
    sort: 86
  },
  {
    id: 'yearly-bonus',
    name: '年终奖',
    icon: 'Gift',
    color: '#F59E0B',
    description: '年终奖计算工具',
    sort: 87
  },
  {
    id: 'poker',
    name: '扑克',
    icon: 'Gamepad',
    color: '#7C3AED',
    description: '扑克牌工具',
    sort: 88
  },
  {
    id: 'investment-return',
    name: '投资回报',
    icon: 'TrendingUp',
    color: '#059669',
    description: '投资回报计算工具',
    sort: 89
  },
  {
    id: 'extract',
    name: '抽取',
    icon: 'Shuffle',
    color: '#6366F1',
    description: '随机抽取工具',
    sort: 90
  },
  {
    id: 'lottery',
    name: '抽奖',
    icon: 'Gift',
    color: '#F97316',
    description: '抽奖工具',
    sort: 91
  },
  {
    id: 'sorting',
    name: '排序',
    icon: 'SortAsc',
    color: '#0EA5E9',
    description: '数据排序工具',
    sort: 92
  },
  {
    id: 'return-calculation',
    name: '收益计算',
    icon: 'Calculator',
    color: '#10B981',
    description: '投资收益计算工具',
    sort: 93
  },
  {
    id: 'teaching',
    name: '教学',
    icon: 'GraduationCap',
    color: '#7C3AED',
    description: '教学辅助工具',
    sort: 94
  },
  {
    id: 'number',
    name: '数字',
    icon: 'Hash',
    color: '#6B7280',
    description: '数字处理工具',
    sort: 95
  },
  {
    id: 'text',
    name: '文本',
    icon: 'FileText',
    color: '#475569',
    description: '文本编辑工具',
    sort: 96
  },
  {
    id: 'document',
    name: '文档',
    icon: 'File',
    color: '#6B21A8',
    description: '文档处理工具',
    sort: 97
  },
  {
    id: 'calendar',
    name: '日历',
    icon: 'Calendar',
    color: '#059669',
    description: '日历工具',
    sort: 98
  },
  {
    id: 'date',
    name: '日期',
    icon: 'Calendar',
    color: '#DC2626',
    description: '日期处理工具',
    sort: 99
  },
  {
    id: 'future-value',
    name: '未来价值',
    icon: 'TrendingUp',
    color: '#0EA5E9',
    description: '未来价值计算工具',
    sort: 100
  },
  {
    id: 'format-tool',
    name: '格式',
    icon: 'FileText',
    color: '#8B5CF6',
    description: '格式化工具',
    sort: 101
  },
  {
    id: 'probability',
    name: '概率',
    icon: 'Percent',
    color: '#F59E0B',
    description: '概率计算工具',
    sort: 102
  },
  {
    id: 'exchange-trend',
    name: '汇率走势',
    icon: 'TrendingUp',
    color: '#059669',
    description: '汇率走势分析工具',
    sort: 103
  },
  {
    id: 'exchange-convert',
    name: '汇率转换',
    icon: 'RefreshCw',
    color: '#3B82F6',
    description: '汇率转换工具',
    sort: 104
  },
  {
    id: 'game',
    name: '游戏',
    icon: 'Gamepad',
    color: '#EC4899',
    description: '游戏工具',
    sort: 105
  },
  {
    id: 'presentation',
    name: '演示',
    icon: 'Presentation',
    color: '#7C3AED',
    description: '演示工具',
    sort: 106
  },
  {
    id: 'motivation',
    name: '激励',
    icon: 'Zap',
    color: '#F59E0B',
    description: '激励工具',
    sort: 107
  },
  {
    id: 'roll-call',
    name: '点名',
    icon: 'User',
    color: '#10B981',
    description: '点名工具',
    sort: 108
  },
  {
    id: 'financial-calculation',
    name: '理财计算',
    icon: 'Calculator',
    color: '#059669',
    description: '理财计算工具',
    sort: 109
  },
  {
    id: 'life',
    name: '生活',
    icon: 'Home',
    color: '#84CC16',
    description: '生活实用工具',
    sort: 110
  },
  {
    id: 'coin',
    name: '硬币',
    icon: 'Circle',
    color: '#F59E0B',
    description: '硬币工具',
    sort: 111
  },
  {
    id: 'tax-benefit',
    name: '税务优惠',
    icon: 'Receipt',
    color: '#059669',
    description: '税务优惠计算工具',
    sort: 112
  },
  {
    id: 'tax-planning',
    name: '税务筹划',
    icon: 'FileText',
    color: '#7C3AED',
    description: '税务筹划工具',
    sort: 113
  },
  {
    id: 'tax-rate',
    name: '税率表',
    icon: 'FileSpreadsheet',
    color: '#DC2626',
    description: '税率查询工具',
    sort: 114
  },
  {
    id: 'algorithm',
    name: '算法',
    icon: 'Code',
    color: '#6B7280',
    description: '算法工具',
    sort: 115
  },
  {
    id: 'business-analysis',
    name: '经营分析',
    icon: 'BarChart',
    color: '#0EA5E9',
    description: '经营分析工具',
    sort: 116
  },
  {
    id: 'edit',
    name: '编辑',
    icon: 'Edit',
    color: '#6B7280',
    description: '编辑工具',
    sort: 117
  },
  {
    id: 'food',
    name: '美食',
    icon: 'Utensils',
    color: '#F97316',
    description: '美食相关工具',
    sort: 118
  },
  {
    id: 'tax-optimization',
    name: '节税优化',
    icon: 'TrendingDown',
    color: '#059669',
    description: '节税优化工具',
    sort: 119
  },
  {
    id: 'design',
    name: '设计',
    icon: 'Palette',
    color: '#8B5CF6',
    description: '设计工具',
    sort: 120
  },
  {
    id: 'request',
    name: '请求',
    icon: 'Send',
    color: '#3B82F6',
    description: 'HTTP请求工具',
    sort: 121
  },
  {
    id: 'financial-analysis',
    name: '财务分析',
    icon: 'BarChart',
    color: '#DC2626',
    description: '财务分析工具',
    sort: 122
  },
  {
    id: 'financial-indicators',
    name: '财务指标',
    icon: 'TrendingUp',
    color: '#0EA5E9',
    description: '财务指标计算工具',
    sort: 123
  },
  {
    id: 'financial-planning',
    name: '财务规划',
    icon: 'Calendar',
    color: '#7C3AED',
    description: '财务规划工具',
    sort: 124
  },
  {
    id: 'currency-convert',
    name: '货币换算',
    icon: 'RefreshCw',
    color: '#10B981',
    description: '货币换算工具',
    sort: 125
  },
  {
    id: 'wheel',
    name: '转盘',
    icon: 'RotateCw',
    color: '#F59E0B',
    description: '转盘抽奖工具',
    sort: 126
  },
  {
    id: 'retirement-planning',
    name: '退休规划',
    icon: 'Calendar',
    color: '#059669',
    description: '退休规划工具',
    sort: 127
  },
  {
    id: 'retirement-fund',
    name: '退休金',
    icon: 'PiggyBank',
    color: '#EC4899',
    description: '退休金计算工具',
    sort: 128
  },
  {
    id: 'selection',
    name: '选择',
    icon: 'CheckSquare',
    color: '#10B981',
    description: '选择工具',
    sort: 129
  },
  {
    id: 'communication',
    name: '通信',
    icon: 'Wifi',
    color: '#3B82F6',
    description: '通信工具',
    sort: 130
  },
  {
    id: 'fixed-deposit',
    name: '定期存款',
    icon: 'PiggyBank',
    color: '#059669',
    description: '定期存款计算工具',
    sort: 131
  },
  {
    id: 'regular-investment',
    name: '定投',
    icon: 'TrendingUp',
    color: '#10B981',
    description: '定投计算工具',
    sort: 132
  }
]

// 获取标签信息的辅助函数
export function getTagInfo(tagName) {
  // 首先按name查找
  let tag = tagDefinitions.find(t => t.name === tagName)
  if (!tag) {
    // 如果没找到，尝试按id查找
    tag = tagDefinitions.find(t => t.id === tagName)
  }
  if (!tag) {
    // 如果还是没找到，返回默认值
    return {
      icon: 'Tag',
      color: '#6B7280',
      description: `${tagName}相关工具集合`,
      sort: 999
    }
  }
  return tag
}

// 获取所有标签名称
export function getAllTagNames() {
  return tagDefinitions.map(t => t.name)
}