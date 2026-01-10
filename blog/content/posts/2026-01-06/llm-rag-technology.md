---
title: "大模型RAG技术实战：构建企业级知识问答系统"
date: 2026-01-06T10:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨大模型RAG（检索增强生成）技术，包括向量数据库、文档解析、混合检索、重排序等核心技术，以及如何构建企业级知识问答系统"
tags: ["LLM", "RAG", "向量数据库", "知识问答", "AI应用"]
categories: ["人工智能", "大模型应用"]
---

## 引言

RAG（Retrieval-Augmented Generation，检索增强生成）技术是大模型应用的核心范式之一。它通过检索外部知识库来增强生成能力，有效解决了大模型知识滞后、幻觉严重等问题。本文将深入探讨RAG技术的完整实现链路，从文档处理到检索生成，帮助开发者构建企业级知识问答系统。

## RAG技术概述

### 为什么需要RAG

```python
# 纯LLM生成的问题
response = llm.generate("公司2024年Q3财报数据是多少？")
# 问题1：模型知识截止，不知道最新信息
# 问题2：可能产生幻觉，编造数据

# RAG方案
relevant_docs = retriever.search("2024年Q3财报")
response = llm.generate(
    prompt=f"基于以下文档回答问题：\n{relevant_docs}\n\n问题：公司2024年Q3财报数据是多少？"
)
# 优势1：基于真实文档，准确可靠
# 优势2：可利用最新知识，实时更新
```

### RAG核心流程

```
文档摄入 → 文本分块 → 向量化 → 向量数据库
                                      ↓
                 查询 → 向量化 → 检索 → 重排序 → LLM生成 → 答案
```

## 文档处理

### 1. 文档解析

```python
from typing import List, Dict
import pypdf
from docx import Document
import markdown

class DocumentParser:
    """多格式文档解析器"""

    def parse(self, file_path: str) -> List[Dict]:
        """解析文档"""
        ext = self.get_extension(file_path)

        if ext == ".pdf":
            return self.parse_pdf(file_path)
        elif ext == ".docx":
            return self.parse_docx(file_path)
        elif ext in [".md", ".markdown"]:
            return self.parse_markdown(file_path)
        elif ext == ".txt":
            return self.parse_text(file_path)
        else:
            raise ValueError(f"Unsupported format: {ext}")

    def parse_pdf(self, file_path: str) -> List[Dict]:
        """解析PDF文件"""
        pages = []

        with open(file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)

            for page_num, page in enumerate(pdf_reader.pages):
                text = page.extract_text()

                # 提取元数据
                metadata = {
                    "page": page_num + 1,
                    "source": file_path,
                    "total_pages": len(pdf_reader.pages)
                }

                pages.append({
                    "content": text,
                    "metadata": metadata
                })

        return pages

    def parse_docx(self, file_path: str) -> List[Dict]:
        """解析Word文档"""
        doc = Document(file_path)
        paragraphs = []

        for para_num, para in enumerate(doc.paragraphs):
            if para.text.strip():
                paragraphs.append({
                    "content": para.text,
                    "metadata": {
                        "paragraph": para_num,
                        "source": file_path
                    }
                })

        return paragraphs

    def parse_markdown(self, file_path: str) -> List[Dict]:
        """解析Markdown文件"""
        with open(file_path, 'r', encoding='utf-8') as f:
            md_content = f.read()

        # 使用markdown解析器
        md = markdown.Markdown()
        html = md.convert(md_content)

        # 提取标题层级结构
        sections = self.extract_sections(html, md_content)

        return sections

    def extract_sections(self, html: str, md: str) -> List[Dict]:
        """提取Markdown章节"""
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')

        sections = []
        current_section = {"headers": [], "content": []}

        for element in soup.find_all(['h1', 'h2', 'h3', 'p', 'code']):
            if element.name.startswith('h'):
                # 保存之前的section
                if current_section["content"]:
                    sections.append({
                        "content": "\n".join(current_section["content"]),
                        "metadata": {
                            "headers": current_section["headers"]
                        }
                    })

                # 开始新的section
                level = int(element.name[1])
                current_section = {
                    "headers": current_section["headers"][:level-1] + [element.text],
                    "content": []
                }
            else:
                current_section["content"].append(element.get_text())

        # 添加最后一个section
        if current_section["content"]:
            sections.append({
                "content": "\n".join(current_section["content"]),
                "metadata": {
                    "headers": current_section["headers"]
                }
            })

        return sections
```

