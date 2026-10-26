/* ============================================================
   ai.js —— AI 玩家系统（8 人混战）
   ============================================================ */
   'use strict';

   var AI_NAMES = [
     '祝家庄', '曾头市', '大名府', '东平府',
     '东昌府', '江州',   '方腊军',
   ];
   
   // AI 站位序列
   var AI_POSITIONS = [
     {r:3,c:3}, {r:3,c:2}, {r:3,c:4}, {r:3,c:1}, {r:3,c:5},
     {r:2,c:3}, {r:2,c:2}, {r:2,c:4},
     {r:1,c:3}, {r:1,c:2}, {r:1,c:4},
   ];
   
   /* ---------- 初始化 7 个 AI 玩家 ---------- */
   function initAIPlayers() {
    var ais = [];
    var names = ['祝家庄', '曾头市', '大名府', '东平府', '东昌府', '江州', '方腊军'];
    
    // 根据 G.aiCount 决定生成几个敌人
    for (var i = 0; i < G.aiCount; i++) {
      ais.push({
        id: i,
        name: names[i],
        hp: 100,
        level: 2,
        roster: [],
        alive: true,
        lastResult: '',
      });
    }
    
    // 生成初始阵容
    for (var j = 0; j < ais.length; j++) {
      generateBoardForAI(ais[j]);
    }
    return ais;
  }
   /* ---------- 生成一个 AI 的棋盘（跨回合阵容连续） ---------- */
   function generateBoardForAI(ai) {
     var diff = G.difficulty;
     var round = G.round;
   
     var targetSize = Math.min(8, 2 + Math.floor(round * 0.5) + diff);
     // AI 最高只能拿到 5 费，7 费晁盖是玩家专属的终极梦想
     var maxCost = Math.min(5, 1 + Math.floor(round / 3) + diff);
      
     if (!ai.roster) ai.roster = [];
   
     // 1. 补人
     while (ai.roster.length < targetSize) {
       var pool = CHARS.filter(function(ch){ return ch.cost <= maxCost; });
       var c = pool[Math.floor(Math.random() * pool.length)];
       ai.roster.push({ charId: c.id, star: 1 });
     }
     // 2. 砍人
     while (ai.roster.length > targetSize) ai.roster.pop();
   
     // 3. 升星
     var starChance = 0.15 + diff * 0.08 + Math.min(0.25, round * 0.02);
     if (Math.random() < starChance) {
       var cands = [];
       for (var i = 0; i < ai.roster.length; i++)
         if (ai.roster[i].star < 3) cands.push(i);
       if (cands.length > 0) {
         var idx = cands[Math.floor(Math.random() * cands.length)];
         ai.roster[idx].star++;
       }
     }
   
     // 4. 每 3 回合可能换 1 个更高费的
     if (round % 3 === 0 && ai.roster.length > 0 && Math.random() < 0.5) {
       var idx = Math.floor(Math.random() * ai.roster.length);
       var oldCost = CHAR_BY_ID[ai.roster[idx].charId].cost;
       var pool2 = CHARS.filter(function(ch){
         return ch.cost <= maxCost && ch.cost > oldCost;
       });
       if (pool2.length > 0) {
         var c2 = pool2[Math.floor(Math.random() * pool2.length)];
         ai.roster[idx] = { charId: c2.id, star: ai.roster[idx].star };
       }
     }
   
     // 5. 摆位
     var board = makeEmptyBoard();
     for (var i = 0; i < ai.roster.length && i < AI_POSITIONS.length; i++) {
       var entry = ai.roster[i];
       var pos = AI_POSITIONS[i];
       board[pos.r][pos.c] = makeUnit(entry.charId, entry.star);
     }
     return board;
   }

   /* 只读：根据 AI 现有 roster 构建棋盘（不修改 roster） */
function buildBoardFromRoster(roster) {
  var board = makeEmptyBoard();
  if (!roster) return board;
  for (var i = 0; i < roster.length && i < AI_POSITIONS.length; i++) {
    var entry = roster[i];
    var pos = AI_POSITIONS[i];
    board[pos.r][pos.c] = makeUnit(entry.charId, entry.star);
  }
  return board;
}
   
   /* ---------- 计算 AI 战力（用于简化模拟） ---------- */
   function computeAIPower(roster) {
     if (!roster || roster.length === 0) return 0;
     var p = 0;
     for (var i = 0; i < roster.length; i++) {
       var c = CHAR_BY_ID[roster[i].charId];
       if (!c) continue;
       p += c.cost * roster[i].star;
     }
     return p;
   }
   
   /* ---------- AI vs AI 简化战斗 ---------- */
   function simulateAIvsAI(a1, a2) {
     var p1 = computeAIPower(a1.roster) * (0.85 + Math.random() * 0.3);
     var p2 = computeAIPower(a2.roster) * (0.85 + Math.random() * 0.3);
   
     if (p1 >= p2) {
       var dmg = Math.max(2, Math.min(8, Math.floor(p1 / 6)));
       a2.hp -= dmg;
       if (a2.hp <= 0) { a2.hp = 0; a2.alive = false; }
       a1.lastResult = 'win';
       a2.lastResult = 'lose';
     } else {
       var dmg = Math.max(2, Math.min(8, Math.floor(p2 / 6)));
       a1.hp -= dmg;
       if (a1.hp <= 0) { a1.hp = 0; a1.alive = false; }
       a1.lastResult = 'lose';
       a2.lastResult = 'win';
     }
   }