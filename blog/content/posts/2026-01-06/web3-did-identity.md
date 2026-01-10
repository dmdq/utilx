---
title: "WEB3去中心化身份（DID）技术深度解析"
date: 2026-01-06T11:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨WEB3去中心化身份（DID）技术，包括W3C DID标准、可验证凭证（VC）、身份钱包、链上声誉等核心技术，以及如何构建去中心化身份系统"
tags: ["WEB3", "DID", "区块链", "去中心化", "数字身份"]
categories: ["WEB3", "区块链技术"]
---

## 引言

去中心化身份（Decentralized Identity，简称DID）是WEB3的核心基础设施之一。它让用户完全掌控自己的身份数据，不再依赖中心化的身份提供商。本文将深入探讨DID的技术原理、W3C标准、可验证凭证（VC）以及如何构建生产级的去中心化身份系统。

## DID基础概念

### 传统身份系统的问题

```
中心化身份平台
├── Google账号
│   └── 谷歌掌握所有数据
├── 微信账号
│   └── 腾讯掌握所有数据
└── 支付宝账号
    └── 蚂蚁掌握所有数据

问题：
- 数据孤岛：各平台数据不互通
- 隐私泄露：中心化服务器易被攻击
- 审查风险：平台可随时封禁账号
- 数据滥用：平台可擅自使用用户数据
```

### 去中心化身份的优势

```typescript
// DID架构
interface DIDArchitecture {
  user: {
    control: "complete",  // 用户完全控制
    portable: true,       // 身份可跨平台使用
    privacy: "enhanced"   // 隐私保护
  },
  verifier: {
    trust: "decentralized",  // 去中心化信任
    cost: "low"              // 验证成本低
  },
  issuer: {
    efficiency: "high",    // 发行效率高
    revocation: "easy"     // 撤销机制简单
  }
}
```

## W3C DID标准

### DID结构

```typescript
// DID URL格式
did:method:specific-idstring

// 示例
did:ethr:0x5a2e...  // Ethereum DID
did:sol:1234...     // Solana DID
did:web:example.com // Web DID
did:key:z6Mk...     // Key DID

// 解析DID
interface DID {
  method: string      // 方法名（ethr, sol, web, key等）
  id: string         // 特定方法的标识符
}
```

### DID文档

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1"
  ],
  "id": "did:ethr:0x5a2e...",
  "verificationMethod": [
    {
      "id": "did:ethr:0x5a2e...#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0x5a2e...",
      "blockchainAccountId": "0x5a2e...@eip155:1"
    }
  ],
  "authentication": [
    "did:ethr:0x5a2e...#controller"
  ],
  "assertionMethod": [
    "did:ethr:0x5a2e...#controller"
  ],
  "capabilityDelegation": [
    "did:ethr:0x5a2e...#controller"
  ],
  "capabilityInvocation": [
    "did:ethr:0x5a2e...#controller"
  ],
  "keyAgreement": [
    {
      "id": "did:ethr:0x5a2e...#keyAgreement",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:ethr:0x5a2e...",
      "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
    }
  ],
  "service": [
    {
      "id": "did:ethr:0x5a2e...#vcs",
      "type": "VerifiableCredentialService",
      "serviceEndpoint": "https://example.com/vcs/"
    }
  ]
}
```

### DID方法实现

```typescript
// Ethereum DID Registry
import { ethers } from 'ethers'

class EthrDID {
  private registry: ethers.Contract
  private provider: ethers.Provider

  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com')
    this.registry = new ethers.Contract(
      '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
      ['function owner(address) view returns (address)'],
      this.provider
    )
  }

  async resolve(did: string): Promise<DIDDocument> {
    // 解析DID
    const [, , address] = did.split(':')

    // 从链上获取DID文档
    const owner = await this.registry.owner(address)

    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: did,
      verificationMethod: [{
        id: `${did}#controller`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: `${address}@eip155:1`
      }],
      authentication: [`${did}#controller`],
      assertionMethod: [`${did}#controller`]
    }
  }

  async createDID(privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey)
    const address = await wallet.getAddress()

    return `did:ethr:${address}`
  }
}

