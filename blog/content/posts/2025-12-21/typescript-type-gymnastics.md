---
title: "TypeScript类型体操：掌握高级泛型和类型操作技巧"
slug: "typescript-type-gymnastics"
date: 2025-12-21T14:00:00+08:00
draft: false
tags: ['TypeScript', '泛型', '类型编程', '高级类型', '前端开发']
categories: ['前端开发', '技术学习']
author: 'Util Tech Team'
summary: '深入TypeScript高级类型系统，掌握泛型编程和类型操作的精髓，写出类型安全的代码。'
description: '本文详细介绍TypeScript的高级类型特性，包括泛型、条件类型、映射类型等，通过实例展示类型编程的魅力。'
keywords: ['TypeScript', '泛型', '类型体操', '条件类型', '映射类型', '类型推导']
reading_time: true
toc: true
featured: false
---

## 引言

TypeScript的类型系统是其最强大的特性之一，它不仅仅能提供类型安全，还能像编程一样操作类型。通过泛型、条件类型、映射类型等高级特性，我们可以创建出既灵活又类型安全的代码。本文将带你深入TypeScript的类型世界，掌握这些高级技巧。

## 泛型基础

### 泛型函数

```typescript
// 基础泛型函数
function identity<T>(arg: T): T {
  return arg
}

// 使用
const num = identity(10)        // 类型是 number
const str = identity('hello')   // 类型是 string

// 泛型约束
function logLength<T extends { length: number }>(arg: T) {
  console.log(arg.length)
}

logLength('hello')      // OK
logLength([1, 2, 3])    // OK
// logLength(10)        // Error: number 没有 length 属性
```

### 泛型接口

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>
  save(entity: T): Promise<T>
  delete(id: string): Promise<void>
}

interface User {
  id: string
  name: string
  email: string
}

class UserRepository implements Repository<User> {
  async findById(id: string): Promise<User | null> {
    // 实现
    return null
  }

  async save(user: User): Promise<User> {
    // 实现
    return user
  }

  async delete(id: string): Promise<void> {
    // 实现
  }
}
```

### 泛型类

```typescript
class Box<T> {
  private content: T

  constructor(value: T) {
    this.content = value
  }

  getValue(): T {
    return this.content
  }

  setValue(value: T): void {
    this.content = value
  }
}

const numberBox = new Box(123)
const stringBox = new Box('hello')

// 泛型类继承
class NumberBox extends Box<number> {
  add(num: number): void {
    this.setValue(this.getValue() + num)
  }
}
```

## 高级泛型技巧

### 1. 多个泛型参数

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second]
}

function map<T, U>(array: T[], fn: (item: T) => U): U[] {
  return array.map(fn)
}

// 使用
const [a, b] = pair('hello', 123)
const lengths = map(['a', 'bb', 'ccc'], s => s.length)
```

### 2. 默认泛型参数

```typescript
interface ApiResponse<T = any> {
  data: T
  status: number
  message: string
}

interface UserResponse extends ApiResponse<User> {
  // 继承并指定具体类型
}

interface GenericResponse extends ApiResponse {
  // 使用默认类型 T = any
}
```

### 3. 泛型工厂函数

```typescript
function createRepository<T>(): Repository<T> {
  return new (class implements Repository<T> {
    async findById(id: string): Promise<T | null> {
      throw new Error('Not implemented')
    }

    async save(entity: T): Promise<T> {
      throw new Error('Not implemented')
    }

    async delete(id: string): Promise<void> {
      throw new Error('Not implemented')
    }
  })()
}

const userRepo = createRepository<User>()
```

## 条件类型

### 基础条件类型

```typescript
// 基础语法
type IsString<T> = T extends string ? true : false

type Test1 = IsString<string>  // true
type Test2 = IsString<number>  // false

// 实际应用
type NonNullable<T> = T extends null | undefined ? never : T

type Test3 = NonNullable<string | null>  // string
type Test4 = NonNullable<number>          // number
```

