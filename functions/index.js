const functions = require("firebase-functions");
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');

admin.initializeApp();

const database = admin.database().ref('/items');

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from a Severless Database!");
});

const getItemsFromDatabase = (res) => {
  let items = [];

  return database.on('value', (snapshot) => {
    snapshot.forEach((item) => {
      items.push({
        id: item.key,
        item: item.val().item
      });
    });   
    res.status(200).json(items);
  }, (error) => {
    res.status(error.code).json({
      message: `Something went wrong. ${error.message}`
    })
  })
};

exports.addItem = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== 'POST') {
      return res.status(405).json({
        message: 'Not allowed'
      })
    };
    const item = req.body.item;
    database.push({ item });
    getItemsFromDatabase(res)
  });
});

exports.getItems = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== 'GET') {
      return res.status(405).json({
        message: 'Not allowed'
      });
    };
    getItemsFromDatabase(res)
  });
});


exports.delete = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
      if(req.method !== 'DELETE') {
        return res.status(401).json({
          message: 'Not allowed'
        })
      }
      const id = req.query.id
      admin.database().ref(`/items/${id}`).remove()
      getItemsFromDatabase(res)
    })
  });


  exports.sendNotification = functions.database.ref('/temperatura').onWrite((event) => {
    // Pegue o valor atual do que foi gravado no Realtime Database.
    const temperatura = event.data.val();
  
    // Notification details.
    const payload = {
      notification: {
        title: 'Ta pegando fogo bicho!!!',
        body: `${temperatura}`,
        sound: 'default',
        //clickAction: 'fcm.ACTION.HELLO',
        // badge: '1'
      },
      data: {
        extra: 'extra_data',
      },
    };
  // Defina a mensagem como alta prioridade e expire após 24 horas.
    const options = {
      collapseKey: 'temp',
      contentAvailable: true,
      priority: 'high',
      timeToLive: 60 * 60 * 24,
    };
  
    if(temperatura > 20) {
      // Envie uma mensagem para dispositivos inscritos no tópico fornecido.
      const topic = 'minhatemperaturaiot'
      return admin.messaging().sendToTopic(topic, payload, options)
        .then((response) => {
          console.log('Successfully sent message:', response);
        }); 
    }
  });
  
  
  