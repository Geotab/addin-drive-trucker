/**
 * Truck Parking Location Cloud Function
 * Given a location (Latitude,Longitude) and radius in km find all matching truck parking locations.  
 * Specify latitiude, longitude, radius and result limit via querystring 
 * https://SITE_URL?latutude=0.0&longitude=0.0&radius=100&limit=10
 *
 * @param {Object} request Cloud Function request context.
 * @param {Object} response Cloud Function response context.
 */
exports.truckParkingLocation = (request, response) => {

    response.set('Access-Control-Allow-Origin', "*");
    response.set('Access-Control-Allow-Methods', 'GET');

    // Imports the Google Cloud client library
    const BigQuery = require('@google-cloud/bigquery');
    const projectId = 'geotab-intelligence';

    // Creates a client
    const bigquery = new BigQuery({
        projectId: projectId,
        keyFilename: 'YOUR_KEY_FILE.json'
    });

    // set the default results limit to 10 if unspecified
    const limit = 'LIMIT ' + parseInt(request.query.limit || 10, 10);

    bigquery.query({
        query: [
            'CREATE TEMP FUNCTION RADIANS(x FLOAT64) AS (ACOS(-1) * x / 180);', 'CREATE TEMP FUNCTION PI() AS (ACOS(-1));',
            'CREATE TEMPORARY FUNCTION Distance (LatitudeFrom FLOAT64, LongitudeFrom FLOAT64, LatitudeTo FLOAT64, LongitudeTo FLOAT64) AS (ABS(6371 * 2 * ATAN2( SQRT ( (SIN(RADIANS(LatitudeTo-LatitudeFrom) / 2) * SIN(RADIANS(LatitudeTo-LatitudeFrom) / 2) + COS(RADIANS(LatitudeFrom)) * COS(RADIANS(LatitudeTo)) * SIN(RADIANS(LongitudeTo-LongitudeFrom) / 2) * SIN(RADIANS(LongitudeTo-LongitudeFrom) / 2)) ), SQRT ( 1- (SIN(RADIANS(LatitudeTo-LatitudeFrom) / 2) * SIN(RADIANS(LatitudeTo-LatitudeFrom) / 2) + COS(RADIANS(LatitudeFrom)) * COS(RADIANS(LatitudeTo)) * SIN(RADIANS(LongitudeTo-LongitudeFrom) / 2) * SIN(RADIANS(LongitudeTo-LongitudeFrom) / 2)) ) )));',
            'WITH Results as (SELECT Latitude as Lat,Longitude as Lon,City,State, ROUND(Distance(@latitude,@longitude,Latitude,Longitude),1) as DistanceKm FROM `geotab-intelligence.LocationAnalytics.TruckParkingDataset`)',
            'SELECT * FROM Results WHERE DistanceKm < @radius ORDER BY DistanceKm',
            limit
        ].join(' '),
        params: {
            latitude: parseFloat(request.query.latitude),
            longitude: parseFloat(request.query.longitude),
            radius: parseFloat(request.query.radius)
        }
    }, function (err, rows) {
        if (!err) {
            response.status(200).send(rows);
        } else {
            response.status(400).end();
        }
    });
};
