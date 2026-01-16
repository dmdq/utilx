---
title: "低代码平台架构设计：从可视化到智能生成"
slug: "low-code-platform-architecture"
date: 2026-01-15T14:00:00+08:00
draft: false
tags: ['低代码', '可视化开发', '元驱动架构', 'AI辅助开发', '平台工程']
categories: ['架构设计']
author: '有条工具团队'
summary: '深入探讨低代码平台的架构设计，包括元数据驱动、组件体系、代码生成等核心技术'
---

## 前言

低代码平台已从简单的表单构建器演变为全栈应用开发平台。结合 AI 技术，现代低代码平台能够实现从自然语言描述到生产级应用的自动化生成。本文将深入探讨低代码平台的架构设计和核心实现。

## 元数据驱动架构

### 1. 应用元数据模型

```typescript
// 应用元数据定义
interface ApplicationMetadata {
  // 基础信息
  id: string;
  name: string;
  version: string;
  description: string;

  // 页面定义
  pages: PageMetadata[];

  // 数据模型
  dataModels: DataModel[];

  // API 集成
  apis: ApiDefinition[];

  // 权限配置
  permissions: PermissionConfig[];

  // 主题配置
  theme: ThemeConfig;

  // 全局配置
  config: AppConfig;
}

interface PageMetadata {
  id: string;
  name: string;
  route: string;
  layout: LayoutConfig;
  components: ComponentInstance[];
  events: EventHandler[];
  state: StateDefinition;
}

interface ComponentInstance {
  id: string;
  type: string; // 组件类型标识
  props: Record<string, PropValue>;
  styles: StyleDefinition;
  children?: ComponentInstance[];
  events: EventBinding[];
  conditions?: ConditionalRendering;
}

interface PropValue {
  type: 'static' | 'dynamic' | 'binding' | 'expression';
  value: unknown;
  binding?: DataBinding;
}

interface DataBinding {
  // 数据源类型
  source: 'state' | 'api' | 'store' | 'context';

  // 数据路径
  path: string;

  // 转换函数
  transform?: string;
}

// 事件处理器
interface EventHandler {
  id: string;
  name: string;
  actions: Action[];
}

interface Action {
  type: 'api' | 'navigation' | 'state' | 'custom' | 'workflow';
  config: Record<string, unknown>;
  next?: string; // 下一个动作 ID
}

// 工作流定义
interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowNode {
  id: string;
  type: 'start' | 'action' | 'condition' | 'loop' | 'end';
  config: Record<string, unknown>;
}

interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}
```

### 2. 元数据解析引擎

