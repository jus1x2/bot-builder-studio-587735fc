import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, AlertCircle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface ConfigFieldProps {
  // Простое человеческое название (не техническое)
  label: string;
  // Объяснение что это делает простыми словами
  description?: string;
  // Совет как лучше использовать
  tip?: string;
  // Пример значения
  example?: string;
  // Обязательное ли поле
  required?: boolean;
  // Функция валидации
  validate?: (value: any) => ValidationResult;
  // Показывать ли inline подсказку
  showInlineHelp?: boolean;
  children: ReactNode;
  className?: string;
}

export function ConfigField({
  label,
  description,
  tip,
  example,
  required,
  validate,
  showInlineHelp = true,
  children,
  className,
}: ConfigFieldProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          {tip && (
            <button
              type="button"
              onClick={() => setShowTip(!showTip)}
              className="p-0.5 rounded hover:bg-muted transition-colors"
            >
              <Lightbulb className={cn(
                "w-3.5 h-3.5 transition-colors",
                showTip ? "text-amber-500" : "text-muted-foreground"
              )} />
            </button>
          )}
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      <AnimatePresence>
        {showTip && tip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">{tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-1.5">
        {children}
      </div>

      {example && (
        <p className="text-xs text-muted-foreground/70">
          Например: <span className="font-mono text-muted-foreground">{example}</span>
        </p>
      )}
    </div>
  );
}

// Предустановленные варианты для select полей - понятные для обычных людей
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface ConfigSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function ConfigSelect({ value, onChange, options, placeholder }: ConfigSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="telegram-input">
        <SelectValue placeholder={placeholder || "Выберите..."} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <div>
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Текстовое поле с автодополнением переменных
interface ConfigTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  showVariables?: boolean;
  validate?: (value: string) => ValidationResult;
  type?: 'text' | 'number' | 'url' | 'email';
  min?: number;
  max?: number;
}

export function ConfigTextInput({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  showVariables,
  validate,
  type = 'text',
  min,
  max,
}: ConfigTextInputProps) {
  const [focused, setFocused] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (validate) {
      setValidation(validate(newValue));
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (validate && value) {
      setValidation(validate(value));
    }
  };

  const availableVariables = [
    { name: 'first_name', label: 'Имя пользователя' },
    { name: 'last_name', label: 'Фамилия' },
    { name: 'username', label: 'Ник в Telegram' },
    { name: 'user_id', label: 'ID пользователя' },
    { name: 'date', label: 'Текущая дата' },
    { name: 'time', label: 'Текущее время' },
  ];

  const insertVariable = (varName: string) => {
    onChange(value + `{${varName}}`);
  };

  return (
    <div className="space-y-2">
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          className={cn(
            "telegram-input resize-none",
            validation && !validation.valid && "border-destructive focus-visible:ring-destructive"
          )}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          className={cn(
            "telegram-input",
            validation && !validation.valid && "border-destructive focus-visible:ring-destructive"
          )}
        />
      )}

      {/* Валидация */}
      <AnimatePresence>
        {validation && !validation.valid && validation.message && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-1.5 text-destructive"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs">{validation.message}</span>
          </motion.div>
        )}
        {validation && validation.valid && validation.message && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-1.5 text-green-600 dark:text-green-400"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs">{validation.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Переменные */}
      {showVariables && focused && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2 rounded-lg bg-muted/50 border border-border"
        >
          <p className="text-xs text-muted-foreground mb-2">
            Вставить данные пользователя:
          </p>
          <div className="flex flex-wrap gap-1">
            {availableVariables.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => insertVariable(v.name)}
                className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title={v.label}
              >
                {`{${v.name}}`}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Переключатель с понятным описанием
interface ConfigToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export function ConfigToggle({ checked, onChange, label, description, icon }: ConfigToggleProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer",
        checked 
          ? "bg-primary/10 border border-primary/30" 
          : "bg-muted/30 border border-transparent hover:bg-muted/50"
      )}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            checked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
        <div>
          <p className={cn(
            "text-sm font-medium",
            checked ? "text-foreground" : "text-muted-foreground"
          )}>
            {label}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// Числовое поле с ползунком
interface ConfigNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  presets?: { value: number; label: string }[];
}

export function ConfigNumber({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  presets,
}: ConfigNumberProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="telegram-input w-24"
        />
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
      
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg transition-colors",
                value === preset.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Информационный блок
interface ConfigInfoProps {
  type: 'info' | 'warning' | 'success' | 'tip';
  children: ReactNode;
}

export function ConfigInfo({ type, children }: ConfigInfoProps) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
    success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300',
    tip: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300',
  };

  const icons = {
    info: <Info className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
    success: <CheckCircle2 className="w-4 h-4" />,
    tip: <Lightbulb className="w-4 h-4" />,
  };

  return (
    <div className={cn("flex items-start gap-2.5 p-3 rounded-xl border", styles[type])}>
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

// Группа полей
interface ConfigGroupProps {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function ConfigGroup({ title, description, children, collapsible, defaultOpen = true }: ConfigGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="space-y-3 pl-0.5">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="text-left">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
