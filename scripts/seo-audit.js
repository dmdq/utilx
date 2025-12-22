#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SEOAuditor {
  constructor() {
    this.issues = [];
    this.suggestions = [];
  }

  // 检查工具文件的SEO优化
  auditToolFiles() {
    const toolsDir = path.join(__dirname, '../src/pages/tools');
    const tools = this.getToolFiles(toolsDir);

    console.log(`🔍 开始SEO审计 ${tools.length} 个工具...`);

    for (const tool of tools) {
      this.auditSingleTool(tool, toolsDir);
    }

    this.generateReport();
  }

  getToolFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        const indexFile = path.join(fullPath, 'index.vue');
        if (fs.existsSync(indexFile)) {
          files.push({ name: item, path: indexFile });
        }
      } else if (item.endsWith('.vue')) {
        files.push({ name: item.replace('.vue', ''), path: fullPath });
      }
    }
    return files;
  }

  auditSingleTool(tool, toolsDir) {
    try {
      const content = fs.readFileSync(tool.path, 'utf8');

      console.log(`\n📋 审计: ${tool.name}`);

      // 检查SEO设置
      this.checkSEOSettings(content, tool.name);

      // 检查结构化数据
      this.checkStructuredData(content, tool.name);

      // 检查关键词优化
      this.checkKeywords(content, tool.name);

      // 检查页面性能
      this.checkPerformance(content, tool.name);

    } catch (error) {
      this.issues.push({
        tool: tool.name,
        type: 'error',
        message: `文件读取失败: ${error.message}`
      });
    }
  }

  checkSEOSettings(content, toolName) {
    // 检查 useSeoMeta
    if (!content.includes('useSeoMeta(')) {
      this.issues.push({
        tool: toolName,
        type: 'seo',
        message: '缺少 useSeoMeta 设置'
      });
    }

    // 检查标题
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    if (!titleMatch) {
      this.issues.push({
        tool: toolName,
        type: 'seo',
        message: '缺少 SEO 标题'
      });
    } else {
      const title = titleMatch[1];
      if (title.length < 10) {
        this.suggestions.push({
          tool: toolName,
          type: 'seo',
          message: '标题过短，建议至少10个字符'
        });
      }
      if (title.length > 60) {
        this.suggestions.push({
          tool: toolName,
          type: 'seo',
          message: '标题过长，建议控制在60字符以内'
        });
      }
    }

    // 检查描述
    const descMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
    if (!descMatch) {
      this.issues.push({
        tool: toolName,
        type: 'seo',
        message: '缺少 SEO 描述'
      });
    } else {
      const description = descMatch[1];
      if (description.length < 50) {
        this.suggestions.push({
          tool: toolName,
          type: 'seo',
          message: '描述过短，建议至少50个字符'
        });
      }
      if (description.length > 160) {
        this.suggestions.push({
          tool: toolName,
          type: 'seo',
          message: '描述过长，建议控制在160字符以内'
        });
      }
    }

    // 检查关键词
    if (!content.includes('keywords:')) {
      this.suggestions.push({
        tool: toolName,
        type: 'seo',
        message: '建议添加关键词标签'
      });
    }
  }

  checkStructuredData(content, toolName) {
    if (!content.includes('@context') || !content.includes('schema.org')) {
      this.issues.push({
        tool: toolName,
        type: 'structured_data',
        message: '缺少结构化数据 (JSON-LD)'
      });
    }

    // 检查必需的结构化数据字段
    const requiredFields = ['@type', 'name', 'description', 'url'];
    for (const field of requiredFields) {
      if (!content.includes(`"${field}":`)) {
        this.suggestions.push({
          tool: toolName,
          type: 'structured_data',
          message: `建议添加结构化数据字段: ${field}`
        });
      }
    }
  }

  checkKeywords(content, toolName) {
    // 检查关键词密度
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    const descMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
    const keywordsMatch = content.match(/keywords:\s*\[([^\]]+)\]/);

    if (titleMatch && descMatch && keywordsMatch) {
      const keywords = keywordsMatch[1].match(/'([^']+)'/g) || [];
      const text = `${titleMatch[1]} ${descMatch[1]}`;

      keywords.forEach(keyword => {
        const cleanKeyword = keyword.replace(/'/g, '');
        const regex = new RegExp(cleanKeyword, 'gi');
        const matches = text.match(regex);
        const count = matches ? matches.length : 0;

        if (count === 0) {
          this.suggestions.push({
            tool: toolName,
            type: 'keywords',
            message: `关键词 "${cleanKeyword}" 未在标题或描述中出现`
          });
        }
      });
    }
  }

  checkPerformance(content, toolName) {
    // 检查图片优化
    if (content.includes('<img') && !content.includes('loading="lazy"')) {
      this.suggestions.push({
        tool: toolName,
        type: 'performance',
        message: '建议为图片添加 lazy loading'
      });
    }

    // 检查异步组件
    if (content.includes('import(') && !content.includes('defineAsyncComponent')) {
      this.suggestions.push({
        tool: toolName,
        type: 'performance',
        message: '建议使用 defineAsyncComponent 优化组件加载'
      });
    }
  }

  generateReport() {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    console.log(`\n📊 SEO 审计报告 (${timestamp})`);
    console.log('='.repeat(50));

    // 统计
    const issueCount = this.issues.length;
    const suggestionCount = this.suggestions.length;

    console.log(`\n📈 统计信息:`);
    console.log(`   ❌ 问题: ${issueCount}`);
    console.log(`   💡 建议: ${suggestionCount}`);

    if (issueCount === 0 && suggestionCount === 0) {
      console.log('\n🎉 所有工具都通过了SEO审计！');
      return;
    }

    // 问题列表
    if (this.issues.length > 0) {
      console.log('\n❌ 发现的问题:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.tool}] ${issue.type}: ${issue.message}`);
      });
    }

    // 建议列表
    if (this.suggestions.length > 0) {
      console.log('\n💡 优化建议:');
      this.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. [${suggestion.tool}] ${suggestion.type}: ${suggestion.message}`);
      });
    }

    // 生成详细报告文件
    this.saveDetailedReport();

    // 生成修复建议
    this.generateFixSuggestions();
  }

  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        issues: this.issues.length,
        suggestions: this.suggestions.length
      },
      issues: this.issues,
      suggestions: this.suggestions
    };

    const filename = `seo-audit-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 详细报告已保存到: ${filename}`);
  }

  generateFixSuggestions() {
    console.log('\n🔧 自动修复建议:');

    // 按问题类型分组
    const groupedIssues = {};
    this.issues.forEach(issue => {
      if (!groupedIssues[issue.type]) {
        groupedIssues[issue.type] = [];
      }
      groupedIssues[issue.type].push(issue);
    });

    // 为每种问题类型提供修复建议
    Object.entries(groupedIssues).forEach(([type, issues]) => {
      console.log(`\n${type.toUpperCase()} 问题 (${issues.length} 个):`);
      issues.forEach(issue => {
        console.log(`  - ${issue.tool}: ${issue.message}`);
      });

      // 提供通用修复方案
      switch (type) {
        case 'seo':
          console.log('  💡 修复方案: 添加 useSeoMeta 配置，包含 title、description、keywords');
          break;
        case 'structured_data':
          console.log('  💡 修复方案: 添加 JSON-LD 结构化数据，包含 @context、@type、name、description、url');
          break;
        case 'performance':
          console.log('  💡 修复方案: 优化图片加载、使用异步组件、压缩资源');
          break;
      }
    });
  }
}

// 运行审计
const auditor = new SEOAuditor();
auditor.auditToolFiles();