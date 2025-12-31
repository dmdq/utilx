---
title: "用户行为分析实战：洞察用户行为，优化产品体验"
description: "深入探讨用户行为分析的方法论和实践技巧，从数据采集、行为分析、漏斗优化到个性化推荐，帮助你全面理解用户，提升产品体验和转化率。"
author: "有条工具团队"
date: 2025-12-23T13:00:00+08:00
categories:
  - 用户研究
  - 产品优化
tags:
  - 用户行为
  - 产品分析
  - 用户体验
  - 转化优化
  - 行为分析
keywords:
  - 用户行为分析
  - 产品优化
  - 用户分群
  - 留存分析
  - 行为漏斗
series:
  - 产品数据实战
draft: false
---

## 引言

用户行为分析是产品优化的核心。通过深入了解用户如何使用产品，我们可以发现痛点、优化体验、提升转化。本文将系统讲解用户行为分析的完整方法论。

## 一、用户行为数据采集

### 1.1 行为数据模型

```javascript
// 用户行为事件数据模型
const UserBehaviorEvent = {
  // 核心事件属性
  event: {
    name: "product_view",        // 事件名称
    category: "engagement",       // 事件分类
    timestamp: 1703270400000,     // 时间戳
    userId: "user_12345",         // 用户ID
    sessionId: "session_abc",     // 会话ID

    // 事件属性
    properties: {
      // 产品相关
      productId: "prod_001",
      productName: "Premium Plan",
      category: "subscription",
      price: 99.00,

      // 用户上下文
      referrer: "https://google.com",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "winter_sale",

      // 技术环境
      device: "desktop",
      browser: "Chrome",
      os: "Windows 10",
      screenResolution: "1920x1080",

      // 页面信息
      pageUrl: "/products/premium",
      pageTitle: "Premium Plan",
      previousPage: "/pricing"
    }
  },

  // 用户属性
  user: {
    userId: "user_12345",
    email: "user@example.com",
    country: "CN",
    language: "zh-CN",
    timezone: "Asia/Shanghai",

    // 自定义属性
    customerTier: "free",
    registrationDate: "2025-01-15",
    lastLoginDate: "2025-12-20",
    totalSpent: 0,
    purchaseCount: 0
  }
};

// 事件追踪代码示例
function trackEvent(eventName, properties = {}) {
  const event = {
    event: eventName,
    timestamp: Date.now(),
    userId: getCurrentUserId(),
    sessionId: getSessionId(),
    properties: {
      ...properties,
      page: window.location.href,
      referrer: document.referrer
    }
  };

  // 发送到分析平台
  // Mixpanel / Amplitude / Google Analytics
  analytics.track(eventName, properties);

  return event;
}

// 常见事件定义
const CommonEvents = {
  // 页面浏览
  pageView: (pageName) => trackEvent('page_view', {
    page_name: pageName
  }),

  // 用户注册
  signUp: (method) => trackEvent('sign_up', {
    signup_method: method
  }),

  // 产品使用
  featureUse: (featureName) => trackEvent('feature_used', {
    feature_name: featureName
  }),

  // 转化事件
  purchase: (orderId, value) => trackEvent('purchase', {
    order_id: orderId,
    revenue: value
  })
};
```

### 1.2 埋点设计原则

**埋点设计框架**

```yaml
事件设计原则:

  命名规范:
    - 使用动词+名词组合
    - 统一使用下划线分隔
    - 保持命名一致性
    - 避免使用缩写

    好的例子:
      - product_viewed
      - cart_item_added
      - search_performed
      - video_played

    不好的例子:
      - prodView
      - add2cart
      - srch
      - vidPlay

  属性设计:
    - 必需属性 vs 可选属性
    - 数据类型明确
    - 提供默认值
    - 文档说明清晰

    标准属性:
      - event_time (datetime)
      - user_id (string)
      - session_id (string)
      - platform (string)
      - device_type (string)

  事件层级:
    Level 1 - 核心业务事件:
      - sign_up
      - purchase
      - subscription_renewal

    Level 2 - 功能使用事件:
      - feature_used
      - tool_accessed
      - report_generated

    Level 3 - 交互细节事件:
      - button_clicked
      - form_field_focus
      - error_displayed

  采样策略:
    高价值事件: 100% 采集
      - 购买、注册、订阅

    中等价值事件: 10-50% 采样
      - 页面浏览、点击

    低价值事件: 1-10% 采样
      - 鼠标移动、滚动
```

