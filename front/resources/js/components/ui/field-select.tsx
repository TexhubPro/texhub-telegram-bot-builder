import { Select, SelectItem } from '@heroui/react';

type Option = {
    value: string;
    label: string;
};

type Props = {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    isClearable?: boolean;
};

export function FieldSelect({ label, value, onChange, options, placeholder, isClearable }: Props) {
    const ariaLabel = label || placeholder || 'select';
    const selectedKeys = value ? new Set([value]) : new Set<string>();
    return (
        <div className="flex flex-col gap-2">
            {label ? <label className="block text-lg mt-5 font-semibold text-slate-600">{label}</label> : null}
            <Select
                aria-label={ariaLabel}
                selectedKeys={selectedKeys}
                onSelectionChange={(keys) => {
                    const [first] = Array.from(keys) as string[];
                    onChange(first ?? '');
                }}
                placeholder={placeholder}
                variant="bordered"
                size="sm"
                isClearable={isClearable}
                onClear={() => onChange('')}
                classNames={{ trigger: 'mt-0.5' }}
            >
                {options.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
            </Select>
        </div>
    );
}
