var express = require('express');  
var bodyParser = require('body-parser');
var request  = require('request').defaults({ encoding: null });
var x = require('x-ray')();
var PDFDocument = require('pdfkit');

var app = express();            
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = 8001;   
var scale = 8.5/11;
var mangaHost = 'http://www.mangareader.net/';

var router = express.Router();     
router.get('/', function(req, res) {
  res.send({health:'100%',status:'It\'s Over 9000!'});
});

router.get('/manga/:name/:chapter', function(req, res) {
	var url = mangaHost+req.params.name+'/'+req.params.chapter;
    console.log('Getting all images...');
	getAllUrls(url,req.params.chapter,[],function(op){
		var doc = new PDFDocument();
        var stream = doc.pipe(res);
        getAllImages(doc,op,0);
    
        stream.on('finish',function(){
		    res.send();
        });
    });
});

function getAllUrls(url,chapter,ar,callback){
	x(url,{
		img:x('#img',{url: '@src',w: '@width',h: '@height'}),
		nextUrl:x('#navi .prevnext .next a',{url:'@href'})
	})(function(err, data) {
  		ar.push(data.img);
  		var splitChapter = data.nextUrl.url.split('/').slice(-2)[0];
  		if(chapter == splitChapter){
  			getAllUrls(data.nextUrl.url,chapter,ar,callback);
  		}else{
  			callback(ar);
  		}
  	});
}

function getAllImages(doc,ar,index){
    var img = ar[index];
    request.get(img.url,function(error,response,body){
        console.log(img.url);
        if(img.w > img.h ) doc.image(new Buffer(body),72,72,{height:648});
        else doc.image(new Buffer(body),72,72,{width:468}); 
        if(++index==ar.length){
            doc.end();
            return;
        }else{
            doc.addPage();
            getAllImages(doc,ar,index);
        }
    });
}

app.use('/', router);
app.listen(port);
console.log('Magic happens on port ' + port);
