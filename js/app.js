var state = null;

function freshMatch(){
  return {
    screen:'setup',
    teamA:'Team A', teamB:'Team B',
    overs:20, wicketsLimit:10,
    battingFirst:null,
    tossWinner:null, tossChoice:null,
    tossOpen:false, tossStep:null,
    inningsNum:1,
    target:null,
    data:{1:null,2:null},
    playerPopup:null, playerPopupError:null, popupQueue:[],
    extraPopup:null,
    showOverHistory:false, theme:'dark', manOfMatch:null, toastMessage:null,
    dismissalPopup:null,
    powerplayOvers:6,
    resetConfirmOpen:false,
    superOver:null,
    soNamesPopup:false, soExtraPopup:null, superOverTiedFinal:false,
    matchRecorded:false, previousScreen:null, leaderboardTab:'batting',
    user:null, authReady:false, authError:null, matchHistoryCache:null,
    showInningsCard:{1:false, 2:false}
  };
}
state = freshMatch();

function freshInnings(battingName, bowlingName){
  return {
    battingName:battingName, bowlingName:bowlingName,
    runs:0, wickets:0, legalBalls:0,
    batsmen:[
      {name:'Batsman 1', runs:0, balls:0, fours:0, sixes:0, out:false, howOut:''},
      {name:'Batsman 2', runs:0, balls:0, fours:0, sixes:0, out:false, howOut:''}
    ],
    strikerIdx:0, nonStrikerIdx:1, nextBatNum:3,
    bowlers:[{name:'Bowler 1', balls:0, runs:0, wickets:0, maidens:0}],
    bowlerIdx:0,
    thisOver:[], overHistory:[], overBowlers:[],
    history:[],
    over_wkts_seen:0,
    ended:false,
    wicketLog:[],
    partnershipStartRuns:0, partnershipStartBalls:0,
    extras:{wd:0, nb:0, b:0, lb:0},
    startTime:null, endTime:null
  };
}

var lastRenderedScreen = null;

function render(){
  var app = document.getElementById('app');
  app.className = state.theme==='light' ? 'light' : '';
  if(state.screen==='result') recordMatchToHistory();
  if(state.screen==='setup') app.innerHTML = renderSetup();
  else if(state.screen==='scoring') app.innerHTML = renderScoring();
  else if(state.screen==='break') app.innerHTML = renderBreak();
  else if(state.screen==='result') app.innerHTML = renderResult();
  else if(state.screen==='superOverIntro') app.innerHTML = renderSuperOverIntro();
  else if(state.screen==='superOverScoring') app.innerHTML = renderSuperOverScoring();
  else if(state.screen==='superOverTiedAgain') app.innerHTML = renderSuperOverTiedAgain();
  else if(state.screen==='leaderboard') app.innerHTML = renderLeaderboard();
  else if(state.screen==='authLoading') app.innerHTML = renderAuthLoading();
  else if(state.screen==='login') app.innerHTML = renderLogin();
  if(state.screen===lastRenderedScreen){
    var screenEl = app.querySelector('.screen');
    if(screenEl) screenEl.style.animation = 'none';
  }
  lastRenderedScreen = state.screen;
  saveMatchState();
}

function saveMatchState(){
  try{
    var toSave = Object.assign({}, state);
    delete toSave.user;
    localStorage.setItem('creaseMatchState', JSON.stringify(toSave));
  }catch(e){ /* storage unavailable or full; state just won't persist */ }
}

var pendingResumeScreen = null;

function loadMatchState(){
  try{
    var saved = localStorage.getItem('creaseMatchState');
    if(!saved) return false;
    var parsed = JSON.parse(saved);
    if(!parsed || !parsed.screen || parsed.screen==='setup' || parsed.screen==='login' || parsed.screen==='authLoading') return false;
    state = parsed;
    state.playerPopup = null;
    state.extraPopup = null;
    state.dismissalPopup = null;
    state.tossOpen = false;
    state.toastMessage = null;
    state.resetConfirmOpen = false;
    state.user = null;
    state.authReady = false;
    state.authError = null;
    state.matchHistoryCache = null;
    pendingResumeScreen = state.screen;
    return true;
  }catch(e){
    return false;
  }
}

function clearSavedMatch(){
  try{ localStorage.removeItem('creaseMatchState'); }catch(e){ /* storage unavailable */ }
}

function topbar(){
  var icon = state.theme==='light' ? '☾' : '☀';
  var html = '<div class="topbar"><div class="brand">THIRD MAN<span> · CRICKET SCORER</span></div><div class="topbar-actions">';
  if(state.screen!=='setup'){
    html += '<div class="theme-toggle" onclick="openResetConfirm()" title="New match">&#8635;</div>';
  }
  html += '<div class="theme-toggle" onclick="toggleTheme()">'+icon+'</div>';
  if(state.user){
    html += '<div class="theme-toggle" onclick="signOutUser()" title="Sign out">&#9211;</div>';
  }
  html += '</div></div>';
  if(state.resetConfirmOpen){
    html += '<div class="toss-overlay"><div class="toss-modal">';
    html += '<h3 style="margin-bottom:6px;">Start a new match?</h3>';
    html += '<p class="muted" style="margin:0 0 16px;">Your current match progress will be cleared.</p>';
    html += '<div class="row">';
    html += '<div class="pick" onclick="confirmResetMatch()">Yes, start new</div>';
    html += '<div class="pick" onclick="closeResetConfirm()">Cancel</div>';
    html += '</div>';
    html += '</div></div>';
  }
  return html;
}

function openResetConfirm(){ state.resetConfirmOpen = true; render(); }
function closeResetConfirm(){ state.resetConfirmOpen = false; render(); }
function confirmResetMatch(){ state.resetConfirmOpen = false; newMatch(); }

function renderSetup(){
  var html = topbar();
  html += '<div class="screen">';
  html += '<h2 style="margin-bottom:18px;">New match setup</h2>';
  html += '<button class="btn btn-secondary btn-small" style="width:100%;margin-bottom:16px;" onclick="openLeaderboard()">View Leaderboard</button>';
  if(state.user && state.user.isAnonymous){
    html += '<div class="card" style="margin-bottom:16px;text-align:center;">';
    html += '<p class="muted" style="margin:0 0 10px;">Playing as guest — sign in to save your stats across devices.</p>';
    html += '<button class="btn btn-secondary btn-small" style="width:100%;" onclick="upgradeToGoogle()">Sign in with Google</button>';
    if(state.authError){
      html += '<p style="color:var(--red);font-size:12px;margin:10px 0 0;">'+escapeHtml(state.authError)+'</p>';
    }
    html += '</div>';
  }

  html += '<label>Team A name</label>';
  html += '<input type="text" value="'+escapeHtml(state.teamA)+'" oninput="state.teamA=this.value" placeholder="Team A name">';
  html += '<label>Team B name</label>';
  html += '<input type="text" value="'+escapeHtml(state.teamB)+'" oninput="state.teamB=this.value" placeholder="Team B name">';

  html += '<label>Overs per innings</label>';
  html += '<div class="presetrow">';
  [5,10,20,50].forEach(function(o){
    html += '<div class="preset '+(state.overs===o?'active':'')+'" onclick="setOvers('+o+')">'+o+'</div>';
  });
  html += '</div>';
  html += '<input type="number" min="1" max="50" value="'+state.overs+'" oninput="state.overs=parseInt(this.value)||1" style="margin-top:-8px;">';

  html += '<label>Wickets per innings</label>';
  html += '<input type="number" min="1" max="10" value="'+state.wicketsLimit+'" oninput="state.wicketsLimit=parseInt(this.value)||10">';

  html += '<label>Powerplay overs</label>';
  html += '<input type="number" min="0" max="'+state.overs+'" value="'+state.powerplayOvers+'" oninput="state.powerplayOvers=parseInt(this.value)||0">';
  html += '<p class="muted" style="margin:-10px 0 16px;">Fielding-restriction overs at the start of each innings. Set to 0 to skip.</p>';

  html += '<label style="margin-top:4px;">Toss</label>';
  html += '<div class="card" style="text-align:center;">';
  if(state.battingFirst===null){
    html += '<p class="muted" style="margin:0 0 12px;">Decide who won the toss.</p>';
    html += '<button class="btn btn-outline" onclick="openTossPopup()">Enter toss result</button>';
  } else {
    var winnerName2 = state.tossWinner==='A' ? state.teamA : state.teamB;
    var battingFirstName = state.battingFirst==='A' ? state.teamA : state.teamB;
    html += '<p class="muted" style="margin:0 0 6px;">'+escapeHtml(winnerName2)+' won the toss and chose to '+state.tossChoice+'.</p>';
    html += '<p style="margin:0;font-weight:600;">'+escapeHtml(battingFirstName)+' will bat first</p>';
  }
  html += '</div>';

  if(state.battingFirst!==null){
    html += '<button class="btn" onclick="startMatch()">Start match</button>';
  }
  html += '</div>';

  if(state.tossOpen){
    html += renderTossPopup();
  }
  return html;
}

function updateWicketsLimit(val){
  var inn = curInnings();
  var n = parseInt(val)||state.wicketsLimit;
  if(n < inn.wickets) n = inn.wickets;
  if(n > 10) n = 10;
  state.wicketsLimit = n;
  checkInningsEnd();
  render();
}

function setOvers(o){ state.overs=o; state.powerplayOvers=Math.min(6,o); render(); }

function openTossPopup(){
  state.tossOpen = true;
  state.tossStep = 'ask';
  state.tossWinner = null;
  state.tossChoice = null;
  render();
}

function renderTossPopup(){
  var html = '<div class="toss-overlay">';
  html += '<div class="toss-modal">';
  if(state.tossStep==='ask'){
    html += '<h3 style="margin-bottom:14px;">Who won the toss?</h3>';
    html += '<div class="row">';
    html += '<div class="pick" onclick="pickTossWinner(\'A\')">'+escapeHtml(state.teamA)+'</div>';
    html += '<div class="pick" onclick="pickTossWinner(\'B\')">'+escapeHtml(state.teamB)+'</div>';
    html += '</div>';
  } else if(state.tossStep==='animating'){
    var name = state.tossWinner==='A' ? state.teamA : state.teamB;
    var teamClass = state.tossWinner==='A' ? 'team-a' : 'team-b';
    html += '<div class="toss-reveal '+teamClass+'">'+escapeHtml(name)+'</div>';
  } else if(state.tossStep==='choose'){
    var winnerName = state.tossWinner==='A' ? state.teamA : state.teamB;
    html += '<h3 style="margin-bottom:6px;">'+escapeHtml(winnerName)+' won the toss</h3>';
    html += '<p class="muted" style="margin:0 0 14px;">What do they choose?</p>';
    html += '<div class="row">';
    html += '<div class="pick" onclick="chooseTossOption(\'bat\')">Bat first</div>';
    html += '<div class="pick" onclick="chooseTossOption(\'bowl\')">Bowl first</div>';
    html += '</div>';
  }
  html += '<button class="btn btn-secondary btn-small" style="margin-top:16px;" onclick="closeTossPopup()">Cancel</button>';
  html += '</div>';
  html += '</div>';
  return html;
}

function closeTossPopup(){
  state.tossOpen = false;
  render();
}

function pickTossWinner(team){
  state.tossWinner = team;
  state.tossStep = 'animating';
  render();
  setTimeout(function(){
    state.tossStep = 'choose';
    render();
  }, 900);
}

function chooseTossOption(opt){
  state.tossChoice = opt;
  if(opt==='bat'){
    state.battingFirst = state.tossWinner;
  } else {
    state.battingFirst = state.tossWinner==='A' ? 'B' : 'A';
  }
  state.tossOpen = false;
  render();
}

function startMatch(){
  var battingName = state.battingFirst==='A' ? state.teamA : state.teamB;
  var bowlingName = state.battingFirst==='A' ? state.teamB : state.teamA;
  state.data[1] = freshInnings(battingName, bowlingName);
  state.inningsNum = 1;
  state.screen = 'scoring';
  openOpenersPopup();
}

function openOpenersPopup(){
  state.playerPopup = {type:'openers'};
  render();
}

function confirmOpeners(){
  var inn = curInnings();
  var s = document.getElementById('popStriker').value.trim();
  var ns = document.getElementById('popNonStriker').value.trim();
  var bw = document.getElementById('popBowler').value.trim();
  if(s===''||ns===''||bw===''){
    state.playerPopupError = 'Please fill in all three names.';
    render();
    return;
  }
  inn.batsmen[0].name = s;
  inn.batsmen[1].name = ns;
  inn.bowlers[0].name = bw;
  inn.startTime = Date.now();
  state.playerPopup = null;
  state.playerPopupError = null;
  render();
}

