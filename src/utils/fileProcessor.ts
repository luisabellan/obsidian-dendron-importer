import * as vscode from 'vscode';
import * as path from 'path';
import { ImportOptions, FileInfo, ProcessingResult, ImportStats } from '../types';

export class FileProcessor {
    async processVault(
        sourcePath: string,
        targetPath: string,
        options: ImportOptions,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
    ): Promise<ImportStats> {
        const stats: ImportStats = {
            totalFiles: 0,
            processedFiles: 0,
            skippedFiles: 0,
            errors: [],
            startTime: new Date()
        };

        try {
            const sourceUri = vscode.Uri.file(sourcePath);
            const targetUri = vscode.Uri.file(targetPath);

            // Step 1: Scan source files
            progress.report({ message: 'Scanning source files...', increment: 0 });
            const files = await this.scanFiles(sourceUri);
            
            console.log(`Total files scanned: ${files.length}`);
            console.log('Files found:', files.map(f => `${f.relativePath} (${f.isDirectory ? 'dir' : 'file'})`));
            
            const markdownFiles = files.filter(file => !file.isDirectory && file.relativePath.endsWith('.md'));
            const assetFiles = options.handleAssets ? files.filter(file => !file.isDirectory && this.isAssetFile(file.name)) : [];
            
            console.log(`Markdown files: ${markdownFiles.length}`, markdownFiles.map(f => f.relativePath));
            console.log(`Asset files: ${assetFiles.length}`, assetFiles.map(f => f.relativePath));
            
            stats.totalFiles = markdownFiles.length + assetFiles.length;

            if (stats.totalFiles === 0) {
                throw new Error('No files found to import');
            }

            progress.report({ message: `Found ${stats.totalFiles} files to process`, increment: 10 });

            // Step 2: Process markdown files
            const markdownIncrement = 80 / stats.totalFiles;
            for (const file of markdownFiles) {
                if (token.isCancellationRequested) {
                    break;
                }

                try {
                    progress.report({ 
                        message: `Processing ${file.name}`, 
                        increment: markdownIncrement 
                    });

                    await this.processMarkdownFile(file, targetUri, options);
                    stats.processedFiles++;
                } catch (error) {
                    const errorMsg = `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    stats.errors.push(errorMsg);
                    console.error(errorMsg, error);
                }
            }

            // Step 3: Process assets if enabled
            if (options.handleAssets && assetFiles.length > 0) {
                progress.report({ message: 'Processing assets...', increment: 0 });
                
                for (const file of assetFiles) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    try {
                        await this.processAssetFile(file, targetUri);
                        stats.processedFiles++;
                    } catch (error) {
                        const errorMsg = `Failed to process asset ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        stats.errors.push(errorMsg);
                        console.error(errorMsg, error);
                    }
                }
            }

            // Step 4: Create schema files if requested
            if (options.createSchemaFiles) {
                progress.report({ message: 'Creating schema files...', increment: 5 });
                await this.createSchemaFiles(markdownFiles, targetUri);
            }

            progress.report({ message: 'Import completed!', increment: 5 });

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error during import';
            stats.errors.push(errorMsg);
            throw error;
        } finally {
            stats.endTime = new Date();
            stats.skippedFiles = stats.totalFiles - stats.processedFiles;
        }

