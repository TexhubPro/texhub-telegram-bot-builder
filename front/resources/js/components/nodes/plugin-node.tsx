import { useContext, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeData } from '../types';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import { PlusIcon } from '../ui/icons';

const API_BASE = (import.meta.env.VITE_API_BASE ?? 'https://toocars.tj').replace(/\/+$/, '');

export function PluginNode({ data, id, selected }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    const outputs = data.pluginOutputs && data.pluginOutputs.length ? data.pluginOutputs : ['out'];
    const title = data.pluginTitle || data.label || 'Плагин';
    const subtitle = data.pluginSubtitle || data.pluginKind || '';
    const [counterValue, setCounterValue] = useState<number | null>(null);
    const isCounter = data.pluginKind === 'plugin_counter';
    const counterKey = String(data.pluginValues?.key ?? '').trim();

    useEffect(() => {
        if (!isCounter || !counterKey) {
            setCounterValue(null);
            return;
        }
        let isMounted = true;
        const botId = window.localStorage.getItem('botId');
        if (!botId) {
            setCounterValue(null);
            return;
        }
        const fetchValue = () => {
            fetch(`${API_BASE}/bots/${botId}/plugins/counter/${encodeURIComponent(counterKey)}`)
                .then((response) => (response.ok ? response.json() : Promise.reject()))
                .then((payload: { value?: number }) => {
                    if (isMounted) {
                        setCounterValue(typeof payload.value === 'number' ? payload.value : null);
                    }
                })
                .catch(() => {
                    if (isMounted) {
                        setCounterValue(null);
                    }
                });
        };
        fetchValue();
        const timer = window.setInterval(fetchValue, 3000);
        return () => {
            isMounted = false;
            window.clearInterval(timer);
        };
    }, [isCounter, counterKey]);

    return (
        <div
            className="group relative rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
            style={{ backgroundColor: data.pluginColor ?? data.color ?? '#FFFFFF' }}
        >
            {!data.pluginNoInput ? (
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{ width: 12, height: 12, borderWidth: 2, background: '#0f172a' }}
                />
            ) : null}
            <NodeActionButtons nodeId={id} isVisible={selected} canEdit />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Интеграция</div>
                <div className="text-sm font-semibold">{title}</div>
                {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
                {isCounter && counterKey ? (
                    <div className="text-xs text-slate-600">Сейчас: {counterValue ?? '—'}</div>
                ) : null}
            </div>
            {outputs.length === 1 ? (
                <Handle
                    type="source"
                    id={outputs[0]}
                    position={Position.Right}
                    style={{ width: 12, height: 12, borderWidth: 2, background: '#0f172a' }}
                />
            ) : (
                outputs.map((output, index) => {
                    const top = outputs.length === 2 ? (index === 0 ? '35%' : '65%') : `${25 + index * 20}%`;
                    return (
                        <Handle
                            key={output}
                            type="source"
                            id={output}
                            position={Position.Right}
                            style={{ width: 12, height: 12, borderWidth: 2, background: '#0f172a', top }}
                        />
                    );
                })
            )}
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-800"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}
