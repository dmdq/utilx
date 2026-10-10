---
title: "TypeScript类型体操进阶：掌握高级类型系统"
slug: "typescript-advanced"
date: 2026-01-04T14:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨TypeScript高级类型系统，包括条件类型、映射类型、模板字面量类型等高级特性，助你写出类型安全的代码"
tags: ["TypeScript", "类型系统", "前端技术", "JavaScript"]
categories: ["前端技术", "TypeScript"]
---

## TypeScript类型系统进阶

TypeScript的类型系统非常强大，掌握高级类型特性可以帮助我们写出更安全、更优雅的代码。

## 条件类型

### 基础条件类型

```typescript
// 类似三元表达式
type IsString<T> = T extends string ? true : false

type Test1 = IsString<string>  // true
type Test2 = IsString<number>  // false

// 嵌套条件类型
type NonNullable<T> = T extends null | undefined ? never : T

type Test3 = NonNullable<string | null>  // string
```

### 分布式条件类型

```typescript
// 联合类型会分布式应用条件类型
type ToArray<T> = T extends any ? T[] : never

type Test4 = ToArray<string | number>  // string[] | number[]

// 阻止分布
type ToArrayNonDistributive<T> = [T] extends [any] ? T[] : never

type Test5 = ToArrayNonDistributive<string | number>  // (string | number)[]
```

### 类型推断

```typescript
// Infer关键字
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type Fn = (x: number) => string
type Test6 = ReturnType<Fn>  // string

// 解包Promise
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

type Test7 = UnwrapPromise<Promise<string>>  // string
```

## 映射类型

### 基础映射类型

```typescript
// 将所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P]
}

// 将所有属性变为必需
type Required<T> = {
  [P in keyof T]-?: T[P]
}

// 只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
```

### 高级映射类型

```typescript
// 只保留特定类型
type OnlyStrings<T> = {
  [P in keyof T as T[P] extends string ? P : never]: T[P]
}

interface User {
  name: string
  age: number
  email: string
}

type Test8 = OnlyStrings<User>
// { name: string; email: string }

// 条件映射
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P]
}

type Test9 = Getters<{ name: string; age: number }>
// { getName: () => string; getAge: () => number }
```

## 模板字面量类型

### 基础用法

```typescript
type Greeting = `hello ${string}`

const test: Greeting = 'hello world'  // ✓
const test2: Greeting = 'hi world'    // ✗
```

### 高级应用

```typescript
// 事件名称类型
type EventName<T extends string> = `on${Capitalize<T>}`

type Test10 = EventName<'click'>  // 'onClick'

// 路径类型
type Path<T extends string> = `/${T}` | `${Path<T>}/${T}`

// 组合类型
type CssValue<T extends number> = `${T}px` | `${T}%` | `${t}em`
```

## 递归类型

### 深度只读

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

interface Config {
  database: {
    host: string
    port: number
  }
}

type Test11 = DeepReadonly<Config>
// 所有嵌套属性都变为只读
```

### 深度必需

```typescript
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}
```

## 品牌类型

```typescript
// 创建唯一类型
type Brand<T, B> = T & { __brand: B }

type USD = Brand<number, 'USD'>
type EUR = Brand<number, 'EUR'>

const usd: USD = 100 as USD
const eur: EUR = 100 as EUR

// 不能直接赋值
// eur = usd  // ✗ 类型错误

function addUSD(a: USD, b: USD): USD {
  return (a + b) as USD
}
```

## 函数类型高级应用

### 函数重载

```typescript
function process(input: string): string
function process(input: number): number
function process(input: string | number): string | number {
  return input
}

const result1 = process('hello')  // string
const result2 = process(123)      // number
```

### 参数类型推断

```typescript
// 元组转函数参数
type TupleToFn<T extends any[]> = T extends [...infer Args, infer R]
  ? (...args: Args) => R
  : never

type Test12 = TupleToFn<[string, number, boolean]>

// 反向推断
type FnToTuple<T extends (...args: any[]) => any> =
  T extends (...args: infer A) => any ? A : never
```

## 类型守卫

### typeof守卫

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function process(value: unknown) {
  if (isString(value)) {
    // 这里value的类型是string
    console.log(value.toUpperCase())
  }
}
```

### in守卫

```typescript
interface Cat {
  meow(): void
}

interface Dog {
  bark(): void
}

function makeSound(animal: Cat | Dog) {
  if ('meow' in animal) {
    animal.meow()
  } else {
    animal.bark()
  }
}
```

### instanceof守卫

```typescript
class Error1 extends Error {
  code = 'ERROR_1'
}

class Error2 extends Error {
  code = 'ERROR_2'
}

function handleError(error: Error) {
  if (error instanceof Error1) {
    console.log(error.code)
  }
}
```

## 高级工具类型

### OmitByType

```typescript
type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P]
}

interface Test {
  name: string
  age: number
  active: boolean
}

type Test13 = OmitByType<Test, boolean>
// { name: string; age: number }
```

### DeepPick

```typescript
type DeepPick<T, K extends string> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? { [P in Key]: DeepPick<T[P], Rest> }
    : never
  : K extends keyof T
    ? { [P in K]: T[K] }
    : never

interface User {
  profile: {
    name: string
    email: string
  }
  settings: {
    theme: string
  }
}

type Test14 = DeepPick<User, 'profile.name'>
// { profile: { name: string } }
```

## 实战案例

### 表单类型定义

```typescript
type FieldProps<T> = {
  value: T
  onChange: (value: T) => void
  error?: string
}

type FormFields<T> = {
  [K in keyof T]: FieldProps<T[K]>
}

interface LoginData {
  email: string
  password: string
  remember: boolean
}

type LoginForm = FormFields<LoginData>
```

### API响应类型

```typescript
type ApiResponse<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

type UserResponse = ApiResponse<User>
type ErrorResponse = ApiResponse<never, NetworkError>
```

## 最佳实践

1. **优先使用类型推导** - 让TypeScript自动推导类型
2. **避免使用any** - 使用unknown代替
3. **合理使用泛型** - 提高代码复用性
4. **类型守卫** - 缩小类型范围
5. **品牌类型** - 创建语义化类型

## 总结

TypeScript类型系统非常强大，掌握高级类型特性可以帮助我们构建更安全的代码。
