import * as path from 'path';
import * as fs from 'fs';
import Mocha from 'mocha';

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000
    });

    const testsRoot = path.resolve(__dirname);

    // Find all .test.js files recursively
    function findTestFiles(dir: string): string[] {
        const files: string[] = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...findTestFiles(fullPath));
            } else if (entry.name.endsWith('.test.js')) {
                files.push(fullPath);
            }
        }
        return files;
    }

    const testFiles = findTestFiles(testsRoot);
    testFiles.forEach(f => mocha.addFile(f));

    return new Promise<void>((resolve, reject) => {
        try {
            mocha.run((failures: number) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err as Error);
        }
    });
}
