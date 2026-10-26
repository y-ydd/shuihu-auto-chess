/* ---------- 4 向 sprite 配置表 ---------- */
var DIR_SPRITE = {
  shiqian: {
    file: 'images/sprite_shiqian_4dir.png', // 👈 确认文件名对不对
    cols: 4, 
    rows: 1, 
    rowMap: { s: 0, e: 1, n: 2, w: 3 },
    targetHMultiplier: 28 // 👈 如果觉得小，把 24 改成 28 或 32 会变大
  }
};


/* ============================================================
   render.js —— 通用绘制组件 + 棋子绘制（图片优先，程序化兜底）
   ============================================================ */
'use strict';

/* ---------- 面板 / 按钮 ---------- */
function drawPanel(x, y, w, h, opts) {
  opts = opts || {};
  ctx.fillStyle = opts.fill || C.panel;
  roundRect(x, y, w, h, opts.r || 6);
  ctx.fill();
  if (opts.stroke !== false) {
    ctx.strokeStyle = opts.stroke || C.border;
    ctx.lineWidth = opts.lw || 1.5;
    ctx.stroke();
  }
}

var buttons = [];
function pushButton(x, y, w, h, label, onClick, opts) {
  buttons.push({ x:x, y:y, w:w, h:h, label:label, onClick:onClick, opts:opts || {} });
}
function drawButton(b) {
  if (b.opts && b.opts.invisible) return;
  var hover = inRect(G.mouse.x, G.mouse.y, b);
  var isPrimary = b.opts.primary;
  var g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  if (isPrimary) {
    g.addColorStop(0, hover ? '#a83030' : '#8a2020');
    g.addColorStop(1, hover ? '#6a1818' : '#4a1010');
  } else {
    g.addColorStop(0, hover ? '#2a2a3a' : '#1e1e2c');
    g.addColorStop(1, hover ? '#1a1a26' : '#12121c');
  }
  ctx.fillStyle = g;
  roundRect(b.x, b.y, b.w, b.h, 6); ctx.fill();

  ctx.strokeStyle = isPrimary ? (hover ? C.gold : C.goldDim)
                              : (hover ? C.borderHi : C.border);
  ctx.lineWidth = 1.8; ctx.stroke();

  ctx.font = 'bold 18px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isPrimary ? C.gold : C.text;
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
}

/* ---------- 图片优先的 sprite 绘制 ---------- */
function tryDrawSprite(charId, cx, cy, scale, opts) {
  opts = opts || {};
  var img = IMG['sprite_' + charId];
  if (!img || !img.complete || img.naturalWidth === 0) return false;

  var char = CHAR_BY_ID[charId];
  var s = scale * (char.size || 1);

  // 图片版小人高度：只占 15 格（比程序化小人再小一档）
  var targetH = 15 * PX_BASE * s;
  var ratio = img.naturalWidth / img.naturalHeight;
  var targetW = targetH * ratio;

  // 呼吸浮动：跟程序化小人的节拍一致
  var seed = opts.seed || 0;
  var t = G.time * 0.004 + seed;
  var breathe = Math.round(Math.sin(t) * 1) * (PX_BASE * s);

  ctx.imageSmoothingEnabled = false;

  // 图片整体上移：因为 AI 生成的立绘通常下方留白更多
  var yOffset = -targetH * 0.15;   // 上移 15% 高度

  ctx.drawImage(
    img,
    cx - targetW / 2,
    cy - targetH / 2 + yOffset + breathe,
    targetW,
    targetH
  );

  return true;
}

/* ---------- 头像绘制：优先 portrait_<id>.png ---------- */
function tryDrawPortrait(charId, x, y, w, h) {
  var p = IMG['portrait_' + charId];
  if (p && p.complete && p.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(p, x, y, w, h);
    return true;
  }
  return false;   // 没有 portrait 就返回 false，让调用方 fallback
}

