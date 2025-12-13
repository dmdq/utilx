use tauri::{AppHandle, command, Manager};

/// 导入配置
#[command]
pub async fn import_config(app_handle: AppHandle, import_path: String) -> Result<String, String> {
    match crate::config_init::import_config(&app_handle, &import_path) {
        Ok(_) => Ok("配置导入成功".to_string()),
        Err(e) => Err(format!("导入配置失败: {}", e)),
    }
}

/// 导出配置
#[command]
pub async fn export_config(app_handle: AppHandle, export_path: String) -> Result<String, String> {
    match crate::config_init::export_config(&app_handle, &export_path) {
        Ok(_) => Ok("配置导出成功".to_string()),
        Err(e) => Err(format!("导出配置失败: {}", e)),
    }
}

/// 重置配置
#[command]
pub async fn reset_config(app_handle: AppHandle) -> Result<String, String> {
    match crate::config_init::reset_all_configs(&app_handle) {
        Ok(_) => Ok("配置已重置为默认值".to_string()),
        Err(e) => Err(format!("重置配置失败: {}", e)),
    }
}

/// 备份配置
#[command]
pub async fn backup_config(app_handle: AppHandle) -> Result<String, String> {
    match crate::config_init::backup_config(&app_handle) {
        Ok(_) => Ok("配置备份成功".to_string()),
        Err(e) => Err(format!("备份配置失败: {}", e)),
    }
}

/// 列出配置备份
#[command]
pub async fn list_config_backups(app_handle: AppHandle) -> Result<Vec<String>, String> {
    match crate::config_init::list_config_backups(&app_handle) {
        Ok(backups) => Ok(backups),
        Err(e) => Err(format!("获取备份列表失败: {}", e)),
    }
}

/// 恢复配置备份
#[command]
pub async fn restore_config_backup(app_handle: AppHandle, backup_name: String) -> Result<String, String> {
    // 从备份名称中提取实际文件夹名
    let actual_backup_name = if backup_name.contains(" (") {
        backup_name.split(" (").next().unwrap_or(&backup_name)
    } else {
        &backup_name
    };

    match crate::config_init::restore_config_backup(&app_handle, actual_backup_name) {
        Ok(_) => Ok("配置备份恢复成功".to_string()),
        Err(e) => Err(format!("恢复备份失败: {}", e)),
    }
}

/// 获取用户设置
#[command]
pub async fn get_user_settings(app_handle: AppHandle) -> Result<serde_json::Value, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    let settings_path = config_dir.join("user-settings.json");

    if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)
            .map_err(|e| format!("读取设置文件失败: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("解析设置文件失败: {}", e))
    } else {
        // 返回默认设置
        Ok(serde_json::json!({
            "theme": "auto",
            "language": "zh-CN",
            "auto_start": false,
            "minimize_to_tray": true,
            "show_notifications": true,
            "window_settings": {
                "remember_size": true,
                "remember_position": true
            },
            "tools": {
                "remember_last_used": true,
                "favorites": []
            }
        }))
    }
}

/// 保存用户设置
#[command]
pub async fn save_user_settings(app_handle: AppHandle, settings: serde_json::Value) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    let settings_path = config_dir.join("user-settings.json");

    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("序列化设置失败: {}", e))?;

    std::fs::write(&settings_path, content)
        .map_err(|e| format!("写入设置文件失败: {}", e))?;

    Ok("用户设置已保存".to_string())
}

/// 获取工具配置
#[command]
pub async fn get_tools_config(app_handle: AppHandle) -> Result<serde_json::Value, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    let config_path = config_dir.join("tools-config.json");

    if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("读取工具配置失败: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("解析工具配置失败: {}", e))
    } else {
        // 返回默认配置
        Ok(serde_json::json!({
            "port_checker": {
                "default_ports": [80, 443, 8080, 3000, 5000],
                "timeout": 5000
            },
            "whois_lookup": {
                "default_servers": ["whois.verisign-grs.com", "whois.crsnic.net"],
                "timeout": 10000
            },
            "qr_code": {
                "default_size": 200,
                "error_correction": "M",
                "default_format": "png"
            }
        }))
    }
}

/// 保存工具配置
#[command]
pub async fn save_tools_config(app_handle: AppHandle, config: serde_json::Value) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    let config_path = config_dir.join("tools-config.json");

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化工具配置失败: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("写入工具配置失败: {}", e))?;

    Ok("工具配置已保存".to_string())
}

/// 清理缓存
#[command]
pub async fn clear_cache(app_handle: AppHandle) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    let cache_dir = config_dir.join("cache");

    if cache_dir.exists() {
        std::fs::remove_dir_all(&cache_dir)
            .map_err(|e| format!("删除缓存目录失败: {}", e))?;

        // 重新创建缓存目录
        std::fs::create_dir_all(&cache_dir)
            .map_err(|e| format!("创建缓存目录失败: {}", e))?;
    }

    Ok("缓存已清理".to_string())
}

/// 获取应用信息
#[command]
pub async fn get_app_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "version": option_env!("CARGO_PKG_VERSION").unwrap_or("unknown"),
        "name": option_env!("CARGO_PKG_NAME").unwrap_or("utilx"),
        "description": option_env!("CARGO_PKG_DESCRIPTION").unwrap_or("开发者效率工具箱"),
        "authors": option_env!("CARGO_PKG_AUTHORS").unwrap_or("util.cn"),
        "build_date": option_env!("VERGEN_BUILD_DATE").unwrap_or("unknown"),
        "build_time": option_env!("VERGEN_BUILD_TIMESTAMP").unwrap_or("unknown"),
        "git_commit": option_env!("VERGEN_GIT_SHA").unwrap_or("unknown"),
        "git_commit_timestamp": option_env!("VERGEN_GIT_COMMIT_TIMESTAMP").unwrap_or("unknown"),
        "rust_version": option_env!("VERGEN_RUSTC_SEMVER").unwrap_or("unknown")
    }))
}

/// 获取配置目录路径
#[command]
pub async fn get_config_dir(app_handle: AppHandle) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    Ok(config_dir.to_string_lossy().to_string())
}

/// 获取缓存目录路径
#[command]
pub async fn get_cache_dir(app_handle: AppHandle) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    let cache_dir = config_dir.join("cache");

    if !cache_dir.exists() {
        std::fs::create_dir_all(&cache_dir)
            .map_err(|e| format!("创建缓存目录失败: {}", e))?;
    }

    Ok(cache_dir.to_string_lossy().to_string())
}

/// 获取日志目录路径
#[command]
pub async fn get_log_dir(app_handle: AppHandle) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    let log_dir = config_dir.join("logs");

    if !log_dir.exists() {
        std::fs::create_dir_all(&log_dir)
            .map_err(|e| format!("创建日志目录失败: {}", e))?;
    }

    Ok(log_dir.to_string_lossy().to_string())
}

/// 打开配置目录
#[command]
pub async fn open_config_dir(app_handle: AppHandle) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&config_dir)
            .spawn()
            .map_err(|e| format!("打开配置目录失败: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&config_dir)
            .spawn()
            .map_err(|e| format!("打开配置目录失败: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&config_dir)
            .spawn()
            .map_err(|e| format!("打开配置目录失败: {}", e))?;
    }

    Ok("配置目录已打开".to_string())
}