/* ============================================================
   ui.js —— 标题 / 准备 / 结算 界面渲染
   ============================================================ */
   'use strict';

   /* ============================================================
      标题界面
      ============================================================ */
      function drawTitle() {
        // 有 title.jpg 就用图片，否则程序化绘制
        var t = IMG['title'];
        if (t && t.complete && t.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false; 
          ctx.drawImage(t, 0, 0, W, H);
          
          // 👇 调用动态特效层
          drawTitleEffects();
          
          // 盖一层半透明黑纱
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(0, 0, W, H);
        } else {
          drawTitleProcedural();
        }
   
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
   
     ctx.font = 'bold 62px ' + FONT;
     ctx.fillStyle = 'rgba(0,0,0,0.55)';
     ctx.fillText('水浒 · 弈阵', W/2 + 3, 138 + 3);
     // 👇 加一圈黑色描边，防止文字糊在背景里
     ctx.strokeStyle = '#000000';
     ctx.lineWidth = 6;
     ctx.strokeText('水浒 · 弈阵', W/2, 138);
   
     var tg = ctx.createLinearGradient(0, 100, 0, 175);
     tg.addColorStop(0,   '#fff0b0');
     tg.addColorStop(0.5, '#e8c84a');
     tg.addColorStop(1,   '#a8781a');
     ctx.fillStyle = tg;
     ctx.fillText('水浒 · 弈阵', W/2, 138);
   
     ctx.font = '16px ' + FONT;
     ctx.fillStyle = 'rgba(240, 220, 180, 0.85)';
     ctx.fillText('—— 梁 山 聚 义 · 自 走 棋 ——', W/2, 190);
   
     if (G.showHelp) {
      drawHelpOverlay();
    } else if (G.hotkeyPanelOpen) {
      // 面板打开时不注册标题按钮
      drawHotkeyPanel();
    } else {
      var bw = 240, bh = 44, bx = (W - bw) / 2;
      pushButton(bx, 268, bw, bh, '开 始 游 戏', startGame, { primary:true });
      
      var modeText = G.aiCount === 1 ? '1v1 单挑' : (G.aiCount === 3 ? '1v3 小混战' : '1v7 大混战');
      pushButton(bx, 320, bw, bh, '模式：' + modeText,
        function(){
          if (G.aiCount === 7) G.aiCount = 1;
          else if (G.aiCount === 1) G.aiCount = 3;
          else G.aiCount = 7;
        });
        
      pushButton(bx, 372, bw, bh, '难度：' + DIFF_NAMES[G.difficulty],
        function(){ G.difficulty = (G.difficulty + 1) % 3; });
      pushButton(bx, 424, bw, bh, '操 作 说 明',
        function(){ G.showHelp = !G.showHelp; });
      pushButton(bx, 476, bw, bh, '快捷键设置',
        function(){
          G.hotkeyPanelOpen = true;
          if (!G.hotkeys) G.hotkeys = loadHotkeys();
        });
      
      // 后面的按钮坐标依次加 52 (如 372 变 424, 424 变 476)
      pushButton(bx, 424, bw, bh, '操 作 说 明',
        function(){ G.showHelp = !G.showHelp; });
      pushButton(bx, 476, bw, bh, '快捷键设置',
        function(){
          G.hotkeyPanelOpen = true;
          if (!G.hotkeys) G.hotkeys = loadHotkeys();
        });
  
      ctx.font = '12px ' + FONT;
      ctx.fillStyle = 'rgba(200, 180, 140, 0.5)';
      ctx.fillText('多文件工程 · Canvas 程序化绘制 · 图片可选加载', W/2, H - 20);
    }
  }
   
/* ============================================================
   封面动态特效
   ============================================================ */
   function drawTitleEffects() {
    // 1. 夕阳呼吸光晕
    var sunX = W * 0.72, sunY = H * 0.55;
    var glow = 40 + Math.sin(G.time * 0.002) * 20; // 呼吸值
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // 叠加发光模式
    var grad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 150 + glow);
    grad.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
    grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
    ctx.restore();
  
    // 2. 水面波光粼粼 (图片底部 20% 是水面)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var waterTop = H * 0.82; // 根据你的图片调整水面起始位置
    for (var i = 0; i < 15; i++) {
      var wx = sunX + Math.sin(G.time * 0.001 + i) * 60 + (i * 15) - 100;
      var wy = waterTop + i * 8;
      var ww = 20 + Math.cos(G.time * 0.003 + i) * 15 + i * 4;
      // 让水面反光有透明度起伏
      var alpha = 0.2 + Math.abs(Math.sin(G.time * 0.002 + i)) * 0.4;
      ctx.fillStyle = 'rgba(255, 180, 100, ' + alpha + ')';
      ctx.fillRect(wx - ww / 2, wy, ww, 1.5);
    }
    ctx.restore();
  
  // 3. 天空飞鸟 (双向飞行)
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 10, 10, 0.8)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  // 往右飞的鸟 (x 从 -100 增加到 W+100)
  var birdTimeRight = (G.time * 0.03) % (W + 200) - 100; 
  // 往左飞的鸟 (x 从 W+100 递减到 -100)
  var birdTimeLeft = W - ((G.time * 0.025) % (W + 200)) + 100; 

  var birds = [
    // 第一组：从左往右飞
    { x: birdTimeRight, y: H * 0.25, size: 5, speed: 1 },
    { x: birdTimeRight + 20, y: H * 0.28, size: 4, speed: 1.2 },
    
    // 第二组：从右往左飞（比第一组飞得稍微高一点）
    { x: birdTimeLeft, y: H * 0.18, size: 6, speed: 1.1 },
    { x: birdTimeLeft + 25, y: H * 0.20, size: 4, speed: 0.9 },
  ];

  for (var b = 0; b < birds.length; b++) {
    var bird = birds[b];
    // 翅膀拍动
    var flap = Math.sin(G.time * 0.015 * bird.speed + b) * 4;
    
    ctx.beginPath();
    // 画 V 字形飞鸟
    ctx.moveTo(bird.x - bird.size, bird.y + flap);
    ctx.quadraticCurveTo(bird.x - bird.size/2, bird.y - bird.size + flap, bird.x, bird.y);
    ctx.quadraticCurveTo(bird.x + bird.size/2, bird.y - bird.size + flap, bird.x + bird.size, bird.y + flap);
    ctx.stroke();
  }
  ctx.restore();
  }

   function drawTitleProcedural() {
     var sky = ctx.createLinearGradient(0, 0, 0, H);
     sky.addColorStop(0.00, '#1a0a14');
     sky.addColorStop(0.30, '#5a1818');
     sky.addColorStop(0.55, '#a83a1a');
     sky.addColorStop(0.78, '#e87a2a');
     sky.addColorStop(1.00, '#3a1a10');
     ctx.fillStyle = sky;
     ctx.fillRect(0, 0, W, H);
   
     var sunX = W * 0.72, sunY = H * 0.55;
     ctx.save();
     ctx.shadowColor = '#ffb050'; ctx.shadowBlur = 90;
     ctx.beginPath(); ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
     ctx.fillStyle = '#ffe08a'; ctx.fill();
     ctx.restore();
   
     drawMountains(0.62, '#3a1414', 70, 0.008);
     drawMountains(0.70, '#2a0e0e', 55, 0.011);
     drawMountains(0.78, '#180808', 40, 0.015);
   
     var water = ctx.createLinearGradient(0, H * 0.78, 0, H);
     water.addColorStop(0, 'rgba(60, 20, 15, 0.85)');
     water.addColorStop(1, 'rgba(10, 5, 8, 0.98)');
     ctx.fillStyle = water;
     ctx.fillRect(0, H * 0.78, W, H * 0.22);
   
     ctx.save(); ctx.globalAlpha = 0.35;
     for (var i = 0; i < 14; i++) {
       var yy = H * 0.79 + i * 9;
       var ww = 20 + Math.sin(G.time * 0.001 + i) * 14 + i * 8;
       ctx.fillStyle = i % 2 === 0 ? '#e88a3a' : '#a84a1a';
       ctx.fillRect(sunX - ww / 2, yy, ww, 1.5);
     }
     ctx.restore();
   
     drawBanner(W * 0.10, H * 0.20, '#e8c84a', '#8a1a1a', '替天行道');
     drawBanner(W * 0.90, H * 0.20, '#e8c84a', '#8a1a1a', '聚义梁山');
   }
   
   function drawMountains(baseYRatio, color, amp, freq) {
     ctx.fillStyle = color;
     ctx.beginPath(); ctx.moveTo(0, H);
     var baseY = H * baseYRatio;
     for (var x = 0; x <= W; x += 20) {
       var y = baseY - Math.sin(x * freq) * amp
                     - Math.sin(x * freq * 2.7 + 1.3) * amp * 0.4;
       ctx.lineTo(x, y);
     }
     ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
   }
   
   function drawBanner(cx, cy, color, textColor, text) {
     var bw = 46, bh = 130, x = cx - bw/2, y = cy;
     ctx.fillStyle = '#2a1a0a';
     ctx.fillRect(cx - 2, y - 30, 4, bh + 60);
     var wave = Math.sin(G.time * 0.0015) * 3;
     ctx.beginPath();
     ctx.moveTo(x, y);
     ctx.quadraticCurveTo(cx + wave, y + bh*0.3, x + bw, y + bh*0.5);
     ctx.lineTo(x + bw, y + bh);
     ctx.quadraticCurveTo(cx + wave, y + bh*0.9, x, y + bh);
     ctx.closePath();
     var g = ctx.createLinearGradient(x, y, x + bw, y + bh);
     g.addColorStop(0, color); g.addColorStop(1, '#a8781a');
     ctx.fillStyle = g; ctx.fill();
     ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = 1.5; ctx.stroke();
   
     ctx.save();
     ctx.font = 'bold 14px ' + FONT;
     ctx.fillStyle = textColor;
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     var chars = text.split('');
     for (var i = 0; i < chars.length; i++)
       ctx.fillText(chars[i], cx + bw * 0.35, y + 22 + i * 20);
     ctx.restore();
   }
   
   function drawHelpOverlay() {
     ctx.fillStyle = 'rgba(0,0,0,0.78)';
     ctx.fillRect(0, 0, W, H);
     var pw = 660, ph = 420;
     var px = (W - pw)/2, py = (H - ph)/2;
     drawPanel(px, py, pw, ph, { fill:'#181822', stroke:C.borderHi, lw:2 });
   
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.font = 'bold 26px ' + FONT;
     ctx.fillStyle = C.gold;
     ctx.fillText('操 作 说 明', W/2, py + 42);
   
     ctx.font = '15px ' + FONT;
     ctx.fillStyle = C.text;
     ctx.textAlign = 'left';
     var lines = [
       '• 准备阶段 25 秒，结束后自动进入战斗',
       '• 点击商店卡牌购买棋子，进入备战席',
       '• 拖动备战席棋子到棋盘下半场即可上阵',
       '• 拖动棋盘棋子可换位或拖回备战席',
       '• 3 个同名同星自动合成升星（最高 3 星）',
       '• 「刷新」2 金， 「经验」4 金',
       '• 每 10 金币吃 1 利息（最多 5）',
       '• 人口上限 = 当前等级',
       '• 10 个羁绊：天罡/地煞/五虎/步兵/豪侠/弓手/水军/刺客/骑兵/法师',
       '• 战斗自动进行，失败方按剩余单位扣血',
       '• 任一方血量归零则对局结束',
       '• images/ 目录可放 sprite_<id>.png 自动替换小人',
     ];
     for (var i = 0; i < lines.length; i++)
       ctx.fillText(lines[i], px + 40, py + 90 + i * 26);
   
     pushButton(W/2 - 60, py + ph - 56, 120, 40, '关 闭',
       function(){ G.showHelp = false; }, {});
   }
   
   /* ============================================================
      准备阶段
      ============================================================ */
      function drawPrepare() {
  // 1. 绘制底层棋盘背景
  if (IMG['board_bg'] && IMG['board_bg'].complete && IMG['board_bg'].naturalWidth > 0) {
    // 铺满画布
    ctx.drawImage(IMG['board_bg'], 0, 0, W, H);
    
    // 2. 盖一层极暗的半透明遮罩，压住背景的亮度，让发光格子和文字更清晰
    ctx.fillStyle = 'rgba(10, 10, 15, 0.35)'; // 0.65 表示 65% 的深色透明度
    ctx.fillRect(0, 0, W, H);
  } else {
    // 如果没有图片，回退到原来的纯黑背景
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
  }
        drawHud();
        drawSidebar();          // ← 新增：左侧图标栏 + 面板
        drawBoard();
        drawBench();
        drawShop();
        drawBottomButtons();
        drawTrashcan();         // ← 新增：垃圾桶
        // 详情面板打开时，右侧战局栏位和沙漏都不渲染，让位给详情
        if (!G.detailOpen) {
           drawPlayerList();
         }
         if (G.dragging) {
          // 如果是拖拽棋子
          if (G.dragging.unit) {
            var u = G.dragging.unit;
            drawUnitFigure(G.mouse.x, G.mouse.y, 1.1,
              CHAR_BY_ID[u.charId], { star: u.star, selected: true, moving: true });
          } 
          // 如果是拖拽装备，画一个半透明的 Emoji 跟手
          else if (G.dragging.from === 'equipBag') {
            var eqId = G.equipBag[G.dragging.index];
            var eq = EQUIP_BY_ID[eqId];
            if (eq) {
              ctx.font = '32px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#fff';
              ctx.fillText(eq.icon, G.mouse.x, G.mouse.y);
            }
          }
        }
        if (G.autoDeploying) drawAutoDeployOverlay();
        if (G.detailOpen) drawUnitDetail();
        if (G.traitDetailOpen) drawTraitDetail();
        if (G.message && G.time - G.messageTime < 1800) drawMessage();
        if (G.hotkeyPanelOpen) drawHotkeyPanel();
      }
   
   function drawHud() {
     drawPanel(0, 0, W, 48, { fill:'#12121a', stroke:C.border, r:0, lw:1 });
     ctx.textBaseline = 'middle';
     ctx.textAlign = 'left';
     ctx.font = 'bold 18px ' + FONT;
   
     ctx.font = 'bold 18px ' + FONT;
     ctx.strokeStyle = '#000'; 
     ctx.lineWidth = 3;
     ctx.strokeText('金 ' + G.gold, 24, 24);
     ctx.fillStyle = C.gold;
     ctx.fillText('金 ' + G.gold, 24, 24);
    
     ctx.fillStyle = C.text;
     ctx.fillText('Lv ' + G.level, 110, 24);
   
     if (G.level < 9) {
       var need = EXP_TABLE[G.level] || 0;
       var bx = 168, by = 17, bw = 60, bh = 14;
       ctx.fillStyle = '#222';
       roundRect(bx, by, bw, bh, 3); ctx.fill();
       ctx.fillStyle = C.expGreen;
       roundRect(bx, by, bw * Math.min(1, G.exp / need), bh, 3); ctx.fill();
       ctx.strokeStyle = C.border; ctx.lineWidth = 1;
       roundRect(bx, by, bw, bh, 3); ctx.stroke();
       ctx.font = 'bold 11px ' + FONT;
       ctx.fillStyle = '#fff';
       ctx.textAlign = 'center';
       ctx.fillText(G.exp + '/' + need, bx + bw/2, by + bh/2 + 0.5);
       ctx.textAlign = 'left';
     }
   
     ctx.font = 'bold 18px ' + FONT;
     ctx.fillStyle = C.text;
     ctx.fillText('回合 ' + G.round, 250, 24);
   
     var onBoard = countPlayerUnitsOnBoard();
     ctx.fillStyle = onBoard >= G.level ? C.red : C.textDim;
     ctx.fillText('人口 ' + onBoard + '/' + G.level, 370, 24);
   
     if (G.winStreak > 0) {
       ctx.fillStyle = '#e87a3a';
       ctx.fillText('连胜 ' + G.winStreak, 510, 24);
     } else if (G.loseStreak > 0) {
       ctx.fillStyle = '#7a8ab8';
       ctx.fillText('连败 ' + G.loseStreak, 510, 24);
     }
   
  // 退出按钮
  var quitX = W - 44, quitY = 6, quitW = 36, quitH = 36;
  var quitHover = inRect(G.mouse.x, G.mouse.y,
    { x: quitX, y: quitY, w: quitW, h: quitH });

  ctx.fillStyle = quitHover ? 'rgba(160,40,40,0.95)' : 'rgba(30,30,42,0.9)';
  roundRect(quitX, quitY, quitW, quitH, 6);
  ctx.fill();
  ctx.strokeStyle = quitHover ? C.gold : 'rgba(90,90,110,0.6)';
  ctx.lineWidth = 1.5;
  roundRect(quitX, quitY, quitW, quitH, 6);
  ctx.stroke();

  // × 图标
  ctx.strokeStyle = quitHover ? C.gold : C.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(quitX + 12, quitY + 12);
  ctx.lineTo(quitX + 24, quitY + 24);
  ctx.moveTo(quitX + 24, quitY + 12);
  ctx.lineTo(quitX + 12, quitY + 24);
  ctx.stroke();

  /*pushButton(quitX, quitY, quitW, quitH, '', quitToMenu, { invisible: true });*/

  // 血量文字（左移到退出按钮之前）
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px ' + FONT;
  ctx.fillStyle = C.hpRed;
  ctx.fillText('血 ' + G.hp, quitX - 10, 24);
  
    // 中央上方：查看状态提示
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px ' + FONT;
    if (G.viewingOpponentIndex >= 0 && G.ais && G.ais[G.viewingOpponentIndex]) {
      var viewedName = G.ais[G.viewingOpponentIndex].name;
      ctx.fillStyle = 'rgba(232,200,74,0.9)';
      ctx.fillText('正在查看：' + viewedName + '（点自己名字返回）', W/2, 9);
    } else {
      ctx.fillStyle = 'rgba(200,200,180,0.55)';
      ctx.fillText('我的棋盘', W/2, 9);
    }
  
  // 中央：倒计时进度条
    drawTimerBar();
   }

