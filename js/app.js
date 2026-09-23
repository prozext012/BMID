"use strict";
/* ============ TITIK MASUK & MODE OTOMATIS ============ */

let autoTimer=null;
const SPEED_MS={1:4000,2:2000,4:1000}; // ms per hari: 1x/2x/4x

function tick(){
  if(!S||!S.auto)return;
  if(S.autoPause){
    S.autoPause=false;S.auto=false;
    if(autoTimer){clearInterval(autoTimer);autoTimer=null;}
    logEv('Mode otomatis DIJEDA karena kejadian penting (mogok/kecelakaan). Klik "Auto Jalan" untuk melanjutkan.','warn');
    save();render();return;
  }
  runDay();
}
function startTimer(){
  if(autoTimer)clearInterval(autoTimer);
  autoTimer=setInterval(tick,SPEED_MS[S.speed]||4000);
}
function setAuto(on){
  S.auto=!!on;
  if(autoTimer){clearInterval(autoTimer);autoTimer=null;}
  if(S.auto)startTimer();
  save();render();
}
function setSpeed(v){
  S.speed=+v;save();
  if(S.auto)startTimer();else render();
}

(function init(){
  if(!load())newGame();
  // migrasi save lama agar punya field mode auto
  if(S.auto===undefined)S.auto=false;
  if(S.speed===undefined)S.speed=1;
  if(S.autoPause===undefined)S.autoPause=false;
  render();
})();