## 二、用户分群分析

### 2.1 RFM用户分层

```python
# RFM用户价值分层分析
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class RFMAnalysis:
    """RFM用户价值分析"""

    def __init__(self, transactions_df):
        """
        transactions_df: 包含用户交易数据
        必需列: user_id, order_date, amount
        """
        self.df = transactions_df
        self.analysis_date = datetime.now()

    def calculate_rfm(self):
        """计算RFM指标"""

        # 计算最近购买时间
        recency = self.df.groupby('user_id')['order_date'].max().reset_index()
        recency['recency'] = (
            self.analysis_date - recency['order_date']
        ).dt.days

        # 计算购买频率
        frequency = self.df.groupby('user_id')['order_date'].count().reset_index()
        frequency.columns = ['user_id', 'frequency']

        # 计算购买金额
        monetary = self.df.groupby('user_id')['amount'].sum().reset_index()
        monetary.columns = ['user_id', 'monetary']

        # 合并RFM
        rfm = recency.merge(frequency, on='user_id').merge(monetary, on='user_id')
        rfm = rfm[['user_id', 'recency', 'frequency', 'monetary']]

        return rfm

    def score_rfm(self, rfm_df, n_quantiles=5):
        """RFM评分（1-5分）"""

        # R分数：越小越好（最近购买得分高）
        rfm_df['R_score'] = pd.qcut(
            rfm_df['recency'],
            n_quantiles,
            labels=[5, 4, 3, 2, 1],
            duplicates='drop'
        ).astype(int)

        # F分数：越大越好
        rfm_df['F_score'] = pd.qcut(
            rfm_df['frequency'].rank(method='first'),
            n_quantiles,
            labels=[1, 2, 3, 4, 5],
            duplicates='drop'
        ).astype(int)

        # M分数：越大越好
        rfm_df['M_score'] = pd.qcut(
            rfm_df['monetary'].rank(method='first'),
            n_quantiles,
            labels=[1, 2, 3, 4, 5],
            duplicates='drop'
        ).astype(int)

        # 计算综合RFM分数
        rfm_df['RFM_score'] = (
            rfm_df['R_score'] * 100 +
            rfm_df['F_score'] * 10 +
            rfm_df['M_score']
        )

        return rfm_df

    def segment_users(self, rfm_df):
        """用户分群"""

        def assign_segment(row):
            R, F, M = row['R_score'], row['F_score'], row['M_score']

            # 重要价值客户
            if R >= 4 and F >= 4 and M >= 4:
                return 'Champions'

            # 重要保持客户
            elif R >= 3 and F >= 3 and M >= 3:
                return 'Loyal Customers'

            # 潜力客户
            elif R >= 3 and F <= 2 and M >= 3:
                return 'Potential Loyalist'

            # 重要挽留客户
            elif R <= 2 and F >= 3 and M >= 3:
                return 'At Risk'

            # 流失客户
            elif R <= 2 and F <= 2 and M <= 2:
                return 'Lost'

            # 新客户
            elif F <= 2 and M <= 2:
                return 'New Customers'

            else:
                return 'Others'

        rfm_df['segment'] = rfm_df.apply(assign_segment, axis=1)

        return rfm_df

    def get_segment_insights(self, rfm_df):
        """分群洞察"""

        segments = rfm_df.groupby('segment').agg({
            'user_id': 'count',
            'recency': 'mean',
            'frequency': 'mean',
            'monetary': ['mean', 'sum']
        }).round(2)

        segments.columns = [
            'user_count', 'avg_recency', 'avg_frequency',
            'avg_monetary', 'total_monetary'
        ]
        segments = segments.sort_values('total_monetary', ascending=False)

        return segments

    def recommend_strategies(self, segment):
        """分群策略建议"""

        strategies = {
            'Champions': {
                'priority': 'Highest',
                'strategy': 'VIP服务',
                'actions': [
                    '专属客服',
                    '优先功能访问',
                    '专属折扣',
                    '推荐计划邀请'
                ],
                'expected_impact': '保持忠诚度，提高复购'
            },

            'Loyal Customers': {
                'priority': 'High',
                'strategy': '会员升级',
                'actions': [
                    '忠诚度奖励',
                    '升级优惠',
                    '会员特权',
                    '生日福利'
                ],
                'expected_impact': '提升消费频次'
            },

            'At Risk': {
                'priority': 'High',
                'strategy': '挽回激活',
                'actions': [
                    '个性化优惠',
                    '产品更新通知',
                    '客服回访',
                    '限时折扣'
                ],
                'expected_impact': '防止流失，重新激活'
            },

            'Lost': {
                'priority': 'Medium',
                'strategy': '重新获客',
                'actions': [
                    '大幅折扣',
                    '新产品推荐',
                    '问卷调查',
                    '改进沟通'
                ],
                'expected_impact': '部分挽回'
            },

            'New Customers': {
                'priority': 'Medium',
                'strategy': '新手培养',
                'actions': [
                    '新手引导',
                    '功能教程',
                    '首次购买优惠',
                    '社群邀请'
                ],
                'expected_impact': '转化为活跃用户'
            }
        }

        return strategies.get(segment, {})
```

