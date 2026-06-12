// resources/js/pages/Sessions/Form.tsx
// Used for both Create and Edit

import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Clock, ChevronLeft, Calendar, MapPin, BookOpen } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subject {
    id: number;
    code: string;
    name: string;
}

interface SessionData {
    id?: number;
    date: string;
    start_block: number;
    end_block: number;
    room: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    notes: string;
}

interface Props {
    subject: Subject;
    session?: SessionData;
}

// ─── Block definitions ────────────────────────────────────────────────────────
const BLOCKS = [
    { block: 1,  start: '08:00', end: '09:00' },
    { block: 2,  start: '09:00', end: '10:00' },
    { block: 3,  start: '10:00', end: '11:00' },
    { block: 4,  start: '11:00', end: '12:00' },
    { block: 5,  start: '12:00', end: '13:00' },
    { block: 6,  start: '13:00', end: '14:00' },
    { block: 7,  start: '14:00', end: '15:00' },
    { block: 8,  start: '15:00', end: '16:00' },
    { block: 9,  start: '16:00', end: '17:00' },
    { block: 10, start: '17:00', end: '18:00' },
];

function formatTime(t: string): string {
    const [h] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:00 ${ampm}`;
}

// ─── Block picker ─────────────────────────────────────────────────────────────
function BlockPicker({
    startBlock,
    endBlock,
    onChange,
}: {
    startBlock: number;
    endBlock: number;
    onChange: (start: number, end: number) => void;
}) {
    const handleClick = (block: number) => {
        if (startBlock === 0 || endBlock !== 0) {
            // No selection or complete selection — start fresh
            onChange(block, 0);
            return;
        }
        // Second click — set end
        if (block < startBlock) {
            onChange(block, 0);
        } else {
            onChange(startBlock, block);
        }
    };

    const isSelected = (b: number) => startBlock !== 0 && endBlock !== 0 && b >= startBlock && b <= endBlock;
    const isPending  = (b: number) => b === startBlock && endBlock === 0;
    const totalBlocks = endBlock > 0 ? endBlock - startBlock + 1 : 0;

    return (
        <div>
            {/* Hour labels */}
            <div style={{ display: 'flex', marginBottom: 6 }}>
                {BLOCKS.map((b) => (
                    <div key={b.block} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                        {formatTime(b.start)}
                    </div>
                ))}
                <div style={{ width: 36, textAlign: 'right', fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace' }}>
                    6 PM
                </div>
            </div>

            {/* Block cells */}
            <div style={{ display: 'flex', gap: 4 }}>
                {BLOCKS.map((b) => {
                    const sel     = isSelected(b.block);
                    const pend    = isPending(b.block);
                    const isStart = b.block === startBlock && endBlock !== 0;
                    const isEnd   = b.block === endBlock;

                    return (
                        <div
                            key={b.block}
                            onClick={() => handleClick(b.block)}
                            title={`Block ${b.block}: ${formatTime(b.start)} – ${formatTime(b.end)}`}
                            style={{
                                flex: 1,
                                height: 56,
                                borderRadius: isStart ? '9px 0 0 9px' : isEnd ? '0 9px 9px 0' : (sel ? '0' : '9px'),
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                userSelect: 'none',
                                transition: 'all 0.1s',
                                background: sel ? '#111827' : pend ? '#374151' : '#F3F4F6',
                                border: sel || pend ? '2px solid #111827' : '2px solid transparent',
                            }}
                            onMouseEnter={(e) => { if (!sel && !pend) e.currentTarget.style.background = '#E5E7EB'; }}
                            onMouseLeave={(e) => { if (!sel && !pend) e.currentTarget.style.background = '#F3F4F6'; }}
                        >
                            <span style={{ fontSize: 13, fontWeight: 700, color: sel || pend ? '#fff' : '#6B7280' }}>
                                {b.block}
                            </span>
                            <span style={{ fontSize: 8, fontFamily: 'monospace', color: sel || pend ? 'rgba(255,255,255,0.5)' : '#D1D5DB' }}>
                                {b.start.replace(':00', '')}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Status summary */}
            <div style={{
                marginTop: 12,
                padding: '11px 16px',
                borderRadius: 10,
                background: startBlock === 0 ? '#F9FAFB' : endBlock === 0 ? '#FFFBEB' : '#F0FDF4',
                border: `1px solid ${startBlock === 0 ? '#E5E7EB' : endBlock === 0 ? '#FDE68A' : '#BBF7D0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 42,
            }}>
                {startBlock === 0 ? (
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                        👆 Click a block to set the start time
                    </p>
                ) : endBlock === 0 ? (
                    <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
                        Start: <strong>{formatTime(BLOCKS[startBlock - 1].start)}</strong> — now click the end block
                    </p>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Clock size={15} color="#059669" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#065F46' }}>
                                {formatTime(BLOCKS[startBlock - 1].start)} – {formatTime(BLOCKS[endBlock - 1].end)}
                            </span>
                            <span style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 20 }}>
                                {totalBlocks} block{totalBlocks !== 1 ? 's' : ''} · {totalBlocks} hr{totalBlocks !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <button type="button" onClick={() => onChange(0, 0)}
                            style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                            Clear
                        </button>
                    </>
                )}
            </div>

            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, lineHeight: 1.5 }}>
                Click a block to set the start, then click another to set the end. Each block = 1 hour (8:00 AM – 6:00 PM).
            </p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SessionForm({ subject, session }: Props) {
    const isEdit = !!session?.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subjects',   href: '/subjects' },
        { title: subject.code, href: `/subjects/${subject.id}` },
        { title: isEdit ? 'Edit session' : 'New session', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        date:        session?.date        ?? new Date().toISOString().split('T')[0],
        start_block: session?.start_block ?? 0,
        end_block:   session?.end_block   ?? 0,
        room:        session?.room        ?? '',
        status:      session?.status      ?? 'scheduled' as const,
        notes:       session?.notes       ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/subjects/${subject.id}/sessions/${session!.id}`);
        } else {
            post(`/subjects/${subject.id}/sessions`);
        }
    };

    const totalBlocks = data.end_block > 0 ? data.end_block - data.start_block + 1 : 0;
    const canSubmit   = data.start_block > 0 && data.end_block > 0 && !processing;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Session' : 'New Session'} />

            <style>{`
                .sf-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; }
                .sf-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
                .sf-input { font-family: inherit; font-size: 14px; width: 100%; height: 40px; padding: 0 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; color: #111827; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
                .sf-input:focus { border-color: #111827; background: #fff; box-shadow: 0 0 0 3px rgba(17,24,39,0.06); }
                .sf-select { font-family: inherit; font-size: 14px; width: 100%; height: 40px; padding: 0 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; color: #111827; outline: none; cursor: pointer; box-sizing: border-box; }
                .sf-textarea { font-family: inherit; font-size: 14px; width: 100%; padding: 10px 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; color: #111827; outline: none; resize: vertical; min-height: 80px; box-sizing: border-box; }
                .sf-textarea:focus { border-color: #111827; background: #fff; }
                .sf-error { font-size: 11px; color: #DC2626; margin-top: 4px; }
                .sf-btn-primary { font-family: inherit; font-size: 13px; font-weight: 500; height: 38px; padding: 0 20px; background: #111827; color: #fff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
                .sf-btn-primary:hover { opacity: 0.87; }
                .sf-btn-ghost { font-family: inherit; font-size: 13px; font-weight: 500; height: 38px; padding: 0 16px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
                .sf-btn-ghost:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 800, fontFamily: 'inherit' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                    <Link href={`/subjects/${subject.id}`} className="sf-btn-ghost" style={{ padding: '0 10px' }}>
                        <ChevronLeft size={16} />
                    </Link>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={22} color="#7C3AED" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                            {isEdit ? 'Edit session' : 'New session'}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <BookOpen size={12} color="#9CA3AF" />
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                {subject.code} — {subject.name}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Session details */}
                        <div className="sf-card" style={{ padding: 24 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>
                                Session details
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label className="sf-label">Date *</label>
                                    <input type="date" className="sf-input" value={data.date} onChange={(e) => setData('date', e.target.value)} required />
                                    {errors.date && <p className="sf-error">{errors.date}</p>}
                                </div>
                                <div>
                                    <label className="sf-label">Room / Location</label>
                                    <input type="text" className="sf-input" value={data.room} onChange={(e) => setData('room', e.target.value)} placeholder="e.g. Block A, Room 101" />
                                    {errors.room && <p className="sf-error">{errors.room}</p>}
                                </div>
                            </div>
                            <div style={{ maxWidth: 220 }}>
                                <label className="sf-label">Status</label>
                                <select className="sf-select" value={data.status} onChange={(e) => setData('status', e.target.value as any)}>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Block picker */}
                        <div className="sf-card" style={{ padding: 24 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>
                                Time blocks *
                            </p>
                            <BlockPicker
                                startBlock={data.start_block}
                                endBlock={data.end_block}
                                onChange={(start, end) => {
                                    setData('start_block', start);
                                    setData('end_block', end);
                                }}
                            />
                            {errors.start_block && <p className="sf-error" style={{ marginTop: 6 }}>{errors.start_block}</p>}
                            {errors.end_block   && <p className="sf-error">{errors.end_block}</p>}
                        </div>

                        {/* Notes */}
                        <div className="sf-card" style={{ padding: 24 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 16px' }}>
                                Notes (optional)
                            </p>
                            <textarea className="sf-textarea" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Any notes about this session…" />
                        </div>

                        {/* Summary strip */}
                        {data.start_block > 0 && data.end_block > 0 && (
                            <div style={{ padding: '14px 20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Calendar size={14} color="#64748B" />
                                    <span style={{ fontSize: 13, color: '#475569' }}>
                                        {new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div style={{ width: 1, height: 14, background: '#CBD5E1' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Clock size={14} color="#64748B" />
                                    <span style={{ fontSize: 13, color: '#475569' }}>
                                        {BLOCKS[data.start_block - 1].start} – {BLOCKS[data.end_block - 1].end}
                                        <span style={{ color: '#94A3B8', marginLeft: 6 }}>
                                            ({totalBlocks} hr{totalBlocks !== 1 ? 's' : ''})
                                        </span>
                                    </span>
                                </div>
                                {data.room && (
                                    <>
                                        <div style={{ width: 1, height: 14, background: '#CBD5E1' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <MapPin size={14} color="#64748B" />
                                            <span style={{ fontSize: 13, color: '#475569' }}>{data.room}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <Link href={`/subjects/${subject.id}`} className="sf-btn-ghost">Cancel</Link>
                            <button type="submit" disabled={!canSubmit} className="sf-btn-primary"
                                style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
                                {processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create session'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}