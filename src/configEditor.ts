import * as vscode from 'vscode';

interface ConfigProperty {
    key: string;
    description: string;
    type: string;
    defaultValue?: string;
    enumValues?: string[];
    children?: ConfigProperty[];
}

const configProperties: ConfigProperty[] = [
    {
        key: 'directories',
        description: 'Directory paths for manimgl output and caching.',
        type: 'object',
        children: [
            {
                key: 'output',
                description: 'Base output directory. Videos go to <output>/videos/, images to <output>/images/.',
                type: 'string',
                defaultValue: './output'
            },
            {
                key: 'mirror_module_path',
                description: 'When true, output files are saved in a subdirectory matching the source file path.',
                type: 'boolean',
                defaultValue: 'false'
            },
            {
                key: 'cache',
                description: 'Directory for cached LaTeX/Text renderings.',
                type: 'string'
            },
            {
                key: 'temporary_storage',
                description: 'Directory for temporary files during rendering.',
                type: 'string'
            }
        ]
    },
    {
        key: 'tex',
        description: 'LaTeX configuration for Tex mobjects.',
        type: 'object',
        children: [
            {
                key: 'compiler',
                description: 'LaTeX compiler to use.',
                type: 'string',
                defaultValue: 'latex',
                enumValues: ['latex', 'xelatex', 'pdflatex', 'lualatex']
            },
            {
                key: 'preamble',
                description: 'Custom LaTeX preamble added to all Tex documents.',
                type: 'string'
            },
            {
                key: 'template',
                description: 'Name of the tex template to use (from tex_templates.yml).',
                type: 'string'
            },
            {
                key: 'use_ctex',
                description: 'Use ctex package for Chinese/Japanese/Korean text support.',
                type: 'boolean',
                defaultValue: 'false'
            }
        ]
    },
    {
        key: 'sizes',
        description: 'Dimension constants used across manimgl.',
        type: 'object',
        children: [
            { key: 'frame_height', description: 'Height of the animation frame in manim units.', type: 'number', defaultValue: '8' },
            { key: 'small_buff', description: 'Small spacing buffer.', type: 'number', defaultValue: '0.1' },
            { key: 'med_small_buff', description: 'Medium-small spacing buffer.', type: 'number', defaultValue: '0.25' },
            { key: 'med_large_buff', description: 'Medium-large spacing buffer.', type: 'number', defaultValue: '0.5' },
            { key: 'large_buff', description: 'Large spacing buffer.', type: 'number', defaultValue: '1' }
        ]
    },
    {
        key: 'colors',
        description: 'Custom color definitions. Manimgl defines palettes like blue_e through blue_a, red_e through red_a, etc.',
        type: 'object'
    },
    {
        key: 'camera',
        description: 'Default camera and rendering settings.',
        type: 'object',
        children: [
            { key: 'resolution', description: 'Default output resolution in pixels (width x height).', type: 'string', defaultValue: '1920x1080' },
            { key: 'fps', description: 'Default frames per second for output video.', type: 'number', defaultValue: '30' },
            { key: 'background_color', description: 'Background color as hex string (e.g., "#000000") or named color.', type: 'string', defaultValue: '#000000' },
            { key: 'background_opacity', description: 'Background opacity (0 = transparent, 1 = opaque).', type: 'number', defaultValue: '1.0' }
        ]
    },
    {
        key: 'window',
        description: 'Interactive window settings.',
        type: 'object',
        children: [
            { key: 'position', description: 'Default window position on screen.', type: 'string' },
            {
                key: 'size',
                description: 'Default window size. Use "default" for auto-sizing.',
                type: 'string',
                enumValues: ['default']
            },
            {
                key: 'full_screen',
                description: 'Open the preview window in full screen mode by default.',
                type: 'boolean',
                defaultValue: 'false'
            },
            {
                key: 'borderless',
                description: 'Open the window without borders.',
                type: 'boolean',
                defaultValue: 'false'
            },
            {
                key: 'always_on_top',
                description: 'Keep the preview window always on top.',
                type: 'boolean',
                defaultValue: 'false'
            }
        ]
    },
    {
        key: 'universal_import_line',
        description: 'Import line executed automatically when entering interactive mode.',
        type: 'string',
        defaultValue: 'from manimlib import *'
    },
    {
        key: 'ignore_manimlib_modules_on_reload',
        description: 'When true, manimlib internal modules are not reloaded on autoreload.',
        type: 'boolean',
        defaultValue: 'false'
    },
    {
        key: 'style',
        description: 'Visual style presets for manimgl scenes.',
        type: 'object',
        children: [
            { key: 'font', description: 'Default font for Text mobjects.', type: 'string' },
            { key: 'font_size', description: 'Default font size.', type: 'number' },
            { key: 'stroke_width', description: 'Default stroke width for mobjects.', type: 'number' },
            { key: 'fill_opacity', description: 'Default fill opacity.', type: 'number', defaultValue: '1.0' }
        ]
    }
];

