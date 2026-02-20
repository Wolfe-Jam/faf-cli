import { renderStarBadgeSvg } from '../../src/taf/star-badge';

describe('renderStarBadgeSvg', () => {
  it('returns valid SVG', () => {
    const svg = renderStarBadgeSvg(5, '878/878', 878, 878);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('always contains 5 star shapes', () => {
    const svg = renderStarBadgeSvg(3, '300/400', 300, 400);
    // Count <path elements (star shapes)
    const pathMatches = svg.match(/<path /g);
    // At least 5 paths for 5 stars
    expect(pathMatches).not.toBeNull();
    expect(pathMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it('uses gold fill for filled stars', () => {
    const svg = renderStarBadgeSvg(5, '100/100', 100, 100);
    expect(svg).toContain('#FFB800');
  });

  it('uses dim outline for empty stars', () => {
    const svg = renderStarBadgeSvg(0, 'no data', 0, 0);
    expect(svg).toContain('#555');
  });

  it('has black background', () => {
    const svg = renderStarBadgeSvg(5, '100/100', 100, 100);
    expect(svg).toContain('#111');
    expect(svg).toContain('rx="4"');
  });

  it('has clipPath for half stars', () => {
    const svg = renderStarBadgeSvg(4.5, '96/100', 96, 100);
    expect(svg).toContain('<clipPath');
    expect(svg).toContain('clip-path=');
  });

  it('has no clipPath for whole stars', () => {
    const svg = renderStarBadgeSvg(5, '100/100', 100, 100);
    expect(svg).not.toContain('<clipPath');
  });

  it('includes accessibility attributes', () => {
    const svg = renderStarBadgeSvg(5, '100/100', 100, 100);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label=');
    expect(svg).toContain('<title>');
  });

  it('includes label text', () => {
    const svg = renderStarBadgeSvg(5, '878/878', 878, 878);
    expect(svg).toContain('878/878');
  });

  it('renders 0 stars as all empty outlines', () => {
    const svg = renderStarBadgeSvg(0, 'no data', 0, 0);
    // Should have empty star outlines (stroke only, no fill)
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#555"');
    // Should NOT have gold fill
    expect(svg).not.toContain('#FFB800');
  });

  it('renders 3 stars with 3 gold and 2 empty', () => {
    const svg = renderStarBadgeSvg(3, '60/100', 60, 100);
    // Count gold fills
    const goldFills = (svg.match(/fill="#FFB800"/g) || []).length;
    expect(goldFills).toBe(3);
    // Count empty outlines
    const emptyOutlines = (svg.match(/fill="none"/g) || []).length;
    expect(emptyOutlines).toBe(2);
  });

  it('does not use transform="scale(.1)" trick', () => {
    const svg = renderStarBadgeSvg(5, '100/100', 100, 100);
    expect(svg).not.toContain('transform="scale');
  });

  it('has reasonable dimensions', () => {
    const svg = renderStarBadgeSvg(5, '100/100', 100, 100);
    const widthMatch = svg.match(/width="(\d+)"/);
    const heightMatch = svg.match(/height="(\d+)"/);
    expect(widthMatch).not.toBeNull();
    expect(heightMatch).not.toBeNull();
    const width = parseInt(widthMatch![1]);
    const height = parseInt(heightMatch![1]);
    expect(height).toBe(28);
    expect(width).toBeGreaterThan(100);
    expect(width).toBeLessThan(300);
  });
});