### 分布式条件类型

```typescript
// 联合类型会被分布处理
type ToArray<T> = T extends any ? T[] : never

type Test5 = ToArray<string | number>  // string[] | number[]

// 过滤联合类型
type FilterString<T> = T extends string ? T : never

type Test6 = FilterString<string | number | boolean>  // string
```

### 推断关键字 infer

```typescript
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

function getString(): string {
  return 'hello'
}

type Test7 = ReturnType<typeof getString>  // string

// 提取数组元素类型
type ElementOf<T> = T extends (infer E)[] ? E : never

type Test8 = ElementOf<string[]>  // string

// 提取Promise的值类型
type UnboxPromise<T> = T extends Promise<infer U> ? U : never

type Test9 = UnboxPromise<string>          // string
type Test10 = UnboxPromise<string> | number  // string | number
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

// 只读映射
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
```

### 自定义映射类型

```typescript
// 选择特定属性
type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// 排除特定属性
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// 将所有属性转换为另一种类型
type StringifyProperties<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : string
}

interface User {
  id: number
  name: string
  age: number
}

type Test11 = StringifyProperties<User>
// {
//   id: string
//   name: string
//   age: string
// }
```

### 条件映射

```typescript
// 根据类型条件进行不同的映射
type ConditionalMap<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends number
    ? number
    : never
}

// 添加或修改属性
type WithDefaults<T> = T & {
  id: string
  createdAt: Date
}

// 删除某些属性
type DeleteProperties<T, K extends keyof T> = Omit<T, K>
```

## 实用的高级类型

### 1. 深度只读

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P]
}

interface Nested {
  a: {
    b: {
      c: number
    }
  }
}

type Test12 = DeepReadonly<Nested>
// 所有嵌套属性都变为只读
```

### 2. 函数参数提取

```typescript
type FirstParameter<T> = T extends (arg1: infer U, ...args: any[]) => any
  ? U
  : never

type AllParameters<T> = T extends (...args: infer U) => any
  ? U
  : never

function example(a: number, b: string, c: boolean): void {}

type Test13 = FirstParameter<typeof example>  // number
type Test14 = AllParameters<typeof example>   // [number, string, boolean]
```

### 3. 联合类型转交叉类型

```typescript
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends
  (k: infer I) => void
    ? I
    : never

type Test15 = UnionToIntersection<{ a: string } | { b: number }>
// { a: string } & { b: number }
```

### 4. 获取对象值的类型

```typescript
type ValueOf<T> = T[keyof T]

interface Config {
  apiUrl: string
  timeout: number
  retries: number
}

type Test16 = ValueOf<Config>  // string | number
```

## 类型守卫和谓词

### 类型谓词

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function processValue(value: unknown) {
  if (isString(value)) {
    // 这里 value 的类型被收窄为 string
    console.log(value.toUpperCase())
  }
}

// 更复杂的类型谓词
function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj
  )
}
```

### 自定义类型守卫

```typescript
interface Cat {
  type: 'cat'
  meow(): void
}

interface Dog {
  type: 'dog'
  bark(): void
}

type Animal = Cat | Dog

function isCat(animal: Animal): animal is Cat {
  return animal.type === 'cat'
}

function handleAnimal(animal: Animal) {
  if (isCat(animal)) {
    animal.meow()  // TypeScript 知道这是 Cat
  } else {
    animal.bark()  // TypeScript 知道这是 Dog
  }
}
```

## 模板字面量类型

### 基础用法

```typescript
type EventName = `on${Capitalize<string>}`

type Test17 = EventName  // "onUppercase<string>" 不是我们想要的

// 实际应用
type ButtonEvent = `on${'click' | 'hover' | 'focus'}`

type Test18 = ButtonEvent  // "onclick" | "onhover" | "onfocus"
```

### 实用工具类型

