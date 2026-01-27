import { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number; // 每个字符的延迟时间（毫秒）
  onComplete?: () => void;
  className?: string;
}

export function TypewriterText({ 
  text, 
  speed = 30, 
  onComplete,
  className = "" 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // 重置效果（当text改变时）
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">_</span>
      )}
    </span>
  );
}

interface TypewriterLinesProps {
  lines: string[];
  speed?: number;
  lineDelay?: number; // 每行之间的延迟时间（毫秒）
  className?: string;
  onComplete?: () => void;
}

export function TypewriterLines({ 
  lines, 
  speed = 30, 
  lineDelay = 100,
  className = "",
  onComplete 
}: TypewriterLinesProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);

  const handleLineComplete = () => {
    // 将当前行标记为完成
    setCompletedLines(prev => [...prev, lines[currentLineIndex]]);
    
    // 延迟后开始下一行
    setTimeout(() => {
      if (currentLineIndex < lines.length - 1) {
        setCurrentLineIndex(prev => prev + 1);
      } else if (onComplete) {
        onComplete();
      }
    }, lineDelay);
  };

  // 重置效果（当lines改变时）
  useEffect(() => {
    setCurrentLineIndex(0);
    setCompletedLines([]);
  }, [lines]);

  return (
    <div className={`font-mono text-sm ${className}`}>
      {/* 已完成的行 */}
      {completedLines.map((line, index) => (
        <div key={index} className="mb-1">
          {line}
        </div>
      ))}
      
      {/* 当前正在打字的行 */}
      {currentLineIndex < lines.length && (
        <div className="mb-1">
          <TypewriterText
            text={lines[currentLineIndex]}
            speed={speed}
            onComplete={handleLineComplete}
          />
        </div>
      )}
    </div>
  );
}
