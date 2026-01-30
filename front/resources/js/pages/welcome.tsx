import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    ConnectionLineType,
    Controls,
    type Connection,
    type Edge,
    type Node,
    useEdgesState,
    useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AppNavbar } from '../components/layout/navbar';
import { AddEdgeMenuContext } from '../components/nodes/add-edge-context';
import { BotActionsContext } from '../components/nodes/bot-actions-context';
import { BotNode } from '../components/nodes/bot-node';
import { ButtonRowNode } from '../components/nodes/button-row-node';
import { BroadcastNode } from '../components/nodes/broadcast-node';
import { CommandNode } from '../components/nodes/command-node';
import { ConditionNode } from '../components/nodes/condition-node';
import { NodeContextMenu } from '../components/nodes/context-menu';
import { GraphActionsContext } from '../components/nodes/graph-actions-context';
import { AudioNode } from '../components/nodes/audio-node';
import { ChatNode } from '../components/nodes/chat-node';
import { DocumentNode } from '../components/nodes/document-node';
import { DeleteMessageNode } from '../components/nodes/delete-message-node';
import { EditMessageNode } from '../components/nodes/edit-message-node';
import { ExcelColumnNode } from '../components/nodes/excel-column-node';
import { ExcelFileNode } from '../components/nodes/excel-file-node';
import { FileSearchNode } from '../components/nodes/file-search-node';
import { ImageNode } from '../components/nodes/image-node';
import { MessageButtonNode } from '../components/nodes/message-button-node';
import { MessageNode } from '../components/nodes/message-node';
import { RecordNode } from '../components/nodes/record-node';
import { ReplyClearNode } from '../components/nodes/reply-clear-node';
import { ReplyButtonNode } from '../components/nodes/reply-button-node';
import { StyledNode } from '../components/nodes/styled-node';
import { TaskNode } from '../components/nodes/task-node';
import { TextFileNode } from '../components/nodes/text-file-node';
import { TimerNode } from '../components/nodes/timer-node';
import { StatusGetNode } from '../components/nodes/status-get-node';
import { StatusSetNode } from '../components/nodes/status-set-node';
import { SubscriptionNode } from '../components/nodes/subscription-node';
import { VideoNode } from '../components/nodes/video-node';
import { WebhookNode } from '../components/nodes/webhook-node';
import { NodeEditorPanel } from '../components/sidebar/node-editor-panel';
import { Sidebar } from '../components/sidebar/sidebar';
import { DeletableEdge } from '../components/edges/deletable-edge';
import type { Bot, ContextMenu, NodeData, NodeKind } from '../components/types';

const API_BASE = 'https://toocars.tj';

const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

const NODE_KIND_LABELS: Record<NodeKind, string> = {
    bot: 'Бот',
    command: 'Команда',
    message: 'Сообщение',
    message_button: 'Message Button',
    reply_button: 'Reply Button',
    reply_clear: 'Clear Reply',
    timer: 'Таймер',
    video: 'Видео',
    audio: 'Аудио',
    document: 'Документ',
    delete_message: 'Сообщение',
    edit_message: 'Сообщение',
    chat: 'Чат',
    status_set: 'Статус',
    status_get: 'Статус',
    task: 'Задача',
    broadcast: 'Рассылка',
    record: 'Запись',
    excel_file: 'Excel файл',
    text_file: 'TXT файл',
    excel_column: 'Столбец',
    file_search: 'Поиск',
    subscription: 'Подписка',
    webhook: 'Вебхук',
    condition: 'Проверка',
    button_row: 'Rows',
    image: 'Изображения',
    node: 'Блок',
};

const getNodeTitle = (node: Node<NodeData>) => {
    switch (node.data.kind) {
        case 'command':
            return node.data.commandText ?? node.data.label;
        case 'message':
            return node.data.messageText ?? node.data.label;
        case 'bot':
            return node.data.botName ?? node.data.label;
        case 'message_button':
        case 'reply_button':
            return node.data.buttonText ?? node.data.label;
        case 'button_row':
            return node.data.label ?? 'Rows';
        case 'image': {
            const count = node.data.imageUrls?.length ?? 0;
            return count ? `Изображения (${count})` : 'Изображения';
        }
        case 'video': {
            const count = node.data.videoUrls?.length ?? 0;
            return count ? `Видео (${count})` : 'Видео';
        }
        case 'audio': {
            const count = node.data.audioUrls?.length ?? 0;
            return count ? `Аудио (${count})` : 'Аудио';
        }
        case 'document': {
            const count = node.data.documentUrls?.length ?? 0;
            return count ? `Документы (${count})` : 'Документы';
        }
        case 'delete_message':
            return 'Удалить сообщение';
        case 'edit_message': {
            const text = (node.data.editMessageText ?? '').trim();
            return text ? `Изменить: ${text}` : 'Изменить сообщение';
        }
        case 'chat': {
            const title = (node.data.chatTitle ?? '').trim();
            return title ? `Чат: ${title}` : 'Выбрать чат';
        }
        case 'status_set': {
            const value = (node.data.statusValue ?? '').trim();
            return value ? `Статус: ${value}` : 'Установить статус';
        }
        case 'status_get':
            return 'Получить статус';
        case 'task': {
            const schedule = node.data.taskScheduleType ?? 'interval';
            if (schedule === 'daily') {
                return node.data.taskDailyTime ? `Задача: ${node.data.taskDailyTime}` : 'Задача ежедневно';
            }
            if (schedule === 'datetime') {
                return node.data.taskRunAt ? `Задача: ${node.data.taskRunAt}` : 'Задача разово';
            }
            return 'Задача по интервалу';
        }
        case 'broadcast':
            return 'Рассылка';
        case 'record':
            return 'Запись';
        case 'excel_file':
            return node.data.fileName ? `Excel: ${node.data.fileName}` : 'Excel файл';
        case 'text_file':
            return node.data.fileName ? `TXT: ${node.data.fileName}` : 'TXT файл';
        case 'excel_column':
            return node.data.columnName ? `Столбец: ${node.data.columnName}` : 'Столбец';
        case 'file_search':
            return node.data.searchColumnName
                ? `Поиск: ${node.data.searchColumnName}`
                : 'Поиск в файле';
        case 'subscription': {
            const title = (node.data.subscriptionChatTitle ?? '').trim();
            return title ? `Подписка: ${title}` : 'Проверка подписки';
        }
        case 'webhook':
            return 'Сообщение пользователя';
        case 'condition':
            return node.data.conditionText ? `Если: ${node.data.conditionText}` : 'Проверка';
        case 'timer': {
            const raw = node.data.timerSeconds ?? 0;
            const seconds = typeof raw === 'number' ? raw : Number(raw) || 0;
            return `Таймер ${seconds} сек`;
        }
        default:
            return node.data.label;
    }
};

const getNodeSubtitle = (node: Node<NodeData>) => NODE_KIND_LABELS[node.data.kind ?? 'node'];

const getClientPosition = (event: MouseEvent | TouchEvent) => {
    if ('changedTouches' in event && event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        return { x: touch.clientX, y: touch.clientY };
    }
    const mouseEvent = event as MouseEvent;
    return { x: mouseEvent.clientX, y: mouseEvent.clientY };
};

const formatChatLabel = (user: {
    id: number;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
}) => {
    const nameParts = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    const username = user.username ? `@${user.username}` : '';
    const primary = nameParts || username || `ID ${user.id}`;
    const suffix = [username && username !== primary ? username : '', `ID ${user.id}`]
        .filter(Boolean)
        .join(' · ');
    return suffix && primary !== suffix ? `${primary} (${suffix})` : primary;
};

