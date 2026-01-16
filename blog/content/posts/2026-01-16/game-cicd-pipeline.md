---
title: "游戏研发 CI/CD 流水线：构建高效交付体系"
slug: "game-cicd-pipeline"
date: 2026-01-16T13:00:00+08:00
draft: false
tags: ['CI/CD', '游戏开发', 'DevOps', 'Jenkins', '自动化']
categories: ['DevOps']
author: '有条工具团队'
summary: '深入探讨游戏研发的CI/CD流水线设计，包括自动化构建、测试、发布等全流程'
---

## 前言

游戏开发的 CI/CD 流水线与传统软件有很大不同。游戏需要处理大型资源、多平台构建、版本管理等特殊需求。本文将深入探讨游戏 CI/CD 流水线的设计与实现。

## 流水线架构设计

### 1. 多阶段流水线

```yaml
# .github/workflows/game-pipeline.yml
name: Game CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'release/**']
  pull_request:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      environment:
        description: '部署环境'
        required: true
        type: choice
        options:
          - dev
          - staging
          - production

env:
  UNITY_VERSION: '2022.3.0f1'
  NODE_VERSION: '20.x'
  JAVA_VERSION: '17'

jobs:
  # 代码检查
  lint:
    name: Code Quality Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Check code formatting
        run: npm run format:check

  # 客户端构建
  build-client:
    name: Build Game Client
    needs: lint
    strategy:
      matrix:
        platform: [android, ios, windows]
        build_type: [dev, release]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Cache Unity Library
        uses: actions/cache@v3
        with:
          path: Library
          key: Library-${{ matrix.platform }}-${{ hashFiles('Assets/**', 'Packages/**', 'ProjectSettings/**') }}
          restore-keys: |
            Library-${{ matrix.platform }}-
            Library-

      - name: Build Unity ${{ matrix.platform }}
        uses: game-ci/unity-builder@v4
        with:
          targetPlatform: ${{ matrix.platform }}
          buildName: ${{ matrix.build_type }}
          buildsPath: build
          buildMethod: Editor.BuildCommand.Build
          versioning: Semantic
          androidAppBundle: false
          androidExportType: androidPackage
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
          UNITY_EMAIL: ${{ secrets.UNITY_EMAIL }}
          UNITY_PASSWORD: ${{ secrets.UNITY_PASSWORD }}

      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: client-${{ matrix.platform }}-${{ matrix.build_type }}
          path: build/${{ matrix.platform }}
          retention-days: 30

  # 服务器构建
  build-server:
    name: Build Game Server
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Cache Go modules
        uses: actions/cache@v3
        with:
          path: |
            ~/.cache/go-build
            ~/go/pkg/mod
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
          restore-keys: |
            ${{ runner.os }}-go-

      - name: Download dependencies
        working-directory: server
        run: go mod download

      - name: Run tests
        working-directory: server
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./server/coverage.out

      - name: Build server
        working-directory: server
        run: |
          CGO_ENABLED=0 go build -a -installsuffix cgo -ldflags="-w -s" -o game-server

      - name: Docker build
        run: |
          docker build -t game-server:${{ github.sha }} -f docker/Dockerfile .
          docker tag game-server:${{ github.sha }} game-server:latest

      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push game-server:${{ github.sha }}
          docker push game-server:latest

  # 资源处理
  process-assets:
    name: Process Game Assets
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install asset tools
        run: |
          pip install -r tools/asset-pipeline/requirements.txt

      - name: Compress textures
        run: |
          python tools/asset-pipeline/compress_textures.py \
            --input Assets/Art/Textures \
            --output Assets/Art/Textures/Compressed \
            --format astc \
            --quality high

      - name: Generate mipmaps
        run: |
          python tools/asset-pipeline/generate_mipmaps.py \
            --input Assets/Art/Textures \
            --max-size 2048

      - name: Create asset bundles
        run: |
          python tools/asset-pipeline/create_bundles.py \
            --input Assets/AssetBundles \
            --output Build/AssetBundles

      - name: Upload asset bundles
        uses: actions/upload-artifact@v3
        with:
          name: asset-bundles
          path: Build/AssetBundles
          retention-days: 30
```

