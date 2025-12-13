// 菜单相关功能
use tauri::{AppHandle, Manager};

// 由于 Tauri v2 菜单 API 复杂，我们使用简化的方式
// 直接通过 JavaScript 注入来处理菜单操作

// 处理菜单事件
pub fn handle_menu_event(app_handle: &AppHandle, event_id: &tauri::menu::MenuId) {
    match event_id.as_ref() {
        "go_home" => {
            eprintln!("🏠 [菜单] 强制返回首页");
            if let Some(window) = app_handle.get_webview_window("main") {
                // 强制返回首页，无论当前在哪个页面（包括外部链接）
                let _ = window.eval(r#"
                    // 强制返回首页的 JavaScript 代码
                    console.log('🏠 [MENU] 强制返回首页');
                    console.log('当前 URL:', window.location.href);
                    console.log('当前 hostname:', window.location.hostname);
                    console.log('当前 protocol:', window.location.protocol);

                    // 尝试多种方法返回首页
                    try {
                        // 检查是否在外部链接或不同协议
                        const isExternal = window.location.protocol !== 'tauri:' &&
                                          (window.location.hostname !== 'localhost' &&
                                           window.location.hostname !== '127.0.0.1' &&
                                           !window.location.hostname.includes('tauri.localhost'));

                        console.log('是否为外部链接:', isExternal);

                        if (isExternal) {
                            // 如果是外部链接，尝试返回到应用首页
                            console.log('检测到外部链接，尝试返回应用首页');

                            // 方法1: 尝试回到历史记录中的首页
                            if (window.history.length > 1) {
                                window.history.go(-(window.history.length - 1));
                            }

                            // 方法2: 延迟跳转到首页
                            setTimeout(() => {
                                console.log('延迟检查，仍在尝试返回首页');
                                window.location.href = '/';
                            }, 200);

                        } else {
                            // 如果在应用内，直接返回首页
                            console.log('在应用内，返回首页');
                            window.location.href = '/';
                        }

                        // 方法3: 清除历史记录
                        if (window.history.length > 1) {
                            window.history.replaceState({}, '', '/');
                        }

                    } catch (error) {
                        console.error('返回首页时出错:', error);
                        // 最后的备用方案
                        try {
                            window.location.href = '/';
                        } catch (e) {
                            console.error('备用方案也失败:', e);
                            // 强制刷新页面
                            window.location.reload();
                        }
                    }
                "#);
            }
        },
        "check_updates" => {
            eprintln!("🔄 [菜单] 版本更新");
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.eval("window.location.href = '/feedback/';");
            }
        },
        "show_about" => {
            eprintln!("ℹ️ [菜单] 关于");
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.eval("window.location.href = '/about/';");
            }
        },
        "refresh_page" => {
            eprintln!("🔄 [菜单] 刷新页面");
            if let Some(window) = app_handle.get_webview_window("main") {
                // 使用 Tauri 的刷新方法，并添加备用方案
                let _ = window.eval(r#"
                    console.log('🔄 [MENU] 刷新当前页面');
                    try {
                        // 方法1: 使用 location.reload() 强制刷新
                        window.location.reload(true);
                    } catch (error) {
                        console.error('刷新页面时出错:', error);
                        // 方法2: 重新导航到当前页面
                        window.location.href = window.location.href;
                    }
                "#);
            }
        },
        "quit_app" => {
            eprintln!("🚪 [菜单] 退出程序");
            // 使用 Tauri 的退出方法
            std::process::exit(0);
        },
        _ => {
            eprintln!("❓ [菜单] 未知菜单事件: {:?}", event_id);
        }
    }
}