### 2.2 行为特征分群

```python
# 基于行为的用户分群
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

class BehaviorSegmentation:
    """行为特征分群"""

    def __init__(self, event_data):
        """
        event_data: 用户行为事件数据
        """
        self.events = event_data

    def create_behavior_features(self):
        """创建行为特征"""

        # 特征1：活跃度（事件总数）
        activity = self.events.groupby('user_id').size().reset_index()
        activity.columns = ['user_id', 'total_events']

        # 特征2：使用天数
        active_days = self.events.groupby('user_id')['date'].nunique().reset_index()
        active_days.columns = ['user_id', 'active_days']

        # 特征3：功能使用广度（不同事件类型数）
        feature_breadth = self.events.groupby('user_id')['event_name'].nunique().reset_index()
        feature_breadth.columns = ['user_id', 'unique_events']

        # 特征4：会话时长
        session_duration = self.events.groupby(['user_id', 'session_id']).agg({
            'timestamp': lambda x: x.max() - x.min()
        }).reset_index()
        session_duration['duration_seconds'] = session_duration['timestamp'].dt.total_seconds()
        avg_duration = session_duration.groupby('user_id')['duration_seconds'].mean().reset_index()
        avg_duration.columns = ['user_id', 'avg_session_duration']

        # 特征5：核心功能使用率
        core_events = ['purchase', 'checkout', 'add_to_cart']
        core_usage = self.events[
            self.events['event_name'].isin(core_events)
        ].groupby('user_id').size().reset_index()
        core_usage.columns = ['user_id', 'core_events_count']

        # 合并所有特征
        features = activity.merge(active_days, on='user_id', how='outer') \
                         .merge(feature_breadth, on='user_id', how='outer') \
                         .merge(avg_duration, on='user_id', how='outer') \
                         .merge(core_usage, on='user_id', how='outer')

        # 填充缺失值
        features = features.fillna(0)

        # 计算衍生特征
        features['events_per_day'] = features['total_events'] / (features['active_days'] + 1)
        features['core_event_ratio'] = features['core_events_count'] / (features['total_events'] + 1)

        return features

    def perform_clustering(self, features_df, n_clusters=5):
        """执行聚类分析"""

        # 准备特征（去除user_id）
        feature_cols = [col for col in features_df.columns if col != 'user_id']
        X = features_df[feature_cols].values

        # 标准化
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # 聚类
        kmeans = KMeans(
            n_clusters=n_clusters,
            random_state=42,
            n_init=10
        )
        clusters = kmeans.fit_predict(X_scaled)

        # 添加聚类标签
        result = features_df.copy()
        result['cluster'] = clusters

        # 保存模型和标准化器
        self.kmeans = kmeans
        self.scaler = scaler

        return result, kmeans.cluster_centers_

    def interpret_clusters(self, clustered_df, feature_cols):
        """解释聚类结果"""

        cluster_profiles = []

        for cluster_id in sorted(clustered_df['cluster'].unique()):
            cluster_data = clustered_df[
                clustered_df['cluster'] == cluster_id
            ]

            profile = {
                'cluster_id': cluster_id,
                'size': len(cluster_data),
                'percentage': len(cluster_data) / len(clustered_df) * 100,
                'characteristics': {}
            }

            # 计算各特征的平均值
            for col in feature_cols:
                cluster_mean = cluster_data[col].mean()
                overall_mean = clustered_df[col].mean()

                # 计算相对于整体的差异
                diff_pct = ((cluster_mean - overall_mean) / overall_mean) * 100

                profile['characteristics'][col] = {
                    'cluster_mean': cluster_mean,
                    'overall_mean': overall_mean,
                    'difference_pct': diff_pct
                }

            cluster_profiles.append(profile)

        return cluster_profiles
```

