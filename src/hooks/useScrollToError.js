import { useEffect } from "react";

// Smooth scroll for window
function smoothScrollTo(targetScrollTop, duration) {
  const startScrollTop =
    window.pageYOffset || document.documentElement.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  let startTime = null;

  function animationStep(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    const progress = Math.min(elapsed / duration, 1);
    const easeInOutQuad =
      // eslint-disable-next-line no-magic-numbers
      progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2;

    const newScrollTop = startScrollTop + distance * easeInOutQuad;
    window.scrollTo(0, newScrollTop);

    if (elapsed < duration) {
      requestAnimationFrame(animationStep);
    }
  }

  requestAnimationFrame(animationStep);
}

const useScrollToError = (formik) => {
  const { errors, isValid, isSubmitting } = formik;
  const errorArray = Object.keys(errors);
  const errorCount = errorArray.length;

  useEffect(() => {
    if (isValid || errorCount === 0) return;

    const elementsSorted = errorArray
      .reduce((result, error) => {
        const element = document.querySelector(`[name='${error}']`);
        if (!element) return result;

        const rect = element.getBoundingClientRect();
        const absoluteTop = rect.top + window.pageYOffset;

        result.push({ element, top: absoluteTop });
        return result;
      }, [])
      .sort((a, b) => a.top - b.top);

    if (elementsSorted.length === 0) return;

    const target = elementsSorted[0];

    const offset = 100; // adjust as needed
    const duration = 500; // 500ms scroll duration
    const scrollToY = target.top - offset;

    smoothScrollTo(scrollToY, duration);
  }, [isSubmitting]);
};

export default useScrollToError;
