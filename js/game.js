/* ============================================================
   game.js —— 主循环、输入、流程控制
   ============================================================ */
   'use strict';

   /* ---------- 游戏流程 ---------- */
   function quitToMenu() {
    G.state = STATE.TITLE;
  
    G.battle = null;
    G.dragging = null;
    G.shop = [];
    G.playerBoard = null;
    G.playerBench = null;
    G.enemyBoard = null;
    G.ais = [];
  
    G.currentOpponentIndex = -1;
    G.traitDetailOpen = null;
    G.detailOpen = false;
    G.selectedUnit = null;
    G.selectedUnitLocation = null;
  
    G.roundResult = null;
    G.autoDeploying = false;
    G.autoDeployTimer = 0;
    G.showHelp = false;
  }
   
   function startGame() {
     G.round = 1;
     G.gold = 2000;
     G.hp = 100;
     G.level = 2;
     G.exp = 0;
     G.winStreak = 0;
     G.loseStreak = 0;
     G.autoDeploying = false;
     G.traitDetailOpen = null;
     G.equipBag = ['sword', 'armor']; // 初始给两件
     G.cardPool = initCardPool();
     G.autoDeployTimer = 0;
     if (!G.hotkeys) G.hotkeys = loadHotkeys();
  

     G.playerBoard = makeEmptyBoard();
     G.terrain = generateTerrainForRound();
     G.playerBench = new Array(BENCH.count).fill(null);
     G.shop = [];
     G.dragging = null;
     G.message = null;
     G.messageTime = -9999;
     G.battle = null;
     G.roundResult = null;
     G.prepTimer = PREP_TIME;
     G.sidebarTab = 'traits';
     G.traitDetailOpen = null;

     G.shopLocked = false;
     G.selectedUnit = null;
     G.selectedUnitLocation = null;
     G.detailOpen = false;
     G.sidebarTraitsOpen = true;
     G.sidebarEquipsOpen = false;
  
     G.cardPool = initCardPool();
     G.ais = initAIPlayers();
     G.currentOpponentIndex = -1;
     G.viewingOpponentIndex = -1;
     G.playerRank = 0;
  
     pickAndPrepareOpponent();
     rollShop();
     G.state = STATE.PREPARE;
     showMessage('本回合地形：' + summarizeTerrain(G.terrain)); 
   }

   function quitToMenu() {
    // 清空对局状态，回到标题
    G.state = STATE.TITLE;
    G.terrain = null; 
    G.battle = null;
    G.dragging = null;
    G.shop = [];
    G.playerBoard = null;
    G.playerBench = null;
    G.enemyBoard = null;
    G.ais = [];
  
    G.currentOpponentIndex = -1;
    G.traitDetailOpen = null;
    G.detailOpen = false;
    G.selectedUnit = null;
    G.selectedUnitLocation = null;
  
    G.roundResult = null;
    G.autoDeploying = false;
    G.autoDeployTimer = 0;
    G.showHelp = false;
  }
   
  function nextRound() {
    G.round++;
    G.terrain = generateTerrainForRound();
    G.prepTimer = PREP_TIME;
    G.dragging = null;
    G.battle = null;
    G.roundResult = null;
    G.gold += 2;
    pickAndPrepareOpponent();
    showMessage('本回合地形：' + summarizeTerrain(G.terrain)); 
  
    if (!G.shopLocked) {
      G.shop = [];
      rollShop();
    }
    // 锁定时保留原商店内容，不刷新
  
    G.state = STATE.PREPARE;
  }

   function sellUnitByDrag(d) {
    if (G.state !== STATE.PREPARE && G.state !== STATE.BATTLE) return;
    var unit = d.unit;
    var refund = unit.cost * (unit.star === 1 ? 1 : (unit.star === 2 ? 3 : 9));
    G.gold += refund;
    if (G.cardPool && G.cardPool[d.unit.charId] !== undefined) {
      G.cardPool[d.unit.charId]++;
    }
    showMessage('售出 ' + unit.name + ' +' + refund + ' 金');
  }
  
  function sellUnitByDetail() {
    if (G.state !== STATE.PREPARE && G.state !== STATE.BATTLE) return;
    if (G.autoDeploying) return;
    if (!G.selectedUnit || !G.selectedUnitLocation) return;
  
    var u = G.selectedUnit;
    var loc = G.selectedUnitLocation;
  
    // 对手棋子 / 战斗单位 不能通过详情面板出售
    if (loc.type === 'viewOpponent') return;
    if (loc.type === 'battleUnit') return;
  
    var refund = u.cost * (u.star === 1 ? 1 : (u.star === 2 ? 3 : 9));
    G.gold += refund;
  
    // 归还到卡池
    if (G.cardPool && u.charId && G.cardPool[u.charId] !== undefined) {
      G.cardPool[u.charId]++;
    }
  
    // 从来源移除
    if (loc.type === 'bench') {
      G.playerBench[loc.index] = null;
    } else if (loc.type === 'board') {
      G.playerBoard[loc.row][loc.col] = null;
    }
  
    showMessage('售出 ' + u.name + ' +' + refund + ' 金');
    G.detailOpen = false;
    G.selectedUnit = null;
    G.selectedUnitLocation = null;
  }
   
   /* ---------- 输入 ---------- */
   canvas.addEventListener('mousemove', function(e) {
    var p = getMousePos(e);
    G.mouse.x = p.x; G.mouse.y = p.y;
    if (G.dragging) {
      G.dragDistance += Math.abs(p.x - G.lastMouseX) + Math.abs(p.y - G.lastMouseY);
      G.lastMouseX = p.x; G.lastMouseY = p.y;
    }
  });
   canvas.addEventListener('mouseleave', function() {
     G.mouse.x = -1; G.mouse.y = -1;
   });
   
   canvas.addEventListener('mousedown', function(e) {
    var p = getMousePos(e);
  G.mouse.x = p.x; G.mouse.y = p.y;

  // 右上角退出按钮
  if (G.state === STATE.PREPARE) {
    var quitRect = { x: W - 44, y: 6, w: 36, h: 36 };
    if (inRect(p.x, p.y, quitRect)) {
      quitToMenu();
      return;
    }
  }
    
    var p = getMousePos(e);
    G.mouse.x = p.x; G.mouse.y = p.y;
    if (G.autoDeploying) return;   // 自动上阵阶段禁止所有操作
  
    // 1. 按钮优先
    for (var i = buttons.length - 1; i >= 0; i--) {
      var b = buttons[i];
      if (inRect(p.x, p.y, b)) {
        if (b.onClick) b.onClick();
        return;
      }
    }
  
    // 2. 详情面板打开时，点面板外的区域关闭面板
    if (G.detailOpen) {
      var panelRect = getDetailPanelRect();
      if (!inRect(p.x, p.y, panelRect)) {
        G.detailOpen = false;
        G.selectedUnit = null;
        G.selectedUnitLocation = null;
      }
    }
      // 羁绊详情弹窗
  if (G.traitDetailOpen) {
    var tw = 560, th = 440;
    var tRect = { x: (W - tw)/2, y: (H - th)/2, w: tw, h: th };
    if (!inRect(p.x, p.y, tRect)) {
      G.traitDetailOpen = null;
    }
    return; // 弹窗打开时阻断其他交互
  }
  
  // 备战阶段 & 战斗阶段：都能拖备战席
  if (G.state === STATE.PREPARE || G.state === STATE.BATTLE) {
    for (var i = 0; i < BENCH.count; i++) {
      if (inRect(p.x, p.y, benchRect(i)) && G.playerBench[i]) {
        G.dragging = { from:'bench', index:i, unit:G.playerBench[i] };
        G.playerBench[i] = null;
        G.dragStartX = p.x; G.dragStartY = p.y;
        G.dragDistance = 0;
        G.lastMouseX = p.x; G.lastMouseY = p.y;
        return;
      }
    }
  }

    // 查看对手棋盘时，点击上半场棋子弹出详情
    if (G.state === STATE.PREPARE && G.viewingOpponentIndex >= 0 && G.ais) {
      var viewedAI = G.ais[G.viewingOpponentIndex];
      if (viewedAI) {
        var viewedBoard = buildBoardFromRoster(viewedAI.roster);
        for (var vr = 0; vr < 4; vr++)
          for (var vc = 0; vc < BOARD.cols; vc++) {
            if (hitCell(p.x, p.y, vr, vc) && viewedBoard[vr][vc]) {
              G.selectedUnit = viewedBoard[vr][vc];
              G.selectedUnitLocation = { type: 'viewOpponent' };
              G.detailOpen = true;
              return;
            }
          }
      }
    }

  // 只有备战阶段能拖棋盘上的棋子
  if (G.state === STATE.PREPARE) {
    for (var r = 4; r < 8; r++)
      for (var c = 0; c < 7; c++) {
        if (hitCell(p.x, p.y, r, c) && G.playerBoard[r][c]) {
          G.dragging = { from:'board', row:r, col:c, unit:G.playerBoard[r][c] };
          G.playerBoard[r][c] = null;
          G.dragStartX = p.x; G.dragStartY = p.y;
          G.dragDistance = 0;
          G.lastMouseX = p.x; G.lastMouseY = p.y;
          return;
        }
      }
  }

  // 战斗阶段：点击棋盘上的战斗单位弹出详情
  if (G.state === STATE.BATTLE && G.battle && G.battle.units) {
    for (var k = 0; k < G.battle.units.length; k++) {
      var bu = G.battle.units[k];
      if (!bu.alive) continue;
      if (Math.abs(p.x - bu.px) < 22 && Math.abs(p.y - bu.py) < 26) {
        var baseChar = CHAR_BY_ID[bu.charId];
        G.selectedUnit = {
          charId: bu.charId, name: bu.name, star: bu.star,
          cost: baseChar.cost, maxHp: bu.maxHp, atk: bu.atk,
          as: bu.as, armor: bu.armor, range: bu.range,
          maxMana: bu.maxMana, traits: bu.traits,
        };
        G.selectedUnitLocation = null;   // 战斗单位无位置可售
        G.detailOpen = true;
        return;
      }
    }
  }
  });
   
   function cancelDrag() {
     if (!G.dragging) return;
     var d = G.dragging;
     if (d.from === 'bench') G.playerBench[d.index] = d.unit;
     else G.playerBoard[d.row][d.col] = d.unit;
     G.dragging = null;
   }
   
   window.addEventListener('mouseup', function(e) {
    if (!G.dragging) return;
    var p = getMousePos(e);
    var d = G.dragging;

    if (d.from === 'equipBag') {
      var eqId = G.equipBag[d.index];
      
      // 1. 尝试放到棋盘上的棋子上
      for (var r = 4; r < 8; r++) {
        for (var c = 0; c < 7; c++) {
          if (hitCell(p.x, p.y, r, c) && G.playerBoard[r][c]) {
            var targetUnit = G.playerBoard[r][c];
            if (!targetUnit.equips) targetUnit.equips = [];
            if (targetUnit.equips.length < 3) {
              targetUnit.equips.push(eqId);
              G.equipBag.splice(d.index, 1); // 从背包移除
              showMessage('装备成功');
            } else {
              showMessage('该棋子装备已满');
            }
            G.dragging = null;
            return;
          }
        }
      }
  
      // 2. 尝试放到备战席的棋子上
      for (var i = 0; i < BENCH.count; i++) {
        if (inRect(p.x, p.y, benchRect(i)) && G.playerBench[i]) {
          var targetUnit = G.playerBench[i];
          if (!targetUnit.equips) targetUnit.equips = [];
          if (targetUnit.equips.length < 3) {
            targetUnit.equips.push(eqId);
            G.equipBag.splice(d.index, 1);
            showMessage('装备成功');
          } else {
            showMessage('该棋子装备已满');
          }
          G.dragging = null;
          return;
        }
      }
      
      // 如果放到空地，取消拖拽
      G.dragging = null;
      return;
    }
  
    // 单击判定：拖动距离 < 8px 视为点击
    if (G.dragDistance < 8) {
      if (d.from === 'bench') G.playerBench[d.index] = d.unit;
      else G.playerBoard[d.row][d.col] = d.unit;
  
      G.selectedUnit = d.unit;
      G.selectedUnitLocation = d.from === 'bench'
        ? { type:'bench', index:d.index }
        : { type:'board', row:d.row, col:d.col };
      G.detailOpen = true;
      G.dragging = null;
      return;
    }
  
  // 拖到垃圾桶 → 出售（战斗阶段禁止）
  if ((G.state === STATE.PREPARE || G.state === STATE.BATTLE) &&
      inRect(p.x, p.y, TRASHCAN)) {
    sellUnitByDrag(d);
    G.dragging = null;
    return;
  }

  // 放到备战席（两种阶段都允许）
  for (var i = 0; i < BENCH.count; i++) {
    if (inRect(p.x, p.y, benchRect(i))) {
      if (!G.playerBench[i]) {
        G.playerBench[i] = d.unit;
      } else {
        var other = G.playerBench[i];
        G.playerBench[i] = d.unit;
        if (d.from === 'bench') G.playerBench[d.index] = other;
        else if (d.from === 'board') G.playerBoard[d.row][d.col] = other;
      }
      G.dragging = null;
      tryCombine();
      return;
    }
  }

  // 放到玩家半场：仅备战阶段
  if (G.state === STATE.PREPARE) {
    for (var r = 4; r < 8; r++)
      for (var c = 0; c < 7; c++) {
        if (hitCell(p.x, p.y, r, c)) {
          var occupied = G.playerBoard[r][c];
          if (d.from === 'bench' && !occupied) {
            if (countPlayerUnitsOnBoard() >= G.level) {
              showMessage('人口已满（' + countPlayerUnitsOnBoard() + '/' + G.level + '）');
              cancelDrag();
              return;
            }
          }
          if (!occupied) {
            G.playerBoard[r][c] = d.unit;
          } else {
            var other = G.playerBoard[r][c];
            G.playerBoard[r][c] = d.unit;
            if (d.from === 'bench') G.playerBench[d.index] = other;
            else G.playerBoard[d.row][d.col] = other;
          }
          G.dragging = null;
          tryCombine();
          return;
        }
      }
  }
    cancelDrag();
  });

  function pickAndPrepareOpponent() {
    var candidates = [];
    var mode = G.gameMode;
    
    for (var i = 0; i < G.ais.length; i++) {
      if (!G.ais[i].alive) continue;
      // 团队模式：只能打对面阵营
      if ((mode === '4v4' || mode === '8v8') && G.ais[i].team === 0) continue;
      candidates.push(i);
    }
    
    if (candidates.length === 0) {
      G.currentOpponentIndex = -1;
      G.enemyBoard = makeEmptyBoard();
      return;
    }
    G.currentOpponentIndex = candidates[Math.floor(Math.random() * candidates.length)];
    var opp = G.ais[G.currentOpponentIndex];
    G.enemyBoard = generateBoardForAI(opp);
  }
   
