use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};

/// 更新配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfig {
    /// 是否启用自动检查更新
    pub auto_check_enabled: bool,
    /// 检查更新间隔（小时）
    pub check_interval_hours: u32,
    /// 是否自动下载小版本更新
    pub auto_download_hotfix: bool,
    /// 是否自动安装小版本更新
    pub auto_install_hotfix: bool,
    /// 更新服务器地址
    pub update_server: String,
    /// 当前频道（stable, beta, dev）
    pub release_channel: String,
    /// 最后检查更新时间
    pub last_check_time: Option<chrono::DateTime<chrono::Utc>>,
    /// 忽略的版本列表
    pub ignored_versions: Vec<String>,
}

impl Default for UpdateConfig {
    fn default() -> Self {
        // 使用内置的默认配置
        const DEFAULT_CONFIG: &str = include_str!("../update-config.json");
        serde_json::from_str(DEFAULT_CONFIG).unwrap_or_else(|_| {
            Self {
                auto_check_enabled: true,
                check_interval_hours: 24,
                auto_download_hotfix: true,
                auto_install_hotfix: false,
                update_server: "http://localhost:3001".to_string(), // 开发环境使用本地服务器
                release_channel: "stable".to_string(),
                last_check_time: None,
                ignored_versions: Vec::new(),
            }
        })
    }
}

impl UpdateConfig {
    /// 从文件加载配置
    pub fn load(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let config_dir = app_handle.path().app_config_dir()?;
        let config_path = config_dir.join("update-config.json");

        if config_path.exists() {
            let content = fs::read_to_string(&config_path)?;
            let config: UpdateConfig = serde_json::from_str(&content)?;
            Ok(config)
        } else {
            // 如果配置文件不存在，创建默认配置
            let config = UpdateConfig::default();
            config.save(app_handle)?;
            Ok(config)
        }
    }

    /// 保存配置到文件
    pub fn save(&self, app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        let config_dir = app_handle.path().app_config_dir()?;
        fs::create_dir_all(&config_dir)?;

        let config_path = config_dir.join("update-config.json");
        let content = serde_json::to_string_pretty(self)?;
        fs::write(&config_path, content)?;

        Ok(())
    }

    /// 更新最后检查时间
    pub fn update_last_check_time(&mut self) {
        self.last_check_time = Some(chrono::Utc::now());
    }

    /// 添加忽略的版本
    pub fn ignore_version(&mut self, version: String) {
        if !self.ignored_versions.contains(&version) {
            self.ignored_versions.push(version);
        }
    }

    /// 检查版本是否被忽略
    pub fn is_version_ignored(&self, version: &str) -> bool {
        self.ignored_versions.contains(&version.to_string())
    }

    /// 移除忽略的版本
    pub fn unignore_version(&mut self, version: &str) {
        self.ignored_versions.retain(|v| v != version);
    }

    /// 清理所有忽略的版本
    pub fn clear_ignored_versions(&mut self) {
        self.ignored_versions.clear();
    }
}

/// 版本历史记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionHistory {
    pub version: String,
    pub update_type: String, // "hotfix" 或 "major"
    pub installed_at: chrono::DateTime<chrono::Utc>,
    pub success: bool,
    pub error_message: Option<String>,
}

/// 更新历史管理器
pub struct UpdateHistory {
    app_handle: AppHandle,
}

impl UpdateHistory {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// 记录更新历史
    pub fn record_update(&self, version: String, update_type: String, success: bool, error_message: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        let history = VersionHistory {
            version,
            update_type,
            installed_at: chrono::Utc::now(),
            success,
            error_message,
        };

        let mut histories = self.load_histories()?;
        histories.push(history);

        // 只保留最近50条记录
        if histories.len() > 50 {
            histories = histories.split_off(histories.len() - 50);
        }

        self.save_histories(&histories)?;
        Ok(())
    }

    /// 加载更新历史
    pub fn load_histories(&self) -> Result<Vec<VersionHistory>, Box<dyn std::error::Error>> {
        let config_dir = self.app_handle.path().app_config_dir()?;
        let history_path = config_dir.join("update-history.json");

        if history_path.exists() {
            let content = fs::read_to_string(&history_path)?;
            let histories: Vec<VersionHistory> = serde_json::from_str(&content)?;
            Ok(histories)
        } else {
            Ok(Vec::new())
        }
    }

    /// 保存更新历史
    fn save_histories(&self, histories: &[VersionHistory]) -> Result<(), Box<dyn std::error::Error>> {
        let config_dir = self.app_handle.path().app_config_dir()?;
        let history_path = config_dir.join("update-history.json");
        let content = serde_json::to_string_pretty(histories)?;
        fs::write(&history_path, content)?;
        Ok(())
    }

    /// 获取最近的更新历史
    pub fn get_recent_histories(&self, limit: usize) -> Result<Vec<VersionHistory>, Box<dyn std::error::Error>> {
        let mut histories = self.load_histories()?;
        histories.sort_by(|a, b| b.installed_at.cmp(&a.installed_at));
        Ok(histories.into_iter().take(limit).collect())
    }

    /// 清理更新历史
    pub fn clear_histories(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_dir = self.app_handle.path().app_config_dir()?;
        let history_path = config_dir.join("update-history.json");
        if history_path.exists() {
            fs::remove_file(&history_path)?;
        }
        Ok(())
    }
}