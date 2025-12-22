#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

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
          content: data
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

// 解析HTML获取SEO信息
function parseSEO(html) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 获取标题
    const title = document.querySelector('title')?.textContent || '';

    // 获取描述
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // 获取其他SEO meta标签
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

    return {
      title,
      description,
      keywords
    };
  } catch (error) {
    return {
      title: '',
      description: '',
      keywords: '',
      error: error.message
    };
  }
}

// 生成表格输出
function generateTable(results) {
  const headers = ['工具名称', 'URL', 'HTTP状态', '响应时间(ms)', 'SEO标题', 'SEO描述'];
  const maxWidths = [15, 50, 10, 12, 40, 60];

  // 计算每列的最大宽度
  const rows = [headers, ...results.map(r => [
    r.name,
    r.url,
    r.status.toString(),
    r.responseTime.toString(),
    r.seo.title,
    r.seo.description
  ])];

  for (let i = 0; i < headers.length; i++) {
    maxWidths[i] = Math.max(maxWidths[i], ...rows.map(row => (row[i] || '').length));
  }

  // 生成表格分隔线
  const separator = '+-' + maxWidths.map(w => '-'.repeat(w)).join('-+-') + '-+';

  // 生成表格
  let table = separator + '\n';

  // 表头
  table += '| ' + headers.map((h, i) => h.padEnd(maxWidths[i])).join(' | ') + ' |\n';
  table += separator + '\n';

  // 数据行
  for (const result of results) {
    const row = [
      result.name,
      result.url,
      result.status.toString(),
      result.responseTime.toString(),
      result.seo.title,
      result.seo.description
    ];

    table += '| ' + row.map((cell, i) => (cell || '').padEnd(maxWidths[i])).join(' | ') + ' |\n';
  }

  table += separator;

  return table;
}

// 生成CSV输出
function generateCSV(results) {
  const headers = ['工具名称', 'URL', 'HTTP状态', '响应时间(ms)', 'SEO标题', 'SEO描述', '关键词'];

  let csv = headers.join(',') + '\n';

  for (const result of results) {
    const row = [
      result.name,
      result.url,
      result.status,
      result.responseTime,
      `"${result.seo.title.replace(/"/g, '""')}"`,
      `"${result.seo.description.replace(/"/g, '""')}"`,
      `"${result.seo.keywords.replace(/"/g, '""')}"`
    ];

    csv += row.join(',') + '\n';
  }

  return csv;
}

// 主函数
async function main() {
  console.log('🔍 开始检查工具页面...\n');

  // 获取所有工具
  const tools = getToolFiles(toolsDir);
  console.log(`📁 找到 ${tools.length} 个工具\n`);

  const results = [];
  const baseUrl = 'https://util.iskytrip.com/tools/';

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const url = baseUrl + tool;

    console.log(`⏳ 检查中 (${i + 1}/${tools.length}): ${tool}`);

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
      console.log(`${statusIcon} ${tool}: ${response.status} (${response.responseTime}ms)`);

      if (seo.title) {
        console.log(`   📝 标题: ${seo.title.substring(0, 50)}${seo.title.length > 50 ? '...' : ''}`);
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

      console.log(`❌ ${tool}: 检查失败 - ${error.message}`);
    }

    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 生成报告...\n');

  // 统计信息
  const successCount = results.filter(r => r.status === 200).length;
  const errorCount = results.filter(r => r.status === 0).length;
  const redirectCount = results.filter(r => r.status >= 300 && r.status < 400).length;
  const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length);

  console.log(`📈 统计信息:`);
  console.log(`   ✅ 成功: ${successCount}/${results.length}`);
  console.log(`   ⚠️ 重定向: ${redirectCount}/${results.length}`);
  console.log(`   ❌ 失败: ${errorCount}/${results.length}`);
  console.log(`   ⏱️ 平均响应时间: ${avgResponseTime}ms\n`);

  // 生成表格
  const table = generateTable(results);
  console.log('📋 详细结果表格:');
  console.log(table);

  // 保存到文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // 保存表格
  fs.writeFileSync(`tools-check-${timestamp}.txt`, table);
  console.log(`\n💾 表格已保存到: tools-check-${timestamp}.txt`);

  // 保存CSV
  const csv = generateCSV(results);
  fs.writeFileSync(`tools-check-${timestamp}.csv`, csv);
  console.log(`💾 CSV已保存到: tools-check-${timestamp}.csv`);

  // 保存JSON
  fs.writeFileSync(`tools-check-${timestamp}.json`, JSON.stringify(results, null, 2));
  console.log(`💾 JSON已保存到: tools-check-${timestamp}.json`);

  console.log('\n✨ 检查完成！');
}

// 安装依赖提示
if (!fs.existsSync('node_modules/jsdom')) {
  console.log('❌ 需要安装 jsdom 依赖');
  console.log('请运行: npm install jsdom');
  process.exit(1);
}

// 运行检查
main().catch(error => {
  console.error('❌ 运行出错:', error);
  process.exit(1);
});