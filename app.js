(()=>{"use strict";
const KEY="armwrestle-pwa-v1";
let state={matches:[],training:[]};
try{state=JSON.parse(localStorage.getItem(KEY)||'{"matches":[],"training":[]}')}catch(e){}
if(!Array.isArray(state.matches))state.matches=[];if(!Array.isArray(state.training))state.training=[];
const $=id=>document.getElementById(id),save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const form={type:"Practice",arm:"Right",singleStrap:"No",side:"Left",result:"Win",go:"I hit first",trainingArm:"Both",quality:"Good"};
let scope="Tournament",roundNumber=0,editingMatchId=null,editingTrainingId=null;
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function setGroup(id,key,value){form[key]=value;const el=$(id);if(!el)return;el.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===value))}
function resetRoundEditor(){$("rounds").innerHTML="";roundNumber=0}
function resetMatchForm(){editingMatchId=null;$("matchForm").reset();resetRoundEditor();form.type="Practice";form.arm="Right";form.singleStrap="No";form.side="Left";form.result="Win";form.go="I hit first";$("matchMode").textContent="New Match";$("cancelMatchEdit").classList.add("hidden");setGroup("matchType","type","Practice");setGroup("arm","arm","Right");setGroup("singleStrap","singleStrap","No");setGroup("tableSide","side","Left");setGroup("result","result","Win");setGroup("go","go","I hit first");$("singleFields").classList.remove("hidden");$("superFields").classList.add("hidden")}
function loadMatchForEdit(id){const m=state.matches.find(x=>x.id===id);if(!m)return;editingMatchId=id;page("match");$("matchMode").textContent="Edit Match";$("cancelMatchEdit").classList.remove("hidden");$("opponent").value=m.opponent||"";$("myWeight").value=m.myWeight||"";$("oppWeight").value=m.oppWeight||"";$("myHeight").value=m.myHeight||"";$("oppHeight").value=m.oppHeight||"";$("weightClass").value=m.weightClass||"Not recorded";$("comments").value=m.comments||"";setGroup("matchType","type",m.matchType);setGroup("arm","arm",m.arm);setGroup("tableSide","side",m.side);if(m.matchType==="Supermatch"){$("singleFields").classList.add("hidden");$("superFields").classList.remove("hidden");resetRoundEditor();(m.rounds||[]).forEach(r=>addRound(r))}else{$("singleFields").classList.remove("hidden");$("superFields").classList.add("hidden");setGroup("singleStrap","singleStrap",m.strap||"No");setGroup("result","result",m.result||"Win");setGroup("go","go",m.go||"Unclear");$("myTech").value=m.myTech||"Not recorded";$("oppTech").value=m.oppTech||"Not recorded";$("length").value=m.length||"Not recorded"}}
function deleteMatch(id){if(!confirm("Delete this match? This cannot be undone."))return;state.matches=state.matches.filter(m=>m.id!==id);save();renderDashboard();renderHistory();renderOpponents()}
function loadTrainingForEdit(id){const t=state.training.find(x=>x.id===id);if(!t)return;editingTrainingId=id;page("training");$("tCategory").value=t.category||"Pronation";$("sets").value=t.sets||"1";$("reps").value=t.reps||"1";$("resistance").value=t.resistance||"Bodyweight";$("intensity").value=t.intensity||"Easy";$("trainingComments").value=t.comments||"";setGroup("trainingArm","trainingArm",t.arm||"Both");setGroup("quality","quality",t.quality||"Good")}
function deleteTraining(id){if(!confirm("Delete this training entry? This cannot be undone."))return;state.training=state.training.filter(t=>t.id!==id);save();renderDashboard();renderTraining()}

