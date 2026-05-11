import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────
// 0. Global Styles
// ─────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');

    html {
      touch-action: manipulation;
      -webkit-text-size-adjust: 100%;
    }

    body {
      font-family: 'Comic Neue', cursive;
      background: linear-gradient(160deg, #7dd3fc 0%, #38bdf8 50%, #0284c7 100%);
      min-height: 100dvh;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-user-select: none;
      user-select: none;
      margin: 0;
    }

    /* ── 按鈕按壓效果 ── */
    .btn-press {
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn-press:active {
      transform: translateY(3px);
    }

    /* ── 鍵盤按鍵 ── */
    .key-btn {
      transition: transform 0.08s, border-bottom-width 0.08s;
    }
    .key-btn:active {
      transform: translateY(2px);
      border-bottom-width: 1px !important;
    }

    /* ── 錯誤震動 ── */
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      40%      { transform: translateX(8px); }
      60%      { transform: translateX(-6px); }
      80%      { transform: translateX(6px); }
    }
    .shake { animation: shake 0.4s; }

    /* ── 結果跳動 ── */
    @keyframes bounceIcon {
      from { transform: translateY(0); }
      to   { transform: translateY(-10px); }
    }
    .bounce-icon { animation: bounceIcon 0.6s ease-in-out infinite alternate; }

    /* ── overlay 淡入 ── */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .overlay-bg { animation: fadeIn 0.2s; }

    /* ── sheet 滑上 ── */
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .sheet-slide { animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1); }
  `}</style>
);

// ─────────────────────────────────────────────
// 1. 遊戲資料
// ─────────────────────────────────────────────
const LEVELS_SOURCE = [
  { id:1, sym:"🍀", clue:"I have no color. I have no shape. You drink me when you are thirsty.",  answer:"WATER",    color:"#60a5fa", shadow:"#1d4ed8", loc:"Sunken Plaza (下凹式庭園)",     locNum:"地圖編號【4】",  tip:"捷運站內的噴水牆附近！",       icon:"💧" },
  { id:2, sym:"🍄", clue:"I have two wings and two legs. I lay eggs. I can sing and fly.",          answer:"BIRD",     color:"#4ade80", shadow:"#15803d", loc:"Ecological Pond (A1生態池)",    locNum:"地圖編號【9】",  tip:"大池塘邊的賞鳥平台。",         icon:"🦆" },
  { id:3, sym:"🐾", clue:"You cannot see me, but you can hear me. You can dance with me.",          answer:"MUSIC",    color:"#a78bfa", shadow:"#6d28d9", loc:"Amphitheater (露天音樂台)",     locNum:"地圖編號【12】", tip:"公園中心的大型表演舞台。",     icon:"🎵" },
  { id:4, sym:"🍁", clue:"I lived a long time ago. I am very big and scary. ROAR!",                 answer:"DINOSAUR", color:"#fb923c", shadow:"#c2410c", loc:"Playground (恐龍滑梯)",         locNum:"地圖編號【7】",  tip:"兒童遊戲場那隻超大的恐龍！",   icon:"🦖" },
  { id:5, sym:"🌲", clue:"I am made of stone. I stand forever. I never move or speak.",             answer:"STATUE",   color:"#fbbf24", shadow:"#92400e", loc:"Guan Yin Statue (觀音像)",     locNum:"地圖編號【1】",  tip:"竹林附近的石雕像。",           icon:"🗿" },
  { id:6, sym:"🐚", clue:"I smell good. I have many colors. Bees love me.",                         answer:"FLOWER",   color:"#f472b6", shadow:"#9d174d", loc:"Pavilion 4 (4號涼亭)",         locNum:"地圖編號【10】", tip:"這裡開滿了漂亮的花朵。",       icon:"🌺" },
  { id:7, sym:"🧭", clue:"I am a number. I am 1 plus 1. How many eyes do you have?",                answer:"TWO",      color:"#f87171", shadow:"#991b1b", loc:"MRT Exit 2 (捷運2號出口)",     locNum:"地圖編號【3】",  tip:"抬頭找捷運出口的數字標示。",   icon:"2️⃣" },
  { id:8, sym:"🪵", clue:"I am a shoe with wheels. Put me on to go fast.",                          answer:"SKATE",    color:"#34d399", shadow:"#065f46", loc:"Skating Rink (溜冰場)",         locNum:"地圖編號【6】",  tip:"找有人在練習直排輪的大圓圈。", icon:"⛸️" },
  { id:9, sym:"🍎", clue:"I am round. I can bounce. You kick me in a game.",                        answer:"BALL",     color:"#818cf8", shadow:"#3730a3", loc:"Basketball Court (籃球場)",     locNum:"地圖編號【8】",  tip:"跟著拍球聲找有籃框的地方。",   icon:"🏀" },
];

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────
// 2. 子元件
// ─────────────────────────────────────────────

/** 字母格子列 */
function SlotsRow({ input, shake }) {
  const len = input.length;
  return (
    <div
      className={shake ? 'shake' : ''}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 5,
        width: '100%',
        marginBottom: 16,
      }}
    >
      {input.map((ch, i) => (
        <div
          key={i}
          style={{
            // clamp：最小34px，理想 = 85vw÷字母數，最大52px
            width: `clamp(34px, calc(85vw / ${len}), 52px)`,
            height: 'clamp(44px, 13vw, 60px)',
            background: '#fff',
            borderRadius: 10,
            borderBottom: ch ? '4px solid #f97316' : '4px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(18px, 6vw, 28px)',
            fontWeight: 700,
            color: '#f97316',
            transition: 'border-color 0.15s',
          }}
        >
          {ch}
        </div>
      ))}
    </div>
  );
}

/** 虛擬鍵盤 */
function VirtualKeyboard({ onKey, onSubmit }) {
  const keyStyle = {
    flex: 1,
    height: 'clamp(38px, 9vw, 46px)',
    minWidth: 0,
    border: 'none',
    borderRadius: 7,
    background: '#fff',
    borderBottom: '3px solid #9ca3af',
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: 'clamp(11px, 3.2vw, 15px)',
    cursor: 'pointer',
    touchAction: 'manipulation',
  };

  return (
    <div style={{
      background: '#d1d5db',
      padding: '10px 6px',
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
      borderRadius: '20px 20px 0 0',
      flexShrink: 0,
      width: '100%',
    }}>
      {KB_ROWS.map((row, ri) => (
        <div key={ri} style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:5 }}>
          {row.map(k => (
            <button key={k} className="key-btn" style={keyStyle} onClick={() => onKey(k)}>
              {k}
            </button>
          ))}
          {ri === 2 && (
            <button
              className="key-btn"
              style={{ ...keyStyle, flex:1.5, background:'#f87171', color:'#fff', borderColor:'#dc2626', minWidth:40 }}
              onClick={() => onKey('BACKSPACE')}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onSubmit}
        style={{
          width: '100%',
          marginTop: 6,
          height: 'clamp(44px, 12vw, 52px)',
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          borderBottom: '4px solid #166534',
          borderRadius: 14,
          fontFamily: 'inherit',
          fontWeight: 700,
          fontSize: 'clamp(14px, 4vw, 18px)',
          cursor: 'pointer',
          touchAction: 'manipulation',
          letterSpacing: 0.5,
        }}
        className="key-btn"
      >
        ✅ CHECK ANSWER
      </button>
    </div>
  );
}

/** 解謎畫面 */
function PuzzleView({ level, input, shake, onKey, onSubmit }) {
  return (
    <>
      {/* 可滾動區域 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '20px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* 謎語卡 */}
        <div style={{
          background: '#fff',
          border: '3px solid #fed7aa',
          borderRadius: 20,
          padding: 20,
          width: '100%',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          <p style={{
            fontSize: 'clamp(15px, 4.5vw, 20px)',
            fontWeight: 700,
            color: '#1c1917',
            lineHeight: 1.5,
            fontStyle: 'italic',
            margin: 0,
          }}>
            "{level.clue}"
          </p>
        </div>

        {/* 字母格 */}
        <SlotsRow input={input} shake={shake} />
      </div>

      {/* 鍵盤固定底部 */}
      <VirtualKeyboard onKey={onKey} onSubmit={onSubmit} />
    </>
  );
}

/** 結果畫面 */
function ResultView({ level, onClose }) {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
    }}>
      {/* 圖示 */}
      <div className="bounce-icon" style={{
        width: 90, height: 90,
        background: '#fff',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48,
        border: '4px solid #facc15',
        boxShadow: '0 6px 0 #a16207',
      }}>
        {level.icon}
      </div>

      {/* 答案 */}
      <div style={{
        fontSize: 'clamp(28px, 9vw, 40px)',
        fontWeight: 700,
        color: '#2563eb',
        letterSpacing: 4,
      }}>
        {level.answer}
      </div>

      {/* 地點卡 */}
      <div style={{
        background: '#dcfce7',
        border: '3px solid #bbf7d0',
        borderRadius: 20,
        padding: 16,
        width: '100%',
        textAlign: 'left',
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#15803d', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>
          📍 GO TO THIS PLACE
        </div>
        <div style={{ fontSize:'clamp(16px,5vw,20px)', fontWeight:700, color:'#1c1917', lineHeight:1.3 }}>
          {level.loc}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'#16a34a', marginTop:4 }}>
          {level.locNum}
        </div>
        <div style={{ marginTop:10, paddingTop:10, borderTop:'2px solid #bbf7d0', fontSize:13, color:'#374151' }}>
          💡 {level.tip}
        </div>
      </div>

      {/* 出發按鈕 */}
      <button
        onClick={onClose}
        className="btn-press"
        style={{
          width: '100%',
          padding: 14,
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          borderBottom: '6px solid #166534',
          borderRadius: 16,
          fontFamily: 'inherit',
          fontWeight: 700,
          fontSize: 'clamp(15px, 4.5vw, 18px)',
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        OK! I'M GOING! 🚀
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. 主程式
// ─────────────────────────────────────────────
export default function App() {
  const [gridLevels, setGridLevels] = useState([]);
  const [solved,     setSolved]     = useState([]);
  const [current,    setCurrent]    = useState(null);   // 當前關卡
  const [input,      setInput]      = useState([]);     // 字母輸入陣列
  const [showResult, setShowResult] = useState(false);
  const [shake,      setShake]      = useState(false);

  // ── 初始化 ──
  useEffect(() => {
    const sg = localStorage.getItem('ah_grid_v3');
    const grid = sg ? JSON.parse(sg) : shuffle(LEVELS_SOURCE);
    if (!sg) localStorage.setItem('ah_grid_v3', JSON.stringify(grid));
    setGridLevels(grid);

    const ss = localStorage.getItem('ah_solved_v3');
    if (ss) setSolved(JSON.parse(ss));
  }, []);

  // ── 開啟關卡 ──
  const openLevel = useCallback((lvl) => {
    setCurrent(lvl);
    setInput(new Array(lvl.answer.length).fill(''));
    setShowResult(solved.includes(lvl.id));
    setShake(false);
  }, [solved]);

  const closeModal = () => setCurrent(null);

  // ── 鍵盤輸入 ──
  const handleKey = useCallback((k) => {
    setInput(prev => {
      const next = [...prev];
      if (k === 'BACKSPACE') {
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i] !== '') { next[i] = ''; break; }
        }
      } else {
        const idx = next.findIndex(v => v === '');
        if (idx !== -1) next[idx] = k;
      }
      return next;
    });
  }, []);

  // ── 提交答案 ──
  const handleSubmit = useCallback(() => {
    if (!current) return;
    if (input.join('') === current.answer) {
      const newSolved = [...solved, current.id];
      setSolved(newSolved);
      localStorage.setItem('ah_solved_v3', JSON.stringify(newSolved));
      setShowResult(true);
    } else {
      // 震動提示
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }, [current, input, solved]);

  // ── Reset ──
  const handleReset = () => {
    if (window.confirm('Reset all progress?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // ─────────────────────────────────────────
  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'transparent' }}>
      <GlobalStyles />

      {/* ── Header ── */}
      <header style={{
        background: '#16a34a',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 0 #166534',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div>
          <h1 style={{ fontWeight:700, fontSize:'clamp(16px,4vw,20px)', color:'#fff', margin:0, letterSpacing:-0.5 }}>
            🌿 ALPHABET HUNTERS
          </h1>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.75)', margin:0 }}>
            DAAN FOREST PARK ADVENTURE
          </p>
        </div>
        <div style={{
          background: '#facc15',
          color: '#a16207',
          fontWeight: 700,
          fontSize: 14,
          padding: '4px 14px',
          borderRadius: 999,
          boxShadow: '0 3px 0 #a16207',
        }}>
          {solved.length}/9
        </div>
      </header>

      {/* ── Grid ── */}
      <main style={{ padding:16, maxWidth:440, margin:'0 auto', width:'100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          width: '100%',
        }}>
          {gridLevels.map(lvl => {
            const isSolved = solved.includes(lvl.id);
            return (
              <button
                key={lvl.id}
                className="btn-press"
                onClick={() => openLevel(lvl)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                  touchAction: 'manipulation',
                  background: isSolved ? lvl.color : 'rgba(255,255,255,0.85)',
                  boxShadow: isSolved
                    ? `0 5px 0 ${lvl.shadow}`
                    : '0 5px 0 rgba(0,0,0,0.15)',
                }}
              >
                {isSolved ? (
                  <>
                    <span style={{ fontSize:'clamp(20px,7vw,30px)', marginBottom:4 }}>{lvl.icon}</span>
                    <span style={{ fontSize:'clamp(7px,2.5vw,10px)', fontWeight:700, color:'#fff', letterSpacing:-0.5 }}>
                      {lvl.answer}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize:'clamp(24px,8vw,36px)', opacity:0.3 }}>{lvl.sym}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          marginTop: 14,
          background: 'rgba(255,255,255,0.35)',
          borderRadius: 20,
          border: '2px solid rgba(255,255,255,0.5)',
          padding: 12,
          textAlign: 'center',
          fontSize: 'clamp(12px,3.5vw,14px)',
          fontWeight: 700,
          color: '#0c4a6e',
        }}>
          🔍 點選格子，找出神秘單字！
        </div>
      </main>

      {/* ── Modal ── */}
      {current && (
        <div
          className="overlay-bg"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            className="sheet-slide"
            style={{
              background: '#FFF8E7',
              width: '100%',
              maxWidth: 440,
              margin: '0 auto',
              borderRadius: '2rem 2rem 0 0',
              /* ✅ 限制高度，內部再各自滾動 */
              maxHeight: '90dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.3)',
            }}
          >
            {/* Sheet Header */}
            <div style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #fed7aa',
              background: '#fff',
              flexShrink: 0,
            }}>
              <div style={{ fontWeight:700, fontSize:18, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
                <span>{current.sym}</span> MISSION
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36, height: 36,
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation',
                }}
              >
                ✕
              </button>
            </div>

            {/* Sheet Body */}
            {showResult ? (
              <ResultView level={current} onClose={closeModal} />
            ) : (
              <PuzzleView
                level={current}
                input={input}
                shake={shake}
                onKey={handleKey}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{ padding:24, textAlign:'center', marginTop:'auto' }}>
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: 2,
            touchAction: 'manipulation',
          }}
        >
          Reset Game Progress
        </button>
      </footer>
    </div>
  );
}