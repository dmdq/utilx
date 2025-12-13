// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod updater;
mod update_config;
mod update_commands;
mod config_init;
mod config_commands;
mod menu_handler;

use tauri::Manager;
use std::time::Duration;
use std::sync::Mutex;
use tauri_plugin_notification::NotificationExt;

// 辅助函数：从 setup 获取 app handle
fn try_get_app_handle(app: &tauri::AppHandle) -> Option<tauri::AppHandle> {
    Some(app.clone())
}

// 嵌入配置文件到二进制文件中
static DEFAULT_SPLASH_CONFIG: &str = include_str!("../splash-config.json");
static DEFAULT_SPLASH_HTML: &str = include_str!("../splash.html");

// learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 接收前端日志信息
#[tauri::command]
fn log_message(message: String) {
    eprintln!("🌐 [前端日志] {}", message);
}

// 保存调试信息
#[tauri::command]
async fn save_debug_info(info: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    use std::fs;
    use std::path::PathBuf;

    // 获取应用数据目录
    let data_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;

    // 确保目录存在
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("无法创建调试目录: {}", e))?;

    // 生成文件名
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let file_path = data_dir.join(format!("debug_info_{}.json", timestamp));

    // 保存调试信息
    fs::write(&file_path, info)
        .map_err(|e| format!("无法保存调试信息: {}", e))?;

    eprintln!("💾 [调试] 调试信息已保存到: {:?}", file_path);
    Ok(format!("调试信息已保存到: {:?}", file_path))
}

// 打开外部链接
#[tauri::command]
fn open_external_link(url: String) -> Result<(), String> {
    eprintln!("🔗 [RUST] Opening external link: {}", url);

    // 使用系统命令打开浏览器，这在开发环境中更可靠
    use std::process::Command;

    let command = if cfg!(target_os = "macos") {
        // macOS 使用 open 命令
        vec!["open", &url]
    } else if cfg!(target_os = "windows") {
        // Windows 使用 start 命令
        vec!["cmd", "/c", "start", &url]
    } else {
        // Linux 使用 xdg-open
        vec!["xdg-open", &url]
    };

    match Command::new(&command[0]).args(&command[1..]).spawn() {
        Ok(_) => {
            eprintln!("🔗 [RUST] External link opened successfully using system command");
            Ok(())
        },
        Err(e) => {
            eprintln!("🔗 [RUST ERROR] Failed to open external link: {}", e);
            Err(format!("Failed to open URL: {}", e))
        }
    }
}

// 下载文件
#[tauri::command]
async fn download_file(url: String, filename: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    eprintln!("📥 [RUST] Starting download: {} -> {}", filename, url);

    let window = app_handle.get_webview_window("main")
        .ok_or_else(|| {
            eprintln!("📥 [RUST ERROR] Failed to get main window");
            "Failed to get main window".to_string()
        })?;

    // 获取下载目录
    eprintln!("📥 [RUST] Getting download directory...");
    let download_dir = window.path().download_dir()
        .map_err(|e| {
            eprintln!("📥 [RUST ERROR] Failed to get download directory: {}", e);
            format!("Failed to get download directory: {}", e)
        })?;

    let file_path = download_dir.join(&filename);
    eprintln!("📥 [RUST] Target path: {}", file_path.display());

    // 下载文件
    eprintln!("📥 [RUST] Fetching file from URL...");
    let response = reqwest::get(&url).await
        .map_err(|e| {
            eprintln!("📥 [RUST ERROR] Failed to fetch file: {}", e);
            format!("Failed to fetch file: {}", e)
        })?;

    eprintln!("📥 [RUST] Reading response bytes...");
    let bytes = response.bytes().await
        .map_err(|e| {
            eprintln!("📥 [RUST ERROR] Failed to read file: {}", e);
            format!("Failed to read file: {}", e)
        })?;

    eprintln!("📥 [RUST] Downloaded {} bytes", bytes.len());

    // 保存文件
    eprintln!("📥 [RUST] Saving file to disk...");
    std::fs::write(&file_path, bytes)
        .map_err(|e| {
            eprintln!("📥 [RUST ERROR] Failed to save file: {}", e);
            format!("Failed to save file: {}", e)
        })?;

    eprintln!("📥 [RUST] File saved successfully: {}", file_path.display());

    // 发送下载完成通知
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        match send_system_notification(
            "下载完成".to_string(),
            format!("文件 {} 已下载完成", filename),
            app_handle_clone
        ).await {
            Ok(_) => {
                eprintln!("📥 [RUST] Download completion notification sent");
            },
            Err(e) => {
                eprintln!("📥 [RUST ERROR] Failed to send download completion notification: {}", e);
            }
        }
    });

    Ok(format!("File downloaded to: {}", file_path.display()))
}

