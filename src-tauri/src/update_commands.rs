use crate::updater::{UpdateManager, UpdateStatus};
use crate::update_config::{UpdateConfig, UpdateHistory};
use tauri::{AppHandle, Manager, State, command};
use std::sync::Mutex;

/// 更新管理器状态
pub struct UpdateManagerState(pub Mutex<Option<UpdateManager>>);

/// 检查更新命令
#[command]
pub async fn check_for_updates(
    app_handle: AppHandle,
    update_manager: State<'_, UpdateManagerState>,
) -> Result<crate::updater::VersionInfo, String> {
    // 加载配置
    let config = UpdateConfig::load(&app_handle)
        .map_err(|e| format!("Failed to load update config: {}", e))?;

    // 保存更新服务器地址
    let update_server = config.update_server.clone();

    // 创建更新管理器
    let manager = UpdateManager::new(
        app_handle.clone(),
        update_server,
        env!("CARGO_PKG_VERSION").to_string(),
    );

    // 检查更新
    match manager.check_for_updates().await {
        Ok(version_info) => {
            // 更新最后检查时间
            let mut config = config;
            config.update_last_check_time();
            let _ = config.save(&app_handle);

            // 存储更新管理器
            let mut state = update_manager.0.lock().unwrap();
            *state = Some(manager);

            Ok(version_info)
        }
        Err(e) => Err(format!("Failed to check for updates: {}", e)),
    }
}

/// 应用热更新命令
#[command]
pub async fn apply_hotfix_update(
    update_files: Vec<crate::updater::UpdateFile>,
    update_manager: State<'_, UpdateManagerState>,
    _app_handle: AppHandle,
) -> Result<String, String> {
    // 先取出 UpdateManager，避免跨 await 持有锁
    let manager = {
        let manager_guard = update_manager.0.lock().unwrap();
        let manager = manager_guard.as_ref()
            .ok_or("Update manager not initialized")?;
        manager.clone()
    };

    match manager.apply_hotfix(update_files).await {
        Ok(_) => Ok("Hotfix update applied successfully".to_string()),
        Err(e) => Err(format!("Failed to apply hotfix update: {}", e)),
    }
}

/// 下载大版本更新命令
#[command]
pub async fn download_major_update(
    download_url: String,
    app_handle: AppHandle,
    update_manager: State<'_, UpdateManagerState>,
) -> Result<String, String> {
    let manager = {
        let guard = update_manager.0.lock().unwrap();
        guard.as_ref()
            .ok_or("Update manager not initialized")?
            .clone()
    };

    let window = app_handle.get_webview_window("main")
        .ok_or("Main window not found")?;

    match manager.download_major_update(download_url, window).await {
        Ok(update_file) => Ok(format!("Update downloaded to: {:?}", update_file)),
        Err(e) => Err(format!("Failed to download major update: {}", e)),
    }
}

/// 安装大版本更新命令
#[command]
pub async fn install_major_update(
    update_file_path: String,
    app_handle: AppHandle,
    update_manager: State<'_, UpdateManagerState>,
) -> Result<String, String> {
    let manager = {
        let guard = update_manager.0.lock().unwrap();
        guard.as_ref()
            .ok_or("Update manager not initialized")?
            .clone()
    };

    let window = app_handle.get_webview_window("main")
        .ok_or("Main window not found")?;

    let update_path = std::path::PathBuf::from(update_file_path);

    match manager.install_major_update(update_path, window).await {
        Ok(_) => Ok("Major update installation initiated".to_string()),
        Err(e) => Err(format!("Failed to install major update: {}", e)),
    }
}

/// 获取当前版本命令
#[command]
pub fn get_current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// 获取更新配置命令
#[command]
pub fn get_update_config(app_handle: AppHandle) -> Result<UpdateConfig, String> {
    UpdateConfig::load(&app_handle)
        .map_err(|e| format!("Failed to load update config: {}", e))
}

/// 更新配置命令
#[command]
pub fn update_update_config(
    app_handle: AppHandle,
    config: UpdateConfig,
) -> Result<String, String> {
    config.save(&app_handle)
        .map_err(|e| format!("Failed to save update config: {}", e))?;
    Ok("Update configuration saved successfully".to_string())
}

/// 忽略版本命令
#[command]
pub fn ignore_version(
    app_handle: AppHandle,
    version: String,
) -> Result<String, String> {
    let mut config = UpdateConfig::load(&app_handle)
        .map_err(|e| format!("Failed to load update config: {}", e))?;

    config.ignore_version(version.clone());
    config.save(&app_handle)
        .map_err(|e| format!("Failed to save update config: {}", e))?;

    Ok(format!("Version {} ignored", version))
}

/// 获取更新历史命令
#[command]
pub fn get_update_history(
    app_handle: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<crate::update_config::VersionHistory>, String> {
    let history = UpdateHistory::new(app_handle);
    let limit = limit.unwrap_or(10);
    history.get_recent_histories(limit)
        .map_err(|e| format!("Failed to load update history: {}", e))
}

/// 清理更新历史命令
#[command]
pub fn clear_update_history(app_handle: AppHandle) -> Result<String, String> {
    let history = UpdateHistory::new(app_handle);
    history.clear_histories()
        .map_err(|e| format!("Failed to clear update history: {}", e))?;
    Ok("Update history cleared successfully".to_string())
}

/// 重启应用命令
#[command]
pub fn restart_app(app_handle: AppHandle) -> Result<String, String> {
    app_handle.restart();
}

/// 检查是否为管理员权限（用于安装更新）
#[command]
pub fn check_admin_privileges() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let output = Command::new("id")
            .arg("-u")
            .output();

        match output {
            Ok(output) => {
                let uid_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                let uid: u32 = uid_str.parse().unwrap_or(1000);
                Ok(uid == 0)
            }
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(true) // 其他平台暂不处理
    }
}

/// 以管理员权限请求重启
#[command]
pub fn request_admin_restart() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let app_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get app path: {}", e))?;

        Command::new("osascript")
            .arg("-e")
            .arg(&format!(
                "do shell script \"open '{}'\" with administrator privileges",
                app_path.display()
            ))
            .spawn()
            .map_err(|e| format!("Failed to request admin restart: {}", e))?;

        Ok("Admin restart requested".to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok("Admin restart not supported on this platform".to_string())
    }
}

/// 获取更新进度命令
#[command]
pub async fn get_update_progress(
    _update_manager: State<'_, UpdateManagerState>,
) -> Result<Option<UpdateStatus>, String> {
    // 这里可以实现进度跟踪逻辑
    // 目前返回 None，表示没有进行中的更新
    Ok(None)
}

/// 取消更新命令
#[command]
pub async fn cancel_update(
    _update_manager: State<'_, UpdateManagerState>,
) -> Result<String, String> {
    // 这里可以实现取消逻辑
    // 比如设置一个取消标志，停止下载等
    Ok("Update cancelled".to_string())
}