// 使用
const ethrDid = new EthrDID()
const did = await ethrDid.createDID(privateKey)
// did:ethr:0x5a2e...

const document = await ethrDid.resolve(did)
```

## 可验证凭证（Verifiable Credentials）

### VC数据模型

```typescript
interface VerifiableCredential {
  '@context': string[] | string
  type: string[]
  id?: string
  issuer: string | Issuer
  issuanceDate: string
  expirationDate?: string
  credentialSubject: CredentialSubject
  credentialStatus?: CredentialStatus
  refreshService?: RefreshService
  termsOfUse?: TermsOfUse[]
  evidence?: Evidence[]
  proof?: Proof
}

// 示例：大学学历凭证
const universityDegree: VerifiableCredential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://www.w3.org/2018/credentials/examples/v1'
  ],
  type: ['VerifiableCredential', 'UniversityDegreeCredential'],
  id: 'urn:uuid:12345678-1234-5678-1234-567812345678',
  issuer: 'did:ethr:0x1234...',
  issuanceDate: '2024-01-06T12:00:00Z',
  expirationDate: '2034-01-06T12:00:00Z',
  credentialSubject: {
    id: 'did:ethr:0xabcd...',
    degree: {
      type: 'BachelorDegree',
      name: '计算机科学学士'
    },
    university: '示例大学'
  },
  proof: {
    type: 'EcdsaSecp256k1Signature2019',
    created: '2024-01-06T12:00:00Z',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:ethr:0x1234...#controller',
    jws: 'eyJhbGciOiJFUzI1Nk...' // 签名
  }
}
```

### VC发行

```typescript
import { ethers } from 'ethers'
import { createVerifiableCredentialJwt } from 'did-jwt-vc'

class CredentialIssuer {
  private issuerDid: string
  private issuerWallet: ethers.Wallet

  constructor(did: string, privateKey: string) {
    this.issuerDid = did
    this.issuerWallet = new ethers.Wallet(privateKey)
  }

  async issueCredential(
    subjectDid: string,
    claims: object,
    expiresIn: string = '1y'
  ): Promise<string> {
    const vc: VerifiableCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: this.issuerDid,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + this.parseExpiration(expiresIn)).toISOString(),
      credentialSubject: {
        id: subjectDid,
        ...claims
      }
    }

    // 创建签名
    const signer = this.issuerWallet.signMessage.bind(this.issuerWallet)

    // 生成JWT格式的VC
    const vcJwt = await createVerifiableCredentialJwt(
      vc,
      { issuer: this.issuerDid, signer }
    )

    return vcJwt
  }

  parseExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([dhmy])$/)
    if (!match) throw new Error('Invalid expiration format')

    const value = parseInt(match[1])
    const unit = match[2]

    const multipliers = {
      'd': 86400000,
      'h': 3600000,
      'm': 60000,
      'y': 31536000000
    }

    return value * multipliers[unit]
  }
}

// 使用示例
const issuer = new CredentialIssuer(
  'did:ethr:0x1234...',
  '0x私钥'
)

const vcJwt = await issuer.issueCredential(
  'did:ethr:0xabcd...',
  {
    degree: {
      type: 'BachelorDegree',
      name: '计算机科学学士'
    },
    university: '示例大学'
  },
  '1y'
)
```

### VC验证

```typescript
import { verifyCredential, verifyPresentation } from 'did-jwt-vc'
import { resolveDid } from '@identitybuilding/did-resolver'

class CredentialVerifier {
  private didResolver: any

  constructor() {
    this.didResolver = resolveDid
  }

  async verifyCredential(vcJwt: string): Promise<VerificationResult> {
    try {
      // 验证签名
      const verifiedVC = await verifyCredential(vcJwt, {
        resolver: this.didResolver
      })

      // 检查过期
      if (verifiedVC.expirationDate) {
        const expirationDate = new Date(verifiedVC.expirationDate)
        if (expirationDate < new Date()) {
          return {
            valid: false,
            reason: 'Credential has expired'
          }
        }
      }

      // 检查撤销状态
      const status = await this.checkRevocation(verifiedVC)
      if (!status.valid) {
        return {
          valid: false,
          reason: 'Credential has been revoked'
        }
      }

      return {
        valid: true,
        credential: verifiedVC
      }

    } catch (error) {
      return {
        valid: false,
        reason: error.message
      }
    }
  }