### 2. 文本分块

```python
from typing import List
import re
from sentence_transformers import SentenceTransformer

class TextChunker:
    """文本分块器"""

    def __init__(self, method: str = "recursive"):
        self.method = method
        self.embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

    def chunk(self, text: str, **kwargs) -> List[str]:
        """分块"""
        if self.method == "fixed_size":
            return self.fixed_size_chunk(text, **kwargs)
        elif self.method == "recursive":
            return self.recursive_chunk(text, **kwargs)
        elif self.method == "semantic":
            return self.semantic_chunk(text, **kwargs)
        else:
            raise ValueError(f"Unknown chunking method: {self.method}")

    def fixed_size_chunk(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50
    ) -> List[str]:
        """固定大小分块"""
        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]

            chunks.append(chunk)

            # 移动到下一个块（考虑重叠）
            start = end - overlap

        return chunks

    def recursive_chunk(
        self,
        text: str,
        separators: List[str] = None,
        chunk_size: int = 1000,
        overlap: int = 100
    ) -> List[str]:
        """递归分块 - 按分隔符智能分块"""
        if separators is None:
            separators = ["\n\n", "\n", "。", "！", "？", ".", "!", "?", " ", ""]

        # 尝试按分隔符分割
        for separator in separators:
            if separator in text:
                parts = text.split(separator)

                chunks = []
                current_chunk = ""

                for part in parts:
                    # 如果添加这个部分会超过限制
                    if len(current_chunk) + len(part) + len(separator) > chunk_size:
                        if current_chunk:
                            chunks.append(current_chunk)

                        # 如果单个部分本身就太长，递归处理
                        if len(part) > chunk_size:
                            sub_chunks = self.recursive_chunk(
                                part,
                                separators[separators.index(separator) + 1:],
                                chunk_size,
                                overlap
                            )
                            chunks.extend(sub_chunks)
                            current_chunk = ""
                        else:
                            current_chunk = part + separator
                    else:
                        current_chunk += part + separator

                # 添加最后一个块
                if current_chunk:
                    chunks.append(current_chunk)

                return chunks

        # 如果没有找到分隔符，使用固定大小分块
        return self.fixed_size_chunk(text, chunk_size, overlap)

    def semantic_chunk(
        self,
        text: str,
        max_similarity: float = 0.7
    ) -> List[str]:
        """语义分块 - 基于语义相似度"""
        # 首先按句子分割
        sentences = re.split(r'([。！？.!?])', text)
        sentences = [
            s1 + s2
            for s1, s2 in zip(sentences[::2], sentences[1::2])
            if s1.strip()
        ]

        if not sentences:
            return [text]

        chunks = []
        current_chunk = [sentences[0]]

        for sentence in sentences[1:]:
            # 计算与当前块最后一个句子的相似度
            last_sentence = current_chunk[-1]
            similarity = self.compute_similarity(last_sentence, sentence)

            # 如果相似度高，合并到当前块
            if similarity < max_similarity:
                current_chunk.append(sentence)
            else:
                # 否则开始新块
                chunks.append("".join(current_chunk))
                current_chunk = [sentence]

        # 添加最后一个块
        if current_chunk:
            chunks.append("".join(current_chunk))

        return chunks

    def compute_similarity(self, text1: str, text2: str) -> float:
        """计算语义相似度"""
        emb1 = self.embedding_model.encode(text1)
        emb2 = self.embedding_model.encode(text2)

        # 余弦相似度
        import numpy as np
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
```

