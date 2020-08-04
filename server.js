const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'w311U~mE',
    database : 'sacredide-db'
  }
});


// db.select('*').from('users').then(data=>{
// 	console.log(data);
// });


const app = express();


app.use(bodyParser.json());
app.use(cors())



app.get('/',(req,res)=>{
	res.json(database.users);
})


app.post('/signin',(req,res) => {
	const {email,password} = req.body;
	if(!email||!password){
		return res.status(400).json('incorrect form submission');
	}
	db.select('email','hash').from('login')
	.where('email', '=' ,email)
		.then(data =>{
			const isValid = bcrypt.compareSync(password,data[0].hash);
			if(isValid){
				return db.select('*').from('users')
				.where('email','=',email)
				.then(user =>{
						res.json(user[0])
				})
				.catch(err =>{
					 res.status(400).json('unable to get user')
				})
			}
			else{
				res.status(400).json('wrong credentials')
			}
		})
		.catch(err => {
			res.status(400).json('error logging in')
		})
})

app.post('/register',(req,res)=>{
	const {email,name,password} = req.body;

	if(!email||!password||!name){
		return res.status(400).json('incorrect form submission');
	}

	const hash = bcrypt.hashSync(password);

	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
			return trx('users')
				.returning('*')
				.insert({
					email:loginEmail[0],
					name:name,
					joined:new Date()
				})
				.then(user =>{
					res.json(user[0]);
				})
				
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})

	.catch(err => {
		res.status(400).json('unable to register');
	})

})

app.get('/profile/:id',(req,res) => {
	const { id } = req.params;
	db.select('*').from('users').where({id})
	 .then(user =>{
	 	if(user.length){
			res.json(user[0]);
	 	}
	 	else{
	 		res.status(404).json('Not found');
	 	}
	})
	  .catch(err=>{
	  	res.status(404).json('error getting user');
	  })
})

app.put('/code',(req,res) =>{
	const { id } = req.body;
  db('users').where('id', '=', id)
  .increment('submissions',1)
  .returning('submissions')
  .then(submissions =>{
  	res.json(submissions[0]);
  })
  .catch(err=>{
  	res.status(400).json('unable to get submissions')
  })
})




app.listen(process.env.PORT || 3000,()=> {
	console.log(`app is running on port ${process.env.PORT}`);
})


//Syncronous

// var hash = bcrypt.hashSync("bacon");

// bcrypt.compareSync("bacon", hash); // true
// bcrypt.compareSync("veggies", hash); // false

//Asynchronous

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });



