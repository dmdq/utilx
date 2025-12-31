---
title: "AI与机器学习工程化实践：从模型到生产系统的完整指南"
description: "深入探讨AI/ML系统的工程化实践，涵盖模型部署、MLOps、特征工程、模型监控、A/B测试等核心主题，帮助工程师构建可扩展的生产级AI系统。"
author: "有条工具团队"
date: 2025-12-30T12:00:00+08:00
categories:
  - AI开发
  - 机器学习
tags:
  - MLOps
  - 模型部署
  - 特征工程
  - 模型监控
  - A/B测试
keywords:
  - MLOps实践
  - 机器学习工程化
  - 模型部署最佳实践
  - 特征工程
  - 模型监控
  - A/B测试
  - AI系统架构
series:
  - AI工程实践
draft: false
---

## 引言

将AI/ML模型从研究环境推向生产环境是一项复杂的工程挑战。除了模型本身的准确性，还需要考虑可扩展性、可靠性、可维护性等多个方面。本文将深入探讨AI/ML系统的工程化实践，帮助团队构建稳定高效的生产级AI系统。

## 一、MLOps概述

### 1.1 MLOps的核心组件

```python
# ========== MLOps架构概览 ==========
"""
                    ┌─────────────────┐
                    │   数据层        │
                    │ - 原始数据      │
                    │ - 特征存储      │
                    │ - 训练数据      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   训练层        │
                    │ - 特征工程      │
                    │ - 模型训练      │
                    │ - 超参数调优    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   评估层        │
                    │ - 模型评估      │
                    │ - A/B测试       │
                    │ - 模型验证      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   部署层        │
                    │ - 模型服务      │
                    │ - 批量推理      │
                    │ - 边缘部署      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   监控层        │
                    │ - 性能监控      │
                    │ - 数据漂移检测  │
                    │ - 告警系统      │
                    └─────────────────┘
"""

# MLOps各阶段的关键任务
MLOPS_PIPELINE = {
    "data": {
        "ingestion": "数据采集与清洗",
        "validation": "数据质量检查",
        "feature_engineering": "特征提取与转换",
        "feature_store": "特征存储与版本管理"
    },
    "training": {
        "experiment_tracking": "实验追踪",
        "hyperparameter_tuning": "超参数优化",
        "model_training": "模型训练",
        "model_evaluation": "模型评估"
    },
    "deployment": {
        "model_serving": "模型服务化",
        "canary_deployment": "金丝雀部署",
        "model_versioning": "模型版本管理",
        "rollback": "回滚机制"
    },
    "monitoring": {
        "performance_monitoring": "性能监控",
        "data_drift_detection": "数据漂移检测",
        "model_explainability": "模型可解释性",
        "alerting": "告警系统"
    }
}
```

### 1.2 实验管理与追踪

```python
# ========== 实验追踪系统 ==========

import mlflow
import mlflow.sklearn
from datetime import datetime
from typing import Any, Dict, Optional

class ExperimentTracker:
    """实验追踪器"""

    def __init__(self, tracking_uri: str, experiment_name: str):
        mlflow.set_tracking_uri(tracking_uri)
        mlflow.set_experiment(experiment_name)
        self.experiment_name = experiment_name

    def start_run(self, run_name: Optional[str] = None):
        """开始一次运行"""
        self.run = mlflow.start_run(run_name=run_name)
        return self.run

    def log_params(self, params: Dict[str, Any]):
        """记录参数"""
        mlflow.log_params(params)

    def log_metrics(self, metrics: Dict[str, float], step: Optional[int] = None):
        """记录指标"""
        mlflow.log_metrics(metrics, step=step)

    def log_model(self, model: Any, artifact_path: str = "model"):
        """记录模型"""
        mlflow.sklearn.log_model(model, artifact_path)

    def log_artifact(self, file_path: str):
        """记录文件"""
        mlflow.log_artifact(file_path)

    def log_figure(self, figure, artifact_file: str):
        """记录图表"""
        mlflow.log_figure(figure, artifact_file)

    def end_run(self, status: str = "FINISHED"):
        """结束运行"""
        mlflow.end_run(status=status)

# 使用示例
def train_model_with_tracking(X_train, y_train, X_test, y_test, params):
    """训练模型并追踪实验"""

    tracker = ExperimentTracker(
        tracking_uri="http://mlflow-server:5000",
        experiment_name="fraud-detection"
    )

    tracker.start_run(run_name=f"experiment-{datetime.now().strftime('%Y%m%d-%H%M%S')}")

    try:
        # 记录参数
        tracker.log_params(params)

        # 训练模型
        model = train_model(X_train, y_train, params)

        # 评估模型
        metrics = evaluate_model(model, X_test, y_test)
        tracker.log_metrics(metrics)

        # 记录模型
        tracker.log_model(model)

        # 记录学习曲线
        fig = plot_learning_curve(model, X_train, y_train)
        tracker.log_figure(fig, "learning_curve.png")

        # 记录特征重要性
        fig = plot_feature_importance(model)
        tracker.log_figure(fig, "feature_importance.png")

        tracker.end_run(status="FINISHED")

        return model, metrics

    except Exception as e:
        tracker.end_run(status="FAILED")
        raise e

# ========== 超参数优化 ==========

import optuna
from optuna.integration.mlflow import MLflowCallback

class HyperparameterOptimizer:
    """超参数优化器"""

    def __init__(self, n_trials: int = 100, timeout: Optional[int] = None):
        self.n_trials = n_trials
        self.timeout = timeout
        self.study = None

    def objective(self, trial, X_train, y_train, X_val, y_val):
        """优化目标函数"""

        # 定义搜索空间
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 50, 500),
            'max_depth': trial.suggest_int('max_depth', 3, 20),
            'learning_rate': trial.suggest_float('learning_rate', 0.001, 0.3, log=True),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
        }

        # 训练模型
        model = train_model(X_train, y_train, params)

        # 评估
        predictions = model.predict(X_val)
        score = calculate_metric(y_val, predictions)

        return score

    def optimize(self, X_train, y_train, X_val, y_val):
        """执行超参数优化"""

        # 创建研究对象
        self.study = optuna.create_study(
            direction="maximize",
            study_name="hyperparameter-optimization"
        )

        # 添加MLflow回调
        mlflc = MLflowCallback(
            tracking_uri="http://mlflow-server:5000",
            metric_name="validation_score"
        )

        # 执行优化
        self.study.optimize(
            lambda trial: self.objective(trial, X_train, y_train, X_val, y_val),
            n_trials=self.n_trials,
            timeout=self.timeout,
            callbacks=[mlflc]
        )

        return self.study.best_params, self.study.best_value

    def get_importance(self):
        """获取超参数重要性"""
        return optuna.importance.get_param_importances(self.study)
```

## 二、特征工程与管理

### 2.1 特征存储架构

```python
# ========== 特征存储系统 ==========

from abc import ABC, abstractmethod
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime, timedelta

class FeatureStore(ABC):
    """特征存储抽象类"""

    @abstractmethod
    def get_features(self, entity_ids: List[str], feature_names: List[str]) -> pd.DataFrame:
        """获取特征"""
        pass

    @abstractmethod
    def write_features(self, entity_id: str, features: Dict[str, Any]):
        """写入特征"""
        pass

class OfflineFeatureStore(FeatureStore):
    """离线特征存储 - 用于训练"""

    def __init__(self, storage_path: str):
        self.storage_path = storage_path

    def get_features(self, entity_ids: List[str], feature_names: List[str]) -> pd.DataFrame:
        """从存储获取特征"""
        # 从Parquet文件读取
        df = pd.read_parquet(f"{self.storage_path}/features.parquet")

        # 过滤实体
        df = df[df['entity_id'].isin(entity_ids)]

        # 选择特征列
        return df[['entity_id'] + feature_names]

    def write_features(self, entity_id: str, features: Dict[str, Any]):
        """写入特征到存储"""
        # 实现写入逻辑
        pass

    def create_training_set(
        self,
        entity_ids: List[str],
        feature_names: List[str],
        label_name: str
    ) -> pd.DataFrame:
        """创建训练数据集"""
        df = self.get_features(entity_ids, feature_names + [label_name])
        return df

class OnlineFeatureStore(FeatureStore):
    """在线特征存储 - 用于推理"""

    def __init__(self, redis_client):
        self.redis = redis_client

    def get_features(self, entity_ids: List[str], feature_names: List[str]) -> pd.DataFrame:
        """从Redis获取实时特征"""
        features = []

        for entity_id in entity_ids:
            key = f"feature:{entity_id}"
            data = self.redis.hgetall(key)

            feature_dict = {
                'entity_id': entity_id
            }

            for feature_name in feature_names:
                feature_dict[feature_name] = data.get(feature_name)

            features.append(feature_dict)

        return pd.DataFrame(features)

    def write_features(self, entity_id: str, features: Dict[str, Any]):
        """写入特征到Redis"""
        key = f"feature:{entity_id}"

        # 添加时间戳
        features['updated_at'] = datetime.now().isoformat()

        self.redis.hset(key, mapping=features)

        # 设置过期时间
        self.redis.expire(key, timedelta(days=7))

class FeatureEngineeringPipeline:
    """特征工程管道"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.transformers = {}

    def fit(self, df: pd.DataFrame):
        """拟合变换器"""
        for feature_config in self.config['features']:
            feature_name = feature_config['name']
            transform_type = feature_config['transform']

            if transform_type == 'standard':
                from sklearn.preprocessing import StandardScaler
                transformer = StandardScaler()
                transformer.fit(df[[feature_name]])
                self.transformers[feature_name] = transformer

            elif transform_type == 'minmax':
                from sklearn.preprocessing import MinMaxScaler
                transformer = MinMaxScaler()
                transformer.fit(df[[feature_name]])
                self.transformers[feature_name] = transformer

            elif transform_type == 'label':
                from sklearn.preprocessing import LabelEncoder
                transformer = LabelEncoder()
                transformer.fit(df[feature_name])
                self.transformers[feature_name] = transformer

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """变换数据"""
        result_df = df.copy()

        for feature_name, transformer in self.transformers.items():
            if isinstance(transformer, (StandardScaler, MinMaxScaler)):
                result_df[feature_name] = transformer.transform(df[[feature_name]]).flatten()
            elif isinstance(transformer, LabelEncoder):
                result_df[feature_name] = transformer.transform(df[feature_name])

        return result_df

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """拟合并变换"""
        self.fit(df)
        return self.transform(df)

# 使用示例
def create_training_features():
    """创建训练特征"""

    # 初始化离线特征存储
    offline_store = OfflineFeatureStore('/data/features')

    # 获取原始数据
    raw_data = load_raw_data()

    # 特征工程
    pipeline = FeatureEngineeringPipeline({
        'features': [
            {'name': 'age', 'transform': 'standard'},
            {'name': 'income', 'transform': 'minmax'},
            {'name': 'category', 'transform': 'label'}
        ]
    })

    # 拟合并变换
    features = pipeline.fit_transform(raw_data)

    # 写入特征存储
    for _, row in features.iterrows():
        offline_store.write_features(
            row['entity_id'],
            row.to_dict()
        )

    return features

def get_online_features(entity_id: str):
    """获取在线特征"""

    import redis
    r = redis.Redis(host='localhost', port=6379)

    online_store = OnlineFeatureStore(r)

    features = online_store.get_features(
        [entity_id],
        ['age', 'income', 'category']
    )

    return features.iloc[0].to_dict()
```

### 2.2 特征版本管理

```python
# ========== 特征版本管理 ==========

class FeatureVersion:
    """特征版本"""

    def __init__(
        self,
        feature_name: str,
        version: int,
        computation_logic: str,
        created_at: datetime
    ):
        self.feature_name = feature_name
        self.version = version
        self.computation_logic = computation_logic
        self.created_at = created_at

class FeatureRegistry:
    """特征注册表"""

    def __init__(self):
        self.features = {}

    def register_feature(
        self,
        feature_name: str,
        computation_logic: str,
        description: str = "",
        owner: str = ""
    ):
        """注册新特征"""

        if feature_name in self.features:
            # 创建新版本
            last_version = max(self.features[feature_name].keys())
            new_version = last_version + 1
        else:
            self.features[feature_name] = {}
            new_version = 1

        feature_version = FeatureVersion(
            feature_name=feature_name,
            version=new_version,
            computation_logic=computation_logic,
            created_at=datetime.now()
        )

        self.features[feature_name][new_version] = feature_version

        return new_version

    def get_feature(self, feature_name: str, version: Optional[int] = None):
        """获取特征定义"""
        if feature_name not in self.features:
            raise ValueError(f"Feature {feature_name} not found")

        if version is None:
            # 获取最新版本
            version = max(self.features[feature_name].keys())

        return self.features[feature_name][version]

    def list_features(self):
        """列出所有特征"""
        return {
            name: max(versions.keys())
            for name, versions in self.features.items()
        }

# 使用示例
registry = FeatureRegistry()

# 注册特征
registry.register_feature(
    feature_name="user_avg_transaction_amount",
    computation_logic="""
    SELECT
        user_id,
        AVG(amount) as user_avg_transaction_amount
    FROM transactions
    WHERE transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY user_id
    """,
    description="用户过去30天平均交易金额",
    owner="data-team"
)

# 更新特征逻辑（创建新版本）
registry.register_feature(
    feature_name="user_avg_transaction_amount",
    computation_logic="""
    SELECT
        user_id,
        AVG(amount) as user_avg_transaction_amount
    FROM transactions
    WHERE
        transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        AND status = 'completed'
    GROUP BY user_id
    """,
    description="用户过去30天已完成交易平均金额",
    owner="data-team"
)
```

## 三、模型部署与服务化

### 3.1 模型服务化

```python
# ========== 模型服务 ==========
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import joblib
import numpy as np

app = FastAPI(title="ML Model Service")

class PredictionRequest(BaseModel):
    features: List[float]

class PredictionResponse(BaseModel):
    prediction: float
    probability: float
    model_version: str
    timestamp: str

class ModelService:
    """模型服务"""

    def __init__(self, model_path: str):
        self.model = self.load_model(model_path)
        self.model_version = self.get_model_version(model_path)

    def load_model(self, model_path: str):
        """加载模型"""
        return joblib.load(model_path)

    def get_model_version(self, model_path: str) -> str:
        """获取模型版本"""
        # 从路径或元数据中提取版本
        return model_path.split('/')[-1].replace('.pkl', '')

    def predict(self, features: List[float]) -> dict:
        """预测"""
        X = np.array(features).reshape(1, -1)

        prediction = self.model.predict(X)[0]
        probability = self.model.predict_proba(X)[0].max()

        return {
            'prediction': float(prediction),
            'probability': float(probability)
        }

# 全局模型服务实例
model_service = ModelService("/models/fraud_detection_v1.pkl")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """预测接口"""

    try:
        result = model_service.predict(request.features)

        return PredictionResponse(
            prediction=result['prediction'],
            probability=result['probability'],
            model_version=model_service.model_version,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/info")
async def model_info():
    """模型信息接口"""
    return {
        "model_version": model_service.model_version,
        "model_type": type(model_service.model).__name__,
        "loaded_at": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}

# ========== 批量预测服务 ==========

class BatchPredictionService:
    """批量预测服务"""

    def __init__(self, model_path: str):
        self.model = joblib.load(model_path)
        self.batch_size = 1000

    def predict_batch(self, features: List[List[float]]) -> List[dict]:
        """批量预测"""

        results = []

        for i in range(0, len(features), self.batch_size):
            batch = features[i:i + self.batch_size]
            X = np.array(batch)

            predictions = self.model.predict(X)
            probabilities = self.model.predict_proba(X).max(axis=1)

            for pred, prob in zip(predictions, probabilities):
                results.append({
                    'prediction': int(pred),
                    'probability': float(prob)
                })

        return results

@app.post("/predict/batch")
async def predict_batch(request: PredictionRequest):
    """批量预测接口"""
    batch_service = BatchPredictionService("/models/fraud_detection_v1.pkl")
    results = batch_service.predict_batch([request.features])
    return {"predictions": results}
```

### 3.2 模型版本管理与回滚

```python
# ========== 模型版本管理 ==========

class ModelVersion:
    """模型版本"""

    def __init__(
        self,
        version: str,
        model_path: str,
        metrics: Dict[str, float],
        created_at: datetime
    ):
        self.version = version
        self.model_path = model_path
        self.metrics = metrics
        self.created_at = created_at

class ModelRegistry:
    """模型注册表"""

    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        self.models = {}
        self.current_version = None

    def register_model(
        self,
        version: str,
        model_path: str,
        metrics: Dict[str, float]
    ):
        """注册模型"""

        model_version = ModelVersion(
            version=version,
            model_path=model_path,
            metrics=metrics,
            created_at=datetime.now()
        )

        self.models[version] = model_version

        return model_version

    def set_current_version(self, version: str):
        """设置当前版本"""
        if version not in self.models:
            raise ValueError(f"Version {version} not found")

        self.current_version = version

    def get_current_model(self):
        """获取当前模型"""
        if self.current_version is None:
            raise ValueError("No current version set")

        return self.models[self.current_version]

    def rollback(self, target_version: str):
        """回滚到指定版本"""

        if target_version not in self.models:
            raise ValueError(f"Version {target_version} not found")

        old_version = self.current_version
        self.current_version = target_version

        print(f"Rollback from {old_version} to {target_version}")

    def list_versions(self):
        """列出所有版本"""
        return sorted(
            self.models.keys(),
            key=lambda v: self.models[v].created_at,
            reverse=True
        )

    def compare_versions(self, version1: str, version2: str) -> dict:
        """比较两个版本"""

        if version1 not in self.models or version2 not in self.models:
            raise ValueError("One or both versions not found")

        return {
            'version1': {
                'version': version1,
                'metrics': self.models[version1].metrics
            },
            'version2': {
                'version': version2,
                'metrics': self.models[version2].metrics
            },
            'improvement': {
                metric: self.models[version2].metrics[metric] - self.models[version1].metrics[metric]
                for metric in self.models[version1].metrics
            }
        }

# ========== 灰度发布 ==========

class CanaryDeployment:
    """灰度部署管理"""

    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self.traffic_split = {}

    def set_traffic_split(self, version_percentages: Dict[str, float]):
        """设置流量分配"""

        total = sum(version_percentages.values())

        if abs(total - 1.0) > 0.01:
            raise ValueError("Percentages must sum to 1.0")

        for version in version_percentages.keys():
            if version not in self.registry.models:
                raise ValueError(f"Version {version} not found")

        self.traffic_split = version_percentages

    def route_request(self) -> str:
        """路由请求到指定版本"""

        import random

        rand = random.random()
        cumulative = 0.0

        for version, percentage in self.traffic_split.items():
            cumulative += percentage
            if rand <= cumulative:
                return version

        return self.registry.current_version

    def gradual_rollout(
        self,
        new_version: str,
        steps: int = 10,
        duration_hours: int = 24
    ):
        """渐进式灰度发布"""

        import asyncio

        step_duration = duration_hours * 3600 / steps

        async def rollout_step(step: int):
            percentage = (step + 1) / steps

            self.set_traffic_split({
                new_version: percentage,
                self.registry.current_version: 1 - percentage
            })

            print(f"Step {step + 1}/{steps}: {new_version} at {percentage:.1%}")

            await asyncio.sleep(step_duration)

        # 执行渐进式发布
        for step in range(steps):
            asyncio.run(rollout_step(step))

        # 完全切换到新版本
        self.registry.set_current_version(new_version)
        self.traffic_split = {new_version: 1.0}
```

## 四、模型监控与A/B测试

### 4.1 模型性能监控

```python
# ========== 模型监控系统 ==========

from prometheus_client import Counter, Histogram, Gauge
import numpy as np

# 定义监控指标
prediction_count = Counter(
    'ml_predictions_total',
    'Total predictions made',
    ['model_version', 'prediction']
)

prediction_latency = Histogram(
    'ml_prediction_duration_seconds',
    'Prediction latency',
    ['model_version']
)

prediction_drift = Gauge(
    'ml_prediction_distribution',
    'Prediction distribution',
    ['model_version', 'prediction_class']
)

class ModelMonitor:
    """模型监控器"""

    def __init__(self, model_version: str, expected_distribution: dict):
        self.model_version = model_version
        self.expected_distribution = expected_distribution
        self.actual_predictions = []

    def log_prediction(
        self,
        prediction: int,
        probability: float,
        latency: float
    ):
        """记录预测"""

        prediction_count.labels(
            model_version=self.model_version,
            prediction=str(prediction)
        ).inc()

        prediction_latency.labels(
            model_version=self.model_version
        ).observe(latency)

        self.actual_predictions.append(prediction)

    def check_drift(self, threshold: float = 0.1) -> bool:
        """检查漂移"""

        if len(self.actual_predictions) < 100:
            return False

        # 计算实际分布
        actual_dist = {}
        for pred in self.actual_predictions:
            actual_dist[pred] = actual_dist.get(pred, 0) + 1

        for key in actual_dist:
            actual_dist[key] /= len(self.actual_predictions)

        # 计算分布差异
        drift_score = 0.0
        for key in self.expected_distribution:
            expected = self.expected_distribution.get(key, 0)
            actual = actual_dist.get(key, 0)
            drift_score += abs(expected - actual)

        return drift_score > threshold

    def update_distribution(self):
        """更新期望分布"""

        if len(self.actual_predictions) < 100:
            return

        new_dist = {}
        for pred in self.actual_predictions:
            new_dist[pred] = new_dist.get(pred, 0) + 1

        for key in new_dist:
            new_dist[key] /= len(self.actual_predictions)

        self.expected_distribution = new_dist
        self.actual_predictions = []

class DataDriftDetector:
    """数据漂移检测器"""

    def __init__(self, reference_data: np.ndarray):
        self.reference_data = reference_data
        self.reference_mean = np.mean(reference_data, axis=0)
        self.reference_std = np.std(reference_data, axis=0)

    def detect_drift(
        self,
        current_data: np.ndarray,
        threshold: float = 3.0
    ) -> dict:
        """检测数据漂移"""

        current_mean = np.mean(current_data, axis=0)
        current_std = np.std(current_data, axis=0)

        # Z-score检测
        z_scores = np.abs(
            (current_mean - self.reference_mean) / self.reference_std
        )

        drifted_features = np.where(z_scores > threshold)[0]

        return {
            'drift_detected': len(drifted_features) > 0,
            'drifted_features': drifted_features.tolist(),
            'z_scores': z_scores.tolist()
        }

# 使用示例
def create_model_monitor():
    """创建模型监控器"""

    # 期望分布（从训练数据获取）
    expected_dist = {
        0: 0.95,  # 95% 正常
        1: 0.05   # 5% 欺诈
    }

    monitor = ModelMonitor(
        model_version="v1.0",
        expected_distribution=expected_dist
    )

    return monitor

async def monitor_predictions():
    """监控预测"""

    monitor = create_model_monitor()

    while True:
        # 获取预测结果
        predictions = await get_recent_predictions()

        for pred in predictions:
            monitor.log_prediction(
                prediction=pred['label'],
                probability=pred['probability'],
                latency=pred['latency']
            )

        # 检查漂移
        if monitor.check_drift():
            send_alert("Prediction drift detected!")

        await asyncio.sleep(60)  # 每分钟检查
```