// 发送系统通知
#[tauri::command]
async fn send_system_notification(title: String, body: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    eprintln!("🔔 [RUST] Sending system notification: {} - {}", title, body);

    // 尝试使用 Tauri 的通知插件发送系统通知
    match app_handle.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show() {
        Ok(_) => {
            eprintln!("🔔 [RUST] System notification sent successfully");
            Ok(())
        },
        Err(e) => {
            eprintln!("🔔 [RUST ERROR] Failed to send system notification: {}", e);
            // 降级到请求用户注意力
            match app_handle.webview_windows().values().next() {
                Some(window) => {
                    match window.request_user_attention(Some(tauri::UserAttentionType::Critical)) {
                        Ok(_) => {
                            eprintln!("🔔 [RUST] User attention requested as fallback");
                            Ok(())
                        },
                        Err(attention_err) => {
                            eprintln!("🔔 [RUST ERROR] Failed to request user attention: {}", attention_err);
                            Err(format!("Failed to send notification and request attention: {}", e))
                        }
                    }
                },
                None => {
                    eprintln!("🔔 [RUST ERROR] No window available for attention request");
                    Err(format!("Failed to send notification: {}", e))
                }
            }
        }
    }
}

// 创建系统菜单
fn create_system_menu(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItem, Submenu};

    eprintln!("🔧 创建系统菜单...");

    // macOS 菜单栏设置
    #[cfg(target_os = "macos")]
    {
        // 创建主页菜单 - 作为子菜单
        let home_menu = Submenu::new(app_handle, "主页", true)?;
        let home_item = MenuItem::with_id(
            app_handle,
            "go_home",
            "返回首页",
            true,
            None::<&str>
        )?;
        let quit_item = MenuItem::with_id(
            app_handle,
            "quit_app",
            "退出程序",
            true,
            None::<&str>
        )?;
        home_menu.append(&home_item)?;
        home_menu.append(&quit_item)?;

        // 创建版本更新菜单项
        let check_updates_item = MenuItem::with_id(
            app_handle,
            "check_updates",
            "版本更新",
            true,
            None::<&str>
        )?;

        // 创建关于菜单项
        let about_item = MenuItem::with_id(
            app_handle,
            "show_about",
            "关于",
            true,
            None::<&str>
        )?;

        // 创建刷新菜单项
        let refresh_item = MenuItem::with_id(
            app_handle,
            "refresh_page",
            "刷新页面",
            true,
            None::<&str>
        )?;

        // 创建帮助菜单
        let help_menu = Submenu::new(app_handle, "帮助", true)?;
        help_menu.append(&check_updates_item)?;
        help_menu.append(&about_item)?;
        help_menu.append(&refresh_item)?;

        // 创建主菜单
        let menu = Menu::with_items(app_handle, &[
            &home_menu,
            &help_menu,
        ])?;

        // 设置菜单到应用
        app_handle.set_menu(menu)?;
    }

    // Windows/Linux 菜单栏设置
    #[cfg(not(target_os = "macos"))]
    {
        // 创建主页菜单
        let home_menu = Submenu::new(app_handle, "主页", true)?;
        let go_home_item = MenuItem::with_id(
            app_handle,
            "go_home",
            "返回首页",
            true,
            None::<&str>
        )?;
        let quit_item = MenuItem::with_id(
            app_handle,
            "quit_app",
            "退出程序",
            true,
            None::<&str>
        )?;
        home_menu.append(&go_home_item)?;
        home_menu.append(&quit_item)?;

        // 创建版本更新菜单项
        let check_updates_item = MenuItem::with_id(
            app_handle,
            "check_updates",
            "版本更新",
            true,
            None::<&str>
        )?;

        // 创建关于菜单项
        let about_item = MenuItem::with_id(
            app_handle,
            "show_about",
            "关于",
            true,
            None::<&str>
        )?;

        // 创建刷新菜单项
        let refresh_item = MenuItem::with_id(
            app_handle,
            "refresh_page",
            "刷新页面",
            true,
            None::<&str>
        )?;

        // 创建帮助菜单
        let help_menu = Submenu::new(app_handle, "帮助", true)?;
        help_menu.append(&check_updates_item)?;
        help_menu.append(&about_item)?;
        help_menu.append(&refresh_item)?;

        // 创建主菜单
        let menu = Menu::with_items(app_handle, &[
            &home_menu,
            &help_menu,
        ])?;

        // 设置菜单到应用
        app_handle.set_menu(menu)?;
    }

    Ok(())
}

