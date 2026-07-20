import mongoose from "mongoose";

const channelSettingSchema = new mongoose.Schema(

{

bookingApiKey:{
type:String,
default:"",
trim:true,
},

bookingSecret:{
type:String,
default:"",
trim:true,
},

agodaApiKey:{
type:String,
default:"",
trim:true,
},

agodaSecret:{
type:String,
default:"",
trim:true,
},

expediaApiKey:{
type:String,
default:"",
trim:true,
},

expediaSecret:{
type:String,
default:"",
trim:true,
},

mmtApiKey:{
type:String,
default:"",
trim:true,
},

mmtSecret:{
type:String,
default:"",
trim:true,
},

autoSync:{
type:Boolean,
default:true,
},

syncInterval:{
type:Number,
default:1,
},

currency:{
type:String,
default:"INR",
},

inventoryPush:{
type:Boolean,
default:true,
},

ratePush:{
type:Boolean,
default:true,
},

bookingImport:{
type:Boolean,
default:true,
},

timezone:{
type:String,
default:"Asia/Kolkata",
},

bookingWindow:{
type:Number,
default:365,
},

stopSell:{
type:Boolean,
default:false,
},

lastSync:{
type:Date,
default:null,
},

},

{

timestamps:true,

}

);

export default mongoose.model(

"ChannelSetting",

channelSettingSchema

);  