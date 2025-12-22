---
title: "2025年云原生部署完全指南：从容器化到Serverless的现代化部署策略"
summary: "深入探讨2025年云原生部署的最新技术和最佳实践，包括Kubernetes、Serverless、微服务架构、DevOps流水线、可观测性和自动化运维，帮助企业构建高效、可扩展的云原生应用。"
date: 2025-12-22T18:00:00+08:00
draft: false
tags: ["云原生", "Kubernetes", "Serverless", "微服务", "DevOps"]
categories: ["DevOps"]
---

云原生部署已经成为现代软件开发和运维的标准范式。随着云计算技术的不断发展，2025年的云原生生态系统已经相当成熟。本文将全面介绍云原生部署的核心概念、技术栈和最佳实践。

## 云原生基础架构

### Kubernetes集群设计

构建生产级Kubernetes集群：

```yaml
# 集群基础配置
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
    project: cloud-native-app

---
# 网络策略配置
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# 应用部署配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloud-native-app
  namespace: production
  labels:
    app: cloud-native-app
    version: v2.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  selector:
    matchLabels:
      app: cloud-native-app
  template:
    metadata:
      labels:
        app: cloud-native-app
        version: v2.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
        sidecar.istio.io/inject: "true"
    spec:
      serviceAccountName: app-service-account
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: app
        image: registry.example.com/cloud-native-app:v2.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        - containerPort: 9090
          name: metrics
          protocol: TCP
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
        - name: cache-volume
          mountPath: /app/cache
      - name: envoy-sidecar
        image: envoyproxy/envoy:v1.28-latest
        ports:
        - containerPort: 15000
          name: admin
        - containerPort: 15001
          name: http
        args:
        - --config-path
        - /etc/envoy/envoy.yaml
        volumeMounts:
        - name: envoy-config
          mountPath: /etc/envoy
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: app-config
      - name: envoy-config
        configMap:
          name: envoy-config
      - name: cache-volume
        emptyDir:
          sizeLimit: 1Gi
      terminationGracePeriodSeconds: 30
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - cloud-native-app
              topologyKey: kubernetes.io/hostname

---
# 服务配置
apiVersion: v1
kind: Service
metadata:
  name: cloud-native-app-service
  namespace: production
  labels:
    app: cloud-native-app
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
spec:
  type: ClusterIP
  selector:
    app: cloud-native-app
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  - name: metrics
    port: 9090
    targetPort: 9090
    protocol: TCP

---
# Ingress配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cloud-native-app-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "gce"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://example.com"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header X-Client-ID $http_x_client_id;
      proxy_set_header X-Request-ID $request_id;
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cloud-native-app-service
            port:
              number: 80

---
# 自动扩缩容配置
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cloud-native-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cloud-native-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### Service Mesh集成

使用Istio实现服务网格：

```yaml
# Istio Gateway配置
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: cloud-native-gateway
  namespace: production
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - app.example.com
    tls:
      httpsRedirect: true
  - port:
      number: 443
      name: https
      protocol: HTTPS
    hosts:
    - app.example.com
    tls:
      mode: SIMPLE
      credentialName: app-tls

---
# Istio VirtualService配置
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: cloud-native-app-vs
  namespace: production
spec:
  hosts:
  - app.example.com
  gateways:
  - cloud-native-gateway
  http:
  - match:
    - uri:
        prefix: /api/v1/
    route:
    - destination:
        host: cloud-native-app-service
        port:
          number: 80
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
      retryOn: 5xx,gateway-error,connect-failure,refused-stream
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: cloud-native-app-service
        port:
          number: 80

---
# Istio DestinationRule配置
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: cloud-native-app-dr
  namespace: production
spec:
  host: cloud-native-app-service
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 10
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
    outlierDetection:
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
    tls:
      mode: ISTIO_MUTUAL
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

## Serverless架构

### AWS Lambda函数部署

无服务器函数的最佳实践：

