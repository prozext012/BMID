"use strict";
/* ============ TITIK MASUK APLIKASI ============ */

(function init(){
  if(!load()){    // tidak ada save -> mulai karir baru
    newGame();
  }
  render();
})();
