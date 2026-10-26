/* ============================================================
   core.js —— 常量、状态、工具、经济、商店、合成、羁绊
   ============================================================ */
'use strict';

/* ---------- 画布与常量 ---------- */
var W = 960;
var H = 540;
var FONT = '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif';

var BOARD = { cols:7, rows:8, x:244, y:50, colSp:80, rowSp:36, cellW:78, cellH:34 };

var BENCH = { count:9, size:48, gap:6, y:346, x:0 };
BENCH.x = (W - (BENCH.count * BENCH.size + (BENCH.count - 1) * BENCH.gap)) / 2;

var SHOP = { count:5, cardW:130, cardH:88, gap:6, y:418, x:0 };
SHOP.x = 130;

var SHOP_ODDS = {
  1:[100,0,0,0,0,0,0], 2:[100,0,0,0,0,0,0], 3:[75,25,0,0,0,0,0],
  4:[55,30,15,0,0,0,0], 5:[45,33,20,2,0,0,0], 6:[30,40,25,5,0,0,0],
  7:[19,30,35,15,1,0,0], 8:[15,25,35,20,4,1,0],
  9:[10,15,30,30,10,4,1], 
};

var POOL_SIZE_BY_COST = { 1: 30, 2: 25, 3: 18, 4: 10, 5: 9, 7:3};

function initCardPool() {
  var pool = {};
  for (var i = 0; i < CHARS.length; i++) {
    var c = CHARS[i];
    pool[c.id] = POOL_SIZE_BY_COST[c.cost] || 30;
  }
  return pool;
}

var EXP_TABLE = { 1:2, 2:2, 3:6, 4:10, 5:20, 6:36, 7:56, 8:80 };

var PREP_TIME = 25;
var BATTLE_TIME = 15;

var SIDEBAR = { x: 10, y: 58, iconSize: 42, gap: 6 };
var TRASHCAN = { x: 838, y: 274, w: 90, h: 90 };

var C = {
  bg:'#0a0a12', panel:'#15151f', panelLight:'#1e1e2c',
  border:'#3a3a4a', borderHi:'#6a5a3a',
  gold:'#e8c84a', goldDim:'#a8883a',
  red:'#c83030', redDark:'#8a1a1a',
  text:'#e8dcc0', textDim:'#8a8070',
  hpRed:'#d83a3a', hpGreen:'#4ac86a', mpBlue:'#3a7ad8',
  expGreen:'#4ac86a',
  empty:'rgba(40,40,55,0.55)', emptyEdge:'rgba(90,90,110,0.5)',
  playerSide:'rgba(60,110,180,0.14)', enemySide:'rgba(180,60,60,0.14)',
};

var COST_COLOR = {
  1:'#9a9a9a', 2:'#3a9a3a', 3:'#3a7ad8', 4:'#9a3ad8', 5:'#e8a020',7:'#ff0055',
};

var STAR_MUL = { 1:1.0, 2:1.8, 3:3.2 };

var STATE = {
  TITLE:'TITLE', PREPARE:'PREPARE', BATTLE:'BATTLE',
  ROUND_RESULT:'ROUND_RESULT', GAME_OVER:'GAME_OVER',
};
var DIFF_NAMES = ['简单', '普通', '困难'];

