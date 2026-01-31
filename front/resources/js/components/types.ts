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
    | 'record'
    | 'excel_file'
    | 'text_file'
    | 'excel_column'
    | 'file_search'
    | 'subscription'
    | 'webhook'
    | 'condition'
    | 'button_row'
    | 'image'
    | 'plugin'
    | 'node';

export type PluginFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox';

export type PluginFieldOption = {
    value: string;
    label: string;
};

export type PluginField = {
    key: string;
    label: string;
    type: PluginFieldType;
    placeholder?: string;
    options?: PluginFieldOption[];
    required?: boolean;
    default?: string | number | boolean;
};

export type PluginNodeDefinition = {
    kind: string;
    title: string;
    subtitle?: string;
    group?: string;
    color?: string;
    inputs?: PluginField[];
    outputs?: string[];
};

export type PluginDefinition = {
    id: string;
    name: string;
    version?: string;
    description?: string;
    nodes?: PluginNodeDefinition[];
};

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
    recordField?: string;
    fileName?: string;
    columnName?: string;
    searchColumnName?: string;
    searchSource?: string;
    searchValue?: string;
    timerSeconds?: number;
    conditionText?: string;
    conditionType?: string;
    conditionLengthOp?: string;
    conditionLengthValue?: number;
    canAddChild?: boolean;
    pluginId?: string;
    pluginKind?: string;
    pluginTitle?: string;
    pluginSubtitle?: string;
    pluginColor?: string;
    pluginInputs?: PluginField[];
    pluginOutputs?: string[];
    pluginValues?: Record<string, string | number | boolean>;
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
