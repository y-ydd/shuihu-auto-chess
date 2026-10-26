/* ============================================================
   data_chars.js —— 30 个水浒棋子
   每个角色字段：
     id          唯一标识（用于图片文件名 sprite_<id>.png）
     name / nick 姓名 / 绰号
     cost        1~5 费
     traits      羁绊数组
     hp/atk/as/range/armor/mana  基础属性
     skill       { name, type, value, radius?, count? }
     color       主色  color2 副色
     weapon      武器类型（dagger/axe/spear/guandao/bow/sword/
                 staff/mace/fist/fan/whip）
     size        体型缩放 0.85 ~ 1.15
   ============================================================ */
'use strict';

var CHARS = [
  /* ==================== 1 费 ==================== */
  { id:'shiqian', name:'时迁', nick:'鼓上蚤', cost:1,
    traits:['地煞','刺客'],
    hp:480, atk:45, as:0.80, range:1, armor:12, mana:50,
    skill:{ name:'妙手空空', type:'damage', value:180 },
    color:'#5a4a3a', color2:'#2a2018', weapon:'dagger', size:0.85 },

  { id:'likui', name:'李逵', nick:'黑旋风', cost:1,
    traits:['地煞','豪侠'],
    hp:640, atk:52, as:0.60, range:1, armor:20, mana:70,
    skill:{ name:'狂怒旋风', type:'aoe', value:120, radius:1 },
    color:'#252525', color2:'#5a1a1a', weapon:'axe', size:1.05 },

  { id:'baisheng', name:'白胜', nick:'白日鼠', cost:1,
    traits:['地煞','刺客'],
    hp:460, atk:40, as:0.75, range:1, armor:10, mana:60,
    skill:{ name:'蒙汗药', type:'stun', value:1.8 },
    color:'#8a7a5a', color2:'#4a3a28', weapon:'dagger', size:0.85 },

  { id:'shixiu', name:'石秀', nick:'拼命三郎', cost:1,
    traits:['地煞','刺客'],
    hp:560, atk:58, as:0.85, range:1, armor:15, mana:65,
    skill:{ name:'拼命三郎', type:'buff', value:0.6 },
    color:'#6a4a3a', color2:'#a83a2a', weapon:'sword', size:0.95 },

  { id:'ruanxiaoqi', name:'阮小七', nick:'活阎罗', cost:1,
    traits:['地煞','水军'],
    hp:520, atk:48, as:0.70, range:1, armor:14, mana:60,
    skill:{ name:'顺水推舟', type:'damage', value:160 },
    color:'#2a5a6a', color2:'#1a3a4a', weapon:'dagger', size:0.95 },

  { id:'ruanxiaowu', name:'阮小五', nick:'短命二郎', cost:1,
    traits:['地煞','水军'],
    hp:500, atk:50, as:0.70, range:1, armor:13, mana:60,
    skill:{ name:'短命斩', type:'damage', value:170 },
    color:'#2a4a6a', color2:'#1a2a4a', weapon:'sword', size:0.95 },

  /* ==================== 2 费 ==================== */
  { id:'wusong', name:'武松', nick:'行者', cost:2,
    traits:['地煞','步兵'],
    hp:720, atk:64, as:0.70, range:1, armor:22, mana:60,
    skill:{ name:'打虎三拳', type:'damage', value:280 },
    color:'#5a4a3a', color2:'#8a2a2a', weapon:'fist', size:1.00 },

  { id:'huarong', name:'花荣', nick:'小李广', cost:2,
    traits:['地煞','弓手'],
    hp:540, atk:70, as:0.85, range:3, armor:10, mana:65,
    skill:{ name:'连珠箭', type:'multi', value:90, count:3 },
    color:'#3a6a4a', color2:'#c8c8a0', weapon:'bow', size:0.95 },

  { id:'lusda', name:'鲁智深', nick:'花和尚', cost:2,
    traits:['地煞','豪侠','步兵'],
    hp:800, atk:58, as:0.55, range:1, armor:28, mana:80,
    skill:{ name:'倒拔垂柳', type:'aoe', value:160, radius:2 },
    color:'#6a4a2a', color2:'#c88a3a', weapon:'staff', size:1.10 },

  { id:'zhutong', name:'朱仝', nick:'美髯公', cost:2,
    traits:['天罡','步兵'],
    hp:740, atk:60, as:0.70, range:1, armor:24, mana:65,
    skill:{ name:'美髯刀', type:'damage', value:230 },
    color:'#3a5a8a', color2:'#1a2a4a', weapon:'guandao', size:1.00 },

  { id:'leiheng', name:'雷横', nick:'插翅虎', cost:2,
    traits:['天罡','步兵'],
    hp:760, atk:62, as:0.65, range:1, armor:25, mana:70,
    skill:{ name:'插翅扑击', type:'charge', value:200 },
    color:'#5a3a2a', color2:'#8a5a2a', weapon:'axe', size:1.00 },

  { id:'ruanxiaoer', name:'阮小二', nick:'立地太岁', cost:2,
    traits:['天罡','水军'],
    hp:680, atk:56, as:0.70, range:1, armor:20, mana:75,
    skill:{ name:'立地太岁', type:'heal', value:350 },
    color:'#2a5a4a', color2:'#1a3a2a', weapon:'staff', size:1.00 },

  { id:'zhangshun', name:'张顺', nick:'浪里白条', cost:2,
    traits:['天罡','水军','刺客'],
    hp:600, atk:70, as:0.90, range:1, armor:15, mana:60,
    skill:{ name:'浪里白条', type:'buff', value:0.5 },
    color:'#c8d8e8', color2:'#4a6a8a', weapon:'dagger', size:0.95 },

  { id:'yanqing', name:'燕青', nick:'浪子', cost:2,
    traits:['天罡','刺客','弓手'],
    hp:580, atk:75, as:0.90, range:2, armor:14, mana:60,
    skill:{ name:'相扑绝技', type:'damage', value:250 },
    color:'#8a5a4a', color2:'#e8c8a0', weapon:'fist', size:0.95 },

  /* ==================== 3 费 ==================== */
  { id:'daizong', name:'戴宗', nick:'神行太保', cost:3,
    traits:['地煞','弓手'],
    hp:700, atk:74, as:0.90, range:3, armor:15, mana:55,
    skill:{ name:'神行法', type:'buff', value:0.5 },
    color:'#4a5a8a', color2:'#c8c8d8', weapon:'bow', size:0.95 },

  { id:'linchong', name:'林冲', nick:'豹子头', cost:3,
    traits:['天罡','五虎','步兵'],
    hp:880, atk:80, as:0.70, range:1, armor:26, mana:70,
    skill:{ name:'蛇矛突刺', type:'damage', value:230 },
    color:'#2a4a6a', color2:'#c8b070', weapon:'spear', size:1.00 },

  { id:'wuyong', name:'吴用', nick:'智多星', cost:3,
    traits:['天罡','法师'],
    hp:620, atk:56, as:0.65, range:3, armor:12, mana:90,
    skill:{ name:'智取生辰纲', type:'stun', value:2 },
    color:'#5a5a7a', color2:'#e8e0c0', weapon:'fan', size:0.90 },

  { id:'yangzhi', name:'杨志', nick:'青面兽', cost:3,
    traits:['天罡','步兵'],
    hp:900, atk:82, as:0.65, range:1, armor:28, mana:70,
    skill:{ name:'青面劈斩', type:'damage', value:270 },
    color:'#3a5a3a', color2:'#8a9a5a', weapon:'sword', size:1.00 },

  { id:'suochao', name:'索超', nick:'急先锋', cost:3,
    traits:['天罡','骑兵'],
    hp:820, atk:88, as:0.70, range:1, armor:22, mana:65,
    skill:{ name:'急先锋冲锋', type:'charge', value:290 },
    color:'#8a3a2a', color2:'#e8a020', weapon:'axe', size:1.00 },

  { id:'litang', name:'刘唐', nick:'赤发鬼', cost:3,
    traits:['天罡','豪侠'],
    hp:800, atk:85, as:0.70, range:1, armor:20, mana:70,
    skill:{ name:'赤发鬼劈砍', type:'aoe', value:210, radius:1 },
    color:'#8a2a1a', color2:'#c85a2a', weapon:'axe', size:1.00 },

  { id:'lijun', name:'李俊', nick:'混江龙', cost:3,
    traits:['天罡','水军'],
    hp:840, atk:78, as:0.75, range:1, armor:24, mana:70,
    skill:{ name:'混江龙', type:'damage', value:260 },
    color:'#2a5a5a', color2:'#8ac8c8', weapon:'spear', size:1.00 },

  /* ==================== 4 费 ==================== */
  { id:'qinming', name:'秦明', nick:'霹雳火', cost:4,
    traits:['天罡','五虎','步兵'],
    hp:1050, atk:98, as:0.60, range:1, armor:30, mana:85,
    skill:{ name:'狼牙棒', type:'aoe', value:260, radius:2 },
    color:'#8a3a2a', color2:'#e8a020', weapon:'mace', size:1.10 },

  { id:'huyanzhuo', name:'呼延灼', nick:'双鞭', cost:4,
    traits:['天罡','五虎','骑兵'],
    hp:1100, atk:90, as:0.75, range:1, armor:32, mana:75,
    skill:{ name:'连环马', type:'charge', value:300 },
    color:'#5a3a2a', color2:'#8a8a9a', weapon:'whip', size:1.05 },

  { id:'dongping', name:'董平', nick:'双枪将', cost:4,
    traits:['天罡','五虎','骑兵'],
    hp:1020, atk:100, as:0.80, range:1, armor:28, mana:70,
    skill:{ name:'双枪突刺', type:'multi', value:140, count:3 },
    color:'#4a3a6a', color2:'#c8a8e8', weapon:'spear', size:1.00 },

  { id:'zhangqing', name:'张清', nick:'没羽箭', cost:4,
    traits:['天罡','弓手'],
    hp:880, atk:105, as:0.85, range:3, armor:18, mana:70,
    skill:{ name:'没羽箭', type:'multi', value:120, count:4 },
    color:'#6a5a3a', color2:'#c8b880', weapon:'bow', size:1.00 },

  { id:'xuning', name:'徐宁', nick:'金枪手', cost:4,
    traits:['天罡','骑兵'],
    hp:1080, atk:96, as:0.75, range:1, armor:30, mana:75,
    skill:{ name:'金枪连刺', type:'multi', value:160, count:2 },
    color:'#6a5a2a', color2:'#e8c84a', weapon:'spear', size:1.05 },

  /* ==================== 5 费 ==================== */
  { id:'guansheng', name:'关胜', nick:'大刀', cost:5,
    traits:['天罡','五虎','豪侠'],
    hp:1350, atk:122, as:0.65, range:1, armor:40, mana:100,
    skill:{ name:'青龙偃月', type:'aoe', value:400, radius:3 },
    color:'#8a2a2a', color2:'#3a5a3a', weapon:'guandao', size:1.15 },

  { id:'songjiang', name:'宋江', nick:'及时雨', cost:5,
    traits:['天罡','豪侠','步兵'],
    hp:1250, atk:100, as:0.70, range:2, armor:35, mana:100,
    skill:{ name:'及时雨', type:'heal', value:500 },
    color:'#3a6a3a', color2:'#e8c84a', weapon:'sword', size:1.00 },

  { id:'lujunyi', name:'卢俊义', nick:'玉麒麟', cost:5,
    traits:['天罡','豪侠','步兵'],
    hp:1400, atk:128, as:0.70, range:1, armor:38, mana:95,
    skill:{ name:'玉麒麟枪', type:'aoe', value:380, radius:2 },
    color:'#c8b8a0', color2:'#8a3a3a', weapon:'spear', size:1.10 },

  { id:'gongsunsheng', name:'公孙胜', nick:'入云龙', cost:5,
    traits:['天罡','法师'],
    hp:1000, atk:110, as:0.75, range:3, armor:25, mana:110,
    skill:{ name:'五雷正法', type:'aoe', value:450, radius:3 },
    color:'#3a4a8a', color2:'#c8d8e8', weapon:'staff', size:1.05 },
  /* ==================== 7 费 ==================== */
  { id:'chaogai', name:'晁盖', nick:'托塔天王', cost:7,
    traits:['托塔天王'], // 👈 只有专属羁绊，没有天罡、豪侠
    hp:1600, atk:140, as:0.75, range:1, armor:45, mana:120,
    skill:{ name:'托塔镇魂', type:'aoe', value:600, radius:3 },
    color:'#ffcc00', color2:'#8a1a1a', weapon:'mace', size:1.15 },

];

var CHAR_BY_ID = {};
for (var _ci = 0; _ci < CHARS.length; _ci++) {
  CHAR_BY_ID[CHARS[_ci].id] = CHARS[_ci];
}