/* ============================================================
   顶部倒计时进度条
   ============================================================ */
   function drawTimerBar() {
    if (G.state === STATE.BATTLE) return;
    var barX = 340, barY = 40, barW = 280, barH = 6;
  
    // 计算进度 + 秒数
    var prog, sec, isAuto = false;
    if (G.autoDeploying) {
      isAuto = true;
      prog = Math.max(0, Math.min(1, 1 - G.autoDeployTimer / 0.7));
      sec = Math.max(0, G.autoDeployTimer).toFixed(1) + 's';
    } else {
      prog = Math.max(0, Math.min(1, G.prepTimer / PREP_TIME));
      sec = Math.max(0, G.prepTimer).toFixed(1) + 's';
    }
  
    // 底色
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    roundRect(barX, barY, barW, barH, 4); ctx.fill();
  
    // 填充
    var color;
    if (isAuto) {
      color = '#e8c84a';
    } else if (prog < 0.25) {
      color = '#d83a3a';
    } else if (prog < 0.5) {
      color = '#e87a3a';
    } else {
      color = '#4ac86a';
    }
  
    ctx.save();
    roundRect(barX, barY, barW, barH, 4);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barW * prog, barH);
    ctx.restore();

   // 边框
    ctx.strokeStyle = 'rgba(232,200,74,0.55)';
    ctx.lineWidth = 1;
    roundRect(barX, barY, barW, barH, 2); ctx.stroke();

   // 数字：放在进度条右侧
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px ' + FONT;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(sec, barX + barW + 8, barY + barH / 2);
    ctx.fillStyle = color;
    ctx.fillText(sec, barX + barW + 8, barY + barH / 2);

  }   
   
   
  function drawSidebar() {
    var px = 6, py = 50;
    var iconSize = 34;
    var gap = 6;

    //drawPanel(px, py, 168, 220, { 
      //fill: 'rgba(10,10,15,0.85)', 
      //stroke: 'rgba(120,100,60,0.5)', 
      //r: 6, lw: 1.5 
    //});
  
    // ---------- 顶部：两个 Tab 横向并排 ----------
    var tabs = [
      { key: 'traits', label: '羁绊', icon: 'hex' },
      { key: 'equips', label: '装备', icon: 'shield' },
    ];
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var tx = px + i * (iconSize + gap);
      var ty = py;
      var isActive = G.sidebarTab === t.key;
      var hover = inRect(G.mouse.x, G.mouse.y,
        { x: tx, y: ty, w: iconSize, h: iconSize });
  
      drawBadge(tx, ty, iconSize, t.icon, isActive, hover, null, null);
  
      pushButton(tx, ty, iconSize, iconSize, '', (function(k){
        return function(){ G.sidebarTab = k; };
      })(t.key), { invisible: true });
    }
  
    // ---------- 内容 ----------
    var startY = py + iconSize + 12;
    if (G.sidebarTab === 'traits') drawTraitList(px, startY);
    else drawEquipList(px, startY);
  }

