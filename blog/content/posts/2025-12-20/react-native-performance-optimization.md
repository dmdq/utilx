---
title: "React Native性能优化实战：打造60FPS流畅体验的终极指南"
slug: "react-native-performance-optimization"
date: 2025-12-20T14:00:00+08:00
draft: false
tags: ['React Native', '性能优化', '移动开发', 'APP优化', '60FPS']
categories: ['移动开发', '性能优化']
author: 'Util Tech Team'
summary: '深入React Native性能优化的核心技术，从原理到实践的完整解决方案。'
description: '本文全面介绍React Native应用的性能优化技巧，包括渲染优化、内存管理、启动速度、网络请求等关键环节。'
keywords: ['React Native', '性能优化', '移动应用', '60FPS', '内存优化', '渲染优化']
reading_time: true
toc: true
featured: false
---

## 引言

React Native作为跨平台移动开发的主流框架，性能优化一直是开发者关注的重点。一个流畅的应用需要保持60FPS的帧率，快速响应交互，并且有效管理内存资源。本文将从底层原理到实际应用，全面探讨React Native性能优化的各种技巧。

## React Native架构与性能原理

### 渲染流程解析

```javascript
// React Native渲染流程
/*
JavaScript Thread (JS Thread)
    ↓ (schedule work)
UI Thread (Main Thread)
    ↓ (create UI elements)
Native Modules
    ↓ (render to screen)
Display Hardware
*/

// 性能监控工具
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 60,
      jsBundleLoadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkLatency: 0
    };
    this.frameCount = 0;
    this.lastFrameTime = Date.now();
  }

  // 开始性能监控
  startMonitoring() {
    this.startFPSMonitoring();
    this.startMemoryMonitoring();
    this.startNetworkMonitoring();
  }

  // FPS监控
  startFPSMonitoring() {
    const measure = () => {
      const now = Date.now();
      const delta = now - this.lastFrameTime;

      if (delta >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTime = now;

        // 上报性能数据
        this.reportMetrics();
      }

      this.frameCount++;
      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  }

  // 内存使用监控
  startMemoryMonitoring() {
    if (Platform.OS === 'android') {
      const getMemoryInfo = () => {
        // Android内存监控
        return require('react-native').NativeModules.MemoryInfoModule.getMemoryInfo();
      };

      setInterval(async () => {
        try {
          const memoryInfo = await getMemoryInfo();
          this.metrics.memoryUsage = memoryInfo.usedMemory;
        } catch (error) {
          console.warn('Memory monitoring failed:', error);
        }
      }, 5000);
    } else {
      // iOS内存监控
      const getMemoryUsage = () => {
        return require('react-native').NativeModules.MemoryModule.getMemoryUsage();
      };

      setInterval(async () => {
        try {
          const memoryUsage = await getMemoryUsage();
          this.metrics.memoryUsage = memoryUsage.heapSize;
        } catch (error) {
          console.warn('Memory monitoring failed:', error);
        }
      }, 5000);
    }
  }

  // 网络延迟监控
  startNetworkMonitoring() {
    const originalFetch = global.fetch;

    global.fetch = async (...args) => {
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();

        this.metrics.networkLatency = endTime - startTime;
        return response;
      } catch (error) {
        const endTime = Date.now();
        this.metrics.networkLatency = endTime - startTime;
        throw error;
      }
    };
  }

  // 上报性能指标
  reportMetrics() {
    if (this.metrics.fps < 50) {
      console.warn('Low FPS detected:', this.metrics.fps);

      // 发送到监控系统
      this.sendToAnalytics('performance_warning', {
        fps: this.metrics.fps,
        memoryUsage: this.metrics.memoryUsage,
        timestamp: Date.now()
      });
    }
  }

  // 发送分析数据
  sendToAnalytics(event, data) {
    // 集成分析SDK
    // Analytics.track(event, data);
  }
}

// 使用示例
const performanceMonitor = new PerformanceMonitor();
performanceMonitor.startMonitoring();
```

## 渲染性能优化

### 组件优化策略

#### 使用React.memo避免不必要渲染

