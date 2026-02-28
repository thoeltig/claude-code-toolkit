"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.fileExists = fileExists;
const fs_1 = require("fs");
const fs_2 = require("fs");
const path_1 = require("path");
async function readFile(path) {
    try {
        return await fs_1.promises.readFile(path, 'utf-8');
    }
    catch (utf8Err) {
        try {
            return await fs_1.promises.readFile(path, 'latin1');
        }
        catch (latin1Err) {
            throw new Error(`Failed to read file ${path}: ${utf8Err}`);
        }
    }
    ;
}
async function writeFile(path, content) {
    try {
        const dir = (0, path_1.dirname)(path);
        await fs_1.promises.mkdir(dir, { recursive: true });
        await fs_1.promises.writeFile(path, content, 'utf-8');
    }
    catch (err) {
        throw new Error(`Failed to write file ${path}: ${err}`);
    }
}
function fileExists(path) {
    return (0, fs_2.existsSync)(path);
}
