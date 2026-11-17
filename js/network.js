/* Ego co-authorship network built from data/pubs.js.
   Static radial layout: Claudio in the centre; co-authors closer and with thicker spokes the more papers they share.
   Colour = year of the first joint paper; thin grey lines = co-authors who also wrote together.
   Hover/click shows the papers in the side panel; the slider/play replays 2017→2026.
   The layout is computed once and never moves; the side panel keeps a fixed structure so nothing jumps. */
(function(){
  if(!window.d3)return;
  var root=document.documentElement;
  /* source of truth: the Google Scholar snapshot (data/scholar.js, from tools/fetch_scholar.py),
     the same file that feeds the citation numbers, so both always agree.
     data/pubs.js is only a fallback and supplies nicer spellings of names. */
  var S=window.SCHOLAR,P;
  function tnorm(t){return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim().slice(0,48)}
  var byTitle={};(window.PUBS||[]).forEach(function(p){byTitle[tnorm(p.t)]=p});
  if(S&&S.publications){
    /* the paper list comes from Scholar; authors: full list fetched by the script, else the
       matching entry in pubs.js, else Scholar's (possibly shortened) list */
    P=S.publications.filter(function(p){return p.year&&p.authors}).map(function(p){
      var m=byTitle[tnorm(p.title)],a=p.authors_full||(m&&m.a)||p.authors.replace(/,?\s*\.\.\.\s*$/,"");
      return {y:p.year,t:m?m.t:p.title,a:a,v:m?m.v:p.venue.replace(/,?\s*\d{4}\s*$/,""),l:[["Paper",m&&m.l[0]?m.l[0][1]:p.url]]}});
  }else if(window.PUBS){P=window.PUBS}else return;
  var SELF="c linhares",EGO="Claudio",Y0=2017,Y1=2026;

  /* ---------- build graph ---------- */
  function strip(s){return s.normalize("NFD").replace(/[̀-ͯ]/g,"")}
  function key(name){var t=strip(name).replace(/\bJr\.?/g,"").replace(/\./g," ").trim().split(/\s+/);return (t[0][0]+" "+t[t.length-1]).toLowerCase()}
  var people={},pairs={};
  P.forEach(function(p,pi){
    var ks=[];
    p.a.split(/,\s*/).forEach(function(nm){nm=nm.trim();if(!nm)return;var k=key(nm);
      var o=people[k]||(people[k]={id:k,name:nm,papers:[],first:9999});
      if(nm.replace(/\./g,"").length>o.name.replace(/\./g,"").length)o.name=nm;  /* keep the fullest spelling */
      if(o.papers.indexOf(pi)<0){o.papers.push(pi);o.first=Math.min(o.first,p.y)}
      if(ks.indexOf(k)<0)ks.push(k)});
    p.ks=ks;
    for(var i=0;i<ks.length;i++)for(var j=i+1;j<ks.length;j++){
      var a=ks[i],b=ks[j];if(a===SELF||b===SELF)continue;var id=a<b?a+"|"+b:b+"|"+a;
      var l=pairs[id]||(pairs[id]={id:id,source:a<b?a:b,target:a<b?b:a,papers:[],first:9999});
      l.papers.push(pi);l.first=Math.min(l.first,p.y)}
  });
  /* prefer the fullest known spelling (Scholar often writes "JR Ponciano") */
  if(window.PUBS)window.PUBS.forEach(function(p){p.a.split(/,\s*/).forEach(function(nm){nm=nm.trim();if(!nm)return;var o=people[key(nm)];
    if(o&&nm.replace(/\./g,"").length>o.name.replace(/\./g,"").length)o.name=nm})});
  var me=people[SELF];me.name="Claudio D. G. Linhares";
  var nodes=Object.keys(people).map(function(k){return people[k]});
  var co=nodes.filter(function(n){return n.id!==SELF});
  var links=Object.keys(pairs).map(function(k){return pairs[k]});
  co.forEach(function(n){links.push({id:"me|"+n.id,source:SELF,target:n.id,papers:n.papers,first:n.first,spoke:true})});
  links.forEach(function(l){l.source=people[l.source];l.target=people[l.target]});
  var maxN=d3.max(co,function(n){return n.papers.length});
  function short(n){var t=n.name.split(" ");return t[0]+" "+t[t.length-1]}

  var setText=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v};
  setText("nPapers",P.length);setText("nCo",co.length);
  var hs=document.getElementById("heroStats");
  if(hs){var e=hs.querySelector('[data-k="papers"]');if(e)e.textContent=P.length}

  /* ---------- colours follow the theme ---------- */
  var color;
  function css(v){return getComputedStyle(root).getPropertyValue(v).trim()}
  function setColors(){
    var ramp=d3.interpolateRgbBasis([css("--coral"),css("--violet"),css("--teal")]);
    color=function(y){return ramp((y-Y0)/(Y1-Y0))};
    var g=[];for(var i=0;i<=10;i++)g.push(ramp(i/10)+" "+(i*10)+"%");
    document.getElementById("ramp").style.background="linear-gradient(90deg,"+g.join(",")+")";
  }
  setColors();

  /* ---------- svg ---------- */
  var svg=d3.select("#netSvg"),stage=document.getElementById("netStage"),tip=document.getElementById("netTip");
  var W=800,H=520;
  function dims(){var r=svg.node().getBoundingClientRect();W=r.width||800;H=r.height||520;svg.attr("viewBox",[-W/2,-H/2,W,H])}
  dims();
  svg.append("defs").append("clipPath").attr("id","meClip").append("circle").attr("r",22);
  var gG=svg.append("g"),gL=svg.append("g"),gN=svg.append("g"),gT=svg.append("g");
  var Rmin=74,Rmax=240;
  function ringR(k){return Rmin+(Rmax-Rmin)*Math.pow(1-(k-1)/(maxN-1),.85)}
  var RINGS=[1,3,8,maxN];
  function r(n){return n.id===SELF?24:4+Math.sqrt(n.papers.length)*3.6}

  var link=gL.selectAll("line").data(links).join("line").attr("stroke-linecap","round");
  var node=gN.selectAll("g").data(nodes).join("g").attr("class","nd").style("cursor","pointer");
  node.filter(function(d){return d.id!==SELF}).append("circle").attr("r",r).attr("stroke-width",1.5);
  var meG=node.filter(function(d){return d.id===SELF});
  meG.append("circle").attr("r",26).attr("class","me-ring");
  meG.append("image").attr("href","img/linhares.jpg").attr("x",-22).attr("y",-30).attr("width",44).attr("height",55).attr("clip-path","url(#meClip)").attr("preserveAspectRatio","xMidYMid slice");
  var label=gT.selectAll("text").data(co).join("text").text(short)
    .attr("font-size",11).attr("font-family","Instrument Sans, sans-serif").attr("font-weight",600)
    .attr("text-anchor","middle").attr("pointer-events","none").attr("paint-order","stroke").attr("stroke-width",3.5);

  /* ---------- static layout: simulate offline, then freeze ---------- */
  function layout(){
    Rmax=Math.max(140,Math.min(W,H)/2-44);
    var g=gG.selectAll("g").data(RINGS).join(function(en){var x=en.append("g");x.append("circle");x.append("text");return x});
    g.select("circle").attr("r",ringR).attr("fill","none").attr("stroke-dasharray","2 5");
    g.select("text").attr("x",function(k){return ringR(k)*.71+4}).attr("y",function(k){return ringR(k)*.71+12})
      .attr("font-size",10).attr("font-family","JetBrains Mono, monospace").text(function(k){return k+" paper"+(k>1?"s":"")});
    me.x=0;me.y=0;me.fx=0;me.fy=0;
    co.slice().sort(function(a,b){return a.first-b.first||b.papers.length-a.papers.length}).forEach(function(n,i,arr){
      var a=-Math.PI/2+i/arr.length*2*Math.PI,R=ringR(n.papers.length);n.x=Math.cos(a)*R;n.y=Math.sin(a)*R;n.vx=n.vy=0});
    var sim=d3.forceSimulation(nodes).stop()
      .force("link",d3.forceLink(links.filter(function(l){return !l.spoke})).distance(40).strength(.012))
      .force("charge",d3.forceManyBody().strength(-110).distanceMax(260))
      .force("collide",d3.forceCollide().radius(function(n){return r(n)+6}))
      .force("radial",d3.forceRadial(function(n){return n.id===SELF?0:ringR(n.papers.length)},0,0).strength(.9));
    for(var i=0;i<400;i++)sim.tick();
    link.attr("x1",function(d){return d.source.x}).attr("y1",function(d){return d.source.y}).attr("x2",function(d){return d.target.x}).attr("y2",function(d){return d.target.y});
    node.attr("transform",function(d){return "translate("+d.x+","+d.y+")"});
    label.attr("x",function(d){return d.x}).attr("y",function(d){return d.y-r(d)-5});
  }
  layout();

  /* ---------- state + styling (no transitions: CSS fades opacity, so hover never stutters) ---------- */
  var year=Y1,focus=null,pinned=null,pf=null;  /* focus/pinned = {type:"node"|"link", d}; pf = hover coming from the side panel ({type:"year"|"paper"|"node"}) */
  function visibleN(n){return n.id===SELF||n.first<=year}
  function visibleL(l){return l.first<=year}
  function neighbours(n){var s={};s[n.id]=1;links.forEach(function(l){if(!visibleL(l))return;if(l.source===n)s[l.target.id]=1;if(l.target===n)s[l.source.id]=1});return s}
  function style(skipPanel){
    var TEXT=css("--text"),MUTE=css("--mute"),BG=css("--bg"),LINE=css("--line2");
    gG.selectAll("circle").attr("stroke",LINE);gG.selectAll("text").attr("fill",MUTE);
    var f=pf||pinned||focus,nb=null,lk=null;
    if(f&&f.type==="node")nb=neighbours(f.d);
    else if(f&&f.type==="link")lk=f.d;
    else if(f&&(f.type==="year"||f.type==="paper")){        /* everyone on that paper / in that year */
      nb={};nb[SELF]=1;P.forEach(function(p,i){if(f.type==="paper"?i===f.i:p.y===f.y)p.ks.forEach(function(k){nb[k]=1})});
      f={type:"group",d:me,grp:nb};
    }
    function on(n){if(!visibleN(n))return false;if(nb)return !!nb[n.id];if(lk)return n===lk.source||n===lk.target;return true}
    node.style("opacity",function(n){return !visibleN(n)?0:(on(n)?1:.15)})
      .style("pointer-events",function(n){return visibleN(n)?"all":"none"});
    node.select("circle:not(.me-ring)").attr("fill",function(n){return color(n.first)}).attr("stroke",BG);
    meG.select(".me-ring").attr("fill",BG).attr("stroke",TEXT).attr("stroke-width",2);
    link.attr("stroke",function(l){return lk===l?TEXT:(l.spoke?color(l.first):MUTE)})
      /* spoke width = papers with Claudio; co-author lines are all equal (they may share papers without Claudio) */
      .attr("stroke-width",function(l){return (l.spoke?Math.min(13,1+l.papers.length*.55):1)+(lk===l?1.5:0)})
      .style("opacity",function(l){if(!visibleL(l))return 0;
        if(nb)return (nb[l.source.id]&&nb[l.target.id]&&(f.type==="group"||l.source===f.d||l.target===f.d))?(l.spoke?.85:.9):.04;
        if(lk)return l===lk?1:.04;
        return l.spoke?.5:.22})
      .style("pointer-events",function(l){return visibleL(l)?"stroke":"none"});
    label.attr("fill",TEXT).attr("stroke",BG)
      .style("opacity",function(n){if(!visibleN(n))return 0;if(nb)return nb[n.id]?1:0;if(lk)return (n===lk.source||n===lk.target)?1:0;return n.papers.length>=4?.9:0});
    if(!skipPanel)panel();
    if(pf)setBars(hitFor(pf),pf.type==="year"?pf.y:null);   /* panel hover: only the bars react, the list stays put */
  }
  function hitFor(f){var h={};
    if(f.type==="year"){h[f.y]=P.filter(function(p){return p.y===f.y}).length}
    else if(f.type==="paper"){h[P[f.i].y]=1}
    else if(f.type==="node"){f.d.papers.forEach(function(i){h[P[i].y]=(h[P[i].y]||0)+1})}
    return h}

  /* ---------- side panel: built once, then only updated ---------- */
  var side=document.getElementById("netSide");
  var perYear={};P.forEach(function(p){perYear[p.y]=(perYear[p.y]||0)+1});
  var maxY=d3.max(Object.values(perYear)),BH=64;
  var YRS=d3.range(Y0,Y1+1);
  /* fixed slots, top to bottom: bar chart, heading (2 lines max), one meta line, scrolling list, footer */
  side.innerHTML='<div class="bars" aria-hidden="true">'+YRS.map(function(y){return '<div><span class="n"></span><b style="height:'+Math.max(3,(perYear[y]||0)/maxY*BH)+'px"><i></i></b><span>'+String(y).slice(2)+'</span></div>'}).join("")+'</div>'+
    '<div class="side-head"><span class="kick"></span><h3></h3><p class="meta"></p></div>'+
    '<p class="sub"></p><ul class="side-list"></ul><div class="side-foot"></div>';
  var sKick=side.querySelector(".kick"),sH=side.querySelector("h3"),sMeta=side.querySelector(".meta"),sSub=side.querySelector(".sub"),
      sList=side.querySelector(".side-list"),sFoot=side.querySelector(".side-foot"),cols=side.querySelectorAll(".bars>div");
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  /* hit = papers per year for the focused person/link (null = default view).
     Bar height = all papers that year; the coloured part = papers with the focused person. */
  function setBars(hit,hotYear){
    cols.forEach(function(c,i){var y=YRS[i],tot=perYear[y]||0,b=c.querySelector("b"),seg=c.querySelector("i"),n=c.querySelector(".n");
      b.classList.toggle("on",!hit&&y<=year);b.classList.toggle("dim",!!hit);
      c.classList.toggle("sel",year<Y1&&y===year||hotYear===y);
      var k=hit?(hit[y]||0):0;seg.style.height=(tot?k/tot*100:0)+"%";
      n.innerHTML=hit&&k&&k<tot?'<span class="k">'+k+'</span><span class="t">/'+tot+'</span>':(hit&&k?'<span class="k">'+tot+'</span>':String(tot||""));
      c.title=y+": "+tot+" papers"+(hit?" · "+k+" highlighted":"")+" · click to show the network up to "+y})}
  function plist(ids){return ids.slice().sort(function(a,b){return P[b].y-P[a].y}).map(function(i){var p=P[i],url=p.l&&p.l[0]?p.l[0][1]:null;
    return '<li data-p="'+i+'">'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(p.t)+'</a>':esc(p.t))+'<span>'+p.y+' · '+esc(p.v)+'</span></li>'}).join("")}
  function panel(){
    var f=pinned||focus;
    if(!f||(f.type==="node"&&f.d===me)){
      var shown=co.filter(visibleN),np=P.filter(function(p){return p.y<=year}).length;
      sKick.textContent=year<Y1?"Up to "+year:"All years";sH.textContent=np+" papers · "+shown.length+" co-authors";sH.style.color="";
      sMeta.textContent="Papers per year, all co-authors";setBars(null);sSub.textContent="Most frequent co-authors";
      sList.innerHTML=shown.sort(function(a,b){return b.papers.length-a.papers.length}).slice(0,8)
        .map(function(n){return '<li data-k="'+esc(n.id)+'"><b>'+esc(n.name)+'</b><span>'+n.papers.length+' papers with '+EGO+' · since '+n.first+'</span></li>'}).join("");
      sFoot.innerHTML='<p class="note">Hover a person or a line to see the papers; click to keep it.</p>';
      return}
    var ids=f.d.papers,hit={};ids.forEach(function(i){hit[P[i].y]=(hit[P[i].y]||0)+1});
    if(f.type==="node"){
      sKick.textContent="Co-author"+(pinned?" · pinned":"");sH.textContent=f.d.name;sH.style.color=color(f.d.first);
      sMeta.textContent=ids.length+" paper"+(ids.length>1?"s":"")+" with "+EGO+" · first in "+f.d.first;
    }else{
      sKick.textContent="Co-authors"+(pinned?" · pinned":"");sH.textContent=short(f.d.source)+" & "+short(f.d.target);sH.style.color="";
      sMeta.textContent="Co-authors; papers below are the ones with "+EGO;
    }
    setBars(hit);sSub.textContent="Papers";sList.innerHTML=plist(ids);
    sFoot.innerHTML=pinned?'<button class="btn sm" type="button">Clear selection</button>':'<p class="note">Click to keep this selection.</p>';
    sList.scrollTop=0;
    var u=sFoot.querySelector("button");if(u)u.onclick=function(){pinned=null;focus=null;style()};
  }

  /* ---------- interaction: hover with a short grace period so moving between people does not flash ---------- */
  var leaveT=null;
  function enter(f){clearTimeout(leaveT);if(pinned)return;if(focus&&focus.d===f.d&&focus.type===f.type)return;focus=f;style()}
  function leave(){clearTimeout(leaveT);leaveT=setTimeout(function(){if(!pinned&&focus){focus=null;style()}},140)}
  function showTip(e,html){var b=stage.getBoundingClientRect();if(html!=null)tip.innerHTML=html;tip.style.opacity=1;
    var x=e.clientX-b.left+14,y=e.clientY-b.top+14;if(x>b.width-270)x-=290;tip.style.left=x+"px";tip.style.top=y+"px"}
  function hideTip(){tip.style.opacity=0}
  function nPapers(k){return k+" paper"+(k>1?"s":"")}
  node.on("mouseenter",function(e,d){
      if(d===me){showTip(e,"<b>Claudio D. G. Linhares</b><span>"+nPapers(P.length)+"</span>");return}
      enter({type:"node",d:d});showTip(e,"<b>"+esc(d.name)+"</b><span>"+nPapers(d.papers.length)+" with "+EGO+" · since "+d.first+"</span>")})
    .on("mousemove",function(e){showTip(e)})
    .on("mouseleave",function(){hideTip();leave()})
    .on("click",function(e,d){e.stopPropagation();pinned=d===me?null:{type:"node",d:d};focus=pinned;style()});
  link.on("mouseenter",function(e,l){
      if(l.spoke){enter({type:"node",d:l.target});showTip(e,"<b>"+EGO+" &amp; "+esc(short(l.target))+"</b><span>"+nPapers(l.papers.length)+" together · since "+l.first+"</span>");return}
      enter({type:"link",d:l});showTip(e,"<b>"+esc(short(l.source))+" &amp; "+esc(short(l.target))+"</b><span>have co-authored together</span>")})
    .on("mousemove",function(e){showTip(e)})
    .on("mouseleave",function(){hideTip();leave()})
    .on("click",function(e,l){e.stopPropagation();pinned=l.spoke?{type:"node",d:l.target}:{type:"link",d:l};focus=pinned;style()});
  svg.on("click",function(){pinned=null;focus=null;style()});

  /* ---------- side panel drives the graph (coordinated views) ---------- */
  var pfT=null;
  function same(a,b){return a&&b&&a.type===b.type&&a.y===b.y&&a.i===b.i&&a.d===b.d}
  function setPF(f){clearTimeout(pfT);if(same(pf,f))return;pf=f;style(true)}
  function clearPF(){clearTimeout(pfT);pfT=setTimeout(function(){if(pf){pf=null;style(true);panelBarsReset()}},120)}
  function panelBarsReset(){var f=pinned||focus;if(!f||(f.type==="node"&&f.d===me))setBars(null);else{var h={};f.d.papers.forEach(function(i){h[P[i].y]=(h[P[i].y]||0)+1});setBars(h)}}
  cols.forEach(function(c,i){var y=YRS[i];
    c.addEventListener("mouseenter",function(){setPF({type:"year",y:y})});
    c.addEventListener("mouseleave",clearPF);
    c.addEventListener("click",function(){stop();pf=null;setYear(year===y?Y1:y)});
  });
  sList.addEventListener("mouseover",function(e){var li=e.target.closest("li");if(!li)return;
    if(li.dataset.k&&people[li.dataset.k])setPF({type:"node",d:people[li.dataset.k]});
    else if(li.dataset.p!=null)setPF({type:"paper",i:+li.dataset.p})});
  sList.addEventListener("mouseleave",clearPF);
  sList.addEventListener("click",function(e){var li=e.target.closest("li[data-k]");if(!li||!people[li.dataset.k])return;
    pf=null;pinned={type:"node",d:people[li.dataset.k]};focus=pinned;style()});

  /* ---------- timeline (only shows/hides; positions never change) ---------- */
  var slider=document.getElementById("netYear"),lbl=document.getElementById("netYearLbl"),btn=document.getElementById("netPlay"),timer=null;
  /* people/lines that appear in this step grow in: circles scale up, lines draw outwards from the centre */
  function reveal(prev,y){
    if(y<=prev)return;
    node.filter(function(n){return n!==me&&n.first>prev&&n.first<=y}).select("circle")
      .interrupt().attr("r",0).transition().duration(600).ease(d3.easeBackOut.overshoot(1.6)).attr("r",r);
    link.filter(function(l){return l.first>prev&&l.first<=y}).each(function(l){
      var L=Math.hypot(l.target.x-l.source.x,l.target.y-l.source.y)||1;
      d3.select(this).interrupt().attr("stroke-dasharray",L+" "+L).attr("stroke-dashoffset",L)
        .transition().duration(650).ease(d3.easeCubicOut).attr("stroke-dashoffset",0)
        .on("end",function(){d3.select(this).attr("stroke-dasharray",null).attr("stroke-dashoffset",null)})});
  }
  function setYear(y){var prev=year;year=y;slider.value=y;lbl.textContent=y;style();reveal(prev,y)}
  slider.addEventListener("input",function(){stop();setYear(+slider.value)});
  function stop(){clearInterval(timer);timer=null;btn.querySelector("use").setAttribute("href","#i-play");btn.setAttribute("aria-label","Play timeline")}
  btn.addEventListener("click",function(){
    if(timer){stop();return}
    btn.querySelector("use").setAttribute("href","#i-pause");btn.setAttribute("aria-label","Pause timeline");
    if(year>=Y1){year=Y0-1}            /* restart: start from an empty map so 2017 grows in too */
    setYear(year+1);
    timer=setInterval(function(){if(year>=Y1){stop();return}setYear(year+1)},850);
  });

  document.addEventListener("themechange",function(){setColors();style()});
  var rz;window.addEventListener("resize",function(){clearTimeout(rz);rz=setTimeout(function(){var w=W,h=H;dims();if(Math.abs(w-W)>40||Math.abs(h-H)>40){layout()}style()},200)});
  style();
})();
