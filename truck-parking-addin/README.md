# Truck Parking Location Add-in

This sample add-in leverages demonstrates using a truck parking location API, to help truckers find parking at the end of their driving hours.

- Dispaly localized truck parking locations on Google Maps
- Provide route distance and duration information using Google Directions API
- Estimate location name using Google Places API
- Link to native device navigation for turn by turn directions to parking location

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

- Install [nodejs](https://nodejs.org/en/) latest LTS
- Install dependencies: `npm install -g gulp-cli bower`
- Clone the samples repository `git clone https://github.com/Geotab/addin-drive-trucker.git addin-drive-trucker`
- Naviagte to the working directory `cd addin-drive-trucker/truck-parking-addin`
- Run the sample `gulp serve`

## Installation

Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Drive Trucker",
  "supportEmail": "support@geotab.com",
  "version": "0.0.1",
  "items": [{
    "url": "https://cdn.rawgit.com/Geotab/addin-drive-trucker/master/truck-parking-addin/dist/driveTrucker.html",
    "path": "DriveAppLink/",
    "menuName": {
      "en": "Drive Trucker"
    },
    "icon": "https://cdn.rawgit.com/Geotab/addin-drive-trucker/master/truck-parking-addin/dist/images/icon.svg"
  }]
}
```
