const TH=[["sombre","🌙"],["clair","☀️"],["chartreuse","🌿"],["ocean","🌊"]];
const S=()=>JSON.parse(localStorage.sess||"null"),cur=()=>document.documentElement.dataset.theme||"sombre",TI=()=>(TH.find(t=>t[0]==cur())||TH[0])[1];
let UNR={};const never=()=>new Promise(()=>{});
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.theme=t}
function cycle(b){const n=TH[(TH.findIndex(t=>t[0]==cur())+1)%TH.length];setTheme(n[0]);b.textContent=n[1]}
function logout(){Auth.clear();location.href="index.html"}
async function login(user,pw){if(!DB.ok)throw new Error(!CONFIG.apiKey?"apiKey vide : config.js ancien en cache ?":"url vide dans config.js");const k=(user||"").trim().toLowerCase();if(!k)throw new Error("Identifiant ?");
const v=await DB.pub("ver/"+k)||0;let j;try{j=await fbAuth("signInWithPassword",emailOf(k,v),pw)}catch(e){throw new Error(/TOO_MANY/.test(e.message)?"Trop d'essais, patiente quelques minutes":"Identifiant ou code incorrect")}
Auth.save({rt:j.refreshToken,idt:j.idToken,exp:Date.now()+j.expiresIn*1000,uid:j.localId});let m;try{m=await DB.get("members/"+j.localId)}catch(e){}if(!m){Auth.clear();throw new Error("Compte non autorisé")}
localStorage.sess=JSON.stringify({key:m.key,name:m.name,role:m.role,perms:m.perms||{},uid:j.localId})}
function render(s,page){document.querySelectorAll(".top,.tn").forEach(e=>e.remove());const ok=k=>!k||s.role=="admin"||s.perms[k],L=(h,k,i,t,p,d)=>ok(p)?`<a href="${h}" class="${page==k?"on":""}"><i>${i}</i><span>${t}</span>${d?`<b class="dot" id="${d}"></b>`:""}</a>`:"";
document.body.insertAdjacentHTML("afterbegin",`<header class="top"><b class="grad brand">🎬 Chartreuse</b><span class="sp"></span><span class="who">${esc(s.name)}</span><button class="ib" onclick="cycle(this)" aria-label="Thème">${TI()}</button><button class="ib" onclick="chPin()" aria-label="Mon code">🔑</button><button class="ib" onclick="logout()" aria-label="Déconnexion">⎋</button></header><nav class="tn">${L("accueil.html","a","🏠","Accueil")}${L("agenda.html","g","🗓️","Agenda","agenda")}${L("taches.html","t","✅","Tâches","taches")}${L("chat.html","c","💬","Chat","chat","dc")}${L("mail.html","e","✉️","Mail","mail","dm")}${s.role=="admin"?L("admin.html","m","⚙️","Admin"):""}</nav>`)}
async function chPin(){const s=S(),n=s.role=="admin"?10:6,o=prompt("Code actuel ?");if(!o)return;const v=await DB.pub("ver/"+s.key)||0;let j;try{j=await fbAuth("signInWithPassword",emailOf(s.key,v),o)}catch(e){return alert("Code incorrect")}
const p=prompt(`Nouveau code (${n} chiffres) ?`);if(!new RegExp(`^\\d{${n}}$`).test(p||""))return alert(`Il faut ${n} chiffres`);
const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${CONFIG.apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:j.idToken,password:p})});alert(r.ok?"Code modifié ✅":"Échec")}
const setDot=(id,b)=>{const d=document.getElementById(id);if(d)d.style.display=b?"block":"none"};
async function unread(){try{const me=S(),seen=JSON.parse(localStorage.seen||"{}"),U={};let chat=false,mail=false;
if(me.role=="admin"||me.perms.chat){await users();const ths=["chat",...Object.keys(USR).filter(k=>k!=me.key).map(k=>"dm/"+pair(me.key,k))];
await Promise.all(ths.map(async p=>{try{const o=Object.values(await DB.last(p,1)||{}),l=o[0]||{};if(seen[p]===undefined)seen[p]=Date.now();U[p]=(l.ts||0)>seen[p]&&l.k!=me.key;if(U[p])chat=true}catch(e){}}));localStorage.seen=JSON.stringify(seen)}
if(me.role=="admin"||me.perms.mail){const o=await DB.get("mail/"+me.key)||{};mail=Object.values(o).some(v=>!v.read)}
UNR=U;setDot("dc",chat);setDot("dm",mail)}catch(e){}}
async function boot(page,perm){const s=S();if(!s||!Auth.s){logout();return never()}render(s,page);
try{const r=await DB.get("members/"+Auth.s.uid);if(!r){logout();return never()}const n={key:r.key,name:r.name,role:r.role,perms:r.perms||{},uid:Auth.s.uid};if(JSON.stringify(n)!=JSON.stringify(s)){localStorage.sess=JSON.stringify(n);Object.assign(s,n);render(s,page)}
if(!localStorage.theme){const t=await DB.get("settings/theme");if(t){document.documentElement.dataset.theme=t;render(s,page)}}}catch(e){if(/expir|refus/.test(e.message)){logout();return never()}}
if((page=="m"&&s.role!="admin")||(perm&&s.role!="admin"&&!s.perms[perm])){location.replace("accueil.html");return never()}
unread();setInterval(unread,8000);return s}
