use crate::update_config::UpdateConfig;
use tauri::{AppHandle, Manager};
use std::fs;

/// 初始化应用配置
pub fn initialize_app_config(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    println!("🔧 初始化应用配置...");

    // 确保配置目录存在
    let config_dir = app_handle.path().app_config_dir()?;
    fs::create_dir_all(&config_dir)?;
    println!("✅ 配置目录已创建: {}", config_dir.display());

    // 初始化更新配置
    initialize_update_config(app_handle)?;

    // 初始化其他配置文件
    initialize_other_configs(app_handle)?;

    println!("🎉 应用配置初始化完成");
    Ok(())
}

/// 初始化更新配置
fn initialize_update_config(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let config_path = app_handle.path().app_config_dir()?.join("update-config.json");

    if !config_path.exists() {
        println!("📝 创建默认更新配置...");

        // 从内置的默认配置创建配置文件
        let default_config = UpdateConfig::default();
        default_config.save(app_handle)?;

        println!("✅ 默认更新配置已创建");
    } else {
        println!("✅ 更新配置已存在");
    }

    Ok(())
}

/// 初始化其他配置文件
fn initialize_other_configs(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let config_dir = app_handle.path().app_config_dir()?;

    // 创建用户设置配置
    let user_settings_path = config_dir.join("user-settings.json");
    if !user_settings_path.exists() {
        let default_settings = serde_json::json!({
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
        });

        fs::write(&user_settings_path, serde_json::to_string_pretty(&default_settings)?)?;
        println!("✅ 用户设置配置已创建");
    }

    // 创建工具配置
    let tools_config_path = config_dir.join("tools-config.json");
    if !tools_config_path.exists() {
        let default_tools_config = serde_json::json!({
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
        });

        fs::write(&tools_config_path, serde_json::to_string_pretty(&default_tools_config)?)?;
        println!("✅ 工具配置已创建");
    }

    // 创建缓存目录
    let cache_dir = config_dir.join("cache");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir)?;
        println!("✅ 缓存目录已创建");
    }

    // 创建日志目录
    let log_dir = config_dir.join("logs");
    if !log_dir.exists() {
        fs::create_dir_all(&log_dir)?;
        println!("✅ 日志目录已创建");
    }

    // 创建更新缓存目录
    let update_cache_dir = config_dir.join("updates");
    if !update_cache_dir.exists() {
        fs::create_dir_all(&update_cache_dir)?;
        println!("✅ 更新缓存目录已创建");
    }

    Ok(())
}

/// 创建配置文件的备份
pub fn backup_config(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let config_dir = app_handle.path().app_config_dir()?;
    let backup_dir = config_dir.join("backups");
    fs::create_dir_all(&backup_dir)?;

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("config_backup_{}", timestamp);

    // 需要备份的配置文件列表
    let config_files = vec![
        "update-config.json",
        "user-settings.json",
        "tools-config.json",
        "update-history.json"
    ];

    for file in config_files {
        let source_path = config_dir.join(file);
        if source_path.exists() {
            let backup_path = backup_dir.join(&backup_name).join(file);
            if let Some(parent) = backup_path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(&source_path, &backup_path)?;
            println!("✅ 配置文件已备份: {}", file);
        }
    }

    // 清理旧备份（保留最近10个）
    cleanup_old_backups(&backup_dir, 10)?;

    println!("✅ 配置备份完成: {}", backup_name);
    Ok(())
}

/// 清理旧的备份文件
fn cleanup_old_backups(backup_dir: &std::path::Path, keep_count: usize) -> Result<(), Box<dyn std::error::Error>> {
    if !backup_dir.exists() {
        return Ok(());
    }

    let mut backups = Vec::new();
    for entry in fs::read_dir(backup_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("config_backup_") {
                    backups.push(path);
                }
            }
        }
    }

    // 按修改时间排序
    backups.sort_by(|a, b| {
        let a_time = fs::metadata(a).and_then(|m| m.modified()).unwrap_or(std::time::UNIX_EPOCH);
        let b_time = fs::metadata(b).and_then(|m| m.modified()).unwrap_or(std::time::UNIX_EPOCH);
        b_time.cmp(&a_time)
    });

    // 删除超过保留数量的备份
    for backup in backups.iter().skip(keep_count) {
        fs::remove_dir_all(backup)?;
        println!("🗑️ 已删除旧备份: {}", backup.file_name().unwrap().to_str().unwrap());
    }

    Ok(())
}

/// 恢复配置备份
pub fn restore_config_backup(app_handle: &AppHandle, backup_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    let config_dir = app_handle.path().app_config_dir()?;
    let backup_dir = config_dir.join("backups").join(backup_name);

    if !backup_dir.exists() {
        return Err(format!("备份不存在: {}", backup_name).into());
    }

    // 需要恢复的配置文件列表
    let config_files = vec![
        "update-config.json",
        "user-settings.json",
        "tools-config.json",
        "update-history.json"
    ];

    for file in config_files {
        let backup_path = backup_dir.join(file);
        if backup_path.exists() {
            let target_path = config_dir.join(file);
            fs::copy(&backup_path, &target_path)?;
            println!("✅ 配置文件已恢复: {}", file);
        }
    }

    println!("✅ 配置备份已恢复: {}", backup_name);
    Ok(())
}

/// 列出所有备份
pub fn list_config_backups(app_handle: &AppHandle) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let config_dir = app_handle.path().app_config_dir()?;
    let backup_dir = config_dir.join("backups");

    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = Vec::new();
    for entry in fs::read_dir(backup_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("config_backup_") {
                    // 提取时间戳并格式化
                    if let Some(timestamp) = name.strip_prefix("config_backup_") {
                        if let Ok(parsed) = chrono::NaiveDateTime::parse_from_str(timestamp, "%Y%m%d_%H%M%S") {
                            let formatted = format!("{} ({})",
                                timestamp,
                                parsed.format("%Y-%m-%d %H:%M:%S")
                            );
                            backups.push(formatted);
                        } else {
                            backups.push(name.to_string());
                        }
                    }
                }
            }
        }
    }

    // 按时间倒序排序
    backups.sort_by(|a, b| b.cmp(a));
    Ok(backups)
}

/// 重置所有配置到默认值
pub fn reset_all_configs(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    println!("⚠️ 重置所有配置到默认值...");

    // 先备份当前配置
    backup_config(app_handle)?;

    let config_dir = app_handle.path().app_config_dir()?;

    // 删除现有配置文件
    let config_files = vec![
        "update-config.json",
        "user-settings.json",
        "tools-config.json"
    ];

    for file in config_files {
        let file_path = config_dir.join(file);
        if file_path.exists() {
            fs::remove_file(&file_path)?;
            println!("🗑️ 已删除配置文件: {}", file);
        }
    }

    // 重新初始化配置
    initialize_update_config(app_handle)?;
    initialize_other_configs(app_handle)?;

    println!("✅ 所有配置已重置为默认值");
    Ok(())
}

/// 导出配置
pub fn export_config(app_handle: &AppHandle, export_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let config_dir = app_handle.path().app_config_dir()?;
    let export_file = std::path::Path::new(export_path);

    // 创建配置归档
    use std::fs::File;
    use std::io::Write;

    let mut export_data = serde_json::Map::new();

    // 导出更新配置
    let update_config_path = config_dir.join("update-config.json");
    if update_config_path.exists() {
        let content = fs::read_to_string(&update_config_path)?;
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
            export_data.insert("update_config".to_string(), config);
        }
    }

    // 导出用户设置
    let user_settings_path = config_dir.join("user-settings.json");
    if user_settings_path.exists() {
        let content = fs::read_to_string(&user_settings_path)?;
        if let Ok(settings) = serde_json::from_str::<serde_json::Value>(&content) {
            export_data.insert("user_settings".to_string(), settings);
        }
    }

    // 导出工具配置
    let tools_config_path = config_dir.join("tools-config.json");
    if tools_config_path.exists() {
        let content = fs::read_to_string(&tools_config_path)?;
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
            export_data.insert("tools_config".to_string(), config);
        }
    }

    // 添加元数据
    export_data.insert("export_version".to_string(), serde_json::Value::String("1.0".to_string()));
    export_data.insert("export_time".to_string(), serde_json::Value::String(chrono::Utc::now().to_rfc3339()));
    export_data.insert("app_version".to_string(), serde_json::Value::String(env!("CARGO_PKG_VERSION").to_string()));

    // 写入导出文件
    let mut file = File::create(export_file)?;
    file.write_all(serde_json::to_string_pretty(&export_data)?.as_bytes())?;

    println!("✅ 配置已导出到: {}", export_path);
    Ok(())
}

/// 导入配置
pub fn import_config(app_handle: &AppHandle, import_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("📥 导入配置: {}", import_path);

    // 先备份当前配置
    backup_config(app_handle)?;

    let import_data: serde_json::Value = serde_json::from_str(&fs::read_to_string(import_path)?)?;
    let config_dir = app_handle.path().app_config_dir()?;

    // 导入更新配置
    if let Some(update_config) = import_data.get("update_config") {
        let update_config_path = config_dir.join("update-config.json");
        fs::write(&update_config_path, serde_json::to_string_pretty(update_config)?)?;
        println!("✅ 更新配置已导入");
    }

    // 导入用户设置
    if let Some(user_settings) = import_data.get("user_settings") {
        let user_settings_path = config_dir.join("user-settings.json");
        fs::write(&user_settings_path, serde_json::to_string_pretty(user_settings)?)?;
        println!("✅ 用户设置已导入");
    }

    // 导入工具配置
    if let Some(tools_config) = import_data.get("tools_config") {
        let tools_config_path = config_dir.join("tools-config.json");
        fs::write(&tools_config_path, serde_json::to_string_pretty(tools_config)?)?;
        println!("✅ 工具配置已导入");
    }

    println!("🎉 配置导入完成");
    Ok(())
}