function curInnings(){ return state.data[state.inningsNum]; }

function snapshot(){
  var inn = curInnings();
  var copy = JSON.parse(JSON.stringify(inn));
  copy.history = [];
  inn.history.push(copy);
  if(inn.history.length>40) inn.history.shift();
}

function undo(){
  var inn = curInnings();
  if(inn.history.length===0) return;
  var prev = inn.history.pop();
  var keepHistory = inn.history;
  state.data[state.inningsNum] = prev;
  state.data[state.inningsNum].history = keepHistory;
  render();
}

function undoLastBallAndResume(){
  var inn = curInnings();
  if(inn.history.length===0) return;
  var prev = inn.history.pop();
  var keepHistory = inn.history;
  prev.history = keepHistory;
  prev.ended = false;
  prev.endTime = null;
  state.data[state.inningsNum] = prev;
  state.screen = 'scoring';
  if(state.inningsNum===1){
    state.target = null;
  } else {
    state.manOfMatch = null;
    state.matchRecorded = false;
  }
  render();
}

function oversStr(balls){
  return Math.floor(balls/6) + '.' + (balls%6);
}

function formatTime12hr(ms){
  if(!ms) return '';
  var d = new Date(ms);
  var h = d.getHours();
  var m = d.getMinutes();
  var ampm = h>=12 ? 'PM' : 'AM';
  h = h%12; if(h===0) h=12;
  var mStr = m<10 ? '0'+m : ''+m;
  return h+':'+mStr+' '+ampm;
}

function formatDuration(startMs, endMs){
  if(!startMs || !endMs) return '';
  var mins = Math.round((endMs-startMs)/60000);
  if(mins<60) return mins+' min';
  var h = Math.floor(mins/60), m = mins%60;
  return h+'h '+m+'m';
}

function formatDateShort(ms){
  if(!ms) return '';
  var d = new Date(ms);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();
}

function rate(runs, balls){
  if(balls===0) return '0.00';
  return (runs/(balls/6)).toFixed(2);
}

function strikeRate(runs, balls){
  if(balls===0) return '0.0';
  return ((runs/balls)*100).toFixed(1);
}

function currentBowler(inn){ return inn.bowlers[inn.bowlerIdx]; }
function striker(inn){ return inn.batsmen[inn.strikerIdx]; }
function nonStriker(inn){ return inn.batsmen[inn.nonStrikerIdx]; }

function addRuns(n){
  snapshot();
  var inn = curInnings();
  var bat = striker(inn);
  inn.runs += n;
  bat.runs += n;
  bat.balls += 1;
  if(n===4) bat.fours += 1;
  if(n===6) bat.sixes += 1;
  inn.legalBalls += 1;
  var bwl = currentBowler(inn);
  bwl.balls += 1;
  bwl.runs += n;
  inn.thisOver.push(String(n));
  if(n%2===1){ swapStrike(inn); }
  var overDone = checkOverEnd(inn);
  afterBall(overDone, false);
}

function openExtraPopup(type){
  state.extraPopup = {type:type};
  render();
}

function closeExtraPopup(){
  state.extraPopup = null;
  render();
}

function confirmExtra(n){
  var type = state.extraPopup.type;
  snapshot();
  var inn = curInnings();
  var bwl = currentBowler(inn);
  var overDone = false;
  if(type==='wd'){
    var total = n+1;
    inn.runs += total;
    bwl.runs += total;
    inn.extras.wd += total;
    inn.thisOver.push(n===0 ? 'wd' : 'wd'+total);
    if(n%2===1){ swapStrike(inn); }
  } else if(type==='nb'){
    var batRuns = n;
    var nbTotal = n+1;
    inn.runs += nbTotal;
    bwl.runs += nbTotal;
    inn.extras.nb += 1;
    var bat = striker(inn);
    bat.balls += 1;
    if(batRuns>0){
      bat.runs += batRuns;
      if(batRuns===4) bat.fours += 1;
      if(batRuns===6) bat.sixes += 1;
    }
    inn.thisOver.push(batRuns>0 ? 'nb'+batRuns : 'nb');
    if(batRuns%2===1){ swapStrike(inn); }
  } else if(type==='b'){
    inn.runs += n;
    inn.extras.b += n;
    inn.legalBalls += 1;
    bwl.balls += 1;
    striker(inn).balls += 1;
    inn.thisOver.push('b'+n);
    if(n%2===1){ swapStrike(inn); }
    overDone = checkOverEnd(inn);
  } else if(type==='lb'){
    inn.runs += n;
    inn.extras.lb += n;
    inn.legalBalls += 1;
    bwl.balls += 1;
    striker(inn).balls += 1;
    inn.thisOver.push('lb'+n);
    if(n%2===1){ swapStrike(inn); }
    overDone = checkOverEnd(inn);
  }
  state.extraPopup = null;
  afterBall(overDone, false);
}

function swapStrike(inn){
  var t = inn.strikerIdx;
  inn.strikerIdx = inn.nonStrikerIdx;
  inn.nonStrikerIdx = t;
}

function checkOverEnd(inn){
  if(inn.legalBalls>0 && inn.legalBalls%6===0){
    if(isMaidenOver(inn.thisOver)){
      currentBowler(inn).maidens += 1;
    }
    inn.overHistory.push(inn.thisOver);
    inn.overBowlers.push(currentBowler(inn).name);
    inn.thisOver = [];
    swapStrike(inn);
    return true;
  }
  return false;
}

function parseBallRuns(b){
  if(b==='W'||b==='db') return 0;
  if(/^\d+$/.test(b)) return parseInt(b,10);
  if(b==='wd') return 1;
  if(/^wd\d+$/.test(b)) return parseInt(b.slice(2),10);
  if(b==='nb') return 1;
  if(/^nb\d+$/.test(b)) return parseInt(b.slice(2),10)+1;
  if(/^lb\d+$/.test(b)) return parseInt(b.slice(2),10);
  if(/^b\d+$/.test(b)) return parseInt(b.slice(1),10);
  return 0;
}

function computeOverTotal(overArr){
  return overArr.reduce(function(sum,b){ return sum + parseBallRuns(b); }, 0);
}

function isMaidenOver(overArr){
  for(var i=0;i<overArr.length;i++){
    var b = overArr[i];
    if(/^wd/.test(b) || /^nb/.test(b)) return false;
    if(/^\d+$/.test(b) && b!=='0') return false;
  }
  return true;
}

function powerplayScore(inn){
  if(!state.powerplayOvers || state.powerplayOvers<=0) return null;
  var ppBalls = state.powerplayOvers*6;
  var runs = 0;
  var cap = Math.min(inn.overHistory.length, state.powerplayOvers);
  for(var i=0;i<cap;i++){ runs += computeOverTotal(inn.overHistory[i]); }
  if(inn.legalBalls < ppBalls){ runs += computeOverTotal(inn.thisOver); }
  var wkts = inn.wicketLog.filter(function(w){ return w.legalBallsAtFall<=ppBalls; }).length;
  var ballsShown = Math.min(inn.legalBalls, ppBalls);
  return {runs:runs, wkts:wkts, oversDisplay:oversStr(ballsShown)};
}

function inPowerplay(inn){
  return state.powerplayOvers>0 && inn.legalBalls < state.powerplayOvers*6;
}

function afterBall(overJustCompleted, wicketNeedsBatsman){
  checkInningsEnd();
  if(state.screen==='scoring' && (wicketNeedsBatsman || overJustCompleted)){
    var inn = curInnings();
    var queue = [];
    if(wicketNeedsBatsman) queue.push({type:'batsman'});
    if(overJustCompleted){
      var lastOver = inn.overHistory[inn.overHistory.length-1];
      queue.push({type:'overSummary', overRuns:computeOverTotal(lastOver), totalScore:inn.runs, totalWkts:inn.wickets});
      queue.push({type:'bowler'});
    }
    state.popupQueue = queue;
    advancePopupQueue();
    return;
  }
  render();
}

function confirmOverSummary(){
  advancePopupQueue();
}

function advancePopupQueue(){
  if(state.popupQueue && state.popupQueue.length){
    state.playerPopup = state.popupQueue.shift();
    state.playerPopupError = null;
  } else {
    state.playerPopup = null;
  }
  render();
}

function openDismissalPopup(){
  state.dismissalPopup = {step:'type', type:null, catchType:null, runsCompleted:null, endThrown:null, whoOutIdx:null};
  state.playerPopupError = null;
  render();
}

function closeDismissalPopup(){
  state.dismissalPopup = null;
  render();
}

function pickDismissalType(type){
  var d = state.dismissalPopup;
  d.type = type;
  state.playerPopupError = null;
  if(type==='bowled' || type==='lbw'){
    finalizeWicket(type, null);
  } else if(type==='stumped'){
    finalizeWicket('stumped', null);
  } else if(type==='caught'){
    d.step = 'catchType';
    render();
  } else if(type==='runout'){
    d.step = 'runoutRuns';
    render();
  }
}

function pickCatchType(kind){
  state.dismissalPopup.catchType = kind;
  state.dismissalPopup.step = 'fielder';
  render();
}

function pickRunoutRuns(n){
  state.dismissalPopup.runsCompleted = n;
  state.dismissalPopup.step = 'runoutEnd';
  render();
}

function pickRunoutEnd(end){
  state.dismissalPopup.endThrown = end;
  state.dismissalPopup.step = 'runoutWho';
  render();
}

function pickRunoutWho(idx){
  state.dismissalPopup.whoOutIdx = idx;
  state.dismissalPopup.step = 'fielder';
  render();
}

function confirmDismissalFielder(){
  var type = state.dismissalPopup.type;
  var input = document.getElementById('popFielder');
  var val = input ? input.value.trim() : '';
  if(type==='caught' && val===''){
    state.playerPopupError = "Please enter the fielder's name.";
    render();
    return;
  }
  finalizeWicket(type, val || null);
}

function howOutText(type, bowlerName, fielderName, d){
  if(type==='bowled') return 'b '+bowlerName;
  if(type==='lbw') return 'lbw b '+bowlerName;
  if(type==='caught'){
    var tag = (d && d.catchType==='extraordinary') ? ' (stunning catch!)' : '';
    return 'c '+fielderName+' b '+bowlerName+tag;
  }
  if(type==='stumped') return 'st wk b '+bowlerName;
  if(type==='runout'){
    var endLabel = (d && d.endThrown==='striker') ? "striker's end" : "non-striker's end";
    var runsLabel = (d && d.runsCompleted!=null) ? (d.runsCompleted+' run'+(d.runsCompleted===1?'':'s')+', ') : '';
    var fielderLabel = fielderName ? ('/'+fielderName) : '';
    return 'run out ('+runsLabel+endLabel+fielderLabel+')';
  }
  return 'out';
}

function finalizeWicket(type, fielderName){
  snapshot();
  var inn = curInnings();
  var d = state.dismissalPopup;
  var bwl = currentBowler(inn);

  var strikerBat = striker(inn);
  strikerBat.balls += 1;
  if(type==='runout' && d && d.runsCompleted){
    inn.runs += d.runsCompleted;
    strikerBat.runs += d.runsCompleted;
  }

  var outIdx = inn.strikerIdx;
  if(type==='runout' && d && d.whoOutIdx!=null){
    outIdx = d.whoOutIdx;
  }
  var bat = inn.batsmen[outIdx];
  var partnerIdx = (outIdx===inn.strikerIdx) ? inn.nonStrikerIdx : inn.strikerIdx;
  var partner = inn.batsmen[partnerIdx];

  bat.out = true;
  bat.howOut = howOutText(type, bwl.name, fielderName, d);
  inn.wickets += 1;
  inn.legalBalls += 1;
  bwl.balls += 1;
  if(type!=='runout'){
    bwl.wickets += 1;
  }
  inn.thisOver.push('W');
  inn.wicketLog.push({
    num: inn.wickets,
    batsman: bat.name,
    partner: partner.name,
    score: inn.runs,
    overs: oversStr(inn.legalBalls),
    legalBallsAtFall: inn.legalBalls,
    partnershipRuns: inn.runs - inn.partnershipStartRuns,
    partnershipBalls: inn.legalBalls - inn.partnershipStartBalls
  });
  inn.partnershipStartRuns = inn.runs;
  inn.partnershipStartBalls = inn.legalBalls;
  var stillBatting = inn.wickets < state.wicketsLimit;
  var oversLeft = inn.legalBalls < state.overs*6;
  var needsBatsman = stillBatting && oversLeft;
  var overDone = checkOverEnd(inn);
  state.dismissalPopup = null;
  afterBall(overDone, needsBatsman);
}

