/* Arm Wrestling Tracker — v3.41 clean build */
(()=>{"use strict";
const KEY="armwrestle-pwa-v1";
let state={matches:[],training:[],opponents:[]};
try{state=JSON.parse(localStorage.getItem(KEY)||'{"matches":[],"training":[],"opponents":[]}')}catch(e){}
if(!Array.isArray(state.matches))state.matches=[];
if(!Array.isArray(state.training))state.training=[];
if(!Array.isArray(state.opponents))state.opponents=[];
state.matches.forEach(m=>{const n=String(m.opponent||"").trim();if(n&&!state.opponents.includes(n))state.opponents.push(n)});
const $=id=>document.getElementById(id),save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const form={type:"Practice",arm:"Right",singleStrap:"No",side:"Left",result:"Win",go:"I hit first",myTech:"Not recorded",oppTech:"Not recorded",length:"Not recorded",trainingArm:"Both",quality:"Good"};
let scope="Tournament",roundNumber=0,editingMatchId=null,editingTrainingId=null;
function penaltyValue(id){
 const el=$(id);
 const b=el?.querySelector(".penalty-btn.selected");
 return b?parseInt(b.dataset.value||"0",10):0;
}
function setPenaltyValue(id,value){
 const el=$(id);if(!el)return;
 const v=Math.max(0,Math.min(2,parseInt(value||0,10)||0));
 el.querySelectorAll(".penalty-btn").forEach(b=>b.classList.toggle("selected",parseInt(b.dataset.value,10)===v));
}
function bindPenaltyButtons(){
 document.querySelectorAll(".penalty-buttons").forEach(group=>{
   group.querySelectorAll(".penalty-btn").forEach(btn=>{
     btn.addEventListener("click",()=>{
       group.querySelectorAll(".penalty-btn").forEach(b=>b.classList.remove("selected"));
       btn.classList.add("selected");
     });
   });
 });
}
function matchInt(id){const e=$(id);const n=e?parseInt(e.value,10):0;return Number.isFinite(n)&&n>=0?n:0}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function setGroup(id,key,value){form[key]=value;const el=$(id);if(!el)return;el.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===value))}
function resetRoundEditor(){$("rounds").innerHTML="";roundNumber=0}
function resetMatchForm(){editingMatchId=null;$("matchForm").reset();resetRoundEditor();setPenaltyValue("matchFouls",0);setPenaltyValue("matchWarnings",0);form.type="Practice";form.arm="Right";form.singleStrap="No";form.side="Left";form.result="Win";form.go="I hit first";$("matchMode").textContent="New Match";$("cancelMatchEdit").classList.add("hidden");setGroup("matchType","type","Practice");setGroup("arm","arm","Right");setGroup("singleStrap","singleStrap","No");setGroup("tableSide","side","Left");setGroup("result","result","Win");setGroup("go","go","I hit first");setGroup("myTech","myTech","Not recorded");setGroup("oppTech","oppTech","Not recorded");setGroup("length","length","Not recorded");$("singleFields").classList.remove("hidden");$("superFields").classList.add("hidden")}
function loadMatchForEdit(id){const m=state.matches.find(x=>x.id===id);if(!m)return;editingMatchId=id;page("match");$("matchMode").textContent="Edit Match";$("cancelMatchEdit").classList.remove("hidden");$("opponent").value=m.opponent||"";$("myWeight").value=m.myWeight||"";$("oppWeight").value=m.oppWeight||"";$("myHeight").value=m.myHeight||"";$("oppHeight").value=m.oppHeight||"";$("weightClass").value=m.weightClass||"Not recorded";$("comments").value=m.comments||"";setPenaltyValue("matchFouls",m.fouls);setPenaltyValue("matchWarnings",m.warnings);setGroup("matchType","type",m.matchType);setGroup("arm","arm",m.arm);setGroup("tableSide","side",m.side);if(m.matchType==="Supermatch"){$("singleFields").classList.add("hidden");$("superFields").classList.remove("hidden");resetRoundEditor();(m.rounds||[]).forEach(r=>addRound(r))}else{$("singleFields").classList.remove("hidden");$("superFields").classList.add("hidden");setGroup("singleStrap","singleStrap",m.strap||"No");setGroup("result","result",m.result||"Win");setGroup("go","go",m.go||"Unclear");setGroup("myTech","myTech",m.myTech||"Not recorded");setGroup("oppTech","oppTech",m.oppTech||"Not recorded");setGroup("length","length",m.length||"Not recorded")}}
function deleteMatch(id){if(!confirm("Delete this match? This cannot be undone."))return;state.matches=state.matches.filter(m=>m.id!==id);save();renderDashboard();renderHistory();renderOpponents()}
function loadTrainingForEdit(id){const t=state.training.find(x=>x.id===id);if(!t)return;editingTrainingId=id;page("training");$("tCategory").value=t.category||"Pronation";$("sets").value=t.sets||"1";$("reps").value=t.reps||"1";$("resistance").value=t.resistance||"Bodyweight";$("intensity").value=t.intensity||"Easy";$("trainingComments").value=t.comments||"";setGroup("trainingArm","trainingArm",t.arm||"Both");setGroup("quality","quality",t.quality||"Good")}
function deleteTraining(id){if(!confirm("Delete this training entry? This cannot be undone."))return;state.training=state.training.filter(t=>t.id!==id);save();renderDashboard();renderTraining()}

