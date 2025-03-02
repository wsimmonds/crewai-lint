const fs = require('fs');
const path = require('path');

/**
 * Recursive function to copy a directory with all its contents
 * @param {string} source Source directory
 * @param {string} destination Destination directory
 */
function copyDirectoryRecursive(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read all entries in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directories
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

/**
 * Bundle dependencies that need to be included with the extension
 */
function bundleDependencies() {
  try {
    console.log('Bundling dependencies...');
    
    // Ensure the output directory exists
    const outDir = path.join(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Bundle js-yaml
    const jsYamlSourceDir = path.join(__dirname, 'node_modules', 'js-yaml');
    const jsYamlDestDir = path.join(outDir, 'js-yaml');

    // Check if js-yaml exists in node_modules
    if (!fs.existsSync(jsYamlSourceDir)) {
      throw new Error('js-yaml not found in node_modules. Make sure it is installed.');
    }

    // Copy the js-yaml package
    console.log(`Copying js-yaml from ${jsYamlSourceDir} to ${jsYamlDestDir}`);
    
    // Start by cleaning up the destination directory if it exists
    if (fs.existsSync(jsYamlDestDir)) {
      fs.rmSync(jsYamlDestDir, { recursive: true, force: true });
    }
    
    // Create the destination directory
    fs.mkdirSync(jsYamlDestDir, { recursive: true });
    
    // Copy the essential parts of js-yaml
    
    // Copy package.json
    fs.copyFileSync(
      path.join(jsYamlSourceDir, 'package.json'),
      path.join(jsYamlDestDir, 'package.json')
    );
    
    // Copy index.js
    fs.copyFileSync(
      path.join(jsYamlSourceDir, 'index.js'),
      path.join(jsYamlDestDir, 'index.js')
    );
    
    // Copy lib directory (contains the core functionality)
    const libSourceDir = path.join(jsYamlSourceDir, 'lib');
    const libDestDir = path.join(jsYamlDestDir, 'lib');
    
    if (fs.existsSync(libSourceDir)) {
      copyDirectoryRecursive(libSourceDir, libDestDir);
    }
    
    // Copy dist directory (contains the bundled browser version)
    const distSourceDir = path.join(jsYamlSourceDir, 'dist');
    const distDestDir = path.join(jsYamlDestDir, 'dist');
    
    if (fs.existsSync(distSourceDir)) {
      copyDirectoryRecursive(distSourceDir, distDestDir);
    }
    
    console.log('Successfully bundled dependencies');
  } catch (error) {
    console.error('Error bundling dependencies:', error);
    process.exit(1);
  }
}

// Execute the bundling
bundleDependencies(); 