```typescript
// 元数据解析器
class MetadataParser {
  private componentRegistry: ComponentRegistry;
  private dataSourceManager: DataSourceManager;

  async parseApplication(metadata: ApplicationMetadata): Promise<Application> {
    // 1. 注册数据模型
    for (const model of metadata.dataModels) {
      this.dataSourceManager.registerModel(model);
    }

    // 2. 注册 API 定义
    for (const api of metadata.apis) {
      this.dataSourceManager.registerApi(api);
    }

    // 3. 构建页面
    const pages = await Promise.all(
      metadata.pages.map(page => this.parsePage(page))
    );

    // 4. 构建路由
    const router = this.buildRouter(pages);

    // 5. 配置权限
    const authManager = this.configureAuth(metadata.permissions);

    return new Application({
      metadata,
      pages,
      router,
      authManager,
    });
  }

  private async parsePage(metadata: PageMetadata): Promise<Page> {
    // 解析布局
    const layout = await this.parseLayout(metadata.layout);

    // 解析组件树
    const components = await this.parseComponents(metadata.components);

    // 解析状态
    const state = this.parseState(metadata.state);

    // 解析事件
    const events = this.parseEvents(metadata.events);

    return new Page({
      id: metadata.id,
      name: metadata.name,
      route: metadata.route,
      layout,
      components,
      state,
      events,
    });
  }

  private async parseComponents(
    instances: ComponentInstance[]
  ): Promise<ComponentTree> {
    const components: Component[] = [];

    for (const instance of instances) {
      const componentClass = this.componentRegistry.get(instance.type);

      // 解析属性
      const props = await this.resolveProps(instance.props);

      // 解析样式
      const styles = this.resolveStyles(instance.styles);

      // 递归解析子组件
      const children = instance.children
        ? await this.parseComponents(instance.children)
        : null;

      // 绑定事件
      const eventHandlers = this.bindEvents(instance.events);

      // 创建组件实例
      const component = await componentClass.create({
        props,
        styles,
        children,
        eventHandlers,
      });

      components.push(component);
    }

    return new ComponentTree(components);
  }

  private async resolveProps(props: Record<string, PropValue>): Promise<Record<string, unknown>> {
    const resolved: Record<string, unknown> = {};

    for (const [key, propValue] of Object.entries(props)) {
      switch (propValue.type) {
        case 'static':
          resolved[key] = propValue.value;
          break;

        case 'binding':
          resolved[key] = await this.resolveBinding(propValue.binding!);
          break;

        case 'expression':
          resolved[key] = await this.evaluateExpression(propValue.value as string);
          break;

        case 'dynamic':
          resolved[key] = await this.resolveDynamicValue(propValue.value);
          break;
      }
    }

    return resolved;
  }

  private async resolveBinding(binding: DataBinding): Promise<unknown> {
    switch (binding.source) {
      case 'state':
        return this.dataSourceManager.getStateValue(binding.path);

      case 'api':
        return this.dataSourceManager.callApi(binding.path);

      case 'store':
        return this.dataSourceManager.getStoreValue(binding.path);

      case 'context':
        return this.dataSourceManager.getContextValue(binding.path);
    }
  }

  private async evaluateExpression(expression: string): Promise<unknown> {
    // 安全的表达式求值
    const sandbox = this.createSandbox();
    return sandbox.evaluate(expression);
  }

  private createSandbox(): CodeSandbox {
    return new CodeSandbox({
      allowedGlobals: ['Math', 'Date', 'JSON', 'Array', 'Object'],
      context: {
        getState: (path: string) => this.dataSourceManager.getStateValue(path),
        setState: (path: string, value: unknown) =>
          this.dataSourceManager.setStateValue(path, value),
        callApi: (path: string, params?: unknown) =>
          this.dataSourceManager.callApi(path, params),
      },
    });
  }
}
```

## 组件体系设计

### 1. 组件协议

```typescript
// 组件基础协议
interface LowCodeComponent {
  // 组件元数据
  meta: ComponentMeta;

  // 渲染方法
  render(props: ComponentProps): JSX.Element;

  // 属性验证
  validateProps(props: unknown): ValidationResult;

  // 事件处理
  handleEvent(event: ComponentEvent): void;

  // 生命周期
  componentDidMount?(): void;
  componentWillUnmount?(): void;
}

interface ComponentMeta {
  // 组件类型
  type: string;

  // 显示名称
  displayName: string;

  // 分类
  category: 'layout' | 'basic' | 'form' | 'data' | 'advanced';

  // 图标
  icon: string;

  // 属性定义
  props: PropDefinition[];

  // 事件定义
  events: EventDefinition[];

  // 样式定义
  styles: StyleDefinition[];

  // 是否可包含子组件
  container: boolean;

  // 默认配置
  defaultProps: Record<string, unknown>;
}

interface PropDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  options?: unknown[]; // 枚举选项
}

// 组件注册表
class ComponentRegistry {
  private components = new Map<string, LowCodeComponent>();

  register(component: LowCodeComponent): void {
    this.components.set(component.meta.type, component);
  }

  get(type: string): LowCodeComponent {
    const component = this.components.get(type);
    if (!component) {
      throw new Error(`Component not found: ${type}`);
    }
    return component;
  }

  list(category?: string): LowCodeComponent[] {
    const all = Array.from(this.components.values());

    if (category) {
      return all.filter(c => c.meta.category === category);
    }

    return all;
  }
}
```

### 2. 基础组件实现

