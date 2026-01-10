---
title: "大模型微调实战：从LoRA到QLoRA的完整指南"
date: 2026-01-06T13:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨大语言模型微调技术，包括全量微调、LoRA、QLoRA、PEFT等方法，以及如何使用Hugging Face Transformers进行高效模型微调"
tags: ["LLM", "模型微调", "LoRA", "QLoRA", "Transformers"]
categories: ["人工智能", "大模型应用"]
---

## 引言

大模型微调是将预训练模型适配到特定任务的关键技术。从传统的全量微调到参数高效的LoRA、QLoRA，微调技术不断发展。本文将深入探讨各种微调方法的原理、实现和最佳实践。

## 微调基础概念

### 为什么需要微调

```python
# 预训练模型 vs 微调模型

# 预训练模型（通用）
pretrained_model = "gpt-4"
response = pretrained_model.generate("解释什么是量子纠缠")
# 输出：通用的、百科全书式的解释

# 微调模型（特定领域）
fine_tuned_model = "gpt-4-quantum-physics"  # 经过量子物理领域微调
response = fine_tuned_model.generate("解释什么是量子纠缠")
# 输出：更专业、更准确、使用领域术语的解释
```

### 微调类型

```typescript
// 微调类型对比
interface FineTuningTypes {
  full: {
    name: "全量微调",
    description: "更新所有模型参数",
    pros: ["效果最好", "适配最完整"],
    cons: ["成本高", "需要大量数据", "存储需求大"]
  },
  partial: {
    name: "部分微调",
    description: "只更新部分层",
    pros: ["平衡效果和成本"],
    cons: ["需要经验确定哪些层"]
  },
  peft: {
    name: "参数高效微调",
    description: "只更新少量参数",
    pros: ["成本极低", "速度快", "存储小"],
    cons: ["效果略低于全量微调"]
  }
}
```

## 全量微调

### 基础实现

```python
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import load_dataset

# 加载预训练模型和分词器
model_name = "bert-base-chinese"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 准备数据集
dataset = load_dataset("csv", data_files="training_data.csv")

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True,
        max_length=512
    )

tokenized_datasets = dataset.map(tokenize_function, batched=True)

# 训练参数
training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    weight_decay=0.01,
    save_strategy="epoch",
    load_best_model_at_end=True,
)

# 数据整理器
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,  # Causal LM不需要MLM
)

# 创建Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["validation"],
    data_collator=data_collator,
)

# 开始训练
trainer.train()

# 保存模型
trainer.save_model("./my_finetuned_model")
tokenizer.save_pretrained("./my_finetuned_model")
```

### 自定义训练循环

```python
from torch.utils.data import DataLoader
from tqdm import tqdm

# 创建DataLoader
train_dataloader = DataLoader(
    tokenized_datasets["train"],
    shuffle=True,
    batch_size=8,
    collate_fn=data_collator
)

eval_dataloader = DataLoader(
    tokenized_datasets["validation"],
    batch_size=8,
    collate_fn=data_collator
)

# 优化器
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)

# 学习率调度器
num_training_steps = len(train_dataloader) * 3
lr_scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer,
    T_max=num_training_steps
)

# 训练循环
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

for epoch in range(3):
    model.train()
    total_loss = 0

    progress_bar = tqdm(train_dataloader, desc=f"Epoch {epoch+1}")

    for batch in progress_bar:
        batch = {k: v.to(device) for k, v in batch.items()}

        # 前向传播
        outputs = model(**batch)
        loss = outputs.loss

        # 反向传播
        loss.backward()
        optimizer.step()
        lr_scheduler.step()
        optimizer.zero_grad()

        total_loss += loss.item()
        progress_bar.set_postfix({"loss": loss.item()})

    avg_train_loss = total_loss / len(train_dataloader)

    # 评估
    model.eval()
    eval_loss = 0

    with torch.no_grad():
        for batch in eval_dataloader:
            batch = {k: v.to(device) for k, v in batch.items()}
            outputs = model(**batch)
            eval_loss += outputs.loss.item()

    avg_eval_loss = eval_loss / len(eval_dataloader)

    print(f"Epoch {epoch+1}: Train Loss = {avg_train_loss:.4f}, Eval Loss = {avg_eval_loss:.4f}")
```