### 4.2 A/B测试框架

```python
# ========== A/B测试框架 ==========

class ABTest:
    """A/B测试"""

    def __init__(
        self,
        name: str,
        variants: List[str],
        traffic_split: Dict[str, float],
        metrics: List[str]
    ):
        self.name = name
        self.variants = variants
        self.traffic_split = traffic_split
        self.metrics = metrics
        self.results = {variant: {metric: [] for metric in metrics} for variant in variants}

    def assign_variant(self, user_id: str) -> str:
        """分配用户到变体"""

        import hashlib

        # 使用用户ID的哈希值保证一致性
        hash_value = int(hashlib.md5(f"{self.name}:{user_id}".encode()).hexdigest(), 16)
        normalized = hash_value / (2 ** 32 - 1)

        cumulative = 0.0
        for variant, percentage in self.traffic_split.items():
            cumulative += percentage
            if normalized <= cumulative:
                return variant

        return self.variants[-1]

    def record_metric(self, variant: str, metric: str, value: float):
        """记录指标"""

        if variant not in self.results:
            raise ValueError(f"Unknown variant: {variant}")

        if metric not in self.metrics:
            raise ValueError(f"Unknown metric: {metric}")

        self.results[variant][metric].append(value)

    def analyze(self) -> dict:
        """分析A/B测试结果"""

        from scipy import stats

        analysis = {}

        for metric in self.metrics:
            metric_analysis = {}

            # 计算每个变体的统计信息
            for variant in self.variants:
                values = self.results[variant][metric]

                if len(values) == 0:
                    continue

                metric_analysis[variant] = {
                    'mean': np.mean(values),
                    'std': np.std(values),
                    'count': len(values)
                }

            # 比较变体
            if len(self.variants) >= 2:
                variant_a, variant_b = self.variants[0], self.variants[1]

                values_a = self.results[variant_a][metric]
                values_b = self.results[variant_b][metric]

                if len(values_a) > 0 and len(values_b) > 0:
                    # t检验
                    t_stat, p_value = stats.ttest_ind(values_a, values_b)

                    metric_analysis['comparison'] = {
                        't_statistic': t_stat,
                        'p_value': p_value,
                        'significant': p_value < 0.05,
                        'lift': (
                            metric_analysis[variant_b]['mean'] -
                            metric_analysis[variant_a]['mean']
                        ) / metric_analysis[variant_a]['mean']
                    }

            analysis[metric] = metric_analysis

        return analysis

    def get_winner(self) -> str:
        """确定获胜变体"""

        analysis = self.analyze()

        # 简单策略：选择主要指标最高的变体
        primary_metric = self.metrics[0]

        best_variant = None
        best_value = float('-inf')

        for variant in self.variants:
            if primary_metric in analysis:
                value = analysis[primary_metric].get(variant, {}).get('mean', float('-inf'))

                if value > best_value:
                    best_value = value
                    best_variant = variant

        return best_variant

# 使用示例
def run_ab_test():
    """运行A/B测试"""

    # 创建A/B测试
    ab_test = ABTest(
        name="fraud_detection_v2",
        variants=["control", "treatment"],
        traffic_split={"control": 0.5, "treatment": 0.5},
        metrics=["accuracy", "precision", "recall", "f1_score"]
    )

    # 分配用户并记录指标
    async def process_prediction(user_id: str, prediction: dict, actual: int):
        """处理预测并记录指标"""

        variant = ab_test.assign_variant(user_id)

        # 使用对应变体的模型
        if variant == "control":
            result = control_model.predict(prediction['features'])
        else:
            result = treatment_model.predict(prediction['features'])

        # 计算指标
        accuracy = 1 if result['prediction'] == actual else 0
        precision = calculate_precision(result, actual)
        recall = calculate_recall(result, actual)
        f1_score = 2 * (precision * recall) / (precision + recall)

        # 记录指标
        ab_test.record_metric(variant, "accuracy", accuracy)
        ab_test.record_metric(variant, "precision", precision)
        ab_test.record_metric(variant, "recall", recall)
        ab_test.record_metric(variant, "f1_score", f1_score)

    # 分析结果
    analysis = ab_test.analyze()
    print("A/B Test Analysis:")
    print(analysis)

    # 获取获胜变体
    winner = ab_test.get_winner()
    print(f"Winner: {winner}")

    return analysis, winner
```

