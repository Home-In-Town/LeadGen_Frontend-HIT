import React,{useState} from 'react';
export function toMediaObject(v){if(!v)return{url:'',key:''};if(typeof v==='string')return{url:v,key:''};return{url:v.url||'',key:v.key||''};}
export function serializeMedia(m){if(!m?.url?.trim())return undefined;return{url:m.url.trim(),key:m.key||''};}
export function serializeMediaArray(a){return(a||[]).map(toMediaObject).filter(m=>m.url.trim());}
function ytThumb(u){if(!u)return null;const m=u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);return m?'https://img.youtube.com/vi/'+m[1]+'/mqdefault.jpg':null;}
const INP='w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none transition-all';
const LBL='block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';
const SEC='border-t border-slate-100 dark:border-white/5 pt-5';
const RMB='flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all';
const OTB='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all';
const ADB='inline-flex items-center gap-1 text-[10px] font-black text-primary hover:underline';
