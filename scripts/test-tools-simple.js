#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 工具目录
const toolsDir = path.join(__dirname, 'src/pages/tools');

// 获取所有工具文件
function getToolFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    console.log('工具目录不存在:', dir);
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 检查是否有index.vue文件
      const indexFile = path.join(fullPath, 'index.vue');
      if (fs.existsSync(indexFile)) {
        files.push(item);
      }
    } else if (item.endsWith('.vue')) {
      // 单个vue文件（去掉.vue扩展名）
      files.push(item.replace('.vue', ''));
    }
  }

  return files.sort();
}

// 检查URL状态
function checkUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          responseTime: Date.now() - startTime,
          content: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        responseTime: Date.now() - startTime,
        error: err.message,
        content: ''
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: 0,
        responseTime: 10000,
        error: 'Timeout',
        content: ''
      });
    });
  });
}

// 简单解析HTML获取SEO信息
function parseSEO(html) {
  try {
    // 使用正则表达式解析
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const description = descMatch ? descMatch[1].trim() : '';

    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';

    return { title, description, keywords };
  } catch (error) {
    return {
      title: '',
      description: '',
      keywords: '',
      error: error.message
    };
  }
}

// 主函数
async function main() {
  console.log('🔍 开始检查工具页面...\n');

  // 获取所有工具
  const tools = getToolFiles(toolsDir);
  console.log(`📁 找到 ${tools.length} 个工具\n`);

  const results = [];
  const baseUrl = process.argv[2] || 'https://util.iskytrip.com/tools/';

  console.log(`🌐 基础URL: ${baseUrl}\n`);

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const url = baseUrl + tool;

    process.stdout.write(`⏳ 检查中 (${i + 1}/${tools.length}): ${tool.padEnd(30)} `);

    try {
      // 检查URL
      const response = await checkUrl(url);

      // 解析SEO信息
      const seo = parseSEO(response.content);

      results.push({
        name: tool,
        url: url,
        status: response.status,
        responseTime: response.responseTime,
        seo: seo,
        error: response.error
      });

      // 显示结果
      const statusIcon = response.status === 200 ? '✅' : response.status > 0 ? '⚠️' : '❌';
      console.log(`${statusIcon} ${response.status} (${response.responseTime}ms)`);

      if (response.status === 200 && seo.title) {
        console.log(`   📝 ${seo.title.substring(0, 60)}${seo.title.length > 60 ? '...' : ''}`);
      }

      if (response.error) {
        console.log(`   ❌ 错误: ${response.error}`);
      }

    } catch (error) {
      results.push({
        name: tool,
        url: url,
        status: 0,
        responseTime: 0,
        seo: { title: '', description: '', keywords: '' },
        error: error.message
      });

      console.log(`❌ 检查失败 - ${error.message}`);
    }

    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n📊 统计信息:');

  // 统计
  const success = results.filter(r => r.status === 200);
  const errors = results.filter(r => r.status === 0);
  const redirects = results.filter(r => r.status >= 300 && r.status < 400);
  const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length);

  console.log(`   ✅ 成功 (200): ${success.length}/${results.length}`);
  console.log(`   ⚠️ 重定向 (3xx): ${redirects.length}/${results.length}`);
  console.log(`   ❌ 失败/错误: ${errors.length}/${results.length}`);
  console.log(`   ⏱️ 平均响应时间: ${avgResponseTime}ms\n`);

  // 生成Markdown表格
  console.log('## 📋 详细结果表格\n');
  console.log('| 工具名称 | URL | HTTP状态 | 响应时间(ms) | SEO标题 | SEO描述 |');
  console.log('|---------|-----|----------|-------------|---------|----------|');

  for (const result of results) {
    const title = result.seo.title.replace(/\|/g, '\\|').substring(0, 50);
    const description = result.seo.description.replace(/\|/g, '\\|').substring(0, 80);
    const status = result.status === 0 ? `❌ ${result.error || 'Failed'}` : result.status.toString();

    console.log(`| ${result.name} | [${result.name}](${result.url}) | ${status} | ${result.responseTime} | ${title}${result.seo.title.length > 50 ? '...' : ''} | ${description}${result.seo.description.length > 80 ? '...' : ''} |`);
  }

  // 保存详细结果到文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportFile = `tools-check-report-${timestamp}.md`;

  let report = `# 工具页面检查报告\n\n`;
  report += `生成时间: ${new Date().toLocaleString()}\n`;
  report += `检查URL: ${baseUrl}\n\n`;

  report += `## 📊 统计摘要\n\n`;
  report += `- ✅ 成功 (200): ${success.length}/${results.length}\n`;
  report += `- ⚠️ 重定向 (3xx): ${redirects.length}/${results.length}\n`;
  report += `- ❌ 失败/错误: ${errors.length}/${results.length}\n`;
  report += `- ⏱️ 平均响应时间: ${avgResponseTime}ms\n\n`;

  report += `## 📋 详细结果\n\n`;
  report += `| 工具名称 | URL | HTTP状态 | 响应时间(ms) | SEO标题 | SEO描述 | 关键词 |\n`;
  report += `|---------|-----|----------|-------------|---------|----------|--------|\n`;

  for (const result of results) {
    const title = (result.seo.title || '').replace(/\|/g, '\\|');
    const description = (result.seo.description || '').replace(/\|/g, '\\|');
    const keywords = (result.seo.keywords || '').replace(/\|/g, '\\|');
    const status = result.status === 0 ? `❌ ${result.error || 'Failed'}` : result.status.toString();

    report += `| ${result.name} | [${result.name}](${result.url}) | ${status} | ${result.responseTime} | ${title} | ${description} | ${keywords} |\n`;
  }

  // 失败的工具单独列出
  if (errors.length > 0) {
    report += `\n## ❌ 失败的工具\n\n`;
    for (const error of errors) {
      report += `- **${error.name}**: ${error.error || '无法访问'}\n`;
    }
  }

  fs.writeFileSync(reportFile, report, 'utf8');
  console.log(`\n💾 详细报告已保存到: ${reportFile}`);

  // 同时保存JSON格式
  const jsonFile = `tools-check-${timestamp}.json`;
  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`💾 JSON数据已保存到: ${jsonFile}`);

  console.log('\n✨ 检查完成！');
}

// 运行检查
main().catch(error => {
  console.error('❌ 运行出错:', error);
  process.exit(1);
});