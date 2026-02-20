/**
 * TAF Star Badge - SVG Renderer
 *
 * Black block + gold star polygon shapes.
 * npm-safe: direct coordinates, no transform="scale(.1)" trick.
 *
 * Visual: black inverse block + gold fill = premium, classy
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseTAF } from './parser';
import { calculateStarRatingFromTAF, StarRating } from './star-rating';

export interface StarBadgeOptions {
  tafPath?: string;
}

export interface StarBadgeResult {
  success: boolean;
  svg?: string;
  rating?: StarRating;
  error?: string;
}

const GOLD = '#FFB800';
const DIM = '#555';
const BG = '#111';

/**
 * 5-pointed star polygon path centered at (cx, cy) with given radius.
 * Returns an SVG path data string.
 */
function starPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 2) + (i * Math.PI / 5);
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${points.join('L')}Z`;
}

/**
 * Render star badge SVG — black block with gold stars.
 *
 * @param stars - Star count (0-5, 0.5 increments)
 * @param label - Display text (e.g. "878/878")
 * @param passedCount - Tests passed
 * @param totalCount - Tests total
 */
export function renderStarBadgeSvg(
  stars: number,
  label: string,
  passedCount: number,
  totalCount: number,
): string {
  const height = 28;
  const starSize = 8;     // outer radius
  const innerSize = 3.5;  // inner radius
  const starSpacing = 20;
  const starStartX = 14;
  const starCenterY = height / 2;

  // Calculate widths
  const starsBlockWidth = starStartX + 5 * starSpacing;
  const charWidth = 6.5;
  const textPadding = 8;
  const labelWidth = Math.round(label.length * charWidth + textPadding * 2);
  const totalWidth = starsBlockWidth + labelWidth;

  const ariaLabel = `${stars} out of 5 stars: ${passedCount} of ${totalCount} tests passed`;

  let starsSvg = '';

  for (let i = 0; i < 5; i++) {
    const cx = starStartX + i * starSpacing;
    const d = starPath(cx, starCenterY, starSize, innerSize);

    if (i + 1 <= Math.floor(stars)) {
      // Full star — gold filled
      starsSvg += `  <path d="${d}" fill="${GOLD}"/>\n`;
    } else if (i + 0.5 === stars) {
      // Half star — left half gold, right half outline
      const clipId = `half-${i}`;
      starsSvg += `  <defs><clipPath id="${clipId}"><rect x="${cx - starSize}" y="${starCenterY - starSize}" width="${starSize}" height="${starSize * 2}"/></clipPath></defs>\n`;
      starsSvg += `  <path d="${d}" fill="${DIM}" stroke="${DIM}" stroke-width="0.5"/>\n`;
      starsSvg += `  <path d="${d}" fill="${GOLD}" clip-path="url(#${clipId})"/>\n`;
    } else {
      // Empty star — dim outline
      starsSvg += `  <path d="${d}" fill="none" stroke="${DIM}" stroke-width="1"/>\n`;
    }
  }

  const textX = starsBlockWidth + labelWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${ariaLabel}">
  <title>${ariaLabel}</title>
  <rect width="${totalWidth}" height="${height}" rx="4" fill="${BG}"/>
${starsSvg}  <text x="${textX}" y="18" fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">${label}</text>
</svg>`;
}

/**
 * Generate star badge from .taf file.
 */
export function generateStarBadge(options: StarBadgeOptions = {}): StarBadgeResult {
  const tafPath = options.tafPath || path.join(process.cwd(), '.taf');

  try {
    if (!fs.existsSync(tafPath)) {
      // No data — render empty stars
      return {
        success: true,
        svg: renderStarBadgeSvg(0, 'no data', 0, 0),
        rating: { stars: 0, display: '☆☆☆☆☆', label: '0.0 stars' },
      };
    }

    const content = fs.readFileSync(tafPath, 'utf-8');
    const taf = parseTAF(content);
    const rating = calculateStarRatingFromTAF(taf);

    if (!rating) {
      return {
        success: true,
        svg: renderStarBadgeSvg(0, 'no data', 0, 0),
        rating: { stars: 0, display: '☆☆☆☆☆', label: '0.0 stars' },
      };
    }

    const latest = taf.test_history[taf.test_history.length - 1];
    const passed = latest.tests.passed;
    const total = latest.tests.total;
    const label = `${passed}/${total}`;

    return {
      success: true,
      svg: renderStarBadgeSvg(rating.stars, label, passed, total),
      rating,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate star badge',
    };
  }
}
