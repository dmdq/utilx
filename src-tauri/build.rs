fn main() {
    // 当配置文件改变时重新构建
    println!("cargo:rerun-if-changed=splash.html");
    println!("cargo:rerun-if-changed=splash-config.json");

    // 生成构建信息
    vergen::EmitBuilder::builder()
        .all_build()
        .all_git()
        .git_sha(true)
        .git_commit_timestamp()
        .all_rustc()
        .emit()
        .expect("Unable to generate build info");

    tauri_build::build()
}