## 三、用户留存分析

### 3.1 留存率计算

```python
# 用户留存分析
import pandas as pd
import numpy as np

class RetentionAnalysis:
    """用户留存分析"""

    def __init__(self, activity_data):
        """
        activity_data: 用户活动日志
        必需列: user_id, activity_date
        """
        self.data = activity_data

    def calculate_cohort_retention(self):
        """计算同期群留存"""

        # 找到每个用户的首次活动日期
        self.data['activity_date'] = pd.to_datetime(self.data['activity_date'])
        cohort = self.data.groupby('user_id')['activity_date'].min().reset_index()
        cohort.columns = ['user_id', 'cohort_date']

        # 合并同期群信息
        df_with_cohort = self.data.merge(cohort, on='user_id')

        # 计算同期群周期（月）
        df_with_cohort['cohort_period'] = (
            df_with_cohort['activity_date'].dt.to_period('M') -
            df_with_cohort['cohort_date'].dt.to_period('M')
        ).apply(lambda x: x.n)

        # 创建同期群透视表
        cohort_data = df_with_cohort.groupby(
            ['cohort_date', 'cohort_period']
        )['user_id'].nunique().reset_index()
        cohort_pivot = cohort_data.pivot(
            index='cohort_date',
            columns='cohort_period',
            values='user_id'
        )

        # 计算留存率
        cohort_size = cohort_pivot.iloc[:, 0]
        retention = cohort_pivot.divide(cohort_size, axis=0) * 100

        return {
            'cohort_data': cohort_pivot,
            'retention_rate': retention.round(2),
            'cohort_size': cohort_size
        }

    def calculate_retention_metrics(self, periods=[1, 7, 30]):
        """计算特定周期的留存率"""

        # 找到每个用户的首次活动日期
        first_activity = self.data.groupby('user_id')['activity_date'].min().reset_index()
        first_activity.columns = ['user_id', 'first_date']

        # 合并首次活动信息
        df_with_first = self.data.merge(first_activity, on='user_id')

        retention_metrics = {}

        for period in periods:
            # 计算特定周期的留存
            period_end = df_with_first['first_date'] + pd.Timedelta(days=period)
            retained_users = df_with_first[
                df_with_first['activity_date'] <= period_end
            ].groupby('user_id').size().reset_index()

            # 标记留存用户
            retained_users['retained'] = retained_users[0] >= 2  # 至少2次活动
            retention_rate = retained_users['retained'].mean() * 100

            retention_metrics[f'Day_{period}_retention'] = retention_rate.round(2)

        return retention_metrics

    def retention_curve_analysis(self):
        """留存曲线分析"""

        # 计算每个用户的留存天数
        user_retention = self.data.groupby('user_id')['activity_date'].agg([
            ('first_date', 'min'),
            ('last_date', 'max'),
            ('activity_days', lambda x: x.nunique())
        ]).reset_index()

        user_retention['lifespan_days'] = (
            user_retention['last_date'] - user_retention['first_date']
        ).dt.days + 1

        # 留存曲线
        retention_curve = user_retention.groupby('lifespan_days').size().cumsum() / len(user_retention) * 100

        return {
            'retention_curve': retention_curve,
            'median_lifespan': user_retention['lifespan_days'].median(),
            'avg_lifespan': user_retention['lifespan_days'].mean()
        }
```

### 3.2 流失预测

