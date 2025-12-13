use tauri::{Manager, AppHandle, WebviewWindow, Emitter};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::io::Write;
use sha2::Digest;
use tokio::time::{sleep, Duration};
use chrono::{DateTime, Utc};

/// 更新类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateType {
    /// 小版本热更新（资源文件更新）
    Hotfix { version: String, files: Vec<UpdateFile> },
    /// 大版本更新（完整应用更新）
    Major { version: String, download_url: String, size: u64 },
}

/// 更新文件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFile {
    pub path: String,
    pub url: String,
    pub hash: String,
    pub size: u64,
}

/// 版本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionInfo {
    pub current_version: String,
    pub latest_version: String,
    pub update_type: Option<UpdateType>,
    pub release_notes: String,
    pub release_date: DateTime<Utc>,
    pub is_force_update: bool,
}

/// 更新状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateStatus {
    Checking,
    Available,
    Downloading { progress: f64 },
    Installing,
    Completed,
    Failed(String),
}

/// 更新管理器
#[derive(Clone)]
pub struct UpdateManager {
    app_handle: AppHandle,
    update_server: String,
    current_version: String,
}

impl UpdateManager {
    pub fn new(app_handle: AppHandle, update_server: String, current_version: String) -> Self {
        Self {
            app_handle,
            update_server,
            current_version,
        }
    }

    /// 检查更新
    pub async fn check_for_updates(&self) -> Result<VersionInfo, Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();
        let response = client
            .get(&format!("{}/api/v1/check-updates", self.update_server))
            .query(&[("current_version", &self.current_version)])
            .query(&[("platform", "macos")])
            .query(&[("arch", "arm64")])
            .send()
            .await?;

        if response.status().is_success() {
            let version_info: VersionInfo = response.json().await?;
            Ok(version_info)
        } else {
            Err("Failed to check for updates".into())
        }
    }

    /// 执行热更新
    pub async fn apply_hotfix(&self, update_files: Vec<UpdateFile>) -> Result<(), Box<dyn std::error::Error>> {
        let window = self.app_handle.get_webview_window("main")
            .ok_or("Main window not found")?;

        // 发送更新状态
        self.emit_update_status(&window, UpdateStatus::Downloading { progress: 0.0 }).await?;

        let total_files = update_files.len() as f64;

        for (index, file) in update_files.iter().enumerate() {
            // 下载文件
            let client = reqwest::Client::new();
            let response = client.get(&file.url).send().await?;

            if !response.status().is_success() {
                return Err(format!("Failed to download file: {}", file.path).into());
            }

            let bytes = response.bytes().await?;

            // 验证文件哈希
            let hash = format!("{:x}", sha2::Sha256::digest(&bytes));
            if hash != file.hash {
                return Err(format!("Hash mismatch for file: {}", file.path).into());
            }

            // 计算更新路径
            let app_dir = self.app_handle.path().app_config_dir()?;
            let file_path = app_dir.join(&file.path);

            // 创建目录（如果不存在）
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)?;
            }

            // 写入文件
            fs::write(&file_path, bytes)?;

            // 更新进度
            let progress = (index as f64 + 1.0) / total_files * 100.0;
            self.emit_update_status(&window, UpdateStatus::Downloading { progress }).await?;
        }

        // 发送安装状态
        self.emit_update_status(&window, UpdateStatus::Installing).await?;

        // 应用热更新
        self.apply_hotfix_changes().await?;

        // 完成更新
        self.emit_update_status(&window, UpdateStatus::Completed).await?;

        Ok(())
    }

    /// 应用热更新变更
    async fn apply_hotfix_changes(&self) -> Result<(), Box<dyn std::error::Error>> {
        // 重启应用以应用更新
        let window = self.app_handle.get_webview_window("main")
            .ok_or("Main window not found")?;

        // 显示重启提示
        window.eval("window.showRestartPrompt = true")?;

        // 延迟重启
        tokio::spawn(async move {
            sleep(Duration::from_secs(3)).await;
            let _ = window.eval("window.location.reload()");
        });

        Ok(())
    }

    /// 下载大版本更新
    pub async fn download_major_update(&self, download_url: String, window: WebviewWindow) -> Result<PathBuf, Box<dyn std::error::Error>> {
        self.emit_update_status(&window, UpdateStatus::Downloading { progress: 0.0 }).await?;

        let client = reqwest::Client::new();
        let response = client.get(&download_url).send().await?;

        if !response.status().is_success() {
            return Err("Failed to download update".into());
        }

        let total_size = response.content_length().unwrap_or(0);
        let mut downloaded = 0u64;
        let mut stream = response.bytes_stream();

        // 创建临时文件
        let temp_dir = std::env::temp_dir();
        let update_file = temp_dir.join(format!("util-update-{}.dmg", chrono::Utc::now().timestamp()));
        let mut file = fs::File::create(&update_file)?;

        use futures_util::StreamExt;
        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            file.write_all(&chunk)?;
            downloaded += chunk.len() as u64;

            if total_size > 0 {
                let progress = (downloaded as f64 / total_size as f64) * 100.0;
                self.emit_update_status(&window, UpdateStatus::Downloading { progress }).await?;
            }
        }

        Ok(update_file)
    }

    /// 安装大版本更新
    pub async fn install_major_update(&self, update_file: PathBuf, window: WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
        self.emit_update_status(&window, UpdateStatus::Installing).await?;

        // 在 macOS 上，打开 DMG 文件
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;

            // 打开 DMG 文件
            Command::new("open")
                .arg(&update_file)
                .spawn()?;

            // 显示安装说明
            window.eval(r#"
                alert('更新已下载完成！\n\n请按照以下步骤安装新版本：\n1. 在弹出的 Finder 窗口中，将应用拖拽到 Applications 文件夹\n2. 等待安装完成\n3. 重新启动应用');
            "#)?;
        }

        Ok(())
    }

    /// 发送更新状态到前端
    async fn emit_update_status(&self, window: &WebviewWindow, status: UpdateStatus) -> Result<(), Box<dyn std::error::Error>> {
        window.emit("update-status", &status)?;
        Ok(())
    }

    /// 获取当前版本信息
    pub fn get_current_version(&self) -> String {
        self.current_version.clone()
    }

    /// 设置自动更新检查
    pub fn setup_auto_check(&self) {
        let app_handle = self.app_handle.clone();
        let update_server = self.update_server.clone();
        let current_version = self.current_version.clone();

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(3600)); // 每小时检查一次

            loop {
                interval.tick().await;

                if let Some(window) = app_handle.get_webview_window("main") {
                    match check_for_updates_impl(&update_server, &current_version).await {
                        Ok(version_info) => {
                            if version_info.latest_version != current_version {
                                let _ = window.emit("update-available", &version_info);
                            }
                        }
                        Err(_) => {
                            // 静默忽略错误
                        }
                    }
                }
            }
        });
    }
}

/// 独立的检查更新函数
async fn check_for_updates_impl(update_server: &str, current_version: &str) -> Result<VersionInfo, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get(&format!("{}/api/v1/check-updates", update_server))
        .query(&[("current_version", current_version)])
        .query(&[("platform", "macos")])
        .query(&[("arch", "arm64")])
        .send()
        .await?;

    if response.status().is_success() {
        let version_info: VersionInfo = response.json().await?;
        Ok(version_info)
    } else {
        Err("Failed to check for updates".into())
    }
}