## LoRA微调

### LoRA原理

```python
# LoRA (Low-Rank Adaptation)
# 核心思想：在权重矩阵旁添加低秩分解矩阵

import torch
import torch.nn as nn

class LoRALayer(nn.Module):
    """LoRA层"""

    def __init__(
        self,
        original_layer: nn.Linear,
        rank: int = 8,
        alpha: float = 32
    ):
        super().__init__()
        self.original_layer = original_layer
        self.rank = rank
        self.alpha = alpha

        # 获取原始层维度
        in_features = original_layer.in_features
        out_features = original_layer.out_features

        # LoRA参数（低秩矩阵）
        self.lora_A = nn.Parameter(torch.zeros(rank, in_features))
        self.lora_B = nn.Parameter(torch.zeros(out_features, rank))

        # 初始化
        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))
        nn.init.zeros_(self.lora_B)

        self.scaling = alpha / rank

    def forward(self, x):
        # 原始层输出
        original_output = self.original_layer(x)

        # LoRA输出: B * A * x
        lora_output = (x @ self.lora_A.T @ self.lora_B.T) * self.scaling

        return original_output + lora_output

# 使用示例
original_linear = nn.Linear(768, 768)
lora_linear = LoRALayer(original_linear, rank=8)

# 参数量对比
original_params = sum(p.numel() for p in original_linear.parameters())
lora_params = sum(p.numel() for p in lora_linear.parameters()[
    'lora_A', 'lora_B'
])

print(f"原始参数: {original_params:,}")
print(f"LoRA参数: {lora_params:,}")
print(f"参数减少: {(1 - lora_params / original_params) * 100:.2f}%")
```

### 使用PEFT库

```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM

# 加载基础模型
model = AutoModelForCausalLM.from_pretrained(
    "bigscience/bloom-7b1",
    torch_dtype=torch.float16,
    device_map="auto"
)

# LoRA配置
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,  # 任务类型
    inference_mode=False,            # 训练模式
    r=8,                             # LoRA rank
    lora_alpha=32,                   # LoRA alpha
    lora_dropout=0.1,                # Dropout
    target_modules=["q_proj", "v_proj"],  # 要应用LoRA的模块
)

# 应用LoRA
model = get_peft_model(model, lora_config)

# 查看可训练参数
model.print_trainable_parameters()

# 输出类似：
# trainable params: 2,621,440 || all params: 7,111,635,456 || trainable%: 0.0368%

# 训练（与普通模型相同）
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)

trainer.train()

# 保存LoRA权重
model.save_pretrained("./my_lora_model")

# 加载LoRA权重
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained("bigscience/bloom-7b1")
model = PeftModel.from_pretrained(base_model, "./my_lora_model")
```

### 不同LoRA策略

```python
# 策略1：只微调Attention层
lora_config_attention = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
)

# 策略2：微调Attention和MLP层
lora_config_full = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,
    lora_alpha=32,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
)

# 策略3：所有Linear层
lora_config_all = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=16,
    target_modules=[".*"],  # 使用正则匹配所有
)

# 策略4：不同层使用不同rank
from peft import LoraConfig

class MultiRankLoraConfig(LoraConfig):
    """多rank LoRA配置"""

    def __init__(
        self,
        layer_ranks: dict,  # {"layer_name": rank}
        **kwargs
    ):
        super().__init__(**kwargs)
        self.layer_ranks = layer_ranks

# 使用
config = MultiRankLoraConfig(
    task_type=TaskType.CAUSAL_LM,
    layer_ranks={
        "model.layers.0": 4,
        "model.layers.10": 8,
        "model.layers.20": 16,
    }
)
```

## QLoRA微调

### QLoRA原理

