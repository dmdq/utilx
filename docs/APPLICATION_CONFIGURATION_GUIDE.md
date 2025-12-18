# Util Application Configuration Guide

## Table of Contents
- [Client Configuration](#client-configuration)
- [Configuration System](#configuration-system)
- [Hot Update System](#hot-update-system)
- [Development & Deployment](#development--deployment)
- [Security & Best Practices](#security--best-practices)
- [Troubleshooting](#troubleshooting)

---

## Client Configuration

### Configuration File Locations

#### macOS
```
~/Library/Application Support/cn.util.app/
```

#### Windows
```
%APPDATA%/cn.util.app/
```

#### Linux
```
~/.config/cn.util.app/
```

### Configuration Directory Structure
```
~/Library/Application Support/cn.util.app/
├── update-config.json          # Update configuration
├── user-settings.json          # User interface settings
├── tools-config.json           # Tool-specific settings
├── update-history.json         # Update history
├── backups/                    # Configuration backups
│   ├── config_backup_20240115_100000/
│   │   ├── update-config.json
│   │   ├── user-settings.json
│   │   └── tools-config.json
│   └── ...
├── cache/                      # Cache directory
├── logs/                       # Logs directory
└── updates/                    # Update cache
```

### Configuration Files Explained

#### 1. update-config.json (Update Configuration)
```json
{
  "auto_check_enabled": true,           // Enable automatic update checks
  "check_interval_hours": 24,           // Check interval in hours
  "auto_download_hotfix": true,         // Auto-download hotfix updates
  "auto_install_hotfix": false,         // Auto-install hotfix updates
  "release_channel": "stable",          // Release channel (stable/beta/dev)
  "update_server": "https://updates.util.cn", // Update server URL
  "last_check_time": null,              // Last check timestamp
  "ignored_versions": []                // List of ignored versions
}
```

#### 2. user-settings.json (User Settings)
```json
{
  "theme": "auto",                      // Theme (auto/light/dark)
  "language": "zh-CN",                  // Language setting
  "auto_start": false,                  // Launch at startup
  "minimize_to_tray": true,             // Minimize to tray
  "show_notifications": true,            // Show notifications
  "window_settings": {
    "remember_size": true,              // Remember window size
    "remember_position": true           // Remember window position
  },
  "tools": {
    "remember_last_used": true,         // Remember last used tool
    "favorites": []                     // Favorite tools list
  }
}
```

#### 3. tools-config.json (Tool Configuration)
```json
{
  "port_checker": {
    "default_ports": [80, 443, 8080, 3000, 5000],
    "timeout": 5000                      // Timeout in milliseconds
  },
  "whois_lookup": {
    "default_servers": [
      "whois.verisign-grs.com",
      "whois.crsnic.net"
    ],
    "timeout": 10000                    // Timeout in milliseconds
  },
  "qr_code": {
    "default_size": 200,                 // Default size
    "error_correction": "M",             // Error correction level (L/M/Q/H)
    "default_format": "png"              // Default format (png/jpeg/svg)
  }
}
```

#### 4. update-history.json (Update History)
```json
[
  {
    "version": "1.0.1",
    "update_type": "hotfix",             // Update type (hotfix/major)
    "installed_at": "2024-01-15T10:00:00Z",
    "success": true,                     // Success status
    "error_message": null                // Error message if failed
  }
]
```

### Configuration Management Features

#### 1. Backup Configuration
- Automatic backup before updates
- Manual backup creation
- Keep last 10 backups

#### 2. Import/Export
- Export all configurations to JSON file
- Import configurations from JSON file
- Support partial configuration import

#### 3. Reset Configuration
- Reset all configurations to default values
- Automatic backup before reset
- Selective reset for specific configurations

---

## Configuration System

### Source Code Configuration Files (Development)

```
src-tauri/
├── update-config.json          # Default update configuration (embedded at build)
├── splash.html                 # Splash screen template
├── splash-config.json          # Splash screen configuration (embedded)
└── icons/                      # Application icons
```

### Runtime Configuration Files (User Data)

Configuration loading flow:

```
1. Application starts
   ↓
2. Create/get configuration directory
   ↓
3. Check if configuration files exist
   ├─ Exist → Load configuration files
   └─ Not exist → Use default configuration and create files
   ↓
4. Apply configuration
```

### Environment-Specific Configuration

#### Development Environment
```json
{
  "update_server": "http://localhost:3001",
  "auto_check_enabled": false,
  "release_channel": "dev",
  "auto_download_hotfix": true,
  "auto_install_hotfix": true
}
```

#### Production Environment
```json
{
  "update_server": "https://updates.util.cn",
  "auto_check_enabled": true,
  "check_interval_hours": 24,
  "release_channel": "stable",
  "auto_download_hotfix": true,
  "auto_install_hotfix": false
}
```

### Environment Detection

```rust
let is_dev = cfg!(debug_assertions);
if is_dev {
    // Development environment configuration
    update_server = "http://localhost:3001";
    check_interval_hours = 1;
} else {
    // Production environment configuration
    update_server = "https://updates.util.cn";
    check_interval_hours = 24;
}
```

---

## Hot Update System

### Overview

Util application supports two types of updates:
- **Hotfix Updates**: Small version updates, only update specific files without reinstalling
- **Major Updates**: Complete application updates requiring new installation packages

### Feature Highlights

#### 🔥 Hotfix Features
- **Incremental Updates**: Only download changed files to reduce bandwidth
- **Auto-Application**: Support automatic download and application of hotfix updates
- **Seamless Restart**: Graceful application restart after hotfix updates
- **Rollback Support**: Keep update history with rollback capability

#### 📦 Major Update Features
- **Complete Download**: Download new DMG installation packages
- **Progress Display**: Real-time download progress
- **Auto-Installation**: Support automatic package opening
- **Force Update**: Support forced updates for critical versions

#### ⚙️ Configuration Management
- **Auto-Check**: Configurable automatic update check intervals
- **Release Channels**: Support stable, beta, and dev channels
- **Update Strategy**: Configurable auto-download and install policies
- **Version Ignore**: Support ignoring specific versions

### Update Flow

#### Hotfix Update Flow
1. Detect new version (hotfix)
2. Auto-download update files (if enabled)
3. Verify file integrity (SHA256 check)
4. Apply update files
5. Prompt user to restart application

#### Major Update Flow
1. Detect new version (major)
2. Download complete installation package
3. Display download progress
4. Auto-open DMG file
5. Manual drag-and-drop installation

### Update Server Setup

#### Start Update Server
```bash
# Install dependencies
npm install -g express semver
# Or use project's package.json
cp update-server-package.json package.json
npm install

# Start server
node update-server.js
```

Server runs on `http://localhost:3001` by default.

#### Add Hotfix Files
1. Place update files in `updates/version/` directory
2. Update version information in `update-server.js`
3. Restart update server

#### Publish Major Updates
1. Package new application version
2. Place DMG file in `downloads/` directory
3. Update version info and download URLs
4. Restart update server

### API Interfaces

#### Check Updates
```
GET /api/v1/check-updates
Parameters:
- current_version: Current version
- platform: Platform (macos)
- arch: Architecture (arm64)
- channel: Channel (stable/beta/dev)

Response:
{
  "current_version": "1.0.0",
  "latest_version": "1.0.1",
  "update_type": {
    "type": "Hotfix",
    "files": [...]
  },
  "release_notes": "...",
  "is_force_update": false
}
```

#### Download Update Files
```
GET /updates/:version/:filename
Response Headers:
- X-File-Hash: File SHA256 hash
- X-File-Size: File size
```

#### Version List
```
GET /api/v1/versions?channel=stable
Response:
{
  "channel": "stable",
  "versions": [...]
}
```

---

## Development & Deployment

### Configuration Best Practices

#### During Development
- Modify `src-tauri/update-config.json` to update default configuration
- Use `include_str!` macro to ensure configuration is embedded in binary
- Test different configuration combinations

#### During Deployment
- Ensure production environment default configuration is correct
- Don't include sensitive information in configuration files
- Use HTTPS servers

#### For Users
- Modify configuration through settings interface
- Regularly backup important configurations
- Manual editing of configuration files is possible when needed

### Example Scenarios

#### Scenario 1: Enterprise Deployment
```json
{
  "update_server": "https://updates.company.com",
  "auto_check_enabled": true,
  "check_interval_hours": 4,
  "release_channel": "stable",
  "auto_install_hotfix": true
}
```

#### Scenario 2: Developer Mode
```json
{
  "update_server": "http://localhost:3001",
  "auto_check_enabled": false,
  "release_channel": "dev",
  "auto_download_hotfix": true,
  "auto_install_hotfix": true
}
```

#### Scenario 3: Offline Environment
```json
{
  "auto_check_enabled": false,
  "update_server": "",
  "auto_download_hotfix": false,
  "auto_install_hotfix": false
}
```

### Version Management Best Practices

- Follow semantic versioning (SemVer)
- Use patch versions for hotfix updates (e.g., 1.0.1)
- Use major/minor versions for major updates (e.g., 1.1.0)
- Prioritize hotfix updates for bug fixes
- Use major updates for feature improvements
- Use forced updates for critical security fixes

### Testing Process
- Test updates in beta channel first
- Ensure hotfix files are correct
- Verify major update packages are complete

---

## Security & Best Practices

### File Integrity
- All update files have SHA256 hash verification
- Automatic file integrity verification after download
- Files with mismatched hashes are rejected

### Update Source
- Only download updates from configured update servers
- Support HTTPS protocol for transmission security
- Configurable custom update server addresses

### Permission Management
- Major updates require administrator privileges
- Hotfix updates execute within user permissions
- Support application restart with administrator privileges

### Data Protection
- Configuration files stored in user directory
- No sensitive information collection
- Support encrypted configuration files

### Backup Security
- Local backup storage
- Backup file version control
- Automatic cleanup of expired backups

### Configuration File Permissions
- macOS: Use Application Support directory
- Windows: Use APPDATA directory
- Linux: Use ~/.config directory

### Configuration Migration
- Automatic configuration migration during app version upgrades
- Maintain backward compatibility
- Handle configuration format changes

### Multi-User Support
- Independent configuration directories for each user
- Different user configurations don't interfere
- Support user configuration export

---

## Troubleshooting

### Common Issues

#### Configuration Corruption
**Symptoms**: Application fails to start or behaves abnormally
**Solution**:
1. Open configuration directory
2. Delete corrupted configuration files
3. Restart application (will use default configuration)

#### Settings Not Applied
**Symptoms**: Modified settings have no effect
**Solution**:
1. Check configuration file permissions
2. Verify JSON format is correct
3. Restart application

#### Configuration Lost
**Symptoms**: Settings reset to default values
**Solution**:
1. Restore from backup
2. Check disk space
3. Verify no other program modified configuration

#### Update Failures
- Check network connection
- Verify update server address
- Check update history for error details

#### Hotfix Issues
- Clean application configuration directory
- Re-check for updates
- Manually download major updates

#### Server Issues
- Check if server is running
- Verify port is not occupied
- Check server logs

### Important Notes

1. **Development Environment**: Use `npm run tauri:dev`, update features may be incomplete in development
2. **Production Environment**: Only packaged applications provide complete update functionality
3. **Network Requirements**: Need access to update server
4. **Disk Space**: Ensure sufficient space for update file downloads
5. **Permission Requirements**: Major updates may require administrator privileges

### Configuration Modification Guidelines

1. **Modify Configuration Files**:
   - Backup original configuration first
   - Use JSON validation tools to ensure correct format
   - Restart application after modification

2. **Configuration File Templates**:
   Default configuration templates available from:
   - Application installation directory
   - GitHub repository
   - Official documentation

3. **Configuration Best Practices**:
   - Regularly backup configurations
   - Keep configuration files concise
   - Don't modify unknown configuration items
   - Use settings interface to modify configurations

### Technical Architecture

#### Update Flow
```
Application starts → Check configuration → Connect to server → Get version info → Determine update type → Download update → Verify files → Apply update → Restart application
```

#### Module Structure
- `updater.rs`: Core update logic
- `update_config.rs`: Configuration management
- `update_commands.rs`: Tauri command interface
- `UpdateManager.vue`: Frontend user interface
- `update-server.js`: Update server

#### Data Flow
```
Frontend Interface ← Tauri IPC ← Rust Backend ← HTTP Request ← Update Server
```

---

## Support & Feedback

For questions or suggestions, please contact:
- Email: support@util.cn
- Website: https://util.cn
- GitHub: https://github.com/dmdq/utilx

---

*This documentation combines client configuration, configuration system, and hot update system guides for comprehensive application management.*