### 3. 元数据提取

```python
class MetadataExtractor:
    """元数据提取器"""

    def __init__(self):
        self.date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{4}年\d{1,2}月\d{1,2}日',
            r'\d{4}/\d{2}/\d{2}'
        ]
        self.url_pattern = r'https?://[^\s]+'
        self.email_pattern = r'\w+@\w+\.\w+'

    def extract(self, chunk: str) -> Dict:
        """提取元数据"""
        metadata = {}

        # 提取日期
        metadata['dates'] = self.extract_dates(chunk)

        # 提取URL
        metadata['urls'] = self.extract_urls(chunk)

        # 提取邮箱
        metadata['emails'] = self.extract_emails(chunk)

        # 提取关键词
        metadata['keywords'] = self.extract_keywords(chunk)

        # 提取实体
        metadata['entities'] = self.extract_entities(chunk)

        return metadata

    def extract_dates(self, text: str) -> List[str]:
        """提取日期"""
        dates = []
        for pattern in self.date_patterns:
            dates.extend(re.findall(pattern, text))
        return dates

    def extract_urls(self, text: str) -> List[str]:
        """提取URL"""
        return re.findall(self.url_pattern, text)

    def extract_emails(self, text: str) -> List[str]:
        """提取邮箱"""
        return re.findall(self.email_pattern, text)

    def extract_keywords(self, text: str, top_k: int = 5) -> List[str]:
        """提取关键词"""
        # 使用TF-IDF或RAKE算法
        from sklearn.feature_extraction.text import TfidfVectorizer

        vectorizer = TfidfVectorizer(max_features=top_k)
        tfidf_matrix = vectorizer.fit_transform([text])

        feature_names = vectorizer.get_feature_names_out()
        tfidf_scores = tfidf_matrix.toarray()[0]

        # 获取top-k关键词
        top_indices = tfidf_scores.argsort()[-top_k:][::-1]

        return [feature_names[i] for i in top_indices]

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """提取命名实体"""
        # 使用spaCy或其他NER工具
        import spacy

        nlp = spacy.load("zh_core_web_sm")
        doc = nlp(text)

        entities = {
            "PERSON": [],
            "ORG": [],
            "GPE": [],
            "DATE": []
        }

        for ent in doc.ents:
            if ent.label_ in entities:
                entities[ent.label_].append(ent.text)

        return entities
```

## 向量数据库

### 1. ChromaDB集成

```python
import chromadb
from chromadb.config import Settings

class ChromaVectorStore:
    """ChromaDB向量存储"""

    def __init__(self, collection_name: str = "documents"):
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./chroma_db"
        ))

        # 创建或获取collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(
        self,
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict],
        ids: List[str]
    ):
        """添加文档"""
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        where: Dict = None
    ) -> Dict:
        """搜索相似文档"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where
        )

        return {
            "documents": results["documents"][0],
            "metadatas": results["metadatas"][0],
            "distances": results["distances"][0]
        }

    def delete(self, ids: List[str]):
        """删除文档"""
        self.collection.delete(ids=ids)

    def update(
        self,
        ids: List[str],
        documents: List[str] = None,
        embeddings: List[List[float]] = None,
        metadatas: List[Dict] = None
    ):
        """更新文档"""
        self.collection.update(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
```

### 2. Pinecone集成

```python
import pinecone
from pinecone import ServerlessSpec

class PineconeVectorStore:
    """Pinecone向量存储"""

    def __init__(self, api_key: str, environment: str):
        pinecone.init(api_key=api_key, environment=environment)

        self.index_name = "rag-index"
        self.dimension = 768  # 根据embedding模型调整

        # 创建index如果不存在
        if self.index_name not in pinecone.list_indexes():
            pinecone.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )

        self.index = pinecone.Index(self.index_name)

    def upsert(self, vectors: List[Dict]):
        """批量插入/更新向量"""
        self.index.upsert(vectors=vectors)

    def query(
        self,
        vector: List[float],
        top_k: int = 5,
        filter: Dict = None,
        include_metadata: bool = True
    ) -> Dict:
        """查询相似向量"""
        return self.index.query(
            vector=vector,
            top_k=top_k,
            filter=filter,
            include_metadata=include_metadata
        )

    def delete(self, ids: List[str]):
        """删除向量"""
        self.index.delete(ids=ids)
```

