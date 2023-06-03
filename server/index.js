const express=require('express')
const bodyParser=require('body-parser')
const mongoose=require('mongoose')
const dotenv=require('dotenv')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const User=require("./models/user")
const Job=require("./models/job")
dotenv.config()

const app=express();
app.use(bodyParser.urlencoded({extended:false}))
app.set('view engine','ejs')
app.use(express.static('./public'))


app.get('/',(req,res)=>{
    res.send({message:'All good'})
})
app.post('/register',async(req,res)=>{
  const{name,email,mobile,password}=req.body;

  if (!name || !email || !mobile || !password) {
    const customError = new Error('Missing required fields');
    customError.status = 400;
    return next(customError);
  }
  try
  {
    const user=await User.findOne({email});
    if(user)
    {
      return res.send(
        {
          status:"Fail",
          message:"User already exists with this email"
        }
      )
    }
  const encryptedPassword=await bcrypt.hash(password,10)

  await User.create({
    name,email,mobile,password:encryptedPassword
  })
  const jwtToken=jwt.sign(
    {name,email,mobile},
    process.env.JWT_SECRET_KEY
    )
  res.send({status:'success',message:"User created successfully",jwtToken})
  }
  catch(error)
  {
    const customError = new Error('Something went wrong! Please try again later.');
    customError.status = 500;

    next(customError);
  }
 
})
app.post('/login',async (req,res)=>{
  const{name,email,mobile,password}=req.body;
  try
  {
 const user=await User.findOne({email});
 if(user)
 {
  let passwordMatch=await bcrypt.compare(password,user.password)
  if(passwordMatch)
  {
    const jwtToken=jwt.sign(
      {name,email,mobile},
      process.env.JWT_SECRET_KEY
      )
    return res.send({
      status:'SUCCESS',
      message:"User logged in successfully",
      jwtToken
    })
  }
  }
  res.send({status:'FAIL',message:"Incorrect Credentials"})
}
catch(error)
{
  const customError = new Error('Something went wrong! Please try again later.');
    customError.status = 500;

    next(customError);
}
})

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({
    error: {
      status: err.status || 500,
      message: err.message || 'Something went wrong! Please try again later.',
    },
  });
});

app.listen(process.env.PORT,()=>{
    mongoose.connect(process.env.MONGODB_URL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  ).then(()=> {console.log('Server Running');console.log('DB connection successfull')})
  .catch((err)=>console.log('DB connection failed',err));
})