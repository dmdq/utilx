---
title: "云原生安全实践：构建零信任架构"
slug: "cloud-native-security"
date: 2026-01-15T17:00:00+08:00
draft: false
tags: ['云原生', '安全', '零信任', 'DevSecOps', '容器安全']
categories: ['安全架构']
author: '有条工具团队'
summary: '深入探讨云原生环境下的安全实践，包括零信任架构、容器安全、服务网格安全等'
---

## 前言

云原生架构带来了前所未有的灵活性和可扩展性，但也引入了新的安全挑战。传统的边界防御模型已不再适用，零信任架构成为云原生安全的标准。本文将深入探讨云原生环境下的安全实践和防御策略。

## 零信任架构

### 1. 身份与访问管理

```go
// 零信任认证中间件
package auth

import (
    "context"
    "fmt"
    "time"
    "github.com/coreos/go-oidc/v3/oidc"
    "golang.org/x/oauth2"
)

type ZeroTrustAuth struct {
    provider      *oidc.Provider
    verifier      *oidc.IDTokenVerifier
    tokenVerifier *TokenVerifier
    policyEngine  *PolicyEngine
}

type Identity struct {
    Subject       string            `json:"sub"`
    Email         string            `json:"email"`
    Groups        []string          `json:"groups"`
    Attributes    map[string]string `json:"attributes"`
    AuthTime      time.Time         `json:"auth_time"`
    Issuer        string            `json:"iss"`
    Audience      []string          `json:"aud"`
}

func NewZeroTrustAuth(issuerURL, clientID string) (*ZeroTrustAuth, error) {
    provider, err := oidc.NewProvider(context.Background(), issuerURL)
    if err != nil {
        return nil, fmt.Errorf("failed to create provider: %w", err)
    }

    verifier := provider.Verifier(&oidc.Config{
        ClientID: clientID,
    })

    return &ZeroTrustAuth{
        provider:     provider,
        verifier:     verifier,
        tokenVerifier: NewTokenVerifier(),
        policyEngine: NewPolicyEngine(),
    }, nil
}

// 验证请求
func (z *ZeroTrustAuth) AuthenticateRequest(
    ctx context.Context,
    token string,
    resource string,
    action string,
) (*AuthResult, error) {
    // 1. 验证令牌格式和签名
    idToken, err := z.verifier.Verify(ctx, token)
    if err != nil {
        return nil, fmt.Errorf("token verification failed: %w", err)
    }

    // 2. 提取身份信息
    var claims struct {
        Subject    string            `json:"sub"`
        Email      string            `json:"email"`
        Groups     []string          `json:"groups"`
        Attributes map[string]string `json:"attributes"`
        Issuer     string            `json:"iss"`
        Audience   []string          `json:"aud"`
    }

    if err := idToken.Claims(&claims); err != nil {
        return nil, fmt.Errorf("failed to parse claims: %w", err)
    }

    identity := &Identity{
        Subject:    claims.Subject,
        Email:      claims.Email,
        Groups:     claims.Groups,
        Attributes: claims.Attributes,
        AuthTime:   idToken.IssuedAt,
        Issuer:     claims.Issuer,
        Audience:   claims.Audience,
    }

    // 3. 检查令牌有效期
    if time.Now().After(idToken.Expiry) {
        return nil, fmt.Errorf("token expired")
    }

    // 4. 执行零信任策略检查
    decision, err := z.policyEngine.Evaluate(ctx, &PolicyRequest{
        Identity: identity,
        Resource: resource,
        Action:   action,
        Context:  z.extractContext(ctx),
    })
    if err != nil {
        return nil, fmt.Errorf("policy evaluation failed: %w", err)
    }

    if !decision.Allowed {
        return &AuthResult{
            Allowed: false,
            Reason:  decision.Reason,
        }, nil
    }

    // 5. 返回授权结果
    return &AuthResult{
        Allowed:   true,
        Identity:  identity,
        Decision:  decision,
        ExpiresAt: idToken.Expiry,
    }, nil
}

// 策略引擎
type PolicyEngine struct {
    policies []Policy
    casbin   *casbin.Enforcer
}

type PolicyRequest struct {
    Identity *Identity
    Resource string
    Action   string
    Context  RequestContext
}

type PolicyDecision struct {
    Allowed   bool
    Reason    string
    Constraints map[string]string
}

func (p *PolicyEngine) Evaluate(
    ctx context.Context,
    req *PolicyRequest,
) (*PolicyDecision, error) {
    // 1. 检查 RBAC 策略
    allowed, err := p.casbin.Enforce(
        req.Identity.Subject,
        req.Resource,
        req.Action,
    )
    if err != nil {
        return nil, fmt.Errorf("casbin enforcement failed: %w", err)
    }

    if !allowed {
        return &PolicyDecision{
            Allowed: false,
            Reason:  "RBAC policy denied",
        }, nil
    }

    // 2. 检查 ABAC 策略
    for _, policy := range p.policies {
        decision, err := policy.Evaluate(ctx, req)
        if err != nil {
            return nil, fmt.Errorf("policy evaluation failed: %w", err)
        }

        if !decision.Allowed {
            return decision, nil
        }
    }

    // 3. 应用上下文约束
    if err := p.checkContextConstraints(ctx, req); err != nil {
        return &PolicyDecision{
            Allowed: false,
            Reason:  err.Error(),
        }, nil
    }

    return &PolicyDecision{
        Allowed: true,
        Reason:  "All policies satisfied",
    }, nil
}

// 属性策略
type AttributePolicy struct {
    Name  string
    Rules []AttributeRule
}

type AttributeRule struct {
    Attribute string
    Operator  string
    Value     interface{}
}

func (p *AttributePolicy) Evaluate(
    ctx context.Context,
    req *PolicyRequest,
) (*PolicyDecision, error) {
    for _, rule := range p.Rules {
        // 获取属性值
        value := req.Identity.Attributes[rule.Attribute]
        if value == "" {
            value = getAttributeFromContext(req, rule.Attribute)
        }

        // 应用规则
        if !p.evaluateRule(value, rule.Operator, rule.Value) {
            return &PolicyDecision{
                Allowed: false,
                Reason:  fmt.Sprintf("Attribute policy %s denied", p.Name),
            }, nil
        }
    }

    return &PolicyDecision{
        Allowed: true,
    }, nil
}
```

