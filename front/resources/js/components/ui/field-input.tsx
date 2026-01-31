import { Input } from '@heroui/react';

type Props = {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    min?: string;
    step?: string;
};

export function FieldInput({ label, value, onChange, placeholder, type, min, step }: Props) {
    const ariaLabel = label || placeholder || 'input';
    return (
        <div className="flex flex-col gap-2">
            {label ? <label className="block text-lg mt-5 font-semibold text-slate-600">{label}</label> : null}
            <Input
                aria-label={ariaLabel}
                value={value}
                onValueChange={onChange}
                placeholder={placeholder}
                type={type}
                min={min}
                step={step}
                variant="bordered"
                size="sm"
                classNames={{ inputWrapper: 'mt-0.5' }}
            />
        </div>
    );
}
