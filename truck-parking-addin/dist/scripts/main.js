"use strict";geotab.addin.driveTrucker=function(){var o={},c=void 0,n=void 0,r=void 0,i=void 0,l=void 0,a=void 0,u=void 0,s=void 0,p=void 0,m=new AbortController,f=[{elementType:"geometry",stylers:[{color:"#242f3e"}]},{elementType:"labels.text.stroke",stylers:[{color:"#242f3e"}]},{elementType:"labels.text.fill",stylers:[{color:"#746855"}]},{featureType:"administrative.locality",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi.park",elementType:"geometry",stylers:[{color:"#263c3f"}]},{featureType:"poi.park",elementType:"labels.text.fill",stylers:[{color:"#6b9a76"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#38414e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#212a37"}]},{featureType:"road",elementType:"labels.text.fill",stylers:[{color:"#9ca5b3"}]},{featureType:"road.highway",elementType:"geometry",stylers:[{color:"#746855"}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#1f2835"}]},{featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#f3d19c"}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#2f3948"}]},{featureType:"transit.station",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#17263c"}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#515c6d"}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{color:"#17263c"}]}],d=function(e,t){return{lat:e,lng:t}},y=function(e){console.error(e),20!==e.code&&(c.loading=!1)},g=function(e,t){return m.abort(),m=new AbortController,c.loading=!0,fetch("https://us-central1-geotab-demo-project.cloudfunctions.net/truckParkingLocation?latitude="+e.lat+"&longitude="+e.lng+"&radius="+t+"&limit=1000",{signal:m.signal}).then(function(e){return e.json()}).then(function(e){e.forEach(function(e){o[e.Lat+"x"+e.Lon]={center:d(e.Lat,e.Lon)}}),c.parkingLocations=Object.values(o),c.loading=!1}).catch(y)},h=function(t){c.$refs.mapRef.$mapPromise.then(function(e){e.setOptions({styles:t?f:[]})})};return{initialize:function(e,t,o){i=e,n=document.getElementById("app"),Vue.use(VueGoogleMaps,{load:{key:"AIzaSyAnSFFaNTDiE1p-oiNPG8oBFvv9Z76tqQo",libraries:"places"}}),Vue.component("gmap-cluster",VueGoogleMaps.Cluster),c=new Vue({el:"#driveTrucker",data:function(){return{center:d(0,0),marker:d(0,0),zoom:10,mapOptions:{styles:[],mapType:"roadmap",disableDefaultUI:!0,gestureHandling:"greedy"},radius:200,parkingLocations:[],selected:{},directions:[],polylineOuterOptions:{strokeColor:"#FFFFFF",strokeOpacity:1,strokeWeight:6},polylineInnerOptions:{strokeColor:"#1976d2",strokeOpacity:1,strokeWeight:4},infoContent:{distance:{},duration:{}},infoWindowPos:null,infoWinOpen:!1,currentMidx:null,infoOptions:{pixelOffset:{width:0,height:-35}}}},methods:{navigate:function(e){e.preventDefault();var t=c.marker.lat,o=c.marker.lng,n=c.selected.center.lat,r=c.selected.center.lng,a="";i.mobile.exists()?a=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream?"maps://?q="+n+","+r:"geo:"+t+","+o+"?q="+n+","+r:a="https://maps.google.com/maps?saddr="+t+","+o+"&daddr="+n+","+r;window.open(a,"_system")},zoomChange:function(e){c.zoom=e},centerChanged:function(e){clearTimeout(a),a=setTimeout(function(){c.center=d(e.lat(),e.lng())},1e3)},zoomMapTo:function(e,t,o){o.preventDefault(),c.zoom=t,c.center=e},toggleSatelite:function(){"roadmap"===c.mapOptions.mapType?c.mapOptions.mapType="satellite":c.mapOptions.mapType="roadmap",c.$refs.mapRef.$mapPromise.then(function(e){e.setMapTypeId(c.mapOptions.mapType)})},boundsChanged:function(){c.$refs.mapRef.$mapPromise.then(function(e){var t=e.getBounds(),o=t.getCenter(),n=t.getNorthEast(),r=o.lat()/57.2958,a=o.lng()/57.2958,i=n.lat()/57.2958,l=n.lng()/57.2958,s=3963*Math.acos(Math.sin(r)*Math.sin(i)+Math.cos(r)*Math.cos(i)*Math.cos(l-a));clearTimeout(u),u=setTimeout(function(){g(c.center,s)},500)})},toggleInfoWindow:function(n,r){var t,a,i;c.loading=!0,c.selected=n,(t=c.marker,a=n.center,i=p,new Promise(function(o,e){l.route({origin:t,destination:a,travelMode:"DRIVING",unitSystem:i},function(e,t){"OK"===t?o(e):reject("Directions request failed due to "+t)})})).then(function(e){var t=e.routes[0];c.directions=t.overview_path;var o=t.legs[0];o.name="...",c.infoContent=o,c.infoWindowPos=n.center,c.currentMidx==r?c.infoWinOpen=!c.infoWinOpen:(c.infoWinOpen=!0,c.currentMidx=r)}).then(function(){return t=n.center,new Promise(function(r,e){c.$refs.mapRef.$mapPromise.then(function(e){var i={gas_station:1,convenience_store:2,store:3,restaurant:4};new google.maps.places.PlacesService(e).nearbySearch({location:t,radius:500},function(e,t){var o=Object.keys(i);if(t==google.maps.places.PlacesServiceStatus.OK){var n=e.filter(function(e){return e.types.some(function(e){return o.includes(e)})});n=n.sort(function(e,t){var o=function(e,t){return e-t},n=function(e){return i[e]||1e3},r=e.types.map(n).sort(o),a=t.types.map(n).sort(o);return r[0]-a[0]}),r(0<n.length?n[0].name:e[0].name)}else reject("Places request failed due to "+t)})})});var t}).then(function(e){c.infoContent.name=e,c.loading=!1}).catch(function(e){c.infoContent.name=c.infoContent.end_address,y(e)})}}}),VueGoogleMaps.loaded.then(function(){l=new google.maps.DirectionsService,i.getSession(function(e){i.call("Get",{typeName:"User",search:{name:e.userName}},function(e){p=e[0].isMetric?google.maps.UnitSystem.METRIC:google.maps.UnitSystem.IMPERIAL},function(e){console.error(e)})})}),r=new MutationObserver(function(e){e.forEach(function(e){"class"===e.attributeName&&h(e.target.classList.contains("nightMode"))})}),o()},focus:function(e,t){if(i=e,t.device,i.mobile.exists()){var o=document.querySelector("#content.addin-content");o&&(o.style.height="height: calc(100% - 62px) !important")}r.observe(n,{attributes:!0}),h(0<document.querySelectorAll("#app.nightMode").length);i.mobile&&i.mobile.geolocation||navigator.geolocation;s=navigator.geolocation.watchPosition(function(e){var t=d(e.coords.latitude,e.coords.longitude);c.center.lat||(c.center=Object.assign({},t),g(t,c.radius)),c.marker=Object.assign({},t)},y,{enableHighAccuracy:!1,timeout:5e3,maximumAge:0})},blur:function(){navigator.geolocation.clearWatch(s),r.disconnect()}}};
//# sourceMappingURL=main.js.map