function confirmBatsmanPopup(){
  var inn = curInnings();
  var input = document.getElementById('popBatsman');
  var val = input ? input.value.trim() : '';
  if(val===''){
    state.playerPopupError = 'Please enter the new batsman\'s name.';
    render();
    return;
  }
  var newBat = {name:val, runs:0, balls:0, fours:0, sixes:0, out:false, howOut:''};
  inn.nextBatNum += 1;
  inn.batsmen.push(newBat);
  var newIdx = inn.batsmen.length-1;
  if(inn.batsmen[inn.strikerIdx].out){
    inn.strikerIdx = newIdx;
  } else if(inn.batsmen[inn.nonStrikerIdx].out){
    inn.nonStrikerIdx = newIdx;
  } else {
    inn.strikerIdx = newIdx;
  }
  advancePopupQueue();
}

function findOrCreateBowler(inn, name){
  var lower = name.trim().toLowerCase();
  for(var i=0;i<inn.bowlers.length;i++){
    if(inn.bowlers[i].name.trim().toLowerCase()===lower) return i;
  }
  inn.bowlers.push({name:name.trim(), balls:0, runs:0, wickets:0, maidens:0});
  return inn.bowlers.length-1;
}

function setNextBowler(rawName){
  var inn = curInnings();
  var name = (rawName||'').trim();
  var prevName = currentBowler(inn).name.trim().toLowerCase();
  if(name===''){
    state.playerPopupError = 'Please enter or pick a bowler.';
    render();
    return;
  }
  if(name.toLowerCase()===prevName){
    state.playerPopupError = "A bowler can't bowl two overs in a row. Pick a different bowler.";
    render();
    return;
  }
  inn.bowlerIdx = findOrCreateBowler(inn, name);
  advancePopupQueue();
}

function confirmBowlerPopup(){
  var input = document.getElementById('popBowlerNext');
  setNextBowler(input ? input.value : '');
}

function selectBowlerChip(name){
  setNextBowler(name);
}

function priorBowlerNames(inn){
  var prevLower = currentBowler(inn).name.trim().toLowerCase();
  var seen = {};
  var out = [];
  inn.bowlers.forEach(function(b){
    var lower = b.name.trim().toLowerCase();
    if(lower===prevLower || seen[lower]) return;
    seen[lower] = true;
    out.push(b.name);
  });
  return out;
}

function checkInningsEnd(){
  var inn = curInnings();
  var oversDone = inn.legalBalls >= state.overs*6;
  var allOut = inn.wickets >= state.wicketsLimit;
  var targetChased = state.inningsNum===2 && state.target!==null && inn.runs >= state.target;
  if(oversDone || allOut || targetChased){
    inn.ended = true;
    inn.endTime = Date.now();
    if(state.inningsNum===1){
      state.target = inn.runs + 1;
      state.screen = 'break';
    } else if(inn.runs === state.target-1){
      state.screen = 'superOverIntro';
    } else {
      state.screen = 'result';
      state.manOfMatch = computeAutoMOTM();
    }
  }
}

function endInningsEarly(){
  snapshot();
  var inn = curInnings();
  inn.ended = true;
  inn.endTime = Date.now();
  if(state.inningsNum===1){
    state.target = inn.runs + 1;
    state.screen = 'break';
  } else if(inn.runs === state.target-1){
    state.screen = 'superOverIntro';
  } else {
    state.screen = 'result';
    state.manOfMatch = computeAutoMOTM();
  }
  render();
}

function startSecondInnings(){
  var prevInn = state.data[1];
  var battingName = prevInn.bowlingName;
  var bowlingName = prevInn.battingName;
  state.data[2] = freshInnings(battingName, bowlingName);
  state.inningsNum = 2;
  state.screen = 'scoring';
  openOpenersPopup();
}

function newMatch(){
  var keepTheme = state.theme;
  var keepUser = state.user;
  var keepAuthReady = state.authReady;
  var keepHistoryCache = state.matchHistoryCache;
  clearSavedMatch();
  state = freshMatch();
  state.theme = keepTheme;
  state.user = keepUser;
  state.authReady = keepAuthReady;
  state.matchHistoryCache = keepHistoryCache;
  render();
}

function toggleOverHistory(){
  state.showOverHistory = !state.showOverHistory;
  render();
}

function toggleTheme(){
  state.theme = state.theme==='dark' ? 'light' : 'dark';
  render();
}

function signInWithGoogle(){
  state.authError = null;
  try{
    var provider = new window.__fb.GoogleAuthProvider();
    window.__fb.signInWithPopup(window.__fb.auth, provider).catch(function(err){
      state.authError = err.message || 'Sign-in failed. Please try again.';
      render();
    });
  }catch(e){
    state.authError = 'Could not start sign-in: '+e.message;
    render();
  }
}

function continueAsGuest(){
  state.authError = null;
  window.__fb.signInAnonymously(window.__fb.auth).catch(function(err){
    state.authError = err.message || 'Could not continue as guest. Please try again.';
    render();
  });
}

function signOutUser(){
  window.__fb.signOut(window.__fb.auth);
}

function upgradeToGoogle(){
  if(!state.user || !state.user.isAnonymous) return;
  state.authError = null;
  var provider = new window.__fb.GoogleAuthProvider();
  window.__fb.linkWithPopup(state.user, provider).then(function(result){
    state.user = result.user;
    render();
  }).catch(function(err){
    if(err && err.code==='auth/credential-already-in-use'){
      var cred = window.__fb.GoogleAuthProvider.credentialFromError(err);
      if(cred){
        window.__fb.signInWithCredential(window.__fb.auth, cred).catch(function(err2){
          state.authError = err2.message || 'Could not sign in with Google.';
          render();
        });
        return;
      }
    }
    state.authError = err.message || 'Could not link Google account.';
    render();
  });
}

function renderAuthLoading(){
  var html = '<div class="screen splash">';
  html += '<div class="splash-field">';
  html += '<div class="splash-crease"></div>';
  html += '<div class="splash-stumps"><span></span><span></span><span></span><i></i></div>';
  html += '<div class="splash-ball"></div>';
  html += '<div class="splash-impact"></div>';
  html += '<div class="splash-spark"></div><div class="splash-spark"></div><div class="splash-spark"></div><div class="splash-spark"></div>';
  html += '<div class="splash-bat"></div>';
  html += '</div>';
  html += '<div class="splash-title">';
  html += '<div class="splash-wordmark">Third Man</div>';
  html += '<div class="splash-tagline">Cricket Scorer</div>';
  html += '</div>';
  html += '<div class="splash-dots"><span></span><span></span><span></span></div>';
  html += '</div>';
  return html;
}

function renderLogin(){
  var html = '<div class="screen" style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:20px;">';
  html += '<div style="font-family:\'Times New Roman\', Times, serif;font-weight:600;letter-spacing:0.06em;font-size:26px;color:var(--amber);text-transform:uppercase;margin-bottom:2px;">Third Man</div>';
  html += '<div class="muted" style="margin-bottom:36px;">Cricket Scorer</div>';
  html += '<button class="btn" style="max-width:280px;width:100%;" onclick="signInWithGoogle()">Sign in with Google</button>';
  html += '<button class="btn btn-secondary" style="max-width:280px;width:100%;margin-top:10px;" onclick="continueAsGuest()">Continue as Guest</button>';
  if(state.authError){
    html += '<p style="color:var(--red);font-size:12px;margin-top:16px;max-width:280px;">'+escapeHtml(state.authError)+'</p>';
  }
  html += '</div>';
  return html;
}

function ballClass(b){
  if(b==='4') return 'ball four';
  if(b==='6') return 'ball six';
  if(b==='W') return 'ball wkt';
  if(/^(wd|nb|b|lb|db)/.test(b)) return 'ball extra';
  return 'ball';
}

function renderScoring(){
  var inn = curInnings();
  var html = topbar();
  html += '<div class="screen">';

  var lastBall = inn.thisOver.length ? inn.thisOver[inn.thisOver.length-1] : null;
  var flashClass = lastBall==='6' ? ' flash-six' : lastBall==='4' ? ' flash-four' : lastBall==='W' ? ' flash-wicket' : '';
  html += '<div class="scoreboard'+flashClass+'">';
  html += '<div class="sb-team">'+escapeHtml(inn.battingName)+' batting</div>';
  html += '<div class="sb-score">'+inn.runs+'<small>/'+inn.wickets+'</small></div>';
  html += '<div class="sb-meta"><span>OV '+oversStr(inn.legalBalls)+' / '+state.overs+'</span><span>CRR '+rate(inn.runs, inn.legalBalls)+'</span></div>';
  html += '<div class="sb-meta" style="margin-top:6px;"><span>Wickets limit&nbsp;<input type="number" min="'+inn.wickets+'" max="10" value="'+state.wicketsLimit+'" onchange="updateWicketsLimit(this.value)" style="width:40px;background:var(--panel-2);border:1px solid var(--line);color:var(--floodlight);border-radius:4px;padding:2px 4px;font-family:inherit;font-size:12px;text-align:center;"></span></div>';
  if(state.inningsNum===2 && state.target!==null){
    var ballsLeft = state.overs*6 - inn.legalBalls;
    var runsNeeded = state.target - inn.runs;
    var rrr = ballsLeft>0 ? (runsNeeded/(ballsLeft/6)).toFixed(2) : '0.00';
    html += '<div class="sb-target">Need <b>'+Math.max(runsNeeded,0)+'</b> off <b>'+Math.max(ballsLeft,0)+'</b> balls &middot; target <b>'+state.target+'</b></div>';
    html += '<div class="sb-meta" style="margin-top:4px;"><span>Required RR '+rrr+'</span><span>Current RR '+rate(inn.runs, inn.legalBalls)+'</span></div>';
  }
  if(inPowerplay(inn)){
    var ballsLeftInPP = state.powerplayOvers*6 - inn.legalBalls;
    html += '<div class="pp-banner">POWERPLAY &middot; '+oversStr(ballsLeftInPP)+' overs left</div>';
  }
  html += '<div class="ticker">';
  if(inn.thisOver.length===0){
    html += '<span style="font-size:11px;color:var(--stat-dark-muted);">New over — '+escapeHtml(currentBowler(inn).name)+' to bowl</span>';
  }
  inn.thisOver.forEach(function(b,i){
    var newCls = (i===inn.thisOver.length-1) ? ' ball-new' : '';
    html += '<div class="'+ballClass(b)+newCls+'">'+b+'</div>';
  });
  html += '</div>';
  html += '</div>';

  var pRuns = inn.runs - inn.partnershipStartRuns;
  var pBalls = inn.legalBalls - inn.partnershipStartBalls;
  html += '<div class="partnership-line">Partnership: <b>'+pRuns+'</b> ('+pBalls+') between '+escapeHtml(striker(inn).name)+' &amp; '+escapeHtml(nonStriker(inn).name)+'</div>';

  if(inn.overHistory.length>0){
    html += '<div class="oh-toggle" onclick="toggleOverHistory()">'+(state.showOverHistory?'▾':'▸')+' Full over history</div>';
    if(state.showOverHistory){
      html += '<div class="card">';
      inn.overHistory.forEach(function(ov, i){
        html += '<div class="result-line"><span>Ov '+(i+1)+' &middot; '+escapeHtml(inn.overBowlers[i])+'</span><span>'+ov.join(' ')+'  = '+computeOverTotal(ov)+'</span></div>';
      });
      html += '</div>';
    }
  }

  html += '<div class="batting-card">';
  inn.batsmen.forEach(function(b, i){
    if(b.out) return;
    var isStriker = i===inn.strikerIdx;
    html += '<div class="bat-row '+(isStriker?'striker':'')+'">';
    html += '<input type="text" value="'+escapeHtml(b.name)+'" onchange="renameBatsman('+i+',this.value)">';
    if(isStriker) html += '<span class="sr-strike">*</span>';
    html += '<span class="bat-figs">'+b.runs+' ('+b.balls+') &middot; SR '+strikeRate(b.runs,b.balls)+'</span>';
    html += '</div>';
  });
  html += '<div class="bowler-line"><span>Bowling: <input type="text" value="'+escapeHtml(currentBowler(inn).name)+'" onchange="renameBowler(this.value)"></span><span>'+oversStr(currentBowler(inn).balls)+' - '+currentBowler(inn).runs+' - '+currentBowler(inn).wickets+'</span></div>';
  html += '</div>';

  html += '<div class="section-label">Runs off this ball</div>';
  html += '<div class="grid6">';
  [0,1,2].forEach(function(n){ html += '<div class="runbtn" onclick="addRuns('+n+')">'+n+'</div>'; });
  html += '</div>';
  html += '<div class="grid6">';
  [3,4,6].forEach(function(n){ html += '<div class="runbtn '+(n===4?'four':n===6?'six':'')+'" onclick="addRuns('+n+')">'+n+'</div>'; });
  html += '</div>';

  html += '<div class="section-label">Extras</div>';
  html += '<div class="extras-row">';
  html += '<div class="extrabtn" onclick="openExtraPopup(\'wd\')">Wide</div>';
  html += '<div class="extrabtn" onclick="openExtraPopup(\'nb\')">No ball</div>';
  html += '<div class="extrabtn" onclick="openExtraPopup(\'b\')">Bye</div>';
  html += '<div class="extrabtn" onclick="openExtraPopup(\'lb\')">Leg bye</div>';
  html += '</div>';

  html += '<div class="wktbtn" onclick="openDismissalPopup()">Wicket</div>';

  html += '<div class="util-row">';
  html += '<button class="btn btn-secondary btn-small" onclick="undo()">Undo</button>';
  html += '<button class="btn btn-outline btn-small" onclick="endInningsEarly()">End innings</button>';
  html += '</div>';

  html += '</div>';

  if(state.playerPopup) html += renderPlayerPopup();
  if(state.extraPopup) html += renderExtraPopup();
  if(state.dismissalPopup) html += renderDismissalPopup();

  return html;
}