```python
# 用户流失预测
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

class ChurnPrediction:
    """用户流失预测"""

    def __init__(self, activity_data):
        self.data = activity_data

    def create_churn_features(self, churn_days=30):
        """创建流失预测特征"""

        # 定义流失：X天没有活动
        last_date = self.data['activity_date'].max()
        churn_date = last_date - pd.Timedelta(days=churn_days)

        # 计算每个用户的特征
        features = self.data.groupby('user_id').agg({
            'activity_date': [
                ('last_activity', 'max'),
                ('first_activity', 'min'),
                ('activity_count', 'count'),
                ('unique_days', lambda x: x.nunique())
            ]
        }).reset_index()

        features.columns = ['user_id', 'last_activity', 'first_activity',
                          'activity_count', 'unique_days']

        # 计算额外特征
        features['account_age_days'] = (
            features['last_activity'] - features['first_activity']
        ).dt.days

        features['avg_daily_activity'] = features['activity_count'] / (features['unique_days'] + 1)

        features['days_since_last'] = (
            last_date - features['last_activity']
        ).dt.days

        # 标记流失用户
        features['churned'] = (features['last_activity'] < churn_date).astype(int)

        # 选择特征列
        feature_cols = ['activity_count', 'unique_days',
                       'account_age_days', 'avg_daily_activity',
                       'days_since_last']

        return features, feature_cols

    def train_churn_model(self, features_df, feature_cols):
        """训练流失预测模型"""

        X = features_df[feature_cols]
        y = features_df['churned']

        # 分割数据
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # 训练模型
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        model.fit(X_train, y_train)

        # 预测
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        # 评估
        metrics = {
            'accuracy': model.score(X_test, y_test),
            'roc_auc': roc_auc_score(y_test, y_prob),
            'classification_report': classification_report(y_test, y_pred),
            'feature_importance': dict(zip(feature_cols,
                                          model.feature_importances_))
        }

        self.model = model
        self.feature_cols = feature_cols

        return model, metrics

    def predict_churn_risk(self, user_data):
        """预测用户流失风险"""

        # 确保特征顺序一致
        X = user_data[self.feature_cols]

        # 预测
        churn_prob = self.model.predict_proba(X)[:, 1]

        # 风险分层
        risk_levels = []
        for prob in churn_prob:
            if prob >= 0.7:
                risk_levels.append('High')
            elif prob >= 0.4:
                risk_levels.append('Medium')
            else:
                risk_levels.append('Low')

        return churn_prob, risk_levels
```

## 四、用户旅程分析

### 4.1 路径分析

```python
# 用户路径分析
class UserJourneyAnalysis:
    """用户旅程分析"""

    def __init__(self, event_data):
        self.data = event_data

    def analyze_common_paths(self, top_n=10):
        """分析常见用户路径"""

        # 按用户和会话分组，创建事件序列
        user_paths = self.data.sort_values(['user_id', 'session_id', 'timestamp']) \
            .groupby(['user_id', 'session_id'])['event_name'] \
            .apply(list).reset_index()
        user_paths.columns = ['user_id', 'session_id', 'path']

        # 统计路径频率
        path_tuples = user_paths['path'].apply(tuple)
        path_counts = path_tuples.value_counts().head(top_n)

        return path_counts

    def create_transition_matrix(self):
        """创建状态转移矩阵"""

        # 创建事件对
        self.data = self.data.sort_values(['user_id', 'timestamp'])
        self.data['next_event'] = self.data.groupby('user_id')['event_name'].shift(-1)

        # 计算转移概率
        transitions = self.data.groupby(['event_name', 'next_event']).size().reset_index()
        transitions.columns = ['from_event', 'to_event', 'count']

        # 创建转移矩阵
        transition_matrix = transitions.pivot(
            index='from_event',
            columns='to_event',
            values='count'
        ).fillna(0)

        # 归一化
        transition_matrix = transition_matrix.div(transition_matrix.sum(axis=1), axis=0)

        return transition_matrix

    def find_conversion_paths(self, start_event, end_event):
        """查找从起始到结束的路径"""

        # 筛选包含起始事件的会话
        sessions_with_start = self.data[
            self.data['event_name'] == start_event
        ]['session_id'].unique()

        # 在这些会话中查找结束事件
        conversion_sessions = self.data[
            (self.data['session_id'].isin(sessions_with_start)) &
            (self.data['event_name'] == end_event)
        ]['session_id'].unique()

        # 提取完整路径
        conversion_paths = self.data[
            self.data['session_id'].isin(conversion_sessions)
        ].sort_values(['session_id', 'timestamp']) \
         .groupby('session_id')['event_name'] \
         .apply(list)

        # 统计路径
        path_stats = {}
        for path in conversion_paths:
            # 找到start_event和end_event之间的路径
            try:
                start_idx = path.index(start_event)
                end_idx = path.index(end_event)
                journey = path[start_idx:end_idx + 1]
                journey_tuple = tuple(journey)

                path_stats[journey_tuple] = path_stats.get(journey_tuple, 0) + 1
            except ValueError:
                continue

        # 排序并返回
        sorted_paths = sorted(path_stats.items(), key=lambda x: x[1], reverse=True)

        return sorted_paths[:10]
```

## 五、产品优化实践

### 5.1 A/B测试框架

