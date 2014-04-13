garmin.com.js
=============

### Overview

This Chrome plugin adds a button to connect.garmin.com/activities/ page (both themes) and allows you to post your workouts to workoutlog.com/log/.

The plugin needs CORS headers which workoutlog.com doesn't provide so I proxy the site through nginx. Due to this the https version is not used and
the login is not on https (SSL) so your user / password isn't 100% secure - use at your own risk. Nothing is stored, logged or saved - the proxy
is just a pass through without any access logs. I really don't care what your password to your workout site is :-)


### Installation

1. Save to CRX to computer
  1. https://github.com/caseman72/garmin.com.js/raw/master/extension/garmin.com.js.crx
  2. "Right Click" and select a variation of "Save As..."
  3. Save to "Desktop"

2. Open Chrome Extensions
  1. chrome://extensions/

3. Drag and Drop CRX file onto Extensions window
  1. It will ask you to add CRX file - click "Add"

4. The extension will autoupdate via github but you can click "Update Extensions Now" to force a check/update.
