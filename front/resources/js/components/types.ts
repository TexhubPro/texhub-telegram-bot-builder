export type NodeKind =
    | 'bot'
    | 'command'
    | 'message'
    | 'message_button'
    | 'reply_button'
    | 'reply_clear'
    | 'timer'
    | 'video'
    | 'audio'
    | 'document'
    | 'webhook'
    | 'condition'
    | 'button_row'
    | 'image'
    | 'node';

export type NodeData = {
    label: string;
    color?: string;
    kind?: NodeKind;
    botName?: string;
    botToken?: string;
    botStatus?: string;
    commandText?: string;
    messageText?: string;
    buttonText?: string;
    imageUrls?: string[];
    videoUrls?: string[];
    audioUrls?: string[];
    documentUrls?: string[];
    timerSeconds?: number;
    conditionText?: string;
    canAddChild?: boolean;
};

export type Bot = {
    id: string;
    name: string;
    token?: string | null;
    status: string;
    flow: { nodes: import('reactflow').Node<NodeData>[]; edges: import('reactflow').Edge[] };
};

export type ContextMenu =
    | { kind: 'node'; id: string; x: number; y: number }
    | { kind: 'add-edge'; id: string; x: number; y: number }
    | { kind: 'edge'; id: string; x: number; y: number };
