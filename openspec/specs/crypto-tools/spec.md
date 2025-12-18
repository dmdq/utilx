# Crypto Tools

## Purpose
提供安全的加密、解密和哈希工具，支持多种算法，确保所有计算在浏览器本地完成，保护用户数据隐私。

## Requirements

### Requirement: Base64 编码解码工具
应用必须提供Base64编码和解码功能，支持文本和文件处理。

#### Scenario: 文本Base64编码
- **WHEN** 用户输入文本并选择Base64编码
- **THEN** 系统返回正确的Base64编码结果

#### Scenario: 文本Base64解码
- **WHEN** 用户输入Base64字符串并选择解码
- **THEN** 系统返回原始文本内容

### Requirement: 哈希生成工具
应用必须提供多种哈希算法生成功能。

#### Scenario: MD5哈希生成
- **WHEN** 用户输入文本或文件
- **THEN** 系统生成对应的MD5哈希值

#### Scenario: SHA系列哈希
- **WHEN** 用户选择SHA-256、SHA-512等算法
- **THEN** 系统生成对应的安全哈希值

### Requirement: AES 加密解密工具
应用必须提供AES对称加密功能。

#### Scenario: AES加密
- **WHEN** 用户输入明文和密钥
- **THEN** 系统使用AES算法加密数据

#### Scenario: AES解密
- **WHEN** 用户输入密文和密钥
- **THEN** 系统使用AES算法解密数据

### Requirement: 数据隐私保护
所有加密工具必须在浏览器本地执行，不发送数据到服务器。

#### Scenario: 本地计算
- **WHEN** 用户执行任何加密操作
- **THEN** 所有计算都在浏览器本地完成

#### Scenario: 数据清理
- **WHEN** 用户离开页面或关闭工具
- **THEN** 系统清理内存中的敏感数据