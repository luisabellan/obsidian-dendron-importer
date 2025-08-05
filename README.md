# Obsidian Dendron Importer

A simple VS Code extension for Dendron that imports notes from Obsidian vaults with automatic conversion from folder structure to dot-notation hierarchy.

> **🔄 Looking for the reverse?** Check out our [**Dendron Obsidian Importer Plugin**](https://github.com/luisabellan/dendron-obsidian-importer) that imports Dendron vaults into Obsidian with automatic dot-notation-to-folder conversion!

## Features

- 🗂️ **Automatic Hierarchy Conversion** - Converts Obsidian's folder-based organization to Dendron's dot-notation
- 📝 **Smart Link Conversion** - Transforms Obsidian `[[wikilinks]]` to Dendron format
- 📋 **Asset Handling** - Imports images and attachments with proper references
- 🎯 **Simple Two-Step Process** - Just select source and target folders
- 📊 **Progress Tracking** - Real-time progress reporting with detailed statistics
- ⚙️ **Sensible Defaults** - Optimized settings for most use cases

## Installation

### From VS Code Marketplace

1. **Launch VS Code Quick Open** (`Ctrl+P` / `Cmd+P`)
2. **Paste this command**:
   ```
   ext install LuisAbellan.obsidian-dendron-importer
   ```
3. **Press Enter**

**Alternative method:**
1. Open VS Code Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for "Obsidian Dendron Importer"
3. Click **Install** on the extension by LuisAbellan

### Manual Installation

1. Download the latest `.vsix` file from the [releases page](https://github.com/luisabellan/obsidian-dendron-importer/releases)
2. Install via VS Code:
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Run `Extensions: Install from VSIX...`
   - Select the downloaded `.vsix` file

## Usage

### Prerequisites

- VS Code with Dendron extension installed
- An open Dendron workspace
- An Obsidian vault to import from

### Quick Start

1. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. **Run Command**: `Dendron: Import Obsidian Vault`
3. **Select Obsidian Folder**: Choose the folder containing your Obsidian notes
4. **Select Dendron Folder**: Choose the destination Dendron notes folder
5. **Import**: Watch the progress and review results

**That's it!** The extension automatically converts your files with optimized settings.

### Automatic Conversion Features

The extension applies these optimized settings automatically:

| Feature | Description | Status |
|---------|-------------|--------|
| **Convert Hierarchy** | Transform `Projects/Web/file.md` to `projects.web.file.md` | ✅ **Enabled** |
| **Preserve Metadata** | Keep YAML frontmatter from Obsidian | ✅ **Enabled** |
| **Convert Wiki Links** | Transform `[[links]]` to Dendron format | ✅ **Enabled** |
| **Handle Assets** | Copy images and attachments to assets folder | ✅ **Enabled** |
| **Create Schema Files** | Generate `.schema.yml` files for hierarchies | ✅ **Enabled** |

### Folder Structure Conversion

The extension automatically converts Obsidian's folder-based organization to Dendron's hierarchical dot-notation:

#### Before (Obsidian)
```
Obsidian Vault/
├── Projects/
│   ├── Web/
│   │   ├── React Project.md
│   │   └── Vue Project.md
│   └── Mobile/
│       └── Flutter App.md
├── Daily Notes/
│   ├── 2025-01-15.md
│   └── 2025-01-16.md
└── Resources/
    ├── CSS/
    │   └── Flexbox Guide.md
    └── JavaScript/
        └── ES6 Features.md
```

#### After (Dendron)
```
Dendron Vault/
├── projects.web.react-project.md
├── projects.web.vue-project.md
├── projects.mobile.flutter-app.md
├── daily-notes.2025-01-15.md
├── daily-notes.2025-01-16.md
├── resources.css.flexbox-guide.md
├── resources.javascript.es6-features.md
└── assets/
    └── [copied images and attachments]
```

### Link Conversion

The extension intelligently converts Obsidian wiki links to work with Dendron's hierarchy:

**Before (Obsidian):**
```markdown
See [[React Project]] for more details.
Check out [[Daily Notes/2025-01-15]].
```

**After (Dendron):**
```markdown
See [[projects.web.react-project]] for more details.
Check out [[daily-notes.2025-01-15]].
```

## Commands

| Command | Description |
|---------|-------------|
| `Dendron: Import Obsidian Vault` | Start the two-step import process |

## Configuration

The extension remembers your folder selections for convenience:

| Setting | Description | Default |
|---------|-------------|---------|
| `obsidianDendronImporter.defaultImportPath` | Default Obsidian notes folder path | `""` |
| `obsidianDendronImporter.defaultTargetPath` | Default Dendron notes folder path | `""` |

*Note: Conversion settings are automatically optimized and don't require configuration.*

## Examples

### Basic Import

1. Open VS Code in your Dendron workspace
2. Run `Dendron: Import Obsidian Vault`
3. Select your Obsidian notes folder
4. Select your Dendron notes folder  
5. Import completes with progress feedback

### Path Configuration

The extension remembers your folder choices:

```json
{
  "obsidianDendronImporter.defaultImportPath": "/Users/john/Documents/Obsidian Vault",
  "obsidianDendronImporter.defaultTargetPath": "/Users/john/Documents/Dendron Workspace"
}
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/luisabellan/obsidian-dendron-importer.git
cd obsidian-dendron-importer

# Install dependencies
pnpm install

# Start development
pnpm run watch
```

### Building

```bash
# Compile TypeScript
pnpm run compile

# Package extension
pnpm run package
```

### Testing

```bash
# Run tests
pnpm run test

# Run with debugger
# Press F5 in VS Code
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -am 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Roadmap

- [ ] **Backup Integration** - Create backups before import
- [ ] **Link Validation** - Check and fix broken links after import
- [ ] **Incremental Import** - Update only changed files
- [ ] **Tag Conversion** - Convert Obsidian tags to Dendron format
- [ ] **Advanced Options** - Optional configuration for power users

## Troubleshooting

### Common Issues

**Q: Import command doesn't appear**
A: Ensure you have a workspace open in VS Code and the extension is enabled

**Q: Files aren't converted properly**
A: Verify the source folder contains .md files and has proper read permissions

**Q: Links are broken after import**
A: Check for special characters in filenames - the extension automatically converts links

**Q: Assets aren't imported**
A: Ensure assets are in supported formats (PNG, JPG, PDF, etc.) and in an 'assets' folder

### Getting Help

- 📝 [Create an issue](https://github.com/luisabellan/obsidian-dendron-importer/issues)
- 💬 [Discussions](https://github.com/luisabellan/obsidian-dendron-importer/discussions)
- 📧 [Contact maintainer](mailto:your-email@example.com)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Thanks to the [Dendron](https://dendron.so) team for creating an amazing knowledge management system
- Thanks to the [Obsidian](https://obsidian.md) community for inspiration
- Built with the [VS Code Extension API](https://code.visualstudio.com/api)

---

**Made with ❤️ for the knowledge management community**

## Quick Reference

**Two-Step Import Process:**
1. 📁 Select Obsidian notes folder
2. 📁 Select Dendron notes folder  
3. ✅ Done! Files automatically converted with optimized settings