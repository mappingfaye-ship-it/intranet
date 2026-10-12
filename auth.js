const TH=[["sombre","🌙"],["clair","☀️"],["chartreuse","🌿"],["ocean","🌊"]];
const S=()=>JSON.parse(localStorage.sess||"null"),cur=()=>document.documentElement.dataset.theme||"sombre",TI=()=>(TH.find(t=>t[0]==cur())||TH[0])[1];
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.theme=t}
function cycle(b){const n=TH[(TH.findIndex(t=>t[0]==cur())+1)%TH.length];setTheme(n[0]);b.textContent=n[1]}
function logout(){localStorage.removeItem("sess");location.href="index.html"}
async function login(u,p){let us;try{await ensureSeed();us=await DB.get("users")}catch(e){}us=us||DEFAULT_USERS;const k=(u||"").trim().toLowerCase(),r=us[k];if(r&&r.pin===p){localStorage.sess=JSON.stringify({key:k,name:r.name,role:r.role,perms:r.perms||{}});return true}return false}
function render(s,page){document.querySelectorAll(".top,.tn").forEach(e=>e.remove());const ok=k=>!k||s.role=="admin"||s.perms[k],L=(h,k,i,t,p)=>ok(p)?`<a href="${h}" class="${page==k?"on":""}"><i>${i}</i><span>${t}</span>${k=="c"?'<b class="dot" id="dc"></b>':""}</a>`:"";
document.body.insertAdjacentHTML("afterbegin",`<header class="top"><b class="grad brand">🎬 Chartreuse</b><span class="sp"></span><span class="who">${esc(s.name)}</span><button class="ib" onclick="cycle(this)" aria-label="Thème">${TI()}</button><button class="ib" onclick="chPin()" aria-label="Mon PIN">🔑</button><button class="ib" onclick="logout()" aria-label="Déconnexion">⎋</button></header><nav class="tn">${L("accueil.html","a","🏠","Accueil")}${L("agenda.html","g","🗓️","Agenda","agenda")}${L("taches.html","t","✅","Tâches","taches")}${L("chat.html","c","💬","Chat","chat")}${s.role=="admin"?L("admin.html","m","⚙️","Admin"):""}</nav>`)}
async function chPin(){const s=S(),r=await DB.get("users/"+s.key);if(!r||prompt("PIN actuel ?")!==r.pin)return alert("PIN incorrect");const n=prompt("Nouveau PIN (6 chiffres) ?");if(!/^\d{6}$/.test(n||""))return alert("Il faut 6 chiffres");await DB.put("users/"+s.key+"/pin",n);alert("PIN modifié ✅")}
async function unread(page){try{const o=await DB.get("chat")||{},m=Math.max(0,...Object.values(o).map(v=>v.ts));if(!localStorage.seen||page=="c")localStorage.seen=page=="c"?m:Date.now();const d=document.getElementById("dc");if(d)d.style.display=m>+localStorage.seen?"block":"none"}catch(e){}}
const never=()=>new Promise(()=>{});
async function boot(page,perm){const s=S();if(!s){location.replace("index.html");return never()}render(s,page);localBanner();
try{await ensureSeed();const r=await DB.get("users/"+s.key);if(!r){logout();return never()}const n={key:s.key,name:r.name,role:r.role,perms:r.perms||{}};if(JSON.stringify(n)!=JSON.stringify(s)){localStorage.sess=JSON.stringify(n);Object.assign(s,n);render(s,page)}
if(!localStorage.theme){const t=await DB.get("settings/theme");if(t){document.documentElement.dataset.theme=t;render(s,page)}}}catch(e){}
if((page=="m"&&s.role!="admin")||(perm&&s.role!="admin"&&!s.perms[perm])){location.replace("accueil.html");return never()}
unread(page);setInterval(()=>unread(page),8000);return s}