```javascript
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// 普通组件（每次父组件更新都会重新渲染）
const ListItem = (props) => {
  console.log('ListItem rendered');
  return (
    <TouchableOpacity style={styles.item} onPress={props.onPress}>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.subtitle}>{props.subtitle}</Text>
    </TouchableOpacity>
  );
};

// 优化后的组件（仅在props变化时重新渲染）
const OptimizedListItem = memo((props) => {
  console.log('OptimizedListItem rendered');

  // 使用useCallback优化回调函数
  const handlePress = React.useCallback(() => {
    props.onPress(props.id);
  }, [props.id, props.onPress]);

  return (
    <TouchableOpacity style={styles.item} onPress={handlePress}>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.subtitle}>{props.subtitle}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle
  );
});

// 复杂对象比较优化
const MemoizedComplexItem = memo(({ user, settings }) => {
  const lastUserRef = React.useRef(null);

  // 深度比较user对象
  if (lastUserRef.current?.id !== user.id ||
      lastUserRef.current?.name !== user.name ||
      lastUserRef.current?.avatar !== user.avatar) {
    lastUserRef.current = user;
    console.log('User data changed, re-rendering');
  }

  return (
    <View style={styles.complexItem}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
    </View>
  );
});
```

#### FlatList优化

```javascript
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { FlatList, View, Text, RefreshControl, ActivityIndicator } from 'react-native';

const OptimizedFlatList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  // 生成大量测试数据
  const generateData = useCallback((start, count) => {
    return Array.from({ length: count }, (_, index) => ({
      id: start + index,
      title: `Item ${start + index}`,
      subtitle: `Subtitle for item ${start + index}`,
      // 复杂对象用于测试渲染性能
      metadata: {
        created: new Date().toISOString(),
        tags: ['tag1', 'tag2', 'tag3'],
        score: Math.random() * 100
      }
    }));
  }, []);

  // 初始化数据
  React.useEffect(() => {
    setData(generateData(0, 1000));
  }, [generateData]);

  // 渲染项组件
  const renderItem = useCallback(({ item, index }) => {
    return (
      <MemoizedListItem
        item={item}
        index={index}
        onPress={handleItemPress}
      />
    );
  }, []);

  // 项的唯一键
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // 智能滚动性能优化
  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // 处理项目点击
  const handleItemPress = useCallback((id) => {
    console.log('Item pressed:', id);
  }, []);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(prevData => [...generateData(1000, 10), ...prevData]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [generateData]);

  // 加载更多
  const handleLoadMore = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      // 模拟加载更多
      await new Promise(resolve => setTimeout(resolve, 500));
      const newData = generateData(data.length, 20);
      setData(prevData => [...prevData, ...newData]);
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, data.length, generateData]);

  // 列表头部组件
  const ListHeaderComponent = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.headerText}>Optimized List ({data.length} items)</Text>
    </View>
  ), [data.length]);

  // 列表尾部组件
  const ListFooterComponent = useMemo(() => (
    loading ? (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    ) : null
  ), [loading]);

  // 空列表组件
  const ListEmptyComponent = useMemo(() => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No data available</Text>
    </View>
  ), []);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}

      // 性能优化属性
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}

      // 滚动优化
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}

      // 加载和刷新
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']}
          tintColor="#007AFF"
        />
      }

      // 组件配置
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}

      // 滚动到底部加载更多
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
    />
  );
};

// 优化的列表项组件
const MemoizedListItem = memo(({ item, index, onPress }) => {
  // 使用useMemo缓存计算结果
  const formattedTitle = useMemo(() => {
    return `${item.title} #${index + 1}`;
  }, [item.title, index]);

  const metadataInfo = useMemo(() => {
    const score = Math.round(item.metadata.score);
    const tags = item.metadata.tags.slice(0, 2).join(', ');
    return `Score: ${score} | Tags: ${tags}`;
  }, [item.metadata]);

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {formattedTitle}
        </Text>
        <Text style={styles.itemSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
        <Text style={styles.itemMetadata}>
          {metadataInfo}
        </Text>
      </View>
    </TouchableOpacity>
  );
});
```

### 动画性能优化

```javascript
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanGestureHandler,
  State
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';

// 使用原生驱动的高性能动画
const AnimatedCard = ({ title, content, onSwipe }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // 手势处理
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      // 判断滑动方向和距离
      if (Math.abs(translationX) > 100) {
        // 执行滑出动画
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: translationX > 0 ? 300 : -300,
            duration: 250,
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true
          })
        ]).start(() => {
          onSwipe(translationX > 0 ? 'right' : 'left');
        });
      } else {
        // 回弹动画
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        }).start();
      }
    }
  };

  // 进入动画
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        fromValue: 0.8,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }),
      Animated.timing(opacity, {
        toValue: 1,
        fromValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  // 按压动画
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 200,
      friction: 8
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX },
            { scale }
          ],
          opacity
        }
      ]}
    >
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={styles.cardContent}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handlePressIn}
          onResponderRelease={handlePressOut}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.content}>{content}</Text>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

