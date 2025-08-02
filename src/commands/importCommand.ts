import * as vscode from 'vscode';
import * as path from 'path';
import { FileProcessor } from '../utils/fileProcessor';
import { ProgressReporter } from '../utils/progressReporter';
import { ConfigManager } from '../utils/configManager';
import { ImportOptions, ImportOptionItem, ImportStats } from '../types';

export class ImportCommand {
    private fileProcessor: FileProcessor;
    private progressReporter: ProgressReporter;
    private configManager: ConfigManager;

    constructor() {
        this.fileProcessor = new FileProcessor();
        this.progressReporter = new ProgressReporter();
        this.configManager = new ConfigManager();
    }

    async execute(): Promise<void> {
        try {
            // Check if we're in a workspace
            if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('Please open a workspace folder first.');
                return;
            }

            // Step 1: Get Obsidian notes folder
            const obsidianPath = await this.getObsidianFolder();
            if (!obsidianPath) {
                return; // User cancelled
            }

            // Step 2: Get Dendron notes folder
            const dendronPath = await this.getDendronFolder();
            if (!dendronPath) {
                return; // User cancelled
            }

            // Step 3: Execute import with progress
            const stats = await this.progressReporter.withProgress(
                'Importing Obsidian to Dendron',
                async (progress, token) => {
                    // Use default import options
                    const importOptions = {
                        convertHierarchy: true,
                        preserveMetadata: true,
                        convertWikiLinks: true,
                        createSchemaFiles: false,
                        handleAssets: true
                    };
                    
                    return await this.fileProcessor.processVault(
                        obsidianPath,
                        dendronPath,
                        importOptions,
                        progress,
                        token
                    );
                }
            );

            // Step 4: Show completion message
            await this.showCompletionMessage(stats);

        } catch (error) {
            console.error('Import execution failed:', error);
            vscode.window.showErrorMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async getObsidianFolder(): Promise<string | undefined> {
        // Check for default path first
        const defaultPath = this.configManager.getDefaultImportPath();
        
        if (defaultPath) {
            const useDefault = await vscode.window.showQuickPick(
                ['Use default path', 'Select different path'],
                {
                    placeHolder: `Use default path: ${defaultPath}?`
                }
            );

            if (useDefault === 'Use default path') {
                return defaultPath;
            }
        }

        // Show folder picker
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Select Obsidian Notes Folder',
            title: 'Choose Obsidian Notes Folder'
        };

        const folderUri = await vscode.window.showOpenDialog(options);
        const selectedPath = folderUri?.[0]?.fsPath;

        // Save as default if user wants
        if (selectedPath) {
            const saveAsDefault = await vscode.window.showQuickPick(
                ['Yes', 'No'],
                {
                    placeHolder: 'Save this path as default for future imports?'
                }
            );

            if (saveAsDefault === 'Yes') {
                await this.configManager.updateDefaultImportPath(selectedPath);
            }
        }

        return selectedPath;
    }

    private async getDendronFolder(): Promise<string | undefined> {
        // Check for default path first
        const defaultPath = this.configManager.getDefaultTargetPath();
        
        if (defaultPath) {
            const useDefault = await vscode.window.showQuickPick(
                ['Use default path', 'Select different path'],
                {
                    placeHolder: `Use default target path: ${defaultPath}?`
                }
            );

            if (useDefault === 'Use default path') {
                return defaultPath;
            }
        }

        // Show folder picker
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Select Dendron Notes Folder',
            title: 'Choose Dendron Notes Folder'
        };

        const folderUri = await vscode.window.showOpenDialog(options);
        const selectedPath = folderUri?.[0]?.fsPath;

        // Save as default if user wants
        if (selectedPath) {
            const saveAsDefault = await vscode.window.showQuickPick(
                ['Yes', 'No'],
                {
                    placeHolder: 'Save this path as default for future imports?'
                }
            );

            if (saveAsDefault === 'Yes') {
                await this.configManager.updateDefaultTargetPath(selectedPath);
            }
        }

        return selectedPath;
    }

    private async showCompletionMessage(stats: ImportStats): Promise<void> {
        const duration = stats.endTime && stats.startTime 
            ? Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000)
            : 0;

        const message = `Import completed! Processed ${stats.processedFiles}/${stats.totalFiles} files in ${duration}s`;
        
        if (stats.errors.length > 0) {
            const action = await vscode.window.showWarningMessage(
                `${message}. ${stats.errors.length} errors occurred.`,
                'Show Details'
            );

            if (action === 'Show Details') {
                const errorDetails = stats.errors.join('\n');
                const doc = await vscode.workspace.openTextDocument({
                    content: `Import Errors:\n\n${errorDetails}`,
                    language: 'plaintext'
                });
                await vscode.window.showTextDocument(doc);
            }
        } else {
            vscode.window.showInformationMessage(message);
        }
    }
}