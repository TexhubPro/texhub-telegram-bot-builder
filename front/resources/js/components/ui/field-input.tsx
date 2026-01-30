import { Input } from '@heroui/react';

type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export function FieldInput({ label, value, onChange, placeholder }: Props) {
    return (
        <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-slate-600">{label}</label>
            <Input
                aria-label={label}
                value={value}
                onValueChange={onChange}
                placeholder={placeholder}
                variant="bordered"
                size="sm"
                classNames={{ inputWrapper: 'mt-0.5' }}
            />
        </div>
    );
}
