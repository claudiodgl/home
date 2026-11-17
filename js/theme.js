/* Theme toggle (initial theme is set inline in <head>) + active nav link. */
(function(){
  var root=document.documentElement,tb=document.getElementById("theme");
  tb.addEventListener("click",function(){
    var m=root.getAttribute("data-theme")==="light"?"dark":"light";
    root.setAttribute("data-theme",m);try{localStorage.setItem("cdgl-theme",m)}catch(e){}
    document.dispatchEvent(new CustomEvent("themechange",{detail:m}));
  });
  var links={};document.querySelectorAll('nav.links a[href^="#"]').forEach(function(a){links[a.getAttribute("href").slice(1)]=a});
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)Object.keys(links).forEach(function(k){links[k].classList.toggle("active",k===e.target.id)})})},{rootMargin:"-40% 0px -55% 0px"});
    document.querySelectorAll("section.sec[id]").forEach(function(s){io.observe(s)});
  }
})();