### 3. Milvus集成

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType

class MilvusVectorStore:
    """Milvus向量存储"""

    def __init__(self, host: str = "localhost", port: int = 19530):
        # 连接Milvus
        connections.connect("default", host=host, port=port)

        # 定义collection schema
        self.collection_name = "rag_documents"
        self.dimension = 768

        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=100),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dimension),
            FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
            FieldSchema(name="metadata", dtype=DataType.JSON)
        ]

        schema = CollectionSchema(fields, f"{self.collection_name} schema")

        # 创建collection
        if self.collection_name not in [c.name for c in connections.list_connections()]:
            self.collection = Collection(
                name=self.collection_name,
                schema=schema
            )
        else:
            self.collection = Collection(self.collection_name)

        # 创建索引
        index_params = {
            "index_type": "IVF_FLAT",
            "metric_type": "COSINE",
            "params": {"nlist": 128}
        }
        self.collection.create_index(
            field_name="embedding",
            index_params=index_params
        )

        self.collection.load()

    def insert(self, data: List[Dict]):
        """插入数据"""
        self.collection.insert(data)

    def search(
        self,
        embedding: List[float],
        top_k: int = 5,
        expr: str = None
    ) -> Dict:
        """搜索"""
        results = self.collection.search(
            data=[embedding],
            anns_field="embedding",
            param={"metric_type": "COSINE", "params": {"nprobe": 10}},
            limit=top_k,
            expr=expr,
            output_fields=["content", "metadata"]
        )

        return results[0]
```

## 检索策略

### 1. 语义检索

```python
from sentence_transformers import SentenceTransformer
import numpy as np

class SemanticRetriever:
    """语义检索器"""

    def __init__(
        self,
        vector_store: ChromaVectorStore,
        model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"
    ):
        self.vector_store = vector_store
        self.embedding_model = SentenceTransformer(model_name)

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filters: Dict = None
    ) -> List[Dict]:
        """检索相关文档"""
        # 生成查询向量
        query_embedding = self.embedding_model.encode(query)

        # 向量搜索
        results = self.vector_store.search(
            query_embedding=query_embedding.tolist(),
            top_k=top_k,
            where=filters
        )

        # 格式化结果
        documents = []
        for i, doc in enumerate(results["documents"]):
            documents.append({
                "content": doc,
                "metadata": results["metadatas"][i],
                "score": 1 - results["distances"][i]  # 转换为相似度
            })

        return documents
```

### 2. 混合检索

```python
class HybridRetriever:
    """混合检索器（语义+关键词）"""

    def __init__(
        self,
        vector_store: ChromaVectorStore,
        keyword_index: object,  # Elasticsearch或Whoosh
        semantic_weight: float = 0.7
    ):
        self.vector_store = vector_store
        self.keyword_index = keyword_index
        self.semantic_weight = semantic_weight

    def retrieve(
        self,
        query: str,
        top_k: int = 5
    ) -> List[Dict]:
        """混合检索"""
        # 语义检索
        semantic_results = self.semantic_search(query, top_k * 2)

        # 关键词检索
        keyword_results = self.keyword_search(query, top_k * 2)

        # 归一化分数
        semantic_scores = self.normalize_scores([r["score"] for r in semantic_results])
        keyword_scores = self.normalize_scores([r["score"] for r in keyword_results])

        # 合并分数
        combined_scores = {}

        for doc, score in zip(semantic_results, semantic_scores):
            doc_id = doc["metadata"]["id"]
            combined_scores[doc_id] = score * self.semantic_weight

        for doc, score in zip(keyword_results, keyword_scores):
            doc_id = doc["metadata"]["id"]
            if doc_id in combined_scores:
                combined_scores[doc_id] += score * (1 - self.semantic_weight)
            else:
                combined_scores[doc_id] = score * (1 - self.semantic_weight)

        # 排序并返回top-k
        sorted_docs = sorted(
            combined_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_k]

        return [self.get_document(doc_id) for doc_id, _ in sorted_docs]

    def normalize_scores(self, scores: List[float]) -> List[float]:
        """归一化分数到0-1"""
        min_score = min(scores)
        max_score = max(scores)

        if max_score == min_score:
            return [1.0] * len(scores)

        return [
            (score - min_score) / (max_score - min_score)
            for score in scores
        ]