### 2. 服务间认证

```yaml
# SPIFFE/SPIRE 配置
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT

---
# 服务工作负载身份
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service
  annotations:
    # SPIFFE ID
    spiffe.io/spiffe-id: "spiffe://example.org/ns/default/sa/payment-service"

---
# 授权策略
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-service-authz
  namespace: default
spec:
  selector:
    matchLabels:
      app: payment-service
  action: ALLOW
  rules:
  # 只允许来自订单服务的请求
  - from:
    - source:
        principals:
        - "cluster.local/ns/default/sa/order-service"
    # 只允许 POST /payments 端点
    to:
    - operation:
        methods: ["POST"]
        paths: ["/payments"]
    # 要求 JWT 声明
    when:
    - key: request.auth.claims[scope]
      values: ["payment:write"]
```

```go
// mTLS 认证实现
package mtls

import (
    "crypto/tls"
    "crypto/x509"
    "io/ioutil"
    "net"
    "time"
)

type mTLSServer struct {
    certFile    string
    keyFile     string
    caFile      string
    server      *http.Server
    certManager *CertificateManager
}

func NewmTLSServer(
    addr string,
    certFile, keyFile, caFile string,
) (*mTLSServer, error) {
    certManager, err := NewCertificateManager()
    if err != nil {
        return nil, err
    }

    server := &mTLSServer{
        certFile:    certFile,
        keyFile:     keyFile,
        caFile:      caFile,
        certManager: certManager,
    }

    // 配置 TLS
    config, err := server.createTLSConfig()
    if err != nil {
        return nil, err
    }

    server.server = &http.Server{
        Addr:      addr,
        TLSConfig: config,
    }

    return server, nil
}

func (s *mTLSServer) createTLSConfig() (*tls.Config, error) {
    // 加载服务器证书
    cert, err := tls.LoadX509KeyPair(s.certFile, s.keyFile)
    if err != nil {
        return nil, fmt.Errorf("failed to load certificate: %w", err)
    }

    // 加载 CA 证书
    caCert, err := ioutil.ReadFile(s.caFile)
    if err != nil {
        return nil, fmt.Errorf("failed to read CA certificate: %w", err)
    }

    caCertPool := x509.NewCertPool()
    caCertPool.AppendCertsFromPEM(caCert)

    return &tls.Config{
        Certificates: []tls.Certificate{cert},
        ClientCAs:    caCertPool,
        ClientAuth:   tls.RequireAndVerifyClientCert,

        // 最小 TLS 版本
        MinVersion: tls.VersionTLS12,

        // 推荐的密码套件
        CipherSuites: []uint16{
            tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
            tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
        },

        // 证书验证回调
        VerifyConnection: s.verifyConnection,
    }, nil
}

func (s *mTLSServer) verifyConnection(
    state tls.ConnectionState,
) error {
    // 验证客户端证书
    if len(state.PeerCertificates) == 0 {
        return fmt.Errorf("no client certificate provided")
    }

    cert := state.PeerCertificates[0]

    // 1. 验证证书有效性
    if time.Now().After(cert.NotAfter) {
        return fmt.Errorf("client certificate expired")
    }

    // 2. 验证证书用途
    if !isCertificateAllowed(cert) {
        return fmt.Errorf("certificate not allowed for this purpose")
    }

    // 3. 提取和验证 SPIFFE ID
    spiffeID := extractSPIFFEID(cert)
    if spiffeID == "" {
        return fmt.Errorf("no SPIFFE ID found in certificate")
    }

    // 4. 验证服务身份
    if !s.certManager.ValidateIdentity(spiffeID) {
        return fmt.Errorf("invalid service identity: %s", spiffeID)
    }

    return nil
}
```

