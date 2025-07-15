'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrainCircuit, Lightbulb, Loader2, RotateCw, Wand2 } from 'lucide-react';
import { generateParaphraseChain } from '@/ai/flows/paraphrase-chain';
import { useToast } from '@/hooks/use-toast';

const initialSentences = [
  "Con mèo trèo cây cau.",
  "Một con vịt xòe ra hai cái cánh.",
  "Hôm nay trời nắng chang chang.",
  "Ăn quả nhớ kẻ trồng cây.",
  "Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.",
  "Im lặng là vàng.",
  "Giấy rách phải giữ lấy lề."
];

const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:"-]/g, "")
    .replace(/\s+/g, ' ')
    .trim();
};

export default function Home() {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [originalSentence, setOriginalSentence] = useState('');
  const [finalSentence, setFinalSentence] = useState('');
  const [playerGuess, setPlayerGuess] = useState('');
  const [result, setResult] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const { toast } = useToast();

  const hint = useMemo(() => {
    if (!originalSentence) return '';
    const words = originalSentence.split(' ');
    if (words.length < 3) return `Câu gốc chỉ có ${words.length} từ.`;
    return `Gợi ý: Câu bắt đầu bằng "${words[0]}" và kết thúc bằng "${words[words.length - 1]}".`;
  }, [originalSentence]);

  const handleStartGame = async () => {
    setIsLoading(true);
    setResult(null);
    setShowHint(false);
    setPlayerGuess('');

    const randomSentence = initialSentences[Math.floor(Math.random() * initialSentences.length)];
    setOriginalSentence(randomSentence);

    try {
        const response = await generateParaphraseChain({
            originalSentence: randomSentence,
            numIterations: difficulty,
        });
        
        setFinalSentence(response.finalSentence);
        setGameState('playing');

    } catch (error) {
        console.error("Lỗi khi tạo chuỗi:", error);
        toast({
            title: "Có lỗi xảy ra",
            description: "Không thể tạo câu mới. Vui lòng thử lại.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmitGuess = () => {
    const normalizedGuess = normalizeString(playerGuess);
    const normalizedOriginal = normalizeString(originalSentence);

    if (normalizedGuess === normalizedOriginal) {
      setResult({ message: 'Xuất sắc! Bạn đã đoán chính xác tuyệt đối!', isCorrect: true });
    } else if (normalizedOriginal.includes(normalizedGuess) || normalizedGuess.includes(normalizedOriginal)) {
       setResult({ message: 'Rất gần! Nội dung của bạn gần như chính xác.', isCorrect: true });
    } else {
      setResult({ message: 'Chưa đúng rồi. Cùng xem lại câu gốc nhé!', isCorrect: false });
    }
    setGameState('result');
  };

  const handleNewGame = () => {
    setGameState('setup');
    setResult(null);
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Wand2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline font-bold">Lời Thì Thầm Biến Dạng</CardTitle>
          </div>
          <CardDescription className="text-md pt-2">
            Đoán câu gốc từ phiên bản đã bị AI "tam sao thất bản".
          </CardDescription>
        </CardHeader>
        
        <CardContent className="min-h-[24rem] flex flex-col justify-center">
          {gameState === 'setup' && (
            <div className="space-y-6 text-center animate-in fade-in-50 duration-500">
              <p>Chọn độ khó để bắt đầu thử thách khả năng suy luận của bạn!</p>
              <div className="space-y-4 px-4 sm:px-8">
                <Label htmlFor="difficulty" className="text-lg">Số lượt biến đổi: <span className="font-bold text-primary">{difficulty}</span></Label>
                <Slider
                  id="difficulty"
                  min={2}
                  max={10}
                  step={1}
                  value={[difficulty]}
                  onValueChange={(value) => setDifficulty(value[0])}
                  disabled={isLoading}
                />
              </div>
              <Button onClick={handleStartGame} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Bắt đầu
              </Button>
            </div>
          )}

          {(gameState === 'playing' || (gameState === 'result' && result)) && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Câu đã bị biến đổi:</Label>
                <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted rounded-r-md">
                  <p className="text-lg italic text-muted-foreground">{finalSentence}</p>
                </blockquote>
              </div>
              
              {showHint && gameState === 'playing' && (
                <Alert className="bg-accent/20 border-accent/40 text-accent-foreground">
                  <Lightbulb className="h-4 w-4 !text-accent-foreground" />
                  <AlertTitle>Gợi ý</AlertTitle>
                  <AlertDescription>{hint}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="guess" className="text-lg font-semibold">Câu gốc bạn đoán là:</Label>
                <Input
                  id="guess"
                  type="text"
                  placeholder="Nhập câu gốc bạn nghĩ..."
                  value={playerGuess}
                  onChange={(e) => setPlayerGuess(e.target.value)}
                  disabled={isLoading || gameState === 'result'}
                  onKeyDown={(e) => { if (e.key === 'Enter' && playerGuess && gameState === 'playing') handleSubmitGuess()}}
                />
              </div>

              {gameState === 'playing' && (
                <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Gợi ý
                  </Button>
                  <Button onClick={handleSubmitGuess} disabled={!playerGuess}>
                    Gửi đáp án
                  </Button>
                </div>
              )}
            </div>
          )}

          {gameState === 'result' && result && (
             <div className="space-y-4 text-center mt-6 animate-in fade-in-50 duration-500">
                <h3 className={`text-2xl font-bold ${result.isCorrect ? 'text-primary' : 'text-destructive'}`}>
                    {result.message}
                </h3>
                <Card className="text-left bg-muted/50">
                    <CardHeader>
                        <CardTitle>Chi tiết vòng chơi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold">Đáp án của bạn:</p>
                            <p className="italic text-muted-foreground">"{playerGuess}"</p>
                        </div>
                        <div>
                            <p className="font-semibold">Câu gốc chính xác:</p>
                            <p className="italic text-primary font-medium">"{originalSentence}"</p>
                        </div>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Quá trình biến đổi</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p><strong className="text-green-500">Bắt đầu:</strong> {originalSentence}</p>
                                    <p className="text-sm text-muted-foreground">... qua {difficulty} lần biến đổi ...</p>
                                    <p><strong className="text-destructive">Kết thúc:</strong> {finalSentence}</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
                <Button onClick={handleNewGame} size="lg">
                    <RotateCw className="mr-2 h-4 w-4" />
                    Chơi lại
                </Button>
             </div>
          )}
        </CardContent>
        <CardFooter className="text-center justify-center">
            <p className="text-xs text-muted-foreground">Phát triển với Genkit và Next.js</p>
        </CardFooter>
      </Card>
    </main>
  );
}
