/* global window, document */
let relativeToViewport;
const isRelativeToViewport = () => {
  if (relativeToViewport != null) {
    return relativeToViewport;
  }

  const x = window.pageXOffset ? (window.pageXOffset + window.innerWidth) - 1 : 0;
  const y = window.pageYOffset ? (window.pageYOffset + window.innerHeight) - 1 : 0;
  if (!x && !y) {
    return true;
  }

  // Test with a point larger than the viewport. If it returns an element,
  // then that means elementFromPoint takes page coordinates.
  relativeToViewport = !document.elementFromPoint(x, y);
  return relativeToViewport;
};

export default (x, y) => (
  isRelativeToViewport()
    ? document.elementFromPoint(x, y)
    : document.elementFromPoint(x + window.pageXOffset, y + window.pageYOffset)
  );
