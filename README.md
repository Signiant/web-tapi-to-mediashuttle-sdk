
## Introduction

Unlike Signiant Web Transfer API (aka TAPI), MediaShuttle SDK is not provided as a JavaScript file to use in HTML within \<script\> tag. MediaShuttle SDK is a Javascript/Typescript module. We recommend Webpack to bundle the SDK, your application Javascript/Typescript code using it and any additional third-party modules you use, into a single Javascript output file which can be loaded it into HTML with a \<script\> tag. For more information about the SDK and how to get started with it and webpack, please refer to the [doc](https://github.com/Signiant/developer-portal/blob/main/docs/mediashuttle/getting-started-ms-sdk.md)


## Differences

### Authentication

Web TAPI uses an API key (from https://developer.mediashuttle.com), a server address (eg. 'api-transfers.developer.mediashuttle.com'), a user name, a password and a trust certificate in order to establish authentication.

MediaShuttleSDK requires a user name, a password and a MediaShuttle. Using this information, it will authenticate and retrieve the right account and portal information needed to perform a transfer.

### Entry point

Signiant.Mst

vs

MediaShuttleResourceFactory

### Transfer object

new Signiant.Mst.Upload()

vs

MediaShuttleResourceFactory.generateUpload(options)

### Detect Signiant

MediaShuttle SDK doesn't have any explicit mechanism to detect Signiant and offer installation as Web API does. However, once the MediaShuttleResourceFactory is created, one can register for events .


## Steps

For this guide, we will use a sample application (local_storage.html) which uses TAPI to upload files to the local storage configured with the M+A. The purpose of this guide is provide tips and instructions on how to migrate this code into an application leveraging MediaShuttle SDK, and upload to a MediaShuttle portal configured with the same storage used with the M+A setup.

At the end of this guide, we will have a local_storage_migrated.html file which will perform uploads using MediaShuttle SDK to the MediaShuttle portal attached to the storage.

### Prerequisites

Please refer to the [doc](https://github.com/Signiant/developer-portal/blob/main/docs/mediashuttle/getting-started-ms-sdk.md) to get the toolchain installed for developing with MediaShuttle SDK.

Moreover, please ask your portal administrator to provide you the following :
<ul>
<li> a MediaShuttle account (<b>accountName</b>)</li>
<li> a MediaShuttle user name and password (<b>userName</b> and <b>password</b>)</li>
<li> a MediaShuttle portal (<b>portalName</b>) configured to read/write to the same storage used for the M+A setup or to a storage you intend to use for this migration</li>
<li> a destination folder path (<b>destinationFolderPath</b>) to write on the MediaShuttle storage. Default path is '/'. </li>
</ul>

### Copy and rename HTML and JS files

Create a folder for the migration (tapi-migration).

```
mkdir tapi-migration
cd tapi-migration
```


Copy the local_storage.html into it. Make a copy of local_storage.html to local_storage_migrated.html.

```
cp local_storage.html local_storage_migrated.html
```

All the changes will be done in local_storage_migrated.html.

### Install Signiant MediaShuttle SDK module and bundle it for HTML

1. Create a ms-sdk folder

```
mkdir ms-sdk; cd ms-sdk
```
2. Install webpack and confgure webpack

```
npm install webpack webpack-cli webpack-dev-server --save-dev
```
and add a webpack.config.js file as follows

```
const path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  mode: 'none',
  output: {
    filename: 'mediashuttle-bundle.js',
    path: path.resolve(__dirname, '..'),
  },
};

```
This config will use the script in ./src/index.js and create a bundle at ../mediashuttle-bundle.js

3. Install MS SDK module

```
npm install @signiant/media-shuttle-sdk
```  

4. Create and edit a script to expose MediaShuttle SDK as bundle

```
mkdir src; vi src/index.js
```

src/index.js mainly exposes functions to initialize MediaShuttleResourceFactory, to get portal options needed for transfer and to get an upload object (please note that the process is similar to get a download object).

```
window.initializeMSObject = initializeMSObject
window.getPortalOptions = getPortalOptions
window.stageUpload = stageUpload
window.createUploadObject = createUploadObject
```

The full code of src/index.js is here

```
import * as MediaShuttleSDK from '@signiant/media-shuttle-sdk';

function initializeMSObject(userName, password) {
  let creds = new MediaShuttleSDK.LoginCredentials({
                username: userName,
                password: password
              })
  return new MediaShuttleSDK.MediaShuttleResourceFactory(
    creds,
        {
          platformApiEndpoint: "https://platform-api-service.services.cloud.signiant.com",
          messagingServiceUrl: "https://messaging-config-service.services.cloud.signiant.com"
        }
      );
}

function getPortalOptions(mediaShuttleResourceFactory, accountName, portalName) {
  return mediaShuttleResourceFactory.getExplorer().listAccounts(true)
  .then((resp => {
    const acct = resp.mediaShuttleAccounts.find(item => item.name === accountName);
    if (typeof(acct) === 'undefined') {
      console.log("Returning undefined acct")
      return undefined
    }
    return acct
  }))
  .then((acct => {
    let accountId = acct.accountId
    let serviceId = acct.serviceId
    // Return new promise
    return new Promise(function(resolve, reject) {
      mediaShuttleResourceFactory.getExplorer().listPortals({
                    accountId: accountId,
                    serviceId: serviceId,
                }).then(portals => {
                  resolve({
                    acct: acct,
                    portals: portals
                  })
                })
    })
  }))
  .then((res => {
            console.log(res.portals)
            const sharePortal = res.portals.find(portal => (portal.type === "Share" && portal.name === portalName));
            console.log(sharePortal)
            if (typeof(sharePortal) === 'undefined') {
              console.log("Returning undefined portal")
              return undefined
            }
            let portalToUse = sharePortal
            let portalId = portalToUse.portalId
            return {
                portalId: portalId,
                serviceId: res.acct.serviceId,
                accountId: res.acct.accountId,
            }
    }));
}

function createUploadObject(mediaShuttleResourceFactory, portalOptions, destinationFolderPath) {
  let uploadOptions = {}
  uploadOptions.portalId = portalOptions.portalId
  uploadOptions.serviceId = portalOptions.serviceId
  uploadOptions.accountId = portalOptions.accountId
  uploadOptions.force = true
  uploadOptions.destinationPath = destinationFolderPath
  return mediaShuttleResourceFactory.generateUpload(uploadOptions)
    .then((uploader) => {return uploader})
    .catch((err) => {return undefined});
}

function stageUpload(uploader, callback) {
  // open a file selector and add files to the uploader
  uploader.addFiles().then (files => {
    console.log(JSON.stringify(files));
    // start uploading the selected files through the callback function
    callback(undefined, files)
  });
}

window.initializeMSObject = initializeMSObject
window.getPortalOptions = getPortalOptions
window.stageUpload = stageUpload
window.createUploadObject = createUploadObject

```


Create the bundle by running


```
npm run build
```  

The ../mediashuttle-bundle.js file is created in folder tapi-migration (at the same level as file local_storage_migrated.html) and it exports the functions needed to proceed with the code migration.

We are now ready to edit local_storage_migrated.html to complete the migration.


### Replace scripts

Replace all scripts imported for WebTAPI

```
<script src='https://updates.signiant.com/javascript-api/2.7.4/transferapi.min.js' type='text/javascript'></script>
```

with the bundled script out of webpack

```
<script src='mediashuttle-bundle.js' type='text/javascript'></script>
```


### Replace authentication variables

Replace all variables used by WebTAPI for authentication

```
var apikey = '...';
var defaultServer = '....';
var userName = '....';
var password = '....';
var trustCertificate = '...'
```
with MediaShuttle SDK required variables

```
var userName = '....';
var password = '....';
var accountName = '.....';
var portalName = '....';
```

### Replace/Add global transfer variables

Replace the global transfer variable for upload used by WebTAPI

```
var transferObject = null;
```
with

```
var mediaShuttleResourceFactory = null;
var transferObject = null;
var portalOptions = null;
var uploadOptions = null;
```

### Replace on page ready function

In this demo, when the page is ready, function ``checkForSigniant`` is called to create the Signiant library, and then initialize the transfer object on success. For the migration, we will modify the implementation of that function to create the MediaShuttle SDK entry point (mediaShuttleResourceFactory), and fallback on error. This is achieved by leveraging the ``initializeMSObject`` and ``getPortalOptions`` exported by our bundle


```
function checkForSigniant(failQuick) {
  console.log("Check for Signiant App");
  mediaShuttleResourceFactory = initializeMSObject(userName, password)
  if (mediaShuttleResourceFactory == undefined) {
    appNotLoaded()
  } else {
    let opts = getPortalOptions(mediaShuttleResourceFactory, accountName, portalName)
    const getOpts = () => {
      opts.then((val) => {
        console.log(val);
        if (val == undefined) {
          appNotLoaded()
        } else {
          portalOptions = val
        }
      });
    };
    getOpts()
  }
}
```

Note here that there is no support for prompting the user for installing the Signiant app if it is not available. There are other mechanisms available for that purpose which can be discussed with the Developer Experience team if you need. Reach out to your account manager to schedule a meeting.

The next step in the demo was to create a transfer upload object through function ``function initializeUploadObject()``. We will reimplement that function by using the ``createUploadObject``function of the bundle. It becomes

```
function initializeUploadObject(){
  //create a new upload Object
  let promise = createUploadObject(mediaShuttleResourceFactory, portalOptions, destinationFolderPath)
  const getTransferObject = () => {
    promise.then((val) => {
      console.log(val);
      if (val !== undefined) {
        transferObject = val
        console.log("Transfer object ", transferObject)
      }
    });
  };
  getTransferObject()
}
```

Now, with the transferObject, we can proceed by using the SDK as follows

```
function chooseFiles() {
  if (transferObject !== undefined) {
    transferObject.addFiles().then (files => {
      // start uploading the selected files through the callback function
      callbackUpload(undefined, files)
    });
    console.log("choose files: ", portalOptions)
  }
}
```

and

```
/**
 * Callback when the file picker is closed.
 *
 * @return null
*/
var callbackUpload = function(event, selectedFiles) {
  console.log(JSON.stringify(selectedFiles));
  if (transferObject !== undefined) {
    transferObject.start();
    //modify the UI
    $("#contentUploadText").html("Starting upload...");
    $("#contentListing").fadeTo(1000, 0.3);
    $("#contentUpload").on('click', cancelUpload);
  }
}
```

This sample comments out the file progress and events handling.
