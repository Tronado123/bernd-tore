
const API = "https://v3.football.api-sports.io";

const DEFAULT_COUNTRIES = [
["Australien","Australia"],["Bahrain","Bahrain"],["Belarus","Belarus"],["Belgien","Belgium"],["Bolivien","Bolivia"],
["Bulgarien","Bulgaria"],["Chile","Chile"],["China","China"],["Dänemark","Denmark"],["Deutschland","Germany"],
["England","England"],["Estland","Estonia"],["Finnland","Finland"],["Frankreich","France"],["Griechenland","Greece"],
["Iran","Iran"],["Irland","Ireland"],["Island","Iceland"],["Israel","Israel"],["Italien","Italy"],["Jamaika","Jamaica"],
["Japan","Japan"],["Kanada","Canada"],["Kolumbien","Colombia"],["Kroatien","Croatia"],["Lettland","Latvia"],
["Litauen","Lithuania"],["Luxemburg","Luxembourg"],["Montenegro","Montenegro"],["Niederlande","Netherlands"],
["Nordirland","Northern-Ireland"],["Norwegen","Norway"],["Österreich","Austria"],["Peru","Peru"],["Polen","Poland"],
["Portugal","Portugal"],["Rumänien","Romania"],["Saudi-Arabien","Saudi-Arabia"],["Schottland","Scotland"],
["Schweden","Sweden"],["Schweiz","Switzerland"],["Slowakei","Slovakia"],["Slowenien","Slovenia"],
["Südkorea","South-Korea"],["Tschechien","Czech-Republic"],["Türkei","Turkey"],["Ungarn","Hungary"],["USA","USA"],
["Wales","Wales"],["Zypern","Cyprus"],["Spanien","Spain"]
];