## 容器安全

### 1. 镜像安全扫描

```python
# 容器镜像安全扫描
import aiohttp
import json
from typing import List, Dict
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Vulnerability:
    id: str
    severity: str
    package: str
    version: str
    fixed_in: str
    description: str
    links: List[str]

@dataclass
class ScanResult:
    image: str
    vulnerabilities: List[Vulnerability]
    scan_time: datetime
    summary: Dict[str, int]

class ContainerImageScanner:
    def __init__(self, trivy_config, db_config):
        self.trivy_config = trivy_config
        self.db_config = db_config

    async def scan_image(self, image: str) -> ScanResult:
        """扫描容器镜像"""
        # 1. 拉取镜像元数据
        metadata = await self.get_image_metadata(image)

        # 2. 执行漏洞扫描
        vulnerabilities = await self.run_trivy_scan(image)

        # 3. 检查镜像配置
        config_issues = await self.check_image_config(metadata)

        # 4. 生成报告
        return ScanResult(
            image=image,
            vulnerabilities=vulnerabilities,
            scan_time=datetime.utcnow(),
            summary=self.summarize_vulnerabilities(vulnerabilities)
        )

    async def run_trivy_scan(self, image: str) -> List[Vulnerability]:
        """使用 Trivy 扫描镜像"""
        cmd = [
            'trivy',
            'image',
            '--format', 'json',
            '--severity', 'HIGH,CRITICAL',
            '--no-progress',
            image
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            raise ScannerError(f"Trivy scan failed: {stderr.decode()}")

        # 解析结果
        results = json.loads(stdout.decode())
        vulnerabilities = []

        for result in results.get('Results', []):
            for vuln in result.get('Vulnerabilities', []):
                vulnerabilities.append(Vulnerability(
                    id=vuln['VulnerabilityID'],
                    severity=vuln['Severity'],
                    package=vuln['PkgName'],
                    version=vuln['InstalledVersion'],
                    fixed_in=vuln.get('FixedVersion', ''),
                    description=vuln.get('Description', ''),
                    links=vuln.get('Links', [])
                ))

        return vulnerabilities

    async def check_image_config(
        self,
        metadata: ImageMetadata
    ) -> List[ConfigIssue]:
        """检查镜像配置"""
        issues = []

        # 检查是否以 root 运行
        if metadata.user == 'root' or metadata.user == '0':
            issues.append(ConfigIssue(
                severity='HIGH',
                type='ROOT_USER',
                description='Container runs as root user',
                remediation='Set USER to non-root in Dockerfile'
            ))

        # 检查是否暴露了敏感端口
        sensitive_ports = [22, 2375, 2376, 3306, 5432, 6379, 27017]
        for port in metadata.exposed_ports:
            if port in sensitive_ports:
                issues.append(ConfigIssue(
                    severity='MEDIUM',
                    type='SENSITIVE_PORT',
                    description=f'Exposed sensitive port: {port}',
                    remediation='Remove EXPOSE directive or use service mesh'
                ))

        # 检查环境变量中的敏感信息
        sensitive_patterns = [
            'PASSWORD', 'SECRET', 'TOKEN', 'KEY', 'CREDENTIAL'
        ]
        for env_var in metadata.env_vars:
            if any(pattern in env_var.upper() for pattern in sensitive_patterns):
                issues.append(ConfigIssue(
                    severity='CRITICAL',
                    type='SECRET_IN_ENV',
                    description=f'Potential secret in environment variable: {env_var}',
                    remediation='Use secret management system'
                ))

        return issues

    def summarize_vulnerabilities(
        self,
        vulnerabilities: List[Vulnerability]
    ) -> Dict[str, int]:
        """总结漏洞"""
        summary = {
            'CRITICAL': 0,
            'HIGH': 0,
            'MEDIUM': 0,
            'LOW': 0,
            'UNKNOWN': 0
        }

        for vuln in vulnerabilities:
            severity = vuln.severity.upper()
            if severity in summary:
                summary[severity] += 1

        return summary
```