function renameBatsman(i, val){
  var inn = curInnings();
  inn.batsmen[i].name = val;
}
function renameBowler(val){
  var inn = curInnings();
  currentBowler(inn).name = val;
}

function renderPlayerPopup(){
  var inn = curInnings();
  var p = state.playerPopup;
  var html = '<div class="toss-overlay"><div class="toss-modal">';
  if(p.type==='openers'){
    html += '<h3 style="margin-bottom:14px;">Opening line-up</h3>';
    html += '<label style="text-align:left;">Striker</label>';
    html += '<input type="text" id="popStriker" value="'+escapeHtml(inn.batsmen[0].name)+'" placeholder="Striker name">';
    html += '<label style="text-align:left;">Non-striker</label>';
    html += '<input type="text" id="popNonStriker" value="'+escapeHtml(inn.batsmen[1].name)+'" placeholder="Non-striker name">';
    html += '<label style="text-align:left;">Opening bowler</label>';
    html += '<input type="text" id="popBowler" value="'+escapeHtml(inn.bowlers[0].name)+'" placeholder="Bowler name">';
    html += errorLine();
    html += '<button class="btn" onclick="confirmOpeners()">Start innings</button>';
  } else if(p.type==='batsman'){
    html += '<h3 style="margin-bottom:6px;">Wicket!</h3>';
    html += '<p class="muted" style="margin:0 0 14px;">Who is coming in to bat?</p>';
    html += '<label style="text-align:left;">New batsman</label>';
    html += '<input type="text" id="popBatsman" value="Batsman '+inn.nextBatNum+'" placeholder="Batsman name">';
    html += errorLine();
    html += '<button class="btn" onclick="confirmBatsmanPopup()">Confirm</button>';
  } else if(p.type==='overSummary'){
    html += '<h3 style="margin-bottom:6px;">Over complete</h3>';
    html += '<div class="winner" style="margin:10px 0;font-size:32px;">'+p.overRuns+'<span style="font-size:14px;color:var(--chalk);display:block;margin-top:2px;">run'+(p.overRuns===1?'':'s')+' this over</span></div>';
    html += '<p class="muted" style="margin:0 0 16px;">Total score: <b style="color:var(--floodlight);">'+p.totalScore+'/'+p.totalWkts+'</b></p>';
    html += '<button class="btn" onclick="confirmOverSummary()">Continue</button>';
  } else if(p.type==='bowler'){
    html += '<h3 style="margin-bottom:6px;">Next over</h3>';
    html += '<p class="muted" style="margin:0 0 14px;">Who is bowling the next over?</p>';
    var priors = priorBowlerNames(inn);
    if(priors.length){
      html += '<label style="text-align:left;">Previous bowlers</label>';
      html += '<div class="chip-row">';
      priors.forEach(function(name){
        html += '<div class="chip" onclick="selectBowlerChip(\''+name.replace(/'/g,"\\'")+'\')">'+escapeHtml(name)+'</div>';
      });
      html += '</div>';
      html += '<label style="text-align:left;margin-top:10px;">Or a new bowler</label>';
    } else {
      html += '<label style="text-align:left;">Next bowler</label>';
    }
    html += '<input type="text" id="popBowlerNext" value="" placeholder="Bowler name">';
    html += errorLine();
    html += '<button class="btn" onclick="confirmBowlerPopup()">Confirm</button>';
  }
  html += '</div></div>';
  return html;
}

function errorLine(){
  if(!state.playerPopupError) return '';
  return '<p style="color:var(--red);font-size:12px;margin:-8px 0 12px;text-align:left;">'+escapeHtml(state.playerPopupError)+'</p>';
}

function renderExtraPopup(){
  var type = state.extraPopup.type;
  var labels = {wd:'Wide', nb:'No ball', b:'Bye', lb:'Leg bye'};
  var subtitles = {
    wd:'Extra runs beyond the automatic 1 (0 = just the wide)',
    nb:'Extra runs beyond the automatic 1 (0 = just the no ball)',
    b:'Runs taken as byes',
    lb:'Runs taken as leg byes'
  };
  var start = 0;
  var html = '<div class="toss-overlay"><div class="toss-modal">';
  html += '<h3 style="margin-bottom:4px;">'+labels[type]+'</h3>';
  html += '<p class="muted" style="margin:0 0 14px;">'+subtitles[type]+'</p>';
  html += '<div class="numpad">';
  for(var i=start;i<=10;i++){
    html += '<div class="numbtn" onclick="confirmExtra('+i+')">'+i+'</div>';
  }
  html += '</div>';
  html += '<button class="btn btn-secondary btn-small" style="margin-top:14px;" onclick="closeExtraPopup()">Cancel</button>';
  html += '</div></div>';
  return html;
}

function renderDismissalPopup(){
  var inn = curInnings();
  var d = state.dismissalPopup;
  var html = '<div class="toss-overlay"><div class="toss-modal">';
  if(d.step==='type'){
    html += '<h3 style="margin-bottom:6px;">Wicket!</h3>';
    html += '<p class="muted" style="margin:0 0 14px;">How was '+escapeHtml(striker(inn).name)+' out?</p>';
    html += '<div class="chip-row" style="justify-content:center;">';
    [['bowled','Bowled'],['caught','Caught'],['lbw','LBW'],['stumped','Stumped'],['runout','Run Out']].forEach(function(pair){
      html += '<div class="chip" onclick="pickDismissalType(\''+pair[0]+'\')">'+pair[1]+'</div>';
    });
    html += '</div>';
  } else if(d.step==='catchType'){
    html += '<h3 style="margin-bottom:14px;">What kind of catch?</h3>';
    html += '<div class="row">';
    html += '<div class="pick" onclick="pickCatchType(\'normal\')">Normal catch</div>';
    html += '<div class="pick" onclick="pickCatchType(\'extraordinary\')">Extraordinary catch</div>';
    html += '</div>';
  } else if(d.step==='runoutRuns'){
    html += '<h3 style="margin-bottom:4px;">Run Out</h3>';
    html += '<p class="muted" style="margin:0 0 14px;">How many runs were completed?</p>';
    html += '<div class="numpad">';
    for(var i=0;i<=10;i++){
      html += '<div class="numbtn" onclick="pickRunoutRuns('+i+')">'+i+'</div>';
    }
    html += '</div>';
  } else if(d.step==='runoutEnd'){
    html += '<h3 style="margin-bottom:14px;">Which end was the throw?</h3>';
    html += '<div class="row">';
    html += '<div class="pick" onclick="pickRunoutEnd(\'striker\')">Striker\'s end</div>';
    html += '<div class="pick" onclick="pickRunoutEnd(\'nonstriker\')">Non-striker\'s end</div>';
    html += '</div>';
  } else if(d.step==='runoutWho'){
    html += '<h3 style="margin-bottom:14px;">Who was run out?</h3>';
    html += '<div class="row">';
    html += '<div class="pick" onclick="pickRunoutWho('+inn.strikerIdx+')">'+escapeHtml(striker(inn).name)+'</div>';
    html += '<div class="pick" onclick="pickRunoutWho('+inn.nonStrikerIdx+')">'+escapeHtml(nonStriker(inn).name)+'</div>';
    html += '</div>';
  } else if(d.step==='fielder'){
    var labelMap = {caught:'Who caught it?', runout:'Who fielded/threw it? (optional)'};
    html += '<h3 style="margin-bottom:14px;">'+labelMap[d.type]+'</h3>';
    html += '<input type="text" id="popFielder" placeholder="Fielder name">';
    html += errorLine();
    html += '<button class="btn" onclick="confirmDismissalFielder()">Confirm</button>';
  }
  html += '<button class="btn btn-secondary btn-small" style="margin-top:8px;" onclick="closeDismissalPopup()">Cancel</button>';
  html += '</div></div>';
  return html;
}



function renderBreak(){
  var inn = state.data[1];
  var html = topbar();
  html += '<div class="screen">';
  html += '<h2>Innings break</h2>';
  html += scorecardBlock(inn);
  html += '<p class="muted">'+escapeHtml(inn.bowlingName)+' need <b style="color:var(--floodlight)">'+state.target+'</b> runs to win from '+state.overs+' overs.</p>';
  html += '<button class="btn" onclick="startSecondInnings()">Start 2nd innings</button>';
  if(inn.history.length>0){
    html += '<button class="btn btn-secondary btn-small" style="margin-top:8px;width:100%;" onclick="undoLastBallAndResume()">Undo last ball (fix a mistake)</button>';
  }
  html += '</div>';
  return html;
}

function extrasTotal(inn){
  return inn.extras.wd + inn.extras.nb + inn.extras.b + inn.extras.lb;
}

function scorecardBlock(inn, inningsNum){
  var html = '<div class="card">';
  html += '<h3 style="margin-bottom:4px;">'+escapeHtml(inn.battingName)+' — '+inn.runs+'/'+inn.wickets+' ('+oversStr(inn.legalBalls)+' ov)</h3>';
  if(inn.startTime){
    html += '<div class="muted" style="font-size:11px;margin:0 0 8px;">Started '+formatTime12hr(inn.startTime);
    if(inn.endTime) html += ' &middot; finished '+formatTime12hr(inn.endTime)+' &middot; took '+formatDuration(inn.startTime, inn.endTime);
    html += '</div>';
  }
  var pp = powerplayScore(inn);
  if(pp){
    html += '<div class="result-line"><span>Powerplay ('+state.powerplayOvers+' ov)</span><span>'+pp.runs+'/'+pp.wkts+' ('+pp.oversDisplay+')</span></div>';
  }
  inn.batsmen.forEach(function(b){
    html += '<div class="result-line"><span>'+escapeHtml(b.name)+(b.out?'':' *')+'</span><span>'+b.runs+' ('+b.balls+') &middot; SR '+strikeRate(b.runs,b.balls)+'</span></div>';
  });
  html += '<div class="result-line"><span>Extras</span><span>'+extrasTotal(inn)+' (wd '+inn.extras.wd+', nb '+inn.extras.nb+', b '+inn.extras.b+', lb '+inn.extras.lb+')</span></div>';
  html += '<div class="divider"></div>';
  inn.bowlers.forEach(function(bw){
    html += '<div class="result-line"><span>'+escapeHtml(bw.name)+'</span><span>'+oversStr(bw.balls)+'-'+bw.runs+'-'+bw.wickets+'</span></div>';
  });
  if(inn.wicketLog.length>0){
    html += '<div class="divider"></div>';
    html += '<div class="section-label" style="margin:0 0 6px;">Fall of wickets</div>';
    inn.wicketLog.forEach(function(w){
      html += '<div class="result-line"><span>'+w.num+'-'+w.score+'</span><span>'+escapeHtml(w.batsman)+' ('+w.overs+' ov)</span></div>';
    });
    html += '<div class="section-label" style="margin:10px 0 6px;">Partnerships</div>';
    inn.wicketLog.forEach(function(w){
      html += '<div class="result-line"><span>'+escapeHtml(w.partner)+' &amp; '+escapeHtml(w.batsman)+'</span><span>'+w.partnershipRuns+' ('+w.partnershipBalls+')</span></div>';
    });
    var strikerObj = inn.batsmen[inn.strikerIdx];
    var nonStrikerObj = inn.batsmen[inn.nonStrikerIdx];
    if(strikerObj && !strikerObj.out && nonStrikerObj && !nonStrikerObj.out){
      var lastRuns = inn.runs - inn.partnershipStartRuns;
      var lastBalls = inn.legalBalls - inn.partnershipStartBalls;
      html += '<div class="result-line"><span>'+escapeHtml(nonStrikerObj.name)+' &amp; '+escapeHtml(strikerObj.name)+' (unbeaten)</span><span>'+lastRuns+' ('+lastBalls+')</span></div>';
    }
  }
  if(inningsNum){
    html += '<div class="util-row" style="margin-top:12px;">';
    html += '<button class="btn btn-secondary btn-small" onclick="exportInningsPDF('+inningsNum+')">Download PDF</button>';
    html += '<button class="btn btn-secondary btn-small" onclick="shareInnings('+inningsNum+')">Share</button>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function matchResultText(){
  var inn1 = state.data[1], inn2 = state.data[2];
  if(state.superOver && state.superOver.winner){
    return 'Match tied — '+state.superOver.winner+' won the Super Over';
  }
  if(state.superOverTiedFinal){
    return 'Match tied — Super Over also finished level';
  }
  if(inn2.runs >= state.target){
    var wl = state.wicketsLimit - inn2.wickets;
    return inn2.battingName+' won by '+wl+' wicket'+(wl===1?'':'s');
  } else if(inn2.runs === state.target-1){
    return 'Match tied';
  } else {
    var rm = (state.target-1) - inn2.runs;
    return inn1.battingName+' won by '+rm+' run'+(rm===1?'':'s');
  }
}

function startSuperOver(){
  var inn1 = state.data[1], inn2 = state.data[2];
  var round = (state.superOver && state.superOver.round) ? state.superOver.round+1 : 1;
  var battingFirstTeam = inn2.battingName;
  var bowlingFirstTeam = inn1.battingName;
  state.superOver = {
    active:true,
    round:round,
    battingFirstTeam:battingFirstTeam,
    bowlingFirstTeam:bowlingFirstTeam,
    inningsNum:1,
    target:null,
    winner:null,
    data:{
      1:{battingName:battingFirstTeam, bowlingName:bowlingFirstTeam, runs:0, wickets:0, balls:0, log:[],
         extras:{wd:0,nb:0,b:0,lb:0}, strikerName:'', nonStrikerName:'', bowlerName:'', namesConfirmed:false, history:[]},
      2:null
    }
  };
  state.screen = 'superOverScoring';
  state.soNamesPopup = true;
  render();
}

function acceptTieAsResult(){
  if(state.superOver && !state.superOver.winner){
    state.superOverTiedFinal = true;
  }
  state.screen = 'result';
  state.manOfMatch = computeAutoMOTM();
  render();
}

function curSOInnings(){
  return state.superOver.data[state.superOver.inningsNum];
}

function confirmSONames(){
  var inn = curSOInnings();
  var s = document.getElementById('soStriker').value.trim();
  var ns = document.getElementById('soNonStriker').value.trim();
  var bw = document.getElementById('soBowler').value.trim();
  if(s===''||ns===''||bw===''){
    state.playerPopupError = 'Please fill in all three names.';
    render();
    return;
  }
  inn.strikerName = s;
  inn.nonStrikerName = ns;
  inn.bowlerName = bw;
  inn.namesConfirmed = true;
  state.soNamesPopup = false;
  state.playerPopupError = null;
  render();
}

function soSnapshot(){
  var inn = curSOInnings();
  var copy = JSON.parse(JSON.stringify(inn));
  copy.history = [];
  inn.history.push(copy);
}

function superOverUndo(){
  var inn = curSOInnings();
  if(inn.history.length===0) return;
  var prev = inn.history.pop();
  var keep = inn.history;
  prev.history = keep;
  state.superOver.data[state.superOver.inningsNum] = prev;
  render();
}

function soCheckEnd(){
  var inn = curSOInnings();
  var so = state.superOver;
  var done = inn.balls>=6 || inn.wickets>=2 || (so.inningsNum===2 && so.target!==null && inn.runs>=so.target);
  if(!done) return;
  if(so.inningsNum===1){
    so.target = inn.runs + 1;
    so.inningsNum = 2;
    so.data[2] = {battingName: so.bowlingFirstTeam, bowlingName: so.battingFirstTeam, runs:0, wickets:0, balls:0, log:[],
                  extras:{wd:0,nb:0,b:0,lb:0}, strikerName:'', nonStrikerName:'', bowlerName:'', namesConfirmed:false, history:[]};
    state.soNamesPopup = true;
  } else {
    var s1 = so.data[1].runs, s2 = so.data[2].runs;
    if(s2>s1){
      so.winner = so.data[2].battingName;
    } else if(s1>s2){
      so.winner = so.data[1].battingName;
    } else {
      state.screen = 'superOverTiedAgain';
      return;
    }
    state.screen = 'result';
    state.manOfMatch = computeAutoMOTM();
  }
}

function superOverAddRuns(n){
  soSnapshot();
  var inn = curSOInnings();
  inn.runs += n;
  inn.balls += 1;
  inn.log.push(String(n));
  soCheckEnd();
  render();
}

function superOverWicket(){
  soSnapshot();
  var inn = curSOInnings();
  inn.wickets += 1;
  inn.balls += 1;
  inn.log.push('W');
  soCheckEnd();
  render();
}

function openSOExtraPopup(type){
  state.soExtraPopup = {type:type};
  render();
}

function closeSOExtraPopup(){
  state.soExtraPopup = null;
  render();
}

function confirmSOExtra(n){
  var type = state.soExtraPopup.type;
  soSnapshot();
  var inn = curSOInnings();
  if(type==='wd'){
    var total = n+1;
    inn.runs += total;
    inn.extras.wd += total;
    inn.log.push(n===0 ? 'wd' : 'wd'+total);
  } else if(type==='nb'){
    var nbTotal = n+1;
    inn.runs += nbTotal;
    inn.extras.nb += 1;
    inn.log.push(n>0 ? 'nb'+n : 'nb');
  } else if(type==='b'){
    inn.runs += n;
    inn.extras.b += n;
    inn.balls += 1;
    inn.log.push('b'+n);
  } else if(type==='lb'){
    inn.runs += n;
    inn.extras.lb += n;
    inn.balls += 1;
    inn.log.push('lb'+n);
  }
  state.soExtraPopup = null;
  soCheckEnd();
  render();
}

function soExtrasTotal(inn){
  return inn.extras.wd + inn.extras.nb + inn.extras.b + inn.extras.lb;
}

function renderSuperOverIntro(){
  var html = topbar();
  html += '<div class="screen">';
  html += '<h2 style="margin-bottom:10px;">Scores level!</h2>';
  html += '<div class="card" style="text-align:center;">';
  html += '<p class="muted" style="margin:0 0 10px;">Both teams finished on <b style="color:var(--floodlight);">'+(state.target-1)+'</b> runs.</p>';
  html += '<div class="winner" style="margin:6px 0;">Match Tied</div>';
  html += '<p class="muted" style="margin:10px 0 0;">Play a Super Over to decide a winner, or leave it as a tie.</p>';
  html += '</div>';
  html += '<button class="btn" onclick="startSuperOver()">Start Super Over</button>';
  html += '<button class="btn btn-secondary btn-small" style="margin-top:8px;width:100%;" onclick="acceptTieAsResult()">Accept the tie</button>';
  html += '</div>';
  return html;
}

function renderSuperOverTiedAgain(){
  var so = state.superOver;
  var html = topbar();
  html += '<div class="screen">';
  html += '<h2 style="margin-bottom:10px;">Super Over tied too!</h2>';
  html += '<div class="card" style="text-align:center;">';
  html += '<p class="muted" style="margin:0 0 10px;">Both teams scored <b style="color:var(--floodlight);">'+so.data[1].runs+'</b> in the Super Over.</p>';
  html += '<p class="muted" style="margin:0;">Play another Super Over, or leave it as a tie.</p>';
  html += '</div>';
  html += '<button class="btn" onclick="startSuperOver()">Play another Super Over</button>';
  html += '<button class="btn btn-secondary btn-small" style="margin-top:8px;width:100%;" onclick="acceptTieAsResult()">Accept the tie</button>';
  html += '</div>';
  return html;
}

function renderSuperOverScoring(){
  var so = state.superOver;
  var inn = curSOInnings();
  var html = topbar();
  html += '<div class="screen">';
  html += '<h2 style="margin-bottom:4px;">Super Over'+(so.round>1?' ('+so.round+')':'')+'</h2>';
  html += '<div class="scoreboard">';
  html += '<div class="sb-team">'+escapeHtml(inn.battingName)+' batting</div>';
  html += '<div class="sb-score">'+inn.runs+'<small>/'+inn.wickets+'</small></div>';
  html += '<div class="sb-meta"><span>Ball '+inn.balls+' / 6</span></div>';
  if(inn.namesConfirmed){
    html += '<div class="sb-meta" style="margin-top:4px;"><span>'+escapeHtml(inn.strikerName)+' &amp; '+escapeHtml(inn.nonStrikerName)+' &middot; '+escapeHtml(inn.bowlerName)+' bowling</span></div>';
  }
  if(so.inningsNum===2){
    var ballsLeft = 6-inn.balls;
    var runsNeeded = so.target-inn.runs;
    html += '<div class="sb-target">Need <b>'+Math.max(runsNeeded,0)+'</b> off <b>'+Math.max(ballsLeft,0)+'</b> balls</div>';
  }
  html += '<div class="ticker">';
  inn.log.forEach(function(b){ html += '<div class="'+ballClass(b)+'">'+b+'</div>'; });
  html += '</div>';
  html += '</div>';

  html += '<div class="section-label">Runs off this ball</div>';
  html += '<div class="grid6">';
  [0,1,2].forEach(function(n){ html += '<div class="runbtn" onclick="superOverAddRuns('+n+')">'+n+'</div>'; });
  html += '</div>';
  html += '<div class="grid6">';
  [3,4,6].forEach(function(n){ html += '<div class="runbtn '+(n===4?'four':n===6?'six':'')+'" onclick="superOverAddRuns('+n+')">'+n+'</div>'; });
  html += '</div>';

  html += '<div class="section-label">Extras</div>';
  html += '<div class="extras-row">';
  html += '<div class="extrabtn" onclick="openSOExtraPopup(\'wd\')">Wide</div>';
  html += '<div class="extrabtn" onclick="openSOExtraPopup(\'nb\')">No ball</div>';
  html += '<div class="extrabtn" onclick="openSOExtraPopup(\'b\')">Bye</div>';
  html += '<div class="extrabtn" onclick="openSOExtraPopup(\'lb\')">Leg bye</div>';
  html += '</div>';

  html += '<div class="wktbtn" onclick="superOverWicket()">Wicket</div>';
  html += '<div class="util-row">';
  html += '<button class="btn btn-secondary btn-small" onclick="superOverUndo()">Undo</button>';
  html += '</div>';
  html += '</div>';

  if(state.soNamesPopup) html += renderSONamesPopup();
  if(state.soExtraPopup) html += renderSOExtraPopup();

  return html;
}

function renderSONamesPopup(){
  var html = '<div class="toss-overlay"><div class="toss-modal">';
  html += '<h3 style="margin-bottom:14px;">Super Over line-up</h3>';
  html += '<label style="text-align:left;">Striker</label>';
  html += '<input type="text" id="soStriker" placeholder="Striker name">';
  html += '<label style="text-align:left;">Non-striker</label>';
  html += '<input type="text" id="soNonStriker" placeholder="Non-striker name">';
  html += '<label style="text-align:left;">Bowler</label>';
  html += '<input type="text" id="soBowler" placeholder="Bowler name">';
  html += errorLine();
  html += '<button class="btn" onclick="confirmSONames()">Start</button>';
  html += '</div></div>';
  return html;
}

function renderSOExtraPopup(){
  var type = state.soExtraPopup.type;
  var labels = {wd:'Wide', nb:'No ball', b:'Bye', lb:'Leg bye'};
  var html = '<div class="toss-overlay"><div class="toss-modal">';
  html += '<h3 style="margin-bottom:4px;">'+labels[type]+'</h3>';
  html += '<div class="numpad">';
  for(var i=0;i<=10;i++){
    html += '<div class="numbtn" onclick="confirmSOExtra('+i+')">'+i+'</div>';
  }
  html += '</div>';
  html += '<button class="btn btn-secondary btn-small" style="margin-top:14px;" onclick="closeSOExtraPopup()">Cancel</button>';
  html += '</div></div>';
  return html;
}

function economyRate(bw){
  if(bw.balls===0) return 0;
  return bw.runs/(bw.balls/6);
}

function buildWormChartSVG(){
  var inn1 = state.data[1], inn2 = state.data[2];
  var w=300, h=170, padL=28, padR=14, padT=12, padB=14;
  function cumulative(inn){
    var arr=[{x:0,y:0}], running=0;
    inn.overHistory.forEach(function(ov,i){ running += computeOverTotal(ov); arr.push({x:i+1,y:running}); });
    if(inn.thisOver.length>0){
      running += computeOverTotal(inn.thisOver);
      arr.push({x: inn.overHistory.length + inn.thisOver.length/6, y: running});
    }
    return arr;
  }
  var c1 = cumulative(inn1), c2 = cumulative(inn2);
  var maxOvers = Math.max(c1[c1.length-1].x, c2[c2.length-1].x, 1);
  var maxRuns = Math.max(c1[c1.length-1].y, c2[c2.length-1].y, 10);
  function toPoints(arr){
    return arr.map(function(p){
      var x = padL + (p.x/maxOvers)*(w-padL-padR);
      var y = h-padB - (p.y/maxRuns)*(h-padT-padB);
      return x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
  }
  var svg = '<svg viewBox="0 0 '+w+' '+h+'" style="width:100%;height:auto;display:block;">';
  for(var g=0; g<=4; g++){
    var gy = padT + (g/4)*(h-padT-padB);
    svg += '<line x1="'+padL+'" y1="'+gy.toFixed(1)+'" x2="'+(w-padR)+'" y2="'+gy.toFixed(1)+'" style="stroke:var(--line);stroke-width:1;"/>';
  }
  svg += '<polyline points="'+toPoints(c1)+'" fill="none" style="stroke:var(--amber-ink);stroke-width:2;"/>';
  svg += '<polyline points="'+toPoints(c2)+'" fill="none" style="stroke:var(--teal);stroke-width:2;"/>';
  svg += '</svg>';
  var legend = '<div style="display:flex;gap:16px;justify-content:center;margin-top:4px;font-size:11px;color:var(--chalk);">';
  legend += '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--amber-ink);margin-right:4px;"></span>'+escapeHtml(inn1.battingName)+'</span>';
  legend += '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--teal);margin-right:4px;"></span>'+escapeHtml(inn2.battingName)+'</span>';
  legend += '</div>';
  return svg+legend;
}

function bestBatting(){
  var best = null;
  [state.data[1], state.data[2]].forEach(function(inn){
    if(!inn) return;
    inn.batsmen.forEach(function(b){
      if(b.balls===0) return;
      var bSR = (b.runs/b.balls)*100;
      if(!best){ best=b; return; }
      var bestSR = (best.runs/best.balls)*100;
      if(b.runs>best.runs || (b.runs===best.runs && bSR>bestSR)) best=b;
    });
  });
  return best;
}

function bestBowling(){
  var best = null;
  [state.data[1], state.data[2]].forEach(function(inn){
    if(!inn) return;
    inn.bowlers.forEach(function(bw){
      if(bw.balls===0) return;
      if(!best){ best=bw; return; }
      if(bw.wickets>best.wickets || (bw.wickets===best.wickets && economyRate(bw)<economyRate(best))) best=bw;
    });
  });
  return best;
}

function computeAutoMOTM(){
  var inn1 = state.data[1], inn2 = state.data[2];
  if(!inn1 || !inn2) return null;

  var winningTeam = null;
  if(inn2.runs >= state.target) winningTeam = inn2.battingName;
  else if(inn2.runs !== state.target-1) winningTeam = inn1.battingName;

  var stats = {};
  function entry(name, team){
    var key = name.trim().toLowerCase();
    if(!stats[key]) stats[key] = {name:name, runs:0, wickets:0, team:team};
    return stats[key];
  }
  [inn1, inn2].forEach(function(inn){
    inn.batsmen.forEach(function(b){
      entry(b.name, inn.battingName).runs += b.runs;
    });
    inn.bowlers.forEach(function(bw){
      entry(bw.name, inn.bowlingName).wickets += bw.wickets;
    });
  });

  var best = null, bestScore = -Infinity;
  Object.keys(stats).forEach(function(key){
    var p = stats[key];
    var score = p.runs + p.wickets*20;
    if(winningTeam && p.team===winningTeam) score += 5;
    if(score>bestScore){ bestScore=score; best=p; }
  });
  return best ? best.name : null;
}

function computeMatchWinner(){
  if(state.superOver && state.superOver.winner) return state.superOver.winner;
  if(state.superOverTiedFinal) return null;
  var inn1 = state.data[1], inn2 = state.data[2];
  if(inn2.runs >= state.target) return inn2.battingName;
  if(inn2.runs === state.target-1) return null;
  return inn1.battingName;
}

function recordMatchToHistory(){
  if(state.matchRecorded) return;
  state.matchRecorded = true;
  var inn1 = state.data[1], inn2 = state.data[2];
  function packInnings(inn){
    return {
      team: inn.battingName,
      runs: inn.runs, wickets: inn.wickets, overs: oversStr(inn.legalBalls),
      batsmen: inn.batsmen.map(function(b){ return {name:b.name, runs:b.runs, balls:b.balls, fours:b.fours, sixes:b.sixes, out:b.out}; }),
      bowlers: inn.bowlers.map(function(bw){ return {name:bw.name, balls:bw.balls, runs:bw.runs, wickets:bw.wickets, maidens:bw.maidens||0}; })
    };
  }
  var entry = {
    date: Date.now(),
    teamA: state.teamA, teamB: state.teamB,
    resultText: matchResultText(),
    winner: computeMatchWinner(),
    manOfMatch: state.manOfMatch,
    innings: [packInnings(inn1), packInnings(inn2)]
  };
  if(state.matchHistoryCache){
    state.matchHistoryCache = state.matchHistoryCache.concat([entry]);
  }
  saveMatchEntryToFirestore(entry);
}

async function saveMatchEntryToFirestore(entry){
  if(!state.user) return;
  try{
    var col = window.__fb.collection(window.__fb.db, 'users', state.user.uid, 'matches');
    await window.__fb.addDoc(col, entry);
  }catch(e){
    console.error('Failed to save match to Firestore:', e);
  }
}

async function fetchMatchHistory(){
  if(!state.user){
    state.matchHistoryCache = [];
    render();
    return;
  }
  try{
    var col = window.__fb.collection(window.__fb.db, 'users', state.user.uid, 'matches');
    var q = window.__fb.query(col, window.__fb.orderBy('date','desc'), window.__fb.limit(500));
    var snap = await window.__fb.getDocs(q);
    var list = [];
    snap.forEach(function(docSnap){ list.push(docSnap.data()); });
    state.matchHistoryCache = list;
  }catch(e){
    console.error('Failed to load match history:', e);
    state.matchHistoryCache = [];
  }
  render();
}

async function clearMatchHistory(){
  if(!state.user) return;
  try{
    var col = window.__fb.collection(window.__fb.db, 'users', state.user.uid, 'matches');
    var snap = await window.__fb.getDocs(col);
    var deletions = [];
    snap.forEach(function(docSnap){ deletions.push(window.__fb.deleteDoc(docSnap.ref)); });
    await Promise.all(deletions);
    state.matchHistoryCache = [];
    render();
  }catch(e){
    console.error('Failed to clear history:', e);
  }
}

function computeLeaderboardStats(history){
  var teams = {}, batters = {}, bowlers = {};
  history.forEach(function(m){
    var teamNames = [m.innings[0].team, m.innings[1].team];
    teamNames.forEach(function(t){
      if(!teams[t]) teams[t] = {name:t, played:0, won:0, lost:0, tied:0, points:0};
      teams[t].played += 1;
    });
    if(m.winner){
      teams[m.winner].won += 1;
      teams[m.winner].points += 2;
      var loser = (m.winner===teamNames[0]) ? teamNames[1] : teamNames[0];
      teams[loser].lost += 1;
    } else {
      teams[teamNames[0]].tied += 1;
      teams[teamNames[0]].points += 1;
      teams[teamNames[1]].tied += 1;
      teams[teamNames[1]].points += 1;
    }
    m.innings.forEach(function(inn){
      inn.batsmen.forEach(function(b){
        var key = b.name.trim().toLowerCase();
        if(!batters[key]) batters[key] = {name:b.name, runs:0, innings:0, highScore:0, fours:0, sixes:0, balls:0, outs:0};
        batters[key].runs += b.runs;
        batters[key].fours += b.fours;
        batters[key].sixes += b.sixes;
        batters[key].innings += 1;
        batters[key].balls += b.balls;
        if(b.out) batters[key].outs += 1;
        if(b.runs>batters[key].highScore) batters[key].highScore = b.runs;
      });
      inn.bowlers.forEach(function(bw){
        if(bw.balls===0) return;
        var key = bw.name.trim().toLowerCase();
        if(!bowlers[key]) bowlers[key] = {name:bw.name, wickets:0, runs:0, balls:0, maidens:0, bestWkts:0, bestRuns:0};
        bowlers[key].wickets += bw.wickets;
        bowlers[key].runs += bw.runs;
        bowlers[key].balls += bw.balls;
        bowlers[key].maidens += bw.maidens;
        if(bw.wickets>bowlers[key].bestWkts || (bw.wickets===bowlers[key].bestWkts && bw.runs<bowlers[key].bestRuns)){
          bowlers[key].bestWkts = bw.wickets;
          bowlers[key].bestRuns = bw.runs;
        }
      });
    });
  });
  return {teams:teams, batters:batters, bowlers:bowlers};
}

function openLeaderboard(){
  state.previousScreen = state.screen;
  state.screen = 'leaderboard';
  if(state.matchHistoryCache===null){
    fetchMatchHistory();
  }
  render();
}

function closeLeaderboard(){
  state.screen = state.previousScreen || 'setup';
  render();
}

function setLeaderboardTab(tab){
  state.leaderboardTab = tab;
  render();
}

function lbAvatar(name){
  var letter = name.trim().charAt(0).toUpperCase() || '?';
  return '<div class="lb-avatar">'+escapeHtml(letter)+'</div>';
}

function renderLeaderboard(){
  var html = topbar();
  html += '<div class="screen">';
  html += '<h2 style="margin-bottom:14px;">Leaderboard</h2>';

  if(state.matchHistoryCache===null){
    html += '<p class="muted">Loading your match history…</p>';
  } else if(state.matchHistoryCache.length===0){
    html += '<p class="muted">No completed matches yet — play one to see stats here.</p>';
  } else {
    var stats = computeLeaderboardStats(state.matchHistoryCache);
    var tab = state.leaderboardTab;

    html += '<div class="lb-tabs">';
    [['batting','Batting'],['bowling','Bowling'],['points','Points'],['history','History']].forEach(function(pair){
      html += '<div class="lb-tab'+(tab===pair[0]?' active':'')+'" onclick="setLeaderboardTab(\''+pair[0]+'\')">'+pair[1]+'</div>';
    });
    html += '</div>';

    if(tab==='batting'){
      var batterList = Object.keys(stats.batters).map(function(k){ return stats.batters[k]; })
        .sort(function(a,b){ return b.runs-a.runs; }).slice(0,15);
      html += '<div class="card">';
      batterList.forEach(function(b, i){
        var avg = b.outs>0 ? (b.runs/b.outs).toFixed(1) : b.runs+'*';
        var sr = b.balls>0 ? ((b.runs/b.balls)*100).toFixed(1) : '0.0';
        html += '<div class="lb-row">';
        html += lbAvatar(b.name);
        html += '<div class="lb-info"><div class="lb-name">'+escapeHtml(b.name)+'</div>';
        html += '<div class="lb-stats">Runs '+b.runs+' &middot; HS '+b.highScore+' &middot; Avg '+avg+' &middot; SR '+sr+'</div></div>';
        html += '<div class="lb-rank">'+String(i+1).padStart(2,'0')+'</div>';
        html += '</div>';
      });
      html += '</div>';
    } else if(tab==='bowling'){
      var bowlerList = Object.keys(stats.bowlers).map(function(k){ return stats.bowlers[k]; })
        .sort(function(a,b){ return b.wickets-a.wickets; }).slice(0,15);
      html += '<div class="card">';
      bowlerList.forEach(function(bw, i){
        var econ = bw.balls>0 ? (bw.runs/(bw.balls/6)).toFixed(2) : '0.00';
        html += '<div class="lb-row">';
        html += lbAvatar(bw.name);
        html += '<div class="lb-info"><div class="lb-name">'+escapeHtml(bw.name)+'</div>';
        html += '<div class="lb-stats">Wkts '+bw.wickets+' &middot; Best '+bw.bestWkts+'/'+bw.bestRuns+' &middot; Econ '+econ+' &middot; '+bw.maidens+' mdns</div></div>';
        html += '<div class="lb-rank">'+String(i+1).padStart(2,'0')+'</div>';
        html += '</div>';
      });
      html += '</div>';
    } else if(tab==='points'){
      var teamList = Object.keys(stats.teams).map(function(k){ return stats.teams[k]; })
        .sort(function(a,b){ return b.points-a.points; });
      html += '<div class="card">';
      teamList.forEach(function(t, i){
        html += '<div class="lb-row">';
        html += lbAvatar(t.name);
        html += '<div class="lb-info"><div class="lb-name">'+escapeHtml(t.name)+'</div>';
        html += '<div class="lb-stats">P'+t.played+' &middot; W'+t.won+' &middot; L'+t.lost+' &middot; T'+t.tied+'</div></div>';
        html += '<div class="lb-rank">'+t.points+'<span style="font-size:10px;display:block;color:var(--chalk);">pts</span></div>';
        html += '</div>';
      });
      html += '</div>';
    } else if(tab==='history'){
      html += '<div class="card">';
      state.matchHistoryCache.forEach(function(m){
        html += '<div class="lb-row">';
        html += '<div class="lb-info"><div class="lb-name">'+escapeHtml(m.teamA)+' vs '+escapeHtml(m.teamB)+'</div>';
        html += '<div class="lb-stats">'+escapeHtml(m.resultText)+' &middot; '+m.innings[0].runs+'/'+m.innings[0].wickets+' - '+m.innings[1].runs+'/'+m.innings[1].wickets+'</div></div>';
        html += '<div style="text-align:right;flex-shrink:0;">';
        html += '<div style="font-size:12px;font-weight:600;">'+formatDateShort(m.date)+'</div>';
        html += '<div style="font-size:10px;color:var(--chalk);">'+formatTime12hr(m.date)+'</div>';
        html += '</div></div>';
      });
      html += '</div>';
    }

    html += '<div class="util-row"><button class="btn btn-secondary btn-small" onclick="exportLeaderboardPDF()">Export PDF</button><button class="btn btn-secondary btn-small" onclick="clearMatchHistory()">Clear history</button></div>';
  }
  html += '<button class="btn" style="margin-top:8px;" onclick="closeLeaderboard()">Back</button>';
  html += '</div>';
  return html;
}

function buildInningsPrintHTML(inningsNum){
  var inn = state.data[inningsNum];
  var scoreLine = inn.runs+'-'+inn.wickets+' ('+oversStr(inn.legalBalls)+')';

  var html = '<div class="rpt-band"><span>'+escapeHtml(inn.battingName)+'</span><span>'+scoreLine+'</span></div>';
  if(inn.startTime){
    html += '<p style="font-size:10px;color:#666;margin:2px 0 6px;">Started '+formatTime12hr(inn.startTime);
    if(inn.endTime) html += ' &middot; finished '+formatTime12hr(inn.endTime)+' &middot; took '+formatDuration(inn.startTime, inn.endTime);
    html += '</p>';
  }
  var pp = powerplayScore(inn);
  if(pp){
    html += '<p style="font-size:11px;margin:4px 0;"><b>Powerplay ('+state.powerplayOvers+' ov):</b> '+pp.runs+'/'+pp.wkts+' ('+pp.oversDisplay+')</p>';
  }

  html += '<table><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>';
  inn.batsmen.forEach(function(b){
    var sub = b.out ? escapeHtml(b.howOut||'out') : 'not out';
    html += '<tr><td><div class="rpt-name">'+escapeHtml(b.name)+'</div><div class="rpt-sub">'+sub+'</div></td>'+
      '<td>'+b.runs+'</td><td>'+b.balls+'</td><td>'+b.fours+'</td><td>'+b.sixes+'</td><td>'+strikeRate(b.runs,b.balls)+'</td></tr>';
  });
  html += '</table>';

  html += '<table class="rpt-two-col">';
  html += '<tr><td class="rpt-label">Extras</td><td>('+extrasTotal(inn)+') '+inn.extras.b+' B, '+inn.extras.lb+' LB, '+inn.extras.wd+' WD, '+inn.extras.nb+' NB, 0 P</td></tr>';
  html += '<tr><td class="rpt-label">Total</td><td>'+scoreLine+' '+rate(inn.runs, inn.legalBalls)+'</td></tr>';
  html += '</table>';

  html += '<table><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ER</th></tr>';
  inn.bowlers.forEach(function(bw){
    html += '<tr><td>'+escapeHtml(bw.name)+'</td><td>'+oversStr(bw.balls)+'</td><td>'+bw.maidens+'</td><td>'+bw.runs+'</td><td>'+bw.wickets+'</td><td>'+economyRate(bw).toFixed(2)+'</td></tr>';
  });
  html += '</table>';

  if(inn.wicketLog.length>0){
    html += '<table><tr><th>Fall of wickets</th><th>Score</th><th>Over</th></tr>';
    inn.wicketLog.forEach(function(w){
      html += '<tr><td>'+escapeHtml(w.batsman)+'</td><td>'+w.score+'/'+w.num+'</td><td>'+w.overs+'</td></tr>';
    });
    html += '</table>';

    html += '<div class="rpt-section-title">Partnerships</div>';
    html += '<table><tr><th>Pair</th><th>Runs (Balls)</th></tr>';
    inn.wicketLog.forEach(function(w){
      html += '<tr><td>'+escapeHtml(w.partner)+' &amp; '+escapeHtml(w.batsman)+'</td><td>'+w.partnershipRuns+' ('+w.partnershipBalls+')</td></tr>';
    });
    var strikerObj = inn.batsmen[inn.strikerIdx];
    var nonStrikerObj = inn.batsmen[inn.nonStrikerIdx];
    if(strikerObj && !strikerObj.out && nonStrikerObj && !nonStrikerObj.out){
      var lastRuns = inn.runs - inn.partnershipStartRuns;
      var lastBalls = inn.legalBalls - inn.partnershipStartBalls;
      html += '<tr><td>'+escapeHtml(nonStrikerObj.name)+' &amp; '+escapeHtml(strikerObj.name)+' (unbeaten)</td><td>'+lastRuns+' ('+lastBalls+')</td></tr>';
    }
    html += '</table>';
  }

  html += '<div class="rpt-section-title">Over-by-over</div>';
  html += '<table><tr><th>Over</th><th>Bowler</th><th>Balls</th><th>Runs</th></tr>';
  inn.overHistory.forEach(function(ov, i){
    html += '<tr><td>'+(i+1)+'</td><td>'+escapeHtml(inn.overBowlers[i])+'</td><td>'+ov.join(' ')+'</td><td>'+computeOverTotal(ov)+'</td></tr>';
  });
  if(inn.thisOver.length>0){
    html += '<tr><td>'+(inn.overHistory.length+1)+' (in progress)</td><td>'+escapeHtml(currentBowler(inn).name)+'</td><td>'+inn.thisOver.join(' ')+'</td><td>'+computeOverTotal(inn.thisOver)+'</td></tr>';
  }
  html += '</table>';

  return html;
}

function buildMatchPrintHTML(){
  var html = '<h1>'+escapeHtml(state.teamA)+' v/s '+escapeHtml(state.teamB)+'</h1>';
  html += '<div class="rpt-result">'+escapeHtml(matchResultText())+'.</div>';
  html += buildInningsPrintHTML(1);
  html += buildInningsPrintHTML(2);

  var bb = bestBatting(), bwl = bestBowling();
  if(bb || bwl || state.manOfMatch){
    html += '<div class="rpt-section-title">Top performers</div>';
    if(bb) html += '<div class="rpt-note"><b>Best batting:</b> '+escapeHtml(bb.name)+' — '+bb.runs+' ('+bb.balls+') SR '+strikeRate(bb.runs,bb.balls)+'</div>';
    if(bwl) html += '<div class="rpt-note"><b>Best bowling:</b> '+escapeHtml(bwl.name)+' — '+bwl.wickets+'/'+bwl.runs+' ('+oversStr(bwl.balls)+' ov)</div>';
    if(state.manOfMatch) html += '<div class="rpt-note"><b>Player of the Match:</b> '+escapeHtml(state.manOfMatch)+'</div>';
  }
  return html;
}

function printAndRestoreTitle(html, filenameBase){
  var area = document.getElementById('print-area');
  area.innerHTML = html;
  var oldTitle = document.title;
  document.title = filenameBase.replace(/\s+/g,'_');
  if(typeof window.print !== 'function'){
    state.toastMessage = "This browser can't print — try opening the file directly in Chrome or Safari, not an in-app preview.";
    document.title = oldTitle;
    render();
    return;
  }
  setTimeout(function(){
    window.print();
    setTimeout(function(){ document.title = oldTitle; }, 500);
  }, 50);
}

function exportScorecardPDF(){
  printAndRestoreTitle(buildMatchPrintHTML(), state.teamA+'_vs_'+state.teamB+'_scorecard');
}

function exportInningsPDF(inningsNum){
  var inn = state.data[inningsNum];
  var html = '<h1>'+escapeHtml(inn.battingName)+' — Innings Report</h1>'+buildInningsPrintHTML(inningsNum);
  printAndRestoreTitle(html, inn.battingName+'_innings_report');
}

function buildLeaderboardPrintHTML(){
  var stats = computeLeaderboardStats(state.matchHistoryCache);
  var html = '<h1>Leaderboard</h1>';

  html += '<div class="rpt-band"><span>Points Table</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Team</th><th>P</th><th>W</th><th>L</th><th>T</th><th>Pts</th></tr>';
  Object.keys(stats.teams).map(function(k){ return stats.teams[k]; })
    .sort(function(a,b){ return b.points-a.points; })
    .forEach(function(t){
      html += '<tr><td>'+escapeHtml(t.name)+'</td><td>'+t.played+'</td><td>'+t.won+'</td><td>'+t.lost+'</td><td>'+t.tied+'</td><td>'+t.points+'</td></tr>';
    });
  html += '</table>';

  html += '<div class="rpt-band"><span>Top Run Scorers</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Batsman</th><th>Runs</th><th>HS</th><th>Avg</th><th>SR</th><th>Inns</th></tr>';
  Object.keys(stats.batters).map(function(k){ return stats.batters[k]; })
    .sort(function(a,b){ return b.runs-a.runs; }).slice(0,20)
    .forEach(function(b){
      var avg = b.outs>0 ? (b.runs/b.outs).toFixed(1) : b.runs+'*';
      var sr = b.balls>0 ? ((b.runs/b.balls)*100).toFixed(1) : '0.0';
      html += '<tr><td>'+escapeHtml(b.name)+'</td><td>'+b.runs+'</td><td>'+b.highScore+'</td><td>'+avg+'</td><td>'+sr+'</td><td>'+b.innings+'</td></tr>';
    });
  html += '</table>';

  html += '<div class="rpt-band"><span>Top Wicket-Takers</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Bowler</th><th>Wkts</th><th>Best</th><th>Econ</th><th>Maidens</th></tr>';
  Object.keys(stats.bowlers).map(function(k){ return stats.bowlers[k]; })
    .sort(function(a,b){ return b.wickets-a.wickets; }).slice(0,20)
    .forEach(function(bw){
      var econ = bw.balls>0 ? (bw.runs/(bw.balls/6)).toFixed(2) : '0.00';
      html += '<tr><td>'+escapeHtml(bw.name)+'</td><td>'+bw.wickets+'</td><td>'+bw.bestWkts+'/'+bw.bestRuns+'</td><td>'+econ+'</td><td>'+bw.maidens+'</td></tr>';
    });
  html += '</table>';

  html += '<div class="rpt-band"><span>Match History</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Date</th><th>Match</th><th>Result</th></tr>';
  state.matchHistoryCache.forEach(function(m){
    html += '<tr><td>'+formatDateShort(m.date)+'</td><td>'+escapeHtml(m.teamA)+' vs '+escapeHtml(m.teamB)+'</td><td>'+escapeHtml(m.resultText)+'</td></tr>';
  });
  html += '</table>';

  return html;
}

function exportLeaderboardPDF(){
  if(!state.matchHistoryCache || state.matchHistoryCache.length===0) return;
  printAndRestoreTitle(buildLeaderboardPrintHTML(), 'leaderboard_report');
}

function generateInningsShareText(inningsNum){
  var inn = state.data[inningsNum];
  var lines = [];
  lines.push(inn.battingName+' innings: '+inn.runs+'/'+inn.wickets+' ('+oversStr(inn.legalBalls)+' ov), RR '+rate(inn.runs, inn.legalBalls));
  inn.batsmen.forEach(function(b){
    lines.push(b.name+(b.out?'':' *')+': '+b.runs+' ('+b.balls+') SR '+strikeRate(b.runs,b.balls)+' [4s:'+b.fours+' 6s:'+b.sixes+']');
  });
  lines.push('Extras: '+extrasTotal(inn)+' (wd '+inn.extras.wd+', nb '+inn.extras.nb+', b '+inn.extras.b+', lb '+inn.extras.lb+')');
  if(inn.wicketLog.length>0){
    lines.push('Partnerships: '+inn.wicketLog.map(function(w){ return w.partner+' & '+w.batsman+' '+w.partnershipRuns+'('+w.partnershipBalls+')'; }).join(', '));
  }
  var overTotals = inn.overHistory.map(function(ov){ return computeOverTotal(ov); });
  if(overTotals.length) lines.push('Over totals: '+overTotals.join(', '));
  return lines.join('\n');
}

function shareInnings(inningsNum){
  var text = generateInningsShareText(inningsNum);
  if(navigator.share){
    navigator.share({title:'Innings report', text:text}).catch(function(){});
    return;
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      state.toastMessage = 'Innings report copied to clipboard!';
      render();
      setTimeout(function(){ state.toastMessage = null; render(); }, 2500);
    }).catch(function(){
      state.toastMessage = 'Could not copy — please copy manually.';
      render();
    });
  }
}

function generateShareText(){
  var inn1 = state.data[1], inn2 = state.data[2];
  var lines = [];
  lines.push(inn1.battingName+' vs '+inn2.battingName);
  lines.push(inn1.battingName+': '+inn1.runs+'/'+inn1.wickets+' ('+oversStr(inn1.legalBalls)+' ov)');
  lines.push(inn2.battingName+': '+inn2.runs+'/'+inn2.wickets+' ('+oversStr(inn2.legalBalls)+' ov)');
  lines.push(matchResultText());
  if(state.manOfMatch) lines.push('Player of the Match: '+state.manOfMatch);
  return lines.join('\n');
}

function shareScorecard(){
  var text = generateShareText();
  if(navigator.share){
    navigator.share({title:'Match scorecard', text:text}).catch(function(){});
    return;
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      state.toastMessage = 'Scorecard copied to clipboard!';
      render();
      setTimeout(function(){ state.toastMessage = null; render(); }, 2500);
    }).catch(function(){
      state.toastMessage = 'Could not copy — please copy manually.';
      render();
    });
  }
}

