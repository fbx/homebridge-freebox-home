<p align="center">
  <img src="https://github.com/fbx/homebridge-freebox-home/raw/master/logo.png" data-canonical-src="https://github.com/fbx/homebridge-freebox-home/raw/master/logo.png" width="232" height="120" />
</p>

# homebridge-freebox-home
A NodeJS gateway to interface the Freebox Home API and a Homebridge server, setting up a minimalist version of the Freebox Home APIs.

### What it does ?
The homebridge-freebox-home, once started will require access to your freebox as a regular app (you need to allow it through the screen of your Freebox Server) and will setup a homebridge configuration file with your Freebox's connected and supported devices.
It currently supports all the sensors (door/window and motion), the security system and the camera.

### Usage

- First install dependencies
```
npm install
npm run homebridge-install
```
- Start Homebridge

You can simply start Homebridge by typing :
```
homebridge
```
We recommand using a node process manager such as `pm2`.
```
pm2 start /usr/local/bin/homebridge
```
- Then start the server

```
npm run start -- auto-auth
```

That will automatically setup the environement, pair to the local freebox server and build the homebridge config file.
So you might want to stay near the freebox to allow the app through the LCD screen.

- Grant access to the server *via* Freebox OS

Go into the preference of FreeboxOS to allow the app to access you home items and camera :
`Paramètres de la Freebox` > `Gestion des accès` and allow the `homebridge-freebox-home` app to access *Home* and *Camera* (you can disable other unused rights).

- Create the Homebridge conf file

In your browser go to url : `http://{host}:8888/api/homebridge/conf`replacing {host} the ip of the host machine.

Make sure it returns `true`, then simply restart your Homebridge instance. If you are using `pm2`, simply type
```
pm2 restart Homebridge
```

## The actual Freebox API
The Freebox home api is a very complex API, with many endpoints, and many data and information. These data are supposed to be used in clients for the Home features of the Freebox Delta such as the Freebox companion mobile app, used to manage and configure every aspect of the Freebox Home Security items (camera, sensors, alarm...).

The point of this project is to build a minimalist version of these endpoints to be able to simply communicate the states of your freebox items to other apps and services such as Homebridge.
The main purpose is indeed to build a bridge between Homebridge and the Freebox Home API.

## Abialable endpoints
Few endpoint are exposed in this API such as :

| Endpoint                 | Description                                                                              |
|--------------------------|------------------------------------------------------------------------------------------|
| /api/node/{id}           | Will return the state of a specified node right now.*                                    |
| /api/homebridge/conf     | Use this endpoint to manually request a configuration file for homebridge.               |
| /api/homebridge/conf/alarm| Use this endpoint to manually request a configuration file for homebridge that inclues the alarm.|
| /api/homebridge/restart/| Simply restart homebridge.|

Check the wiki for a complete documentation.

## Limitations
The current Freebox API do not allow the request of rights for an App.
So when you start the server, make that, after having allowed the app (by taping the ✅ on the box's display), to log into freebox OS (http://mafreebox.freebox.fr/), go into "Paramètres de la Freebox" > "Gestion des accès" and allow the "homebridge-freebox-home" app to access *Home* (you can disable other unused rights).