const els = {
  apiKey: document.querySelector("#apiKey"),
  tavilyKey: document.querySelector("#tavilyKey"),
  saveTavilyBtn: document.querySelector("#saveTavilyBtn"),
  saveKeyBtn: document.querySelector("#saveKeyBtn"),
  dateFrom: document.querySelector("#dateFrom"),
  dateTo: document.querySelector("#dateTo"),
  countries: document.querySelector("#countries"),
  analyzeBtn: document.querySelector("#analyzeBtn"),
  demoBtn: document.querySelector("#demoBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  progress: document.querySelector("#progress"),
  progressBar: document.querySelector("#progressBar"),
  message: document.querySelector("#message"),
  body: document.querySelector("#resultsBody"),
  statusBadge: document.querySelector("#statusBadge"),
  nextWeekendBtn: document.querySelector("#nextWeekendBtn"),
  deepModeBtn: document.querySelector("#deepModeBtn"),
  dialog: document.querySelector("#detailsDialog"),
  details: document.querySelector("#detailsContent"),
  closeDialog: document.querySelector("#closeDialog")
};
const tendencyHeading=document.querySelector("thead th:nth-child(6)");
if(tendencyHeading) tendencyHeading.textContent="Wahrscheinlichster Endstand";
const scoreHeading=document.querySelector("thead th:nth-child(5)");
if(scoreHeading){
  const over35Heading=document.createElement("th");
  over35Heading.textContent="Ü 3,5";
  const firstHalfHeading=document.createElement("th");
  firstHalfHeading.textContent="1. HZ Ü 1,5";
  scoreHeading.parentNode.insertBefore(over35Heading,scoreHeading);
  scoreHeading.parentNode.insertBefore(firstHalfHeading,scoreHeading);
}
const resultsTable=document.querySelector("table");
if(resultsTable) resultsTable.style.minWidth="1080px";

let selectedCountries = new Set(DEFAULT_COUNTRIES.map(x=>x[1]));
let results = [];
let deepMode = true;

function fmtDate(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function setToday(){
  const now = new Date();
  els.dateFrom.value = fmtDate(now);
  els.dateTo.value = fmtDate(now);
}
setToday();
els.nextWeekendBtn.textContent="Heute auswählen";

DEFAULT_COUNTRIES.forEach(([de,en])=>{
  const b=document.createElement("button");
  b.className="chip on"; b.textContent=de;
  b.onclick=()=>{
    if(selectedCountries.has(en)){selectedCountries.delete(en);b.classList.remove("on")}
    else{selectedCountries.add(en);b.classList.add("on")}
  };
  els.countries.appendChild(b);
});

const savedKey=localStorage.getItem("berndApiKey")||"";
els.apiKey.value=savedKey;
if(savedKey){els.statusBadge.textContent="API bereit";els.statusBadge.classList.add("live")}

const savedTavily=localStorage.getItem("berndTavilyKey")||"";
els.tavilyKey.value=savedTavily;
els.saveTavilyBtn.onclick=()=>{
  const k=els.tavilyKey.value.trim();
  localStorage.setItem("berndTavilyKey",k);
  els.message.textContent=k?"Web-Recherche aktiviert. Tavily-Key wurde nur auf diesem Gerät gespeichert.":"Web-Recherche-Key entfernt.";
};

els.saveKeyBtn.onclick=()=>{
  const k=els.apiKey.value.trim();
  localStorage.setItem("berndApiKey",k);
  els.statusBadge.textContent=k?"API bereit":"Demo";
  els.statusBadge.classList.toggle("live",!!k);
  els.message.textContent=k?"API-Key nur auf diesem Gerät gespeichert.":"API-Key entfernt.";
};
els.nextWeekendBtn.onclick=setToday;
els.deepModeBtn.onclick=()=>{
  deepMode=!deepMode;
  els.deepModeBtn.classList.toggle("active",deepMode);
  els.deepModeBtn.textContent=deepMode?"Bernd-Check: Top 5":"Bernd-Check: aus";
};
els.closeDialog.onclick=()=>els.dialog.close();

function dateRange(from,to){
  const out=[], a=new Date(from+"T12:00:00"), b=new Date(to+"T12:00:00");
  while(a<=b){out.push(fmtDate(a));a.setDate(a.getDate()+1)}
  return out;
}

async function api(path){
  const key=localStorage.getItem("berndApiKey")||els.apiKey.value.trim();
  if(!key) throw new Error("Bitte zuerst einen API‑Football-Key eintragen.");
  const r=await fetch(API+path,{headers:{"x-apisports-key":key}});
  if(!r.ok) throw new Error("API-Fehler "+r.status);
  const j=await r.json();
  if(j.errors && Object.keys(j.errors).length) throw new Error(JSON.stringify(j.errors));
  return j;
}

async function tavilySearch(query, topic="general", timeRange="month"){
  const key=localStorage.getItem("berndTavilyKey")||els.tavilyKey?.value.trim();
  if(!key) return null;
  const r=await fetch("https://api.tavily.com/search",{
    method:"POST",
    headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      query,
      search_depth:"basic",
      max_results:5,
      topic,
      time_range:timeRange,
      include_answer:"basic",
      include_raw_content:false,
      include_images:false
    })
  });
  if(!r.ok) throw new Error("Tavily Websuche: "+r.status);
  return await r.json();
}

function domainOf(url){
  try{return new URL(url).hostname.replace(/^www\./,"")}catch(e){return "Quelle"}
}

function webResearchSummary(searches){
  const results=[];
  const answers=[];
  (searches||[]).forEach(s=>{
    if(!s)return;
    if(s.answer) answers.push(s.answer);
    (s.results||[]).forEach(x=>{
      if(!results.some(y=>y.url===x.url)) results.push({
        title:x.title||domainOf(x.url),url:x.url,content:x.content||"",score:x.score||0,domain:domainOf(x.url)
      });
    });
  });
  const blob=(answers.join(" ")+" "+results.map(x=>x.content).join(" ")).toLowerCase();
  const tags=[];
  const words=[
    ["Verletzung/Krankheit",["injur","verletz","krank","illness","sidelined","muscle","hamstring"]],
    ["Sperre",["suspend","gesperrt","red card","ban"]],
    ["Transfer",["transfer","signing","neuzugang","abgang","loan","deal"]],
    ["Trainer",["coach","trainer","manager","head coach"]],
    ["Aufstellung",["lineup","starting xi","aufstellung","expected xi","team news"]]
  ];
  words.forEach(([label,ks])=>{if(ks.some(k=>blob.includes(k)))tags.push(label)});
  return {answers,results:results.slice(0,10),tags};
}


