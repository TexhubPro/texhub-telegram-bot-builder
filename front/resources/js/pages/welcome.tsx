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
import { NodeContextMenu } from '../components/nodes/context-menu';
import { GraphActionsContext } from '../components/nodes/graph-actions-context';
import { ImageNode } from '../components/nodes/image-node';
import { MessageButtonNode } from '../components/nodes/message-button-node';
import { MessageNode } from '../components/nodes/message-node';
import { ReplyClearNode } from '../components/nodes/reply-clear-node';
import { ReplyButtonNode } from '../components/nodes/reply-button-node';
import { StyledNode } from '../components/nodes/styled-node';
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

    const handleAddImageNode = useCallback(() => {
        addNodeAndEdit({
            id: generateId('image'),
            type: 'image',
            position: { x: 520, y: 220 },
            data: { label: 'Изображения', kind: 'image', imageUrls: [] },
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

            if (templateKey === 'image') {
                newNode = {
                    id: generateId('image'),
                    type: 'image',
                    position,
                    data: { label: 'Изображения', kind: 'image', imageUrls: [] },
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


    const handleStartBot = useCallback(async () => {
        if (!bot) {
            return;
        }
        const commandNodes = nodes.filter((node) => node.data.kind === 'command');
        const nodesById = new Map(nodes.map((node) => [node.id, node]));
        const connectedCommands = new Set(
            edges
                .filter((edge) => {
                    const target = nodesById.get(edge.target);
                    return target?.data.kind === 'message' || target?.data.kind === 'image';
                })
                .map((edge) => edge.source)
        );
        const disconnected = commandNodes.filter((node) => !connectedCommands.has(node.id));
        if (disconnected.length) {
            window.alert('Подключи каждую команду к следующей ноде (сообщение или изображения).');
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
                    node.data.kind === 'button_row' ||
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
                        node.data.kind === 'image'
                );
            }
            if (sourceKind === 'message_button' || sourceKind === 'reply_button') {
                candidates = candidates.filter(
                    (node) => node.data.kind === 'message' || node.data.kind === 'image'
                );
            }
            if (sourceKind === 'command') {
                candidates = candidates.filter(
                    (node) => node.data.kind === 'message' || node.data.kind === 'image'
                );
            }
            if (sourceKind === 'image') {
                candidates = candidates.filter(
                    (node) =>
                        node.data.kind === 'message_button' ||
                        node.data.kind === 'reply_button' ||
                        node.data.kind === 'button_row' ||
                        node.data.kind === 'reply_clear'
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
            { key: 'image', label: 'Изображения', description: 'Один или больше файлов' },
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
                    item.key === 'image'
            );
        }
        if (sourceKind === 'command') {
            templates = createTemplates.filter((item) => item.key === 'message' || item.key === 'image');
        }
        if (sourceKind === 'message_button' || sourceKind === 'reply_button') {
            templates = createTemplates.filter((item) => item.key === 'message' || item.key === 'image');
        }
        if (sourceKind === 'image') {
            templates = createTemplates.filter(
                (item) =>
                    item.key === 'message_button' ||
                    item.key === 'reply_button' ||
                    item.key === 'button_row' ||
                    item.key === 'reply_clear'
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
            { key: 'image', label: 'Изображения', description: 'Один или больше файлов', action: handleAddImageNode },
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
            handleAddImageNode,
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

                <AppNavbar onSave={handleSaveFlow} onExport={handleExport} onImport={handleImportClick} />
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