function addOpponent(){
 const input=$("newOpponentName"),msg=$("opponentAddMessage");
 const name=(input?.value||"").trim();
 if(!name){if(msg)msg.textContent="Enter an opponent name.";return}
 const existing=state.opponents.find(n=>n.toLowerCase()===name.toLowerCase());
 if(existing){if(msg)msg.textContent=`${existing} is already in your opponents.`;input?.focus();return}
 state.opponents.push(name);
 state.opponents.sort((a,b)=>a.localeCompare(b));
 save();renderOpponents();
 if(msg)msg.textContent=`${name} added.`;
 if(input){input.value="";input.focus()}
}



const PERSONAL_VOICE_RATE=1.10;
let voiceType="ready",voiceSlot=0,voiceDB={ready:[],go:[]},voiceRecorder=null,voiceChunks=[],voiceStream=null,voiceCurrentBlob=null,voiceCurrentUrl=null;
function voiceLoad(){try{const x=localStorage.getItem("awtVoiceLibrary");if(x)voiceDB=JSON.parse(x)||voiceDB}catch(e){}}
function voiceSave(){try{localStorage.setItem("awtVoiceLibrary",JSON.stringify(voiceDB))}catch(e){}}
function voiceLibraryReady(){return voiceDB.ready.filter(Boolean).length>0&&voiceDB.go.filter(Boolean).length>0}
function voiceUpdate(){
  const count=voiceDB[voiceType].filter(Boolean).length;
  $("voiceProgress").textContent=(voiceType==="ready"?"Ready ":"Go ")+(voiceSlot+1)+" of 10";
  $("voiceSlotTitle").textContent=(voiceType==="ready"?"Ready ":"Go ")+(voiceSlot+1);
  $("voiceStatus").textContent=voiceDB[voiceType][voiceSlot]?"Recording saved.":"No recording yet.";
  $("voicePlay").disabled=!(voiceCurrentBlob||voiceDB[voiceType][voiceSlot]);
  $("voiceKeep").disabled=!voiceCurrentBlob;
  $("readyCount").textContent=voiceDB.ready.filter(Boolean).length+" / 10";
  $("goCount").textContent=voiceDB.go.filter(Boolean).length+" / 10";
}
function voiceSetType(t){voiceType=t;voiceSlot=0;voiceCurrentBlob=null;voiceUpdate();$("voiceType").querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===t))}
let voiceAudioCtx=null,voiceAnalyser=null,voiceWaveFrame=null,voiceWaveSource=null;
function voiceWaveDraw(){
  const c=$("voiceWave");if(!c||!voiceAnalyser)return;
  const ctx=c.getContext("2d"),data=new Uint8Array(voiceAnalyser.fftSize);
  const draw=()=>{
    if(!voiceAnalyser)return;
    voiceWaveFrame=requestAnimationFrame(draw);
    const dpr=window.devicePixelRatio||1,w=Math.max(1,c.clientWidth*dpr),h=Math.max(1,c.clientHeight*dpr);
    if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;
    ctx.clearRect(0,0,w,h);ctx.beginPath();ctx.lineWidth=3;
    ctx.strokeStyle=getComputedStyle(document.body).color||"#2563eb";
    voiceAnalyser.getByteTimeDomainData(data);
    for(let i=0;i<data.length;i++){const x=i/(data.length-1)*w,y=h/2+(data[i]-128)/128*h*.38;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.stroke();
  };draw();
}
function voiceWaveStartStream(){
  const c=$("voiceWave");if(!c||!voiceStream)return;
  try{
    voiceWaveStop();
    voiceAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(voiceAudioCtx.state==="suspended")voiceAudioCtx.resume();
    voiceAnalyser=voiceAudioCtx.createAnalyser();voiceAnalyser.fftSize=1024;
    voiceWaveSource=voiceAudioCtx.createMediaStreamSource(voiceStream);
    voiceWaveSource.connect(voiceAnalyser);c.style.display="block";voiceWaveDraw();
  }catch(e){if(c)c.style.display="none"}
}
function voiceWaveStartAudio(audio){
  const c=$("voiceWave");if(!c||!audio)return;
  try{
    voiceWaveStop();
    voiceAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(voiceAudioCtx.state==="suspended")voiceAudioCtx.resume();
    voiceAnalyser=voiceAudioCtx.createAnalyser();voiceAnalyser.fftSize=1024;
    voiceWaveSource=voiceAudioCtx.createMediaElementSource(audio);
    voiceWaveSource.connect(voiceAnalyser);voiceAnalyser.connect(voiceAudioCtx.destination);
    c.style.display="block";voiceWaveDraw();
  }catch(e){}
}
function voiceWaveStop(){
  if(voiceWaveFrame)cancelAnimationFrame(voiceWaveFrame);voiceWaveFrame=null;
  try{voiceWaveSource?.disconnect()}catch(e){}
  voiceWaveSource=null;voiceAnalyser=null;
  try{voiceAudioCtx?.close()}catch(e){}
  voiceAudioCtx=null;
  const c=$("voiceWave");if(c)c.style.display="none";
}
async function voiceRecord(){
  try{
    if(!window.isSecureContext){$("voiceStatus").textContent="Open the GitHub Pages HTTPS address to record.";return}
    if(!navigator.mediaDevices?.getUserMedia){$("voiceStatus").textContent="Microphone access is unavailable in this browser.";return}
    if(!window.MediaRecorder){$("voiceStatus").textContent="Audio recording is unavailable in this browser.";return}
    voiceStream=await navigator.mediaDevices.getUserMedia({audio:true});
    voiceChunks=[];
    voiceCurrentBlob=null;
    const mimeCandidates=["audio/webm;codecs=opus","audio/webm","audio/mp4"];
    const mime=mimeCandidates.find(x=>MediaRecorder.isTypeSupported(x))||"";
    voiceRecorder=mime?new MediaRecorder(voiceStream,{mimeType:mime}):new MediaRecorder(voiceStream);
    voiceRecorder.ondataavailable=e=>{if(e.data&&e.data.size)voiceChunks.push(e.data)};
    voiceRecorder.onerror=e=>{$("voiceStatus").textContent="Recording error. Please try again.";try{voiceStop()}catch(_){}};
    voiceRecorder.onstop=()=>{
      const type=voiceRecorder.mimeType||mime||"audio/webm";
      voiceCurrentBlob=new Blob(voiceChunks,{type});
      voiceWaveStop();voiceStream?.getTracks().forEach(t=>t.stop());voiceStream=null;
      voiceRecorder=null;
      $("voiceRecord").textContent="● RECORD";$("voiceRecord").classList.remove("recording");
      if(voiceCurrentBlob.size>0){
        const kb=(voiceCurrentBlob.size/1024).toFixed(1);
        $("voiceStatus").textContent="Captured "+kb+" KB — tap PLAY to hear it, or KEEP to save it.";
        voiceUpdate();
      }else $("voiceStatus").textContent="No audio data was captured. Please try again.";
    };
    voiceRecorder.start();
    voiceWaveStartStream();
    $("voiceRecord").textContent="■ STOP";$("voiceRecord").classList.add("recording");
    $("voiceStatus").textContent="Recording… speak now.";
  }catch(e){
    voiceWaveStop();voiceStream?.getTracks().forEach(t=>t.stop());voiceStream=null;voiceRecorder=null;
    $("voiceRecord").textContent="● RECORD";$("voiceRecord").classList.remove("recording");
    $("voiceStatus").textContent=e?.name==="NotAllowedError"?"Microphone permission was denied.":"Could not start recording: "+(e?.message||e?.name||"unknown error");
  }
}
function voiceStop(){
  if(voiceRecorder&&voiceRecorder.state==="recording"){
    try{voiceRecorder.stop()}catch(e){$("voiceStatus").textContent="Could not stop the recording.";voiceStream?.getTracks().forEach(t=>t.stop())}
  }else if(voiceStream){
    voiceStream.getTracks().forEach(t=>t.stop());voiceStream=null;
  }
}
let voicePlayback=null,voicePlaybackUrl=null;
function voicePlay(){
  const data=voiceCurrentBlob||voiceDB[voiceType][voiceSlot];
  if(!data){$("voiceStatus").textContent="There is no recording in this slot yet.";return}
  try{
    if(voicePlayback){voicePlayback.pause();voicePlayback=null}
    if(voicePlaybackUrl){URL.revokeObjectURL(voicePlaybackUrl);voicePlaybackUrl=null}
    voicePlaybackUrl=typeof data==="string"?data:URL.createObjectURL(data);
    voicePlayback=new Audio(voicePlaybackUrl);voicePlayback.preload="auto";voicePlayback.playbackRate=PERSONAL_VOICE_RATE;
    voicePlayback.onplay=()=>{voiceWaveStartAudio(voicePlayback);$("voiceStatus").textContent="Playing… waveform shows playback."};
    voicePlayback.onended=()=>{voiceWaveStop();$("voiceStatus").textContent="Playback finished."};
    voicePlayback.onerror=()=>{voiceWaveStop();$("voiceStatus").textContent="Could not play this recording."};
    voicePlayback.play().catch(()=>{$("voiceStatus").textContent="Tap PLAY again to allow playback."});
  }catch(e){voiceWaveStop();$("voiceStatus").textContent="Could not play this recording."}
}
async function voiceKeep(){
  if(!voiceCurrentBlob)return;
  const reader=new FileReader();
  reader.onload=()=>{voiceDB[voiceType][voiceSlot]=reader.result;voiceCurrentBlob=null;voiceSave();voiceUpdate();$("voiceStatus").textContent="Saved. Next slot is ready.";if(voiceSlot<9){voiceSlot++;voiceUpdate()}else if(voiceType==="ready"){voiceType="go";voiceSlot=0;voiceUpdate();$("voiceType").querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===voiceType));$("voiceSetupMessage").textContent="All 10 Ready calls saved. Now record your 10 Go calls."}else{$("voiceSetupMessage").textContent="All 20 voice recordings are saved and ready to use."}};
  reader.readAsDataURL(voiceCurrentBlob);
}
function rgSetLights(readyOn,goOn){
  const y=$("reactionReadyLight"),g=$("reactionGoLight");
  if(y)y.classList.toggle("on",!!readyOn);
  if(g)g.classList.toggle("on",!!goOn);
}
function rgBeep(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!window.__rgAudioCtx)window.__rgAudioCtx=new AC();
    const c=window.__rgAudioCtx;if(c.state==="suspended")c.resume().catch(()=>{});
    const o=c.createOscillator(),gain=c.createGain(),now=c.currentTime;
    o.type="sine";o.frequency.setValueAtTime(880,now);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.25,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+.13);
    o.connect(gain);gain.connect(c.destination);o.start(now);o.stop(now+.14);
  }catch(e){}
}
let rgMode="table",rgTimer=null,rgGoAt=0,rgRunning=false,rgReactionTimes=[],rgVoice=null,rgLastVoice={ready:-1,go:-1},rgPhase="idle",rgCycleToken=0;
function rgLoadVoice(){try{if(!("speechSynthesis" in window))return false;const voices=window.speechSynthesis.getVoices();rgVoice=voices.find(v=>/en[-_]CA/i.test(v.lang))||voices.find(v=>/en[-_]US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang))||voices[0]||null;return true}catch(e){return false}}
if("speechSynthesis" in window){window.speechSynthesis.addEventListener("voiceschanged",rgLoadVoice);rgLoadVoice()}
function rgInitVoice(){try{if(!("speechSynthesis" in window))return false;rgLoadVoice();window.speechSynthesis.cancel();return true}catch(e){return false}}
function rgPickVoice(kind){
  const clips=voiceDB[kind].filter(Boolean);
  if(!clips.length)return null;
  let idx=0;if(clips.length>1)do{idx=Math.floor(Math.random()*clips.length)}while(idx===rgLastVoice[kind]);
  rgLastVoice[kind]=idx;return clips[idx];
}
function rgPlayClip(kind,onStart,onEnd,token){
  const data=rgPickVoice(kind);
  if(!data){
    if(!("speechSynthesis" in window)){if(onEnd)onEnd();return}
    rgLoadVoice();const u=new SpeechSynthesisUtterance(kind==="ready"?"Ready":"Go");if(rgVoice)u.voice=rgVoice;u.lang=rgVoice?.lang||"en-CA";u.rate=(rgMode==="table"?Math.max(.1,Math.min(2,1.00)):.95);u.pitch=1;u.volume=1;
    u.onstart=()=>{if(token===rgCycleToken&&onStart)onStart()};u.onend=()=>{if(token===rgCycleToken&&onEnd)onEnd()};u.onerror=()=>{if(token===rgCycleToken&&onEnd)onEnd()};window.speechSynthesis.speak(u);return;
  }
  const a=new Audio(data);a.preload="auto";a.playbackRate=(rgMode==="table"?1.00:1.10);
  a.onplay=()=>{if(token===rgCycleToken&&onStart)onStart()};
  a.onended=()=>{if(token===rgCycleToken&&onEnd)onEnd()};
  a.onerror=()=>{if(token===rgCycleToken&&onEnd)onEnd()};
  a.play().catch(()=>{if(token===rgCycleToken&&onEnd)onEnd()});
}
function rgNextInterval(){return rgTimingDelay(rgTiming.roundMin,rgTiming.roundMax)}
function rgReadyGoDelay(){return 50+Math.random()*150}
function rgClear(){
  rgCycleToken++;
  if(rgTimer){clearTimeout(rgTimer);rgTimer=null}
  rgRunning=false;rgGoAt=0;rgPhase="idle";rgSetLights(false,false);
  if("speechSynthesis" in window)try{window.speechSynthesis.cancel()}catch(e){}
  if($("rgStart"))$("rgStart").disabled=false;
  if($("rgStop"))$("rgStop").disabled=true;
  if($("reactionStart"))$("reactionStart").disabled=false;
  if($("reactionStop"))$("reactionStop").disabled=true;
  if($("reactionTap")){$("reactionTap").disabled=true;$("reactionTap").textContent="TAP TO STOP TIMER";}
}

