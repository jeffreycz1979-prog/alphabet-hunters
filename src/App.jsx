import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────
// 0. Global Styles
// ─────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html { touch-action: manipulation; -webkit-text-size-adjust: 100%; }
    body {
      font-family: 'Comic Neue', cursive;
      background: linear-gradient(160deg, #7dd3fc 0%, #38bdf8 50%, #0284c7 100%);
      min-height: 100dvh;
      overflow-x: hidden; overflow-y: auto;
      -webkit-user-select: none; user-select: none; margin: 0;
    }
    .btn-press { transition: transform 0.1s, box-shadow 0.1s; }
    .btn-press:active { transform: translateY(3px); }
    .key-btn { transition: transform 0.08s, border-bottom-width 0.08s; }
    .key-btn:active { transform: translateY(2px); border-bottom-width: 1px !important; }
    @keyframes shake {
      0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)}
      40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
    }
    .shake { animation: shake 0.4s; }
    @keyframes bounceIcon { from{transform:translateY(0)} to{transform:translateY(-10px)} }
    .bounce-icon { animation: bounceIcon 0.6s ease-in-out infinite alternate; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .overlay-bg { animation: fadeIn 0.2s; }
    @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
    .sheet-slide { animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1); }
    @keyframes popIn {
      0%{transform:scale(0.7);opacity:0} 80%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1}
    }
    .pop-in { animation: popIn 0.25s ease-out forwards; }
    @keyframes lockGlow {
      0%,100%{box-shadow:0 0 0 0 rgba(250,204,21,0.8)} 50%{box-shadow:0 0 0 8px rgba(250,204,21,0)}
    }
    .slot-locked { animation: lockGlow 0.5s ease-out; }
    @keyframes onboardFade {
      from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)}
    }
    .onboard-fade { animation: onboardFade 0.3s ease-out; }
    @keyframes stickerPop {
      0%{transform:scale(0) rotate(-10deg);opacity:0}
      70%{transform:scale(1.2) rotate(3deg)}
      100%{transform:scale(1) rotate(0deg);opacity:1}
    }
    .sticker-pop { animation: stickerPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  `}</style>
);

// ─────────────────────────────────────────────
// 1. 遊戲資料
// ─────────────────────────────────────────────
// 每關對應的字母貼紙 → 拼出 I ❤️ ENGLISH
const LEVEL_STICKER = {
  WATER:    'I',
  DINOSAUR: '❤️',
  MUSIC:    'E',
  BIRD:     'N',
  STATUE:   'G',
  FLOWER:   'L',
  TWO:      'I',
  SKATE:    'S',
  BALL:     'H',
};

const LEVELS_SOURCE = [
  { id:1, sym:"🍀", clue:"I have no color. I have no shape. You drink me when you are thirsty.",  answer:"WATER",    chinese:"水",    color:"#60a5fa", shadow:"#1d4ed8", loc:"Sunken Plaza (下凹式庭園)",     locNum:"地圖編號【4】",  tip:"捷運站內的噴水牆附近！",       icon:"💧" },
  { id:2, sym:"🍄", clue:"I have two wings and two legs. I lay eggs. I can sing and fly.",          answer:"BIRD",     chinese:"鳥",    color:"#4ade80", shadow:"#15803d", loc:"Ecological Pond (A1生態池)",    locNum:"地圖編號【9】",  tip:"大池塘邊的賞鳥平台。",         icon:"🦆" },
  { id:3, sym:"🐾", clue:"You cannot see me, but you can hear me. You can dance with me.",          answer:"MUSIC",    chinese:"音樂",  color:"#a78bfa", shadow:"#6d28d9", loc:"Amphitheater (露天音樂台)",     locNum:"地圖編號【12】", tip:"公園中心的大型表演舞台。",     icon:"🎵" },
  { id:4, sym:"🍁", clue:"I lived a long time ago. I am very big and scary. ROAR!",                 answer:"DINOSAUR", chinese:"恐龍",  color:"#fb923c", shadow:"#c2410c", loc:"Playground (恐龍滑梯)",         locNum:"地圖編號【7】",  tip:"兒童遊戲場那隻超大的恐龍！",   icon:"🦖" },
  { id:5, sym:"🌲", clue:"I am made of stone. I stand forever. I never move or speak.",             answer:"STATUE",   chinese:"雕像",  color:"#fbbf24", shadow:"#92400e", loc:"Guan Yin Statue (觀音像)",     locNum:"地圖編號【1】",  tip:"竹林附近的石雕像。",           icon:"🗿" },
  { id:6, sym:"🐚", clue:"I smell good. I have many colors. Bees love me.",                         answer:"FLOWER",   chinese:"花",    color:"#f472b6", shadow:"#9d174d", loc:"Pavilion 4 (4號涼亭)",         locNum:"地圖編號【10】", tip:"這裡開滿了漂亮的花朵。",       icon:"🌺" },
  { id:7, sym:"🧭", clue:"I am a number. I am 1 plus 1. How many eyes do you have?",                answer:"TWO",      chinese:"二",    color:"#f87171", shadow:"#991b1b", loc:"MRT Exit 2 (捷運2號出口)",     locNum:"地圖編號【3】",  tip:"抬頭找捷運出口的數字標示。",   icon:"2️⃣" },
  { id:8, sym:"🪵", clue:"I am a shoe with wheels. Put me on to go fast.",                          answer:"SKATE",    chinese:"溜冰鞋",color:"#34d399", shadow:"#065f46", loc:"Skating Rink (溜冰場)",        locNum:"地圖編號【6】",  tip:"找有人在練習直排輪的大圓圈。", icon:"⛸️" },
  { id:9, sym:"🍎", clue:"I am round. I can bounce. You kick me in a game.",                        answer:"BALL",     chinese:"球",    color:"#818cf8", shadow:"#3730a3", loc:"Basketball Court (籃球場)",     locNum:"地圖編號【8】",  tip:"跟著拍球聲找有籃框的地方。",   icon:"🏀" },
];

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

// 雙語介紹頁 5 頁
const ONBOARD_SLIDES = [
  {
    emoji: '🎯',
    en: 'CHOOSE A MISSION',
    zh: '選擇任務',
    descEn: 'Tap any block on the 3×3 grid. Solve the riddle, then go to the mission spot!',
    descZh: '點選任一個九宮格方塊，解開謎語後，前往指定的闖關地點！',
    color: '#16a34a',
  },
  {
    emoji: '🔍',
    en: 'SOLVE THE RIDDLE',
    zh: '解開謎語',
    descEn: 'Read the English clue and spell out the answer using the keyboard.',
    descZh: '閱讀英文謎語，用鍵盤拼出正確的英文單字！',
    color: '#2563eb',
  },
  {
    emoji: '🧩',
    en: 'USE YOUR 3 HINTS',
    zh: '善用三個提示',
    descEn: 'You have 3 hints for the whole game — use them wisely! Scramble / First Letter / Chinese.',
    descZh: '整個遊戲只有三次提示機會，要好好運用！亂序字母 / 第一個字母 / 中文翻譯',
    color: '#7c3aed',
  },
  {
    emoji: '🎫',
    en: 'GET YOUR STICKER',
    zh: '領取字母貼紙',
    descEn: 'After solving, go find the mission host! Complete their task to earn a letter sticker.',
    descZh: '解謎後前往地點，找到關主完成任務，就能獲得一張神秘字母貼紙！',
    color: '#dc2626',
  },
  {
    emoji: '🏆',
    en: 'SPELL  I ❤️ ENGLISH',
    zh: '拼出 I ❤️ ENGLISH',
    descEn: 'Collect all 9 stickers from 9 missions and spell out the secret phrase!',
    descZh: '完成九關，集齊九張貼紙，拼出神秘短句，成為最強 Alphabet Hunter！',
    color: '#d97706',
  },
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
// 2. 雙語介紹頁
// ─────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const [page, setPage] = useState(0);
  const touchStartX = useRef(null);
  const slide = ONBOARD_SLIDES[page];
  const isLast = page === ONBOARD_SLIDES.length - 1;

  const goNext = () => isLast ? onDone() : setPage(p => p + 1);
  const goPrev = () => setPage(p => Math.max(0, p - 1));

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = e => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) goNext();
    else if (dx > 40) goPrev();
    touchStartX.current = null;
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px 20px',
    }}>
      <div
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{
          background:'#fffbf0', borderRadius:28,
          width:'100%', maxWidth:380,
          padding:'28px 22px 24px',
          boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
          position:'relative',
        }}
      >
        {/* 關閉 */}
        <button onClick={onDone} style={{
          position:'absolute', top:14, right:14,
          background:'#e5e7eb', border:'none', borderRadius:'50%',
          width:34, height:34, fontSize:15, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          touchAction:'manipulation', color:'#6b7280',
        }}>✕</button>

        {/* 分頁點 */}
        <div style={{ display:'flex', gap:7, marginBottom:22 }}>
          {ONBOARD_SLIDES.map((_,i) => (
            <div key={i} onClick={() => setPage(i)} style={{
              width: i===page ? 22 : 10, height:10, borderRadius:999,
              background: i===page ? slide.color : '#d1fae5',
              cursor:'pointer', transition:'all 0.25s',
            }}/>
          ))}
        </div>

        {/* 內容 */}
        <div key={page} className="onboard-fade" style={{ textAlign:'center' }}>
          {/* 圖示 */}
          <div style={{ fontSize:72, lineHeight:1, marginBottom:14,
            filter:'drop-shadow(0 6px 12px rgba(0,0,0,0.15))' }}>
            {slide.emoji}
          </div>

          {/* 雙語標題 */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:'clamp(16px,5vw,22px)', fontWeight:700, color:slide.color, letterSpacing:0.5 }}>
              {slide.en}
            </div>
            <div style={{ fontSize:'clamp(13px,3.5vw,16px)', fontWeight:700, color:slide.color, opacity:0.75 }}>
              {slide.zh}
            </div>
          </div>

          {/* 雙語說明卡 */}
          <div style={{
            background:'#fff', border:`3px solid ${slide.color}44`,
            borderRadius:18, padding:'16px 18px', marginBottom:22, textAlign:'left',
          }}>
            {/* 英文 */}
            <p style={{ fontSize:'clamp(13px,3.8vw,16px)', fontWeight:700, color:'#1c1917', lineHeight:1.55, margin:'0 0 10px' }}>
              🇬🇧 {slide.descEn}
            </p>
            {/* 分隔線 */}
            <div style={{ borderTop:`1.5px dashed ${slide.color}55`, margin:'10px 0' }}/>
            {/* 中文 */}
            <p style={{ fontSize:'clamp(13px,3.8vw,16px)', fontWeight:700, color:'#374151', lineHeight:1.55, margin:0 }}>
              🇹🇼 {slide.descZh}
            </p>
          </div>
        </div>

        {/* 按鈕列 */}
        <div style={{ display:'flex', gap:10 }}>
          {page > 0 && (
            <button onClick={goPrev} className="btn-press" style={{
              flex:1, padding:'12px 0',
              background:'#f3f4f6', color:'#374151',
              border:'none', borderBottom:'4px solid #d1d5db', borderRadius:14,
              fontFamily:'inherit', fontWeight:700, fontSize:15,
              cursor:'pointer', touchAction:'manipulation',
            }}>← BACK</button>
          )}
          <button onClick={goNext} className="btn-press" style={{
            flex:1, padding:'12px 0',
            background:slide.color, color:'#fff',
            border:'none', borderBottom:`4px solid ${slide.color}bb`, borderRadius:14,
            fontFamily:'inherit', fontWeight:700, fontSize:15,
            cursor:'pointer', touchAction:'manipulation',
          }}>
            {isLast ? "LET'S GO! 🚀" : 'NEXT →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. 提示燈箱
// ─────────────────────────────────────────────
function HintToast({ hint, onClose }) {
  if (!hint) return null;
  const config = {
    scramble: { emoji:'🧩', title:'SCRAMBLE LETTERS! / 亂序字母', color:'#8b5cf6', bg:'#ede9fe', border:'#a78bfa' },
    flash:    { emoji:'🔦', title:'FIRST LETTER! / 第一個字母',   color:'#f59e0b', bg:'#fef3c7', border:'#fbbf24' },
    trans:    { emoji:'📖', title:'CHINESE HINT! / 中文提示',     color:'#0ea5e9', bg:'#e0f2fe', border:'#38bdf8' },
  }[hint.type];
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div className="pop-in" onClick={e => e.stopPropagation()} style={{
        background:config.bg, border:`4px solid ${config.border}`,
        borderRadius:28, padding:'28px 24px',
        maxWidth:320, width:'100%', textAlign:'center',
        boxShadow:'0 12px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize:52, marginBottom:8 }}>{config.emoji}</div>
        <div style={{ fontSize:12, fontWeight:700, color:config.color, letterSpacing:1, marginBottom:12 }}>
          {config.title}
        </div>
        <div style={{
          fontSize:'clamp(24px,8vw,40px)', fontWeight:700, color:'#1c1917',
          background:'#fff', borderRadius:16, padding:'14px 20px',
          border:`3px solid ${config.border}`,
          letterSpacing: hint.type==='scramble' ? 8 : 4, marginBottom:20,
        }}>{hint.text}</div>
        <button onClick={onClose} style={{
          background:config.color, color:'#fff',
          border:'none', borderBottom:`4px solid ${config.color}bb`,
          borderRadius:14, padding:'12px 32px',
          fontFamily:'inherit', fontWeight:700, fontSize:16,
          cursor:'pointer', touchAction:'manipulation',
        }}>GOT IT! 👍</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 4. 提示列（全局共用，剩餘次數顯示）
// ─────────────────────────────────────────────
function LifelineBar({ lifelines, onUse }) {
  const btns = [
    { key:'scramble', emoji:'🧩', labelEn:'SCRAMBLE', labelZh:'亂序字母', color:'#8b5cf6', shadow:'#6d28d9' },
    { key:'flash',    emoji:'🔦', labelEn:'1st LETTER',labelZh:'第一字母', color:'#f59e0b', shadow:'#b45309' },
    { key:'trans',    emoji:'📖', labelEn:'CHINESE',  labelZh:'中文提示', color:'#0ea5e9', shadow:'#0369a1' },
  ];
  return (
    <div style={{
      display:'flex', gap:6, justifyContent:'center',
      padding:'8px 10px',
      background:'#fff7ed', borderBottom:'2px solid #fed7aa', flexShrink:0,
    }}>
      {btns.map(b => {
        const used = !lifelines[b.key];
        return (
          <button key={b.key} onClick={() => !used && onUse(b.key)}
            className={used ? '' : 'btn-press'}
            style={{
              flex:1, padding:'7px 3px', borderRadius:12,
              border:'none', borderBottom: used ? '3px solid #d1d5db' : `4px solid ${b.shadow}`,
              background: used ? '#e5e7eb' : b.color,
              color: used ? '#9ca3af' : '#fff',
              fontFamily:'inherit', fontWeight:700,
              fontSize:'clamp(8px,2vw,10px)',
              cursor: used ? 'not-allowed' : 'pointer',
              touchAction:'manipulation', opacity: used ? 0.5 : 1,
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            }}>
            <span style={{ fontSize:'clamp(16px,4.5vw,22px)', filter: used ? 'grayscale(1)' : 'none' }}>{b.emoji}</span>
            <span>{b.labelEn}</span>
            <span style={{ opacity:0.8 }}>{b.labelZh}</span>
            {used
              ? <span style={{ fontSize:8, background:'rgba(0,0,0,0.15)', borderRadius:4, padding:'1px 4px' }}>USED</span>
              : <span style={{ fontSize:8, background:'rgba(255,255,255,0.3)', borderRadius:4, padding:'1px 4px' }}>✓ READY</span>
            }
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// 5. 字母格子列
// ─────────────────────────────────────────────
function SlotsRow({ input, locked, shake }) {
  const len = input.length;
  return (
    <div className={shake ? 'shake' : ''} style={{
      display:'flex', flexWrap:'wrap', justifyContent:'center',
      gap:5, width:'100%', marginBottom:16, position:'relative',
    }}>
      {input.map((ch, i) => {
        const isLocked = locked[i];
        return (
          <div key={i} className={isLocked ? 'slot-locked' : ''} style={{
            width:`clamp(34px, calc(85vw / ${len}), 52px)`,
            height:'clamp(44px, 13vw, 60px)',
            borderRadius:10, position:'relative',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'clamp(18px,6vw,28px)', fontWeight:700, transition:'all 0.2s',
            background: isLocked ? '#fef9c3' : '#fff',
            borderBottom: isLocked ? '4px solid #facc15' : (ch ? '4px solid #f97316' : '4px solid #e5e7eb'),
            color: isLocked ? '#92400e' : '#f97316',
          }}>
            {ch}
            {isLocked && <span style={{ position:'absolute', fontSize:9, bottom:1, right:2 }}>🔒</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// 6. 虛擬鍵盤
// ─────────────────────────────────────────────
function VirtualKeyboard({ onKey, onSubmit }) {
  const keyStyle = {
    flex:1, height:'clamp(38px,9vw,46px)', minWidth:0,
    border:'none', borderRadius:7, background:'#fff',
    borderBottom:'3px solid #9ca3af',
    fontFamily:'inherit', fontWeight:700,
    fontSize:'clamp(11px,3.2vw,15px)',
    cursor:'pointer', touchAction:'manipulation',
  };
  return (
    <div style={{
      background:'#d1d5db', padding:'10px 6px',
      paddingBottom:'calc(10px + env(safe-area-inset-bottom))',
      borderRadius:'20px 20px 0 0', flexShrink:0, width:'100%',
    }}>
      {KB_ROWS.map((row,ri) => (
        <div key={ri} style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:5 }}>
          {row.map(k => (
            <button key={k} className="key-btn" style={keyStyle} onClick={() => onKey(k)}>{k}</button>
          ))}
          {ri===2 && (
            <button className="key-btn"
              style={{ ...keyStyle, flex:1.5, background:'#f87171', color:'#fff', borderColor:'#dc2626', minWidth:40 }}
              onClick={() => onKey('BACKSPACE')}>⌫</button>
          )}
        </div>
      ))}
      <button onClick={onSubmit} className="key-btn" style={{
        width:'100%', marginTop:6, height:'clamp(44px,12vw,52px)',
        background:'#22c55e', color:'#fff',
        border:'none', borderBottom:'4px solid #166534', borderRadius:14,
        fontFamily:'inherit', fontWeight:700, fontSize:'clamp(14px,4vw,18px)',
        cursor:'pointer', touchAction:'manipulation', letterSpacing:0.5,
      }}>✅ CHECK ANSWER</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 7. 解謎畫面
// ─────────────────────────────────────────────
function PuzzleView({ level, input, locked, shake, lifelines, onKey, onSubmit, onLifeline }) {
  return (
    <>
      <LifelineBar lifelines={lifelines} onUse={onLifeline} />
      <div style={{
        flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch',
        padding:'20px 16px 8px',
        display:'flex', flexDirection:'column', alignItems:'center',
      }}>
        <div style={{
          background:'#fff', border:'3px solid #fed7aa',
          borderRadius:20, padding:20, width:'100%', textAlign:'center', marginBottom:20,
        }}>
          <p style={{
            fontSize:'clamp(15px,4.5vw,20px)', fontWeight:700,
            color:'#1c1917', lineHeight:1.5, fontStyle:'italic', margin:0,
          }}>"{level.clue}"</p>
        </div>
        <SlotsRow input={input} locked={locked} shake={shake} />
      </div>
      <VirtualKeyboard onKey={onKey} onSubmit={onSubmit} />
    </>
  );
}

// ─────────────────────────────────────────────
// 8. 結果畫面（含字母貼紙）
// ─────────────────────────────────────────────
function ResultView({ level, onClose }) {
  const sticker = LEVEL_STICKER[level.answer];
  const [stickerVisible, setStickerVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStickerVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch',
      padding:'20px 16px 24px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:12,
    }}>
      {/* ── 上方彩色區：答案 + 星星標語 ── */}
      <div style={{
        width:'100%', borderRadius:24,
        background: level.color,
        boxShadow: `0 6px 0 ${level.shadow}`,
        padding:'20px 20px 24px',
        display:'flex', flexDirection:'column', alignItems:'center',
        position:'relative',
      }}>
        {/* 圖示圓圈 */}
        <div style={{
          width:80, height:80, background:'rgba(255,255,255,0.3)',
          borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:44, marginBottom:10,
        }} className="bounce-icon">{level.icon}</div>

        {/* ⭐ GREAT! ⭐ */}
        <div style={{
          background:'rgba(255,255,255,0.25)', borderRadius:999,
          padding:'4px 16px', marginBottom:8,
          fontSize:13, fontWeight:700, color:'#fff', letterSpacing:1,
        }}>⭐ GREAT! ⭐</div>

        {/* 答案大字 */}
        <div style={{
          fontSize:'clamp(30px,10vw,44px)', fontWeight:700,
          color:'#fff', letterSpacing:4,
          textShadow:'0 3px 0 rgba(0,0,0,0.15)',
        }}>{level.answer}</div>
      </div>

      {/* ── 字母貼紙區 ── */}
      <div style={{
        width:'100%',
        background:'#fff7ed',
        border:'3px solid #fed7aa',
        borderRadius:20, padding:'16px 20px',
        textAlign:'center',
      }}>
        <div style={{
          fontSize:12, fontWeight:700, color:'#ea580c',
          letterSpacing:1, marginBottom:12, textTransform:'uppercase',
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        }}>
          🎁 STICKER UNLOCKED! / 字母貼紙解鎖！
        </div>

        {/* 貼紙本體 */}
        {stickerVisible ? (
          <div className="sticker-pop" style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:72, height:72,
            background:'#fff',
            borderRadius:14,
            border:'3px solid #fed7aa',
            boxShadow:'0 5px 0 #fb923c',
            fontSize: sticker === '❤️' ? 38 : 'clamp(28px,10vw,40px)',
            fontWeight:700, color:'#2563eb',
          }}>
            {sticker}
          </div>
        ) : (
          <div style={{ width:72, height:72 }} />
        )}

        <p style={{ fontSize:12, color:'#92400e', margin:'10px 0 0', fontWeight:700 }}>
          Find the mission host to claim this sticker!
          <br/>找到關主完成任務，才能拿到這張貼紙喔！
        </p>
      </div>

      {/* ── 前往地點 ── */}
      <div style={{
        width:'100%',
        background:'#dcfce7', border:'3px solid #bbf7d0', borderRadius:20, padding:16,
      }}>
        <div style={{
          fontSize:11, fontWeight:700, color:'#15803d',
          textTransform:'uppercase', letterSpacing:0.5, marginBottom:6,
          display:'flex', alignItems:'center', gap:5,
        }}>
          ➤ GO HERE / 前往地點
        </div>
        <div style={{ fontSize:'clamp(15px,4.5vw,19px)', fontWeight:700, color:'#1c1917', lineHeight:1.3 }}>
          {level.loc}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'#16a34a', marginTop:4 }}>{level.locNum}</div>
        <div style={{ marginTop:10, paddingTop:10, borderTop:'2px solid #bbf7d0', fontSize:13, color:'#374151' }}>
          💡 {level.tip}
        </div>
      </div>

      {/* ── 出發按鈕 ── */}
      <button onClick={onClose} className="btn-press" style={{
        width:'100%', padding:14,
        background:'#22c55e', color:'#fff',
        border:'none', borderBottom:'6px solid #166534', borderRadius:16,
        fontFamily:'inherit', fontWeight:700, fontSize:'clamp(15px,4.5vw,18px)',
        cursor:'pointer', touchAction:'manipulation',
      }}>OK! I'M GOING! 🚀</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 9. 主程式
// ─────────────────────────────────────────────
export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [gridLevels, setGridLevels] = useState([]);
  const [solved,     setSolved]     = useState([]);
  const [current,    setCurrent]    = useState(null);
  const [input,      setInput]      = useState([]);
  const [locked,     setLocked]     = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [shake,      setShake]      = useState(false);
  // ✅ 全局提示：整個遊戲只有三次，存入 localStorage
  const [lifelines,  setLifelines]  = useState({ scramble:true, flash:true, trans:true });
  const [hint,       setHint]       = useState(null);

  // ── 初始化 ──
  useEffect(() => {
    const seen = localStorage.getItem('ah_onboard_v2');
    if (!seen) setShowOnboarding(true);

    const sg = localStorage.getItem('ah_grid_v4');
    const grid = sg ? JSON.parse(sg) : shuffle(LEVELS_SOURCE);
    if (!sg) localStorage.setItem('ah_grid_v4', JSON.stringify(grid));
    setGridLevels(grid);

    const ss = localStorage.getItem('ah_solved_v4');
    if (ss) setSolved(JSON.parse(ss));

    // 載入全局提示狀態
    const sl = localStorage.getItem('ah_lifelines_v4');
    if (sl) setLifelines(JSON.parse(sl));
  }, []);

  const handleOnboardDone = () => {
    localStorage.setItem('ah_onboard_v2', '1');
    setShowOnboarding(false);
  };

  // ── 開啟關卡 ──
  const openLevel = useCallback((lvl) => {
    setCurrent(lvl);
    setInput(new Array(lvl.answer.length).fill(''));
    setLocked(new Array(lvl.answer.length).fill(false));
    setShowResult(solved.includes(lvl.id));
    setShake(false);
    setHint(null);
    // 注意：不重置 lifelines，全局共用
  }, [solved]);

  const closeModal = () => { setCurrent(null); setHint(null); };

  // ── 提示（全局扣除）──
  const handleLifeline = useCallback((type) => {
    if (!current || !lifelines[type]) return;
    const newLL = { ...lifelines, [type]: false };
    setLifelines(newLL);
    localStorage.setItem('ah_lifelines_v4', JSON.stringify(newLL));

    if (type === 'scramble') {
      setHint({ type:'scramble', text: shuffle([...current.answer]).join('  ') });
    } else if (type === 'flash') {
      setHint({ type:'flash', text: current.answer[0] + ' ...' });
      setInput(prev => { const n=[...prev]; if(n[0]==='') n[0]=current.answer[0]; return n; });
      setLocked(prev => { const n=[...prev]; n[0]=true; return n; });
    } else if (type === 'trans') {
      setHint({ type:'trans', text: current.chinese });
    }
  }, [current, lifelines]);

  // ── 鍵盤輸入 ──
  const handleKey = useCallback((k) => {
    setInput(prev => {
      const next = [...prev];
      if (k === 'BACKSPACE') {
        for (let i=next.length-1; i>=0; i--) {
          if (!locked[i] && next[i]!=='') { next[i]=''; break; }
        }
      } else {
        const idx = next.findIndex((v,i) => v==='' && !locked[i]);
        if (idx !== -1) next[idx] = k;
      }
      return next;
    });
  }, [locked]);

  // ── 提交答案 ──
  const handleSubmit = useCallback(() => {
    if (!current) return;
    const newLocked = [...locked];
    const newInput  = [...input];
    let anyWrong = false;

    for (let i=0; i<current.answer.length; i++) {
      if (newLocked[i]) continue;
      if (newInput[i] === current.answer[i]) {
        newLocked[i] = true;
      } else {
        newInput[i] = '';
        anyWrong = true;
      }
    }
    setLocked(newLocked);
    setInput(newInput);

    if (!anyWrong) {
      const newSolved = [...solved, current.id];
      setSolved(newSolved);
      localStorage.setItem('ah_solved_v4', JSON.stringify(newSolved));
      setShowResult(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }, [current, input, locked, solved]);

  const handleReset = () => {
    if (window.confirm('Reset all progress? / 確定要重置所有進度嗎？')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // 剩餘提示數
  const lifelineCount = Object.values(lifelines).filter(Boolean).length;

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'transparent', width:'100%', overflowX:'hidden' }}>
      <GlobalStyles />

      {showOnboarding && <OnboardingScreen onDone={handleOnboardDone} />}
      {hint && <HintToast hint={hint} onClose={() => setHint(null)} />}

      {/* ── Header ── */}
      <header style={{
        background:'#16a34a', padding:'12px 16px',
        paddingTop:'calc(12px + env(safe-area-inset-top))',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        boxShadow:'0 4px 0 #166534', position:'sticky', top:0, zIndex:10, width:'100%',
      }}>
        <div>
          <h1 style={{ fontWeight:700, fontSize:'clamp(15px,4vw,19px)', color:'#fff', margin:0, letterSpacing:-0.5 }}>
            🌿 ALPHABET HUNTERS
          </h1>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.75)', margin:0 }}>DAAN FOREST PARK ADVENTURE</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* 提示剩餘 badge */}
          <div style={{
            background: lifelineCount > 0 ? '#fbbf24' : '#9ca3af',
            color: lifelineCount > 0 ? '#92400e' : '#fff',
            fontWeight:700, fontSize:11,
            padding:'3px 8px', borderRadius:999,
            boxShadow: lifelineCount > 0 ? '0 2px 0 #a16207' : 'none',
          }}>
            💡×{lifelineCount}
          </div>
          <button onClick={() => setShowOnboarding(true)} style={{
            background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%',
            width:30, height:30, fontSize:15, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            touchAction:'manipulation', color:'#fff',
          }}>❓</button>
          <div style={{
            background:'#facc15', color:'#a16207',
            fontWeight:700, fontSize:14,
            padding:'4px 12px', borderRadius:999,
            boxShadow:'0 3px 0 #a16207',
          }}>{solved.length}/9</div>
        </div>
      </header>

      {/* ── Grid ── */}
      <main style={{ padding:'16px', maxWidth:440, margin:'0 auto', width:'100%' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
          gap:10, width:'100%',
        }}>
          {gridLevels.map(lvl => {
            const isSolved = solved.includes(lvl.id);
            const sticker  = LEVEL_STICKER[lvl.answer];
            return (
              <button key={lvl.id} className="btn-press" onClick={() => openLevel(lvl)} style={{
                aspectRatio:'1', borderRadius:20, border:'none', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                fontFamily:'inherit', touchAction:'manipulation', minWidth:0,
                background: isSolved ? lvl.color : 'rgba(255,255,255,0.85)',
                boxShadow: isSolved ? `0 5px 0 ${lvl.shadow}` : '0 5px 0 rgba(0,0,0,0.15)',
                position:'relative',
              }}>
                {isSolved ? (
                  <>
                    <span style={{ fontSize:'clamp(18px,6vw,28px)', marginBottom:2 }}>{lvl.icon}</span>
                    <span style={{ fontSize:'clamp(6px,2vw,9px)', fontWeight:700, color:'#fff', letterSpacing:-0.5 }}>{lvl.answer}</span>
                    {/* 貼紙小角標 */}
                    <div style={{
                      position:'absolute', top:5, right:5,
                      background:'#fff', borderRadius:6,
                      width:20, height:20,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: sticker==='❤️' ? 11 : 'clamp(9px,3vw,12px)',
                      fontWeight:700, color:'#2563eb',
                      boxShadow:'0 2px 0 rgba(0,0,0,0.15)',
                    }}>{sticker}</div>
                  </>
                ) : (
                  <span style={{ fontSize:'clamp(24px,8vw,36px)', opacity:0.3 }}>{lvl.sym}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          marginTop:14, background:'rgba(255,255,255,0.35)',
          borderRadius:20, border:'2px solid rgba(255,255,255,0.5)',
          padding:12, textAlign:'center',
          fontSize:'clamp(11px,3.2vw,14px)', fontWeight:700, color:'#0c4a6e',
        }}>
          🔍 點選格子，找出神秘單字！
        </div>
      </main>

      {/* ── Modal ── */}
      {current && (
        <div className="overlay-bg"
          onClick={e => { if (e.target===e.currentTarget) closeModal(); }}
          style={{
            position:'fixed', inset:0, zIndex:50,
            background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
            display:'flex', alignItems:'flex-end',
          }}
        >
          <div className="sheet-slide" style={{
            background:'#FFF8E7', width:'100%', maxWidth:440,
            margin:'0 auto', borderRadius:'2rem 2rem 0 0',
            maxHeight:'90dvh', display:'flex', flexDirection:'column',
            overflow:'hidden', boxShadow:'0 -8px 30px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              padding:'14px 20px', display:'flex',
              justifyContent:'space-between', alignItems:'center',
              borderBottom:'2px solid #fed7aa', background:'#fff', flexShrink:0,
            }}>
              <div style={{ fontWeight:700, fontSize:17, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
                <span>{current.sym}</span> MISSION
              </div>
              <button onClick={closeModal} style={{
                background:'#f3f4f6', border:'none', borderRadius:'50%',
                width:34, height:34, cursor:'pointer', fontSize:15,
                display:'flex', alignItems:'center', justifyContent:'center',
                touchAction:'manipulation',
              }}>✕</button>
            </div>

            {showResult ? (
              <ResultView level={current} onClose={closeModal} />
            ) : (
              <PuzzleView
                level={current} input={input} locked={locked}
                shake={shake} lifelines={lifelines}
                onKey={handleKey} onSubmit={handleSubmit} onLifeline={handleLifeline}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{ padding:24, textAlign:'center', marginTop:'auto' }}>
        <button onClick={handleReset} style={{
          background:'none', border:'none', cursor:'pointer',
          fontFamily:'inherit', fontSize:10, fontWeight:700,
          color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:2,
          touchAction:'manipulation',
        }}>Reset Game Progress</button>
      </footer>
    </div>
  );
}