const express=require('express')
const bodyParser=require('body-parser')
const mongoose=require('mongoose')
const dotenv=require('dotenv')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
dotenv.config()

const app=express();
app.use(bodyParser.urlencoded({extended:false}))
app.set('view engine','ejs')
app.use(express.static('./public'))

app.listen(process.env.PORT,()=>{
    mongoose.connect(process.env.MONGODB_URL,//its better to start the server only after the database is loaded hence put the connection inside the app.listen
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  ).then(()=> {console.log('Server Running');console.log('DB connection successfull')})
  .catch((err)=>console.log('DB connection failed',err));
})