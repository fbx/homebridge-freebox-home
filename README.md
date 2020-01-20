<p align="center">
  <img src="https://github.com/Que20/freebox-home-api/raw/master/logo.png" data-canonical-src="https://github.com/Que20/freebox-home-api/raw/master/logo.png" width="150" height="150" />
</p>

# freebox-home-api
A minimalist version of the Freebox Home API used to interact with homebridge over http plugins.

## The actual Freebox API
The Freebox home api is a very complex API, with many endpoints, and many data and information. These data are supposed to be used in clients for the Home features of the Freebox Delta such as the Freebox companion mobile app, used to manage and configure every aspect of the Freebox Home Security items (camera, connect sensors, alarm...).
The point of this project is to build a minimalist version of these endpoints to be able to simply communicate the states of your freebox items to other apps and services such as Homebridge.
The main purpose was indeed to build a bridge between Homebridge and the Freebox Home API.

## How does it looks ?
Few endpoint are exposed in this API. The endpoits are made to be very simple explicit.
Example :

| Endpoint                | Description                                                                              |
|-------------------------|------------------------------------------------------------------------------------------|
| /api/node/contactSensor | Will list all the id of the nodes that represents a contact sensor (door/window sersor). |
| /api/node/{id}          | Will return the state of a specified node right now.                                     |
| /api/node/list          | Will list all the nodes connected to the Freebox that are currently active.              |

Check the wiki for a complete documentation.

## Usage
Just start the server with the following command :

`npm start`

## Limitations
The current Freebox API do not allow the request of rights for an App.
So when you start the server, make that, after having allowed the app (by taping the ✅ on the box's display), to log into freebox OS (http://mafreebox.freebox.fr/), go into "Paramètres de la Freebox" > "Gestion des accès" and allow the Freebox-Home-API app to access *Home* and *Camera*.
