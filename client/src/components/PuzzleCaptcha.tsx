import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PuzzleCaptchaProps {
  token: string;
  onVerified: (answer: string) => void;
  onClose?: () => void;
}

export function PuzzleCaptcha({ token, onVerified, onClose }: PuzzleCaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [failureCount, setFailureCount] = useState(0);

  const CANVAS_WIDTH = 300;
  const CANVAS_HEIGHT = 100;
  const PUZZLE_SIZE = 50;

  // 生成随机拼图位置
  const generatePuzzle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制背景
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制网格背景
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // 绘制提示文字
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('向右滑动拼图', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    ctx.font = '12px Arial';
    ctx.fillText('(4位数字验证码)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);

    // 绘制拼图块
    const puzzleX = 10;
    const puzzleY = (CANVAS_HEIGHT - PUZZLE_SIZE) / 2;

    // 绘制拼图块背景
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(puzzleX, puzzleY, PUZZLE_SIZE, PUZZLE_SIZE);

    // 绘制拼图块边框
    ctx.strokeStyle = '#45a049';
    ctx.lineWidth = 2;
    ctx.strokeRect(puzzleX, puzzleY, PUZZLE_SIZE, PUZZLE_SIZE);

    // 绘制箭头
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('→', puzzleX + PUZZLE_SIZE / 2, puzzleY + PUZZLE_SIZE / 2);
  };

  useEffect(() => {
    generatePuzzle();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // 检查是否在拼图块内
    if (x >= 10 && x <= 10 + PUZZLE_SIZE && e.clientY - rect.top >= (CANVAS_HEIGHT - PUZZLE_SIZE) / 2 && e.clientY - rect.top <= (CANVAS_HEIGHT - PUZZLE_SIZE) / 2 + PUZZLE_SIZE) {
      setIsDragging(true);
      setStartX(x);
      setCurrentX(0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const moveDistance = x - startX;

    // 限制移动范围
    if (moveDistance >= 0 && moveDistance <= CANVAS_WIDTH - PUZZLE_SIZE - 10) {
      setCurrentX(moveDistance);
      redrawWithPuzzle(moveDistance);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // 检查是否滑动到底部
    if (currentX > CANVAS_WIDTH - PUZZLE_SIZE - 30) {
      // 滑动成功，显示输入框
      setAnswer('');
    } else {
      // 重置
      setCurrentX(0);
      generatePuzzle();
    }
  };

  const redrawWithPuzzle = (moveDistance: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制背景
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制网格背景
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // 绘制拼图块
    const puzzleY = (CANVAS_HEIGHT - PUZZLE_SIZE) / 2;

    // 绘制拼图块背景
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(10 + moveDistance, puzzleY, PUZZLE_SIZE, PUZZLE_SIZE);

    // 绘制拼图块边框
    ctx.strokeStyle = '#45a049';
    ctx.lineWidth = 2;
    ctx.strokeRect(10 + moveDistance, puzzleY, PUZZLE_SIZE, PUZZLE_SIZE);

    // 绘制箭头
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('→', 10 + moveDistance + PUZZLE_SIZE / 2, puzzleY + PUZZLE_SIZE / 2);
  };

  const handleSubmit = async () => {
    if (!answer || answer.length !== 4) {
      toast.error('请输入4位数字验证码');
      return;
    }

    setIsVerifying(true);
    try {
      onVerified(answer);
    } catch (error) {
      setFailureCount(failureCount + 1);
      if (failureCount >= 2) {
        toast.error('验证码错误次数过多，请重新开始');
        setCurrentX(0);
        setAnswer('');
        generatePuzzle();
      } else {
        toast.error('验证码错误，请重试');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-card/80 backdrop-blur-sm border-primary/20">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">滑动拼图验证</h3>
        <p className="text-sm text-muted-foreground">向右滑动拼图块到最右边</p>
      </div>

      {/* 拼图画布 */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full border border-primary/30 rounded-lg cursor-grab active:cursor-grabbing bg-white"
      />

      {/* 验证码输入 */}
      {currentX > CANVAS_WIDTH - PUZZLE_SIZE - 30 && (
        <div className="space-y-3 animate-in fade-in">
          <div>
            <label className="text-sm font-medium">输入4位验证码</label>
            <Input
              type="text"
              placeholder="请输入4位数字"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              className="mt-1 border-primary/20 focus:border-primary"
              disabled={isVerifying}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isVerifying || answer.length !== 4}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isVerifying ? '验证中...' : '验证'}
          </Button>
        </div>
      )}

      {/* 关闭按钮 */}
      {onClose && (
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          关闭
        </Button>
      )}
    </Card>
  );
}