### 2. 运行时安全

```go
// Falco 规则引擎集成
package runtime

import (
    "context"
    "encoding/json"
    "fmt"
    "github.com/falcosecurity/client-go/pkg/client"
    falco "github.com/falcosecurity/client-go/pkg/api/output"
)

type RuntimeSecurityMonitor struct {
    falcoClient *client.Client
    eventChan   chan falco.Event
    handlers    map[string][]EventHandler
}

type EventHandler func(event Event) error

type Event struct {
    Timestamp   time.Time
    Priority    string
    Rule        string
    Output      string
    Source      string
    Tags        []string
    Fields      map[string]interface{}
}

func NewRuntimeSecurityMonitor(
    falcoConfig string,
) (*RuntimeSecurityMonitor, error) {
    falcoClient, err := client.NewClientFromFile(falcoConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to create falco client: %w", err)
    }

    return &RuntimeSecurityMonitor{
        falcoClient: falcoClient,
        eventChan:   make(chan falco.Event, 1000),
        handlers:    make(map[string][]EventHandler),
    }, nil
}

func (m *RuntimeSecurityMonitor) Start(
    ctx context.Context,
) error {
    // 连接到 Falco
    events, err := m.falcoClient.Events(ctx)
    if err != nil {
        return fmt.Errorf("failed to get events: %w", err)
    }

    // 处理事件
    go func() {
        for {
            select {
            case event := <-events:
                parsed := m.parseEvent(event)
                m.dispatchEvent(ctx, parsed)

            case <-ctx.Done():
                return
            }
        }
    }()

    return nil
}

func (m *RuntimeSecurityMonitor) RegisterHandler(
    rule string,
    handler EventHandler,
) {
    if _, exists := m.handlers[rule]; !exists {
        m.handlers[rule] = []EventHandler{}
    }
    m.handlers[rule] = append(m.handlers[rule], handler)
}

func (m *RuntimeSecurityMonitor) dispatchEvent(
    ctx context.Context,
    event Event,
) {
    handlers, exists := m.handlers[event.Rule]
    if !exists {
        return
    }

    for _, handler := range handlers {
        go func(h EventHandler) {
            if err := h(event); err != nil {
                log.Printf("Handler error: %v", err)
            }
        }(handler)
    }
}

// 自定义 Falco 规则
const ShellInContainerRule = `
- rule: Shell in container
  desc: A shell was spawned by a program in a container with an attached terminal.
  condition: >
    spawned_process
    and container
    and shell_procs
    and proc.tty >= 0
    and not user_expected_shell_spawn_results
  output: >
    Shell spawned in container (user=%user.name container_id=%container.id container_name=%container.name shell=%proc.name parent=%proc.pname cmdline=%proc.cmdline terminal=%proc.tty image=%container.image.repository)
  priority: WARNING
  tags: [container, shell]
