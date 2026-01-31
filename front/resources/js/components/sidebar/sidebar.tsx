import { Button, Card, CardBody, Divider, Input, Listbox, ListboxItem } from '@heroui/react';

type NodeTemplate = {
    key: string;
    label: string;
    description: string;
    action: () => void;
    group?: string;
};

type Props = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    templates: NodeTemplate[];
    statusLabel: string;
};

export function Sidebar({ searchTerm, onSearchChange, templates, statusLabel }: Props) {
    const grouped = templates.reduce((acc, item) => {
        const group = item.group ?? 'Основное';
        if (!acc.has(group)) {
            acc.set(group, []);
        }
        acc.get(group)?.push(item);
        return acc;
    }, new Map<string, NodeTemplate[]>());
    const groupEntries = Array.from(grouped.entries());
    return (
        <aside className="w-72 bg-white/80 p-4 backdrop-blur lg:border-r lg:border-slate-200/70">
            <div className="flex h-[92vh] max-h-full flex-col gap-4 overflow-y-scroll">
                <div className="">
                    <div className="mb-2 font-['Fraunces'] text-lg text-slate-900">Nodes</div>
                    <Input size="sm" variant="bordered" placeholder="Поиск ноды" value={searchTerm} onValueChange={onSearchChange} />
                </div>
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Создать</div>
                {groupEntries.map(([group, items]) => (
                    <div key={group} className="space-y-2">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{group}</div>
                        <Listbox aria-label={`Node templates ${group}`} variant="flat" className="gap-1">
                            {items.map((item) => (
                                <ListboxItem key={item.key} onPress={item.action} className="rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                                        <span className="text-xs text-slate-500">{item.description}</span>
                                    </div>
                                </ListboxItem>
                            ))}
                        </Listbox>
                    </div>
                ))}
            </div>
            <div className="text-xs text-slate-500">{statusLabel}</div>
        </aside>
    );
}