const buildEditorValues = (node: Node<NodeData>) => {
    const legacy = node.data as NodeData & {
        conditionHasText?: boolean;
        conditionHasNumber?: boolean;
        conditionHasPhoto?: boolean;
        conditionHasVideo?: boolean;
        conditionHasAudio?: boolean;
        conditionHasLocation?: boolean;
    };
    let conditionType = node.data.conditionType ?? '';
    if (!conditionType) {
        if (legacy.conditionHasText) conditionType = 'has_text';
        else if (legacy.conditionHasNumber) conditionType = 'has_number';
        else if (legacy.conditionHasPhoto) conditionType = 'has_photo';
        else if (legacy.conditionHasVideo) conditionType = 'has_video';
        else if (legacy.conditionHasAudio) conditionType = 'has_audio';
        else if (legacy.conditionHasLocation) conditionType = 'has_location';
        else if (node.data.conditionText) conditionType = 'text';
    }
    return {
        commandText: node.data.commandText ?? '',
        messageText: node.data.messageText ?? '',
        buttonText: node.data.buttonText ?? '',
        buttonAction: node.data.buttonAction ?? 'callback',
        buttonUrl: node.data.buttonUrl ?? '',
        buttonWebAppUrl: node.data.buttonWebAppUrl ?? '',
        buttonCopyText: node.data.buttonCopyText ?? '',
        replyAction: node.data.replyAction ?? 'text',
        replyWebAppUrl: node.data.replyWebAppUrl ?? '',
        subscriptionChatId:
            node.data.subscriptionChatId !== undefined ? String(node.data.subscriptionChatId) : '',
        taskScheduleType: node.data.taskScheduleType ?? 'interval',
        taskIntervalMinutes:
            node.data.taskIntervalMinutes !== undefined ? String(node.data.taskIntervalMinutes) : '60',
        taskDailyTime: node.data.taskDailyTime ?? '10:00',
        taskRunAt: node.data.taskRunAt ?? '',
        recordField: node.data.recordField ?? 'text',
        fileName: node.data.fileName ?? '',
        columnName: node.data.columnName ?? '',
        searchColumnName: node.data.searchColumnName ?? '',
        searchSource: node.data.searchSource ?? 'incoming',
        searchValue: node.data.searchValue ?? '',
        imageUrls: node.data.imageUrls ?? [],
        imageFiles: [] as File[],
        videoUrls: node.data.videoUrls ?? [],
        videoFiles: [] as File[],
        audioUrls: node.data.audioUrls ?? [],
        audioFiles: [] as File[],
        documentUrls: node.data.documentUrls ?? [],
        documentFiles: [] as File[],
        statusValue: node.data.statusValue ?? '',
        editMessageText: node.data.editMessageText ?? '',
        chatId: node.data.chatId !== undefined ? String(node.data.chatId) : '',
        conditionText: node.data.conditionText ?? '',
        conditionType,
        conditionLengthOp: node.data.conditionLengthOp ?? '',
        conditionLengthValue:
            node.data.conditionLengthValue !== undefined ? String(node.data.conditionLengthValue) : '',
        timerSeconds: node.data.timerSeconds !== undefined ? String(node.data.timerSeconds) : '',
    };
};

