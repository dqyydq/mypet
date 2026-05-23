/**
 * Zero-dependency DOM-to-image utility.
 * Renders a DOM element (with fully inline styles) into a Canvas via SVG foreignObject.
 */

function inlineComputedStyles(element) {
  const clone = element.cloneNode(true);
  _inlineRecursive(element, clone);
  return clone;
}

function _inlineRecursive(source, target) {
  const computed = getComputedStyle(source);

  const relevant = [
    'background', 'background-color', 'background-image', 'background-size',
    'border', 'border-radius', 'box-shadow',
    'color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'text-align', 'letter-spacing', 'line-height',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
    'width', 'height', 'max-width', 'min-width',
    'position', 'top', 'right', 'bottom', 'left',
    'overflow', 'white-space', 'word-break', 'word-wrap',
    'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'transform', 'transform-origin', 'opacity',
  ];

  const styleStr = relevant
    .map((prop) => {
      const val = computed.getPropertyValue(prop);
      return val ? `${prop}:${val}` : '';
    })
    .filter(Boolean)
    .join(';');

  target.setAttribute('style', styleStr);

  for (let i = 0; i < source.children.length; i++) {
    if (target.children[i]) {
      _inlineRecursive(source.children[i], target.children[i]);
    }
  }
}

export async function domToBlob(element, width, height) {
  const withStyles = inlineComputedStyles(element);
  // Off-screen elements have left:-9999px in computed styles; reset to origin so
  // the foreignObject renders the content within the canvas bounds.
  withStyles.style.position = 'absolute';
  withStyles.style.left = '0px';
  withStyles.style.top = '0px';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const fo = document.createElementNS(svgNS, 'foreignObject');
  fo.setAttribute('width', '100%');
  fo.setAttribute('height', '100%');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '0');

  const wrapper = document.createElement('div');
  wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  wrapper.appendChild(withStyles);
  fo.appendChild(wrapper);
  svg.appendChild(fo);

  const svgString = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.width = width;
  img.height = height;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Failed to render share image'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // White background fallback
  ctx.fillStyle = '#FFFDF5';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}
