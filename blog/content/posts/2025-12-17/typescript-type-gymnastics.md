---
title: "TypeScript类型体操：从基础到高级的30个练习"
slug: "typescript-type-gymnastics"
date: 2025-12-17T11:00:00+08:00
draft: false
tags: ['TypeScript', '类型体操', '类型编程', '高级技巧']
categories: ['编程语言']
author: 'util.cn Team'
summary: '通过30个精心设计的TypeScript类型练习，掌握类型编程的精髓，提升类型推导和类型操作能力'
---

# TypeScript类型体操：从基础到高级的30个练习

TypeScript的类型系统是其最强大的特性之一。通过"类型体操"，我们可以利用类型系统来解决复杂的问题，甚至在编译阶段就发现潜在的错误。本文将通过30个由浅入深的练习，帮助你掌握TypeScript类型编程的精髓。

## 基础类型操作（1-10）

### 练习1：基础类型提取

```typescript
type MyType = string | number | boolean

// 提取string类型
type ExtractString<T> = T extends string ? T : never
type StringOnly = ExtractString<MyType> // string
```

### 练习2：类型排除

```typescript
type AllTypes = string | number | boolean | object | undefined | null

// 排除undefined和null
type NonNullable<T> = T extends null | undefined ? never : T
type DefinedTypes = NonNullable<AllTypes> // string | number | boolean | object
```

### 练习3：函数参数类型提取

```typescript
type MyFunction = (a: number, b: string) => boolean

// 提取函数参数类型
type GetParams<T> = T extends (...args: infer P) => any ? P : never
type Params = GetParams<MyFunction> // [number, string]
```

### 练习4：函数返回类型提取

```typescript
type GetUserFn = (id: number) => { name: string; age: number }

// 提取函数返回类型
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never
type UserType = GetReturnType<GetUserFn> // { name: string; age: number }
```

### 练习5：数组元素类型提取

```typescript
type StringArray = Array<string>
type NumberTuple = [number, number, number]

// 提取数组元素类型
type ArrayElement<T> = T extends (infer U)[] ? U : never
type TupleElement<T> = T extends [infer U] extends T ? U : never
type ArrayItem = ArrayElement<StringArray> // string
type TupleItem = TupleElement<NumberTuple> // number
```

### 练习6：首尾元素类型提取

```typescript
type Tuple = [string, number, boolean]

// 提取首元素
type First<T> = T extends [infer F, ...any[]] ? F : never
// 提取尾元素
type Last<T> = T extends [...any[], infer L] ? L : never

type FirstElement = First<Tuple> // string
type LastElement = Last<Tuple> // boolean
```

### 练习7：对象属性类型提取

```typescript
interface User {
  name: string
  age: number
  email: string
}

// 提取所有值的类型
type Values<T> = T[keyof T]
type UserValues = Values<User> // string | number
```

### 练习8：可选属性类型

```typescript
interface Config {
  required: string
  optional?: number
}

// 将所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P]
}
// 将所有属性变为必需
type Required<T> = {
  [P in keyof T]-?: T[P]
}
```

### 练习9：只读/可写属性

```typescript
type ReadOnly<T> = {
  readonly [P in keyof T]: T[P]
}

type WriteOnly<T> = {
  -readonly [P in keyof T]: T[P]
}
```

### 练习10：字符串字面量操作

```typescript
type Status = 'pending' | 'success' | 'failed'

// 转换为大写
type UpperCase<T> = T extends string ? Uppercase<T> : never
type UpperStatus = UpperCase<Status> // 'PENDING' | 'SUCCESS' | 'FAILED'
```

## 中级类型操作（11-20）

### 练习11：深度只读

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

interface NestedObject {
  user: {
    name: string
    details: {
      age: number
    }
  }
}

type ReadOnlyNested = DeepReadonly<NestedObject>
```

### 练习12：条件类型推断

```typescript
type IsString<T> = T extends string ? true : false
type TestString = IsString<"hello"> // true
type TestNumber = IsString<123> // false
```

### 练习13：元组转联合类型

```typescript
type Tuple = [string, number, boolean]

type TupleToUnion<T> = T extends (infer U)[] ? U : never
type Union = TupleToUnion<Tuple> // string | number | boolean
```

### 练习14：联合类型转元组

```typescript
type Union = string | number | boolean

type UnionToTuple<T, A extends readonly unknown[] = []> =
  T extends infer U ? [...A, U] : never
type Tuple = UnionToTuple<Union> // [string, number, boolean] 顺序可能不同
```

### 练习15：嵌套数组扁平化

```typescript
type Flatten<T> = T extends readonly (infer U)[] ? Flatten<U> : T

type DeepArray = [1, [2, [3, 4], 5], 6]
type FlatArray = Flatten<DeepArray> // 1 | 2 | 3 | 4 | 5 | 6
```

### 练习16：对象键名操作

```typescript
interface User {
  userName: string
  userAge: number
  userActive: boolean
}

// 移除前缀
type RemovePrefix<T, P extends string> =
  T extends `${P}${infer R}` ? R : T

type CleanKeys = RemovePrefix<keyof User, 'user'> // 'Name' | 'Age' | 'Active'
```

### 练习17：对象类型重映射

```typescript
type MapTypes<T, TFrom, TTo> = {
  [K in keyof T]: T[K] extends TFrom ? TTo : T[K]
}

interface Response {
  id: number
  data: string
  timestamp: number
}

type StringifiedResponse = MapTypes<Response, number | string, string>
```

### 练习18：函数类型组合

```typescript
type Fn1 = (a: number) => string
type Fn2 = (b: string) => boolean

