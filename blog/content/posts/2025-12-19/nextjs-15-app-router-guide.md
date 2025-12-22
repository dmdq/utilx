---
title: "Next.js 15 App Router完全指南"
slug: "nextjs-15-app-router-guide"
date: "2025-12-19T13:00:00+08:00"
author: "技术团队"
draft: false
description: "深入探索Next.js 15的App Router架构，了解服务器组件、客户端组件、路由模式和性能优化策略。"
keywords: ["Next.js 15", "App Router", "React Server Components", "全栈框架", "性能优化"]
summary: "掌握Next.js 15 App Router的核心概念，构建高性能的全栈应用。"
categories: ["前端开发"]
tags: ["Next.js", "React", "全栈开发", "App Router", "性能优化"]
lastmod: "2025-12-19T13:00:00+08:00"
reading_time: true
toc: true
featured: true
---

## Next.js 15 App Router完全指南

Next.js 15带来了革命性的App Router架构，基于React Server Components构建，为全栈开发提供了更强大、更灵活的解决方案。本文将深入探讨App Router的核心概念和最佳实践。

### App Router基础

#### 目录结构

```
app/
├── layout.tsx          # 根布局
├── page.tsx           # 首页
├── loading.tsx        # 加载UI
├── error.tsx          # 错误边界
├── not-found.tsx      # 404页面
├── globals.css        # 全局样式
├── layout.module.css  # 布局模块样式
├── blog/
│   ├── layout.tsx     # 博客布局
│   ├── page.tsx       # 博客列表
│   └── [slug]/
│       ├── page.tsx   # 博客详情
│       └── loading.tsx
└── api/
    └── posts/
        └── route.ts   # API路由
```

#### 根布局配置

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'My Next.js App',
    template: '%s | My Next.js App'
  },
  description: 'Built with Next.js 15',
  metadataBase: new URL('https://example.com'),
  openGraph: {
    title: 'My Next.js App',
    description: 'Built with Next.js 15',
    url: 'https://example.com',
    siteName: 'My Next.js App',
    images: ['/og-image.jpg'],
    locale: 'en_US',
    type: 'website'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav>
          {/* 导航栏 */}
        </nav>
        <main>
          {children}
        </main>
        <footer>
          {/* 页脚 */}
        </footer>
      </body>
    </html>
  )
}
```

### 服务器组件 vs 客户端组件

#### 服务器组件（默认）

```typescript
// app/page.tsx - 服务器组件
import { db } from '@/lib/db'
import { PostCard } from '@/components/PostCard'

async function getPosts() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  return posts
}