function buildShareCanvas(){
  var canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 720;
  var ctx = canvas.getContext('2d');
  var inn1 = state.data[1], inn2 = state.data[2];

  var grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0, '#173025');
  grad.addColorStop(1, '#080B10');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#F5B24A';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('MATCH RESULT', canvas.width/2, 46);

  ctx.fillStyle = '#F3F5EF';
  ctx.font = 'bold 26px Arial';
  ctx.fillText(inn1.battingName, canvas.width/2, 110);
  ctx.font = '44px "Courier New", monospace';
  ctx.fillStyle = '#F5B24A';
  ctx.fillText(inn1.runs+'/'+inn1.wickets, canvas.width/2, 164);
  ctx.font = '15px Arial';
  ctx.fillStyle = '#9FB0A8';
  ctx.fillText('('+oversStr(inn1.legalBalls)+' overs)', canvas.width/2, 188);

  ctx.fillStyle = '#F3F5EF';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('vs', canvas.width/2, 226);

  ctx.font = 'bold 26px Arial';
  ctx.fillText(inn2.battingName, canvas.width/2, 274);
  ctx.font = '44px "Courier New", monospace';
  ctx.fillStyle = '#3FB2A3';
  ctx.fillText(inn2.runs+'/'+inn2.wickets, canvas.width/2, 328);
  ctx.font = '15px Arial';
  ctx.fillStyle = '#9FB0A8';
  ctx.fillText('('+oversStr(inn2.legalBalls)+' overs)', canvas.width/2, 352);

  ctx.fillStyle = 'rgba(245,178,74,0.15)';
  ctx.fillRect(40, 384, canvas.width-80, 50);
  ctx.fillStyle = '#F5B24A';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(matchResultText(), canvas.width/2, 415);

  var y = 470;
  if(state.manOfMatch){
    ctx.fillStyle = '#9FB0A8';
    ctx.font = '12px Arial';
    ctx.fillText('PLAYER OF THE MATCH', canvas.width/2, y);
    ctx.fillStyle = '#F3F5EF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(state.manOfMatch, canvas.width/2, y+26);
    y += 70;
  }

  var bb = bestBatting(), bwl = bestBowling();
  if(bb){
    ctx.fillStyle = '#9FB0A8'; ctx.font = '12px Arial';
    ctx.fillText('BEST BATTING', canvas.width/2, y);
    ctx.fillStyle = '#F3F5EF'; ctx.font = 'bold 16px Arial';
    ctx.fillText(bb.name+' — '+bb.runs+' ('+bb.balls+')', canvas.width/2, y+22);
    y += 55;
  }
  if(bwl){
    ctx.fillStyle = '#9FB0A8'; ctx.font = '12px Arial';
    ctx.fillText('BEST BOWLING', canvas.width/2, y);
    ctx.fillStyle = '#F3F5EF'; ctx.font = 'bold 16px Arial';
    ctx.fillText(bwl.name+' — '+bwl.wickets+'/'+bwl.runs, canvas.width/2, y+22);
  }

  ctx.fillStyle = '#5C6B62';
  ctx.font = '11px Arial';
  ctx.fillText('Scored with Third Man', canvas.width/2, canvas.height-20);

  return canvas;
}

