import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface ManimglInfo {
    installed: boolean;
    version?: string;
    isGitVersion?: boolean;
    pythonPath?: string;
}

export class VersionChecker {
    private getPythonPath(): string {
        const config = vscode.workspace.getConfiguration('manimgl-helper');
        const customPath = config.get<string>('pythonPath', '');
        if (customPath) {
            return customPath;
        }
        const pythonConfig = vscode.workspace.getConfiguration('python');
        return pythonConfig.get<string>('defaultInterpreterPath', 'python');
    }

    async check(): Promise<ManimglInfo> {
        const python = this.getPythonPath();

        return new Promise((resolve) => {
            const script = `
import sys
try:
    import manimlib
    version = getattr(manimlib, '__version__', None)
    if version is None:
        import importlib.metadata
        try:
            version = importlib.metadata.version('manimgl')
        except Exception:
            version = 'unknown'

    # Check if git version by looking at manimlib path
    import os
    manim_path = os.path.dirname(manimlib.__file__)
    is_git = os.path.exists(os.path.join(os.path.dirname(manim_path), '.git'))

    print(f"INSTALLED:{version}:{is_git}:{sys.executable}")
except ImportError:
    print("NOT_INSTALLED")
except Exception as e:
    print(f"ERROR:{e}")
`;

            const tempFile = path.join(__dirname, 'check_manim_version.py');
            fs.writeFileSync(tempFile, script);
            cp.exec(`"${python}" "${tempFile}"`, (err, stdout, _stderr) => {
                fs.unlinkSync(tempFile);
                if (err) {
                    resolve({ installed: false });
                    return;
                }
                try {
                    const output = stdout.trim();
                    if (output === 'NOT_INSTALLED') {
                        resolve({ installed: false });
                    } else if (output.startsWith('INSTALLED:')) {
                        const parts = output.substring('INSTALLED:'.length).split(':');
                        resolve({
                            installed: true,
                            version: parts[0],
                            isGitVersion: parts[1] === 'True',
                            pythonPath: parts[2]
                        });
                    } else if (output.startsWith('ERROR:')) {
                        resolve({ installed: false });
                    } else {
                        resolve({ installed: false });
                    }
                } catch {
                    resolve({ installed: false });
                }
            });
        });
    }

    async getDefaultConfig(): Promise<string> {
        return new Promise((resolve) => {
            const python = this.getPythonPath();
            const cmd = `"${python}" -c "import manimlib.default_config as dc; import json; dc_dict = {k:v for k,v in dc.__dict__.items() if not k.startswith('_')}; print(json.dumps(dc_dict, indent=2))" 2>nul || echo 'not found'`;
            cp.exec(cmd, (_err, stdout) => {
                try {
                    const obj = JSON.parse(stdout.trim());
                    const yaml = objectToYamlLike(obj, 0);
                    resolve(yaml || getDefaultConfigFallback());
                } catch {
                    resolve(getDefaultConfigFallback());
                }
            });
        });
    }
}

function getDefaultConfigFallback(): string {
    return `# ManimGL custom configuration
# See https://3b1b.github.io/manim/getting_started/configuration.html

directories:
  output: ./output
  mirror_module_path: false

camera:
  fps: 30
  background_color: "#000000"

tex:
  compiler: xelatex
`;
}

function objectToYamlLike(obj: Record<string, unknown>, indent: number): string {
    const lines: string[] = [];
    const pad = '  '.repeat(indent);
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            lines.push(`${pad}${key}:`);
            lines.push(objectToYamlLike(value as Record<string, unknown>, indent + 1));
        } else if (Array.isArray(value)) {
            lines.push(`${pad}${key}:`);
            for (const item of value) {
                lines.push(`${pad}  - ${item}`);
            }
        } else {
            lines.push(`${pad}${key}: ${value}`);
        }
    }
    return lines.join('\n');
}