// 退出程序命令
#[tauri::command]
async fn quit_app(app_handle: tauri::AppHandle) -> Result<(), String> {
    eprintln!("🚪 [RUST] 退出程序");
    app_handle.exit(0);
    Ok(())
}

// 菜单导航命令
#[tauri::command]
async fn navigate_to_page(app_handle: tauri::AppHandle, page: String) -> Result<(), String> {
    eprintln!("🧭 [RUST] 导航到页面: {}", page);

    if let Some(window) = app_handle.get_webview_window("main") {
        match page.as_str() {
            "home" => {
                let _ = window.eval("window.location.href = '/';");
            },
            "updates" => {
                let _ = window.eval("window.location.href = '/feedback/';");
            },
            "about" => {
                let _ = window.eval("window.location.href = '/about/';");
            },
            _ => {
                return Err(format!("未知页面: {}", page));
            }
        }
        Ok(())
    } else {
        Err("无法找到主窗口".to_string())
    }
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // 初始化应用配置
            if let Err(e) = config_init::initialize_app_config(app.handle()) {
                eprintln!("⚠️ 配置初始化失败: {}", e);
            }

            // 创建并设置系统菜单
            if let Err(e) = create_system_menu(app.handle()) {
                eprintln!("⚠️ 设置系统菜单失败: {}", e);
            } else {
                eprintln!("✅ 系统菜单设置成功");
            }

            // 注册菜单事件处理程序
            let app_handle = app.handle().clone();
            app.on_menu_event(move |_window, event| {
                eprintln!("📋 [菜单] 收到菜单事件: {:?}", event.id);
                menu_handler::handle_menu_event(&app_handle, &event.id);
            });

            // 读取启动画面配置文件 - 先尝试外部文件，失败则使用内置配置
            let current_dir = std::env::current_dir().unwrap();
            let config_path = current_dir.join("splash-config.json");

            let config_content = if config_path.exists() {
                match std::fs::read_to_string(&config_path) {
                    Ok(content) => {
                        eprintln!("📄 读取外部启动画面配置文件: {}", config_path.display());
                        content
                    },
                    Err(e) => {
                        eprintln!("⚠️ 无法读取外部配置文件: {}，使用内置配置", e);
                        DEFAULT_SPLASH_CONFIG.to_string()
                    }
                }
            } else {
                eprintln!("📄 使用内置启动画面配置");
                DEFAULT_SPLASH_CONFIG.to_string()
            };

            let config: serde_json::Value = serde_json::from_str(&config_content).unwrap_or_default();

            let is_dev = cfg!(debug_assertions);

            let splash_enabled = config.get("enabled")
                .and_then(|e| e.as_bool())
                .unwrap_or(true);

            let splash_duration = config.get("development")
                .and_then(|dev| dev.get("duration"))
                .or_else(|| config.get("duration"))
                .and_then(|d| d.as_u64())
                .unwrap_or(if is_dev { 3000 } else { 5000 });

            let wait_for_main = config.get("waitForMainPage")
                .and_then(|w| w.as_bool())
                .unwrap_or(true);

            let check_interval = config.get("development")
                .and_then(|dev| dev.get("checkInterval"))
                .or_else(|| config.get("checkInterval"))
                .and_then(|c| c.as_u64())
                .unwrap_or(if is_dev { 200 } else { 500 });

            let max_wait_time = config.get("development")
                .and_then(|dev| dev.get("maxWaitTime"))
                .or_else(|| config.get("maxWaitTime"))
                .and_then(|m| m.as_u64())
                .unwrap_or(if is_dev { 15000 } else { 30000 });

            // 读取启动画面窗口尺寸和居中设置
            let (splash_width, splash_height) = config.get("windowSize")
                .and_then(|ws| Some((
                    ws.get("width")?.as_u64()? as f64,
                    ws.get("height")?.as_u64()? as f64
                )))
                .unwrap_or((800.0, 600.0));

            let center_splash_window = config.get("centerWindow")
                .and_then(|c| c.as_bool())
                .unwrap_or(true);

            // 读取主窗口尺寸
            let (main_width, main_height) = config.get("mainWindowSize")
                .and_then(|ws| Some((
                    ws.get("width")?.as_u64()? as f64,
                    ws.get("height")?.as_u64()? as f64
                )))
                .unwrap_or((1400.0, 760.0));

            eprintln!("🎨 启动画面配置:");
            eprintln!("  启用: {}", splash_enabled);
            eprintln!("  持续时间: {}ms", splash_duration);
            eprintln!("  等待主页面: {}", wait_for_main);
            eprintln!("  检查间隔: {}ms", check_interval);
            eprintln!("  最大等待时间: {}ms", max_wait_time);
            eprintln!("  启动窗口尺寸: {}x{}", splash_width, splash_height);
            eprintln!("  主窗口尺寸: {}x{}", main_width, main_height);
            eprintln!("  窗口居中: {}", center_splash_window);
            eprintln!("  开发模式: {}", cfg!(debug_assertions));
            eprintln!("🚀 开始启动流程...");

            // 读取 splash.html 文件内容 - 先尝试外部文件，失败则使用内置文件
            let splash_html_content = {
                let splash_path = current_dir.join("splash.html");
                if splash_path.exists() {
                    match std::fs::read_to_string(&splash_path) {
                        Ok(content) => {
                            eprintln!("✅ 读取外部 splash.html，大小: {} 字符", content.len());
                            content
                        },
                        Err(e) => {
                            eprintln!("⚠️ 无法读取外部 splash.html: {}，使用内置文件", e);
                            DEFAULT_SPLASH_HTML.to_string()
                        }
                    }
                } else {
                    eprintln!("📄 使用内置 splash.html，大小: {} 字符", DEFAULT_SPLASH_HTML.len());
                    DEFAULT_SPLASH_HTML.to_string()
                }
            };

            eprintln!("🔍 调试信息:");
            eprintln!("当前工作目录: {}", current_dir.display());
            eprintln!("启动画面: {}", splash_enabled);
            eprintln!("splash.html 内容大小: {} 字符", splash_html_content.len());

            let window = app.get_webview_window("main")
                .expect("配置的 'main' 窗口不存在");

            // 如果启用了启动画面，先设置启动画面的尺寸
            if splash_enabled {
                // 设置启动画面窗口尺寸（先设置尺寸再居中）
                match window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: splash_width, height: splash_height })) {
                    Ok(_) => eprintln!("✅ 预设启动画面窗口尺寸为 {}x{}", splash_width, splash_height),
                    Err(e) => eprintln!("❌ 预设启动画面窗口尺寸失败: {}", e),
                }

                // 启动画面居中
                if center_splash_window {
                    match window.center() {
                        Ok(_) => eprintln!("✅ 启动画面窗口已居中"),
                        Err(e) => eprintln!("❌ 启动画面窗口居中失败: {}", e),
                    }
                }
            } else {
                // 如果没有启动画面，使用配置文件中的主窗口尺寸
                // 这里先不设置尺寸，让配置文件生效
            }

            // 如果启用了启动画面
            if splash_enabled {
                let splash_html = splash_html_content;

                // 立即设置页面内容，避免任何灰色背景
                let set_initial_content = format!(
                    "document.open(); document.write(`{}`); document.close();",
                    splash_html.replace('`', "\\`").replace("${", "\\${")
                );

                match window.eval(&set_initial_content) {
                    Ok(_) => {
                        eprintln!("✅ 立即设置页面内容，避免灰色背景");
                        eprintln!("启动画面已加载");
                    },
                    Err(e) => eprintln!("❌ 设置初始页面内容失败: {}", e),
                }

                // 启动时设置窗口属性（会在启动完成后恢复）
                // 启动画面不需要窗口装饰（尺寸和居中已在前面的代码中设置）
                window.set_decorations(false)?;
                window.set_resizable(false)?;
                window.set_always_on_top(true)?;

                eprintln!("🪟 窗口创建成功，启动画面已立即加载");

            } else {
                // 如果禁用启动画面，直接加载主应用
                eprintln!("📄 启动画面已禁用，直接加载主应用");
                window.set_decorations(true)?;
                window.set_resizable(true)?;
                window.set_always_on_top(false)?;
            }

            // 启动完成后的处理（使用配置文件中的参数）
            let window_clone_finish = window.clone();
            let splash_duration_clone = splash_duration;
            let wait_for_main_clone = wait_for_main;
            let check_interval_clone = check_interval;
            let max_wait_time_clone = max_wait_time;

            tokio::spawn(async move {
                eprintln!("⏱️ 开始{}ms启动动画计时", splash_duration_clone);

                // 等待配置的启动画面显示时间
                tokio::time::sleep(Duration::from_millis(splash_duration_clone)).await;

                eprintln!("🔄 凇查主页面状态...");

                // 恢复窗口装饰，然后切换到主应用页面
                eprintln!("🔄 恢复窗口装饰并切换到主应用页面");
                match window_clone_finish.set_decorations(true) {
                    Ok(_) => eprintln!("✅ 立即设置装饰成功"),
                    Err(e) => eprintln!("❌ 立即设置装饰失败: {}", e),
                }
                match window_clone_finish.set_resizable(true) {
                    Ok(_) => eprintln!("✅ 立即设置可调整大小成功"),
                    Err(e) => eprintln!("❌ 立即设置可调整大小失败: {}", e),
                }
                match window_clone_finish.set_always_on_top(false) {
                    Ok(_) => eprintln!("✅ 立即取消置顶成功"),
                    Err(e) => eprintln!("❌ 立即取消置顶失败: {}", e),
                }

                // 先调整窗口大小到主窗口尺寸，然后加载主页面
                eprintln!("📐 调整窗口到主窗口尺寸...");
                match window_clone_finish.set_size(tauri::Size::Logical(tauri::LogicalSize { width: main_width, height: main_height })) {
                    Ok(_) => eprintln!("✅ 调整窗口尺寸为 {}x{}", main_width, main_height),
                    Err(e) => eprintln!("❌ 调整窗口尺寸失败: {}", e),
                }

                // 尺寸改变后稍等片刻再居中窗口，确保尺寸变化完成
                tokio::time::sleep(Duration::from_millis(100)).await;
                match window_clone_finish.center() {
                    Ok(_) => eprintln!("✅ 窗口已重新居中"),
                    Err(e) => eprintln!("❌ 窗口重新居中失败: {}", e),
                }

                // 现在切换到主应用页面（窗口已经是正确尺寸）
                // 使用正确的 Tauri 方式导航页面，确保 Tauri API 正确注入
                match window_clone_finish.eval(r#"window.location.replace('/index.html')"#) {
                    Ok(_) => eprintln!("✅ 加载 Tauri API 测试页面"),
                    Err(e) => eprintln!("❌ 加载测试页面失败: {}", e),
                }

                // 如果配置要求等待主页面准备好，则进行等待
                let mut wait_time = 0;
                if wait_for_main_clone {
                    loop {
                        // 检查主页面是否准备就绪的 JavaScript 代码
                        let check_js = r#"
                            // 检查 Vue 应用是否已挂载
                            const appReady = document.querySelector('[data-v-app]') ||
                                          document.querySelector('#app') ||
                                          document.querySelector('.nuxt-loading') === null;

                            // 检查是否还有加载中的元素
                            const hasLoading = document.querySelector('.loading') ||
                                            document.querySelector('[class*="loading"]') ||
                                            document.querySelector('.nuxt-loading');

                            if (appReady && !hasLoading) {
                                'ready';
                            } else {
                                'loading';
                            }
                        "#;

                        match window_clone_finish.eval(check_js) {
                            Ok(result) => {
                                // 使用 format! 来显示结果
                                eprintln!("🔍 主页面检查结果: {:?}", result);
                                // 由于 eval 返回的是 ()，我们无法直接检查结果
                                // 假设页面还没有准备好，继续等待
                            },
                            Err(_) => {
                                // 如果检查失败，等待一段时间后继续
                                eprintln!("⚠️ 无法检查主页面状态，继续等待...");
                            }
                        }

                        // 检查是否超过最大等待时间
                        wait_time += check_interval_clone;
                        if wait_time >= max_wait_time_clone {
                            eprintln!("⚠️ 达到最大等待时间，强制切换");
                            break;
                        }

                        eprintln!("⏳ 主页面加载中... (已等待{}ms)", wait_time);
                        tokio::time::sleep(Duration::from_millis(check_interval_clone)).await;

                        // 简单策略：等待一段时间后假设页面已加载
                        if wait_time >= 2000 {  // 至少等待2秒
                            eprintln!("✅ 主页面已准备就绪（基于时间判断）");
                            break;
                        }
                    }
                }

                // 主窗口尺寸已经在前面设置，这里无需重复设置

                // 再次强制设置窗口装饰
                match window_clone_finish.set_decorations(true) {
                    Ok(_) => eprintln!("✅ 最终确认窗口装饰"),
                    Err(e) => eprintln!("❌ 最终确认窗口装饰失败: {}", e),
                }

                // 确保窗口可调整大小
                match window_clone_finish.set_resizable(true) {
                    Ok(_) => eprintln!("✅ 最终确认窗口可调整大小"),
                    Err(e) => eprintln!("❌ 最终确认窗口可调整大小失败: {}", e),
                }

                // 主页面加载完成后再次确保窗口居中
                match window_clone_finish.center() {
                    Ok(_) => eprintln!("✅ 最终确认窗口居中"),
                    Err(e) => eprintln!("❌ 最终确认窗口居中失败: {}", e),
                }

                // 设置焦点
                match window_clone_finish.set_focus() {
                    Ok(_) => eprintln!("✅ 设置焦点成功"),
                    Err(e) => eprintln!("❌ 设置焦点失败: {}", e),
                }

                eprintln!("🎉 启动流程完成 (总耗时: {}ms)", splash_duration_clone + wait_time);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            log_message,
            save_debug_info,
            open_external_link,
            download_file,
            send_system_notification,
            navigate_to_page,
            quit_app,
            update_commands::check_for_updates,
            update_commands::apply_hotfix_update,
            update_commands::download_major_update,
            update_commands::install_major_update,
            update_commands::get_current_version,
            update_commands::get_update_config,
            update_commands::update_update_config,
            update_commands::ignore_version,
            update_commands::get_update_history,
            update_commands::clear_update_history,
            update_commands::restart_app,
            update_commands::check_admin_privileges,
            update_commands::request_admin_restart,
            update_commands::get_update_progress,
            update_commands::cancel_update,
            config_commands::import_config,
            config_commands::export_config,
            config_commands::reset_config,
            config_commands::backup_config,
            config_commands::list_config_backups,
            config_commands::restore_config_backup,
            config_commands::get_user_settings,
            config_commands::save_user_settings,
            config_commands::get_tools_config,
            config_commands::save_tools_config,
            config_commands::clear_cache,
            config_commands::get_app_info,
            config_commands::get_config_dir,
            config_commands::get_cache_dir,
            config_commands::get_log_dir,
            config_commands::open_config_dir
        ])
        .manage(update_commands::UpdateManagerState(Mutex::new(None)))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}