```javascript
// 云原生Lambda函数示例
const AWS = require('aws-sdk');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

// 初始化AWS服务客户端
const dynamoClient = new DynamoDBDocumentClient({});
const s3Client = new S3Client({});
const cloudWatchClient = new CloudWatchClient({});

// 环境变量
const {
  TABLE_NAME,
  S3_BUCKET_NAME,
  REGION,
  ENVIRONMENT
} = process.env;

// 主处理函数
exports.handler = async (event, context) => {
  try {
    // 记录请求开始时间
    const startTime = Date.now();

    // 解析请求
    const { httpMethod, pathParameters, body, headers } = event;
    const requestId = context.awsRequestId;

    // 构建响应对象
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'X-Request-ID': requestId
      }
    };

    // 路由处理
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          response.body = await handleGetItem(pathParameters.id, requestId);
        } else {
          response.body = await handleListItems(headers);
        }
        break;

      case 'POST':
        response.body = await handleCreateItem(JSON.parse(body), requestId);
        response.statusCode = 201;
        break;

      case 'PUT':
        response.body = await handleUpdateItem(
          pathParameters.id,
          JSON.parse(body),
          requestId
        );
        break;

      case 'DELETE':
        await handleDeleteItem(pathParameters.id, requestId);
        response.statusCode = 204;
        response.body = '';
        break;

      default:
        response.statusCode = 405;
        response.body = JSON.stringify({ error: 'Method not allowed' });
    }

    // 记录性能指标
    const duration = Date.now() - startTime;
    await recordMetrics('APIRequest', duration, response.statusCode);

    return response;

  } catch (error) {
    console.error('Lambda execution error:', error);

    // 记录错误指标
    await recordErrorMetrics(error);

    // 返回错误响应
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        requestId: context.awsRequestId
      })
    };
  }
};

// 处理获取单个项目
async function handleGetItem(id, requestId) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      throw {
        statusCode: 404,
        message: 'Item not found'
      };
    }

    // 记录访问日志
    console.log(`Item accessed: ${id}`, {
      requestId,
      timestamp: new Date().toISOString()
    });

    return JSON.stringify(result.Item);

  } catch (error) {
    console.error('Get item error:', error);
    throw error;
  }
}

// 处理获取项目列表
async function handleListItems(headers) {
  try {
    // 支持分页和过滤
    const limit = parseInt(headers['x-limit']) || 20;
    const nextToken = headers['x-next-token'];

    const params = {
      TableName: TABLE_NAME,
      Limit: Math.min(limit, 100)
    };

    if (nextToken) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    const command = new ScanCommand(params);
    const result = await dynamoClient.send(command);

    const response = {
      items: result.Items,
      count: result.Count
    };

    if (result.LastEvaluatedKey) {
      response.nextToken = Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString('base64');
    }

    return JSON.stringify(response);

  } catch (error) {
    console.error('List items error:', error);
    throw error;
  }
}

// 处理创建项目
async function handleCreateItem(itemData, requestId) {
  try {
    // 数据验证
    if (!itemData.name || !itemData.type) {
      throw {
        statusCode: 400,
        message: 'Missing required fields'
      };
    }

    const item = {
      id: generateId(),
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      requestId
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    await dynamoClient.send(command);

    // 发送事件通知
    await publishEvent('item_created', item);

    return JSON.stringify(item);

  } catch (error) {
    console.error('Create item error:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      throw {
        statusCode: 409,
        message: 'Item already exists'
      };
    }

    throw error;
  }
}

// 处理更新项目
async function handleUpdateItem(id, updateData, requestId) {
  try {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updateData[key];
      }
    });

    // 添加更新时间
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamoClient.send(command);

    // 发送事件通知
    await publishEvent('item_updated', result.Attributes);

    return JSON.stringify(result.Attributes);

  } catch (error) {
    console.error('Update item error:', error);
    throw error;
  }
}

// 处理删除项目
async function handleDeleteItem(id, requestId) {
  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
      ReturnValues: 'ALL_OLD'
    });

    const result = await dynamoClient.send(command);

    if (!result.Attributes) {
      throw {
        statusCode: 404,
        message: 'Item not found'
      };
    }

    // 归档到S3
    await archiveToS3(result.Attributes);

    // 发送事件通知
    await publishEvent('item_deleted', result.Attributes);

  } catch (error) {
    console.error('Delete item error:', error);
    throw error;
  }
}

// 工具函数
function generateId() {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 归档到S3
async function archiveToS3(item) {
  const key = `archive/${ENVIRONMENT}/${item.id}.json`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(item),
    ContentType: 'application/json',
    Metadata: {
      original-table: TABLE_NAME,
      deleted-at: new Date().toISOString()
    }
  });

  await s3Client.send(command);
}

// 发布事件
async function publishEvent(eventType, data) {
  const event = {
    eventType,
    data,
    timestamp: new Date().toISOString(),
    source: 'cloud-native-app',
    environment: ENVIRONMENT
  };

  // 这里可以集成EventBridge或其他事件总线
  console.log('Event published:', event);
}

// 记录性能指标
async function recordMetrics(metricName, value, statusCode) {
  const command = new PutMetricDataCommand({
    Namespace: 'CloudNativeApp',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: 'Milliseconds',
        Dimensions: [
          {
            Name: 'Environment',
            Value: ENVIRONMENT
          },
          {
            Name: 'StatusCode',
            Value: statusCode.toString()
          }
        ]
      }
    ]
  });

  try {
    await cloudWatchClient.send(command);
  } catch (error) {
    console.error('Failed to record metrics:', error);
  }
}

// 记录错误指标
async function recordErrorMetrics(error) {
  const command = new PutMetricDataCommand({
    Namespace: 'CloudNativeApp',
    MetricData: [
      {
        MetricName: 'Errors',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'Environment',
            Value: ENVIRONMENT
          },
          {
            Name: 'ErrorType',
            Value: error.name || 'Unknown'
          }
        ]
      }
    ]
  });

  try {
    await cloudWatchClient.send(command);
  } catch (metricsError) {
    console.error('Failed to record error metrics:', metricsError);
  }
}
```

