/* ============================================================
   battle.js —— 战斗系统 + 战斗渲染
   ============================================================ */
'use strict';

/* ---------- 战斗初始化 ---------- */
function makeCombatUnit(unit, side, px, py, bonus, col, row) {
  var b = bonus || {};

  // 👇 新增：装备加成计算
  var eqAtkMul = 0, eqAsMul = 0, eqArmor = 0, eqHpMul = 0, eqLifesteal = 0;
  if (unit.equips) {
    for (var i = 0; i < unit.equips.length; i++) {
      var eq = EQUIP_BY_ID[unit.equips[i]];
      if (!eq) continue;
      if (eq.effects.atkMul) eqAtkMul += eq.effects.atkMul;
      if (eq.effects.asMul) eqAsMul += eq.effects.asMul;
      if (eq.effects.armorAdd) eqArmor += eq.effects.armorAdd;
      if (eq.effects.hpMul) eqHpMul += eq.effects.hpMul;
      if (eq.effects.lifesteal) eqLifesteal += eq.effects.lifesteal;
    }
  }

  var mHp = Math.round(unit.maxHp * (1 + (b.hpMul || 0) + eqHpMul));
  return {
    charId: unit.charId, name: unit.name, star: unit.star, side: side,
    maxHp: mHp, hp: mHp,
    atk: Math.round(unit.atk * (1 + (b.atkMul || 0) + eqAtkMul)), // 叠加装备攻击
    as: unit.as * (1 + (b.asMul || 0) + eqAsMul), // 叠加装备攻速
    range: unit.range,
    stunUntil: 0, buffAsUntil: 0, buffAsValue: 0,
    alive: true, hitFlash: 0, attackAnim: 0,

    // 地形相关（每帧动态更新）
    _tAsMul: 1,      // 地形攻速倍率
    terrainDr: 0,    // 地形减伤（0~1）
    manaMul: 1,      // 回蓝倍率
    onRoad: false,   // 是否站在官道上

    armor: unit.armor + (b.armorAdd || 0) + eqArmor, // 叠加装备护甲
    maxMana: unit.maxMana, mana: 0,
    lifesteal: (b.lifesteal || 0) + eqLifesteal, // 叠加装备吸血
    manaBonus: b.manaBonus || 0,
    traits: unit.traits.slice(),
    px: px, py: py,
    col: col, row: row,          // ← 新增：格子坐标
    moveCd: 0,                   // ← 新增：移动冷却
    target: null, attackCd: 0,
    stunUntil: 0, buffAsUntil: 0, buffAsValue: 0,
    alive: true, hitFlash: 0, attackAnim: 0,
  };
}

function startBattle() {
  var pUnits = [], eUnits = [];
  for (var r = 4; r < 8; r++)
    for (var c = 0; c < 7; c++) {
      var u = G.playerBoard[r][c]; if (u) pUnits.push(u);
    }
  for (var r = 0; r < 4; r++)
    for (var c = 0; c < 7; c++) {
      var u = G.enemyBoard[r][c]; if (u) eUnits.push(u);
    }
    // 玩家没上阵任何棋子 → 直接判负扣血
      // 空阵容 → 走和正常战斗失败一样的飘字流程
  if (pUnits.length === 0) {
    var dmg = 3 + Math.floor(G.round / 3);
    G.hp -= dmg;
    G.loseStreak++;
    G.winStreak = 0;

    var interest = interestGold();
    var streak = streakBonus();
    var goldGain = 5 + interest + streak;
    G.gold += goldGain;

    var fakeBattle = {
      units: [],
      timer: 0,
      timeLeft: BATTLE_TIME,
      ended: true,
      endTimer: 2,
      result: 'lose',
      effects: [
        { type:'hud', label:'未上阵 -' + dmg + ' 血量',
          startTime:0, duration:1.8, color:'#d83a3a', x:W/2, y:90 },
        { type:'hud', label:'+ ' + goldGain + ' 金币',
          startTime:0.2, duration:1.8, color:'#e8c84a', x:W/2, y:130 },
      ],
      inPostEnd: true,
      postEndTimer: 0,
      postEndDuration: 2.2,
      gameOver: (G.hp <= 0),
    };

    // 把敌方单位画出来，HUD 显示"我方 0 / 敌方 N"
    for (var r = 0; r < 4; r++)
      for (var c = 0; c < 7; c++) {
        var eu = G.enemyBoard[r][c];
        if (!eu) continue;
        var cc2 = cellCenter(c, r);
        fakeBattle.units.push(makeCombatUnit(eu, 'enemy', cc2.x, cc2.y, {}, c, r));
      }

    G.battle = fakeBattle;
    G.state = STATE.BATTLE;
    return;
  }

  var pBonus = getTraitBonuses(pUnits);
  var eBonus = getTraitBonuses(eUnits);

  var battle = {
    units: [], timer: 0, timeLeft: BATTLE_TIME,
    ended: false, endTimer: 0, result: null, effects: [],
    overtime: false,        // 是否处于补时阶段
    overtimeTimer: 0,       // 补时剩余秒数
    overtimeDuration: 2,    // 补时总时长
  };

  for (var r = 4; r < 8; r++)
    for (var c = 0; c < 7; c++) {
      var u = G.playerBoard[r][c]; if (!u) continue;
      var cc = cellCenter(c, r);
      battle.units.push(makeCombatUnit(u, 'player', cc.x, cc.y, pBonus, c, r));
    }
  for (var r = 0; r < 4; r++)
    for (var c = 0; c < 7; c++) {
      var u = G.enemyBoard[r][c]; if (!u) continue;
      var cc = cellCenter(c, r);
      battle.units.push(makeCombatUnit(u, 'enemy', cc.x, cc.y, eBonus, c, r));
    }

  G.battle = battle;
  G.state = STATE.BATTLE;
}

