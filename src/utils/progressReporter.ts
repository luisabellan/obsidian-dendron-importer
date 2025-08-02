import * as vscode from 'vscode';
import { ImportStats } from '../types';

export class ProgressReporter {
    async withProgress<T>(
        title: string,
        task: (
            progress: vscode.Progress<{ message?: string; increment?: number }>,
            token: vscode.CancellationToken
        ) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title,
                cancellable: true
            },
            async (progress, token) => {
                // Handle cancellation
                token.onCancellationRequested(() => {
                    vscode.window.showInformationMessage('Import cancelled by user');
                });

                try {
                    return await task(progress, token);
                } catch (error) {
                    if (token.isCancellationRequested) {
                        throw new Error('Import was cancelled');
                    }
                    throw error;
                }
            }
        );
    }

    async withProgressInStatusBar<T>(
        title: string,
        task: (
            progress: vscode.Progress<{ message?: string; increment?: number }>
        ) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Window,
                title
            },
            async (progress) => {
                return await task(progress);
            }
        );
    }

    reportProgress(
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        message: string,
        increment?: number
    ): void {
        progress.report({
            message,
            increment
        });
    }

    createStatsReporter(
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        totalFiles: number
    ): (processedFiles: number, currentFile: string) => void {
        return (processedFiles: number, currentFile: string) => {
            const percentage = Math.round((processedFiles / totalFiles) * 100);
            this.reportProgress(
                progress,
                `Processing ${currentFile} (${processedFiles}/${totalFiles} - ${percentage}%)`,
                processedFiles === 0 ? 0 : (100 / totalFiles)
            );
        };
    }
}