/* ============================================================
   快捷键监听
   ============================================================ */
   window.addEventListener('keydown', function(e) {
    // 正在设置某个快捷键：捕获按键
    if (G.hotkeySetting) {
      e.preventDefault();
      var key = e.key.toLowerCase();
      // Esc 取消
      if (key === 'escape') {
        G.hotkeySetting = null;
        return;
      }
      // 检查冲突：如果这个键已被占用，先清掉旧绑定
      for (var k in G.hotkeys) {
        if (G.hotkeys[k] === key && k !== G.hotkeySetting) {
          G.hotkeys[k] = '';
        }
      }
      G.hotkeys[G.hotkeySetting] = key;
      G.hotkeySetting = null;
      saveHotkeys();
      return;
    }
  
    // 准备阶段才响应快捷键
    if (G.state !== STATE.PREPARE) return;
    if (G.autoDeploying) return;
    if (G.hotkeyPanelOpen) return;   // 设置面板打开时不响应游戏快捷键
  
    var k = e.key.toLowerCase();
  
    // 购买商店某张卡
    for (var i = 1; i <= 5; i++) {
      if (k === G.hotkeys['buy' + i]) {
        e.preventDefault();
        buyShopCard(i - 1);
        return;
      }
    }
  
    // 出售选中的棋子
    if (k === G.hotkeys.sell) {
      e.preventDefault();
      sellUnitByDetail();
      return;
    }
  
 // 购买经验
 if (k === G.hotkeys.buyExp) {
  e.preventDefault();
  buyExp();
  return;
}

    // 刷新商店
    if (k === G.hotkeys.refresh) {
      e.preventDefault();
      refreshShop();
      return;
    }
  });

   /* ---------- 主循环 ---------- */
   function frame(now) {
    var dt = Math.min(50, now - (G.lastTime || now));
    G.lastTime = now;
  // 处理顿帧（如果处于顿帧状态，时间流速变慢/停止）
  if (G.hitStopTimer > 0) {
    G.hitStopTimer -= dt / 1000;
    dt = 0; // 冻结画面和逻辑
  }

    G.time += dt;
  
    try {
      buttons = [];
      ctx.clearRect(0, 0, W, H);

      // 屏幕震动逻辑
    ctx.save();
    if (G.shakeIntensity > 0) {
      var sx = (Math.random() - 0.5) * G.shakeIntensity;
      var sy = (Math.random() - 0.5) * G.shakeIntensity;
      ctx.translate(sx, sy);
      // 震动衰减
      G.shakeIntensity *= 0.85; 
      if (G.shakeIntensity < 0.5) G.shakeIntensity = 0;
    }
  
      if (G.state === STATE.TITLE) {
        drawTitle();
      } else if (G.state === STATE.PREPARE) {
        if (G.autoDeploying) {
          G.autoDeployTimer -= dt / 1000;
          if (G.autoDeployTimer <= 0) {
            G.autoDeploying = false;
            startBattle();
          } else {
            drawPrepare();
          }
          if (G.state === STATE.BATTLE) drawBattleScene(dt);
        } else {
          G.prepTimer -= dt / 1000;
          if (G.prepTimer <= 0) {
            G.autoDeploying = true;
            G.autoDeployTimer = 0.7;
            autoDeployFromBench();
            drawPrepare();
          } else {
            drawPrepare();
          }
        }
      } else if (G.state === STATE.BATTLE) {
        drawBattleScene(dt);
      } else if (G.state === STATE.ROUND_RESULT) {
        drawRoundResult();
      } else if (G.state === STATE.GAME_OVER) {
        drawGameOver();
      }
      ctx.restore(); // 恢复坐标系（在绘制完单位后，震动结束，UI 不抖）

      for (var i = 0; i < buttons.length; i++) drawButton(buttons[i]);
      //更新和绘制合成特效
      if (G.combineEffects) {
      G.combineEffects = G.combineEffects.filter(function(e) {
        return G.time - e.startTime < e.duration;
      });
      drawCombineEffects();
    }
    } catch (err) {
      console.error('[frame error]', err,);
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff6a6a';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ERROR: ' + err.message, 20, 30);
  ctx.fillText('line: ' + err.stack.split('\n')[1], 20, 52);
    }
  
    requestAnimationFrame(frame);
  }
  
/* 战斗场景统一渲染入口：状态防御 + 分层调用 */
function drawBattleScene(dt) {
  if (!G.battle) {
    G.state = STATE.PREPARE;
    drawPrepare();
    return;
  }

  updateBattle(dt);

  // updateBattle 内部可能触发 nextRound 把 battle 置空并切走状态
  if (!G.battle) return;
  if (G.state !== STATE.BATTLE) {
    // 状态已切走（下一回合/结算），本帧不再画战斗层
    return;
  }

  drawPrepare();
  drawBattleEffects();

  if (!G.battle) return;
  drawBattleHUD();

  if (G.battle && G.battle.ended) drawBattleEndText();
  }

  
   /* ---------- 启动 ---------- */
   loadAllCharImages();
   loadDirSprites(); 
   requestAnimationFrame(frame);