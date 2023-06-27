---
title: Migrating from Web Transfer API to Media Shuttle SDK
date: "2021-07-21"
slug: /media-shuttle/migrating-web-transfer-api-to-media-shuttle-sdk
---

## Introduction

The Media Shuttle SDK supports accelerated file transfers for modern JavaScript frameworks as an [npm module](https://www.npmjs.com/package/@signiant/media-shuttle-sdk). The Media Shuttle SDK supersedes the Web Transfer API (Web TAPI) JavaScript library that is no longer available, and it is recommended that any existing applications should migrate to the updated module to ensure continuity of support and additional functionality.

For more information about the SDK and how to get started with the Media Shuttle SDK, see the [SDK Documentation](https://github.com/Signiant/developer-portal/blob/main/docs/mediashuttle/getting-started-ms-sdk.md).

## Differences

Updating to the Media Shuttle SDK requires significant modification to your application to work with the new entry point, transfer objects and functions, and authentication requirements.

Web TAPI uses an API key from the [Transfer API Key Manager](https://developer.mediashuttle.com), a transfer server address, user name, password and trust certificate in order to establish authentication and
transfer content. Media Shuttle SDK requires a user name, password and a Media Shuttle account name and portal name.

**Note**: The Media Shuttle SDK does not automatically detect the Signiant App, and does not provide [app-less transfer](https://help.signiant.com/media-shuttle/signiant-app/transferring-without-signiant-app) functionality.


<table>
  <th></th>
  <th>Web Transfer API</th>
  <th>Media Shuttle SDK</th>
  <tr>
    <td class="comparison">Entry Point</td>
    <td class="comparison">
      <code class="prettyprint">Signiant.Mst</code>
    </td>
    <td class="comparison">
      <code class="prettyprint">MediaShuttleResourceFactory</code>
    </td>
  </tr>
  <tr>
    <td class="comparison">Transfer Object</td>
    <td class="comparison">
      <code class="prettyprint">new&nbsp;Signiant.Mst.Upload()</code>
    </td>
    <td class="comparison">
      <code class="prettyprint">
        MediaShuttleResourceFactory.generateUpload(options)
      </code>
    </td>
  </tr>
  <tr>
    <td class="comparison">Authentication Requirements</td>
    <td class="comparison">
      <code class="prettyprint">
        apikey <br /> defaultServer <br /> userName <br /> password <br />{" "}
        trustCertificate
      </code>
    </td>
    <td class="comparison">
      <code class="prettyprint">
        userName <br /> password <br /> accountName <br />
        portalName
      </code>
    </td>
  </tr>
  <tr>
    <td class="comparison">Signiant App Detection</td>
    <td class="comparison">Yes</td>
    <td class="comparison">No</td>
  </tr>
  <tr>
    <td class="comparison">Signiant App Required </td>
    <td class="comparison">No</td>
    <td class="comparison">Yes</td>
  </tr>
</table>


## Migration Tutorial

This tutorial will use an existing Web TAPI application to demonstrate how to convert a file transfer integration using the Media Shuttle SDK.

To get started, **fork** and **clone** this repository which contains the following applications:

- `local_storage.html` - a sample application using the **Web Transfer API** and a Flight Deck agent that will act as a starting point.
- `local_storage_migrated.html` - a completed example application using the **Media Shuttle SDK** and a Media Shuttle Share portal.

Both applications will upload content to an Amazon S3 bucket.

The repository also includes a sample integration in the `ms-sdk` directory.

### Requirements

The [Getting Started documentation](https://github.com/Signiant/developer-portal/blob/main/docs/mediashuttle/getting-started-ms-sdk.md) outlines the requirements to use the Media Shuttle SDK.

You will require the following account information:

- The Media Shuttle account name (`accountName`)
- Valid Media Shuttle account information `(userName` and `password`)
- The destination Share Portal name (`portalName`)
- The destination folder path (`destinationFolderPath`)

**Note**: The destination folder path is set to the portal root by default.

### Creating the Module

1. Create a new folder for the migration and copy the `local_storage.html` example file from the `web-tapi-to-mediashuttle-sdk` repository into a working directory and navigate to the directory:

   **Linux:**

   ```bash
   mkdir tapi-migration
   cp /path/to/repository/web-tapi-to-mediashuttle-sdk/local_storage.html tapi-migration/local_storage.html
   cd tapi-migration
   ```

   **Windows:**

   ```bash
   mkdir tapi-migration
   copy /path/to/repository/web-tapi-to-mediashuttle-sdk/local_storage.html tapi-migration/local_storage.html
   cd tapi-migration
   ```

2. In the `tapi-migration` folder, make a copy of `local_storage.html` with the file name `local_storage_migrated.html`.

   **Linux:**

   ```bash
   cp local_storage.html local_storage_migrated.html
   ```

   **Windows:**

   ```bash
   copy local_storage.html local_storage_migrated.html
   ```

3. In the `tapi-migration` folder, create and navigate to a new folder called `ms-sdk`:

   ```bash
   mkdir ms-sdk
   cd ms-sdk
   ```

4. Use npm to install the `webpack-cli` and `webpack-dev-server` modules:

   ```bash
   npm install webpack webpack-cli webpack-dev-server --save-dev
   ```

5. Create a `webpack.config.js` with the following content:

   ```javascript
   const path = require("path")
   var webpack = require("webpack")

   module.exports = {
     entry: "./src/index.js",
     mode: "none",
     output: {
       filename: "mediashuttle-bundle.js",
       path: path.resolve(__dirname, ".."),
     },
   }
   ```

   The webpack configuration uses the `./src/index.js` script as the application entry point, and will create a bundle named `mediashuttle-bundle.js` in the parent folder once compiled.

6. Use npm to install the Media Shuttle SDK module:

   ```
   npm install @signiant/media-shuttle-sdk
   ```

7. Create a `src` directory

   ```
   mkdir src
   ```

8. Create an `index.js` file in the `ms-sdk/src` folder and add the following code to the file:

   ```javascript
   import * as MediaShuttleSDK from "@signiant/media-shuttle-sdk"

   function initializeMSObject(userName, password) {
     let creds = new MediaShuttleSDK.LoginCredentials({
       username: userName, // A valid user name must be included
       password: password, // A valid password must be included
     })
     return new MediaShuttleSDK.MediaShuttleResourceFactory(creds, {
       platformApiEndpoint:
         "https://platform-api-service.services.cloud.signiant.com",
       messagingServiceUrl:
         "https://messaging-config-service.services.cloud.signiant.com",
     })
   }

   function getPortalOptions(
     mediaShuttleResourceFactory,
     accountName,
     portalName
   ) {
     return mediaShuttleResourceFactory
       .getExplorer()
       .listAccounts(true)
       .then(resp => {
         const acct = resp.mediaShuttleAccounts.find(
           item => item.name === accountName
         )
         if (typeof acct === "undefined") {
           console.log("Returning undefined acct")
           return undefined
         }
         return acct
       })
       .then(acct => {
         let accountId = acct.accountId
         let serviceId = acct.serviceId
         // Return new promise
         return new Promise(function (resolve, reject) {
           mediaShuttleResourceFactory
             .getExplorer()
             .listPortals({
               accountId: accountId,
               serviceId: serviceId,
             })
             .then(portals => {
               resolve({
                 acct: acct,
                 portals: portals,
               })
             })
         })
       })
       .then(res => {
         console.log(res.portals)
         const sharePortal = res.portals.find(
           portal => portal.type === "Share" && portal.name === portalName
         )
         console.log(sharePortal)
         if (typeof sharePortal === "undefined") {
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
       })
   }

   function createUploadObject(
     mediaShuttleResourceFactory,
     portalOptions,
     destinationFolderPath
   ) {
     let uploadOptions = {}
     uploadOptions.portalId = portalOptions.portalId
     uploadOptions.serviceId = portalOptions.serviceId
     uploadOptions.accountId = portalOptions.accountId
     uploadOptions.force = true
     uploadOptions.destinationPath = destinationFolderPath
     return mediaShuttleResourceFactory
       .generateUpload(uploadOptions)
       .then(uploader => {
         return uploader
       })
       .catch(err => {
         return undefined
       })
   }

   function stageUpload(uploader, callback) {
     // open a file selector and add files to the uploader
     uploader.addFiles().then(files => {
       console.log(JSON.stringify(files))
       // start uploading the selected files through the callback function
       callback(undefined, files)
     })
   }

   window.initializeMSObject = initializeMSObject
   window.getPortalOptions = getPortalOptions
   window.stageUpload = stageUpload
   window.createUploadObject = createUploadObject
   ```

The `src/index.js` exposes functions to initialize `MediaShuttleResourceFactory`, to get portal options needed for transfer, and to get an upload object.

### Compile the Module

After completing the `index.js` example file, compile it as a module using npm:

```
npm run build
```

The `mediashuttle-bundle.js` file is created in the `tapi-migration` folder, and is ready to use in the `local_storage_migrated.html` example file.

### Implement New Script

Replace all scripts imported for Web TAPI with the bundled script out of webpack:

```diff-html
- <script src='https://example.com/transfer-api/2.7.4/transferapi.min.js' type='text/javascript'></script>
+ <script src='https://example.com/path/to/library/mediashuttle-bundle.js' type='text/javascript'></script>
```

### Replace authentication variables

Replace all variables used by Web TAPI for authentication:

```diff-javascript
- var apikey = '...';
- var defaultServer = '....';
- var userName = '....';
- var password = '....';
- var trustCertificate = '...'
+ var userName = '....';
+ var password = '....';
+ var accountName = '.....';
+ var portalName = '....';
```

### Replace/Add global transfer variables

Replace the global transfer variable for upload used by WebTAPI with the SDK transfer variables.

```diff-javascript
- var transferObject = null;
+ var mediaShuttleResourceFactory = null;
+ var transferObject = null;
+ var portalOptions = null;
+ var uploadOptions = null;
```

### Replace on page ready function

In this example, when the page is ready, the function `checkForSigniant` is called to create the Signiant library, and then initialize the transfer object when the call succeeds. When migrating the application, you must modify the implementation of that function to call the Media Shuttle SDK entry point, `mediaShuttleResourceFactory`, and fallback on error. This is achieved by leveraging the `initializeMSObject` and `getPortalOptions` functions included in the JavaScript bundle.

```javascript
function checkForSigniant(failQuick) {
  console.log("Check for Signiant App")
  mediaShuttleResourceFactory = initializeMSObject(userName, password)
  if (mediaShuttleResourceFactory == undefined) {
    appNotLoaded()
  } else {
    let opts = getPortalOptions(
      mediaShuttleResourceFactory,
      accountName,
      portalName
    )
    const getOpts = () => {
      opts.then(val => {
        console.log(val)
        if (val == undefined) {
          appNotLoaded()
        } else {
          portalOptions = val
        }
      })
    }
    getOpts()
  }
}
```

**Note**: The Media Shuttle SDK does not prompt the user to install the Signiant App if it is not automatically detected. If this is required for your application, reach out to the [Signiant Developer Experience Team](mailto:signiantdeveloperexperience@signiant.com) for more information.

### Create a transfer upload object

Using the following code sample, create a transfer upload object through the `initializeUploadObject()` function. We will implement the function in the application by using the `createUploadObject` function included in the new library:

```javascript
function initializeUploadObject() {
  //create a new upload Object
  let promise = createUploadObject(
    mediaShuttleResourceFactory,
    portalOptions,
    destinationFolderPath
  )
  const getTransferObject = () => {
    promise.then(val => {
      console.log(val)
      if (val !== undefined) {
        transferObject = val
        console.log("Transfer object ", transferObject)
      }
    })
  }
  getTransferObject()
}
```

Add the following code to use the Media Shuttle SDK to select files:

```javascript
function chooseFiles() {
  if (transferObject !== undefined) {
    transferObject.addFiles().then(files => {
      // start uploading the selected files through the callback function
      callbackUpload(undefined, files)
    })
    console.log("choose files: ", portalOptions)
  }
}

/**
 * Callback when the file picker is closed.
 *
 * @return null
 */

var callbackUpload = function (event, selectedFiles) {
  console.log(JSON.stringify(selectedFiles))
  if (transferObject !== undefined) {
    transferObject.start()
    //modify the UI
    $("#contentUploadText").html("Starting upload...")
    $("#contentListing").fadeTo(1000, 0.3)
    $("#contentUpload").on("click", cancelUpload)
  }
}
```

**Note**: This sample application does not include the file progress and events handling.