/* ---------- 棋子小人绘制 ---------- */
function drawUnitFigure(cx, cy, scale, char, opts) {
  opts = opts || {};
  var alpha = opts.alpha !== undefined ? opts.alpha : 1;
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ================= 伪 3D 特效：立体底座与动态阴影 =================
  var baseAlpha = 0.35;
  
  // 如果正在跳跃或移动，阴影变小变淡
  if (opts.jumpY && opts.jumpY > 0) {
    baseAlpha = Math.max(0.1, 0.35 - opts.jumpY * 0.05);
  }

  // 1. 绘制暗色底座（模拟 3D 圆形石台）
  ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12 * scale, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 底座外圈高光
  ctx.strokeStyle = 'rgba(120, 100, 60, 0.6)';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  // 2. 绘制动态投影阴影
  ctx.fillStyle = 'rgba(0, 0, 0, ' + baseAlpha + ')';
  ctx.beginPath();
  // 阴影随跳跃高度缩小
  var shadowScale = 1 - (opts.jumpY || 0) * 0.02;
  ctx.ellipse(cx, cy + 12 * scale, 12 * scale * shadowScale, 4 * scale * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. 处理朝向翻转
  if (opts.facing === 'w') {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }

  // 4. 根据跳跃高度整体上浮 (opts.jumpY 由外部传入)
  var finalCy = cy - (opts.jumpY || 0);

  // ================= 原来的棋子绘制 =================
  // 优先级 1: 尝试 4 向图
  if (typeof tryDrawDirSprite === 'function' && 
      tryDrawDirSprite(char.id, cx, finalCy, scale, opts)) {
    if (opts.star && opts.star > 1) drawStarBadge(cx, finalCy, scale * char.size, opts.star);
    if (opts.selected) drawSelectRing(cx, finalCy, scale * char.size);
    ctx.restore();
    return;
  }

  // 优先级 2: 单方向图片
  if (typeof tryDrawSprite === 'function' && 
      tryDrawSprite(char.id, cx, finalCy, scale, opts)) {
    if (opts.star && opts.star > 1) drawStarBadge(cx, finalCy, scale * char.size, opts.star);
    if (opts.selected) drawSelectRing(cx, finalCy, scale * char.size);
    ctx.restore();
    return;
  }

  // 优先级 3: 程序化像素小人
  drawPixelUnit(cx, finalCy, scale, char, opts);

  ctx.restore();
}

/* ============================================================
   像素风棋子绘制
   网格：16 宽 × 22 高，中心点 (8, 11)
   ============================================================ */
   var PX_BASE = 2.4;   // scale=1 时每像素格的屏幕大小

   function px(gx, gy, gw, gh, color, PX, ox, oy) {
     ctx.fillStyle = color;
     ctx.fillRect(ox + gx * PX, oy + gy * PX, gw * PX, gh * PX);
   }
   
   function drawPixelUnit(cx, cy, scale, char, opts) {
    opts = opts || {};
    var s = scale * (char.size || 1);
    var PX = PX_BASE * s; // 每个像素格的大小
  
    var seed = opts.seed || 0;
    var t = G.time * 0.004 + seed;
    var breathe = Math.round(Math.sin(t) * 1); // 呼吸浮动
  
    // ================= 处理动作偏移 =================
    // 1. 跑动跳跃 (jumpY)
    var jumpY = 0;
    if (opts.moving) {
      jumpY = Math.abs(Math.sin(G.time / 80 + seed)) * 3;
    }
    // 2. 攻击前冲
    var atkX = opts.attackOffsetX || 0;
    var atkY = opts.attackOffsetY || 0;
  
    // 最终绘制中心点
    var drawX = cx + atkX;
    var drawY = cy - jumpY + atkY;
  
    // ================= 处理朝向翻转 =================
    ctx.save();
    if (opts.facing === 'w') {
      // 朝左，水平翻转
      ctx.translate(drawX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-drawX, 0);
    }
  
    // 网格原点（以中心点向左偏移 8 格，向上偏移 12 格）
    var ox = drawX - 8 * PX;
    var oy = drawY - 12 * PX + breathe * PX;
  
    // ================= 色板设定 =================
    var c1 = char.color;       // 衣服主色
    var c2 = char.color2;      // 头发/头巾/次色
    
    var skin = '#fce3c8';      // 肤色
    var skinDark = '#d9a884';  // 肤色暗部
    var hair = '#1a1a1a';      // 纯黑（描边/眼睛）
    var eyeWhite = '#ffffff';
    
    // 光影计算
    var c1Light = shade(c1, 0.25);
    var c1Dark  = shade(c1, -0.25);
    var c2Light = shade(c2, 0.25);
    var c2Dark  = shade(c2, -0.25);
  
    // ================= 开始绘制 =================
    
    // 1. 脚下阴影
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 11 * PX, 7 * PX, 2 * PX, 0, 0, Math.PI * 2);
    ctx.fill();
  
    // 2. 腿部（深色）
    px(5, 19, 2, 3, c1Dark, PX, ox, oy);
    px(9, 19, 2, 3, c1Dark, PX, ox, oy);
    // 鞋子（黑色）
    px(4, 22, 3, 1, hair, PX, ox, oy);
    px(9, 22, 3, 1, hair, PX, ox, oy);
  
    // 3. 身体（衣服）
    px(4, 13, 8, 6, c1, PX, ox, oy); 
    px(4, 13, 2, 6, c1Light, PX, ox, oy); // 左侧高光
    px(10, 13, 2, 6, c1Dark, PX, ox, oy); // 右侧暗部
    
    // 领口（V领露脖子）
    px(7, 13, 2, 1, skin, PX, ox, oy);
    px(6, 14, 4, 1, skinDark, PX, ox, oy);
    
    // 腰带与扣子
    px(4, 17, 8, 1, c2, PX, ox, oy);
    px(7, 17, 2, 1, '#e8c84a', PX, ox, oy); // 金色扣子
  
    // 4. 头部（大头 Q 版）
    // 脖子
    px(7, 11, 2, 2, skinDark, PX, ox, oy);
    
    // 脸部基础
    px(4, 3, 8, 8, skin, PX, ox, oy);
    // 圆角修饰（切掉四个角）
    px(3, 4, 1, 6, skin, PX, ox, oy);
    px(12, 4, 1, 6, skin, PX, ox, oy);
    px(5, 2, 6, 1, skin, PX, ox, oy);
    // 下巴
    px(5, 11, 6, 1, skin, PX, ox, oy);
    // 侧脸暗部
    px(11, 4, 1, 6, skinDark, PX, ox, oy);
  
    // 5. 头发 / 头巾
    px(4, 1, 8, 3, c2, PX, ox, oy);
    px(3, 2, 1, 4, c2, PX, ox, oy);
    px(12, 2, 1, 4, c2Dark, PX, ox, oy);
    // 头发高光
    px(5, 1, 4, 1, c2Light, PX, ox, oy);
    px(4, 2, 1, 1, c2Light, PX, ox, oy);
  
    // 6. 五官（如果是背面，不画五官）
    if (opts.facing !== 'n') {
      var isSide = (opts.facing === 'e' || opts.facing === 'w');
      
      if (isSide) {
        // 侧面（只画一只眼睛）
        px(8, 6, 2, 3, eyeWhite, PX, ox, oy);
        px(9, 7, 1, 2, hair, PX, ox, oy);
        // 腮红
        px(7, 9, 1, 1, 'rgba(240,100,100,0.6)', PX, ox, oy);
      } else {
        // 正面（两只眼睛）
        px(5, 6, 2, 3, eyeWhite, PX, ox, oy);
        px(9, 6, 2, 3, eyeWhite, PX, ox, oy);
        
        px(5, 7, 2, 2, hair, PX, ox, oy);
        px(9, 7, 2, 2, hair, PX, ox, oy);
        
        // 眼神高光（精髓）
        px(5, 7, 1, 1, eyeWhite, PX, ox, oy);
        px(9, 7, 1, 1, eyeWhite, PX, ox, oy);
        
        // 腮红
        px(4, 9, 1, 1, 'rgba(240,100,100,0.6)', PX, ox, oy);
        px(11, 9, 1, 1, 'rgba(240,100,100,0.6)', PX, ox, oy);
      }
      // 嘴巴（点）
      px(7, 10, 2, 1, skinDark, PX, ox, oy);
    }
  
    // 7. 武器
    // 根据不同朝向，武器挂载位置微调（朝左时武器在左侧）
    var wpnX = (opts.facing === 'w') ? ox - 4 * PX : ox + 12 * PX;
    var wpnY = oy + 15 * PX;
    drawPixelWeaponSmall(wpnX, wpnY, PX, char.weapon, c2, c2Light);
  
    // 8. 星级
    if (opts.star && opts.star > 1) {
      var stars = '★'.repeat(opts.star);
      var fs = Math.max(8, Math.round(10 * s));
      ctx.font = 'bold ' + fs + 'px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      var starY = oy - 2 * PX;
      ctx.strokeText(stars, cx, starY);
      ctx.fillStyle = '#e8c84a';
      ctx.fillText(stars, cx, starY);
    }
  
    // 9. 选中光圈
    if (opts.selected) {
      ctx.strokeStyle = '#e8c84a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 11 * PX, 8 * PX, 2.5 * PX, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  
    ctx.restore();
  }
  
  /* ---------- 小尺寸武器（Q 版） ---------- */
  function drawPixelWeaponSmall(ox, oy, PX, type, c2, c2Light) {
    var steel = '#c8d0e0';
    var steelDark = '#8a90a8';
    var gold = '#e8c84a';
    var wood = '#5a3a1a';
  
    switch (type) {
      case 'spear':
        px(2, -8, 1, 16, wood, PX, ox, oy);
        px(2, -9, 1, 1, steel, PX, ox, oy);
        px(1, -8, 3, 1, steel, PX, ox, oy);
        break;
      case 'guandao':
        px(2, -8, 1, 16, wood, PX, ox, oy);
        px(2, -9, 1, 1, steel, PX, ox, oy);
        px(3, -8, 1, 1, steel, PX, ox, oy);
        px(3, -7, 1, 2, steel, PX, ox, oy);
        break;
      case 'axe':
        px(2, -3, 1, 11, wood, PX, ox, oy);
        px(2, -3, 3, 3, steel, PX, ox, oy);
        px(4, -2, 1, 1, steelDark, PX, ox, oy);
        break;
      case 'mace':
        px(2, -3, 1, 11, wood, PX, ox, oy);
        px(1, -5, 4, 3, steel, PX, ox, oy);
        px(1, -5, 4, 1, steelDark, PX, ox, oy);
        break;
      case 'sword':
        px(2, 3, 1, 4, wood, PX, ox, oy);
        px(1, 3, 3, 1, gold, PX, ox, oy);
        px(2, -5, 1, 8, steel, PX, ox, oy);
        px(2, -6, 1, 1, '#ffffff', PX, ox, oy);
        break;
      case 'bow':
        px(3, -5, 1, 1, wood, PX, ox, oy);
        px(4, -4, 1, 8, wood, PX, ox, oy);
        px(3, 4, 1, 1, wood, PX, ox, oy);
        px(3, -5, 1, 10, '#e8e0c0', PX, ox, oy);
        break;
      case 'staff':
        px(2, -7, 1, 15, wood, PX, ox, oy);
        px(1, -8, 3, 2, gold, PX, ox, oy);
        break;
      case 'fist':
        px(2, 2, 2, 2, '#f0d0a8', PX, ox, oy);
        break;
      case 'dagger':
        px(2, -1, 1, 5, wood, PX, ox, oy);
        px(2, -4, 1, 3, steel, PX, ox, oy);
        break;
      case 'fan':
        px(1, -2, 4, 3, c2Light, PX, ox, oy);
        px(1, -2, 4, 1, gold, PX, ox, oy);
        px(2, 2, 1, 3, wood, PX, ox, oy);
        break;
      case 'whip':
        px(2, -4, 1, 3, c2, PX, ox, oy);
        px(3, -1, 1, 3, c2, PX, ox, oy);
        px(2, 2, 1, 3, c2, PX, ox, oy);
        break;
    }
  }
   
   /* ============================================================
      像素武器绘制（相对网格坐标）
      ============================================================ */
   function drawPixelWeapon(ox, oy, PX, type, c2, c2Light) {
     var steel = '#c8d0e0';
     var steelDark = '#8a90a8';
     var gold = '#e8c84a';
     var wood = '#5a3a1a';
     var woodDark = '#3a2410';
   
     switch (type) {
       case 'spear':
         px(13, 2, 1, 19, wood, PX, ox, oy);
         px(13, 1, 1, 1, steel, PX, ox, oy);
         px(12, 2, 3, 1, steel, PX, ox, oy);
         break;
   
       case 'guandao':
         px(13, 2, 1, 19, wood, PX, ox, oy);
         px(13, 1, 1, 1, steel, PX, ox, oy);
         px(14, 2, 1, 1, steel, PX, ox, oy);
         px(14, 3, 1, 2, steel, PX, ox, oy);
         px(13, 5, 2, 1, steelDark, PX, ox, oy);
         break;
   
       case 'axe':
         px(13, 6, 1, 13, wood, PX, ox, oy);
         px(13, 6, 3, 3, steel, PX, ox, oy);
         px(13, 6, 1, 1, steelDark, PX, ox, oy);
         px(15, 7, 1, 1, steelDark, PX, ox, oy);
         break;
   
       case 'mace':
         px(13, 8, 1, 11, wood, PX, ox, oy);
         px(12, 6, 4, 3, steel, PX, ox, oy);
         px(12, 6, 4, 1, steelDark, PX, ox, oy);
         px(11, 7, 1, 1, steel, PX, ox, oy);
         px(16, 7, 1, 1, steel, PX, ox, oy);
         break;
   
       case 'sword':
         px(13, 14, 1, 4, wood, PX, ox, oy);
         px(12, 14, 3, 1, gold, PX, ox, oy);
         px(13, 5, 1, 9, steel, PX, ox, oy);
         px(13, 4, 1, 1, '#ffffff', PX, ox, oy);
         break;
   
       case 'bow':
         px(14, 6, 1, 1, wood, PX, ox, oy);
         px(15, 7, 1, 8, wood, PX, ox, oy);
         px(14, 15, 1, 1, wood, PX, ox, oy);
         px(14, 6, 1, 10, '#e8e0c0', PX, ox, oy);
         px(13, 10, 2, 1, steel, PX, ox, oy);
         break;
   
       case 'staff':
         px(13, 3, 1, 18, wood, PX, ox, oy);
         px(12, 2, 3, 2, gold, PX, ox, oy);
         px(13, 1, 1, 1, gold, PX, ox, oy);
         px(12, 2, 3, 1, shade(gold, 0.2), PX, ox, oy);
         break;
   
       case 'fist':
         px(13, 11, 2, 1, c2, PX, ox, oy);
         px(13, 12, 2, 2, '#f0d0a8', PX, ox, oy);
         break;
   
       case 'dagger':
         px(13, 10, 1, 6, wood, PX, ox, oy);
         px(13, 7, 1, 3, steel, PX, ox, oy);
         px(13, 6, 1, 1, '#ffffff', PX, ox, oy);
         break;
   
       case 'fan':
         px(12, 9, 4, 3, c2Light, PX, ox, oy);
         px(12, 9, 4, 1, gold, PX, ox, oy);
         px(12, 11, 4, 1, shade(c2Light, -0.3), PX, ox, oy);
         px(13, 12, 1, 4, wood, PX, ox, oy);
         break;
   
       case 'whip':
         px(13, 4, 1, 3, c2, PX, ox, oy);
         px(14, 7, 1, 3, c2, PX, ox, oy);
         px(13, 10, 1, 3, c2, PX, ox, oy);
         px(14, 13, 1, 3, c2, PX, ox, oy);
         px(13, 16, 1, 2, c2Light, PX, ox, oy);
         break;
   
       default:
         break;
     }
   }

function drawStarBadge(cx, cy, s, star) {
  var stars = '★'.repeat(star);
  ctx.font = 'bold ' + Math.max(8, Math.round(9 * s)) + 'px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.strokeText(stars, cx, cy - 26 * s);
  ctx.fillStyle = '#e8c84a';
  ctx.fillText(stars, cx, cy - 26 * s);
}
function drawSelectRing(cx, cy, s) {
  ctx.strokeStyle = '#e8c84a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 2 * s, 20 * s, 0, Math.PI * 2); ctx.stroke();
}

function drawWeapon(x, y, s, type, color) {
  ctx.strokeStyle = color || '#888';
  ctx.fillStyle   = color || '#888';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  switch (type) {
    case 'axe':
      ctx.beginPath(); ctx.moveTo(x - 2*s, y + 8*s); ctx.lineTo(x + 6*s, y - 8*s); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 7*s, y - 9*s, 4*s, 0, Math.PI*2); ctx.fill(); break;
    case 'spear':
      ctx.beginPath(); ctx.moveTo(x - 4*s, y + 12*s); ctx.lineTo(x + 8*s, y - 12*s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 8*s, y - 12*s); ctx.lineTo(x + 11*s, y - 15*s); ctx.stroke(); break;
    case 'guandao':
      ctx.beginPath(); ctx.moveTo(x - 3*s, y + 12*s); ctx.lineTo(x + 7*s, y - 12*s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 7*s, y - 12*s);
      ctx.quadraticCurveTo(x + 14*s, y - 10*s, x + 10*s, y - 4*s); ctx.stroke(); break;
    case 'bow':
      ctx.beginPath(); ctx.arc(x, y, 9*s, -Math.PI*0.6, Math.PI*0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 5*s, y - 7*s); ctx.lineTo(x - 5*s, y + 7*s); ctx.stroke(); break;
    case 'sword':
      ctx.beginPath(); ctx.moveTo(x - 1*s, y + 10*s); ctx.lineTo(x + 3*s, y - 12*s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 4*s, y + 8*s);  ctx.lineTo(x + 2*s, y + 8*s);  ctx.stroke(); break;
    case 'staff':
      ctx.beginPath(); ctx.moveTo(x - 5*s, y + 12*s); ctx.lineTo(x + 5*s, y - 12*s); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 5*s, y - 12*s, 3*s, 0, Math.PI*2); ctx.fill(); break;
    case 'mace':
      ctx.beginPath(); ctx.moveTo(x - 2*s, y + 8*s); ctx.lineTo(x + 4*s, y - 6*s); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 5*s, y - 8*s, 5*s, 0, Math.PI*2); ctx.fill(); break;
    case 'fist':
      ctx.beginPath(); ctx.arc(x + 2*s, y + 2*s, 4*s, 0, Math.PI*2); ctx.fill(); break;
    case 'fan':
      ctx.beginPath(); ctx.arc(x + 3*s, y - 2*s, 7*s, -Math.PI*0.8, Math.PI*0.2); ctx.fill(); break;
    case 'dagger':
      ctx.beginPath(); ctx.moveTo(x, y + 4*s); ctx.lineTo(x + 2*s, y - 6*s); ctx.stroke(); break;
    case 'whip':
      ctx.beginPath(); ctx.moveTo(x - 3*s, y + 10*s);
      ctx.quadraticCurveTo(x + 8*s, y + 2*s, x + 2*s, y - 10*s); ctx.stroke(); break;
  }
}
  
  function loadDirSprites() {
    for (var id in DIR_SPRITE) {
      loadImage('dir_sprite_' + id, DIR_SPRITE[id].file);
    }
  }
  
  function tryDrawDirSprite(charId, cx, cy, scale, opts) {
    opts = opts || {};
    var config = DIR_SPRITE[charId];
    if (!config) return false;
  
    var img = IMG['dir_sprite_' + charId];
    if (!img || !img.complete || img.naturalWidth === 0) return false;
  
    var facing = opts.facing || 's';
    var col = config.rowMap[facing];
    if (col === undefined) col = 0;
  
    var frameW = img.naturalWidth / config.cols;
    var frameH = img.naturalHeight / config.rows;
  
    var targetH = config.targetHMultiplier * PX_BASE * scale;
    var ratio = frameW / frameH;
    var targetW = targetH * ratio;
  
    var seed = opts.seed || 0;
    var breathe = Math.round(Math.sin(G.time * 0.004 + seed) * 1);
    
    // 跑动跳跃
    var jumpY = 0;
    if (opts.moving) {
      jumpY = Math.abs(Math.sin(G.time / 80 + seed)) * 3;
    }
  
    ctx.imageSmoothingEnabled = false;
    
    // 裁掉切图时的黑边
    var trimX = 2;
    var trimY = 0;
  
    ctx.drawImage(
      img,
      col * frameW + trimX, 
      0 + trimY, 
      frameW - trimX * 2, 
      frameH - trimY * 2,
      cx - targetW / 2,
      cy - targetH / 2 + breathe - jumpY,
      targetW, targetH
    );
    return true;
  }