import { Button, Drawer, DrawerBody, DrawerContent, DrawerFooter } from '@heroui/react';
import { useRef, useState } from 'react';
import type { Node } from 'reactflow';
import type { NodeData, NodeKind } from '../types';
import { FieldInput } from '../ui/field-input';
import { FieldSelect } from '../ui/field-select';
import { FieldTextarea } from '../ui/field-textarea';
import { ImageFileInput } from '../ui/image-file-input';
import { MediaFileInput } from '../ui/media-file-input';
import { TrashIcon } from '../ui/icons';

const API_BASE = (import.meta.env.VITE_API_BASE ?? 'https://toocars.tj').replace(/\/+$/, '');

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
    pluginValues: Record<string, string | number | boolean>;
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
        case 'plugin':
            return 'Интеграция';
        default:
            return 'Редактор';
    }
};

export function NodeEditorPanel({ node, values, chatOptions, subscriptionOptions, onChange, onSave, onClose }: Props) {
    if (!node) {
        return null;
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
        const url = `${API_BASE}/bots/${botId}/files/${type}/${encodeURIComponent(name)}`;
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
            const response = await fetch(`${API_BASE}/bots/${botId}/files/${type}/upload`, {
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
        <Drawer
            isOpen={Boolean(node)}
            placement="right"
            size="sm"
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DrawerContent>
                {(closeDrawer) => (
                    <>
                        <DrawerBody className="px-4">
                            <div className="flex flex-col gap-4 pb-4">
                                {kind === 'command' ? (
                                    <FieldInput
                                        label={'\u041a\u043e\u043c\u0430\u043d\u0434\u0430'}
                                        value={values.commandText}
                                        onChange={(value) => onChange({ ...values, commandText: value })}
                                        placeholder="/start"
                                    />
                                ) : null}
                                {kind === 'message' ? (
                                    <div className="flex flex-col gap-2">
                                        <FieldTextarea
                                            label={'\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435'}
                                            value={values.messageText}
                                            onChange={(value) => onChange({ ...values, messageText: value })}
                                            placeholder="Текст ответа"
                                        />
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                                            Доступные параметры: {'{text}'}, {'{name}'}, {'{first_name}'}, {'{last_name}'}, {'{username}'},{' '}
                                            {'{full_name}'}, {'{chat_id}'}, {'{message_id}'}, {'{photo_id}'}, {'{video_id}'}, {'{audio_id}'},{' '}
                                            {'{voice_id}'}, {'{document_id}'}, {'{sticker_id}'}, {'{contact_phone}'}, {'{location_lat}'},{' '}
                                            {'{location_lon}'}, {'{row[колонка]}'}
                                        </div>
                                    </div>
                                ) : null}
                                {kind === 'message_button' ? (
                                    <div className="flex flex-col gap-3">
                                        <FieldInput
                                            label="Текст кнопки"
                                            value={values.buttonText}
                                            onChange={(value) => onChange({ ...values, buttonText: value })}
                                            placeholder="Кнопка"
                                        />
                                        <FieldSelect
                                            label="Тип кнопки"
                                            value={values.buttonAction}
                                            onChange={(value) =>
                                                onChange({
                                                    ...values,
                                                    buttonAction: value,
                                                })
                                            }
                                            options={[
                                                { value: 'callback', label: 'Обычная (callback)' },
                                                { value: 'url', label: 'Ссылка' },
                                                { value: 'web_app', label: 'WebView / Mini App' },
                                                { value: 'copy', label: 'Копировать' },
                                            ]}
                                        />
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
                                        <FieldSelect
                                            label="Тип кнопки"
                                            value={values.replyAction}
                                            onChange={(value) =>
                                                onChange({
                                                    ...values,
                                                    replyAction: value,
                                                })
                                            }
                                            options={[
                                                { value: 'text', label: 'Обычная' },
                                                { value: 'web_app', label: 'Открыть mini app' },
                                            ]}
                                        />
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
                                    <div className="flex flex-col gap-2">
                                        <FieldTextarea
                                            label="Новый текст сообщения"
                                            value={values.editMessageText}
                                            onChange={(value) => onChange({ ...values, editMessageText: value })}
                                            placeholder="Новый текст"
                                        />
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                                            Параметры: {'{text}'}, {'{name}'}, {'{first_name}'}, {'{last_name}'}, {'{username}'}, {'{full_name}'},{' '}
                                            {'{chat_id}'}, {'{message_id}'}, {'{photo_id}'}, {'{video_id}'}, {'{audio_id}'}, {'{voice_id}'},{' '}
                                            {'{document_id}'}, {'{sticker_id}'}, {'{contact_phone}'}, {'{location_lat}'}, {'{location_lon}'},{' '}
                                            {'{row[колонка]}'}
                                        </div>
                                    </div>
                                ) : null}
                                {kind === 'chat' ? (
                                    <FieldSelect
                                        label="Чат"
                                        value={values.chatId}
                                        onChange={(value) => onChange({ ...values, chatId: value })}
                                        placeholder="Выбери чат"
                                        isClearable
                                        options={chatOptions.map((option) => ({
                                            value: String(option.id),
                                            label: option.label,
                                        }))}
                                    />
                                ) : null}
                                {kind === 'subscription' ? (
                                    <FieldSelect
                                        label="Канал или группа"
                                        value={values.subscriptionChatId}
                                        onChange={(value) => onChange({ ...values, subscriptionChatId: value })}
                                        placeholder="Выбери канал/группу"
                                        isClearable
                                        options={subscriptionOptions.map((option) => ({
                                            value: String(option.id),
                                            label: option.label,
                                        }))}
                                    />
                                ) : null}
                                {kind === 'record' ? (
                                    <FieldSelect
                                        label="Данные для записи"
                                        value={values.recordField}
                                        onChange={(value) => onChange({ ...values, recordField: value })}
                                        options={[
                                            { value: 'text', label: 'Текст сообщения' },
                                            { value: 'message_id', label: 'ID сообщения' },
                                            { value: 'name', label: 'Имя' },
                                            { value: 'first_name', label: 'First name' },
                                            { value: 'last_name', label: 'Last name' },
                                            { value: 'username', label: 'Username' },
                                            { value: 'full_name', label: 'Полное имя' },
                                            { value: 'chat_id', label: 'Chat ID' },
                                            { value: 'contact_phone', label: 'Телефон (contact)' },
                                            { value: 'location_lat', label: 'Широта (location)' },
                                            { value: 'location_lon', label: 'Долгота (location)' },
                                            { value: 'photo_id', label: 'Photo file_id' },
                                            { value: 'video_id', label: 'Video file_id' },
                                            { value: 'audio_id', label: 'Audio file_id' },
                                            { value: 'voice_id', label: 'Voice file_id' },
                                            { value: 'document_id', label: 'Document file_id' },
                                            { value: 'sticker_id', label: 'Sticker file_id' },
                                        ]}
                                    />
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
                                            <Button size="sm" variant="flat" onPress={() => uploadInputRef.current?.click()} isDisabled={isUploading}>
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
                                        <FieldSelect
                                            label="Источник поиска"
                                            value={values.searchSource}
                                            onChange={(value) => onChange({ ...values, searchSource: value })}
                                            options={[
                                                { value: 'incoming', label: 'Из входа' },
                                                { value: 'manual', label: 'Ручной текст' },
                                            ]}
                                        />
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
                                {kind === 'condition' ? (
                                    <div className="flex flex-col gap-3">
                                        <FieldSelect
                                            label="Условие"
                                            value={values.conditionType}
                                            onChange={(value) =>
                                                onChange({
                                                    ...values,
                                                    conditionType: value,
                                                    conditionLengthOp:
                                                        value === 'has_text' || value === 'has_number' ? values.conditionLengthOp : '',
                                                    conditionLengthValue:
                                                        value === 'has_text' || value === 'has_number' ? values.conditionLengthValue : '',
                                                })
                                            }
                                            placeholder="Выбери условие"
                                            isClearable
                                            options={[
                                                { value: 'text', label: 'Текст = (точное совпадение)' },
                                                { value: 'text_contains', label: 'Текст содержит' },
                                                { value: 'status', label: 'Статус = (точное совпадение)' },
                                                { value: 'has_text', label: 'Есть текст' },
                                                { value: 'has_number', label: 'Есть номер' },
                                                { value: 'has_photo', label: 'Есть фото' },
                                                { value: 'has_video', label: 'Есть видео' },
                                                { value: 'has_audio', label: 'Есть аудио' },
                                                { value: 'has_voice', label: 'Есть голосовое' },
                                                { value: 'has_document', label: 'Есть документ' },
                                                { value: 'has_sticker', label: 'Есть стикер' },
                                                { value: 'has_contact', label: 'Есть контакт' },
                                                { value: 'has_location', label: 'Есть гео' },
                                            ]}
                                        />
                                        {values.conditionType === 'text' ||
                                        values.conditionType === 'text_contains' ||
                                        values.conditionType === 'status' ? (
                                            <FieldInput
                                                label={
                                                    values.conditionType === 'status'
                                                        ? 'Статус для проверки'
                                                        : values.conditionType === 'text_contains'
                                                          ? 'Текст содержит'
                                                          : 'Текст для проверки'
                                                }
                                                value={values.conditionText}
                                                onChange={(value) => onChange({ ...values, conditionText: value })}
                                                placeholder="Привет"
                                            />
                                        ) : null}
                                        {values.conditionType === 'has_text' || values.conditionType === 'has_number' ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <FieldSelect
                                                    label="Длина текста"
                                                    value={values.conditionLengthOp}
                                                    onChange={(value) => onChange({ ...values, conditionLengthOp: value })}
                                                    placeholder="Без проверки"
                                                    isClearable
                                                    options={[
                                                        { value: 'lt', label: 'Меньше' },
                                                        { value: 'lte', label: 'Меньше или равно' },
                                                        { value: 'eq', label: 'Равно' },
                                                        { value: 'gte', label: 'Больше или равно' },
                                                        { value: 'gt', label: 'Больше' },
                                                    ]}
                                                />
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
                                {kind === 'plugin' ? (
                                    <div className="flex flex-col gap-3">
                                        {(node.data.pluginInputs ?? []).map((field) => {
                                            const value = values.pluginValues[field.key];
                                            if (field.type === 'textarea') {
                                                return (
                                                    <FieldTextarea
                                                        key={field.key}
                                                        label={field.label}
                                                        value={String(value ?? '')}
                                                        onChange={(next) =>
                                                            onChange({
                                                                ...values,
                                                                pluginValues: { ...values.pluginValues, [field.key]: next },
                                                            })
                                                        }
                                                        placeholder={field.placeholder}
                                                    />
                                                );
                                            }
                                            if (field.type === 'select') {
                                                return (
                                                    <FieldSelect
                                                        key={field.key}
                                                        label={field.label}
                                                        value={String(value ?? '')}
                                                        onChange={(next) =>
                                                            onChange({
                                                                ...values,
                                                                pluginValues: { ...values.pluginValues, [field.key]: next },
                                                            })
                                                        }
                                                        options={(field.options ?? []).map((option) => ({
                                                            value: option.value,
                                                            label: option.label,
                                                        }))}
                                                        placeholder={field.placeholder}
                                                        isClearable
                                                    />
                                                );
                                            }
                                            if (field.type === 'checkbox') {
                                                return (
                                                    <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(value)}
                                                            onChange={(event) =>
                                                                onChange({
                                                                    ...values,
                                                                    pluginValues: {
                                                                        ...values.pluginValues,
                                                                        [field.key]: event.target.checked,
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        {field.label}
                                                    </label>
                                                );
                                            }
                                            return (
                                                <FieldInput
                                                    key={field.key}
                                                    label={field.label}
                                                    value={String(value ?? '')}
                                                    onChange={(next) =>
                                                        onChange({
                                                            ...values,
                                                            pluginValues: { ...values.pluginValues, [field.key]: next },
                                                        })
                                                    }
                                                    placeholder={field.placeholder}
                                                    type={field.type === 'number' ? 'number' : undefined}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : null}
                                {kind === 'image' ? (
                                    <div className="flex flex-col gap-3">
                                        <ImageFileInput
                                            label="Добавить изображения"
                                            onChange={(files) => onChange({ ...values, imageFiles: [...values.imageFiles, ...files] })}
                                        />
                                        {values.imageUrls.length || values.imageFiles.length ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {values.imageUrls.map((url) => (
                                                    <div key={url} className="relative">
                                                        <img src={url} alt="preview" className="h-16 w-20 rounded-md object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onChange({
                                                                    ...values,
                                                                    imageUrls: values.imageUrls.filter((item) => item !== url),
                                                                })
                                                            }
                                                            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
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
                                                            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
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
                                            onChange={(files) => onChange({ ...values, videoFiles: [...values.videoFiles, ...files] })}
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
                                            onChange={(files) => onChange({ ...values, audioFiles: [...values.audioFiles, ...files] })}
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
                                            onChange={(files) => onChange({ ...values, documentFiles: [...values.documentFiles, ...files] })}
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
                            </div>
                        </DrawerBody>
                        <DrawerFooter className="px-4">
                            <Button
                                variant="flat"
                                onPress={() => {
                                    closeDrawer();
                                    onClose();
                                }}
                            >
                                {'\u0417\u0430\u043A\u0440\u044B\u0442\u044C'}
                            </Button>
                            <Button color="primary" onPress={onSave}>
                                {'\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C'}
                            </Button>
                        </DrawerFooter>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    );
}
