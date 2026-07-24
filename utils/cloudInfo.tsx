import { useState, useRef, useEffect } from "react";

interface InfoCloudProps {
  buttonLabel?: string;
  infoText?: string;
  width?: string;
}

export default function InfoCloud({
  buttonLabel = "?",
  infoText = "This is some helpful info or suggestion.",
  width = "w-64",
}: InfoCloudProps) {
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const cloudRef = useRef<HTMLDivElement | null>(null);

  // Close cloud when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cloudRef.current &&
        !cloudRef.current.contains(event.target as Node)
      ) {
        setShowInfo(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block">
      {/* Info Button */}
      <button
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          setShowInfo((prev) => !prev);
        }}
        className="px-3 py-1 bg-blue-400 text-white rounded"
      >
        {buttonLabel}
      </button>

      {/* Floating Info Cloud */}
      {showInfo && (
        <div
          ref={cloudRef}
          className={`absolute top-full mt-2 ${width} p-3 bg-white border rounded shadow-lg z-10`}
        >
          <p className="text-sm text-gray-800">{infoText}</p>
        </div>
      )}
    </div>
  );
}