  async checkRevocation(vc: VerifiableCredential): Promise<{ valid: boolean }> {
    if (!vc.credentialStatus) {
      return { valid: true }
    }

    const { id, type } = vc.credentialStatus

    if (type === 'RevocationList2021') {
      // 检查比特映射
      const index = parseInt(id.split('#')[1])
      const revoked = await this.checkBitMap(index)

      return { valid: !revoked }
    }

    return { valid: true }
  }

  async checkBitMap(index: number): Promise<boolean> {
    // 从链上或IPFS获取撤销列表
    // ...
    return false
  }
}

// 使用示例
const verifier = new CredentialVerifier()
const result = await verifier.verifyCredential(vcJwt)

if (result.valid) {
  console.log('凭证有效', result.credential)
} else {
  console.log('凭证无效:', result.reason)
}
```

### VP（可验证表达）

```typescript
// Verifiable Presentation
interface VerifiablePresentation {
  '@context': string[] | string
  type: string[]
  id?: string
  verifiableCredential?: VerifiableCredential[]
  holder?: string
  proof?: Proof
}

// 创建VP
import { createVerifiablePresentationJwt } from 'did-jwt-vc'

class PresentationHolder {
  private holderDid: string
  private holderWallet: ethers.Wallet

  constructor(did: string, privateKey: string) {
    this.holderDid = did
    this.holderWallet = new ethers.Wallet(privateKey)
  }

  async createPresentation(
    vcs: string[],
    audience: string
  ): Promise<string> {
    const vp: VerifiablePresentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      holder: this.holderDid,
      verifiableCredential: vcs.map(vcJwt => {
        // 简化版，实际应该解析JWT
        return { '@context': '...', type: ['VerifiableCredential'], ... }
      })
    }

    const signer = this.holderWallet.signMessage.bind(this.holderWallet)

    const vpJwt = await createVerifiablePresentationJwt(
      vp,
      {
        audience,
        holder: this.holderDid,
        signer
      }
    )

    return vpJwt
  }
}

// 使用
const holder = new PresentationHolder(
  'did:ethr:0xabcd...',
  '0x用户私钥'
)

const vpJwt = await holder.createPresentation(
  [vcJwt],
  'did:ethr:0x9999...' // verifier的DID
)
```

## 链上身份协议

### Lens Protocol

```typescript
// Lens Profile NFT
interface LensProfile {
  handle: string          // @username
  imageURI: string        // 头像
  followModule: FollowModule
  followNFTURI: string
  dispatcher: Address
}

// 创建Lens Profile
import { providers, Contract, utils } from 'ethers'

class LensProfileManager {
  private lensHub: Contract
  private provider: providers.Provider

  constructor(rpcUrl: string) {
    this.provider = new providers.JsonRpcProvider(rpcUrl)
    this.lensHub = new Contract(
      '0xDb46d1Dc155634FfC7D94Fda11Bc2b0D29Ad869d', // LensHub on Polygon
      [
        'function createProfile(tuple(tuple(string handle,string imageURI) profile)) external',
        'function getDefaultProfile(address) view returns (uint256)',
        'function getProfile(uint256) view returns (tuple(...))'
      ],
      new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
    )
  }

  async createProfile(handle: string, imageURI: string): Promise<string> {
    const tx = await this.lensHub.createProfile({
      profile: {
        handle,
        imageURI
      }
    })

    const receipt = await tx.wait()
    console.log('Profile created:', receipt.transactionHash)

    return receipt.transactionHash
  }

  async getProfile(profileId: number): Promise<LensProfile> {
    const profile = await this.lensHub.getProfile(profileId)

    return {
      handle: profile.handle,
      imageURI: profile.imageURI,
      followModule: profile.followModule,
      followNFTURI: profile.followNFTURI,
      dispatcher: profile.dispatcher
    }
  }
}

// 使用
const lens = new LensProfileManager('https://polygon-rpc.com')
await lens.createProfile(
  'myusername',
  'ipfs://Qm...'
)
```

### ENS (Ethereum Name Service)

```typescript
import { providers, Contract } from 'ethers'

