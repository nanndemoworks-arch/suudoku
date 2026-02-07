"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const N = 9, SIZE = 81;
const range = (n) => Array.from({ length: n }, (_, i) => i);
const idx = (r, c) => r * N + c;
const rowOf = (i) => Math.floor(i / N);
const colOf = (i) => i % N;
const clone = (b) => b.slice();
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

function candidatesFor(board, i) {
    if (board[i] !== 0) return [];
    const r = rowOf(i), c = colOf(i);
    const br = Math.floor(r / 3) * 3, bc = (c / 3 | 0) * 3;
    const used = new Set();
    for (let k = 0; k < N; k++) { used.add(board[idx(r, k)]); used.add(board[idx(k, c)]); }
    for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) used.add(board[idx(rr, cc)]);
    const cand = []; for (let n = 1; n <= 9; n++) if (!used.has(n)) cand.push(n);
    return cand;
}
function isSafe(board, i, n) {
    const r = rowOf(i), c = colOf(i);
    for (let k = 0; k < N; k++) if (board[idx(r, k)] === n || board[idx(k, c)] === n) return false;
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) if (board[idx(rr, cc)] === n) return false;
    return true;
}
function findMRVIndex(board) {
    let best = -1, bestCount = 10;
    for (let i = 0; i < SIZE; i++) if (board[i] === 0) {
        const cnt = candidatesFor(board, i).length;
        if (cnt < bestCount) { best = i; bestCount = cnt; if (cnt === 1) break; }
    }
    return best;
}
function solveBoard(b0) {
    const b = clone(b0); let steps = 0, backtracks = 0;
    const stack = [];
    const step = () => {
        const first = findMRVIndex(b);
        if (first === -1) return true;
        const options = shuffle(candidatesFor(b, first));
        stack.push({ i: first, options, tried: [] });
        while (stack.length) {
            const top = stack[stack.length - 1]; steps++;
            if (!top.options.length) { backtracks++; b[top.i] = 0; stack.pop(); if (!stack.length) return false; continue; }
            const n = top.options.pop(); top.tried.push(n);
            if (isSafe(b, top.i, n)) {
                b[top.i] = n;
                const nextI = findMRVIndex(b);
                if (nextI === -1) return true;
                const nextOptions = shuffle(candidatesFor(b, nextI));
                stack.push({ i: nextI, options: nextOptions, tried: [] });
            }
        }
        return false;
    };
    const ok = step();
    return { solved: ok, board: b, steps, backtracks };
}
function countSolutions(b0, limit = 2) {
    const b = clone(b0); let count = 0;
    const dfs = () => {
        if (count >= limit) return true;
        let i = -1, min = 10, opts = [];
        for (let k = 0; k < SIZE; k++) if (b[k] === 0) {
            const c = candidatesFor(b, k);
            if (c.length < min) { min = c.length; i = k; opts = c; if (min === 1) break; }
        }
        if (i === -1) { count++; return count >= limit; }
        for (let t = 0; t < opts.length; t++) { const n = opts[t]; if (isSafe(b, i, n)) { b[i] = n; if (dfs()) return true; b[i] = 0; } }
        return false;
    };
    dfs(); return count;
}
function generateSolvedBoard() {
    const b = Array(SIZE).fill(0);
    for (let box = 0; box < 9; box += 4) {
        const nums = shuffle(range(9).map(n => n + 1));
        let t = 0; const br = Math.floor(box / 3) * 3, bc = (box % 3) * 3;
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) b[idx(br + r, bc + c)] = nums[t++];
    }
    return solveBoard(b).board;
}
function rateDifficulty(puzzle) {
    const { steps, backtracks } = solveBoard(puzzle);
    return steps + backtracks * 50;
}
function targetForLevel(level) {
    const empties = Math.min(60, Math.max(26, 24 + Math.round(level * 2)));
    const diff = Math.min(20000, Math.round(1000 + Math.pow(1.25, Math.min(level, 40)) * 200));
    return { emptiesTarget: empties, diffTarget: diff };
}
function generatePuzzle(level, maxAttempts = 8000) {
    const solution = generateSolvedBoard();
    let puzzle = solution.slice();
    const { emptiesTarget } = targetForLevel(level);
    const cells = shuffle(range(SIZE));
    let attempts = 0;
    for (const i of cells) {
        if (attempts++ > maxAttempts) break;
        if (puzzle[i] === 0) continue;
        const j = idx(8 - rowOf(i), 8 - colOf(i));
        const bi = puzzle[i], bj = puzzle[j];
        puzzle[i] = 0; if (j !== i) puzzle[j] = 0;
        const uniq = countSolutions(puzzle, 2) === 1;
        if (!uniq) { puzzle[i] = bi; if (j !== i) puzzle[j] = bj; continue; }
        if (puzzle.filter(x => x === 0).length >= emptiesTarget) break;
    }
    while (puzzle.filter(x => x === 0).length < emptiesTarget && attempts++ < maxAttempts) {
        const i = Math.floor(Math.random() * SIZE);
        if (puzzle[i] === 0) continue;
        const backup = puzzle[i]; puzzle[i] = 0;
        if (countSolutions(puzzle, 2) !== 1) puzzle[i] = backup;
    }
    const difficulty = rateDifficulty(puzzle);
    return { puzzle, solution, difficulty, targets: targetForLevel(level) };
}

