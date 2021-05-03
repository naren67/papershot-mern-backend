import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import mongoPaperData from './mongoPaperData.js'


const app = express()
const port = process.env.PORT || 5000

//pusher

const pusher = new Pusher({
          appId: "1197928",
          key: "fd9bc36c4bd04f6d8ece",
          secret: "10a60ac1faf5a858d4e7",
          cluster: "ap2",
          useTLS: true
        });
        

//middleware
app.use(express())
app.use(cors())

// V32VHQ1o8e6c3pNR

const mongoURI = 'mongodb+srv://paperApp:V32VHQ1o8e6c3pNR@cluster0.vgehn.mongodb.net/paperDB?retryWrites=true&w=majority'

mongoose.connect(mongoURI,{
          useNewUrlParser:true,
          useUnifiedTopology:true,
          useCreateIndex:true
})

//change stream watch changes through operation type => pusher
mongoose.connection.once('open',()=>{
          console.log('connection is open - database')
   
          const changeStream = mongoose.connection.collection('conversations').watch()
   
          changeStream.on('change', (change)=>{
                 if(change.operationType === 'insert'){
                        pusher.trigger('channels', 'newChannel', {
                               'change' : change
                        })
                 }
                 else if(change.operationType === 'update'){
                        pusher.trigger('conversation', 'newMessage', {
                               'change' : change
                        })
                 }
                 else{
                        console.log('error while triggering pusher')
                 }
          })
   })

app.get('/',(req,res)=>{
          res.status(200).send('hello')
})

app.post('/new/channel',(req,res)=>{
           const dbData = req.body

           mongoPaperData.create(dbData,(err,data)=>{
                     if(err){
                               res.status(500).send(err)
                     }
                     else{
                               res.status(201).send(data)
                     }
           })
})

app.get('/get/channelList',(req,res)=>{
          mongoPaperData.find((err,data)=>{
                    if(err){
                              res.status(500).send(err)
                    }
                    else{

                              let channels = []

                              data.map((info)=>{
                                        const channelInfo = {
                                                  id : info._id,
                                                  cName : info.channelName,
                                        }
                                        channels.push(channelInfo)
                              })
                              res.status(200).send(channels)
                    }
          })
})

app.post('/new/message',(req,res)=>{
          const newMessage = req.body

          mongoPaperData.update(
                    {_id: req.query.id},
                    {
                              $push:{conversation : req.body}
                    },
                    (err,data)=>{
                              if(err){
                                        res.status(500).send(err)
                              }
                              else{
                                        res.status(201).send(data)
                              }
                    }
          )
})

//get the entire data
app.get('/get/allData',(req,res)=>{
          mongoPaperData.find((err,data)=>{
                    if(err){
                              res.status(500).send(err)
                    }
                    else{
                              res.status(200).send(channels)
                    }
          })
})

//get conversation from query
app.get('/get/conversation',(req,res)=>{
             const id = req.query.id

             mongoPaperData.find({_id:id},(err,data)=>{
                    if(err){
                              res.status(500).send(err)
                    }
                    else{
                              res.status(200).send(channels)
                    }
             })
})



app.listen(port,()=>{
          console.log('app running')
})