function leagueLooksRelevant(league){
  const n=(league.name||"").toLowerCase();
  const banned=["cup","pokal","copa","coupe","super cup","supercup","women","fémin","femin","u19","youth"];
  if(banned.some(x=>n.includes(x))) return false;
  const allowedHints=[
    "a-league","npl","premier league","premier division","pro league","wysheyshaya","jupiler","challenger",
    "liga de fútbol","serie a","serie b","parva liga","super league","primera división","superliga",
    "bundesliga","2. bundesliga","3. liga","championship","league one","league two","national league",
    "meistriliiga","veikkausliiga","ykkösliiga","ligue 1","ligue 2","besta deild","ligat ha'al","j1 league",
    "canadian premier","qsl","categoría primera","hnl","virsliga","toplyga","a lyga","bgl ligue","botola pro",
    "prva crnogorska","eredivisie","eerste divisie","nifl premiership","eliteserien","obos-ligaen","2. division",
    "2. liga","liga 1","ekstraklasa","1. liga","liga portugal","liga portugal 2","liga 3","division 1",
    "allsvenskan","superettan","nike liga","la liga","primera rfef","k league 1","division 2","süper lig","1. lig",
    "segunda división","mls","usl championship","cymru premier","cyprus league","nb i"
  ];
  return allowedHints.some(x=>n.includes(x));
}

function basicFixtureScore(f){
  // Vorselektion ohne erfundene Leistungsdaten:
  // nur leichte Priorisierung nach Liga/Heimvorteil; Deep-Check liefert den eigentlichen Score.
  let s=50;
  const name=(f.league?.name||"").toLowerCase();
  if(/2|ii|segunda|serie b|ligue 2|challenge|zweite|3|third|national/.test(name)) s+=2;
  return s;
}

function predictionScore(p){
  let score=55;
  const goals=p?.predictions?.goals||{};
  const underOver=(p?.predictions?.under_over||"").toString();
  const advice=(p?.predictions?.advice||"").toLowerCase();
  const numericGoal=value=>{
    const text=String(value??"").trim();
    return /^\d+(\.\d+)?$/.test(text)?Number(text):NaN;
  };
  const gh=numericGoal(goals.home), ga=numericGoal(goals.away);
  if(Number.isFinite(gh)&&Number.isFinite(ga)){
    const total=gh+ga;
    score += Math.max(-12,Math.min(22,(total-2.2)*12));
  }
  if(underOver.includes("+2.5") || underOver.toLowerCase().includes("over")) score+=9;
  if(advice.includes("over")) score+=5;
  const cmp=p?.comparison||{};
  const attH=parseFloat(cmp.att?.home), attA=parseFloat(cmp.att?.away);
  if(Number.isFinite(attH)&&Number.isFinite(attA)) score+=(attH+attA-100)/20;
  return Math.max(35,Math.min(92,score));
}

function recentStats(fixtures, teamId){
  const games=fixtures.slice(0,20);
  let gf=0,ga=0,o15=0,o25=0,o35=0,btts=0,homeN=0,awayN=0,homeGoals=0,awayGoals=0,valid=0,htValid=0,htOver15=0;
  for(const x of games){
    const home=x.teams.home.id===teamId;
    const a=home?x.goals.home:x.goals.away;
    const b=home?x.goals.away:x.goals.home;
    if(a==null||b==null) continue;
    valid++; gf+=a; ga+=b;
    const t=a+b;
    if(t>=2)o15++;
    if(t>=3)o25++;
    if(t>=4)o35++;
    if(a>0&&b>0)btts++;
    if(home){homeN++;homeGoals+=t}else{awayN++;awayGoals+=t}
    const htHome=x.score?.halftime?.home;
    const htAway=x.score?.halftime?.away;
    if(htHome!=null&&htAway!=null){
      htValid++;
      if(Number(htHome)+Number(htAway)>=2) htOver15++;
    }
  }
  const n=Math.max(valid,1);
  return {
    n:valid,gf,ga,avgGF:gf/n,avgGA:ga/n,
    over15Pct:o15/n*100,overPct:o25/n*100,over35Pct:o35/n*100,bttsPct:btts/n*100,
    homeAvgTotal:homeN?homeGoals/homeN:0,awayAvgTotal:awayN?awayGoals/awayN:0,
    htValid,firstHalfOver15Pct:htValid?htOver15/htValid*100:0
  };
}

