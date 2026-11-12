#!/usr/bin/env python3
"""
agy-auto — Intelligent Auto-Retry Wrapper for Antigravity CLI (agy)
=============================================================================
Runs `agy` inside an interactive pseudo-terminal (PTY).

Whenever the server returns a 503 / High Traffic error:
  "⚠ Our servers are experiencing high traffic right now... (UNAVAILABLE (code 503): No capacity available for model ...)"

This wrapper automatically:
  1. Catches the error in real-time.
  2. Displays an in-terminal countdown (default: 5 minutes / 300s).
  3. Sends desktop notifications via notify-send & plays audio chime.
  4. Allows manual skip ([Space] or [Enter]) to retry immediately, or typing to take over.
  5. When the countdown completes, automatically injects "now u can work" into agy's stdin!
  6. If the error repeats, it waits another 5m and retries again without any user intervention.
=============================================================================
"""

import os
import sys
import pty
import select
import termios
import tty
import fcntl
import struct
import signal
import time
import re
import shutil
import subprocess

# Patterns indicating capacity unavailable / 503 error
ERROR_PATTERN = re.compile(
    r"((UNAVAILABLE.*code 503)|(No capacity available for model)|(experiencing high traffic right now))",
    re.IGNORECASE
)

DEFAULT_RETRY_PROMPT = os.environ.get("AGY_RETRY_PROMPT", "now u can work")
DEFAULT_WAIT_SECONDS = int(os.environ.get("AGY_RETRY_WAIT", "300")) # 5 minutes

def get_real_agy():
    """Find the real agy binary."""
    # Look for agy in PATH, avoiding recursive calls if named agy
    agy_path = shutil.which("agy")
    if not agy_path or os.path.realpath(agy_path) == os.path.realpath(__file__):
        candidates = [
            os.path.expanduser("~/.local/bin/agy"),
            "/usr/local/bin/agy",
            "/usr/bin/agy",
        ]
        for c in candidates:
            if os.path.isfile(c) and os.access(c, os.X_OK) and os.path.realpath(c) != os.path.realpath(__file__):
                return c
        return None
    return agy_path

def set_window_size(fd_src, fd_dst):
    """Sync terminal window dimensions."""
    try:
        buf = fcntl.ioctl(fd_src, termios.TIOCGWINSZ, b"        ")
        fcntl.ioctl(fd_dst, termios.TIOCSWINSZ, buf)
    except Exception:
        pass

def send_notification(title, body):
    """Send desktop notification via notify-send."""
    if shutil.which("notify-send"):
        try:
            subprocess.run(["notify-send", "-u", "normal", "-a", "agy-auto", title, body], check=False)
        except Exception:
            pass

def play_sound():
    """Play desktop audio alert."""
    if shutil.which("canberra-gtk-play"):
        try:
            subprocess.run(["canberra-gtk-play", "-i", "complete"], check=False)
        except Exception:
            pass
    elif shutil.which("paplay") and os.path.isfile("/usr/share/sounds/freedesktop/stereo/complete.oga"):
        try:
            subprocess.run(["paplay", "/usr/share/sounds/freedesktop/stereo/complete.oga"], check=False)
        except Exception:
            pass