/* ---------- 每帧更新 ---------- */
function updateBattle(dt) {
  var b = G.battle; if (!b) return;
  b.timer += dt / 1000;

  // 战斗已结束、正在展示结算动画
  if (b.inPostEnd) {
    b.postEndTimer += dt / 1000;
    if (b.postEndTimer >= b.postEndDuration) {
      if (b.gameOver) G.state = STATE.GAME_OVER;
      else nextRound();
    }
    return;
  }

  if (b.ended) {
    b.endTimer += dt / 1000;
    if (b.endTimer > 1.0) endBattle();
    return;
  }

  // 补时阶段
  var speedMul = 1;
  if (b.overtime) {
    b.overtimeTimer -= dt / 1000;
    speedMul = 3;
    if (b.overtimeTimer <= 0) {
      var pAliveChk = b.units.filter(function(u){ return u && u.side==='player' && u.alive; });
      var eAliveChk = b.units.filter(function(u){ return u && u.side==='enemy'  && u.alive; });
      if (pAliveChk.length > 0 && eAliveChk.length > 0) {
        b.ended = true;
        b.result = 'doublelose';
        return;
      }
    }
  }

  var pAlive = b.units.filter(function(u){ return u && u.side==='player' && u.alive; });
  var eAlive = b.units.filter(function(u){ return u && u.side==='enemy'  && u.alive; });

  // 结束判定
  if (pAlive.length === 0 || eAlive.length === 0) {
    b.ended = true;
    if (pAlive.length === 0 && eAlive.length === 0) b.result = 'draw';
    else if (eAlive.length === 0) b.result = 'win';
    else b.result = 'lose';
    return;
  }

  // 进入补时
  if (!b.overtime && b.timer >= b.timeLeft) {
    b.overtime = true;
    b.overtimeTimer = b.overtimeDuration;
  }

  // 更新单位
  var sdt = dt / 1000 * speedMul;
  for (var i = 0; i < b.units.length; i++) {
    var u = b.units[i];
    if (!u) continue; // 🛡️ 防御：防止数组中有空元素
    if (!u.alive) continue;
    
    // 🛡️ 防御：如果是旧数据没有这些属性，先初始化
    if (u.attackAnim === undefined) u.attackAnim = 0;
    if (u.hitFlash === undefined) u.hitFlash = 0;
    if (u.stunUntil === undefined) u.stunUntil = 0;
    if (u.buffAsUntil === undefined) u.buffAsUntil = 0;
    if (u.buffAsValue === undefined) u.buffAsValue = 0;

    u.hitFlash = Math.max(0, u.hitFlash - dt / 1000);
    if (u.attackAnim > 0) u.attackAnim -= dt / 1000;
    
    if (b.timer < u.stunUntil) continue;

        // 视觉平滑：px/py 始终趋近当前格子中心
        var ccNow = cellCenter(u.col, u.row);
            // ================= 地形效果（每帧根据当前格刷新）=================
            var terrain = getTerrainAt(u.row, u.col);
    u._tAsMul = 1;
    u.terrainDr = 0;
    u.manaMul = 1;
    u.onRoad = false;
    var tMoveMul = 1;   // 移动 CD 倍率：>1 更慢，<1 更快

    if (terrain === 'water') {
      if (u.traits.indexOf('水军') >= 0) u._tAsMul = 1.3;
      if (u.traits.indexOf('法师') >= 0) u.manaMul = 1.5;
      if (u.traits.indexOf('骑兵') >= 0) tMoveMul = 2.0;
    } else if (terrain === 'forest') {
      if (u.traits.indexOf('刺客') >= 0 || u.traits.indexOf('弓手') >= 0) {
        u.terrainDr = 0.2;
      }
    } else if (terrain === 'road') {
      u.onRoad = true;
      tMoveMul = 0.5;
    }
    // ================================================================
        var lerp = Math.min(1, sdt * 12);
        u.px += (ccNow.x - u.px) * lerp;
        u.py += (ccNow.y - u.py) * lerp;
    
        if (!u.target || !u.target.alive) u.target = findNearestEnemy(u, b.units);
        if (!u.target) continue;
    
        var dist = gridDist(u, u.target);   // 现在是格子距离
        u.attackCd -= sdt;
    
        var as = u.as;
        if (b.timer < u.buffAsUntil) as *= (1 + u.buffAsValue);
        as *= u._tAsMul; 

        if (dist <= u.range) {
          if (u.attackCd <= 0) {
            doAttack(u, u.target, b);
            u.attackCd = 1 / Math.max(0.2, as);
          }
        } else {
          // 格子移动：每 0.35 秒走一格，目标格被占就稍后重试
          u.moveCd -= sdt;
          if (u.moveCd <= 0) {
            if (tryMoveToward(u, u.target, b.units)) {
              u.moveCd = 0.35 * tMoveMul;  
            } else {
              u.moveCd = 0.12;
            }
          }
        }
  }
  b.effects = b.effects.filter(function(e){ return b.timer - e.startTime < e.duration; });
}