let rgMode="table",rgTimer=null,rgGoAt=0,rgRunning=false,rgReactionTimes=[];
function rgClear(){
  if(rgTimer){clearTimeout(rgTimer);rgTimer=null}
  rgRunning=false;rgGoAt=0;
  if($("rgStart"))$("rgStart").disabled=false;
  if($("rgStop"))$("rgStop").disabled=true;
  if($("reactionStop"))$("reactionStop").disabled=true;
  if($("reactionTap")){
    $("reactionTap").disabled=false;
    $("reactionTap").classList.remove("rg-wait","rg-go");
    $("reactionTap").classList.add("rg-start");
    $("reactionTap").textContent="START";
  }
}
function rgInitVoice(){try{if(!("speechSynthesis" in window))return false;const voices=window.speechSynthesis.getVoices();rgVoice=voices.find(v=>/en[-_]CA/i.test(v.lang))||voices.find(v=>/en[-_]US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang))||null;window.speechSynthesis.cancel();return true}catch(e){return false}}
function rgSpeak(text){try{if(!("speechSynthesis" in window))return;const u=new SpeechSynthesisUtterance(text);u.voice=rgVoice;u.lang=rgVoice?.lang||"en-CA";u.rate=.92;u.pitch=.98;u.volume=1;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}catch(e){}}
function rgNextInterval(){return 2800+Math.random()*1200}
function rgReadyGoDelay(){return 200+Math.random()*400}
function rgSchedule(){if(!rgRunning)return;$("rgInstruction").textContent="READY";rgSpeak("Ready");rgTimer=setTimeout(()=>{if(!rgRunning)return;$("rgInstruction").textContent="GO";rgSpeak("Go");rgGoAt=performance.now();rgTimer=setTimeout(rgSchedule,rgNextInterval())},rgReadyGoDelay())}
function rgStartTable(){rgClear();rgInitVoice();$("rgInstruction").textContent="GET READY…";rgRunning=true;$("rgStart").disabled=true;$("rgStop").disabled=false;rgTimer=setTimeout(rgSchedule,700)}
function rgStopTable(){rgClear();$("rgInstruction").textContent="Press START when you're ready."}
function reactionRender(){const a=rgReactionTimes;const avg=a.length?a.reduce((x,y)=>x+y,0)/a.length:0;$("reactionAttempts").textContent=a.length;$("reactionBest").textContent=a.length?Math.min(...a).toFixed(0)+" ms":"—";$("reactionAvg").textContent=a.length?avg.toFixed(0)+" ms":"—";$("reactionLast").textContent=a.length?a[a.length-1].toFixed(0)+" ms":"—"}
function reactionCycle(){if(!rgRunning)return;$("reactionInstruction").textContent="READY";$("reactionTap").disabled=true;$("reactionTap").textContent="WAIT FOR GO";rgGoAt=0;rgSpeak("Ready");rgTimer=setTimeout(()=>{if(!rgRunning)return;$("reactionInstruction").textContent="GO";$("reactionTap").textContent="TAP NOW";$("reactionTap").classList.remove("rg-wait","rg-start");$("reactionTap").classList.add("rg-go");$("reactionTap").disabled=false;rgSpeak("Go");rgGoAt=performance.now();rgTimer=setTimeout(()=>{if(rgRunning&&!rgGoAt)reactionCycle()},rgNextInterval())},rgReadyGoDelay())}
function reactionStart(){
  rgClear();
  rgInitVoice();
  rgRunning=true;
  if($("reactionStop"))$("reactionStop").disabled=false;
  if($("reactionTap")){
    $("reactionTap").disabled=true;
    $("reactionTap").classList.remove("rg-start","rg-go");
    $("reactionTap").classList.add("rg-wait");
    $("reactionTap").textContent="WAIT FOR GO";
  }
  if($("falseStart"))$("falseStart").textContent="";
  if($("reactionInstruction"))$("reactionInstruction").textContent="GET READY…";
  rgTimer=setTimeout(reactionCycle,700);
}
function reactionStop(){rgClear();$("reactionInstruction").textContent="Press START, then wait for GO.";$("reactionTap").classList.remove("rg-wait","rg-go");$("reactionTap").classList.add("rg-start");$("reactionTap").textContent="START"}
function reactionTap(){if(!rgRunning)return;if(!rgGoAt){$("falseStart").textContent="False start — wait for GO.";return}const t=performance.now()-rgGoAt;rgReactionTimes.push(t);if(rgReactionTimes.length>100)rgReactionTimes.shift();rgGoAt=0;$("reactionTap").disabled=true;$("reactionTap").classList.remove("rg-go","rg-start");$("reactionTap").classList.add("rg-wait");$("reactionTap").textContent="WAIT FOR GO";$("reactionInstruction").textContent=t.toFixed(0)+" ms";reactionRender();setTimeout(()=>{if(rgRunning)reactionCycle()},500)}
function setReadyGoMode(v){rgMode=v;$("readyGoMode").querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===v));$("tableReadyGo").classList.toggle("hidden",v!=="table");$("reactionReadyGo").classList.toggle("hidden",v!=="reaction");rgClear()}
function page(id){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x.dataset.page===id));if(id==="dashboard")renderDashboard();if(id==="history")renderHistory();if(id==="opponents")renderOpponents();if(id==="training")renderTraining()}
document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
$("refreshApp")?.addEventListener("click",async()=>{try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.update()}if("caches" in window){const keys=await caches.keys();for(const k of keys)await caches.delete(k)}}catch(e){}location.reload()});
$("dashNewMatch")?.addEventListener("click",()=>page("match"));
for(let w=130;w<=500;w+=5){$("myWeight").insertAdjacentHTML("beforeend",`<option value="${w}">${w} lb</option>`);$("oppWeight").insertAdjacentHTML("beforeend",`<option value="${w}">${w} lb</option>`)}
for(let h=48;h<=96;h++){const ft=Math.floor(h/12),inch=h%12,label=ft+"'"+inch+'"';$("myHeight").insertAdjacentHTML("beforeend",`<option value="${h}">${label}</option>`);$("oppHeight").insertAdjacentHTML("beforeend",`<option value="${h}">${label}</option>`)}
for(let i=1;i<=10;i++)$("sets").insertAdjacentHTML("beforeend",`<option>${i}</option>`);
for(let i=1;i<=30;i++)$("reps").insertAdjacentHTML("beforeend",`<option>${i}</option>`);
function group(id,key){const el=$(id);if(!el)return;el.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{form[key]=b.dataset.value;$(id).querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b));if(key==="type"){let sm=form.type==="Supermatch";$("singleFields").classList.toggle("hidden",sm);$("superFields").classList.toggle("hidden",!sm);if(sm&&!$("rounds").children.length)addRound()}}))}
group("matchType","type");group("arm","arm");group("singleStrap","singleStrap");group("tableSide","side");group("result","result");group("go","go");group("trainingArm","trainingArm");group("quality","quality");
function addRound(roundData=null){roundNumber++;let d=document.createElement("div");d.className="round";let rr=roundData?.result||"Win",gg=roundData?.go||"I hit first",rs=roundData?.strap||"No";d.innerHTML=`<h3>Round ${roundNumber}</h3><label>Strap</label><div class="segmented rstrap"><button type="button" data-value="No" class="${rs==="No"?"selected":""}">No</button><button type="button" data-value="Yes" class="${rs==="Yes"?"selected":""}">Yes</button></div><label>Result</label><div class="segmented rr"><button type="button" data-value="Win" class="${rr==="Win"?"selected":""}">WIN</button><button type="button" data-value="Loss" class="${rr==="Loss"?"selected":""}">LOSS</button></div><label>Who got the GO?</label><div class="segmented rg"><button type="button" data-value="I hit first" class="${gg==="I hit first"?"selected":""}">I hit first</button><button type="button" data-value="Opponent hit first" class="${gg==="Opponent hit first"?"selected":""}">They hit first</button><button type="button" data-value="Even" class="${gg==="Even"?"selected":""}">Even</button><button type="button" data-value="Unclear" class="${gg==="Unclear"?"selected":""}">Unclear</button></div><div class="two"><label>YOUR TECHNIQUE<select class="rm"><option>Not recorded</option><option>Toproll</option><option>Hook</option><option>Press</option><option>King's Move</option><option>Other</option></select></label><label>OPPONENT'S TECHNIQUE<select class="ro"><option>Not recorded</option><option>Toproll</option><option>Hook</option><option>Press</option><option>King's Move</option><option>Other</option></select></label></div><label>Match length<select class="rl"><option>Not recorded</option><option>Under 5 seconds</option><option>5–30 seconds</option><option>Over 30 seconds</option></select></label>`;$("rounds").appendChild(d);d.querySelector(".rm").value=roundData?.myTech||"Not recorded";d.querySelector(".ro").value=roundData?.oppTech||"Not recorded";d.querySelector(".rl").value=roundData?.length||"Not recorded";d.querySelectorAll(".rstrap button").forEach(b=>b.addEventListener("click",()=>{rs=b.dataset.value;d.querySelectorAll(".rstrap button").forEach(x=>x.classList.toggle("selected",x===b))}));d.querySelectorAll(".rr button").forEach(b=>b.addEventListener("click",()=>{rr=b.dataset.value;d.querySelectorAll(".rr button").forEach(x=>x.classList.toggle("selected",x===b))}));d.querySelectorAll(".rg button").forEach(b=>b.addEventListener("click",()=>{gg=b.dataset.value;d.querySelectorAll(".rg button").forEach(x=>x.classList.toggle("selected",x===b))}));d.getRound=()=>({strap:rs,result:rr,go:gg,myTech:d.querySelector(".rm").value,oppTech:d.querySelector(".ro").value,length:d.querySelector(".rl").value})}
$("addRound").addEventListener("click",addRound);
$("matchForm").addEventListener("submit",e=>{e.preventDefault();let opponent=$("opponent").value.trim();if(!opponent)return alert("Enter an opponent.");let m={id:editingMatchId||Date.now(),opponent,matchType:form.type,arm:form.arm,side:form.side,myWeight:$("myWeight").value,oppWeight:$("oppWeight").value,myHeight:$("myHeight").value,oppHeight:$("oppHeight").value,weightClass:$("weightClass").value,comments:$("comments").value.trim()};if(form.type==="Supermatch"){m.rounds=[...$("rounds").children].map(x=>x.getRound());let w=m.rounds.filter(r=>r.result==="Win").length,l=m.rounds.filter(r=>r.result==="Loss").length;m.result=w>l?"Win":"Loss"}else{m.strap=form.singleStrap;m.result=form.result;m.go=form.go;m.myTech=$("myTech").value;m.oppTech=$("oppTech").value;m.length=$("length").value}if(editingMatchId){const i=state.matches.findIndex(x=>x.id===editingMatchId);if(i>=0)state.matches[i]=m}else state.matches.unshift(m);save();alert(editingMatchId?"Match updated.":"Match saved.");resetMatchForm();page("history")});
$("cancelMatchEdit").addEventListener("click",()=>{resetMatchForm();page("dashboard")});

