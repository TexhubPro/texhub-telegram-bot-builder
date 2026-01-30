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
import { CommandNode } from '../components/nodes/command-node';
import { ConditionNode } from '../components/nodes/condition-node';
import { NodeContextMenu } from '../components/nodes/context-menu';
import { GraphActionsContext } from '../components/nodes/graph-actions-context';
import { AudioNode } from '../components/nodes/audio-node';
import { DocumentNode } from '../components/nodes/document-node';
import { ImageNode } from '../components/nodes/image-node';
import { MessageButtonNode } from '../components/nodes/message-button-node';
import { MessageNode } from '../components/nodes/message-node';
import { ReplyClearNode } from '../components/nodes/reply-clear-node';
import { ReplyButtonNode } from '../components/nodes/reply-button-node';
import { StyledNode } from '../components/nodes/styled-node';
import { TimerNode } from '../components/nodes/timer-node';
import { VideoNode } from '../components/nodes/video-node';
import { WebhookNode } from '../components/nodes/webhook-node';
import { NodeEditorPanel } from '../components/sidebar/node-editor-panel';
import { Sidebar } from '../components/sidebar/sidebar';
import { DeletableEdge } from '../components/edges/deletable-edge';
import type { Bot, ContextMenu, NodeData, NodeKind } from '../components/types';

const API_BASE = 'http://localhost:8001';

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

const buildEditorValues = (node: Node<NodeData>) => ({
    commandText: node.data.commandText ?? '',
    messageText: node.data.messageText ?? '',
    buttonText: node.data.buttonText ?? '',
    imageUrls: node.data.imageUrls ?? [],
    imageFiles: [] as File[],
    videoUrls: node.data.videoUrls ?? [],
    videoFiles: [] as File[],
    audioUrls: node.data.audioUrls ?? [],
    audioFiles: [] as File[],
    documentUrls: node.data.documentUrls ?? [],
    documentFiles: [] as File[],
    conditionText: node.data.conditionText ?? '',
    conditionHasText: node.data.conditionHasText ?? false,
    conditionHasNumber: node.data.conditionHasNumber ?? false,
    conditionHasPhoto: node.data.conditionHasPhoto ?? false,
    conditionHasVideo: node.data.conditionHasVideo ?? false,
    conditionHasAudio: node.data.conditionHasAudio ?? false,
    conditionHasLocation: node.data.conditionHasLocation ?? false,
    conditionMinLength: node.data.conditionMinLength !== undefined ? String(node.data.conditionMinLength) : '',
    conditionMaxLength: node.data.conditionMaxLength !== undefined ? String(node.data.conditionMaxLength) : '',
    timerSeconds: node.data.timerSeconds !== undefined ? String(node.data.timerSeconds) : '',
});