function rgScheduleTable(token){
  if(!rgRunning||token!==rgCycleToken)return;
  rgPhase="ready";
  $("rgInstruction").textContent="";
  rgSetLights(true,false);
  try{rgPlayClip("ready",null,null,token)}catch(e){}
  rgTimer=setTimeout(()=>{
    if(!rgRunning||token!==rgCycleToken)return;
    rgPhase="go";
    rgGoAt=performance.now();
    $("rgInstruction").textContent="";
    rgSetLights(false,true);
    try{rgPlayClip("go",null,null,token)}catch(e){}
    rgTimer=setTimeout(()=>{
      if(rgRunning&&token===rgCycleToken)rgScheduleTable(token);
    },tpNextInterval());
  },tpReadyGoDelay());
}

function tpRoundDelay(){
  const min=Math.max(1,Number(tpTiming.roundMin)||3.5);
  const max=Math.max(min,Number(tpTiming.roundMax)||5.5);
  return (min+Math.random()*(max-min))*1000;
}
function rgStartTable(){
  rgClear();
  rgLastVoice={ready:-1,go:-1};
  rgInitVoice();
  rgRunning=true;
  $("rgInstruction").textContent="GET READY…";
  $("rgStart").disabled=true;
  $("rgStop").disabled=false;
  const token=rgCycleToken;
  rgTimer=setTimeout(()=>rgScheduleTable(token),100);
}