/* ---------- 顶部 Tab 徽章绘制 ---------- */
function drawBadge(x, y, size, iconType, isActive, isHover, color, count) {
  var cx = x + size / 2;
  var cy = y + size / 2;

  // 底
  ctx.fillStyle = isActive
    ? 'rgba(50,42,24,0.95)'
    : (isHover ? 'rgba(40,40,55,0.95)' : 'rgba(20,20,28,0.9)');
  roundRect(x, y, size, size, 6);
  ctx.fill();

  // 外圈
  if (isActive && color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
  } else {
    ctx.strokeStyle = isHover ? C.gold : 'rgba(90,90,110,0.6)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
  }
  roundRect(x, y, size, size, 6);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 图标
  if (iconType === 'hex') {
    ctx.beginPath();
    for (var k = 0; k < 6; k++) {
      var a = Math.PI / 3 * k - Math.PI / 2;
      var xx = cx + Math.cos(a) * 9;
      var yy = cy + Math.sin(a) * 9;
      if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.closePath();
    ctx.fillStyle = isActive && color ? color : C.textDim;
    ctx.fill();
  } else if (iconType === 'shield') {
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 8);
    ctx.lineTo(cx + 8, cy - 8);
    ctx.lineTo(cx + 8, cy + 1);
    ctx.quadraticCurveTo(cx + 8, cy + 8, cx, cy + 9);
    ctx.quadraticCurveTo(cx - 8, cy + 8, cx - 8, cy + 1);
    ctx.closePath();
    ctx.fillStyle = isActive && color ? color : C.textDim;
    ctx.fill();
  }

  // 右上角数量（可选）
  if (count !== null && count !== undefined) {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + size - 6, y + 6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isActive && color ? color : '#fff';
    ctx.font = 'bold 11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count, x + size - 6, y + 6);
  }
}
  
  /* ---------- 羁绊图标列表 ---------- */
  function drawTraitIcons(px, startY, size, gap) {
    var active = getActiveTraits();
    var names = Object.keys(active).filter(function(n){
      return active[n].count > 0;
    });
    names.sort(function(a, b){
      var ta = active[a].tier, tb = active[b].tier;
      if (ta >= 0 && tb < 0) return -1;
      if (ta < 0 && tb >= 0) return 1;
      return active[b].count - active[a].count;
    });
  
    if (names.length === 0) {
      ctx.fillStyle = 'rgba(20,20,28,0.6)';
      ctx.font = '10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('无', px + size/2, startY + 10);
      return;
    }
  
    var maxShow = 8;
    for (var i = 0; i < names.length && i < maxShow; i++) {
      var name = names[i];
      var info = active[name];
      var trait = TRAITS[name];
      var isActive = info.tier >= 0;
      var y = startY + i * (size + gap);
  
      var badgeHover = inRect(G.mouse.x, G.mouse.y,
        { x: px, y: y, w: size, h: size });
  
      drawBadge(px, y, size, 'hex', isActive, badgeHover, trait.color, info.count);
  
      // 悬停时右侧展开详情
      if (badgeHover) {
        drawTraitTooltip(px + size + 6, y - 4, name, trait, info);
      }
  
      pushButton(px, y, size, size, '', (function(n){
        return function(){ G.traitDetailOpen = n; };
      })(name), { invisible: true });
    }
  
    // 溢出提示
    if (names.length > maxShow) {
      ctx.fillStyle = 'rgba(20,20,28,0.9)';
      roundRect(px, startY + maxShow * (size + gap), size, size, 6);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = C.textDim;
      ctx.font = 'bold 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+' + (names.length - maxShow), px + size/2, startY + maxShow * (size + gap) + size/2);
    }
  }

  function drawTraitList(px, startY) {
    var itemW = 156;
    var itemH = 40;
    var itemGap = 4;
    var pageSize = 6; // 每页显示 6 个
  
    var active = getActiveTraits();
    var names = Object.keys(active).filter(function(n){
      return active[n].count > 0;
    });
    names.sort(function(a, b){
      var ta = active[a].tier, tb = active[b].tier;
      if (ta >= 0 && tb < 0) return -1;
      if (ta < 0 && tb >= 0) return 1;
      return active[b].count - active[a].count;
    });
  
    if (names.length === 0) {
      ctx.fillStyle = 'rgba(20,20,28,0.8)';
      roundRect(px, startY, itemW, 32, 5); ctx.fill();
      ctx.font = '11px ' + FONT;
      ctx.fillStyle = C.textDim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无激活羁绊', px + itemW/2, startY + 16);
      return;
    }
  
    // 计算总页数
    var totalPages = Math.ceil(names.length / pageSize);
    // 防止页码越界
    if (G.sidebarPage >= totalPages) G.sidebarPage = totalPages - 1;
    if (G.sidebarPage < 0) G.sidebarPage = 0;
  
    // 截取当前页的数据
    var startIndex = G.sidebarPage * pageSize;
    var currentPageItems = names.slice(startIndex, startIndex + pageSize);
  
    for (var i = 0; i < currentPageItems.length; i++) {
      var name = currentPageItems[i];
      var info = active[name];
      var trait = TRAITS[name];
      var isActive = info.tier >= 0;
      var y = startY + i * (itemH + itemGap);
  
      var hover = inRect(G.mouse.x, G.mouse.y, { x: px, y: y, w: itemW, h: itemH });
  
      // 卡片底
      ctx.fillStyle = isActive
        ? (hover ? 'rgba(55,45,22,0.95)' : 'rgba(32,26,14,0.88)')
        : (hover ? 'rgba(42,42,58,0.92)' : 'rgba(20,20,28,0.82)');
      roundRect(px, y, itemW, itemH, 5);
      ctx.fill();
  
      // 左侧颜色条
      if (isActive) {
        ctx.fillStyle = trait.color;
        roundRect(px, y, 3, itemH, 5);
        ctx.fill();
      }
  
      // 边框
      ctx.strokeStyle = isActive ? trait.color : 'rgba(90,90,110,0.5)';
      ctx.lineWidth = isActive ? 1.5 : 1;
      roundRect(px, y, itemW, itemH, 5);
      ctx.stroke();
  
      // 六边形徽章
      var bcx = px + 22;
      var bcy = y + itemH / 2;
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        var a = Math.PI / 3 * k - Math.PI / 2;
        var xx = bcx + Math.cos(a) * 10;
        var yy = bcy + Math.sin(a) * 10;
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.closePath();
      ctx.fillStyle = isActive ? trait.color : 'rgba(110,110,130,0.55)';
      ctx.fill();
      
      // 内部小暗块
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        var a = Math.PI / 3 * k - Math.PI / 2;
        var xx = bcx + Math.cos(a) * 5;
        var yy = bcy + Math.sin(a) * 5;
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();
  
      // 文字
      var textX = px + 40;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13px ' + FONT;
      ctx.fillStyle = isActive ? '#fff' : C.textDim;
      ctx.fillText(name, textX, y + 13);
  
      ctx.font = '10px ' + FONT;
      if (isActive) {
        ctx.fillStyle = trait.color;
        ctx.fillText('已激活 ' + trait.tiers[info.tier] + ' 档', textX, y + 28);
      } else {
        var next = trait.tiers.find(function(t){ return t > info.count; });
        if (next !== undefined) {
          ctx.fillStyle = 'rgba(180,180,150,0.65)';
          ctx.fillText(info.count + ' / ' + next + ' 还差 ' + (next - info.count), textX, y + 28);
        }
      }
  
      // 右侧数量
      ctx.textAlign = 'right';
      ctx.font = 'bold 17px ' + FONT;
      ctx.fillStyle = isActive ? trait.color : C.textDim;
      ctx.fillText(info.count, px + itemW - 10, y + itemH / 2);
  
      pushButton(px, y, itemW, itemH, '', (function(n){
        return function(){ 
          G.traitDetailOpen = n; 
          G.traitDetailPage = 0; // 👈 确保这里是 page，不是 scroll
        };
      })(name), { invisible: true });
    }
  
    // ================= 渲染分页按钮 =================
    if (totalPages > 1) {
      var pageY = startY + 6 * (itemH + itemGap) + 10; // 6 个卡片下方
  
      // 上一页
      var prevHover = inRect(G.mouse.x, G.mouse.y, { x: px, y: pageY, w: 40, h: 26 });
      ctx.fillStyle = prevHover && G.sidebarPage > 0 ? 'rgba(60,50,30,0.9)' : 'rgba(24,24,34,0.9)';
      roundRect(px, pageY, 40, 26, 4); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = G.sidebarPage > 0 ? C.gold : C.textDim;
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲', px + 20, pageY + 13);
  
      if (G.sidebarPage > 0) {
        pushButton(px, pageY, 40, 26, '', function(){ G.sidebarPage--; }, { invisible: true });
      }
  
      // 页码文本
      ctx.fillStyle = C.textDim;
      ctx.font = '11px ' + FONT;
      ctx.fillText((G.sidebarPage + 1) + ' / ' + totalPages, px + itemW / 2, pageY + 13);
  
      // 下一页
      var nextHover = inRect(G.mouse.x, G.mouse.y, { x: px + itemW - 40, y: pageY, w: 40, h: 26 });
      ctx.fillStyle = nextHover && G.sidebarPage < totalPages - 1 ? 'rgba(60,50,30,0.9)' : 'rgba(24,24,34,0.9)';
      roundRect(px + itemW - 40, pageY, 40, 26, 4); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = G.sidebarPage < totalPages - 1 ? C.gold : C.textDim;
      ctx.fillText('▼', px + itemW - 20, pageY + 13);
  
      if (G.sidebarPage < totalPages - 1) {
        pushButton(px + itemW - 40, pageY, 40, 26, '', function(){ G.sidebarPage++; }, { invisible: true });
      }
    }
  }
  
  /* ---------- 悬停浮现的羁绊详情 ---------- */
  function drawTraitTooltip(x, y, name, trait, info) {
    var text1 = name;
    var text2 = '';
    if (info.tier >= 0) {
      text2 = '已激活 ' + trait.tiers[info.tier] + ' 档';
    } else {
      var next = trait.tiers.find(function(t){ return t > info.count; });
      text2 = next ? '还需 ' + (next - info.count) + ' 个' : '';
    }
  
    ctx.font = 'bold 13px ' + FONT;
    var w1 = ctx.measureText(text1).width;
    ctx.font = '11px ' + FONT;
    var w2 = ctx.measureText(text2).width;
    var pw = Math.max(w1, w2) + 20;
    var ph = 40;
  
    // 背景
    ctx.fillStyle = 'rgba(15,15,22,0.96)';
    roundRect(x, y, pw, ph, 5);
    ctx.fill();
    ctx.strokeStyle = info.tier >= 0 ? trait.color : C.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  
    // 文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px ' + FONT;
    ctx.fillStyle = info.tier >= 0 ? trait.color : '#fff';
    ctx.fillText(text1, x + 10, y + 13);
  
    ctx.font = '11px ' + FONT;
    ctx.fillStyle = 'rgba(200,180,140,0.8)';
    ctx.fillText(text2, x + 10, y + 29);
  }
  
  /* ---------- 装备图标列表（合并同类项+数量角标） ---------- */
