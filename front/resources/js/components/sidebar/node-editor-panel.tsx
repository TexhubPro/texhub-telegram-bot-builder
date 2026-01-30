import { Button, Card, CardBody, Divider } from '@heroui/react';
import { useRef, useState } from 'react';
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
    buttonAction: string;
    buttonUrl: string;
    buttonWebAppUrl: string;
    buttonCopyText: string;
    replyAction: string;
    replyWebAppUrl: string;
    imageUrls: string[];
    imageFiles: File[];
    timerSeconds: string;
    videoUrls: string[];
    videoFiles: File[];
    audioUrls: string[];
    audioFiles: File[];
    documentUrls: string[];
    documentFiles: File[];
    statusValue: string;
    editMessageText: string;
    chatId: string;
    subscriptionChatId: string;
    taskScheduleType: string;
    taskIntervalMinutes: string;
    taskDailyTime: string;
    taskRunAt: string;
    recordField: string;
    fileName: string;
    columnName: string;
    searchColumnName: string;
    searchSource: string;
    searchValue: string;
    conditionText: string;
    conditionType: string;
    conditionLengthOp: string;
    conditionLengthValue: string;
};

type Props = {
    node: Node<NodeData> | null;
    values: Values;
    chatOptions: { id: number; label: string }[];
    subscriptionOptions: { id: number; label: string }[];
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
        case 'delete_message':
            return 'Удалить сообщение';
        case 'edit_message':
            return 'Изменить сообщение';
        case 'chat':
            return 'Чат';
        case 'status_set':
            return 'Статус';
        case 'status_get':
            return 'Статус';
        case 'subscription':
            return 'Подписка';
        case 'task':
            return 'Задача';
        case 'broadcast':
            return 'Рассылка';
        case 'record':
            return 'Запись';
        case 'excel_file':
            return 'Excel файл';
        case 'text_file':
            return 'TXT файл';
        case 'excel_column':
            return 'Excel столбец';
        case 'file_search':
            return 'Поиск в файле';
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

export function NodeEditorPanel({ node, values, chatOptions, subscriptionOptions, onChange, onSave, onClose }: Props) {
    if (!node) {
        return (
            <aside className="w-80 border-l border-slate-200/70 bg-white/80 p-4 backdrop-blur">
                <div className="text-xs text-slate-500">Выбери ноду и нажми «Изменить».</div>
            </aside>
        );
    }

    const kind = node.data.kind;
    const title = getTitle(kind);
    const uploadInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const getFileLabel = (value: string) => {
        const trimmed = value.split('?')[0];
        const parts = trimmed.split('/');
        return parts[parts.length - 1] || value;
    };
    const handleOpenFile = () => {
        const name = values.fileName.trim();
        if (!name) {
            return;
        }
        const botId = window.localStorage.getItem('botId');
        if (!botId) {
            return;
        }
        const type = kind === 'excel_file' ? 'excel' : 'text';
        const url = `https://toocars.tj/bots/${botId}/files/${type}/${encodeURIComponent(name)}`;
        window.open(url, '_blank');
    };
    const handleUploadFile = async (file: File) => {
        const botId = window.localStorage.getItem('botId');
        if (!botId) {
            return;
        }
        const lower = file.name.toLowerCase();
        if (kind === 'excel_file') {
            const ok = lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls');
            if (!ok) {
                window.alert('Загрузите CSV, XLSX или XLS файл.');
                return;
            }
        }
        if (kind === 'text_file') {
            const ok = lower.endsWith('.txt');
            if (!ok) {
                window.alert('Загрузите TXT файл.');
                return;
            }
        }
        setIsUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const type = kind === 'excel_file' ? 'excel' : 'text';
            const response = await fetch(`https://toocars.tj/bots/${botId}/files/${type}/upload`, {
                method: 'POST',
                body: form,
            });
            if (!response.ok) {
                window.alert('Не удалось загрузить файл.');
                return;
            }
            const payload = (await response.json()) as { name?: string };
            const nextName = payload.name || file.name.replace(/\.[^.]+$/i, '');
            onChange({ ...values, fileName: nextName });
            setTimeout(() => onSave(), 0);
        } finally {
            setIsUploading(false);
        }
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
                            {kind === 'message_button' ? (
                                <div className="flex flex-col gap-3">
                                    <FieldInput
                                        label="Текст кнопки"
                                        value={values.buttonText}
                                        onChange={(value) => onChange({ ...values, buttonText: value })}
                                        placeholder="Кнопка"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <label className="block text-xs font-semibold text-slate-600">Тип кнопки</label>
                                        <select
                                            value={values.buttonAction}
                                            onChange={(event) =>
                                                onChange({
                                                    ...values,
                                                    buttonAction: event.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                        >
                                            <option value="callback">Обычная (callback)</option>
                                            <option value="url">Ссылка</option>
                                            <option value="web_app">WebView / Mini App</option>
                                            <option value="copy">Копировать</option>
                                        </select>
                                    </div>
                                    {values.buttonAction === 'url' ? (
                                        <FieldInput
                                            label="Ссылка"
                                            value={values.buttonUrl}
                                            onChange={(value) => onChange({ ...values, buttonUrl: value })}
                                            placeholder="https://example.com"
                                        />
                                    ) : null}
                                    {values.buttonAction === 'web_app' ? (
                                        <FieldInput
                                            label="WebApp ссылка"
                                            value={values.buttonWebAppUrl}
                                            onChange={(value) => onChange({ ...values, buttonWebAppUrl: value })}
                                            placeholder="https://your-miniapp"
                                        />
                                    ) : null}
                                    {values.buttonAction === 'copy' ? (
                                        <FieldInput
                                            label="Текст для копирования"
                                            value={values.buttonCopyText}
                                            onChange={(value) => onChange({ ...values, buttonCopyText: value })}
                                            placeholder="Код или текст"
                                        />
                                    ) : null}
                                </div>
                            ) : null}
                            {kind === 'reply_button' ? (
                                <div className="flex flex-col gap-3">
                                    <FieldInput
                                        label="Текст кнопки"
                                        value={values.buttonText}
                                        onChange={(value) => onChange({ ...values, buttonText: value })}
                                        placeholder="Кнопка"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <label className="block text-xs font-semibold text-slate-600">Тип кнопки</label>
                                        <select
                                            value={values.replyAction}
                                            onChange={(event) =>
                                                onChange({
                                                    ...values,
                                                    replyAction: event.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                        >
                                            <option value="text">Обычная</option>
                                            <option value="web_app">Открыть mini app</option>
                                        </select>
                                    </div>
                                    {values.replyAction === 'web_app' ? (
                                        <FieldInput
                                            label="WebApp ссылка"
                                            value={values.replyWebAppUrl}
                                            onChange={(value) => onChange({ ...values, replyWebAppUrl: value })}
                                            placeholder="https://your-miniapp"
                                        />
                                    ) : null}
                                </div>
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
                            {kind === 'edit_message' ? (
                                <FieldTextarea
                                    label="Новый текст сообщения"
                                    value={values.editMessageText}
                                    onChange={(value) => onChange({ ...values, editMessageText: value })}
                                    placeholder="Новый текст"
                                />
                            ) : null}
                            {kind === 'chat' ? (
                                <div className="flex flex-col gap-2">
                                    <label className="block text-xs font-semibold text-slate-600">Чат</label>
                                    <select
                                        value={values.chatId}
                                        onChange={(event) => onChange({ ...values, chatId: event.target.value })}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                    >
                                        <option value="">Выбери чат</option>
                                        {chatOptions.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}
                            {kind === 'subscription' ? (
                                <div className="flex flex-col gap-2">
                                    <label className="block text-xs font-semibold text-slate-600">Канал или группа</label>
                                    <select
                                        value={values.subscriptionChatId}
                                        onChange={(event) =>
                                            onChange({ ...values, subscriptionChatId: event.target.value })
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                    >
                                        <option value="">Выбери канал/группу</option>
                                        {subscriptionOptions.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}
                            {kind === 'record' ? (
                                <div className="flex flex-col gap-2">
                                    <label className="block text-xs font-semibold text-slate-600">Данные для записи</label>
                                    <select
                                        value={values.recordField}
                                        onChange={(event) => onChange({ ...values, recordField: event.target.value })}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                    >
                                        <option value="text">Текст сообщения</option>
                                        <option value="name">Имя</option>
                                        <option value="first_name">First name</option>
                                        <option value="last_name">Last name</option>
                                        <option value="username">Username</option>
                                        <option value="full_name">Полное имя</option>
                                        <option value="chat_id">Chat ID</option>
                                        <option value="photo_id">Photo file_id</option>
                                        <option value="video_id">Video file_id</option>
                                        <option value="audio_id">Audio file_id</option>
                                        <option value="document_id">Document file_id</option>
                                    </select>
                                </div>
                            ) : null}
                            {kind === 'excel_file' || kind === 'text_file' ? (
                                <div className="flex flex-col gap-3">
                                    <FieldInput
                                        label="Имя файла"
                                        value={values.fileName}
                                        onChange={(value) => onChange({ ...values, fileName: value })}
                                        placeholder={kind === 'excel_file' ? 'clients' : 'log'}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            onPress={() => uploadInputRef.current?.click()}
                                            isDisabled={isUploading}
                                        >
                                            Загрузить файл
                                        </Button>
                                        <Button size="sm" variant="flat" onPress={handleOpenFile}>
                                            Открыть файл
                                        </Button>
                                        <input
                                            ref={uploadInputRef}
                                            type="file"
                                            accept={
                                                kind === 'excel_file'
                                                    ? '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
                                                    : '.txt,text/plain'
                                            }
                                            className="hidden"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file) {
                                                    handleUploadFile(file);
                                                }
                                                event.target.value = '';
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : null}
                            {kind === 'excel_column' ? (
                                <FieldInput
                                    label="Имя столбца"
                                    value={values.columnName}
                                    onChange={(value) => onChange({ ...values, columnName: value })}
                                    placeholder="Имя"
                                />
                            ) : null}
                            {kind === 'file_search' ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="block text-xs font-semibold text-slate-600">Источник поиска</label>
                                        <select
                                            value={values.searchSource}
                                            onChange={(event) =>
                                                onChange({ ...values, searchSource: event.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                        >
                                            <option value="incoming">Из входа</option>
                                            <option value="manual">Ручной текст</option>
                                        </select>
                                    </div>
                                    {values.searchSource === 'manual' ? (
                                        <FieldInput
                                            label="Текст для поиска"
                                            value={values.searchValue}
                                            onChange={(value) => onChange({ ...values, searchValue: value })}
                                            placeholder="{name} или любой текст"
                                        />
                                    ) : null}
                                    <FieldInput
                                        label="Столбец (опционально)"
                                        value={values.searchColumnName}
                                        onChange={(value) => onChange({ ...values, searchColumnName: value })}
                                        placeholder="Название столбца"
                                    />
                                </div>
                            ) : null}
                            {kind === 'status_set' ? (
                                <FieldInput
                                    label="Статус"
                                    value={values.statusValue}
                                    onChange={(value) => onChange({ ...values, statusValue: value })}
                                    placeholder="send_phone"
                                />
                            ) : null}
                            {kind === 'task' ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="block text-xs font-semibold text-slate-600">Тип задачи</label>
                                        <select
                                            value={values.taskScheduleType}
                                            onChange={(event) =>
                                                onChange({
                                                    ...values,
                                                    taskScheduleType: event.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                        >
                                            <option value="interval">Интервал</option>
                                            <option value="daily">Каждый день</option>
                                            <option value="datetime">Дата и время</option>
                                        </select>
                                    </div>
                                    {values.taskScheduleType === 'interval' ? (
                                        <div className="flex flex-col gap-2">
                                            <label className="block text-xs font-semibold text-slate-600">Интервал</label>
                                            <select
                                                value={values.taskIntervalMinutes}
                                                onChange={(event) =>
                                                    onChange({ ...values, taskIntervalMinutes: event.target.value })
                                                }
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                            >
                                                <option value="1">Каждую минуту</option>
                                                <option value="5">Каждые 5 минут</option>
                                                <option value="10">Каждые 10 минут</option>
                                                <option value="20">Каждые 20 минут</option>
                                                <option value="30">Каждые 30 минут</option>
                                                <option value="60">Каждый час</option>
                                                <option value="120">Каждые 2 часа</option>
                                                <option value="360">Каждые 6 часов</option>
                                                <option value="1440">Каждый день</option>
                                            </select>
                                        </div>
                                    ) : null}
                                    {values.taskScheduleType === 'daily' ? (
                                        <FieldInput
                                            label="Время"
                                            value={values.taskDailyTime}
                                            onChange={(value) => onChange({ ...values, taskDailyTime: value })}
                                            type="time"
                                        />
                                    ) : null}
                                    {values.taskScheduleType === 'datetime' ? (
                                        <FieldInput
                                            label="Дата и время"
                                            value={values.taskRunAt}
                                            onChange={(value) => onChange({ ...values, taskRunAt: value })}
                                            type="datetime-local"
                                        />
                                    ) : null}
                                </div>
                            ) : null}
                            {kind === 'condition' ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="block text-xs font-semibold text-slate-600">Условие</label>
                                        <select
                                            value={values.conditionType}
                                            onChange={(event) =>
                                                onChange({
                                                    ...values,
                                                    conditionType: event.target.value,
                                                    conditionLengthOp:
                                                        event.target.value === 'has_text' || event.target.value === 'has_number'
                                                            ? values.conditionLengthOp
                                                            : '',
                                                    conditionLengthValue:
                                                        event.target.value === 'has_text' || event.target.value === 'has_number'
                                                            ? values.conditionLengthValue
                                                            : '',
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                        >
                                            <option value="">Выбери условие</option>
                                            <option value="text">Текст = (точное совпадение)</option>
                                            <option value="status">Статус = (точное совпадение)</option>
                                            <option value="has_text">Есть текст</option>
                                            <option value="has_number">Есть номер</option>
                                            <option value="has_photo">Есть фото</option>
                                            <option value="has_video">Есть видео</option>
                                            <option value="has_audio">Есть аудио</option>
                                            <option value="has_location">Есть гео</option>
                                        </select>
                                    </div>
                                    {values.conditionType === 'text' || values.conditionType === 'status' ? (
                                        <FieldInput
                                            label={
                                                values.conditionType === 'status'
                                                    ? 'Статус для проверки'
                                                    : 'Текст для проверки'
                                            }
                                            value={values.conditionText}
                                            onChange={(value) => onChange({ ...values, conditionText: value })}
                                            placeholder="Привет"
                                        />
                                    ) : null}
                                    {values.conditionType === 'has_text' || values.conditionType === 'has_number' ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col gap-2">
                                                <label className="block text-xs font-semibold text-slate-600">
                                                    Длина текста
                                                </label>
                                                <select
                                                    value={values.conditionLengthOp}
                                                    onChange={(event) =>
                                                        onChange({ ...values, conditionLengthOp: event.target.value })
                                                    }
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                                >
                                                    <option value="">Без проверки</option>
                                                    <option value="lt">Меньше</option>
                                                    <option value="lte">Меньше или равно</option>
                                                    <option value="eq">Равно</option>
                                                    <option value="gte">Больше или равно</option>
                                                    <option value="gt">Больше</option>
                                                </select>
                                            </div>
                                            <FieldInput
                                                label="Кол-во символов"
                                                value={values.conditionLengthValue}
                                                onChange={(value) => onChange({ ...values, conditionLengthValue: value })}
                                                placeholder="5"
                                                type="number"
                                                min="0"
                                                step="1"
                                            />
                                        </div>
                                    ) : null}
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