```python
# QLoRA (Quantized LoRA)
# 核心：量化+LoRA，在保持性能的同时大幅减少显存

import torch
from transformers import BitsAndBytesConfig

# 量化配置
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,              # 4-bit量化
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,  # 双重量化
    bnb_4bit_quant_type="nf4",      # NF4量化类型
)

# 加载量化模型
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=bnb_config,
    device_map="auto"
)

# 应用LoRA
from peft import LoraConfig, get_peft_model

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)

# 训练
trainer = Trainer(
    model=model,
    args=TrainingArguments(
        output_dir="./qlora_output",
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        logging_steps=10,
        save_steps=100,
        num_train_epochs=3,
    ),
    train_dataset=train_dataset,
)

trainer.train()

# 显存使用对比（7B模型）
"""
全量微调:
- 模型权重: ~28GB (FP16)
- 梯度: ~28GB
- 优化器状态: ~84GB
- 总计: ~140GB (需要8x A100 80GB)

LoRA微调:
- 模型权重: ~28GB
- LoRA参数: ~100MB
- 梯度: ~100MB
- 优化器状态: ~300MB
- 总计: ~28.5GB (1x A100 40GB)

QLoRA微调:
- 量化权重: ~7GB (4-bit)
- LoRA参数: ~100MB
- 梯度: ~100MB
- 优化器状态: ~300MB
- 总计: ~7.5GB (1x RTX 3090 24GB)
"""
```

### 完整QLoRA训练流程

```python
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
from transformers import TrainerCallback

# 1. 加载模型（4-bit量化）
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

tokenizer = AutoTokenizer.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    trust_remote_code=True,
)
tokenizer.pad_token = tokenizer.eos_token

# 2. 准备模型进行训练
model = prepare_model_for_kbit_training(model)

# 3. 配置LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# 4. 准备数据
dataset = load_dataset("json", data_files="training_data.json")

def format_prompt(example):
    return {
        "text": f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"
    }

dataset = dataset.map(format_prompt)

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True,
        max_length=512,
    )

tokenized_dataset = dataset.map(tokenize_function, batched=True)

# 5. 训练参数
training_args = TrainingArguments(
    output_dir="./qlora_checkpoints",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    warmup_steps=100,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    optim="paged_adamw_8bit",  # 分页优化器
    save_strategy="steps",
    save_steps=100,
    evaluation_strategy="steps",
    eval_steps=100,
    load_best_model_at_end=True,
    report_to=["wandb"],  # 或 "tensorboard"
    run_name="qlora-finetune",
)

# 6. 自定义回调
class LoggingCallback(TrainerCallback):
    def on_log(self, args, state, control, logs=None, **kwargs):
        if logs:
            print(f"Step: {state.global_step}, Loss: {logs.get('loss', 'N/A')}")

# 7. 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["validation"],
    callbacks=[LoggingCallback()],
)

trainer.train()

# 8. 保存
model.save_pretrained("./final_qlora_model")
tokenizer.save_pretrained("./final_qlora_model")

# 9. 合并权重（可选）
merged_model = model.merge_and_unload()
merged_model.save_pretrained("./merged_model")
```

## 其他PEFT方法

### Prefix Tuning

```python
from peft import PrefixTuningConfig, get_peft_model

# Prefix Tuning配置
prefix_config = PrefixTuningConfig(
    task_type=TaskType.CAUSAL_LM,
    num_virtual_tokens=20,  # 虚拟token数量
    prefix_projection=True,  # 使用投影层
)

model = get_peft_model(model, prefix_config)

# Prefix Tuning在每一层添加可训练的前缀向量
# 参数量：num_layers * num_virtual_tokens * hidden_dim
# 对于Llama-2-7b: 32 * 20 * 4096 ≈ 2.6M 参数
```

### Prompt Tuning