function drawEquipList(px, startY) {
  var itemW = 156;
  var itemH = 36;
  var itemGap = 4;

  var equips = G.equipBag || [];

  if (equips.length === 0) {
    ctx.fillStyle = 'rgba(20,20,28,0.8)';
    roundRect(px, startY, itemW, 32, 5); ctx.fill();
    ctx.font = '11px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无装备', px + itemW/2, startY + 16);
    return;
  }

  // 1. 统计每种装备的数量
  var counts = {};
  for (var i = 0; i < equips.length; i++) {
    var id = equips[i];
    counts[id] = (counts[id] || 0) + 1;
  }
  
  // 2. 获取去重后的装备 ID 列表
  var uniqueEqIds = Object.keys(counts);

  // 3. 渲染列表
  for (var i = 0; i < uniqueEqIds.length; i++) {
    var eqId = uniqueEqIds[i];
    var count = counts[eqId];
    var eq = EQUIP_BY_ID[eqId];
    if (!eq) continue;
    
    var y = startY + i * (itemH + itemGap);

    var hover = inRect(G.mouse.x, G.mouse.y, { x: px, y: y, w: itemW, h: itemH });

    // 底框
    ctx.fillStyle = hover ? 'rgba(45,45,60,0.95)' : 'rgba(24,24,34,0.9)';
    roundRect(px, y, itemW, itemH, 5); ctx.fill();
    ctx.strokeStyle = hover ? C.gold : 'rgba(90,90,110,0.5)';
    ctx.lineWidth = 1.5; ctx.stroke();

    // 图标（Emoji）
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    var iconX = px + 20;
    var iconY = y + itemH / 2;
    ctx.fillText(eq.icon, iconX, iconY);

    // 👇 新增：如果有多个，在图标右下角画数量角标
    if (count > 1) {
      var badgeX = iconX + 10;
      var badgeY = iconY + 8;
      
      // 黑色半透明圆底
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 数量文字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px ' + FONT;
      ctx.fillText(count, badgeX, badgeY + 0.5);
    }

    // 名字与描述
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = C.text;
    ctx.fillText(eq.name, px + 40, y + 12);

    ctx.font = '10px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText(eq.desc, px + 40, y + 26);

    // 绑定拖拽逻辑（传入真实的 eqId，然后从背包里找第一个匹配的索引）
    pushButton(px, y, itemW, itemH, '', (function(id){
      return function(){
        // 在背包中找到该装备的第一个索引位置
        var realIndex = G.equipBag.indexOf(id);
        if (realIndex >= 0) {
          G.dragging = { from: 'equipBag', index: realIndex, unit: null };
        }
      };
    })(eqId), { invisible: true });
  }
}
  
  /* ---------- 羁绊列表内容 ---------- */
  function drawTraitsContent(px, py, pw, ph) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('已激活羁绊', px + 10, py + 10);
  
    var active = getActiveTraits();
    var names = Object.keys(active).filter(function(n){
      return active[n].count > 0;
    });
  
    names.sort(function(a, b){
      var ta = active[a].tier, tb = active[b].tier;
      if (ta >= 0 && tb < 0) return -1;
      if (ta < 0 && tb >= 0) return 1;
      return active[b].count - active[a].count;
    });
  
    if (names.length === 0) {
      ctx.font = '11px ' + FONT;
      ctx.fillStyle = C.textDim;
      ctx.textAlign = 'center';
      ctx.fillText('上阵棋子以激活羁绊', px + pw/2, py + ph/2);
      return;
    }
  
    var y0 = py + 26;
    var itemH = 44;
    var maxItems = Math.floor((ph - 26) / itemH);
  
    for (var i = 0; i < names.length && i < maxItems; i++) {
      var name = names[i];
      var info = active[name];
      var trait = TRAITS[name];
      var isActive = info.tier >= 0;
      var iy = y0 + i * itemH;
  
      var hover = inRect(G.mouse.x, G.mouse.y,
        { x: px + 4, y: iy, w: pw - 8, h: itemH - 4 });
  
      ctx.fillStyle = isActive
        ? (hover ? 'rgba(80,68,40,0.85)' : 'rgba(60,50,30,0.6)')
        : (hover ? 'rgba(34,34,46,0.85)' : 'rgba(24,24,34,0.6)');
      roundRect(px + 4, iy, pw - 8, itemH - 4, 4);
      ctx.fill();
      ctx.strokeStyle = isActive ? trait.color : 'rgba(80,80,100,0.5)';
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.stroke();
  
      var iconX = px + 22, iconY = iy + itemH/2 - 2;
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        var ang = Math.PI / 3 * k - Math.PI / 2;
        var xx = iconX + Math.cos(ang) * 10;
        var yy = iconY + Math.sin(ang) * 10;
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.closePath();
      ctx.fillStyle = isActive ? trait.color : 'rgba(100,100,120,0.5)';
      ctx.fill();
  
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px ' + FONT;
      ctx.fillStyle = isActive ? '#fff' : C.textDim;
      ctx.fillText(name, px + 40, iy + 13);
  
      ctx.font = '10px ' + FONT;
      var tierText = '';
      if (isActive) {
        tierText = '已激活 ' + trait.tiers[info.tier] + ' 档';
        ctx.fillStyle = trait.color;
      } else {
        var next = trait.tiers.find(function(t){ return t > info.count; });
        if (next !== undefined) tierText = '还需 ' + (next - info.count) + ' 个';
        ctx.fillStyle = 'rgba(180,180,150,0.5)';
      }
      ctx.fillText(tierText, px + 40, iy + 29);
  
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px ' + FONT;
      ctx.fillStyle = isActive ? trait.color : C.text;
      ctx.fillText(info.count, px + pw - 10, iy + 18);
  
      pushButton(px + 4, iy, pw - 8, itemH - 4, '', (function(n){
        return function(){ G.traitDetailOpen = n; };
      })(name), { invisible: true });
    }
  }
  
  /* ---------- 装备列表内容 ---------- */
  function drawEquipsContent(px, py, pw, ph) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('装备背包', px + 10, py + 10);
  
    // 8 格背包网格
    var gridX = px + 12;
    var gridY = py + 30;
    var cellSize = 36;
    var gap = 6;
    var cols = 4;
  
    for (var i = 0; i < 8; i++) {
      var row = Math.floor(i / cols);
      var col = i % cols;
      var x = gridX + col * (cellSize + gap);
      var y = gridY + row * (cellSize + gap);
  
      ctx.fillStyle = 'rgba(24,24,34,0.7)';
      roundRect(x, y, cellSize, cellSize, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,80,100,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
  
      // 空装备位画个 + 号
      ctx.strokeStyle = 'rgba(120,120,140,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + cellSize/2 - 4, y + cellSize/2);
      ctx.lineTo(x + cellSize/2 + 4, y + cellSize/2);
      ctx.moveTo(x + cellSize/2, y + cellSize/2 - 4);
      ctx.lineTo(x + cellSize/2, y + cellSize/2 + 4);
      ctx.stroke();
    }
  
    ctx.textAlign = 'center';
    ctx.font = '10px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText('装备系统开发中', px + pw/2, gridY + 2 * (cellSize + gap) + 22);
    ctx.fillText('（打野怪掉落待实现）', px + pw/2, gridY + 2 * (cellSize + gap) + 38);
  }
  
  function drawTraitIcon(r, active) {
    var cx = r.x + r.w/2, cy = r.y + r.h/2;
    ctx.fillStyle = active ? 'rgba(60,50,30,0.95)' : 'rgba(24,24,34,0.9)';
    roundRect(r.x, r.y, r.w, r.h, 6); ctx.fill();
    ctx.strokeStyle = active ? C.gold : C.border;
    ctx.lineWidth = active ? 2 : 1.5; ctx.stroke();
  
    // 六边形
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 3 * i - Math.PI / 2;
      var px = cx + Math.cos(a) * 11;
      var py = cy + Math.sin(a) * 11;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = active ? C.gold : C.textDim;
    ctx.fill();
  }
  
  function drawEquipIcon(r, active) {
    var cx = r.x + r.w/2, cy = r.y + r.h/2;
    ctx.fillStyle = active ? 'rgba(60,50,30,0.95)' : 'rgba(24,24,34,0.9)';
    roundRect(r.x, r.y, r.w, r.h, 6); ctx.fill();
    ctx.strokeStyle = active ? C.gold : C.border;
    ctx.lineWidth = active ? 2 : 1.5; ctx.stroke();
  
    // 铠甲：简化的盾形
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy - 8);
    ctx.lineTo(cx + 9, cy - 8);
    ctx.lineTo(cx + 9, cy + 2);
    ctx.quadraticCurveTo(cx + 9, cy + 10, cx, cy + 11);
    ctx.quadraticCurveTo(cx - 9, cy + 10, cx - 9, cy + 2);
    ctx.closePath();
    ctx.fillStyle = active ? C.gold : C.textDim;
    ctx.fill();
  }
  
  function drawTraitPanel(px, py) {
    var pw = 170, ph = 220;
    drawPanel(px, py, pw, ph, { fill:'rgba(18,18,26,0.92)', stroke:C.border });
  
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('羁 绊', px + 12, py + 18);
  
    var active = getActiveTraits();
    var names = Object.keys(active).sort(function(a,b){
      var ta = active[a].tier, tb = active[b].tier;
      if (ta >= 0 && tb < 0) return -1;
      if (ta < 0 && tb >= 0) return 1;
      return active[b].count - active[a].count;
    });
    var visible = names.filter(function(n){ return active[n].count > 0; });
  
    if (visible.length === 0) {
      ctx.font = '12px ' + FONT;
      ctx.fillStyle = C.textDim;
      ctx.textAlign = 'center';
      ctx.fillText('上阵棋子以激活羁绊', px + pw/2, py + 120);
      ctx.textAlign = 'left';
      return;
    }
  
    var y = py + 46;
    for (var i = 0; i < visible.length; i++) {
      if (y > py + ph - 22) break;
      var name = visible[i];
      var info = active[name];
      var trait = TRAITS[name];
      var isActive = info.tier >= 0;
  
      ctx.font = 'bold 13px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillStyle = isActive ? trait.color : C.textDim;
      ctx.fillText(name, px + 12, y);
  
      ctx.textAlign = 'right';
      ctx.fillStyle = isActive ? '#fff' : C.textDim;
      ctx.fillText(info.count, px + pw - 12, y);
  
      ctx.textAlign = 'left';
      ctx.font = '10px ' + FONT;
      if (isActive) {
        ctx.fillStyle = trait.color;
        ctx.fillText('已激活 ' + trait.tiers[info.tier] + ' 档', px + 12, y + 13);
        y += 32;
      } else {
        var next = trait.tiers.find(function(t){ return t > info.count; });
        if (next !== undefined) {
          ctx.fillStyle = 'rgba(200,180,120,0.5)';
          ctx.fillText('还需 ' + (next - info.count) + ' 个', px + 12, y + 13);
        }
        y += 30;
      }
    }
  }
  
  function drawEquipPanel(px, py) {
    var pw = 170, ph = 100;
    drawPanel(px, py, pw, ph, { fill:'rgba(18,18,26,0.92)', stroke:C.border });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('装 备', px + 12, py + 18);
    ctx.font = '12px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText('装备系统开发中', px + 12, py + 50);
  }

  function drawPlayerList() {
    var px = 818, py = 58, pw = 136, ph = 210;
    drawPanel(px, py, pw, ph, { fill:'rgba(10,10,15,0.85)', stroke:C.border });
  
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('战 局', px + 12, py + 18);
  
    // 收集行
    var rows = [];
    rows.push({
      name: '我（玩家）', hp: Math.max(0, G.hp),
      alive: G.hp > 0, isPlayer: true, isOpp: false,
    });
    for (var i = 0; i < G.ais.length; i++) {
      var ai = G.ais[i];
      rows.push({
        name: ai.name,
        hp: Math.max(0, ai.hp),
        alive: ai.alive,
        isPlayer: false,
        isOpp: i === G.currentOpponentIndex,
        aiIndex: i,
      });
    }
  
    // 排序：活着的在前，按血量降序
    rows.sort(function(a, b){
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return b.hp - a.hp;
    });
  
    var y = py + 46;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
  
      // 名字
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px ' + FONT;
      if (!r.alive) {
        ctx.fillStyle = '#555';
      } else if (r.isPlayer) {
        ctx.fillStyle = '#4ac86a';
      } else if (r.isOpp) {
        ctx.fillStyle = '#e8c84a';
      } else {
        ctx.fillStyle = C.text;
      }
      var prefix = r.isOpp ? '▶ ' : '';
      ctx.fillText(prefix + r.name, px + 8, y);
  
      // 血量数字（紧贴名字右侧）
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px ' + FONT;
      ctx.fillStyle = r.alive ? C.text : '#555';
      ctx.fillText(r.alive ? r.hp : '出局', px + 82, y);

      
      // 血条
      var barX = px + 106;
      var barW = 22;
      var barH = 10;
      ctx.fillStyle = '#222';
      roundRect(barX, y - 5, barW, barH, 2); ctx.fill();
      if (r.alive) {
        var ratio = Math.max(0, r.hp) / 100;
        ctx.fillStyle = r.hp > 30 ? '#4ac86a' : '#d83a3a';
        roundRect(barX, y - 5, barW * ratio, barH, 2); ctx.fill();
      }
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      roundRect(barX, y - 5, barW, barH, 2); ctx.stroke();

          // 点击查看该玩家棋盘
    pushButton(px + 4, y - 11, pw - 8, 22, '', (function(row){
      return function(){
        if (row.isPlayer) G.viewingOpponentIndex = -1;
        else G.viewingOpponentIndex = row.aiIndex;
      };
    })(r), { invisible: true });

    y += 20;
    }
  }
   
  function drawBoard() {
    // 兜底：确保地形存在
    if (!G.terrain || !G.terrain.length || G.terrain.length !== BOARD.rows) {
      G.terrain = generateTerrainForRound();
    }
  
    function safeTerrain(r, c) {
      if (!G.terrain || !G.terrain[r]) return 'plain';
      var t = G.terrain[r][c];
      return (typeof t === 'string') ? t : 'plain';
    }
  
    var left = BOARD.x - BOARD.cellW/2 - 6;
    var top  = BOARD.y - BOARD.cellH/2 - 6;
    var bw = (BOARD.cols - 1) * BOARD.colSp + BOARD.cellW + 12;
    var bh = (BOARD.rows - 1) * BOARD.rowSp + BOARD.cellH + 12;
  
    // ---- 敌我半场底色 ----
    ctx.fillStyle = 'rgba(180, 60, 60, 0.02)';
    roundRect(left, top, bw, bh/2 - 2, 8); ctx.fill();
    ctx.fillStyle = 'rgba(60, 130, 220, 0.02)';
    roundRect(left, top + bh/2 + 2, bw, bh/2 - 2, 8); ctx.fill();
  
    // ---- 中线 ----
    ctx.save();
    ctx.strokeStyle = 'rgba(232,200,74,0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.shadowColor = '#e8c84a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(left, top + bh/2);
    ctx.lineTo(left + bw, top + bh/2);
    ctx.stroke();
    ctx.restore();
  
    // ---- 格子（含地形底色）----
    for (var r = 0; r < BOARD.rows; r++) {
      for (var c = 0; c < BOARD.cols; c++) {
        var cc = cellCenter(c, r);
        if (!cc) continue;
        var isPlayer = r >= 4;
        var baseColor = isPlayer ? 'rgba(74, 200, 255, 0.55)' : 'rgba(255, 90, 90, 0.40)';
  
        var isHover =
          Math.abs(G.mouse.x - cc.x) < BOARD.cellW / 2 &&
          Math.abs(G.mouse.y - cc.y) < BOARD.cellH / 2;
  
        var terrain = safeTerrain(r, c);
        var tInfo = (terrain !== 'plain' && TERRAIN_TYPES[terrain]) ? TERRAIN_TYPES[terrain] : null;
  
        ctx.save();
  
        if (terrain === 'water') { ctx.fillText('水', cc.x, cc.y); }
        else if (terrain === 'forest') { ctx.fillText('林', cc.x, cc.y); }
        else if (terrain === 'road') { ctx.fillText('道', cc.x, cc.y); }

        
        // 地形底色
        if (tInfo && tInfo.fill) {
          ctx.fillStyle = tInfo.fill;
          roundRect(cc.x - BOARD.cellW/2, cc.y - BOARD.cellH/2,
                    BOARD.cellW, BOARD.cellH, 4);
          ctx.fill();
        }
  
        // 边框
        ctx.strokeStyle = isHover ? '#ffffff'
                        : (tInfo ? tInfo.border : baseColor);
        ctx.lineWidth = isHover ? 2 : (tInfo ? 1.6 : 1.2);
        if (isHover || G.dragging) {
          ctx.shadowColor = isPlayer ? '#4ac8ff' : '#ff4a4a';
          ctx.shadowBlur = isHover ? 12 : 5;
        }
        roundRect(cc.x - BOARD.cellW/2, cc.y - BOARD.cellH/2,
                  BOARD.cellW, BOARD.cellH, 4);
        ctx.stroke();
        ctx.restore();
      }
    }
  
    // ---- 战斗阶段：棋子 ----
    if (G.state === STATE.BATTLE && G.battle && G.battle.units) {
      var units = G.battle.units.slice().sort(function(a,b){ return a.py - b.py; });
      for (var i = 0; i < units.length; i++) {
        var u2 = units[i];
        if (!u2 || !u2.alive) continue;
  
        var facing = 's';
        var attackOffsetX = 0, attackOffsetY = 0, jumpY = 0;
  
        if (u2.target && u2.target.alive) {
          var dx = u2.target.px - u2.px;
          var dy = u2.target.py - u2.py;
          var adx = Math.abs(dx), ady = Math.abs(dy);
  
          if (adx > ady * 1.2) facing = (dx > 0) ? 'e' : 'w';
          else                 facing = (dy > 0) ? 's' : 'n';
  
          if (u2.attackAnim > 0) {
            var t = u2.attackAnim / 0.15;
            var len = Math.sqrt(dx * dx + dy * dy) || 1;
            var push = 12 * t;
            attackOffsetX = dx / len * push;
            attackOffsetY = dy / len * push;
          }
  
          if (gridDist(u2, u2.target) > u2.range) {
            jumpY = Math.abs(Math.sin(G.time / 80 + u2.px)) * 3;
          }
        }
  
        var yRatio = Math.max(0, Math.min(1, (u2.row || 0) / (BOARD.rows - 1)));
        var perspectiveScale = 0.7 + yRatio * 0.35;
  
        drawUnitFigure(u2.px + attackOffsetX, u2.py + attackOffsetY,
          perspectiveScale, CHAR_BY_ID[u2.charId],
          { star: u2.star, seed: u2.px + u2.py, facing: facing, jumpY: jumpY });
  
        if (u2.hitFlash > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, u2.hitFlash * 5);
          ctx.fillStyle = '#ff4a4a';
          ctx.beginPath();
          var flashR = 15 + (0.15 - u2.hitFlash) * 60;
          ctx.ellipse(u2.px, u2.py + 8, flashR, flashR * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
  
        drawUnitBars(u2);
      }
    } else {
      // ---- 准备阶段：玩家棋子 ----
      for (var r2 = 4; r2 < 8; r2++) {
        if (!G.playerBoard || !G.playerBoard[r2]) continue;
        for (var c2 = 0; c2 < BOARD.cols; c2++) {
          var u = G.playerBoard[r2][c2];
          if (!u) continue;
          var cc2 = cellCenter(c2, r2);
          if (!cc2) continue;
          var ps2 = 0.75 + (r2 - 4) * 0.066;
          drawUnitFigure(cc2.x, cc2.y, ps2,
            CHAR_BY_ID[u.charId], { star: u.star, seed: r2 * 7 + c2, facing: 'n' });
        }
      }
    }
  
    // ---- 查看对手 ----
    if (G.viewingOpponentIndex >= 0 && G.ais && G.ais[G.viewingOpponentIndex]) {
      var viewedAI = G.ais[G.viewingOpponentIndex];
      if (viewedAI && viewedAI.roster) {
        var viewedBoard = buildBoardFromRoster(viewedAI.roster);
        for (var r3 = 0; r3 < 4; r3++) {
          if (!viewedBoard || !viewedBoard[r3]) continue;
          for (var c3 = 0; c3 < BOARD.cols; c3++) {
            var eu = viewedBoard[r3][c3];
            if (!eu) continue;
            var cc3 = cellCenter(c3, r3);
            if (!cc3) continue;
            drawUnitFigure(cc3.x, cc3.y - 6, 0.85,
              CHAR_BY_ID[eu.charId],
              { star: eu.star, seed: 100 + r3 * 7 + c3, alpha: 0.92, facing: 's' });
          }
        }
      }
    }
  }
   
   function drawEnemyBoardPreview() {
    if (G.state === STATE.BATTLE) return;
    for (var r = 0; r < 4; r++)
       for (var c = 0; c < BOARD.cols; c++) {
         var u = G.enemyBoard[r][c];
         if (!u) continue;
         var cc = cellCenter(c, r);
         drawUnitFigure(cc.x, cc.y - 6, 0.85,
           CHAR_BY_ID[u.charId], { star: u.star, seed: 100 + r*7 + c, alpha: 0.85 });
       }
   }
   
   function drawBench() {
     ctx.textAlign = 'left';
     ctx.textBaseline = 'middle';
     ctx.font = 'bold 12px ' + FONT;
     ctx.fillStyle = C.textDim;
     ctx.fillText('备战席', BENCH.x, BENCH.y - 12);

     var bgW = BENCH.count * BENCH.size + (BENCH.count - 1) * BENCH.gap;
     drawPanel(BENCH.x - 10, BENCH.y - 8, bgW + 20, BENCH.size + 16, {
     fill: 'rgba(15,15,22,0.7)',
     stroke: 'rgba(120,100,60,0.4)',
     r: 8, lw: 1
    });
   
     for (var i = 0; i < BENCH.count; i++) {
       var r = benchRect(i);
       ctx.fillStyle = C.empty;
       roundRect(r.x, r.y, r.w, r.h, 4); ctx.fill();
       ctx.strokeStyle = C.emptyEdge; ctx.lineWidth = 1; ctx.stroke();
   
       var u = G.playerBench[i];
       if (u) {
         drawUnitFigure(r.x + r.w/2, r.y + r.h/2 + 2, 0.7,
           CHAR_BY_ID[u.charId], { star: u.star, seed: i * 5 , facing: 's'});
       }
     }
   }
   
   function drawShop() {
    // 兜底
    if (G.state === STATE.PREPARE && (!G.shop || G.shop.length === 0)) {
      rollShop();
    }
     var probW = SHOP.count * SHOP.cardW + (SHOP.count - 1) * SHOP.gap;
        // ---------- 商店外框 ----------
  var frameX = SHOP.x - 6;
  var frameY = SHOP.y - 18;
  var frameW = probW + 12;
  var frameH = SHOP.cardH + 24;
  drawPanel(frameX, frameY, frameW, frameH, {
    fill: 'rgba(12,12,18,0.85)',
    stroke: 'rgba(120,100,60,0.55)',
    r: 8, lw: 1.5,
  });

     // ---------- 顶部概率文字 ----------
     var probY = SHOP.y - 10;
     var probX = SHOP.x;
     var odds = SHOP_ODDS[G.level] || SHOP_ODDS[9];

     ctx.textAlign = 'left';
     ctx.textBaseline = 'middle';
     ctx.font = 'bold 11px ' + FONT;

     var textX = probX;
     for (var ci = 0; ci < 5; ci++) {
      if (odds[ci] <= 0) continue;

     var label = (ci + 1) + '费 ' + odds[ci] + '%';
     ctx.fillStyle = COST_COLOR[ci + 1];
     ctx.fillText(label, textX, probY);

     textX += ctx.measureText(label).width + 14;
  }
  
      // ---------- 左侧按钮区（带统一底板） ----------
  // 画一个统一的深色底板
  drawPanel(4, 406, 116, 122, { 
    fill: 'rgba(12,12,18,0.85)', 
    stroke: 'rgba(120,100,60,0.4)', 
    r: 6, lw: 1 
  });

  // 购买经验按钮
  drawShopSideBtn(10, 408, 104, 30,
    '购买经验',
    '4 金 = 4 EXP',
    C.expGreen,
    function(){ buyExp(); });

  // 刷新按钮
  drawShopSideBtn(10, 442, 104, 30,
    '刷新商店',
    '2 金',
    '#8ac8e8',
    function(){ refreshShop(); });
  
    // ---------- 5 张卡牌 ----------
    for (var i = 0; i < SHOP.count; i++) {
      drawShopCard(i);
    }
  
    // ---------- 锁定按钮 ----------
  // ---------- 锁定按钮 ----------
  var lockW = 34, lockH = 34;
  var lockX = SHOP.x + probW + 6;
  var lockY = SHOP.y + (SHOP.cardH - lockH) / 2;
    var lockHover = inRect(G.mouse.x, G.mouse.y,
      { x: lockX, y: lockY, w: lockW, h: lockH });
  
    ctx.fillStyle = G.shopLocked
      ? 'rgba(160,40,40,0.95)'
      : (lockHover ? 'rgba(40,40,55,0.95)' : 'rgba(20,20,28,0.9)');
    roundRect(lockX, lockY, lockW, lockH, 6);
    ctx.fill();
    ctx.strokeStyle = G.shopLocked ? C.gold : (lockHover ? C.gold : 'rgba(90,90,110,0.6)');
    ctx.lineWidth = 1.8;
    ctx.stroke();
  
    // 锁图标
    var lx = lockX + 18, ly = lockY + 18;
    ctx.strokeStyle = G.shopLocked ? C.gold : C.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lx, ly - 4, 5, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = G.shopLocked ? C.gold : C.text;
    roundRect(lx - 7, ly - 4, 14, 11, 2);
    ctx.fill();
  
    ctx.font = 'bold 9px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = G.shopLocked ? C.gold : C.textDim;
    ctx.fillText(G.shopLocked ? '已锁' : '锁定', lockX + 18, lockY + lockH + 10);
  
    pushButton(lockX, lockY, lockW, lockH, '', function(){
      if (G.state !== STATE.PREPARE) return;
      G.shopLocked = !G.shopLocked;
    }, { invisible: true });
  }

  /* ============================================================
   底部按钮 / 经济提示
   ============================================================ */
   function drawBottomButtons() {
    var ix = 12;
    var iy = 484;
  
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
  
    var items = [
      { label: '利息', val: '+' + interestGold() },
      { label: '连胜', val: '+' + streakBonus() },
      { label: '底金', val: '+5' }
    ];
  
    for (var i = 0; i < items.length; i++) {
      var yy = iy + i * 11;
      ctx.font = '10px ' + FONT;
      ctx.fillStyle = 'rgba(160,160,180,0.8)';
      ctx.fillText(items[i].label, ix, yy);
  
      ctx.font = 'bold 11px ' + FONT;
      ctx.fillStyle = C.gold;
      ctx.fillText(items[i].val, ix + 34, yy);
    }
    ctx.textAlign = 'left'; // 恢复默认对齐
  }
   
   function drawMessage() {
     var age = G.time - G.messageTime;
     var alpha = Math.max(0, Math.min(1, (1800 - age) / 400));
     ctx.save();
     ctx.globalAlpha = alpha;
     ctx.font = 'bold 20px ' + FONT;
     var tw = ctx.measureText(G.message).width;
     var pw = tw + 40, ph = 40;
     var px = (W - pw)/2, py = 86;
     ctx.fillStyle = 'rgba(0,0,0,0.85)';
     roundRect(px, py, pw, ph, 6); ctx.fill();
     ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke();
     ctx.fillStyle = C.gold;
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(G.message, W/2, py + ph/2);
     ctx.restore();
   }
   
   /* ============================================================
      回合结算 / 最终结算
      ============================================================ */
   function drawRoundResult() {
     ctx.fillStyle = '#0e0e16';
     ctx.fillRect(0, 0, W, H);
     var r = G.roundResult, cx = W/2;
   
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
   
     var title = '', color = '#fff';
     if (r.emptyRoster)            { title = '未 上 阵'; color = '#d83a3a'; }
     else if (r.result === 'win')  { title = '胜 利'; color = '#e8c84a'; }
     else if (r.result === 'lose') { title = '败 北'; color = '#d83a3a'; }
     else                          { title = '平 局'; color = '#8a8a9a'; }
   
     ctx.font = 'bold 68px ' + FONT;
     ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
     ctx.strokeText(title, cx, 130);
     ctx.fillStyle = color;
     ctx.fillText(title, cx, 130);
   
     var pw = 460, ph = 240;
     var px = (W - pw)/2, py = 200;
     drawPanel(px, py, pw, ph, { fill:'rgba(24,24,34,0.9)', stroke:C.borderHi, lw:2 });
   
     ctx.textAlign = 'left';
     ctx.font = 'bold 16px ' + FONT;
     var y = py + 34;
     function line(label, value, valueColor) {
       ctx.fillStyle = C.textDim;
       ctx.fillText(label, px + 30, y);
       ctx.fillStyle = valueColor || C.text;
       ctx.textAlign = 'right';
       ctx.fillText(value, px + pw - 30, y);
       ctx.textAlign = 'left';
       y += 30;
     }
   
     if (r.result === 'win' && r.dmgToAI > 0)      line('敌方扣血', '-' + r.dmgToAI, '#d83a3a');
     else if (r.result === 'lose' && r.dmgToPlayer > 0) line('我方扣血', '-' + r.dmgToPlayer, '#d83a3a');
     line('底金收入', '+' + r.base, C.gold);
     line('利息收入', '+' + r.interest, C.gold);
     if (r.streak > 0) line('连胜/连败奖励', '+' + r.streak, C.gold);
     line('剩余金币', G.gold, C.gold);
     line('我方血量', G.hp, G.hp <= 30 ? '#d83a3a' : '#4ac86a');
     line('敌方血量', G.ai.hp, G.ai.hp <= 30 ? '#d83a3a' : '#4ac86a');
   
     pushButton(cx - 100, 470, 200, 48, '下 一 回 合', nextRound, { primary:true });
   }
   
   function drawGameOver() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, W, H);
  
    // 8 人混战：玩家血量 > 0 且所有 AI 都出局 = 胜利
    var aliveAIs = 0;
    if (G.ais) {
      for (var i = 0; i < G.ais.length; i++) {
        if (G.ais[i].alive) aliveAIs++;
      }
    }
    var win = (G.hp > 0) && (aliveAIs === 0);
     var grad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, 500);
     if (win) {
       grad.addColorStop(0, 'rgba(232,200,74,0.25)');
       grad.addColorStop(1, 'rgba(0,0,0,0)');
     } else {
       grad.addColorStop(0, 'rgba(216,58,58,0.25)');
       grad.addColorStop(1, 'rgba(0,0,0,0)');
     }
     ctx.fillStyle = grad;
     ctx.fillRect(0, 0, W, H);
   
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.font = 'bold 88px ' + FONT;
     var title = win ? '胜 利' : '败 北';
     var color = win ? '#e8c84a' : '#d83a3a';
     ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
     ctx.strokeText(title, W/2, 200);
     ctx.fillStyle = color;
     ctx.fillText(title, W/2, 200);
   
     ctx.font = 'bold 22px ' + FONT;
     ctx.fillStyle = C.text;
     ctx.fillText('共进行 ' + G.round + ' 回合', W/2, 280);
   
     var rank = G.playerRank;
     if (!rank) {
       // 没记录排名时兜底计算
       rank = win ? 1 : (aliveAIs + 1);
     }
     var rankText = '第 ' + rank + ' 名 / ' + (G.aiCount + 1);
     ctx.font = 'bold 26px ' + FONT;
     ctx.fillStyle = win ? '#e8c84a' : '#a8a8b8';
     ctx.fillText(rankText, W/2, 320);
   
     pushButton(W/2 - 130, 400, 260, 56, '再 来 一 局', startGame, { primary:true });
     pushButton(W/2 - 130, 470, 260, 44, '返 回 标 题',
       function(){ G.state = STATE.TITLE; }, {});
   }

   

   function drawTrashcan() {
    var r = TRASHCAN;
    var hover = G.dragging && inRect(G.mouse.x, G.mouse.y, r);
  
    // 背景
    ctx.fillStyle = hover ? 'rgba(160,30,30,0.92)' : 'rgba(24,24,34,0.88)';
    roundRect(r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = hover ? C.gold : 'rgba(120,100,60,0.6)';
    ctx.lineWidth = hover ? 3 : 2;
    roundRect(r.x, r.y, r.w, r.h, 10); ctx.stroke();
  
    // 垃圾桶图标（放大）
    var cx = r.x + r.w / 2;
    var cy = r.y + r.h / 2 - 12;
  
    ctx.strokeStyle = hover ? C.gold : C.textDim;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  
    // 桶盖
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 20);
    ctx.lineTo(cx + 22, cy - 20);
    ctx.stroke();
  
    // 提手
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 20);
    ctx.lineTo(cx - 8, cy - 27);
    ctx.lineTo(cx + 8, cy - 27);
    ctx.lineTo(cx + 8, cy - 20);
    ctx.stroke();
  
    // 桶身
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 14);
    ctx.lineTo(cx - 15, cy + 22);
    ctx.lineTo(cx + 15, cy + 22);
    ctx.lineTo(cx + 18, cy - 14);
    ctx.stroke();
  
    // 竖纹
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 12); ctx.lineTo(cx - 6, cy + 18);
    ctx.moveTo(cx, cy - 12);     ctx.lineTo(cx, cy + 18);
    ctx.moveTo(cx + 6, cy - 12); ctx.lineTo(cx + 6, cy + 18);
    ctx.stroke();
  
    // 文字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = hover ? C.gold : C.textDim;
    ctx.fillText('出售', cx, r.y + r.h - 18);
  }

  function getDetailPanelRect() {
    var pw = 210;
    return { x: W - pw - 8, y: 58, w: pw, h: 415 };
  }
  
  function drawUnitDetail() {
    if (!G.selectedUnit) return;
    var u = G.selectedUnit;
    var c = CHAR_BY_ID[u.charId];
    var r = getDetailPanelRect();
    var px = r.x, py = r.y, pw = r.w, ph = r.h;
  
    // 面板背景
    drawPanel(px, py, pw, ph, { fill:'rgba(18,18,26,0.96)', stroke:C.borderHi, lw:2 });
  
    // 顶部费用色条
    ctx.fillStyle = COST_COLOR[c.cost];
    ctx.fillRect(px + 2, py + 2, pw - 4, 3);
  
    // 1. 头像 60×60 居中
    var avSize = 60;
    var avX = px + (pw - avSize) / 2;
    var avY = py + 12;
    ctx.fillStyle = 'rgba(10,10,16,0.9)';
    roundRect(avX, avY, avSize, avSize, 6); ctx.fill();
    ctx.strokeStyle = COST_COLOR[c.cost];
    ctx.lineWidth = 2; ctx.stroke();
    if (!tryDrawPortrait(c.id, avX, avY, avSize, avSize)) {
      drawUnitFigure(avX + avSize/2, avY + avSize/2 + 4, 1.0, c, { star: u.star, facing: 's' });
    }
  
    // 2. 名字与星级
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px ' + FONT;
    ctx.fillStyle = '#fff';
    ctx.fillText(c.name, px + pw/2, py + 88);
  
    ctx.font = '11px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText(c.nick, px + pw/2, py + 106);
  
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = '#e8c84a';
    ctx.fillText('★'.repeat(u.star), px + pw/2, py + 124);
  
    // 3. 属性区
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 140);
    ctx.lineTo(px + pw - 10, py + 140);
    ctx.stroke();
  
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('属性', px + 12, py + 154);
  
    ctx.font = '11px ' + FONT;
    var stats = [
      ['生命', u.maxHp],
      ['攻击', u.atk],
      ['攻速', u.as.toFixed(2)],
      ['护甲', u.armor],
      ['距离', u.range],
      ['法力', u.maxMana],
    ];
    var colW = (pw - 24) / 2;
    for (var i = 0; i < stats.length; i++) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var sx = px + 12 + col * colW;
      var sy = py + 172 + row * 15; // 行距压缩为 15
      ctx.fillStyle = C.textDim;
      ctx.fillText(stats[i][0], sx, sy);
      ctx.fillStyle = C.text;
      ctx.fillText('' + stats[i][1], sx + 30, sy);
    }

     // 👇 新增：装备显示区（放在属性和技能之间）
  ctx.font = 'bold 12px ' + FONT;
  ctx.fillStyle = C.gold;
  ctx.fillText('装备', px + 12, py + 220); // 你对应调整一下 Y 坐标

  if (!u.equips || u.equips.length === 0) {
    ctx.font = '10px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText('无', px + 44, py + 220);
  } else {
    var exx = px + 44;
    for (var i = 0; i < u.equips.length; i++) {
      var eq = EQUIP_BY_ID[u.equips[i]];
      if (!eq) continue;
      ctx.font = '14px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText(eq.icon, exx, py + 220);
      exx += 20;
    }
  }
  
    // 4. 技能区
    ctx.strokeStyle = C.border;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 220); // 线往下挪
    ctx.lineTo(px + pw - 10, py + 220);
    ctx.stroke();
  
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('技能', px + 12, py + 234);
  
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = '#fff';
    ctx.fillText(c.skill.name, px + 12, py + 252);
  
    ctx.font = '11px ' + FONT;
    ctx.fillStyle = C.textDim;
    wrapText(技能描述(c), px + 12, py + 270, pw - 24, 14);
  
    // 5. 羁绊区
    ctx.strokeStyle = C.border;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 310); // 线往下挪
    ctx.lineTo(px + pw - 10, py + 310);
    ctx.stroke();
  
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('羁绊', px + 12, py + 324);
  
    var tx = px + 12;
    var ty = py + 344; // 标签位置
    for (var i = 0; i < u.traits.length; i++) {
      var tn = u.traits[i];
      var trait = TRAITS[tn];
      ctx.font = '11px ' + FONT;
      var tw = ctx.measureText(tn).width + 12;
      
      if (tx + tw > px + pw - 12) { tx = px + 12; ty += 20; }
      
      ctx.fillStyle = trait ? trait.color : C.textDim;
      roundRect(tx, ty - 8, tw, 16, 3); ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(tn, tx + tw/2, ty);
      
      tx += tw + 6;
      ctx.textAlign = 'left';
    }
  
    // 6. 底部售出按钮（固定在绝对底部）
    var locType = G.selectedUnitLocation ? G.selectedUnitLocation.type : null;
    var btnY = py + ph - 40;
  
    if (G.state === STATE.PREPARE && (locType === 'bench' || locType === 'board')) {
      var refund = u.cost * (u.star === 1 ? 1 : (u.star === 2 ? 3 : 9));
      pushButton(px + 12, btnY, pw - 24, 28, // 按钮稍微压扁一点
        '售出 +' + refund + '金', sellUnitByDetail, { primary:true });
    } else {
      ctx.textAlign = 'center';
      ctx.font = '11px ' + FONT;
      ctx.fillStyle = C.textDim;
      var tipText = '战斗单位';
      if (locType === 'viewOpponent') tipText = '对手棋子 · 无法操作';
      else if (G.state === STATE.BATTLE) tipText = '对战中无法售出';
      ctx.fillText(tipText, px + pw/2, btnY + 14);
    }
  }
  
  /* 自动换行 */
  function wrapText(text, x, y, maxW, lineH) {
    var chars = text.split('');
    var line = '';
    var cy = y;
    var textAlignBackup = ctx.textAlign;
    ctx.textAlign = 'left';
    for (var i = 0; i < chars.length; i++) {
      var testLine = line + chars[i];
      if (ctx.measureText(testLine).width > maxW && line.length > 0) {
        ctx.fillText(line, x, cy);
        line = chars[i];
        cy += lineH;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, cy);
    ctx.textAlign = textAlignBackup;
  }
  
  function 技能描述(c) {
    var s = c.skill;
    switch (s.type) {
      case 'damage':  return '对目标造成 ' + s.value + ' 伤害';
      case 'aoe':     return '对周围 ' + (s.radius||1) + ' 格敌人造成 ' + s.value + ' 伤害';
      case 'multi':   return '连续攻击 ' + (s.count||2) + ' 次，每次 ' + s.value;
      case 'heal':    return '治疗全体友军 ' + s.value + ' 生命';
      case 'buff':    return '自身攻速提升 ' + Math.round(s.value*100) + '%，持续 5 秒';
      case 'stun':    return '眩晕目标 ' + s.value + ' 秒';
      case 'charge':  return '冲锋至目标，造成 ' + s.value + ' 伤害';
      default:        return '';
    }
  }
/* ============================================================
   自动上阵提示遮罩
   ============================================================ */
   function drawAutoDeployOverlay() {
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);
  
    // 中央提示
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    // 主文字 + 呼吸动效
    var pulse = 0.5 + Math.sin(G.time * 0.01) * 0.5;
    ctx.font = 'bold 34px ' + FONT;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText('自动上阵中...', W / 2, H / 2 - 24);
  
    ctx.fillStyle = 'rgba(232,200,74,' + (0.7 + pulse * 0.3) + ')';
    ctx.fillText('自动上阵中...', W / 2, H / 2 - 24);
  
    // 副文字
    ctx.font = 'bold 18px ' + FONT;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('即将开战', W / 2, H / 2 + 20);
    ctx.fillStyle = C.text;
    ctx.fillText('即将开战', W / 2, H / 2 + 20);
  
    // 进度条（0.7s → 0）
    var prog = Math.max(0, Math.min(1, 1 - G.autoDeployTimer / 0.7));
    var bw = 260, bh = 6;
    var bx = (W - bw) / 2, by = H / 2 + 52;
  
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(bx - 1, by - 1, bw + 2, bh + 2, 3); ctx.fill();
  
    ctx.fillStyle = C.gold;
    roundRect(bx, by, bw * prog, bh, 3); ctx.fill();
  }

  /* ---------- 商店左侧按钮（经验 / 刷新） ---------- */
  function drawShopSideBtn(x, y, w, h, title, sub, accent, onClick) {
    var hover = inRect(G.mouse.x, G.mouse.y, { x: x, y: y, w: w, h: h });
  
    // 底色
    ctx.fillStyle = hover ? 'rgba(45,45,60,0.95)' : 'rgba(24,24,34,0.9)';
    roundRect(x, y, w, h, 4);
    ctx.fill();
  
    // 描边
    ctx.strokeStyle = hover ? accent : 'rgba(90,90,110,0.5)';
    ctx.lineWidth = 1.5;
    roundRect(x, y, w, h, 4);
    ctx.stroke();
  
    // 文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = '#fff';
    ctx.fillText(title, x + 8, y + 10);
  
    ctx.font = '10px ' + FONT;
    ctx.fillStyle = accent;
    ctx.fillText(sub, x + 8, y + 22);
  
    pushButton(x, y, w, h, '', onClick, { invisible: true });
  }

  /* ---------- 检测买下此牌是否能升星 ---------- */