/* ---------- 全局状态 ---------- */
var G = {
  state: STATE.TITLE,
  time: 0, lastTime: 0,
  mouse: { x:-1, y:-1 },
  difficulty: 1,
  showHelp: false,
  sidebarPage: 0,        // 羁绊列表当前页码
  traitDetailPage: 0,    // 详情弹窗当前页码
  traitDetailScroll: 0,  // 羁绊详情弹窗的滚动偏移
  

  combineEffects: [], // 合成特效池
  equipBag: [], // 玩家未穿戴的装备

  // 战斗表现
  hitStopTimer: 0,    // 顿帧计时器
  shakeIntensity: 0,  // 屏幕震动幅度


  autoDeploying: false,
  autoDeployTimer: 0,
  cardPool: null,

  round: 1, gold: 0, hp: 100,
  level: 2, exp: 0,
  winStreak: 0, loseStreak: 0,

  playerBoard: null, playerBench: null,
  enemyBoard: null,
  shop: [],
  ai: { hp:100 },
  aiCount: 7, // 默认 1v7
  gameMode: 'ffa', // '1v1' | '4v4' | '8v8' | 'ffa'

  prepTimer: PREP_TIME,
  battle: null,

  dragging: null,
  message: null, messageTime: -9999,
  traitDetailOpen: null,
  sidebarTab: 'traits',   // 'traits' | 'equips'

  roundResult: null, resultTimer: 0,

  enemyBoard: null,
  ais: [],                      // 7 个 AI 玩家
  currentOpponentIndex: -1,     // 本轮匹配到的 AI 索引
  viewingOpponentIndex: -1,   // -1=查看自己，>=0=查看某个 AI
  playerRank: 0,                // 玩家最终排名
  aiRoster: null,      // AI 阵容池，跨回合保留
  aiPositions: null,   // AI 棋子位置，跨回合保留
  
  shopLocked: false,
  selectedUnit: null,
  selectedUnitLocation: null,
  detailOpen: false,
  sidebarTraitsOpen: true,
  sidebarEquipsOpen: false,
  dragStartX: 0, dragStartY: 0, dragDistance: 0,
  lastMouseX: 0, lastMouseY: 0,
  hotkeys: null,          // 存 { buy1..buy5, sell, refresh }
  hotkeySetting: null,    // 正在设置的动作名，null=没在设置
  hotkeyPanelOpen: false, // 设置面板是否打开
};

/* ---------- Canvas ---------- */
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function fitCanvas() {
  // 1. 设定一个最大缩放上限，比如 0.8 倍（画面会变小，四周留出黑边）
  var MAX_SCALE = 0.85; 
  
  // 2. 严格按窗口的宽和高分别计算比例，取较小值，保证绝对不变形
  var scaleW = window.innerWidth / W;
  var scaleH = window.innerHeight / H;
  
  // 3. 最终缩放比例不超过最大上限
  var scale = Math.min(scaleW, scaleH, MAX_SCALE);
  
  canvas.style.width  = Math.floor(W * scale) + 'px';
  canvas.style.height = Math.floor(H * scale) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function getMousePos(e) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (W / rect.width),
    y: (e.clientY - rect.top)  * (H / rect.height),
  };
}

/* ---------- 几何工具 ---------- */
function roundRect(x, y, w, h, r) {
  if (r < 0) r = 0;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}
function hexagonPath(cx, cy, w, h) {
  var hw = w / 2;
  var hh = h / 2;
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.5, cy - hh);
  ctx.lineTo(cx + hw * 0.5, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx + hw * 0.5, cy + hh);
  ctx.lineTo(cx - hw * 0.5, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
}
function cellCenter(col, row) {
  // 规整矩形网格：行列直接对齐，无交错偏移
  return {
    x: BOARD.x + col * BOARD.colSp,
    y: BOARD.y + row * BOARD.rowSp,
  };
}
function benchRect(i) {
  return { x: BENCH.x + i * (BENCH.size + BENCH.gap),
           y: BENCH.y, w: BENCH.size, h: BENCH.size };
}
function shopRect(i) {
  return { x: SHOP.x + i * (SHOP.cardW + SHOP.gap),
           y: SHOP.y, w: SHOP.cardW, h: SHOP.cardH };
}
function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
function hitCell(px, py, r, c) {
  var cc = cellCenter(c, r);
  return px >= cc.x - BOARD.cellW/2 && px <= cc.x + BOARD.cellW/2 &&
         py >= cc.y - BOARD.cellH/2 && py <= cc.y + BOARD.cellH/2;
}
function makeEmptyBoard() {
  var b = [];
  for (var r = 0; r < BOARD.rows; r++) b.push(new Array(BOARD.cols).fill(null));
  return b;
}
function makeUnit(charId, star) {
  var c = CHAR_BY_ID[charId];
  var m = STAR_MUL[star] || 1;
  return {
    charId:c.id, name:c.name, star:star, cost:c.cost,
    maxHp: Math.round(c.hp * m), hp: Math.round(c.hp * m),
    atk: Math.round(c.atk * m), as: c.as, range: c.range,
    armor: c.armor, maxMana: c.mana, mana: 0,
    traits: c.traits.slice(),
    equips: [],
  };
}
function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex || '#333';
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);
  r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
  return '#' + [r,g,b].map(function(v){ return v.toString(16).padStart(2,'0'); }).join('');
}
function showMessage(text) { G.message = text; G.messageTime = G.time; }
function gridDist(a, b) {
  // 优先用格子坐标：range=1 表示相邻 8 格（含斜角）
  if (a.col !== undefined && a.row !== undefined &&
      b.col !== undefined && b.row !== undefined) {
    return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
  }
  // 兜底：像素距离
  var dx = Math.abs(a.px - b.px) / BOARD.colSp;
  var dy = Math.abs(a.py - b.py) / BOARD.rowSp;
  return Math.max(dx, dy);
}

