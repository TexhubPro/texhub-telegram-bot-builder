import { Button, Card, CardBody, Divider } from '@heroui/react';
import type { Node } from 'reactflow';
import type { NodeData, NodeKind } from '../types';
import { FieldInput } from '../ui/field-input';
import { FieldTextarea } from '../ui/field-textarea';

type Values = {
    commandText: string;
    messageText: string;
    buttonText: string;
    imageUrls: string;
};

type Props = {
    node: Node<NodeData> | null;
    values: Values;
    onChange: (values: Values) => void;
    onSave: () => void;
    onClose: () => void;
};

const getTitle = (kind?: NodeKind) => {
    switch (kind) {
        case 'command':
            return 'Команда';
        case 'message':
            return 'Сообщение';
        case 'message_button':
            return 'Message Button';
        case 'reply_button':
            return 'Reply Button';
        case 'image':
            return 'Изображения';
        default:
            return 'Редактор';
    }
};

export function NodeEditorPanel({ node, values, onChange, onSave, onClose }: Props) {
    if (!node) {
        return (
            <aside className="w-80 border-l border-slate-200/70 bg-white/80 p-4 backdrop-blur">
                <div className="text-xs text-slate-500">Выбери ноду и нажми «Изменить».</div>
            </aside>
        );
    }

    const kind = node.data.kind;
    const title = getTitle(kind);

    return (
        <aside className="flex h-full w-80 flex-col border-l border-slate-200/70 bg-white/80 p-4 backdrop-blur">
            <Card shadow="sm" className="flex h-full flex-col border border-slate-200 bg-white/90">
                <CardBody className="flex h-full flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="font-['Fraunces'] text-lg text-slate-900">{title}</div>
                        <Button size="sm" variant="flat" onPress={onClose}>
                            Закрыть
                        </Button>
                    </div>
                    <Divider />
                    <div className="flex-1 overflow-auto pr-1">
                        <div className="flex flex-col gap-4 pb-2">
                            {kind === 'command' ? (
                                <FieldInput
                                    label="Команда"
                                    value={values.commandText}
                                    onChange={(value) => onChange({ ...values, commandText: value })}
                                    placeholder="/start"
                                />
                            ) : null}
                            {kind === 'message' ? (
                                <FieldTextarea
                                    label="Сообщение"
                                    value={values.messageText}
                                    onChange={(value) => onChange({ ...values, messageText: value })}
                                    placeholder="Текст ответа"
                                />
                            ) : null}
                            {kind === 'message_button' || kind === 'reply_button' ? (
                                <FieldInput
                                    label="Текст кнопки"
                                    value={values.buttonText}
                                    onChange={(value) => onChange({ ...values, buttonText: value })}
                                    placeholder="Кнопка"
                                />
                            ) : null}
                            {kind === 'image' ? (
                                <FieldTextarea
                                    label="Ссылки на изображения"
                                    value={values.imageUrls}
                                    onChange={(value) => onChange({ ...values, imageUrls: value })}
                                    placeholder="https://..."
                                />
                            ) : null}
                        </div>
                    </div>
                    <Button color="primary" onPress={onSave}>
                        Сохранить
                    </Button>
                </CardBody>
            </Card>
        </aside>
    );
}