`

const SensitiveFileAccessRule = `
- rule: Sensitive file access
  desc: Detect access to sensitive files
  condition: >
    open_read
    and sensitive_files
    and not proc.name in (ssh, sshd, vim, vi, nano)
  output: >
    Sensitive file access (user=%user.name command=%proc.cmdline file=%fd.name)
  priority: WARNING
  tags: [filesystem, security]
`
```

## 安全左移

### 1. IaC 安全扫描

```python
# Terraform/Kubernetes 安全扫描
class IaCSecurityScanner:
    def __init__(self):
        self.rules = self.load_rules()

    async def scan_terraform(self, tf_content: str) -> List[SecurityIssue]:
        """扫描 Terraform 配置"""
        # 解析 HCL
        config = hcl2.loads(tf_content)

        issues = []

        # 检查资源配置
        for resource in config.get('resource', []):
            resource_type = list(resource.keys())[0]
            resource_config = list(resource.values())[0]

            # 扫描资源
            resource_issues = await self.scan_resource(
                resource_type,
                resource_config
            )
            issues.extend(resource_issues)

        return issues

    async def scan_kubernetes_manifest(
        self,
        manifest: str
    ) -> List[SecurityIssue]:
        """扫描 Kubernetes 清单文件"""
        docs = yaml.safe_load_all(manifest)
        issues = []

        for doc in docs:
            if doc is None:
                continue

            kind = doc.get('kind', '')
            metadata = doc.get('metadata', {})
            spec = doc.get('spec', {})

            # 检查 Pod 安全
            if kind == 'Pod':
                issues.extend(self.check_pod_security(doc))

            # 检查 RBAC 配置
            elif kind in ['Role', 'ClusterRole']:
                issues.extend(self.check_rbac_config(doc))

            # 检查 NetworkPolicy
            elif kind == 'NetworkPolicy':
                issues.extend(self.check_network_policy(doc))

        return issues

    def check_pod_security(self, pod: dict) -> List[SecurityIssue]:
        """检查 Pod 安全配置"""
        issues = []
        spec = pod.get('spec', {})

        # 检查特权容器
        containers = spec.get('containers', [])
        for container in containers:
            security_context = container.get('securityContext', {})

            if security_context.get('privileged', False):
                issues.append(SecurityIssue(
                    severity='CRITICAL',
                    category='CONTAINER_SECURITY',
                    description='Privileged container detected',
                    resource=f"{pod['metadata']['name']}/{container['name']}",
                    remediation='Remove privileged: true from securityContext'
                ))

            if security_context.get('runAsUser', 0) == 0:
                issues.append(SecurityIssue(
                    severity='HIGH',
                    category='CONTAINER_SECURITY',
                    description='Container running as root',
                    resource=f"{pod['metadata']['name']}/{container['name']}",
                    remediation='Set runAsUser to non-zero value or use securityContext.runAsNonRoot'
                ))

        # 检查宿主机路径挂载
        volumes = spec.get('volumes', [])
        for volume in volumes:
            if volume.get('hostPath'):
                issues.append(SecurityIssue(
                    severity='MEDIUM',
                    category='STORAGE',
                    description='Host path mounted',
                    resource=f"{pod['metadata']['name']}/{volume['name']}",
                    remediation='Avoid using hostPath volumes'
                ))

        return issues

    def check_rbac_config(self, role: dict) -> List[SecurityIssue]:
        """检查 RBAC 配置"""
        issues = []
        rules = role.get('rules', [])

        for rule in rules:
            resources = rule.get('resources', [])
            verbs = rule.get('verbs', [])

            # 检查过度权限
            if '*' in verbs or '*' in resources:
                issues.append(SecurityIssue(
                    severity='HIGH',
                    category='RBAC',
                    description='Wildcard permissions detected',
                    resource=role['metadata']['name'],
                    remediation='Use specific resources and verbs instead of wildcards'
                ))

            # 检查危险操作
            dangerous_verbs = ['delete', 'deletecollection', 'patch']
            if any(v in dangerous_verbs for v in verbs):
                issues.append(SecurityIssue(
                    severity='MEDIUM',
                    category='RBAC',
                    description=f'Dangerous verbs: {verbs}',
                    resource=role['metadata']['name'],
                    remediation='Minimize destructive operations'
                ))

        return issues
```

