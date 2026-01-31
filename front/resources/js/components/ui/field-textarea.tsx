import { Textarea } from '@heroui/react';

type Props = {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export function FieldTextarea({ label, value, onChange, placeholder }: Props) {
    const ariaLabel = label || placeholder || 'textarea';
    return (
        <div className="flex flex-col gap-2">
            {label ? <label className="block text-lg mt-5 font-semibold text-slate-600">{label}</label> : null}
            <Textarea
                aria-label={ariaLabel}
                value={value}
                onValueChange={onChange}
                placeholder={placeholder}
                minRows={6}
                variant="bordered"
                size="sm"
                classNames={{ inputWrapper: 'mt-0.5', input: 'resize-y' }}
            />
        </div>
    );
}
