/** Check if user has Pro access */
export function isPro(): boolean {
  return process.env.FAF_PRO === '1' || process.env.FAF_PRO === 'true';
}
