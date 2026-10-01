"use client";

import { useEffect, useRef, useState } from "react";

const MIN_HEIGHT = 1100;

export function HomepageConfiguratorEmbed() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      if (event.data?.source !== "fine-line-configurator") return;
      if (event.data.type === "resize" && Number.isFinite(event.data.height)) {
        setHeight(Math.max(MIN_HEIGHT, event.data.height));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      title="Fine Line embroidery configurator"
      src="/configure?embed=1"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      style={{ display: "block", width: "100%", height, border: 0, background: "#f6f2ec" }}
    />
  );
}