class ENSManager {
  private ensRegistry: Contract
  private resolverContract: Contract
  private provider: providers.Provider

  constructor(rpcUrl: string) {
    this.provider = new providers.JsonRpcProvider(rpcUrl)

    // ENS Registry
    this.ensRegistry = new Contract(
      '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      ['function owner(bytes32 node) view returns (address)'],
      this.provider
    )

    // Public Resolver
    this.resolverContract = new Contract(
      '0x4976fb03C32e5B8cfe2b6cCCb85c41a121551E2F',
      [
        'function addr(bytes32 node) view returns (address)',
        'function setText(bytes32 node, string key, string value)',
        'function text(bytes32 node, string key) view returns (string)'
      ],
      this.provider
    )
  }

  namehash(name: string): string {
    // ENS namehash算法
    const node = '0x0000000000000000000000000000000000000000000000000000000000000000'

    if (name === '') {
      return node
    }

    const labels = name.split('.')
    let hash = node

    for (let i = labels.length - 1; i >= 0; i--) {
      const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(labels[i]))
      hash = ethers.utils.keccak256(
        ethers.utils.concat([hash, labelHash])
      )
    }

    return hash
  }

  async getAddress(name: string): Promise<string> {
    const node = this.namehash(name)
    return await this.resolverContract.addr(node)
  }

  async setText(name: string, key: string, value: string, signer: ethers.Signer) {
    const node = this.namehash(name)
    const resolverWithSigner = this.resolverContract.connect(signer)

    const tx = await resolverWithSigner.setText(node, key, value)
    await tx.wait()
  }

  async getText(name: string, key: string): Promise<string> {
    const node = this.namehash(name)
    return await this.resolverContract.text(node, key)
  }
}

// 使用
const ens = new ENSManager('https://eth.llamarpc.com')

// 解析ENS域名
const address = await ens.getAddress('vitalik.eth')
// 0xab5801a7D398351b8bE11C439e05C5B3259aEbC4

// 设置和读取ENS记录
await ens.setText(
  'mydomain.eth',
  'com.twitter',
  '@myhandle',
  signer
)
```

### Soulbound Token (SBT)

```typescript
// SBT（灵魂绑定代币）是不可转移的NFT
import { ethers } from 'ethers'

// SBT合约ABI
const SBT_ABI = [
  'function issue(address to, uint256 tokenId, string uri) external',
  'function revoke(address from, uint256 tokenId) external',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
]

class SoulboundManager {
  private sbtContract: ethers.Contract

  constructor(contractAddress: string, privateKey: string) {
    const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com')
    const wallet = new ethers.Wallet(privateKey, provider)

    this.sbtContract = new ethers.Contract(
      contractAddress,
      SBT_ABI,
      wallet
    )
  }

  async issueSBT(
    recipient: string,
    tokenId: number,
    metadataURI: string
  ): Promise<string> {
    const tx = await this.sbtContract.issue(
      recipient,
      tokenId,
      metadataURI
    )

    const receipt = await tx.wait()
    return receipt.transactionHash
  }

  async getSBTsByAddress(address: string): Promise<number[]> {
    const balance = await this.sbtContract.balanceOf(address)
    const tokens = []

    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await this.sbtContract.tokenOfOwnerByIndex(address, i)
      tokens.push(tokenId.toNumber())
    }

    return tokens
  }

  async getSBTMetadata(tokenId: number): Promise<object> {
    const uri = await this.sbtContract.tokenURI(tokenId)

    // 从IPFS获取metadata
    const response = await fetch(uri)
    const metadata = await response.json()

    return metadata
  }
}

// 使用示例
const sbtManager = new SoulboundManager(
  '0x...', // SBT合约地址
  process.env.PRIVATE_KEY
)

// 发行SBT凭证
await sbtManager.issueSBT(
  '0x用户地址',
  1,
  'ipfs://Qm...' // metadata URI
)

