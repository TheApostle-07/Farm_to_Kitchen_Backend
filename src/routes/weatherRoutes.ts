import { Router } from 'express'
import { verifyFirebaseToken } from '../middlewares/auth'
import fetch from 'node-fetch'

const router = Router()

// @desc   Get current weather for the farmer's location
// @route  GET /api/weather/current
router.get('/current', verifyFirebaseToken, async (req, res) => {
  if (!req.user?.location?.coordinates) {
    return res.status(400).json({ error: 'User location not available' })
  }

  const [lng, lat] = req.user.location.coordinates
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'Missing API key' })

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (!data || data.cod !== 200) {
      return res.status(500).json({ error: 'Failed to fetch weather data' })
    }

    res.json({
      location: data.name,
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      weather: data.weather[0]?.description,
      wind_speed: data.wind.speed,
      cloud_cover: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000)
    })
  } catch (err) {
    console.error('[Weather API Error]', err)
    res.status(500).json({ error: 'Weather API failed' })
  }
})

export default router