### 2. 自动化测试集成

```yaml
  # 自动化测试
  test:
    name: Automated Testing
    needs: [build-client, build-server]
    strategy:
      matrix:
        platform: [android, ios]
        test_suite: [smoke, regression, performance]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: client-${{ matrix.platform }}-dev
          path: build

      - name: Run smoke tests
        if: matrix.test_suite == 'smoke'
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          arch: x86_64
          profile: pixel_6
          script: npm run test:smoke

      - name: Run regression tests
        if: matrix.test_suite == 'regression'
        run: |
          npm run test:regression -- --platform=${{ matrix.platform }}

      - name: Run performance tests
        if: matrix.test_suite == 'performance'
        run: |
          npm run test:performance -- --platform=${{ matrix.platform }} \
            --duration=300 --output=performance-results.json

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.platform }}-${{ matrix.test_suite }}
          path: |
            test-results/
            performance-results.json

      - name: Publish test report
        if: always()
        uses: mikepenz/action-junit-report@v4
        with:
          report_paths: 'test-results/**/*.xml'
          check_name: Test Report ${{ matrix.platform }} ${{ matrix.test_suite }}
```

## 多平台构建

### 1. Unity 构建系统

```csharp
// Editor/BuildCommand.cs
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

public class BuildCommand
{
    private static readonly string[] BuildScenes = {
        "Assets/Scenes/Boot.unity",
        "Assets/Scenes/Main.unity",
        "Assets/Scenes/Game.unity",
        "Assets/Scenes/UI.unity"
    };

    private static string BuildPath => $"{Environment.GetEnvironmentVariable("GITHUB_WORKSPACE")}/build";

    public static void Build()
    {
        var target = EditorUserBuildSettings.activeBuildTarget;
        var targetGroup = BuildTargetGroup.Standalone;

        switch (target)
        {
            case BuildTarget.Android:
                BuildAndroid();
                break;
            case BuildTarget.iOS:
                BuildiOS();
                break;
            case BuildTarget.StandaloneWindows64:
            case BuildTarget.StandaloneOSX:
                BuildStandalone();
                break;
            default:
                Debug.LogError($"Unsupported build target: {target}");
                break;
        }
    }

    private static void BuildAndroid()
    {
        var options = new BuildPlayerOptions
        {
            scenes = BuildScenes,
            locationPathName = $"{BuildPath}/Android/Game.apk",
            target = BuildTarget.Android,
            targetGroup = BuildTargetGroup.Android,
            options = BuildOptions.None
        };

        // Android 设置
        PlayerSettings.Android.useCustomKeystore = true;
        PlayerSettings.Android.keystoreName = "keystore.keystore";
        PlayerSettings.Android.keyaliasName = "release";
        PlayerSettings.Android.keyaliasPass = System.Environment.GetEnvironmentVariable("KEYSTORE_PASSWORD");

        // 包名和版本
        PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.company.game");
        PlayerSettings.bundleVersion = GetBuildVersion();

        // 构建配置
        EditorUserBuildSettings.buildAppBundle = false;
        EditorUserBuildSettings.exportAsGoogleAndroidProject = false;

        var report = BuildPipeline.BuildPlayer(options);

        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"Build succeeded: {report.summary.totalSize} bytes");
        }
        else
        {
            Debug.LogError($"Build failed: {report.summary}");
        }
    }

    private static void BuildiOS()
    {
        var options = new BuildPlayerOptions
        {
            scenes = BuildScenes,
            locationPathName = $"{BuildPath}/iOS",
            target = BuildTarget.iOS,
            targetGroup = BuildTargetGroup.iOS,
            options = BuildOptions.None
        };

        // iOS 设置
        PlayerSettings.iOS.sdkVersion = iOSSdkVersion.DeviceSDK;
        PlayerSettings.iOS.targetDevice = iOSTargetDevice.iPhoneAndiPad;
        PlayerSettings.iOS.targetResolution = "1920x1080";

        // 代码签名
        PlayerSettings.iOS.appleEnableAutomaticSigning = false;
        PlayerSettings.iOS.iOSManualSigningProvisioningProfileID = System.Environment.GetEnvironmentVariable("IOS_PROVISIONING_PROFILE_ID");
        PlayerSettings.iOS.iOSManualSigningProvisioningProfileType = ProvisioningProfileType.Distribution;
        PlayerSettings.iOS.codeSigningEnabled = true;

        var report = BuildPipeline.BuildPlayer(options);

        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"iOS build succeeded");
        }
        else
        {
            Debug.LogError($"iOS build failed");
        }
    }

    private static void BuildStandalone()
    {
        var options = new BuildPlayerOptions
        {
            scenes = BuildScenes,
            locationPathName = $"{BuildPath}/Standalone/Game.exe",
            target = EditorUserBuildSettings.activeBuildTarget,
            targetGroup = BuildTargetGroup.Standalone,
            options = BuildOptions.None
        };

        var report = BuildPipeline.BuildPlayer(options);

        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"Standalone build succeeded");
        }
        else
        {
            Debug.LogError($"Standalone build failed");
        }
    }

    private static string GetBuildVersion()
    {
        // 使用 Git commit hash 或标签
        var gitTag = System.Environment.GetEnvironmentVariable("GIT_TAG_NAME");
        if (!string.IsNullOrEmpty(gitTag))
        {
            return gitTag.TrimStart('v');
        }

        var gitSha = System.Environment.GetEnvironmentVariable("GITHUB_SHA");
        if (!string.IsNullOrEmpty(gitSha))
        {
            return gitSha.Substring(0, 7);
        }

        return PlayerSettings.bundleVersion;
    }
}
```

