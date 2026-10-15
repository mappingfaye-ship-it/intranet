const emailOf=(k,v)=>`${k}${v?".v"+v:""}@chartreuse.app`;
const DEF_PERMS={agenda:1,chat:1,taches:1,mail:1,drive:1,office:1};
const pair=(a,b)=>[a,b].sort().join("_");
const Auth={
get s(){return JSON.parse(localStorage.fbs||"null")},
save(o){localStorage.fbs=JSON.stringify(o)},
clear(){localStorage.removeItem("fbs");localStorage.removeItem("sess")},
async token(){const s=this.s;if(!s)throw new Error("Session expirée");if(Date.now()<s.exp-60000)return s.idt;
const r=await fetch(`https://securetoken.googleapis.com/v1/token?key=${CONFIG.apiKey}`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(s.rt)});const j=await r.json();
if(!j.id_token)throw new Error("Session expirée");this.save({rt:j.refresh_token,idt:j.id_token,exp:Date.now()+j.expires_in*1000,uid:j.user_id});return j.id_token}};
async function fbAuth(kind,email,password){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${kind}?key=${CONFIG.apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,returnSecureToken:true})});const j=await r.json();if(j.error)throw new Error(j.error.message);return j}
const DB={
base:(CONFIG.url||"").replace(/\/$/,""),ok:!!(CONFIG.url&&CONFIG.apiKey),
async req(m,p,body,q=""){const t=await Auth.token(),r=await fetch(`${this.base}/${p}.json?${q}${q?"&":""}auth=${t}`,{method:m,body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error(r.status==401||r.status==403?"Accès refusé":"Erreur "+r.status);return r.json()},
get(p){return this.req("GET",p)},put(p,v){return this.req("PUT",p,v)},patch(p,v){return this.req("PATCH",p,v)},del(p){return this.req("DELETE",p)},
last(p,n){return this.req("GET",p,undefined,"orderBy="+encodeURIComponent('"$key"')+"&limitToLast="+n)},
async pub(p){const r=await fetch(`${this.base}/${p}.json`);return r.json()},
async pubPut(p,v){const r=await fetch(`${this.base}/${p}.json`,{method:"PUT",body:JSON.stringify(v)});if(!r.ok)throw new Error("Envoi refusé")},
id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,4)},
watch(p,cb,ms=4000){let last;const t=async()=>{try{const v=await this.get(p),s=JSON.stringify(v);if(s!==last){last=s;cb(v)}}catch(e){if(/expir|refus/.test(e.message))logout()}};t();setInterval(t,ms)}};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
function fmt(t){let h="",ul=false;for(const l of(t||"").split("\n")){const m=l.startsWith("- ");if(ul&&!m){h+="</ul>";ul=false}if(m){if(!ul){h+="<ul>";ul=true}h+="<li>"+inl(l.slice(2))+"</li>"}else if(l.startsWith("## "))h+="<h3>"+inl(l.slice(3))+"</h3>";else if(l.trim())h+="<p>"+inl(l)+"</p>"}return h+(ul?"</ul>":"")}
let USR={};async function users(){const m=await DB.get("members")||{};USR={};for(const[u,p]of Object.entries(m))USR[p.key]={...p,uid:u};return USR}
function audHTML(id,sel="all"){const s=sel=="all"?null:sel.split(",");return `<div class="chk" id="${id}"><label><input type="checkbox" value="all" ${!s?"checked":""} onchange="audTog(this)"> 👥 Tous</label>${Object.entries(USR).filter(([k,u])=>u.role!="admin").map(([k,u])=>`<label><input type="checkbox" value="${k}" ${s&&s.includes(k)?"checked":""} onchange="audTog(this)"> ${esc(u.name)}</label>`).join("")}</div>`}
function audTog(c){const b=[...c.closest(".chk").querySelectorAll("input")];if(c.value=="all"&&c.checked)b.forEach(x=>x.checked=x==c);else if(c.checked)b[0].checked=false;if(!b.some(x=>x.checked))b[0].checked=true}
const audGet=id=>{const v=[...document.querySelectorAll("#"+id+" input:checked")].map(x=>x.value);return v.includes("all")?"all":v.join(",")};
/* diffusion : chaque personne reçoit sa propre copie, donc ne peut lire que ce qui lui est destiné */
async function publish(coll,id,v,to){await DB.put(`admin/${coll}/${id}`,{...v,to});await Promise.all(Object.entries(USR).map(([k,u])=>{const inc=to=="all"||u.role=="admin"||to.split(",").includes(k),p=`${coll}/${k}/${id}`;return inc?(coll=="tasks"?DB.patch(p,v):DB.put(p,v)):DB.del(p)}))}
async function unpublish(coll,id){await DB.del(`admin/${coll}/${id}`);await Promise.all(Object.keys(USR).map(k=>DB.del(`${coll}/${k}/${id}`)))}
async function backfill(k){const u=USR[k];for(const c of["updates","events","tasks","perso"]){const o=await DB.get("admin/"+c)||{};for(const[id,v]of Object.entries(o)){const{to,...r}=v;if(to=="all"||u.role=="admin"||to.split(",").includes(k))await DB.put(`${c}/${k}/${id}`,r)}}}
async function createUser(k,name,role,pin,perms=DEF_PERMS){let v=await DB.pub("ver/"+k)||0,j;for(let i=0;i<6&&!j;i++){try{j=await fbAuth("signUp",emailOf(k,v),pin)}catch(e){if(e.message.startsWith("EMAIL_EXISTS")){v++;continue}throw e}}
if(!j)throw new Error("Création impossible");await DB.put("members/"+j.localId,{key:k,name,role,perms});if(v)await DB.put("ver/"+k,v);await users();await backfill(k)}
const A=v=>Object.values(v&&v.att||{});
const FC={};
async function fileGet(id){if(FC[id])return FC[id];const f=await DB.get("files/"+id);if(!f)return null;const b=await(await fetch(f.d)).blob();return FC[id]={n:f.n,t:f.t,u:URL.createObjectURL(new Blob([b],{type:f.t}))}}
const attHTML=ids=>ids&&ids.length?`<div class="att">${ids.map(i=>`<span data-f="${i}">⏳</span>`).join("")}</div>`:"";
async function hydrate(root){for(const s of root.querySelectorAll("[data-f]")){const f=await fileGet(s.dataset.f).catch(()=>null);if(!s.isConnected)continue;if(!f){s.textContent="(fichier indisponible)";continue}const t=f.t;s.outerHTML=t.startsWith("image/")?`<img src="${f.u}" alt="" onclick="zoom('${f.u}')">`:t.startsWith("video/")?`<video src="${f.u}" controls playsinline preload="metadata"></video>`:t.startsWith("audio/")?`<audio src="${f.u}" controls></audio>`:`<a href="${f.u}" target="_blank" download="${esc(f.n)}">📎 ${esc(f.n)}</a>`}}
const MURL=/https?:\/\/[^\s<>"']+\.(?:gif|png|jpe?g|webp)(?:\?[^\s<>"']*)?|https?:\/\/(?:media\d*\.giphy\.com|i\.giphy\.com|media\d*\.tenor\.com|c\.tenor\.com)\/[^\s<>"']+/gi;
const autoMedia=t=>(String(t).match(MURL)||[]).slice(0,3).map(u=>`<div class="att"><img src="${esc(u)}" alt="" loading="lazy" onclick="zoom(this.src)"></div>`).join("");
const readURL=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
function shrink(file){return new Promise((res,rej)=>{const i=new Image,u=URL.createObjectURL(file);i.onload=()=>{const k=Math.min(1,1400/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL("image/jpeg",.72))};i.onerror=()=>rej(new Error("x"));i.src=u})}
async function upFile(file){let d,t=file.type||"application/octet-stream",n=file.name;
if(t.startsWith("image/")&&!/gif|svg/.test(t)){try{d=await shrink(file);t="image/jpeg";n=n.replace(/\.\w+$/,"")+".jpg"}catch(e){}}
if(!d){if(file.size>3e6)throw new Error("Fichier trop lourd (max 3 Mo)");d=await readURL(file)}
const id=DB.id();await DB.put("files/"+id,{n,t,d,by:(JSON.parse(localStorage.sess||"{}")).key||"?"});return id}
function zoom(u){const d=document.createElement("div");d.className="lb";d.innerHTML=`<img src="${u}">`;d.onclick=()=>d.remove();document.body.append(d)}

