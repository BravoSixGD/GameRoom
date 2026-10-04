import {login,db,ref,get,set,update,onValue,onDisconnect,auth} from "./core/firebase.js";
import {catalog,initialState} from "./core/games.js";

const $=s=>document.querySelector(s), screens=["landing","slotScreen","lobby","gameScreen"];
const reactions=["❤️","😂","😭","😡","👏"];
let room=null,roomCode=null,mySlot=null,nickname="",unsub=null,currentGame=null,lastReaction=0,sound=true;
const show=id=>screens.forEach(x=>$("#"+x).classList.toggle("hidden",x!==id));
const toast=t=>{let e=$("#toast");e.textContent=t;e.classList.remove("hidden");setTimeout(()=>e.classList.add("hidden"),1800)};
const code=()=>Math.random().toString(36).slice(2,8).toUpperCase();
const cleanName=s=>(s||"").trim().slice(0,18);
function roomRef(path=""){return ref(db,`rooms/${roomCode}${path?"/"+path:""}`)}
async function boot(){await login();renderTiles();renderReactions();const q=new URLSearchParams(location.search).get("room");if(q){$("#roomCode").value=q.toUpperCase()}navigator.serviceWorker?.register("./sw.js").catch(()=>{});}
function renderTiles(){ $("#gameTiles").innerHTML=catalog.map(g=>`<button class="tile" data-game="${g.id}"><span class="emoji">${g.emoji}</span><span><b>${g.name}</b><br><small>${g.subtitle}</small></span></button>`).join(""); }
function renderReactions(){for(const id of ["lobbyReactions","gameReactions"]) $("#"+id).innerHTML=reactions.map(r=>`<button class="reaction" data-reaction="${r}">${r}</button>`).join("")}
async function createRoom(){
 nickname=cleanName($("#nickname").value); if(!nickname)return msg("Enter a nickname first.");
 roomCode=code(); mySlot="A";
 const data={createdAt:Date.now(),players:{A:{uid:auth.currentUser.uid,name:nickname,online:true},B:null},challenge:null,activeGame:null,stats:{A:{wins:0},B:{wins:0},draws:0,total:0,byGame:{}},reaction:null};
 await set(roomRef(),data); await enterRoom();
}
async function joinStart(){
 nickname=cleanName($("#nickname").value);roomCode=$("#roomCode").value.trim().toUpperCase();
 if(!nickname||roomCode.length!==6)return msg("Enter a nickname and 6-character room code.");
 const snap=await get(roomRef());if(!snap.exists())return msg("Room not found.");
 room=snap.val();$("#slotAName").textContent=room.players?.A?.name||"Available";$("#slotBName").textContent=room.players?.B?.name||"Available";show("slotScreen");
}
async function claimSlot(slot){
 const snap=await get(roomRef());if(!snap.exists())return toast("Room disappeared.");
 const r=snap.val(), existing=r.players?.[slot];
 if(existing && existing.uid!==auth.currentUser.uid && existing.online) return toast(`${slot} is currently occupied.`);
 mySlot=slot;await update(roomRef(`players/${slot}`),{uid:auth.currentUser.uid,name:nickname,online:true,lastSeen:Date.now()});await enterRoom();
}
async function enterRoom(){
 history.replaceState({}, "", `${location.pathname}?room=${roomCode}`);
 await onDisconnect(roomRef(`players/${mySlot}/online`)).set(false);
 if(unsub)unsub();unsub=onValue(roomRef(),s=>{if(!s.exists())return;room=s.val();renderRoom();});
 show("lobby");
}
function renderRoom(){
 $("#roomLabel").textContent=roomCode;$("#playerA").textContent=room.players?.A?.name||"Waiting…";$("#playerB").textContent=room.players?.B?.name||"Waiting…";
 $("#scoreA").textContent=room.stats?.A?.wins||0;$("#scoreB").textContent=room.stats?.B?.wins||0;
 const ch=room.challenge, banner=$("#challengeBanner");
 if(ch && ch.to===mySlot){banner.classList.remove("hidden");const g=catalog.find(x=>x.id===ch.game);banner.innerHTML=`<b>${room.players?.[ch.from]?.name||"Opponent"} wants to play ${g?.name||"a game"}</b><div class="actions"><button id="acceptCh">Accept</button><button id="declineCh">Decline</button></div>`;$("#acceptCh").onclick=()=>acceptChallenge(ch);$("#declineCh").onclick=()=>update(roomRef(),{challenge:null});}else banner.classList.add("hidden");
 if(room.activeGame && room.activeGame.status==="playing"){currentGame=room.activeGame.id;show("gameScreen");renderGame();}else if(!$("#gameScreen").classList.contains("hidden")){show("lobby")}
 const rx=room.reaction;if(rx&&rx.at>lastReaction&&rx.from!==mySlot){lastReaction=rx.at;toast(`${room.players?.[rx.from]?.name||"Player"}: ${rx.emoji}`)}
}
async function challenge(game){if(!room.players?.A||!room.players?.B)return toast("Waiting for the other player.");await update(roomRef(),{challenge:{from:mySlot,to:other(),game,at:Date.now()}});toast("Challenge sent!")}
async function acceptChallenge(ch){const state=initialState(ch.game,Math.random()<.5?"A":"B");await update(roomRef(),{challenge:null,activeGame:{id:ch.game,status:"playing",state,startedAt:Date.now(),resultRecorded:false}})}
function other(){return mySlot==="A"?"B":"A"}
async function react(emoji){await set(roomRef("reaction"),{from:mySlot,emoji,at:Date.now()})}
function msg(t){$("#landingMsg").textContent=t}
async function share(){const url=`${location.origin}${location.pathname}?room=${roomCode}`;if(navigator.share)await navigator.share({title:"Game Room",text:`Join my private Game Room — code ${roomCode}`,url}).catch(()=>{});else prompt("Copy this invite link:",url)}
function renderGame(){
 const g=catalog.find(x=>x.id===room.activeGame.id),s=room.activeGame.state;$("#gameTitle").textContent=g.name;
 $("#turnLabel").textContent=s.winner?winnerText(s):s.turn?`${room.players?.[s.turn]?.name||s.turn}'s turn`:"Choose secretly";
 if(g.id==="tictactoe")renderTTT(s);if(g.id==="connect4")renderConnect(s);if(g.id==="dots")renderDots(s);if(g.id==="rps")renderRPS(s);if(g.id==="wyr")renderWYR(s);
 if(s.winner && !room.activeGame.resultRecorded) recordResult(s.winner,g.id);
}
function winnerText(s){return s.winner==="draw"?"Draw!":`${room.players?.[s.winner]?.name||s.winner} wins!`}
async function pushState(s){await update(roomRef("activeGame"),{state:s})}
function win3(c){const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(const l of L)if(c[l[0]]&&c[l[0]]===c[l[1]]&&c[l[1]]===c[l[2]])return c[l[0]];return c.every(Boolean)?"draw":null}
function renderTTT(s){$("#gameMount").innerHTML=`<div class="board ttt">${s.cells.map((v,i)=>`<button data-i="${i}">${v==="A"?"✕":v==="B"?"○":""}</button>`).join("")}</div>`;$("#gameMount").querySelectorAll("button").forEach(b=>b.onclick=async()=>{if(s.winner||s.turn!==mySlot||s.cells[+b.dataset.i])return;let n=structuredClone(s);n.cells[+b.dataset.i]=mySlot;n.winner=win3(n.cells);n.turn=other();await pushState(n)})}
function c4win(c){for(let r=0;r<6;r++)for(let col=0;col<7;col++){for(const[dR,dC]of[[0,1],[1,0],[1,1],[1,-1]]){let p=c[r*7+col];if(!p)continue;let ok=true;for(let k=1;k<4;k++){let rr=r+dR*k,cc=col+dC*k;if(rr<0||rr>=6||cc<0||cc>=7||c[rr*7+cc]!==p)ok=false}if(ok)return p}}return c.every(Boolean)?"draw":null}
function renderConnect(s){$("#gameMount").innerHTML=`<div class="board connect">${s.cells.map((v,i)=>`<button class="${v==="A"?"red":v==="B"?"yellow":""}" data-col="${i%7}"></button>`).join("")}</div>`;$("#gameMount").querySelectorAll("button").forEach(b=>b.onclick=async()=>{if(s.winner||s.turn!==mySlot)return;let col=+b.dataset.col,row=-1;for(let r=5;r>=0;r--)if(!s.cells[r*7+col]){row=r;break}if(row<0)return;let n=structuredClone(s);n.cells[row*7+col]=mySlot;n.winner=c4win(n.cells);n.turn=other();await pushState(n)})}
function renderDots(s){let N=5,html="",cols=[];for(let i=0;i<11;i++)cols.push(i%2===0?"12px":"1fr");for(let r=0;r<11;r++)for(let c=0;c<11;c++){if(r%2===0&&c%2===0)html+=`<span class="dotcell"></span>`;else if(r%2===0&&c%2===1){let i=(r/2)*5+(c-1)/2;html+=`<button class="edge h ${s.h[i]?"on":""}" data-t="h" data-i="${i}"></button>`}else if(r%2===1&&c%2===0){let i=((r-1)/2)*6+c/2;html+=`<button class="edge v ${s.v[i]?"on":""}" data-t="v" data-i="${i}"></button>`}else{let i=((r-1)/2)*5+(c-1)/2;html+=`<span class="box ${s.boxes[i]||""}">${s.boxes[i]||""}</span>`}}$("#gameMount").innerHTML=`<div style="text-align:center"><b>A ${s.scores.A} · ${s.scores.B} B</b></div><div class="board dots" style="grid-template-columns:${cols.join(" ")};grid-template-rows:repeat(11,auto)">${html}</div>`;$("#gameMount").querySelectorAll(".edge").forEach(b=>b.onclick=()=>dotsMove(s,b.dataset.t,+b.dataset.i))}
async function dotsMove(s,t,i){if(s.winner||s.turn!==mySlot||s[t][i])return;let n=structuredClone(s);n[t][i]=mySlot;let claimed=0;for(let br=0;br<5;br++)for(let bc=0;bc<5;bc++){let bi=br*5+bc;if(n.boxes[bi])continue;let top=br*5+bc,bottom=(br+1)*5+bc,left=br*6+bc,right=br*6+bc+1;if(n.h[top]&&n.h[bottom]&&n.v[left]&&n.v[right]){n.boxes[bi]=mySlot;n.scores[mySlot]++;claimed++}}if(!claimed)n.turn=other();if(n.boxes.every(Boolean))n.winner=n.scores.A===n.scores.B?"draw":n.scores.A>n.scores.B?"A":"B";await pushState(n)}
function renderRPS(s){let my=s.picks[mySlot];$("#gameMount").innerHTML=`<div class="rpsresult">Round ${s.round} · ${s.roundWins.A}–${s.roundWins.B}<br><small>${s.last||"Pick secretly — your opponent cannot see it."}</small></div><div class="board rps">${[["rock","✊"],["paper","✋"],["scissors","✌️"]].map(([v,e])=>`<button data-p="${v}" ${my?"disabled":""}>${e}</button>`).join("")}</div>`;$("#gameMount").querySelectorAll("button").forEach(b=>b.onclick=()=>rpsPick(s,b.dataset.p))}
async function rpsPick(s,p){if(s.winner||s.picks[mySlot])return;let n=structuredClone(s);n.picks[mySlot]=p;if(n.picks.A&&n.picks.B){let a=n.picks.A,b=n.picks.B,w=a===b?null:((a==="rock"&&b==="scissors")||(a==="paper"&&b==="rock")||(a==="scissors"&&b==="paper"))?"A":"B";n.last=w?`${room.players[w].name} won the round`:"Round draw";if(w)n.roundWins[w]++;if(n.roundWins.A>=3||n.roundWins.B>=3)n.winner=n.roundWins.A>=3?"A":"B";else{n.round++;n.picks={A:null,B:null}}}await pushState(n)}
const questions=[["Always be 10 minutes late","Always be 20 minutes early"],["Explore space","Explore the deep ocean"],["Give up music for a year","Give up movies for a year"],["Have unlimited travel","Have unlimited food delivery"],["Know every language","Play every instrument"],["Live by the beach","Live in the mountains"],["Only text for a week","Only voice-call for a week"],["Rewatch a favorite","Try something completely new"],["Have a pause button","Have a rewind button"],["Plan every trip","Travel completely spontaneously"]];
function renderWYR(s){let q=questions[s.index%questions.length],mine=s.picks[mySlot],both=s.picks.A&&s.picks.B;$("#gameMount").innerHTML=`<div class="wyrprompt">Would you rather…</div><div class="board wyr"><button data-p="1" class="${mine==="1"?"selected":""}">${q[0]}</button><button data-p="2" class="${mine==="2"?"selected":""}">${q[1]}</button>${both?`<div class="rpsresult">${s.picks.A===s.picks.B?"Same choice! 🎉":"Different choices 😄"}<br><small>${s.matches} matches in ${s.rounds} rounds</small></div><button id="nextQ">Next question</button>`:""}</div>`;$("#gameMount").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>wyrPick(s,b.dataset.p));$("#nextQ")?.addEventListener("click",()=>wyrNext(s))}
async function wyrPick(s,p){if(s.picks[mySlot])return;let n=structuredClone(s);n.picks[mySlot]=p;if(n.picks.A&&n.picks.B){n.rounds++;if(n.picks.A===n.picks.B)n.matches++}await pushState(n)}
async function wyrNext(s){if(!(s.picks.A&&s.picks.B))return;let n=structuredClone(s);n.index++;n.picks={A:null,B:null};await pushState(n)}
async function recordResult(winner,game){if(room.activeGame.resultRecorded)return;let stats=structuredClone(room.stats||{A:{wins:0},B:{wins:0},draws:0,total:0,byGame:{}});stats.total=(stats.total||0)+1;stats.byGame??={};stats.byGame[game]??={A:0,B:0,draws:0,total:0};stats.byGame[game].total++;if(winner==="draw"){stats.draws++;stats.byGame[game].draws++}else{stats[winner].wins++;stats.byGame[game][winner]++}await update(roomRef(),{stats,"activeGame/resultRecorded":true})}
async function rematch(){if(!room.activeGame)return;await update(roomRef("activeGame"),{state:initialState(room.activeGame.id,Math.random()<.5?"A":"B"),status:"playing",resultRecorded:false,startedAt:Date.now()})}
function showStats(){let s=room?.stats||{},html=`<div class="statrow"><b>Total matches</b><span>${s.total||0}</span></div><div class="statrow"><b>${room?.players?.A?.name||"Player A"} wins</b><span>${s.A?.wins||0}</span></div><div class="statrow"><b>${room?.players?.B?.name||"Player B"} wins</b><span>${s.B?.wins||0}</span></div><div class="statrow"><b>Draws</b><span>${s.draws||0}</span></div><h3>By game</h3>`;for(const g of catalog){let x=s.byGame?.[g.id];if(x)html+=`<div class="statrow"><span>${g.emoji} ${g.name}</span><span>${x.A||0}–${x.B||0}${x.draws?` · ${x.draws} draws`:""}</span></div>`}$("#statsContent").innerHTML=html;$("#statsDialog").showModal()}
$("#createRoom").onclick=createRoom;$("#joinRoom").onclick=joinStart;$("#backLanding").onclick=()=>show("landing");document.querySelectorAll(".slot").forEach(b=>b.onclick=()=>claimSlot(b.dataset.slot));
$("#gameTiles").onclick=e=>{let b=e.target.closest("[data-game]");if(b)challenge(b.dataset.game)};document.addEventListener("click",e=>{let b=e.target.closest("[data-reaction]");if(b&&roomCode)react(b.dataset.reaction)});
$("#shareBtn").onclick=share;$("#backLobby").onclick=async()=>{await update(roomRef(),{activeGame:null});show("lobby")};$("#rematchBtn").onclick=rematch;$("#statsBtn").onclick=()=>room?showStats():toast("Join a room first");$("#closeStats").onclick=()=>$("#statsDialog").close();
$("#soundBtn").onclick=()=>{sound=!sound;$("#soundBtn").textContent=sound?"🔊":"🔇"};$("#homeBtn").onclick=()=>room?show("lobby"):show("landing");
boot().catch(e=>msg("Could not connect: "+e.message));