```

### 3. 重排序

```python
from sentence_transformers import CrossEncoder

class Reranker:
    """重排序器"""

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.reranker = CrossEncoder(model_name)

    def rerank(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = 5
    ) -> List[Dict]:
        """重新排序"""
        # 准备query-document对
        pairs = [
            (query, doc["content"])
            for doc in documents
        ]

        # 计算重排序分数
        scores = self.reranker.predict(pairs)

        # 添加分数到文档
        for doc, score in zip(documents, scores):
            doc["rerank_score"] = float(score)

        # 按重排序分数排序
        documents.sort(key=lambda x: x["rerank_score"], reverse=True)

        return documents[:top_k]
```

## 生成增强

### 1. Prompt构建

```python
class PromptBuilder:
    """Prompt构建器"""

    def __init__(self, template_type: str = "qa"):
        self.template_type = template_type

    def build(
        self,
        query: str,
        context: List[Dict],
        chat_history: List[Dict] = None
    ) -> str:
        """构建prompt"""
        if self.template_type == "qa":
            return self.build_qa_prompt(query, context)
        elif self.template_type == "conversational":
            return self.build_conversational_prompt(query, context, chat_history)
        elif self.template_type == "structured":
            return self.build_structured_prompt(query, context)
        else:
            raise ValueError(f"Unknown template type: {self.template_type}")

    def build_qa_prompt(self, query: str, context: List[Dict]) -> str:
        """构建QA prompt"""
        # 格式化上下文
        context_text = "\n\n".join([
            f"文档{i+1}:\n{doc['content']}\n来源: {doc['metadata'].get('source', 'unknown')}"
            for i, doc in enumerate(context)
        ])

        prompt = f"""
请基于以下文档内容回答问题。如果文档中没有相关信息，请明确说明。

### 参考文档
{context_text}

### 问题
{query}

### 回答要求
1. 只使用参考文档中的信息
2. 如果文档中没有答案，明确说明"根据提供的文档，我无法回答这个问题"
3. 引用具体来源
4. 保持准确和客观

回答：
"""
        return prompt.strip()

    def build_conversational_prompt(
        self,
        query: str,
        context: List[Dict],
        chat_history: List[Dict]
    ) -> str:
        """构建对话式prompt"""
        context_text = "\n\n".join([
            f"- {doc['content']}"
            for doc in context
        ])

        # 格式化历史对话
        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in chat_history[-5:]  # 只保留最近5轮
        ])

        prompt = f"""
### 参考信息
{context_text}

### 对话历史
{history_text}

### 当前问题
{query}

### 要求
1. 基于参考信息回答
2. 考虑对话历史上下文
3. 保持自然对话风格
4. 如果参考信息不足，可以基于常识补充

回答：
"""
        return prompt.strip()

    def build_structured_prompt(self, query: str, context: List[Dict]) -> str:
        """构建结构化prompt（用于生成结构化输出）"""
        context_text = "\n\n".join([
            f"【{doc['metadata'].get('title', '文档')}】\n{doc['content']}"
            for doc in context
        ])

        prompt = f"""
## 任务说明
请基于以下参考文档回答用户问题，并按指定格式输出。

## 参考文档
{context_text}

## 用户问题
{query}

## 输出格式要求
请按以下JSON格式输出：

{{
  "answer": "详细回答",
  "confidence": "高/中/低",
  "sources": ["来源1", "来源2"],
  "key_points": ["要点1", "要点2"]
}}

请输出：
"""
        return prompt.strip()