### 2. 资源打包优化

```csharp
// Editor/AssetBundleBuild.cs
using UnityEditor;
using UnityEngine;
using System.Collections.Generic;
using System.IO;
using System.Linq;

public class AssetBundleBuild
{
    [MenuItem("Tools/Build Asset Bundles")]
    public static void BuildAllAssetBundles()
    {
        // 资源变体配置
        var builds = new List<AssetBundleBuild>();

        // 纹理变体
        builds.Add(CreateVariantBuild("assets/textures/ui_bg", new[] { "hd", "sd" }));
        builds.Add(CreateVariantBuild("assets/textures/characters", new[] { "hd", "sd" }));

        // 模型变体（LOD）
        builds.Add(CreateVariantBuild("assets/models/characters", new[] { "high", "medium", "low" }));

        // 构建选项
        var options = new BuildAssetBundleOptions
        {
            // 压缩选项
            BuildOptions = BuildAssetBundleOptions.None |
                          BuildAssetBundleOptions.DisableWriteTypeTree |
                          BuildAssetBundleOptions.StrictMode |
                          BuildAssetBundleOptions.ChunkBasedCompression,

            // 子文件压缩（降低运行时解压开销）
            BuildOptions = BuildAssetBundleOptions.ChunkBasedCompression
        };

        // 目标平台
        BuildTarget target = EditorUserBuildSettings.activeBuildTarget;

        // 输出路径
        string outputPath = Path.Combine("Build", "AssetBundles", target.ToString());

        // 创建目录
        Directory.CreateDirectory(outputPath);

        // 执行构建
        var manifest = BuildPipeline.BuildAssetBundles(
            outputPath,
            builds.ToArray(),
            options,
            target
        );

        // 生成依赖关系图
        GenerateDependencyGraph(manifest);

        // 计算每个包的大小
        AnalyzeBundleSizes(outputPath);

        Debug.Log($"Asset bundles built successfully to: {outputPath}");
    }

    private static AssetBundleBuild CreateVariantBuild(
        string assetPath,
        string[] variants
    )
    {
        var build = new AssetBundleBuild
        {
            assetBundleName = assetPath,
            assetNames = new[] { $"{assetPath}.prefab" }
        };

        // 为每个变体创建资源配置
        var variantAssets = new List<string>();

        foreach (var variant in variants)
        {
            variantAssets.Add($"{assetPath}_{variant}.prefab");
        }

        build.assetNames = variantAssets.ToArray();

        return build;
    }

    private static void GenerateDependencyGraph(AssetBundleManifest manifest)
    {
        var graph = new Dictionary<string, string[]>();

        foreach (var bundle in manifest.GetAllAssetBundles())
        {
            var dependencies = manifest.GetAllDependencies(bundle);
            graph[bundle] = dependencies;
        }

        // 导出为JSON
        var json = JsonUtility.ToJson(graph, true);
        File.WriteAllText($"{manifest.GetAllAssetBundles()[0]}_dependencies.json", json);
    }

    private static void AnalyzeBundleSizes(string outputPath)
    {
        var files = Directory.GetFiles(outputPath, "*", SearchOption.AllDirectories)
            .Where(f => !f.EndsWith(".manifest") && !f.EndsWith(".meta"));

        var report = new Dictionary<string, long>();

        foreach (var file in files)
        {
            var info = new FileInfo(file);
            report[Path.GetFileName(file)] = info.Length;
        }

        // 生成大小报告
        var sorted = report.OrderByDescending(kvp => kvp.Value);
        var reportLines = sorted.Select(kvp =>
            $"{kvp.Key}: {FormatBytes(kvp.Value)}"
        );

        File.WriteAllLines(
            Path.Combine(outputPath, "size_report.txt"),
            reportLines
        );
    }

    private static string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;

        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }

        return $"{len:0.##} {sizes[order]}";
    }
}
```