### 2. 密钥管理

```go
// 密钥管理服务
package secrets

import (
    "context"
    "fmt"
    "time"
    "github.com/hashicorp/vault/api"
)

type SecretManager struct {
    vaultClient *api.Client
    cache       *SecretCache
    rotator     *SecretRotator
}

type Secret struct {
    Path      string
    Data      map[string]interface{}
    Version   int
    ExpiresAt time.Time
}

func NewSecretManager(vaultAddr, vaultToken string) (*SecretManager, error) {
    config := api.DefaultConfig()
    config.Address = vaultAddr

    client, err := api.NewClient(config)
    if err != nil {
        return nil, fmt.Errorf("failed to create vault client: %w", err)
    }

    client.SetToken(vaultToken)

    return &SecretManager{
        vaultClient: client,
        cache:       NewSecretCache(1000, 5*time.Minute),
        rotator:     NewSecretRotator(client),
    }, nil
}

func (m *SecretManager) GetSecret(
    ctx context.Context,
    path string,
) (*Secret, error) {
    // 检查缓存
    if cached, found := m.cache.Get(path); found {
        return cached, nil
    }

    // 从 Vault 获取
    secret, err := m.vaultClient.Logical().Read(path)
    if err != nil {
        return nil, fmt.Errorf("failed to read secret: %w", err)
    }

    if secret == nil {
        return nil, fmt.Errorf("secret not found: %s", path)
    }

    result := &Secret{
        Path:    path,
        Data:    secret.Data,
        Version: secret.Version,
    }

    // 设置过期时间
    if ttl, ok := secret.Data["ttl"]; ok {
        result.ExpiresAt = time.Now().Add(ttl.(time.Duration))
        m.cache.SetWithTTL(path, result, ttl.(time.Duration))
    } else {
        m.cache.Set(path, result)
    }

    return result, nil
}

func (m *SecretManager) CreateSecret(
    ctx context.Context,
    path string,
    data map[string]interface{},
    ttl time.Duration,
) error {
    secret := map[string]interface{}{
        "data": data,
        "ttl":  ttl.String(),
    }

    _, err := m.vaultClient.Logical().Write(path, secret)
    if err != nil {
        return fmt.Errorf("failed to create secret: %w", err)
    }

    // 清除缓存
    m.cache.Delete(path)

    return nil
}

func (m *SecretManager) RotateSecret(
    ctx context.Context,
    path string,
) error {
    return m.rotator.Rotate(ctx, path)
}

// 密钥轮换
type SecretRotator struct {
    client *api.Client
}

func (r *SecretRotator) Rotate(
    ctx context.Context,
    path string,
) error {
    // 1. 获取当前密钥
    current, err := r.client.Logical().Read(path)
    if err != nil {
        return fmt.Errorf("failed to read current secret: %w", err)
    }

    // 2. 生成新密钥
    newSecret, err := r.generateSecret(current.Data)
    if err != nil {
        return fmt.Errorf("failed to generate new secret: %w", err)
    }

    // 3. 更新密钥
    _, err = r.client.Logical().Write(path, newSecret)
    if err != nil {
        return fmt.Errorf("failed to write new secret: %w", err)
    }

    // 4. 通知依赖服务
    if err := r.notifyServices(ctx, path); err != nil {
        return fmt.Errorf("failed to notify services: %w", err)
    }

    return nil
}

func (r *SecretRotator) generateSecret(
    currentData map[string]interface{},
) (map[string]interface{}, error) {
    secretType := currentData["type"].(string)

    switch secretType {
    case "database":
        return r.generateDatabaseCredentials()
    case "api":
        return r.generateAPIToken()
    case "certificate":
        return r.generateCertificate()
    default:
        return r.generateGenericSecret()
    }
}

func (r *SecretRotator) generateDatabaseCredentials() (map[string]interface{}, error) {
    // 生成随机密码
    password, err := generateRandomPassword(32)
    if err != nil {
        return nil, err
    }

    return map[string]interface{}{
        "username": currentData["username"],
        "password": password,
        "type":     "database",
    }, nil
}
```

