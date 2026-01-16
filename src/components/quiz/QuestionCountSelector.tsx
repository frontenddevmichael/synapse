import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface QuestionCountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuestionCountSelector({ 
  value, 
  onChange, 
  min = 5, 
  max = 25 
}: QuestionCountSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Questions</Label>
        <span className="text-sm font-medium text-primary">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={5}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
