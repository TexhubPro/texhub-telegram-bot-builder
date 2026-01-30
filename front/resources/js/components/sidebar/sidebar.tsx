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
        <aside className="w-72 border-r border-slate-200/70 bg-white/80 p-4 backdrop-blur">
            <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-2 font-['Fraunces'] text-lg text-slate-900">Nodes</div>
                    <Input size="sm" variant="bordered" placeholder="Поиск ноды" value={searchTerm} onValueChange={onSearchChange} />
                </div>
                <Card shadow="sm" className="max-h-[calc(100vh-300px)] overflow-y-scroll border border-slate-200 bg-white/90">
                    <CardBody className="gap-3">
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
                    </CardBody>
                </Card>
                <Divider />
                <div className="text-xs text-slate-500">{statusLabel}</div>
            </div>
        </aside>
    );
}