function shareScorecardImage(){
  var canvas = buildShareCanvas();
  canvas.toBlob(function(blob){
    if(!blob) return;
    var filename = (state.teamA+'_vs_'+state.teamB+'_result.png').replace(/\s+/g,'_');
    if(navigator.canShare){
      var file = new File([blob], filename, {type:'image/png'});
      if(navigator.canShare({files:[file]})){
        navigator.share({files:[file], title:'Match result'}).catch(function(){});
        return;
      }
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }, 'image/png');
}

function toggleInningsCard(n){
  state.showInningsCard[n] = !state.showInningsCard[n];
  render();
}

function inningsCompactLine(inn, n){
  var html = '<div class="card" style="margin-bottom:10px;">';
  html += '<div class="result-line" style="border-bottom:none;padding:0 0 4px;" onclick="toggleInningsCard('+n+')" role="button">';
  html += '<span style="font-weight:600;">'+escapeHtml(inn.battingName)+'</span>';
  html += '<span>'+inn.runs+'/'+inn.wickets+' ('+oversStr(inn.legalBalls)+' ov)</span>';
  html += '</div>';
  html += '<div class="oh-toggle" style="text-align:left;margin:2px 0 0;" onclick="toggleInningsCard('+n+')">'+(state.showInningsCard[n]?'▾ Hide full scorecard':'▸ Show full scorecard')+'</div>';
  html += '</div>';
  if(state.showInningsCard[n]){
    html += scorecardBlock(inn, n);
  }
  return html;
}

function renderResult(){
  var inn1 = state.data[1], inn2 = state.data[2];
  var html = topbar();
  html += '<div class="screen">';
  html += '<h2 style="margin-bottom:6px;">Match result</h2>';

  html += '<div class="winner">'+matchResultText()+'</div>';

  if(state.superOver && state.superOver.data[2]){
    var so1 = state.superOver.data[1], so2 = state.superOver.data[2];
    html += '<div class="card">';
    html += '<div class="section-label" style="margin-top:0;">Super Over</div>';
    html += '<div class="result-line"><span>'+escapeHtml(so1.battingName)+'</span><span>'+so1.runs+'/'+so1.wickets+'</span></div>';
    if(so1.strikerName) html += '<div class="muted" style="font-size:11px;margin:-4px 0 8px;">'+escapeHtml(so1.strikerName)+' &amp; '+escapeHtml(so1.nonStrikerName)+' &middot; '+escapeHtml(so1.bowlerName)+' bowling &middot; extras '+soExtrasTotal(so1)+'</div>';
    html += '<div class="result-line"><span>'+escapeHtml(so2.battingName)+'</span><span>'+so2.runs+'/'+so2.wickets+'</span></div>';
    if(so2.strikerName) html += '<div class="muted" style="font-size:11px;margin:-4px 0 0;">'+escapeHtml(so2.strikerName)+' &amp; '+escapeHtml(so2.nonStrikerName)+' &middot; '+escapeHtml(so2.bowlerName)+' bowling &middot; extras '+soExtrasTotal(so2)+'</div>';
    html += '</div>';
  }

  var bb = bestBatting(), bwl = bestBowling();
  if(bb || bwl){
    html += '<div class="card">';
    html += '<div class="section-label" style="margin-top:0;">Top performers</div>';
    if(bb) html += '<div class="result-line"><span>Best batting</span><span>'+escapeHtml(bb.name)+' — '+bb.runs+' ('+bb.balls+') SR '+strikeRate(bb.runs,bb.balls)+'</span></div>';
    if(bwl) html += '<div class="result-line"><span>Best bowling</span><span>'+escapeHtml(bwl.name)+' — '+bwl.wickets+'/'+bwl.runs+' ('+oversStr(bwl.balls)+' ov)</span></div>';
    html += '</div>';
  }

  if(inn1.overHistory.length>0 || inn2.overHistory.length>0){
    html += '<div class="card">';
    html += '<div class="section-label" style="margin-top:0;">Run rate comparison</div>';
    html += buildWormChartSVG();
    html += '</div>';
  }

  html += inningsCompactLine(inn1, 1);
  html += inningsCompactLine(inn2, 2);

  if(state.manOfMatch){
    html += '<div class="card" style="text-align:center;">';
    html += '<div class="section-label" style="margin-top:0;">Player of the Match</div>';
    html += '<div style="font-family:\'Times New Roman\', Times, serif;font-size:20px;font-weight:600;color:var(--amber-ink);">'+escapeHtml(state.manOfMatch)+'</div>';
    html += '</div>';
  }

  html += '<div class="util-row" style="margin-top:0;">';
  html += '<button class="btn btn-secondary btn-small" onclick="shareScorecard()">Share scorecard</button>';
  html += '<button class="btn btn-secondary btn-small" onclick="exportScorecardPDF()">Export PDF</button>';
  html += '<button class="btn btn-secondary btn-small" onclick="shareScorecardImage()">Share image</button>';
  html += '</div>';
  html += '<button class="btn" onclick="newMatch()">New match</button>';
  html += '<button class="btn btn-secondary btn-small" style="margin-top:8px;width:100%;" onclick="openLeaderboard()">View Leaderboard</button>';
  if(inn2.history.length>0 && !state.superOver){
    html += '<button class="btn btn-secondary btn-small" style="margin-top:8px;width:100%;" onclick="undoLastBallAndResume()">Undo last ball (fix a mistake)</button>';
  }

  html += '</div>';

  if(state.toastMessage){
    html += '<div class="toast">'+escapeHtml(state.toastMessage)+'</div>';
  }
  return html;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

loadMatchState();
state.screen = 'authLoading';
render();

var SPLASH_MIN_MS = 1600;
var splashStartTime = Date.now();

window.onFirebaseAuthChange = function(user){
  var applyAuthChange = function(){
    state.user = user;
    state.authReady = true;
    if(user){
      state.authError = null;
      state.screen = pendingResumeScreen || 'setup';
      pendingResumeScreen = null;
      fetchMatchHistory();
    } else {
      state.screen = 'login';
    }
    render();
  };
  var elapsed = Date.now() - splashStartTime;
  if(state.screen==='authLoading' && elapsed < SPLASH_MIN_MS){
    setTimeout(applyAuthChange, SPLASH_MIN_MS - elapsed);
  } else {
    applyAuthChange();
  }
};

window.onFirebaseAuthError = function(err){
  state.authError = (err && err.message) ? err.message : 'Sign-in failed. Please try again.';
  render();
};

// Test-only export hook. `module` is undefined in the browser (this file is a
// classic script, not loaded as a module), so this is a no-op outside Node.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    freshMatch, freshInnings,
    parseBallRuns, computeOverTotal, isMaidenOver,
    oversStr, rate, strikeRate, economyRate, howOutText,
    curInnings, striker, nonStriker, currentBowler,
    addRuns, confirmExtra, finalizeWicket, checkOverEnd, checkInningsEnd,
    undo, undoLastBallAndResume, setNextBowler,
    computeAutoMOTM, matchResultText, computeLeaderboardStats,
    buildWormChartSVG,
    getState: function(){ return state; },
    setState: function(s){ state = s; }
  };
}
