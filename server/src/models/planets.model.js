const {
  parse
} = require('csv-parse');
const fs = require('fs');
const path = require('path'); // same as __diraname

const planets = require('./planets.mongo');


// DATA ACCESS FUNCTIONS

function isHabitablePlanet(planet) {
  return planet['koi_disposition'] === 'CONFIRMED' &&
    planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11 &&
    planet['koi_prad'] < 1.6;
}


function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
      .pipe(parse({
        comment: '#',
        columns: true,
      }))
      .on('data', async (data) => {
        if (isHabitablePlanet(data)) {
          const savedPlanets = savePlanet(data);
          // await planets.create({
          //   keplerName:data.kepler_name,
          // });
        }
      })
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .on('end', async () => {
        const planetCount = (await getAllPlanets()).length;
        console.log(`${planetCount} habitable planets found!`);
        resolve();
      })
  });
}


async function savePlanet(planet) {
  try {
    await planets.updateOne({ // insert and update = upsert
      keplerName: planet.kepler_name
    }, {
       keplerName: planet.kepler_name // projection
    }, {
      upsert: true //if true and no preexisting documents found inserts new docs
    });

  } catch (err) {
    console.error('Could not save the planet');
    console.log(err);

  }

}


async function getAllPlanets() {
  return await planets.find({},{'_id':0,});
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
}