export default function Welcome() {
    const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [menu, setMenu] = useState<ContextMenu | null>(null);
    const [linkSearch, setLinkSearch] = useState('');
    const [bot, setBot] = useState<Bot | null>(null);
    const [isHydrating, setIsHydrating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editorNodeId, setEditorNodeId] = useState<string | null>(null);
    const [chatOptions, setChatOptions] = useState<{ id: number; label: string }[]>([]);
    const [subscriptionOptions, setSubscriptionOptions] = useState<{ id: number; label: string }[]>([]);
    const [editorValues, setEditorValues] = useState({
        commandText: '',
        messageText: '',
        buttonText: '',
        buttonAction: 'callback',
        buttonUrl: '',
        buttonWebAppUrl: '',
        buttonCopyText: '',
        replyAction: 'text',
        replyWebAppUrl: '',
        subscriptionChatId: '',
        taskScheduleType: 'interval',
        taskIntervalMinutes: '60',
        taskDailyTime: '10:00',
        taskRunAt: '',
        recordField: 'text',
        fileName: '',
        columnName: '',
        searchColumnName: '',
        searchSource: 'incoming',
        searchValue: '',
        imageUrls: [] as string[],
        imageFiles: [] as File[],
        videoUrls: [] as string[],
        videoFiles: [] as File[],
        audioUrls: [] as string[],
        audioFiles: [] as File[],
        documentUrls: [] as string[],
        documentFiles: [] as File[],
        statusValue: '',
        editMessageText: '',
        chatId: '',
        conditionText: '',
        conditionType: '',
        conditionLengthOp: '',
        conditionLengthValue: '',
        timerSeconds: '',
    });
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const saveTimerRef = useRef<number | null>(null);
    const connectSourceRef = useRef<string | null>(null);
    const connectSourceHandleRef = useRef<string | null>(null);
    const suppressPaneClickRef = useRef(false);

    const nodeTypes = useMemo(
        () => ({
            styled: StyledNode,
            command: CommandNode,
            message: MessageNode,
            message_button: MessageButtonNode,
            reply_button: ReplyButtonNode,
            reply_clear: ReplyClearNode,
            timer: TimerNode,
            delete_message: DeleteMessageNode,
            edit_message: EditMessageNode,
            chat: ChatNode,
            status_set: StatusSetNode,
            status_get: StatusGetNode,
            task: TaskNode,
            broadcast: BroadcastNode,
            record: RecordNode,
            excel_file: ExcelFileNode,
            text_file: TextFileNode,
            excel_column: ExcelColumnNode,
            file_search: FileSearchNode,
            subscription: SubscriptionNode,
            video: VideoNode,
            audio: AudioNode,
            document: DocumentNode,
            webhook: WebhookNode,
            condition: ConditionNode,
            button_row: ButtonRowNode,
            image: ImageNode,
            bot: BotNode,
        }),
        []
    );

    const edgeTypes = useMemo(
        () => ({
            default: DeletableEdge,
            bezier: DeletableEdge,
            smoothstep: DeletableEdge,
            step: DeletableEdge,
            straight: DeletableEdge,
            deletable: DeletableEdge,
        }),
        []
    );

    const generateId = useCallback((prefix: string) => {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return `${prefix}-${crypto.randomUUID()}`;
        }
        return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }, []);

    const handleEdgesChange = useCallback(
        (changes: import('reactflow').EdgeChange[]) => {
            onEdgesChange(changes);
        },
        [onEdgesChange]
    );

    const handleNodesChange = useCallback(
        (changes: import('reactflow').NodeChange[]) => {
            onNodesChange(changes);
        },
        [onNodesChange]
    );

    const handleUpdateNodeData = useCallback(
        (nodeId: string, patch: Partial<NodeData>) => {
            setNodes((nds) =>
                nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node))
            );
        },
        [setNodes]
    );

    const handleOpenAddMenu = useCallback(
        (nodeId: string, position: { x: number; y: number }, sourceHandle?: string) => {
        suppressPaneClickRef.current = true;
        setLinkSearch('');
        setMenu({ kind: 'add-edge', id: nodeId, x: position.x, y: position.y, sourceHandle });
    }, []);

    const handleConnectStart = useCallback(
        (_event: React.MouseEvent | React.TouchEvent, params: import('reactflow').OnConnectStartParams) => {
            if (params.handleType && params.handleType !== 'source') {
                connectSourceRef.current = null;
                connectSourceHandleRef.current = null;
                return;
            }
            connectSourceRef.current = params.nodeId ?? null;
            connectSourceHandleRef.current = params.handleId ?? null;
        },
        []
    );

    const handleConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            const sourceId = connectSourceRef.current;
            const sourceHandle = connectSourceHandleRef.current ?? undefined;
            connectSourceRef.current = null;
            connectSourceHandleRef.current = null;
            if (!sourceId) {
                return;
            }
            const target = event.target;
            if (!target || !(target instanceof Element)) {
                return;
            }
            if (target.closest('.react-flow__node') || target.closest('.react-flow__handle') || target.closest('.react-flow__edge')) {
                return;
            }
            const coords = getClientPosition(event);
            handleOpenAddMenu(sourceId, coords, sourceHandle);
        },
        [handleOpenAddMenu]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds) => addEdge({ ...connection, type: 'bezier' }, eds));
        },
        [setEdges]
    );

    const addNode = useCallback(
        (node: Node<NodeData>) => {
            setNodes((nds) => nds.concat(node));
        },
        [setNodes]
    );

    const addNodeAndEdit = useCallback(
        (node: Node<NodeData>) => {
            setNodes((nds) => nds.concat(node));
            setEditorNodeId(node.id);
            setEditorValues(buildEditorValues(node));
        },
        [setNodes]
    );

    const handleAddCommandNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('command'),
            type: 'command',
            position: { x: 180, y: 180 },
            data: { label: 'Команда', kind: 'command', commandText: '/start' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddMessageNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('message'),
            type: 'message',
            position: { x: 420, y: 180 },
            data: { label: 'Сообщение', kind: 'message', messageText: 'Привет' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddRowNode = useCallback(() => {
        addNode({
            id: generateId('row'),
            type: 'button_row',
            position: { x: 520, y: 200 },
            data: { label: 'Row', kind: 'button_row' },
        });
    }, [addNode, generateId]);

    const handleAddReplyClearNode = useCallback(() => {
        addNode({
            id: generateId('reply-clear'),
            type: 'reply_clear',
            position: { x: 520, y: 240 },
            data: { label: 'Clear Reply', kind: 'reply_clear' },
        });
    }, [addNode, generateId]);

    const handleAddTimerNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('timer'),
            type: 'timer',
            position: { x: 520, y: 240 },
            data: { label: 'Таймер', kind: 'timer', timerSeconds: 5 },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddDeleteMessageNode = useCallback(() => {
        addNode({
            id: generateId('delete_message'),
            type: 'delete_message',
            position: { x: 520, y: 240 },
            data: { label: 'Удалить сообщение', kind: 'delete_message' },
        });
    }, [addNode, generateId]);

    const handleAddEditMessageNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('edit_message'),
            type: 'edit_message',
            position: { x: 520, y: 240 },
            data: { label: 'Изменить сообщение', kind: 'edit_message', editMessageText: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddChatNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('chat'),
            type: 'chat',
            position: { x: 520, y: 240 },
            data: { label: 'Чат', kind: 'chat', chatId: undefined, chatTitle: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddStatusSetNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('status_set'),
            type: 'status_set',
            position: { x: 520, y: 240 },
            data: { label: 'Статус', kind: 'status_set', statusValue: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddStatusGetNode = useCallback(() => {
        addNode({
            id: generateId('status_get'),
            type: 'status_get',
            position: { x: 520, y: 240 },
            data: { label: 'Статус', kind: 'status_get' },
        });
    }, [addNode, generateId]);

    const handleAddTaskNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('task'),
            type: 'task',
            position: { x: 220, y: 220 },
            data: {
                label: 'Задача',
                kind: 'task',
                taskScheduleType: 'interval',
                taskIntervalMinutes: 60,
                taskDailyTime: '10:00',
                taskRunAt: '',
            },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddBroadcastNode = useCallback(() => {
        addNode({
            id: generateId('broadcast'),
            type: 'broadcast',
            position: { x: 520, y: 220 },
            data: { label: 'Рассылка', kind: 'broadcast' },
        });
    }, [addNode, generateId]);

    const handleAddRecordNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('record'),
            type: 'record',
            position: { x: 520, y: 220 },
            data: { label: 'Запись', kind: 'record', recordField: 'text' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddExcelFileNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('excel'),
            type: 'excel_file',
            position: { x: 520, y: 220 },
            data: { label: 'Excel файл', kind: 'excel_file', fileName: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddTextFileNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('text'),
            type: 'text_file',
            position: { x: 520, y: 220 },
            data: { label: 'TXT файл', kind: 'text_file', fileName: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddFileSearchNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('file-search'),
            type: 'file_search',
            position: { x: 520, y: 220 },
            data: {
                label: 'Поиск',
                kind: 'file_search',
                searchColumnName: '',
                searchSource: 'incoming',
                searchValue: '',
            },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddExcelColumnNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('excel-col'),
            type: 'excel_column',
            position: { x: 520, y: 220 },
            data: { label: 'Столбец', kind: 'excel_column', columnName: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddImageNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('image'),
            type: 'image',
            position: { x: 520, y: 220 },
            data: { label: 'Изображения', kind: 'image', imageUrls: [] },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddVideoNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('video'),
            type: 'video',
            position: { x: 520, y: 220 },
            data: { label: 'Видео', kind: 'video', videoUrls: [] },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddAudioNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('audio'),
            type: 'audio',
            position: { x: 520, y: 220 },
            data: { label: 'Аудио', kind: 'audio', audioUrls: [] },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddDocumentNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('document'),
            type: 'document',
            position: { x: 520, y: 220 },
            data: { label: 'Документ', kind: 'document', documentUrls: [] },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddWebhookNode = useCallback(() => {
        addNode({
            id: generateId('webhook'),
            type: 'webhook',
            position: { x: 520, y: 220 },
            data: { label: 'Вебхук', kind: 'webhook' },
        });
    }, [addNode, generateId]);

    const handleAddConditionNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('condition'),
            type: 'condition',
            position: { x: 520, y: 220 },
            data: { label: 'Проверка', kind: 'condition', conditionText: '', conditionType: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddSubscriptionNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('subscription'),
            type: 'subscription',
            position: { x: 520, y: 220 },
            data: { label: 'Подписка', kind: 'subscription', subscriptionChatId: undefined, subscriptionChatTitle: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddMessageButtonNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('message_button'),
            type: 'message_button',
            position: { x: 520, y: 220 },
            data: {
                label: 'Message Button',
                kind: 'message_button',
                buttonText: 'Кнопка',
                buttonAction: 'callback',
                buttonUrl: '',
                buttonWebAppUrl: '',
                buttonCopyText: '',
            },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddReplyButtonNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('reply_button'),
            type: 'reply_button',
            position: { x: 520, y: 260 },
            data: {
                label: 'Reply Button',
                kind: 'reply_button',
                buttonText: 'Кнопка',
                replyAction: 'text',
                replyWebAppUrl: '',
            },
        });
    }, [addNodeAndEdit, generateId]);


    const applyBotToNode = useCallback(
        (botData: Bot) => {
            setNodes((nds) => {
                const rest = nds.filter((node) => node.data.kind !== 'bot');
                const existingBotNode = nds.find((node) => node.data.kind === 'bot');
                const position = existingBotNode?.position ?? { x: 140, y: 120 };
                return rest.concat({
                    id: existingBotNode?.id ?? `bot-${botData.id}`,
                    type: 'bot',
                    position,
                    data: {
                        label: botData.name,
                        kind: 'bot',
                        botName: botData.name,
                        botToken: botData.token ?? undefined,
                        botStatus: botData.status,
                    },
                });
            });
        },
        [setNodes]
    );

    const handleAddBot = useCallback(async () => {
        if (!bot) {
            return;
        }
        const name = window.prompt('Название бота', bot.name ?? 'Main Bot');
        if (!name) {
            return;
        }
        const token = window.prompt('Токен бота', bot.token ?? '');
        const response = await fetch(`${API_BASE}/bots/${bot.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, token: token || null }),
        });
        if (!response.ok) {
            return;
        }
        const updated: Bot = await response.json();
        setBot(updated);
        applyBotToNode(updated);
    }, [bot, applyBotToNode]);


    const handleLinkToNode = useCallback(
        (targetId: string) => {
            if (!menu || menu.kind !== 'add-edge') {
                return;
            }
            setEdges((eds) => {
                if (eds.some((edge) => edge.source === menu.id && edge.target === targetId)) {
                    return eds;
                }
                return addEdge(
                    {
                        id: generateId('edge'),
                        source: menu.id,
                        target: targetId,
                        type: 'bezier',
                        sourceHandle: menu.sourceHandle,
                    },
                    eds
                );
            });
            setMenu(null);
        },
        [generateId, menu, setEdges]
    );

    const handleCreateAndLink = useCallback(
        (templateKey: string) => {
            if (!menu || menu.kind !== 'add-edge') {
                return;
            }
            const sourceNode = nodes.find((node) => node.id === menu.id);
            const basePosition = sourceNode?.position ?? { x: 120, y: 120 };
            const position = { x: basePosition.x + 260, y: basePosition.y };
            let newNode: Node<NodeData> | null = null;

            if (templateKey === 'command') {
                newNode = {
                    id: generateId('command'),
                    type: 'command',
                    position,
                    data: { label: 'Команда', kind: 'command', commandText: '/start' },
                };
            }

            if (templateKey === 'message') {
                newNode = {
                    id: generateId('message'),
                    type: 'message',
                    position,
                    data: { label: 'Сообщение', kind: 'message', messageText: 'Привет' },
                };
            }

            if (templateKey === 'message_button') {
                newNode = {
                    id: generateId('message_button'),
                    type: 'message_button',
                    position,
                    data: {
                        label: 'Message Button',
                        kind: 'message_button',
                        buttonText: 'Кнопка',
                        buttonAction: 'callback',
                        buttonUrl: '',
                        buttonWebAppUrl: '',
                        buttonCopyText: '',
                    },
                };
            }

            if (templateKey === 'reply_button') {
                newNode = {
                    id: generateId('reply_button'),
                    type: 'reply_button',
                    position,
                    data: {
                        label: 'Reply Button',
                        kind: 'reply_button',
                        buttonText: 'Кнопка',
                        replyAction: 'text',
                        replyWebAppUrl: '',
                    },
                };
            }

            if (templateKey === 'button_row') {
                newNode = {
                    id: generateId('row'),
                    type: 'button_row',
                    position,
                    data: { label: 'Row', kind: 'button_row' },
                };
            }

            if (templateKey === 'reply_clear') {
                newNode = {
                    id: generateId('reply-clear'),
                    type: 'reply_clear',
                    position,
                    data: { label: 'Clear Reply', kind: 'reply_clear' },
                };
            }

            if (templateKey === 'timer') {
                newNode = {
                    id: generateId('timer'),
                    type: 'timer',
                    position,
                    data: { label: 'Таймер', kind: 'timer', timerSeconds: 5 },
                };
            }

            if (templateKey === 'delete_message') {
                newNode = {
                    id: generateId('delete_message'),
                    type: 'delete_message',
                    position,
                    data: { label: 'Удалить сообщение', kind: 'delete_message' },
                };
            }

            if (templateKey === 'edit_message') {
                newNode = {
                    id: generateId('edit_message'),
                    type: 'edit_message',
                    position,
                    data: { label: 'Изменить сообщение', kind: 'edit_message', editMessageText: '' },
                };
            }

            if (templateKey === 'chat') {
                newNode = {
                    id: generateId('chat'),
                    type: 'chat',
                    position,
                    data: { label: 'Чат', kind: 'chat', chatId: undefined, chatTitle: '' },
                };
            }

            if (templateKey === 'status_set') {
                newNode = {
                    id: generateId('status_set'),
                    type: 'status_set',
                    position,
                    data: { label: 'Статус', kind: 'status_set', statusValue: '' },
                };
            }

            if (templateKey === 'status_get') {
                newNode = {
                    id: generateId('status_get'),
                    type: 'status_get',
                    position,
                    data: { label: 'Статус', kind: 'status_get' },
                };
            }

            if (templateKey === 'image') {
                newNode = {
                    id: generateId('image'),
                    type: 'image',
                    position,
                    data: { label: 'Изображения', kind: 'image', imageUrls: [] },
                };
            }

            if (templateKey === 'video') {
                newNode = {
                    id: generateId('video'),
                    type: 'video',
                    position,
                    data: { label: 'Видео', kind: 'video', videoUrls: [] },
                };
            }

            if (templateKey === 'audio') {
                newNode = {
                    id: generateId('audio'),
                    type: 'audio',
                    position,
                    data: { label: 'Аудио', kind: 'audio', audioUrls: [] },
                };
            }

            if (templateKey === 'document') {
                newNode = {
                    id: generateId('document'),
                    type: 'document',
                    position,
                    data: { label: 'Документ', kind: 'document', documentUrls: [] },
                };
            }

            if (templateKey === 'webhook') {
                newNode = {
                    id: generateId('webhook'),
                    type: 'webhook',
                    position,
                    data: { label: 'Вебхук', kind: 'webhook' },
                };
            }

            if (templateKey === 'condition') {
                newNode = {
                    id: generateId('condition'),
                    type: 'condition',
                    position,
                    data: { label: 'Проверка', kind: 'condition', conditionText: '', conditionType: '' },
                };
            }

            if (templateKey === 'subscription') {
                newNode = {
                    id: generateId('subscription'),
                    type: 'subscription',
                    position,
                    data: { label: 'Подписка', kind: 'subscription', subscriptionChatId: undefined, subscriptionChatTitle: '' },
                };
            }

            if (templateKey === 'task') {
                newNode = {
                    id: generateId('task'),
                    type: 'task',
                    position,
                    data: {
                        label: 'Задача',
                        kind: 'task',
                        taskScheduleType: 'interval',
                        taskIntervalMinutes: 60,
                        taskDailyTime: '10:00',
                        taskRunAt: '',
                    },
                };
            }

            if (templateKey === 'broadcast') {
                newNode = {
                    id: generateId('broadcast'),
                    type: 'broadcast',
                    position,
                    data: { label: 'Рассылка', kind: 'broadcast' },
                };
            }

            if (templateKey === 'record') {
                newNode = {
                    id: generateId('record'),
                    type: 'record',
                    position,
                    data: { label: 'Запись', kind: 'record', recordField: 'text' },
                };
            }

            if (templateKey === 'excel_file') {
                newNode = {
                    id: generateId('excel'),
                    type: 'excel_file',
                    position,
                    data: { label: 'Excel файл', kind: 'excel_file', fileName: '' },
                };
            }

            if (templateKey === 'text_file') {
                newNode = {
                    id: generateId('text'),
                    type: 'text_file',
                    position,
                    data: { label: 'TXT файл', kind: 'text_file', fileName: '' },
                };
            }

            if (templateKey === 'excel_column') {
                newNode = {
                    id: generateId('excel-col'),
                    type: 'excel_column',
                    position,
                    data: { label: 'Столбец', kind: 'excel_column', columnName: '' },
                };
            }

            if (templateKey === 'file_search') {
                newNode = {
                    id: generateId('file-search'),
                    type: 'file_search',
                    position,
                    data: {
                        label: 'Поиск',
                        kind: 'file_search',
                        searchColumnName: '',
                        searchSource: 'incoming',
                        searchValue: '',
                    },
                };
            }

            if (!newNode) {
                return;
            }

            setNodes((nds) => nds.concat(newNode));
            setEdges((eds) =>
                addEdge(
                    {
                        id: generateId('edge'),
                        source: menu.id,
                        target: newNode.id,
                        type: 'bezier',
                        sourceHandle: menu.sourceHandle,
                    },
                    eds
                )
            );
            if (
                newNode.data.kind !== 'button_row' &&
                newNode.data.kind !== 'reply_clear' &&
                newNode.data.kind !== 'status_get' &&
                newNode.data.kind !== 'delete_message'
            ) {
                setEditorNodeId(newNode.id);
                setEditorValues(buildEditorValues(newNode));
            }
            setMenu(null);
        },
        [generateId, menu, nodes, setEdges, setNodes]
    );

    const handlePaneClick = useCallback(() => {
        if (suppressPaneClickRef.current) {
            suppressPaneClickRef.current = false;
            return;
        }
        setMenu(null);
    }, []);

    const openEditorForNode = useCallback((node: Node<NodeData>) => {
        setEditorNodeId(node.id);
        setEditorValues(buildEditorValues(node));
    }, []);

    const closeEditor = useCallback(() => {
        setEditorNodeId(null);
    }, []);

    const handleSaveEditor = useCallback(() => {
        if (!editorNodeId) {
            return;
        }
        const uploadImages = async (files: File[]) => {
            if (!files.length) {
                return [];
            }
            const form = new FormData();
            files.forEach((file) => form.append('files', file));
            const response = await fetch(`${API_BASE}/uploads/images`, {
                method: 'POST',
                body: form,
            });
            if (!response.ok) {
                return [];
            }
            const payload = (await response.json()) as { urls?: string[] };
            const urls = payload.urls ?? [];
            return urls.map((url) => (url.startsWith('http') ? url : `${API_BASE}${url}`));
        };

        const save = async () => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id !== editorNodeId) {
                        return node;
                    }
                    const kind = node.data.kind;
                    if (kind === 'command') {
                        return { ...node, data: { ...node.data, commandText: editorValues.commandText } };
                    }
                    if (kind === 'message') {
                        return { ...node, data: { ...node.data, messageText: editorValues.messageText } };
                    }
                    if (kind === 'message_button') {
                        const buttonAction =
                            editorValues.buttonAction === 'url' ||
                            editorValues.buttonAction === 'web_app' ||
                            editorValues.buttonAction === 'copy'
                                ? editorValues.buttonAction
                                : 'callback';
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                buttonText: editorValues.buttonText,
                                buttonAction,
                                buttonUrl: editorValues.buttonUrl.trim(),
                                buttonWebAppUrl: editorValues.buttonWebAppUrl.trim(),
                                buttonCopyText: editorValues.buttonCopyText,
                            },
                        };
                    }
                    if (kind === 'reply_button') {
                        const replyAction = editorValues.replyAction === 'web_app' ? 'web_app' : 'text';
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                buttonText: editorValues.buttonText,
                                replyAction,
                                replyWebAppUrl: editorValues.replyWebAppUrl.trim(),
                            },
                        };
                    }
                    if (kind === 'timer') {
                        const parsed = Number(editorValues.timerSeconds);
                        const seconds = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
                        return { ...node, data: { ...node.data, timerSeconds: seconds } };
                    }
                    if (kind === 'edit_message') {
                        return { ...node, data: { ...node.data, editMessageText: editorValues.editMessageText } };
                    }
                    if (kind === 'chat') {
                        const parsedId = editorValues.chatId ? Number(editorValues.chatId) : undefined;
                        const chatId = Number.isFinite(parsedId) ? parsedId : undefined;
                        const chatTitle =
                            chatOptions.find((option) => option.id === chatId)?.label ??
                            (chatId ? `ID ${chatId}` : '');
                        return { ...node, data: { ...node.data, chatId, chatTitle } };
                    }
                    if (kind === 'subscription') {
                        const parsedId = editorValues.subscriptionChatId ? Number(editorValues.subscriptionChatId) : undefined;
                        const subscriptionChatId = Number.isFinite(parsedId) ? parsedId : undefined;
                        const subscriptionChatTitle =
                            subscriptionOptions.find((option) => option.id === subscriptionChatId)?.label ??
                            (subscriptionChatId ? `ID ${subscriptionChatId}` : '');
                        return {
                            ...node,
                            data: { ...node.data, subscriptionChatId, subscriptionChatTitle },
                        };
                    }
                    if (kind === 'status_set') {
                        return { ...node, data: { ...node.data, statusValue: editorValues.statusValue.trim() } };
                    }
                    if (kind === 'task') {
                        const scheduleType = editorValues.taskScheduleType || 'interval';
                        const intervalValue = Number(editorValues.taskIntervalMinutes);
                        const intervalMinutes = Number.isFinite(intervalValue) && intervalValue > 0 ? intervalValue : 60;
                        const dailyTime = editorValues.taskDailyTime || '10:00';
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                taskScheduleType: scheduleType,
                                taskIntervalMinutes: intervalMinutes,
                                taskDailyTime: dailyTime,
                                taskRunAt: editorValues.taskRunAt || '',
                            },
                        };
                    }
                    if (kind === 'record') {
                        return { ...node, data: { ...node.data, recordField: editorValues.recordField } };
                    }
                    if (kind === 'excel_file' || kind === 'text_file') {
                        return { ...node, data: { ...node.data, fileName: editorValues.fileName.trim() } };
                    }
                    if (kind === 'excel_column') {
                        return { ...node, data: { ...node.data, columnName: editorValues.columnName.trim() } };
                    }
                    if (kind === 'file_search') {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                searchColumnName: editorValues.searchColumnName.trim(),
                                searchSource: editorValues.searchSource || 'incoming',
                                searchValue: editorValues.searchValue,
                            },
                        };
                    }
                    if (kind === 'video') {
                        return { ...node, data: { ...node.data, videoUrls: editorValues.videoUrls } };
                    }
                    if (kind === 'audio') {
                        return { ...node, data: { ...node.data, audioUrls: editorValues.audioUrls } };
                    }
                    if (kind === 'document') {
                        return { ...node, data: { ...node.data, documentUrls: editorValues.documentUrls } };
                    }
                    if (kind === 'condition') {
                        const lengthValue =
                            editorValues.conditionLengthValue.trim() === ''
                                ? undefined
                                : Number(editorValues.conditionLengthValue);
                        const normalizedType = editorValues.conditionType || '';
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                conditionText: editorValues.conditionText,
                                conditionType: normalizedType,
                                conditionLengthOp: editorValues.conditionLengthOp,
                                conditionLengthValue: Number.isFinite(lengthValue) ? Math.max(0, lengthValue) : undefined,
                            },
                        };
                    }
                    return node;
                })
            );

            const node = nodes.find((item) => item.id === editorNodeId);
            if (node?.data.kind === 'image') {
                const uploaded = await uploadImages(editorValues.imageFiles);
                if (editorValues.imageFiles.length && !uploaded.length) {
                    window.alert('Не удалось загрузить изображения. Проверь backend и повтори.');
                    return;
                }
                setNodes((nds) =>
                    nds.map((item) => {
                        if (item.id !== editorNodeId) {
                            return item;
                        }
                        const merged = [...(editorValues.imageUrls ?? []), ...uploaded];
                        return { ...item, data: { ...item.data, imageUrls: merged } };
                    })
                );
                setEditorValues((prev) => ({ ...prev, imageFiles: [], imageUrls: [...prev.imageUrls, ...uploaded] }));
            }
            if (node?.data.kind === 'video') {
                const uploaded = await uploadImages(editorValues.videoFiles);
                if (editorValues.videoFiles.length && !uploaded.length) {
                    window.alert('Не удалось загрузить видео. Проверь backend и повтори.');
                    return;
                }
                setNodes((nds) =>
                    nds.map((item) => {
                        if (item.id !== editorNodeId) {
                            return item;
                        }
                        const merged = [...(editorValues.videoUrls ?? []), ...uploaded];
                        return { ...item, data: { ...item.data, videoUrls: merged } };
                    })
                );
                setEditorValues((prev) => ({ ...prev, videoFiles: [], videoUrls: [...prev.videoUrls, ...uploaded] }));
            }
            if (node?.data.kind === 'audio') {
                const uploaded = await uploadImages(editorValues.audioFiles);
                if (editorValues.audioFiles.length && !uploaded.length) {
                    window.alert('Не удалось загрузить аудио. Проверь backend и повтори.');
                    return;
                }
                setNodes((nds) =>
                    nds.map((item) => {
                        if (item.id !== editorNodeId) {
                            return item;
                        }
                        const merged = [...(editorValues.audioUrls ?? []), ...uploaded];
                        return { ...item, data: { ...item.data, audioUrls: merged } };
                    })
                );
                setEditorValues((prev) => ({ ...prev, audioFiles: [], audioUrls: [...prev.audioUrls, ...uploaded] }));
            }
            if (node?.data.kind === 'document') {
                const uploaded = await uploadImages(editorValues.documentFiles);
                if (editorValues.documentFiles.length && !uploaded.length) {
                    window.alert('Не удалось загрузить документ. Проверь backend и повтори.');
                    return;
                }
                setNodes((nds) =>
                    nds.map((item) => {
                        if (item.id !== editorNodeId) {
                            return item;
                        }
                        const merged = [...(editorValues.documentUrls ?? []), ...uploaded];
                        return { ...item, data: { ...item.data, documentUrls: merged } };
                    })
                );
                setEditorValues((prev) => ({
                    ...prev,
                    documentFiles: [],
                    documentUrls: [...prev.documentUrls, ...uploaded],
                }));
            }
            closeEditor();
        };

        save().catch(() => closeEditor());
    }, [chatOptions, closeEditor, editorNodeId, editorValues, nodes, setNodes, subscriptionOptions]);

    const handleEditNode = useCallback(
        (nodeId: string) => {
            const node = nodes.find((item) => item.id === nodeId);
            if (node) {
                openEditorForNode(node);
            }
        },
        [nodes, openEditorForNode]
    );

    const handleDeleteNodeById = useCallback(
        (nodeId: string) => {
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            if (editorNodeId === nodeId) {
                setEditorNodeId(null);
            }
        },
        [editorNodeId, setEdges, setNodes]
    );

    const handleDeleteEdgeById = useCallback(
        (edgeId: string) => {
            setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
        },
        [setEdges]
    );

    const handleDuplicateNodeById = useCallback(
        (nodeId: string) => {
            setNodes((nds) => {
                const node = nds.find((item) => item.id === nodeId);
                if (!node) {
                    return nds;
                }
                const clonedData = JSON.parse(JSON.stringify(node.data)) as NodeData;
                const nextNode: Node<NodeData> = {
                    ...node,
                    id: generateId(node.type ?? 'node'),
                    position: { x: node.position.x + 40, y: node.position.y + 40 },
                    data: clonedData,
                    selected: true,
                };
                const deselected = nds.map((item) => ({ ...item, selected: false }));
                return deselected.concat(nextNode);
            });
        },
        [generateId, setNodes]
    );

    const handleSortLayout = useCallback(() => {
        const levelById = new Map<string, number>();
        nodes.forEach((node) => levelById.set(node.id, 0));
        for (let i = 0; i < nodes.length; i += 1) {
            let changed = false;
            edges.forEach((edge) => {
                const sourceLevel = levelById.get(edge.source) ?? 0;
                const targetLevel = levelById.get(edge.target) ?? 0;
                const nextLevel = sourceLevel + 1;
                if (nextLevel > targetLevel) {
                    levelById.set(edge.target, nextLevel);
                    changed = true;
                }
            });
            if (!changed) {
                break;
            }
        }
        const groups = new Map<number, Node<NodeData>[]>();
        nodes.forEach((node) => {
            const level = levelById.get(node.id) ?? 0;
            const bucket = groups.get(level);
            if (bucket) {
                bucket.push(node);
            } else {
                groups.set(level, [node]);
            }
        });
        const levels = Array.from(groups.keys()).sort((a, b) => a - b);
        const START_X = 80;
        const START_Y = 80;
        const X_GAP = 120;
        const Y_GAP = 40;
        const positionById = new Map<string, { x: number; y: number }>();
        let currentX = START_X;
        levels.forEach((level) => {
            const bucket = (groups.get(level) ?? []).slice().sort((a, b) => a.position.y - b.position.y);
            const maxWidth = bucket.reduce((max, node) => Math.max(max, node.width ?? 200), 200);
            let currentY = START_Y;
            bucket.forEach((node) => {
                const height = node.height ?? 120;
                positionById.set(node.id, { x: currentX, y: currentY });
                currentY += height + Y_GAP;
            });
            currentX += maxWidth + X_GAP;
        });
        setNodes((nds) =>
            nds.map((node) => {
                const position = positionById.get(node.id);
                if (!position) {
                    return node;
                }
                return { ...node, position };
            })
        );
    }, [edges, nodes, setNodes]);

    const handleClearFlow = useCallback(() => {
        setNodes((nds) => nds.filter((node) => node.data.kind === 'bot'));
        setEdges([]);
        setMenu(null);
        setEditorNodeId(null);
    }, [setEdges, setNodes]);


    const handleStartBot = useCallback(async () => {
        if (!bot) {
            return;
        }
        const commandNodes = nodes.filter((node) => node.data.kind === 'command');
        const nodesById = new Map(nodes.map((node) => [node.id, node]));
        const hasContentTarget = (sourceId: string) => {
            const visited = new Set<string>();
            const stack = [sourceId];
            while (stack.length) {
                const current = stack.pop();
                if (!current || visited.has(current)) {
                    continue;
                }
                visited.add(current);
                for (const edge of edges) {
                    if (edge.source !== current) {
                        continue;
                    }
                    const target = nodesById.get(edge.target);
                    if (!target) {
                        continue;
                    }
                    if (
                        target.data.kind === 'message' ||
                        target.data.kind === 'image' ||
                        target.data.kind === 'video' ||
                        target.data.kind === 'audio' ||
                        target.data.kind === 'document' ||
                        target.data.kind === 'delete_message' ||
                        target.data.kind === 'edit_message'
                    ) {
                        return true;
                    }
                    if (
                        target.data.kind === 'timer' ||
                        target.data.kind === 'condition' ||
                        target.data.kind === 'subscription' ||
                        target.data.kind === 'broadcast' ||
                        target.data.kind === 'record' ||
                        target.data.kind === 'excel_file' ||
                        target.data.kind === 'text_file' ||
                        target.data.kind === 'excel_column' ||
                        target.data.kind === 'file_search' ||
                        target.data.kind === 'chat'
                    ) {
                        stack.push(target.id);
                    }
                }
            }
            return false;
        };
        const disconnected = commandNodes.filter((node) => !hasContentTarget(node.id));
        if (disconnected.length) {
            window.alert('Подключи каждую команду к следующей ноде (сообщение/медиа, можно через таймер).');
            return;
        }
        const response = await fetch(`${API_BASE}/bots/${bot.id}/start`, { method: 'POST' });
        if (!response.ok) {
            return;
        }
        const updated: Bot = await response.json();
        setBot(updated);
        applyBotToNode(updated);
    }, [bot, nodes, edges, applyBotToNode]);

    const handleStopBot = useCallback(async () => {
        if (!bot) {
            return;
        }
        const response = await fetch(`${API_BASE}/bots/${bot.id}/stop`, { method: 'POST' });
        if (!response.ok) {
            return;
        }
        const updated: Bot = await response.json();
        setBot(updated);
        applyBotToNode(updated);
    }, [bot, applyBotToNode]);

    const handleSaveFlow = useCallback(async () => {
        if (!bot) {
            return;
        }
        await fetch(`${API_BASE}/bots/${bot.id}/flow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes, edges }),
        });
    }, [bot, nodes, edges]);

    const handleExport = useCallback(() => {
        const payload = {
            bot,
            flow: { nodes, edges },
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bot-workspace.json';
        link.click();
        URL.revokeObjectURL(url);
    }, [bot, nodes, edges]);

    const handleImport = useCallback(
        async (file: File) => {
            const text = await file.text();
            const parsed = JSON.parse(text) as {
                bot?: Bot;
                flow?: { nodes?: Node<NodeData>[]; edges?: Edge[] };
            };
            if (parsed.flow?.nodes && parsed.flow?.edges) {
                setNodes(parsed.flow.nodes);
                setEdges(parsed.flow.edges);
            }
            if (parsed.bot && bot) {
                const response = await fetch(`${API_BASE}/bots/${bot.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: parsed.bot.name,
                        token: parsed.bot.token ?? null,
                        status: parsed.bot.status,
                    }),
                });
                if (response.ok) {
                    const updated: Bot = await response.json();
                    setBot(updated);
                    applyBotToNode(updated);
                }
            }
        },
        [bot, setEdges, setNodes, applyBotToNode]
    );

    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsHydrating(true);
            const storedId = window.localStorage.getItem('botId');
            const getBot = async (id: string) => {
                const response = await fetch(`${API_BASE}/bots/${id}`);
                if (!response.ok) {
                    return null;
                }
                return (await response.json()) as Bot;
            };
            let currentBot = storedId ? await getBot(storedId) : null;
            if (!currentBot) {
                const listResponse = await fetch(`${API_BASE}/bots`);
                const list: Bot[] = listResponse.ok ? await listResponse.json() : [];
                currentBot = list[0] ?? null;
            }
            if (!currentBot) {
                const createResponse = await fetch(`${API_BASE}/bots`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Main Bot' }),
                });
                if (createResponse.ok) {
                    currentBot = await createResponse.json();
                }
            }
            if (!isMounted || !currentBot) {
                setIsHydrating(false);
                return;
            }
            window.localStorage.setItem('botId', currentBot.id);
            setBot(currentBot);
            setNodes(currentBot.flow.nodes ?? []);
            setEdges(currentBot.flow.edges ?? []);
            applyBotToNode(currentBot);
            setIsHydrating(false);
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [applyBotToNode, setEdges, setNodes]);

    useEffect(() => {
        if (isHydrating || !bot) {
            return undefined;
        }
        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = window.setTimeout(() => {
            handleSaveFlow();
        }, 800);
        return () => {
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
            }
        };
    }, [bot, nodes, edges, handleSaveFlow, isHydrating]);

    useEffect(() => {
        setNodes((nds) => {
            const sources = new Set(edges.map((edge) => edge.source));
            let changed = false;
            const next = nds.map((node) => {
                const canAddChild =
                    node.data.kind === 'message' ||
                    node.data.kind === 'image' ||
                    node.data.kind === 'video' ||
                    node.data.kind === 'audio' ||
                    node.data.kind === 'document' ||
                    node.data.kind === 'button_row' ||
                    node.data.kind === 'timer' ||
                    node.data.kind === 'delete_message' ||
                    node.data.kind === 'edit_message' ||
                    node.data.kind === 'chat' ||
                    node.data.kind === 'status_set' ||
                    node.data.kind === 'status_get' ||
                    node.data.kind === 'webhook' ||
                    node.data.kind === 'condition' ||
                    node.data.kind === 'subscription' ||
                    node.data.kind === 'task' ||
                    node.data.kind === 'broadcast' ||
                    node.data.kind === 'record' ||
                    node.data.kind === 'excel_file' ||
                    node.data.kind === 'text_file' ||
                    node.data.kind === 'excel_column' ||
                    node.data.kind === 'file_search' ||
                    !sources.has(node.id);
                if (node.data.canAddChild === canAddChild) {
                    return node;
                }
                changed = true;
                return { ...node, data: { ...node.data, canAddChild } };
            });
            return changed ? next : nds;
        });
    }, [edges, setNodes]);

    const editorNode = editorNodeId ? nodes.find((node) => node.id === editorNodeId) ?? null : null;

    useEffect(() => {
        if (!bot || !editorNode || editorNode.data.kind !== 'chat') {
            return;
        }
        let isMounted = true;
        fetch(`${API_BASE}/bots/${bot.id}/users`)
            .then((response) => (response.ok ? response.json() : Promise.reject()))
            .then((payload: Array<{ id: number; username?: string | null; first_name?: string | null; last_name?: string | null }>) => {
                if (!isMounted) {
                    return;
                }
                const options = payload.map((user) => ({
                    id: user.id,
                    label: formatChatLabel(user),
                }));
                setChatOptions(options);
            })
            .catch(() => {
                if (isMounted) {
                    setChatOptions([]);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [bot, editorNode]);

    useEffect(() => {
        if (!bot || !editorNode || editorNode.data.kind !== 'subscription') {
            return;
        }
        let isMounted = true;
        fetch(`${API_BASE}/bots/${bot.id}/chats`)
            .then((response) => (response.ok ? response.json() : Promise.reject()))
            .then((payload: Array<{ id: number; title?: string | null; username?: string | null; type?: string | null }>) => {
                if (!isMounted) {
                    return;
                }
                const options = payload.map((chat) => {
                    const title = (chat.title || '').trim();
                    const username = chat.username ? `@${chat.username}` : '';
                    const suffix = [username, chat.type].filter(Boolean).join(' · ');
                    const label = suffix && title ? `${title} (${suffix})` : title || username || `ID ${chat.id}`;
                    return { id: chat.id, label };
                });
                setSubscriptionOptions(options);
            })
            .catch(() => {
                if (isMounted) {
                    setSubscriptionOptions([]);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [bot, editorNode]);
    const linkCandidates = useMemo(() => {
        if (!menu || menu.kind !== 'add-edge') {
            return [];
        }
            const sourceNode = nodes.find((node) => node.id === menu.id);
            const sourceKind = sourceNode?.data.kind;
            const connectedTargets = new Set(edges.filter((edge) => edge.source === menu.id).map((edge) => edge.target));
            let candidates = nodes.filter((node) => node.id !== menu.id && !connectedTargets.has(node.id));
            if (sourceKind === 'message') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message_button' ||
                        node.data.kind === 'reply_button' ||
                        node.data.kind === 'button_row' ||
                        node.data.kind === 'reply_clear' ||
                        node.data.kind === 'timer' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document'
                );
            }
            if (sourceKind === 'message_button' || sourceKind === 'reply_button') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'file_search' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'command') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'webhook') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'condition' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'file_search' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'condition') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'status_set' || sourceKind === 'status_get') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'condition' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'image' || sourceKind === 'video' || sourceKind === 'audio' || sourceKind === 'document') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message_button' ||
                        node.data.kind === 'reply_button' ||
                        node.data.kind === 'button_row' ||
                        node.data.kind === 'reply_clear' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'timer') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file'
                );
            }
            if (sourceKind === 'delete_message') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'condition' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'edit_message') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message_button' ||
                        node.data.kind === 'reply_button' ||
                        node.data.kind === 'button_row' ||
                        node.data.kind === 'reply_clear' ||
                        node.data.kind === 'timer' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document'
                );
            }
            if (sourceKind === 'chat') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'condition' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'subscription') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer' ||
                        node.data.kind === 'task' ||
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file'
                );
            }
            if (sourceKind === 'task') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'broadcast' ||
                        node.data.kind === 'condition' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'broadcast') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'condition' ||
                        node.data.kind === 'subscription' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'excel_file' ||
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'record') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'text_file' ||
                        node.data.kind === 'file_search' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'excel_file') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'excel_column' ||
                        node.data.kind === 'record' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'excel_column') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'record' ||
                        node.data.kind === 'file_search' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'text_file') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'record' ||
                        node.data.kind === 'file_search' ||
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'file_search') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message' ||
                        node.data.kind === 'image' ||
                        node.data.kind === 'video' ||
                        node.data.kind === 'audio' ||
                        node.data.kind === 'document' ||
                        node.data.kind === 'delete_message' ||
                        node.data.kind === 'edit_message' ||
                        node.data.kind === 'chat' ||
                        node.data.kind === 'status_set' ||
                        node.data.kind === 'status_get' ||
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'button_row') {
                candidates = candidates.filter(
                    (node) => node.data.kind === 'message_button' || node.data.kind === 'reply_button'
                );
            }
            const items = candidates
                .map((node) => ({
                    id: node.id,
                    title: getNodeTitle(node),
                    subtitle: getNodeSubtitle(node),
            }));
        if (!linkSearch.trim()) {
            return items;
        }
        const needle = linkSearch.toLowerCase();
        return items.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(needle));
    }, [menu, nodes, edges, linkSearch]);

    const createTemplates = useMemo(
        () => [
            { key: 'command', label: 'Команда', description: 'Команда бота' },
            { key: 'message', label: 'Сообщение', description: 'Ответ пользователю' },
            { key: 'button_row', label: 'Rows', description: 'Строка кнопок' },
            { key: 'message_button', label: 'Message Button', description: 'Инлайн кнопка' },
            { key: 'reply_button', label: 'Reply Button', description: 'Ответная кнопка' },
            { key: 'reply_clear', label: 'Clear Reply', description: 'Очистить reply-кнопки' },
            { key: 'timer', label: 'Таймер', description: 'Задержка перед сообщением' },
            { key: 'delete_message', label: 'Удалить сообщение', description: 'Удалить текущее сообщение' },
            { key: 'edit_message', label: 'Изменить сообщение', description: 'Заменить текст сообщения' },
            { key: 'chat', label: 'Чат', description: 'Отправить другому пользователю' },
            { key: 'status_set', label: 'Статус', description: 'Установить статус пользователя' },
            { key: 'status_get', label: 'Статус', description: 'Получить статус пользователя' },
            { key: 'task', label: 'Задача', description: 'Расписание отправки' },
            { key: 'broadcast', label: 'Рассылка', description: 'Отправить всем' },
            { key: 'record', label: 'Запись', description: 'Сохранить данные' },
            { key: 'excel_file', label: 'Excel файл', description: 'Файл для записей' },
            { key: 'excel_column', label: 'Excel столбец', description: 'Колонка для записи' },
            { key: 'text_file', label: 'TXT файл', description: 'Текстовый файл' },
            { key: 'file_search', label: 'Поиск', description: 'Поиск в файле' },
            { key: 'image', label: 'Изображения', description: 'Один или больше файлов' },
            { key: 'video', label: 'Видео', description: 'Видео файлы' },
            { key: 'audio', label: 'Аудио', description: 'Аудио файлы' },
            { key: 'document', label: 'Документ', description: 'Файлы документов' },
            { key: 'webhook', label: 'Вебхук', description: 'Сообщение пользователя' },
            { key: 'condition', label: 'Проверка', description: 'Сравнить текст' },
            { key: 'subscription', label: 'Подписка', description: 'Проверка подписки' },
        ],
        []
    );

    const filteredCreateTemplates = useMemo(() => {
        const sourceNode = menu?.kind === 'add-edge' ? nodes.find((node) => node.id === menu.id) : null;
        const sourceKind = sourceNode?.data.kind;
        let templates = createTemplates;
        if (sourceKind === 'message') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message_button' ||
                    item.key === 'reply_button' ||
                    item.key === 'button_row' ||
                    item.key === 'reply_clear' ||
                    item.key === 'timer' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document'
            );
        }
        if (sourceKind === 'command') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'file_search' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'webhook') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'condition' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'file_search' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'condition') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'message_button' || sourceKind === 'reply_button') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'status_set' || sourceKind === 'status_get') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'condition' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'image' || sourceKind === 'video' || sourceKind === 'audio' || sourceKind === 'document') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message_button' ||
                    item.key === 'reply_button' ||
                    item.key === 'button_row' ||
                    item.key === 'reply_clear' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'timer') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file'
            );
        }
        if (sourceKind === 'delete_message') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'condition' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'edit_message') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message_button' ||
                    item.key === 'reply_button' ||
                    item.key === 'button_row' ||
                    item.key === 'reply_clear' ||
                    item.key === 'timer' ||
                    item.key === 'delete_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document'
            );
        }
        if (sourceKind === 'chat') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'condition' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'subscription' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'subscription') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer' ||
                    item.key === 'task' ||
                    item.key === 'broadcast' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file'
            );
        }
        if (sourceKind === 'task') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'broadcast' ||
                    item.key === 'condition' ||
                    item.key === 'subscription' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'broadcast') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'condition' ||
                    item.key === 'subscription' ||
                    item.key === 'record' ||
                    item.key === 'excel_file' ||
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'record') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'excel_column' ||
                    item.key === 'text_file' ||
                    item.key === 'file_search' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'excel_file') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'excel_column' ||
                    item.key === 'record' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'excel_column') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'record' ||
                    item.key === 'file_search' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'text_file') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'record' ||
                    item.key === 'file_search' ||
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'file_search') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message' ||
                    item.key === 'image' ||
                    item.key === 'video' ||
                    item.key === 'audio' ||
                    item.key === 'document' ||
                    item.key === 'delete_message' ||
                    item.key === 'edit_message' ||
                    item.key === 'chat' ||
                    item.key === 'status_set' ||
                    item.key === 'status_get' ||
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'button_row') {
            templates = createTemplates.filter(
                (item) => item.key === 'message_button' || item.key === 'reply_button'
            );
        }
        if (!linkSearch.trim()) {
            return templates;
        }
        const needle = linkSearch.toLowerCase();
        return templates.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle));
    }, [createTemplates, linkSearch, menu, nodes]);

    const nodeTemplates = useMemo(
        () => [
            { key: 'command', label: 'Команда', description: 'Команда бота', action: handleAddCommandNode },
            { key: 'message', label: 'Сообщение', description: 'Ответ пользователю', action: handleAddMessageNode },
            { key: 'button_row', label: 'Rows', description: 'Строка кнопок', action: handleAddRowNode },
            { key: 'message_button', label: 'Message Button', description: 'Инлайн кнопка', action: handleAddMessageButtonNode },
            { key: 'reply_button', label: 'Reply Button', description: 'Ответная кнопка', action: handleAddReplyButtonNode },
            { key: 'reply_clear', label: 'Clear Reply', description: 'Очистить reply-кнопки', action: handleAddReplyClearNode },
            { key: 'timer', label: 'Таймер', description: 'Задержка перед сообщением', action: handleAddTimerNode },
            { key: 'delete_message', label: 'Удалить сообщение', description: 'Удалить текущее сообщение', action: handleAddDeleteMessageNode },
            { key: 'edit_message', label: 'Изменить сообщение', description: 'Заменить текст сообщения', action: handleAddEditMessageNode },
            { key: 'chat', label: 'Чат', description: 'Отправить другому пользователю', action: handleAddChatNode },
            { key: 'status_set', label: 'Статус', description: 'Установить статус пользователя', action: handleAddStatusSetNode },
            { key: 'status_get', label: 'Статус', description: 'Получить статус пользователя', action: handleAddStatusGetNode },
            { key: 'task', label: 'Задача', description: 'Расписание отправки', action: handleAddTaskNode },
            { key: 'broadcast', label: 'Рассылка', description: 'Отправить всем', action: handleAddBroadcastNode },
            { key: 'record', label: 'Запись', description: 'Сохранить данные', action: handleAddRecordNode, group: 'Работа с файлом' },
            { key: 'excel_file', label: 'Excel файл', description: 'Файл для записей', action: handleAddExcelFileNode, group: 'Работа с файлом' },
            { key: 'excel_column', label: 'Excel столбец', description: 'Колонка для записи', action: handleAddExcelColumnNode, group: 'Работа с файлом' },
            { key: 'text_file', label: 'TXT файл', description: 'Текстовый файл', action: handleAddTextFileNode, group: 'Работа с файлом' },
            { key: 'file_search', label: 'Поиск', description: 'Поиск в файле', action: handleAddFileSearchNode, group: 'Работа с файлом' },
            { key: 'image', label: 'Изображения', description: 'Один или больше файлов', action: handleAddImageNode },
            { key: 'video', label: 'Видео', description: 'Видео файлы', action: handleAddVideoNode },
            { key: 'audio', label: 'Аудио', description: 'Аудио файлы', action: handleAddAudioNode },
            { key: 'document', label: 'Документ', description: 'Файлы документов', action: handleAddDocumentNode },
            { key: 'webhook', label: 'Вебхук', description: 'Сообщение пользователя', action: handleAddWebhookNode },
            { key: 'condition', label: 'Проверка', description: 'Сравнить текст', action: handleAddConditionNode },
            { key: 'subscription', label: 'Подписка', description: 'Проверка подписки', action: handleAddSubscriptionNode },
            { key: 'bot', label: 'Бот', description: 'Токен и статус', action: handleAddBot },
        ],
        [
            handleAddBot,
            handleAddCommandNode,
            handleAddMessageNode,
            handleAddRowNode,
            handleAddMessageButtonNode,
            handleAddReplyButtonNode,
            handleAddReplyClearNode,
            handleAddTimerNode,
            handleAddDeleteMessageNode,
            handleAddEditMessageNode,
            handleAddChatNode,
            handleAddStatusSetNode,
            handleAddStatusGetNode,
            handleAddTaskNode,
            handleAddBroadcastNode,
            handleAddRecordNode,
            handleAddExcelFileNode,
            handleAddExcelColumnNode,
            handleAddTextFileNode,
            handleAddFileSearchNode,
            handleAddImageNode,
            handleAddVideoNode,
            handleAddAudioNode,
            handleAddDocumentNode,
            handleAddWebhookNode,
            handleAddConditionNode,
            handleAddSubscriptionNode,
        ]
    );

    const filteredTemplates = nodeTemplates.filter((item) => {
        if (!searchTerm.trim()) {
            return true;
        }
        const needle = searchTerm.toLowerCase();
        return `${item.label} ${item.description}`.toLowerCase().includes(needle);
    });

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex h-screen flex-col overflow-hidden bg-[#f4f4ef] font-['Space_Grotesk'] text-slate-900">
                <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[#ffd166]/40 blur-[90px]" />
                <div className="pointer-events-none absolute right-[-80px] top-[-40px] h-80 w-80 rounded-full bg-[#6ee7b7]/40 blur-[110px]" />
                <div className="pointer-events-none absolute bottom-[-120px] left-[40%] h-96 w-96 rounded-full bg-[#60a5fa]/30 blur-[120px]" />

                <AppNavbar
                    onSave={handleSaveFlow}
                    onSort={handleSortLayout}
                    onClear={handleClearFlow}
                    onExport={handleExport}
                    onImport={handleImportClick}
                />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        templates={filteredTemplates}
                        statusLabel={`Статус: ${bot?.status ?? 'stopped'}`}
                    />
                    <BotActionsContext.Provider value={{ onStart: handleStartBot, onStop: handleStopBot }}>
                        <AddEdgeMenuContext.Provider value={{ onOpenAddMenu: handleOpenAddMenu }}>
                            <GraphActionsContext.Provider
                                value={{
                                    onEditNode: handleEditNode,
                                    onDeleteNode: handleDeleteNodeById,
                                    onDeleteEdge: handleDeleteEdgeById,
                                    onDuplicateNode: handleDuplicateNodeById,
                                    onUpdateNode: handleUpdateNodeData,
                                }}
                            >
                                <main className="relative flex-1">
                                    <NodeContextMenu
                                        menu={menu}
                                        linkCandidates={linkCandidates}
                                        createTemplates={filteredCreateTemplates}
                                        linkSearch={linkSearch}
                                        onLinkSearchChange={(value) => setLinkSearch(value)}
                                        onLinkToNode={handleLinkToNode}
                                        onCreateAndLink={handleCreateAndLink}
                                    />
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        nodeTypes={nodeTypes}
                                        edgeTypes={edgeTypes}
                                        onNodesChange={handleNodesChange}
                                        onEdgesChange={handleEdgesChange}
                                        onConnect={onConnect}
                                        onConnectStart={handleConnectStart}
                                        onConnectEnd={handleConnectEnd}
                                        onPaneClick={handlePaneClick}
                                        connectionLineType={ConnectionLineType.Bezier}
                                        defaultEdgeOptions={{ type: 'deletable', style: { strokeWidth: 2.5 } }}
                                        fitView
                                    >
                                        <Background gap={20} size={1} color="#e2e8f0" />
                                        <Controls />
                                    </ReactFlow>
                                </main>
                            </GraphActionsContext.Provider>
                        </AddEdgeMenuContext.Provider>
                    </BotActionsContext.Provider>
                    <NodeEditorPanel
                        node={editorNode}
                        values={editorValues}
                        chatOptions={chatOptions}
                        subscriptionOptions={subscriptionOptions}
                        onChange={setEditorValues}
                        onSave={handleSaveEditor}
                        onClose={closeEditor}
                    />
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                            handleImport(file).catch(() => undefined);
                        }
                        event.target.value = '';
                    }}
                />
            </div>
        </>
    );
}