export default async function HomePage() {
  const posts = await getPosts()

  return (
    <div className="container">
      <h1>最新文章</h1>
      <div className="grid">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

// 动态路由 - 服务器组件
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: [post.coverImage]
    }
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  return (
    <article className="prose">
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

#### 客户端组件

```typescript
// components/InteractiveMap.tsx - 客户端组件
'use client'

import { useState, useEffect } from 'react'

interface MapProps {
  center: [number, number]
  zoom: number
}

export function InteractiveMap({ center, zoom }: MapProps) {
  const [map, setMap] = useState<any>(null)

  useEffect(() => {
    // 初始化地图
    import('leaflet').then((L) => {
      const mapInstance = L.map('map').setView(center, zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance)
      setMap(mapInstance)
    })

    return () => {
      map?.remove()
    }
  }, [])

  return <div id="map" style={{ height: '400px' }} />
}
```

### 数据获取

#### 服务器端数据获取

```typescript
// app/api/posts/route.ts - API路由
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const posts = await db.post.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const post = await db.post.create({
      data: body
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
```

#### 客户端数据获取

```typescript
// hooks/usePosts.ts - 自定义Hook
'use client'

import { useState, useEffect } from 'react'

interface Post {
  id: string
  title: string
  excerpt: string
  createdAt: string
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const response = await fetch('/api/posts')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setPosts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { posts, loading, error, refetch: fetchPosts }
}
```

### 路由和导航

#### 编程式导航

```typescript
// components/PostLink.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PostLinkProps {
  slug: string
  title: string
}

export function PostLink({ slug, title }: PostLinkProps) {
  const router = useRouter()

  const handleClick = () => {
    // 使用程序化导航
    router.push(`/blog/${slug}`)
  }

  return (
    <div>
      <Link href={`/blog/${slug}`} className="text-blue-500 hover:underline">
        {title}
      </Link>
      <button onClick={handleClick} className="ml-2 px-2 py-1 bg-gray-200 rounded">
        阅读
      </button>
    </div>
  )
}
```

#### 动态路由和捕获所有路由

```typescript
// app/blog/[...slug]/page.tsx - 捕获所有路由
export default function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const slugPath = params.slug.join('/')

  return (
    <div>
      <h1>捕获所有路由</h1>
      <p>路径: /blog/{slugPath}</p>
    </div>
  )
}

// app/shop/[...slug]/page.tsx - 可选捕获所有路由
export default function OptionalCatchAllPage({
  params
}: {
  params: { slug?: string[] }
}) {
  if (!params.slug) {
    return <h1>商店首页</h1>
  }

  return (
    <div>
      <h1>商品页面</h1>
      <p>路径: /shop/{params.slug.join('/')}</p>
    </div>
  )
}
```

### 缓存和重新验证

#### 数据缓存

```typescript
// lib/cache.ts
import { cache } from 'react'

// 缓存数据获取函数
export const getCachedPosts = cache(async () => {
  const response = await fetch('https://api.example.com/posts', {
    next: {
      tags: ['posts'],  // 标签用于重新验证
      revalidate: 3600 // 1小时重新验证
    }
  })
  return response.json()
})

// app/posts/page.tsx
export default async function PostsPage() {
  // 使用缓存数据
  const posts = await getCachedPosts()

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}

// 重新验证API
export async function POST() {
  // 重新验证标记为 'posts' 的缓存
  revalidateTag('posts')
  return NextResponse.json({ revalidated: true })
}
```

### 错误处理和加载状态

#### 错误边界

```typescript
// app/error.tsx - 全局错误边界
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="error-container">
      <h2>出错了！</h2>
      <p>很抱歉，页面加载时出现错误。</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}

// app/blog/error.tsx - 特定路由错误边界
export default function BlogError({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="blog-error">
      <h2>博客加载失败</h2>
      <p>无法加载博客内容。</p>
      <button onClick={() => reset()}>重新加载</button>
    </div>
  )
}
```

#### 加载UI

```typescript
// app/posts/loading.tsx
export default function PostsLoading() {
  return (
    <div className="loading-container">
      <h1>加载中...</h1>
      <div className="skeleton-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-title"></div>
            <div className="skeleton-excerpt"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 性能优化

#### 代码分割

```typescript
// components/HeavyComponent.tsx
import dynamic from 'next/dynamic'

// 动态导入重型组件
const HeavyChart = dynamic(
  () => import('@/components/Chart').then(mod => mod.Chart),
  {
    loading: () => <p>图表加载中...</p>,
    ssr: false // 仅客户端渲染
  }
)

// 使用组件
export function Dashboard() {
  return (
    <div>
      <h1>仪表板</h1>
      <HeavyChart data={chartData} />
    </div>
  )
}
```

#### 图片优化

```typescript
// app/page.tsx
import Image from 'next/image'

export default function HomePage() {
  return (
    <div>
      {/* 优化的图片 */}
      <Image
        src="/hero-image.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority // 高优先级加载
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..."
      />

      {/* 响应式图片 */}
      <Image
        src="/responsive-image.jpg"
        alt="Responsive"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        style={{ objectFit: 'cover' }}
      />
    </div>
  )
}
```

### 中间件

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 身份验证检查
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 地理位置重定向
  const country = request.geo?.country
  if (country === 'CN' && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/cn', request.url))
  }

  // 添加自定义头部
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'custom-value')

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
```

### 实战案例

#### 电商应用

```typescript
// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getProduct, getRelatedProducts } from '@/lib/products'
import { ProductDetails } from '@/components/ProductDetails'
import { RelatedProducts } from '@/components/RelatedProducts'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)

  if (!product) {
    return {
      title: '产品未找到'
    }
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.images[0]]
    }
  }
}

export default async function ProductPage({
  params
}: {
  params: { slug: string }
}) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id)

  return (
    <div className="product-page">
      <ProductDetails product={product} />
      <RelatedProducts products={relatedProducts} />
    </div>
  )
}

// 生成静态路径
export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({
    slug: product.slug
  }))
}
```

### 最佳实践

1. **合理使用服务器组件**：仅在需要时使用客户端组件
2. **优化数据获取**：使用缓存和重新验证策略
3. **代码分割**：动态导入大型组件
4. **错误处理**：实现完善的错误边界
5. **性能监控**：使用Next.js Analytics

### 总结

Next.js 15 App Router提供了：

- **服务器组件**：更好的性能和SEO
- **灵活的路由**：支持动态和嵌套路由
- **强大的缓存**：智能的数据缓存策略
- **TypeScript支持**：完善的类型安全
- **性能优化**：自动代码分割和优化

这些特性使Next.js 15成为构建现代全栈应用的理想选择。

### 相关资源

- [Next.js 15官方文档](https://nextjs.org/docs)
- [App Router文档](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)