### Serverless Framework配置

```yaml
# serverless.yml
service: cloud-native-app

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    TABLE_NAME: ${self:service}-${self:provider.stage}-items
    S3_BUCKET_NAME: ${self:service}-${self:provider.stage}-archive
    REGION: ${self:provider.region}
    ENVIRONMENT: ${self:provider.stage}

  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource:
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TABLE_NAME}
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource:
            - arn:aws:s3:::${self:provider.environment.S3_BUCKET_NAME}/*
        - Effect: Allow
          Action:
            - cloudwatch:PutMetricData
          Resource: '*'

functions:
  api:
    handler: index.handler
    description: 'Main API handler'
    timeout: 30
    memorySize: 512
    events:
      - http:
          path: /items
          method: get
          cors: true
      - http:
          path: /items
          method: post
          cors: true
      - http:
          path: /items/{id}
          method: get
          cors: true
      - http:
          path: /items/{id}
          method: put
          cors: true
      - http:
          path: /items/{id}
          method: delete
          cors: true

    environment:
      NODE_ENV: ${self:provider.stage}

  dataProcessor:
    handler: data-processor.handler
    description: 'Background data processor'
    timeout: 900
    memorySize: 1024
    events:
      - eventBridge:
          pattern:
            source:
              - cloud-native-app
            detail-type:
              - item_created
              - item_updated

plugins:
  - serverless-webpack
  - serverless-offline
  - serverless-dotenv-plugin

custom:
  webpack:
    webpackConfig: 'webpack.config.js'
    includeModules: true
    excludeFiles: src/**/*.test.js

  serverless-offline:
    httpPort: 3000
    websocketPort: 3001

resources:
  Resources:
    ItemsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.TABLE_NAME}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
          - AttributeName: type
            AttributeType: S
          - AttributeName: createdAt
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        GlobalSecondaryIndexes:
          - IndexName: TypeIndex
            KeySchema:
              - AttributeName: type
                KeyType: HASH
            Projection:
              ProjectionType: ALL
          - IndexName: CreatedAtIndex
            KeySchema:
              - AttributeName: createdAt
                KeyType: HASH
            Projection:
              ProjectionType: ALL
        PointInTimeRecoverySpecification:
          PointInTimeRecoveryEnabled: true
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

    ArchiveBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:provider.environment.S3_BUCKET_NAME}
        VersioningConfiguration:
          Status: Enabled
        LifecycleConfiguration:
          Rules:
            - Id: ArchiveRule
              Status: Enabled
              Transitions:
                - TransitionInDays: 30
                  StorageClass: STANDARD_IA
                - TransitionInDays: 90
                  StorageClass: GLACIER
                - TransitionInDays: 365
                  StorageClass: DEEP_ARCHIVE

    CloudWatchLogGroup:
      Type: AWS::Logs::LogGroup
      Properties:
        LogGroupName: /aws/lambda/${self:service}-${self:provider.stage}-api
        RetentionInDays: 30
```

## DevOps流水线

### GitHub Actions CI/CD

云原生的持续集成和部署流水线：

