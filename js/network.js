/* Co-authorship network built from data/pubs.js.
   Node = co-author (size: papers with me, colour: first year together); centre node = me.
   Link = co-authored at least one paper (width: number of shared papers).
   Hover/click shows the papers in the side panel; the slider/play replays 2017→2026. */
(function(){
  if(!window.d3||!window.PUBS)return;
  var P=window.PUBS,root=document.documentElement;
  var SELF="c linhares",Y0=2017,Y1=2026;

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
    for(var i=0;i<ks.length;i++)for(var j=i+1;j<ks.length;j++){
      var a=ks[i],b=ks[j];if(a===SELF||b===SELF)continue;var id=a<b?a+"|"+b:b+"|"+a;
      var l=pairs[id]||(pairs[id]={id:id,source:a<b?a:b,target:a<b?b:a,papers:[],first:9999});
      l.papers.push(pi);l.first=Math.min(l.first,p.y)}
  });
  var me=people[SELF];me.name="Claudio D. G. Linhares";
  var nodes=Object.keys(people).map(function(k){return people[k]});
  var co=nodes.filter(function(n){return n.id!==SELF});
  var links=Object.keys(pairs).map(function(k){return pairs[k]});
  /* spokes to me, drawn faintly, so isolated collaborators still attach to the centre */
  co.forEach(function(n){links.push({id:"me|"+n.id,source:SELF,target:n.id,papers:n.papers,first:n.first,spoke:true})});

  document.getElementById("nPapers").textContent=P.length;
  document.getElementById("nCo").textContent=co.length;
  var hs=document.getElementById("heroStats");
  if(hs){hs.querySelector('[data-k="papers"]').textContent=P.length;hs.querySelector('[data-k="coauth"]').textContent=co.length}

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
  var W=800,H=560;
  function dims(){var r=svg.node().getBoundingClientRect();W=r.width;H=r.height;svg.attr("viewBox",[-W/2,-H/2,W,H])}
  dims();
  var defs=svg.append("defs");
  defs.append("clipPath").attr("id","meClip").append("circle").attr("r",22);
  var gZoom=svg.append("g");
  var gL=gZoom.append("g"),gN=gZoom.append("g"),gT=gZoom.append("g");
  svg.call(d3.zoom().scaleExtent([.5,3]).on("zoom",function(e){gZoom.attr("transform",e.transform)}));

  function r(n){return n.id===SELF?24:4+Math.sqrt(n.papers.length)*3.6}
  me.fx=0;me.fy=0;

  var link=gL.selectAll("line").data(links).join("line")
    .attr("stroke-linecap","round");
  var node=gN.selectAll("g").data(nodes).join("g").attr("class","nd").style("cursor","pointer");
  node.filter(function(d){return d.id!==SELF}).append("circle").attr("r",r).attr("stroke-width",1.5);
  var meG=node.filter(function(d){return d.id===SELF});
  meG.append("circle").attr("r",26).attr("class","me-ring");
  meG.append("image").attr("href","img/linhares.jpg").attr("x",-22).attr("y",-30).attr("width",44).attr("height",55).attr("clip-path","url(#meClip)").attr("preserveAspectRatio","xMidYMid slice");
  var label=gT.selectAll("text").data(nodes.filter(function(n){return n.id!==SELF})).join("text")
    .text(function(d){var t=d.name.split(" ");return t[0]+" "+t[t.length-1]})
    .attr("font-size",11).attr("font-family","Instrument Sans, sans-serif").attr("font-weight",600)
    .attr("text-anchor","middle").attr("pointer-events","none").attr("paint-order","stroke").attr("stroke-width",3.5);

  var sim=d3.forceSimulation(nodes)
    .force("link",d3.forceLink(links).id(function(d){return d.id})
      .distance(function(l){return l.spoke?Math.max(90,230-l.papers.length*8):70})
      .strength(function(l){return l.spoke?.08:Math.min(.5,.08+l.papers.length*.06)}))
    .force("charge",d3.forceManyBody().strength(-170))
    .force("collide",d3.forceCollide().radius(function(n){return r(n)+8}))
    .force("x",d3.forceX().strength(.025)).force("y",d3.forceY().strength(.045))
    .on("tick",function(){
      link.attr("x1",function(d){return d.source.x}).attr("y1",function(d){return d.source.y}).attr("x2",function(d){return d.target.x}).attr("y2",function(d){return d.target.y});
      node.attr("transform",function(d){return "translate("+d.x+","+d.y+")"});
      label.attr("x",function(d){return d.x}).attr("y",function(d){return d.y-r(d)-5});
    });
  node.call(d3.drag()
    .on("start",function(e,d){if(!e.active)sim.alphaTarget(.25).restart();d.fx=d.x;d.fy=d.y})
    .on("drag",function(e,d){d.fx=e.x;d.fy=e.y})
    .on("end",function(e,d){if(!e.active)sim.alphaTarget(0);if(d.id!==SELF){d.fx=null;d.fy=null}}));

  /* ---------- state + styling ---------- */
  var year=Y1,focus=null,pinned=null;          /* focus = {type:"node"|"link", d} */
  function visibleN(n){return n.id===SELF||n.first<=year}
  function visibleL(l){return l.first<=year}
  function neighbours(n){var s={};s[n.id]=1;links.forEach(function(l){if(!visibleL(l))return;if(l.source.id===n.id)s[l.target.id]=1;if(l.target.id===n.id)s[l.source.id]=1});return s}
  function style(){
    var TEXT=css("--text"),MUTE=css("--mute"),BG=css("--bg"),LINE=css("--line2");
    var nb=focus&&focus.type==="node"?neighbours(focus.d):null;
    var lk=focus&&focus.type==="link"?focus.d:null;
    function on(n){if(!visibleN(n))return false;if(nb)return !!nb[n.id];if(lk)return n===lk.source||n===lk.target;return true}
    node.transition().duration(250).style("opacity",function(n){return !visibleN(n)?0:(on(n)?1:.15)})
      .style("pointer-events",function(n){return visibleN(n)?"all":"none"});
    node.select("circle:not(.me-ring)").attr("fill",function(n){return color(n.first)}).attr("stroke",BG);
    meG.select(".me-ring").attr("fill",BG).attr("stroke",TEXT).attr("stroke-width",2);
    link.transition().duration(250)
      .attr("stroke",function(l){return l.spoke?LINE:(lk===l?TEXT:color(l.first))})
      .attr("stroke-width",function(l){return l.spoke?1:Math.min(6,1+l.papers.length*.9)+(lk===l?1.5:0)})
      .style("opacity",function(l){if(!visibleL(l))return 0;
        if(nb)return (nb[l.source.id]&&nb[l.target.id]&&(l.source.id===focus.d.id||l.target.id===focus.d.id))?(l.spoke?.8:.95):.04;
        if(lk)return l===lk?1:.04;
        return l.spoke?.35:.6});
    label.attr("fill",TEXT).attr("stroke",BG)
      .style("opacity",function(n){if(!visibleN(n))return 0;if(nb)return nb[n.id]?1:0;if(lk)return (n===lk.source||n===lk.target)?1:0;return n.papers.length>=4?.9:0});
    link.style("pointer-events",function(l){return visibleL(l)&&!l.spoke?"stroke":"none"});
    panel();
  }

  /* ---------- side panel ---------- */
  var side=document.getElementById("netSide");
  var perYear={};P.forEach(function(p){perYear[p.y]=(perYear[p.y]||0)+1});
  var maxY=d3.max(Object.values(perYear));
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function bars(hit){var h='<div class="bars" aria-hidden="true">';for(var y=Y0;y<=Y1;y++){var n=perYear[y]||0;
    h+='<div title="'+y+': '+n+' papers"><i class="'+(hit&&hit[y]?"hit":(y<=year?"on":""))+'" style="height:'+Math.max(4,n/maxY*56)+'px"></i><span>'+String(y).slice(2)+'</span></div>'}return h+'</div>'}
  function plist(ids){return '<ul>'+ids.slice().sort(function(a,b){return P[b].y-P[a].y}).map(function(i){var p=P[i];
    var url=p.l&&p.l[0]?p.l[0][1]:null;
    return '<li>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener" style="text-decoration:none">'+esc(p.t)+'</a>':esc(p.t))+'<span>'+p.y+' · '+esc(p.v)+'</span></li>'}).join("")+'</ul>'}
  function panel(){
    var f=pinned||focus;
    if(!f){
      var shown=co.filter(visibleN).length,np=P.filter(function(p){return p.y<=year}).length;
      side.innerHTML='<span class="kick">'+(year<Y1?"Up to "+year:"All years")+'</span><h3>'+np+' papers · '+shown+' co-authors</h3>'+
        '<p class="meta">Papers per year (highlighted = on the map now).</p>'+bars()+
        '<p class="meta">Most frequent co-authors:</p><ul>'+co.filter(visibleN).sort(function(a,b){return b.papers.length-a.papers.length}).slice(0,6)
          .map(function(n){return '<li><b>'+esc(n.name)+'</b><span>'+n.papers.length+' papers together · since '+n.first+'</span></li>'}).join("")+'</ul>';
      return}
    var ids=f.type==="node"?f.d.papers:f.d.papers,hit={};ids.forEach(function(i){hit[P[i].y]=1});
    if(f.type==="node"&&f.d.id===SELF){focusNone();return}
    var head=f.type==="node"
      ?'<span class="kick">Co-author'+(pinned?' · pinned':'')+'</span><h3 style="color:'+color(f.d.first)+'">'+esc(f.d.name)+'</h3><p class="meta">'+ids.length+' paper'+(ids.length>1?'s':'')+' together · first in '+f.d.first+'</p>'
      :'<span class="kick">Link'+(pinned?' · pinned':'')+'</span><h3>'+esc(f.d.source.name)+' &amp; '+esc(f.d.target.name)+'</h3><p class="meta">'+ids.length+' shared paper'+(ids.length>1?'s':'')+' (with me)</p>';
    side.innerHTML=head+bars(hit)+plist(ids)+(pinned?'<button class="btn sm" id="unpin" type="button">Clear selection</button>':'<p class="note">Click to pin this selection.</p>');
    var u=document.getElementById("unpin");if(u)u.onclick=function(){pinned=null;focus=null;style()};
  }
  function focusNone(){pinned=null;focus=null;style()}

  /* ---------- interaction ---------- */
  function showTip(e,html){var b=stage.getBoundingClientRect();tip.innerHTML=html;tip.style.opacity=1;
    var x=e.clientX-b.left+14,y=e.clientY-b.top+14;if(x>b.width-270)x-=290;tip.style.left=x+"px";tip.style.top=y+"px"}
  function hideTip(){tip.style.opacity=0}
  node.on("mouseenter",function(e,d){if(d.id===SELF){showTip(e,"<b>Claudio D. G. Linhares</b><span>"+P.length+" papers</span>");return}
      if(!pinned){focus={type:"node",d:d};style()}showTip(e,"<b>"+esc(d.name)+"</b><span>"+d.papers.length+" paper"+(d.papers.length>1?"s":"")+" · since "+d.first+"</span>")})
    .on("mousemove",function(e,d){showTip(e,tip.innerHTML)})
    .on("mouseleave",function(){hideTip();if(!pinned){focus=null;style()}})
    .on("click",function(e,d){e.stopPropagation();if(d.id===SELF){focusNone();return}pinned={type:"node",d:d};focus=pinned;style()});
  link.on("mouseenter",function(e,l){if(!pinned){focus={type:"link",d:l};style()}
      showTip(e,"<b>"+esc(l.source.name.split(" ").slice(-1)[0])+" – "+esc(l.target.name.split(" ").slice(-1)[0])+"</b><span>"+l.papers.length+" shared paper"+(l.papers.length>1?"s":"")+"</span>")})
    .on("mousemove",function(e){showTip(e,tip.innerHTML)})
    .on("mouseleave",function(){hideTip();if(!pinned){focus=null;style()}})
    .on("click",function(e,l){e.stopPropagation();pinned={type:"link",d:l};focus=pinned;style()});
  svg.on("click",focusNone);

  /* ---------- timeline ---------- */
  var slider=document.getElementById("netYear"),lbl=document.getElementById("netYearLbl"),btn=document.getElementById("netPlay"),timer=null;
  function setYear(y){year=y;slider.value=y;lbl.textContent=y;style();sim.alpha(.35).restart()}
  slider.addEventListener("input",function(){stop();setYear(+slider.value)});
  function stop(){clearInterval(timer);timer=null;btn.querySelector("use").setAttribute("href","#i-play");btn.setAttribute("aria-label","Play timeline")}
  btn.addEventListener("click",function(){
    if(timer){stop();return}
    btn.querySelector("use").setAttribute("href","#i-pause");btn.setAttribute("aria-label","Pause timeline");
    var y=year>=Y1?Y0:year+1;setYear(y);
    timer=setInterval(function(){if(year>=Y1){stop();return}setYear(year+1)},1300);
  });

  document.addEventListener("themechange",function(){setColors();style()});
  window.addEventListener("resize",function(){dims()});
  style();
})();
