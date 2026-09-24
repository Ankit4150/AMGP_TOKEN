import React from "react";

export default function Logo({ size = 36, className = "" }) {
  return (
    <img
      src="/amgp-logo.png"
      alt="AMGP Token"
      width={size}
      height={size}
      draggable="false"
      className={`block shrink-0 object-contain bg-transparent p-0 m-0 border-0 rounded-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
