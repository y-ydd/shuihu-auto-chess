/* ============================================================
   data_traits.js —— 10 个羁绊
   tiers    激活档位（人数）
   effects  与 tiers 一一对应的属性加成
   ============================================================ */
'use strict';

var TRAITS = {
  '天罡': { desc:'天罡星宿，全体生命提升',
    tiers:[2,4,6], color:'#e8c84a',
    effects:[ {hpMul:0.10}, {hpMul:0.22}, {hpMul:0.40} ] },

  '地煞': { desc:'地煞星宿，全体攻击提升',
    tiers:[2,4,6], color:'#8ac8e8',
    effects:[ {atkMul:0.12}, {atkMul:0.28}, {atkMul:0.50} ] },

  '五虎': { desc:'五虎上将，全体攻速提升',
    tiers:[2,4], color:'#e87a4a',
    effects:[ {asMul:0.25}, {asMul:0.55} ] },

  '步兵': { desc:'步兵统领，全体护甲提升',
    tiers:[2,4,6], color:'#9a9a9a',
    effects:[ {armorAdd:15}, {armorAdd:35}, {armorAdd:60} ] },

  '豪侠': { desc:'豪侠义气，攻击吸血',
    tiers:[2,4], color:'#c84a4a',
    effects:[ {lifesteal:0.12}, {lifesteal:0.28} ] },

  '弓手': { desc:'弓手神射，攻速提升',
    tiers:[2,3], color:'#4ae8a8',
    effects:[ {asMul:0.20}, {asMul:0.45} ] },

  '水军': { desc:'水军精锐，攻速与生命提升',
    tiers:[2,3,5], color:'#4a8ae8',
    effects:[
      {asMul:0.15, hpMul:0.10},
      {asMul:0.30, hpMul:0.20},
      {asMul:0.50, hpMul:0.35},
    ] },

  '刺客': { desc:'刺客突击，攻击力提升',
    tiers:[2,3,5], color:'#d83a8a',
    effects:[ {atkMul:0.20}, {atkMul:0.40}, {atkMul:0.70} ] },

  '骑兵': { desc:'骑兵冲锋，攻击与护甲提升',
    tiers:[2,4], color:'#8a6a4a',
    effects:[
      {atkMul:0.15, armorAdd:10},
      {atkMul:0.32, armorAdd:25},
    ] },

  '法师': { desc:'法师秘术，法力回复提升',
    tiers:[2], color:'#a86ae8',
    effects:[ {manaBonus:0.5} ] },
    
  '托塔天王': { desc:'天王降世，睥睨众生。全队获得巨额护盾与吸血。',
    tiers:[1], color:'#ff4a4a', // 鲜红色
    effects:[ {hpMul:0.30, atkMul:0.20, lifesteal:0.15} ] },
};