```python
from peft import PromptTuningConfig, get_peft_model

# Prompt Tuning配置
prompt_config = PromptTuningConfig(
    task_type=TaskType.CAUSAL_LM,
    prompt_tuning_init="TEXT",  # 使用文本初始化
    prompt_tuning_init_text="分类以下文本：",
    num_virtual_tokens=8,
)

model = get_peft_model(model, prompt_config)

# Prompt Tuning只在输入层添加可训练的prompt
# 参数量最少，但效果相对较弱
```

### Adapter

```python
from transformers import AdapterType, BertAdapterModel

# 加载带Adapter的模型
model = BertAdapterModel.from_pretrained("bert-base-uncased")

# 添加Adapter
model.add_adapter("sentiment", AdapterType.text_task)
model.train_adapter("sentiment")

# Adapter在每个Transformer层后添加小型 bottleneck 层
# 结构: down_proj -> nonlinearity -> up_proj
# 参数量更少，但性能通常不如LoRA
```

## 数据准备

### 指令微调数据

```python
# Alpaca格式
alpaca_dataset = [
    {
        "instruction": "解释什么是机器学习？",
        "input": "",
        "output": "机器学习是人工智能的一个分支..."
    },
    {
        "instruction": "翻译以下句子",
        "input": "Hello, world!",
        "output": "你好，世界！"
    }
]

# 转换为训练格式
def format_alpaca(example):
    if example["input"]:
        prompt = f"### Instruction:\n{example['instruction']}\n\n### Input:\n{example['input']}\n\n### Response:\n{example['output']}"
    else:
        prompt = f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"

    return {"text": prompt}

# ShareGPT格式（多轮对话）
sharegpt_dataset = [
    {
        "conversations": [
            {"from": "human", "value": "你好"},
            {"from": "gpt", "value": "你好！有什么可以帮你的？"},
            {"from": "human", "value": "介绍一下Python"},
            {"from": "gpt", "value": "Python是一种高级编程语言..."}
        ]
    }
]

def format_sharegpt(example):
    conversations = example["conversations"]

    # 构建对话历史
    formatted = []
    for conv in conversations:
        role = "User" if conv["from"] == "human" else "Assistant"
        formatted.append(f"{role}: {conv['value']}")

    return {"text": "\n".join(formatted)}
```

### 数据增强

```python
import random
import nlpaug.augmenter.word as naw

class DataAugmenter:
    """数据增强器"""

    def __init__(self):
        # 同义词替换
        self.synonym_aug = naw.SynonymAug(aug_src='wordnet')

        # 随机删除
        self.delete_aug = naw.RandomWordAug(action="delete")

        # 随机交换
        self.swap_aug = naw.RandomWordAug(action="swap")

    def augment(self, text: str, num_augmented: int = 3) -> list:
        """增强数据"""
        augmented_texts = [text]

        for _ in range(num_augmented):
            aug_type = random.choice(["synonym", "delete", "swap"])

            if aug_type == "synonym":
                aug_text = self.synonym_aug.augment(text)
            elif aug_type == "delete":
                aug_text = self.delete_aug.augment(text)
            else:
                aug_text = self.swap_aug.augment(text)

            augmented_texts.append(aug_text[0] if isinstance(aug_text, list) else aug_text)

        return augmented_texts

    def paraphrase(self, text: str, llm) -> str:
        """使用LLM改写"""
        prompt = f"请改写以下文本，保持原意但使用不同的表达：\n{text}"

        return llm.generate(prompt)

# 使用
augmenter = DataAugmenter()

original = "机器学习是人工智能的重要分支"
augmented = augmenter.augment(original, num_augmented=3)
# [
#   "机器学习是人工智能的重要分支",
#   "机器学习是AI的关键组成部分",
#   "ML是人工智能的核心领域",
#   "机器学习属于人工智能范畴"
# ]
```

## 评估和测试

### Perplexity评估