function rgStopTable(){
  rgClear();
  $("rgInstruction").textContent="Press START when you're ready.";
}
function reactionRecord(t){
  if(!rgRunning||rgPhase!=="go"||!rgGoAt)return;
  rgReactionTimes.push(Math.max(0,t));rgPhase="result";rgGoAt=0;
  if(rgTimer){clearTimeout(rgTimer);rgTimer=null}
  $("reactionTap").disabled=true;$("reactionTap").textContent="TAP TO STOP TIMER";
  $("reactionInstruction").textContent=Math.round(t)+" ms";
  reactionShowBigTime(t);reactionRender();
  const token=rgCycleToken;
  rgTimer=setTimeout(()=>{if(rgRunning&&token===rgCycleToken)reactionCycle(token)},1400);
}

function reactionShowBigTime(ms){
  let overlay=$("reactionBigTime");
  if(!overlay){
    overlay=document.createElement("div");overlay.id="reactionBigTime";
    overlay.className="reaction-big-time";overlay.setAttribute("aria-live","assertive");
    document.body.appendChild(overlay);
  }
  overlay.innerHTML='<span class="reaction-big-label">REACTION TIME</span><strong>'+Math.round(ms)+'<small> ms</small></strong>';
  overlay.classList.remove("show");void overlay.offsetWidth;overlay.classList.add("show");
  clearTimeout(reactionShowBigTime.timer);
  reactionShowBigTime.timer=setTimeout(()=>overlay.classList.remove("show"),900);
}
function reactionRender(){
 const a=rgReactionTimes,avg=a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
 $("reactionAttempts").textContent=a.length;
 $("reactionBest").textContent=a.length?Math.min(...a).toFixed(0)+" ms":"—";
 $("reactionAvg").textContent=a.length?avg.toFixed(0)+" ms":"—";
 $("reactionLast").textContent=a.length?a[a.length-1].toFixed(0)+" ms":"—";
 const last10=$("reactionLast10");
 if(last10)last10.innerHTML=a.slice(-10).reverse().map((t,i)=>`<span class="last10-time"><b>${a.length-i}</b><strong>${t.toFixed(0)} ms</strong></span>`).join("")||"No times yet.";
}


