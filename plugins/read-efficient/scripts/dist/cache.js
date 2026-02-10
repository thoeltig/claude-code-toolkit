"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachePath = getCachePath;
exports.checkCacheExists = checkCacheExists;
exports.resolveCachePath = resolveCachePath;
exports.writeCache = writeCache;
exports.generateManifest = generateManifest;
const path_1 = require("path");
const fileHandler_1 = require("./utils/fileHandler");
function getCachePath(originalPath) {
    const ext = (0, path_1.extname)(originalPath);
    const name = (0, path_1.basename)(originalPath, ext);
    const dir = (0, path_1.dirname)(originalPath);
    return ext ? `${dir}/${name}.compact${ext}` : `${dir}/${name}.compact`;
}
function checkCacheExists(cachedPath) {
    return (0, fileHandler_1.fileExists)(cachedPath);
}
function resolveCachePath(originalPath, overwrite) {
    const cachePath = getCachePath(originalPath);
    if (overwrite || !checkCacheExists(cachePath)) {
        return cachePath;
    }
    const ext = (0, path_1.extname)(cachePath);
    const nameWithoutExt = cachePath.slice(0, -ext.length);
    let counter = 1;
    while (checkCacheExists(`${nameWithoutExt}(${counter})${ext}`)) {
        counter++;
    }
    return `${nameWithoutExt}(${counter})${ext}`;
}
async function writeCache(originalPath, content, overwrite) {
    try {
        const cachePath = resolveCachePath(originalPath, overwrite);
        await (0, fileHandler_1.writeFile)(cachePath, content);
        return { success: true, path: cachePath };
    }
    catch (err) {
        return { success: false, message: `Failed to write cache: ${err}` };
    }
}
function generateManifest(files) {
    return { processed: files.map(f => ({ file: f.file, cached: f.cached, path: f.cachedPath })), total: files.length };
}
