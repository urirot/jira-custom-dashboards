import React, { useRef, useEffect, useState, useCallback } from "react";

interface FloatingScrollbarProps {
  scrollContainer: React.RefObject<HTMLDivElement | null>;
  height?: number;
  trackColor?: string;
  thumbColor?: string;
}

const SCROLLBAR_HEIGHT = 20;

const FloatingScrollbar: React.FC<FloatingScrollbarProps> = ({
  scrollContainer,
  height = SCROLLBAR_HEIGHT,
  trackColor = "#e3eafc",
  thumbColor = "#1976d2",
}) => {
  const [scrollState, setScrollState] = useState({
    scrollLeft: 0,
    scrollWidth: 1,
    clientWidth: 1,
  });
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  // Sync state with scroll container
  const updateScrollState = useCallback(() => {
    const el = scrollContainer.current;
    if (!el) return;
    setScrollState({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });
  }, [scrollContainer]);

  useEffect(() => {
    const el = scrollContainer.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [scrollContainer, updateScrollState]);

  // Drag logic
  const onThumbMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = scrollState.scrollLeft;
    document.body.style.userSelect = "none";
  };
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const el = scrollContainer.current;
      if (!el) return;
      const dx = e.clientX - dragStartX.current;
      const trackWidth = el.clientWidth;
      const scrollable = el.scrollWidth - el.clientWidth;
      if (scrollable <= 0) return;
      const thumbWidth = Math.max(
        (trackWidth / el.scrollWidth) * trackWidth,
        40
      );
      const maxThumbX = trackWidth - thumbWidth;
      const scrollRatio = scrollable / maxThumbX;
      el.scrollLeft = dragStartScrollLeft.current + dx * scrollRatio;
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.userSelect = "";
    };
    if (dragging.current) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [scrollContainer, scrollState.scrollLeft]);

  // Calculate thumb size and position
  const { scrollLeft, scrollWidth, clientWidth } = scrollState;
  const trackWidth = clientWidth;
  const scrollable = scrollWidth - clientWidth;
  const thumbWidth =
    scrollable > 0
      ? Math.max((clientWidth / scrollWidth) * trackWidth, 40)
      : trackWidth;
  const maxThumbX = trackWidth - thumbWidth;
  const thumbX = scrollable > 0 ? (scrollLeft / scrollable) * maxThumbX : 0;

  if (scrollWidth <= clientWidth) return null; // No need for scrollbar

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        width: "100vw",
        height,
        background: "transparent",
        zIndex: 2000,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100vw",
          height,
          background: trackColor,
          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: thumbX,
            top: 0,
            width: thumbWidth,
            height,
            background: thumbColor,
            cursor: "pointer",
            transition: dragging.current ? "none" : "background 0.2s",
            boxShadow: dragging.current
              ? "0 0 0 4px rgba(25, 118, 210, 0.12)"
              : undefined,
          }}
          onMouseDown={onThumbMouseDown}
        />
      </div>
    </div>
  );
};

export default FloatingScrollbar;
