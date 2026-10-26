/* ============================================================
   data_equips.js —— 装备数据（生辰纲成品装备）
   ============================================================ */
   'use strict';

   var EQUIPS = [
     { id: 'sword', name: '朴刀', type: 'weapon', icon: '🗡️', desc: '攻击力 +30%', effects: { atkMul: 0.3 } },
     { id: 'bow', name: '强弓', type: 'weapon', icon: '🏹', desc: '攻速 +30%', effects: { asMul: 0.3 } },
     { id: 'armor', name: '铁甲', type: 'armor', icon: '🛡️', desc: '护甲 +30', effects: { armorAdd: 30 } },
     { id: 'hp', name: '护心镜', type: 'armor', icon: '🧿', desc: '生命上限 +40%', effects: { hpMul: 0.4 } },
     { id: 'vamp', name: '嗜血珠', type: 'accessory', icon: '🩸', desc: '攻击吸血 +25%', effects: { lifesteal: 0.25 } }
   ];
   
   var EQUIP_BY_ID = {};
   for (var _ei = 0; _ei < EQUIPS.length; _ei++) {
     EQUIP_BY_ID[EQUIPS[_ei].id] = EQUIPS[_ei];
   }