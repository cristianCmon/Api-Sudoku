// módulo necesario para accerder a variables de entorno
require('dotenv').config()

const express = require('express')
const app = express()
const puerto = 3000;

app.use(express.json()); // permite aceptar jsones en body
app.use(express.urlencoded({extended: true}));

const { MongoClient, ServerApiVersion } = require("mongodb");
const mongo = require("mongodb"); // necesario para generar correctamente ObjectId

const uri = process.env.MONGO_URI_ATLAS;


// https://www.mongodb.com/docs/drivers/node/current/connect/mongoclient/
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    // Envía ping para confirmar conexión satisfactoria
    await client.db("admin").command({ ping: 1 });
    console.log("Conectado a MongoDB-Atlas...\n");

  } finally {
    await client.close();
  }
}

run().catch(console.dir);

app.listen(puerto, () => {
  console.log(`\nAPI-REST Sudoku iniciada en puerto ${puerto}...`);
});



// APIS
app.post('/puntuaciones', async (req, res) => {
  realizarConsultaBD(req, res, "CREAR", "puntuaciones");
});

app.get('/puntuaciones', async (req, res) => {
  realizarConsultaBD(req, res, "LEER", "puntuaciones");
});



//CONSULTAS
async function realizarConsultaBD(req, res, tipoConsulta, coleccionBD) {
  try {
    let result, id, body;

    const conexion = await client.connect();
    const baseDatos = conexion.db('sudoku');
    const coleccion = baseDatos.collection(coleccionBD);
    
    switch (tipoConsulta) {
        
      case "CREAR":
        body = req.body;

        result = await coleccion.insertOne(body);
        res.status(200).json({ message: "Registro Puntuación CREADO CORRECTAMENTE - id: " + result.insertedId });

        break;

      case "LEER":
        id = req.params;

        if (JSON.stringify(id) === "{}") {
            // TODO REVISAR SORT DESCENDENTE AQUÍ
            // https://stackoverflow.com/questions/72174970/how-to-sort-order-by-descending-in-mongo-query
          result = await coleccion.find().toArray();
        } else {
          //result = await coleccion.find({_id: new mongo.ObjectId(id)}).toArray();
          result = await coleccion.findOne({_id: new mongo.ObjectId(id)});
        }

        res.send(result);

        break;

    }

  } catch (err) {
    res.status(400).json({ message: "ERROR - No se encontraron documentos que coincidan con la consulta" });
    console.log(err);
    
  } finally {
    await client.close();
  }
}