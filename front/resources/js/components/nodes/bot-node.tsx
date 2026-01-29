import { Button } from '@heroui/react';
import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { BotActionsContext } from './bot-actions-context';
import type { NodeData } from '../types';
import { PlayIcon, PlusIcon, StopIcon } from '../ui/icons';
import { maskToken } from '../utils';

export function BotNode({ data, id }: NodeProps<NodeData>) {
    const { onStart, onStop } = useContext(BotActionsContext);
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div className="relative rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.2)]">
            <div className="flex min-w-[180px] items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Telegram Bot</div>
                    <div className="text-sm font-semibold">{data.botName ?? data.label}</div>
                    <div className="text-xs text-emerald-700">{maskToken(data.botToken)}</div>
                    <div className="text-xs text-emerald-700">Статус: {data.botStatus ?? 'stopped'}</div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button isIconOnly size="sm" variant="solid" color="success" onPress={onStart} aria-label="Запустить">
                        <PlayIcon />
                    </Button>
                    <Button isIconOnly size="sm" variant="solid" color="danger" onPress={onStop} aria-label="Остановить">
                        <StopIcon />
                    </Button>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 14, height: 14, borderWidth: 2, background: '#047857' }}
            />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-500 shadow-sm transition hover:text-emerald-700"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}