function findNearestEnemy(u, units) {
  var best = null, bestD = Infinity;
  for (var i = 0; i < units.length; i++) {
    var o = units[i];
    if (!o.alive || o.side === u.side) continue;
    var d = gridDist(u, o);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

/* 判断某格子是否已被其他活着的单位占据 */
function isCellOccupied(col, row, units, self) {
  for (var i = 0; i < units.length; i++) {
    var o = units[i];
    if (!o || o === self || !o.alive) continue;
    if (o.col === col && o.row === row) return true;
  }
  return false;
}

/* 在 8 邻格中挑一个使到 target 距离最小的空位，走一格 */
function tryMoveToward(u, target, units) {
  var best = null;
  var bestD = Math.max(Math.abs(u.col - target.col), Math.abs(u.row - target.row));

  for (var dr = -1; dr <= 1; dr++) {
    for (var dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      var nr = u.row + dr, nc = u.col + dc;
      if (nc < 0 || nc >= BOARD.cols || nr < 0 || nr >= BOARD.rows) continue;
      if (isCellOccupied(nc, nr, units, u)) continue;

      var d = Math.max(Math.abs(nc - target.col), Math.abs(nr - target.row));
      if (d < bestD) { bestD = d; best = { col: nc, row: nr }; }
    }
  }

  if (best) {
    u.col = best.col;
    u.row = best.row;
    return true;
  }
  return false;
}
/* 判断某格子是否已被其他活着的单位占据 */
function isCellOccupied(col, row, units, self) {
  for (var i = 0; i < units.length; i++) {
    var o = units[i];
    if (!o || o === self || !o.alive) continue;
    if (o.col === col && o.row === row) return true;
  }
  return false;
}

/* 找某个单位旁边一个空位（冲锋技能用） */
function findEmptyAdjacent(center, units, self) {
  if (!center) return null;
  for (var dr = -1; dr <= 1; dr++) {
    for (var dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      var nr = center.row + dr, nc = center.col + dc;
      if (nc < 0 || nc >= BOARD.cols || nr < 0 || nr >= BOARD.rows) continue;
      if (isCellOccupied(nc, nr, units, self)) continue;
      return { col: nc, row: nr };
    }
  }
  return null;
}


/* 找某个单位旁边一个空位（冲锋技能用） */
function findNearestEnemy(u, units) {
  var best = null, bestD = Infinity;
  for (var i = 0; i < units.length; i++) {
    var o = units[i];
    if (!o || !o.alive || o.side === u.side) continue;
    var d = gridDist(u, o);
    if (o.onRoad) d -= 0.5;   // 官道目标视为「近半格」，距离相同时优先进攻
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

function doAttack(attacker, target, battle) {
  // 1. 触发攻击前冲动画
  attacker.attackAnim = 0.15;

  // 2. 伤害计算
  var dmg = Math.max(1, Math.round(attacker.atk * 100 / (100 + target.armor)));
  if (target.terrainDr > 0) {
    dmg = Math.max(1, Math.round(dmg * (1 - target.terrainDr)));   // ← 山林减伤
  }
  target.hp -= dmg;
  
  // 3. 触发受击特效（闪白 + 震屏 + 顿帧）
  target.hitFlash = 0.15; 
  G.hitStopTimer = 0.04;      // 顿帧 0.04 秒
  G.shakeIntensity = 4;       // 屏幕震动幅度
  
  // 吸血
  if (attacker.lifesteal > 0) {
    var heal = Math.round(dmg * attacker.lifesteal);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
  }

  // 法力
  attacker.mana = Math.min(attacker.maxMana, attacker.mana + 10 * (attacker.manaMul || 1));
  target.mana  = Math.min(target.maxMana, target.mana + Math.min(15, dmg * 0.05));

  // 4. 优化伤害飘字（普攻白色，高伤害变黄字并变大）
  var isCrit = dmg > attacker.atk * 1.5; // 简单判断是否是高伤害
  battle.effects.push({
    type:'damage', 
    x: target.px + (Math.random() - 0.5) * 10, 
    y: target.py - 20,
    value: dmg, 
    startTime: battle.timer, 
    duration: 0.8, 
    color: isCrit ? '#ffcc00' : '#ffffff',
    fontSize: isCrit ? 22 : 16 // 如果特效里有字体大小字段，就可以用
  });

  if (target.hp <= 0) { 
    target.hp = 0; 
    target.alive = false; 
    
    // 击杀额外震屏
    G.hitStopTimer = 0.08;
    G.shakeIntensity = 8;
  }

  if (attacker.mana >= attacker.maxMana && attacker.alive) {
    castSkill(attacker, battle);
    attacker.mana = 0;
  }
}

function castSkill(unit, battle) {
  var skill = CHAR_BY_ID[unit.charId].skill;
  var power = skill.value * (0.8 + unit.star * 0.4);

  battle.effects.push({
    type:'skill', x: unit.px, y: unit.py,
    radius: (skill.radius || 1) * BOARD.colSp,
    startTime: battle.timer, duration: 0.6, color: '#e8c84a',
  });

  switch (skill.type) {
    case 'damage':
      if (unit.target && unit.target.alive)
        dealSkillDamage(unit, unit.target, power, battle);
      break;
    case 'aoe': {
      var radius = skill.radius || 1;
      for (var i = 0; i < battle.units.length; i++) {
        var o = battle.units[i];
        if (!o.alive || o.side === unit.side) continue;
        if (gridDist(unit, o) <= radius )
          dealSkillDamage(unit, o, power, battle);
      }
      break;
    }
    case 'multi':
      if (unit.target && unit.target.alive) {
        for (var i = 0; i < skill.count; i++) {
          if (!unit.target.alive) break;
          dealSkillDamage(unit, unit.target, power, battle);
        }
      }
      break;
    case 'heal':
      for (var i = 0; i < battle.units.length; i++) {
        var o = battle.units[i];
        if (!o.alive || o.side !== unit.side) continue;
        o.hp = Math.min(o.maxHp, o.hp + power);
        battle.effects.push({
          type:'heal', x: o.px, y: o.py - 20,
          value: Math.round(power), startTime: battle.timer,
          duration: 0.9, color: '#4ac86a',
        });
      }
      break;
    case 'buff':
      unit.buffAsUntil = battle.timer + 5;
      unit.buffAsValue = skill.value;
      battle.effects.push({
        type:'text', x: unit.px, y: unit.py - 26,
        value: '神行', startTime: battle.timer,
        duration: 0.9, color: '#8ac8e8',
      });
      break;
    case 'stun':
      if (unit.target && unit.target.alive) {
        unit.target.stunUntil = battle.timer + skill.value;
        for (var i = 0; i < battle.units.length; i++) {
          var o = battle.units[i];
          if (!o.alive || o.side === unit.side) continue;
          if (gridDist(unit.target, o) <= 1)
            o.stunUntil = battle.timer + skill.value;
        }
      }
      break;
      case 'charge':
        if (unit.target && unit.target.alive) {
          var spot = findEmptyAdjacent(unit.target, battle.units, unit);
          if (spot) { unit.col = spot.col; unit.row = spot.row; }
          dealSkillDamage(unit, unit.target, power, battle);
        }
        break;
  }
}

function dealSkillDamage(attacker, target, amount, battle) {
  var dmg = Math.max(1, Math.round(amount * 100 / (100 + target.armor)));
  target.hp -= dmg; target.hitFlash = 0.2;
  battle.effects.push({
    type:'damage', x: target.px, y: target.py - 20,
    value: dmg, startTime: battle.timer, duration: 0.9, color: '#ffd050',
  });
  if (target.hp <= 0) { target.hp = 0; target.alive = false; }
}

function endBattle() {
  var b = G.battle;
  var result = b.result;

  var pAlive = b.units.filter(function(u){ return u.side==='player' && u.alive; });
  var eAlive = b.units.filter(function(u){ return u.side==='enemy'  && u.alive; });

  var hpLoss = 0;        // 玩家掉血
  var hpToAI = 0;        // AI 掉血
  var goldGain = 0;
  var opp = G.currentOpponentIndex >= 0 ? G.ais[G.currentOpponentIndex] : null;

  if (result === 'win') {
    G.winStreak++; G.loseStreak = 0;
    hpToAI = pAlive.reduce(function(s,u){ return s + u.star + 2; }, 0);
    if (opp) {
      opp.hp -= hpToAI;
      if (opp.hp <= 0) { opp.hp = 0; opp.alive = false; }
    }
    goldGain += 5;

     // 👇 新增：劫生辰纲掉落装备
     if (Math.random() < 0.6) { // 60%概率掉落
      var randEq = EQUIPS[Math.floor(Math.random() * EQUIPS.length)].id;
      G.equipBag.push(randEq);
      b.effects.push({
        type:'hud', label: '劫获生辰纲：' + EQUIP_BY_ID[randEq].name,
        startTime: b.timer + 0.6, duration: 1.8, color:'#e8a020',
        x: W/2, y: 230,
      });
    }
  } else if (result === 'lose') {
    G.loseStreak++; G.winStreak = 0;
    hpLoss = eAlive.reduce(function(s,u){ return s + u.star + 2; }, 0);
    G.hp -= hpLoss;
    goldGain += 3;
  } else if (result === 'doublelose') {
    // 补时后双方都还有棋子 → 双方都受对方剩余棋子的伤害
    G.loseStreak++; G.winStreak = 0;
    hpToAI = pAlive.reduce(function(s,u){ return s + u.star + 2; }, 0);
    hpLoss = eAlive.reduce(function(s,u){ return s + u.star + 2; }, 0);
    if (opp) {
      opp.hp -= hpToAI;
      if (opp.hp <= 0) { opp.hp = 0; opp.alive = false; }
    }
    G.hp -= hpLoss;
    goldGain += 4;
  } else {
    // draw：完全同归于尽
    goldGain += 4;
  }

  // 模拟其他 AI 之间的战斗
  simulateOtherAIBattles();

  var aliveAIs = 0;
  for (var i = 0; i < G.ais.length; i++) if (G.ais[i].alive) aliveAIs++;

  if (G.hp <= 0) G.playerRank = aliveAIs + 1;
  else if (aliveAIs === 0) G.playerRank = 1;

  var interest = interestGold();
  var streak = streakBonus();
  goldGain += interest + streak + 5;
  G.gold += goldGain;

  // 飘字
  var baseTime = b.timer;
  var oppName = opp ? opp.name : 'AI';

  if (result === 'doublelose') {
    b.effects.push({
      type:'hud', label: '补时结束 · 双方扣血',
      startTime: baseTime, duration: 1.8, color:'#e8c84a',
      x: W/2, y: 70,
    });
  }

  if (hpLoss > 0) {
    b.effects.push({
      type:'hud', label: '我方 -' + hpLoss + ' 血量',
      startTime: baseTime + 0.15, duration: 1.8, color:'#d83a3a',
      x: W/2, y: 110,
    });
  }
  if (hpToAI > 0) {
    b.effects.push({
      type:'hud', label: oppName + ' -' + hpToAI + ' 血量',
      startTime: baseTime + 0.30, duration: 1.8, color:'#4ac86a',
      x: W/2, y: 150,
    });
  }
  b.effects.push({
    type:'hud', label: '+ ' + goldGain + ' 金币',
    startTime: baseTime + 0.45, duration: 1.8, color:'#e8c84a',
    x: W/2, y: 190,
  });

  b.inPostEnd = true;
  b.postEndTimer = 0;
  b.postEndDuration = 2.2;
  b.gameOver = (G.hp <= 0 || aliveAIs === 0);
}

function simulateOtherAIBattles() {
  var others = [];
  for (var i = 0; i < G.ais.length; i++) {
    if (G.ais[i].alive && i !== G.currentOpponentIndex) others.push(G.ais[i]);
  }
  // 两两配对
  for (var i = 0; i + 1 < others.length; i += 2) {
    simulateAIvsAI(others[i], others[i + 1]);
  }
  // 落单的跳过本轮（不扣血）
}

/* ---------- 战斗渲染 ---------- */
/* 战斗特效层（伤害飘字、技能光圈） */
function drawBattleEffects() {
  var b = G.battle;
  if (!b) return;
  for (var i = 0; i < b.effects.length; i++) {
    var e = b.effects[i];
    var age = b.timer - e.startTime;
    var t = age / e.duration;
    if (t > 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - t;

    if (e.type === 'hud') {
      ctx.font = 'bold 26px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      var yo = -t * 40;
      ctx.strokeText(e.label, e.x, e.y + yo);
      ctx.fillStyle = e.color;
      ctx.fillText(e.label, e.x, e.y + yo);
    } else if (e.type === 'damage' || e.type === 'heal' || e.type === 'text') {
      ctx.font = 'bold 16px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var txt = (e.type === 'heal' ? '+' : '') + e.value;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      var yo2 = -t * 22;
      ctx.strokeText(txt, e.x, e.y + yo2);
      ctx.fillStyle = e.color;
      ctx.fillText(txt, e.x, e.y + yo2);
    } else if (e.type === 'skill') {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3 * (1 - t);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * t, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* 顶部战斗信息条：剩余单位 + 战斗倒计时 */
function drawBattleHUD() {
  var b = G.battle;
  if (!b || !b.units) return;

  var pAlive = 0, eAlive = 0;
  for (var i = 0; i < b.units.length; i++) {
    var u = b.units[i];
    if (!u.alive) continue;
    if (u.side === 'player') pAlive++;
    else if (u.side === 'enemy') eAlive++;
  }

  // 底色：补时阶段变红
  var bgColor = b.overtime ? 'rgba(80,20,20,0.92)' : 'rgba(16,16,24,0.9)';
  drawPanel(0, 50, W, 24, { fill:bgColor, stroke:C.border, r:0, lw:1 });

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px ' + FONT;
  ctx.fillStyle = '#4ac86a';
  ctx.fillText('我方 ' + pAlive, 24, 62);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#d83a3a';
  ctx.fillText('敌方 ' + eAlive, W - 58, 62);

  ctx.textAlign = 'center';
  ctx.font = 'bold 13px ' + FONT;

  if (b.overtime) {
    // 补时阶段
    var ot = Math.max(0, b.overtimeTimer);
    ctx.fillStyle = '#ffe070';
    ctx.fillText('★ 补时 ' + ot.toFixed(1) + 's · 3 倍速 ★', W / 2, 62);
  } else {
    var remain = Math.max(0, b.timeLeft - b.timer);
    ctx.fillStyle = remain < 4 ? C.red : C.gold;
    ctx.fillText('战斗 ' + remain.toFixed(1) + 's', W / 2, 62);
  }
}

/* 战斗结束大字 */
function drawBattleEndText() {
  var b = G.battle;
  if (!b) return;
  var alpha = Math.min(1, b.endTimer * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var fontSize = b.result === 'doublelose' ? 52 : 72;
  ctx.font = 'bold ' + fontSize + 'px ' + FONT;
  var text = '', color = '#fff';
  if (b.result === 'win')            { text = '胜 利'; color = '#e8c84a'; }
  else if (b.result === 'lose')      { text = '败 北'; color = '#d83a3a'; }
  else if (b.result === 'doublelose') { text = '两 败 俱 伤'; color = '#e87a3a'; }
  else                                { text = '平 局'; color = '#8a8a9a'; }
  ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
  ctx.strokeText(text, W/2, H/2);
  ctx.fillStyle = color;
  ctx.fillText(text, W/2, H/2);
  ctx.restore();
}
function drawUnitBars(u) {
  var w = 40, h = 5;
  var x = u.px - w/2;
  var y = u.py - 34;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  roundRect(x - 1, y - 1, w + 2, h + 2, 2); ctx.fill();

  var hpRatio = Math.max(0, u.hp / u.maxHp);
  ctx.fillStyle = u.side === 'player' ? '#4ac86a' : '#d83a3a';
  roundRect(x, y, w * hpRatio, h, 2); ctx.fill();

  var my = y + h + 1;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  roundRect(x - 1, my - 1, w + 2, 5, 1); ctx.fill();
  var mpRatio = Math.max(0, u.mana / u.maxMana);
  ctx.fillStyle = '#3a7ad8';
  roundRect(x, my, w * mpRatio, 3, 1); ctx.fill();

  if (G.battle.timer < u.stunUntil) {
    ctx.fillStyle = '#ffe070';
    ctx.font = 'bold 14px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', u.px, u.py - 44);
  }
}

function drawBattleEffects() {
  var b = G.battle;
  if (!b || !b.effects) return;
  for (var i = 0; i < b.effects.length; i++) {
    var e = b.effects[i];
    var age = b.timer - e.startTime;
    var t = age / e.duration;
    if (t > 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - t;

    if (e.type === 'hud') {
      ctx.font = 'bold 26px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      var yo = -t * 40;
      ctx.strokeText(e.label, e.x, e.y + yo);
      ctx.fillStyle = e.color;
      ctx.fillText(e.label, e.x, e.y + yo);
    } else if (e.type === 'damage' || e.type === 'heal' || e.type === 'text') {
      ctx.font = 'bold 16px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var txt = (e.type === 'heal' ? '+' : '') + e.value;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      var yo = -t * 22;
      ctx.strokeText(txt, e.x, e.y + yo);
      ctx.fillStyle = e.color;
      ctx.fillText(txt, e.x, e.y + yo);
    } else if (e.type === 'skill') {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3 * (1 - t);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * t, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBattleHUD() {
  var b = G.battle;
  if (!b || !b.units) return;

  var pAlive = 0, eAlive = 0;
  for (var i = 0; i < b.units.length; i++) {
    var u = b.units[i];
    if (!u.alive) continue;
    if (u.side === 'player') pAlive++;
    else if (u.side === 'enemy') eAlive++;
  }

  drawPanel(0, 0, W, 44, { fill:'#12121a', stroke:C.border, r:0, lw:1 });

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 18px ' + FONT;
  ctx.fillStyle = '#4ac86a';
  ctx.fillText('我方剩余: ' + pAlive, 24, 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#d83a3a';
  ctx.fillText('敌方剩余: ' + eAlive, W - 24, 22);

  // 中央：对手名 + 战斗倒计时
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px ' + FONT;
  ctx.fillStyle = C.gold;

  var opp = (G.currentOpponentIndex >= 0 && G.ais && G.ais[G.currentOpponentIndex])
    ? G.ais[G.currentOpponentIndex] : null;

  var remain = 0;
  if (typeof b.timeLeft === 'number' && typeof b.timer === 'number') {
    remain = Math.max(0, b.timeLeft - b.timer);
  }

  var label = opp ? ('对阵 ' + opp.name + '  ') : '';
  label += remain.toFixed(1) + 's';

  ctx.fillStyle = remain < 4 ? C.red : C.gold;
  ctx.font = 'bold 18px ' + FONT;
  ctx.fillText(label, W / 2, 22);
}

