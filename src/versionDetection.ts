import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Detects the CrewAI version from a workspace by examining various project files
 * like requirements.txt, pyproject.toml, etc.
 * 
 * @param workspacePath - Path to the workspace root
 * @returns The detected CrewAI version or "latest" if not found
 */
export async function detectCrewAIVersion(workspacePath: string): Promise<string> {
  try {
    // Check requirements.txt
    const requirementsPath = path.join(workspacePath, 'requirements.txt');
    if (await fileExists(requirementsPath)) {
      const content = await fs.readFile(requirementsPath, 'utf8');
      
      // Look for crewai with version specifier
      const match = content.match(/crewai[=~<>]+([0-9]+\.[0-9]+\.[0-9]+)/i);
      if (match && match[1]) {
        return normalizeVersion(match[1]);
      }
    }
    
    // Check pyproject.toml
    const pyprojectPath = path.join(workspacePath, 'pyproject.toml');
    if (await fileExists(pyprojectPath)) {
      const content = await fs.readFile(pyprojectPath, 'utf8');
      
      // Look for crewai dependency declaration
      // First try with quotes
      let match = content.match(/crewai\s*=\s*["']([0-9]+\.[0-9]+\.[0-9]+)["']/i);
      
      // If not found, try looking for it in other formats
      if (!match) {
        match = content.match(/crewai\s*=\s*([0-9]+\.[0-9]+\.[0-9]+)/i);
      }
      
      if (match && match[1]) {
        return normalizeVersion(match[1]);
      }
    }
    
    // Check Poetry's poetry.lock
    const poetryLockPath = path.join(workspacePath, 'poetry.lock');
    if (await fileExists(poetryLockPath)) {
      const content = await fs.readFile(poetryLockPath, 'utf8');
      
      // Find crewai package in poetry.lock
      const crewaiSection = content.match(/\[\[package\]\]\nname = "crewai"[\s\S]*?version = "([0-9]+\.[0-9]+\.[0-9]+)"/);
      if (crewaiSection && crewaiSection[1]) {
        return normalizeVersion(crewaiSection[1]);
      }
    }
    
    // Default to latest if not found
    return "latest";
  } catch (error) {
    console.error('Error detecting CrewAI version:', error);
    return "latest";
  }
}

/**
 * Normalize version number to match schema directory names
 * @param version The version string to normalize
 * @returns Normalized version string
 */
function normalizeVersion(version: string): string {
  // Extract major and minor version
  const parts = version.split('.');
  if (parts.length >= 2) {
    // Find the closest available schema version
    return `${parts[0]}.${parts[1]}.0`;
  }
  return version;
}

/**
 * Check if a file exists
 * @param filePath Path to check
 * @returns True if file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
} 