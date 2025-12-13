const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const semver = require('semver');

const app = express();
const PORT = 3001;

// 模拟版本数据库
const versions = {
  stable: [
    {
      version: '1.0.1',
      releaseDate: '2024-01-15T10:00:00Z',
      releaseNotes: '修复了启动画面在打包后不显示的问题\n优化了窗口大小配置\n提升了应用启动速度',
      updateType: 'hotfix',
      isForceUpdate: false,
      files: [
        {
          path: 'splash.html',
          url: 'http://localhost:3001/updates/1.0.1/splash.html',
          hash: 'abc123...',
          size: 1024
        },
        {
          path: 'config.json',
          url: 'http://localhost:3001/updates/1.0.1/config.json',
          hash: 'def456...',
          size: 512
        }
      ]
    },
    {
      version: '1.1.0',
      releaseDate: '2024-02-01T14:00:00Z',
      releaseNotes: '新增热更新功能\n优化用户界面\n支持多主题切换\n修复已知问题',
      updateType: 'major',
      isForceUpdate: false,
      downloadUrl: 'http://localhost:3001/downloads/util-v1.1.0-macos-arm64.dmg',
      size: 51200000 // 50MB
    },
    {
      version: '1.2.0',
      releaseDate: '2024-03-01T10:00:00Z',
      releaseNotes: '重要的安全更新\n重构核心架构\n支持插件系统\n性能大幅提升',
      updateType: 'major',
      isForceUpdate: true,
      downloadUrl: 'http://localhost:3001/downloads/util-v1.2.0-macos-arm64.dmg',
      size: 55000000 // 55MB
    }
  ],
  beta: [
    {
      version: '1.1.1-beta',
      releaseDate: '2024-02-15T16:00:00Z',
      releaseNotes: '测试版本：实验性功能\n新版本更新机制\n可能存在不稳定因素',
      updateType: 'hotfix',
      isForceUpdate: false,
      files: [
        {
          path: 'beta-features.js',
          url: 'http://localhost:3001/updates/1.1.1-beta/beta-features.js',
          hash: 'beta123...',
          size: 2048
        }
      ]
    }
  ],
  dev: [
    {
      version: '1.1.2-dev',
      releaseDate: new Date().toISOString(),
      releaseNotes: '开发版本：最新功能测试\n包含实验性API\n仅供开发者测试',
      updateType: 'hotfix',
      isForceUpdate: false,
      files: [
        {
          path: 'dev-api.js',
          url: 'http://localhost:3001/updates/1.1.2-dev/dev-api.js',
          hash: 'dev123...',
          size: 3072
        }
      ]
    }
  ]
};

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 检查更新接口
app.get('/api/v1/check-updates', (req, res) => {
  const { current_version, platform = 'macos', arch = 'arm64', channel = 'stable' } = req.query;

  console.log(`检查更新: 当前版本 ${current_version}, 平台 ${platform}, 架构 ${arch}, 频道 ${channel}`);

  // 获取对应频道的版本列表
  const versionList = versions[channel] || versions.stable;

  // 找到最新版本
  let latestVersion = null;
  for (const version of versionList) {
    if (semver.gt(version.version, current_version)) {
      if (!latestVersion || semver.gt(version.version, latestVersion.version)) {
        latestVersion = version;
      }
    }
  }

  if (!latestVersion) {
    return res.json({
      current_version,
      latest_version: current_version,
      update_type: null,
      release_notes: '已是最新版本',
      release_date: new Date().toISOString(),
      is_force_update: false
    });
  }

  // 构建响应
  const response = {
    current_version,
    latest_version: latestVersion.version,
    release_notes: latestVersion.releaseNotes,
    release_date: latestVersion.releaseDate,
    is_force_update: latestVersion.isForceUpdate
  };

  if (latestVersion.updateType === 'hotfix') {
    response.update_type = {
      type: 'Hotfix',
      version: latestVersion.version,
      files: latestVersion.files
    };
  } else {
    response.update_type = {
      type: 'Major',
      version: latestVersion.version,
      download_url: latestVersion.downloadUrl,
      size: latestVersion.size
    };
  }

  res.json(response);
});

// 下载更新文件
app.get('/updates/:version/:filename', (req, res) => {
  const { version, filename } = req.params;
  const filePath = path.join(__dirname, 'updates', version, filename);

  if (fs.existsSync(filePath)) {
    // 计算文件哈希
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 设置响应头
    res.set('Content-Type', 'application/octet-stream');
    res.set('X-File-Hash', hash);
    res.set('X-File-Size', fileBuffer.length);

    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

// 下载完整应用
app.get('/downloads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'downloads', filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

// 版本信息接口
app.get('/api/v1/versions', (req, res) => {
  const { channel = 'stable' } = req.query;
  res.json({
    channel,
    versions: versions[channel] || []
  });
});

// 统计信息接口
app.get('/api/v1/stats', (req, res) => {
  res.json({
    total_updates: Object.values(versions).flat().length,
    channels: Object.keys(versions),
    latest_versions: Object.keys(versions).reduce((acc, channel) => {
      const channelVersions = versions[channel];
      if (channelVersions.length > 0) {
        acc[channel] = channelVersions[channelVersions.length - 1].version;
      }
      return acc;
    }, {})
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 创建必要的目录
const ensureDirectories = () => {
  const dirs = ['public', 'updates', 'downloads'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 创建示例更新文件
  const createSampleFiles = () => {
    // 示例热更新文件
    const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>更新示例</title>
</head>
<body>
    <h1>这是一个示例更新文件</h1>
    <p>版本: 1.0.1</p>
</body>
</html>`;

    fs.writeFileSync(path.join('updates', '1.0.1', 'splash.html'), sampleHtml);

    const sampleConfig = JSON.stringify({
      version: '1.0.1',
      features: ['hotfix-support', 'improved-ui'],
      updated_at: new Date().toISOString()
    }, null, 2);

    fs.writeFileSync(path.join('updates', '1.0.1', 'config.json'), sampleConfig);

    // 创建测试版文件
    fs.writeFileSync(path.join('updates', '1.1.1-beta', 'beta-features.js'), `
// Beta features
console.log('Beta version loaded');
`);

    // 创建开发版文件
    fs.writeFileSync(path.join('updates', '1.1.2-dev', 'dev-api.js'), `
// Dev API
console.log('Dev version loaded');
`);
  };

  createSampleFiles();
};

// 启动服务器
ensureDirectories();

app.listen(PORT, () => {
  console.log(`🚀 更新服务器已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📊 统计信息: http://localhost:${PORT}/api/v1/stats`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
  console.log(`\n📝 可用接口:`);
  console.log(`   GET /api/v1/check-updates - 检查更新`);
  console.log(`   GET /api/v1/versions - 获取版本列表`);
  console.log(`   GET /api/v1/stats - 获取统计信息`);
  console.log(`   GET /updates/:version/:filename - 下载更新文件`);
  console.log(`   GET /downloads/:filename - 下载完整应用`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭更新服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭更新服务器...');
  process.exit(0);
});