```python
import torch
from tqdm import tqdm

def calculate_perplexity(model, dataloader, device):
    """计算困惑度"""
    model.eval()
    total_loss = 0
    total_tokens = 0

    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Evaluating"):
            batch = {k: v.to(device) for k, v in batch.items()}

            outputs = model(**batch, labels=batch["input_ids"])
            loss = outputs.loss

            total_loss += loss.item() * batch["input_ids"].numel()
            total_tokens += batch["input_ids"].numel()

    avg_loss = total_loss / total_tokens
    perplexity = torch.exp(torch.tensor(avg_loss))

    return perplexity.item()

# 使用
perplexity = calculate_perplexity(model, eval_dataloader, device)
print(f"Perplexity: {perplexity:.2f}")
```

### 任务特定评估

```python
# 分类任务评估
from sklearn.metrics import accuracy_score, f1_score, classification_report

def evaluate_classification(model, dataloader, device):
    """评估分类任务"""
    model.eval()
    predictions = []
    true_labels = []

    with torch.no_grad():
        for batch in tqdm(dataloader):
            batch = {k: v.to(device) for k, v in batch.items()}

            outputs = model(**batch)
            preds = torch.argmax(outputs.logits, dim=-1)

            predictions.extend(preds.cpu().numpy())
            true_labels.extend(batch["labels"].cpu().numpy())

    accuracy = accuracy_score(true_labels, predictions)
    f1 = f1_score(true_labels, predictions, average="weighted")

    print(f"Accuracy: {accuracy:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(true_labels, predictions))

    return accuracy, f1

# 生成任务评估
import evaluate

bleu = evaluate.load("bleu")
rouge = evaluate.load("rouge")

def evaluate_generation(model, dataloader, tokenizer, device):
    """评估生成任务"""
    model.eval()
    predictions = []
    references = []

    with torch.no_grad():
        for batch in tqdm(dataloader):
            batch = {k: v.to(device) for k, v in batch.items()}

            outputs = model.generate(
                **batch,
                max_new_tokens=100,
                do_sample=True,
                temperature=0.7
            )

            decoded_preds = tokenizer.batch_decode(outputs, skip_special_tokens=True)
            decoded_refs = tokenizer.batch_decode(batch["input_ids"], skip_special_tokens=True)

            predictions.extend(decoded_preds)
            references.extend(decoded_refs)

    # BLEU
    bleu_score = bleu.compute(
        predictions=predictions,
        references=[[ref] for ref in references]
    )

    # ROUGE
    rouge_score = rouge.compute(
        predictions=predictions,
        references=references
    )

    return {
        "bleu": bleu_score,
        "rouge": rouge_score
    }
```

## 实战案例

### 案例：医疗问答系统微调

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model

# 1. 准备医疗数据
medical_data = [
    {
        "instruction": "什么是高血压？",
        "output": "高血压是指血液在血管中流动时对血管壁产生的压力值持续高于正常值的疾病..."
    },
    {
        "instruction": "糖尿病有哪些症状？",
        "output": "糖尿病的主要症状包括：多饮、多尿、多食、体重下降（三多一少）..."
    },
    # ... 更多医疗问答
]

# 2. 加载模型（使用QLoRA节省显存）
model_name = "meta-llama/Llama-2-7b-chat-hf"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto"
)

tokenizer = AutoTokenizer.from_pretrained(model_name)

# 3. 配置LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)

# 4. 训练
training_args = TrainingArguments(
    output_dir="./medical_llm",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=1e-4,
    fp16=True,
    logging_steps=10,
    save_steps=100,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_medical_dataset,
)

trainer.train()

# 5. 测试
model.eval()
prompt = "什么是高血压？"
inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.7,
        do_sample=True
    )

response = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(response)
```

## 总结

大模型微调技术从全量微调发展到参数高效微调（PEFT），大幅降低了微调成本和门槛。

选择微调方法时需要考虑：
- 数据量和质量
- 可用计算资源
- 任务复杂度
- 期望性能

QLoRA是当前性价比最高的方案，适合大多数应用场景。

## 参考资料

- [LoRA Paper: LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [QLoRA Paper: QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314)
- [PEFT Library Documentation](https://huggingface.co/docs/peft)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
