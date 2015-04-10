# INSPCTR
## the app for city management

> Project from course on mobile application development at heig-vd with Simon Oulevay and Olivier Liechti.
> made by Christian Heimann

## In General

The app is designed for staff members of a community or a city. It is concieved to create a smooth workflow to organize the issues, to handle them correctly. The app uses geolocalisation, mapbox maps, the photo functionality of devices and the google.maps.api.
The main focus was set on the userfriendlyness for the workers on the street. For them it should be simple and useful.
As base the framework ionic delivers a lot of nice features, to make an app looking good immediately! If you never tried it, you should.

## Functionality

The inspctr app has the following functionalities:

* Issue List
List with all the actual pendent issues. Indicates the actual state and if a staff member is assigned his name also.
Possible actions are:
** assign a staff member
** reject the issue (so it will not longer appear)

* My Issue List
List with the issues from the actual user. The color on the side indicates, if an issue has been updated a long time ago or just a minute… green is good, red is pretty bad…
Also the distance and the time to get to the issue are indicated. The duration represent the time needed to drive by car.
Possible actions are:
– start an issue: so the issue is in progress
– resolve an issue: so the issue is completed and will disappear from the global list
– reject an issue: so the issue will disappear from the global list and will not be considered anymore.

* Issue Map
A map that indicates all the existing issues. A popup displays the description and the image.
No further actions possible.

* New Issue
Creation of a new issue, also when needed with a new Issue Type. Here a location can be set by dragging the pin to the correct place. Also a picture can be added. The picture is uploaded to the qimg service, an url is saved in the issue. As an option for desktop devices, an url can be set manually.
An Issue can only be saved if the following elements are present:
– issue type
– description
– location
– photo
Also tags can directly be added to the issue, but are not mandatory.

* User Handling
The Login at the beginning is not an authentification! It is just to recognize which user is actually using the app.

## Additional Notes
Small changes in the web service implementation had to be done: now no checks for assignee made are made for rejection. A general manager can reject an issue from beginning – without need of attribution. This makes it less bureaucratic.
To work faster when testing on local development environnment, a thumbnail and image replacement function is integrated. This can be controlled by the config file.
I tried to use a lot of features of the ionic framework - and I think I succeeded. One of my biggest issues was at the end the callback handling. For the next project, a better strategy (with cascading or similar) will be used to handle this in a smarter way.

> The app was tested on MacOSX with Chrome and on iPhone iOS7.

## Presentation Commercial

* [You can see a video presentation of the smooth workflow on youtube.](https://youtu.be/UxbvG-bhZoY)
