# Truck Parking Location Add-in

This sample add-in leverages demonstrates using a truck parking location API, to help truckers find parking at the end of their driving hours.

- Dispaly localized truck parking locations on Google Maps
- Provide route distance and duration information using Google Directions API
- Estimate location name using Google Places API
- Link to native device navigation for turn by turn directions to parking location


## Installation

Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Drive Trucker",
  "supportEmail": "support@geotab.com",
  "version": "0.0.1",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/addin-drive-trucker@master/truck-parking-addin/dist/driveTrucker.html",
    "path": "DriveAppLink/",
    "menuName": {
      "en": "Drive Trucker"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/addin-drive-trucker@master/truck-parking-addin/dist/images/icon.svg"
  }]
}
```