## 版本管理

### 1. 语义化版本控制

```typescript
// tools/versioning/version-manager.ts
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface VersionConfig {
  currentVersion: string;
  buildMetadata?: Record<string, string>;
}

class VersionManager {
  private configPath: string;
  private config: VersionConfig;

  constructor(projectRoot: string) {
    this.configPath = join(projectRoot, 'version.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const content = readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(content);
    } catch {
      // 默认配置
      this.config = {
        currentVersion: '0.1.0'
      };
    }
  }

  private saveConfig(): void {
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  // 获取当前版本
  getCurrentVersion(): string {
    return this.config.currentVersion;
  }

  // 增加版本号
  bump(type: 'major' | 'minor' | 'patch'): string {
    const version = this.parseVersion(this.config.currentVersion);

    switch (type) {
      case 'major':
        version.major++;
        version.minor = 0;
        version.patch = 0;
        break;
      case 'minor':
        version.minor++;
        version.patch = 0;
        break;
      case 'patch':
        version.patch++;
        break;
    }

    const newVersion = this.formatVersion(version);
    this.config.currentVersion = newVersion;
    this.saveConfig();

    return newVersion;
  }

  // 添加预发布标签
  addPrerelease(identifier: string): string {
    const version = this.parseVersion(this.config.currentVersion);
    version.prerelease = identifier;

    const newVersion = this.formatVersion(version);
    this.config.currentVersion = newVersion;
    this.saveConfig();

    return newVersion;
  }

  // 生成构建元数据
  generateBuildMetadata(): string {
    const branch = this.getCurrentBranch();
    const commit = this.getCurrentCommit();
    const timestamp = Date.now();

    this.config.buildMetadata = {
      branch,
      commit: commit.substring(0, 7),
      timestamp: timestamp.toString()
    };

    const version = this.parseVersion(this.config.currentVersion);
    version.build = `${branch}.${commit.substring(0, 7)}`;

    const newVersion = this.formatVersion(version);
    this.config.currentVersion = newVersion;
    this.saveConfig();

    return newVersion;
  }

  // 解析版本号
  private parseVersion(version: string): SemanticVersion {
    const regex = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    const match = version.match(regex);

    if (!match) {
      throw new Error(`Invalid version: ${version}`);
    }

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
      prerelease: match[4] || null,
      build: match[5] || null
    };
  }

  // 格式化版本号
  private formatVersion(version: SemanticVersion): string {
    let result = `${version.major}.${version.minor}.${version.patch}`;

    if (version.prerelease) {
      result += `-${version.prerelease}`;
    }

    if (version.build) {
      result += `+${version.build}`;
    }

    return result;
  }

  // 获取当前分支
  private getCurrentBranch(): string {
    const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    return result.stdout.toString().trim();
  }

  // 获取当前提交
  private getCurrentCommit(): string {
    const result = spawnSync('git', ['rev-parse', 'HEAD']);
    return result.stdout.toString().trim();
  }
}

interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

// 使用示例
const versionManager = new VersionManager(process.cwd());

// 补丁版本更新
const patchVersion = versionManager.bump('patch');
console.log(`New version: ${patchVersion}`); // 0.1.1

// 次要版本更新
const minorVersion = versionManager.bump('minor');
console.log(`New version: ${minorVersion}`); // 0.2.0

// 添加预发布标签
const prereleaseVersion = versionManager.addPrerelease('beta.1');
console.log(`New version: ${prereleaseVersion}`); // 0.2.0-beta.1

// 生成构建元数据
const buildVersion = versionManager.generateBuildMetadata();
console.log(`New version: ${buildVersion}`); // 0.2.0+main.abc1234
```

