import { Button, Card, CardBody, Divider } from '@heroui/react';
import type { Node } from 'reactflow';
import type { NodeData, NodeKind } from '../types';
import { FieldInput } from '../ui/field-input';
import { FieldTextarea } from '../ui/field-textarea';
import { ImageFileInput } from '../ui/image-file-input';
import { MediaFileInput } from '../ui/media-file-input';
import { TrashIcon } from '../ui/icons';

type Values = {
    commandText: string;
    messageText: string;
    buttonText: string;
    imageUrls: string[];
    imageFiles: File[];
    timerSeconds: string;
    videoUrls: string[];
    videoFiles: File[];
    audioUrls: string[];
    audioFiles: File[];
    documentUrls: string[];
    documentFiles: File[];
    conditionText: string;
    conditionHasText: boolean;
    conditionHasNumber: boolean;
    conditionHasPhoto: boolean;
    conditionHasVideo: boolean;
    conditionHasAudio: boolean;
    conditionHasLocation: boolean;
    conditionMinLength: string;
    conditionMaxLength: string;
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
        case 'timer':
            return 'Таймер';
        case 'video':
            return 'Видео';
        case 'audio':
            return 'Аудио';
        case 'document':
            return 'Документ';
        case 'condition':
            return 'Проверка';
        case 'webhook':
            return 'Вебхук';
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
    const getFileLabel = (value: string) => {
        const trimmed = value.split('?')[0];
        const parts = trimmed.split('/');
        return parts[parts.length - 1] || value;
    };

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
                            {kind === 'timer' ? (
                                <FieldInput
                                    label="Задержка (сек)"
                                    value={values.timerSeconds}
                                    onChange={(value) => onChange({ ...values, timerSeconds: value })}
                                    placeholder="5"
                                    type="number"
                                    min="0"
                                    step="1"
                                />
                            ) : null}
                            {kind === 'condition' ? (
                                <div className="flex flex-col gap-3">
                                    <FieldInput
                                        label="Текст (точное совпадение)"
                                        value={values.conditionText}
                                        onChange={(value) => onChange({ ...values, conditionText: value })}
                                        placeholder="Привет"
                                    />
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={values.conditionHasText}
                                                onChange={(event) =>
                                                    onChange({ ...values, conditionHasText: event.target.checked })
                                                }
                                            />
                                            Есть текст
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={values.conditionHasNumber}
                                                onChange={(event) =>
                                                    onChange({ ...values, conditionHasNumber: event.target.checked })
                                                }
                                            />
                                            Есть номер
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={values.conditionHasPhoto}
                                                onChange={(event) =>
                                                    onChange({ ...values, conditionHasPhoto: event.target.checked })
                                                }
                                            />
                                            Есть фото
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={values.conditionHasVideo}
                                                onChange={(event) =>
                                                    onChange({ ...values, conditionHasVideo: event.target.checked })
                                                }
                                            />
                                            Есть видео
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={values.conditionHasAudio}
                                                onChange={(event) =>
                                                    onChange({ ...values, conditionHasAudio: event.target.checked })
                                                }
                                            />
                                            Есть аудио
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={values.conditionHasLocation}
                                                onChange={(event) =>
                                                    onChange({ ...values, conditionHasLocation: event.target.checked })
                                                }
                                            />
                                            Есть гео
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <FieldInput
                                            label="Мин. длина"
                                            value={values.conditionMinLength}
                                            onChange={(value) => onChange({ ...values, conditionMinLength: value })}
                                            placeholder="0"
                                            type="number"
                                            min="0"
                                            step="1"
                                        />
                                        <FieldInput
                                            label="Макс. длина"
                                            value={values.conditionMaxLength}
                                            onChange={(value) => onChange({ ...values, conditionMaxLength: value })}
                                            placeholder="100"
                                            type="number"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                </div>
                            ) : null}
                            {kind === 'image' ? (
                                <div className="flex flex-col gap-3">
                                    <ImageFileInput
                                        label="Добавить изображения"
                                        onChange={(files) =>
                                            onChange({ ...values, imageFiles: [...values.imageFiles, ...files] })
                                        }
                                    />
                                    {values.imageUrls.length || values.imageFiles.length ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {values.imageUrls.map((url) => (
                                                <div key={url} className="relative">
                                                    <img
                                                        src={url}
                                                        alt="preview"
                                                        className="h-16 w-20 rounded-md object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                imageUrls: values.imageUrls.filter((item) => item !== url),
                                                            })
                                                        }
                                                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                            {values.imageFiles.map((file, index) => (
                                                <div key={`${file.name}-${file.lastModified}`} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt="preview"
                                                        className="h-16 w-20 rounded-md object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                imageFiles: values.imageFiles.filter((_, idx) => idx !== index),
                                                            })
                                                        }
                                                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            {kind === 'video' ? (
                                <div className="flex flex-col gap-3">
                                    <MediaFileInput
                                        label="Добавить видео"
                                        accept="video/*"
                                        onChange={(files) =>
                                            onChange({ ...values, videoFiles: [...values.videoFiles, ...files] })
                                        }
                                    />
                                    {values.videoUrls.length || values.videoFiles.length ? (
                                        <div className="flex flex-col gap-2">
                                            {values.videoUrls.map((url) => (
                                                <div
                                                    key={url}
                                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                                                >
                                                    <span className="truncate">{getFileLabel(url)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                videoUrls: values.videoUrls.filter((item) => item !== url),
                                                            })
                                                        }
                                                        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                            {values.videoFiles.map((file, index) => (
                                                <div
                                                    key={`${file.name}-${file.lastModified}`}
                                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                                                >
                                                    <span className="truncate">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                videoFiles: values.videoFiles.filter((_, idx) => idx !== index),
                                                            })
                                                        }
                                                        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            {kind === 'audio' ? (
                                <div className="flex flex-col gap-3">
                                    <MediaFileInput
                                        label="Добавить аудио"
                                        accept="audio/*"
                                        onChange={(files) =>
                                            onChange({ ...values, audioFiles: [...values.audioFiles, ...files] })
                                        }
                                    />
                                    {values.audioUrls.length || values.audioFiles.length ? (
                                        <div className="flex flex-col gap-2">
                                            {values.audioUrls.map((url) => (
                                                <div
                                                    key={url}
                                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                                                >
                                                    <span className="truncate">{getFileLabel(url)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                audioUrls: values.audioUrls.filter((item) => item !== url),
                                                            })
                                                        }
                                                        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                            {values.audioFiles.map((file, index) => (
                                                <div
                                                    key={`${file.name}-${file.lastModified}`}
                                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                                                >
                                                    <span className="truncate">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                audioFiles: values.audioFiles.filter((_, idx) => idx !== index),
                                                            })
                                                        }
                                                        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            {kind === 'document' ? (
                                <div className="flex flex-col gap-3">
                                    <MediaFileInput
                                        label="Добавить документы"
                                        accept="*/*"
                                        onChange={(files) =>
                                            onChange({ ...values, documentFiles: [...values.documentFiles, ...files] })
                                        }
                                    />
                                    {values.documentUrls.length || values.documentFiles.length ? (
                                        <div className="flex flex-col gap-2">
                                            {values.documentUrls.map((url) => (
                                                <div
                                                    key={url}
                                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                                                >
                                                    <span className="truncate">{getFileLabel(url)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                documentUrls: values.documentUrls.filter((item) => item !== url),
                                                            })
                                                        }
                                                        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                            {values.documentFiles.map((file, index) => (
                                                <div
                                                    key={`${file.name}-${file.lastModified}`}
                                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                                                >
                                                    <span className="truncate">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onChange({
                                                                ...values,
                                                                documentFiles: values.documentFiles.filter((_, idx) => idx !== index),
                                                            })
                                                        }
                                                        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                                                        aria-label="Удалить"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            <Button color="primary" onPress={onSave}>
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </aside>
    );
}