```

### 2. LLM生成

```python
import openai
from typing import Dict, List

class RAGGenerator:
    """RAG生成器"""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4",
        temperature: float = 0.7
    ):
        openai.api_key = api_key
        self.model = model
        self.temperature = temperature

    def generate(
        self,
        query: str,
        context: List[Dict],
        stream: bool = False
    ) -> Dict:
        """生成回答"""
        # 构建prompt
        prompt_builder = PromptBuilder(template_type="qa")
        prompt = prompt_builder.build(query, context)

        # 调用LLM
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的知识助手，擅长基于提供的文档回答问题。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=self.temperature,
            stream=stream
        )

        if stream:
            # 流式输出
            return self._stream_response(response)
        else:
            # 一次性返回
            answer = response.choices[0].message.content

            return {
                "answer": answer,
                "sources": [doc["metadata"] for doc in context],
                "model": self.model
            }

    def _stream_response(self, response):
        """处理流式响应"""
        for chunk in response:
            if chunk.choices[0].delta.get("content"):
                yield chunk.choices[0].delta.content
```

## 完整RAG系统

```python
class RAGSystem:
    """完整RAG系统"""

    def __init__(self, config: Dict):
        # 初始化组件
        self.embedder = SentenceTransformer(config["embedding_model"])
        self.vector_store = ChromaVectorStore(config["collection_name"])
        self.retriever = SemanticRetriever(self.vector_store)
        self.reranker = Reranker(config["reranker_model"])
        self.generator = RAGGenerator(config["openai_api_key"])
        self.prompt_builder = PromptBuilder(template_type="qa")

        # 文档处理
        self.parser = DocumentParser()
        self.chunker = TextChunker(method="recursive")
        self.metadata_extractor = MetadataExtractor()

    def ingest_documents(self, file_paths: List[str]):
        """摄取文档"""
        all_chunks = []

        for file_path in file_paths:
            # 解析文档
            documents = self.parser.parse(file_path)

            # 分块
            for doc in documents:
                chunks = self.chunker.chunk(
                    doc["content"],
                    chunk_size=1000,
                    overlap=200
                )

                # 提取元数据
                for i, chunk in enumerate(chunks):
                    metadata = {
                        **doc["metadata"],
                        "chunk_index": i,
                        "source_file": file_path
                    }

                    # 额外元数据提取
                    extra_metadata = self.metadata_extractor.extract(chunk)
                    metadata.update(extra_metadata)

                    all_chunks.append({
                        "content": chunk,
                        "metadata": metadata
                    })

        # 生成嵌入
        embeddings = self.embedder.encode([c["content"] for c in all_chunks])

        # 存储到向量数据库
        ids = [f"doc_{i}" for i in range(len(all_chunks))]

        self.vector_store.add_documents(
            documents=[c["content"] for c in all_chunks],
            embeddings=embeddings.tolist(),
            metadatas=[c["metadata"] for c in all_chunks],
            ids=ids
        )

        return len(all_chunks)

    def query(
        self,
        question: str,
        top_k: int = 5,
        rerank: bool = True
    ) -> Dict:
        """查询"""
        # 检索
        retrieved_docs = self.retriever.retrieve(
            query=question,
            top_k=top_k * 2  # 检索更多用于重排序
        )

        # 重排序
        if rerank:
            retrieved_docs = self.reranker.rerank(
                query=question,
                documents=retrieved_docs,
                top_k=top_k
            )

        # 生成回答
        response = self.generator.generate(
            query=question,
            context=retrieved_docs
        )

        return response

    def chat(
        self,
        message: str,
        chat_history: List[Dict] = None,
        top_k: int = 3
    ) -> Dict:
        """对话模式"""
        # 从历史中提取上下文
        if chat_history:
            # 可以使用历史对话优化检索
            context_query = self._build_context_query(message, chat_history)
        else:
            context_query = message

        # 检索
        retrieved_docs = self.retriever.retrieve(
            query=context_query,
            top_k=top_k
        )

        # 构建对话式prompt
        prompt_builder = PromptBuilder(template_type="conversational")
        prompt = prompt_builder.build(message, retrieved_docs, chat_history)

        # 生成
        response = self.generator.generate(
            query=message,
            context=retrieved_docs
        )

        # 添加到历史
        if chat_history is None:
            chat_history = []

        chat_history.append({"role": "user", "content": message})
        chat_history.append({"role": "assistant", "content": response["answer"]})

        response["chat_history"] = chat_history

        return response

    def _build_context_query(self, message: str, history: List[Dict]) -> str:
        """基于历史构建上下文查询"""
        # 提取历史中的关键词
        recent_messages = history[-4:]  # 最近2轮对话

        context = " ".join([
            msg["content"]
            for msg in recent_messages
            if msg["role"] == "user"
        ])

        return f"{context} {message}"