/* ---------- 经济 / 商店 / 合成 ---------- */
function streakBonus() {
  if (G.winStreak >= 5)  return 3;
  if (G.winStreak >= 3)  return 2;
  if (G.winStreak >= 2)  return 1;
  if (G.loseStreak >= 5) return 3;
  if (G.loseStreak >= 3) return 2;
  if (G.loseStreak >= 2) return 1;
  return 0;
}
function interestGold() { return Math.min(5, Math.floor(G.gold / 10)); }
function countPlayerUnitsOnBoard() {
  var n = 0;
  for (var r = 4; r < 8; r++)
    for (var c = 0; c < 7; c++)
      if (G.playerBoard[r][c]) n++;
  return n;
}
function findEmptyBench() {
  for (var i = 0; i < BENCH.count; i++) if (!G.playerBench[i]) return i;
  return -1;
}
function rollOneChar(level) {
  var odds = SHOP_ODDS[level] || SHOP_ODDS[9];
  var roll = Math.random() * 100, cost = 1;
  for (var i = 0; i < odds.length; i++) {
    if (roll < odds[i]) { cost = i + 1; break; }
    roll -= odds[i];
  }

  // 从该费用里挑剩余池 > 0 的角色
  var pool = CHARS.filter(function(c){
    return c.cost === cost && G.cardPool[c.id] > 0;
  });

  // 该费用没货，退而求其次：1 费
  if (pool.length === 0) {
    pool = CHARS.filter(function(c){
      return c.cost === 1 && G.cardPool[c.id] > 0;
    });
    if (pool.length === 0) return CHARS[0].id;
  }

  // 权重抽：剩余越多概率越高
  var total = 0;
  for (var i = 0; i < pool.length; i++) total += G.cardPool[pool[i].id];
  var r = Math.random() * total;
  for (var i = 0; i < pool.length; i++) {
    r -= G.cardPool[pool[i].id];
    if (r <= 0) return pool[i].id;
  }
  return pool[0].id;
}
function rollShop() {
  // 归还旧商店未售出的卡到池里
  if (G.shop && G.cardPool) {
    for (var i = 0; i < G.shop.length; i++) {
      var s = G.shop[i];
      if (s && !s.sold && G.cardPool[s.charId] !== undefined) {
        G.cardPool[s.charId]++;
      }
    }
  }

  G.shop = [];
  for (var i = 0; i < SHOP.count; i++) {
    var charId = rollOneChar(G.level);
    G.shop.push({ charId: charId, sold: false });
    if (G.cardPool[charId] > 0) G.cardPool[charId]--;
  }
}
function buyShopCard(i) {
  if (G.state !== STATE.PREPARE && G.state !== STATE.BATTLE) return;
  var s = G.shop[i];
  if (!s || s.sold) return;
  var c = CHAR_BY_ID[s.charId];
  if (G.gold < c.cost) { showMessage('金币不足'); return; }
  var slot = findEmptyBench();
  if (slot === -1) { showMessage('备战席已满'); return; }
  G.gold -= c.cost;
  G.playerBench[slot] = makeUnit(c.id, 1);
  s.sold = true;
  tryCombine();
}
function refreshShop() {
  if (G.state !== STATE.PREPARE && G.state !== STATE.BATTLE) return;
  if (G.autoDeploying) return;
  if (G.gold < 2) { showMessage('金币不足'); return; }
  G.gold -= 2; rollShop();
}
function buyExp() {
  if (G.state !== STATE.PREPARE && G.state !== STATE.BATTLE) return;
  if (G.autoDeploying) return;
  if (G.level >= 9) { showMessage('已满级'); return; }
  if (G.gold < 4) { showMessage('金币不足'); return; }
  G.gold -= 4; G.exp += 4; checkLevelUp();
}
function checkLevelUp() {
  var leveled = false;
  while (G.level < 9 && G.exp >= (EXP_TABLE[G.level] || 999)) {
    G.exp -= EXP_TABLE[G.level]; G.level++; leveled = true;
  }
  if (leveled) showMessage('升级到 ' + G.level + ' 级！');
}
function tryCombine() {
  var changed = true, loops = 0;
  while (changed && loops < 10) {
    changed = false; loops++;
    var map = {};
    var all = [];

    // 1. 备战席（任何阶段都参与）
    for (var i = 0; i < BENCH.count; i++)
      if (G.playerBench[i])
        all.push({ loc:{type:'bench', index:i}, unit:G.playerBench[i] });

    // 2. 棋盘：只在非战斗阶段参与合成
    //    战斗中棋盘上的棋子不动，避免"战斗中升星但战后变回"
    if (G.state !== STATE.BATTLE) {
      for (var r = 4; r < 8; r++)
        for (var c = 0; c < 7; c++)
          if (G.playerBoard[r][c])
            all.push({ loc:{type:'board', row:r, col:c}, unit:G.playerBoard[r][c] });
    }

    for (var k = 0; k < all.length; k++) {
      var key = all[k].unit.charId + '_' + all[k].unit.star;
      if (!map[key]) map[key] = [];
      map[key].push(all[k]);
    }

    for (var mk in map) {
      var group = map[mk];
      if (group.length < 3) continue;
      var newStar = group[0].unit.star + 1;
      if (newStar > 3) continue;

      // 优先保留：战斗单位 > 棋盘 > 备战席
      var keep =
        group.find(function(g){ return g.loc.type === 'board'; }) ||
        group[0];

      var removeList = group.filter(function(g){ return g !== keep; }).slice(0, 2);

      for (var ri = 0; ri < removeList.length; ri++) {
        var rm = removeList[ri];
        if (rm.loc.type === 'bench') G.playerBench[rm.loc.index] = null;
        else if (rm.loc.type === 'board') G.playerBoard[rm.loc.row][rm.loc.col] = null;
      }

      // 升级 keep
      var upgraded = makeUnit(keep.unit.charId, newStar);

      if (keep.loc.type === 'bench') {
        G.playerBench[keep.loc.index] = upgraded;
      } else if (keep.loc.type === 'board') {
        G.playerBoard[keep.loc.row][keep.loc.col] = upgraded;
      }
      showMessage('合成 ' + newStar + ' 星 ' + upgraded.name + '！');

// 👇 新增：计算合成棋子的屏幕坐标，生成特效
      var ex = 0, ey = 0;
      if (keep.loc.type === 'bench') {
        var br = benchRect(keep.loc.index);
        ex = br.x + br.w / 2;
        ey = br.y + br.h / 2;
      } else if (keep.loc.type === 'board') {
        var cc = cellCenter(keep.loc.col, keep.loc.row);
        ex = cc.x;
        ey = cc.y;
      }
      if (ex > 0) {
        G.combineEffects.push({
          x: ex, y: ey,
          star: newStar,
          startTime: G.time,
          duration: 1000 // 动画持续 1 秒
        });
      }


      changed = true; break;
    }
  }
}
  /* ---------- 自动上场：备战席棋子按顺序填满棋盘空位 ---------- */
