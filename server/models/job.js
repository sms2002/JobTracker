const mongoose=require('mongoose')
const Job=mongoose.model('Job',{
    companyName:String,
    logoUrl:String,
    jobPosition:String,
    monthlySalary:Number,
    jobType:String,
    remoteOffice:String,
    location:String,
    jobDescription:String,
    aboutCompany:String,
    skills:[String],
    userEmail: String 
  })
  
module.exports=Job