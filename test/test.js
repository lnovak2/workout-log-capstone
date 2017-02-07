const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const should = chai.should();

const {app, runServer, closeServer} = require('../server');

chai.use(chaiHttp);

describe("Connect to server", function(){

	before(function() {
		return runServer();
	});

	after(function() {
		return closeServer();
	});

	it("should serve html page", function(){
		return chai.request(app)
		  .get('/')
		  .then(function(res){
		  	res.should.have.status(200);
		  	res.should.be.html;
		  })
	});
});