```typescript
// 首字母大写
type Capitalize<T extends string> =
  T extends `${infer F}${infer R}`
    ? `${Uppercase<F>}${R}`
    : T

type Test19 = Capitalize<'hello'>  // "Hello"

// 驼峰命名转换
type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S

type Test20 = CamelCase<'hello_world_test'>  // "helloWorldTest"
```

## 实战应用

### 1. API类型生成

```typescript
// 基于端点生成类型
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface ApiEndpoint {
  method: ApiMethod
  path: string
  response: any
  request?: any
}

type EndpointTypes<T extends ApiEndpoint> = {
  [K in keyof T]: T[K] extends { method: infer M; path: infer P; response: infer R }
    ? M extends 'GET'
      ? (params?: Record<string, any>) => Promise<R>
      : (data: T[K]['request'], params?: Record<string, any>) => Promise<R>
    : never
}

// 使用示例
type Api = {
  getUser: ApiEndpoint & {
    method: 'GET'
    path: '/users/:id'
    response: User
  }
  createUser: ApiEndpoint & {
    method: 'POST'
    path: '/users'
    request: Omit<User, 'id'>
    response: User
  }
}

type ApiMethods = EndpointTypes<Api>
/*
{
  getUser: (params?: Record<string, any>) => Promise<User>
  createUser: (data: Omit<User, 'id'>, params?: Record<string, any>) => Promise<User>
}
*/
```

### 2. 状态管理类型

```typescript
// 状态机类型
type State = 'idle' | 'loading' | 'success' | 'error'

type StateActions<T> = {
  [K in keyof T]: (payload: T[K]) => void
}

type StateMachine<S extends State, A extends Record<string, any>> = {
  state: S
  dispatch: <K extends keyof A>(action: K, payload: A[K]) => void
}

// 使用示例
type UserState = StateMachine<
  'loading' | 'success' | 'error',
  {
    setUser: User
    setError: string
  }
>
```

### 3. 表单验证类型

```typescript
type ValidationRule<T> = {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => boolean | string
}

type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]: ValidationRule<T[K]>
}

type ValidationResult<T> = {
  [K in keyof T]?: string
}

// 使用示例
interface LoginForm {
  email: string
  password: string
}

const loginSchema: ValidationSchema<LoginForm> = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    required: true,
    minLength: 8
  }
}
```

## 性能考虑

### 避免过深的递归

```typescript
// ❌ 可能导致性能问题
type DeepNested<T> = T extends object
  ? { [K in keyof T]: DeepNested<T[K]> }
  : T

// ✅ 限制递归深度
type DeepNestedLimited<T, Depth extends number = 0> =
  Depth extends 5
    ? T
    : T extends object
      ? { [K in keyof T]: DeepNestedLimited<T[K], Depth | 0> }
      : T
```

### 使用类型别名优化

```typescript
// ❌ 重复计算复杂类型
type ComplexType<T> = Exclude<keyof T, 'id' | 'createdAt' | 'updatedAt'>

// ✅ 使用中间类型
type BaseModelKeys = 'id' | 'createdAt' | 'updatedAt'
type ComplexType<T> = Exclude<keyof T, BaseModelKeys>
```

## 总结

TypeScript的高级类型特性为我们提供了强大的工具：

**核心概念：**
1. 泛型：创建可复用的类型安全代码
2. 条件类型：基于类型的条件逻辑
3. 映射类型：转换现有类型
4. 类型守卫：运行时类型检查

**最佳实践：**
1. 合理使用泛型约束
2. 利用类型推导简化代码
3. 创建可复用的工具类型
4. 注意类型系统的性能限制

掌握这些高级类型技巧，将让你能够构建更安全、更灵活的TypeScript应用。

---

**相关资源：**
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript类型体操挑战](https://github.com/type-challenges/type-challenges)
- [TypeScript实用类型](https://www.typescriptlang.org/docs/handbook/utility-types.html)