function autoDeployFromBench() {
  if (G.state !== STATE.PREPARE) return;

  var onBoard = countPlayerUnitsOnBoard();
  if (onBoard >= G.level) return;   // 人口已满，不上阵

  // 按备战席索引从左到右依次上场
  for (var i = 0; i < BENCH.count; i++) {
    if (onBoard >= G.level) break;
    var u = G.playerBench[i];
    if (!u) continue;

    // 找棋盘空位，从靠近中线的一排（r=4）开始，从左到右，从上到下
    var placed = false;
    for (var r = 4; r < 8 && !placed; r++) {
      for (var c = 0; c < 7 && !placed; c++) {
        if (!G.playerBoard[r][c]) {
          G.playerBoard[r][c] = u;
          G.playerBench[i] = null;
          onBoard++;
          placed = true;
        }
      }
    }
  }
}

/* ---------- 羁绊统计 ---------- */
function getActiveTraits() {
  // 用 Set 去重：每个 charId 只贡献一次羁绊计数
  var seenChars = {};   // 已经统计过的角色 id
  var counts = {};

  for (var r = 4; r < 8; r++)
    for (var c = 0; c < 7; c++) {
      var u = G.playerBoard[r][c];
      if (!u) continue;
      if (seenChars[u.charId]) continue;   // 同名角色不重复计
      seenChars[u.charId] = true;

      for (var i = 0; i < u.traits.length; i++)
        counts[u.traits[i]] = (counts[u.traits[i]] || 0) + 1;
    }

  var result = {};
  for (var name in TRAITS) {
    var n = counts[name] || 0;
    var t = TRAITS[name];
    var tier = -1;
    for (var i = t.tiers.length - 1; i >= 0; i--)
      if (n >= t.tiers[i]) { tier = i; break; }
    result[name] = { count: n, tier: tier };
  }
  return result;
}