// 函数组合
type Compose<T, U> = T extends (...args: any[]) => infer R
  ? U extends (arg: R) => infer S
  ? (...args: Parameters<T>) => S
  : never
type ComposedFn = Compose<Fn1, Fn2>
```

### 练习19：数字范围限制

```typescript
// 限制数字在某个范围内
type Range<N extends number, Min extends number, Max extends number> =
  N extends Min ? (N extends Max ? N : never) : never

type TestRange = Range<50, 10, 100> // 50
type TestOutOfRange = Range<5, 10, 100> // never
```

### 练习20：递归类型操作

```typescript
// 计算斐波那契数列
type Fibonacci<N extends number, A extends number = 0, B extends number = 1> =
  N extends 0 ? A : N extends 1 ? B : Fibonacci<N - 1, B, A + B>

type Fib5 = Fibonacci<5> // 5
type Fib10 = Fibonacci<10> // 55
```

## 高级类型操作（21-30）

### 练习21：类型级路由匹配

```typescript
type Route = '/users/:id' | '/posts/:postId/comments/:commentId'

type ExtractParams<T extends string> =
  T extends `${infer Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${infer Start}:${infer Param}`
    ? Param
    : never

type RouteParams = ExtractParams<Route> // 'id' | 'postId' | 'commentId'
```

### 练习22：JSON解析器

```typescript
type JsonString = string
type ParseJson<T extends JsonString> =
  T extends `{${infer Key}:${infer Value}` ?
    Key extends infer K ?
      Value extends infer V ?
        { [P in K]: ParseJson<V> }
      : never
    : never
  : T extends `[]` ? any[]
  : T extends `${infer Val}` ? Val
  : never
```

### 练习23：类型级计算器

```typescript
// 加法运算
type Add<A extends number, B extends number> =
  [...TupleOf<A>, ...TupleOf<B>]['length']

type TupleOf<T extends number, R extends readonly unknown[] = []> =
  R['length'] extends T ? R : TupleOf<T, [...R, unknown]>

type Result = Add<3, 5> // 8
```

### 练习24：类型验证器

```typescript
type ValidateEmail<T extends string> =
  T extends `${string}@${string}.${string}` ? true : false

type ValidEmail = ValidateEmail<"test@example.com"> // true
type InvalidEmail = ValidateEmail<"invalid"> // false
```

### 练习25：类型级SQL查询构建

```typescript
interface User {
  id: number
  name: string
  age: number
  email: string
}

type Select<T, K extends keyof T> = {
  [P in K]: T[P]
}

type UserSelect = Select<User, 'id' | 'name'>
// { id: number; name: number }
```

### 练习26：类型级CSS生成

```typescript
type CSSValue = string | number
type CSSProperty<T extends CSSValue> = {
  value: T
  unit: T extends number ? 'px' | 'em' | '%' : never
}

type CreateStyle<P extends Record<string, CSSValue>> = {
  [K in keyof P]: CSSProperty<P[K]>
}

type StyleProps = {
  width: 100
  height: 200
  color: 'red'
}

type StyleObject = CreateStyle<StyleProps>
```

### 练习27：类型级日期格式化

```typescript
type FormatDate<T extends string> =
  T extends `${infer Year}-${infer Month}-${infer Day}`
    ? `${Year}/${Month}/${Day}`
    : never

type FormattedDate = FormatDate<"2023-12-25"> // "2023/12/25"
```

### 练习28：类型级数组操作

```typescript
// 数组长度
type Length<T extends readonly unknown[]> = T['length']

// 数组去重
type Unique<T> = T extends readonly [infer First, ...infer Rest]
  ? First extends Rest[number]
    ? Unique<Rest>
    : [First, ...Unique<Rest>]
  : T

type LengthResult = Length<[1, 2, 3, 4, 5]> // 5
```

### 练习29：类型级状态机

```typescript
type State = 'idle' | 'loading' | 'success' | 'error'

type Transitions = {
  idle: 'loading'
  loading: 'success' | 'error'
  success: 'idle'
  error: 'idle'
}

type NextState<T extends State> = Transitions[T]

type FromLoading = NextState<'loading'> // 'success' | 'error'
```

### 练习30：类型级类型检查器

```typescript
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? true
    : false

type Test1 = IsEqual<string, string> // true
type Test2 = IsEqual<string, number> // false
```

## 实际应用场景

### 场景1：API响应类型验证

```typescript
interface ApiResponse<T, E> {
  data?: T
  error?: E
  status: 'success' | 'error'
}

type ValidateResponse<T, E> =
  ApiResponse<T, E> extends infer R
    ? R extends { status: 'success' }
      ? R['data'] extends T
        ? true
        : false
      : false
    : false

type IsValid = ValidateResponse<{ id: number }, string>
```

### 场景2：表单验证器

```typescript
interface FormRules {
  [field: string]: (value: any) => boolean | string
}

type ValidateForm<T> = {
  [K in keyof T]: T[K] extends (value: infer V) => infer R
    ? V extends R
      ? true
      : false
    : false
}
```

## 总结

TypeScript类型体操不仅仅是技术挑战，更是编程思维的锻炼。通过这些练习，你可以：

1. **深入理解类型系统**：掌握TypeScript类型系统的工作原理
2. **提升代码质量**：在编译阶段发现更多潜在错误
3. **编写更精确的API**：提供更好的类型提示和自动补全
4. **解决复杂问题**：用类型系统解决原本需要运行时检查的问题

记住，类型编程的目的是让代码更安全、更清晰。在追求类型技巧的同时，也要保持代码的可读性和可维护性。

---

**相关资源：**
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript类型体操挑战](https://github.com/type-challenges/type-challenges)
- [TypeScript进阶技巧](/typescript-advanced-techniques/)