// 复杂动画序列
const ComplexAnimation = () => {
  const animatedValues = useRef({
    scale: new Animated.Value(0),
    rotate: new Animated.Value(0),
    translateX: new Animated.Value(0),
    opacity: new Animated.Value(0)
  }).current;

  // 执行复杂动画序列
  const startComplexAnimation = () => {
    const sequence = [
      // 第一阶段：淡入和缩放
      Animated.parallel([
        Animated.timing(animatedValues.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.spring(animatedValues.scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true
        })
      ]),

      // 第二阶段：旋转和移动
      Animated.parallel([
        Animated.timing(animatedValues.rotate, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(animatedValues.translateX, {
          toValue: 100,
          duration: 500,
          useNativeDriver: true
        })
      ]),

      // 第三阶段：回弹
      Animated.spring(animatedValues.translateX, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true
      })
    ];

    Animated.sequence(sequence).start();
  };

  return (
    <Animated.View
      style={[
        styles.animatedBox,
        {
          transform: [
            { scale: animatedValues.scale },
            { rotate: animatedValues.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            }) },
            { translateX: animatedValues.translateX }
          ],
          opacity: animatedValues.opacity
        }
      ]}
    />
  );
};

// 列表项进入动画
const ListItemEnterAnimation = ({ children, index, delay }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }, delay * index);

    return () => clearTimeout(timer);
  }, [index, delay]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity
      }}
    >
      {children}
    </Animated.View>
  );
};
```

## 内存管理优化

### 图片内存优化

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { Image, View, Dimensions } from 'react-native';

// 图片缓存管理器
class ImageCacheManager {
  constructor(maxCacheSize = 100) {
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;
    this.accessOrder = [];
  }

  // 获取缓存的图片
  get(uri) {
    if (this.cache.has(uri)) {
      // 更新访问顺序
      this.updateAccessOrder(uri);
      return Promise.resolve(this.cache.get(uri));
    }

    // 加载并缓存图片
    return this.loadAndCache(uri);
  }

  // 加载并缓存图片
  async loadAndCache(uri) {
    try {
      // 预加载图片信息以获取尺寸
      const imageInfo = await this.getImageInfo(uri);

      // 根据屏幕尺寸调整图片大小
      const optimizedUri = this.optimizeImageUri(uri, imageInfo);

      // 加载优化后的图片
      const image = await this.loadImage(optimizedUri);

      // 添加到缓存
      this.addToCache(uri, image);

      return image;
    } catch (error) {
      console.error('Failed to load image:', uri, error);
      throw error;
    }
  }

  // 优化图片URI
  optimizeImageUri(originalUri, imageInfo) {
    const { width: screenWidth } = Dimensions.get('window');
    const { width: imageWidth, height: imageHeight } = imageInfo;

    // 如果图片宽度过大，添加尺寸参数
    if (imageWidth > screenWidth * 2) {
      const separator = originalUri.includes('?') ? '&' : '?';
      return `${originalUri}${separator}w=${screenWidth * 2}`;
    }

    return originalUri;
  }

  // 加载图片
  loadImage(uri) {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({ uri, width, height });
        },
        reject
      );
    });
  }

  // 获取图片信息
  getImageInfo(uri) {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        reject
      );
    });
  }

  // 添加到缓存
  addToCache(uri, image) {
    // 如果缓存已满，删除最久未使用的图片
    if (this.cache.size >= this.maxCacheSize) {
      const oldestUri = this.accessOrder.shift();
      this.cache.delete(oldestUri);
    }

    this.cache.set(uri, image);
    this.accessOrder.push(uri);
  }

  // 更新访问顺序
  updateAccessOrder(uri) {
    const index = this.accessOrder.indexOf(uri);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(uri);
  }

  // 清理缓存
  clearCache() {
    this.cache.clear();
    this.accessOrder = [];
  }

  // 获取缓存大小
  getCacheSize() {
    return this.cache.size;
  }
}

// 优化的图片组件
const OptimizedImage = ({
  source,
  style,
  placeholder,
  onLoad,
  onError,
  resizeMode = 'cover'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSource, setImageSource] = useState(placeholder || null);
  const cacheManager = React.useMemo(() => new ImageCacheManager(), []);

  useEffect(() => {
    const uri = typeof source === 'string' ? source : source.uri;

    if (!uri) return;

    // 从缓存获取图片
    cacheManager.get(uri)
      .then(cachedImage => {
        setImageSource(cachedImage);
        setImageLoaded(true);
        onLoad?.(cachedImage);
      })
      .catch(error => {
        console.error('Image load failed:', error);
        onError?.(error);
      });

    // 清理函数
    return () => {
      // 可以在这里添加清理逻辑
    };
  }, [source, onLoad, onError, cacheManager]);

  // 使用blurhash作为占位符
  const [blurhash] = useState('LGF5?xYk^6#M@-5c,1J5@[or[Q6.');

  return (
    <View style={style}>
      {!imageLoaded && placeholder && (
        <Image
          source={placeholder}
          style={[style, { position: 'absolute' }]}
          blurRadius={2}
        />
      )}

      <Image
        source={imageSource}
        style={[
          style,
          { opacity: imageLoaded ? 1 : 0 }
        ]}
        resizeMode={resizeMode}
        onLoad={() => setImageLoaded(true)}
      />
    </View>
  );
};

// 图片懒加载组件
const LazyImage = ({
  source,
  style,
  containerStyle,
  lazy = true,
  threshold = 100
}) => {
  const [isVisible, setIsVisible] = useState(!lazy);
  const [hasLoaded, setHasLoaded] = useState(false);
  const viewRef = React.useRef(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: `${threshold}px` }
    );

    if (viewRef.current) {
      observer.observe(viewRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, threshold]);

  return (
    <View ref={viewRef} style={containerStyle}>
      {isVisible && (
        <OptimizedImage
          source={source}
          style={style}
          onLoad={() => setHasLoaded(true)}
          placeholder={require('./assets/placeholder.png')}
        />
      )}
    </View>
  );
};
```

## 网络请求优化

### 请求缓存与批处理

```javascript
// 网络请求管理器
class NetworkManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.batchQueue = [];
    this.batchTimeout = null;
    this.batchDelay = 50; // 50ms批处理延迟
  }

  // 请求配置
  defaultConfig = {
    timeout: 10000,
    cache: true,
    cacheTime: 5 * 60 * 1000, // 5分钟
    retry: 3,
    retryDelay: 1000
  };

  // 发送请求
  async request(url, options = {}, config = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    const cacheKey = this.getCacheKey(url, options);

    // 检查缓存
    if (finalConfig.cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < finalConfig.cacheTime) {
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // 检查是否有相同请求正在进行
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // 创建请求Promise
    const requestPromise = this.executeRequest(url, options, finalConfig);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;

      // 缓存响应
      if (finalConfig.cache && response.ok) {
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }

      return response;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // 执行请求
  async executeRequest(url, options, config) {
    let lastError;

    for (let attempt = 0; attempt <= config.retry; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { ...response, data };
      } catch (error) {
        lastError = error;

        if (attempt < config.retry) {
          // 指数退避重试
          const delay = config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // 批量请求
  batchRequest(requests) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ requests, resolve, reject });

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    });
  }

  // 处理批量请求
  async processBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0);
    const allRequests = batch.flatMap(item => item.requests);

    try {
      const responses = await Promise.allSettled(
        allRequests.map(req => this.request(req.url, req.options, req.config))
      );

      // 按批次分组响应
      let responseIndex = 0;
      batch.forEach(({ requests, resolve }) => {
        const batchResponses = responses.slice(
          responseIndex,
          responseIndex + requests.length
        );
        responseIndex += requests.length;

        resolve(batchResponses);
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }

  // 并发控制请求
  async concurrentRequests(requests, maxConcurrent = 3) {
    const results = [];
    const executing = [];

    for (const [index, request] of requests.entries()) {
      const promise = this.request(request.url, request.options, request.config)
        .then(response => ({ index, response }))
        .catch(error => ({ index, error }));

      results.push(promise);
      executing.push(promise);

      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    return Promise.allSettled(results);
  }

  // 生成缓存键
  getCacheKey(url, options) {
    const optionsStr = JSON.stringify(options);
    return `${url}:${optionsStr}`;
  }

  // 清理缓存
  clearCache() {
    this.cache.clear();
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// GraphQL查询管理器
class GraphQLManager extends NetworkManager {
  constructor(endpoint) {
    super();
    this.endpoint = endpoint;
    this.queryCache = new Map();
  }

  // 执行GraphQL查询
  async query(query, variables = {}, options = {}) {
    const cacheKey = this.getGraphQLCacheKey(query, variables);

    // 检查查询缓存
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    const response = await this.request(this.endpoint, {
      method: 'POST',
      body: JSON.stringify({
        query,
        variables
      })
    }, options);

    // 缓存查询结果
    if (response.ok) {
      this.queryCache.set(cacheKey, response.data);
    }

    return response;
  }

  // 生成GraphQL缓存键
  getGraphQLCacheKey(query, variables) {
    const queryStr = typeof query === 'string' ? query : query.loc?.source.body || '';
    const variablesStr = JSON.stringify(variables);
    const hash = this.simpleHash(queryStr + variablesStr);
    return `gql_${hash}`;
  }

  // 简单哈希函数
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // 预取查询
  prefetch(query, variables, options) {
    // 不等待结果，异步预取
    this.query(query, variables, { ...options, cache: true });
  }
}

// 使用示例
const networkManager = new NetworkManager();
const graphqlManager = new GraphQLManager('https://api.example.com/graphql');

// API服务
const ApiService = {
  // 获取用户信息
  async getUser(userId) {
    return networkManager.request(
      `https://api.example.com/users/${userId}`,
      { method: 'GET' },
      { cache: true, cacheTime: 10 * 60 * 1000 }
    );
  },

  // 批量获取用户信息
  async getUsersBatch(userIds) {
    const requests = userIds.map(id => ({
      url: `https://api.example.com/users/${id}`,
      options: { method: 'GET' }
    }));

    const responses = await networkManager.concurrentRequests(requests, 5);

    return responses
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.data);
  },

  // GraphQL查询示例
  async getUserPosts(userId, limit = 10) {
    const query = `
      query GetUserPosts($userId: ID!, $limit: Int!) {
        user(id: $userId) {
          posts(first: $limit) {
            edges {
              node {
                id
                title
                content
                createdAt
              }
            }
          }
        }
      }
    `;

    return graphqlManager.query(query, { userId, limit });
  },

  // 预取用户数据
  prefetchUserData(userId) {
    networkManager.request(
      `https://api.example.com/users/${userId}/profile`,
      { method: 'GET' },
      { cache: true }
    );

    graphqlManager.prefetch(`
      query GetUserDetails($userId: ID!) {
        user(id: $userId) {
          friends {
            id
            name
            avatar
          }
          achievements {
            id
            title
            description
          }
        }
      }
    `, { userId });
  }
};
```

## 启动性能优化

### Bundle拆分与懒加载

```javascript
// 异步组件加载
const AsyncComponentLoader = ({ componentLoader, fallback }) => {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    componentLoader()
      .then(module => {
        setComponent(() => module.default);
      })
      .catch(error => {
        console.error('Component loading failed:', error);
      });
  }, [componentLoader]);

  if (!Component) {
    return fallback || <ActivityIndicator size="large" />;
  }

  return <Component />;
};

// 使用示例
const LazyUserProfile = () => (
  <AsyncComponentLoader
    componentLoader={() => import('./UserProfile')}
    fallback={<View><Text>Loading profile...</Text></View>}
  />
);

const LazySettings = () => (
  <AsyncComponentLoader
    componentLoader={() => import('./Settings')}
    fallback={<View><Text>Loading settings...</Text></View>}
  />
);

// 路由级别的代码分割
const createLazyRoute = (componentPath) => {
  return () => {
    const Component = React.lazy(() => import(componentPath));

    return (
      <React.Suspense fallback={<ActivityIndicator size="large" />}>
        <Component />
      </React.Suspense>
    );
  };
};

// 使用代码分割的路由配置
const routes = {
  Home: createLazyRoute('./screens/Home'),
  Profile: createLazyRoute('./screens/Profile'),
  Settings: createLazyRoute('./screens/Settings'),
  Chat: createLazyRoute('./screens/Chat')
};

// Metro配置优化 (metro.config.js)
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@screens': './src/screens',
      '@utils': './src/utils',
      '@assets': './src/assets'
    }
  },
  watchFolders: [
    './src'
  ],
  maxWorkers: 4,
  resetCache: true,

  // 启用压缩
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true
    }
  }
};

// Bundle分析工具
const BundleAnalyzer = {
  // 获取Bundle大小信息
  async getBundleInfo(platform = 'android') {
    const fs = require('fs');
    const path = require('path');

    const bundlePath = platform === 'android'
      ? 'android/app/build/generated/assets/react/release/index.android.bundle'
      : 'ios/YourApp/build/Build/Products/Release-iphoneos/YourApp.app/main.jsbundle';

    try {
      const stats = fs.statSync(bundlePath);
      return {
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        path: bundlePath
      };
    } catch (error) {
      console.error('Bundle file not found:', bundlePath);
      return null;
    }
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 分析Bundle内容
  async analyzeBundle() {
    const { execSync } = require('child_process');

    try {
      // 使用react-native-bundle-visualizer
      const result = execSync('npx react-native-bundle-visualizer', {
        encoding: 'utf8'
      });

      console.log('Bundle analysis completed');
      return result;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      return null;
    }
  }
};

// 预加载管理器
class PreloadManager {
  constructor() {
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  // 添加预加载任务
  addPreloadTask(task) {
    this.preloadQueue.push(task);

    if (!this.isPreloading) {
      this.startPreload();
    }
  }

  // 开始预加载
  async startPreload() {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift();

      try {
        await this.executePreloadTask(task);
      } catch (error) {
        console.error('Preload task failed:', error);
      }

      // 给UI线程一些时间
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isPreloading = false;
  }

  // 执行预加载任务
  async executePreloadTask(task) {
    switch (task.type) {
      case 'component':
        await import(task.componentPath);
        break;

      case 'image':
        await Image.prefetch(task.imageUrl);
        break;

      case 'data':
        await task.dataLoader();
        break;

      case 'asset':
        await this.preloadAsset(task.assetPath);
        break;

      default:
        console.warn('Unknown preload task type:', task.type);
    }
  }

  // 预加载资源
  async preloadAsset(assetPath) {
    // 实现资源预加载逻辑
    return new Promise(resolve => {
      setTimeout(resolve, 100); // 模拟预加载
    });
  }

  // 预加载常用组件
  preloadCommonComponents() {
    this.addPreloadTask({
      type: 'component',
      componentPath: './screens/Home'
    });

    this.addPreloadTask({
      type: 'component',
      componentPath: './screens/Profile'
    });
  }

  // 预加载关键图片
  preloadKeyImages() {
    const keyImages = [
      'https://example.com/logo.png',
      'https://example.com/hero-image.jpg',
      'https://example.com/background.jpg'
    ];

    keyImages.forEach(imageUrl => {
      this.addPreloadTask({
        type: 'image',
        imageUrl
      });
    });
  }

  // 预加载用户数据
  preloadUserData(userId) {
    this.addPreloadTask({
      type: 'data',
      dataLoader: () => ApiService.getUser(userId)
    });

    this.addPreloadTask({
      type: 'data',
      dataLoader: () => ApiService.getUserPosts(userId)
    });
  }
}

// 使用预加载管理器
const preloadManager = new PreloadManager();

// 在应用启动时预加载
AppRegistry.registerComponent('MyApp', () => {
  // 启动预加载
  preloadManager.preloadCommonComponents();
  preloadManager.preloadKeyImages();

  return App;
});
```

## 性能监控与分析

### 实时性能监控

```javascript
// 性能监控SDK
class PerformanceSDK {
  constructor(config) {
    this.config = {
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      enableCrashReporting: config.enableCrashReporting || true,
      enableANRReporting: config.enableANRReporting || true,
      enableNetworkMonitoring: config.enableNetworkMonitoring || true,
      enableMemoryLeakDetection: config.enableMemoryLeakDetection || true,
      sampleRate: config.sampleRate || 1.0
    };

    this.metrics = {
      fps: [],
      memory: [],
      network: [],
      crashes: [],
      anr: []
    };

    this.isInitialized = false;
  }

  // 初始化SDK
  async initialize() {
    if (this.isInitialized) return;

    try {
      // 设置全局错误处理
      if (this.config.enableCrashReporting) {
        this.setupCrashReporting();
      }

      // 设置ANR监控
      if (this.config.enableANRReporting) {
        this.setupANRMonitoring();
      }

      // 设置网络监控
      if (this.config.enableNetworkMonitoring) {
        this.setupNetworkMonitoring();
      }

      // 设置内存泄漏检测
      if (this.config.enableMemoryLeakDetection) {
        this.setupMemoryLeakDetection();
      }

      this.isInitialized = true;
      console.log('Performance SDK initialized');
    } catch (error) {
      console.error('Failed to initialize Performance SDK:', error);
    }
  }

  // 设置崩溃报告
  setupCrashReporting() {
    const defaultErrorHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // 记录崩溃信息
      const crashInfo = {
        message: error.message,
        stack: error.stack,
        isFatal,
        timestamp: Date.now(),
        deviceInfo: this.getDeviceInfo(),
        appState: this.getAppState()
      };

      this.metrics.crashes.push(crashInfo);

      // 上报崩溃
      this.reportCrash(crashInfo);

      // 调用原始错误处理器
      defaultErrorHandler(error, isFatal);
    });
  }

  // 设置ANR监控
  setupANRMonitoring() {
    let isChecking = false;

    const checkANR = () => {
      if (isChecking) return;

      isChecking = true;
      const startTime = Date.now();

      // 使用setTimeout检测阻塞
      setTimeout(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 如果执行时间超过2秒，认为是ANR
        if (duration > 2000) {
          const anrInfo = {
            duration,
            timestamp: Date.now(),
            stackTrace: this.getCurrentStackTrace(),
            deviceInfo: this.getDeviceInfo()
          };

          this.metrics.anr.push(anrInfo);
          this.reportANR(anrInfo);
        }

        isChecking = false;
      }, 100);
    };

    // 定期检查
    setInterval(checkANR, 1000);
  }

  // 设置网络监控
  setupNetworkMonitoring() {
    const originalFetch = global.fetch;

    global.fetch = async (...args) => {
      const startTime = Date.now();
      const [url, options] = args;

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();

        // 记录网络请求
        const networkMetric = {
          url,
          method: options?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          size: response.headers.get('content-length'),
          timestamp: endTime
        };

        this.metrics.network.push(networkMetric);
        this.reportNetworkMetric(networkMetric);

        return response;
      } catch (error) {
        const endTime = Date.now();

        // 记录网络错误
        const networkMetric = {
          url,
          method: options?.method || 'GET',
          error: error.message,
          duration: endTime - startTime,
          timestamp: endTime
        };

        this.metrics.network.push(networkMetric);
        this.reportNetworkMetric(networkMetric);

        throw error;
      }
    };
  }

  // 设置内存泄漏检测
  setupMemoryLeakDetection() {
    let lastMemoryUsage = 0;
    let leakCount = 0;

    setInterval(() => {
      const currentMemoryUsage = this.getMemoryUsage();

      if (lastMemoryUsage > 0) {
        const memoryIncrease = currentMemoryUsage - lastMemoryUsage;

        // 如果内存持续增长，可能存在内存泄漏
        if (memoryIncrease > 10 * 1024 * 1024) { // 10MB
          leakCount++;

          if (leakCount >= 3) {
            const leakInfo = {
              currentUsage: currentMemoryUsage,
              increase: memoryIncrease,
              leakCount,
              timestamp: Date.now()
            };

            this.reportMemoryLeak(leakInfo);
            leakCount = 0;
          }
        } else {
          leakCount = 0;
        }
      }

      lastMemoryUsage = currentMemoryUsage;
      this.metrics.memory.push({
        usage: currentMemoryUsage,
        timestamp: Date.now()
      });
    }, 30000); // 每30秒检查一次
  }

  // 记录自定义指标
  recordMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };

    // 根据指标类型分类
    if (name.startsWith('fps.')) {
      this.metrics.fps.push(metric);
    }

    this.reportCustomMetric(metric);
  }

  // 记录FPS
  recordFPS(fps) {
    this.recordMetric('fps.current', fps);

    if (fps < 30) {
      this.recordMetric('fps.low_fps', 1, { fps_range: '0-30' });
    } else if (fps < 45) {
      this.recordMetric('fps.low_fps', 1, { fps_range: '30-45' });
    }
  }

  // 记录屏幕性能
  recordScreenPerformance(screenName, metrics) {
    this.recordMetric(`screen.${screenName}.load_time`, metrics.loadTime);
    this.recordMetric(`screen.${screenName}.render_time`, metrics.renderTime);

    if (metrics.interactionTime) {
      this.recordMetric(`screen.${screenName}.interaction_time`, metrics.interactionTime);
    }
  }

  // 获取设备信息
  getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemVersion: DeviceInfo.getSystemVersion(),
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      bundleId: DeviceInfo.getBundleId(),
      isEmulator: DeviceInfo.isEmulatorSync()
    };
  }

  // 获取应用状态
  getAppState() {
    return {
      state: AppState.currentState,
      memoryUsage: this.getMemoryUsage(),
      storageUsage: this.getStorageUsage()
    };
  }

  // 获取内存使用情况
  getMemoryUsage() {
    if (Platform.OS === 'android') {
      return require('react-native').NativeModules.MemoryInfoModule.getMemoryUsage();
    } else {
      return require('react-native').NativeModules.MemoryModule.getMemoryUsage();
    }
  }

  // 获取存储使用情况
  getStorageUsage() {
    // 实现存储使用情况获取
    return {
      used: 0,
      total: 0
    };
  }

  // 获取当前堆栈跟踪
  getCurrentStackTrace() {
    // 实现堆栈跟踪获取
    return new Error().stack;
  }

  // 上报崩溃
  reportCrash(crashInfo) {
    this.sendToEndpoint('/crashes', crashInfo);
  }

  // 上报ANR
  reportANR(anrInfo) {
    this.sendToEndpoint('/anr', anrInfo);
  }

  // 上报网络指标
  reportNetworkMetric(networkMetric) {
    this.sendToEndpoint('/network', networkMetric);
  }

  // 上报内存泄漏
  reportMemoryLeak(leakInfo) {
    this.sendToEndpoint('/memory-leaks', leakInfo);
  }

  // 上报自定义指标
  reportCustomMetric(metric) {
    this.sendToEndpoint('/metrics', metric);
  }

  // 发送到端点
  async sendToEndpoint(path, data) {
    if (Math.random() > this.config.sampleRate) return;

    try {
      await fetch(`${this.config.endpoint}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({
          ...data,
          deviceInfo: this.getDeviceInfo(),
          sessionId: this.getSessionId()
        })
      });
    } catch (error) {
      console.error('Failed to report to endpoint:', error);
    }
  }

  // 获取会话ID
  getSessionId() {
    let sessionId = require('react-native').AsyncStorage.getItem('performance_session_id');

    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      require('react-native').AsyncStorage.setItem('performance_session_id', sessionId);
    }

    return sessionId;
  }

  // 生成性能报告
  generateReport() {
    const report = {
      timeRange: {
        start: Date.now() - 24 * 60 * 60 * 1000, // 24小时前
        end: Date.now()
      },
      summary: {
        totalCrashes: this.metrics.crashes.length,
        totalANR: this.metrics.anr.length,
        avgFPS: this.calculateAverageFPS(),
        avgMemoryUsage: this.calculateAverageMemory(),
        networkErrorRate: this.calculateNetworkErrorRate()
      },
      details: {
        crashes: this.metrics.crashes.slice(-10),
        anr: this.metrics.anr.slice(-10),
        networkErrors: this.metrics.network.filter(m => m.error).slice(-20)
      }
    };

    return report;
  }

  // 计算平均FPS
  calculateAverageFPS() {
    const recentFPS = this.metrics.fps.slice(-100);
    if (recentFPS.length === 0) return 60;

    const total = recentFPS.reduce((sum, metric) => sum + metric.value, 0);
    return Math.round(total / recentFPS.length);
  }

  // 计算平均内存使用
  calculateAverageMemory() {
    const recentMemory = this.metrics.memory.slice(-50);
    if (recentMemory.length === 0) return 0;

    const total = recentMemory.reduce((sum, metric) => sum + metric.usage, 0);
    return Math.round(total / recentMemory.length);
  }

  // 计算网络错误率
  calculateNetworkErrorRate() {
    const recentNetwork = this.metrics.network.slice(-100);
    if (recentNetwork.length === 0) return 0;

    const errors = recentNetwork.filter(m => m.error).length;
    return Math.round((errors / recentNetwork.length) * 100);
  }
}

// 使用示例
const performanceSDK = new PerformanceSDK({
  apiKey: 'your-api-key',
  endpoint: 'https://your-performance-endpoint.com/api/v1',
  sampleRate: 0.1 // 10%采样率
});

// 在应用启动时初始化
performanceSDK.initialize();

// 在组件中使用
const MyComponent = () => {
  useEffect(() => {
    // 记录屏幕性能
    const startTime = Date.now();

    // 模拟渲染时间
    setTimeout(() => {
      const renderTime = Date.now() - startTime;
      performanceSDK.recordScreenPerformance('MyComponent', {
        loadTime: startTime - performance.mark('component_start'),
        renderTime
      });
    }, 0);

    // 记录FPS
    const fpsInterval = setInterval(() => {
      performanceSDK.recordFPS(58); // 示例FPS值
    }, 1000);

    return () => {
      clearInterval(fpsInterval);
    };
  }, []);

  return <View>My Component</View>;
};
```

## 总结

React Native性能优化需要从多个维度入手：

**渲染优化：**
1. 使用React.memo和useCallback避免不必要渲染
2. 优化FlatList性能配置
3. 使用原生驱动的动画
4. 实现图片懒加载和缓存

**内存管理：**
1. 实现智能图片缓存
2. 避免内存泄漏
3. 合理使用组件卸载
4. 监控内存使用情况

**网络优化：**
1. 实现请求缓存和批处理
2. 控制并发请求数量
3. 使用GraphQL优化数据获取
4. 预加载关键数据

**启动优化：**
1. 实现代码分割和懒加载
2. 优化Bundle大小
3. 预加载关键资源
4. 异步加载非关键组件

**监控分析：**
1. 建立全面的性能监控体系
2. 实时追踪关键指标
3. 定期生成性能报告
4. 持续优化和改进

通过系统性的性能优化策略，可以将React Native应用的性能提升到接近原生应用的水平，为用户提供流畅的60FPS体验。

---

**相关资源：**
- [React Native官方性能指南](https://reactnative.dev/docs/performance)
- [Flipper调试工具](https://fbflipper.com/)
- [Reactotron](https://github.com/infinitered/reactotron)
- [Bundle分析工具](https://github.com/react-native-community/hermes-engine)