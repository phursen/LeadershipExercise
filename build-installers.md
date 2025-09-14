# Electric Maze - Desktop App Installers

This document explains how to build desktop installers for Mac and Windows platforms.

## Prerequisites

- Node.js and npm installed
- All dependencies installed (`npm install`)

## Available Build Commands

### Development
```bash
# Run in Electron development mode
npm run electron-dev
```

### Production Builds

#### Build for Current Platform
```bash
# Build for the current platform only
npm run dist
```

#### Build for Specific Platforms
```bash
# Build Mac installer (.dmg and .zip)
npm run dist-mac

# Build Windows installer (.exe and portable)
npm run dist-win

# Build for both Mac and Windows
npm run dist-all
```

## Output Files

Built installers will be created in the `release/` directory:

### Mac
- `Electric Maze-1.0.0.dmg` - Mac installer
- `Electric Maze-1.0.0-mac.zip` - Mac portable app
- Supports both Intel (x64) and Apple Silicon (arm64)

### Windows
- `Electric Maze Setup 1.0.0.exe` - Windows installer
- `Electric Maze 1.0.0.exe` - Windows portable app
- Supports both 64-bit (x64) and 32-bit (ia32)

## Installer Features

### Mac
- Standard DMG installer with drag-to-Applications
- Code signing ready (requires developer certificate)
- Universal binary for Intel and Apple Silicon

### Windows
- NSIS installer with custom install directory option
- Creates desktop and start menu shortcuts
- Uninstaller included
- Both installer and portable versions

## Configuration

The installer configuration is defined in `package.json` under the `build` section:

- **App ID**: `com.electricmaze.app`
- **Product Name**: Electric Maze
- **Category**: Games (Mac)
- **Icons**: Uses `public/favicon.ico`

## Building Process

1. **Prepare**: Run `npm run build` to create production web build
2. **Package**: Electron-builder packages the app with the built files
3. **Sign**: (Optional) Code signing for distribution
4. **Distribute**: Upload installers to your distribution platform

## Troubleshooting

### Common Issues

1. **Missing dependencies**: Run `npm install` to ensure all packages are installed
2. **Build failures**: Check that `dist/` folder exists after running `npm run build`
3. **Icon issues**: Ensure `public/favicon.ico` exists and is a valid icon file

### Platform-Specific Notes

- **Mac**: Building for Mac requires macOS (cross-compilation not supported)
- **Windows**: Can build Windows installers from any platform
- **Code Signing**: Requires valid certificates for production distribution

## Distribution

After building, you can distribute the installers:

1. Upload to your website or file hosting service
2. Use GitHub Releases for open source projects
3. Submit to app stores (requires additional configuration)

## Auto-Updates

To enable auto-updates, configure the `publish` section in `package.json` and set up an update server.
