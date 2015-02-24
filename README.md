# ios-adhoc-manifest-plist-generator-node-js
ios adhoc manifest plist generator creator node js

IOS Adhoc Distribution

Before deployment and before adding your new app

 Set the host config in index.js line:1


You could run and add apps easly by upload form


OR


To add a new app with command line tool


Put your ipa and provison files in this path


 projectpath/public/appbox/uploads
 
Run the command with your arguments


 node index.js genlinks <BundleId> <AppName> <IpaFile> <ProvisionFile>

For example 


Your ipad file name: app.ipa


Your provision file name: newProvision.mobileprovision


Your app's bundle id: com.company.name



Your command must be


 node index.js genlinks com.company.name name app.ipa newProvision.mobileprovision