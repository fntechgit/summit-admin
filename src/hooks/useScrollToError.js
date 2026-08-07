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

// Waits two animation frames so a DOM mutation applied just before this call
// (e.g. React removing a tabpanel's `hidden` attribute after setActiveTab)
// has been through layout before we measure/scroll against it.
function afterNextLayout(callback) {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

const useScrollToError = (formik, relative = false, setActiveTab) => {
  const { errors, isValid, isSubmitting } = formik;
  const errorArray = Object.keys(errors);
  const errorCount = errorArray.length;

  useEffect(() => {
    if (isValid || errorCount === 0) return;

    const scrollToFirstVisible = () => {
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

      if (relative) {
        target?.element.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      } else {
        smoothScrollTo(scrollToY, duration);
      }
    };

    if (typeof setActiveTab !== "function") {
      scrollToFirstVisible(); // unchanged path for every other call site
      return;
    }

    // Tab-aware path: panels in a tabbed form are typically mounted-but-
    // hidden, so `[name=...]` selectors still match fields on an inactive
    // tab, but measuring/scrolling a `display:none` element is meaningless.
    // `offsetParent` is `null` for any element hidden via `display:none`,
    // including via an ancestor's `hidden` attribute.
    const matches = errorArray
      .map((error) => document.querySelector(`[name='${error}']`))
      .filter(Boolean);

    const allMatchesHidden =
      matches.length > 0 && matches.every((el) => el.offsetParent === null);

    if (!allMatchesHidden) {
      scrollToFirstVisible();
      return;
    }

    // Every matched field is hidden: jump to the tab that owns the first
    // errored field, then defer the scroll until it's actually visible.
    const tabValue = matches[0].closest("[data-tab-value]")?.dataset.tabValue;

    if (!tabValue) {
      scrollToFirstVisible(); // not inside a tagged tab panel, fall back
      return;
    }

    setActiveTab(tabValue);
    afterNextLayout(scrollToFirstVisible);
  }, [isSubmitting]);
};

export default useScrollToError;