const rndCode=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x%10).join("");
async function sendMail(to,subject,message){const e=CONFIG.emailjs||{};if(!e.service||!e.template||!e.key)return false;try{const r=await fetch("https://api.emailjs.com/api/v1.0/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({service_id:e.service,template_id:e.template,user_id:e.key,template_params:{to_email:to,subject,message}})});return r.ok}catch(x){return false}}
async function notify(keys,subject,message){let n=0;for(const k of keys){try{const e=await DB.get("emails/"+k);if(e&&await sendMail(e,subject,message))n++}catch(x){}}return n}
async function rekey(k,role,p,perms){const u=USR[k];let v=(await DB.pub("ver/"+k)||0)+1,j;for(let i=0;i<6&&!j;i++){try{j=await fbAuth("signUp",emailOf(k,v),p)}catch(e){if(e.message.startsWith("EMAIL_EXISTS")){v++;continue}throw e}}
if(!j)throw new Error("Échec");await DB.put("members/"+j.localId,{key:k,name:u.name,role,perms:perms||u.perms||{},...(u.disabled?{disabled:1}:{})});await DB.del("members/"+u.uid);await DB.put("ver/"+k,v);await users()}
const ago=t=>{if(!t)return"jamais";const m=Math.round((Date.now()-t)/6e4);return m<2?"à l'instant":m<60?"il y a "+m+" min":m<1440?"il y a "+Math.round(m/60)+" h":"il y a "+Math.round(m/1440)+" j"};
const bytes=b=>b>1e6?(b/1e6).toFixed(1)+" Mo":Math.round(b/1e3)+" Ko";
