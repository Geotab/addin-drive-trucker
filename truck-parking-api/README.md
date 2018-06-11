# Truck Parking Location Search API

## Overview

This demo API will accepts a location (latitude, longitude) and radius in km and searches the [data.geotab.com](data.geotab.com) dataset of [truck parking locations](https://data.geotab.com/location-analytics/truck-parking).  
The results of the search will be returned in JSON format, ordered by distance from the provided location.

The API leverages Google's [Cloud Functions](https://cloud.google.com/functions/) serverless architecture.

## Deploying the Demo API

In order to develop solutions that leverage [data.geotab.com](data.geotab.com) you will need to make a [request for a service account](https://data.geotab.com/contact/serviceAccount).

Clone this repository and replace the **YOUR_KEY_FILE.json** key file with your own, also change the reference in **index.js** to reflect the new key filename.

Finally, if you want to deploy this API using Google's [Cloud Functions](https://cloud.google.com/functions/) follow the [quickstart guide](https://cloud.google.com/functions/docs/quickstart) to sign up and enable cloud functions.

Once you have this all setup, navigate to your code directory and run the following command to deploy your function:

`gcloud beta functions deploy truckParkingLocation --trigger-http`