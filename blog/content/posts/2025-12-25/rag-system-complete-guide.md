---
title: "RAG系统构建完全指南：打造企业级知识问答系统"
summary: "深入解析检索增强生成（RAG）系统的架构设计、向量数据库、嵌入模型和评估方法，帮助你构建准确可靠的企业知识问答系统。"
date: 2025-12-25T23:00:00+08:00
draft: false
tags: ["RAG", "向量数据库", "知识库", "LLM", "Embeddings"]
categories: ["AI开发"]
author: "有条工具团队"
---

检索增强生成（Retrieval-Augmented Generation, RAG）是大语言模型应用的核心技术。它结合了信息检索和生成式AI的能力，让LLM能够访问和利用外部知识库，提供更准确、更可靠的回答。

## RAG 核心概念

### 工作流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 用户    │───>│ 检索器  │───>│ LLM     │───>│ 答案    │
│ 问题    │    │         │    │         │    │         │
└─────────┘    └────┬────┘    └─────────┘    └─────────┘
                    │
                    ▼
              ┌─────────────┐
              │  向量数据库  │
              │  (知识库)    │
              └─────────────┘
```

## 系统架构设计

### 完整的RAG流程

```python
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import numpy as np

class EnterpriseRAG:
    """企业级RAG系统"""

    def __init__(self, config: Dict[str, Any]):
        # 配置
        self.config = config

        # 嵌入模型
        self.embedder = SentenceTransformer(
            config.get("embed_model", "sentence-transformers/all-MiniLM-L6-v2")
        )

        # 向量数据库
        self.vector_db = self._init_vector_db(config.get("vector_db"))

        # LLM客户端
        self.llm = self._init_llm(config.get("llm"))

    def _init_vector_db(self, db_config: Dict):
        """初始化向量数据库"""

        db_type = db_config.get("type", "faiss")

        if db_type == "faiss":
            import faiss
            dimension = self.embedder.get_sentence_embedding_dimension()
            index = faiss.IndexFlatIP(dimension)
            return {"type": "faiss", "index": index}

        elif db_type == "pinecone":
            import pinecone
            pinecone.init(
                api_key=db_config["api_key"],
                environment=db_config["environment"]
            )
            return {"type": "pinecone"}

        elif db_type == "milvus":
            from pymilvus import connections, Collection
            connections.connect(
                alias="default",
                host=db_config["host"],
                port=db_config["port"]
            )
            return {"type": "milvus"}

    def _init_llm(self, llm_config: Dict):
        """初始化LLM"""

        provider = llm_config.get("provider", "anthropic")

        if provider == "anthropic":
            from anthropic import Anthropic
            return Anthropic(api_key=llm_config["api_key"])

        elif provider == "openai":
            from openai import OpenAI
            return OpenAI(api_key=llm_config["api_key"])

        elif provider == "local":
            # 使用本地模型
            return None

    def index_documents(self, documents: List[Dict[str, Any]]):
        """索引文档"""

        # 提取文本
        texts = [doc["content"] for doc in documents]

        # 文本切分
        chunks = self._chunk_texts(texts, chunk_size=500, overlap=50)

        # 生成嵌入
        embeddings = self.embedder.encode(
            [chunk["text"] for chunk in chunks]
        )

        # 存储到向量数据库
        self._store_embeddings(chunks, embeddings)

    def _chunk_texts(
        self,
        texts: List[str],
        chunk_size: int = 500,
        overlap: int = 50
    ) -> List[Dict]:
        """文本切分"""

        chunks = []

        for idx, text in enumerate(texts):
            # 按段落切分
            paragraphs = text.split("\n\n")

            current_chunk = ""
            chunk_id = 0

            for para in paragraphs:
                if len(current_chunk) + len(para) > chunk_size:
                    if current_chunk:
                        chunks.append({
                            "text": current_chunk.strip(),
                            "doc_id": idx,
                            "chunk_id": chunk_id
                        })
                        chunk_id += 1
                    current_chunk = para[overlap:]
                else:
                    current_chunk += "\n\n" + para

            if current_chunk:
                chunks.append({
                    "text": current_chunk.strip(),
                    "doc_id": idx,
                    "chunk_id": chunk_id
                })

        return chunks

    def _store_embeddings(self, chunks: List[Dict], embeddings: np.ndarray):
        """存储嵌入"""

        db_type = self.vector_db["type"]

        if db_type == "faiss":
            import faiss

            # 归一化
            faiss.normalize_L2(embeddings)

            # 添加到索引
            self.vector_db["index"].add(
                embeddings.astype("float32")
            )

            # 存储元数据
            if "metadata" not in self.vector_db:
                self.vector_db["metadata"] = []
            self.vector_db["metadata"].extend(chunks)

        elif db_type == "pinecone":
            import pinecone

            index = pinecone.Index(self.vector_db["index_name"])

            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                index.upsert([
                    (str(i), embedding.tolist(), {
                        "text": chunk["text"],
                        "doc_id": chunk["doc_id"]
                    })
                ])

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """检索相关文档"""

        # 生成查询嵌入
        query_embedding = self.embedder.encode([query])

        db_type = self.vector_db["type"]

        if db_type == "faiss":
            import faiss

            # 归一化
            faiss.normalize_L2(query_embedding)

            # 搜索
            scores, indices = self.vector_db["index"].search(
                query_embedding.astype("float32"),
                top_k
            )

            # 组装结果
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.vector_db["metadata"]):
                    meta = self.vector_db["metadata"][idx]
                    results.append({
                        "text": meta["text"],
                        "score": float(score),
                        "doc_id": meta["doc_id"]
                    })

            return results

        elif db_type == "pinecone":
            import pinecone

            index = pinecone.Index(self.vector_db["index_name"])

            query_result = index.query(
                vector=query_embedding[0].tolist(),
                top_k=top_k,
                include_metadata=True
            )

            return [
                {
                    "text": match["metadata"]["text"],
                    "score": match["score"],
                    "doc_id": match["metadata"]["doc_id"]
                }
                for match in query_result["matches"]
            ]

    def generate(self, query: str, context: List[Dict]) -> str:
        """生成回答"""

        # 构建提示
        context_text = "\n\n".join([
            f"[文档{i+1}] {doc['text']}"
            for i, doc in enumerate(context)
        ])

        prompt = f"""
基于以下文档回答问题。如果文档中没有相关信息，请明确说明。

{context_text}

问题：{query}

回答：
"""

        # 调用LLM
        if self.llm:
            response = self.llm.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        else:
            # 本地模型
            pass

    def ask(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """问答接口"""

        # 检索
        retrieved_docs = self.retrieve(query, top_k=top_k)

        # 检查相关性
        if retrieved_docs and retrieved_docs[0]["score"] < 0.5:
            return {
                "answer": "抱歉，我在知识库中没有找到相关信息。",
                "sources": [],
                "confidence": "low"
            }

        # 生成
        answer = self.generate(query, retrieved_docs)

        return {
            "answer": answer,
            "sources": [
                {"doc_id": doc["doc_id"], "score": doc["score"]}
                for doc in retrieved_docs
            ],
            "confidence": "high" if retrieved_docs[0]["score"] > 0.7 else "medium"
        }
```

## 高级技巧

### 混合检索

```python
class HybridRetriever:
    """混合检索：向量+关键词"""

    def __init__(self, vector_db, keyword_index):
        self.vector_db = vector_db
        self.keyword_index = keyword_index

    def retrieve(self, query: str, alpha: float = 0.5, k: int = 5):
        """
        混合检索
        alpha: 向量检索权重 (0-1)
        1-alpha: 关键词检索权重
        """

        # 向量检索
        vector_results = self.vector_db.search(query, k=k*2)

        # 关键词检索
        keyword_results = self.keyword_index.search(query, k=k*2)

        # 结果融合（RRF算法）
        fused = self.reciprocal_rank_fusion(
            {
                "vector": vector_results,
                "keyword": keyword_results
            },
            weights={"vector": alpha, "keyword": 1-alpha}
        )

        return sorted(
            fused.items(),
            key=lambda x: x[1],
            reverse=True
        )[:k]

    def reciprocal_rank_fusion(self, results: Dict, weights: Dict, k: int = 60):
        """RRF融合算法"""

        fused = {}

        for method, items in results.items():
            weight = weights.get(method, 1.0)

            for rank, item in enumerate(items):
                item_id = item["id"]

                if item_id not in fused:
                    fused[item_id] = 0

                # RRF公式
                fused[item_id] += weight / (k + rank + 1)

        return fused
```

### 重排序

```python
class Reranker:
    """重排序器"""

    def __init__(self):
        from sentence_transformers import CrossEncoder
        self.reranker = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2"
        )

    def rerank(self, query: str, documents: List[Dict], top_k: int = 5):
        """重排序"""

        # 计算查询-文档相关性分数
        pairs = [[query, doc["text"]] for doc in documents]
        scores = self.reranker.predict(pairs)

        # 更新分数
        for doc, score in zip(documents, scores):
            doc["rerank_score"] = float(score)

        # 按新分数排序
        reranked = sorted(
            documents,
            key=lambda x: x["rerank_score"],
            reverse=True
        )

        return reranked[:top_k]