def main():
    agy_bin = get_real_agy()
    if not agy_bin:
        sys.stderr.write("\033[1;31mError: Real 'agy' executable not found in ~/.local/bin/agy\033[0m\n")
        sys.exit(1)

    # Pass all incoming arguments to agy
    args = sys.argv[1:]
    subcommands = {"acp", "agent", "agents", "changelog", "help", "install", "mcp", "mic-serve", "models", "plugin", "plugins", "remote-control", "update"}
    has_subcommand = any(arg in subcommands for arg in args)

    if not has_subcommand and "-h" not in args and "--help" not in args:
        if "--dangerously-skip-permissions" not in args:
            args = ["--dangerously-skip-permissions"] + args

    target_cmd = [agy_bin] + args

    # Check if stdout/stdin is a tty
    is_interactive = sys.stdin.isatty() and sys.stdout.isatty()

    if not is_interactive:
        # Non-interactive fallback: simply run agy
        os.execv(agy_bin, target_cmd)

    old_termios = termios.tcgetattr(sys.stdin)
    master_fd, slave_fd = pty.openpty()

    pid = os.fork()

    if pid == 0:
        # Child process: run agy attached to slave PTY
        os.close(master_fd)
        os.setsid()
        os.dup2(slave_fd, 0)
        os.dup2(slave_fd, 1)
        os.dup2(slave_fd, 2)
        os.close(slave_fd)
        os.execv(agy_bin, target_cmd)
        sys.exit(1)

    # Parent process
    os.close(slave_fd)

    def handle_sigwinch(signum, frame):
        set_window_size(sys.stdin.fileno(), master_fd)

    signal.signal(signal.SIGWINCH, handle_sigwinch)
    set_window_size(sys.stdin.fileno(), master_fd)

    # State variables
    output_buffer = ""
    countdown_active = False
    countdown_end = 0.0
    last_tick_display = 0.0

    try:
        tty.setraw(sys.stdin.fileno())

        while True:
            # Check if child process is still alive
            try:
                waited_pid, status = os.waitpid(pid, os.WNOHANG)
                if waited_pid == pid:
                    # Child exited
                    exit_code = os.WEXITSTATUS(status) if os.WIFEXITED(status) else 1
                    # If it exited right after a 503 error, we can offer or auto-restart
                    if ERROR_PATTERN.search(output_buffer):
                        sys.stdout.write("\r\n\033[1;33m[agy-auto] Process exited with capacity error. Restarting in 5m...\033[0m\r\n")
                        sys.stdout.flush()
                        time.sleep(5)
                        # Re-execute with continue
                        os.execv(sys.argv[0], [sys.argv[0], "--continue"])
                    sys.exit(exit_code)
            except ChildProcessError:
                break

            now = time.time()

            # Handle active countdown
            if countdown_active:
                remaining = int(countdown_end - now)
                if remaining <= 0:
                    # Countdown reached 0: Automatically send retry command!
                    countdown_active = False
                    sys.stdout.write("\r\n\033[1;32m⚡ [agy-auto] Countdown finished! Automatically sending: '%s'...\033[0m\r\n" % DEFAULT_RETRY_PROMPT)
                    sys.stdout.flush()
                    payload = (DEFAULT_RETRY_PROMPT + "\n").encode("utf-8")
                    os.write(master_fd, payload)
                    output_buffer = ""
                    play_sound()
                else:
                    # Update countdown line once per second
                    if now - last_tick_display >= 0.95:
                        mins = remaining // 60
                        secs = remaining % 60
                        sys.stdout.write("\r\033[1;33m⏳ [Auto-Retry Active]\033[0m \033[1;36m[⏱  %02d:%02d remaining before auto-retrying '%s']\033[0m \033[2m(Space=retry now, any key=cancel)\033[0m   " % (mins, secs, DEFAULT_RETRY_PROMPT))
                        sys.stdout.flush()
                        last_tick_display = now

            # Select with short timeout to keep countdown responsive
            r, _, _ = select.select([sys.stdin.fileno(), master_fd], [], [], 0.1)

            # 1. Read input from user's keyboard
            if sys.stdin.fileno() in r:
                user_input = os.read(sys.stdin.fileno(), 1024)
                if not user_input:
                    break

                if countdown_active:
                    # If user hits Space or Enter: skip countdown and send immediately
                    if user_input in (b" ", b"\r", b"\n"):
                        countdown_active = False
                        sys.stdout.write("\r\n\033[1;32m⚡ [agy-auto] Manual skip requested! Sending '%s' immediately...\033[0m\r\n" % DEFAULT_RETRY_PROMPT)
                        sys.stdout.flush()
                        payload = (DEFAULT_RETRY_PROMPT + "\n").encode("utf-8")
                        os.write(master_fd, payload)
                        output_buffer = ""
                        continue
                    elif user_input == b"\x03": # Ctrl+C
                        countdown_active = False
                        sys.stdout.write("\r\n\033[1;31m✖ [agy-auto] Auto-retry cancelled by user.\033[0m\r\n")
                        sys.stdout.flush()
                        os.write(master_fd, b"\x03")
                        continue
                    else:
                        # Any other key: user takes over manually
                        countdown_active = False
                        sys.stdout.write("\r\n\033[1;36m⌨ [agy-auto] User input detected — cancelling auto-retry countdown.\033[0m\r\n")
                        sys.stdout.flush()
                        os.write(master_fd, user_input)
                        output_buffer = ""
                        continue
                else:
                    # Forward normal keystrokes to agy
                    os.write(master_fd, user_input)

            # 2. Read output from agy
            if master_fd in r:
                try:
                    data = os.read(master_fd, 4096)
                    if not data:
                        break
                except OSError:
                    break

                # Stream to terminal
                os.write(sys.stdout.fileno(), data)
                sys.stdout.flush()

                # Keep a sliding window of recent text
                text = data.decode("utf-8", errors="ignore")
                output_buffer += text
                if len(output_buffer) > 8192:
                    output_buffer = output_buffer[-4096:]

                # Detect 503 error
                if not countdown_active and ERROR_PATTERN.search(output_buffer):
                    countdown_active = True
                    countdown_end = time.time() + DEFAULT_WAIT_SECONDS
                    last_tick_display = 0.0

                    # Alert user
                    send_notification("Antigravity Server Busy", "503 High Traffic limit hit. Auto-retry scheduled in 5 minutes.")
                    sys.stdout.write("\r\n\r\n\033[1;33m" + "="*70 + "\033[0m\r\n")
                    sys.stdout.write("\033[1;33m⚠ [Auto-Retry Triggered] Server capacity limit (503) detected!\033[0m\r\n")
                    sys.stdout.write("\033[1;36m  Will automatically send '%s' in 5 minutes without you doing anything.\033[0m\r\n" % DEFAULT_RETRY_PROMPT)
                    sys.stdout.write("\033[2m  (Press [Space] to retry now, or start typing to take manual control)\033[0m\r\n")
                    sys.stdout.write("\033[1;33m" + "="*70 + "\033[0m\r\n")
                    sys.stdout.flush()

    finally:
        # Restore terminal state
        try:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_termios)
        except Exception:
            pass
        try:
            os.close(master_fd)
        except Exception:
            pass

if __name__ == "__main__":
    main()
