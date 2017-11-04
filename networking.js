/*
	node.js를 이용하여 http 통신을 수행
	클라이언트로부터 image 데이터를 받아서 (formidable을 이용 + text데이터도 받을 수 있음)
	사용하고 json타입의 데이터를 다시 클라이언트로 보내준다
*/
var express = require('express');
var app = express();
var formidable = require('formidable');
var fs = require('fs');
var PythonShell = require('python-shell');
var finame = "";
var query = "";
var mysql = require('mysql');
var client_id = '';
var client_secret = '';
var reque = require("request");
var url = "";
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : '',
  password : '',
  port     : '',
  database : ''
});
//connection.connect();

app.listen(80,function(){ console.log('Server Start .');});

app.get('/', function(req,res){
 fs.readFile('index.html',function(err,data){
    if(err)
        console.log(err);
    else{
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data);
    }
  });
});
app.use(express.static('img'));
app.get('/send2', function (req, res) {
   var request = require('request');
   var api_url = 'https://openapi.naver.com/v1/vision/face'; // 얼굴 감지

   var _formData = {
     image:'image',
     image: fs.createReadStream(__dirname + '/img/abc.jpg') // FILE 이름
   };
    var _req = request.post({url:api_url, formData:_formData,
      headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}}).on('response', function(response) {
       console.log(response.statusCode) // 200
       console.log(response.headers['content-type'])
    });
    console.log( request.head  );
    console.log(res);
    _req.pipe(res); // 브라우저로 출력
 });


app.get('/ppap',function(req,res){
    res.send('<img src="/2.png"/>');        
});
app.post('/send', function(req, res) {
    
    var form = new formidable.IncomingForm(),
    files = [],
    fields = [];
    form.keepExtensions = true;

 form.uploadDir = __dirname;
 
 form.parse(req, function(error, field, file) {
  finame = file.userfile.name;
  var textf = __dirname + '/img/abc.jpg';   
  fs.writeFileSync("data.txt", textf, {encoding: 'utf8'});
  
  PythonShell.run('hello.py', {//파이썬 파일 실행.
     mode: 'text',
     pythonPath: '/usr/bin/python3',
     pythonOptions: ['-u'],
     scriptPath: '',
     args: ['', '', '']} , function (err, results) { // args로 인자를 보내고 results로 결과를 가져옴. 파이썬 코드는 print('result');로 되어있는곳에서 result를 가져옴.
     if (err) throw err;
     console.log('r1:'+results[0][1]+'r2:'+results[0][4]+'r3:'+results[0][7]+'r4:'+results[0][10]);

	 query = 'SELECT * from eye1 WHERE shape='+results[0][1]+' AND size='+results[0][4]+' AND frame='+results[0][7]+' AND color='+results[0][10] +' AND priceidx=2 AND rate=(SELECT max(rate) from eye1 WHERE shape='+results[0][1]+' AND size='+results[0][4]+' AND frame='+results[0][7]+' AND color='+results[0][10] +' AND priceidx=2) UNION SELECT * from eye1 WHERE shape='+results[0][1]+' AND size='+results[0][4]+' AND frame='+results[0][7]+' AND color='+results[0][10] +' AND priceidx=1 AND rate=(SELECT max(rate) from eye1 WHERE shape='+results[0][1]+' AND size='+results[0][4]+' AND frame='+results[0][7]+' AND color='+results[0][10] +' AND priceidx=1) UNION SELECT * from eye1 WHERE shape='+results[0][1]+' AND size='+results[0][4]+' AND frame='+results[0][7]+' AND color='+results[0][10] +' AND priceidx=0 AND rate=(SELECT max(rate) from eye1 WHERE shape='+results[0][1]+' AND size='+results[0][4]+' AND frame='+results[0][7]+' AND color='+results[0][10] +' AND priceidx=0) LIMIT 3';
	 //가격대별로 각각 하나씩
	 console.log('query : ' + query);

	 reque(url, function(error, response, body){
		connection.query(query, function(err, rows, fields) {
		if (!err){
			if(error) throw error;

			var data = JSON.parse(body); //body로 받아온 데이터 파싱
			var total = new Object(); //total에 모두 담아서 보내주기위해 새로운 obj 생성
			total.db = rows;
			total.gender = data.faces[0].gender;
			total.age = data.faces[0].age;		
		
			console.log('The solution is: ', total);
			res.writeHead(200, {'content-type' : 'application/json'});
			res.write(JSON.stringify(total)); //json 형태로 데이터 전달
			res.end();
		}
		else
		console.log('Error while performing Query.', err);
		});
   	});
  });//pythonshell.run

 });//form.parse
 form
  .on('field', function(field, value) {    // field 일 경우 (input 의 type 이 text 인 경우 등)
    console.log('[field] ' + field, value);
    fields.push([field, value]);
  })
  .on('file', function(field, file) { // file 일 경우 (input의 type 이 file인 경우)
    console.log('[file] ' +  field, file);
    fs.rename(file.path, form.uploadDir + '/img/abc.jpg');    // file 명 변경. abc.jpg로 고정
    files.push([field, file]);
  })
  .on('end', function() {
    console.log('-> upload done');
  })
  .on('progress', function(a, b) {    // progress event
  console.log('[progress] ' + a + ', ' + b);
  })
  .on('error', function(error) {
  console.log('[error] error : ' + error);
  });

}); // app.post