```python
# A/B测试分析
from scipy import stats
import pandas as pd

class ABTestAnalyzer:
    """A/B测试分析器"""

    def __init__(self, experiment_data):
        """
        experiment_data columns:
        - user_id
        - variant (A/B)
        - converted (0/1)
        - metric_value (可选)
        """
        self.data = experiment_data

    def calculate_conversion_rate(self):
        """计算转化率"""

        summary = self.data.groupby('variant').agg({
            'user_id': 'count',
            'converted': ['sum', 'mean']
        }).round(4)

        summary.columns = ['total_users', 'conversions', 'conversion_rate']

        return summary

    def statistical_test(self, confidence_level=0.95):
        """统计显著性检验"""

        # 准备数据
        variant_a = self.data[self.data['variant'] == 'A']['converted']
        variant_b = self.data[self.data['variant'] == 'B']['converted']

        # 执行Z检验
        count_a = variant_a.sum()
        count_b = variant_b.sum()
        nobs_a = len(variant_a)
        nobs_b = len(variant_b)

        z_stat, p_value = stats.proportions_ztest(
            [count_a, count_b],
            [nobs_a, nobs_b]
        )

        # 计算置信区间
        se_A = np.sqrt(variant_a.std() / nobs_a)
        se_B = np.sqrt(variant_b.std() / nobs_b)

        cr_A = variant_a.mean()
        cr_B = variant_b.mean()

        diff = cr_B - cr_A
        se_diff = np.sqrt(se_A**2 + se_B**2)

        ci_lower = diff - stats.norm.ppf(1 - (1 - confidence_level) / 2) * se_diff
        ci_upper = diff + stats.norm.ppf(1 - (1 - confidence_level) / 2) * se_diff

        results = {
            'variant_A_cr': cr_A,
            'variant_B_cr': cr_B,
            'absolute_lift': diff,
            'relative_lift': diff / cr_A if cr_A > 0 else 0,
            'z_statistic': z_stat,
            'p_value': p_value,
            'is_significant': p_value < (1 - confidence_level),
            'confidence_interval': (ci_lower, ci_upper),
            'confidence_level': confidence_level
        }

        return results

    def calculate_sample_size(self, baseline_cr, mde, alpha=0.05, power=0.8):
        """
        计算所需样本量

        baseline_cr: 基线转化率
        mde: 最小可检测效应
        alpha: 显著性水平
        power: 统计功效
        """

        effect_size = mde / baseline_cr

        # 使用Cohen's h计算
        from statsmodels.stats.proportion import proportion_effectsize
        from statsmodels.stats.power import NormalIndPower

        effect = proportion_effectsize(baseline_cr, baseline_cr * (1 + mde))
        power_analysis = NormalIndPower()

        sample_size = power_analysis.solve_power(
            effect_size=effect,
            alpha=alpha,
            power=power
        )

        return int(np.ceil(sample_size))
```

## 六、行为数据可视化

### 6.1 用户行为热力图

```javascript
// 用户行为热力图实现
class UserBehaviorHeatmap {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.init();
  }

  init() {
    // 创建热力图图层
    this.heatmap = h337.createContainer({
      container: this.container,
      radius: 25,
      maxOpacity: .8,
      minOpacity: 0,
      blur: .75
    });

    // 添加数据点
    const points = this.data.map(point => ({
      x: point.x,
      y: point.y,
      value: 1  // 每个点击的权重
    }));

    this.heatmap.setData({
      max: Math.max(...this.data.map(d => d.value || 1)),
      data: points
    });
  }

  // 按设备类型筛选
  filterByDevice(device) {
    const filtered = this.data.filter(d => d.device === device);
    this.heatmap.setData({ data: filtered });
  }

  // 按日期范围筛选
  filterByDateRange(startDate, endDate) {
    const filtered = this.data.filter(d =>
      d.timestamp >= startDate && d.timestamp <= endDate
    );
    this.heatmap.setData({ data: filtered });
  }
}
```

## 总结

用户行为分析是产品优化的基石。通过系统的行为分析，我们可以：

1. **理解用户需求** - 通过行为数据洞察用户真实意图
2. **发现产品问题** - 识别用户流失点和瓶颈
3. **优化用户体验** - 基于数据做出产品决策
4. **提升关键指标** - 留存率、转化率、用户满意度

记住，数据只是手段，提升用户体验才是目的。始终以用户为中心，用数据驱动产品决策。

> **实用工具**
> - [时间戳转换](https://www.util.cn/tools/timestamp-convert/) - 时间数据处理
> - [JSON格式化](https://www.util.cn/tools/json-formatter/) - 分析数据格式化
> - [正则表达式测试](https://www.util.cn/tools/regex-tester/) - 数据提取辅助