"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var app = express();
var payTemplate = require('fs').readFileSync('./pay.xml', 'utf8');
var uuid = require('uuid');
var sha1 = require("crypto-js/sha1");
var https = require('https')

var card;
// var card =  { RESULT: '00',
//   AUTHCODE: '12345',
//   MESSAGE: '[ test system ] AUTHORISED',
//   PASREF: '14577645138528334',
//   AVSPOSTCODERESULT: 'M',
//   AVSADDRESSRESULT: 'M',
//   CVNRESULT: 'M',
//   ACCOUNT: 'internet',
//   MERCHANT_ID: 'hackathon3',
//   ORDER_ID: 'order-64611',
//   TIMESTAMP: '20160313063425',
//   CARD_PAYMENT_BUTTON: 'Save Card',
//   MERCHANT_RESPONSE_URL: 'https://dce9d4ec.ngrok.io/registered',
//   VALIDATE_CARD_ONLY: '1',
//   CARD_STORAGE_ENABLE: '1',
//   pas_uuid: '3db74095-3275-47d7-a759-2f8a4a399bac',
//   REALWALLET_CHOSEN: '1',
//   PAYER_SETUP: '00',
//   PAYER_SETUP_MSG: 'Successful',
//   SAVED_PAYER_REF: '3621434e-a8c4-45ed-ace9-f77dc008263b',
//   PMT_SETUP: '00',
//   PMT_SETUP_MSG: 'Successful',
//   SAVED_PMT_TYPE: 'VISA',
//   SAVED_PMT_REF: 'fc347e3e-eb72-4e9f-8007-66ccceae377e',
//   SAVED_PMT_DIGITS: '426397xxxx5262',
//   SAVED_PMT_EXPDATE: '0317',
//   SAVED_PMT_NAME: 'Mr F Adeyemi',
//   SHA1HASH: '4634fedd1de24308ffb376102a95213f7866368e',
//   BATCHID: '-1' };

var prescriptions = [
		{
			name: 'Insulin',
			id: 'cvhbjnkm',

		}
]

function sendPayment(timestamp, merchantid,orderid, currency, amount, payerref, pmtref, hash){
	return payTemplate
	.replace('{{timestamp}}', timestamp)
	.replace('{{merchantid}}', merchantid)
	.replace('{{orderid}}', orderid)
	.replace('{{currency}}', currency)
	.replace('{{amount}}', amount)
	.replace('{{payerref}}', payerref)
	.replace('{{pmtref}}', pmtref)
	.replace('{{hash}}', hash)
}

const force2d = (num) => ('0' + num).slice(-2);

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

app.get('/makepayment/:amount', function (req, res) {
	const now = new Date();
	const force2d = (num) => ('0' + num).slice(-2);
	const timestamp = [
			now.getFullYear(),
			force2d(now.getMonth()+1),
			force2d(now.getDate()+1),
			force2d(now.getHours()),
			force2d(now.getMinutes()),
			force2d(now.getSeconds())
		].join('');
	const amount = req.params.amount;
	const merchantid = 'hackathon3';
	const orderid = uuid.v4();
	const currency = 'GBP';

	if (card){
		const payerref = card.SAVED_PAYER_REF;
		const pmtref = card.SAVED_PMT_REF;
		var hash = [timestamp, merchantid, orderid,amount, currency, payerref].join('.');
		hash = sha1(sha1(hash) + '.secret').toString();
		var xml = sendPayment(
			timestamp,
			merchantid,
			orderid,
			currency,
			amount,
			payerref,
			pmtref,
			hash
		);
		var options = {
		  hostname: 'epage.sandbox.payandshop.com',
		  path: '/epage-remote.cgi',
		  method: 'POST',
		  headers: {
		    'Content-Type': 'application/xml',
		  }
		};
		var post = https.request(options, (_res) =>  _res.pipe(res));
		post.write(xml);
		post.end();
	}
	else res.sendStatus(400);
})

app.post('/registered', urlencodedParser, function (req, res) {
	card = req.body;
	console.log('card saved!')
	res.send('<script>window.location = "https://dce9d4ec.ngrok.io/#/registered";</script>')
});

app.use(express.static('public/app'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});