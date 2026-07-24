// components/LoadingBars.tsx
import React from "react";

interface LoadingBarsProps {
  message?: string;
  progress?: number | null;
}

export default function LoadingBars({
  message = "Processing...",
  progress = null,
}: LoadingBarsProps) {
  const array = [1, 2, 3, 4, 5, 6];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="space x-30 y-10 flex">
        {array.map((ind) => (
          <div
            key={ind}
            className="w-4 h-10 bg-white rounded animate-bounce m-0.5"
            style={{
              animationDelay: `${ind * 0.1}s`,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>

      <p className="text-white text-lg font-medium">
        {message} {progress !== null ? `${Math.round(progress)}%` : ""}
      </p>
    </div>
  );
}