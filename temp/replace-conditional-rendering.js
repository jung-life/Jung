#!/usr/bin/env node

/**
 * This script finds and replaces conditional rendering patterns in React components
 * from the pattern: condition && <Component />
 * to the pattern: condition ? <Component /> : null
 * 
 * Usage: node replace-conditional-rendering.js [directory]
 * If no directory is provided, it defaults to 'src'
 */

const fs = require('fs');
const path = require('path');

// Get the directory to search from command line args or default to 'src'
const searchDir = process.argv[2] || 'src';

// File extensions to search
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Counter for replaced patterns
let replacedCount = 0;

/**
 * Recursively search for files with the specified extensions
 * @param {string} dir - Directory to search
 * @returns {string[]} - Array of file paths
 */
function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findFiles(filePath));
    } else {
      // Check if file has one of the specified extensions
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

/**
 * Replace conditional rendering patterns in a file
 * @param {string} filePath - Path to the file
 */
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Regular expression to find the pattern: {condition && <Component />}
  // This regex looks for:
  // 1. An opening curly brace
  // 2. Any characters that are not a closing curly brace
  // 3. The && operator
  // 4. A JSX opening tag (starts with <)
  // 5. Any characters until the closing curly brace
  const regex = /\{([^}]*?)&&\s*(<[^(][^}]*?)\}/g;
  
  // Replace with the ternary pattern
  const newContent = content.replace(regex, (match, condition, component) => {
    replacedCount++;
    return `{${condition.trim()} ? ${component.trim()} : null}`;
  });
  
  // Only write to the file if changes were made
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  - Replaced patterns in ${filePath}`);
  }
}

// Find all files and process them
console.log(`Searching for files in ${searchDir}...`);
const files = findFiles(searchDir);
console.log(`Found ${files.length} files to process.`);

files.forEach(processFile);

console.log(`Done! Replaced ${replacedCount} conditional rendering patterns.`);
