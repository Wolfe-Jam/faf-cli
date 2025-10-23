/**
 * BIG ORANGE 🍊 - Output Handler
 * Pushes comparison results to Big🍊 web visualization
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ComparisonResults } from './types';

/**
 * Push comparison results to Big🍊
 * @param results - Comparison results to store
 * @returns URL to view results
 */
export async function pushToBigO(results: ComparisonResults): Promise<string> {
  const sessionId = results.sessionId;
  
  // For now: Write to file system
  // Later: POST to API endpoint
  
  const dataDir = process.env.BIGO_DATA_DIR || '/tmp/big-orange-sessions';
  const sessionFile = join(dataDir, `${sessionId}.json`);
  
  try {
    // Ensure directory exists
    await mkdir(dataDir, { recursive: true });
    
    // Write session data
    await writeFile(
      sessionFile,
      JSON.stringify(results, null, 2),
      'utf-8'
    );
    
    console.log(`✓ Session saved: ${sessionFile}`);
    
  } catch (error) {
    console.error('Failed to save session:', error);
    throw error;
  }
  
  // Return URL to Big🍊
  const baseUrl = process.env.BIGO_URL || 'https://fafdev.tools';
  return `${baseUrl}/BigO?session=${sessionId}`;
}

/**
 * Fetch session results (for Big🍊 web app)
 * @param sessionId - Session ID to fetch
 * @returns Comparison results
 */
export async function fetchSession(sessionId: string): Promise<ComparisonResults | null> {
  const dataDir = process.env.BIGO_DATA_DIR || '/tmp/big-orange-sessions';
  const sessionFile = join(dataDir, `${sessionId}.json`);
  
  try {
    const { readFile } = await import('fs/promises');
    const data = await readFile(sessionFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Session not found: ${sessionId}`);
    return null;
  }
}
