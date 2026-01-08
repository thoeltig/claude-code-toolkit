# Cross-Platform Notification Plugin

A Claude Code plugin with a hook that sends native system notifications for Claude Code notifications. Get alerted when tasks complete, operations finish, or other Claude Code events occur—directly on your desktop.

## Features

- 🔔 Native system notifications on Windows, macOS, and Linux
- 🎯 Hooks into Claude Code events (PostToolUse, SessionStart, etc.)
- 💬 Custom notification messages from hook event data
- 🔄 Automatic fallback to console output if native notifications unavailable
- 🔊 Sound alerts on supported platforms
- 📦 Zero configuration required

## Installation

### Via Claude Code Plugin Command

```bash
/plugin install cross-platform-notification
```

### Manual Installation

1. Clone or download this plugin to your Claude Code plugins directory:
   ```bash
   ~/.claude/plugins/cross-platform-notification
   ```

2. Restart Claude Code or reload plugins

## Platform Requirements

### Windows
- PowerShell (included with Windows 10+)
- Windows 10 or later for native toast notifications

### macOS
- `terminal-notifier` (install via Homebrew):
  ```bash
  brew install terminal-notifier
  ```

### Linux
- `notify-send` (usually pre-installed)
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libnotify-bin

  # Fedora
  sudo dnf install libnotify
  ```

## How It Works

The plugin registers a notification hook that intercepts Claude Code events and displays system notifications with:
- Event-specific messages
- Consistent branding (Claude Code title)
- Platform-native appearance and sound

When a hook event occurs:
1. Event data is passed to the `claude_code_notifier.py` script
2. Script extracts the message from event data
3. Platform-specific notification system is triggered
4. If notification fails, message falls back to console output

## Configuration

No configuration needed. The plugin works out of the box with sensible defaults:
- Uses your system's default notification sound (macOS)
- Displays notifications in system notification center
- Automatically detects your OS

## Usage

Once installed, the plugin automatically sends notifications for Claude Code events. You'll see native notifications like:

**Windows**: Windows 10+ toast notification
**macOS**: Notification Center alert with sound
**Linux**: Desktop notification via notify-send

## Troubleshooting

**Notifications not appearing?**
- Verify platform requirements are installed (see Platform Requirements above)
- Check console output (fallback): `Claude Code` label indicates plugin executed
- On macOS, check Notification Center settings for Claude Code
- On Linux, verify notify-send is working: `notify-send "Test" "Message"`

**Sound not playing?**
- macOS: Check System Preferences > Sound > Do Not Disturb settings
- Windows/Linux: Notifications still appear visually even if sound is muted

**Python script errors?**
- Ensure Python 3.13+ is installed
- On Windows, verify PowerShell execution policy allows scripts:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## License

See root [LICENSE](../../LICENSE) for details.

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

---

**Author**: [Thore Höltig](https://github.com/thoeltig)