```typescript
// 表格组件
class TableComponent implements LowCodeComponent {
  meta: ComponentMeta = {
    type: 'table',
    displayName: '数据表格',
    category: 'data',
    icon: 'table',
    props: [
      {
        name: 'dataSource',
        type: 'array',
        required: true,
        description: '表格数据源',
      },
      {
        name: 'columns',
        type: 'array',
        required: true,
        description: '列配置',
      },
      {
        name: 'pagination',
        type: 'boolean',
        required: false,
        defaultValue: true,
        description: '是否分页',
      },
      {
        name: 'rowSelection',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: '是否支持行选择',
      },
    ],
    events: [
      { name: 'onRowClick', description: '行点击事件' },
      { name: 'onSelectionChange', description: '选择变化事件' },
    ],
    styles: [
      { name: 'border', type: 'boolean' },
      { name: 'size', type: 'enum', options: ['small', 'middle', 'large'] },
    ],
    container: false,
    defaultProps: {
      pagination: true,
      rowSelection: false,
    },
  };

  render(props: ComponentProps): JSX.Element {
    return (
      <div className={`lowcode-table ${props.className || ''}`}>
        <Table
          dataSource={props.dataSource}
          columns={props.columns}
          pagination={props.pagination}
          rowSelection={props.rowSelection}
          onRow={(record) => ({
            onClick: () => {
              this.handleEvent({
                type: 'onRowClick',
                payload: { record },
              });
            },
          })}
          onChange={(selection) => {
            this.handleEvent({
              type: 'onSelectionChange',
              payload: { selection },
            });
          }}
        />
      </div>
    );
  }

  validateProps(props: unknown): ValidationResult {
    const schema = {
      type: 'object',
      required: ['dataSource', 'columns'],
      properties: {
        dataSource: { type: 'array' },
        columns: { type: 'array' },
        pagination: { type: 'boolean' },
        rowSelection: { type: 'boolean' },
      },
    };

    return validate(schema, props);
  }

  handleEvent(event: ComponentEvent): void {
    // 事件处理逻辑
    console.log('Table event:', event);
  }
}

// 表单组件
class FormComponent implements LowCodeComponent {
  meta: ComponentMeta = {
    type: 'form',
    displayName: '表单容器',
    category: 'form',
    icon: 'form',
    container: true,
    props: [
      {
        name: 'fields',
        type: 'array',
        required: true,
        description: '表单字段配置',
      },
      {
        name: 'layout',
        type: 'enum',
        options: ['horizontal', 'vertical', 'inline'],
        defaultValue: 'horizontal',
      },
      {
        name: 'labelWidth',
        type: 'number',
        description: '标签宽度',
      },
    ],
    events: [
      { name: 'onSubmit', description: '表单提交事件' },
      { name: 'onValuesChange', description: '值变化事件' },
    ],
    defaultProps: {
      layout: 'horizontal',
      labelWidth: 120,
    },
  };

  render(props: ComponentProps): JSX.Element {
    const [form] = Form.useForm();

    return (
      <Form
        form={form}
        layout={props.layout}
        labelCol={{ style: { width: props.labelWidth } }}
        onFinish={(values) => {
          this.handleEvent({
            type: 'onSubmit',
            payload: { values },
          });
        }}
        onValuesChange={(changedValues, allValues) => {
          this.handleEvent({
            type: 'onValuesChange',
            payload: { changedValues, allValues },
          });
        }}
      >
        {props.fields.map((field: FieldConfig) => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={field.label}
            rules={field.rules}
          >
            {this.renderFieldInput(field)}
          </Form.Item>
        ))}
      </Form>
    );
  }

  private renderFieldInput(field: FieldConfig): JSX.Element {
    switch (field.type) {
      case 'input':
        return <Input placeholder={field.placeholder} />;
      case 'textarea':
        return <Input.TextArea rows={field.rows} />;
      case 'select':
        return (
          <Select options={field.options} placeholder={field.placeholder} />
        );
      case 'date':
        return <DatePicker />;
      case 'number':
        return <InputNumber />;
      default:
        return <Input />;
    }
  }

  validateProps(props: unknown): ValidationResult {
    return validate(
      {
        type: 'object',
        required: ['fields'],
        properties: {
          fields: { type: 'array' },
          layout: { type: 'string' },
          labelWidth: { type: 'number' },
        },
      },
      props
    );
  }

  handleEvent(event: ComponentEvent): void {
    console.log('Form event:', event);
  }
}
```

## 代码生成引擎

### 1. 前端代码生成