function getTraitBonuses(units) {
  var seenChars = {};
  var counts = {};

  for (var i = 0; i < units.length; i++) {
    var u = units[i];
    if (seenChars[u.charId]) continue;   // 同名去重
    seenChars[u.charId] = true;

    for (var j = 0; j < u.traits.length; j++) {
      var t = u.traits[j];
      counts[t] = (counts[t] || 0) + 1;
    }
  }

  var bonus = { hpMul:0, atkMul:0, asMul:0, armorAdd:0, lifesteal:0, manaBonus:0 };
  for (var name in TRAITS) {
    var n = counts[name] || 0;
    if (n === 0) continue;
    var trait = TRAITS[name];
    var tier = -1;
    for (var i = trait.tiers.length - 1; i >= 0; i--)
      if (n >= trait.tiers[i]) { tier = i; break; }
    if (tier < 0) continue;
    var eff = trait.effects[tier] || {};
    for (var k in eff) bonus[k] = (bonus[k] || 0) + eff[k];
  }
  return bonus;
}

/* ---------- 图片加载 ---------- */
var IMG = {};
function loadImage(key, src) {
  var img = new Image();
  img.onload  = function() { IMG[key] = img; };
  img.onerror = function() { IMG[key] = null; };
  img.src = src;
  IMG[key] = undefined; // undefined=加载中；null=失败；Image=成功
}
function loadAllCharImages() {
  for (var i = 0; i < CHARS.length; i++) {
    var id = CHARS[i].id;
    //loadImage('sprite_'   + id, 'images/sprite_'   + id + '.png');
    loadImage('portrait_' + id, 'images/portrait_' + id + '.png');
  }
  loadImage('title', 'images/title.png');
  for (var m = 1; m <= 6; m++) loadImage('map' + m, 'images/map' + m + '.jpg');

  loadImage('board_bg', 'images/board_bg.png'); 
}

