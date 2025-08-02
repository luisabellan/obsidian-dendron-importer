import * as vscode from 'vscode';

export class ConfigManager {
    private static readonly EXTENSION_ID = 'obsidianDendronImporter';

    private getConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(ConfigManager.EXTENSION_ID);
    }

    getDefaultImportPath(): string {
        return this.getConfig().get('defaultImportPath', '');
    }

    getDefaultTargetPath(): string {
        return this.getConfig().get('defaultTargetPath', '');
    }

    shouldPreserveMetadata(): boolean {
        return this.getConfig().get('preserveMetadata', true);
    }

    shouldConvertWikiLinks(): boolean {
        return this.getConfig().get('convertWikiLinks', true);
    }

    shouldFlattenHierarchy(): boolean {
        return this.getConfig().get('flattenHierarchy', true);
    }

    async updateDefaultImportPath(path: string): Promise<void> {
        await this.getConfig().update('defaultImportPath', path, vscode.ConfigurationTarget.Global);
    }

    async updateDefaultTargetPath(path: string): Promise<void> {
        await this.getConfig().update('defaultTargetPath', path, vscode.ConfigurationTarget.Global);
    }

    async updatePreserveMetadata(preserve: boolean): Promise<void> {
        await this.getConfig().update('preserveMetadata', preserve, vscode.ConfigurationTarget.Global);
    }

    async updateConvertWikiLinks(convert: boolean): Promise<void> {
        await this.getConfig().update('convertWikiLinks', convert, vscode.ConfigurationTarget.Global);
    }

    async updateFlattenHierarchy(flatten: boolean): Promise<void> {
        await this.getConfig().update('flattenHierarchy', flatten, vscode.ConfigurationTarget.Global);
    }
}