function buildFlatMap(props: ConfigProperty[], prefix = ''): Map<string, ConfigProperty> {
    const map = new Map<string, ConfigProperty>();
    for (const prop of props) {
        const fullKey = prefix ? `${prefix}.${prop.key}` : prop.key;
        map.set(fullKey, prop);
        if (prop.children) {
            const childMap = buildFlatMap(prop.children, fullKey);
            childMap.forEach((v, k) => map.set(k, v));
        }
    }
    return map;
}

const flatConfigMap = buildFlatMap(configProperties);

function getKeyPathAtPosition(document: vscode.TextDocument, position: vscode.Position): string {
    const lineText = document.lineAt(position.line).text;
    const indent = lineText.search(/\S/);
    if (indent === -1) { return ''; }

    const keyMatch = lineText.match(/^\s*(\w[\w_-]*)\s*:/);
    if (!keyMatch) { return ''; }

    const currentKey = keyMatch[1];
    const pathParts: string[] = [currentKey];

    for (let i = position.line - 1; i >= 0; i--) {
        const prevLine = document.lineAt(i).text;
        const prevIndent = prevLine.search(/\S/);
        if (prevIndent === -1) { continue; }
        if (prevIndent >= indent) { continue; }

        const prevKeyMatch = prevLine.match(/^\s*(\w[\w_-]*)\s*:/);
        if (prevKeyMatch) {
            pathParts.unshift(prevKeyMatch[1]);
            break;
        }
    }

    return pathParts.join('.');
}

export class ConfigEditorProvider implements vscode.HoverProvider, vscode.CompletionItemProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.Hover | undefined {
        const keyPath = getKeyPathAtPosition(document, position);
        if (!keyPath) { return undefined; }

        const prop = flatConfigMap.get(keyPath);
        if (!prop) { return undefined; }

        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**${keyPath}**\n\n`);
        markdown.appendMarkdown(prop.description);
        markdown.appendMarkdown(`\n\n*Type:* \`${prop.type}\``);
        if (prop.defaultValue) {
            markdown.appendMarkdown(`  \n*Default:* \`${prop.defaultValue}\``);
        }
        if (prop.enumValues) {
            markdown.appendMarkdown(`  \n*Options:* ${prop.enumValues.map(v => `\`${v}\``).join(', ')}`);
        }

        return new vscode.Hover(markdown);
    }

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const lineText = document.lineAt(position.line).text;
        const trimmed = lineText.trimStart();

        // Determine parent path from indentation
        const parentPath = getKeyPathAtPosition(document, position);
        const parentProp = parentPath ? flatConfigMap.get(parentPath) : undefined;

        if (parentProp && parentProp.children) {
            for (const child of parentProp.children) {
                const item = new vscode.CompletionItem(child.key, vscode.CompletionItemKind.Property);
                item.detail = `${child.type}`;
                item.documentation = child.description;
                if (child.defaultValue) {
                    item.detail += ` (default: ${child.defaultValue})`;
                }
                if (child.enumValues) {
                    item.insertText = new vscode.SnippetString(`${child.key}: $1`);
                } else if (child.type === 'boolean') {
                    item.insertText = new vscode.SnippetString(`${child.key}: $1`);
                } else if (child.type === 'number') {
                    item.insertText = new vscode.SnippetString(`${child.key}: $1`);
                } else {
                    item.insertText = new vscode.SnippetString(`${child.key}: $1`);
                }
                items.push(item);
            }
        } else {
            for (const prop of configProperties) {
                const item = new vscode.CompletionItem(prop.key, vscode.CompletionItemKind.Property);
                item.detail = `${prop.type}`;
                item.documentation = prop.description;
                if (prop.defaultValue) {
                    item.detail += ` (default: ${prop.defaultValue})`;
                }
                items.push(item);
            }
        }

        const colonMatch = trimmed.match(/^(\w[\w_-]*)\s*:\s*(.*)$/);
        if (colonMatch) {
            const keyPath = getKeyPathAtPosition(document, position);
            const prop = flatConfigMap.get(keyPath);
            if (prop && prop.enumValues && prop.enumValues.length > 0) {
                items.push(...prop.enumValues.map(v => {
                    const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Enum);
                    item.detail = `Valid value for ${keyPath}`;
                    return item;
                }));
            }
            if (prop && prop.type === 'boolean') {
                items.push(
                    new vscode.CompletionItem('true', vscode.CompletionItemKind.Enum),
                    new vscode.CompletionItem('false', vscode.CompletionItemKind.Enum)
                );
            }
        }

        return items;
    }
}
