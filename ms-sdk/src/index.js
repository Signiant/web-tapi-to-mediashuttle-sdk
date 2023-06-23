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
