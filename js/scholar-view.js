/* Publications section: Scholar metrics, citations-per-year chart, top-10 list.
   Data: data/scholar.js (written by tools/fetch_scholar.py). Links/venues: data/pubs.js. */
(function(){
  var S=window.SCHOLAR,P=window.PUBS||[];if(!S)return;
  function $(s){return document.querySelectorAll(s)}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function norm(s){return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
  var vals={cites:S.citations.all,h:S.h_index.all,i10:S.i10_index.all,npubs:S.publications.length};
  $("[data-s]").forEach(function(el){el.textContent=vals[el.dataset.s]});
  var hs=document.getElementById("heroStats");
  if(hs){hs.querySelector('[data-k="cites"]').textContent=vals.cites;hs.querySelector('[data-k="h"]').textContent=vals.h}
  var d=new Date(S.fetched);
  document.getElementById("schUpdated").textContent="Google Scholar snapshot · "+d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

  /* ---------- citations per year (plain SVG bars, hover for values) ---------- */
  var svg=document.getElementById("citeChart"),val=document.getElementById("chartVal");
  var ys=Object.keys(S.per_year).map(Number).sort(),mx=Math.max.apply(null,ys.map(function(y){return S.per_year[y]}));
  function drawChart(){
    var W=svg.clientWidth||600,H=200,pb=22,pt=18,n=ys.length,gap=6,bw=(W-gap*(n-1))/n;
    var h='';
    ys.forEach(function(y,i){var c=S.per_year[y],bh=Math.max(2,(H-pb-pt)*c/mx),x=i*(bw+gap),yy=H-pb-bh;
      h+='<g class="cb" data-y="'+y+'" data-c="'+c+'"><rect x="'+x+'" y="'+pt+'" width="'+bw+'" height="'+(H-pb-pt)+'" fill="transparent"/>'+
         '<rect class="bar" x="'+x+'" y="'+yy+'" width="'+bw+'" height="'+bh+'" rx="5" fill="var(--teal)" opacity="'+(i===n-1?1:.75)+'"/>'+
         '<text x="'+(x+bw/2)+'" y="'+(yy-5)+'" text-anchor="middle" font-size="11" font-family="JetBrains Mono,monospace" fill="var(--soft)">'+c+'</text>'+
         '<text x="'+(x+bw/2)+'" y="'+(H-6)+'" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono,monospace" fill="var(--mute)">'+(W<520?"'"+String(y).slice(2):y)+'</text></g>'});
    svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.innerHTML=h;
    svg.querySelectorAll(".cb").forEach(function(g){
      g.addEventListener("mouseenter",function(){svg.querySelectorAll(".bar").forEach(function(b){b.setAttribute("fill","var(--teal)")});g.querySelector(".bar").setAttribute("fill","var(--coral)");val.textContent=g.dataset.y+": "+g.dataset.c+" citations"});
      g.addEventListener("mouseleave",function(){g.querySelector(".bar").setAttribute("fill","var(--teal)");val.textContent=""})});
  }
  drawChart();window.addEventListener("resize",drawChart);

  /* ---------- top 10: TVCG / CG&A + most cited, ranked by Scholar citations ---------- */
  var PICK=[
    {k:"clinicalpath",tag:"TVCG"},{k:"largenetvis",tag:"TVCG"},{k:"zigzagnetvis",tag:"TVCG"},{k:"vilod",tag:"CG&A"},
    {k:"dynetvis a system for visualization of dynamic networks"},{k:"visual analysis for evaluation of community detection"},
    {k:"a scalable node ordering strategy"},{k:"visualisation of structure and processes on temporal networks",tag:"Book chapter"},
    {k:"an online and nonuniform timeslicing"},{k:"a comparative analysis for visualizing the temporal evolution",tag:"User study"}
  ];
  var rows=PICK.map(function(x){
    var sp=S.publications.find(function(p){return norm(p.title).indexOf(x.k)===0});
    var lp=P.find(function(p){return norm(p.t).indexOf(x.k)===0});
    return {t:lp?lp.t:(sp?sp.title:x.k),v:lp?lp.v:(sp?sp.venue:""),y:lp?lp.y:(sp?sp.year:""),url:lp&&lp.l[0]?lp.l[0][1]:(sp?sp.url:"#"),
      sch:sp?sp.url:null,c:sp?sp.citations:0,tag:x.tag};
  }).sort(function(a,b){return b.c-a.c});
  document.getElementById("top10").innerHTML=rows.map(function(r){
    return '<li class="card"><div><div class="t">'+(r.tag?'<span class="tag'+(r.tag==="TVCG"?" tvcg":"")+'">'+esc(r.tag)+'</span>':'')+'<a href="'+esc(r.url)+'" target="_blank" rel="noopener">'+esc(r.t)+'</a></div>'+
      '<div class="v">'+esc(r.v)+' · '+r.y+'</div></div><a class="cites" href="'+esc(r.sch||S.profile)+'" target="_blank" rel="noopener" style="text-decoration:none" title="Open on Google Scholar"><b>'+r.c+'</b><span>citations</span></a></li>'}).join("");
})();