const tpTimingDefault={readyMin:.30,readyMax:1.00,roundMin:3.50,roundMax:5.50};
let tpTiming={...tpTimingDefault};
function tpClampTiming(){
 tpTiming.readyMin=Math.max(.10,Math.min(1.80,tpTiming.readyMin));
 tpTiming.readyMax=Math.max(.15,Math.min(2.00,tpTiming.readyMax));
 if(tpTiming.readyMax<tpTiming.readyMin)tpTiming.readyMax=tpTiming.readyMin;
 tpTiming.roundMin=Math.max(1,Math.min(8,tpTiming.roundMin));
 tpTiming.roundMax=Math.max(1.1,Math.min(10,tpTiming.roundMax));
 if(tpTiming.roundMax<tpTiming.roundMin)tpTiming.roundMax=tpTiming.roundMin;
}
function tpUpdateTimingUI(){
 tpClampTiming();
 [["tpReadyMin","tpReadyMinValue",tpTiming.readyMin],["tpReadyMax","tpReadyMaxValue",tpTiming.readyMax],["tpRoundMin","tpRoundMinValue",tpTiming.roundMin],["tpRoundMax","tpRoundMaxValue",tpTiming.roundMax]].forEach(([id,out,val])=>{
   const e=$(id),o=$(out);if(e)e.value=val.toFixed(2);if(o)o.textContent=val.toFixed(2)+" s";
 });
}
function tpBindTiming(){
 [["tpReadyMin","readyMin"],["tpReadyMax","readyMax"],["tpRoundMin","roundMin"],["tpRoundMax","roundMax"]].forEach(([id,key])=>{
   const e=$(id);if(e)e.addEventListener("input",()=>{tpTiming[key]=parseFloat(e.value);tpClampTiming();tpUpdateTimingUI()});
 });
 const reset=$("tpTimingReset");
 if(reset)reset.addEventListener("click",()=>{tpTiming={...tpTimingDefault};tpUpdateTimingUI()});
 tpUpdateTimingUI();
}
function tpReadTiming(){
 const read=(id,fallback)=>{const e=$(id),v=e?parseFloat(e.value):NaN;return Number.isFinite(v)?v:fallback};
 let readyMin=read("tpReadyMin",tpTimingDefault.readyMin);
 let readyMax=read("tpReadyMax",tpTimingDefault.readyMax);
 let roundMin=read("tpRoundMin",tpTimingDefault.roundMin);
 let roundMax=read("tpRoundMax",tpTimingDefault.roundMax);
 if(readyMax<readyMin)[readyMin,readyMax]=[readyMax,readyMin];
 if(roundMax<roundMin)[roundMin,roundMax]=[roundMax,roundMin];
 return {readyMin,readyMax,roundMin,roundMax};
}
function tpReadyGoDelay(){
 const t=tpReadTiming();
 return rgTimingDelay(t.readyMin,t.readyMax);
}
function tpNextInterval(){
 const t=tpReadTiming();
 return rgTimingDelay(t.roundMin,t.roundMax);
}

