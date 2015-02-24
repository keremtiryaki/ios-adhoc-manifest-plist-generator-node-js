var host			=		"CHANGEME";
//var host			=		"http://localhost:5000/";
var express			=		require("express");
var multer			=		require('multer');
var app				=		express();
var done			=		false;
var uploadPath		=		host+"appbox/uploads/";
var uploadLocalPath	=		__dirname + "/public/appbox/uploads/";
var fs				=		require('fs');
var appsJsonFile	=		__dirname + "/public/appbox/apps.json";
var appsHtmlFile	=		__dirname + "/public/appbox/appbox.html";
var http			=		require('http');
app.use(express.static(__dirname + '/public'));
 
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.set('port', (process.env.PORT || 5000));

app.use(multer({ dest: './public/appbox/uploads/',
	rename: function (fieldname, filename) {
		return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
	},
	limits: {
		fieldNameSize: 200,
		files: 2,
		fields: 5
	},
	onFileUploadStart: function (file) {
		console.log(file.originalname + ' is starting ...')
	},
	onFileUploadComplete: function (file) {
		console.log(file.fieldname + ' uploaded to  ' + file.path)
		done = true;
	}
}));

app.get('/',function(req,res){
	var appsObj = getAppsJson();
	res.render('index', { title: 'Apps',appsObj:appsObj,host:host });
});

app.get('/getManifest',function(req,res){
	//host = req.protocol + "://" + req.headers.host + "/";
	res.set('Content-Type', 'application/x-plist');
	var id = req.query.appId;
	var appsObj = getAppsJson();
	appsObj[id].host = host;
	res.render('manifest', appsObj[id]);
});

app.post('/api/addApp',function(req,res){
	if(done == true){
		var appObj = req.files;
		appObj["bundleId"] = req.body.bundleId;
		appObj["appName"] = req.body.appName;
		appObj["ipaFile"] = appObj["ipaFile"].name;
		appObj["provisionFile"] = appObj["provisionFile"].name;
		addAndNewApp(appObj["bundleId"],appObj["appName"],appObj["ipaFile"],appObj["provisionFile"]);
		res.redirect('/');
	}
});

function addAndNewApp(bundleId,appName,ipaFile,provisionFile){
	var appObj = {};
	var date = Date.now();
	var id = date.toString();
	appObj["id"] = id;
	appObj["bundleId"] = bundleId;
	appObj["appName"] = appName;
	appObj["ipaFile"] = ipaFile;
	appObj["provisionFile"] = provisionFile;
	addAppToJsonFile(appObj);
	fs.writeFileSync(uploadLocalPath+"manifest"+id+".plist", getManifestText(appObj));
}

app.get('/api/remove',function(req,res){
	//res.writeHead(200, {'Content-Type': 'application/json'});
	removeAppById( req.query.appId );
	//res.end( JSON.stringify( true ) );
	res.redirect('/');
});

function getAppsHtml(appsObj){
	var html = "<html>\n"+
	"  <head>\n"+
	"    <title>Apps list</title>\n"+
	"  </head>\n"+
	"  <body>\n"+
	"  <a href='/'>Add new app page</a>\n"+
	"  <table width='100%' border='1'>\n"+
	"  	<tr>\n"+
	"		<td>\n"+
	"			Name\n"+
	"		</td>\n"+
	"		<td>\n"+
	"			Provision\n"+
	"		</td>\n"+
	"		<td>\n"+
	"			Download link\n"+
	"		</td>\n"+
	"		<td>\n"+
	"			\n"+
	"		</td>\n"+
	"	</tr>\n";
	var ids = Object.keys(appsObj);
	for(var i=0; i< ids.length; i++){
		var id = ids[i];
		html = html +"<tr>\n"+
		"			<td>\n"+
						appsObj[id].appName+
		"			</td>\n"+
		"			<td>\n"+
		"				<a href='"+ uploadPath + appsObj[id].provisionFile+"'>provision file</a>\n"+
		"			</td>\n"+
		"			<td>\n"+
		"				<a href='itms-services://?action=download-manifest&url="+uploadPath+"/manifest"+appsObj[id].id+".plist'>download ipa</a>\n"+
		"			</td>\n"+
		"			<td>\n"+
		"				<a href='/api/remove?appId="+id+"'>remove</a>\n"+
		"			</td>\n"+
		"		</tr>\n"+
		"		\n";
	}
	html = html+ "  </table>\n"+
	"</html>\n";
	
	return html;
}


function getManifestText(appObj){
	return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+
"<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">"+
"<plist version=\"1.0\">"+
"<dict>"+
"	<key>items</key>"+
"	<array>"+
"		<dict>"+
"			<key>assets</key>"+
"			<array>"+
"				<dict>"+
"					<key>kind</key>"+
"					<string>software-package</string>"+
"					<key>url</key>"+
"					<string>"+uploadPath+appObj.ipaFile+"</string>"+
"				</dict>"+
"				<dict>"+
"					<key>kind</key>"+
"					<string>full-size-image</string>"+
"					<key>needs-shine</key>"+
"					<true/>"+
"					<key>url</key>"+
"					<string>"+host+"iOS-512.png</string>"+
"				</dict>"+
"				<dict>"+
"					<key>kind</key>"+
"					<string>display-image</string>"+
"					<key>needs-shine</key>"+
"					<true/>"+
"					<key>url</key>"+
"					<string>"+host+"iOS-57.png</string>"+
"				</dict>"+
"			</array>"+
"			<key>metadata</key>"+
"			<dict>"+
"				<key>bundle-identifier</key>"+
"				<string>"+appObj.bundleId+"</string>"+
"				<key>kind</key>"+
"				<string>software</string>"+
"				<key>subtitle</key>"+
"				<string>"+appObj.appName+"</string>"+
"				<key>title</key>"+
"				<string>"+appObj.appName+"</string>"+
"			</dict>"+
"		</dict>"+
"	</array>"+
"</dict>"+
"</plist>";
}

function removeAppById(appId){
	var appsObjNew = {};
	if (fs.existsSync(appsJsonFile)) {
		var appsObjOld = getAppsJson();
		var ids = Object.keys(appsObjOld);
		for(var i=0; i < ids.length;i++){
			var oldId = ids[i];
			if(oldId != appId){
				appsObjNew[oldId] = appsObjOld[oldId];
			}
		}
		saveAppsObj(appsObjNew);
	}
}

// function removeFilesOfAppId(appId){
// 	fs.unlinkSync()
// }

function addAppToJsonFile(appObj){
	var appsObj = {};
	if (fs.existsSync(appsJsonFile)) {
		appsObj = getAppsJson();
	}
	appsObj[appObj.id] = appObj ;
	saveAppsObj(appsObj)
}

function saveAppsObj(appsObj){
	fs.writeFileSync(appsJsonFile, JSON.stringify(appsObj, null, 4));
	fs.writeFileSync(appsHtmlFile, getAppsHtml(appsObj)); 
}

function getAppsJson(){
	return JSON.parse(fs.readFileSync(appsJsonFile, 'utf8'));
}

var isCommand = false;
console.log("process.argv.length:"+process.argv.length);
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
  if(index == 2 && val == "genlinks"){
  	isCommand = true;
  }
});

if(!isCommand){
	app.listen(app.get('port'), function() {
		console.log("Node app is running at localhost:" + app.get('port'));
	});
}else{
	addAndNewApp(
		process.argv[3],  //bundleId,
		process.argv[4],  //appName,
		process.argv[5],  //ipaFile,
		process.argv[6]   //provisionFile
	);
}