```yaml
# .github/workflows/cloud-native-cd.yml
name: Cloud Native CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run security audit
      run: npm audit --audit-level moderate

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Generate SBOM
      uses: anchore/sbom-action@v0
      with:
        image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}
        format: spdx-json
        output-file: sbom.spdx.json

    - name: Upload SBOM
      uses: actions/upload-artifact@v3
      with:
        name: sbom
        path: sbom.spdx.json

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name staging-cluster

    - name: Deploy to Kubernetes
      run: |
        helm upgrade --install cloud-native-app-staging ./helm-chart \
          --namespace staging \
          --create-namespace \
          --set image.repository=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }} \
          --set image.tag=develop-${{ github.sha }} \
          --set environment=staging \
          --set ingress.host=staging.example.com \
          --set replicaCount=2 \
          --values ./helm-chart/values-staging.yaml \
          --wait \
          --timeout 10m

    - name: Run smoke tests
      run: |
        npm run test:smoke -- --baseUrl=https://staging.example.com

    - name: Run performance tests
      run: |
        npm run test:performance -- --baseUrl=https://staging.example.com

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name production-cluster

    - name: Deploy to Kubernetes (Blue-Green)
      run: |
        # 部署绿色环境
        helm upgrade --install cloud-native-app-green ./helm-chart \
          --namespace production \
          --set image.repository=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }} \
          --set image.tag=main-${{ github.sha }} \
          --set environment=production \
          --set deployment.color=green \
          --set replicaCount=3 \
          --values ./helm-chart/values-production.yaml \
          --wait \
          --timeout 15m

    - name: Switch traffic to green
      run: |
        kubectl patch service cloud-native-app-service \
          -n production \
          -p '{"spec":{"selector":{"color":"green"}}}'

    - name: Run health checks
      run: |
        npm run test:health -- --baseUrl=https://app.example.com

    - name: Cleanup blue environment
      run: |
        helm uninstall cloud-native-app-blue -n production || true

  post-deployment:
    name: Post-Deployment Checks
    runs-on: ubuntu-latest
    needs: [deploy-staging, deploy-production]
    if: always() && (needs.deploy-staging.result == 'success' || needs.deploy-production.result == 'success')

    steps:
    - name: Run integration tests
      run: npm run test:e2e

    - name: Generate deployment report
      run: |
        echo "## Deployment Summary" >> $GITHUB_STEP_SUMMARY
        echo "- **Commit**: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
        echo "- **Branch**: ${{ github.ref_name }}" >> $GITHUB_STEP_SUMMARY
        echo "- **Image**: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
        echo "- **Environment**: ${{ needs.deploy-production.result == 'success' && 'Production' || 'Staging' }}" >> $GITHUB_STEP_SUMMARY
        echo "- **Status**: ✅ Success" >> $GITHUB_STEP_SUMMARY
```

## 可观测性与监控

### Prometheus + Grafana监控栈

```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    rule_files:
      - "rules/*.yml"

    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093

    scrape_configs:
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
        - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https

      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: kubernetes.default.svc:443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics

      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
        - role: pod
        relabel_configs:
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__
        - action: labelmap
          regex: __meta_kubernetes_pod_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_pod_name]
          action: replace
          target_label: kubernetes_pod_name

  cloud-native-app-rules.yml: |
    groups:
    - name: cloud-native-app.rules
      rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} for {{ $labels.handler }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.pod }} is crash looping"

      - alert: MemoryUsageHigh
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

      - alert: CPUUsageHigh
        expr: rate(container_cpu_usage_seconds_total[5m]) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is above 80%"
```

### 分布式追踪系统

```yaml
# jaeger-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.49
        ports:
        - containerPort: 16686
          name: ui
        - containerPort: 14268
          name: collector
        - containerPort: 14250
          name: grpc
        env:
        - name: SPAN_STORAGE_TYPE
          value: elasticsearch
        - name: ES_SERVER_URLS
          value: http://elasticsearch:9200
        - name: ES_USERNAME
          valueFrom:
            secretKeyRef:
              name: elasticsearch-credentials
              key: username
        - name: ES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: elasticsearch-credentials
              key: password
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: jaeger
  namespace: monitoring
spec:
  selector:
    app: jaeger
  ports:
  - name: ui
    port: 16686
    targetPort: 16686
  - name: collector
    port: 14268
    targetPort: 14268
  - name: grpc
    port: 14250
    targetPort: 14250
```

## 总结

云原生部署代表了现代软件开发的未来方向。通过掌握这些技术：

1. **容器化技术**：Docker、Kubernetes的核心概念和应用
2. **服务网格**：Istio等Service Mesh技术实现微服务治理
3. **Serverless架构**：AWS Lambda等无服务器计算模式
4. **DevOps流水线**：自动化CI/CD和基础设施即代码
5. **可观测性**：监控、日志、追踪三位一体的监控体系

通过这些技术的综合应用，你可以构建出高度可扩展、高可用、易维护的云原生应用系统。云原生不仅仅是技术栈的选择，更是一种现代化的软件开发和运维理念。