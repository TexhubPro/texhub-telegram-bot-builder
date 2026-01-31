import { Button } from '@heroui/react';
import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { BotActionsContext } from './bot-actions-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlayIcon, PlusIcon, StopIcon } from '../ui/icons';
import { maskToken } from '../utils';

export function BotNode({ data, id, selected }: NodeProps<NodeData>) {
    const { onStart, onStop } = useContext(BotActionsContext);
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    const status = data.botStatus ?? 'stopped';
    const isRunning = status == 'running';
    return (
        <div className="group relative rounded-xl border-2 border-blue-500 bg-white p-3 font-sans text-white">
            <NodeActionButtons nodeId={id} isVisible={selected} canEdit canDuplicate={false} />
            <div className="flex w-fit items-center justify-between gap-3">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-brand-telegram size-10 rounded-lg bg-blue-500 p-1"
                >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
                </svg>
                <div>
                    <div className="text-sm leading-4 font-semibold text-slate-900">{data.botName ?? data.label}</div>
                    {/* <div className="text-sm">{maskToken(data.botToken)}</div> */}
                    <div className="text-[10px] text-slate-500">Статус: {data.botStatus ?? 'stopped'}</div>
                </div>
                <div className="flex gap-2">
                    {isRunning ? (
                        <Button isIconOnly size="sm" variant="solid" color="danger" onPress={onStop} aria-label="??????????">
                            <StopIcon />
                        </Button>
                    ) : (
                        <Button isIconOnly size="sm" variant="solid" color="success" onPress={onStart} aria-label="?????????">
                            <PlayIcon />
                        </Button>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Right} style={{ width: 14, height: 14, borderWidth: 2, background: '#047857' }} />
        </div>
    );
}