```

## 评估体系

```python
class RAGEvaluator:
    """RAG系统评估"""

    def evaluate(
        self,
        test_queries: List[Dict],
        rag_system: EnterpriseRAG
    ) -> Dict[str, float]:
        """
        test_queries: [
            {
                "query": "什么是机器学习？",
                "expected_answer": "机器学习是...",
                "expected_docs": [1, 3, 5]
            }
        ]
        """

        metrics = {
            "retrieval_precision": [],
            "retrieval_recall": [],
            "answer_relevance": [],
            "answer_faithfulness": []
        }

        for test in test_queries:
            # 执行查询
            result = rag_system.ask(test["query"])

            # 检索评估
            retrieved_doc_ids = [s["doc_id"] for s in result["sources"]]
            expected_doc_ids = test["expected_docs"]

            # 精确率
            precision = len(
                set(retrieved_doc_ids) & set(expected_doc_ids)
            ) / len(retrieved_doc_ids)
            metrics["retrieval_precision"].append(precision)

            # 召回率
            recall = len(
                set(retrieved_doc_ids) & set(expected_doc_ids)
            ) / len(expected_doc_ids)
            metrics["retrieval_recall"].append(recall)

            # 答案相关性
            relevance = self._compute_relevance(
                result["answer"],
                test["expected_answer"]
            )
            metrics["answer_relevance"].append(relevance)

            # 忠实度
            faithfulness = self._compute_faithfulness(
                result["answer"],
                [s["text"] for s in result["sources"]]
            )
            metrics["answer_faithfulness"].append(faithfulness)

        # 计算平均指标
        return {
            k: sum(v) / len(v)
            for k, v in metrics.items()
        }

    def _compute_relevance(self, generated: str, expected: str) -> float:
        """计算相关性（使用余弦相似度）"""

        from sentence_transformers import SentenceTransformer
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

        emb1 = embedding_model.encode([generated])
        emb2 = embedding_model.encode([expected])

        from sklearn.metrics.pairwise import cosine_similarity
        return cosine_similarity(emb1, emb2)[0][0]

    def _compute_faithfulness(self, answer: str, contexts: List[str]) -> float:
        """计算忠实度（答案是否基于上下文）"""

        # 简单方法：检查答案中的关键实体是否在上下文中
        import spacy
        nlp = spacy.load("zh_core_web_sm")

        doc = nlp(answer)
        entities = [ent.text for ent in doc.ents]

        found = sum(
            1 for ent in entities
            if any(ent in ctx for ctx in contexts)
        )

        return found / len(entities) if entities else 1.0
