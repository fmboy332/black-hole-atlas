(function(){
  var links=[["index.html","Home"],["solar-system.html","Solar System"],["exoplanets.html","Exoplanets"],["strange-worlds.html","Strange Worlds"],["black-holes.html","Black Holes"],["pulsars.html","Pulsars"],["merger.html","Mergers"],["galaxies.html","Galaxies"],["objects.html","Objects"],["sounds.html","Sounds"],["sources.html","Sources"],["about.html","About"]];
  var cur=location.pathname.split("/").pop()||"index.html";
  var nav=document.createElement("nav");nav.className="site-nav";
  var h='<a class="brand" href="index.html">The UniVast</a><button class="nav-toggle" aria-expanded="false" aria-label="Menu">☰</button><ul>';
  links.forEach(function(l){h+='<li><a href="'+l[0]+'"'+(l[0]===cur?' class="active" aria-current="page"':'')+'>'+l[1]+'</a></li>';});
  nav.innerHTML=h+'</ul>';
  var slot=document.getElementById("site-nav");if(slot)slot.replaceWith(nav);else document.body.prepend(nav);
  nav.querySelector(".nav-toggle").addEventListener("click",function(){var o=nav.classList.toggle("open");this.setAttribute("aria-expanded",o);});
})();
