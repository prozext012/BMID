"use strict";
/* ============ GAMBAR BUS ============
   Prioritas: FOTO ASLI dari assets/bus/.
   Jika foto belum ada / gagal dimuat, otomatis
   fallback ke gambar SVG buatan (tidak pernah blank).
==================================== */

/* Menampilkan foto bus asli; bingkai berwarna = livery PO */
function busImg(modelId,livery){
  const m=modelOf(modelId);
  const src='assets/bus/'+m.foto;
  return `<div class="busimg" style="border-color:${livery||'#e4e9f2'}">`
    +`<img src="${src}" alt="${m.nama}" loading="lazy" `
    +`onerror="this.outerHTML=busSVG('${modelId}','${livery||'#2563eb'}')">`
    +`</div>`;
}

/* SVG fallback: bentuk bus berbeda per deck
   std = standar, shd = lebih tinggi, dd = double decker */
function busSVG(modelId,color){
  const m=modelOf(modelId);
  if(m.deck==='dd'){
    return `<svg viewBox="0 0 240 112" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="120" cy="106" rx="105" ry="5" fill="#000" opacity=".15"/>
    <rect x="10" y="8" width="220" height="84" rx="10" fill="${color}"/>
    <rect x="10" y="8" width="220" height="13" rx="7" fill="${shade(color,-25)}"/>
    <rect x="20" y="25" width="196" height="20" rx="3" fill="#dfe9f7"/>
    <rect x="20" y="53" width="196" height="17" rx="3" fill="#dfe9f7"/>
    <rect x="10" y="78" width="220" height="14" rx="5" fill="${shade(color,-40)}"/>
    <rect x="18" y="49" width="204" height="3" fill="#fff" opacity=".85"/>
    <rect x="212" y="30" width="14" height="42" rx="3" fill="#b9cde6"/>
    <circle cx="58" cy="95" r="13" fill="#1a1a1a"/><circle cx="58" cy="95" r="6" fill="#9aa5b5"/>
    <circle cx="188" cy="95" r="13" fill="#1a1a1a"/><circle cx="188" cy="95" r="6" fill="#9aa5b5"/>
    <rect x="222" y="62" width="8" height="7" rx="2" fill="#ffe9a8"/>
    <rect x="60" y="10" width="70" height="6" rx="3" fill="${shade(color,35)}"/></svg>`;
  }
  const shd=m.deck==='shd',h=shd?72:58,y=shd?12:22;
  return `<svg viewBox="0 0 240 ${y+h+26}" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="120" cy="${y+h+18}" rx="105" ry="5" fill="#000" opacity=".15"/>
  <rect x="10" y="${y}" width="220" height="${h}" rx="9" fill="${color}"/>
  <rect x="10" y="${y}" width="220" height="11" rx="6" fill="${shade(color,-25)}"/>
  <rect x="20" y="${y+15}" width="196" height="${shd?24:17}" rx="3" fill="#dfe9f7"/>
  <rect x="10" y="${y+h-14}" width="220" height="14" rx="5" fill="${shade(color,-40)}"/>
  <rect x="18" y="${y+h-18}" width="204" height="3" fill="#fff" opacity=".85"/>
  <rect x="212" y="${y+18}" width="14" height="${h-30}" rx="3" fill="#b9cde6"/>
  <circle cx="58" cy="${y+h+7}" r="12" fill="#1a1a1a"/><circle cx="58" cy="${y+h+7}" r="5.5" fill="#9aa5b5"/>
  <circle cx="188" cy="${y+h+7}" r="12" fill="#1a1a1a"/><circle cx="188" cy="${y+h+7}" r="5.5" fill="#9aa5b5"/>
  <rect x="222" y="${y+h-22}" width="8" height="7" rx="2" fill="#ffe9a8"/>
  <rect x="60" y="${y+2}" width="70" height="6" rx="3" fill="${shade(color,35)}"/></svg>`;
}