```typescript
// 代码生成器
class CodeGenerator {
  private templates: Map<string, Template>;

  async generateApplication(metadata: ApplicationMetadata): Promise<GeneratedCode> {
    const code: GeneratedCode = {
      files: [],
      dependencies: new Set(),
    };

    // 生成页面组件
    for (const page of metadata.pages) {
      const pageCode = this.generatePage(page);
      code.files.push({
        path: `src/pages/${page.id}.tsx`,
        content: pageCode,
      });
    }

    // 生成路由配置
    const routerCode = this.generateRouter(metadata.pages);
    code.files.push({
      path: 'src/router/index.tsx',
      content: routerCode,
    });

    // 生成类型定义
    const typesCode = this.generateTypes(metadata);
    code.files.push({
      path: 'src/types/index.ts',
      content: typesCode,
    });

    // 生成 API 服务
    for (const api of metadata.apis) {
      const apiCode = this.generateApiService(api);
      code.files.push({
        path: `src/services/${api.id}.ts`,
        content: apiCode,
      });
    }

    // 生成样式文件
    for (const page of metadata.pages) {
      const styleCode = this.generateStyles(page);
      code.files.push({
        path: `src/styles/${page.id}.css`,
        content: styleCode,
      });
    }

    return code;
  }

  private generatePage(page: PageMetadata): string {
    const components = this.generateComponents(page.components);
    const hooks = this.generateHooks(page.events);
    const state = this.generateState(page.state);

    return `
import React, { useState, useEffect } from 'react';
import ${state.imports};

const ${page.name}: React.FC = () => {
  ${state.declarations}

  ${hooks.declarations}

  return (
    <div className="${page.id}">
      ${components}
    </div>
  );
};

export default ${page.name};
    `.trim();
  }

  private generateComponents(instances: ComponentInstance[]): string {
    return instances
      .map(instance => {
        const props = this.generateProps(instance.props);
        const children = instance.children
          ? this.generateComponents(instance.children)
          : '';

        return `<${instance.type} ${props}>${children}</${instance.type}>`;
      })
      .join('\n');
  }

  private generateProps(props: Record<string, PropValue>): string {
    return Object.entries(props)
      .map(([key, value]) => {
        switch (value.type) {
          case 'static':
            return `${key}={${JSON.stringify(value.value)}}`;

          case 'binding':
            return `${key}={${value.binding?.path}}`;

          case 'expression':
            return `${key}={${value.value}}`;

          default:
            return `${key}={${value.value}}`;
        }
      })
      .join(' ');
  }

  private generateHooks(events: EventHandler[]): string {
    return events
      .map(event => {
        const actions = event.actions
          .map(action => this.generateAction(action))
          .join('\n');

        return `
const ${event.name} = useCallback(() => {
  ${actions}
}, []);
        `.trim();
      })
      .join('\n');
  }

  private generateAction(action: Action): string {
    switch (action.type) {
      case 'api':
        return `await apiCall('${action.config.endpoint}', ${JSON.stringify(action.config.params)});`;

      case 'navigation':
        return `navigate('${action.config.to}');`;

      case 'state':
        return `set${action.config.state}(${JSON.stringify(action.config.value)});`;

      case 'workflow':
        return `executeWorkflow('${action.config.workflowId}');`;

      default:
        return `// Unknown action type: ${action.type}`;
    }
  }
}
```

### 2. 后端代码生成

```typescript
// 后端 API 生成器
class BackendCodeGenerator {
  async generateBackend(metadata: ApplicationMetadata): Promise<GeneratedCode> {
    const code: GeneratedCode = {
      files: [],
      dependencies: new Set(),
    };

    // 生成数据模型
    for (const model of metadata.dataModels) {
      const modelCode = this.generateModel(model);
      code.files.push({
        path: `src/models/${model.name}.ts`,
        content: modelCode,
      });
    }

    // 生成 API 路由
    for (const api of metadata.apis) {
      const routeCode = this.generateRoute(api);
      code.files.push({
        path: `src/routes/${api.id}.ts`,
        content: routeCode,
      });
    }

    // 生成中间件
    const middlewareCode = this.generateMiddleware(metadata.permissions);
    code.files.push({
      path: 'src/middleware/auth.ts',
      content: middlewareCode,
    });

    // 添加依赖
    code.dependencies.add('express');
    code.dependencies.add('typescript');
    code.dependencies.add('prisma');

    return code;
  }

