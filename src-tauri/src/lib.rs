use std::process::Command;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn codex_request(
    prompt: String,
    context: Option<String>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
) -> Result<String, String> {
    // Build the full prompt with context if provided
    let full_prompt = if let Some(ctx) = context {
        format!("{}\n\n{}", ctx, prompt)
    } else {
        prompt
    };

    // Call Codex CLI with the prompt
    // Use 'codex exec' for non-interactive execution
    let mut cmd = Command::new("codex");
    cmd.arg("exec");
    cmd.arg("--model").arg("gpt-5.2");
    cmd.arg("--skip-git-repo-check");  // Allow execution outside git repos

    // Add the prompt as the last positional argument
    cmd.arg(&full_prompt);

    // Execute and capture output
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute Codex CLI: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Codex CLI error: {}", error));
    }

    let response = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse Codex output: {}", e))?;

    Ok(response.trim().to_string())
}

#[tauri::command]
async fn codex_improve_text(text: String) -> Result<String, String> {
    codex_request(
        format!("다음 텍스트를 더 나은 문장으로 개선해주세요. 원래의 의미와 톤은 유지하되, 문법과 표현을 향상시켜주세요:\n\n{}", text),
        None,
        Some(1024),
        None,
    ).await
}

#[tauri::command]
async fn codex_continue_story(context: String) -> Result<String, String> {
    codex_request(
        "이야기를 자연스럽게 이어서 작성해주세요.".to_string(),
        Some(context),
        Some(2048),
        Some(0.8),
    ).await
}

#[tauri::command]
async fn codex_analyze_story(text: String) -> Result<String, String> {
    codex_request(
        format!("다음 스토리를 분석하고 캐릭터, 플롯, 구조에 대한 피드백을 제공해주세요:\n\n{}", text),
        None,
        Some(2048),
        None,
    ).await
}

#[tauri::command]
fn check_codex_installed() -> Result<bool, String> {
    match Command::new("codex").arg("--version").output() {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn codex_generate_image(
    prompt: String,
    size: String,
) -> Result<String, String> {
    // Use Codex CLI to generate image via OpenAI DALL-E 3
    // Codex has access to authenticated OpenAI APIs
    let image_prompt = format!(
        "Please generate an image using DALL-E 3 with the following prompt and return ONLY the image URL (nothing else):\n\nPrompt: {}\nSize: {}",
        prompt, size
    );

    let mut cmd = Command::new("codex");
    cmd.arg("exec");
    cmd.arg("--model").arg("gpt-5.2");
    cmd.arg("--skip-git-repo-check");
    cmd.arg(&image_prompt);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute Codex CLI: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Codex CLI error: {}", error));
    }

    let response = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse Codex output: {}", e))?;

    // Extract URL from response (should be a URL starting with https://)
    let trimmed = response.trim();
    if trimmed.starts_with("http") {
        Ok(trimmed.to_string())
    } else {
        // If not a direct URL, try to extract URL from the response
        let lines: Vec<&str> = trimmed.lines().collect();
        for line in lines {
            let line = line.trim();
            if line.starts_with("http") {
                return Ok(line.to_string());
            }
        }
        Err(format!("Failed to extract image URL from response: {}", trimmed))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            codex_request,
            codex_improve_text,
            codex_continue_story,
            codex_analyze_story,
            check_codex_installed,
            codex_generate_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
