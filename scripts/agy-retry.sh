#!/usr/bin/env bash
# ==============================================================================
# agy-retry: Auto-retry wrapper for Antigravity CLI (agy)
# ==============================================================================
# Handles Server 503 / High-Traffic / Capacity Unavailable errors gracefully:
#   - Detects 503 capacity limits from Google / Antigravity servers
#   - Waits for a configurable countdown (default: 5 minutes)
#   - Shows a live countdown timer with instant manual skip ([Space] or [Enter])
#   - Retries the command automatically until capacity is available
#   - Plays a desktop sound & sends a notification when successful
#   - Can resume into interactive or print mode
# ==============================================================================

set -o pipefail

# ANSI color codes
BOLD="\033[1m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
CYAN="\033[1;36m"
MAGENTA="\033[1;35m"
DIM="\033[2m"
NC="\033[0m"

# Default configuration
DEFAULT_PROMPT="now u can work"
PROMPT="$DEFAULT_PROMPT"
WAIT_SECONDS=300 # 5 minutes
MAX_ATTEMPTS=0  # 0 = infinite
INTERACTIVE=false
MODEL=""
VERBOSE=false

# Temp file for output inspection
TEMP_OUT=$(mktemp -t agy_retry_XXXXXX.log)

cleanup() {
  # Restore terminal cursor in case countdown was interrupted
  tput cnorm 2>/dev/null || true
  rm -f "$TEMP_OUT"
}
trap cleanup EXIT
trap 'echo -e "\n${RED}✖ Aborted by user.${NC}"; exit 130' SIGINT SIGTERM

show_help() {
  echo -e "${BOLD}agy-retry${NC} — Auto-retry helper for Antigravity CLI (agy) on server capacity errors

${BOLD}USAGE:${NC}
  agy-retry [PROMPT] [OPTIONS]

${BOLD}ARGUMENTS:${NC}
  PROMPT               Prompt to send when resuming (default: \"${DEFAULT_PROMPT}\")

${BOLD}OPTIONS:${NC}
  -p, --prompt TEXT    Specify prompt to send (alternative to positional argument)
  -w, --wait DURATION  Countdown wait duration between retries (e.g. 5m, 300s, 300) [default: 5m]
  -i, --interactive    Drop into interactive session (agy -c) as soon as capacity is restored
  -m, --model MODEL    Override model (e.g. gemini-3.8-flash-medium, claude-sonnet-4-6)
      --max-attempts N Maximum retry attempts before giving up (default: 0 = unlimited)
  -v, --verbose        Show verbose diagnostic output
  -h, --help           Display this help message

${BOLD}EXAMPLES:${NC}
  agy-retry
      Runs with default prompt (\"now u can work\") and 5m countdown loop.

  agy-retry \"continue where we stopped\"
      Custom prompt with default 5m retry loop.

  agy-retry -i
      Retries until capacity returns, then opens the interactive agy session directly.

  agy-retry -w 2m
      Custom 2-minute countdown between retry attempts."
}

# Parse duration string (e.g., "5m", "300s", "300") into seconds
parse_duration() {
  local input="$1"
  if [[ "$input" =~ ^([0-9]+)m$ ]]; then
    echo $(( ${BASH_REMATCH[1]} * 60 ))
  elif [[ "$input" =~ ^([0-9]+)s$ ]]; then
    echo "${BASH_REMATCH[1]}"
  elif [[ "$input" =~ ^[0-9]+$ ]]; then
    echo "$input"
  else
    echo "$WAIT_SECONDS"
  fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -p|--prompt)
      PROMPT="$2"
      shift 2
      ;;
    -w|--wait)
      WAIT_SECONDS=$(parse_duration "$2")
      shift 2
      ;;
    -i|--interactive)
      INTERACTIVE=true
      shift
      ;;
    -m|--model)
      MODEL="$2"
      shift 2
      ;;
    --max-attempts)
      MAX_ATTEMPTS="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      show_help
      exit 1
      ;;
    *)
      if [[ "$PROMPT" == "$DEFAULT_PROMPT" ]]; then
        PROMPT="$1"
      else
        PROMPT="$PROMPT $1"
      fi
      shift
      ;;
  esac
done

# Check if agy binary exists
AGY_BIN=$(which agy 2>/dev/null || true)
if [[ -z "$AGY_BIN" ]]; then
  echo -e "${RED}Error: 'agy' executable not found in PATH.${NC}"
  exit 1
fi

# Visual live countdown function with instant keypress skip
do_countdown() {
  local total_secs=$1
  local start_time
  start_time=$(date +%s)
  local end_time=$((start_time + total_secs))

  # Hide cursor during countdown
  tput civis 2>/dev/null || true

  echo -e "${YELLOW}⏳ Server unavailable. Starting ${total_secs}s ($((total_secs / 60))m) countdown...${NC}"
  echo -e "${DIM}   (Press [Space] or [Enter] to retry immediately, [Ctrl+C] to abort)${NC}"

  while [ "$(date +%s)" -lt "$end_time" ]; do
    local now
    now=$(date +%s)
    local remaining=$((end_time - now))
    if [ "$remaining" -lt 0 ]; then remaining=0; fi

    local mins=$((remaining / 60))
    local secs=$((remaining % 60))

    printf "\r${CYAN}   [⏱  %02d:%02d remaining before next attempt]${NC} " "$mins" "$secs"

    # Non-blocking 1s read for space or enter
    if read -t 1 -n 1 -s key; then
      if [[ "$key" == "" || "$key" == " " ]]; then
        echo -e "\r${GREEN}   [⚡ Skip requested — retrying immediately!]${NC}                       "
        tput cnorm 2>/dev/null || true
        return 0
      fi
    fi
  done

  echo -e "\r${GREEN}   [⏱  00:00 — countdown complete, retrying now!]${NC}                       "
  tput cnorm 2>/dev/null || true
}