  private generateModel(model: DataModel): string {
    const fields = model.fields
      .map(field => {
        let fieldDef = `  ${field.name}: `;

        switch (field.type) {
          case 'string':
            fieldDef += field.required ? 'string' : 'string | null';
            break;
          case 'number':
            fieldDef += field.required ? 'number' : 'number | null';
            break;
          case 'boolean':
            fieldDef += field.required ? 'boolean' : 'boolean | null';
            break;
          case 'date':
            fieldDef += field.required ? 'Date' : 'Date | null';
            break;
          case 'relation':
            fieldDef += field.relation + 'Relation';
            break;
          default:
            fieldDef += 'unknown';
        }

        return fieldDef + ';';
      })
      .join('\n');

    return `
export interface ${model.name} {
${fields}
}

export type ${model.name}Create = Omit<${model.name}, 'id' | 'createdAt' | 'updatedAt'>;
export type ${model.name}Update = Partial<${model.name}Create>;
    `.trim();
  }

  private generateRoute(api: ApiDefinition): string {
    const handlers = api.endpoints
      .map(endpoint => {
        const handlerName = `${endpoint.method}_${endpoint.path.replace(/\//g, '_')}`;

        return `
async function ${handlerName}(req: Request, res: Response) {
  try {
    // TODO: Implement ${endpoint.method} ${endpoint.path}
    const result = await ${endpoint.service}.${endpoint.operation}(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.${endpoint.method}('${endpoint.path}', ${handlerName});
        `.trim();
      })
      .join('\n\n');

    return `
import express, { Request, Response } from 'express';
const router = express.Router();

${handlers}

export default router;
    `.trim();
  }
}
```

## AI 辅助开发

### 1. 自然语言到配置

```typescript
// AI 配置生成器
class AIConfigGenerator {
  private llmClient: LLMClient;

  async generateFromDescription(description: string): Promise<ApplicationMetadata> {
    // 1. 分析需求
    const analysis = await this.analyzeRequirements(description);

    // 2. 生成数据模型
    const dataModels = await this.generateDataModels(analysis);

    // 3. 生成页面结构
    const pages = await this.generatePages(analysis);

    // 4. 生成 API 定义
    const apis = await this.generateApis(analysis, dataModels);

    // 5. 生成工作流
    const workflows = await this.generateWorkflows(analysis);

    return {
      id: this.generateId(),
      name: analysis.name,
      version: '1.0.0',
      description,
      pages,
      dataModels,
      apis,
      permissions: await this.generatePermissions(analysis),
      theme: await this.generateTheme(analysis),
      config: {},
    };
  }

  private async analyzeRequirements(description: string): Promise<RequirementsAnalysis> {
    const prompt = `
分析以下应用需求，提取关键信息：

需求描述：${description}

请提取：
1. 应用类型（CRUD、仪表板、表单等）
2. 主要功能模块
3. 数据实体
4. 用户角色
5. 关键工作流

以 JSON 格式返回结果。
    `;

    const response = await this.llmClient.complete(prompt);
    return JSON.parse(response);
  }

  private async generateDataModels(analysis: RequirementsAnalysis): Promise<DataModel[]> {
    const models: DataModel[] = [];

    for (const entity of analysis.entities) {
      const prompt = `
为实体 "${entity.name}" 生成数据模型：

实体描述：${entity.description}

字段要求：
- id: 主键
- createdAt: 创建时间
- updatedAt: 更新时间
- 其他业务字段

请生成完整的字段定义，包括：
- 字段名
- 字段类型
- 是否必填
- 默认值
- 验证规则

以 JSON 格式返回。
      `;

      const response = await this.llmClient.complete(prompt);
      const model = JSON.parse(response);

      models.push({
        id: this.generateId(),
        name: entity.name,
        fields: model.fields,
        relations: model.relations || [],
      });
    }

    return models;
  }