export default function Welcome() {
    const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [menu, setMenu] = useState<ContextMenu | null>(null);
    const [linkSearch, setLinkSearch] = useState('');
    const [bot, setBot] = useState<Bot | null>(null);
    const [isHydrating, setIsHydrating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editorNodeId, setEditorNodeId] = useState<string | null>(null);
    const [editorValues, setEditorValues] = useState({
        commandText: '',
        messageText: '',
        buttonText: '',
        imageUrls: [] as string[],
        imageFiles: [] as File[],
        videoUrls: [] as string[],
        videoFiles: [] as File[],
        audioUrls: [] as string[],
        audioFiles: [] as File[],
        documentUrls: [] as string[],
        documentFiles: [] as File[],
        conditionText: '',
        conditionHasText: false,
        conditionHasNumber: false,
        conditionHasPhoto: false,
        conditionHasVideo: false,
        conditionHasAudio: false,
        conditionHasLocation: false,
        conditionMinLength: '',
        conditionMaxLength: '',
        timerSeconds: '',
    });
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const saveTimerRef = useRef<number | null>(null);
    const connectSourceRef = useRef<string | null>(null);
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

    const handleOpenAddMenu = useCallback((nodeId: string, position: { x: number; y: number }) => {
        suppressPaneClickRef.current = true;
        setLinkSearch('');
        setMenu({ kind: 'add-edge', id: nodeId, x: position.x, y: position.y });
    }, []);

    const handleConnectStart = useCallback(
        (_event: React.MouseEvent | React.TouchEvent, params: import('reactflow').OnConnectStartParams) => {
            if (params.handleType && params.handleType !== 'source') {
                connectSourceRef.current = null;
                return;
            }
            connectSourceRef.current = params.nodeId ?? null;
        },
        []
    );

    const handleConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            const sourceId = connectSourceRef.current;
            connectSourceRef.current = null;
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
            handleOpenAddMenu(sourceId, coords);
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
            data: { label: 'Проверка', kind: 'condition', conditionText: '' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddMessageButtonNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('message_button'),
            type: 'message_button',
            position: { x: 520, y: 220 },
            data: { label: 'Message Button', kind: 'message_button', buttonText: 'Кнопка' },
        });
    }, [addNodeAndEdit, generateId]);

    const handleAddReplyButtonNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('reply_button'),
            type: 'reply_button',
            position: { x: 520, y: 260 },
            data: { label: 'Reply Button', kind: 'reply_button', buttonText: 'Кнопка' },
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
                    data: { label: 'Message Button', kind: 'message_button', buttonText: 'Кнопка' },
                };
            }

            if (templateKey === 'reply_button') {
                newNode = {
                    id: generateId('reply_button'),
                    type: 'reply_button',
                    position,
                    data: { label: 'Reply Button', kind: 'reply_button', buttonText: 'Кнопка' },
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
                    data: { label: 'Проверка', kind: 'condition', conditionText: '' },
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
                    },
                    eds
                )
            );
            if (newNode.data.kind !== 'button_row' && newNode.data.kind !== 'reply_clear') {
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
                    if (kind === 'message_button' || kind === 'reply_button') {
                        return { ...node, data: { ...node.data, buttonText: editorValues.buttonText } };
                    }
                    if (kind === 'timer') {
                        const parsed = Number(editorValues.timerSeconds);
                        const seconds = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
                        return { ...node, data: { ...node.data, timerSeconds: seconds } };
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
                        const minValue =
                            editorValues.conditionMinLength.trim() === ''
                                ? undefined
                                : Number(editorValues.conditionMinLength);
                        const maxValue =
                            editorValues.conditionMaxLength.trim() === ''
                                ? undefined
                                : Number(editorValues.conditionMaxLength);
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                conditionText: editorValues.conditionText,
                                conditionHasText: editorValues.conditionHasText,
                                conditionHasNumber: editorValues.conditionHasNumber,
                                conditionHasPhoto: editorValues.conditionHasPhoto,
                                conditionHasVideo: editorValues.conditionHasVideo,
                                conditionHasAudio: editorValues.conditionHasAudio,
                                conditionHasLocation: editorValues.conditionHasLocation,
                                conditionMinLength: Number.isFinite(minValue) ? Math.max(0, minValue) : undefined,
                                conditionMaxLength: Number.isFinite(maxValue) ? Math.max(0, maxValue) : undefined,
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
    }, [closeEditor, editorNodeId, editorValues, nodes, setNodes]);

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
                        target.data.kind === 'document'
                    ) {
                        return true;
                    }
                    if (target.data.kind === 'timer') {
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
                    node.data.kind === 'webhook' ||
                    node.data.kind === 'condition' ||
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
                        node.data.kind === 'timer'
                );
            }
            if (sourceKind === 'webhook') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'condition' ||
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
                        node.data.kind === 'document'
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
            { key: 'image', label: 'Изображения', description: 'Один или больше файлов' },
            { key: 'video', label: 'Видео', description: 'Видео файлы' },
            { key: 'audio', label: 'Аудио', description: 'Аудио файлы' },
            { key: 'document', label: 'Документ', description: 'Файлы документов' },
            { key: 'webhook', label: 'Вебхук', description: 'Сообщение пользователя' },
            { key: 'condition', label: 'Проверка', description: 'Сравнить текст' },
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
                    item.key === 'timer'
            );
        }
        if (sourceKind === 'webhook') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'condition' ||
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
                    item.key === 'document'
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
            { key: 'image', label: 'Изображения', description: 'Один или больше файлов', action: handleAddImageNode },
            { key: 'video', label: 'Видео', description: 'Видео файлы', action: handleAddVideoNode },
            { key: 'audio', label: 'Аудио', description: 'Аудио файлы', action: handleAddAudioNode },
            { key: 'document', label: 'Документ', description: 'Файлы документов', action: handleAddDocumentNode },
            { key: 'webhook', label: 'Вебхук', description: 'Сообщение пользователя', action: handleAddWebhookNode },
            { key: 'condition', label: 'Проверка', description: 'Сравнить текст', action: handleAddConditionNode },
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
            handleAddImageNode,
            handleAddVideoNode,
            handleAddAudioNode,
            handleAddDocumentNode,
            handleAddWebhookNode,
            handleAddConditionNode,
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
