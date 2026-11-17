/* Small motion pieces that CSS alone can't do smoothly:
   1. the Simulation keyword icon: a wireframe cube turning in 3D;
   2. the portrait orbit: one continuous rotation whose speed eases up while hovered and back down after,
      so entering/leaving never jumps (a CSS animation-duration change would). */
(function(){
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 3D cube ---------- */
  var cube=document.querySelector(".cube3d");
  var V=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  var E=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  var NS="http://www.w3.org/2000/svg",lines=[],dots=[];
  if(cube){
    E.forEach(function(){var l=document.createElementNS(NS,"line");cube.appendChild(l);lines.push(l)});
    V.forEach(function(){var c=document.createElementNS(NS,"circle");c.setAttribute("r","1.1");c.setAttribute("class","cv");cube.appendChild(c);dots.push(c)});
  }
  function drawCube(t){
    var a=t*.0011,b=.5+Math.sin(t*.0007)*.25,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
    var P=V.map(function(v){var x=v[0]*ca-v[2]*sa,z=v[0]*sa+v[2]*ca,y=v[1]*cb-z*sb;z=v[1]*sb+z*cb;
      var k=22/(4.2+z);return [12+x*k,12+y*k,z]});
    E.forEach(function(e,i){var p=P[e[0]],q=P[e[1]],l=lines[i];l.setAttribute("x1",p[0].toFixed(2));l.setAttribute("y1",p[1].toFixed(2));l.setAttribute("x2",q[0].toFixed(2));l.setAttribute("y2",q[1].toFixed(2));
      l.style.opacity=(.45+.55*(1-(p[2]+q[2]+2)/4)).toFixed(2)});
    P.forEach(function(p,i){dots[i].setAttribute("cx",p[0].toFixed(2));dots[i].setAttribute("cy",p[1].toFixed(2));dots[i].style.opacity=(1-(p[2]+1)/2*.7).toFixed(2)});
  }

  /* ---------- 1b. 3D point-cloud tree (Forestry) turning around its trunk ---------- */
  var tree=document.querySelector(".tree3d"),TP=[],tdots=[];
  if(tree){
    var g=document.createElementNS(NS,"ellipse");g.setAttribute("cx","12");g.setAttribute("cy","21.2");g.setAttribute("rx","6.5");g.setAttribute("ry","1.3");g.setAttribute("class","ground");tree.appendChild(g);
    var tr=document.createElementNS(NS,"line");tr.setAttribute("x1","12");tr.setAttribute("x2","12");tr.setAttribute("y1","21");tr.setAttribute("y2","14.5");tr.setAttribute("class","trunk");tree.appendChild(tr);
    /* three conical tiers, sampled as rings of points like a LiDAR scan */
    [[14.8,6.8,9.6],[11.2,5.4,6.4],[7.6,3.9,3]].forEach(function(t){var yb=t[0],R=t[1],yt=t[2];
      for(var k=0;k<4;k++){var f=k/4,y=yb+(yt-yb)*f,r=R*(1-f),n=Math.max(3,Math.round(9*(1-f)));
        for(var m=0;m<n;m++){var a0=m/n*6.2832+k*.6;TP.push([Math.cos(a0)*r,y,Math.sin(a0)*r])}}});
    TP.push([0,1.9,0]);
    TP.forEach(function(){var c=document.createElementNS(NS,"circle");c.setAttribute("r",".72");c.setAttribute("class","tp");tree.appendChild(c);tdots.push(c)});
  }
  function drawTree(t){
    var a=t*.0012,ca=Math.cos(a),sa=Math.sin(a);
    TP.forEach(function(p,i){var x=p[0]*ca-p[2]*sa,z=p[0]*sa+p[2]*ca,k=8/(8+z*.6);
      var d=tdots[i];d.setAttribute("cx",(12+x*k).toFixed(2));d.setAttribute("cy",(p[1]+z*.18).toFixed(2));
      d.setAttribute("r",(.55+.35*(1-(z+7)/14)).toFixed(2));d.style.opacity=(.35+.65*(1-(z+7)/14)).toFixed(2)});
  }

  /* ---------- 2. portrait orbit ---------- */
  var portrait=document.querySelector(".portrait"),orbit=portrait&&portrait.querySelector(".orbit"),ring=portrait&&portrait.querySelector(".ring"),img=ring&&ring.querySelector("img");
  var ang=0,speed=1,target=1,BASE=360/40;          /* degrees per second at rest (one turn every 40 s) */
  if(portrait){
    portrait.classList.add("js-orbit");            /* switches off the CSS keyframe spin */
    portrait.addEventListener("pointerenter",function(){target=7});
    portrait.addEventListener("pointerleave",function(){target=1});
  }

  /* ---------- 3. keyword tiles: hovering speeds up the icon's animation without restarting it ---------- */
  var cubeRate=1,cubeTarget=1,cubeT=0,treeRate=1,treeTarget=1,treeT=0;
  document.querySelectorAll(".kt").forEach(function(tile){
    /* only the icon's own looping keyframe animations: leave the hover transitions (lift, zoom) alone */
    function rate(r){if(tile.getAnimations)tile.getAnimations({subtree:true}).forEach(function(a){
      if(!a.animationName||a.effect&&a.effect.target&&!a.effect.target.closest("svg"))return;
      a.updatePlaybackRate?a.updatePlaybackRate(r):(a.playbackRate=r)})}
    tile.addEventListener("pointerenter",function(){rate(2.3);if(tile.classList.contains("k-sim"))cubeTarget=3;if(tile.classList.contains("k-tree"))treeTarget=3});
    tile.addEventListener("pointerleave",function(){rate(1);if(tile.classList.contains("k-sim"))cubeTarget=1;if(tile.classList.contains("k-tree"))treeTarget=1});
  });

  /* ---------- 4. demo cards: still poster until hovered, then the GIF plays ----------
     (touch screens can't hover, so there the GIF plays while the card is on screen) */
  var touch=window.matchMedia&&matchMedia("(hover: none)").matches;
  document.querySelectorAll(".demo img[data-gif]").forEach(function(im){
    var poster=im.getAttribute("src"),gif=im.dataset.gif,card=im.closest(".demo"),pre=null;
    function play(){if(!pre){pre=new Image();pre.src=gif}im.src=gif;card.classList.add("playing")}
    function still(){im.src=poster;card.classList.remove("playing")}
    if(touch&&"IntersectionObserver" in window){new IntersectionObserver(function(es){es[0].isIntersecting?play():still()},{threshold:.6}).observe(card)}
    else{card.addEventListener("pointerenter",play);card.addEventListener("pointerleave",still);card.addEventListener("focus",play);card.addEventListener("blur",still)}
  });

  /* ---------- 5. big card photos colour in when the card reaches the middle of the screen ---------- */
  var cards=document.querySelectorAll(".grant");
  if("IntersectionObserver" in window){
    var fio=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("in-focus",e.isIntersecting)})},{rootMargin:"-30% 0px -30% 0px",threshold:0});
    cards.forEach(function(c){fio.observe(c)});
  }else cards.forEach(function(c){c.classList.add("in-focus")});

  /* ---------- 6. email: click/tap copies it (no mail app pops up on phones) ---------- */
  var mail=document.querySelector(".hero-mail");
  if(mail){
    var addr=mail.querySelector(".addr").textContent.trim(),note=mail.querySelector(".copied"),nt=null;
    function copied(ok){note.textContent=ok?"Copied":"Select to copy";mail.classList.add("done");clearTimeout(nt);nt=setTimeout(function(){mail.classList.remove("done");note.textContent=""},1600)}
    function copy(){
      if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(addr).then(function(){copied(true)},function(){copied(false)})}
      else{var t=document.createElement("textarea");t.value=addr;t.setAttribute("readonly","");t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
        var ok=false;try{ok=document.execCommand("copy")}catch(e){}document.body.removeChild(t);copied(ok)}
    }
    mail.addEventListener("click",copy);
    mail.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();copy()}});
  }

  /* ---------- one loop, paused when off screen ---------- */
  var cubeOn=true,heroOn=true,last=null;
  if("IntersectionObserver" in window){
    if(cube)new IntersectionObserver(function(es){cubeOn=es[0].isIntersecting},{threshold:0}).observe(cube);
    if(portrait)new IntersectionObserver(function(es){heroOn=es[0].isIntersecting},{threshold:0}).observe(portrait);
  }
  if(reduce){if(cube)drawCube(1800);if(tree)drawTree(900);return}
  function loop(t){
    var dt=last===null?16:Math.min(64,t-last);last=t;
    if(cube&&cubeOn){cubeRate+=(cubeTarget-cubeRate)*Math.min(1,dt/300);cubeT+=dt*cubeRate;drawCube(cubeT)}
    if(tree&&cubeOn){treeRate+=(treeTarget-treeRate)*Math.min(1,dt/300);treeT+=dt*treeRate;drawTree(treeT)}
    if(portrait&&heroOn){
      speed+=(target-speed)*Math.min(1,dt/350);    /* ease towards the target speed: no jumps */
      ang=(ang+BASE*speed*dt/1000)%360;
      orbit.style.transform="rotate("+ang.toFixed(2)+"deg)";
      ring.style.transform="rotate("+ang.toFixed(2)+"deg)";        /* the coloured border turns with the dots: same angle, same speed */
      img.style.transform="rotate("+(-ang).toFixed(2)+"deg)";      /* the face stays upright */
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  var idle=window.requestIdleCallback||function(f){setTimeout(f,2500)};
  idle(function(){document.querySelectorAll(".demo img[data-gif]").forEach(function(im){var p=new Image();p.src=im.dataset.gif})});
})();