const rgTimingDefault={readyMin:1.00,readyMax:3.00,roundMin:7.00,roundMax:12.00};
let rgTiming={...rgTimingDefault};
function rgClampTiming(){
 rgTiming.readyMin=Math.max(1.00,Math.min(6.00,rgTiming.readyMin));
 rgTiming.readyMax=Math.max(1.00,Math.min(6.00,rgTiming.readyMax));
 if(rgTiming.readyMax<rgTiming.readyMin)rgTiming.readyMax=rgTiming.readyMin;
 rgTiming.roundMin=7.00;
 rgTiming.roundMax=12.00;
 if(rgTiming.roundMax<rgTiming.roundMin)rgTiming.roundMax=rgTiming.roundMin;
}
function rgUpdateTimingUI(){
 rgClampTiming();
 [["rgReadyMin","rgReadyMinValue",rgTiming.readyMin],["rgReadyMax","rgReadyMaxValue",rgTiming.readyMax],["rgRoundMin","rgRoundMinValue",rgTiming.roundMin],["rgRoundMax","rgRoundMaxValue",rgTiming.roundMax]].forEach(([id,out,val])=>{const e=$(id),o=$(out);if(e)e.value=val.toFixed(2);if(o)o.textContent=val.toFixed(2)+" s"});
}
function rgTimingDelay(min,max){return (min+Math.random()*(max-min))*1000}
function rgBindTiming(){
 [["rgReadyMin","readyMin"],["rgReadyMax","readyMax"],["rgRoundMin","roundMin"],["rgRoundMax","roundMax"]].forEach(([id,key])=>{const e=$(id);if(e)e.addEventListener("input",()=>{rgTiming[key]=parseFloat(e.value)||rgTimingDefault[key];rgUpdateTimingUI()})});
 const r=$("rgTimingReset");if(r)r.addEventListener("click",()=>{rgTiming={...rgTimingDefault};rgUpdateTimingUI()});
 rgUpdateTimingUI();
}
function reactionCycle(token){
  if(!rgRunning||token!==rgCycleToken)return;
  rgPhase="ready";rgGoAt=0;
  $("reactionInstruction").textContent="";
  $("reactionTap").disabled=true;$("reactionTap").textContent="WAIT FOR GO";
  $("reactionTap").classList.remove("rg-go","rg-start");$("reactionTap").classList.add("rg-wait");
  rgSetLights(true,false);
  rgTimer=setTimeout(()=>{
    if(!rgRunning||token!==rgCycleToken)return;
    rgPhase="go";rgSetLights(false,true);rgGoAt=performance.now();rgBeep();
    $("reactionTap").disabled=false;$("reactionTap").textContent="TAP TO STOP TIMER";
    $("reactionTap").classList.remove("rg-wait","rg-start");$("reactionTap").classList.add("rg-go");
  },rgTimingDelay(rgTiming.readyMin,rgTiming.readyMax));
}

function reactionStart(){
  rgClear();rgRunning=true;rgPhase="ready";
  $("reactionStart").disabled=true;$("reactionStop").disabled=false;
  $("reactionTap").disabled=true;$("reactionTap").textContent="WAIT FOR GO";
  $("reactionTap").classList.remove("rg-start","rg-go");$("reactionTap").classList.add("rg-wait");
  $("falseStart").textContent="";$("reactionInstruction").textContent="";rgSetLights(false,false);
  try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){if(!window.__rgAudioCtx)window.__rgAudioCtx=new AC();if(window.__rgAudioCtx.state==="suspended")window.__rgAudioCtx.resume().catch(()=>{});}}catch(e){}
  const token=rgCycleToken;rgTimer=setTimeout(()=>reactionCycle(token),100);
}
function reactionStop(){
  rgClear();rgSetLights(false,false);
  $("reactionInstruction").textContent="Press START, then wait for the green light.";
  $("reactionTap").disabled=true;$("reactionTap").textContent="TAP TO STOP TIMER";
}

function reactionTap(){
  if(rgRunning&&rgPhase==="go"&&rgGoAt)reactionRecord(performance.now()-rgGoAt);
}