$("trainingForm").addEventListener("submit",e=>{e.preventDefault();let t={id:editingTrainingId||Date.now(),category:$("tCategory").value,arm:form.trainingArm,sets:$("sets").value,reps:$("reps").value,resistance:$("resistance").value,intensity:$("intensity").value,quality:form.quality,comments:$("trainingComments").value.trim()};if(editingTrainingId){const i=state.training.findIndex(x=>x.id===editingTrainingId);if(i>=0)state.training[i]=t}else state.training.unshift(t);save();alert(editingTrainingId?"Training updated.":"Training saved.");editingTrainingId=null;e.target.reset();setGroup("trainingArm","trainingArm","Both");setGroup("quality","quality","Good");page("training")});

function rec(ms){let w=ms.filter(m=>m.result==="Win").length;return[w,ms.length-w]}
function techniqueStats(ms){let mine={},against={};const one=(r)=>{if(r.myTech&&r.myTech!=="Not recorded"){mine[r.myTech]??={w:0,l:0};r.result==="Win"?mine[r.myTech].w++:mine[r.myTech].l++}if(r.oppTech&&r.oppTech!=="Not recorded"){against[r.oppTech]??={w:0,l:0};r.result==="Win"?against[r.oppTech].l++:against[r.oppTech].w++}};ms.forEach(m=>m.matchType==="Supermatch"?m.rounds.forEach(one):one(m));return{mine,against}}