// 查询用户的SBT
const tokens = await sbtManager.getSBTsByAddress('0x用户地址')
for (const tokenId of tokens) {
  const metadata = await sbtManager.getSBTMetadata(tokenId)
  console.log('SBT:', metadata)
  // {
  //   name: "大学学历凭证",
  //   description: "计算机科学学士学位",
  //   image: "ipfs://...",
  //   attributes: [
  //     { trait_type: "大学", value: "示例大学" },
  //     { trait_type: "专业", value: "计算机科学" },
  //     { trait_type: "学位", value: "学士" }
  //   ]
  // }
}
```

## 链上声誉系统

### 信任分数算法

```typescript
interface ReputationData {
  totalInteractions: number
  successfulInteractions: number
  averageRating: number
  stakingAmount: number
  accountAge: number
}

class ReputationCalculator {
  calculateScore(data: ReputationData): number {
    let score = 50 // 基础分

    // 交互成功率（+30分）
    if (data.totalInteractions > 0) {
      const successRate = data.successfulInteractions / data.totalInteractions
      score += successRate * 30
    }

    // 平均评分（+10分）
    score += (data.averageRating - 3) * 3.33 // 1-5分制

    // 质押金额（+5分）
    const stakingBonus = Math.log10(data.stakingAmount + 1) * 2
    score += Math.min(stakingBonus, 5)

    // 账号年龄（+5分）
    const ageInYears = data.accountAge / (365 * 24 * 60 * 60)
    score += Math.min(ageInYears * 2, 5)

    return Math.min(Math.max(score, 0), 100)
  }

  calculateTier(score: number): string {
    if (score >= 90) return '钻石级'
    if (score >= 75) return '黄金级'
    if (score >= 60) return '白银级'
    if (score >= 40) return '青铜级'
    return '新手级'
  }
}

// 链上声誉合约
import { ethers } from 'ethers'

class OnChainReputation {
  private contract: ethers.Contract

  constructor() {
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com')
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    this.contract = new ethers.Contract(
      '0x...', // 声誉合约地址
      [
        'function recordInteraction(address user, bool success, uint8 rating) external',
        'function getReputationScore(address user) view returns (uint256)',
        'function stakeTokens(uint256 amount) external',
        'function unstakeTokens(uint256 amount) external',
        'event ReputationUpdated(address indexed user, uint256 score)'
      ],
      wallet
    )
  }

  async recordInteraction(
    user: string,
    success: boolean,
    rating: number
  ): Promise<void> {
    const tx = await this.contract.recordInteraction(
      user,
      success,
      rating
    )

    await tx.wait()
    console.log('Interaction recorded')
  }

  async getReputationScore(user: string): Promise<number> {
    const score = await this.contract.getReputationScore(user)
    return score.toNumber()
  }

  async stakeTokens(amount: number): Promise<void> {
    const tx = await this.contract.stakeTokens(
      ethers.utils.parseEther(amount.toString())
    )

    await tx.wait()
    console.log('Tokens staked')
  }

  listenToReputationUpdates() {
    this.contract.on('ReputationUpdated', (user, score) => {
      console.log(`Reputation updated for ${user}: ${score}`)
    })
  }
}
```

## DID钱包实现

```typescript
import { ethers } from 'ethers'
import { hdkey } from 'ethereumjs-wallet'
import * as bip39 from 'bip39'

class DIDWallet {
  private mnemonic: string
  private hdNode: any
  private did: string
  private credentials: string[] = []

  constructor() {
    this.generate()
  }

  private generate() {
    // 生成助记词
    this.mnemonic = bip39.generateMnemonic()

    // 从助记词生成HD钱包
    const seed = bip39.mnemonicToSeedSync(this.mnemonic)
    this.hdNode = hdkey.fromMasterSeed(seed)

    // 派生第一个账户作为DID
    const path = "m/44'/60'/0'/0/0"
    const wallet = this.hdNode.derivePath(path).getWallet()

    const address = wallet.getAddressString()
    this.did = `did:ethr:${address}`
  }

  getDID(): string {
    return this.did
  }

  getAddress(): string {
    return this.did.split(':')[2]
  }

  async sign(message: string): Promise<string> {
    const path = "m/44'/60'/0'/0/0"
    const wallet = this.hdNode.derivePath(path).getWallet()

    const signature = await wallet.signMessage(message)
    return signature
  }

