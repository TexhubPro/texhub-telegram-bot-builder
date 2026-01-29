import { Button, Card, CardBody, Divider, Input, Listbox, ListboxItem } from '@heroui/react';

type NodeTemplate = {
    key: string;
    label: string;
    description: string;
    action: () => void;
};

type Props = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    templates: NodeTemplate[];
    statusLabel: string;
};

export function Sidebar({ searchTerm, onSearchChange, templates, statusLabel }: Props) {
    return (
        <aside className="w-72 border-r border-slate-200/70 bg-white/80 p-4 backdrop-blur">
            <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-2 font-['Fraunces'] text-lg text-slate-900">Nodes</div>
                    <Input
                        size="sm"
                        variant="bordered"
                        placeholder="Поиск ноды"
                        value={searchTerm}
                        onValueChange={onSearchChange}
                    />
                </div>
                <Card shadow="sm" className="border border-slate-200 bg-white/90">
                    <CardBody className="gap-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Создать</div>
                        <Listbox aria-label="Node templates" variant="flat" className="gap-1">
                            {templates.map((item) => (
                                <ListboxItem key={item.key} onPress={item.action} className="rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                                        <span className="text-xs text-slate-500">{item.description}</span>
                                    </div>
                                </ListboxItem>
                            ))}
                        </Listbox>
                    </CardBody>
                </Card>
                <Divider />
                <div className="text-xs text-slate-500">{statusLabel}</div>
            </div>
        </aside>
    );
}