/* ---------- 检测买下此牌是否能升星 ---------- */
// 辅助函数：模拟合成
function simulateCombine(c1, c2, c3) {
  while (c1 >= 3) {
    c1 -= 3;
    c2 += 1;
  }
  while (c2 >= 3) {
    c2 -= 3;
    c3 += 1;
  }
  return { c1: c1, c2: c2, c3: c3 };
}

function getUpgradePreview(charId) {
  var c1 = 0, c2 = 0, c3 = 0;
  
  // 统计备战席
  for (var i = 0; i < BENCH.count; i++) {
    var u = G.playerBench[i];
    if (u && u.charId === charId) {
      if (u.star === 1) c1++;
      else if (u.star === 2) c2++;
      else if (u.star === 3) c3++;
    }
  }
  
  // 统计场上
  for (var r = 4; r < 8; r++) {
    for (var c = 0; c < 7; c++) {
      var u = G.playerBoard[r][c];
      if (u && u.charId === charId) {
        if (u.star === 1) c1++;
        else if (u.star === 2) c2++;
        else if (u.star === 3) c3++;
      }
    }
  }
  
  // 1. 模拟当前不买的情况
  var before = simulateCombine(c1, c2, c3);
  
  // 2. 模拟买下这 1 个 1 星后的情况
  var after = simulateCombine(c1 + 1, c2, c3);
  
  // 3. 如果买下后，2 星的数量变多，说明能升 2 星
  if (after.c2 > before.c2) return 2;
  
  // 4. 如果买下后，3 星的数量变多，说明能升 3 星
  if (after.c3 > before.c3) return 3;
  
  return 0;
}

