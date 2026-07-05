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
        description: 'Directory paths for manimgl output, assets, and caching.',
        type: 'object',
        children: [
            {
                key: 'mirror_module_path',
                description: 'When true, output files are saved in a subdirectory matching the source file path.',
                type: 'boolean',
                defaultValue: 'false'
            },
            {
                key: 'base',
                description: 'Base directory for all output/asset paths. If empty, uses the current working directory.',
                type: 'string',
                defaultValue: ''
            },
            {
                key: 'subdirs',
                description: 'Subdirectory names for different types of files.',
                type: 'object',
                children: [
                    { key: 'output', description: 'Subdirectory for rendered video and image output files.', type: 'string', defaultValue: 'videos' },
                    { key: 'raster_images', description: 'Subdirectory for raster image assets (PNG, JPG, etc.).', type: 'string', defaultValue: 'raster_images' },
                    { key: 'vector_images', description: 'Subdirectory for vector image assets (SVG, etc.).', type: 'string', defaultValue: 'vector_images' },
                    { key: 'three_d_models', description: 'Subdirectory for 3D model files.', type: 'string', defaultValue: 'three_d_models' },
                    { key: 'sounds', description: 'Subdirectory for sound assets.', type: 'string', defaultValue: 'sounds' },
                    { key: 'data', description: 'Subdirectory for data files (CSV, JSON, etc.).', type: 'string', defaultValue: 'data' },
                    { key: 'downloads', description: 'Subdirectory for downloaded files.', type: 'string', defaultValue: 'downloads' },
                    { key: 'latex_cache', description: 'Subdirectory for cached LaTeX compilation results.', type: 'string', defaultValue: 'latex_cache' }
                ]
            },
            {
                key: 'cache',
                description: 'Custom cache directory for Tex/Text compilation artifacts. If empty, uses appdirs.user_cache_dir(\'manim\').',
                type: 'string',
                defaultValue: ''
            }
        ]
    },
    {
        key: 'window',
        description: 'Interactive preview window settings.',
        type: 'object',
        children: [
            {
                key: 'position_string',
                description: 'Window position on screen. UR=Upper Right, UL=Upper Left, DR=Down Right, DL=Down Left, OO=Center, UO=Upper Middle, DO=Down Middle, LO=Left Middle, RO=Right Middle.',
                type: 'string',
                defaultValue: 'UR',
                enumValues: ['UR', 'UL', 'DR', 'DL', 'OO', 'UO', 'DO', 'LO', 'RO']
            },
            {
                key: 'monitor_index',
                description: 'When using multiple monitors, which monitor to show the window on (0-indexed).',
                type: 'integer',
                defaultValue: '0'
            },
            {
                key: 'full_screen',
                description: 'Open the preview window in full screen mode.',
                type: 'boolean',
                defaultValue: 'false'
            },
            {
                key: 'position',
                description: 'Specific window position in pixel coordinates, e.g. \'(500, 500)\'. Overrides position_string if set.',
                type: 'string'
            },
            {
                key: 'size',
                description: 'Specific window size in pixels, e.g. \'(1920, 1080)\'. Overrides full_screen if set.',
                type: 'string'
            }
        ]
    },
    {
        key: 'camera',
        description: 'Default camera and rendering settings.',
        type: 'object',
        children: [
            { key: 'resolution', description: 'Default output resolution as a tuple (width, height) in pixels, e.g. (1920, 1080).', type: 'string', defaultValue: '(1920, 1080)' },
            { key: 'background_color', description: 'Background color as hex string (e.g., "#333333") or named color.', type: 'string', defaultValue: '#333333' },
            { key: 'fps', description: 'Frames per second for rendered video output.', type: 'integer', defaultValue: '30' },
            { key: 'background_opacity', description: 'Background opacity (0.0 = transparent, 1.0 = opaque).', type: 'number', defaultValue: '1.0' }
        ]
    },
    {
        key: 'file_writer',
        description: 'FFmpeg and file encoding settings for video output.',
        type: 'object',
        children: [
            { key: 'ffmpeg_bin', description: 'Path or command name for the FFmpeg binary.', type: 'string', defaultValue: 'ffmpeg' },
            { key: 'video_codec', description: 'FFmpeg video codec to use for encoding.', type: 'string', defaultValue: 'libx264' },
            { key: 'pixel_format', description: 'FFmpeg pixel format for output video.', type: 'string', defaultValue: 'yuv420p' },
            { key: 'saturation', description: 'Color saturation multiplier for output video (1.0 = original).', type: 'number', defaultValue: '1.0' },
            { key: 'gamma', description: 'Gamma correction for output video (1.0 = no correction).', type: 'number', defaultValue: '1.0' }
        ]
    },
    {
        key: 'scene',
        description: 'Default scene behavior settings.',
        type: 'object',
        children: [
            { key: 'show_animation_progress', description: 'Show progress bar during animation rendering.', type: 'boolean', defaultValue: 'false' },
            { key: 'leave_progress_bars', description: 'Keep progress bar lines visible after rendering completes.', type: 'boolean', defaultValue: 'false' },
            { key: 'preview_while_skipping', description: 'When skipping animations, render a single frame at the end of each play() call.', type: 'boolean', defaultValue: 'true' },
            { key: 'default_wait_time', description: 'Default duration in seconds for Scene.wait() when no argument is given.', type: 'number', defaultValue: '1.0' }
        ]
    },
    {
        key: 'vmobject',
        description: 'Default styling for VMobject (fillable/strokable vector mobjects).',
        type: 'object',
        children: [
            { key: 'default_stroke_width', description: 'Default stroke width for VMobjects.', type: 'number', defaultValue: '4.0' },
            { key: 'default_stroke_color', description: 'Default stroke color for VMobjects. Default is GREY_A (#DDDDDD).', type: 'string', defaultValue: '#DDDDDD' },
            { key: 'default_fill_color', description: 'Default fill color for VMobjects. Default is GREY_C (#888888).', type: 'string', defaultValue: '#888888' }
        ]
    },
    {
        key: 'mobject',
        description: 'Default styling for base Mobjects.',
        type: 'object',
        children: [
            { key: 'default_mobject_color', description: 'Default color for Mobjects. Default is WHITE (#FFFFFF).', type: 'string', defaultValue: '#FFFFFF' },
            { key: 'default_light_color', description: 'Default color for light/shading on Mobjects. Default is GREY_B (#BBBBBB).', type: 'string', defaultValue: '#BBBBBB' }
        ]
    },
    {
        key: 'tex',
        description: 'LaTeX template configuration for Tex mobjects.',
        type: 'object',
        children: [
            { key: 'template', description: 'Name of the LaTeX template to use (from tex_templates.yml). Set to \'default\' for the built-in template.', type: 'string', defaultValue: 'default' },
            { key: 'font_size_for_unit_height', description: 'The font size at which Tex("0") has a height of 1 manim unit.', type: 'integer', defaultValue: '144' }
        ]
    },
    {
        key: 'text',
        description: 'Default text rendering settings.',
        type: 'object',
        children: [
            { key: 'font', description: 'Default font family to use for Text mobjects.', type: 'string', defaultValue: 'Consolas' },
            { key: 'alignment', description: 'Default text alignment. Valid values: LEFT, CENTER, RIGHT.', type: 'string', defaultValue: 'LEFT', enumValues: ['LEFT', 'CENTER', 'RIGHT'] },
            { key: 'font_size_for_unit_height', description: 'The font size at which Text("0") has a height of 1 manim unit.', type: 'integer', defaultValue: '144' }
        ]
    },
    {
        key: 'embed',
        description: 'Settings for the interactive IPython embedding (self.embed()).',
        type: 'object',
        children: [
            { key: 'exception_mode', description: 'Exception verbosity mode when embedded. Use \'Verbose\' for detailed tracebacks.', type: 'string', defaultValue: 'Verbose' },
            { key: 'autoreload', description: 'Automatically reload modules before each interactive command.', type: 'boolean', defaultValue: 'false' }
        ]
    },
    {
        key: 'resolution_options',
        description: 'Pre-defined resolution presets used by CLI flags (-l, -m, --hd, --uhd).',
        type: 'object',
        children: [
            { key: 'low', description: 'Low quality resolution tuple. Used with -l flag.', type: 'string', defaultValue: '(854, 480)' },
            { key: 'med', description: 'Medium quality resolution tuple. Used with -m flag.', type: 'string', defaultValue: '(1280, 720)' },
            { key: 'high', description: 'High quality resolution tuple. Used with --hd flag.', type: 'string', defaultValue: '(1920, 1080)' },
            { key: '4k', description: '4K quality resolution tuple. Used with --uhd flag.', type: 'string', defaultValue: '(3840, 2160)' }
        ]
    },
    {
        key: 'sizes',
        description: 'Dimension constants that control the coordinate system and default spacing.',
        type: 'object',
        children: [
            { key: 'frame_height', description: 'Height of the animation frame in manim units. Determines the scale of the coordinate system.', type: 'number', defaultValue: '8.0' },
            { key: 'small_buff', description: 'Small spacing buffer constant (SMALL_BUFF).', type: 'number', defaultValue: '0.1' },
            { key: 'med_small_buff', description: 'Medium-small spacing buffer constant (MED_SMALL_BUFF).', type: 'number', defaultValue: '0.25' },
            { key: 'med_large_buff', description: 'Medium-large spacing buffer constant (MED_LARGE_BUFF).', type: 'number', defaultValue: '0.5' },
            { key: 'large_buff', description: 'Large spacing buffer constant (LARGE_BUFF).', type: 'number', defaultValue: '1.0' },
            { key: 'default_mobject_to_edge_buff', description: 'Default buffer used in Mobject.to_edge().', type: 'number', defaultValue: '0.5' },
            { key: 'default_mobject_to_mobject_buff', description: 'Default buffer used in Mobject.next_to() for spacing between mobjects.', type: 'number', defaultValue: '0.25' }
        ]
    },
    {
        key: 'key_bindings',
        description: 'Keyboard shortcut bindings for the interactive preview window.',
        type: 'object',
        children: [
            { key: 'pan_3d', description: 'Key binding for 3D pan mode.', type: 'string', defaultValue: 'd' },
            { key: 'pan', description: 'Key binding for pan mode.', type: 'string', defaultValue: 'f' },
            { key: 'reset', description: 'Key binding to reset the camera view.', type: 'string', defaultValue: 'r' },
            { key: 'quit', description: 'Key binding to quit interactive mode (together with Command/Ctrl).', type: 'string', defaultValue: 'q' },
            { key: 'select', description: 'Key binding for selection mode.', type: 'string', defaultValue: 's' },
            { key: 'unselect', description: 'Key binding to unselect all objects.', type: 'string', defaultValue: 'u' },
            { key: 'grab', description: 'Key binding for grab/drag mode.', type: 'string', defaultValue: 'g' },
            { key: 'x_grab', description: 'Key binding to grab along the X axis only.', type: 'string', defaultValue: 'h' },
            { key: 'y_grab', description: 'Key binding to grab along the Y axis only.', type: 'string', defaultValue: 'v' },
            { key: 'z_grab', description: 'Key binding to grab along the Z axis only.', type: 'string', defaultValue: 'z' },
            { key: 'resize', description: 'Key binding for resize mode.', type: 'string', defaultValue: 't' },
            { key: 'color', description: 'Key binding for color picker mode.', type: 'string', defaultValue: 'c' },
            { key: 'information', description: 'Key binding to show object information.', type: 'string', defaultValue: 'i' },
            { key: 'cursor', description: 'Key binding for cursor mode.', type: 'string', defaultValue: 'k' }
        ]
    },
    {
        key: 'colors',
        description: 'Custom color palette definitions. Defines named colors like BLUE, RED, GREEN, etc. for use in manimgl scenes.',
        type: 'object'
    },
    {
        key: 'log_level',
        description: 'Logging verbosity level for manimgl output.',
        type: 'string',
        defaultValue: 'INFO',
        enumValues: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
    },
    {
        key: 'universal_import_line',
        description: 'Import line executed automatically when entering interactive mode (self.embed()).',
        type: 'string',
        defaultValue: 'from manimlib import *'
    },
    {
        key: 'ignore_manimlib_modules_on_reload',
        description: 'When true, manimlib internal modules are excluded from hot-reloading, preventing side effects from reloading library code.',
        type: 'boolean',
        defaultValue: 'true'
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