/* ---------- 快捷键默认配置 ---------- */
var DEFAULT_HOTKEYS = {
  buy1: '1',
  buy2: '2',
  buy3: '3',
  buy4: '4',
  buy5: '5',
  sell: 'd',
  refresh: 'r',
  buyExp: 'f',
};

/* ---------- 从 localStorage 读取快捷键 ---------- */
function loadHotkeys() {
  try {
    var raw = localStorage.getItem('shuihu_hotkeys');
    if (raw) {
      var obj = JSON.parse(raw);
      // 合并默认值，防止字段缺失
      var result = {};
      for (var k in DEFAULT_HOTKEYS) {
        result[k] = obj[k] || DEFAULT_HOTKEYS[k];
      }
      return result;
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_HOTKEYS));
}

/* ============================================================
   地形生成
   - 每回合在「上半场」(r=0~3) 随机放 4~6 个特殊地形
   - 镜像到下半场 (r' = 7 - r)，保证双方机会均等
   ============================================================ */
   function generateTerrainForRound() {
    var grid = [];
    for (var r = 0; r < BOARD.rows; r++) {
      grid.push(new Array(BOARD.cols).fill('plain'));
    }
  
    var types = ['water', 'forest', 'road'];
    var count = 4 + Math.floor(Math.random() * 3); // 4 ~ 6 对
    var placed = 0, tries = 0;
  
    while (placed < count && tries < 200) {
      tries++;
      var r = Math.floor(Math.random() * 4);       // 0~3
      var c = Math.floor(Math.random() * BOARD.cols);
      if (grid[r][c] !== 'plain') continue;
  
      var t = types[Math.floor(Math.random() * types.length)];
      grid[r][c] = t;
      grid[BOARD.rows - 1 - r][c] = t;             // 镜像
      placed++;
    }
  
    return grid;
  }
  
  /* 统计本回合地形构成（用于开场提示） */
  function summarizeTerrain(grid) {
    if (!grid) return '';
    var counts = {};
    for (var r = 0; r < BOARD.rows; r++)
      for (var c = 0; c < BOARD.cols; c++) {
        var t = grid[r][c];
        if (t && t !== 'plain') counts[t] = (counts[t] || 0) + 1;
      }
    var parts = [];
    for (var k in counts) {
      parts.push((TERRAIN_TYPES[k] ? TERRAIN_TYPES[k].name : k) + ' ×' + counts[k]);
    }
    return parts.length ? parts.join('  ') : '无特殊地形';
  }

/* ---------- 保存快捷键到 localStorage ---------- */
function saveHotkeys() {
  try {
    localStorage.setItem('shuihu_hotkeys', JSON.stringify(G.hotkeys));
  } catch (e) { /* ignore */ }
}