function techniqueRows(matches, opponentSide=false){
  const rows=[];
  matches.forEach(m=>{
    if(m.matchType==="Supermatch"){
      (m.rounds||[]).forEach(r=>{
        const tech=opponentSide?r.oppTech:r.myTech;
        if(tech&&tech!=="Not recorded") rows.push({tech,win:r.result==="Win"});
      });
    }else{
      const tech=opponentSide?m.oppTech:m.myTech;
      if(tech&&tech!=="Not recorded") rows.push({tech,win:m.result==="Win"});
    }
  });
  const map={};
  rows.forEach(r=>{
    if(!map[r.tech]) map[r.tech]={used:0,wins:0};
    map[r.tech].used++;
    if(r.win) map[r.tech].wins++;
  });
  return Object.entries(map).map(([tech,v])=>({
    tech,used:v.used,wins:v.wins,losses:v.used-v.wins,pct:v.wins/v.used*100
  })).sort((a,b)=>b.used-a.used||b.pct-a.pct);
}
function renderTechniqueTable(id, rows){
  const el=$(id);
  if(!el)return;
  if(!rows.length){el.innerHTML='<p class="muted">No technique data recorded yet.</p>';return}
  el.innerHTML=`<table class="tech-table"><thead><tr><th>Technique</th><th>Used</th><th>Wins</th><th>Losses</th><th>Win %</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.tech)}</b></td><td>${r.used}</td><td>${r.wins}</td><td>${r.losses}</td><td>${r.pct.toFixed(0)}%</td></tr>`).join("")}</tbody></table>`;
}
function renderTechniqueBreakdown(){
  const matches=scope==="All"?state.matches:state.matches.filter(m=>m.matchType===scope);
  renderTechniqueTable("myTechniqueTable",techniqueRows(matches,false));
  renderTechniqueTable("oppTechniqueTable",techniqueRows(matches,true));
}
function renderTechniqueAnalytics(){
  const matches=scope==="All"?state.matches:state.matches.filter(m=>m.matchType===scope);
  const mine=[],opp=[];
  matches.forEach(m=>{
    if(m.matchType==="Supermatch"){
      (m.rounds||[]).forEach(r=>{
        if(r.myTech&&r.myTech!=="Not recorded") mine.push({tech:r.myTech,win:r.result==="Win"});
        if(r.oppTech&&r.oppTech!=="Not recorded") opp.push({tech:r.oppTech,win:r.result==="Win"});
      });
    }else{
      if(m.myTech&&m.myTech!=="Not recorded") mine.push({tech:m.myTech,win:m.result==="Win"});
      if(m.oppTech&&m.oppTech!=="Not recorded") opp.push({tech:m.oppTech,win:m.result==="Win"});
    }
  });
  const summarize=rows=>{
    const map={};
    rows.forEach(r=>{if(!map[r.tech])map[r.tech]={n:0,w:0};map[r.tech].n++;if(r.win)map[r.tech].w++});
    return Object.entries(map).map(([tech,v])=>({tech,n:v.n,w:v.w,pct:v.w/v.n*100}));
  };
  const a=summarize(mine), b=summarize(opp);
  const set=(id,text,meta)=>{$(id).textContent=text;$(id+"Meta").textContent=meta||""};
  const fav=[...a].sort((x,y)=>y.n-x.n)[0];
  const ea=a.filter(x=>x.n>=3), eb=b.filter(x=>x.n>=3);
  const best=[...ea].sort((x,y)=>y.pct-x.pct||y.n-x.n)[0];
  const worst=[...ea].sort((x,y)=>x.pct-y.pct||y.n-x.n)[0];
  const bestAgainst=[...eb].sort((x,y)=>y.pct-x.pct||y.n-x.n)[0];
  const toughest=[...eb].sort((x,y)=>x.pct-y.pct||y.n-x.n)[0];
  set("favoriteTech",fav?fav.tech:"Not enough data",fav?`${fav.n} recorded ${fav.n===1?"time":"times"}`:"");
  set("bestTech",best?best.tech:"Not enough data",best?`${best.pct.toFixed(0)}% wins · ${best.w}/${best.n}`:"Need 3+ uses");
  set("worstTech",worst?worst.tech:"Not enough data",worst?`${worst.pct.toFixed(0)}% wins · ${worst.w}/${worst.n}`:"Need 3+ uses");
  set("bestAgainstOppTech",bestAgainst?bestAgainst.tech:"Not enough data",bestAgainst?`Your win rate · ${bestAgainst.pct.toFixed(0)}% · ${bestAgainst.w}/${bestAgainst.n}`:"Need 3+ uses");
  set("worstAgainstOppTech",toughest?toughest.tech:"Not enough data",toughest?`Your win rate · ${toughest.pct.toFixed(0)}% · ${toughest.w}/${toughest.n}`:"Need 3+ uses");
}
function renderDashboard(){let t=rec(state.matches.filter(m=>m.matchType==="Tournament")),s=rec(state.matches.filter(m=>m.matchType==="Supermatch")),p=rec(state.matches.filter(m=>m.matchType==="Practice"));$("tourRecord").textContent=t.join("–");$("superRecord").textContent=s.join("–");$("practiceRecord").textContent=p.join("–");$("trainingCount").textContent=state.training.length;let ms=scope==="All"?state.matches:state.matches.filter(m=>m.matchType===scope),st=techniqueStats(ms),all=Object.entries(st.mine).map(([k,v])=>({k,...v,n:v.w+v.l})),fav=all.sort((a,b)=>b.n-a.n)[0],good=all.filter(x=>x.n>=3).sort((a,b)=>b.w/b.n-a.w/a.n)[0],bad=all.filter(x=>x.n>=3).sort((a,b)=>a.w/a.n-b.w/b.n)[0],opp=Object.entries(st.against).map(([k,v])=>({k,...v,n:v.w+v.l})).filter(x=>x.n>=3).sort((a,b)=>b.w/b.n-a.w/a.n)[0];$("myStats").innerHTML=`<div class="two"><div class="rec"><b>Favorite technique</b><br>${fav?esc(fav.k):"Not enough data"}</div><div class="rec"><b>Most successful</b><br>${good?esc(good.k)+" · "+Math.round(good.w/good.n*100)+"% win rate":"Need 3+ attempts"}</div><div class="rec"><b>Least successful</b><br>${bad?esc(bad.k)+" · "+Math.round(bad.w/bad.n*100)+"% win rate":"Need 3+ attempts"}</div><div class="rec"><b>Best opponent technique against you</b><br>${opp?esc(opp.k)+" · opponents win "+Math.round(opp.w/opp.n*100)+"%":"Need 3+ attempts"}</div></div>`;$("recent").innerHTML=state.matches.slice(0,5).map(m=>`<div class="entry"><div class="row"><b>${esc(m.opponent)}</b><b class="${m.result==="Win"?"win":"loss"}">${m.result.toUpperCase()}</b></div><div class="muted">${esc(m.matchType)} · ${esc(m.arm)} arm · strap ${esc(m.strap)}${m.matchType==="Supermatch"?" · "+m.rounds.length+" rounds":""}</div></div>`).join("")||'<p class="muted">No matches yet.</p>';renderTechniqueAnalytics();renderTechniqueBreakdown();}
function renderHistory(){$("historyList").innerHTML=state.matches.map(m=>`<div class="entry"><div class="row"><div><b>${esc(m.opponent)}</b><div class="muted">${esc(m.matchType)} · ${esc(m.arm)} · table side when facing head referee: ${esc(m.side)}${m.matchType==="Supermatch"?" · "+m.rounds.length+" rounds · strap by round":" · strap "+esc(m.strap||"No")}</div></div><b class="${m.result==="Win"?"win":"loss"}">${m.result.toUpperCase()}</b></div>${m.comments?`<div style="margin-top:7px">${esc(m.comments)}</div>`:""}<div class="entry-actions"><button type="button" data-edit-match="${m.id}">Edit</button><button type="button" data-delete-match="${m.id}">Delete</button></div></div>`).join("")||'<p class="muted">No matches yet.</p>';document.querySelectorAll("[data-edit-match]").forEach(b=>b.addEventListener("click",()=>loadMatchForEdit(Number(b.dataset.editMatch))));document.querySelectorAll("[data-delete-match]").forEach(b=>b.addEventListener("click",()=>deleteMatch(Number(b.dataset.deleteMatch))))}

function renderTraining(){$("trainingList").innerHTML=state.training.slice(0,20).map(t=>`<div class="entry"><b>${esc(t.category)}</b><div class="muted">${esc(t.arm)} · ${esc(t.sets)} sets × ${esc(t.reps)} reps · ${esc(t.intensity)} · ${esc(t.quality)}</div>${t.comments?`<div style="margin-top:7px">${esc(t.comments)}</div>`:""}<div class="entry-actions"><button type="button" data-edit-training="${t.id}">Edit</button><button type="button" data-delete-training="${t.id}">Delete</button></div></div>`).join("")||'<p class="muted">No training logs yet.</p>';document.querySelectorAll("[data-edit-training]").forEach(b=>b.addEventListener("click",()=>loadTrainingForEdit(Number(b.dataset.editTraining))));document.querySelectorAll("[data-delete-training]").forEach(b=>b.addEventListener("click",()=>deleteTraining(Number(b.dataset.deleteTraining))))}

function renderOpponents(){let names=[...new Set(state.matches.map(m=>m.opponent))].sort();$("opponentList").innerHTML=names.map(n=>`<option value="${esc(n)}">`).join("");$("profiles").innerHTML=names.map(n=>{let ms=state.matches.filter(m=>m.opponent===n);return `<div class="entry" data-opponent="${esc(n)}" tabindex="0"><div class="row"><b>${esc(n)}</b><b>${rec(ms)[0]}–${rec(ms)[1]}</b></div><span class="tag">Practice ${rec(ms.filter(m=>m.matchType==="Practice")).join("–")}</span><span class="tag">Tournament ${rec(ms.filter(m=>m.matchType==="Tournament")).join("–")}</span><span class="tag">Supermatch ${rec(ms.filter(m=>m.matchType==="Supermatch")).join("–")}</span></div>`}).join("")||'<p class="muted">No opponents yet.</p>';document.querySelectorAll("#profiles [data-opponent]").forEach(x=>x.addEventListener("click",()=>showOpponent(x.dataset.opponent)))}
function showOpponent(name){let ms=state.matches.filter(m=>m.opponent===name),weights=[...new Set(ms.map(m=>m.oppWeight).filter(Boolean))].sort((a,b)=>a-b);let heights=[...new Set(ms.map(m=>m.oppHeight).filter(Boolean))].sort((a,b)=>a-b);let sections=["Practice","Tournament","Supermatch"].map(type=>{let x=ms.filter(m=>m.matchType===type),r=rec(x),st=techniqueStats(x),best=Object.entries(st.mine).map(([k,v])=>({k,...v,n:v.w+v.l})).filter(x=>x.n>=3).sort((a,b)=>b.w/b.n-a.w/a.n)[0];return `<div class="rec"><b>${type}: ${r[0]}–${r[1]}</b><br><span class="muted">${best?"Best recorded technique: "+esc(best.k)+" · "+Math.round(best.w/best.n*100)+"%":"Not enough technique data"}</span></div>`}).join("");$("opponentDetail").classList.remove("hidden");$("opponentDetail").innerHTML=`<div class="row"><h2>${esc(name)}</h2><button id="closeOpp">Close</button></div><p><b>Weight history:</b> ${weights.length?weights.join(", ")+" lb":"Not recorded"}</p><p><b>Height history:</b> ${heights.length?heights.map(h=>Math.floor(h/12)+"\'"+(h%12)+"\"").join(", "):"Not recorded"}</p>${sections}`;$("closeOpp").addEventListener("click",()=>$("opponentDetail").classList.add("hidden"))}
$("statScope")?.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{scope=b.dataset.value;$("statScope").querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b));renderDashboard()}));

function bindReadyGo(){
  const mode=$("readyGoMode");
  if(mode) mode.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>setReadyGoMode(b.dataset.value)));
  const tableStart=$("rgStart"), tableStop=$("rgStop"), stop=$("reactionStop"), reactionButton=$("reactionTap");
  if(tableStart) tableStart.addEventListener("click",rgStartTable);
  if(tableStop) tableStop.addEventListener("click",rgStopTable);
  if(stop) stop.addEventListener("click",reactionStop);
  if(reactionButton) reactionButton.addEventListener("click",()=>{if(!rgRunning) reactionStart(); else reactionTap()});
}
try{renderDashboard();renderHistory();renderTraining();renderOpponents()}catch(e){console.error("Tracker startup error:",e)}
bindReadyGo();
bindReadyGo();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js?v=172").catch(()=>{});
})();