function setReadyGoMode(v){
 rgMode=v;
 $("readyGoMode").querySelectorAll("button").forEach(b=>{
   const active=b.dataset.value===v;
   b.classList.toggle("selected",active);
   b.setAttribute("aria-pressed",active?"true":"false");
 });
 $("tableReadyGo").classList.toggle("hidden",v!=="table");
 $("reactionReadyGo").classList.toggle("hidden",v!=="reaction");
 const voiceCard=$("voiceSetupCard");
 if(voiceCard)voiceCard.classList.toggle("hidden",v==="reaction");
 rgClear();
}
function page(id){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x.dataset.page===id));if(id==="dashboard")renderDashboard();if(id==="history")renderHistory();if(id==="opponents")renderOpponents();if(id==="training")renderTraining()}
document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
$("refreshApp")?.addEventListener("click",async()=>{try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.update()}if("caches" in window){const keys=await caches.keys();for(const k of keys)await caches.delete(k)}}catch(e){}location.reload()});
$("dashNewMatch")?.addEventListener("click",()=>page("match"));
$("addOpponentBtn")?.addEventListener("click",addOpponent);
$("newOpponentName")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addOpponent()}});
for(let w=130;w<=500;w+=5){$("myWeight").insertAdjacentHTML("beforeend",`<option value="${w}">${w} lb</option>`);$("oppWeight").insertAdjacentHTML("beforeend",`<option value="${w}">${w} lb</option>`)}
for(let h=48;h<=96;h++){const ft=Math.floor(h/12),inch=h%12,label=ft+"'"+inch+'"';$("myHeight").insertAdjacentHTML("beforeend",`<option value="${h}">${label}</option>`);$("oppHeight").insertAdjacentHTML("beforeend",`<option value="${h}">${label}</option>`)}
for(let i=1;i<=10;i++)$("sets").insertAdjacentHTML("beforeend",`<option>${i}</option>`);
for(let i=1;i<=30;i++)$("reps").insertAdjacentHTML("beforeend",`<option>${i}</option>`);
function group(id,key){const el=$(id);if(!el)return;el.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{form[key]=b.dataset.value;$(id).querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b));if(key==="type"){let sm=form.type==="Supermatch";$("singleFields").classList.toggle("hidden",sm);$("superFields").classList.toggle("hidden",!sm);if(sm&&!$("rounds").children.length)addRound()}}))}
group("matchType","type");group("arm","arm");group("singleStrap","singleStrap");group("tableSide","side");group("result","result");group("go","go");group("trainingArm","trainingArm");group("quality","quality");
function addRound(roundData=null){roundNumber++;let d=document.createElement("div");d.className="round";let rr=roundData?.result||"Win",gg=roundData?.go||"I hit first",rs=roundData?.strap||"No";d.innerHTML=`<h3>Round ${roundNumber}</h3><label>Strap</label><div class="segmented rstrap"><button type="button" data-value="No" class="${rs==="No"?"selected":""}">No</button><button type="button" data-value="Yes" class="${rs==="Yes"?"selected":""}">Yes</button></div><label>Result</label><div class="segmented rr"><button type="button" data-value="Win" class="${rr==="Win"?"selected":""}">WIN</button><button type="button" data-value="Loss" class="${rr==="Loss"?"selected":""}">LOSS</button></div><label>Who got the GO?</label><div class="segmented rg"><button type="button" data-value="I hit first" class="${gg==="I hit first"?"selected":""}">I hit first</button><button type="button" data-value="Opponent hit first" class="${gg==="Opponent hit first"?"selected":""}">They hit first</button><button type="button" data-value="Even" class="${gg==="Even"?"selected":""}">Even</button><button type="button" data-value="Unclear" class="${gg==="Unclear"?"selected":""}">Unclear</button></div><div class="two"><label>YOUR TECHNIQUE<select class="rm"><option>Not recorded</option><option>Toproll</option><option>Hook</option><option>Press</option><option>King's Move</option><option>Other</option></select></label><label>OPPONENT'S TECHNIQUE<select class="ro"><option>Not recorded</option><option>Toproll</option><option>Hook</option><option>Press</option><option>King's Move</option><option>Other</option></select></label></div><label>Match length<select class="rl"><option>Not recorded</option><option>Under 5 seconds</option><option>5–30 seconds</option><option>Over 30 seconds</option></select></label>`;$("rounds").appendChild(d);d.querySelector(".rm").value=roundData?.myTech||"Not recorded";d.querySelector(".ro").value=roundData?.oppTech||"Not recorded";d.querySelector(".rl").value=roundData?.length||"Not recorded";d.querySelectorAll(".rstrap button").forEach(b=>b.addEventListener("click",()=>{rs=b.dataset.value;d.querySelectorAll(".rstrap button").forEach(x=>x.classList.toggle("selected",x===b))}));d.querySelectorAll(".rr button").forEach(b=>b.addEventListener("click",()=>{rr=b.dataset.value;d.querySelectorAll(".rr button").forEach(x=>x.classList.toggle("selected",x===b))}));d.querySelectorAll(".rg button").forEach(b=>b.addEventListener("click",()=>{gg=b.dataset.value;d.querySelectorAll(".rg button").forEach(x=>x.classList.toggle("selected",x===b))}));d.getRound=()=>({strap:rs,result:rr,go:gg,myTech:d.querySelector(".rm").value,oppTech:d.querySelector(".ro").value,length:d.querySelector(".rl").value})}
$("addRound").addEventListener("click",addRound);
$("matchForm").addEventListener("submit",e=>{e.preventDefault();let opponent=$("opponent").value.trim();if(!opponent)return alert("Enter an opponent.");let m={id:editingMatchId||Date.now(),opponent,matchType:form.type,arm:form.arm,side:form.side,myWeight:$("myWeight").value,oppWeight:$("oppWeight").value,myHeight:$("myHeight").value,oppHeight:$("oppHeight").value,weightClass:$("weightClass").value,fouls:penaltyValue("matchFouls"),warnings:penaltyValue("matchWarnings"),comments:$("comments").value.trim()};if(form.type==="Supermatch"){m.rounds=[...$("rounds").children].map(x=>x.getRound());let w=m.rounds.filter(r=>r.result==="Win").length,l=m.rounds.filter(r=>r.result==="Loss").length;m.result=w>l?"Win":"Loss"}else{m.strap=form.singleStrap;m.result=form.result;m.go=form.go;m.myTech=form.myTech;m.oppTech=form.oppTech;m.length=form.length}if(editingMatchId){const i=state.matches.findIndex(x=>x.id===editingMatchId);if(i>=0)state.matches[i]=m}else state.matches.unshift(m);save();alert(editingMatchId?"Match updated.":"Match saved.");resetMatchForm();page("history")});
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