/* ============================================================
   羁绊详情弹窗
   ============================================================ */
   function drawTraitDetail() {
    if (!G.traitDetailOpen) return;
  
    var name = G.traitDetailOpen;
    var trait = TRAITS[name];
    if (!trait) { G.traitDetailOpen = null; return; }
  
    var active = getActiveTraits();
    var info = active[name] || { count: 0, tier: -1 };
  
    // 遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
  
    // 弹窗
    var pw = 560, ph = 440;
    var px = (W - pw) / 2, py = (H - ph) / 2;
    drawPanel(px, py, pw, ph, {
      fill: '#181822', stroke: trait.color, r: 8, lw: 2
    });
  
    // 标题
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillStyle = trait.color;
    ctx.fillText(name, px + 24, py + 38);
  
    ctx.font = '13px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText(trait.desc, px + 24, py + 66);
  
    // 当前数量
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = C.text;
    ctx.fillText('当前上阵: ' + info.count + ' 个', px + 24, py + 96);
  
    // 档位进度条
    var lastTier = trait.tiers[trait.tiers.length - 1];
    var barY = py + 116;
    var barW = pw - 48;
    var segW = barW / lastTier;
  
    for (var i = 0; i < lastTier; i++) {
      var bx = px + 24 + i * segW;
      var filled = i < info.count;
      ctx.fillStyle = filled ? trait.color : 'rgba(80,80,100,0.4)';
      roundRect(bx + 1, barY, segW - 2, 12, 2);
      ctx.fill();
    }
  
    // 档位数字
    for (var i = 0; i < trait.tiers.length; i++) {
      var t = trait.tiers[i];
      var tx = px + 24 + t * segW - segW / 2;
      ctx.font = 'bold 11px ' + FONT;
      ctx.fillStyle = (info.count >= t) ? trait.color : C.textDim;
      ctx.textAlign = 'center';
      ctx.fillText(t, tx, barY + 26);
    }
  
    // 分隔线
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 24, py + 158);
    ctx.lineTo(px + pw - 24, py + 158);
    ctx.stroke();
  
    // 关联角色
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('关联角色', px + 24, py + 180);
  
    var members = CHARS.filter(function(c){
      return c.traits.indexOf(name) >= 0;
    });
  
    // 统计已上场 / 备战席
    var onBoard = {};
    for (var r = 4; r < 8; r++)
      for (var c = 0; c < 7; c++) {
        var u = G.playerBoard[r][c];
        if (u) onBoard[u.charId] = (onBoard[u.charId] || 0) + 1;
      }
    var onBench = {};
    for (var i = 0; i < BENCH.count; i++) {
      var ub = G.playerBench[i];
      if (ub) onBench[ub.charId] = (onBench[ub.charId] || 0) + 1;
    }
  
    // 3 列网格
    var startY = py + 200;
    var colW = (pw - 48) / 3;
    var rowH = 62;
  
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var col = i % 3;
      var row = Math.floor(i / 3);
      var mx = px + 24 + col * colW;
      var my = startY + row * rowH;
  
      var onBoardCount = onBoard[m.id] || 0;
      var onBenchCount = onBench[m.id] || 0;
      var owned = onBoardCount + onBenchCount;
  
      var borderColor, bgColor;
      if (onBoardCount > 0) {
        borderColor = '#e8c84a'; bgColor = 'rgba(60,50,30,0.7)';
      } else if (owned > 0) {
        borderColor = '#8ac8e8'; bgColor = 'rgba(40,50,60,0.6)';
      } else {
        borderColor = 'rgba(80,80,100,0.5)'; bgColor = 'rgba(24,24,34,0.6)';
      }
  
      ctx.fillStyle = bgColor;
      roundRect(mx, my, colW - 6, rowH - 6, 4);
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = onBoardCount > 0 ? 2 : 1;
      ctx.stroke();
  
      // 小棋子
      drawUnitFigure(mx + 22, my + rowH/2 - 4, 0.55, m, { star: 1, seed: i });
  
      // 名字
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px ' + FONT;
      ctx.fillStyle = owned > 0 ? '#fff' : C.textDim;
      ctx.fillText(m.name, mx + 44, my + 15);
  
      // 费用
      ctx.font = '10px ' + FONT;
      ctx.fillStyle = COST_COLOR[m.cost];
      ctx.fillText(m.cost + ' 金', mx + 44, my + 30);
  
      // 状态
      ctx.font = '9px ' + FONT;
      if (onBoardCount > 0) {
        ctx.fillStyle = '#e8c84a';
        ctx.fillText('★ 上场 x' + onBoardCount, mx + 44, my + 45);
      } else if (owned > 0) {
        ctx.fillStyle = '#8ac8e8';
        ctx.fillText('备战 x' + owned, mx + 44, my + 45);
      } else {
        ctx.fillStyle = 'rgba(150,150,150,0.6)';
        ctx.fillText('未购买', mx + 44, my + 45);
      }
    }
  
    // 关闭按钮
    pushButton(px + pw - 100, py + ph - 46, 80, 32, '关 闭', function(){
      G.traitDetailOpen = null;
    }, {});
  }

  /* 安全读取地形，任何越界/未初始化都返回 'plain' */
  function getTerrainAt(r, c) {
   if (!G.terrain || !G.terrain[r]) return 'plain';
   var t = G.terrain[r][c];
   return t || 'plain';
}