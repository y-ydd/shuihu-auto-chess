/* ============================================================
   data_terrain.js —— 地形数据
   双方共享同一张地形图（镜像对称）
   ============================================================ */
   'use strict';

   var TERRAIN_TYPES = {
     plain: {
       name: '平地',
       fill: null,
       border: null,
       icon: null,
       desc: '无特殊效果',
     },
     water: {
       name: '水泊',
       fill: 'rgba(60, 130, 220, 0.16)',
       border: 'rgba(90, 170, 255, 0.70)',
       icon: 'water',
       desc: '水军攻速 +30% · 法师回蓝 +50% · 骑兵移速减半',
     },
     forest: {
       name: '山林',
       fill: 'rgba(60, 160, 90, 0.16)',
       border: 'rgba(90, 210, 120, 0.70)',
       icon: 'forest',
       desc: '刺客/弓手受击减伤 20%',
     },
     road: {
       name: '官道',
       fill: 'rgba(210, 170, 80, 0.16)',
       border: 'rgba(240, 200, 110, 0.70)',
       icon: 'road',
       desc: '移速翻倍 · 会被敌方优先索敌',
     },
   };