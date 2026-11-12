// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // WebKitGTK / Wayland stability fallback for Fedora 45 Mesa/NVIDIA drivers if necessary
    if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
        // Retain default unless user explicitly sets the environment variable
    }

    adwaid_view_lib::run();
}