  private async generatePages(analysis: RequirementsAnalysis): Promise<PageMetadata[]> {
    const pages: PageMetadata[] = [];

    for (const module of analysis.modules) {
      const prompt = `
为功能模块 "${module.name}" 生成页面配置：

模块功能：${module.description}

请生成：
1. 页面布局
2. 组件列表
3. 组件属性
4. 事件处理
5. 数据绑定

以 JSON 格式返回。
      `;

      const response = await this.llmClient.complete(prompt);
      const pageConfig = JSON.parse(response);

      pages.push({
        id: this.generateId(),
        name: module.name,
        route: module.route,
        layout: pageConfig.layout,
        components: pageConfig.components,
        events: pageConfig.events || [],
        state: pageConfig.state || {},
      });
    }

    return pages;
  }
}
```

### 2. 智能组件推荐

```typescript
// 组件推荐引擎
class ComponentRecommender {
  private componentRegistry: ComponentRegistry;
  private llmClient: LLMClient;

  async recommend(requirement: string): Promise<ComponentRecommendation[]> {
    // 1. 分析需求意图
    const intent = await this.analyzeIntent(requirement);

    // 2. 匹配组件
    const candidates = this.findCandidates(intent);

    // 3. 评分排序
    const scored = await this.scoreComponents(candidates, requirement);

    // 4. 返回推荐
    return scored.slice(0, 5);
  }

  private async analyzeIntent(requirement: string): Promise<ComponentIntent> {
    const prompt = `
分析以下需求，提取组件使用意图：

需求：${requirement}

请提取：
1. 功能类型（数据展示、数据输入、导航等）
2. 数据类型
3. 交互方式
4. 特殊要求

以 JSON 格式返回。
    `;

    const response = await this.llmClient.complete(prompt);
    return JSON.parse(response);
  }

  private findCandidates(intent: ComponentIntent): Promise<LowCodeComponent[]> {
    // 根据意图查找候选组件
    return this.componentRegistry.list(intent.category);
  }

  private async scoreComponents(
    components: LowCodeComponent[],
    requirement: string
  ): Promise<ComponentRecommendation[]> {
    const recommendations: ComponentRecommendation[] = [];

    for (const component of components) {
      // 计算相似度分数
      const score = await this.calculateScore(component, requirement);

      // 生成推荐理由
      const reason = await this.generateReason(component, requirement);

      recommendations.push({
        component,
        score,
        reason,
        suggestedProps: await this.suggestProps(component, requirement),
      });
    }

    // 按分数排序
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async calculateScore(
    component: LowCodeComponent,
    requirement: string
  ): Promise<number> {
    // 使用嵌入向量计算相似度
    const componentEmbedding = await this.getEmbedding(component.meta.displayName);
    const requirementEmbedding = await this.getEmbedding(requirement);

    return this.cosineSimilarity(componentEmbedding, requirementEmbedding);
  }

  private async generateReason(
    component: LowCodeComponent,
    requirement: string
  ): Promise<string> {
    const prompt = `
解释为什么推荐使用 ${component.meta.displayName} 组件：

需求：${requirement}
组件功能：${component.meta.displayName}

请给出推荐理由（1-2句话）。
    `;

    return this.llmClient.complete(prompt);
  }

  private async suggestProps(
    component: LowCodeComponent,
    requirement: string
  ): Promise<Record<string, unknown>> {
    const prompt = `
为组件 ${component.meta.displayName} 生成属性配置：

需求：${requirement}
可用属性：${JSON.stringify(component.meta.props)}

请生成合适的属性值。
以 JSON 格式返回。
    `;

    const response = await this.llmClient.complete(prompt);
    return JSON.parse(response);
  }
}
```

## 总结

低代码平台架构的核心要点：

1. **元数据驱动**：统一的应用描述模型
2. **组件体系**：可扩展的组件协议
3. **代码生成**：从配置到生产代码
4. **AI 辅助**：自然语言到应用
5. **可视化设计**：拖拽式界面构建
6. **全栈支持**：前后端一体化生成

低代码平台正在改变应用开发的方式，让非开发者也能快速构建专业应用。

---

**相关工具：**
- [JSON 格式化工具](https://www.util.cn/tools/json-formatter/)
- [正则表达式测试](https://www.util.cn/tools/regex-tester/)
