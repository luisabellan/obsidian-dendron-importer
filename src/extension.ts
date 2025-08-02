import * as vscode from 'vscode';
import { ImportCommand } from './commands/importCommand';
import { VaultSelector } from './utils/vaultSelector';

export function activate(context: vscode.ExtensionContext) {
    console.log('Obsidian Dendron Importer is now active!');

    // Register commands
    const importCommand = new ImportCommand();
    const vaultSelector = new VaultSelector();

    // Register import vault command
    const importVaultDisposable = vscode.commands.registerCommand(
        'obsidianDendronImporter.importVault',
        async () => {
            try {
                await importCommand.execute();
            } catch (error) {
                console.error('Import command failed:', error);
                vscode.window.showErrorMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    );

    // Register vault folder selection command
    const selectVaultDisposable = vscode.commands.registerCommand(
        'obsidianDendronImporter.selectVaultFolder',
        async () => {
            try {
                await vaultSelector.selectFolder();
            } catch (error) {
                console.error('Vault selection failed:', error);
                vscode.window.showErrorMessage(`Vault selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    );

    context.subscriptions.push(importVaultDisposable, selectVaultDisposable);

    // Show welcome message
    vscode.window.showInformationMessage(
        'Obsidian Dendron Importer is ready! Use "Dendron: Import Obsidian Vault" from the command palette.',
        'Open Command Palette'
    ).then(selection => {
        if (selection === 'Open Command Palette') {
            vscode.commands.executeCommand('workbench.action.showCommands');
        }
    });
}

export function deactivate() {
    console.log('Obsidian Dendron Importer is now deactivated');
}