function fmtTime(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(secs % 60)).padStart(2, '0');
    return (h !== "00" ? h + ":" : "") + m + ":" + s;
}

function useTimer(running) {
    const [elapsed, setElapsed] = useState(0);
    const last = useRef(null);
    useEffect(() => {
        let id = null;
        const tick = (ts) => { if (last.current == null) last.current = ts; setElapsed(p => p + (ts - last.current) / 1000); last.current = ts; id = requestAnimationFrame(tick); };
        if (running) id = requestAnimationFrame(tick);
        return () => { if (id) cancelAnimationFrame(id); last.current = null; };
    }, [running]);
    return { elapsed, setElapsed };
}

export default function SudokuApp() {
    const [level, setLevel] = useState(3);
    const [cells, setCells] = useState([]);
    const [solution, setSolution] = useState([]);
    const [selected, setSelected] = useState(null);
    const [notesMode, setNotesMode] = useState(false);
    const [autoNotes, setAutoNotes] = useState(true);
    const [showConflicts, setShowConflicts] = useState(true);
    const [mistakes, setMistakes] = useState(0);
    const [difficulty, setDifficulty] = useState(0);
    const [targets, setTargets] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [paused, setPaused] = useState(false);
    const [stats, setStats] = useState({ totalSolved: 0, bestTimeSec: null, streak: 0, lastSolvedDate: null });
    const [puzzleId, setPuzzleId] = useState("");
    const [activeTab, setActiveTab] = useState("how");

    const { elapsed, setElapsed } = useTimer(!paused && cells.length > 0 && !isSolved(cells, solution));
    function isSolved(cs, sol) { return cs.length === SIZE && cs.every((c, i) => c.value === sol[i]); }

    useEffect(() => {
        const raw = localStorage.getItem("sudoku-trainer-state-v2");
        if (raw) {
            try {
                const p = JSON.parse(raw);
                setCells(p.cells.map(c => ({ value: c.value, given: c.given, notes: new Set(c.notes) })));
                setSolution(p.solution); setLevel(p.level); setElapsed(p.elapsed || 0);
                setDifficulty(p.difficulty || 0); setPuzzleId(p.puzzleId || ""); setStats(p.stats || stats);
            } catch { }
        } else { newGame(level); }
    }, []);

    useEffect(() => {
        if (cells.length) {
            const p = {
                cells: cells.map(c => ({ value: c.value, given: c.given, notes: [...c.notes] })),
                solution, level, elapsed: Math.floor(elapsed), difficulty, puzzleId, stats
            };
            localStorage.setItem("sudoku-trainer-state-v2", JSON.stringify(p));
        }
    }, [cells, solution, level, elapsed, difficulty, puzzleId, stats]);

    function autoFillNotes(cs = cells, sol = solution) {
        const next = cs.map((cell, i) => {
            if (cell.value !== 0) return cell;
            const cand = candidatesFor(cs.map(x => x.value), i);
            return { ...cell, notes: new Set(cand) };
        });
        setCells(next);
    }
    function newGame(lvl = level) {
        setGenerating(true);
        setTimeout(() => {
            const g = generatePuzzle(lvl);
            const cs = g.puzzle.map(v => ({ value: v, given: v !== 0, notes: new Set() }));
            setCells(cs); setSolution(g.solution); setSelected(null); setMistakes(0);
            setDifficulty(g.difficulty); setTargets(g.targets); setPaused(false); setElapsed(0);
            setPuzzleId(g.solution.join("")); setGenerating(false);
            if (autoNotes) autoFillNotes(cs, g.solution);
        }, 10);
    }
    function peersOf(i) {
        const r = rowOf(i), c = colOf(i);
        const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        const s = new Set();
        for (let k = 0; k < N; k++) { s.add(idx(r, k)); s.add(idx(k, c)); }
        for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) s.add(idx(rr, cc));
        s.delete(i); return Array.from(s);
    }
    function setValue(i, v) {
        setCells(prev => {
            const next = prev.slice(); const cell = { ...next[i] };
            if (cell.given) return prev;
            const prevVal = cell.value;
            if (notesMode) {
                const nset = new Set(cell.notes);
                if (v >= 1 && v <= 9) { if (nset.has(v)) nset.delete(v); else nset.add(v); }
                cell.notes = nset; next[i] = cell; return next;
            }
            cell.value = v; cell.notes = new Set(); next[i] = cell;
            if (showConflicts && v !== 0 && v !== solution[i]) setMistakes(m => m + 1);
            if (autoNotes) {
                const peers = peersOf(i);
                for (const p of peers) if (next[p].value === 0) { const nset = new Set(next[p].notes); nset.delete(v); next[p] = { ...next[p], notes: nset }; }
            }
            if (v !== prevVal) {
                const done = next.every((c, k) => c.value !== 0 && c.value === solution[k]);
                if (done) onSolved();
            }
            return next;
        });
    }
    function clearCell(i) { setValue(i, 0); }
    function hint() {
        const empties = range(SIZE).filter(i => cells[i].value === 0);
        if (!empties.length) return;
        let pick = empties.find(i => candidatesFor(cells.map(c => c.value), i).length === 1);
        if (pick == null) pick = empties[Math.floor(Math.random() * empties.length)];
        setValue(pick, solution[pick]);
    }
    function checkBoard() {
        const wrong = range(SIZE).filter(i => cells[i].value !== 0 && cells[i].value !== solution[i]);
        if (wrong.length) setMistakes(m => m + wrong.length);
        return wrong.length;
    }
    function onSolved() {
        setPaused(true);
        setStats(prev => {
            const today = new Date().toISOString().slice(0, 10);
            const last = prev.lastSolvedDate;
            const inc = !last || new Date(today) > new Date(last);
            const streak = inc ? (prev.streak + 1) : prev.streak;
            const best = prev.bestTimeSec == null ? Math.floor(elapsed) : Math.min(prev.bestTimeSec, Math.floor(elapsed));
            return { totalSolved: prev.totalSolved + 1, bestTimeSec: best, streak, lastSolvedDate: today };
        });
    }

    useEffect(() => {
        function onKey(e) {
            if (selected == null) return;
            if (e.key >= '1' && e.key <= '9') setValue(selected, parseInt(e.key, 10));
            else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') clearCell(selected);
            else if (e.key === 'ArrowUp') setSelected(s => s == null ? null : Math.max(0, s - 9));
            else if (e.key === 'ArrowDown') setSelected(s => s == null ? null : Math.min(80, s + 9));
            else if (e.key === 'ArrowLeft') setSelected(s => s == null ? null : Math.max(0, s - 1));
            else if (e.key === 'ArrowRight') setSelected(s => s == null ? null : Math.min(80, s + 1));
            else if (e.key.toLowerCase && e.key.toLowerCase() === 'n') setNotesMode(n => !n);
            else if (e.key.toLowerCase && e.key.toLowerCase() === 'h') hint();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected, cells, solution, notesMode]);

    const sameVal = useMemo(() => {
        if (selected == null) return new Set();
        const v = cells[selected] && cells[selected].value; if (!v) return new Set();
        const s = new Set(); for (let i = 0; i < SIZE; i++) if (cells[i].value === v) s.add(i); return s;
    }, [selected, cells]);

    const progress = useMemo(() => {
        if (!cells.length) return 0;
        const filled = cells.filter(c => c.value !== 0).length;
        return Math.round((filled / SIZE) * 100);
    }, [cells]);

    return (
        <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-6 h-6 rounded-full bg-black text-white grid place-items-center text-xs">🧠</div>
                <h1 className="text-xl sm:text-2xl font-bold">Sudoku Trainer — 無限レベル</h1>
                <span className="px-2 py-0.5 text-xs rounded-full border bg-white/60">脳トレ・ソロ専用</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 rounded-2xl border bg-white shadow-sm">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div className="text-base font-semibold">ボード</div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 text-xs rounded-full border bg-white/60">進捗 {progress}%</span>
                            <span className="px-2 py-0.5 text-xs rounded-full border bg-white/60">⏱ {fmtTime(elapsed)}</span>
                            <span className="px-2 py-0.5 text-xs rounded-full border bg-white/60">誤り {mistakes}</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                            <div className="mx-auto">
                                <div className="grid grid-cols-9 grid-rows-9 select-none">
                                    {range(SIZE).map((i) => {
                                        const r = rowOf(i), c = colOf(i);
                                        const cell = cells[i] || { value: 0, given: false, notes: new Set() };
                                        const isSel = selected === i;
                                        const highlight = sameVal.has(i);
                                        const wrong = showConflicts && cell.value !== 0 && solution[i] !== cell.value && !cell.given;
                                        const classes = [
                                            "w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center border text-base sm:text-lg md:text-xl",
                                            (c % 3 === 0 ? "border-l-2" : ""),
                                            (r % 3 === 0 ? "border-t-2" : ""),
                                            (c === 8 ? "border-r-2" : ""),
                                            (r === 8 ? "border-b-2" : ""),
                                            (isSel ? "bg-amber-100" : (highlight ? "bg-amber-50" : "bg-white")),
                                            (cell.given ? "font-bold" : ""),
                                            (wrong ? "text-red-600" : ""),
                                        ].join(" ");
                                        return (
                                            <div key={i} className={classes} onClick={() => setSelected(i)}>
                                                {cell.value !== 0 ? (
                                                    <span>{cell.value}</span>
                                                ) : (
                                                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1 text-[9px] sm:text-[10px] leading-none text-neutral-500">
                                                        {range(9).map((n) => (
                                                            <div key={n} className="flex items-center justify-center">
                                                                {cell.notes && cell.notes.has(n + 1) ? (n + 1) : ""}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="rounded-2xl border bg-white shadow-sm">
                                    <div className="p-4 border-b"><div className="text-base font-semibold">入力</div></div>
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-5 gap-2">
                                            {range(9).map((n) => (
                                                <button key={n} className="px-3 py-2 rounded-lg bg-neutral-200 hover:bg-neutral-300" onClick={() => selected != null && setValue(selected, n + 1)}>{n + 1}</button>
                                            ))}
                                            <button className="border px-3 py-2 rounded-lg hover:bg-neutral-50" onClick={() => selected != null && clearCell(selected)}>消去</button>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={notesMode} onChange={(e) => setNotesMode(e.target.checked)} />メモ
                                            </label>
                                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={autoNotes} onChange={(e) => { setAutoNotes(e.target.checked); if (e.target.checked) autoFillNotes(); }} />候補オート
                                            </label>
                                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={showConflicts} onChange={(e) => setShowConflicts(e.target.checked)} />誤りチェック
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button className="px-3 py-2 rounded-lg bg-black text-white hover:bg-neutral-800" onClick={hint}>💡 ヒント</button>
                                            <button className="px-3 py-2 rounded-lg bg-neutral-200 hover:bg-neutral-300" onClick={() => setPaused(p => !p)}>{paused ? "再開" : "一時停止"}</button>
                                            <button className="border px-3 py-2 rounded-lg hover:bg-neutral-50" onClick={() => { const w = checkBoard(); alert(w ? `誤り ${w} 件を検出しました` : "現時点で誤りはありません"); }}>チェック</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border bg-white shadow-sm">
                                    <div className="p-4 border-b"><div className="text-base font-semibold">レベル</div></div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <button className="border px-3 py-2 rounded-lg hover:bg-neutral-50" onClick={() => setLevel(l => Math.max(1, l - 1))}>−</button>
                                            <input className="w-20 border rounded-lg p-2" type="number" value={level} onChange={(e) => setLevel(Math.max(1, Number(e.target.value) || 1))} />
                                            <button className="border px-3 py-2 rounded-lg hover:bg-neutral-50" onClick={() => setLevel(l => l + 1)}>＋</button>
                                            <button className="px-3 py-2 rounded-lg bg-black text-white hover:bg-neutral-800" onClick={() => newGame(level)} disabled={generating}>{generating ? "生成中..." : "新しい盤面"}</button>
                                        </div>
                                        <div className="text-xs text-neutral-600">目標：空マス {targets?.emptiesTarget ?? "-"}、難易度 {targets?.diffTarget ?? "-"}</div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border bg-white shadow-sm">
                                    <div className="p-4 border-b"><div className="text-base font-semibold">統計</div></div>
                                    <div className="p-4 text-sm grid grid-cols-1 gap-2">
                                        <div className="flex justify-between"><span>クリア数:</span> <span className="font-bold">{stats.totalSolved}</span></div>
                                        <div className="flex justify-between"><span>ベスト:</span> <span className="font-bold">{stats.bestTimeSec == null ? "-" : fmtTime(stats.bestTimeSec)}</span></div>
                                        <div className="flex justify-between"><span>連続日数:</span> <span className="font-bold">{stats.streak}</span></div>
                                        <div className="flex justify-between"><span>パズルID:</span> <span className="font-mono text-[10px]">{puzzleId ? (puzzleId.slice(0, 12) + "…") : "-"}</span></div>
                                        <div className="flex gap-2 mt-1">
                                            <button className="flex-1 px-2 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-xs text-center" onClick={() => newGame(level)}>リセット</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white shadow-sm h-fit">
                    <div className="p-4 border-b">
                        <div className="text-base font-semibold">トレーニング</div>
                        <div className="mt-2 flex gap-2 text-xs">
                            <button className={`px-2 py-1 rounded-lg ${activeTab === 'how' ? 'bg-black text-white' : 'bg-neutral-200'}`} onClick={() => setActiveTab('how')}>遊び方</button>
                            <button className={`px-2 py-1 rounded-lg ${activeTab === 'modes' ? 'bg-black text-white' : 'bg-neutral-200'}`} onClick={() => setActiveTab('modes')}>モード</button>
                            <button className={`px-2 py-1 rounded-lg ${activeTab === 'tips' ? 'bg-black text-white' : 'bg-neutral-200'}`} onClick={() => setActiveTab('tips')}>コツ</button>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                        {activeTab === 'how' && (
                            <div className="space-y-2">
                                <p>標準的な 9×9 数独。<strong>レベル</strong>を上げると空マスが増え、探索難度も上がります。</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>セル選択後、数字入力。<em>メモ</em>ONで候補入力。</li>
                                    <li>「候補オート」ONで空マスに自動候補。</li>
                                    <li>ヒントは 1 マス正解を埋めます。</li>
                                </ul>
                            </div>
                        )}
                        {activeTab === 'modes' && (
                            <div className="space-y-2">
                                <p>脳トレの 3 要素：</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>時間管理</strong>：ベスト記録の更新。</li>
                                    <li><strong>正確性</strong>：誤りチェック。</li>
                                    <li><strong>推論</strong>：メモ活用と候補削減。</li>
                                </ul>
                            </div>
                        )}
                        {activeTab === 'tips' && (
                            <div className="space-y-2">
                                <p>初級: シングル／中級: ペア・トリプル／上級: X-Wing 等。難易度は探索ステップ量で近似評価。</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