        return stats;
    }

    private async scanFiles(uri: vscode.Uri): Promise<FileInfo[]> {
        const files: FileInfo[] = [];

        const scanRecursive = async (currentUri: vscode.Uri, basePath: string = ''): Promise<void> => {
            try {
                const entries = await vscode.workspace.fs.readDirectory(currentUri);

                for (const [name, type] of entries) {
                    // Skip hidden files and common non-content folders
                    if (name.startsWith('.') || name === 'node_modules') {
                        continue;
                    }

                    const childUri = vscode.Uri.joinPath(currentUri, name);
                    const relativePath = basePath ? `${basePath}/${name}` : name;

                    if (type === vscode.FileType.Directory) {
                        files.push({
                            uri: childUri,
                            name,
                            relativePath,
                            isDirectory: true
                        });
                        await scanRecursive(childUri, relativePath);
                    } else if (type === vscode.FileType.File) {
                        files.push({
                            uri: childUri,
                            name,
                            relativePath,
                            isDirectory: false
                        });
                    }
                }
            } catch (error) {
                console.warn('Error scanning directory:', currentUri.fsPath, error);
            }
        };

        await scanRecursive(uri);
        return files;
    }

    private async processMarkdownFile(
        file: FileInfo,
        targetDir: vscode.Uri,
        options: ImportOptions
    ): Promise<void> {
        // Read file content
        const content = await vscode.workspace.fs.readFile(file.uri);
        let textContent = Buffer.from(content).toString('utf8');

        // Process content based on options
        if (options.convertWikiLinks) {
            textContent = this.convertWikiLinks(textContent, options.convertHierarchy);
        }

        if (!options.preserveMetadata) {
            textContent = this.stripMetadata(textContent);
        }

        // Determine target filename
        let targetFileName = file.name;
        if (options.convertHierarchy) {
            targetFileName = this.convertToHierarchy(file.relativePath);
        }

        // Ensure target directory exists and write file
        const targetUri = vscode.Uri.joinPath(targetDir, targetFileName);
        await this.ensureDirectoryExists(vscode.Uri.joinPath(targetUri, '..'));
        await vscode.workspace.fs.writeFile(targetUri, Buffer.from(textContent, 'utf8'));
    }

    private async processAssetFile(file: FileInfo, targetDir: vscode.Uri): Promise<void> {
        // Create assets folder structure
        const assetsDir = vscode.Uri.joinPath(targetDir, 'assets');
        await this.ensureDirectoryExists(assetsDir);

        // Preserve folder structure for assets
        const targetPath = file.relativePath.includes('/') 
            ? file.relativePath 
            : file.name;
        
        const targetUri = vscode.Uri.joinPath(assetsDir, targetPath);
        await this.ensureDirectoryExists(vscode.Uri.joinPath(targetUri, '..'));

        // Copy file
        const content = await vscode.workspace.fs.readFile(file.uri);
        await vscode.workspace.fs.writeFile(targetUri, content);
    }

    private convertToHierarchy(relativePath: string): string {
        // Convert "Projects/Web/file.md" to "projects.web.file.md"
        const normalized = relativePath.toLowerCase()
            .replace(/[\/\\]/g, '.')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9.\-]/g, '');
        
        return normalized;
    }

    private convertWikiLinks(content: string, convertHierarchy: boolean): string {
        // Convert [[Page Name]] to [[page.name]] if hierarchy conversion is enabled
        return content.replace(/\[\[([^\]]+)\]\]/g, (match, link) => {
            let convertedLink = link.trim();
            
            if (convertHierarchy) {
                // Convert to dot notation and lowercase
                convertedLink = convertedLink
                    .toLowerCase()
                    .replace(/[\/\\]/g, '.')
                    .replace(/\s+/g, '.')
                    .replace(/[^a-z0-9.\-]/g, '');
            }
            
            return `[[${convertedLink}]]`;
        });
    }

    private stripMetadata(content: string): string {
        // Remove YAML frontmatter
        return content.replace(/^---\n[\s\S]*?\n---\n/, '');
    }

    private isAssetFile(filename: string): boolean {
        const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf', '.mp3', '.mp4', '.wav'];
        const ext = path.extname(filename).toLowerCase();
        return assetExtensions.includes(ext);
    }

    private async ensureDirectoryExists(dirUri: vscode.Uri): Promise<void> {
        try {
            await vscode.workspace.fs.stat(dirUri);
        } catch {
            try {
                await vscode.workspace.fs.createDirectory(dirUri);
            } catch (error) {
                // Directory might already exist or parent doesn't exist
                const parentUri = vscode.Uri.joinPath(dirUri, '..');
                await this.ensureDirectoryExists(parentUri);
                await vscode.workspace.fs.createDirectory(dirUri);
            }
        }
    }

    private async createSchemaFiles(files: FileInfo[], targetDir: vscode.Uri): Promise<void> {
        const hierarchies = new Set<string>();

        // Extract hierarchies from filenames
        for (const file of files) {
            const hierarchy = this.extractHierarchy(file.relativePath);
            if (hierarchy) {
                hierarchies.add(hierarchy);
            }
        }

        // Create schema files for each hierarchy
        for (const hierarchy of hierarchies) {
            const schemaContent = this.generateSchemaContent(hierarchy);
            const schemaFileName = `${hierarchy}.schema.yml`;
            const schemaUri = vscode.Uri.joinPath(targetDir, schemaFileName);
            
            try {
                await vscode.workspace.fs.writeFile(schemaUri, Buffer.from(schemaContent, 'utf8'));
            } catch (error) {
                console.warn('Failed to create schema file:', schemaFileName, error);
            }
        }
    }

    private extractHierarchy(relativePath: string): string | null {
        const converted = this.convertToHierarchy(relativePath);
        const parts = converted.split('.');
        
        if (parts.length > 1) {
            // Return all but the last part (filename)
            return parts.slice(0, -1).join('.');
        }
        
        return null;
    }

    private generateSchemaContent(hierarchy: string): string {
        return `version: 1
imports: []
schemas:
  - id: ${hierarchy}
    children:
      - pattern: "*"
        template:
          id: "{{fname}}"
          title: "{{title}}"
`;
    }
}