function deepScore(base, hs, as, h2h, injuries){
  const combinedOver=(hs.overPct+as.overPct)/2;
  const combinedGoals=hs.avgGF+hs.avgGA+as.avgGF+as.avgGA;
  let s=base*0.5 + combinedOver*0.35 + Math.min(18,Math.max(0,(combinedGoals-4)*4));
  if(h2h?.length){
    let o=0,n=0,total=0;
    h2h.slice(0,10).forEach(x=>{
      if(x.goals.home==null||x.goals.away==null)return;
      const t=x.goals.home+x.goals.away; total+=t;n++;if(t>=3)o++;
    });
    if(n) s += (o/n*100-50)*0.08;
  }
  // Verletzungen sind kontextabhängig; daher nur sehr kleiner pauschaler Einfluss.
  if(injuries?.length>=4) s+=1;
  return Math.max(35,Math.min(95,s));
}

function stars(score){
  if(score>=82)return"🔥🔥🔥🔥🔥";
  if(score>=75)return"🔥🔥🔥🔥½";
  if(score>=68)return"🔥🔥🔥🔥";
  if(score>=61)return"🔥🔥🔥½";
  return"🔥🔥🔥";
}

function poisson(k,lambda){
  let factorial=1;
  for(let i=2;i<=k;i++) factorial*=i;
  return Math.exp(-lambda)*Math.pow(lambda,k)/factorial;
}

function modelExpectedGoals(item){
  const hs=item.homeStats, as=item.awayStats;
  if(hs&&as&&hs.n>=3&&as.n>=3){
    return {
      home:Math.max(0.15,Math.min(4.5,(hs.avgGF+as.avgGA)/2+0.15)),
      away:Math.max(0.15,Math.min(4.5,(as.avgGF+hs.avgGA)/2)),
      detailed:true
    };
  }

  // Gratis-Fallback: Score bestimmt die erwartete Gesamttorzahl;
  // API-Siegprozente verteilen sie auf Heim und Auswärts.
  const total=Math.max(1.6,Math.min(4.2,2.5+(Number(item.score||50)-50)*0.025));
  const percent=item.prediction?.predictions?.percent||{};
  const homePct=parseFloat(percent.home);
  const awayPct=parseFloat(percent.away);
  const advantage=Number.isFinite(homePct)&&Number.isFinite(awayPct)?(homePct-awayPct)/300:0.04;
  const homeShare=Math.max(0.35,Math.min(0.68,0.52+advantage));
  return {home:total*homeShare,away:total*(1-homeShare),detailed:false};
}

function probabilityAtLeast(lambda,minGoals){
  let below=0;
  for(let goals=0;goals<minGoals;goals++) below+=poisson(goals,lambda);
  return Math.max(0,Math.min(1,1-below));
}

function modelProbabilities(item){
  const expected=modelExpectedGoals(item);
  const total=expected.home+expected.away;
  const stats=item.homeStats&&item.awayStats?{
    over35:(item.homeStats.over35Pct+item.awayStats.over35Pct)/200,
    firstHalf:item.homeStats.htValid>=3&&item.awayStats.htValid>=3
      ?(item.homeStats.firstHalfOver15Pct+item.awayStats.firstHalfOver15Pct)/200
      :null
  }:null;
  return {
    over35:stats?.over35??probabilityAtLeast(total,4),
    firstHalfOver15:stats?.firstHalf??probabilityAtLeast(total*0.45,2)
  };
}

function tendency(item){
  const expected=modelExpectedGoals(item);
  let best={home:0,away:0,p:-1};
  for(let home=0;home<=7;home++){
    for(let away=0;away<=7;away++){
      const p=poisson(home,expected.home)*poisson(away,expected.away);
      if(p>best.p) best={home,away,p};
    }
  }
  return `${best.home}:${best.away}`;
}


function latestTransfers(transfers, teamId){
  const out=[];
  (transfers||[]).forEach(block=>{
    (block.transfers||[]).forEach(t=>{
      const date=t.date||"";
      const player=t.player?.name||"Spieler";
      const into=t.teams?.in?.id===teamId;
      const outof=t.teams?.out?.id===teamId;
      if(into) out.push({date,type:"Zugang",player,from:t.teams?.out?.name||"?"});
      else if(outof) out.push({date,type:"Abgang",player,to:t.teams?.in?.name||"?"});
    });
  });
  return out.sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8);
}

function coachSummary(coaches){
  if(!coaches?.length) return null;
  const c=coaches[0];
  return {name:c.name||"–",age:c.age||"–",nationality:c.nationality||"–",career:c.career||[]};
}

