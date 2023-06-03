const mongoose=require('mongoose')

const Job=mongoose.model('Job',{
    CompanyName:String,
    LogoUrl:String,
    JobPosition:String,
    MonthlySalary:Number,
    JobType:String,
    RemoteOffice:String,
    Location:String,
    JobDescription:String,
    AboutCompany:String,
    skills:[String]
  })
  
module.exports=Job