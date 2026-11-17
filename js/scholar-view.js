/* Only the date of the Google Scholar snapshot that feeds the co-authorship network
   (data/scholar.js, written by tools/fetch_scholar.py). Citation numbers are deliberately not shown. */
(function(){
  var S=window.SCHOLAR,u=document.getElementById("schUpdated");
  if(S&&u)u.textContent="Network built from Google Scholar · updated "+new Date(S.fetched).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
})();