```

## 优化策略

### 1. 查询扩展

```python
class QueryExpander:
    """查询扩展器"""

    def __init__(self, llm):
        self.llm = llm

    def expand(self, query: str, num_expansions: int = 3) -> List[str]:
        """扩展查询"""
        prompt = f"""
        请为以下查询生成{num_expansions}个语义相似但表述不同的查询版本。

        原始查询: {query}

        请只输出扩展后的查询，每行一个：
        """

        response = self.llm.generate(prompt)

        expanded_queries = [query]
        expanded_queries.extend([
            q.strip()
            for q in response.split('\n')
            if q.strip()
        ][:num_expansions])

        return expanded_queries

    # 使用
    expanded_queries = query_expander.expand("如何提高RAG系统性能？")
    # ["如何提高RAG系统性能？", "优化RAG检索效果的方法", "RAG系统性能提升技巧"]
```

### 2. Hybrid Search

```python
class HybridSearchRetriever:
    """混合检索（稠密+稀疏）"""

    def retrieve(self, query: str, top_k: int = 10) -> List[Dict]:
        # 稠密检索（向量）
        dense_results = self.dense_retriever.retrieve(query, top_k * 2)

        # 稀疏检索（BM25）
        sparse_results = self.sparse_retriever.retrieve(query, top_k * 2)

        # RRF（Reciprocal Rank Fusion）合并
        fused_results = self.rrf_fusion(
            dense_results,
            sparse_results,
            k=60
        )

        return fused_results[:top_k]

    def rrf_fusion(
        self,
        results1: List[Dict],
        results2: List[Dict],
        k: int = 60
    ) -> List[Dict]:
        """RRF融合算法"""
        scores = {}

        # 计算第一个结果的分数
        for rank, doc in enumerate(results1):
            doc_id = doc["id"]
            scores[doc_id] = 1 / (k + rank + 1)

        # 叠加第二个结果的分数
        for rank, doc in enumerate(results2):
            doc_id = doc["id"]
            if doc_id in scores:
                scores[doc_id] += 1 / (k + rank + 1)
            else:
                scores[doc_id] = 1 / (k + rank + 1)

        # 排序
        sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        return [self.get_doc(doc_id) for doc_id, _ in sorted_docs]
```

### 3. 缓存机制

```python
from functools import lru_cache
import hashlib

class CachedRAGSystem(RAGSystem):
    """带缓存的RAG系统"""

    @lru_cache(maxsize=1000)
    def _cached_retrieve(self, query_hash: str, top_k: int):
        """缓存检索结果"""
        return super().retrieve(query_hash, top_k)

    def query(self, question: str, top_k: int = 5) -> Dict:
        # 生成查询hash
        query_hash = hashlib.md5(question.encode()).hexdigest()

        # 尝试从缓存获取
        try:
            cached_result = self._cached_retrieve(query_hash, top_k)
            return cached_result
        except:
            # 缓存未命中，执行正常检索
            result = super().query(question, top_k)
            return result
