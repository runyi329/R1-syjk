import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Snapshot {
  id: number;
  image: string;
  title: string;
}

const snapshots: Snapshot[] = [
  {
    id: 1,
    image: '/account-snapshot-1.jpg',
    title: '交易账户快照 #1',
  },
  {
    id: 2,
    image: '/account-snapshot-2.jpg',
    title: '交易账户快照 #2',
  },
];

export function AccountSnapshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % snapshots.length);
    }, 5000); // 5秒自动切换

    return () => clearInterval(interval);
  }, [autoPlay]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + snapshots.length) % snapshots.length);
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % snapshots.length);
    setAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  return (
    <div className="w-full space-y-4 overflow-hidden" style={{ clipPath: 'inset(0)' }}>
      {/* 轮播容器 */}
      <div 
        className="relative w-full overflow-hidden rounded-lg shadow-lg bg-background"
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
      >
        {/* 图片显示 */}
        <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px]">
          {snapshots.map((snapshot, index) => (
            <div
              key={snapshot.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={snapshot.image}
                alt={snapshot.title}
                className="w-full h-full object-contain bg-black"
              />
            </div>
          ))}
        </div>

        {/* 左右导航按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={goToPrevious}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={goToNext}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        {/* 幻灯片计数器 */}
        <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {snapshots.length}
        </div>
      </div>

      {/* 下方指示点 */}
      <div className="flex justify-center gap-2 overflow-hidden">
        {snapshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary w-8'
                : 'bg-muted-foreground hover:bg-muted-foreground/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* 说明文字 */}
      <div className="text-center text-sm text-muted-foreground overflow-hidden">
        <p>真实投资者交易账户快照展示</p>
      </div>
    </div>
  );
}
