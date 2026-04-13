import { useCallback, useRef } from "react";

interface FreeTextPromptProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id: string;
}

export function FreeTextPrompt({
  label,
  value,
  onChange,
  placeholder,
  id,
}: FreeTextPromptProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-text-primary text-sm font-medium">
        {label}
      </label>
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-[16px] border-2 border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-focus focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
      />
    </div>
  );
}
