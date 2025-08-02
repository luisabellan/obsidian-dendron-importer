import * as vscode from 'vscode';

export interface ImportOptions {
    convertHierarchy: boolean;
    preserveMetadata: boolean;
    convertWikiLinks: boolean;
    createSchemaFiles: boolean;
    handleAssets: boolean;
}

export interface ImportOptionItem extends vscode.QuickPickItem {
    option: keyof ImportOptions;
    picked?: boolean;
}

export interface FileInfo {
    uri: vscode.Uri;
    name: string;
    relativePath: string;
    isDirectory: boolean;
    content?: string;
}

export interface ProcessingResult {
    originalPath: string;
    newPath: string;
    processed: boolean;
    error?: string;
}

export interface ImportStats {
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    errors: string[];
    startTime: Date;
    endTime?: Date;
}

export interface DendronConfig {
    workspace?: {
        vaults: DendronVault[];
    };
}

export interface DendronVault {
    fsPath: string;
    name?: string;
    seed?: string;
}