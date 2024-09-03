const express = require('express')
const {open} = require('sqlite')
const app = express()

const path = require('path')
const sqlite3 = require('sqlite3')
let db = null
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

const convertToCamelcaseStates = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertToCamelcaseDistricts = dbDistrictObject => {
  return {
    districtId: dbDistrictObject.district_id,
    districtName: dbDistrictObject.district_name,
    stateId: dbDistrictObject.state_id,
    cases: dbDistrictObject.cases,
    cured: dbDistrictObject.cured,
    active: dbDistrictObject.active,
    deaths: dbDistrictObject.deaths,
  }
}

const initializeTheServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running')
    })
  } catch (err) {
    console.log(`error message: ${err.message}`)
    process.exit(1)
  }
}
initializeTheServer()

app.get('/states/', async (require, response) => {
  const getStatesQuery = `SELECT * FROM state;`
  const dbResponse = await db.all(getStatesQuery)
  response.send(
    dbResponse.map(eachObject => convertToCamelcaseStates(eachObject)),
  )
})

//2nd API

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId} ;`

  const dbResponse = await db.get(getStateQuery)
  response.send(convertToCamelcaseStates(dbResponse))
})

// 3rd API
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const createDistrictDataQuery = `INSERT INTO 
      district (district_name, state_id, cases, cured, active, deaths)
    VALUES (
      
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
    ) ;`

  const dbResponse = await db.run(createDistrictDataQuery)
  response.send('District Successfully Added')
})
// 4th API

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const getDistrictByIdQuery = `SELECT * FROM district WHERE district_id = ${districtId};`
  const dbResponse = await db.get(getDistrictByIdQuery)
  response.send(convertToCamelcaseDistricts(dbResponse))
})

//delete specific district with districtId ----5th  API

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const removeDistrictByIdQuery = `DELETE FROM district WHERE district_id = ${districtId};`
  const dbResponse = await db.get(removeDistrictByIdQuery)
  response.send('District Removed')
})

//6th API --- Updates the details of a specific district based on the district ID

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const updateTheDistrictQuery = `UPDATE 
      district 
      SET 
        district_name ='${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths} 
      WHERE district_id = ${districtId} ;`

  await db.run(updateTheDistrictQuery)
  response.send('District Details Updated')
})

// 7th API ---statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  // const {cases, cured, active, deaths} = request.body

  const getDataQuery = `SELECT
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
      FROM district
      WHERE state_id = ${stateId};`

  const dbResponse = await db.get(getDataQuery)

  response.send(dbResponse)
})

//8th API ---- object containing the state name of a district based on the district ID

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params

  const getDataQuery = `SELECT state_name
       FROM district INNER JOIN state
       ON state.state_id = district.state_id
       WHERE district_id = ${districtId};`
  const dbResponse = await db.get(getDataQuery)
  response.send(convertToCamelcaseStates(dbResponse))
})

module.exports = app