/* ---------- 商店卡牌 ---------- */
function drawShopCard(i) {
  var s = G.shop[i];
  if (!s) return;

  var r = shopRect(i);
  var c = CHAR_BY_ID[s.charId];
  var hover = !s.sold && inRect(G.mouse.x, G.mouse.y, r);
  var canBuy = !s.sold && G.gold >= c.cost;
  var costColor = COST_COLOR[c.cost];

  if (c.cost === 7) {
    // 7费专属金红光晕闪烁
    var glow = 8 + Math.sin(G.time * 0.005) * 5;
    ctx.strokeStyle = '#ff4a4a';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = glow;
  } else {
    ctx.strokeStyle = s.sold ? '#333' : costColor;
    ctx.lineWidth = hover && canBuy ? 2.5 : 1.5;
  }

  // 👇 检测是否能升星
  var upgradeStar = 0;
  if (!s.sold) {
    upgradeStar = getUpgradePreview(s.charId);
  }
  var isUpgradable = upgradeStar > 0;

  // 卡牌背景
  if (s.sold) {
    ctx.fillStyle = 'rgba(15,15,20,0.9)';
  } else {
    var bg = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    if (isUpgradable) {
      // 升星卡牌底色带一点金色
      bg.addColorStop(0, 'rgba(60, 50, 30, 0.98)');
      bg.addColorStop(1, 'rgba(30, 25, 15, 0.98)');
    } else if (hover && canBuy) {
      bg.addColorStop(0, 'rgba(48,48,64,0.98)');
      bg.addColorStop(1, 'rgba(28,28,40,0.98)');
    } else {
      bg.addColorStop(0, 'rgba(30,30,42,0.95)');
      bg.addColorStop(1, 'rgba(18,18,26,0.95)');
    }
    ctx.fillStyle = bg;
  }
  roundRect(r.x, r.y, r.w, r.h, 6);
  ctx.fill();

  // 边框（费用色 / 升星金色闪烁）
  if (isUpgradable) {
    // 金色呼吸发光
    var glow = 5 + Math.sin(G.time * 0.01) * 5;
    ctx.strokeStyle = '#e8c84a';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#e8c84a';
    ctx.shadowBlur = glow;
  } else {
    ctx.strokeStyle = s.sold ? '#333' : costColor;
    ctx.lineWidth = hover && canBuy ? 2.5 : 1.5;
    if (hover && canBuy) {
      ctx.shadowColor = costColor;
      ctx.shadowBlur = 8;
    }
  }
  roundRect(r.x, r.y, r.w, r.h, 6);
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (s.sold) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(r.x, r.y, r.w, r.h, 6);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.font = 'bold 14px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('已 购', r.x + r.w / 2, r.y + r.h / 2);
    return;
  }

  // 👇 左上角星级角标
  if (isUpgradable) {
    var starText = upgradeStar === 3 ? '★★★' : '★★';
    ctx.font = 'bold 14px ' + FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(starText, r.x + 6, r.y + 6);
    ctx.fillStyle = '#e8c84a';
    ctx.fillText(starText, r.x + 6, r.y + 6);
  }

  // 左侧立绘区
  var avW = 62;
  var avX = r.x + 2;
  var avY = r.y + 2;
  var avH = r.h - 4;

  ctx.fillStyle = 'rgba(10,10,16,0.7)';
  roundRect(avX, avY, avW, avH, 4);
  ctx.fill();

  // 立绘 (加上 facing: 's' 确保显示正面)
  drawUnitFigure(avX + avW/2, avY + avH/2 + 2, 0.62, c, { star: 1, seed: i, facing: 's' });

  // 右侧信息区
  var infoX = avX + avW + 6;
  var infoW = r.w - avW - 10;

  // 名字
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px ' + FONT;
  ctx.fillStyle = '#fff';
  ctx.fillText(c.name, infoX, r.y + 12);

  // 羁绊标签（第一个）
  var traitName = c.traits[0] || '';
  var trait = TRAITS[traitName];
  ctx.font = '9px ' + FONT;
  var tw = ctx.measureText(traitName).width + 8;
  ctx.fillStyle = trait ? trait.color : 'rgba(120,120,140,0.6)';
  ctx.globalAlpha = 0.35;
  roundRect(infoX, r.y + 24, tw, 12, 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = trait ? trait.color : '#ccc';
  ctx.fillText(traitName, infoX + 4, r.y + 30);

  // 第二个羁绊
  if (c.traits[1]) {
    var trait2 = TRAITS[c.traits[1]];
    var tw2 = ctx.measureText(c.traits[1]).width + 8;
    ctx.fillStyle = trait2 ? trait2.color : 'rgba(120,120,140,0.6)';
    ctx.globalAlpha = 0.35;
    roundRect(infoX + tw + 4, r.y + 24, tw2, 12, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = trait2 ? trait2.color : '#ccc';
    ctx.fillText(c.traits[1], infoX + tw + 8, r.y + 30);
  }

  // 费用角标（右下）
  ctx.fillStyle = costColor;
  roundRect(r.x + r.w - 26, r.y + r.h - 18, 22, 14, 3);
  ctx.fill();
  ctx.font = 'bold 11px ' + FONT;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(c.cost, r.x + r.w - 15, r.y + r.h - 11);

  // 点击购买
  pushButton(r.x, r.y, r.w, r.h, '', (function(idx){
    return function(){ buyShopCard(idx); };
  })(i), { invisible: true });
}

/* ============================================================
   快捷键设置面板
   ============================================================ */
   var HOTKEY_LABELS = [
    { key: 'buy1', label: '购买商店第 1 张' },
    { key: 'buy2', label: '购买商店第 2 张' },
    { key: 'buy3', label: '购买商店第 3 张' },
    { key: 'buy4', label: '购买商店第 4 张' },
    { key: 'buy5', label: '购买商店第 5 张' },
    { key: 'buyExp', label: '购买经验' },
    { key: 'sell', label: '出售选中棋子' },
    { key: 'refresh', label: '刷新商店' },
  ];
  
  function drawHotkeyPanel() {
    if (!G.hotkeyPanelOpen) return;
    if (!G.hotkeys) G.hotkeys = loadHotkeys();
  
    // 遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
  
    // 面板
    var pw = 380, ph = 434;
    var px = (W - pw) / 2, py = (H - ph) / 2;
    drawPanel(px, py, pw, ph, {
      fill: '#181822',
      stroke: C.borderHi,
      r: 8, lw: 2,
    });
  
    // 标题
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 22px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('快捷键设置', W / 2, py + 34);
  
    // 提示
    ctx.font = '11px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText('点击右侧按钮后按下新按键 · Esc 取消', W / 2, py + 58);
  
    // 每一行
    var rowY = py + 90;
    var rowH = 34;
  
    for (var i = 0; i < HOTKEY_LABELS.length; i++) {
      var item = HOTKEY_LABELS[i];
      var isSetting = G.hotkeySetting === item.key;
  
      // 左侧：动作名
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px ' + FONT;
      ctx.fillStyle = isSetting ? C.gold : '#fff';
      ctx.fillText(item.label, px + 24, rowY + rowH / 2);
  
      // 右侧：当前键位（按钮）
      var keyText;
      if (isSetting) {
        keyText = '按下新键…';
      } else {
        var kk = G.hotkeys[item.key] || '未绑定';
        keyText = kk.toUpperCase();
      }
  
      var btnW = 120, btnH = 26;
      var btnX = px + pw - btnW - 24;
      var btnY = rowY + (rowH - btnH) / 2;
      var btnHover = inRect(G.mouse.x, G.mouse.y,
        { x: btnX, y: btnY, w: btnW, h: btnH });
  
      ctx.fillStyle = isSetting
        ? 'rgba(160,120,30,0.9)'
        : (btnHover ? 'rgba(45,45,60,0.95)' : 'rgba(30,30,42,0.9)');
      roundRect(btnX, btnY, btnW, btnH, 5);
      ctx.fill();
      ctx.strokeStyle = isSetting ? C.gold : (btnHover ? C.gold : 'rgba(90,90,110,0.6)');
      ctx.lineWidth = 1.5;
      roundRect(btnX, btnY, btnW, btnH, 5);
      ctx.stroke();
  
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px ' + FONT;
      ctx.fillStyle = isSetting ? '#fff' : (btnHover ? C.gold : C.text);
      ctx.fillText(keyText, btnX + btnW / 2, btnY + btnH / 2);
  
      pushButton(btnX, btnY, btnW, btnH, '', (function(k){
        return function(){
          G.hotkeySetting = k;
        };
      })(item.key), { invisible: true });
  
      rowY += rowH;
    }
  
    // 底部按钮：恢复默认 / 关闭
    var bottomY = py + ph - 52;
  
    pushButton(px + 24, bottomY, 130, 36, '恢复默认', function(){
      G.hotkeys = JSON.parse(JSON.stringify(DEFAULT_HOTKEYS));
      saveHotkeys();
      G.hotkeySetting = null;
    }, {});
  
    pushButton(px + pw - 154, bottomY, 130, 36, '关 闭', function(){
      G.hotkeyPanelOpen = false;
      G.hotkeySetting = null;
    }, { primary: true });
  }

  /* ============================================================
   羁绊详情弹窗（带滚动条裁剪）
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
  
    // 弹窗基础面板
    var pw = 560, ph = 440;
    var px = (W - pw) / 2, py = (H - ph) / 2;
    drawPanel(px, py, pw, ph, { fill: '#181822', stroke: trait.color, r: 8, lw: 2 });
  
    // 标题与描述
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillStyle = trait.color;
    ctx.fillText(name, px + 24, py + 38);
  
    ctx.font = '13px ' + FONT;
    ctx.fillStyle = C.textDim;
    ctx.fillText(trait.desc, px + 24, py + 66);
  
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
  
    // 关联角色标题
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = C.gold;
    ctx.fillText('关联角色', px + 24, py + 180);
  
    var members = CHARS.filter(function(c){ return c.traits.indexOf(name) >= 0; });
  
    // 统计场上和备战席
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
  
    // ================= 分页处理 =================
    var pageSize = 9; // 每页 9 个人
    var totalPages = Math.ceil(members.length / pageSize);
    
    if (G.traitDetailPage >= totalPages) G.traitDetailPage = totalPages - 1;
    if (G.traitDetailPage < 0) G.traitDetailPage = 0;
  
    var startIndex = G.traitDetailPage * pageSize;
    var currentPageMembers = members.slice(startIndex, startIndex + pageSize);
  
    var startY = py + 200;
    var colW = (pw - 48) / 3;
    var rowH = 62;
  
    // 绘制当前页的 9 个角色
    for (var i = 0; i < currentPageMembers.length; i++) {
      var m = currentPageMembers[i];
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
  
      // 小头像
      drawUnitFigure(mx + 22, my + rowH/2 - 4, 0.55, m, { star: 1, seed: i, facing: 's' });
  
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
  
    // ================= 渲染分页器 =================
    if (totalPages > 1) {
      var pageY = py + ph - 46;
  
      // 上一页
      var prevHover = inRect(G.mouse.x, G.mouse.y, { x: px + 24, y: pageY, w: 60, h: 32 });
      ctx.fillStyle = prevHover && G.traitDetailPage > 0 ? 'rgba(60,50,30,0.9)' : 'rgba(24,24,34,0.9)';
      roundRect(px + 24, pageY, 60, 32, 4); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = G.traitDetailPage > 0 ? C.gold : C.textDim;
      ctx.font = 'bold 13px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀ 上一页', px + 54, pageY + 16);
  
      if (G.traitDetailPage > 0) {
        pushButton(px + 24, pageY, 60, 32, '', function(){ G.traitDetailPage--; }, { invisible: true });
      }
  
      // 页码
      ctx.fillStyle = C.textDim;
      ctx.font = '12px ' + FONT;
      ctx.fillText((G.traitDetailPage + 1) + ' / ' + totalPages, px + 125, pageY + 16);
  
      // 下一页
      var nextHover = inRect(G.mouse.x, G.mouse.y, { x: px + 160, y: pageY, w: 60, h: 32 });
      ctx.fillStyle = nextHover && G.traitDetailPage < totalPages - 1 ? 'rgba(60,50,30,0.9)' : 'rgba(24,24,34,0.9)';
      roundRect(px + 160, pageY, 60, 32, 4); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = G.traitDetailPage < totalPages - 1 ? C.gold : C.textDim;
      ctx.fillText('下一页 ▶', px + 190, pageY + 16);
  
      if (G.traitDetailPage < totalPages - 1) {
        pushButton(px + 160, pageY, 60, 32, '', function(){ G.traitDetailPage++; }, { invisible: true });
      }
    }
  
    // 关闭按钮（放在右下角）
    pushButton(px + pw - 100, py + ph - 46, 80, 32, '关 闭', function(){
      G.traitDetailOpen = null;
    }, {});
  }

  /* ============================================================
   合成升星特效
   ============================================================ */
function drawCombineEffects() {
  if (!G.combineEffects) return;
  
  for (var i = 0; i < G.combineEffects.length; i++) {
    var e = G.combineEffects[i];
    var age = G.time - e.startTime;
    var t = age / e.duration; // 0 到 1 的进度
    
    ctx.save();
    
    // 1. 扩散的金色光环
    if (t < 0.5) {
      // 前 0.5 秒：光环迅速扩大并变淡
      var r = 10 + t * 100;
      ctx.strokeStyle = 'rgba(232, 200, 74, ' + (1 - t * 2) + ')';
      ctx.lineWidth = 4 * (1 - t * 2);
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 后 0.5 秒：细圆环慢慢消散
      var r = 60 + (t - 0.5) * 40;
      ctx.strokeStyle = 'rgba(232, 200, 74, ' + (1 - (t - 0.5) * 2) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // 2. 向上飘动的星星
    var numStars = e.star; // 2星出2个，3星出3个
    ctx.fillStyle = '#e8c84a';
    ctx.font = 'bold 16px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (var s = 0; s < numStars; s++) {
      // 利用正弦波让星星左右飘散
      var angle = (s / numStars) * Math.PI * 2;
      var spreadX = Math.sin(angle) * 30 * t;
      var moveY = -30 - t * 40; // 向上飘
      
      ctx.globalAlpha = 1 - t; // 逐渐变淡
      ctx.fillText('★', e.x + spreadX, e.y + moveY);
    }
    
    // 3. 中心爆闪 (前 0.2 秒纯白泛光)
    if (t < 0.2) {
      ctx.globalAlpha = 1 - (t / 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}