### 2. 发布流程

```yaml
  # 发布到应用商店
  release:
    name: Release to Stores
    needs: [build-client, test]
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        platform: [android, ios]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: client-${{ matrix.platform }}-release
          path: build

      - name: Get version
        id: version
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Build version: $VERSION"

      - name: Build changelog
        id: changelog
        run: |
          # 生成变更日志
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^)
          echo "## What's Changed" > changelog.md
          git log ${PREV_TAG}..HEAD --pretty=format:"- %s" >> changelog.md

      - name: Upload to Google Play
        if: matrix.platform == 'android'
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.company.game
          releaseFiles: build/**/*.apk
          track: internal
          status: completed
          inAppUpdatePriority: 2
          changelogPath: changelog.md

      - name: Upload to TestFlight
        if: matrix.platform == 'ios'
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-type: ios
          app-specific-password: ${{ secrets.APPLE_SPECIFIC_PASSWORD }}
          apple-id: ${{ secrets.APPLE_ID }}
          password: ${{ secrets.APPLE_PASSWORD }}
          file-path: build/*.ipa
          skip-waiting-for-build-processing: false

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          name: Release v${{ steps.version.outputs.version }}
          body_path: changelog.md
          files: |
            build/**/*.apk
            build/**/*.ipa
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Release ${{ steps.version.outputs.version }} for ${{ matrix.platform }} is complete!
            Platform: ${{ matrix.platform }}
            Version: ${{ steps.version.outputs.version }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

## 总结

游戏 CI/CD 流水线的核心要点：

1. **多阶段流水线**：代码检查、构建、测试、发布
2. **多平台构建**：Unity/Unreal 多平台自动化构建
3. **资源处理**：纹理压缩、AssetBundle 打包
4. **自动化测试**：冒烟测试、回归测试、性能测试
5. **版本管理**：语义化版本、变更日志生成
6. **自动发布**：应用商店发布、GitHub Release

高效的 CI/CD 流水线是快速迭代和交付的基础保障。

---

**相关工具：**
- [JSON 格式化](https://www.util.cn/tools/json-formatter/)
- [正则表达式测试](https://www.util.cn/tools/regex-tester/)
