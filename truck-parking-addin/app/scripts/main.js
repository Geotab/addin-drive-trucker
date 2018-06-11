/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.driveTrucker = () => {
    'use strict';

    const GoogleMapsKey = '';
    const PointsCache = {};

    // the root container
    let elAddin;
    let elRoot;
    let observer;
    let api;
    let device;
    let directionsService;
    let mapMoveWait;
    let updateParkingWait;
    let watchId;
    let unitSystem;
    let controller = new AbortController();
    const nightMode = [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }]
        },
        {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }]
        },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }]
        },
        {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }]
        },
        {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2835' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }]
        },
        {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }]
        },
        {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
        },
        {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }]
        },
        {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }]
        }
    ];

    /**
     * Converts lat,lng values to object
     * @param  {Number} lat The latitude
     * @param  {Number} lng The longitude
     * @returns {Object} The lat,lng object
     */
    let latLng = (lat, lng) => {
        return { lat, lng };
    };

    /**
     * Crude error handler will log to console
     * @param  {any} err The error object or string message
     */
    let errorHandler = (err) => {
        console.error(err);

        // don't stop loading spinner when we cancel the fetch
        if (err.code === 20) {
            return;
        }

        elAddin.loading = false;
        return;
    };

    // The cloud function endpoint
    const DemoEndpoint = 'https://us-central1-geotab-demo-project.cloudfunctions.net';

    /**
     * Gets truck parking locations for the given location and radius
     * @param  {Object} location The lat,lng coordiantes center point
     * @param  {Number} radius The radius in meters
     * @returns {Promise} A list of parking locations
     */
    let updateParking = (location, radius) => {
        // abort any fetch which is already open and make new fetch
        controller.abort();
        controller = new AbortController();

        elAddin.loading = true;
        return fetch(`${DemoEndpoint}/truckParkingLocation?latitude=${location.lat}&longitude=${location.lng}&radius=${radius}&limit=1000`, { signal: controller.signal })
            .then(response => {
                return response.json();
            })
            .then(parking => {
                parking.forEach(location => {
                    // cache points we already looked up
                    PointsCache[`${location.Lat}x${location.Lon}`] = {
                        center: latLng(location.Lat, location.Lon)
                    };
                });

                // update markers in our vuew
                elAddin.parkingLocations = Object.values(PointsCache);
                elAddin.loading = false;
            })
            .catch(errorHandler);
    };

    /**
     * Get the route from an origin to a destination from map provider
     * @param  {Object} origin The lat,lng origin
     * @param  {Object} destination The lat,lng destination
     * @param  {String} unitSystem The users's prefered unit system
     * @returns {Promise} The route response from map provider
     */
    let getRoute = (origin, destination, unitSystem) => {
        return new Promise((resolve, rejsect) => {
            directionsService.route({
                origin,
                destination,
                travelMode: 'DRIVING',
                unitSystem
            }, (response, status) => {
                if (status === 'OK') {
                    resolve(response);
                } else {
                    reject('Directions request failed due to ' + status);
                }
            });
        });
    };

    /**
     * Estimates a place name for a location, giving priority to places we think trucks might park (fuel stations, truck stops, etc)
     * @param  {Object} location The lat,lng location to find the place name of
     * @returns {Promise} The place name
     */
    let estimatePlace = (location) => {
        return new Promise((resolve, rejsect) => {
            elAddin.$refs.mapRef.$mapPromise.then((map) => {
                // higher likleyhood this is where truck parking is
                const types = {
                    'gas_station': 1,
                    'convenience_store': 2,
                    'store': 3,
                    'restaurant': 4
                };

                // call Google places API
                let service = new google.maps.places.PlacesService(map);

                service.nearbySearch({
                    location,
                    radius: 500
                }, (places, status) => {

                    let typeNames = Object.keys(types);

                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        // filter out places not in prefered types
                        let filteredPlaces = places.filter(p => {
                            return p.types.some(t => typeNames.includes(t));
                        });

                        // sort by place type rank
                        filteredPlaces = filteredPlaces.sort((p1, p2) => {
                            const sortNumber = (a, b) => {
                                return a - b;
                            };
                            const typeToValue = p => {
                                return types[p] || 1000;
                            };
                            let vals1 = p1.types.map(typeToValue).sort(sortNumber);
                            let vals2 = p2.types.map(typeToValue).sort(sortNumber);

                            return vals1[0] - vals2[0];
                        });

                        // if there's nothing prefered, fallback to first closest place name
                        resolve(filteredPlaces.length > 0 ? filteredPlaces[0].name : places[0].name);
                    } else {
                        reject('Places request failed due to ' + status);
                    }

                });
            });
        });
    };

    /**
     * Toggle night mode map style
     * @param  {Boolean} isNightMode [true] if night mode, otherwise [false]
     */
    let toggleNightMode = isNightMode => {
        elAddin.$refs.mapRef.$mapPromise.then((map) => {
            map.setOptions({ styles: isNightMode ? nightMode : [] });
        });
    };

    return {
        /**
         * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
         * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
         * is ready for the user.
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
         *        might be doing asynchronous operations, you must call this method when the Add-In is ready
         *        for display to the user.
         */
        initialize(freshApi, freshState, initializeCallback) {
            api = freshApi;

            elRoot = document.getElementById('app');

            // setup vue to use Google maps component
            Vue.use(VueGoogleMaps, {
                load: {
                    key: GoogleMapsKey,
                    libraries: 'places'
                },
            });

            // gmapCluster *must* be manually imported
            Vue.component('gmap-cluster', VueGoogleMaps.Cluster);

            // the add-in vue
            elAddin = new Vue({
                el: '#driveTrucker',
                data() {
                    return {
                        // map center
                        center: latLng(0, 0),
                        // device center
                        marker: latLng(0, 0),
                        // map
                        zoom: 10,
                        mapOptions: {
                            styles: [],
                            mapType: 'roadmap',
                            disableDefaultUI: true,
                            gestureHandling: 'greedy'
                        },
                        // search raduis
                        radius: 200,
                        parkingLocations: [],
                        selected: {},
                        // directions polyline options
                        directions: [],
                        polylineOuterOptions: {
                            strokeColor: '#FFFFFF',
                            strokeOpacity: 1.0,
                            strokeWeight: 6,
                        },
                        polylineInnerOptions: {
                            strokeColor: '#1976d2',
                            strokeOpacity: 1.0,
                            strokeWeight: 4,
                        },
                        // info window
                        infoContent: {
                            distance: {},
                            duration: {}
                        },
                        infoWindowPos: null,
                        infoWinOpen: false,
                        currentMidx: null,
                        infoOptions: {
                            pixelOffset: {
                                width: 0,
                                height: -35
                            }
                        }
                    }
                },
                methods: {
                    /**
                     * Navigate to the selected truck parking location. Calls out to device navigation.
                     * @param  {Event} e The event
                     */
                    navigate(e) {
                        e.preventDefault();

                        let sLat = elAddin.marker.lat;
                        let sLng = elAddin.marker.lng;
                        let dLat = elAddin.selected.center.lat;
                        let dLng = elAddin.selected.center.lng;

                        let url = '';

                        if (api.mobile.exists()) {
                            // IOS
                            let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                            if (isIOS) {
                                url = `maps://?q=${dLat},${dLng}`;
                            } else {
                                // Android
                                url = `geo:${sLat},${sLng}?q=${dLat},${dLng}`;
                            }
                        } else {
                            // Browser
                            url = `https://maps.google.com/maps?saddr=${sLat},${sLng}&daddr=${dLat},${dLng}`;
                        }

                        window.open(url, '_system');
                    },
                    /**
                     * Zoom the map to a given level
                     * @param  {Number} level The zoom level
                     */
                    zoomChange(level) {
                        elAddin.zoom = level;
                    },
                    /**
                     * Update center on center changed event
                     * @param  {Object} coords The lat,lng coordiates of map center
                     */
                    centerChanged(coords) {
                        clearTimeout(mapMoveWait);
                        mapMoveWait = setTimeout(() => {
                            elAddin.center = latLng(coords.lat(), coords.lng());
                        }, 1000);
                    },
                    /**
                     * Zoom the map to a given location and zoom level
                     * @param  {Object} center The lat,lng coordiates of map center
                     * @param  {Number} zoom The zoom level
                     * @param  {Event} event The 'click' event
                     */
                    zoomMapTo(center, zoom, event) {
                        event.preventDefault();
                        elAddin.zoom = zoom;
                        elAddin.center = center;
                    },
                    /**
                     * Toggle satelite map tiles on/off
                     */
                    toggleSatelite() {
                        if (elAddin.mapOptions.mapType === 'roadmap') {
                            elAddin.mapOptions.mapType = 'satellite';
                        } else {
                            elAddin.mapOptions.mapType = 'roadmap';
                        }
                        elAddin.$refs.mapRef.$mapPromise.then((map) => {
                            map.setMapTypeId(elAddin.mapOptions.mapType);
                        });
                    },
                    /**
                     * When map bounds change update parking locations using map center point and bounds to determin radius to search.
                     */
                    boundsChanged() {
                        elAddin.$refs.mapRef.$mapPromise.then((map) => {
                            let bounds = map.getBounds();

                            var center = bounds.getCenter();
                            var ne = bounds.getNorthEast();

                            // r = radius of the earth in statute miles
                            var r = 3963.0;

                            // Convert lat or lng from decimal degrees into radians (divide by 57.2958)
                            var lat1 = center.lat() / 57.2958;
                            var lon1 = center.lng() / 57.2958;
                            var lat2 = ne.lat() / 57.2958;
                            var lon2 = ne.lng() / 57.2958;

                            // distance = circle radius from center to Northeast corner of bounds
                            var dis = r * Math.acos(Math.sin(lat1) * Math.sin(lat2) +
                                Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));

                            clearTimeout(updateParkingWait);
                            updateParkingWait = setTimeout(() => {
                                updateParking(elAddin.center, dis);
                            }, 500);
                        });
                    },
                    /**
                     * Open info window for parking location. Uses parking location to look-up route and likley place names from Google Directions and Places APIs.
                     * @param  {Object} parkingLocation The parking location (marker) details
                     * @param  {Number} idx The current marker id
                     */
                    toggleInfoWindow(parkingLocation, idx) {
                        elAddin.loading = true;

                        elAddin.selected = parkingLocation;

                        getRoute(elAddin.marker, parkingLocation.center, unitSystem)
                            .then(response => {
                                let route = response.routes[0];
                                elAddin.directions = route.overview_path;

                                let leg = route.legs[0];
                                leg.name = '...';
                                elAddin.infoContent = leg;
                                elAddin.infoWindowPos = parkingLocation.center;

                                // check if its the same marker that was selected if yes toggle
                                if (elAddin.currentMidx == idx) {
                                    elAddin.infoWinOpen = !elAddin.infoWinOpen;
                                }
                                // if different marker set infowindow to open and reset current marker index
                                else {
                                    elAddin.infoWinOpen = true;
                                    elAddin.currentMidx = idx;
                                }
                            })
                            .then(() => estimatePlace(parkingLocation.center))
                            .then(placeName => {
                                elAddin.infoContent.name = placeName;
                                elAddin.loading = false;
                            })
                            .catch(err => {
                                elAddin.infoContent.name = elAddin.infoContent.end_address;
                                errorHandler(err);
                            });
                    }
                }
            });

            VueGoogleMaps.loaded.then(() => {
                // vue Google maps loads maps api into window, create DirectionsService once the library is loaded 
                directionsService = new google.maps.DirectionsService();

                // get current user unit system which will be used to query DirectionsService for distance
                api.getSession(session => {
                    api.call('Get', {
                        typeName: 'User',
                        search: {
                            name: session.userName
                        }
                    }, results => {
                        unitSystem = results[0].isMetric ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL;
                    }, err => {
                        console.error(err);
                    });
                });
            });

            // mutation observer to see if night mode is toggled on the DOM
            observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.attributeName === 'class') {
                        toggleNightMode(mutation.target.classList.contains('nightMode'));
                    }
                });
            });

            // MUST call initializeCallback when done any setup
            initializeCallback();
        },

        /**
         * focus() is called whenever the Add-In receives focus.
         *
         * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
         * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
         * the global state of the MyGeotab application changes, for example, if the user changes the global group
         * filter in the UI.
         *
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         */
        focus(freshApi, freshState) {
            api = freshApi;

            device = freshState.device;

            // hack to better display map
            if (api.mobile.exists()) {
                let addinContent = document.querySelector('#content.addin-content');
                if (addinContent) {
                    addinContent.style.height = 'height: calc(100% - 62px) !important';
                }
            }

            // watching root for night mode css change
            observer.observe(elRoot, {
                attributes: true
            });

            // if device is in 'nightmode' toggle night mode map tiles
            toggleNightMode(document.querySelectorAll('#app.nightMode').length > 0);

            // watch device location to update on the map
            let geolocation = api.mobile && api.mobile.geolocation || navigator.geolocation;
            watchId = navigator.geolocation.watchPosition(position => {
                let location = latLng(position.coords.latitude, position.coords.longitude);
                if (!elAddin.center.lat) {
                    elAddin.center = Object.assign({}, location);
                    updateParking(location, elAddin.radius);
                }

                elAddin.marker = Object.assign({}, location);
            }, errorHandler, {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 0
                });
        },

        /**
         * blur() is called whenever the user navigates away from the Add-In.
         *
         * Use this function to save the page state or commit changes to a data store or release memory.
         *
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         */
        blur() {
            navigator.geolocation.clearWatch(watchId);
            observer.disconnect();
        }
    };
};
