---
title: "WebCrypto API实战：前端加密与安全通信完全指南"
slug: "webcrypto-api"
date: 2026-01-04T15:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨WebCrypto API的使用方法，包括对称加密、非对称加密、哈希算法、数字签名等，构建安全的前端应用"
tags: ["WebCrypto", "前端安全", "加密", "JavaScript", "安全"]
categories: ["前端技术", "安全"]
---

## WebCrypto API简介

WebCrypto API是现代浏览器提供的原生加密API，提供了安全的加密操作能力。与第三方库相比，它有以下优势：

1. 浏览器原生支持，无需额外依赖
2. 使用系统级加密库，性能更优
3. 安全的密钥管理，密钥不暴露给JavaScript
4. 同步和异步API支持

## 对称加密（AES）

### 生成密钥

```javascript
// 生成AES密钥
async function generateAesKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  )
  return key
}
```

### 加密数据

```javascript
async function encryptData(data, key) {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encoder.encode(data)
  )

  return {
    ciphertext: new Uint8Array(encrypted),
    iv: iv
  }
}
```

### 解密数据

```javascript
async function decryptData(encryptedData, key, iv) {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encryptedData
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}
```

## 非对称加密（RSA）

### 生成密钥对

```javascript
async function generateRsaKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )

  return keyPair
}
```

### 导出和导入密钥

```javascript
// 导出公钥
async function exportPublicKey(key) {
  const exported = await crypto.subtle.exportKey(
    'spki',
    key
  )
  return new Uint8Array(exported)
}

// 导入公钥
async function importPublicKey(keyData) {
  return await crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  )
}
```

## 哈希算法

### 计算哈希

```javascript
async function hashData(data, algorithm = 'SHA-256') {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  const hashBuffer = await crypto.subtle.digest(
    algorithm,
    dataBuffer
  )

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 使用
const hash = await hashData('Hello, WebCrypto!', 'SHA-256')
console.log(hash) // 64位十六进制字符串
```

### HMAC

```javascript
async function hmac(key, message) {
  const encoder = new TextEncoder()

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(message)
  )

  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

## 数字签名

### 生成签名

```javascript
async function signData(data, privateKey) {
  const encoder = new TextEncoder()

  const signature = await crypto.subtle.sign(
    {
      name: 'RSA-PSS',
      saltLength: 32
    },
    privateKey,
    encoder.encode(data)
  )

  return new Uint8Array(signature)
}
```

### 验证签名

```javascript
async function verifySignature(data, signature, publicKey) {
  const encoder = new TextEncoder()

  const result = await crypto.subtle.verify(
    {
      name: 'RSA-PSS',
      saltLength: 32
    },
    publicKey,
    signature,
    encoder.encode(data)
  )

  return result
}
```

## 密钥派生（PBKDF2）

```javascript
async function deriveKey(password, salt) {
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  return key
}
```

## 实战案例

### 端到端加密聊天

```javascript
class E2EChat {
  constructor() {
    this.keyPair = null
    this.peerKeys = new Map()
  }

  async init() {
    // 生成密钥对
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  async getPublicKey() {
    const exported = await crypto.subtle.exportKey('spki', this.keyPair.publicKey)
    return btoa(String.fromCharCode(...new Uint8Array(exported)))
  }

  async addPeer(id, publicKeyData) {
    const binaryString = atob(publicKeyData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const publicKey = await crypto.subtle.importKey(
      'spki',
      bytes,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    )

    this.peerKeys.set(id, publicKey)
  }

  async sendMessage(peerId, message) {
    const publicKey = this.peerKeys.get(peerId)
    if (!publicKey) throw new Error('Peer not found')

    // 生成会话密钥
    const sessionKey = await this.generateSessionKey()

    // 加密消息
    const encryptedMessage = await this.encryptMessage(message, sessionKey)

    // 加密会话密钥
    const encryptedKey = await this.encryptSessionKey(sessionKey, publicKey)

    return {
      message: encryptedMessage,
      key: encryptedKey
    }
  }

  async receiveMessage(data) {
    // 解密会话密钥
    const sessionKey = await this.decryptSessionKey(data.key)

    // 解密消息
    return await this.decryptMessage(data.message, sessionKey)
  }

  async generateSessionKey() {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }

  async encryptMessage(message, key) {
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(message)
    )

    return {
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  async decryptMessage(data, key) {
    const ciphertext = Uint8Array.from(atob(data.data), c => c.charCodeAt(0))
    const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0))

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }
}
```

## 安全最佳实践

1. **密钥管理**
   - 使用IndexedDB存储密钥
   - 密钥设置extractable为false
   - 定期轮换密钥

2. **初始化向量**
   - 每次加密使用新的IV
   - IV长度符合算法要求
   - IV可以公开存储

3. **错误处理**
   - 妥善处理加密失败
   - 记录安全事件
   - 提供用户反馈

4. **性能考虑**
   - 大文件分块处理
   - 使用Web Worker
   - 避免阻塞主线程

## 总结

WebCrypto API提供了完整的前端加密能力，可以帮助我们构建安全的应用。合理使用这些API，可以有效保护用户数据安全。