function renderOpponents(){let names=[...new Set([...state.opponents,...state.matches.map(m=>m.opponent)])].filter(Boolean).sort((a,b)=>a.localeCompare(b));state.opponents=names;$("opponentList").innerHTML=names.map(n=>`<option value="${esc(n)}">`).join("");$("profiles").innerHTML=names.map(n=>{let ms=state.matches.filter(m=>m.opponent===n);return `<div class="entry" data-opponent="${esc(n)}" tabindex="0"><div class="row"><b>${esc(n)}</b><b>${rec(ms)[0]}–${rec(ms)[1]}</b></div><span class="tag">Practice ${rec(ms.filter(m=>m.matchType==="Practice")).join("–")}</span><span class="tag">Tournament ${rec(ms.filter(m=>m.matchType==="Tournament")).join("–")}</span><span class="tag">Supermatch ${rec(ms.filter(m=>m.matchType==="Supermatch")).join("–")}</span></div>`}).join("")||'<p class="muted">No opponents yet.</p>';document.querySelectorAll("#profiles [data-opponent]").forEach(x=>x.addEventListener("click",()=>showOpponent(x.dataset.opponent)))}
function showOpponent(name){let ms=state.matches.filter(m=>m.opponent===name),weights=[...new Set(ms.map(m=>m.oppWeight).filter(Boolean))].sort((a,b)=>a-b);let heights=[...new Set(ms.map(m=>m.oppHeight).filter(Boolean))].sort((a,b)=>a-b);let sections=["Practice","Tournament","Supermatch"].map(type=>{let x=ms.filter(m=>m.matchType===type),r=rec(x),st=techniqueStats(x),best=Object.entries(st.mine).map(([k,v])=>({k,...v,n:v.w+v.l})).filter(x=>x.n>=3).sort((a,b)=>b.w/b.n-a.w/a.n)[0];return `<div class="rec"><b>${type}: ${r[0]}–${r[1]}</b><br><span class="muted">${best?"Best recorded technique: "+esc(best.k)+" · "+Math.round(best.w/best.n*100)+"%":"Not enough technique data"}</span></div>`}).join("");$("opponentDetail").classList.remove("hidden");$("opponentDetail").innerHTML=`<div class="row"><h2>${esc(name)}</h2><button id="closeOpp">Close</button></div><p><b>Weight history:</b> ${weights.length?weights.join(", ")+" lb":"Not recorded"}</p><p><b>Height history:</b> ${heights.length?heights.map(h=>Math.floor(h/12)+"\'"+(h%12)+"\"").join(", "):"Not recorded"}</p>${sections}`;$("closeOpp").addEventListener("click",()=>$("opponentDetail").classList.add("hidden"))}
$("statScope")?.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{scope=b.dataset.value;$("statScope").querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b));renderDashboard()}));

function bindReadyGo(){
  const mode=$("readyGoMode");
  if(mode)mode.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>setReadyGoMode(b.dataset.value)));
  const tableStart=$("rgStart"),tableStop=$("rgStop"),reactionStartBtn=$("reactionStart"),reactionStopBtn=$("reactionStop"),reactionButton=$("reactionTap");
  if(tableStart)tableStart.addEventListener("click",rgStartTable);
  if(tableStop)tableStop.addEventListener("click",rgStopTable);
  if(reactionStartBtn)reactionStartBtn.addEventListener("click",reactionStart);
  if(reactionStopBtn)reactionStopBtn.addEventListener("click",reactionStop);
  if(reactionButton)reactionButton.addEventListener("click",reactionTap);
  rgBindTiming();
  bindPenaltyButtons();
  tpBindTiming();
}
try{renderDashboard();renderHistory();renderTraining();renderOpponents()}catch(e){}
voiceLoad();
function bindVoice(){const t=$("voiceType"),r=$("voiceRecord"),p=$("voicePlay"),k=$("voiceKeep");if(t)t.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>voiceSetType(b.dataset.value)));if(r)r.addEventListener("click",()=>voiceRecorder&&voiceRecorder.state!=="inactive"?voiceStop():voiceRecord());if(p)p.addEventListener("click",voicePlay);if(k)k.addEventListener("click",voiceKeep);voiceUpdate()}
bindReadyGo();
bindVoice();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js?v=760").catch(()=>{});
})();