function topScorersForTeams(players, homeId, awayId){
  return (players||[]).filter(p=>{
    const tid=p.statistics?.[0]?.team?.id;
    return tid===homeId||tid===awayId;
  }).slice(0,10).map(p=>({
    name:p.player?.name||"–",
    team:p.statistics?.[0]?.team?.name||"–",
    goals:p.statistics?.[0]?.goals?.total??0,
    assists:p.statistics?.[0]?.goals?.assists??0
  }));
}

function researchStatus(r){
  const checks=[
    !!r.homeStats,!!r.awayStats,Array.isArray(r.h2h),Array.isArray(r.injuries),
    Array.isArray(r.sidelinedHome),Array.isArray(r.sidelinedAway),
    Array.isArray(r.transfersHome),Array.isArray(r.transfersAway),
    !!r.coachHome||!!r.coachAway,Array.isArray(r.lineups),
    !!r.teamStatsHome||!!r.teamStatsAway,Array.isArray(r.topScorers),!!r.prediction,!!r.webResearch
  ];
  const done=checks.filter(Boolean).length;
  return {done,total:checks.length};
}

function safeText(x){return (x==null||x==="")?"–":String(x)}
function escapeHtml(x){
  return safeText(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function safeWebUrl(x){
  try{
    const u=new URL(String(x));
    return u.protocol==="https:"||u.protocol==="http:"?u.href:"#";
  }catch(e){return "#"}
}
function friendlyError(error){
  const message=String(error?.message||error||"");
  const match=message.match(/Free plans do not have access to this date, try from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/i);
  if(match){
    return `Dein Gratis-Tarif erlaubt aktuell nur Daten vom ${match[1]} bis ${match[2]}. Klicke auf „Heute auswählen“ und versuche es erneut.`;
  }
  return message;
}
function render(){
  els.body.innerHTML="";
  results.sort((a,b)=>b.score-a.score).slice(0,20).forEach((r,i)=>{
    const rs=researchStatus(r);
    const probabilities=modelProbabilities(r);
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td class="rank">${i+1}</td>
      <td>${escapeHtml(r.country)}<br><span class="tiny">${escapeHtml(r.league)}</span></td>
      <td class="match">${escapeHtml(r.home)} – ${escapeHtml(r.away)}</td>
      <td class="over">Ü 2,5<br><span class="fire">${stars(r.score)}</span></td>
      <td class="over">${Math.round(probabilities.over35*100)}%</td>
      <td class="over">${Math.round(probabilities.firstHalfOver15*100)}%</td>
      <td class="score">${Math.round(r.score)}/100</td>
      <td>${escapeHtml(tendency(r))}</td>
      <td><span class="${rs.done>=10?'research-ok':'research-partial'}">${rs.done}/${rs.total}</span></td>
      <td><button class="secondary detailBtn">Ansehen</button></td>`;
    tr.querySelector(".detailBtn").onclick=()=>openDetails(r,i+1);
    els.body.appendChild(tr);
  });
}

function openDetails(r,rank){
  const hs=r.homeStats,as=r.awayStats, rs=researchStatus(r);
  const transfers=[...(r.transfersHome||[]),...(r.transfersAway||[])].slice(0,12);
  const scorerHtml=(r.topScorers||[]).map(x=>`<div class="source-pill"><span>${escapeHtml(x.name)} (${escapeHtml(x.team)})</span><b>${Number(x.goals)||0} Tore</b></div>`).join("");
  const transferHtml=transfers.map(x=>`<div class="source-pill"><span>${escapeHtml(x.type)}: ${escapeHtml(x.player)}</span><span>${escapeHtml(x.date||"")}</span></div>`).join("");
  const checks=[
    ["Letzte 20 / Form",!!hs&&!!as],["H2H bis 10",Array.isArray(r.h2h)],["Verletzungen",Array.isArray(r.injuries)],
    ["Sidelined",Array.isArray(r.sidelinedHome)&&Array.isArray(r.sidelinedAway)],
    ["Transfers",Array.isArray(r.transfersHome)&&Array.isArray(r.transfersAway)],
    ["Trainer",!!r.coachHome||!!r.coachAway],["Aufstellungen",Array.isArray(r.lineups)],
    ["Teamstatistik",!!r.teamStatsHome||!!r.teamStatsAway],["Top-Torjäger",Array.isArray(r.topScorers)],
    ["API-Prognose",!!r.prediction],["Web-News / Personal / Taktik",!!r.webResearch]
  ];
  els.details.innerHTML=`
    <div class="eyebrow">RANG ${rank} • ${escapeHtml(r.country)} • ${escapeHtml(r.league)}</div>
    <h2 style="font-size:24px;margin-top:6px">${escapeHtml(r.home)} – ${escapeHtml(r.away)}</h2>
    <p class="over">Bernd: Über 2,5 • ${stars(r.score)} • Score ${Math.round(r.score)}/100</p>
    <p class="muted">Recherche-Abdeckung: ${rs.done}/${rs.total} strukturierte Prüfpunkte</p>

    <div class="source-list">
      ${checks.map(([n,ok])=>`<div class="source-pill"><span>${n}</span><span class="${ok?'yes':'no'}">${ok?'geprüft':'offen'}</span></div>`).join("")}
    </div>

    ${hs?`<div class="detail-grid">
      <div class="detail-box">${escapeHtml(r.home)}: Spiele geprüft<b>${hs.n}</b></div>
      <div class="detail-box">${escapeHtml(r.away)}: Spiele geprüft<b>${as.n}</b></div>
      <div class="detail-box">${escapeHtml(r.home)}: Ü1,5 / Ü2,5 / Ü3,5<b>${Math.round(hs.over15Pct)}% / ${Math.round(hs.overPct)}% / ${Math.round(hs.over35Pct)}%</b></div>
      <div class="detail-box">${escapeHtml(r.away)}: Ü1,5 / Ü2,5 / Ü3,5<b>${Math.round(as.over15Pct)}% / ${Math.round(as.overPct)}% / ${Math.round(as.over35Pct)}%</b></div>
      <div class="detail-box">${escapeHtml(r.home)}: BTTS<b>${Math.round(hs.bttsPct)}%</b></div>
      <div class="detail-box">${escapeHtml(r.away)}: BTTS<b>${Math.round(as.bttsPct)}%</b></div>
      <div class="detail-box">${escapeHtml(r.home)}: Ø Tore / Gegentore<b>${hs.avgGF.toFixed(2)} / ${hs.avgGA.toFixed(2)}</b></div>
      <div class="detail-box">${escapeHtml(r.away)}: Ø Tore / Gegentore<b>${as.avgGF.toFixed(2)} / ${as.avgGA.toFixed(2)}</b></div>
    </div>`:""}

    <h3>Personal</h3>
    <p><b>Trainer ${escapeHtml(r.home)}:</b> ${escapeHtml(r.coachHome?.name)}</p>
    <p><b>Trainer ${escapeHtml(r.away)}:</b> ${escapeHtml(r.coachAway?.name)}</p>
    <p><b>Verletzungen fürs Spiel:</b> ${r.injuries?.length??"–"}</p>
    <p><b>Länger fehlend / sidelined:</b> ${(r.sidelinedHome?.length??0)+(r.sidelinedAway?.length??0)}</p>

    <h3>Transfers</h3>
    ${transferHtml||"<p class='muted'>Keine Transferdaten geladen.</p>"}

    <h3>Torjäger</h3>
    ${scorerHtml||"<p class='muted'>Keine Torjägerdaten geladen.</p>"}

    <h3>Direkter Vergleich & Aufstellung</h3>
    <p><b>H2H:</b> ${r.h2h?.length??"–"} Spiele verfügbar.</p>
    <p><b>Aufstellungen:</b> ${r.lineups?.length?`${r.lineups.length} Team-Aufstellungen verfügbar`:"vor Spielbeginn ggf. noch nicht verfügbar"}.</p>
    <p><b>API-Tendenz:</b> ${escapeHtml(r.prediction?.predictions?.advice||"keine")}</p>

    <h3>Aktuelle Web-Recherche</h3>
    ${r.webResearch?`
      ${(r.webResearch.tags||[]).map(t=>`<span class="web-tag">${escapeHtml(t)}</span>`).join("")}
      ${(r.webResearch.answers||[]).map(a=>`<div class="web-answer">${escapeHtml(a)}</div>`).join("")}
      <div class="source-list">
        ${(r.webResearch.results||[]).slice(0,8).map(s=>`<div class="source-pill"><a class="web-source" href="${safeWebUrl(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title)}</a><span>${escapeHtml(s.domain)}</span></div>`).join("")}
      </div>
    `:"<p class='muted'>Kein Tavily-Key gesetzt oder keine Web-Ergebnisse verfügbar.</p>"}
    <div class="research-note"><b>Bernd-Regel:</b> Webtreffer werden als Zusatzinformation gezeigt. Die App erfindet keine Ausfälle oder Transfers, wenn keine Quelle gefunden wurde.</div>
    <p class="tiny">Der Score ist eine heuristische Bernd-Bewertung und keine garantierte Eintrittswahrscheinlichkeit.</p>`;
  els.dialog.showModal();
}

async function analyze(){
  try{
    const dates=dateRange(els.dateFrom.value,els.dateTo.value);
    if(!dates.length) throw new Error("Bitte gültige Daten wählen.");
    els.progress.classList.remove("hidden"); els.progressBar.style.width="4%";
    els.message.textContent="Bernd lädt die Spielpläne…";
    let fixtures=[];
    for(let i=0;i<dates.length;i++){
      const j=await api(`/fixtures?date=${dates[i]}`);
      fixtures.push(...j.response);
      els.progressBar.style.width=`${8+15*(i+1)/dates.length}%`;
    }
    fixtures=fixtures.filter(f=>selectedCountries.has(f.league.country)&&leagueLooksRelevant(f.league));
    if(!fixtures.length) throw new Error("Für diese Auswahl wurden keine passenden Ligaspiele gefunden.");

    // Maximal 28 Kandidaten im kostenlosen Modus – schützt die Tagesquote.
    let candidates=fixtures.map(f=>({f,pre:basicFixtureScore(f)}))
      .sort((a,b)=>b.pre-a.pre).slice(0,28);

    els.message.textContent=`${fixtures.length} Ligaspiele gefunden. Bernd prüft ${candidates.length} Kandidaten mit Prognosedaten…`;
    let scored=[];
    for(let i=0;i<candidates.length;i++){
      const f=candidates[i].f;
      let pred=null;
      try{
        const j=await api(`/predictions?fixture=${f.fixture.id}`);
        pred=j.response?.[0]||null;
      }catch(e){}
      scored.push({
        fixtureId:f.fixture.id,country:f.league.country,league:f.league.name,
        home:f.teams.home.name,away:f.teams.away.name,
        homeId:f.teams.home.id,awayId:f.teams.away.id,
        score:predictionScore(pred),prediction:pred,date:f.fixture.date
      });
      els.progressBar.style.width=`${25+35*(i+1)/candidates.length}%`;
    }
    scored.sort((a,b)=>b.score-a.score);

    if(deepMode){
      const deep=scored.slice(0,5);
      els.message.textContent="Bernd-Check: Form, H2H, Verletzungen, Transfers, Trainer, Aufstellungen und Statistiken…";
      for(let i=0;i<deep.length;i++){
        const r=deep[i];
        const f=candidates.find(x=>x.f.fixture.id===r.fixtureId)?.f;
        const leagueId=f?.league?.id;
        const season=f?.league?.season;

        // Kernabfragen zuerst. Promise.allSettled sorgt dafür, dass fehlende Coverage nichts kaputtmacht.
        const core=await Promise.allSettled([
          api(`/fixtures?team=${r.homeId}&last=20`),
          api(`/fixtures?team=${r.awayId}&last=20`),
          api(`/fixtures/headtohead?h2h=${r.homeId}-${r.awayId}&last=10`),
          api(`/injuries?fixture=${r.fixtureId}`),
          api(`/sidelined?team=${r.homeId}`),
          api(`/sidelined?team=${r.awayId}`),
          api(`/transfers?team=${r.homeId}`),
          api(`/transfers?team=${r.awayId}`),
          api(`/coachs?team=${r.homeId}`),
          api(`/coachs?team=${r.awayId}`),
          api(`/fixtures/lineups?fixture=${r.fixtureId}`)
        ]);

        const resp=n=>core[n].status==="fulfilled"?(core[n].value.response||[]):[];
        const homeFix=resp(0), awayFix=resp(1), h2h=resp(2), injuries=resp(3);
        r.homeStats=recentStats(homeFix,r.homeId);
        r.awayStats=recentStats(awayFix,r.awayId);
        r.h2h=h2h; r.injuries=injuries;
        r.sidelinedHome=resp(4); r.sidelinedAway=resp(5);
        r.transfersHome=latestTransfers(resp(6),r.homeId);
        r.transfersAway=latestTransfers(resp(7),r.awayId);
        r.coachHome=coachSummary(resp(8)); r.coachAway=coachSummary(resp(9));
        r.lineups=resp(10);

        // Saisonstatistik und Torjäger nur, wenn Liga/Season vorhanden.
        if(leagueId&&season){
          const extra=await Promise.allSettled([
            api(`/teams/statistics?league=${leagueId}&season=${season}&team=${r.homeId}`),
            api(`/teams/statistics?league=${leagueId}&season=${season}&team=${r.awayId}`),
            api(`/players/topscorers?league=${leagueId}&season=${season}`)
          ]);
          r.teamStatsHome=extra[0].status==="fulfilled"?extra[0].value.response:null;
          r.teamStatsAway=extra[1].status==="fulfilled"?extra[1].value.response:null;
          const top=extra[2].status==="fulfilled"?(extra[2].value.response||[]):[];
          r.topScorers=topScorersForTeams(top,r.homeId,r.awayId);
        }

        r.score=deepScore(r.score,r.homeStats,r.awayStats,h2h,injuries);
        els.progressBar.style.width=`${62+35*(i+1)/deep.length}%`;
      }
    }
    // Aktuelle Web-Recherche für Top 3. Zwei Basic-Suchen pro Spiel = normalerweise 6 Tavily-Credits je Analyse.
    const webKey=localStorage.getItem("berndTavilyKey")||els.tavilyKey?.value.trim();
    if(webKey){
      const webTop=scored.sort((a,b)=>b.score-a.score).slice(0,3);
      els.message.textContent="Bernd durchsucht aktuelle Webquellen für die Top 3…";
      for(let i=0;i<webTop.length;i++){
        const r=webTop[i];
        const q1=`"${r.home}" "${r.away}" injuries injury illness suspended suspension team news lineup ${r.date.slice(0,10)} football`;
        const q2=`"${r.home}" "${r.away}" transfer signing coach manager trainer press conference latest football news`;
        const searches=await Promise.allSettled([
          tavilySearch(q1,"news","month"),
          tavilySearch(q2,"general","month")
        ]);
        const vals=searches.map(x=>x.status==="fulfilled"?x.value:null);
        r.webResearch=webResearchSummary(vals);
        els.progressBar.style.width=`${88+10*(i+1)/webTop.length}%`;
      }
    }

    results=scored.sort((a,b)=>b.score-a.score);
    render();
    els.progressBar.style.width="100%";
    els.message.textContent=`Fertig: ${results.length} Kandidaten bewertet. Tabelle zeigt die besten 20.`;
  }catch(e){
    els.message.textContent="Fehler: "+friendlyError(e);
  }finally{
    setTimeout(()=>els.progress.classList.add("hidden"),1200);
  }
}

els.analyzeBtn.onclick=analyze;

const demo = [
  {country:"Deutschland",league:"2. Bundesliga",home:"Beispiel FC",away:"Torstadt 04",score:84},
  {country:"Österreich",league:"2. Liga",home:"Offensiv Wien",away:"Sturm II",score:80},
  {country:"Schweiz",league:"Challenge League",home:"Xamax Demo",away:"Winterthur Demo",score:76},
  {country:"Frankreich",league:"Ligue 1",home:"Paris Demo",away:"Rennes Demo",score:72},
  {country:"Portugal",league:"Liga Portugal",home:"Sporting Demo",away:"Alverca Demo",score:69}
];
els.demoBtn.onclick=()=>{results=demo.map(x=>({...x}));render();els.message.textContent="Demo-Daten – keine echten Spiele."};

els.exportBtn.onclick=()=>{
  if(!results.length)return;
  const rows=[["Rang","Land","Liga","Begegnung","Tipp","Ü 3,5","1. HZ Ü 1,5","Score","Wahrscheinlichster Endstand"]];
  results.slice(0,20).forEach((r,i)=>{
    const probabilities=modelProbabilities(r);
    rows.push([
      i+1,r.country,r.league,`${r.home} - ${r.away}`,"Über 2,5",
      `${Math.round(probabilities.over35*100)}%`,`${Math.round(probabilities.firstHalfOver15*100)}%`,
      Math.round(r.score),tendency(r)
    ]);
  });
  const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bernd-over25.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"))}