```

## 评估指标

```python
class RAGEvaluator:
    """RAG系统评估器"""

    def __init__(self, test_data: List[Dict]):
        self.test_data = test_data

    def evaluate(self, rag_system: RAGSystem) -> Dict:
        """评估RAG系统"""
        metrics = {
            "retrieval_precision": [],
            "retrieval_recall": [],
            "answer_relevance": [],
            "faithfulness": []
        }

        for test_case in self.test_data:
            question = test_case["question"]
            ground_truth_docs = test_case["relevant_docs"]
            ground_truth_answer = test_case["answer"]

            # 检索评估
            retrieved_docs = rag_system.retriever.retrieve(question, top_k=10)
            retrieved_doc_ids = [doc["metadata"]["id"] for doc in retrieved_docs]

            precision = self.compute_precision(
                retrieved_doc_ids,
                ground_truth_docs
            )
            recall = self.compute_recall(
                retrieved_doc_ids,
                ground_truth_docs
            )

            metrics["retrieval_precision"].append(precision)
            metrics["retrieval_recall"].append(recall)

            # 生成评估
            response = rag_system.query(question)

            relevance = self.compute_relevance(
                response["answer"],
                ground_truth_answer
            )
            faithfulness = self.compute_faithfulness(
                response["answer"],
                retrieved_docs
            )

            metrics["answer_relevance"].append(relevance)
            metrics["faithfulness"].append(faithfulness)

        # 计算平均指标
        return {
            "avg_precision": np.mean(metrics["retrieval_precision"]),
            "avg_recall": np.mean(metrics["retrieval_recall"]),
            "avg_relevance": np.mean(metrics["answer_relevance"]),
            "avg_faithfulness": np.mean(metrics["faithfulness"])
        }

    def compute_precision(self, retrieved: List, relevant: List) -> float:
        """计算精确率"""
        retrieved_set = set(retrieved)
        relevant_set = set(relevant)

        if not retrieved_set:
            return 0.0

        return len(retrieved_set & relevant_set) / len(retrieved_set)

    def compute_recall(self, retrieved: List, relevant: List) -> float:
        """计算召回率"""
        retrieved_set = set(retrieved)
        relevant_set = set(relevant)

        if not relevant_set:
            return 0.0

        return len(retrieved_set & relevant_set) / len(relevant_set)

    def compute_relevance(self, generated: str, reference: str) -> float:
        """计算答案相关性（使用余弦相似度）"""
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        emb1 = model.encode(generated)
        emb2 = model.encode(reference)

        import numpy as np
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

    def compute_faithfulness(self, answer: str, contexts: List[Dict]) -> float:
        """计算忠实度（答案是否基于检索的上下文）"""
        # 使用LLM判断
        prompt = f"""
        请判断以下答案是否完全基于提供的上下文信息。

        上下文:
        {chr(10).join([c['content'] for c in contexts[:3]])}

        答案:
        {answer}

        请回答"是"或"否"，并简要说明理由。
        """

        response = self.llm.generate(prompt)

        return 1.0 if "是" in response else 0.0
```

## 总结

RAG技术通过结合检索和生成，为大模型应用提供了强大的知识增强能力。本文详细介绍了从文档处理、向量存储、检索策略到生成增强的完整技术链路。

在实际应用中，需要根据具体场景选择合适的向量数据库、检索策略和优化方法。持续的评估和迭代是构建高质量RAG系统的关键。

## 参考资料

- [LangChain RAG Tutorial](https://langchain.com/docs/use_cases/question_answering)
- [LlamaIndex: Data Framework for LLM Apps](https://llamaindex.ai/)
- [Haystack: Open Source NLP Framework](https://haystack.deepset.ai/)
- [Vector Database Comparison](https://zilliz.com/learn/what-is-vector-database)