# Pattern matching for capacity/high traffic errors
is_capacity_error() {
  local log_file="$1"
  if grep -Eiq "(code 503)|No capacity available|experiencing high traffic|UNAVAILABLE|RESOURCE_EXHAUSTED|rate limit exceeded" "$log_file"; then
    return 0
  else
    return 1
  fi
}

# Success alert notification
notify_success() {
  # Desktop notification
  if command -v notify-send >/dev/null 2>&1; then
    notify-send -u normal -a "adwaid-view / agy" "Capacity Restored" "Antigravity CLI is ready and has resumed work!" 2>/dev/null || true
  fi

  # Audio alert
  if command -v canberra-gtk-play >/dev/null 2>&1; then
    canberra-gtk-play -i complete 2>/dev/null || true
  elif command -v paplay >/dev/null 2>&1 && [ -f /usr/share/sounds/freedesktop/stereo/complete.oga ]; then
    paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || true
  fi

  # Terminal bell
  printf '\a'
}

# Main retry loop
echo -e "${BOLD}${MAGENTA}================================================================${NC}"
echo -e "${BOLD}${MAGENTA}  agy-retry — Antigravity Auto-Retry Runner${NC}"
echo -e "${BOLD}${MAGENTA}================================================================${NC}"
echo -e "${CYAN}• Target Prompt:${NC} \"${PROMPT}\""
echo -e "${CYAN}• Countdown:${NC}     ${WAIT_SECONDS}s ($((WAIT_SECONDS / 60)) min)"
if [[ -n "$MODEL" ]]; then
  echo -e "${CYAN}• Model Override:${NC} ${MODEL}"
fi
if [[ "$INTERACTIVE" == true ]]; then
  echo -e "${CYAN}• Mode:${NC}           Interactive (will attach to session on success)"
else
  echo -e "${CYAN}• Mode:${NC}           Print / Headless (auto-submits turn)"
fi
echo -e "${DIM}----------------------------------------------------------------${NC}"

attempt=1

while true; do
  echo -e "\n${BOLD}${CYAN}[Attempt #${attempt}]${NC} $(date '+%Y-%m-%d %H:%M:%S') — Executing..."
  > "$TEMP_OUT"

  # Build command
  CMD=("$AGY_BIN" "--continue")
  if [[ -n "$MODEL" ]]; then
    CMD+=("--model" "$MODEL")
  fi

  # Run prompt
  CMD+=("-p" "$PROMPT")

  # Execute and stream output while capturing
  "${CMD[@]}" 2>&1 | tee "$TEMP_OUT"
  EXIT_CODE=${PIPESTATUS[0]}

  # Check if output contains 503 / capacity unavailable error
  if is_capacity_error "$TEMP_OUT"; then
    echo -e "\n${YELLOW}⚠ High traffic / capacity limit detected (code 503 or server unavailable).${NC}"

    if [ "$MAX_ATTEMPTS" -gt 0 ] && [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      echo -e "${RED}✖ Reached maximum configured attempts (${MAX_ATTEMPTS}). Exiting.${NC}"
      exit 1
    fi

    attempt=$((attempt + 1))
    do_countdown "$WAIT_SECONDS"
    continue
  fi

  # Check exit code
  if [ "$EXIT_CODE" -eq 0 ]; then
    echo -e "\n${GREEN}✔ [Success] Turn completed without capacity errors!${NC}"
    notify_success

    if [[ "$INTERACTIVE" == true ]]; then
      echo -e "${CYAN}Launching interactive session (agy --continue)...${NC}"
      exec "$AGY_BIN" "--continue"
    else
      # Prompt if user wants to enter interactive mode now
      echo ""
      read -t 15 -p "$(echo -e "${CYAN}Would you like to attach interactively? [y/N]: ${NC}")" ans || true
      if [[ "$ans" =~ ^[Yy]$ ]]; then
        exec "$AGY_BIN" "--continue"
      fi
    fi
    exit 0
  else
    # Non-capacity error occurred (e.g. syntax, user abort, other issue)
    echo -e "\n${RED}✖ Command exited with code ${EXIT_CODE}.${NC}"
    echo -e "${DIM}If this was not a server capacity issue, review the error above.${NC}"
    read -t 10 -p "$(echo -e "${YELLOW}Do you still want to retry in $((WAIT_SECONDS / 60))m? [y/N]: ${NC}")" ans || true
    if [[ "$ans" =~ ^[Yy]$ ]]; then
      attempt=$((attempt + 1))
      do_countdown "$WAIT_SECONDS"
      continue
    else
      exit "$EXIT_CODE"
    fi
  fi
done
