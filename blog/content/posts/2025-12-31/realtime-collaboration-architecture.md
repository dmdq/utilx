---
title: "构建实时协作系统：从OT到CRDT的深度解析"
description: "深入探讨实时协作系统的核心技术，包括冲突解决算法(CRDT/OT)、实时同步架构、离线优先设计等。"
author: "有条工具团队"
date: 2025-12-31T15:00:00+08:00
categories:
  - 实时协作
  - 分布式系统
tags:
  - CRDT
  - OT
  - 实时同步
  - WebRTC
keywords:
  - 实时协作
  - CRDT算法
  - OT算法
  - Yjs
  - 离线优先
series:
  - 分布式系统实践
draft: false
---

## 引言

实时协作系统已成为现代应用的标配。从Google Docs到Figma，实时协作技术正在重塑用户交互方式。

## 一、冲突解决算法

### 1.1 CRDT实现

```javascript
// LWW-Register (Last-Write-Wins Register)

class LWWRegister {
  constructor() {
    this.value = null;
    this.timestamp = 0;
  }

  set(value, timestamp = Date.now()) {
    if (timestamp >= this.timestamp) {
      this.value = value;
      this.timestamp = timestamp;
    }
    return this.value;
  }

  get() {
    return this.value;
  }

  merge(other) {
    if (other.timestamp > this.timestamp) {
      this.value = other.value;
      this.timestamp = other.timestamp;
    }
  }
}

// LWW-Element-Set (支持添加和删除)
class LWWElementSet {
  constructor() {
    this.addSet = new Map();  // 添加集合
    this.removeSet = new Map();  // 删除集合
  }

  add(element, timestamp = Date.now()) {
    this.addSet.set(element, timestamp);
  }

  remove(element, timestamp = Date.now()) {
    this.removeSet.set(element, timestamp);
  }

  get() {
    const elements = new Set();

    for (const [element, addedAt] of this.addSet) {
      const removedAt = this.removeSet.get(element);

      if (!removedAt || addedAt > removedAt) {
        elements.add(element);
      }
    }

    return Array.from(elements);
  }

  merge(other) {
    // 合并添加集合
    for (const [element, timestamp] of other.addSet) {
      const current = this.addSet.get(element);
      if (!current || timestamp > current) {
        this.addSet.set(element, timestamp);
      }
    }

    // 合并删除集合
    for (const [element, timestamp] of other.removeSet) {
      const current = this.removeSet.get(element);
      if (!current || timestamp > current) {
        this.removeSet.set(element, timestamp);
      }
    }
  }
}
```

### 1.2 Yjs实战

```javascript
// 使用Yjs构建协作应用

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

class CollaborativeDocument {
  constructor() {
    // Y.Doc文档
    this.doc = new Y.Doc();

    // 获取文本类型
    this.text = this.doc.getText('content');

    // WebSocket提供者（实时同步）
    this.wsProvider = new WebsocketProvider(
      'ws://localhost:1234',
      'room-1',
      this.doc
    );

    // IndexedDB持久化（离线存储）
    this.idbProvider = new IndexeddbPersistence(
      'room-1',
      this.doc
    );
  }

  async init() {
    // 等待WebSocket连接
    this.wsProvider.on('sync', (status) => {
      console.log('Sync status:', status);
    });

    // 等待IndexedDB加载
    await this.idbProvider.whenSynced;

    // 监听变化
    this.doc.on('update', (update) => {
      this.handleUpdate(update);
    });
  }

  insert(position, text) {
    this.text.insert(position, text);
  }

  delete(position, length) {
    this.text.delete(position, length);
  }

  get content() {
    return this.text.toString();
  }

  handleUpdate(update) {
    // 处理文档更新
    Y.encodeStateAsUpdate(this.doc);
  }

  // 断开连接
  disconnect() {
    this.wsProvider.disconnect();
  }
}
```

## 二、实时同步架构

```javascript
// WebSocket实时同步

class RealtimeSyncEngine {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.messageQueue = [];
    this.isConnected = false;

    this.ws.onopen = () => {
      this.isConnected = true;
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.reconnect();
    };
  }

  send(message) {
    if (this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      this.ws.send(JSON.stringify(this.messageQueue.shift()));
    }
  }

  reconnect() {
    setTimeout(() => {
      this.ws = new WebSocket(this.ws.url);
    }, 1000);
  }
}
```

## 三、离线优先设计

```javascript
// 离线优先同步

class OfflineFirstSync {
  constructor() {
    this.localDB = new LocalDatabase();
    this.remoteAPI = new RemoteAPI();
  }

  async write(data) {
    // 1. 写入本地
    const writeTime = Date.now();
    await this.localDB.write({
      data,
      writeTime,
      synced: false
    });

    // 2. 尝试同步到服务器
    try {
      await this.syncToServer(data);
      await this.localDB.markSynced(writeTime);
    } catch (error) {
      // 网络失败，标记为待同步
      console.log('Sync failed, will retry later');
    }
  }

  async syncPendingChanges() {
    const pending = await this.localDB.getPending();

    for (const change of pending) {
      try {
        await this.syncToServer(change.data);
        await this.localDB.markSynced(change.writeTime);
      } catch (error) {
        // 继续处理下一个
        continue;
      }
    }
  }
}
```

## 总结

实时协作系统核心：
1. CRDT数据结构
2. WebSocket实时通信
3. 离线优先设计
4. 冲突自动解决

> **相关工具推荐**
> - [JSON格式化](https://www.util.cn/tools/json-formatter/) - 数据处理
