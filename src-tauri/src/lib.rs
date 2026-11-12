use serde::Serialize;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

#[derive(Serialize)]
pub struct FilePayload {
    pub path: String,
    pub title: String,
    pub content: String,
    pub mtime: u64,
}

fn get_mtime_secs(p: &Path) -> u64 {
    fs::metadata(p)
        .and_then(|m| m.modified())
        .map(|t| t.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs())
        .unwrap_or(0)
}

#[tauri::command]
fn read_markdown_file(path: String) -> Result<FilePayload, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    let content = fs::read_to_string(p).map_err(|e| e.to_string())?;
    let title = p
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled.md")
        .to_string();
    let mtime = get_mtime_secs(p);

    Ok(FilePayload {
        path,
        title,
        content,
        mtime,
    })
}

#[tauri::command]
fn write_markdown_file(path: String, content: String) -> Result<u64, String> {
    let p = Path::new(&path);
    if let Some(parent) = p.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    fs::write(p, content).map_err(|e| e.to_string())?;
    let mtime = get_mtime_secs(p);
    Ok(mtime)
}

#[tauri::command]
fn rename_markdown_file(old_path: String, new_name: String) -> Result<String, String> {
    let old_p = Path::new(&old_path);
    if !old_p.exists() {
        return Err(format!("File does not exist: {}", old_path));
    }
    let parent = old_p.parent().unwrap_or_else(|| Path::new("."));
    let new_p = parent.join(&new_name);
    fs::rename(old_p, &new_p).map_err(|e| e.to_string())?;
    Ok(new_p.to_string_lossy().to_string())
}

#[tauri::command]
fn get_file_mtime(path: String) -> Result<u64, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    Ok(get_mtime_secs(p))
}

#[tauri::command]
fn get_cli_file_args() -> Vec<String> {
    let mut files = Vec::new();
    let args: Vec<String> = std::env::args().skip(1).collect();
    for arg in args {
        if !arg.starts_with('-') {
            let p = Path::new(&arg);
            if p.exists() {
                if let Ok(canonical) = p.canonicalize() {
                    files.push(canonical.to_string_lossy().to_string());
                } else {
                    files.push(arg);
                }
            }
        }
    }
    files
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_markdown_file,
            write_markdown_file,
            rename_markdown_file,
            get_file_mtime,
            get_cli_file_args
        ])
        .run(tauri::generate_context!())
        .expect("error while running adwaid-view");
}