## 安全监控与响应

### 1. 安全事件处理

```python
# 安全事件处理系统
class SecurityEventProcessor:
    def __init__(self, config):
        self.detectors = self.load_detectors(config)
        self.responders = self.load_responders(config)
        self.alert_manager = AlertManager(config.alerts)

    async def process_event(
        self,
        event: SecurityEvent
    ) -> ProcessingResult:
        """处理安全事件"""
        # 1. 事件分类
        event_type = self.classify_event(event)
        event.category = event_type

        # 2. 风险评估
        risk_score = await self.assess_risk(event)

        # 3. 检查是否触发响应
        if risk_score > self.config.response_threshold:
            # 触发自动响应
            response = await self.trigger_response(event)

            # 发送告警
            await self.alert_manager.send_alert(event, risk_score)

            return ProcessingResult(
                action_taken=True,
                response=response,
                risk_score=risk_score
            )
        else:
            # 记录事件
            await self.log_event(event, risk_score)

            return ProcessingResult(
                action_taken=False,
                risk_score=risk_score
            )

    async def assess_risk(
        self,
        event: SecurityEvent
    ) -> float:
        """评估事件风险"""
        risk_score = 0.0

        # 基础风险分数（基于事件类型）
        base_risk = self.get_base_risk(event.type)
        risk_score += base_risk

        # 历史权重
        history_weight = await self.get_history_weight(event)
        risk_score *= history_weight

        # 上下文因素
        context_factors = await self.analyze_context(event)

        # 攻击频率
        if context_factors['attack_frequency'] > 10:
            risk_score *= 1.5

        # 时间因素（夜间事件风险更高）
        if event.timestamp.hour < 6 or event.timestamp.hour > 22:
            risk_score *= 1.2

        # 来源可信度
        if not context_factors['source_trusted']:
            risk_score *= 1.3

        return min(risk_score, 100.0)

    async def trigger_response(
        self,
        event: SecurityEvent
    ) -> ResponseAction:
        """触发响应动作"""
        # 根据事件类型选择响应器
        responder = self.select_responder(event)

        # 执行响应
        action = await responder.respond(event)

        # 记录响应
        await self.log_response(event, action)

        return action

class SecurityResponder(ABC):
    @abstractmethod
    async def respond(self, event: SecurityEvent) -> ResponseAction:
        pass

class IPBlockResponder(SecurityResponder):
    async def respond(self, event: SecurityEvent) -> ResponseAction:
        # 封禁 IP
        await self.block_ip(event.source_ip)

        # 配置防火墙规则
        await self.add_firewall_rule(event.source_ip)

        return ResponseAction(
            type='ip_block',
            description=f'Blocked IP: {event.source_ip}',
            duration='24h'
        )

class AccountLockResponder(SecurityResponder):
    async def respond(self, event: SecurityEvent) -> ResponseAction:
        # 锁定账户
        await self.lock_account(event.user_id)

        # 撤销活动会话
        await self.revoke_sessions(event.user_id)

        return ResponseAction(
            type='account_lock',
            description=f'Locked account: {event.user_id}',
            duration='until_admin_review'
        )
```

## 总结

云原生安全实践的核心要点：

1. **零信任架构**：永不信任，始终验证
2. **身份优先**：基于身份的访问控制
3. **深度防御**：多层安全控制
4. **安全左移**：在开发阶段集成安全
5. **持续监控**：实时威胁检测和响应
6. **自动化**：自动化的安全响应

云原生安全需要文化、流程和技术的协同变革。

---

**相关工具：**
- [密码生成器](https://www.util.cn/tools/password-generator/)
- [UUID 生成器](https://www.util.cn/tools/uuid-generator/)
