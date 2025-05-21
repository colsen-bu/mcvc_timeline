/**
 * Utility functions for exporting timeline to PNG
 */

/**
 * Creates a DOM snapshot with fixed colors for export
 * This helps avoid any styling issues with html2canvas
 */
export const createExportableClone = (element: HTMLElement | null) => {
  if (!element) return null;
  
  // Create a container to hold our clone
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.background = 'white';
  container.style.width = `${element.scrollWidth}px`;
  container.style.height = `${element.scrollHeight}px`;
  
  // Create a deep clone of the element
  const clone = element.cloneNode(true) as HTMLElement;
  container.appendChild(clone);
  
  // Fix any SVG issues
  const svgs = container.querySelectorAll('svg');
  svgs.forEach(svg => {
    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
  });

  // Ensure all images are properly loaded
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    img.crossOrigin = 'anonymous';
  });

  // Hide any buttons or interactive elements that shouldn't be in the export
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    button.style.display = 'none';
  });
  
  // Hide any hover-only elements
  const hoverElements = container.querySelectorAll('.group-hover\\:opacity-100');
  hoverElements.forEach(el => {
    if (el instanceof HTMLElement) {
      el.style.display = 'none';
    }
  });
  
  return container;
};
