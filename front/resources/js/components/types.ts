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
    | 'delete_message'
    | 'edit_message'
    | 'chat'
    | 'status_set'
    | 'status_get'
    | 'task'
    | 'broadcast'
    | 'subscription'
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
    buttonAction?: 'callback' | 'url' | 'web_app' | 'copy';
    buttonUrl?: string;
    buttonWebAppUrl?: string;
    buttonCopyText?: string;
    replyAction?: 'text' | 'web_app';
    replyWebAppUrl?: string;
    imageUrls?: string[];
    videoUrls?: string[];
    audioUrls?: string[];
    documentUrls?: string[];
    editMessageText?: string;
    chatId?: number;
    chatTitle?: string;
    subscriptionChatId?: number;
    subscriptionChatTitle?: string;
    statusValue?: string;
    taskScheduleType?: string;
    taskIntervalMinutes?: number;
    taskDailyTime?: string;
    taskRunAt?: string;
    timerSeconds?: number;
    conditionText?: string;
    conditionType?: string;
    conditionLengthOp?: string;
    conditionLengthValue?: number;
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
    | { kind: 'add-edge'; id: string; x: number; y: number; sourceHandle?: string }
    | { kind: 'edge'; id: string; x: number; y: number };
