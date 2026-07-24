import { useState, useRef, useEffect } from "react";

interface HelpCloudProps {
  buttonLabel?: string;
  placeholder?: string;
  width?: string;
}

export default function HelpCloud({
  buttonLabel = "?",
  placeholder = "Type something...",
  width = "w-64",
}: HelpCloudProps) {
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const cloudRef = useRef<HTMLDivElement | null>(null);

  // Close cloud when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cloudRef.current &&
        !cloudRef.current.contains(event.target as Node)
      ) {
        setShowHelp(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block">
      {/* Help Button */}
      <button
        onClick={() => setShowHelp((prev) => !prev)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {buttonLabel}
      </button>

      {/* Floating Cloud */}
      {showHelp && (
        <div
          ref={cloudRef}
          className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 ${width} p-3 bg-white border rounded shadow-lg z-[100]`}
        >
          <p className="text-sm text-gray-800 mb-2">
            Type your suggestion or question:
          </p>

          <textarea
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInputValue(e.target.value)
            }
            placeholder={placeholder}
            rows={3}
            className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
          />
        </div>
      )}
    </div>
  );
}