  async verify(message: string, signature: string): Promise<boolean> {
    const address = ethers.utils.verifyMessage(message, signature)
    return address.toLowerCase() === this.getAddress().toLowerCase()
  }

  addCredential(vcJwt: string) {
    this.credentials.push(vcJwt)
  }

  getCredentials(): string[] {
    return this.credentials
  }

  exportWallet(): string {
    return JSON.stringify({
      mnemonic: this.mnemonic,
      did: this.did,
      credentials: this.credentials
    })
  }

  importWallet(data: string) {
    const wallet = JSON.parse(data)

    this.mnemonic = wallet.mnemonic
    this.did = wallet.did
    this.credentials = wallet.credentials || []

    const seed = bip39.mnemonicToSeedSync(this.mnemonic)
    this.hdNode = hdkey.fromMasterSeed(seed)
  }
}

// React Hook
import { useState, useEffect } from 'react'

export function useDIDWallet() {
  const [wallet, setWallet] = useState<DIDWallet | null>(null)

  useEffect(() => {
    // 从localStorage加载钱包
    const savedWallet = localStorage.getItem('did-wallet')

    if (savedWallet) {
      const newWallet = new DIDWallet()
      newWallet.importWallet(savedWallet)
      setWallet(newWallet)
    } else {
      // 创建新钱包
      const newWallet = new DIDWallet()
      setWallet(newWallet)

      // 保存到localStorage
      localStorage.setItem('did-wallet', newWallet.exportWallet())
    }
  }, [])

  const backupWallet = () => {
    if (wallet) {
      const data = wallet.exportWallet()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `did-wallet-${Date.now()}.json`
      a.click()
    }
  }

  return { wallet, backupWallet }
}
```

## 完整DID应用

```typescript
import { useState } from 'react'
import { DIDWallet } from './did-wallet'
import { CredentialIssuer } from './credential-issuer'
import { CredentialVerifier } from './credential-verifier'

export default function DIDApp() {
  const [wallet] = useState(() => new DIDWallet())
  const [credentials, setCredentials] = useState<string[]>([])
  const [presentation, setPresentation] = useState<string>('')

  const issueCredential = async (claims: object) => {
    const issuer = new CredentialIssuer(
      wallet.getDID(),
      '0x...' // 发行方私钥
    )

    const vcJwt = await issuer.issueCredential(
      wallet.getDID(),
      claims
    )

    setCredentials([...credentials, vcJwt])
  }

  const createPresentation = async () => {
    const holder = new PresentationHolder(
      wallet.getDID(),
      '0x...' // 用户私钥
    )

    const vpJwt = await holder.createPresentation(
      credentials,
      'did:ethr:0x9999...' // verifier DID
    )

    setPresentation(vpJwt)
  }

  const verifyPresentation = async (vpJwt: string) => {
    const verifier = new CredentialVerifier()

    const result = await verifier.verifyPresentation(vpJwt)

    return result
  }

  return (
    <div>
      <h1>DID身份钱包</h1>
      <div>
        <h2>我的DID</h2>
        <p>{wallet.getDID()}</p>
      </div>

      <div>
        <h2>凭证</h2>
        {credentials.map((vc, index) => (
          <div key={index}>
            <pre>{vc}</pre>
          </div>
        ))}
      </div>

      <div>
        <h2>可验证表达</h2>
        <pre>{presentation}</pre>
      </div>

      <button onClick={() => issueCredential({ name: '张三' })}>
        发行凭证
      </button>

      <button onClick={createPresentation}>
        创建表达
      </button>
    </div>
  )
}
```

## 总结

去中心化身份（DID）是WEB3的重要基础设施，通过W3C标准化、区块链技术和密码学，为用户提供了真正自主可控的身份系统。

从DID文档、可验证凭证到链上声誉，完整的DID生态系统正在快速构建。随着技术的成熟和应用场景的丰富，DID将成为未来数字社会的身份基础设施。

## 参考资料

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [Lens Protocol](https://lens.xyz/)
- [Ethereum Name Service](https://ens.domains/)
- [DIF (Decentralized Identity Foundation)](https://identity.foundation/)
