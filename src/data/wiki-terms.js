// 词条库数据：面向"什么是XX / XX是什么意思"类信息型长尾查询
// 每个词条结构固定：summary（一句话定义）→ body（2-3 节展开）→ relatedTools（站内工具互链）→ relatedTerms（词条互链）
// relatedTools 的 id 必须存在于 tools.js，relatedTerms 的 slug 必须存在于本文件

export const wikiCategories = ['基础概念', '模型与量化', '微调训练', '推理与部署']

export const wikiTerms = [
  {
    slug: 'token',
    term: 'Token（词元）',
    category: '基础概念',
    summary: 'Token 是大语言模型处理文本的最小单位，模型按 Token 计数与计费，一个汉字约占 1 个 Token，4 个英文字符约占 1 个 Token。',
    body: [
      {
        h: '模型为什么用 Token 而不是字',
        paras: ['大模型无法直接理解文字，需要先通过分词器（Tokenizer）把文本切成 Token，再查表把每个 Token 映射为一个高维向量。切分规则由训练语料的统计频率决定：高频英文单词通常一个词就是一个 Token，低频词会被拆成多个片段，中文则大多一字一 Token。'],
      },
      {
        h: 'Token 与成本、速度的关系',
        paras: ['API 按输入和输出的 Token 数分别计费，且输入通常是输出价格的 1/3 到 1/5。长对话的历史消息会作为输入反复计费，这是成本失控的最常见原因。生成速度也以 Token 每秒（Token/s）衡量，本地推理的体验好坏主要看这个指标。'],
      },
      {
        h: '实用估算规则',
        list: ['中文：约 1 字 = 1 Token，1 万字文章约 1 万 Token', '英文：约 4 字符 = 1 Token，750 词约 1000 Token', '精确数字以 API 响应中的 usage 字段为准，估算偏差一般在 ±15% 内'],
      },
    ],
    relatedTools: ['token-cost-calculator'],
    relatedTerms: ['context-window', 'inference-speed', 'system-prompt'],
    updated: '2026-10-02',
  },
  {
    slug: 'context-window',
    term: '上下文窗口（Context Window）',
    category: '基础概念',
    summary: '上下文窗口是模型单次能处理的 Token 上限，包含系统提示词、全部对话历史和输出。超出窗口的内容对模型来说等于不存在。',
    body: [
      {
        h: '窗口里装了什么',
        paras: ['每一次请求，模型看到的都是完整的上下文：系统提示词 + 全部历史轮次 + 当前问题。窗口大小从早期模型的 4K、8K 发展到如今普遍的 128K 甚至更长，但"能装下"不等于"用得好"——多数模型在窗口接近上限时对中间内容的召回能力会下降（所谓 lost in the middle）。'],
      },
      {
        h: '窗口与显存的关系',
        paras: ['本地部署时，上下文长度直接影响显存占用：KV Cache 随 Token 数线性增长，把上下文从 4K 拉到 32K，显存占用可能翻倍。跑本地模型时给多大的 ctx 参数，要在"能记住多少"和"还剩多少显存"之间权衡。'],
      },
    ],
    relatedTools: ['gpu-detector', 'token-cost-calculator'],
    relatedTerms: ['token', 'kv-cache'],
    updated: '2026-10-02',
  },
  {
    slug: 'system-prompt',
    term: '系统提示词（System Prompt）',
    category: '基础概念',
    summary: '系统提示词是置于对话最前方的指令，定义模型的角色、任务边界与输出格式。它是整个上下文中"性价比最低、也最重要"的一段——每次请求都会重复计费。',
    body: [
      {
        h: '它如何影响输出',
        paras: ['系统提示词的优先级高于用户消息：模型会把它当作"世界观"来遵守。角色设定、输出格式约束、禁忌事项、few-shot 示例都放在这里。写得越具体（"输出 JSON，字段为 title/body/tags"），输出越稳定；写得越空泛（"你是助手"），越接近模型默认行为。'],
      },
      {
        h: '成本优化角度',
        paras: ['因为每轮对话都要携带完整的系统提示词，冗长的提示词在多轮场景下会产生成倍成本。优化手段：压缩示例数量、把固定背景改为按需注入、利用厂商的前缀缓存（相同前缀的输入大幅折扣）。沉淀验证过效果的提示词为模板，是团队层面最划算的投入。'],
      },
    ],
    relatedTools: ['prompt-library', 'token-cost-calculator'],
    relatedTerms: ['token', 'context-window'],
    updated: '2026-10-02',
  },
  {
    slug: 'temperature',
    term: '温度系数（Temperature）',
    category: '基础概念',
    summary: '温度控制模型输出的随机性：值越低输出越确定（适合抽取、分类），值越高输出越发散（适合创意写作）。常用区间 0-1，默认多为 0.7。',
    body: [
      {
        h: '它到底改变了什么',
        paras: ['模型每一步为下一个词输出一个概率分布，温度作用于这个分布的"锐度"：温度趋近 0 时几乎总是选概率最高的词，同一问题每次回答基本一致；温度升高后低概率词也有机会被选中，回答更多样但更不可控。'],
      },
      {
        h: '取值建议',
        list: ['信息抽取、代码生成、分类任务：0-0.3', '日常问答、翻译：0.5-0.7', '创意写作、头脑风暴：0.9-1.2', '要可复现的实验结果：固定温度为 0，并固定随机种子（若框架支持）'],
      },
    ],
    relatedTools: ['prompt-library'],
    relatedTerms: ['hallucination'],
    updated: '2026-10-02',
  },
  {
    slug: 'hallucination',
    term: '幻觉（Hallucination）',
    category: '基础概念',
    summary: '幻觉指模型生成看似合理实则错误或虚构内容的现象，根源在于模型本质是基于统计的下一词预测，而不是事实检索。',
    body: [
      {
        h: '为什么会产生',
        paras: ['模型学到的是语言的统计规律而非事实本身。当被问到训练数据中罕见或不存在的内容时，它会按"最像答案的样子"续写下去，而不是承认不知道。要求模型"必须回答"的提问方式、过高的温度、以及引导性的问题都会加剧幻觉。'],
      },
      {
        h: '缓解手段',
        list: ['RAG：先检索资料再回答，让模型基于给定材料作答', '在提示词中明确允许回答"不知道"，并要求标注来源', '事实敏感场景降低温度', '关键结论要求模型自我复核一遍（self-check）'],
      },
    ],
    relatedTools: [],
    relatedTerms: ['rag', 'temperature'],
    updated: '2026-10-02',
  },
  {
    slug: 'inference-speed',
    term: '推理速度（Token/s）',
    category: '基础概念',
    summary: '推理速度指模型每秒生成的 Token 数，是衡量本地部署体验的核心指标。它主要受内存带宽而非算力峰值的限制。',
    body: [
      {
        h: '为什么带宽比算力重要',
        paras: ['自回归模型每生成一个 Token，都要把全部权重从显存过一遍。以 7B Q4 模型为例，约 4GB 权重，显存带宽 300GB/s 的显卡理论上限约 75 Token/s，实际打对折到 30-40。这就是为什么苹果统一内存机器跑模型不慢——带宽高；而老显卡算力够但带宽低，速度上不去。'],
      },
      {
        h: '提速的常见手段',
        list: ['更激进的量化（Q4 比 Q8 快约 30-50%，因为搬运的数据更少）', '批处理（batch）：多请求并行提高吞吐，但单条延迟上升', 'Flash Attention、 speculative decoding 等算法优化', '确认上下文长度没被设得过大——KV Cache 过大也会拖慢速度'],
      },
    ],
    relatedTools: ['gpu-detector', 'token-cost-calculator'],
    relatedTerms: ['vram', 'quantization', 'kv-cache'],
    updated: '2026-10-02',
  },
  {
    slug: 'gguf',
    term: 'GGUF 格式',
    category: '模型与量化',
    summary: 'GGUF 是 llama.cpp 生态定义的单文件模型格式，把权重、分词器、元信息打包在一个文件里，是 Ollama、LM Studio 等本地工具的标准载体。',
    body: [
      {
        h: '它解决了什么',
        paras: ['GGUF 的前身 GGML 因难以扩展被淘汰。GGUF 在文件头写入架构、超参数、分词器等信息，加载时无需外部配置；支持按需 mmap 加载（权重留在磁盘按需读入内存，启动快）；并对 CPU/GPU 混合推理做了优化。'],
      },
      {
        h: '文件名怎么读',
        paras: ['典型文件名如 qwen3-8b-q4_k_m.gguf：前段是模型名与参数量，末段是量化等级。同一模型通常有 Q3/Q4/Q5/Q6/Q8 等多个 GGUF 文件，体积与质量随量化位数上升。Hugging Face 上搜索"模型名 + gguf"即可找到社区量化版本。'],
      },
    ],
    relatedTools: ['gpu-detector'],
    relatedTerms: ['quantization', 'q4-k-m', 'inference-engine'],
    updated: '2026-10-02',
  },
  {
    slug: 'quantization',
    term: '模型量化（Quantization）',
    category: '模型与量化',
    summary: '量化是把模型权重从 16-bit 浮点压缩到 8-bit、4-bit 甚至更低精度的技术，体积与显存占用成倍下降，是消费级硬件跑大模型的前提。',
    body: [
      {
        h: '为什么可行',
        paras: ['训练需要高精度保证梯度稳定，但推理时权重只需要"够准"。量化算法（如 GGUF 的 k-quant、AWQ、GPTQ）通过按组缩放和重要性加权，把压缩带来的质量损失控制在很小范围：Q8 接近无损，Q4 的损失在多数任务上难以察觉，Q3 以下开始能感觉到。'],
      },
      {
        h: '常见量化格式',
        list: ['GGUF（Q 系列）：llama.cpp / Ollama 生态，CPU+GPU 混合友好', 'AWQ / GPTQ：vLLM、ExLlama 等 GPU 服务化场景主流', 'FP8 / INT8：数据中心推理卡的新趋势', '经验法则：显存不够就降一档量化，优先保 Q4 以上'],
      },
    ],
    relatedTools: ['gpu-detector', 'lora-vram-calculator'],
    relatedTerms: ['gguf', 'q4-k-m', 'vram'],
    updated: '2026-10-02',
  },
  {
    slug: 'q4-k-m',
    term: 'Q4_K_M 量化等级',
    category: '模型与量化',
    summary: 'Q4_K_M 是 GGUF 生态最流行的 4-bit 量化档位，约每 1B 参数占 0.6GB，质量与体积的最佳平衡点，也是 Ollama 等工具的默认选择。',
    body: [
      {
        h: '命名怎么解读',
        paras: ['Q4 表示权重主精度为 4-bit；K 指 k-quant 分组量化（按块缩放，比朴素 Q4 精度高）；M 是 Medium，表示混合精度策略中的中等方案——对更敏感的部分层用更高精度。同族还有 Q4_K_S（Small，更小略差）与 Q4_0（朴素量化，已少用）。'],
      },
      {
        h: '实际占用参考',
        list: ['7B 模型 Q4_K_M：约 4.4GB', '14B：约 9GB', '32B：约 19.5GB', '70B：约 42GB', '另加 KV Cache 与约 1GB 运行开销，具体随上下文长度变化'],
      },
    ],
    relatedTools: ['gpu-detector', 'token-cost-calculator'],
    relatedTerms: ['gguf', 'quantization', 'kv-cache'],
    updated: '2026-10-02',
  },
  {
    slug: 'kv-cache',
    term: 'KV Cache',
    category: '模型与量化',
    summary: 'KV Cache 是推理时缓存的注意力键值张量，用空间换时间：没有它每生成一个词都要重算全部历史，有了它生成速度才能保持稳定。',
    body: [
      {
        h: '为什么显存占用随对话变长',
        paras: ['注意力机制需要每个历史 Token 的 Key/Value 向量参与计算，缓存这些向量就是 KV Cache。它的大小与"参数量 × 上下文长度"成正比——这就是长上下文会吃显存的原因。以 8B 模型为例，4K 上下文约占 0.5GB，32K 上下文可能超过 4GB。'],
      },
      {
        h: '控制手段',
        list: ['按需设置上下文长度，不要无脑拉满', 'GQA（分组查询注意力）架构天然压缩 KV，新模型普遍采用', 'KV Cache 量化（部分推理引擎支持 8-bit KV）', '多轮对话定期做摘要重置历史'],
      },
    ],
    relatedTools: ['gpu-detector'],
    relatedTerms: ['context-window', 'vram', 'inference-speed'],
    updated: '2026-10-02',
  },
  {
    slug: 'moe',
    term: '混合专家模型（MoE）',
    category: '模型与量化',
    summary: 'MoE 模型把前馈层拆成多个"专家"，每个 Token 只激活其中一小部分（如 Qwen3-30B-A3B 只激活 3B），从而用大参数的质量换来接近小模型的推理速度。',
    body: [
      {
        h: '为什么它又大又快',
        paras: ['传统稠密模型每个 Token 都要过全部参数；MoE 由路由器为每个 Token 挑选最相关的 1-2 个专家。总参数量决定知识容量（30B、200B 都可以），激活参数量决定每步计算量。代价是：全部专家权重必须完整载入显存，但对显存的需求不能按激活参数估算。'],
      },
      {
        h: '使用注意',
        list: ['显存估算按总参数量算，速度预期按激活参数量算', 'MoE 模型通常带 "A" 标注激活量，如 30B-A3B、235B-A22B', '专家分布不均时某些 GPU 利用率偏低，属正常现象'],
      },
    ],
    relatedTools: ['gpu-detector', 'lora-vram-calculator'],
    relatedTerms: ['vram', 'quantization'],
    updated: '2026-10-02',
  },
  {
    slug: 'vram',
    term: '显存（VRAM）',
    category: '模型与量化',
    summary: '显存是显卡板载的高速内存，跑本地大模型的第一约束条件：模型权重、KV Cache、运行开销全都要装进去，装不下就只能分层卸载或换更小的量化。',
    body: [
      {
        h: '显存里装了什么',
        paras: ['推理时显存 = 模型权重（Q4 下约 0.6GB/1B 参数）+ KV Cache（随上下文线性增长）+ 运行时开销（约 1GB）。训练的构成完全不同：还要加梯度和优化器状态，全参微调约 16GB/1B 参数，这是训练比推理贵一个数量级的原因。'],
      },
      {
        h: '容量与带宽要一起看',
        paras: ['选卡不要只看显存大小：生成速度主要由显存带宽决定。同样是 24GB，消费卡（4090，约 1TB/s）与专业卡的实际推理速度差距远小于价格差距。苹果统一内存则是另一条路线——容量大、带宽高，但受 macOS 有线内存比例限制。'],
      },
    ],
    relatedTools: ['gpu-detector', 'lora-vram-calculator'],
    relatedTerms: ['kv-cache', 'unified-memory', 'quantization'],
    updated: '2026-10-02',
  },
  {
    slug: 'unified-memory',
    term: '统一内存（Unified Memory）',
    category: '模型与量化',
    summary: '苹果 M 系列芯片的 CPU 与 GPU 共享同一块内存，无需在系统内存和显存之间拷贝权重，是大内存 Mac 能跑大模型的结构性原因。',
    body: [
      {
        h: '默认只能用到约 70%',
        paras: ['macOS 默认限制 GPU 可"有线锁定"的内存比例（约 65%-75%），其余留给系统。所以 16GB 的 M 系 Mac，模型实际可用约 11GB——跑 Q4 的 14B 模型（约 9GB）可行，32B 就不行了。高级用户可通过 sysctl 调整 iogpu.wired_limit，但一般不建议。'],
      },
      {
        h: '和独显方案的对比',
        list: ['优势：容量天花板高（M3 Max 可到 128GB），省电，无数据拷贝开销', '劣势：算力峰值低于同期顶级独显，训练场景明显吃力', '选购参考：优先大内存档位，带宽随 Max/Ultra 档位翻倍'],
      },
    ],
    relatedTools: ['gpu-detector'],
    relatedTerms: ['vram', 'quantization'],
    updated: '2026-10-02',
  },
  {
    slug: 'distillation',
    term: '知识蒸馏（Distillation）',
    category: '模型与量化',
    summary: '知识蒸馏是让小模型学习大模型输出的训练方法：大模型当老师生成高质量样本，小模型在其上训练，以小模型的成本获得接近老师的效果。',
    body: [
      {
        h: '与量化的区别',
        paras: ['蒸馏压缩的是"模型本身"——重新训练一个更小的模型；量化压缩的是"权重的精度"——模型结构不变。两者可以叠加：DeepSeek-R1-Distill-Qwen-7B 就是先蒸馏（把 R1 的推理能力蒸给 Qwen 底座）、再量化成 GGUF 分发的产物。'],
      },
      {
        h: '怎么读模型名',
        paras: ['名字里带 "Distill" 的模型（如 DeepSeek-R1-Distill-7B/14B/32B）即蒸馏产物，后面的数字是学生模型的参数量。它们保留了老师在特定能力（如数学推理）上的大部分表现，是消费级硬件跑推理模型的主流选择。'],
      },
    ],
    relatedTools: ['gpu-detector'],
    relatedTerms: ['quantization', 'lora'],
    updated: '2026-10-02',
  },
  {
    slug: 'lora',
    term: 'LoRA（低秩适配微调）',
    category: '微调训练',
    summary: 'LoRA 冻结原模型权重，只训练注入各层的低秩矩阵（适配器），训练参数量不到原模型 1%，显存约为推理的 1.2 倍，是个人微调的主流方案。',
    body: [
      {
        h: '原理一句话',
        paras: ['研究发现微调引起的权重变化是低秩的：用一个秩 r（常取 8-64）的低秩分解 A×B 来表示"改动量"，只训练 A 和 B。原权重不动，推理时可以把适配器合并进权重（零额外开销），也可以多个适配器按任务热切换。'],
      },
      {
        h: '关键参数与实践',
        list: ['r（秩）：越大表达能力越强、显存略增，8-32 对多数任务足够', 'alpha：缩放系数，常设为 r 的 1-2 倍', '目标层：通常注入注意力的 q/k/v/o 投影', '数据量：几百到几千条高质量样本即可见效，远少于全参微调'],
      },
    ],
    relatedTools: ['lora-vram-calculator'],
    relatedTerms: ['qlora', 'full-fine-tuning'],
    updated: '2026-10-02',
  },
  {
    slug: 'qlora',
    term: 'QLoRA',
    category: '微调训练',
    summary: 'QLoRA 把基础模型量化到 4-bit 再做 LoRA 训练，显存约 0.9GB/1B 参数，让 24GB 消费级显卡也能微调 32B 模型，是低资源微调的事实标准。',
    body: [
      {
        h: '三个关键技术',
        paras: ['QLoRA = 4-bit NF4 量化存储权重 + 双重量化（量化常数也量化）+ 分页优化器（显存不足时把优化器状态暂时挪到内存）。训练时权重按需反量化到 BF16 参与计算，梯度只流向 LoRA 适配器，所以基础权重的 4-bit 存储不影响训练精度下限。'],
      },
      {
        h: '什么时候选它',
        list: ['单卡 24GB 以下想微调 13B 以上模型：QLoRA 几乎是唯一选择', '效果对比：多数下游任务与全参微调差距在 1% 量级', '搭配 paged_adamw_8bit 与梯度检查点可进一步压缩峰值显存', '训练速度比 LoRA 慢 20-40%（反量化开销）'],
      },
    ],
    relatedTools: ['lora-vram-calculator'],
    relatedTerms: ['lora', 'quantization', 'full-fine-tuning'],
    updated: '2026-10-02',
  },
  {
    slug: 'full-fine-tuning',
    term: '全参微调（Full Fine-tuning）',
    category: '微调训练',
    summary: '全参微调更新模型全部权重，效果上限最高，但显存约 16GB/1B 参数——7B 模型就需要 112GB 以上，通常只有多卡或数据中心环境才跑得动。',
    body: [
      {
        h: '显存都花在哪了',
        paras: ['FP16 权重 2B + FP16 梯度 2B + Adam 优化器状态 8B（两个 FP32 动量）+ FP32 主权重 4B ≈ 16 字节/参数，再叠加激活值。这就是"7B 全参微调要 4×A100"这类说法的由来。'],
      },
      {
        h: '什么时候值得上全参',
        list: ['任务与基座差异极大（如把通用模型改成医疗专业模型）', '有充足的高质量数据（万条以上）与算力预算', '只是教模型新格式/新领域知识/风格：优先 LoRA，性价比高得多', '多卡方案：DeepSpeed ZeRO-3、FSDP 做权重分片'],
      },
    ],
    relatedTools: ['lora-vram-calculator'],
    relatedTerms: ['lora', 'qlora'],
    updated: '2026-10-02',
  },
  {
    slug: 'rag',
    term: 'RAG（检索增强生成）',
    category: '推理与部署',
    summary: 'RAG 先从知识库检索相关资料、再让模型基于资料回答，用外部知识弥补模型训练数据的时效与私有性缺口，同时显著降低幻觉。',
    body: [
      {
        h: '标准流程',
        paras: ['离线阶段：文档切块（chunk）→ 用 Embedding 模型转向量 → 存入向量数据库。在线阶段：用户问题同样转向量 → 检索最相近的若干块 → 作为上下文拼进提示词 → 模型基于给定材料作答。模型的角色从"回忆知识"变成"阅读理解"，这正是它擅长的。'],
      },
      {
        h: '效果好坏的关键',
        list: ['切块策略：按语义边界切，块大小 300-800 字为主流', 'Embedding 模型质量：中文场景 bge 系列是常用选择', '检索方式：向量检索 + 关键词检索混合（hybrid）效果更稳', '提示词要求"仅根据给定资料回答，标注引用"，进一步压幻觉'],
      },
    ],
    relatedTools: ['prompt-library'],
    relatedTerms: ['embedding', 'hallucination', 'context-window'],
    updated: '2026-10-02',
  },
  {
    slug: 'embedding',
    term: 'Embedding（向量化）',
    category: '推理与部署',
    summary: 'Embedding 模型把文本映射为高维向量，语义相近的文本向量距离也相近——它是语义搜索、RAG、聚类推荐的底层组件。',
    body: [
      {
        h: '和生成模型的区别',
        paras: ['生成模型输出文字，Embedding 模型输出一个固定长度的浮点数组（如 1024 维）。它不"说话"，只负责把语义变成可计算的几何关系：余弦相似度高的两段文本，语义大概率相近。模型体积普遍很小（0.1-1GB 级），本地跑毫无压力。'],
      },
      {
        h: '选型要点',
        list: ['中文场景：bge-m3、bge-large-zh 是社区常用选择', '看两个指标：MTEB 榜单得分（质量）与向量维度（存储成本）', '同库向量必须用同一模型生成，换模型要全量重嵌入', 'Embedding 模型输出 ≠ 生成模型输出，两者在 RAG 中是上下游关系'],
      },
    ],
    relatedTools: [],
    relatedTerms: ['rag'],
    updated: '2026-10-02',
  },
  {
    slug: 'inference-engine',
    term: '本地推理引擎（Ollama / llama.cpp / LM Studio）',
    category: '推理与部署',
    summary: '本地推理引擎负责把 GGUF 等格式的模型高效跑在你的硬件上：llama.cpp 是底层核心，Ollama 和 LM Studio 是它之上的两种典型封装——命令行服务化与图形界面。',
    body: [
      {
        h: '三者的关系',
        paras: ['llama.cpp 提供量化推理的底层实现（GGUF 格式的定义者）；Ollama 在其上封装了模型管理、REST API 与一行命令的体验，适合做后端服务和自动化；LM Studio 提供 GUI，适合探索模型、对比输出。常见工作流是 LM Studio 选型 → Ollama 部署供 API。'],
      },
      {
        h: '选型建议',
        list: ['要 API 给应用调用：Ollama（默认端口 11434，OpenAI 兼容接口）', '想图形界面慢慢试：LM Studio 或 Jan', '极致性能定制、嵌入式设备：直接用 llama.cpp', '高并发生产环境：考虑 vLLM（AWQ/GPTQ 格式，吞吐优先）'],
      },
    ],
    relatedTools: ['gpu-detector', 'token-cost-calculator'],
    relatedTerms: ['gguf', 'quantization', 'inference-speed'],
    updated: '2026-10-02',
  },
]