## 五、端到端MLOps流水线

### 5.1 CI/CD集成

```yaml
# .github/workflows/mlops-pipeline.yml
name: MLOps Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'models/**'
      - 'data/**'
      - 'training/**'
  pull_request:
    branches: [main]

jobs:
  data-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Validate data
        run: |
          python scripts/validate_data.py

      - name: Check data drift
        run: |
          python scripts/check_drift.py

  train-model:
    needs: data-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Train model
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
        run: |
          python scripts/train_model.py

      - name: Run tests
        run: |
          pytest tests/

  evaluate-model:
    needs: train-model
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Evaluate model
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
        run: |
          python scripts/evaluate_model.py

      - name: Check thresholds
        run: |
          python scripts/check_thresholds.py

  deploy-model:
    needs: evaluate-model
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          kubectl apply -f k8s/staging/

      - name: Run smoke tests
        run: |
          python scripts/smoke_test.py

      - name: Promote to production
        run: |
          kubectl apply -f k8s/production/
```

### 5.2 完整MLOps项目结构

```
mlops-project/
├── data/
│   ├── raw/                  # 原始数据
│   ├── processed/            # 处理后数据
│   └── features/             # 特征数据
├── models/
│   ├── training/             # 训练脚本
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── tune.py
│   ├── inference/            # 推理代码
│   │   ├── predict.py
│   │   └── batch_predict.py
│   └── monitoring/           # 监控脚本
│       ├── drift_detector.py
│       └── performance_monitor.py
├── features/
│   ├── feature_store.py      # 特征存储
│   └── feature_registry.py   # 特征注册表
├── experiments/
│   └── notebooks/            # 实验笔记本
├── tests/
│   ├── unit/
│   ├── integration/
│   └── performance/
├── deployment/
│   ├── k8s/                  # Kubernetes配置
│   ├── docker/               # Dockerfile
│   └── terraform/            # 基础设施代码
├── mlflow/                   # MLflow配置
├── dvc/                      # DVC配置
├── requirements.txt
└── README.md
```

## 总结

AI/ML系统的工程化实践需要：

1. **实验管理**：系统化追踪模型训练实验
2. **特征工程**：构建可复用的特征存储和管道
3. **模型部署**：实现可靠的模型服务化和版本管理
4. **监控告警**：持续监控模型性能和数据漂移
5. **A/B测试**：科学地评估模型改进效果

成功的MLOps实践不仅仅是技术问题，更需要团队协作和流程优化。

> **相关工具推荐**
> - [JSON格式化工具](https://www.util.cn/tools/json-formatter/) - JSON数据处理
> - [正则表达式测试](https://www.util.cn/tools/regex-tester/) - 文本处理
> - [Base64编码工具](https://www.util.cn/tools/base64-encode/) - 数据编码