```

## 部署方案

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Enterprise RAG API")

class Question(BaseModel):
    text: str
    top_k: int = 5

class Answer(BaseModel):
    answer: str
    sources: List[Dict]
    confidence: str

# 初始化RAG系统
rag = EnterpriseRAG({
    "embed_model": "sentence-transformers/all-MiniLM-L6-v2",
    "vector_db": {
        "type": "pinecone",
        "api_key": "your-api-key",
        "environment": "us-east-1-aws",
        "index_name": "enterprise-kb"
    },
    "llm": {
        "provider": "anthropic",
        "api_key": "your-api-key"
    }
})

# 启动时索引文档
@app.on_event("startup")
async def startup():
    documents = load_documents_from_s3()
    rag.index_documents(documents)

@app.post("/api/ask", response_model=Answer)
async def ask(question: Question):
    """问答接口"""

    result = rag.ask(question.text, question.top_k)

    return Answer(**result)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 最佳实践

1. **文档预处理**：清洗、去重、分段
2. **嵌入模型选择**：平衡性能和成本
3. **向量数据库**：选择合适的规模和配置
4. **混合检索**：结合向量和关键词检索
5. **重排序**：提高检索精度
6. **缓存策略**：缓存常见问题
7. **持续评估**：跟踪系统性能

RAG系统不是一成不变的，需要根据实际使用情况持续优化。
