import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from './configManager';

export class VaultSelector {
    private configManager: ConfigManager;

    constructor() {
        this.configManager = new ConfigManager();
    }

    async selectFolder(): Promise<string | undefined> {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Select Obsidian Vault Folder',
            title: 'Choose Obsidian Vault to Import'
        };

        // Set default URI if we have a saved path
        const defaultPath = this.configManager.getDefaultImportPath();
        if (defaultPath) {
            try {
                options.defaultUri = vscode.Uri.file(defaultPath);
            } catch (error) {
                console.warn('Invalid default path:', defaultPath);
            }
        }

        const folderUri = await vscode.window.showOpenDialog(options);
        const selectedPath = folderUri?.[0]?.fsPath;

        if (selectedPath) {
            // Validate the selected folder
            const isValid = await this.validateObsidianVault(selectedPath);
            
            if (!isValid) {
                const proceed = await vscode.window.showWarningMessage(
                    'The selected folder does not appear to be an Obsidian vault (no .md files found). Do you want to proceed anyway?',
                    'Yes, Proceed',
                    'Select Different Folder'
                );

                if (proceed === 'Select Different Folder') {
                    return this.selectFolder(); // Recursive call
                }
            }

            // Ask to save as default
            const saveAsDefault = await vscode.window.showQuickPick(
                ['Yes', 'No'],
                {
                    placeHolder: 'Save this path as default for future imports?'
                }
            );

            if (saveAsDefault === 'Yes') {
                await this.configManager.updateDefaultImportPath(selectedPath);
                vscode.window.showInformationMessage(`Default import path set to: ${selectedPath}`);
            }

            return selectedPath;
        }

        return undefined;
    }

    private async validateObsidianVault(vaultPath: string): Promise<boolean> {
        try {
            const vaultUri = vscode.Uri.file(vaultPath);
            
            // Check for common Obsidian indicators
            const hasObsidianFolder = await this.checkForObsidianFolder(vaultUri);
            const hasMarkdownFiles = await this.checkForMarkdownFiles(vaultUri);
            
            return hasObsidianFolder || hasMarkdownFiles;
            
        } catch (error) {
            console.error('Vault validation error:', error);
            return false;
        }
    }

    private async checkForObsidianFolder(vaultUri: vscode.Uri): Promise<boolean> {
        try {
            const obsidianUri = vscode.Uri.joinPath(vaultUri, '.obsidian');
            await vscode.workspace.fs.stat(obsidianUri);
            return true;
        } catch {
            return false;
        }
    }

    private async checkForMarkdownFiles(vaultUri: vscode.Uri, maxDepth: number = 2): Promise<boolean> {
        try {
            return await this.hasMarkdownFilesRecursive(vaultUri, 0, maxDepth);
        } catch {
            return false;
        }
    }

    private async hasMarkdownFilesRecursive(uri: vscode.Uri, currentDepth: number, maxDepth: number): Promise<boolean> {
        if (currentDepth > maxDepth) {
            return false;
        }

        try {
            const entries = await vscode.workspace.fs.readDirectory(uri);

            // Check for .md files in current directory
            const hasMarkdown = entries.some(([name, type]) => 
                type === vscode.FileType.File && name.endsWith('.md')
            );

            if (hasMarkdown) {
                return true;
            }

            // Check subdirectories (if we haven't reached max depth)
            if (currentDepth < maxDepth) {
                for (const [name, type] of entries) {
                    if (type === vscode.FileType.Directory && !name.startsWith('.')) {
                        const subUri = vscode.Uri.joinPath(uri, name);
                        if (await this.hasMarkdownFilesRecursive(subUri, currentDepth + 1, maxDepth)) {
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch {
            return false;
        }
    }

    async showVaultInfo(vaultPath: string): Promise<void> {
        try {
            const vaultUri = vscode.Uri.file(vaultPath);
            const stats = await this.analyzeVault(vaultUri);
            
            const info = `
Vault Analysis:
Path: ${vaultPath}
Markdown Files: ${stats.markdownFiles}
Folders: ${stats.folders}
Total Files: ${stats.totalFiles}
Obsidian Config: ${stats.hasObsidianConfig ? 'Found' : 'Not found'}
            `.trim();

            const action = await vscode.window.showInformationMessage(
                'Vault Analysis Complete',
                'Show Details'
            );

            if (action === 'Show Details') {
                const doc = await vscode.workspace.openTextDocument({
                    content: info,
                    language: 'plaintext'
                });
                await vscode.window.showTextDocument(doc);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async analyzeVault(vaultUri: vscode.Uri): Promise<{
        markdownFiles: number;
        folders: number;
        totalFiles: number;
        hasObsidianConfig: boolean;
    }> {
        let markdownFiles = 0;
        let folders = 0;
        let totalFiles = 0;

        const hasObsidianConfig = await this.checkForObsidianFolder(vaultUri);

        const analyzeRecursive = async (uri: vscode.Uri): Promise<void> => {
            try {
                const entries = await vscode.workspace.fs.readDirectory(uri);
                
                for (const [name, type] of entries) {
                    if (name.startsWith('.')) continue; // Skip hidden files/folders
                    
                    if (type === vscode.FileType.Directory) {
                        folders++;
                        const subUri = vscode.Uri.joinPath(uri, name);
                        await analyzeRecursive(subUri);
                    } else if (type === vscode.FileType.File) {
                        totalFiles++;
                        if (name.endsWith('.md')) {
                            markdownFiles++;
                        }
                    }
                }
            } catch (error) {
                console.warn('Error analyzing directory:', uri.fsPath, error);
            }
        };

        await analyzeRecursive(vaultUri);

        return {
            markdownFiles,
            folders,
            totalFiles,
            hasObsidianConfig
        };
    }
}