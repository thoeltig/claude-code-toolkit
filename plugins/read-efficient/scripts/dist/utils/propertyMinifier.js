"use strict";
/**
 * Minifies JSON object properties by:
 * - Reducing consecutive whitespace in string values
 * - Converting string booleans and numbers to actual types
 * - Omitting null and empty/whitespace-only strings
 * - Recursively processing nested objects and arrays
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.minifyJsonProperties = minifyJsonProperties;
/**
 * Minifies whitespace in a string (consecutive spaces/newlines)
 * Reduces multiple spaces/tabs to single space, multiple newlines to single newline
 */
function minifyString(value) {
    // Replace consecutive spaces/tabs with single space
    let result = value.replace(/[ \t]+/g, ' ');
    // Replace consecutive newlines with single newline
    result = result.replace(/\n\n+/g, '\n');
    // Trim spaces around newlines
    result = result.replace(/ *\n */g, '\n');
    // Trim leading/trailing whitespace
    result = result.trim();
    return result;
}
/**
 * Attempts to convert string to appropriate type
 * Safe conversions only:
 * - "true" -> true, "false" -> false
 * - numeric strings (no leading zeros except "0") -> number
 */
function convertType(value) {
    // Exact boolean matches
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    // Numeric conversion: only if it looks like a number
    // Allow: "123", "3.14", "-5", but NOT "007" or "0123" (leading zeros)
    if (/^-?\d+(\.\d+)?$/.test(value)) {
        // Reject leading zeros (except for "0" itself)
        if (value !== '0' && value.startsWith('0') && !value.startsWith('-')) {
            return value;
        }
        const num = parseFloat(value);
        if (!isNaN(num))
            return num;
    }
    return value;
}
/**
 * Checks if a value is empty (null, empty string, or whitespace-only)
 */
function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string') {
        return value.trim().length === 0;
    }
    return false;
}
/**
 * Recursively minifies object/array properties
 */
function minifyObject(obj, options) {
    if (obj === null || obj === undefined) {
        return undefined; // Will be omitted by parent
    }
    if (Array.isArray(obj)) {
        return obj
            .map(item => {
            // Handle string items in arrays
            if (typeof item === 'string') {
                let minified = item;
                if (options.minifyContent) {
                    minified = minifyString(item);
                }
                // Try type conversion
                if (options.convertTypes && minified.trim().length > 0) {
                    minified = convertType(minified);
                }
                return minified;
            }
            return minifyObject(item, options);
        })
            .filter(item => !(options.omitEmpty && isEmpty(item)));
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            let processedValue = value;
            if (value === null || value === undefined) {
                if (!options.omitEmpty) {
                    result[key] = null;
                }
                continue;
            }
            if (typeof value === 'string') {
                // Minify the string content
                if (options.minifyContent) {
                    processedValue = minifyString(value);
                }
                else {
                    processedValue = value;
                }
                // Check if empty after minification
                if (options.omitEmpty && processedValue.trim().length === 0) {
                    continue;
                }
                // Try type conversion
                if (options.convertTypes && processedValue.trim().length > 0) {
                    processedValue = convertType(processedValue);
                }
            }
            else if (Array.isArray(value)) {
                processedValue = minifyObject(value, options);
                // Keep empty arrays for structure indication
            }
            else if (typeof value === 'object') {
                processedValue = minifyObject(value, options);
            }
            // Only add if not empty (or if we're keeping empties)
            if (!options.omitEmpty || !isEmpty(processedValue)) {
                result[key] = processedValue;
            }
        }
        return result;
    }
    return obj;
}
/**
 * Main entry point: minifies a JSON object or array
 * Default options: minify content, convert types, omit empty values
 */
function minifyJsonProperties(obj, customOptions) {
    const options = {
        minifyContent: true,
        convertTypes: true,
        omitEmpty: true,
        ...customOptions
    };
    return minifyObject(obj, options);
}
