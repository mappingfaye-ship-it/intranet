const OI={w:"📝",x:"📊",p:"🎞️"},OP={w:"doc.html",x:"sheet.html",p:"slides.html"},ON={w:"Document",x:"Tableur",p:"Présentation"};
function clean(h){const d=new DOMParser().parseFromString(h||"","text/html");d.querySelectorAll("script,iframe,object,embed,link,meta,style,form,base,svg").forEach(e=>e.remove());d.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(a=>{const n=a.name.toLowerCase(),v=a.value.trim().toLowerCase();if(n.startsWith("on")||(["href","src","action","formaction"].includes(n)&&/^(javascript|vbscript|data:text)/.test(v)))e.removeAttribute(a.name)})});return d.body.innerHTML}
async function ofLoad(id){const m=await DB.get("officeidx/"+id),c=await DB.get("office/"+id);if(!m||!c)return null;let j={};try{j=JSON.parse(c.c||"{}")}catch(e){}return{m,c:j}}
async function ofSave(id,m,c){const ts=Date.now();await DB.put("office/"+id,{o:m.o,ty:m.ty,ts,c:JSON.stringify(c)});await DB.put("officeidx/"+id,{...m,ts})}
const canEd=(m,me)=>m.o==me.key||me.role=="admin"||me.role=="editeur";
const stSet=t=>{const e=document.getElementById("st");if(e)e.textContent=t};
function debounce(fn){let t;return()=>{clearTimeout(t);stSet("…");t=setTimeout(async()=>{try{await fn();stSet("Enregistré ✓")}catch(e){stSet("Erreur : "+e.message)}},1200)}}
function dlBlob(name,type,data){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click()}
